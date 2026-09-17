

// import { NextResponse } from 'next/server';
// import { getSheetsClient } from '@/lib/googleSheets';
// import { getAuthUser } from '@/lib/auth';

// function parseDate(str) {
//   if (!str) return null;
//   const s = String(str).trim();
//   const parts = s.split('/');
//   if (parts.length === 3) {
//     const d = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
//     return Number.isNaN(d.getTime()) ? null : d;
//   }
//   const d = new Date(s);
//   return Number.isNaN(d.getTime()) ? null : d;
// }

// function formatDateDDMMYYYY(date) {
//   if (!date) return '';
//   const d = new Date(date);
//   const dd = String(d.getDate()).padStart(2, '0');
//   const mm = String(d.getMonth() + 1).padStart(2, '0');
//   const yyyy = d.getFullYear();
//   return `${dd}/${mm}/${yyyy}`;
// }

// function addWorkingDays(startDate, days) {
//   const result = new Date(startDate);
//   let added = 0;
//   while (added < days) {
//     result.setDate(result.getDate() + 1);
//     if (result.getDay() !== 0) added++; // Skip Sundays
//   }
//   return result;
// }

// function makeFallbackPrefix(activity) {
//   const cleanWords = String(activity || '')
//     .replace(/[^a-zA-Z0-9\s]/g, ' ')
//     .trim()
//     .split(/\s+/)
//     .filter(Boolean);
//   if (cleanWords.length >= 2) return (cleanWords[0][0] + cleanWords[1][0]).toUpperCase();
//   if (cleanWords.length === 1) return cleanWords[0].substring(0, 2).toUpperCase();
//   return 'TK';
// }

// export async function GET(req) {
//   try {
//     const user = await getAuthUser();
//     if (!user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

//     const { searchParams } = new URL(req.url);
//     const siteId = searchParams.get('siteId');
//     if (!siteId) return NextResponse.json({ success: false, message: 'Site ID required' }, { status: 400 });

//     const sheets = await getSheetsClient();
//     const response = await sheets.spreadsheets.values.get({
//       spreadsheetId: siteId,
//       range: 'MSP DATA!A1:I',
//     });

//     const allData = response.data.values || [];
//     if (allData.length < 2) return NextResponse.json({ success: true, tasks: [], minDate: null, maxDate: null });

//     const rows = allData.slice(1).filter((row) => row[0] && String(row[0]).trim() !== '');

//     let minDate = null;
//     let maxDate = null;

//     const tasks = rows.map((row, index) => {
//       const start = parseDate(row[6]); 
//       const end = parseDate(row[7]);   

//       if (start && (!minDate || start < minDate)) minDate = start;
//       if (end && (!maxDate || end > maxDate)) maxDate = end;

//       const precedenceRaw = (row[4] || '').toString().trim(); // E column (Precedence UID)
//       const predecessors = precedenceRaw ? precedenceRaw.split(',').map((p) => p.trim()).filter(Boolean) : [];
//       const resource = (row[8] || '').toString().trim(); // I column (Resource)

//       return {
//         id: (row[0] || '').toString().trim(),
//         zone: (row[1] || '').toString().trim(),
//         activity: (row[2] || '').toString().trim(),
//         subActivity: (row[3] || '').toString().trim(),
//         precedenceRaw, // Stored to show exactly in frontend E column
//         predecessors,
//         duration: parseInt(row[5], 10) || 0,
//         startDate: row[6] || '',
//         endDate: row[7] || '',
//         startObj: start ? start.toISOString() : null,
//         endObj: end ? end.toISOString() : null,
//         resource,
//         rowIndex: index + 2,
//       };
//     });

//     return NextResponse.json({
//       success: true,
//       tasks,
//       minDate: minDate ? minDate.toISOString() : null,
//       maxDate: maxDate ? maxDate.toISOString() : null,
//     });
//   } catch (error) {
//     return NextResponse.json({ success: false, message: error.message }, { status: 500 });
//   }
// }

// // ==========================================
// // POST — Add new task (Formulas in G & H preserved 100%)
// // ==========================================
// export async function POST(req) {
//   try {
//     const user = await getAuthUser();
//     if (!user) {
//       return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
//     }

//     const body = await req.json();
//     const siteId = (body.siteId || '').trim();
//     const zone = (body.zone || '').trim();
//     const activity = (body.activity || '').trim();
//     const subActivity = (body.subActivity || '').trim();
//     const precedence = (body.precedence || '').trim();
//     const duration = body.duration === '' || body.duration == null ? '' : String(body.duration).trim();
//     const resource = (body.resource || '').trim();

//     if (!siteId || !activity) {
//       return NextResponse.json({ success: false, message: 'Site ID & Activity required' }, { status: 400 });
//     }

//     const sheets = await getSheetsClient();

//     // Fetch existing A to C columns to calculate target row & sequence ID
//     const existingRes = await sheets.spreadsheets.values.get({
//       spreadsheetId: siteId,
//       range: 'MSP DATA!A1:C',
//     });

//     const rows = existingRes.data.values || [];
//     let targetRowIndex = -1;

//     // Find first empty row
//     for (let i = 1; i < rows.length; i++) {
//       const r = rows[i] || [];
//       const rowId = (r[0] || '').toString().trim();
//       if (!rowId) {
//         targetRowIndex = i + 1;
//         break;
//       }
//     }

//     if (targetRowIndex === -1) {
//       targetRowIndex = Math.max(rows.length + 1, 2);
//     }

//     // Sequence ID logic (e.g. M14 -> M15, E1 -> E2)
//     const activityLower = activity.toLowerCase();
//     let matchedPrefix = null;
//     let maxNum = 0;

//     for (let i = 1; i < rows.length; i++) {
//       const r = rows[i] || [];
//       const rowId = (r[0] || '').toString().trim();
//       const rowAct = (r[2] || '').toString().trim().toLowerCase();
//       if (!rowId) continue;

//       const match = rowId.match(/^([A-Za-z]+)(\d+)$/);
//       if (!match) continue;

//       const prefix = match[1].toUpperCase();
//       const num = parseInt(match[2], 10);
//       if (Number.isNaN(num)) continue;

//       if (rowAct === activityLower) {
//         matchedPrefix = prefix;
//         if (num > maxNum) maxNum = num;
//       }
//     }

//     if (!matchedPrefix) {
//       matchedPrefix = makeFallbackPrefix(activity);
//       maxNum = 0;
//       rows.forEach((r) => {
//         const rowId = (r?.[0] || '').toString().trim();
//         const match = rowId.match(/^([A-Za-z]+)(\d+)$/);
//         if (match && match[1].toUpperCase() === matchedPrefix) {
//           const num = parseInt(match[2], 10);
//           if (!Number.isNaN(num) && num > maxNum) maxNum = num;
//         }
//       });
//     }

//     const generatedId = `${matchedPrefix}${maxNum + 1}`;

//     // ★ BATCH UPDATE:
//     // 1. Range A:F -> Writes A(ID), B(Zone), C(Activity), D(SubActivity), E(Precedence), F(Duration)
//     // 2. Range I   -> Writes I(Resource)
//     // ★ G & H COLUMNS ARE SKIPPED COMPLETELY — FORMULAS WILL NEVER BE DELETED!
//     await sheets.spreadsheets.values.batchUpdate({
//       spreadsheetId: siteId,
//       requestBody: {
//         valueInputOption: 'USER_ENTERED',
//         data: [
//           {
//             range: `MSP DATA!A${targetRowIndex}:F${targetRowIndex}`,
//             values: [[generatedId, zone, activity, subActivity, precedence, duration]],
//           },
//           {
//             range: `MSP DATA!I${targetRowIndex}`,
//             values: [[resource]],
//           },
//         ],
//       },
//     });

//     return NextResponse.json({
//       success: true,
//       message: 'Task added successfully',
//       generatedId,
//       row: targetRowIndex,
//     });
//   } catch (error) {
//     console.error('MSP POST Error:', error);
//     return NextResponse.json({ success: false, message: error.message }, { status: 500 });
//   }
// }




// export async function PUT(req) {
//   try {
//     const user = await getAuthUser();
//     if (!user) {
//       return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
//     }

//     const body = await req.json();
//     const { siteId, rowIndex, field, value, bulk } = body;

//     // Safety check: siteId aur rowIndex zaroori hain
//     if (!siteId || !rowIndex) {
//       return NextResponse.json({ success: false, message: 'siteId and rowIndex required' }, { status: 400 });
//     }

//     const sheets = await getSheetsClient();

//     // ★ BULK UPDATE FIX: Range 'B:G' (6 columns) matches 6 values
//     if (bulk) {
//       await sheets.spreadsheets.values.update({
//         spreadsheetId: siteId,
//         range: `MSP DATA!B${rowIndex}:G${rowIndex}`, // B, C, D, E, F, G (6 Columns)
//         valueInputOption: 'USER_ENTERED',
//         requestBody: {
//           values: [[
//             bulk.zone || '',
//             bulk.activity || '',
//             bulk.subActivity || '',
//             bulk.precedence || '',
//             bulk.duration || '',
//             // bulk.startDate || '' // G column
//           ]],
//         },
//       });

//       // Update Resource in Column I if provided
//       if (bulk.resource !== undefined) {
//         await sheets.spreadsheets.values.update({
//           spreadsheetId: siteId,
//           range: `MSP DATA!I${rowIndex}`,
//           valueInputOption: 'USER_ENTERED',
//           requestBody: { values: [[bulk.resource || '']] },
//         });
//       }

//       return NextResponse.json({ success: true, message: 'Bulk update successful' });
//     }

//     // ★ SINGLE FIELD INLINE EDIT FIX
//     const fieldToCol = {
//       zone: 'B',
//       activity: 'C',
//       subActivity: 'D',
//       predecessors: 'E',
//       precedence: 'E',
//       precedenceRaw: 'E',
//       duration: 'F',
//       startDate: 'G',
//       endDate: 'H',
//       resource: 'I',
//     };

//     const col = fieldToCol[field];
//     if (!col) {
//       return NextResponse.json({ success: false, message: `Unknown field: ${field}` }, { status: 400 });
//     }

//     await sheets.spreadsheets.values.update({
//       spreadsheetId: siteId,
//       range: `MSP DATA!${col}${rowIndex}`,
//       valueInputOption: 'USER_ENTERED',
//       requestBody: { values: [[value ?? '']] },
//     });

//     return NextResponse.json({ success: true, message: 'Single field update successful' });
//   } catch (error) {
//     console.error('MSP PUT Error:', error);
//     return NextResponse.json({ success: false, message: error.message || 'Internal Server Error' }, { status: 500 });
//   }
// }

























// // app/api/msp-plan/route.js
// // G & H = CODE ONLY (sheet formulas hata do)

// import { NextResponse } from 'next/server';
// import { getSheetsClient } from '@/lib/googleSheets';
// import { getAuthUser } from '@/lib/auth';

// // ==========================================
// // DATE HELPERS (calendar days = sheet jaisa G+F-1)
// // ==========================================
// function parseDate(str) {
//   if (!str) return null;
//   const s = String(str).trim();
//   if (!s) return null;

//   const dmy = /^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/.exec(s);
//   if (dmy) {
//     const d = new Date(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1]));
//     return Number.isNaN(d.getTime()) ? null : d;
//   }

//   // Excel serial
//   if (/^\d+(\.\d+)?$/.test(s)) {
//     const n = Number(s);
//     if (n > 20000 && n < 100000) {
//       const epoch = new Date(Date.UTC(1899, 11, 30));
//       const d = new Date(epoch.getTime() + n * 86400000);
//       return Number.isNaN(d.getTime()) ? null : d;
//     }
//   }

//   const d = new Date(s);
//   return Number.isNaN(d.getTime()) ? null : d;
// }

// function formatDateDDMMYYYY(date) {
//   if (!date) return '';
//   const d = date instanceof Date ? date : parseDate(date);
//   if (!d || Number.isNaN(d.getTime())) return '';
//   const dd = String(d.getDate()).padStart(2, '0');
//   const mm = String(d.getMonth() + 1).padStart(2, '0');
//   const yyyy = d.getFullYear();
//   return `${dd}/${mm}/${yyyy}`;
// }

// function addCalendarDays(date, days) {
//   const r = new Date(date.getFullYear(), date.getMonth(), date.getDate());
//   r.setDate(r.getDate() + days);
//   return r;
// }

// function makeFallbackPrefix(activity) {
//   const cleanWords = String(activity || '')
//     .replace(/[^a-zA-Z0-9\s]/g, ' ')
//     .trim()
//     .split(/\s+/)
//     .filter(Boolean);
//   if (cleanWords.length >= 2) return (cleanWords[0][0] + cleanWords[1][0]).toUpperCase();
//   if (cleanWords.length === 1) return cleanWords[0].substring(0, 2).toUpperCase();
//   return 'TK';
// }

// function splitPreds(raw) {
//   if (Array.isArray(raw)) {
//     return raw.map((p) => String(p).trim()).filter(Boolean);
//   }
//   return String(raw || '')
//     .split(/[,;|]+/)
//     .map((p) => p.trim())
//     .filter(Boolean);
// }

// /** Sheet A&B key: ID + Zone → M1U10-U12 */
// function uidKey(id, zone) {
//   return `${String(id || '').trim()}${String(zone || '').trim()}`.toUpperCase();
// }

// function taskKey(t) {
//   return `${String(t.id || '').trim()}::${String(t.zone || '').trim()}`.toUpperCase();
// }

// // ==========================================
// // AUTO SCHEDULE (ex-sheet formulas)
// // G = MAX(pred.H) + 1
// // H = G + F - 1
// // ==========================================
// function autoScheduleLikeSheet(tasks) {
//   const byUID = new Map();
//   const idCount = new Map();

//   tasks.forEach((t) => {
//     const id = String(t.id || '').trim();
//     const zone = String(t.zone || '').trim();
//     if (!id) return;
//     byUID.set(uidKey(id, zone), t);
//     const idU = id.toUpperCase();
//     idCount.set(idU, (idCount.get(idU) || 0) + 1);
//   });

//   const byUniqueId = new Map();
//   tasks.forEach((t) => {
//     const idU = String(t.id || '').trim().toUpperCase();
//     if (idU && idCount.get(idU) === 1) byUniqueId.set(idU, t);
//   });

//   function resolvePred(token, current) {
//     const tok = String(token || '').trim();
//     if (!tok) return null;
//     const tU = tok.toUpperCase();

//     // 1) full UID M1U10-U12
//     if (byUID.has(tU)) return byUID.get(tU);

//     // 2) bare ID + current zone
//     const z = String(current.zone || '').trim();
//     if (z) {
//       const k = uidKey(tok, z);
//       if (byUID.has(k)) return byUID.get(k);
//     }

//     // 3) unique bare ID
//     if (byUniqueId.has(tU)) return byUniqueId.get(tU);

//     // 4) longest id prefix + zone suffix
//     const sorted = [...tasks].sort(
//       (a, b) => String(b.id || '').length - String(a.id || '').length
//     );
//     for (const cand of sorted) {
//       const id = String(cand.id || '').trim().toUpperCase();
//       const cz = String(cand.zone || '').trim().toUpperCase();
//       if (!id) continue;
//       if (tU === id + cz) return cand;
//       if (tU.startsWith(id) && tU.slice(id.length) === cz) return cand;
//     }
//     return null;
//   }

//   // topological order
//   const order = [];
//   const done = new Set();
//   const stack = new Set();

//   function visit(t) {
//     const k = taskKey(t);
//     if (!k || done.has(k) || stack.has(k)) return;
//     stack.add(k);
//     splitPreds(t.precedenceRaw || t.predecessors)
//       .map((tok) => resolvePred(tok, t))
//       .filter(Boolean)
//       .forEach(visit);
//     stack.delete(k);
//     done.add(k);
//     order.push(t);
//   }
//   tasks.forEach(visit);

//   order.forEach((t) => {
//     const toks = splitPreds(t.precedenceRaw || t.predecessors);

//     // --- G (Start) ---
//     if (toks.length > 0) {
//       let latestPredEnd = null;
//       toks.forEach((tok) => {
//         const pred = resolvePred(tok, t);
//         if (!pred) return;
//         const pe =
//           pred._endDateObj ||
//           parseDate(pred.endDate) ||
//           (pred.endObj ? new Date(pred.endObj) : null);
//         if (pe && (!latestPredEnd || pe > latestPredEnd)) latestPredEnd = pe;
//       });

//       if (latestPredEnd) {
//         // formula: pred End + 1
//         t._startDateObj = addCalendarDays(latestPredEnd, 1);
//       }
//     }

//     // no pred → keep existing start (seed / first activity)
//     if (!t._startDateObj) {
//       const s = parseDate(t.startDate) || (t.startObj ? new Date(t.startObj) : null);
//       if (s) t._startDateObj = s;
//     }

//     if (t._startDateObj) {
//       t.startDate = formatDateDDMMYYYY(t._startDateObj);
//       t.startObj = t._startDateObj.toISOString();
//     } else {
//       t.startDate = '';
//       t.startObj = null;
//     }

//     // --- H (End) = G + F - 1 ---
//     const dur = Number(t.duration) || 0;
//     if (t._startDateObj) {
//       t._endDateObj =
//         dur <= 0 ? t._startDateObj : addCalendarDays(t._startDateObj, dur - 1);
//       t.endDate = formatDateDDMMYYYY(t._endDateObj);
//       t.endObj = t._endDateObj.toISOString();
//     } else {
//       t.endDate = '';
//       t.endObj = null;
//       t._endDateObj = null;
//     }
//   });

//   return tasks;
// }

// async function writeDatesToSheet(sheets, siteId, tasks) {
//   const data = tasks
//     .filter((t) => t.rowIndex)
//     .map((t) => ({
//       range: `MSP DATA!G${t.rowIndex}:H${t.rowIndex}`,
//       values: [[t.startDate || '', t.endDate || '']],
//     }));

//   if (!data.length) return;

//   for (let i = 0; i < data.length; i += 80) {
//     await sheets.spreadsheets.values.batchUpdate({
//       spreadsheetId: siteId,
//       requestBody: {
//         valueInputOption: 'USER_ENTERED',
//         data: data.slice(i, i + 80),
//       },
//     });
//   }
// }

// async function loadAllTasks(sheets, siteId) {
//   const response = await sheets.spreadsheets.values.get({
//     spreadsheetId: siteId,
//     range: 'MSP DATA!A1:I',
//   });
//   const allData = response.data.values || [];
//   if (allData.length < 2) return [];

//   const tasks = [];
//   allData.slice(1).forEach((row, index) => {
//     const id = (row[0] || '').toString().trim();
//     if (!id) return;

//     const startDate = (row[6] || '').toString().trim();
//     const endDate = (row[7] || '').toString().trim();
//     const start = parseDate(startDate);
//     const end = parseDate(endDate);
//     const precedenceRaw = (row[4] || '').toString().trim();

//     tasks.push({
//       id,
//       zone: (row[1] || '').toString().trim(),
//       activity: (row[2] || '').toString().trim(),
//       subActivity: (row[3] || '').toString().trim(),
//       precedenceRaw,
//       predecessors: splitPreds(precedenceRaw),
//       duration: parseInt(row[5], 10) || 0,
//       startDate,
//       endDate,
//       startObj: start ? start.toISOString() : null,
//       endObj: end ? end.toISOString() : null,
//       resource: (row[8] || '').toString().trim(),
//       rowIndex: index + 2,
//     });
//   });

//   return tasks;
// }

// async function rescheduleAndSave(sheets, siteId) {
//   let tasks = await loadAllTasks(sheets, siteId);
//   tasks = autoScheduleLikeSheet(tasks);
//   await writeDatesToSheet(sheets, siteId, tasks);
//   return tasks;
// }

// // ==========================================
// // GET
// // ==========================================
// export async function GET(req) {
//   try {
//     const user = await getAuthUser();
//     if (!user) {
//       return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
//     }

//     const siteId = new URL(req.url).searchParams.get('siteId');
//     if (!siteId) {
//       return NextResponse.json({ success: false, message: 'Site ID required' }, { status: 400 });
//     }

//     const sheets = await getSheetsClient();
//     let tasks = await loadAllTasks(sheets, siteId);
//     tasks = autoScheduleLikeSheet(tasks);

//     // Optionally keep sheet in sync on every GET (safe; values not formulas)
//     // Comment out next line if you only want write on POST/PUT
//     await writeDatesToSheet(sheets, siteId, tasks);

//     let minDate = null;
//     let maxDate = null;
//     tasks.forEach((t) => {
//       const s = t._startDateObj || parseDate(t.startDate);
//       const e = t._endDateObj || parseDate(t.endDate);
//       if (s && (!minDate || s < minDate)) minDate = s;
//       if (e && (!maxDate || e > maxDate)) maxDate = e;
//     });

//     return NextResponse.json({
//       success: true,
//       tasks: tasks.map((t) => ({
//         id: t.id,
//         zone: t.zone,
//         activity: t.activity,
//         subActivity: t.subActivity,
//         precedenceRaw: t.precedenceRaw,
//         predecessors: t.predecessors,
//         duration: t.duration,
//         startDate: t.startDate,
//         endDate: t.endDate,
//         startObj: t.startObj,
//         endObj: t.endObj,
//         resource: t.resource,
//         rowIndex: t.rowIndex,
//       })),
//       minDate: minDate ? minDate.toISOString() : null,
//       maxDate: maxDate ? maxDate.toISOString() : null,
//     });
//   } catch (error) {
//     console.error('MSP GET Error:', error);
//     return NextResponse.json({ success: false, message: error.message }, { status: 500 });
//   }
// }

// // ==========================================
// // POST
// // ==========================================
// export async function POST(req) {
//   try {
//     const user = await getAuthUser();
//     if (!user) {
//       return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
//     }

//     const body = await req.json();
//     const siteId = (body.siteId || '').trim();
//     const zone = (body.zone || '').trim();
//     const activity = (body.activity || '').trim();
//     const subActivity = (body.subActivity || '').trim();
//     const precedence = (body.precedence || '').trim();
//     const duration =
//       body.duration === '' || body.duration == null ? '' : String(body.duration).trim();
//     const resource = (body.resource || '').trim();
//     const manualStart = (body.startDate || '').trim(); // only for tasks with NO pred

//     if (!siteId || !activity) {
//       return NextResponse.json(
//         { success: false, message: 'Site ID & Activity required' },
//         { status: 400 }
//       );
//     }

//     const sheets = await getSheetsClient();

//     const existingRes = await sheets.spreadsheets.values.get({
//       spreadsheetId: siteId,
//       range: 'MSP DATA!A1:C',
//     });
//     const rows = existingRes.data.values || [];

//     let targetRowIndex = -1;
//     for (let i = 1; i < rows.length; i++) {
//       if (!(rows[i]?.[0] || '').toString().trim()) {
//         targetRowIndex = i + 1;
//         break;
//       }
//     }
//     if (targetRowIndex === -1) targetRowIndex = Math.max(rows.length + 1, 2);

//     // Sequence ID (M14 → M15)
//     const activityLower = activity.toLowerCase();
//     let matchedPrefix = null;
//     let maxNum = 0;

//     for (let i = 1; i < rows.length; i++) {
//       const r = rows[i] || [];
//       const rowId = (r[0] || '').toString().trim();
//       const rowAct = (r[2] || '').toString().trim().toLowerCase();
//       if (!rowId) continue;
//       const match = rowId.match(/^([A-Za-z]+)(\d+)$/);
//       if (!match) continue;
//       const prefix = match[1].toUpperCase();
//       const num = parseInt(match[2], 10);
//       if (Number.isNaN(num)) continue;
//       if (rowAct === activityLower) {
//         matchedPrefix = prefix;
//         if (num > maxNum) maxNum = num;
//       }
//     }

//     if (!matchedPrefix) {
//       matchedPrefix = makeFallbackPrefix(activity);
//       maxNum = 0;
//       rows.forEach((r) => {
//         const rowId = (r?.[0] || '').toString().trim();
//         const match = rowId.match(/^([A-Za-z]+)(\d+)$/);
//         if (match && match[1].toUpperCase() === matchedPrefix) {
//           const num = parseInt(match[2], 10);
//           if (!Number.isNaN(num) && num > maxNum) maxNum = num;
//         }
//       });
//     }

//     const generatedId = `${matchedPrefix}${maxNum + 1}`;

//     // Write A–F + I (G/H code se baad me)
//     const data = [
//       {
//         range: `MSP DATA!A${targetRowIndex}:F${targetRowIndex}`,
//         values: [[generatedId, zone, activity, subActivity, precedence, duration]],
//       },
//       {
//         range: `MSP DATA!I${targetRowIndex}`,
//         values: [[resource]],
//       },
//     ];

//     // Seed start ONLY if no predecessor (first / independent task)
//     if (!precedence && manualStart) {
//       const s = parseDate(manualStart);
//       if (s) {
//         const dur = parseInt(duration, 10) || 0;
//         const e = dur > 0 ? addCalendarDays(s, dur - 1) : s;
//         data.push({
//           range: `MSP DATA!G${targetRowIndex}:H${targetRowIndex}`,
//           values: [[formatDateDDMMYYYY(s), formatDateDDMMYYYY(e)]],
//         });
//       }
//     }

//     await sheets.spreadsheets.values.batchUpdate({
//       spreadsheetId: siteId,
//       requestBody: { valueInputOption: 'USER_ENTERED', data },
//     });

//     // Full project reschedule → write all G/H as VALUES
//     await rescheduleAndSave(sheets, siteId);

//     return NextResponse.json({
//       success: true,
//       message: 'Task added successfully',
//       generatedId,
//       row: targetRowIndex,
//     });
//   } catch (error) {
//     console.error('MSP POST Error:', error);
//     return NextResponse.json({ success: false, message: error.message }, { status: 500 });
//   }
// }

// // ==========================================
// // PUT
// // ==========================================
// export async function PUT(req) {
//   try {
//     const user = await getAuthUser();
//     if (!user) {
//       return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
//     }

//     const body = await req.json();
//     const { siteId, rowIndex, field, value, bulk } = body;

//     if (!siteId || !rowIndex) {
//       return NextResponse.json(
//         { success: false, message: 'siteId and rowIndex required' },
//         { status: 400 }
//       );
//     }

//     const sheets = await getSheetsClient();

//     if (bulk) {
//       const data = [
//         {
//           range: `MSP DATA!B${rowIndex}:F${rowIndex}`,
//           values: [[
//             bulk.zone || '',
//             bulk.activity || '',
//             bulk.subActivity || '',
//             bulk.precedence || '',
//             bulk.duration || '',
//           ]],
//         },
//         {
//           range: `MSP DATA!I${rowIndex}`,
//           values: [[bulk.resource || '']],
//         },
//       ];

//       // manual start seed if no preds
//       if (bulk.startDate && !(bulk.precedence || '').trim()) {
//         const s = parseDate(bulk.startDate);
//         if (s) {
//           const dur = parseInt(bulk.duration, 10) || 0;
//           const e = dur > 0 ? addCalendarDays(s, dur - 1) : s;
//           data.push({
//             range: `MSP DATA!G${rowIndex}:H${rowIndex}`,
//             values: [[formatDateDDMMYYYY(s), formatDateDDMMYYYY(e)]],
//           });
//         }
//       }

//       await sheets.spreadsheets.values.batchUpdate({
//         spreadsheetId: siteId,
//         requestBody: { valueInputOption: 'USER_ENTERED', data },
//       });
//     } else {
//       const fieldToCol = {
//         zone: 'B',
//         activity: 'C',
//         subActivity: 'D',
//         predecessors: 'E',
//         precedence: 'E',
//         precedenceRaw: 'E',
//         duration: 'F',
//         startDate: 'G',
//         endDate: 'H',
//         resource: 'I',
//       };
//       const col = fieldToCol[field];
//       if (!col) {
//         return NextResponse.json(
//           { success: false, message: `Unknown field: ${field}` },
//           { status: 400 }
//         );
//       }
//       await sheets.spreadsheets.values.update({
//         spreadsheetId: siteId,
//         range: `MSP DATA!${col}${rowIndex}`,
//         valueInputOption: 'USER_ENTERED',
//         requestBody: { values: [[value ?? '']] },
//       });
//     }

//     await rescheduleAndSave(sheets, siteId);

//     return NextResponse.json({ success: true, message: 'Updated successfully' });
//   } catch (error) {
//     console.error('MSP PUT Error:', error);
//     return NextResponse.json({ success: false, message: error.message }, { status: 500 });
//   }
// }

// // ==========================================
// // DELETE
// // ==========================================
// export async function DELETE(req) {
//   try {
//     const user = await getAuthUser();
//     if (!user) {
//       return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
//     }

//     const { siteId, rowIndex } = await req.json();
//     if (!siteId || !rowIndex) {
//       return NextResponse.json(
//         { success: false, message: 'siteId and rowIndex required' },
//         { status: 400 }
//       );
//     }

//     const sheets = await getSheetsClient();

//     await sheets.spreadsheets.values.update({
//       spreadsheetId: siteId,
//       range: `MSP DATA!A${rowIndex}:I${rowIndex}`,
//       valueInputOption: 'USER_ENTERED',
//       requestBody: {
//         values: [['', '', '', '', '', '', '', '', '']],
//       },
//     });

//     await rescheduleAndSave(sheets, siteId);

//     return NextResponse.json({ success: true, message: 'Task deleted successfully' });
//   } catch (error) {
//     console.error('MSP DELETE Error:', error);
//     return NextResponse.json({ success: false, message: error.message }, { status: 500 });
//   }
// }













// app/api/msp-plan/route.js
// G & H = CODE ONLY (sheet se formulas hata do)
// Date edit → us row LOCK + sirf AAGE (successors) cascade

import { NextResponse } from 'next/server';
import { getSheetsClient } from '@/lib/googleSheets';
import { getAuthUser } from '@/lib/auth';

// ==========================================
// DATE HELPERS
// ==========================================
function parseDate(str) {
  if (!str) return null;
  const s = String(str).trim();
  if (!s) return null;

  // DD/MM/YYYY
  const dmy = /^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/.exec(s);
  if (dmy) {
    const d = new Date(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1]));
    return Number.isNaN(d.getTime()) ? null : d;
  }

  // YYYY-MM-DD (frontend date input)
  const ymd = /^(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})$/.exec(s);
  if (ymd) {
    const d = new Date(Number(ymd[1]), Number(ymd[2]) - 1, Number(ymd[3]));
    return Number.isNaN(d.getTime()) ? null : d;
  }

  // Excel serial
  if (/^\d+(\.\d+)?$/.test(s)) {
    const n = Number(s);
    if (n > 20000 && n < 100000) {
      const epoch = new Date(Date.UTC(1899, 11, 30));
      const d = new Date(epoch.getTime() + n * 86400000);
      return Number.isNaN(d.getTime()) ? null : d;
    }
  }

  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatDateDDMMYYYY(date) {
  if (!date) return '';
  const d = date instanceof Date ? date : parseDate(date);
  if (!d || Number.isNaN(d.getTime())) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function addCalendarDays(date, days) {
  const r = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  r.setDate(r.getDate() + days);
  return r;
}

function makeFallbackPrefix(activity) {
  const cleanWords = String(activity || '')
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (cleanWords.length >= 2) return (cleanWords[0][0] + cleanWords[1][0]).toUpperCase();
  if (cleanWords.length === 1) return cleanWords[0].substring(0, 2).toUpperCase();
  return 'TK';
}

function splitPreds(raw) {
  if (Array.isArray(raw)) return raw.map((p) => String(p).trim()).filter(Boolean);
  return String(raw || '')
    .split(/[,;|]+/)
    .map((p) => p.trim())
    .filter(Boolean);
}

/** ID + Zone → M1U10-U12 */
function uidKey(id, zone) {
  return `${String(id || '').trim()}${String(zone || '').trim()}`.toUpperCase();
}

function taskKey(t) {
  return `${String(t?.id || '').trim()}::${String(t?.zone || '').trim()}`.toUpperCase();
}

// ==========================================
// PRED / SUCC MAPS
// ==========================================
function buildPredSuccMaps(tasks) {
  const byUID = new Map();
  const idCount = new Map();

  tasks.forEach((t) => {
    const id = String(t.id || '').trim();
    if (!id) return;
    const zone = String(t.zone || '').trim();
    byUID.set(uidKey(id, zone), t);
    byUID.set(`${id.toUpperCase()}-${zone.toUpperCase()}`, t);
    byUID.set(`${id.toUpperCase()}_${zone.toUpperCase()}`, t);
    const idU = id.toUpperCase();
    idCount.set(idU, (idCount.get(idU) || 0) + 1);
  });

  const byUniqueId = new Map();
  tasks.forEach((t) => {
    const idU = String(t.id || '').trim().toUpperCase();
    if (idU && idCount.get(idU) === 1) byUniqueId.set(idU, t);
  });

  function resolvePred(token, current) {
    const tok = String(token || '').trim();
    if (!tok) return null;
    const tU = tok.toUpperCase();

    if (byUID.has(tU)) return byUID.get(tU);

    const z = String(current.zone || '').trim();
    if (z) {
      const k = uidKey(tok, z);
      if (byUID.has(k)) return byUID.get(k);
    }

    if (byUniqueId.has(tU)) return byUniqueId.get(tU);

    const sorted = [...tasks].sort(
      (a, b) => String(b.id || '').length - String(a.id || '').length
    );
    for (const cand of sorted) {
      const id = String(cand.id || '').trim().toUpperCase();
      const cz = String(cand.zone || '').trim().toUpperCase();
      if (!id) continue;
      if (tU === id + cz) return cand;
      if (tU === `${id}-${cz}` || tU === `${id}_${cz}`) return cand;
      if (tU.startsWith(id) && tU.slice(id.length) === cz) return cand;
    }
    return null;
  }

  const predKeysOf = {};
  const successors = {};

  tasks.forEach((t) => {
    const k = taskKey(t);
    predKeysOf[k] = [];
    splitPreds(t.precedenceRaw || t.predecessors).forEach((tok) => {
      const p = resolvePred(tok, t);
      if (!p) return;
      const pk = taskKey(p);
      if (!pk || pk === k) return;
      predKeysOf[k].push(pk);
      if (!successors[pk]) successors[pk] = [];
      if (!successors[pk].includes(k)) successors[pk].push(k);
    });
  });

  return { predKeysOf, successors, resolvePred };
}

/** edited key + saari aage dependent keys */
function getForwardKeys(startKeys, successors) {
  const out = new Set(
    (startKeys || []).map((k) => String(k).toUpperCase()).filter(Boolean)
  );
  const q = [...out];
  while (q.length) {
    const cur = q.shift();
    (successors[cur] || []).forEach((s) => {
      const su = String(s).toUpperCase();
      if (!out.has(su)) {
        out.add(su);
        q.push(su);
      }
    });
  }
  return out;
}

// ==========================================
// AUTO SCHEDULE
// lockedKeys = user date (is row pe pred se overwrite mat karo)
// lockEnd    = H bhi user wali
// fromKeys   = sirf yeh + aage reschedule; baaki rows untouched
// ==========================================
function autoScheduleLikeSheet(tasks, options = {}) {
  const lockedKeys = new Set(
    (options.lockedKeys || []).map((k) => String(k).toUpperCase())
  );
  const lockEnd = !!options.lockEnd;
  const { predKeysOf, successors } = buildPredSuccMaps(tasks);

  let rescheduleKeys = null; // null = full project
  if (options.fromKeys && options.fromKeys.length) {
    rescheduleKeys = getForwardKeys(options.fromKeys, successors);
  }

  const byKey = new Map();
  tasks.forEach((t) => byKey.set(taskKey(t), t));

  // Sheet se existing dates pehle set
  tasks.forEach((t) => {
    const s = parseDate(t.startDate) || (t.startObj ? new Date(t.startObj) : null);
    const e = parseDate(t.endDate) || (t.endObj ? new Date(t.endObj) : null);
    t._startDateObj = s || null;
    t._endDateObj = e || null;
  });

  // Topo order
  const order = [];
  const done = new Set();
  const stack = new Set();
  function visit(k) {
    if (!k || done.has(k) || stack.has(k) || !byKey.has(k)) return;
    stack.add(k);
    (predKeysOf[k] || []).forEach(visit);
    stack.delete(k);
    done.add(k);
    order.push(k);
  }
  tasks.forEach((t) => visit(taskKey(t)));

  order.forEach((k) => {
    const t = byKey.get(k);
    if (!t) return;

    const dur = Number(t.duration) || 0;
    const isLocked = lockedKeys.has(k);
    const shouldTouch = !rescheduleKeys || rescheduleKeys.has(k);

    // ★ Forward chain me nahi → bilkul mat chhedo
    if (!shouldTouch) {
      if (t._startDateObj) {
        t.startDate = formatDateDDMMYYYY(t._startDateObj);
        t.startObj = t._startDateObj.toISOString();
      } else {
        t.startDate = t.startDate || '';
        t.startObj = null;
      }
      if (t._endDateObj) {
        t.endDate = formatDateDDMMYYYY(t._endDateObj);
        t.endObj = t._endDateObj.toISOString();
      } else {
        t.endDate = t.endDate || '';
        t.endObj = null;
      }
      return;
    }

    // ★ LOCKED = user ne jo date di wahi rahe
    if (isLocked) {
      if (t._startDateObj) {
        t.startDate = formatDateDDMMYYYY(t._startDateObj);
        t.startObj = t._startDateObj.toISOString();
      }
      if (lockEnd && t._endDateObj) {
        t.endDate = formatDateDDMMYYYY(t._endDateObj);
        t.endObj = t._endDateObj.toISOString();
      } else if (t._startDateObj) {
        t._endDateObj =
          dur <= 0 ? t._startDateObj : addCalendarDays(t._startDateObj, dur - 1);
        t.endDate = formatDateDDMMYYYY(t._endDateObj);
        t.endObj = t._endDateObj.toISOString();
      }
      return;
    }

    // ★ Cascade: Start = max(pred End) + 1
    const preds = predKeysOf[k] || [];
    if (preds.length > 0) {
      let latest = null;
      preds.forEach((pk) => {
        const p = byKey.get(pk);
        if (!p) return;
        const pe = p._endDateObj || parseDate(p.endDate);
        if (pe && (!latest || pe > latest)) latest = pe;
      });
      if (latest) {
        t._startDateObj = addCalendarDays(latest, 1);
      }
      // pred end na mile to existing start rehne do
    }

    if (t._startDateObj) {
      t.startDate = formatDateDDMMYYYY(t._startDateObj);
      t.startObj = t._startDateObj.toISOString();
      t._endDateObj =
        dur <= 0 ? t._startDateObj : addCalendarDays(t._startDateObj, dur - 1);
      t.endDate = formatDateDDMMYYYY(t._endDateObj);
      t.endObj = t._endDateObj.toISOString();
    } else {
      t.startDate = t.startDate || '';
      t.endDate = t.endDate || '';
      t.startObj = null;
      t.endObj = null;
    }
  });

  return tasks;
}

async function writeDatesToSheet(sheets, siteId, tasks, onlyKeys = null) {
  const allow = onlyKeys
    ? new Set([...onlyKeys].map((k) => String(k).toUpperCase()))
    : null;

  const data = tasks
    .filter((t) => t.rowIndex && (!allow || allow.has(taskKey(t))))
    .map((t) => ({
      range: `MSP DATA!G${t.rowIndex}:H${t.rowIndex}`,
      values: [[t.startDate || '', t.endDate || '']],
    }));

  if (!data.length) return;

  for (let i = 0; i < data.length; i += 80) {
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: siteId,
      requestBody: {
        valueInputOption: 'USER_ENTERED',
        data: data.slice(i, i + 80),
      },
    });
  }
}

async function loadAllTasks(sheets, siteId) {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: siteId,
    range: 'MSP DATA!A1:I',
  });
  const allData = response.data.values || [];
  if (allData.length < 2) return [];

  const tasks = [];
  allData.slice(1).forEach((row, index) => {
    const id = (row[0] || '').toString().trim();
    if (!id) return;

    const precedenceRaw = (row[4] || '').toString().trim();
    const startDate = (row[6] || '').toString().trim();
    const endDate = (row[7] || '').toString().trim();
    const start = parseDate(startDate);
    const end = parseDate(endDate);

    tasks.push({
      id,
      zone: (row[1] || '').toString().trim(),
      activity: (row[2] || '').toString().trim(),
      subActivity: (row[3] || '').toString().trim(),
      precedenceRaw,
      predecessors: splitPreds(precedenceRaw),
      duration: parseInt(row[5], 10) || 0,
      startDate,
      endDate,
      startObj: start ? start.toISOString() : null,
      endObj: end ? end.toISOString() : null,
      resource: (row[8] || '').toString().trim(),
      rowIndex: index + 2,
    });
  });

  return tasks;
}

async function rescheduleAndSave(sheets, siteId, options = {}) {
  let tasks = await loadAllTasks(sheets, siteId);
  const { successors } = buildPredSuccMaps(tasks);

  let writeKeys = null;
  if (options.fromKeys && options.fromKeys.length) {
    writeKeys = getForwardKeys(options.fromKeys, successors);
  }

  tasks = autoScheduleLikeSheet(tasks, options);
  await writeDatesToSheet(sheets, siteId, tasks, writeKeys);
  return tasks;
}

async function getRowIdZone(sheets, siteId, rowIndex) {
  const cur = await sheets.spreadsheets.values.get({
    spreadsheetId: siteId,
    range: `MSP DATA!A${rowIndex}:B${rowIndex}`,
  });
  const row = (cur.data.values || [[]])[0] || [];
  return {
    id: (row[0] || '').toString().trim(),
    zone: (row[1] || '').toString().trim(),
  };
}


// ==========================================
// GET — Sheet se jo hai wahi frontend ko (NO reschedule overwrite)
// ==========================================
export async function GET(req) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const siteId = new URL(req.url).searchParams.get('siteId');
    if (!siteId) {
      return NextResponse.json({ success: false, message: 'Site ID required' }, { status: 400 });
    }

    const sheets = await getSheetsClient();

    // ★ Sirf sheet padho — autoSchedule se dates mat badlo
    const tasks = await loadAllTasks(sheets, siteId);

    let minDate = null;
    let maxDate = null;

    const out = tasks.map((t) => {
      // Sheet values hi source of truth
      const s = parseDate(t.startDate);
      const e = parseDate(t.endDate);

      if (s && (!minDate || s < minDate)) minDate = s;
      if (e && (!maxDate || e > maxDate)) maxDate = e;

      return {
        id: t.id,
        zone: t.zone,
        activity: t.activity,
        subActivity: t.subActivity,
        precedenceRaw: t.precedenceRaw || '',
        predecessors: t.predecessors || splitPreds(t.precedenceRaw),
        duration: t.duration,
        startDate: t.startDate || '',           // ★ sheet G
        endDate: t.endDate || '',               // ★ sheet H
        startObj: s ? s.toISOString() : null,
        endObj: e ? e.toISOString() : null,
        resource: t.resource || '',
        rowIndex: t.rowIndex,
      };
    });

    return NextResponse.json({
      success: true,
      tasks: out,
      minDate: minDate ? minDate.toISOString() : null,
      maxDate: maxDate ? maxDate.toISOString() : null,
      // cache bust help
      fetchedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('MSP GET Error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// ==========================================
// POST — A:F + I, phir schedule from new row
// ==========================================
export async function POST(req) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const siteId = (body.siteId || '').trim();
    const zone = (body.zone || '').trim();
    const activity = (body.activity || '').trim();
    const subActivity = (body.subActivity || '').trim();
    const precedence = (body.precedence || '').trim();
    const duration =
      body.duration === '' || body.duration == null ? '' : String(body.duration).trim();
    const resource = (body.resource || '').trim();
    const manualStart = parseDate(body.startDate);
    const manualEnd = parseDate(body.endDate);

    if (!siteId || !activity) {
      return NextResponse.json(
        { success: false, message: 'Site ID & Activity required' },
        { status: 400 }
      );
    }

    const sheets = await getSheetsClient();

    const existingRes = await sheets.spreadsheets.values.get({
      spreadsheetId: siteId,
      range: 'MSP DATA!A1:C',
    });
    const rows = existingRes.data.values || [];

    let targetRowIndex = -1;
    for (let i = 1; i < rows.length; i++) {
      if (!(rows[i]?.[0] || '').toString().trim()) {
        targetRowIndex = i + 1;
        break;
      }
    }
    if (targetRowIndex === -1) targetRowIndex = Math.max(rows.length + 1, 2);

    // Sequence ID (M14 → M15)
    const activityLower = activity.toLowerCase();
    let matchedPrefix = null;
    let maxNum = 0;

    for (let i = 1; i < rows.length; i++) {
      const r = rows[i] || [];
      const rowId = (r[0] || '').toString().trim();
      const rowAct = (r[2] || '').toString().trim().toLowerCase();
      if (!rowId) continue;
      const match = rowId.match(/^([A-Za-z]+)(\d+)$/);
      if (!match) continue;
      const prefix = match[1].toUpperCase();
      const num = parseInt(match[2], 10);
      if (Number.isNaN(num)) continue;
      if (rowAct === activityLower) {
        matchedPrefix = prefix;
        if (num > maxNum) maxNum = num;
      }
    }

    if (!matchedPrefix) {
      matchedPrefix = makeFallbackPrefix(activity);
      maxNum = 0;
      rows.forEach((r) => {
        const rowId = (r?.[0] || '').toString().trim();
        const match = rowId.match(/^([A-Za-z]+)(\d+)$/);
        if (match && match[1].toUpperCase() === matchedPrefix) {
          const num = parseInt(match[2], 10);
          if (!Number.isNaN(num) && num > maxNum) maxNum = num;
        }
      });
    }

    const generatedId = `${matchedPrefix}${maxNum + 1}`;
    const lockKey = `${generatedId}::${zone}`.toUpperCase();

    const data = [
      {
        range: `MSP DATA!A${targetRowIndex}:F${targetRowIndex}`,
        values: [[generatedId, zone, activity, subActivity, precedence, duration]],
      },
      {
        range: `MSP DATA!I${targetRowIndex}`,
        values: [[resource]],
      },
    ];

    // Seed G/H if user ne start diya
    if (manualStart) {
      const dur = parseInt(duration, 10) || 0;
      const end =
        manualEnd ||
        (dur > 0 ? addCalendarDays(manualStart, dur - 1) : manualStart);
      data.push({
        range: `MSP DATA!G${targetRowIndex}:H${targetRowIndex}`,
        values: [[formatDateDDMMYYYY(manualStart), formatDateDDMMYYYY(end)]],
      });
    }

    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: siteId,
      requestBody: { valueInputOption: 'USER_ENTERED', data },
    });

    // Nayi row se aage cascade (pura project upar se nahi)
    await rescheduleAndSave(sheets, siteId, {
      lockedKeys: manualStart ? [lockKey] : [],
      lockEnd: !!(manualStart && manualEnd),
      fromKeys: [lockKey],
    });

    return NextResponse.json({
      success: true,
      message: 'Task added successfully',
      generatedId,
      row: targetRowIndex,
    });
  } catch (error) {
    console.error('MSP POST Error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// ==========================================
// PUT — edit + LOCK row + sirf AAGE cascade
// ==========================================
export async function PUT(req) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { siteId, rowIndex, field, value, bulk } = body;

    if (!siteId || !rowIndex) {
      return NextResponse.json(
        { success: false, message: 'siteId and rowIndex required' },
        { status: 400 }
      );
    }

    const sheets = await getSheetsClient();

    let fromKey = null;
    let lockEnd = false;
    let datesTouched = false;

    if (bulk) {
      const { id: sheetId } = await getRowIdZone(sheets, siteId, rowIndex);
      const z = (bulk.zone || '').trim();
      fromKey = sheetId ? `${sheetId}::${z}`.toUpperCase() : null;

      const data = [
        {
          range: `MSP DATA!B${rowIndex}:F${rowIndex}`,
          values: [[
            bulk.zone || '',
            bulk.activity || '',
            bulk.subActivity || '',
            bulk.precedence || '',
            bulk.duration || '',
          ]],
        },
        {
          range: `MSP DATA!I${rowIndex}`,
          values: [[bulk.resource || '']],
        },
      ];

      const hasStart = !!(bulk.startDate || '').trim();
      const hasEnd = !!(bulk.endDate || '').trim();
      const dur = parseInt(bulk.duration, 10) || 0;

      if (hasStart || hasEnd) {
        let g = hasStart ? parseDate(bulk.startDate) : null;
        let h = hasEnd ? parseDate(bulk.endDate) : null;

        if (g && !h) {
          h = dur > 0 ? addCalendarDays(g, dur - 1) : g;
        }
        if (h && !g) {
          // only end: start = end - dur + 1
          g = dur > 0 ? addCalendarDays(h, -(dur - 1)) : h;
        }

        if (g) {
          data.push({
            range: `MSP DATA!G${rowIndex}:H${rowIndex}`,
            values: [[formatDateDDMMYYYY(g), formatDateDDMMYYYY(h || g)]],
          });
          datesTouched = true;
          lockEnd = hasEnd;
        }
      } else if (
        bulk.duration !== undefined &&
        bulk.duration !== null &&
        String(bulk.duration) !== ''
      ) {
        // duration change → start same (lock), end + aage cascade
        datesTouched = true;
        lockEnd = false;
      }

      // precedence change bhi aage dates badal sakta hai
      if ((bulk.precedence || '').trim() !== undefined && bulk.precedence !== undefined) {
        // if only precedence without dates, still cascade from this row without lock
        if (!datesTouched && !hasStart && !hasEnd) {
          datesTouched = true;
          // no lock — pred se naya start nikalega
          // but fromKeys still this row
        }
      }

      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId: siteId,
        requestBody: { valueInputOption: 'USER_ENTERED', data },
      });

      // bulk me start diya to lock; sirf duration/pred to lock only if start already on sheet
      if (hasStart || hasEnd) {
        // locked
      } else if (datesTouched) {
        // duration: lock start so end recalculates from same G
        const { id, zone } = await getRowIdZone(sheets, siteId, rowIndex);
        fromKey = id ? `${id}::${(bulk.zone || zone || '').trim()}`.toUpperCase() : fromKey;
      }
    } else {
      const fieldToCol = {
        zone: 'B',
        activity: 'C',
        subActivity: 'D',
        predecessors: 'E',
        precedence: 'E',
        precedenceRaw: 'E',
        duration: 'F',
        startDate: 'G',
        endDate: 'H',
        resource: 'I',
      };
      const col = fieldToCol[field];
      if (!col) {
        return NextResponse.json(
          { success: false, message: `Unknown field: ${field}` },
          { status: 400 }
        );
      }

      const { id, zone } = await getRowIdZone(sheets, siteId, rowIndex);
      fromKey = id ? `${id}::${zone}`.toUpperCase() : null;

      if (field === 'startDate' || field === 'endDate') {
        const cur = await sheets.spreadsheets.values.get({
          spreadsheetId: siteId,
          range: `MSP DATA!A${rowIndex}:H${rowIndex}`,
        });
        const row = (cur.data.values || [[]])[0] || [];
        const dur = parseInt(row[5], 10) || 0;
        let g = parseDate(row[6]);
        let h = parseDate(row[7]);

        if (field === 'startDate') {
          g = parseDate(value);
          if (g) {
            h = dur > 0 ? addCalendarDays(g, dur - 1) : g;
          }
          lockEnd = false;
        } else {
          h = parseDate(value);
          lockEnd = true;
          // G sheet wala hi
        }

        await sheets.spreadsheets.values.update({
          spreadsheetId: siteId,
          range: `MSP DATA!G${rowIndex}:H${rowIndex}`,
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: [[
              g ? formatDateDDMMYYYY(g) : row[6] || '',
              h ? formatDateDDMMYYYY(h) : row[7] || '',
            ]],
          },
        });
        datesTouched = true;
      } else {
        await sheets.spreadsheets.values.update({
          spreadsheetId: siteId,
          range: `MSP DATA!${col}${rowIndex}`,
          valueInputOption: 'USER_ENTERED',
          requestBody: { values: [[value ?? '']] },
        });

        if (field === 'duration') {
          // Start lock, End = Start+Dur-1, aage cascade
          datesTouched = true;
          lockEnd = false;
        }
        if (
          field === 'precedence' ||
          field === 'precedenceRaw' ||
          field === 'predecessors'
        ) {
          datesTouched = true;
          // pred change: is row ko lock mat karo (naya FS), lekin fromKeys = this
          // actually after pred change this row should recalc from preds
          // so NO lock on this row — only cascade from this row with unlock
          fromKey = id ? `${id}::${zone}`.toUpperCase() : fromKey;
          // clear lockedKeys by not locking
          lockEnd = false;
          // mark special: unlock self
          await rescheduleAndSave(sheets, siteId, {
            lockedKeys: [],
            lockEnd: false,
            fromKeys: fromKey ? [fromKey] : [],
          });
          return NextResponse.json({ success: true, message: 'Updated successfully' });
        }
      }
    }

    if (datesTouched && fromKey) {
      // ★ Sirf is row LOCK + iske baad wali rows
      await rescheduleAndSave(sheets, siteId, {
        lockedKeys: [fromKey],
        lockEnd,
        fromKeys: [fromKey],
      });
    }

    return NextResponse.json({ success: true, message: 'Updated successfully' });
  } catch (error) {
    console.error('MSP PUT Error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// ==========================================
// DELETE
// ==========================================
export async function DELETE(req) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { siteId, rowIndex } = body;
    if (!siteId || !rowIndex) {
      return NextResponse.json(
        { success: false, message: 'siteId and rowIndex required' },
        { status: 400 }
      );
    }

    const sheets = await getSheetsClient();

    // Pehle dependents nikal lo (delete se pehle)
    const before = await loadAllTasks(sheets, siteId);
    const { successors } = buildPredSuccMaps(before);
    const deleted = before.find((t) => t.rowIndex === Number(rowIndex));
    const delKey = deleted ? taskKey(deleted) : null;
    const forward = delKey ? getForwardKeys([delKey], successors) : null;
    // deleted khud hata do forward se
    if (forward && delKey) forward.delete(delKey);

    await sheets.spreadsheets.values.update({
      spreadsheetId: siteId,
      range: `MSP DATA!A${rowIndex}:I${rowIndex}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [['', '', '', '', '', '', '', '', '']],
      },
    });

    // Sirf pehle wale dependents reschedule (full project nahi)
    if (forward && forward.size) {
      await rescheduleAndSave(sheets, siteId, {
        lockedKeys: [],
        fromKeys: [...forward],
      });
    }

    return NextResponse.json({ success: true, message: 'Task deleted successfully' });
  } catch (error) {
    console.error('MSP DELETE Error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}