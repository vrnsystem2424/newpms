import { NextResponse } from 'next/server';
import { getSheetsClient, fetchSheetID } from '@/lib/googleSheets';
import { getAuthUser } from '@/lib/auth';

export async function GET(req) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const siteId = searchParams.get('siteId');

    if (!siteId) {
      return NextResponse.json({ success: false, message: 'Site ID required' }, { status: 400 });
    }

    const sheets = await getSheetsClient();
    const sheetID = await fetchSheetID(siteId);

    // Fetch A to M columns from the Exception Change Log sheet
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetID,
      range: 'Exception Change Log!A1:M',
    });

    const allData = response.data.values || [];
    if (allData.length < 2) {
      return NextResponse.json({ success: true, headers: [], rows: [] });
    }

    const headers = allData[0];
    
    // Filter empty rows (checking if UID in Column A is present)
    const validRows = allData
      .slice(1)
      .filter((row) => row[0] && row[0].trim() !== '');

    const formattedRows = validRows.map((row, rowIndex) => {
      const obj = { _rowIndex: rowIndex + 2 };
      headers.forEach((h, i) => {
        obj[h] = row[i] || '';
      });
      return obj;
    });

    return NextResponse.json({ success: true, headers, rows: formattedRows });
  } catch (error) {
    console.error('Exception Log API Error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}