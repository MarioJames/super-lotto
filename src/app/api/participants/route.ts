import { NextRequest, NextResponse } from 'next/server';
import { participantService } from '@/lib/services';
import { LotteryError } from '@/lib/types/errors';

export async function GET() {
  try {
    const participants = participantService.listParticipants();
    return NextResponse.json({ success: true, data: participants });
  } catch (error) {
    if (error instanceof LotteryError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const participant = participantService.addParticipant(body);
    return NextResponse.json({ success: true, data: participant }, { status: 201 });
  } catch (error) {
    if (error instanceof LotteryError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
