import { NextRequest, NextResponse } from 'next/server';
import { activityService } from '@/lib/services';
import { LotteryError, NotFoundError } from '@/lib/types/errors';

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { participantIds } = body;

    if (!Array.isArray(participantIds)) {
      return NextResponse.json({ success: false, error: 'participantIds must be an array' }, { status: 400 });
    }

    await activityService.addParticipantsToActivity(parseInt(id), participantIds);
    return NextResponse.json({ success: true });
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

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { participantIds } = body;

    if (!Array.isArray(participantIds)) {
      return NextResponse.json({ success: false, error: 'participantIds must be an array' }, { status: 400 });
    }

    await activityService.removeParticipantsFromActivity(parseInt(id), participantIds);
    return NextResponse.json({ success: true });
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
