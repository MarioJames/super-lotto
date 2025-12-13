import { NextRequest, NextResponse } from 'next/server';
import { lotteryService } from '@/lib/services';
import { LotteryError, NotFoundError, InsufficientParticipantsError, AlreadyDrawnError } from '@/lib/types/errors';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { roundId } = body;

    if (!roundId) {
      return NextResponse.json({ success: false, error: 'roundId is required' }, { status: 400 });
    }

    const result = await lotteryService.executeDraw(roundId);
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 404 });
    }
    if (error instanceof InsufficientParticipantsError) {
      return NextResponse.json({ success: false, error: error.message, details: error.details }, { status: 400 });
    }
    if (error instanceof AlreadyDrawnError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
    if (error instanceof LotteryError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
