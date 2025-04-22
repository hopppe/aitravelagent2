import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';

// Using service role key for admin access from server
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export async function PUT(request: NextRequest) {
  try {
    // Get request body
    const body = await request.json();
    const { userId, name } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    // Basic validation for name
    if (name && (typeof name !== 'string' || name.length > 255)) {
      return NextResponse.json({ 
        error: 'Name must be a string with maximum 255 characters' 
      }, { status: 400 });
    }

    try {
      // Update user metadata - making sure the name is provided in the correct structure
      const { data, error } = await supabase.auth.admin.updateUserById(
        userId,
        { 
          user_metadata: { 
            name: name || null  // Ensure name is properly formatted (either string or null)
          } 
        }
      );

      if (error) {
        console.error('Supabase update error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, data });
    } catch (supabaseError: any) {
      console.error('Supabase operation error:', supabaseError);
      return NextResponse.json({ 
        error: 'Error updating profile: ' + (supabaseError.message || 'Unknown error') 
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('General API error:', error);
    return NextResponse.json({ error: error.message || 'An unexpected error occurred' }, { status: 500 });
  }
} 