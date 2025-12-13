import { NextRequest, NextResponse } from 'next/server';
import { participantService, activityService } from '@/lib/services';
import { LotteryError, NotFoundError, ForbiddenError } from '@/lib/types/errors';

type RouteParams = { params: Promise<{ id: string; participantId: string }> };

/**
 * DELETE /api/activities/[id]/participants/[participantId]
 * 从活动中删除参与人员
 * Requirements: 4.3
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id, participantId } = await params;
    const activityId = parseInt(id);
    const participantIdNum = parseInt(participantId);

    // 验证活动存在
    await activityService.getActivity(activityId);

    await participantService.deleteParticipantFromActivity(activityId, participantIdNum);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 404 });
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    if (error instanceof LotteryError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
