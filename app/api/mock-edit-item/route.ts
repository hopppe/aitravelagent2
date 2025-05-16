import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // Get request data
    const requestData = await request.json();
    console.log('Received edit request with data:', JSON.stringify(requestData, null, 2));
    
    const { tripId, itemId, itemType, dayIndex, userFeedback, existingDays } = requestData;
    
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
    
    if (!existingDays || !Array.isArray(existingDays)) {
      console.error('Missing or invalid existingDays in request');
      return NextResponse.json({ error: 'Missing or invalid existingDays array' }, { status: 400 });
    }

    // Check if the day index is valid
    if (!existingDays[dayIndex]) {
      console.error(`Day ${dayIndex} not found in provided days array`);
      return NextResponse.json({ error: `Day ${dayIndex} not found in provided days array` }, { status: 404 });
    }
    
    const day = existingDays[dayIndex];
    console.log(`Found day with properties:`, Object.keys(day));
    
    if (day.day) {
      console.log(`Day has day number: ${day.day}, date: ${day.date}`);
    }
    
    // Find the item to edit based on its type and title
    let itemFound = false;
    let originalItem = null;
    let collection = null;
    
    console.log(`Looking for ${itemType} with title "${itemId}" in day ${dayIndex}`);
    
    if (itemType === 'activity' && day.activities) {
      collection = 'activities';
      originalItem = day.activities.find((item: any) => item.title === itemId);
      itemFound = !!originalItem;
      console.log(`Activity search result: ${itemFound ? 'found' : 'not found'}`);
    } else if (itemType === 'meal' && day.meals) {
      collection = 'meals';
      originalItem = day.meals.find((item: any) => 
        item.venue === itemId || item.title === itemId || item.type === itemId
      );
      itemFound = !!originalItem;
      console.log(`Meal search result: ${itemFound ? 'found' : 'not found'}`);
    } else if (itemType === 'accommodation') {
      collection = 'accommodation';
      if (day.accommodation && day.accommodation.name === itemId) {
        originalItem = day.accommodation;
        itemFound = true;
      }
      console.log(`Accommodation search result: ${itemFound ? 'found' : 'not found'}`);
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
    
    // Create a mock edited item
    const editedItem = { ...originalItem };
    
    // Add the feedback to the description or create a new description
    if (editedItem.description) {
      editedItem.description = `${editedItem.description}\n\nUpdated based on feedback: ${userFeedback}`;
    } else {
      editedItem.description = `New description based on feedback: ${userFeedback}`;
    }
    
    // Update the item in the provided existingDays array
    if (collection === 'activities') {
      const index = day.activities.findIndex((item: any) => item.title === itemId);
      if (index !== -1) {
        day.activities[index] = editedItem;
        console.log(`Updated ${itemType} at index ${index}`);
      }
    } else if (collection === 'meals') {
      const index = day.meals.findIndex((item: any) => 
        item.venue === itemId || item.title === itemId || item.type === itemId
      );
      if (index !== -1) {
        day.meals[index] = editedItem;
        console.log(`Updated ${itemType} at index ${index}`);
      }
    } else if (collection === 'accommodation') {
      day.accommodation = editedItem;
      console.log('Updated accommodation');
    }
    
    return NextResponse.json({
      success: true,
      message: 'Item updated successfully',
      editedItem,
      updatedDay: day
    });
    
  } catch (error) {
    console.error('Error in mock-edit-item API:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 