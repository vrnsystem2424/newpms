import { NextResponse } from 'next/server';
import { getSheetsClient } from '@/lib/googleSheets';
import { getAuthUser } from '@/lib/auth';

export async function GET() {
  try {
    // Auth check
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const sheets = await getSheetsClient();
    const spreadsheetId = process.env.GOOGLE_MAIN_SPREADSHEET_ID;

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Link Sheet!A2:B', // A=Site Name, B=Site ID
    });

    const rows = response.data.values || [];

    const sites = rows
      .filter((row) => row[0] && row[1]) // दोनों values होनी चाहिए
      .map((row) => ({
        name: (row[0] || '').toString().trim(),
        id: (row[1] || '').toString().trim(),
      }));

    return NextResponse.json({ success: true, sites });
  } catch (error) {
    console.error('Sites API Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Server Error' },
      { status: 500 }
    );
  }
}