import { NextRequest, NextResponse } from 'next/server';
import { lotteryService } from '@/lib/services';
import { LotteryError, NotFoundError } from '@/lib/types/errors';

type RouteParams = { params: Promise<{ roundId: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { roundId } = await params;
    const winners = await lotteryService.getDrawResult(parseInt(roundId));
    return NextResponse.json({ success: true, data: winners });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 404 });
    }
    if (error instanceof LotteryError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
