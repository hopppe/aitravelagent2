import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import OpenAI from 'openai';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Helper function to get existing items as context
function getExistingItemsContext(days: any[], itemType: string, itemTitle: string) {
  const existingItems: string[] = [];
  
  days.forEach((day, dayIndex) => {
    const dayItems = day.activities || [];
    const meals = day.meals || [];
    const accommodation = day.accommodation;
    
    // Add context based on item type
    if (itemType === 'activity') {
      dayItems.forEach((item: any) => {
        if (item.title === itemTitle) {
          existingItems.push(`[Current Item to Edit] Activity on Day ${day.day || dayIndex + 1}: ${item.title}${item.description ? ` - ${item.description}` : ''}`);
        } else {
          existingItems.push(`Activity on Day ${day.day || dayIndex + 1}: ${item.title}`);
        }
      });
    } else if (itemType === 'meal') {
      meals.forEach((meal: any) => {
        const mealName = meal.venue || meal.title || meal.type;
        if (mealName === itemTitle) {
          existingItems.push(`[Current Item to Edit] Meal on Day ${day.day || dayIndex + 1}: ${mealName}${meal.description ? ` - ${meal.description}` : ''}`);
        } else {
          existingItems.push(`Meal on Day ${day.day || dayIndex + 1}: ${mealName}`);
        }
      });
    } else if (itemType === 'accommodation' && accommodation) {
      if (accommodation.name === itemTitle) {
        existingItems.push(`[Current Item to Edit] Accommodation on Day ${day.day || dayIndex + 1}: ${accommodation.name}${accommodation.description ? ` - ${accommodation.description}` : ''}`);
      } else {
        existingItems.push(`Accommodation on Day ${day.day || dayIndex + 1}: ${accommodation.name}`);
      }
    }
  });
  
  return existingItems.join('\n');
}

export async function POST(request: Request) {
  try {
    // Get request data
    const requestData = await request.json();
    console.log('Received edit request with data:', JSON.stringify(requestData, null, 2));
    
    const { tripId, itemId, itemType, dayIndex, userFeedback } = requestData;
    
    // Validate required fields
    if (!tripId) {
      console.error('Missing tripId in request');
      return NextResponse.json({ error: 'Missing tripId' }, { status: 400 });
    }
    
    if (!itemId) {
      console.error('Missing itemId in request');
      return NextResponse.json({ error: 'Missing itemId (this should be the title of the item)' }, { status: 400 });
    }
    
    if (!itemType) {
      console.error('Missing itemType in request');
      return NextResponse.json({ error: 'Missing itemType' }, { status: 400 });
    }
    
    if (dayIndex === undefined) {
      console.error('Missing dayIndex in request');
      return NextResponse.json({ error: 'Missing dayIndex' }, { status: 400 });
    }

    // Find the current trip in Supabase
    console.log(`Fetching trip with ID: ${tripId} from Supabase`);
    const { data: tripData, error: tripError } = await supabase
      .from('trips')
      .select('*')
      .eq('id', tripId)
      .single();
    
    if (tripError || !tripData) {
      console.error('Error fetching trip:', tripError);
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }
    
    // Parse the trip data
    let trip;
    try {
      console.log('Trip data format:', typeof tripData.trip_data);
      console.log('Trip data preview:', typeof tripData.trip_data === 'string' 
        ? tripData.trip_data.substring(0, 100) + '...' 
        : JSON.stringify(tripData.trip_data).substring(0, 100) + '...');
      
      trip = typeof tripData.trip_data === 'string'
        ? JSON.parse(tripData.trip_data)
        : tripData.trip_data;
        
      console.log('Successfully parsed trip data with structure:', 
        Object.keys(trip).join(', '),
        'and days:', trip.days?.length || 0);

      // Log the complete structure of the first day to understand its format
      if (trip.days && trip.days.length > 0) {
        console.log('First day structure:', Object.keys(trip.days[0]).join(', '));
        console.log('First day has day number:', trip.days[0].day);
      }
    } catch (parseError) {
      console.error('Error parsing trip_data JSON:', parseError);
      return NextResponse.json({ 
        error: 'Failed to parse trip data',
        details: parseError instanceof Error ? parseError.message : 'Unknown error',
        tripDataType: typeof tripData.trip_data,
        tripDataSample: typeof tripData.trip_data === 'string' 
          ? tripData.trip_data.substring(0, 200) + '...' 
          : 'non-string format'
      }, { status: 500 });
    }
    
    const days = trip.days || [];
    console.log(`Trip has ${days.length} days`);
    
    // Locate the specific item to edit
    // Note: The day might be accessed by index or by day.day property
    const day = days[dayIndex];
    if (!day) {
      console.error(`Day ${dayIndex} not found in trip`);
      return NextResponse.json({ error: `Day ${dayIndex} not found in trip` }, { status: 404 });
    }
    
    console.log(`Found day with properties:`, Object.keys(day));
    console.log(`Day has day number: ${day.day}, date: ${day.date}`);
    
    let itemFound = false;
    let originalItem = null;
    
    // Find the item based on its title instead of ID
    console.log(`Looking for ${itemType} with title "${itemId}" in day ${dayIndex}`);
    
    if (itemType === 'activity' && day.activities) {
      // For activities, match by title
      originalItem = day.activities.find((item: any) => item.title === itemId);
      itemFound = !!originalItem;
      console.log(`Activity search result: ${itemFound ? 'found' : 'not found'}`);
    } else if (itemType === 'meal' && day.meals) {
      // For meals, match by venue or title
      originalItem = day.meals.find((item: any) => 
        item.venue === itemId || item.title === itemId || item.type === itemId
      );
      itemFound = !!originalItem;
      console.log(`Meal search result: ${itemFound ? 'found' : 'not found'}`);
    } else if (itemType === 'accommodation' && day.accommodation) {
      // For accommodation, match by name
      if (day.accommodation.name === itemId) {
        originalItem = day.accommodation;
        itemFound = true;
        console.log(`Accommodation match found in day ${dayIndex}`);
      } else {
        console.log(`Accommodation name "${day.accommodation.name}" doesn't match "${itemId}" in day ${dayIndex}`);
      }
    }
    
    // If accommodation not found in the specified day, check all days
    // This handles the case where accommodations might be displayed differently in the UI
    if (itemType === 'accommodation' && !itemFound) {
      console.log(`Accommodation not found in day ${dayIndex}, checking all days...`);
      
      for (let i = 0; i < days.length; i++) {
        if (days[i].accommodation && days[i].accommodation.name === itemId) {
          originalItem = days[i].accommodation;
          itemFound = true;
          console.log(`Accommodation found in day ${i} instead of day ${dayIndex}`);
          break;
        }
      }
    }
    
    if (!itemFound || !originalItem) {
      console.error(`Item of type ${itemType} with title "${itemId}" not found in day ${dayIndex}`);
      return NextResponse.json({ 
        error: `Item of type ${itemType} with title "${itemId}" not found in day ${dayIndex}`,
        dayStructure: Object.keys(day),
        availableItems: itemType === 'activity' ? day.activities?.map((a: any) => a.title) :
                        itemType === 'meal' ? day.meals?.map((m: any) => m.venue || m.title || m.type) :
                        itemType === 'accommodation' ? [day.accommodation?.name] : []
      }, { status: 404 });
    }
    
    // Get context of existing items to avoid duplicates
    const existingItemsContext = getExistingItemsContext(days, itemType, itemId);
    
    // Create prompt for GPT
    const prompt = `You are helping edit a travel itinerary item. Here's the current item to be modified:
${JSON.stringify(originalItem, null, 2)}

User feedback for editing this item: "${userFeedback || ''}"

${!userFeedback ? 'The user did not provide specific feedback. Please make meaningful improvements to this item anyway such as: making it more engaging, adding interesting details, enhancing descriptions, adjusting costs if needed, or improving any other aspect that would make this a better travel experience.' : ''}

Here are other items in the itinerary (to avoid duplication and ensure coherent planning):
${existingItemsContext}

Please create an updated version of this ${itemType} that ${userFeedback ? 'incorporates the user\'s feedback' : 'is notably improved and more engaging'} while maintaining the same structure and all required fields from the original item. The response should be structured exactly like the original item but with improvements. Make the changes reasonable and realistic.

${!userFeedback ? 'Be creative but realistic - enhance descriptions, adjust costs if appropriate, or make other improvements that would make this a better travel experience.' : ''}

Return ONLY the JSON object for the updated item with no explanation.`;

    // Call OpenAI to generate an edited item
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 1000,
    });
    
    const editedItemText = completion.choices[0]?.message?.content || '';
    
    // Parse the response as JSON
    let editedItem;
    try {
      // Clean up any potential markdown or code block formatting
      const jsonText = editedItemText.replace(/```json|```/g, '').trim();
      editedItem = JSON.parse(jsonText);
      
    } catch (error) {
      console.error('Error parsing AI response:', error);
      return NextResponse.json({ error: 'Failed to process AI response' }, { status: 500 });
    }
    
    // Update the item in the appropriate collection
    if (itemType === 'activity' && day.activities) {
      const index = day.activities.findIndex((item: any) => item.title === itemId);
      if (index !== -1) {
        day.activities[index] = editedItem;
      }
    } else if (itemType === 'meal' && day.meals) {
      const index = day.meals.findIndex((item: any) => 
        item.venue === itemId || item.title === itemId || item.type === itemId
      );
      if (index !== -1) {
        day.meals[index] = editedItem;
      }
    } else if (itemType === 'accommodation' && day.accommodation) {
      if (day.accommodation.name === itemId) {
        day.accommodation = editedItem;
        
        // Check if this accommodation is used in other days and update those too
        const oldName = itemId;
        const newName = editedItem.name;
        
        console.log(`Updated accommodation in day ${dayIndex} from "${oldName}" to "${newName}"`);
        
        // Update the same accommodation in other days
        if (oldName === newName) {
          console.log('Accommodation name unchanged, checking for same accommodation in other days');
        } else {
          console.log('Accommodation name changed, updating accommodation in all days');
        }
        
        // Check all days for the same accommodation name and update them too
        for (let i = 0; i < days.length; i++) {
          if (i !== dayIndex && days[i].accommodation && days[i].accommodation.name === oldName) {
            days[i].accommodation = { ...editedItem };
            console.log(`Also updated same accommodation in day ${i}`);
          }
        }
      }
    }
    
    // Update the trip in Supabase - make sure we're updating the entire trip object
    console.log('Preparing to update trip in Supabase with structure:', Object.keys(trip).join(', '));
    
    // Ensure trips match the expected format with all necessary properties
    if (!trip.title && trip.tripName) {
      trip.title = trip.tripName;
    }
    
    if (!trip.dates && trip.startDate && trip.endDate) {
      trip.dates = {
        start: trip.startDate,
        end: trip.endDate
      };
    }
    
    // Verify that the trip structure has all expected core properties
    const requiredProperties = ['days', 'title'];
    const missingProperties = requiredProperties.filter(prop => !trip[prop]);
    
    if (missingProperties.length > 0) {
      console.error(`Trip is missing required properties: ${missingProperties.join(', ')}`);
      return NextResponse.json({ 
        error: `Trip data is missing required properties: ${missingProperties.join(', ')}`,
        tripKeys: Object.keys(trip)
      }, { status: 500 });
    }
    
    // Make a clone of the trip data to avoid any reference issues
    const updatedTrip = JSON.parse(JSON.stringify(trip));
    
    // Validate the updated trip data to ensure it has all the days
    if (!updatedTrip.days || !Array.isArray(updatedTrip.days) || updatedTrip.days.length === 0) {
      console.error('Updated trip missing days array');
      return NextResponse.json({ error: 'Updated trip data is invalid: missing days array' }, { status: 500 });
    }
    
    if (updatedTrip.days.length !== days.length) {
      console.error(`Days array length mismatch: original ${days.length}, updated ${updatedTrip.days.length}`);
      return NextResponse.json({ error: 'Days array length mismatch after update' }, { status: 500 });
    }
    
    // Create formatted string version for storage
    const updatedTripJson = JSON.stringify(updatedTrip);
    console.log('Updated trip JSON length:', updatedTripJson.length);
    
    // Make sure we're storing the trip data in the same format as it was retrieved
    const finalTripData = typeof tripData.trip_data === 'string' 
      ? updatedTripJson 
      : updatedTrip;
    
    console.log('Final trip data type:', typeof finalTripData);
    
    const { error: updateError } = await supabase
      .from('trips')
      .update({
        trip_data: finalTripData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', tripId);
    
    if (updateError) {
      console.error('Error updating trip:', updateError);
      return NextResponse.json({ error: 'Failed to update trip' }, { status: 500 });
    }
    
    console.log('Successfully updated trip in Supabase');
    
    return NextResponse.json({
      success: true,
      message: 'Item updated successfully',
      editedItem,
    });
    
  } catch (error) {
    console.error('Error in edit-itinerary-item API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 