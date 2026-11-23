

// import { NextResponse } from 'next/server';
// import { getSheetsClient } from '@/lib/googleSheets';
// import { uploadImageToDrive } from '@/lib/googleDrive';
// import { getAuthUser } from '@/lib/auth';

// // Date format: DD/MM/YYYY
// function getFormattedDate() {
//   const d = new Date();
//   return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
// }

// // Convert YYYY-MM-DD (from HTML date input) → DD/MM/YYYY
// function formatInputDate(str) {
//   if (!str) return '';
//   const parts = str.split('-');
//   if (parts.length !== 3) return str;
//   return `${parts[2]}/${parts[1]}/${parts[0]}`;
// }

// export async function GET(req) {
//   try {
//     const user = await getAuthUser();
//     if (!user) {
//       return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
//     }

//     const { searchParams } = new URL(req.url);
//     const siteId = searchParams.get('siteId');
//     const action = searchParams.get('action');

//     if (!siteId) {
//       return NextResponse.json({ success: false, message: 'Site ID required' }, { status: 400 });
//     }

//     const sheets = await getSheetsClient();

//     // --- ACTION: getKitting → Full kitting Master se checklist + Images ---
//     if (action === 'getKitting') {
//       const activity = (searchParams.get('activity') || '').trim();
//       const subActivity = (searchParams.get('subActivity') || '').trim();

//       const response = await sheets.spreadsheets.values.get({
//         spreadsheetId: siteId,
//         range: 'Full kitting Master!A1:I',
//       });

//       const allData = response.data.values || [];
//       if (allData.length < 2) return NextResponse.json({ success: true, items: [] });

//       const items = allData
//         .slice(1)
//         .map((row, i) => ({
//           rowIndex: i + 2,
//           activity: (row[0] || '').trim(),
//           subActivity: (row[1] || '').trim(),
//           checklist: (row[2] || '').trim(),
//           verificationType: (row[3] || '').trim(),
//           responsibleRole: (row[4] || '').trim(),
//           // ✅ New fields fetched for viewing photos
//           date: (row[5] || '').trim(),
//           imageUrl: (row[6] || '').trim(),
//           status: (row[7] || '').trim(),
//           remarks: (row[8] || '').trim(),
//         }))
//         .filter(
//           (it) =>
//             it.activity.toLowerCase() === activity.toLowerCase() &&
//             it.subActivity.toLowerCase() === subActivity.toLowerCase() &&
//             it.checklist
//         );

//       return NextResponse.json({ success: true, items });
//     }

//     // --- DEFAULT: Project Plan table (A-Z data read) ---
//     const response = await sheets.spreadsheets.values.get({
//       spreadsheetId: siteId,
//       range: 'Project Plan!A1:Z',
//     });

//     const allData = response.data.values || [];
//     if (allData.length < 2) {
//       return NextResponse.json({ success: true, headers: [], rows: [] });
//     }

//     const fullHeaders = allData[0];
    
//     // Pick Headers
//     const displayHeaders = fullHeaders.slice(0, 12);
//     if (fullHeaders[15]) {
//       displayHeaders.push(fullHeaders[15]); 
//     }

//     const validRows = allData
//       .slice(1)
//       .map((row, i) => ({ row, rowIndex: i + 2 }))
//       .filter((r) => r.row[0] && r.row[0].trim() !== '');

//     const completionStatus = {};
//     validRows.forEach(({ row }) => {
//       const uid = (row[0] || '').trim();
//       const colN = (row[13] || '').trim();
//       completionStatus[uid] = colN !== '';
//     });

//     const readyRows = validRows.filter(({ row }) => {
//       const colK = (row[10] || '').trim(); // Column K
//       const colN = (row[13] || '').trim(); // Column N

//       if (colN !== '') return false;
//       if (colK === '') return false;

//       const precedence = (row[5] || '').trim(); // Column F
//       if (precedence) {
//         const precArr = precedence.split(',').map((x) => x.trim()).filter(Boolean);
//         for (const p of precArr) {
//           if (completionStatus[p] === false) return false;
//         }
//       }
//       return true;
//     });

//     const formattedRows = readyRows.map(({ row, rowIndex }) => {
//       const isKitted = !!(row[14] && row[14].trim().toLowerCase() === 'done'); // Column O
//       const isStarted = !!((row[12] && row[12].trim() !== '') || (row[19] && row[19].trim() === 'Started')); // Column M/T
//       const isCompleted = !!((row[13] && row[13].trim() !== '') || (row[20] && row[20].trim() === 'Completed')); // Column N/U

//       const obj = {
//         _rowIndex: rowIndex,
//         _isKitted: isKitted,
//         _isStarted: isStarted,
//         _isCompleted: isCompleted,
//         _startDate: row[12] || '',
//         _completedDate: row[13] || '',
//         _fullRow: row,
//       };
      
//       displayHeaders.forEach((h) => {
//         const hIdx = fullHeaders.indexOf(h);
//         obj[h] = hIdx !== -1 ? (row[hIdx] || '') : '';
//       });
//       return obj;
//     });

//     return NextResponse.json({ success: true, headers: displayHeaders, rows: formattedRows });
//   } catch (error) {
//     console.error('GET Error:', error);
//     return NextResponse.json({ success: false, message: error.message }, { status: 500 });
//   }
// }

// // ==========================================
// // POST → Handle Fullkitting / Start / Completed / Edit
// // ==========================================
// export async function POST(req) {
//   try {
//     const user = await getAuthUser();
//     if (!user) {
//       return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
//     }

//     const body = await req.json();
//     const { siteId, projectPlanRowIndex, action, items, editData, image } = body;

//     if (!siteId || !projectPlanRowIndex) {
//       return NextResponse.json({ success: false, message: 'Invalid payload' }, { status: 400 });
//     }

//     const sheets = await getSheetsClient();
//     const date = getFormattedDate();

//     // ACTION: START
//     if (action === 'start') {
//       await sheets.spreadsheets.values.batchUpdate({
//         spreadsheetId: siteId,
//         requestBody: {
//           valueInputOption: 'USER_ENTERED',
//           data: [
//             { range: `Project Plan!M${projectPlanRowIndex}`, values: [[date]] },
//             { range: `Project Plan!T${projectPlanRowIndex}`, values: [['Started']] },
//           ],
//         },
//       });
//       return NextResponse.json({ success: true, message: 'Task Started successfully', date });
//     }

//     // ACTION: COMPLETE
//     if (action === 'complete') {
//       let imageUrl = '';
      
//       if (image && image.base64) {
//         imageUrl = await uploadImageToDrive({
//           base64: image.base64,
//           mimeType: image.mimeType || 'image/jpeg',
//           name: image.name || `completed_${Date.now()}.jpg`,
//         });
//       }

//       const updates = [
//         { range: `Project Plan!N${projectPlanRowIndex}`, values: [[date]] },
//         { range: `Project Plan!U${projectPlanRowIndex}`, values: [['Completed']] },
//       ];

//       if (imageUrl) {
//         updates.push({ range: `Project Plan!Q${projectPlanRowIndex}`, values: [[imageUrl]] });
//       }

//       await sheets.spreadsheets.values.batchUpdate({
//         spreadsheetId: siteId,
//         requestBody: {
//           valueInputOption: 'USER_ENTERED',
//           data: updates,
//         },
//       });
//       return NextResponse.json({ success: true, message: 'Task Completed successfully', date, imageUrl });
//     }

//     // ACTION: EDIT
//     if (action === 'edit') {
//       if (!editData || !editData.plannedStart || !editData.plannedEnd) {
//         return NextResponse.json({ success: false, message: 'Planned dates are required' }, { status: 400 });
//       }

//       const rowResponse = await sheets.spreadsheets.values.get({
//         spreadsheetId: siteId,
//         range: `Project Plan!A${projectPlanRowIndex}:J${projectPlanRowIndex}`,
//       });

//       const rowData = (rowResponse.data.values && rowResponse.data.values[0]) || [];
//       while (rowData.length < 10) rowData.push('');

//       const plannedStart = formatInputDate(editData.plannedStart);
//       const plannedEnd = formatInputDate(editData.plannedEnd);
//       const remarks = editData.remarks || '';

//       const logRow = [
//         rowData[0] || '', rowData[1] || '', rowData[2] || '', rowData[3] || '',
//         rowData[4] || '', rowData[5] || '', rowData[6] || '', rowData[7] || '',
//         rowData[8] || '', rowData[9] || '', plannedStart, plannedEnd, remarks,
//       ];

//       await sheets.spreadsheets.values.append({
//         spreadsheetId: siteId,
//         range: 'Exception Change Log!A:M',
//         valueInputOption: 'USER_ENTERED',
//         insertDataOption: 'INSERT_ROWS',
//         requestBody: { values: [logRow] },
//       });

//       await sheets.spreadsheets.values.batchUpdate({
//         spreadsheetId: siteId,
//         requestBody: {
//           valueInputOption: 'USER_ENTERED',
//           data: [
//             { range: `Project Plan!K${projectPlanRowIndex}`, values: [[plannedStart]] },
//             { range: `Project Plan!L${projectPlanRowIndex}`, values: [[plannedEnd]] },
//           ],
//         },
//       });

//       return NextResponse.json({ success: true, message: 'Exception logged & plan updated' });
//     }

//     // ACTION: FULLKITTING
//     if (!Array.isArray(items) || items.length === 0) {
//       return NextResponse.json({ success: false, message: 'No items provided for kitting' }, { status: 400 });
//     }

//     const uploaded = await Promise.all(
//       items.map(async (it) => {
//         if (!it.image?.base64) {
//           throw new Error(`Photo missing for checklist row ${it.rowIndex}`);
//         }
//         const url = await uploadImageToDrive({
//           base64: it.image.base64,
//           mimeType: it.image.mimeType || 'image/jpeg',
//           name: it.image.name || `evidence_${Date.now()}.jpg`,
//         });
//         return { ...it, url };
//       })
//     );

//     const data = uploaded.map((it) => ({
//       range: `Full kitting Master!F${it.rowIndex}:I${it.rowIndex}`,
//       values: [[date, it.url, 'Done', it.remarks || '']],
//     }));

//     data.push({
//       range: `Project Plan!O${projectPlanRowIndex}`,
//       values: [['Done']],
//     });

//     await sheets.spreadsheets.values.batchUpdate({
//       spreadsheetId: siteId,
//       requestBody: { valueInputOption: 'USER_ENTERED', data },
//     });

//     return NextResponse.json({ success: true, message: 'Fullkitting submitted successfully', date });
//   } catch (error) {
//     console.error('POST Error:', error);
//     return NextResponse.json({ success: false, message: error.message }, { status: 500 });
//   }
// }









import { NextResponse } from 'next/server';
import { getSheetsClient } from '@/lib/googleSheets';
import { uploadImageToDrive } from '@/lib/googleDrive';
import { getAuthUser } from '@/lib/auth';

const KITTING_SHEET = "'Full kitting Master'";
const PLAN_SHEET = "'Project Plan'";

// Date format: DD/MM/YYYY
function getFormattedDate() {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

// Convert YYYY-MM-DD (from HTML date input) → DD/MM/YYYY
function formatInputDate(str) {
  if (!str) return '';
  const parts = str.split('-');
  if (parts.length !== 3) return str;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

// API jo range wapas deta hai (e.g. "'Full kitting Master'!A1:I200") usse
// pehli row ka number nikalo — taaki values[0] kis sheet row ka hai, pakka pata ho.
function getStartRow(a1Range) {
  const m = String(a1Range || '').match(/![A-Z]+(\d+)/i);
  return m ? parseInt(m[1], 10) : 1;
}

const norm = (v) => String(v || '').trim().toLowerCase();
const kittingKey = (activity, subActivity, checklist) =>
  `${norm(activity)}|${norm(subActivity)}|${norm(checklist)}`;

export async function GET(req) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const siteId = searchParams.get('siteId');
    const action = searchParams.get('action');

    if (!siteId) {
      return NextResponse.json({ success: false, message: 'Site ID required' }, { status: 400 });
    }

    const sheets = await getSheetsClient();

    // --- ACTION: getKitting → Full kitting Master se checklist + Images ---
    if (action === 'getKitting') {
      const activity = (searchParams.get('activity') || '').trim();
      const subActivity = (searchParams.get('subActivity') || '').trim();

      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: siteId,
        range: `${KITTING_SHEET}!A1:I`,
      });

      const allData = response.data.values || [];
      if (allData.length < 2) return NextResponse.json({ success: true, items: [] });

      const startRow = getStartRow(response.data.range);

      const items = allData
        .slice(1)
        .map((row, i) => ({
          rowIndex: startRow + i + 1, // header ke baad wali asli sheet row
          activity: (row[0] || '').trim(),
          subActivity: (row[1] || '').trim(),
          checklist: (row[2] || '').trim(),
          verificationType: (row[3] || '').trim(),
          responsibleRole: (row[4] || '').trim(),
          date: (row[5] || '').trim(),
          imageUrl: (row[6] || '').trim(),
          status: (row[7] || '').trim(),
          remarks: (row[8] || '').trim(),
        }))
        .filter(
          (it) =>
            norm(it.activity) === norm(activity) &&
            norm(it.subActivity) === norm(subActivity) &&
            it.checklist
        );

      return NextResponse.json({ success: true, items });
    }

    // --- DEFAULT: Project Plan table (A-Z data read) ---
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: siteId,
      range: `${PLAN_SHEET}!A1:Z`,
    });

    const allData = response.data.values || [];
    if (allData.length < 2) {
      return NextResponse.json({ success: true, headers: [], rows: [] });
    }

    const planStartRow = getStartRow(response.data.range);
    const fullHeaders = allData[0];

    // Pick Headers
    const displayHeaders = fullHeaders.slice(0, 12);
    if (fullHeaders[15]) {
      displayHeaders.push(fullHeaders[15]);
    }

    const validRows = allData
      .slice(1)
      .map((row, i) => ({ row, rowIndex: planStartRow + i + 1 }))
      .filter((r) => r.row[0] && r.row[0].trim() !== '');

    const completionStatus = {};
    validRows.forEach(({ row }) => {
      const uid = (row[0] || '').trim();
      const colN = (row[13] || '').trim();
      completionStatus[uid] = colN !== '';
    });

    const readyRows = validRows.filter(({ row }) => {
      const colK = (row[10] || '').trim(); // Column K
      const colN = (row[13] || '').trim(); // Column N

      if (colN !== '') return false;
      if (colK === '') return false;

      const precedence = (row[5] || '').trim(); // Column F
      if (precedence) {
        const precArr = precedence.split(',').map((x) => x.trim()).filter(Boolean);
        for (const p of precArr) {
          if (completionStatus[p] === false) return false;
        }
      }
      return true;
    });

    const formattedRows = readyRows.map(({ row, rowIndex }) => {
      const isKitted = !!(row[14] && row[14].trim().toLowerCase() === 'done'); // Column O
      const isStarted = !!((row[12] && row[12].trim() !== '') || (row[19] && row[19].trim() === 'Started')); // Column M/T
      const isCompleted = !!((row[13] && row[13].trim() !== '') || (row[20] && row[20].trim() === 'Completed')); // Column N/U

      const obj = {
        _rowIndex: rowIndex,
        _isKitted: isKitted,
        _isStarted: isStarted,
        _isCompleted: isCompleted,
        _startDate: row[12] || '',
        _completedDate: row[13] || '',
        _fullRow: row,
      };

      displayHeaders.forEach((h) => {
        const hIdx = fullHeaders.indexOf(h);
        obj[h] = hIdx !== -1 ? (row[hIdx] || '') : '';
      });
      return obj;
    });

    return NextResponse.json({ success: true, headers: displayHeaders, rows: formattedRows });
  } catch (error) {
    console.error('GET Error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// ==========================================
// POST → Handle Fullkitting / Start / Completed / Edit
// ==========================================
export async function POST(req) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { siteId, projectPlanRowIndex, action, items, editData, image, activity, subActivity } = body;

    if (!siteId || !projectPlanRowIndex) {
      return NextResponse.json({ success: false, message: 'Invalid payload' }, { status: 400 });
    }

    const sheets = await getSheetsClient();
    const date = getFormattedDate();

    // ACTION: START
    if (action === 'start') {
      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId: siteId,
        requestBody: {
          valueInputOption: 'USER_ENTERED',
          data: [
            { range: `${PLAN_SHEET}!M${projectPlanRowIndex}`, values: [[date]] },
            { range: `${PLAN_SHEET}!T${projectPlanRowIndex}`, values: [['Started']] },
          ],
        },
      });
      return NextResponse.json({ success: true, message: 'Task Started successfully', date });
    }

    // ACTION: COMPLETE
    if (action === 'complete') {
      let imageUrl = '';

      if (image && image.base64) {
        imageUrl = await uploadImageToDrive({
          base64: image.base64,
          mimeType: image.mimeType || 'image/jpeg',
          name: image.name || `completed_${Date.now()}.jpg`,
        });
      }

      const updates = [
        { range: `${PLAN_SHEET}!N${projectPlanRowIndex}`, values: [[date]] },
        { range: `${PLAN_SHEET}!U${projectPlanRowIndex}`, values: [['Completed']] },
      ];

      if (imageUrl) {
        updates.push({ range: `${PLAN_SHEET}!Q${projectPlanRowIndex}`, values: [[imageUrl]] });
      }

      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId: siteId,
        requestBody: {
          valueInputOption: 'USER_ENTERED',
          data: updates,
        },
      });
      return NextResponse.json({ success: true, message: 'Task Completed successfully', date, imageUrl });
    }

    // ACTION: EDIT
    if (action === 'edit') {
      if (!editData || !editData.plannedStart || !editData.plannedEnd) {
        return NextResponse.json({ success: false, message: 'Planned dates are required' }, { status: 400 });
      }

      const rowResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: siteId,
        range: `${PLAN_SHEET}!A${projectPlanRowIndex}:J${projectPlanRowIndex}`,
      });

      const rowData = (rowResponse.data.values && rowResponse.data.values[0]) || [];
      while (rowData.length < 10) rowData.push('');

      const plannedStart = formatInputDate(editData.plannedStart);
      const plannedEnd = formatInputDate(editData.plannedEnd);
      const remarks = editData.remarks || '';

      const logRow = [
        rowData[0] || '', rowData[1] || '', rowData[2] || '', rowData[3] || '',
        rowData[4] || '', rowData[5] || '', rowData[6] || '', rowData[7] || '',
        rowData[8] || '', rowData[9] || '', plannedStart, plannedEnd, remarks,
      ];

      await sheets.spreadsheets.values.append({
        spreadsheetId: siteId,
        range: "'Exception Change Log'!A:M",
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        requestBody: { values: [logRow] },
      });

      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId: siteId,
        requestBody: {
          valueInputOption: 'USER_ENTERED',
          data: [
            { range: `${PLAN_SHEET}!K${projectPlanRowIndex}`, values: [[plannedStart]] },
            { range: `${PLAN_SHEET}!L${projectPlanRowIndex}`, values: [[plannedEnd]] },
          ],
        },
      });

      return NextResponse.json({ success: true, message: 'Exception logged & plan updated' });
    }

    // ACTION: FULLKITTING
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, message: 'No items provided for kitting' }, { status: 400 });
    }

    if (!items.some((it) => it.image?.base64)) {
      return NextResponse.json({ success: false, message: 'Kam se kam ek photo upload karna zaruri hai' }, { status: 400 });
    }

    // ✅ Row number client par bharosa karke nahi — sheet dobara padh kar
    // Activity + Sub Activity + Checklist match karke asli row nikalo.
    const kitRes = await sheets.spreadsheets.values.get({
      spreadsheetId: siteId,
      range: `${KITTING_SHEET}!A1:C`,
    });
    const kitData = kitRes.data.values || [];
    const kitStartRow = getStartRow(kitRes.data.range);

    const rowsByKey = {}; // key → [rowNumbers] (duplicate checklist bhi handle)
    kitData.forEach((row, i) => {
      if (i === 0) return; // header
      const key = kittingKey(row[0], row[1], row[2]);
      (rowsByKey[key] = rowsByKey[key] || []).push(kitStartRow + i);
    });

    const resolveRow = (it) => {
      if (activity && it.checklist) {
        const list = rowsByKey[kittingKey(activity, subActivity, it.checklist)];
        if (list && list.length) return list.shift();
      }
      return Number(it.rowIndex); // fallback
    };

    const uploaded = await Promise.all(
      items.map(async (it) => {
        const sheetRow = resolveRow(it);
        if (!it.image?.base64) return { ...it, sheetRow, url: '' };
        const url = await uploadImageToDrive({
          base64: it.image.base64,
          mimeType: it.image.mimeType || 'image/jpeg',
          name: it.image.name || `evidence_${Date.now()}.jpg`,
        });
        return { ...it, sheetRow, url };
      })
    );

    // F = Date, G = Photo URL, H = Status, I = Remarks
    const data = uploaded.map((it) => ({
      range: `${KITTING_SHEET}!F${it.sheetRow}:I${it.sheetRow}`,
      values: [[date, it.url, 'Done', it.remarks || '']],
    }));

    data.push({
      range: `${PLAN_SHEET}!O${projectPlanRowIndex}`,
      values: [['Done']],
    });

    console.log('Fullkitting rows:', uploaded.map((it) => ({ checklist: it.checklist, sent: it.rowIndex, written: it.sheetRow })));

    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: siteId,
      requestBody: { valueInputOption: 'USER_ENTERED', data },
    });

    return NextResponse.json({ success: true, message: 'Fullkitting submitted successfully', date });
  } catch (error) {
    console.error('POST Error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}