import { NextResponse } from 'next/server';
import { createLogger } from '../../../lib/logger';
import { validateItineraryStructure } from '../../../lib/itinerary-validator';

// Initialize logger
const logger = createLogger('generate-itinerary');

// Configure runtime for serverless function
export const runtime = 'nodejs';
export const maxDuration = 60; // Set max duration to 60 seconds

export async function POST(request: Request) {
  try {
    // Parse the request body
    const formData = await request.json();
    
    if (!formData) {
      return NextResponse.json(
        { error: 'Missing form data' },
        { status: 400 }
      );
    }
    
    logger.info(`Generating itinerary for ${formData.destination}`);
    
    // Validate OpenAI API key
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    
    if (!OPENAI_API_KEY) {
      logger.error('OpenAI API key not configured');
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }
    
    // Check trip duration
    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);
    const tripDays = Math.ceil(((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))) + 1;
    
    if (tripDays > 14) {
      logger.warn(`Request for very long trip (${tripDays} days) might exceed token limits`);
      return NextResponse.json(
        { error: 'Trip is too long. Please limit your trip to a maximum of 14 days.' },
        { status: 400 }
      );
    }
    
    // Generate prompt
    const prompt = generatePrompt(formData);
    
    // Call OpenAI API
    try {
      logger.info('Calling OpenAI API');
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: 'You are an expert travel planner with deep knowledge of destinations worldwide. Generate a personalized travel itinerary based on the user\'s preferences. Return your response in a structured JSON format only, with no additional text. Ensure all property names use double quotes. Every location MUST include high-precision "coordinates" with "lat" and "lng" numerical values with exactly 6 decimal places for accuracy. For cost fields, use numerical values only without currency symbols. Consider the typical weather for the destination at the time of the trip and include appropriate recommendations, with at least one travel tip specifically about the weather. For longer trips, vary the daily structure - not every day needs to be packed with activities, and breakfast is only included when there are notable breakfast places nearby. Group activities that are geographically close to minimize travel time.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 10000
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        logger.error(`OpenAI API error: ${response.status} - ${errorText}`);
        return NextResponse.json(
          { error: `OpenAI API error: ${response.status}` },
          { status: 500 }
        );
      }
      
      const openAIData = await response.json();
      const rawContent = openAIData.choices[0]?.message?.content;
      
      if (!rawContent) {
        logger.error('No content in OpenAI response');
        return NextResponse.json(
          { error: 'No content in OpenAI response' },
          { status: 500 }
        );
      }
      
      // Process the response
      try {
        // Try to parse the raw content as JSON
        const itinerary = JSON.parse(rawContent);
        logger.info('Successfully parsed AI response as JSON');
        
        // Validate and structure the response before returning
        const structuredItinerary = validateItineraryStructure(itinerary, formData);
        
        // Store the prompt in localStorage separately
        return NextResponse.json({ 
          success: true, 
          itinerary: structuredItinerary,
          prompt: prompt // Include the prompt separately in the response
        });
        
      } catch (parseError) {
        logger.error('Error parsing AI response');
        
        // Try to extract JSON if the content includes non-JSON text
        try {
          const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const itinerary = JSON.parse(jsonMatch[0]);
            logger.info('Successfully extracted and parsed JSON from AI response');
            
            // Validate the extracted JSON too
            const structuredItinerary = validateItineraryStructure(itinerary, formData);
            
            // Store the prompt in localStorage separately
            return NextResponse.json({ 
              success: true, 
              itinerary: structuredItinerary,
              prompt: prompt // Include the prompt separately in the response
            });
          } else {
            throw new Error('Could not extract valid JSON from the response');
          }
        } catch (extractError) {
          logger.error('Failed to extract JSON');
          return NextResponse.json(
            { error: 'Failed to parse the generated itinerary' },
            { status: 500 }
          );
        }
      }
    } catch (openAIError: any) {
      logger.error(`Error calling OpenAI API: ${openAIError.message}`);
      return NextResponse.json(
        { error: `Error generating itinerary: ${openAIError.message}` },
        { status: 500 }
      );
    }
    
  } catch (error: any) {
    logger.error(`Server error: ${error.message}`);
    return NextResponse.json(
      { error: `Server error: ${error.message}` },
      { status: 500 }
    );
  }
}

// Function to generate a prompt based on survey data
function generatePrompt(formData: any): string {
  // Calculate trip duration - adding 1 to include both start and end date
  const startDate = new Date(formData.startDate);
  const endDate = new Date(formData.endDate);
  
  // Set time to noon to avoid timezone issues
  startDate.setHours(12, 0, 0, 0);
  endDate.setHours(12, 0, 0, 0);
  
  // Calculate number of days
  const tripDuration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  
  // Format dates for display
  const formattedStartDate = formatDate(startDate);
  const formattedEndDate = formatDate(endDate);
  
  // Determine budget guidelines based on selected budget
  let budgetGuidelines = '';
  switch(formData.budget.toLowerCase()) {
    case 'budget':
      budgetGuidelines = 'Include hostels, street food, free/low-cost activities';
      break;
    case 'moderate':
      budgetGuidelines = 'Include mid-range hotels, casual restaurants, affordable attractions';
      break;
    case 'luxury':
      budgetGuidelines = 'Include high-end hotels, fine dining, premium experiences';
      break;
    default:
      budgetGuidelines = 'Include a mix of options appropriate for a moderate budget';
  }

  // Include special requests if provided
  const specialRequests = formData.specialRequests && formData.specialRequests.trim() 
    ? `\nSpecial requests from the traveler: "${formData.specialRequests.trim()}"`
    : '';

  // Construct the prompt
  return `
Create a personalized travel itinerary for ${formData.destination} from ${formattedStartDate} to ${formattedEndDate} (${tripDuration} days).

Tailor this itinerary for the traveler. Their purpose of the trip is ${formData.purpose}. Their budget is ${formData.budget} (${budgetGuidelines}). ${formData.preferences && formData.preferences.length > 0 ? `They like ${formData.preferences.join(', ')}` : ''} 
Special requests: ${specialRequests}

For longer trips, vary the daily structure - not every day needs to be packed with activities. Some days can have fewer activities than others, and breakfast is only needed when there are notable breakfast places nearby. When activities are in the same area, group them together on the same day to minimize travel time.

Return a JSON itinerary with this structure:
{
  "destination": "City, Country",
  "tripName": "Short title",
  "overview": "Brief summary",
  "startDate": "${formData.startDate}",
  "endDate": "${formData.endDate}",
  "duration": ${tripDuration},
  "travelTips": ["2-4 essential tips for this destination, including 1 tip specifically about the typical weather during this time of year and any recommended preparations"],
  "days": [
    {
      "day": 1,
      "date": "YYYY-MM-DD",
      "accommodation": {
        "name": "Hotel/hostel/rental name",
        "description": "Brief description",
        "cost": number,
        "coordinates": {"lat": number, "lng": number}
      },
      "activities": [
        {
          "time": "Morning/Afternoon/Evening/Night",
          "title": "Activity name",
          "description": "Brief description",
          "cost": number,
          "transportMode": "Walk/Bus/Metro/Taxi/Train",
          "transportCost": number,
          "coordinates": {"lat": number, "lng": number}
        }
      ],
      "meals": [
        {
          "type": "Breakfast/Lunch/Dinner",
          "venue": "Restaurant name",
          "description": "Brief description",
          "cost": number,
          "transportMode": "Walk/Bus/Metro/Taxi/Train",
          "transportCost": number,
          "coordinates": {"lat": number, "lng": number}
        }
      ]
    }
  ]
}

IMPORTANT GUIDELINES:
1. Return only valid JSON. Do not include any extra text, markdown, or explanation.
2. All coordinates must be numeric values with exactly 6 decimal places (e.g., 40.123456, -74.123456).
3. All costs must be numbers only, with no currency symbols.
4. Each day must include both activities and meals.
5. Use real places that currently exist and are appropriate for the destination and traveler's preferences.
6. Group activities and meals geographically to minimize travel time; each day should follow a logical flow.
7. Include correct transportMode and transportCost for each activity and meal.
8. Ensure that travel tips include one tip specifically about the typical weather during the trip and how to prepare for it.
9. If days have a similar structure, feel free to reuse the pattern with realistic local variation.`;
}

// Helper function to format dates in a nicer way
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