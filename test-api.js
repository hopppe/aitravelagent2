// A simple script to test the OpenAI API directly and see if we get valid JSON
const fs = require('fs');
const https = require('https');
const dotenv = require('dotenv');

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

// Use the API key from environment variables
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Helper function to sanitize JSON
function sanitizeJSON(json) {
  console.log('Sanitizing JSON...');
  
  // Remove JavaScript-style comments
  let sanitized = json.replace(/\/\/.*?(\r?\n|$)/g, '$1') // Remove line comments
                      .replace(/\/\*[\s\S]*?\*\//g, ''); // Remove block comments
                      
  // Fix missing/unquoted property names
  sanitized = sanitized.replace(/(\{|\,)\s*([a-zA-Z0-9_]+)\s*\:/g, '$1"$2":');
  
  // Remove trailing commas in arrays and objects
  sanitized = sanitized.replace(/,(\s*[\]\}])/g, '$1');
  
  // Replace single quotes with double quotes (but careful with escaped quotes)
  // First, temporarily replace escaped single quotes
  sanitized = sanitized.replace(/\\'/g, "___ESCAPED_SINGLE_QUOTE___");
  
  // Then replace regular single quotes with double quotes
  sanitized = sanitized.replace(/'/g, '"');
  
  // Finally, restore escaped single quotes
  sanitized = sanitized.replace(/___ESCAPED_SINGLE_QUOTE___/g, "\\'");
  
  return sanitized;
}

// Simplified test data
const testData = {
  destination: 'Paris, France',
  startDate: '2023-10-15',
  endDate: '2023-10-18',
  purpose: 'vacation',
  budget: 'moderate',
  preferences: ['food', 'culture', 'sightseeing']
};

// Similar system message as in the main app
const systemMessage = 'You are an expert travel planner. Generate a detailed travel itinerary based on the user\'s preferences. Return your response in a structured JSON format only, with no additional text or explanation. Do NOT include any comments in the JSON (like "// More options..."). Your response must be valid, parseable JSON. For each activity and meal, include a transportMode (Walk, Bus, Metro, Taxi, Train, etc.) and transportCost (0 for walking, 1-3 for public transport, 10-20 for taxis). IMPORTANT: Always separate food experiences (restaurants, cafes, food markets) into the "meals" array and non-food activities (sightseeing, museums, etc.) into the "activities" array. Each day should include at least 1-3 meals in the meals array. Never put food experiences in the activities array.';

// Similar prompt as in the main app but simplified
const userPrompt = `
Create a detailed 4-day travel itinerary for a trip to ${testData.destination} from October 15, 2023 to October 18, 2023.

This trip is for a relaxing vacation. They particularly enjoy food, culture, sightseeing. The traveler is looking for mid-range options, with comfortable accommodations, good quality restaurants, and a mix of paid and free activities.

Return this as a JSON object with the following structure:
{
  "title": "Trip title",
  "destination": "Destination name",
  "dates": {
    "start": "YYYY-MM-DD",
    "end": "YYYY-MM-DD"
  },
  "days": [
    {
      "date": "YYYY-MM-DD",
      "activities": [
        {
          "id": "unique-id",
          "time": "Morning/Afternoon/Evening",
          "title": "Activity name",
          "description": "Detailed description",
          "location": "Address or area",
          "coordinates": { "lat": 0.0, "lng": 0.0 },
          "cost": 0,
          "transportMode": "Walk/Bus/Metro/Taxi",
          "transportCost": 0
        }
      ],
      "meals": [
        {
          "type": "Breakfast/Lunch/Dinner",
          "venue": "Restaurant name",
          "description": "Brief description",
          "cost": 0,
          "transportMode": "Walk/Bus/Metro/Taxi",
          "transportCost": 0,
          "coordinates": { "lat": 0.0, "lng": 0.0 }
        }
      ]
    }
  ]
}
`;

// Prepare data for OpenAI API request
const data = JSON.stringify({
  model: 'gpt-3.5-turbo-16k',
  messages: [
    {
      role: 'system',
      content: systemMessage
    },
    {
      role: 'user',
      content: userPrompt
    }
  ],
  temperature: 0.7,
  max_tokens: 10000,
});

// Options for the HTTPS request
const options = {
  hostname: 'api.openai.com',
  path: '/v1/chat/completions',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${OPENAI_API_KEY}`,
    'Content-Length': data.length
  }
};

// Make the request
console.log('Sending test request to OpenAI API...');
const req = https.request(options, res => {
  console.log(`Status code: ${res.statusCode}`);
  
  let responseData = '';
  
  res.on('data', chunk => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    try {
      console.log('Response received');
      const parsedResponse = JSON.parse(responseData);
      
      if (parsedResponse.choices && parsedResponse.choices.length > 0) {
        const content = parsedResponse.choices[0].message.content;
        console.log('\nRaw content from OpenAI:');
        console.log('------------------------');
        console.log(content);
        console.log('------------------------');
        
        // Check if content has JSON format
        const trimmed = content.trim();
        console.log('\nJSON validation:');
        console.log(`Starts with {: ${trimmed.startsWith('{')}`);
        console.log(`Ends with }: ${trimmed.endsWith('}')}`);
        
        // Try to parse as JSON
        try {
          const parsedItinerary = JSON.parse(content);
          console.log('\nSuccessfully parsed response as JSON');
          console.log('Top-level keys:', Object.keys(parsedItinerary).join(', '));
          
          // Validate days structure
          if (parsedItinerary.days && Array.isArray(parsedItinerary.days)) {
            console.log(`Itinerary contains ${parsedItinerary.days.length} days`);
            
            // Log first day
            if (parsedItinerary.days.length > 0) {
              console.log('\nFirst day structure:');
              console.log(JSON.stringify(parsedItinerary.days[0], null, 2));
            }
            
            // Write full response to file for inspection
            fs.writeFileSync('api-test-result.json', JSON.stringify(parsedItinerary, null, 2));
            console.log('\nFull response saved to api-test-result.json');
          } else {
            console.error('\nMissing or invalid days array in itinerary');
          }
        } catch (parseError) {
          console.error('\nFailed to parse content as JSON:', parseError.message);
          
          // Try to sanitize JSON
          console.log('\nAttempting to sanitize JSON...');
          const sanitizedContent = sanitizeJSON(content);
          
          try {
            // Try to parse the sanitized JSON
            const parsedSanitizedItinerary = JSON.parse(sanitizedContent);
            console.log('\nSuccessfully parsed SANITIZED JSON');
            console.log('Top-level keys:', Object.keys(parsedSanitizedItinerary).join(', '));
            
            // Write sanitized JSON to file
            fs.writeFileSync('api-test-sanitized.json', JSON.stringify(parsedSanitizedItinerary, null, 2));
            console.log('\nSanitized JSON saved to api-test-sanitized.json');
          } catch (sanitizeError) {
            console.error('\nFailed to parse even after sanitization:', sanitizeError.message);
            // Save raw content to file for inspection
            fs.writeFileSync('api-test-raw.txt', content);
            console.log('Raw content saved to api-test-raw.txt');
            fs.writeFileSync('api-test-sanitized.txt', sanitizedContent);
            console.log('Sanitized attempt saved to api-test-sanitized.txt');
          }
        }
      } else {
        console.error('No choices in API response');
      }
    } catch (error) {
      console.error('Failed to parse API response:', error.message);
    }
  });
});

req.on('error', error => {
  console.error('API request error:', error);
});

// Send the request data
req.write(data);
req.end(); 