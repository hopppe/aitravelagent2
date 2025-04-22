// @ts-ignore
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

// Configure the timeout for this edge function
export const config = {
  timeout: 60  // Keep at 60 seconds for better reliability
};

// Types
type SurveyData = {
  destination: string;
  startDate: string;
  endDate: string;
  purpose: string;
  budget: string;
  preferences: string[];
};

// This is a Deno runtime, so we need to use Deno.env
// @ts-ignore
const supabaseClient = createClient(
  // @ts-ignore
  Deno.env.get('SUPABASE_URL') ?? '',
  // @ts-ignore
  Deno.env.get('SUPABASE_ANON_KEY') ?? '',
  {
    global: {
      // @ts-ignore
      headers: { Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}` },
    },
  }
);

// Get OpenAI API key from environment
// @ts-ignore
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') ?? '';

// Format date for display - kept for backwards compatibility
function formatDate(date: Date): string {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  
  // Add suffix to day
  let suffix = 'th';
  if (day === 1 || day === 21 || day === 31) suffix = 'st';
  else if (day === 2 || day === 22) suffix = 'nd';
  else if (day === 3 || day === 23) suffix = 'rd';
  
  return `${month} ${day}${suffix}, ${year}`;
}

// Simple logging function for Edge Function
function log(message: string, data?: any) {
  // @ts-ignore
  console.log(`[${new Date().toISOString()}] ${message}`, data ? JSON.stringify(data) : '');
}

// Helper to extract the numeric database ID from a full job ID
function parseJobId(fullJobId: string): { dbId: string | null, fullId: string } {
  // Format: job_TIMESTAMP_RANDOM
  const parts = fullJobId.split('_');
  if (parts.length !== 3 || parts[0] !== 'job') {
    log(`Invalid job ID format: ${fullJobId}`);
    return { dbId: null, fullId: fullJobId };
  }
  
  return {
    dbId: parts[1], // This is the database ID (timestamp)
    fullId: fullJobId
  };
}

// Main handler for Edge Function
serve(async (req: Request) => {
  const startTime = Date.now();
  let currentPhase = 'initializing';

  try {
    // Only accept POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    currentPhase = 'parsing request';
    const data = await req.json();
    const { jobId, surveyData, prompt } = data;

    log(`Edge Function received request for job: ${jobId}`, {
      hasPrompt: !!prompt,
      promptLength: prompt?.length || 0,
      hasSurveyData: !!surveyData,
      timeElapsed: `${Date.now() - startTime}ms`
    });

    // Validate required data
    if (!jobId || !prompt) {
      return new Response(
        JSON.stringify({ error: 'Missing required data (jobId or prompt)' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Parse the job ID to get the numeric database ID
    const { dbId, fullId } = parseJobId(jobId);
    if (!dbId) {
      return new Response(
        JSON.stringify({ error: 'Invalid job ID format' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    log(`Parsed job ID: Full=${fullId}, DB ID=${dbId}`);

    // Validate OpenAI API key
    if (!OPENAI_API_KEY || !OPENAI_API_KEY.startsWith('sk-')) {
      log(`❌ Invalid OpenAI API key configuration`);
      return new Response(
        JSON.stringify({ error: 'Invalid OpenAI API key configuration' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    try {
      // Update job status to processing and store the prompt
      currentPhase = 'updating job to processing';
      log(`Updating job status to processing for job ${jobId} (DB ID: ${dbId})`);
      const { error: updateError } = await supabaseClient
        .from('jobs')
        .update({ 
          status: 'processing', 
          updated_at: new Date().toISOString(),
          prompt: prompt  // Store the prompt in its own column
        })
        .eq('id', dbId);

      if (updateError) {
        log(`❌ Error updating job status to processing:`, updateError);
        throw new Error(`Failed to update job status: ${updateError.message}`);
      }
      
      log(`Job status updated to processing successfully, time elapsed: ${Date.now() - startTime}ms`);
      
      // Call OpenAI API using the prompt provided by the web app
      currentPhase = 'calling OpenAI API';
      log(`Calling OpenAI API for job ${jobId} with prompt length: ${prompt.length}`);

      // Set a reasonable timeout for the OpenAI call
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 50000); // 50 second timeout
      
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo-16k',
            messages: [
              {
                role: 'system',
                content: 'You are an expert travel planner. Generate a detailed travel itinerary based on the user\'s preferences. Return your response in a structured JSON format only, with no additional text, explanation, or markdown formatting. Do not wrap the JSON in code blocks. Ensure all property names use double quotes. IMPORTANT: Every activity MUST include a valid "coordinates" object with "lat" and "lng" numerical values - never omit coordinates or use empty objects. For cost fields, always use numerical values (not strings) - costs should be integers or decimals without currency symbols.'
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            temperature: 0.7,
            max_tokens: 8000,
          }),
          signal: controller.signal
        });
        
        // Clear the timeout since the request completed
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          const error = await response.json();
          log(`❌ OpenAI API error:`, error);
          throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
        }

        log(`✅ OpenAI API responded successfully, time elapsed: ${Date.now() - startTime}ms`);
        const openAIData = await response.json();
        const rawContent = openAIData.choices[0].message.content;
        log(`Received content from OpenAI, length: ${rawContent.length} characters`);
        
        // Update job status to completed with the raw result in a separate column
        currentPhase = 'updating job to completed';
        log(`Updating job status to completed for job ${jobId} (DB ID: ${dbId})`);

        // Store the raw result directly without size checking
        const { error: completeError } = await supabaseClient
          .from('jobs')
          .update({
            status: 'completed',
            raw_result: rawContent,
            result: { 
              usage: openAIData.usage,
              processed: true
            },
            updated_at: new Date().toISOString()
          })
          .eq('id', dbId);

        if (completeError) {
          log(`❌ Error updating job status to completed:`, completeError);
          throw new Error(`Failed to update job to completed: ${completeError.message}`);
        }
        
        log(`✅ Job ${jobId} marked as completed successfully, total time: ${Date.now() - startTime}ms`);

        return new Response(
          JSON.stringify({ 
            success: true, 
            jobId,
            message: "Job completed successfully and status updated to completed"
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      } catch (fetchError: any) {
        // Clear the timeout if we hit another error
        clearTimeout(timeoutId);
        
        // Special handling for timeout errors
        if (fetchError.name === 'AbortError') {
          log(`❌ OpenAI API call timed out after 50 seconds`);
          throw new Error('OpenAI API call timed out. Try again with a shorter prompt or simpler request.');
        }
        
        throw fetchError;
      }
    } catch (error: any) {
      // Update job status to failed
      currentPhase = 'handling error';
      log(`❌ Processing error (${currentPhase}):`, error);
      
      try {
        const { error: failedUpdateError } = await supabaseClient
          .from('jobs')
          .update({
            status: 'failed',
            error: `Error during ${currentPhase}: ${error.message || 'Unknown error'}`,
            updated_at: new Date().toISOString()
          })
          .eq('id', dbId);
          
        if (failedUpdateError) {
          log(`❌ Failed to update job status to failed:`, failedUpdateError);
        } else {
          log(`Job status updated to failed`);
        }
      } catch (updateError: any) {
        log(`❌ Exception updating job status to failed:`, updateError);
      }

      throw error;
    }
  } catch (error: any) {
    log(`❌ Unhandled exception in Edge Function (${currentPhase}), time elapsed: ${Date.now() - startTime}ms:`, error);
    return new Response(
      JSON.stringify({
        error: `Failed to generate itinerary during ${currentPhase}: ${error.message || 'Unknown error'}`,
        phase: currentPhase,
        timeElapsed: `${Date.now() - startTime}ms`
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}); 