import { NextRequest, NextResponse } from 'next/server';
import { participantService, activityService } from '@/lib/services';
import { LotteryError, NotFoundError } from '@/lib/types/errors';

type RouteParams = { params: Promise<{ id: string }> };

/**
 * GET /api/activities/[id]/participants
 * 获取活动的参与人员列表
 * Requirements: 4.1
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const activityId = parseInt(id);

    // 验证活动存在
    await activityService.getActivity(activityId);

    const participants = await participantService.listParticipantsForActivity(activityId);
    return NextResponse.json({ success: true, data: participants });
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
