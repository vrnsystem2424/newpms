import { getProjectData } from '@/lib/googleSheets';
import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const data = await getProjectData();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('❌ API ERROR:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}