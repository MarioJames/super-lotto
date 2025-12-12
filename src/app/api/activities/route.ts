import { NextRequest, NextResponse } from 'next/server';
import { activityService } from '@/lib/services';
import { LotteryError } from '@/lib/types/errors';

export async function GET() {
  try {
    const activities = activityService.listActivities();
    return NextResponse.json({ success: true, data: activities });
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
    const activity = activityService.createActivity(body);
    return NextResponse.json({ success: true, data: activity }, { status: 201 });
  } catch (error) {
    if (error instanceof LotteryError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
