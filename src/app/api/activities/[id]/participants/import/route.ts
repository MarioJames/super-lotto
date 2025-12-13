import { NextRequest, NextResponse } from 'next/server';
import { participantService, activityService } from '@/lib/services';
import { LotteryError, NotFoundError } from '@/lib/types/errors';

type RouteParams = { params: Promise<{ id: string }> };

/**
 * POST /api/activities/[id]/participants/import
 * 为活动导入参与人员（CSV）
 * Requirements: 4.2
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const activityId = parseInt(id);

    // 验证活动存在
    await activityService.getActivity(activityId);

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    const csvContent = await file.text();
    const result = await participantService.importParticipantsForActivity(activityId, csvContent);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 404 });
    }
    if (error instanceof LotteryError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Import failed'
    }, { status: 500 });
  }
}
