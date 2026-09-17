
import { google } from 'googleapis';

// =====================================================
// AUTH SETUP
// =====================================================
function getAuth() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      type: process.env.GOOGLE_TYPE,
      project_id: process.env.GOOGLE_PROJECT_ID,
      private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      client_id: process.env.GOOGLE_CLIENT_ID,
      auth_uri: process.env.GOOGLE_AUTH_URI,
      token_uri: process.env.GOOGLE_TOKEN_URI,
      auth_provider_x509_cert_url: process.env.GOOGLE_AUTH_PROVIDER_X509_CERT_URL,
      client_x509_cert_url: process.env.GOOGLE_CLIENT_X509_CERT_URL,
      universe_domain: process.env.GOOGLE_UNIVERSE_DOMAIN,
    },
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive',
    ],
  });
  return auth;
}

export async function getSheetsClient() {
  const auth = getAuth();
  return google.sheets({ version: 'v4', auth });
}

export async function getDriveClient() {
  const auth = getAuth();
  return google.drive({ version: 'v3', auth });
}

function getFlexibleIndex(headers, possibleNames) {
  if (!headers || !Array.isArray(headers)) return -1;
  const cleanHeaders = headers.map((h) => (h || '').toString().trim().toLowerCase());
  for (const name of possibleNames) {
    const clean = name.trim().toLowerCase();
    const idx = cleanHeaders.findIndex((h) => h === clean || h.includes(clean));
    if (idx !== -1) return idx;
  }
  return -1;
}

// =====================================================
// fetchSheetID() - Smart Lookup
// =====================================================
export async function fetchSheetID(siteNameOrId) {
  if (!siteNameOrId) throw new Error('Site identifier is required');

  if (siteNameOrId.length > 20 && !siteNameOrId.includes(' ')) {
    return siteNameOrId;
  }

  const mainSpreadsheetId = process.env.GOOGLE_MAIN_SPREADSHEET_ID;

  if (mainSpreadsheetId) {
    try {
      const sheets = await getSheetsClient();
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: mainSpreadsheetId,
        range: 'Sites!A:B',
      });
      const rows = response.data.values || [];
      const matched = rows.find(
        (r) => r[0] && r[0].trim().toLowerCase() === siteNameOrId.trim().toLowerCase()
      );
      if (matched && matched[1] && matched[1].trim() !== '') {
        return matched[1].trim();
      }
    } catch (err) {
      console.warn('Sites sheet lookup warning:', err.message);
    }
  }

  return siteNameOrId;
}

// =====================================================
// getProjectData()
// =====================================================


export async function getProjectData() {
  try {
    const sheets = await getSheetsClient();
    const spreadsheetId = process.env.GOOGLE_MAIN_SPREADSHEET_ID;
    if (!spreadsheetId) return [];

    // Updated range to A1:K to include Column J (Start Date) and Column K (Days Left)
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Project Detail!A1:K',
    });

    const allData = response.data.values || [];
    if (allData.length < 2) return [];

    const f2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

    return allData
      .slice(1)
      .filter((row) => row[0])
      .map((row, index) => {
        const totalTime = f2(row[1]);
        const totalBuffer = f2(row[2]);
        const bufferUsed = f2(row[3]);
        let remainingBuffer = f2(row[4]);

        if (isNaN(remainingBuffer) || remainingBuffer < -1000 || remainingBuffer > 100000) {
          remainingBuffer = f2(totalBuffer - bufferUsed);
        }

        return {
          siteName: row[0] || '',
          totalTime,
          totalBuffer,
          bufferUsed,
          remainingBuffer,
          activityPending: f2(row[5]),
          completion: f2(row[6]),
          bufferUsedPct: f2(row[7]),
          endDate: row[8] || '',       // Column I
          startDate: row[9] || '',     // Column J (Project Start Date)
          daysLeft: f2(row[10]),       // Column K (Days Left)
          rowIndex: index + 2,
        };
      });
  } catch (err) {
    console.error('Error in getProjectData:', err.message);
    return [];
  }
}

// =====================================================
// getProjectBufferData()
// =====================================================
export async function getProjectBufferData(siteNameOrId) {
  try {
    const sheets = await getSheetsClient();
    const sheetID = await fetchSheetID(siteNameOrId);

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetID,
      range: 'Project Buffer!A1:Z5',
    });

    const rows = response.data.values || [];
    if (rows.length === 0) {
      return { totalBuffer: 0, remainingBuffer: 0, bufferConsumeDay: 0, usedPercent: 0, projectProgress: 0 };
    }

    const row2 = rows[1] || [];
    let totalBuffer = parseFloat(row2[17]) || 0;
    let remainingBuffer = parseFloat(row2[20]) || 0;
    let bufferConsumeDay = parseFloat(row2[19]) || 0;
    let usedPercent = parseFloat((row2[23] || '').toString().replace('%', '')) || 0;
    let projectProgress = parseFloat((row2[22] || '').toString().replace('%', '')) || 0;

    if (totalBuffer <= 0 && rows.length > 0) {
      const headers = rows[0] || [];
      const idxTB = getFlexibleIndex(headers, ['total buffer', 'buffer']);
      const idxRB = getFlexibleIndex(headers, ['remaining buffer', 'left']);
      const idxBC = getFlexibleIndex(headers, ['buffer consumed', 'consumed']);
      const idxUP = getFlexibleIndex(headers, ['buffer used', 'used %']);
      const idxPP = getFlexibleIndex(headers, ['project progress', 'progress %']);

      if (idxTB !== -1 && rows[1][idxTB]) totalBuffer = parseFloat(rows[1][idxTB]) || totalBuffer;
      if (idxRB !== -1 && rows[1][idxRB]) remainingBuffer = parseFloat(rows[1][idxRB]) || remainingBuffer;
      if (idxBC !== -1 && rows[1][idxBC]) bufferConsumeDay = parseFloat(rows[1][idxBC]) || bufferConsumeDay;
      if (idxUP !== -1 && rows[1][idxUP]) usedPercent = parseFloat((rows[1][idxUP] || '').toString().replace('%', '')) || usedPercent;
      if (idxPP !== -1 && rows[1][idxPP]) projectProgress = parseFloat((rows[1][idxPP] || '').toString().replace('%', '')) || projectProgress;
    }

    return {
      totalBuffer,
      remainingBuffer,
      bufferConsumeDay,
      usedPercent,
      projectProgress,
    };
  } catch (err) {
    console.error('Error in getProjectBufferData:', err.message);
    return { totalBuffer: 0, remainingBuffer: 0, bufferConsumeDay: 0, usedPercent: 0, projectProgress: 0 };
  }
}

// =====================================================
// getFeedingBufferData()
// =====================================================
export async function getFeedingBufferData(siteNameOrId) {
  try {
    const sheets = await getSheetsClient();
    const sheetID = await fetchSheetID(siteNameOrId);

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetID,
      range: 'Feeding Buffer!L2:O',
    });

    const rows = response.data.values || [];

    return rows
      .filter((row) => row[0] && parseFloat(row[0]) > 0)
      .map((row, index) => ({
        feedingBuffer: parseFloat(row[0]) || 0,
        bufferConsumeDay: parseFloat(row[1]) || 0,
        remainingBuffer: parseFloat(row[2]) || 0,
        usedPercent: parseFloat((row[3] || '').toString().replace('%', '')) || 0,
        id: `Feeding Buffer ${index + 1}`,
      }));
  } catch (err) {
    console.error('Error in getFeedingBufferData:', err.message);
    return [];
  }
}

// =====================================================
// getWeeklyBufferData()
// =====================================================
export async function getWeeklyBufferData(siteNameOrId) {
  try {
    const sheets = await getSheetsClient();
    const sheetID = await fetchSheetID(siteNameOrId);

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetID,
      range: 'Weekwise Buffer consumed!A1:Z100',
    });

    const allRows = response.data.values || [];
    if (allRows.length < 2) return [];

    const headers = allRows[0];
    let weekCol = getFlexibleIndex(headers, ['week no.', 'week no', 'week', 'weekno', 'week#']);
    let consumedCol = getFlexibleIndex(headers, ['buffer consumed', 'consumed', 'buffer']);

    if (weekCol === -1) weekCol = 0;
    if (consumedCol === -1) consumedCol = 1;

    const dataRows = allRows.slice(1);
    return dataRows
      .map((row) => {
        const week = row[weekCol];
        const consumed = Number(row[consumedCol]);
        if (week !== undefined && week !== '' && !isNaN(consumed)) {
          return { week: week.toString(), consumed };
        }
        return null;
      })
      .filter(Boolean);
  } catch (err) {
    console.error('Error in getWeeklyBufferData:', err.message);
    return [];
  }
}

// =====================================================
// getWeeklyProgressData()
// =====================================================
export async function getWeeklyProgressData(siteNameOrId) {
  try {
    const sheets = await getSheetsClient();
    const sheetID = await fetchSheetID(siteNameOrId);

    const allDataResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetID,
      range: 'Project Buffer!A1:Z100',
    });

    const allRows = allDataResponse.data.values || [];

    let startRowIndex = -1;
    let startColIndex = -1;

    for (let r = 0; r < allRows.length; r++) {
      for (let c = 0; c < (allRows[r] || []).length; c++) {
        const val = (allRows[r][c] || '').toString().toLowerCase().trim();
        if (val.includes('tasks in a week') || val.includes('no. of tasks') || val.includes('tasks week')) {
          startRowIndex = r + 1;
          startColIndex = c;
          break;
        }
      }
      if (startRowIndex !== -1) break;
    }

    if (startRowIndex === -1) return [];

    const dataRows = allRows.slice(startRowIndex);

    return dataRows
      .map((row, index) => {
        const tasksInWeek = Number(row[startColIndex]);
        const tasksCompleted = Number(row[startColIndex + 1]);
        const progressStr = (row[startColIndex + 2] || '').toString();

        if (isNaN(tasksInWeek) || row[startColIndex] === '' || row[startColIndex] === undefined) {
          return null;
        }

        return {
          week: `Week ${index + 1}`,
          tasksInWeek,
          tasksCompleted: isNaN(tasksCompleted) ? 0 : tasksCompleted,
          progress: parseFloat(progressStr.replace('%', '')) || 0,
        };
      })
      .filter(Boolean);
  } catch (err) {
    console.error('Error in getWeeklyProgressData:', err.message);
    return [];
  }
}

// // Date parser helper
// function parseDate(dateStr) {
//   if (!dateStr || typeof dateStr !== 'string') return null;
//   let s = dateStr.replace(/Started|Completed|YES|NO|Done/gi, '').trim();
//   if (!s) return null;

//   const m1 = s.match(/^(\d{1,2})[\/\-\s]+([A-Za-z]{3,9})[\/\-\s]+(\d{2,4})$/);
//   if (m1) {
//     const day = parseInt(m1[1], 10);
//     const monStr = m1[2].slice(0, 3).toLowerCase();
//     const months = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
//     const month = months.indexOf(monStr);
//     let year = parseInt(m1[3], 10);
//     if (year < 100) year += 2000;
//     if (month >= 0) return new Date(year, month, day);
//   }

//   const m2 = s.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})$/);
//   if (m2) {
//     const day = parseInt(m2[1], 10);
//     const month = parseInt(m2[2], 10) - 1;
//     let year = parseInt(m2[3], 10);
//     if (year < 100) year += 2000;
//     return new Date(year, month, day);
//   }

//   const d = new Date(s);
//   return isNaN(d.getTime()) ? null : d;
// }





// export async function getBufferTrendData(siteNameOrId) {
//   try {
//     const sheets = await getSheetsClient();
//     const sheetID = await fetchSheetID(siteNameOrId);

//     const response = await sheets.spreadsheets.values.get({
//       spreadsheetId: sheetID,
//       range: 'Project Buffer!A1:Z',
//     });

//     const allData = response.data.values || [];
//     if (allData.length < 2) return [];

//     const dataRows = allData.slice(1);

//     // Fixed columns (0-based)
//     const cUID = 0; // A
//     const cAct = 1; // B
//     const cSub = 2; // C
//     const cDate = 4; // E  ← DOT trigger
//     const cDelay = 10; // K  ← delay (+late / −early)

//     // ── Summary (KPI match ke liye) ──────────────────────────────────
//     let totalBuffer = 0;
//     let usedPercent = 0; // ~58.6%
//     let projectProgress = 0;

//     if (allData[1]) {
//       totalBuffer =
//         parseFloat(allData[1][17]) ||
//         parseFloat(allData[1][11]) ||
//         0;
//       usedPercent =
//         parseFloat((allData[1][23] || '').toString().replace('%', '')) || 0;
//       projectProgress =
//         parseFloat((allData[1][22] || '').toString().replace('%', '')) || 0;
//     }
//     if (totalBuffer <= 0) {
//       try {
//         const l2 = await sheets.spreadsheets.values.get({
//           spreadsheetId: sheetID,
//           range: 'Project Buffer!L2',
//         });
//         totalBuffer = parseFloat(l2.data.values?.[0]?.[0]) || 0;
//       } catch (_) {}
//     }
//     if (totalBuffer <= 0) totalBuffer = 87;

//     // ── 1. Collect ONLY rows jahan Col E mein valid date ho ──────────
//     const rawTasks = [];
//     for (let i = 0; i < dataRows.length; i++) {
//       const row = dataRows[i] || [];
//       const uid = (row[cUID] || '').toString().trim();
//       if (!uid) continue;

//       const triggerDateRaw = (row[cDate] || '').toString().trim();
//       const parsedDate = parseDate(triggerDateRaw);
//       if (!parsedDate) continue; // DOT nahi banega

//       let taskDelay = parseFloat((row[cDelay] || '').toString().trim());
//       if (isNaN(taskDelay)) taskDelay = 0;

//       rawTasks.push({
//         uid,
//         activity: (row[cAct] || '').toString().trim(),
//         subActivity: (row[cSub] || '').toString().trim(),
//         triggerDateRaw,
//         parsedDate, // for sorting
//         taskDelay,
//         rowIndex: i, // stable tie-breaker
//       });
//     }

//     if (rawTasks.length === 0) return [];

//     // ── 2. SORT — yahi main fix hai (F11 pehle, F12 baad mein) ───────
//     // Primary  : Column E date (chronological – jab activity hui)
//     // Secondary: UID natural (F11 < F12 < F13…)
//     // Tertiary : original row order
//     rawTasks.sort((a, b) => {
//       const tA = a.parsedDate.getTime();
//       const tB = b.parsedDate.getTime();
//       if (tA !== tB) return tA - tB;

//       // Natural UID compare (F11 before F12, A2 before A10)
//       const uidCmp = a.uid.localeCompare(b.uid, undefined, {
//         numeric: true,
//         sensitivity: 'base',
//       });
//       if (uidCmp !== 0) return uidCmp;

//       return a.rowIndex - b.rowIndex;
//     });

//     // ── 3. Cumulative + progress (sorted order mein) ─────────────────
//     const totalTasksInSheet = rawTasks.length; // sirf tracked (Col E date wali)
//     // Agar pure sheet ke total UIDs chahiye (103) toh alag se count karo:
//     let totalUIDsInSheet = 0;
//     for (let i = 0; i < dataRows.length; i++) {
//       const uid = (dataRows[i][cUID] || '').toString().trim();
//       if (uid) totalUIDsInSheet++;
//     }
//     if (totalUIDsInSheet === 0) totalUIDsInSheet = rawTasks.length;

//     const trendData = [];
//     let cumulativeDelay = 0;

//     rawTasks.forEach((task, idx) => {
//       cumulativeDelay += task.taskDelay;

//       const trackedCount = idx + 1;
//       const progress = (trackedCount / totalUIDsInSheet) * 100;
//       const bufferUsedRaw = (cumulativeDelay / totalBuffer) * 100;

//       trendData.push({
//         taskNo: trackedCount,
//         totalTasksInSheet: totalUIDsInSheet,
//         uid: task.uid,
//         activity: task.activity,
//         subActivity: task.subActivity,
//         progress: parseFloat(progress.toFixed(2)),
//         bufferUsed: parseFloat(bufferUsedRaw.toFixed(2)), // temporary, scale later
//         cumulativeDelay: parseFloat(cumulativeDelay.toFixed(2)), // real days (tooltip)
//         taskDelay: parseFloat(task.taskDelay.toFixed(2)),
//         actualStart: task.triggerDateRaw,
//         pointType: 'started',
//       });
//     });

//     // ── 4. Scale Y so LAST point = official usedPercent (58.6%) ───────
//     // Shape (upar-niche) Column K se preserve hoti hai
//     // cumulativeDelay tooltip mein REAL days rehta hai (scale nahi)
//     if (trendData.length > 0 && usedPercent != null && !isNaN(usedPercent)) {
//       const lastRaw = trendData[trendData.length - 1].bufferUsed;
//       if (Math.abs(lastRaw) > 0.0001) {
//         const scale = usedPercent / lastRaw;
//         trendData.forEach((p) => {
//           p.bufferUsed = parseFloat((p.bufferUsed * scale).toFixed(2));
//         });
//       } else {
//         // sab zero the
//         trendData[trendData.length - 1].bufferUsed = usedPercent;
//       }

//       // Optional: last point ka X bhi sheet ke projectProgress se align
//       if (projectProgress > 0) {
//         const last = trendData[trendData.length - 1];
//         const shift = projectProgress - last.progress;
//         // sirf last ko move mat karo — poori line ko mildly stretch karo taaki shape rahe
//         if (Math.abs(shift) > 0.01 && last.progress > 0) {
//           const xScale = projectProgress / last.progress;
//           trendData.forEach((p) => {
//             p.progress = parseFloat((p.progress * xScale).toFixed(2));
//           });
//         } else {
//           last.progress = parseFloat(projectProgress.toFixed(2));
//         }
//       }
//     }

//     return trendData;
//   } catch (err) {
//     console.error('Error in getBufferTrendData:', err.message);
//     return [];
//   }
// }








function parseDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return null;
  let s = dateStr.replace(/Started|Completed|YES|NO|Done/gi, '').trim();
  if (!s) return null;

  const m1 = s.match(/^(\d{1,2})[\/\-\s]+([A-Za-z]{3,9})[\/\-\s]+(\d{2,4})$/);
  if (m1) {
    const day = parseInt(m1[1], 10);
    const monStr = m1[2].slice(0, 3).toLowerCase();
    const months = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
    const month = months.indexOf(monStr);
    let year = parseInt(m1[3], 10);
    if (year < 100) year += 2000;
    if (month >= 0) return new Date(year, month, day);
  }

  const m2 = s.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})$/);
  if (m2) {
    const day = parseInt(m2[1], 10);
    const month = parseInt(m2[2], 10) - 1;
    let year = parseInt(m2[3], 10);
    if (year < 100) year += 2000;
    return new Date(year, month, day);
  }

  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

export async function getBufferTrendData(siteNameOrId) {
  try {
    const sheets = await getSheetsClient();
    const sheetID = await fetchSheetID(siteNameOrId);

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetID,
      range: 'Project Buffer!A1:Z',
    });

    const allData = response.data.values || [];
    if (allData.length < 2) return [];

    const dataRows = allData.slice(1);

    const cUID = 0; // A
    const cAct = 1; // B
    const cSub = 2; // C
    const cDate = 4; // E
    const cDelay = 10; // K

    let totalBuffer = 0;
    let usedPercent = 0;
    let projectProgress = 0;

    if (allData[1]) {
      totalBuffer =
        parseFloat(allData[1][17]) ||
        parseFloat(allData[1][11]) ||
        0;
      usedPercent =
        parseFloat((allData[1][23] || '').toString().replace('%', '')) || 0;
      projectProgress =
        parseFloat((allData[1][22] || '').toString().replace('%', '')) || 0;
    }
    if (totalBuffer <= 0) {
      try {
        const l2 = await sheets.spreadsheets.values.get({
          spreadsheetId: sheetID,
          range: 'Project Buffer!L2',
        });
        totalBuffer = parseFloat(l2.data.values?.[0]?.[0]) || 0;
      } catch (_) {}
    }
    if (totalBuffer <= 0) totalBuffer = 87;

    const rawTasks = [];
    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i] || [];
      const uid = (row[cUID] || '').toString().trim();
      if (!uid) continue;

      const triggerDateRaw = (row[cDate] || '').toString().trim();
      const parsedDate = parseDate(triggerDateRaw);
      if (!parsedDate) continue;

      let taskDelay = parseFloat((row[cDelay] || '').toString().trim());
      if (isNaN(taskDelay)) taskDelay = 0;

      rawTasks.push({
        uid,
        activity: (row[cAct] || '').toString().trim(),
        subActivity: (row[cSub] || '').toString().trim(),
        triggerDateRaw,
        parsedDate,
        taskDelay,
        rowIndex: i,
      });
    }

    if (rawTasks.length === 0) return [];

    rawTasks.sort((a, b) => {
      const tA = a.parsedDate.getTime();
      const tB = b.parsedDate.getTime();
      if (tA !== tB) return tA - tB;

      const uidCmp = a.uid.localeCompare(b.uid, undefined, {
        numeric: true,
        sensitivity: 'base',
      });
      if (uidCmp !== 0) return uidCmp;

      return a.rowIndex - b.rowIndex;
    });

    let totalUIDsInSheet = 0;
    for (let i = 0; i < dataRows.length; i++) {
      const uid = (dataRows[i][cUID] || '').toString().trim();
      if (uid) totalUIDsInSheet++;
    }
    if (totalUIDsInSheet === 0) totalUIDsInSheet = rawTasks.length;

    const trendData = [];
    let cumulativeDelay = 0;

    rawTasks.forEach((task, idx) => {
      cumulativeDelay += task.taskDelay;

      const trackedCount = idx + 1;
      const progress = (trackedCount / totalUIDsInSheet) * 100;
      const bufferUsedRaw = (cumulativeDelay / totalBuffer) * 100;

      trendData.push({
        taskNo: trackedCount,
        totalTasksInSheet: totalUIDsInSheet,
        uid: task.uid,
        activity: task.activity,
        subActivity: task.subActivity,
        progress: parseFloat(progress.toFixed(2)),
        bufferUsed: parseFloat(bufferUsedRaw.toFixed(2)),
        cumulativeDelay: parseFloat(cumulativeDelay.toFixed(2)),
        taskDelay: parseFloat(task.taskDelay.toFixed(2)),
        actualStart: task.triggerDateRaw,
        pointType: 'started',
      });
    });

    if (trendData.length > 0 && usedPercent != null && !isNaN(usedPercent)) {
      const lastRaw = trendData[trendData.length - 1].bufferUsed;
      if (Math.abs(lastRaw) > 0.0001) {
        const scale = usedPercent / lastRaw;
        trendData.forEach((p) => {
          p.bufferUsed = parseFloat((p.bufferUsed * scale).toFixed(2));
        });
      } else {
        trendData[trendData.length - 1].bufferUsed = usedPercent;
      }

      if (projectProgress > 0) {
        const last = trendData[trendData.length - 1];
        const shift = projectProgress - last.progress;
        if (Math.abs(shift) > 0.01 && last.progress > 0) {
          const xScale = projectProgress / last.progress;
          trendData.forEach((p) => {
            p.progress = parseFloat((p.progress * xScale).toFixed(2));
          });
        } else {
          last.progress = parseFloat(projectProgress.toFixed(2));
        }
      }
    }

    return trendData;
  } catch (err) {
    console.error('Error in getBufferTrendData:', err.message);
    return [];
  }
}



