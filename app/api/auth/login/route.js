// import { NextResponse } from 'next/server';
// import { getSheetsClient } from '@/lib/googleSheets';
// import { signToken, setAuthCookie } from '@/lib/auth';

// export async function POST(req) {
//   try {
//     const body = await req.json();
//     const email = (body.email || '').trim();
//     const password = (body.password || '').trim();

//     if (!email || !password) {
//       return NextResponse.json(
//         { success: false, message: 'Email and password are required' },
//         { status: 400 }
//       );
//     }

//     const spreadsheetId = process.env.GOOGLE_MAIN_SPREADSHEET_ID;
//     if (!spreadsheetId) {
//       return NextResponse.json(
//         { success: false, message: 'GOOGLE_MAIN_SPREADSHEET_ID missing' },
//         { status: 500 }
//       );
//     }

//     const sheets = await getSheetsClient();
//     const response = await sheets.spreadsheets.values.get({
//       spreadsheetId,
//       range: 'Doer!A:C', // A=Email, B=Password, C=Type
//     });

//     const rows = response.data.values || [];

//     const matched = rows.slice(1).find((row) => {
//       const sheetEmail = (row[0] || '').toString().trim().toLowerCase();
//       const sheetPass = (row[1] || '').toString().trim();
//       return sheetEmail === email.toLowerCase() && sheetPass === password;
//     });

//     if (!matched) {
//       return NextResponse.json(
//         { success: false, message: 'Invalid email or password' },
//         { status: 401 }
//       );
//     }

//     const userEmail = (matched[0] || '').toString().trim();
//     const userType = (matched[2] || 'User').toString().trim(); // Site Engineer, Admin, etc.

//     // JWT me email + type save
//     const token = await signToken({
//       email: userEmail,
//       type: userType,
//     });

//     await setAuthCookie(token);

//     return NextResponse.json({
//       success: true,
//       message: 'Login Successful',
//       user: {
//         email: userEmail,
//         type: userType,
//       },
//     });
//   } catch (error) {
//     console.error('Login Error:', error);
//     return NextResponse.json(
//       { success: false, message: error.message || 'Server Error' },
//       { status: 500 }
//     );
//   }
// }





import { NextResponse } from 'next/server';
import { getSheetsClient } from '@/lib/googleSheets';
import { signToken, setAuthCookie } from '@/lib/auth';

export async function POST(req) {
  try {
    const body = await req.json();
    const email = (body.email || '').trim().toLowerCase();
    const password = (body.password || '').trim();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required' },
        { status: 400 }
      );
    }

    const spreadsheetId = process.env.GOOGLE_MAIN_SPREADSHEET_ID;
    if (!spreadsheetId) {
      return NextResponse.json(
        { success: false, message: 'GOOGLE_MAIN_SPREADSHEET_ID missing' },
        { status: 500 }
      );
    }

    const sheets = await getSheetsClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Doer!A:D', // A=Email, B=Password, C=Role, D=Site
    });

    const rows = response.data.values || [];

    // Match Email and Password
    const matched = rows.slice(1).find((row) => {
      const sheetEmail = (row[0] || '').toString().trim().toLowerCase();
      const sheetPass = (row[1] || '').toString().trim();
      return sheetEmail === email && sheetPass === password;
    });

    if (!matched) {
      return NextResponse.json(
        { success: false, message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const userEmail = (matched[0] || '').toString().trim();
    const userRole = (matched[2] || 'User').toString().trim(); // Admin, Site, Sinior Engineer
    const siteName = (matched[3] || '').toString().trim(); // Demo PMS etc.

    // JWT me email, role, aur site save karenge
    const token = await signToken({
      email: userEmail,
      type: userRole,
      site: siteName,
    });

    await setAuthCookie(token);

    return NextResponse.json({
      success: true,
      message: 'Login Successful',
      user: {
        email: userEmail,
        type: userRole,
        site: siteName,
      },
    });
  } catch (error) {
    console.error('Login Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Server Error' },
      { status: 500 }
    );
  }
}