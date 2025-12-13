import { NextRequest, NextResponse } from 'next/server';
import { participantService } from '@/lib/services';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    const csvContent = await file.text();
    const result = await participantService.importParticipantsFromCSV(csvContent);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Import failed'
    }, { status: 500 });
  }
}
