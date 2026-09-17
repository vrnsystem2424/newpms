import { getWeeklyBufferData } from '@/lib/googleSheets';
import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';

export async function GET(request) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const site = searchParams.get('site');
    if (!site) return NextResponse.json({ success: false, message: 'Site name is required' }, { status: 400 });

    const data = await getWeeklyBufferData(site);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}