import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  // Get URL parameters
  const url = new URL(request.url);
  const tripId = url.searchParams.get('tripId');
  const itemTitle = url.searchParams.get('itemTitle');
  const dayIndex = url.searchParams.get('dayIndex');
  const itemType = url.searchParams.get('itemType') || 'activity';
  const feedback = url.searchParams.get('feedback') || 'Make this better';
  
  // Check required parameters
  if (!tripId || !itemTitle || dayIndex === null) {
    return NextResponse.json({
      error: 'Missing required parameters: tripId, itemTitle, dayIndex',
      receivedParams: {
        tripId,
        itemTitle,
        dayIndex,
        itemType,
        feedback
      }
    }, { status: 400 });
  }
  
  try {
    console.log(`Testing edit for trip ${tripId}, item "${itemTitle}", day ${dayIndex}`);
    
    // Build a minimal days array with the target item
    const mockDays = [];
    const mockDay: any = {
      date: new Date().toISOString().split('T')[0]
    };
    
    // Add the appropriate collection based on itemType
    if (itemType === 'activity') {
      mockDay.activities = [{
        title: itemTitle,
        time: "Afternoon",
        description: "Original description",
        coordinates: { lat: 0, lng: 0 },
        cost: 0
      }];
    } else if (itemType === 'meal') {
      mockDay.meals = [{
        type: "Lunch",
        venue: itemTitle,
        description: "Original description",
        coordinates: { lat: 0, lng: 0 },
        cost: 0
      }];
    } else if (itemType === 'accommodation') {
      mockDay.accommodation = {
        name: itemTitle,
        description: "Original description",
        coordinates: { lat: 0, lng: 0 },
        cost: 0
      };
    }
    
    // Add the day to the days array
    mockDays[parseInt(dayIndex)] = mockDay;
    
    // Make the edit request to our mock API
    console.log(`Calling mock edit API for ${itemType} "${itemTitle}" on day ${dayIndex}`);
    const editResponse = await fetch(`${url.origin}/api/mock-edit-item`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tripId,
        itemId: itemTitle, // Using itemTitle as the identifier
        itemType,
        dayIndex: parseInt(dayIndex),
        userFeedback: feedback,
        existingDays: mockDays
      })
    });
    
    const editData = await editResponse.json();
    console.log('Edit API response:', editData.success ? 'Success' : 'Failed');
    
    return NextResponse.json({
      success: editResponse.ok,
      statusCode: editResponse.status,
      apiResponse: editData,
      requestParams: {
        tripId,
        itemTitle,
        itemType,
        dayIndex: parseInt(dayIndex),
        feedback
      },
      mockDays: mockDays
    });
    
  } catch (error) {
    console.error('Error in test-edit-api:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 