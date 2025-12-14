/**
 * CSV Upload API Route
 * Parses uploaded CSV files and returns participant data
 *
 * Requirements: 2.1, 2.5
 */

import { NextRequest, NextResponse } from 'next/server';
import { parseCSV } from '@/lib/csv';

/**
 * POST /api/upload-csv
 * Accepts a CSV file upload and returns parsed participant data
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    // Validate file presence
    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          error: 'No file provided. Please upload a CSV file.',
        },
        { status: 400 }
      );
    }

    // Validate file type
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.csv')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid file type. Please upload a CSV file.',
        },
        { status: 400 }
      );
    }

    // Check file size (limit to 5MB)
    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: 'File too large. Maximum file size is 5MB.',
        },
        { status: 400 }
      );
    }

    // Read file content
    const csvContent = await file.text();

    // Parse CSV using the utility function
    const result = parseCSV(csvContent);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      participants: result.participants,
    });
  } catch (error) {
    console.error('CSV upload error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred while processing the file.',
      },
      { status: 500 }
    );
  }
}
