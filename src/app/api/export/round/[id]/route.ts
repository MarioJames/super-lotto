import { NextRequest, NextResponse } from 'next/server';
import { exportService } from '@/lib/services';
import { LotteryError } from '@/lib/types/errors';

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const csv = exportService.exportRoundWinners(parseInt(id));

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="round_${id}_winners.csv"`,
      },
    });
  } catch (error) {
    if (error instanceof LotteryError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
