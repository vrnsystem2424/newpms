
// 'use client';

// import { useEffect, useState, useMemo, useCallback, useRef } from 'react';

// const HEADER_HEIGHT = 56;
// const LEFT_W = 710;

// function dayDiff(a, b) {
//   return Math.round((b - a) / 86400000);
// }

// function parseISO(d) {
//   if (!d) return null;
//   if (d instanceof Date) return Number.isNaN(d.getTime()) ? null : d;
//   const s = String(d).trim();
//   const dmy = /^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/.exec(s);
//   if (dmy) {
//     const dt = new Date(+dmy[3], +dmy[2] - 1, +dmy[1]);
//     return Number.isNaN(dt.getTime()) ? null : dt;
//   }
//   const x = new Date(s);
//   return Number.isNaN(x.getTime()) ? null : x;
// }

// function toISODate(d) {
//   const dt = d instanceof Date ? d : parseISO(d);
//   if (!dt) return '';
//   return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
// }

// function toNum(v) {
//   const n = Number(v);
//   return Number.isFinite(n) ? n : 0;
// }

// function norm(s) {
//   return String(s ?? '')
//     .trim()
//     .toUpperCase();
// }

// function getZone(t) {
//   return String(t?.zone ?? t?.uid ?? t?.UID ?? '').trim();
// }

// function taskKey(t) {
//   const id = String(t?.id ?? '').trim();
//   const z = getZone(t);
//   return `${id}::${z}`.toUpperCase();
// }

// function taskUID(t) {
//   return `${String(t?.id ?? '').trim()}${getZone(t)}`;
// }

// function parsePredsRaw(task) {
//   if (!task) return [];
//   const val = task.precedenceRaw ?? task.predecessors ?? task.precedence ?? '';
//   let raw = [];
//   if (Array.isArray(val)) raw = val;
//   else if (typeof val === 'string') raw = val.split(/[,;|]+/);
//   else if (typeof val === 'number') raw = [String(val)];

//   return raw
//     .map((p) => (p && typeof p === 'object' ? String(p.id || p.uid || p.value || '') : String(p ?? '')))
//     .map((p) => p.trim())
//     .filter(Boolean);
// }

// function createRefMaps(items) {
//   const byUID = new Map();
//   const byKey = new Map();
//   const byZoneId = new Map();
//   const idCounts = new Map();

//   (items || []).forEach((item) => {
//     if (!item) return;
//     const id = String(item.id ?? '').trim();
//     if (!id) return;
//     const z = getZone(item);
//     const idU = norm(id);
//     const zU = norm(z);
//     const uid = norm(id + z);

//     byKey.set(taskKey(item), item);
//     byUID.set(uid, item);
//     byUID.set(norm(`${id}-${z}`), item);
//     byUID.set(norm(`${id}_${z}`), item);

//     if (zU) {
//       byZoneId.set(`${zU}::${idU}`, item);
//       byUID.set(norm(`${z}${id}`), item);
//     }
//     idCounts.set(idU, (idCounts.get(idU) || 0) + 1);
//   });

//   const byUniqueId = new Map();
//   (items || []).forEach((item) => {
//     const idU = norm(item?.id);
//     if (!idU) return;
//     if ((idCounts.get(idU) || 0) === 1) byUniqueId.set(idU, item);
//   });

//   return { byUID, byKey, byZoneId, byUniqueId };
// }

// function resolvePredTask(token, currentTask, allTasks, maps) {
//   if (!token || !currentTask) return null;
//   const t = String(token).trim();
//   if (!t) return null;
//   const tU = norm(t);
//   const curZoneU = norm(getZone(currentTask));
//   const { byUID, byZoneId, byUniqueId } = maps;

//   let found = byUID.get(tU) || null;
//   if (!found && curZoneU) found = byZoneId.get(`${curZoneU}::${tU}`) || null;
//   if (!found) found = byUniqueId.get(tU) || null;

//   if (!found) {
//     const sorted = [...allTasks].sort(
//       (a, b) => String(b.id || '').length - String(a.id || '').length
//     );
//     for (const cand of sorted) {
//       const idU = norm(cand.id);
//       if (!idU) continue;
//       const zU = norm(getZone(cand));
//       if (tU === `${idU}${zU}` || tU === `${idU}-${zU}` || tU === `${idU}_${zU}`) {
//         found = cand;
//         break;
//       }
//     }
//   }

//   if (!found || taskKey(found) === taskKey(currentTask)) return null;
//   return found;
// }

// function resolvePredKeys(task, allTasks, maps) {
//   const m = maps || createRefMaps(allTasks);
//   const keys = [];
//   for (const tok of parsePredsRaw(task)) {
//     const pt = resolvePredTask(tok, task, allTasks, m);
//     if (pt) keys.push(taskKey(pt));
//   }
//   return [...new Set(keys)];
// }

// function computeCPM(tasks) {
//   const list = (tasks || []).map((t) => ({
//     ...t,
//     id: String(t.id ?? '').trim(),
//     zone: getZone(t),
//     duration: toNum(t.duration),
//     _key: taskKey(t),
//   }));
//   const map = {};
//   list.forEach((t) => {
//     map[t._key] = t;
//   });

//   const refMaps = createRefMaps(list);
//   const predKeysOf = {};
//   list.forEach((t) => {
//     predKeysOf[t._key] = resolvePredKeys(t, list, refMaps).filter((k) => map[k] && k !== t._key);
//   });

//   const successors = {};
//   list.forEach((t) => {
//     (predKeysOf[t._key] || []).forEach((pk) => {
//       if (!successors[pk]) successors[pk] = [];
//       successors[pk].push(t._key);
//     });
//   });

//   const order = [];
//   const done = new Set();
//   const stack = new Set();
//   function visit(k) {
//     if (done.has(k) || stack.has(k) || !map[k]) return;
//     stack.add(k);
//     (predKeysOf[k] || []).forEach(visit);
//     stack.delete(k);
//     done.add(k);
//     order.push(k);
//   }
//   list.forEach((t) => visit(t._key));

//   const ES = {};
//   const EF = {};
//   order.forEach((k) => {
//     const preds = predKeysOf[k] || [];
//     const es = preds.length ? Math.max(...preds.map((p) => EF[p] ?? 0)) : 0;
//     ES[k] = es;
//     EF[k] = es + toNum(map[k].duration);
//   });

//   const projectEnd = order.reduce((m, k) => Math.max(m, EF[k] ?? 0), 0);
//   const LS = {};
//   const LF = {};
//   [...order].reverse().forEach((k) => {
//     const succ = (successors[k] || []).filter((s) => map[s]);
//     const lf = succ.length ? Math.min(...succ.map((s) => LS[s] ?? projectEnd)) : projectEnd;
//     LF[k] = lf;
//     LS[k] = lf - toNum(map[k].duration);
//   });

//   const criticalKeys = new Set();
//   const floatOf = {};
//   order.forEach((k) => {
//     const fl = (LS[k] ?? 0) - (ES[k] ?? 0);
//     floatOf[k] = fl;
//     if (Math.abs(fl) < 1e-6) criticalKeys.add(k);
//   });

//   return { criticalKeys, ES, EF, LS, LF, floatOf, predKeysOf, projectEnd };
// }

// function isDescendant(rootTask, candidateTask, list) {
//   const rootK = taskKey(rootTask);
//   const candK = taskKey(candidateTask);
//   const refMaps = createRefMaps(list);
//   const predKeysOf = {};
//   list.forEach((t) => {
//     predKeysOf[taskKey(t)] = resolvePredKeys(t, list, refMaps);
//   });
//   const succ = {};
//   list.forEach((t) => {
//     const tk = taskKey(t);
//     (predKeysOf[tk] || []).forEach((p) => {
//       if (!succ[p]) succ[p] = [];
//       succ[p].push(tk);
//     });
//   });
//   const seen = new Set();
//   const q = [rootK];
//   while (q.length) {
//     const cur = q.shift();
//     for (const s of succ[cur] || []) {
//       if (seen.has(s)) continue;
//       seen.add(s);
//       if (s === candK) return true;
//       q.push(s);
//     }
//   }
//   return false;
// }

// function buildArrowPoints(x1, y1, x2, y2, stagger = 0) {
//   const gap = 12;
//   if (x2 >= x1 + gap * 2) {
//     const midX = x1 + Math.max((x2 - x1) / 2, gap) + stagger;
//     return { points: `${x1},${y1} ${midX},${y1} ${midX},${y2} ${x2},${y2}`, kind: 'forward' };
//   }
//   const midX = Math.max(x1, x2) + 18 + Math.abs(stagger);
//   return { points: `${x1},${y1} ${midX},${y1} ${midX},${y2} ${x2},${y2}`, kind: 'around' };
// }

// function EditableCell({ value, field, rowIndex, taskId, siteId, onSave, type = 'text', className = '' }) {
//   const [editing, setEditing] = useState(false);
//   const [editValue, setEditValue] = useState(value ?? '');
//   const inputRef = useRef(null);

//   useEffect(() => setEditValue(value ?? ''), [value]);
//   useEffect(() => {
//     if (editing && inputRef.current) {
//       inputRef.current.focus();
//       inputRef.current.select();
//     }
//   }, [editing]);

//   const save = async () => {
//     setEditing(false);
//     if (String(editValue) === String(value ?? '')) return;
//     try {
//       const res = await fetch('/api/msp-plan', {
//         method: 'PUT',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ siteId, rowIndex, field, value: editValue, taskId }),
//       });
//       const data = await res.json();
//       if (data.success) onSave();
//     } catch (e) {
//       console.error(e);
//     }
//   };

//   if (editing) {
//     return (
//       <input
//         ref={inputRef}
//         type={type}
//         value={editValue}
//         onChange={(e) => setEditValue(e.target.value)}
//         onBlur={save}
//         onKeyDown={(e) => {
//           if (e.key === 'Enter') save();
//           if (e.key === 'Escape') {
//             setEditValue(value ?? '');
//             setEditing(false);
//           }
//         }}
//         className={`w-full bg-blue-50 border border-blue-300 rounded px-1 py-0.5 text-[11px] outline-none ${className}`}
//       />
//     );
//   }

//   return (
//     <span
//       className={`cursor-pointer hover:bg-blue-50 rounded px-0.5 block truncate ${className}`}
//       onDoubleClick={() => setEditing(true)}
//       title="Double-click to edit"
//     >
//       {value || '—'}
//     </span>
//   );
// }

// function TaskModal({ mode, task, allTasks, siteId, onClose, onSaved }) {
//   const isEdit = mode === 'edit';
//   const editingKey = isEdit ? taskKey(task) : null;

//   const [zone, setZone] = useState(getZone(task) || '');
//   const [activity, setActivity] = useState(task?.activity || '');
//   const [subActivity, setSubActivity] = useState(task?.subActivity || '');
//   const [duration, setDuration] = useState(toNum(task?.duration) || 3);
//   const [resource, setResource] = useState(task?.resource || '');
//   const [selectedPredKeys, setSelectedPredKeys] = useState(() => resolvePredKeys(task || {}, allTasks));
//   const [busy, setBusy] = useState(false);
//   const [err, setErr] = useState('');

//   const otherTasks = useMemo(
//     () => allTasks.filter((t) => !editingKey || taskKey(t) !== editingKey),
//     [allTasks, editingKey]
//   );

//   const submit = async (e) => {
//     e.preventDefault();
//     setErr('');
//     if (!activity.trim()) return setErr('Activity is required');

//     setBusy(true);
//     try {
//       const z = zone.trim();
//       const precedenceStr = selectedPredKeys
//         .map((pk) => {
//           const pt = allTasks.find((t) => taskKey(t) === pk);
//           return pt ? taskUID(pt) : null;
//         })
//         .filter(Boolean)
//         .join(',');

//       const base = {
//         siteId,
//         zone: z,
//         activity: activity.trim(),
//         subActivity: subActivity.trim(),
//         duration: String(toNum(duration)),
//         resource: resource.trim(),
//         precedence: precedenceStr,
//       };

//       if (isEdit) {
//         await fetch('/api/msp-plan', {
//           method: 'PUT',
//           headers: { 'Content-Type': 'application/json' },
//           body: JSON.stringify({
//             siteId,
//             rowIndex: task.rowIndex,
//             taskId: task.id,
//             bulk: base,
//           }),
//         });
//       } else {
//         await fetch('/api/msp-plan', {
//           method: 'POST',
//           headers: { 'Content-Type': 'application/json' },
//           body: JSON.stringify(base),
//         });
//       }
//       onSaved();
//       onClose();
//     } catch {
//       setErr('Server error');
//     } finally {
//       setBusy(false);
//     }
//   };

//   return (
//     <div
//       className="fixed inset-0 z-[100] flex items-center justify-center p-3 no-print"
//       style={{ background: 'rgba(15,23,42,0.55)' }}
//       onClick={(e) => e.target === e.currentTarget && onClose()}
//     >
//       <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
//         <div className="px-5 py-4 border-b flex justify-between items-center bg-slate-50">
//           <h2 className="text-lg font-semibold">{isEdit ? 'Edit Task' : 'Add Task'}</h2>
//           <button type="button" onClick={onClose} className="w-9 h-9 border rounded-lg">
//             ✕
//           </button>
//         </div>
//         <form onSubmit={submit} className="px-5 py-5 space-y-4 overflow-y-auto">
//           {err && <div className="text-sm bg-red-50 text-red-600 px-3 py-2 rounded-lg">{err}</div>}
//           <div className="grid grid-cols-2 gap-3">
//             <div>
//               <label className="label">Zone / UID</label>
//               <input className="input-field" value={zone} onChange={(e) => setZone(e.target.value)} />
//             </div>
//             <div>
//               <label className="label">Activity *</label>
//               <input className="input-field" required value={activity} onChange={(e) => setActivity(e.target.value)} />
//             </div>
//             <div>
//               <label className="label">Sub Activity</label>
//               <input className="input-field" value={subActivity} onChange={(e) => setSubActivity(e.target.value)} />
//             </div>
//             <div>
//               <label className="label">Duration</label>
//               <input
//                 className="input-field"
//                 type="number"
//                 min="0"
//                 value={duration}
//                 onChange={(e) => setDuration(e.target.value)}
//               />
//             </div>
//             <div className="col-span-2">
//               <label className="label">Resource</label>
//               <input className="input-field" value={resource} onChange={(e) => setResource(e.target.value)} />
//             </div>
//           </div>
//           <div>
//             <label className="label">Predecessors</label>
//             <div className="border rounded-lg max-h-48 overflow-y-auto">
//               {otherTasks.map((t) => {
//                 const k = taskKey(t);
//                 const checked = selectedPredKeys.includes(k);
//                 const blocked = isEdit ? isDescendant(task, t, allTasks) : false;
//                 return (
//                   <label
//                     key={k}
//                     className={`flex gap-2 px-3 py-2 text-xs border-b ${blocked ? 'opacity-40' : 'hover:bg-blue-50 cursor-pointer'}`}
//                   >
//                     <input
//                       type="checkbox"
//                       disabled={blocked}
//                       checked={checked}
//                       onChange={() =>
//                         setSelectedPredKeys((prev) =>
//                           prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]
//                         )
//                       }
//                     />
//                     <span className="truncate">
//                       <b>{t.id}</b> <span className="text-teal-700 font-medium">[{getZone(t)}]</span> —{' '}
//                       {t.subActivity || t.activity}
//                     </span>
//                   </label>
//                 );
//               })}
//             </div>
//           </div>
//           <div className="flex justify-end gap-2">
//             <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg text-sm">
//               Cancel
//             </button>
//             <button type="submit" disabled={busy} className="btn-primary px-5 py-2">
//               {busy ? 'Saving...' : isEdit ? 'Save' : 'Add'}
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }

// export default function MspPlanPage() {
//   const [sites, setSites] = useState([]);
//   const [selectedSite, setSelectedSite] = useState('');
//   const [tasks, setTasks] = useState([]);
//   const [minDate, setMinDate] = useState(null);
//   const [maxDate, setMaxDate] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');
//   const [dayWidth, setDayWidth] = useState(12);
//   const [rowHeight, setRowHeight] = useState(36);
//   const [modalState, setModalState] = useState(null);
//   const [searchText, setSearchText] = useState('');
//   const [linkMode, setLinkMode] = useState('critical');
//   const [zoneFilter, setZoneFilter] = useState(''); // ★ Zone filter restored

//   useEffect(() => {
//     fetch('/api/sites')
//       .then((r) => r.json())
//       .then((d) => {
//         if (d.success) setSites(d.sites || []);
//       })
//       .catch(() => {});
//   }, []);

//   const loadMsp = useCallback(() => {
//     if (!selectedSite) {
//       setTasks([]);
//       setMinDate(null);
//       setMaxDate(null);
//       return;
//     }
//     setLoading(true);
//     setError('');
//     setZoneFilter('');
//     fetch(`/api/msp-plan?siteId=${encodeURIComponent(selectedSite)}`)
//       .then((r) => r.json())
//       .then((d) => {
//         if (d.success) {
//           const normalized = (d.tasks || []).map((t, idx) => ({
//             ...t,
//             id: String(t.id ?? '').trim(),
//             zone: getZone(t),
//             duration: toNum(t.duration),
//             rowIndex: t.rowIndex ?? t.row ?? idx,
//           }));
//           setTasks(normalized);

//           let mn = d.minDate ? new Date(d.minDate) : null;
//           let mx = d.maxDate ? new Date(d.maxDate) : null;
//           if (!mn || !mx) {
//             normalized.forEach((t) => {
//               const s = parseISO(t.startObj) || parseISO(t.startDate);
//               const e = parseISO(t.endObj) || parseISO(t.endDate);
//               if (s && (!mn || s < mn)) mn = s;
//               if (e && (!mx || e > mx)) mx = e;
//             });
//           }
//           setMinDate(mn);
//           setMaxDate(mx);
//         } else {
//           setError(d.message || 'Failed');
//           setTasks([]);
//         }
//         setLoading(false);
//       })
//       .catch(() => {
//         setError('Server error');
//         setLoading(false);
//       });
//   }, [selectedSite]);

//   useEffect(() => {
//     loadMsp();
//   }, [loadMsp]);

//   // ★ All unique zones — same as before
//   const allZones = useMemo(() => {
//     const z = new Set();
//     tasks.forEach((t) => {
//       const g = getZone(t);
//       if (g) z.add(g);
//     });
//     return [...z].sort();
//   }, [tasks]);

//   const filteredTasks = useMemo(() => {
//     let list = tasks;
//     // ★ Zone filter — same logic as before
//     if (zoneFilter) {
//       const zf = norm(zoneFilter);
//       list = list.filter((t) => norm(getZone(t)) === zf);
//     }
//     if (searchText.trim()) {
//       const q = searchText.toLowerCase();
//       list = list.filter(
//         (t) =>
//           (t.id || '').toLowerCase().includes(q) ||
//           (t.zone || '').toLowerCase().includes(q) ||
//           (t.activity || '').toLowerCase().includes(q) ||
//           (t.subActivity || '').toLowerCase().includes(q) ||
//           (t.resource || '').toLowerCase().includes(q) ||
//           (t.precedenceRaw || '').toLowerCase().includes(q)
//       );
//     }
//     return list;
//   }, [tasks, searchText, zoneFilter]);

//   // Combined CPM on full project (all zones)
//   const cpmFull = useMemo(() => computeCPM(tasks), [tasks]);

//   const displayRows = useMemo(() => {
//     if (!filteredTasks.length) return [];
//     const { criticalKeys, ES, EF, floatOf } = cpmFull;
//     const refMaps = createRefMaps(tasks);

//     return filteredTasks.map((c) => {
//       const key = taskKey(c);
//       const s = parseISO(c.startObj) || parseISO(c.startDate);
//       const e = parseISO(c.endObj) || parseISO(c.endDate);
//       const predKeys = resolvePredKeys(c, tasks, refMaps);
//       return {
//         ...c,
//         _key: key,
//         id: String(c.id).trim(),
//         zone: getZone(c),
//         duration: toNum(c.duration),
//         predKeys,
//         predecessors: predKeys.map((pk) => {
//           const pt = tasks.find((t) => taskKey(t) === pk);
//           return pt ? String(pt.id).trim() : pk;
//         }),
//         type: 'task',
//         isCritical: criticalKeys.has(key),
//         es: ES[key] ?? 0,
//         ef: EF[key] ?? toNum(c.duration),
//         float: floatOf[key] ?? 0,
//         startObj: s ? s.toISOString() : c.startObj,
//         endObj: e ? e.toISOString() : c.endObj,
//         startDate: c.startDate || (s ? s.toLocaleDateString('en-GB') : ''),
//         endDate: c.endDate || (e ? e.toLocaleDateString('en-GB') : ''),
//         precedenceRaw: c.precedenceRaw || (Array.isArray(c.predecessors) ? c.predecessors.join(',') : c.precedence || ''),
//         resource: c.resource || '',
//       };
//     });
//   }, [filteredTasks, tasks, cpmFull]);

//   const { timelineHeaders, totalDays, timelineStart, bars } = useMemo(() => {
//     if (!minDate || !maxDate) return { timelineHeaders: [], totalDays: 0, timelineStart: null, bars: [] };

//     const tStart = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
//     const tEnd = new Date(maxDate.getFullYear(), maxDate.getMonth() + 1, 10);
//     const total = Math.max(dayDiff(tStart, tEnd), 20);

//     const months = [];
//     let cur = new Date(tStart);
//     while (cur < tEnd) {
//       const next = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
//       months.push({
//         label: cur.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
//         width: dayDiff(cur, next) * dayWidth,
//       });
//       cur = next;
//     }

//     const barList = displayRows
//       .map((row, index) => {
//         const s = parseISO(row.startObj) || parseISO(row.startDate);
//         const e = parseISO(row.endObj) || parseISO(row.endDate);
//         if (!s) return null;
//         const left = dayDiff(tStart, s) * dayWidth;
//         const width = Math.max((dayDiff(s, e || s) + 1) * dayWidth, Math.max(dayWidth, 12));
//         return {
//           ...row,
//           index,
//           left,
//           width,
//           top: index * rowHeight,
//           centerY: index * rowHeight + rowHeight / 2,
//         };
//       })
//       .filter(Boolean);

//     return { timelineHeaders: months, totalDays: total, timelineStart: tStart, bars: barList };
//   }, [displayRows, minDate, maxDate, dayWidth, rowHeight]);

//   const arrows = useMemo(() => {
//     if (linkMode === 'none') return [];
//     const byKey = new Map();
//     bars.forEach((b) => {
//       if (b._key) byKey.set(b._key, b);
//     });

//     const lines = [];
//     let staggerIdx = 0;

//     bars.forEach((b) => {
//       (b.predKeys || []).forEach((pk) => {
//         const p = byKey.get(pk);
//         if (!p) return;

//         const x1 = p.left + p.width;
//         const y1 = p.centerY;
//         const x2 = b.left;
//         const y2 = b.centerY;
//         if ([x1, y1, x2, y2].some((n) => Number.isNaN(n))) return;

//         const isDriving = Math.abs((p.ef ?? 0) - (b.es ?? 0)) < 1e-6;
//         const isCritLink = !!(p.isCritical && b.isCritical && isDriving);
//         if (linkMode === 'critical' && !isCritLink) return;

//         const stagger = ((staggerIdx++ % 7) - 3) * 4;
//         const { points, kind } = buildArrowPoints(x1, y1, x2, y2, stagger);
//         const veryLong = Math.abs(x2 - x1) > dayWidth * 90;

//         lines.push({
//           id: `${p._key}->${b._key}`,
//           points,
//           critical: isCritLink,
//           dashed: kind === 'around' || veryLong,
//           opacity: isCritLink ? 0.95 : linkMode === 'all' ? (veryLong ? 0.25 : 0.4) : 0.9,
//         });
//       });
//     });

//     return lines;
//   }, [bars, linkMode, dayWidth]);

//   const chartH = displayRows.length * rowHeight;
//   const chartW = Math.max(totalDays * dayWidth, 600);
//   const barBoxH = Math.max(rowHeight - 16, 10);

//   let todayLeft = null;
//   if (timelineStart) {
//     const t = dayDiff(timelineStart, new Date());
//     if (t >= 0 && t <= totalDays) todayLeft = t * dayWidth;
//   }

//   const openAdd = () => {
//     if (!selectedSite) return setError('Pehle site select karo');
//     setModalState({ mode: 'add', task: null });
//   };

//   const openEdit = (row) => {
//     const real = tasks.find((t) => taskKey(t) === (row._key || taskKey(row)));
//     if (real) setModalState({ mode: 'edit', task: real });
//   };

//   const stats = useMemo(() => {
//     const criticalCount = displayRows.filter((r) => r.isCritical).length;
//     const linkTotal = displayRows.reduce((n, r) => n + (r.predKeys?.length || 0), 0);
//     return {
//       total: tasks.length,
//       shown: displayRows.length,
//       zones: allZones.length,
//       criticalCount,
//       activities: new Set(displayRows.map((t) => t.activity)).size,
//       totalDuration: displayRows.reduce((s, t) => s + toNum(t.duration), 0),
//       arrowsShown: arrows.length,
//       linkTotal,
//     };
//   }, [tasks, displayRows, arrows.length, allZones.length]);

//   return (
//     <div className="w-full max-w-none msp-print-root">
//       {/* HEADER */}
//       <div className="mb-4 flex flex-col lg:flex-row lg:items-end justify-between gap-4 no-print">
//         <div>
//           <p className="text-xs font-semibold uppercase tracking-wider mb-1 text-teal-700">
//             Construction Project Scheduler
//           </p>
//           <h1 className="text-2xl font-semibold">MSP Project Plan</h1>
//           <p className="text-sm mt-1 text-gray-500">Cross-zone Smart Links · Combined CPM · Gantt</p>
//         </div>
//         <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
//           <div className="w-full sm:w-64">
//             <label className="label">Select Site</label>
//             <select
//               className="input-field"
//               value={selectedSite}
//               onChange={(e) => setSelectedSite(e.target.value)}
//             >
//               <option value="">-- Choose site --</option>
//               {sites.map((s) => (
//                 <option key={s.id} value={s.id}>
//                   {s.name}
//                 </option>
//               ))}
//             </select>
//           </div>
//           <button
//             type="button"
//             onClick={openAdd}
//             disabled={!selectedSite}
//             className="btn-primary px-5 py-2.5 h-[42px] disabled:opacity-50"
//           >
//             + Add Task
//           </button>
//         </div>
//       </div>

//       {/* STATS */}
//       {!loading && tasks.length > 0 && (
//         <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 mb-4 no-print">
//           {[
//             { label: 'Total Tasks', value: stats.total, color: '#3b82f6' },
//             { label: 'Zones', value: stats.zones, color: '#6366f1' },
//             { label: 'Critical Tasks', value: stats.criticalCount, color: '#ef4444' },
//             { label: 'Duration', value: `${stats.totalDuration}d`, color: '#f59e0b' },
//             { label: 'Links shown', value: stats.arrowsShown, color: '#0d9488' },
//             { label: 'Total Links', value: stats.linkTotal, color: '#64748b' },
//           ].map((s) => (
//             <div key={s.label} className="rounded-xl border p-3 bg-white">
//               <div className="text-[10px] font-semibold uppercase text-gray-500">{s.label}</div>
//               <p className="text-xl font-bold" style={{ color: s.color }}>
//                 {s.value}
//               </p>
//             </div>
//           ))}
//         </div>
//       )}

//       {/* ★ TOOLBAR — Zone filter same as before + Links + Zoom */}
//       {!loading && displayRows.length > 0 && (
//         <div className="mb-3 flex flex-wrap items-center gap-3 px-4 py-2.5 rounded-xl border bg-white no-print">
//           <input
//             type="text"
//             placeholder="Search..."
//             value={searchText}
//             onChange={(e) => setSearchText(e.target.value)}
//             className="text-sm border rounded-lg px-3 py-1.5 w-36"
//           />

//           {/* ★ ZONE FILTER — pehle jaisa same to same */}
//           {allZones.length > 0 && (
//             <>
//               <div className="w-px self-stretch bg-gray-200" />
//               <div className="flex items-center gap-1 flex-wrap">
//                 <span className="text-xs font-semibold text-gray-500">Zone</span>
//                 <button
//                   type="button"
//                   onClick={() => setZoneFilter('')}
//                   className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border"
//                   style={{
//                     borderColor: !zoneFilter ? '#0f766e' : '#e2e8f0',
//                     background: !zoneFilter ? '#ccfbf1' : 'transparent',
//                     color: !zoneFilter ? '#0f766e' : '#64748b',
//                   }}
//                 >
//                   All
//                 </button>
//                 {allZones.map((z) => (
//                   <button
//                     key={z}
//                     type="button"
//                     onClick={() => setZoneFilter(z)}
//                     className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border"
//                     style={{
//                       borderColor: zoneFilter === z ? '#0f766e' : '#e2e8f0',
//                       background: zoneFilter === z ? '#ccfbf1' : 'transparent',
//                       color: zoneFilter === z ? '#0f766e' : '#64748b',
//                     }}
//                   >
//                     {z}
//                   </button>
//                 ))}
//               </div>
//             </>
//           )}

//           <div className="w-px self-stretch bg-gray-200" />

//           <div className="flex items-center gap-1">
//             <span className="text-xs font-semibold text-gray-500 mr-1">Links</span>
//             {[
//               { id: 'critical', label: 'Critical' },
//               { id: 'all', label: 'All' },
//               { id: 'none', label: 'Hide' },
//             ].map((m) => (
//               <button
//                 key={m.id}
//                 type="button"
//                 onClick={() => setLinkMode(m.id)}
//                 className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border"
//                 style={{
//                   borderColor: linkMode === m.id ? '#0f766e' : '#e2e8f0',
//                   background: linkMode === m.id ? '#ccfbf1' : 'transparent',
//                   color: linkMode === m.id ? '#0f766e' : '#64748b',
//                 }}
//               >
//                 {m.label}
//               </button>
//             ))}
//           </div>

//           <div className="w-px self-stretch bg-gray-200" />

//           <div className="flex items-center gap-2">
//             <span className="text-xs text-gray-500">Timeline</span>
//             <input
//               type="range"
//               min={4}
//               max={48}
//               value={dayWidth}
//               onChange={(e) => setDayWidth(+e.target.value)}
//               className="w-28"
//             />
//           </div>
//           <div className="flex items-center gap-2">
//             <span className="text-xs text-gray-500">Rows</span>
//             <input
//               type="range"
//               min={22}
//               max={60}
//               value={rowHeight}
//               onChange={(e) => setRowHeight(+e.target.value)}
//               className="w-28"
//             />
//           </div>

//           <button
//             type="button"
//             onClick={() => window.print()}
//             className="ml-auto text-xs font-semibold px-3 py-1.5 rounded-lg text-white bg-teal-700"
//           >
//             Print
//           </button>
//         </div>
//       )}

//       {error && (
//         <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm no-print">{error}</div>
//       )}

//       <div className="card overflow-hidden bg-white rounded-xl border">
//         {!selectedSite && !loading && (
//           <div className="p-12 text-center text-gray-500">Select a Site</div>
//         )}
//         {loading && <div className="p-12 text-center text-gray-500">Loading...</div>}
//         {!loading && selectedSite && !displayRows.length && (
//           <div className="p-12 text-center text-gray-500">No Tasks</div>
//         )}

//         {!loading && displayRows.length > 0 && (
//           <div className="overflow-auto" style={{ maxHeight: '72vh' }}>
//             <div style={{ width: LEFT_W + chartW, minWidth: '100%', position: 'relative' }}>
//               {/* HEADER */}
//               <div className="flex sticky top-0 z-40" style={{ height: HEADER_HEIGHT }}>
//                 <div
//                   className="sticky left-0 z-50 shrink-0 grid gap-1 px-2 items-center text-[10px] font-bold uppercase text-white"
//                   style={{
//                     width: LEFT_W,
//                     background: '#115e59',
//                     gridTemplateColumns: '30px 45px 60px 80px 80px 35px 65px 65px 90px 80px 30px',
//                   }}
//                 >
//                   <div>#</div>
//                   <div>ID</div>
//                   <div>Zone</div>
//                   <div>Activity</div>
//                   <div>Sub Act</div>
//                   <div>Dur</div>
//                   <div>Start</div>
//                   <div>End</div>
//                   <div>Pred</div>
//                   <div>Res</div>
//                   <div>⚙</div>
//                 </div>
//                 <div className="flex shrink-0" style={{ width: chartW, background: '#115e59' }}>
//                   {timelineHeaders.map((m, i) => (
//                     <div
//                       key={i}
//                       className="flex items-center justify-center text-white text-xs font-semibold border-r border-white/20 shrink-0"
//                       style={{ width: m.width, minWidth: m.width }}
//                     >
//                       {m.label}
//                     </div>
//                   ))}
//                 </div>
//               </div>

//               {/* BODY */}
//               {displayRows.map((row, i) => {
//                 const rowBg = i % 2 === 0 ? '#fff' : '#fafafa';
//                 return (
//                   <div key={`${row._key}-${i}`} className="flex group" style={{ height: rowHeight }}>
//                     {/* z-30 so Edit is clickable above chart overlay */}
//                     <div
//                       className="sticky left-0 z-30 shrink-0 grid gap-1 px-2 items-center text-[11px] border-r border-b"
//                       style={{
//                         width: LEFT_W,
//                         borderColor: '#e2e8f0',
//                         background: rowBg,
//                         gridTemplateColumns: '30px 45px 60px 80px 80px 35px 65px 65px 90px 80px 30px',
//                       }}
//                     >
//                       <div className="text-[10px] text-gray-400">{i + 1}</div>
//                       <div
//                         className="truncate font-semibold"
//                         style={{ color: row.isCritical ? '#dc2626' : '#0f766e' }}
//                       >
//                         {row.id}
//                       </div>
//                       <div className="truncate">
//                         <EditableCell
//                           value={row.zone || ''}
//                           field="zone"
//                           rowIndex={row.rowIndex}
//                           taskId={row.id}
//                           siteId={selectedSite}
//                           onSave={loadMsp}
//                         />
//                       </div>
//                       <div className="truncate">
//                         <EditableCell
//                           value={row.activity}
//                           field="activity"
//                           rowIndex={row.rowIndex}
//                           taskId={row.id}
//                           siteId={selectedSite}
//                           onSave={loadMsp}
//                         />
//                       </div>
//                       <div className="truncate">
//                         <EditableCell
//                           value={row.subActivity}
//                           field="subActivity"
//                           rowIndex={row.rowIndex}
//                           taskId={row.id}
//                           siteId={selectedSite}
//                           onSave={loadMsp}
//                         />
//                       </div>
//                       <div>
//                         <EditableCell
//                           value={String(row.duration || 0)}
//                           field="duration"
//                           rowIndex={row.rowIndex}
//                           taskId={row.id}
//                           siteId={selectedSite}
//                           onSave={loadMsp}
//                           type="number"
//                         />
//                       </div>
//                       <div className="text-[10px] text-gray-500 truncate">
//                         <EditableCell
//                           value={row.startDate}
//                           field="startDate"
//                           rowIndex={row.rowIndex}
//                           taskId={row.id}
//                           siteId={selectedSite}
//                           onSave={loadMsp}
//                         />
//                       </div>
//                       <div className="text-[10px] text-gray-500 truncate">{row.endDate || '—'}</div>
//                       {/* E column = Pred */}
//                       <div className="truncate text-[9px] text-gray-500" title={row.precedenceRaw}>
//                         <EditableCell
//                           value={row.precedenceRaw || ''}
//                           field="precedenceRaw"
//                           rowIndex={row.rowIndex}
//                           taskId={row.id}
//                           siteId={selectedSite}
//                           onSave={loadMsp}
//                         />
//                       </div>
//                       {/* I column = Res */}
//                       <div className="truncate text-[10px] text-gray-600">
//                         <EditableCell
//                           value={row.resource || ''}
//                           field="resource"
//                           rowIndex={row.rowIndex}
//                           taskId={row.id}
//                           siteId={selectedSite}
//                           onSave={loadMsp}
//                         />
//                       </div>
//                       {/* Edit only — no delete */}
//                       <div className="flex justify-center">
//                         <button
//                           type="button"
//                           onClick={() => openEdit(row)}
//                           className="opacity-0 group-hover:opacity-100 w-5 h-5 text-blue-600 hover:bg-blue-100 rounded"
//                           title="Edit"
//                         >
//                           ✎
//                         </button>
//                       </div>
//                     </div>
//                     <div
//                       className="shrink-0 border-b"
//                       style={{ width: chartW, background: rowBg, borderColor: '#e2e8f0' }}
//                     />
//                   </div>
//                 );
//               })}

//               {/* CHART */}
//               <div
//                 className="absolute pointer-events-none"
//                 style={{ left: LEFT_W, top: HEADER_HEIGHT, width: chartW, height: chartH }}
//               >
//                 <div className="absolute inset-0 flex">
//                   {timelineHeaders.map((m, i) => (
//                     <div key={i} style={{ width: m.width, borderRight: '1px solid #e2e8f0' }} />
//                   ))}
//                 </div>

//                 {todayLeft != null && (
//                   <div
//                     className="absolute top-0 bottom-0 z-20"
//                     style={{ left: todayLeft, width: 2, background: '#ef4444' }}
//                   >
//                     <span className="absolute left-1/2 -translate-x-1/2 text-[9px] font-bold text-white px-1 rounded bg-red-500">
//                       TODAY
//                     </span>
//                   </div>
//                 )}

//                 <svg
//                   className="absolute inset-0 z-10"
//                   width={chartW}
//                   height={chartH}
//                   style={{ overflow: 'visible' }}
//                 >
//                   <defs>
//                     <marker
//                       id="arrG"
//                       viewBox="0 0 10 10"
//                       refX="9"
//                       refY="5"
//                       markerWidth="6"
//                       markerHeight="6"
//                       orient="auto-start-reverse"
//                     >
//                       <path d="M0,0 L10,5 L0,10 z" fill="#94a3b8" />
//                     </marker>
//                     <marker
//                       id="arrR"
//                       viewBox="0 0 10 10"
//                       refX="9"
//                       refY="5"
//                       markerWidth="6"
//                       markerHeight="6"
//                       orient="auto-start-reverse"
//                     >
//                       <path d="M0,0 L10,5 L0,10 z" fill="#dc2626" />
//                     </marker>
//                   </defs>
//                   {arrows.map((a, idx) => (
//                     <polyline
//                       key={`${a.id}-${idx}`}
//                       points={a.points}
//                       fill="none"
//                       stroke={a.critical ? '#dc2626' : '#94a3b8'}
//                       strokeWidth={a.critical ? 2 : 1.25}
//                       strokeDasharray={a.dashed ? '6 4' : undefined}
//                       markerEnd={a.critical ? 'url(#arrR)' : 'url(#arrG)'}
//                       opacity={a.opacity}
//                     />
//                   ))}
//                 </svg>

//                 <div className="absolute inset-0 z-20" style={{ pointerEvents: 'auto' }}>
//                   {bars.map((b) => (
//                     <div
//                       key={`${b._key}-${b.index}`}
//                       className="absolute rounded-sm flex items-center px-1.5 text-[10px] font-semibold text-white shadow-sm cursor-pointer hover:brightness-110"
//                       onClick={() => openEdit(b)}
//                       style={{
//                         left: b.left,
//                         top: b.top + (rowHeight - barBoxH) / 2,
//                         width: Math.max(b.width, 12),
//                         height: barBoxH,
//                         background: b.isCritical
//                           ? 'linear-gradient(180deg, #f87171 0%, #dc2626 100%)'
//                           : 'linear-gradient(180deg, #5eead4 0%, #0d9488 100%)',
//                         overflow: 'hidden',
//                       }}
//                       title={`${b.id} | ${b.zone}\n${b.subActivity || ''}\nPred: ${b.precedenceRaw || '—'}`}
//                     >
//                       <span className="truncate">{b.subActivity || b.id}</span>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}
//       </div>

//       {!loading && displayRows.length > 0 && (
//         <div className="mt-3 flex flex-wrap gap-4 px-4 py-2 rounded-xl border bg-white text-[11px] no-print">
//           <span className="font-semibold text-gray-500">Legend:</span>
//           <span className="flex items-center gap-1.5">
//             <span
//               className="w-5 h-3 rounded-sm"
//               style={{ background: 'linear-gradient(180deg,#5eead4,#0d9488)' }}
//             />{' '}
//             Normal
//           </span>
//           <span className="flex items-center gap-1.5">
//             <span
//               className="w-5 h-3 rounded-sm"
//               style={{ background: 'linear-gradient(180deg,#f87171,#dc2626)' }}
//             />{' '}
//             Critical
//           </span>
//           <span className="text-gray-500">
//             Zone filter: {zoneFilter || 'All'} · Links: {linkMode}
//           </span>
//           <span className="ml-auto text-gray-400">
//             Showing {stats.shown}/{stats.total} · Critical {stats.criticalCount} · Arrows{' '}
//             {stats.arrowsShown}
//           </span>
//         </div>
//       )}

//       {modalState && (
//         <TaskModal
//           mode={modalState.mode}
//           task={modalState.task}
//           allTasks={tasks}
//           siteId={selectedSite}
//           onClose={() => setModalState(null)}
//           onSaved={loadMsp}
//         />
//       )}
//     </div>
//   );
// }






// app/dashboard/msp-plan/page.js

'use client';

import { useEffect, useState, useMemo, useCallback, useRef } from 'react';

const HEADER_HEIGHT = 56;
const LEFT_W = 710;

function dayDiff(a, b) {
  return Math.round((b - a) / 86400000);
}

function parseISO(d) {
  if (!d) return null;
  if (d instanceof Date) return Number.isNaN(d.getTime()) ? null : d;
  const s = String(d).trim();
  if (!s) return null;
  const dmy = /^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/.exec(s);
  if (dmy) {
    const dt = new Date(+dmy[3], +dmy[2] - 1, +dmy[1]);
    return Number.isNaN(dt.getTime()) ? null : dt;
  }
  const ymd = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(s);
  if (ymd) {
    const dt = new Date(+ymd[1], +ymd[2] - 1, +ymd[3]);
    return Number.isNaN(dt.getTime()) ? null : dt;
  }
  const x = new Date(s);
  return Number.isNaN(x.getTime()) ? null : x;
}

function toISODate(d) {
  const dt = d instanceof Date ? d : parseISO(d);
  if (!dt) return '';
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
}

function toNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function norm(s) {
  return String(s ?? '')
    .trim()
    .toUpperCase();
}

function getZone(t) {
  return String(t?.zone ?? t?.uid ?? t?.UID ?? '').trim();
}

function taskKey(t) {
  return `${String(t?.id ?? '').trim()}::${getZone(t)}`.toUpperCase();
}

function taskUID(t) {
  return `${String(t?.id ?? '').trim()}${getZone(t)}`;
}

function parsePredsRaw(task) {
  if (!task) return [];
  const val = task.precedenceRaw ?? task.predecessors ?? task.precedence ?? '';
  let raw = [];
  if (Array.isArray(val)) raw = val;
  else if (typeof val === 'string') raw = val.split(/[,;|]+/);
  else if (typeof val === 'number') raw = [String(val)];
  return raw
    .map((p) => (p && typeof p === 'object' ? String(p.id || p.uid || p.value || '') : String(p ?? '')))
    .map((p) => p.trim())
    .filter(Boolean);
}

function createRefMaps(items) {
  const byUID = new Map();
  const byZoneId = new Map();
  const idCounts = new Map();

  (items || []).forEach((item) => {
    if (!item) return;
    const id = String(item.id ?? '').trim();
    if (!id) return;
    const z = getZone(item);
    const idU = norm(id);
    const zU = norm(z);
    const uid = norm(id + z);

    byUID.set(uid, item);
    byUID.set(norm(`${id}-${z}`), item);
    byUID.set(norm(`${id}_${z}`), item);
    if (zU) {
      byZoneId.set(`${zU}::${idU}`, item);
      byUID.set(norm(`${z}${id}`), item);
    }
    idCounts.set(idU, (idCounts.get(idU) || 0) + 1);
  });

  const byUniqueId = new Map();
  (items || []).forEach((item) => {
    const idU = norm(item?.id);
    if (idU && idCounts.get(idU) === 1) byUniqueId.set(idU, item);
  });

  return { byUID, byZoneId, byUniqueId };
}

function resolvePredTask(token, currentTask, allTasks, maps) {
  if (!token || !currentTask) return null;
  const tU = norm(token);
  if (!tU) return null;
  const curZoneU = norm(getZone(currentTask));
  const { byUID, byZoneId, byUniqueId } = maps;

  let found = byUID.get(tU) || null;
  if (!found && curZoneU) found = byZoneId.get(`${curZoneU}::${tU}`) || null;
  if (!found) found = byUniqueId.get(tU) || null;

  if (!found) {
    const sorted = [...allTasks].sort(
      (a, b) => String(b.id || '').length - String(a.id || '').length
    );
    for (const cand of sorted) {
      const idU = norm(cand.id);
      const zU = norm(getZone(cand));
      if (!idU) continue;
      if (tU === `${idU}${zU}` || tU === `${idU}-${zU}` || tU === `${idU}_${zU}`) {
        found = cand;
        break;
      }
      if (tU.startsWith(idU) && tU.slice(idU.length) === zU) {
        found = cand;
        break;
      }
    }
  }

  if (!found || taskKey(found) === taskKey(currentTask)) return null;
  return found;
}

function resolvePredKeys(task, allTasks, maps) {
  const m = maps || createRefMaps(allTasks);
  const keys = [];
  for (const tok of parsePredsRaw(task)) {
    const pt = resolvePredTask(tok, task, allTasks, m);
    if (pt) keys.push(taskKey(pt));
  }
  return [...new Set(keys)];
}

function computeCPM(tasks) {
  const list = (tasks || []).map((t) => ({
    ...t,
    id: String(t.id ?? '').trim(),
    zone: getZone(t),
    duration: toNum(t.duration),
    _key: taskKey(t),
  }));
  const map = {};
  list.forEach((t) => {
    map[t._key] = t;
  });

  const refMaps = createRefMaps(list);
  const predKeysOf = {};
  list.forEach((t) => {
    predKeysOf[t._key] = resolvePredKeys(t, list, refMaps).filter((k) => map[k] && k !== t._key);
  });

  const successors = {};
  list.forEach((t) => {
    (predKeysOf[t._key] || []).forEach((pk) => {
      if (!successors[pk]) successors[pk] = [];
      successors[pk].push(t._key);
    });
  });

  const order = [];
  const done = new Set();
  const stack = new Set();
  function visit(k) {
    if (done.has(k) || stack.has(k) || !map[k]) return;
    stack.add(k);
    (predKeysOf[k] || []).forEach(visit);
    stack.delete(k);
    done.add(k);
    order.push(k);
  }
  list.forEach((t) => visit(t._key));

  const ES = {};
  const EF = {};
  order.forEach((k) => {
    const preds = predKeysOf[k] || [];
    const es = preds.length ? Math.max(...preds.map((p) => EF[p] ?? 0)) : 0;
    ES[k] = es;
    EF[k] = es + toNum(map[k].duration);
  });

  const projectEnd = order.reduce((m, k) => Math.max(m, EF[k] ?? 0), 0);
  const LS = {};
  const LF = {};
  [...order].reverse().forEach((k) => {
    const succ = (successors[k] || []).filter((s) => map[s]);
    const lf = succ.length ? Math.min(...succ.map((s) => LS[s] ?? projectEnd)) : projectEnd;
    LF[k] = lf;
    LS[k] = lf - toNum(map[k].duration);
  });

  const criticalKeys = new Set();
  const floatOf = {};
  order.forEach((k) => {
    const fl = (LS[k] ?? 0) - (ES[k] ?? 0);
    floatOf[k] = fl;
    if (Math.abs(fl) < 1e-6) criticalKeys.add(k);
  });

  return { criticalKeys, ES, EF, floatOf, predKeysOf };
}

function isDescendant(rootTask, candidateTask, list) {
  const rootK = taskKey(rootTask);
  const candK = taskKey(candidateTask);
  const refMaps = createRefMaps(list);
  const predKeysOf = {};
  list.forEach((t) => {
    predKeysOf[taskKey(t)] = resolvePredKeys(t, list, refMaps);
  });
  const succ = {};
  list.forEach((t) => {
    const tk = taskKey(t);
    (predKeysOf[tk] || []).forEach((p) => {
      if (!succ[p]) succ[p] = [];
      succ[p].push(tk);
    });
  });
  const seen = new Set();
  const q = [rootK];
  while (q.length) {
    const cur = q.shift();
    for (const s of succ[cur] || []) {
      if (seen.has(s)) continue;
      seen.add(s);
      if (s === candK) return true;
      q.push(s);
    }
  }
  return false;
}

function buildArrowPoints(x1, y1, x2, y2, stagger = 0) {
  const gap = 12;
  if (x2 >= x1 + gap * 2) {
    const midX = x1 + Math.max((x2 - x1) / 2, gap) + stagger;
    return { points: `${x1},${y1} ${midX},${y1} ${midX},${y2} ${x2},${y2}`, kind: 'forward' };
  }
  const midX = Math.max(x1, x2) + 18 + Math.abs(stagger);
  return { points: `${x1},${y1} ${midX},${y1} ${midX},${y2} ${x2},${y2}`, kind: 'around' };
}

// ========== Editable cell ==========
function EditableCell({ value, field, rowIndex, taskId, siteId, onSave, type = 'text', className = '' }) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(value ?? '');
  const inputRef = useRef(null);

  useEffect(() => setEditValue(value ?? ''), [value]);
  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const save = async () => {
    setEditing(false);
    if (String(editValue) === String(value ?? '')) return;
    try {
      const res = await fetch('/api/msp-plan', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteId, rowIndex, field, value: editValue, taskId }),
      });
      const data = await res.json();
      if (data.success) onSave();
      else console.error(data.message);
    } catch (e) {
      console.error(e);
    }
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        type={type}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === 'Enter') save();
          if (e.key === 'Escape') {
            setEditValue(value ?? '');
            setEditing(false);
          }
        }}
        className={`w-full bg-blue-50 border border-blue-300 rounded px-1 py-0.5 text-[11px] outline-none ${className}`}
      />
    );
  }

  return (
    <span
      className={`cursor-pointer hover:bg-blue-50 rounded px-0.5 block truncate ${className}`}
      onDoubleClick={() => setEditing(true)}
      title="Double-click to edit"
    >
      {value || '—'}
    </span>
  );
}

// ========== Task Modal (G & H editable) ==========
function TaskModal({ mode, task, allTasks, siteId, onClose, onSaved }) {
  const isEdit = mode === 'edit';
  const editingKey = isEdit ? taskKey(task) : null;

  const [zone, setZone] = useState(getZone(task) || '');
  const [activity, setActivity] = useState(task?.activity || '');
  const [subActivity, setSubActivity] = useState(task?.subActivity || '');
  const [duration, setDuration] = useState(toNum(task?.duration) || 3);
  const [resource, setResource] = useState(task?.resource || '');
  const [startDate, setStartDate] = useState(toISODate(task?.startObj || task?.startDate) || '');
  const [endDate, setEndDate] = useState(toISODate(task?.endObj || task?.endDate) || '');
  const [selectedPredKeys, setSelectedPredKeys] = useState(() => resolvePredKeys(task || {}, allTasks));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const otherTasks = useMemo(
    () => allTasks.filter((t) => !editingKey || taskKey(t) !== editingKey),
    [allTasks, editingKey]
  );

  const syncEndFromStart = (startVal, durVal) => {
    if (!startVal) return;
    const s = new Date(startVal + 'T00:00:00');
    const dur = toNum(durVal);
    if (Number.isNaN(s.getTime())) return;
    const end = new Date(s);
    end.setDate(end.getDate() + Math.max(dur - 1, 0));
    setEndDate(toISODate(end));
  };

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    if (!activity.trim()) return setErr('Activity is required');

    setBusy(true);
    try {
      const z = zone.trim();
      const precedenceStr = selectedPredKeys
        .map((pk) => {
          const pt = allTasks.find((t) => taskKey(t) === pk);
          return pt ? taskUID(pt) : null;
        })
        .filter(Boolean)
        .join(',');

      const base = {
        siteId,
        zone: z,
        activity: activity.trim(),
        subActivity: subActivity.trim(),
        duration: String(toNum(duration)),
        resource: resource.trim(),
        precedence: precedenceStr,
        startDate: startDate || '',
        endDate: endDate || '',
      };

      if (isEdit) {
        const res = await fetch('/api/msp-plan', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            siteId,
            rowIndex: task.rowIndex,
            taskId: task.id,
            bulk: base,
          }),
        });
        const data = await res.json();
        if (!data.success) {
          setErr(data.message || 'Update failed');
          setBusy(false);
          return;
        }
      } else {
        const res = await fetch('/api/msp-plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(base),
        });
        const data = await res.json();
        if (!data.success) {
          setErr(data.message || 'Add failed');
          setBusy(false);
          return;
        }
      }
      onSaved();
      onClose();
    } catch {
      setErr('Server error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 no-print"
      style={{ background: 'rgba(15,23,42,0.55)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="px-5 py-4 border-b flex justify-between items-center bg-slate-50">
          <div>
            <p className="text-[10px] font-bold uppercase text-teal-700">MSP TASK</p>
            <h2 className="text-lg font-semibold">{isEdit ? 'Edit Task' : 'Add Task'}</h2>
          </div>
          <button type="button" onClick={onClose} className="w-9 h-9 border rounded-lg">
            ✕
          </button>
        </div>

        <form onSubmit={submit} className="px-5 py-5 space-y-4 overflow-y-auto">
          {err && <div className="text-sm bg-red-50 text-red-600 px-3 py-2 rounded-lg">{err}</div>}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Zone / UID</label>
              <input className="input-field" value={zone} onChange={(e) => setZone(e.target.value)} placeholder="U7-U9" />
            </div>
            <div>
              <label className="label">Activity *</label>
              <input className="input-field" required value={activity} onChange={(e) => setActivity(e.target.value)} />
            </div>
            <div>
              <label className="label">Sub Activity</label>
              <input className="input-field" value={subActivity} onChange={(e) => setSubActivity(e.target.value)} />
            </div>
            <div>
              <label className="label">Duration (days)</label>
              <input
                className="input-field"
                type="number"
                min="0"
                value={duration}
                onChange={(e) => {
                  setDuration(e.target.value);
                  if (startDate) syncEndFromStart(startDate, e.target.value);
                }}
              />
            </div>

            {/* G & H editable */}
            <div>
              <label className="label">Start Date (G)</label>
              <input
                className="input-field"
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  syncEndFromStart(e.target.value, duration);
                }}
              />
              <p className="text-[10px] text-gray-500 mt-0.5">Save → aage ki chain auto shift</p>
            </div>
            <div>
              <label className="label">End Date (H)</label>
              <input className="input-field" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>

            <div className="col-span-2">
              <label className="label">Resource</label>
              <input className="input-field" value={resource} onChange={(e) => setResource(e.target.value)} />
            </div>
          </div>

          <div>
            <label className="label">Predecessors (Finish-to-Start)</label>
            <div className="border rounded-lg max-h-48 overflow-y-auto">
              {otherTasks.length === 0 ? (
                <div className="px-3 py-3 text-xs text-gray-500">No other tasks</div>
              ) : (
                otherTasks.map((t) => {
                  const k = taskKey(t);
                  const checked = selectedPredKeys.includes(k);
                  const blocked = isEdit && task ? isDescendant(task, t, allTasks) : false;
                  return (
                    <label
                      key={k}
                      className={`flex gap-2 px-3 py-2 text-xs border-b ${blocked ? 'opacity-40' : 'hover:bg-blue-50 cursor-pointer'}`}
                    >
                      <input
                        type="checkbox"
                        disabled={blocked}
                        checked={checked}
                        onChange={() =>
                          setSelectedPredKeys((prev) =>
                            prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]
                          )
                        }
                      />
                      <span className="truncate">
                        <b>{t.id}</b> <span className="text-teal-700">[{getZone(t)}]</span> —{' '}
                        {t.subActivity || t.activity}
                      </span>
                      {blocked && (
                        <span className="ml-auto text-[9px] font-bold text-amber-700 bg-amber-100 px-1 rounded">
                          cycle
                        </span>
                      )}
                    </label>
                  );
                })
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg text-sm">
              Cancel
            </button>
            <button type="submit" disabled={busy} className="btn-primary px-5 py-2">
              {busy ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ========== MAIN ==========
export default function MspPlanPage() {
  const [sites, setSites] = useState([]);
  const [selectedSite, setSelectedSite] = useState('');
  const [tasks, setTasks] = useState([]);
  const [minDate, setMinDate] = useState(null);
  const [maxDate, setMaxDate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dayWidth, setDayWidth] = useState(12);
  const [rowHeight, setRowHeight] = useState(36);
  const [modalState, setModalState] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [linkMode, setLinkMode] = useState('critical');
  const [zoneFilter, setZoneFilter] = useState('');

  useEffect(() => {
    fetch('/api/sites')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setSites(d.sites || []);
      })
      .catch(() => {});
  }, []);

  const loadMsp = useCallback(() => {
    if (!selectedSite) {
      setTasks([]);
      setMinDate(null);
      setMaxDate(null);
      return;
    }
    setLoading(true);
    setError('');
    fetch(`/api/msp-plan?siteId=${encodeURIComponent(selectedSite)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          const normalized = (d.tasks || []).map((t, idx) => ({
            ...t,
            id: String(t.id ?? '').trim(),
            zone: getZone(t),
            duration: toNum(t.duration),
            rowIndex: t.rowIndex ?? t.row ?? idx,
            precedenceRaw:
              t.precedenceRaw ||
              (Array.isArray(t.predecessors) ? t.predecessors.join(',') : t.precedence || ''),
          }));
          setTasks(normalized);

          let mn = d.minDate ? new Date(d.minDate) : null;
          let mx = d.maxDate ? new Date(d.maxDate) : null;
          if (!mn || !mx) {
            normalized.forEach((t) => {
              const s = parseISO(t.startObj) || parseISO(t.startDate);
              const e = parseISO(t.endObj) || parseISO(t.endDate);
              if (s && (!mn || s < mn)) mn = s;
              if (e && (!mx || e > mx)) mx = e;
            });
          }
          setMinDate(mn);
          setMaxDate(mx);
        } else {
          setError(d.message || 'Failed');
          setTasks([]);
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Server error');
        setLoading(false);
      });
  }, [selectedSite]);

  useEffect(() => {
    loadMsp();
  }, [loadMsp]);

  useEffect(() => {
    setZoneFilter('');
  }, [selectedSite]);

  const allZones = useMemo(() => {
    const z = new Set();
    tasks.forEach((t) => {
      const g = getZone(t);
      if (g) z.add(g);
    });
    return [...z].sort();
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    let list = tasks;
    if (zoneFilter) {
      const zf = norm(zoneFilter);
      list = list.filter((t) => norm(getZone(t)) === zf);
    }
    if (searchText.trim()) {
      const q = searchText.toLowerCase();
      list = list.filter(
        (t) =>
          (t.id || '').toLowerCase().includes(q) ||
          (t.zone || '').toLowerCase().includes(q) ||
          (t.activity || '').toLowerCase().includes(q) ||
          (t.subActivity || '').toLowerCase().includes(q) ||
          (t.resource || '').toLowerCase().includes(q) ||
          (t.precedenceRaw || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [tasks, searchText, zoneFilter]);

  const cpmFull = useMemo(() => computeCPM(tasks), [tasks]);

  const displayRows = useMemo(() => {
    if (!filteredTasks.length) return [];
    const { criticalKeys, ES, EF, floatOf } = cpmFull;
    const refMaps = createRefMaps(tasks);

    return filteredTasks.map((c) => {
      const key = taskKey(c);
      const s = parseISO(c.startObj) || parseISO(c.startDate);
      const e = parseISO(c.endObj) || parseISO(c.endDate);
      const predKeys = resolvePredKeys(c, tasks, refMaps);
      return {
        ...c,
        _key: key,
        id: String(c.id).trim(),
        zone: getZone(c),
        duration: toNum(c.duration),
        predKeys,
        predecessors: predKeys.map((pk) => {
          const pt = tasks.find((t) => taskKey(t) === pk);
          return pt ? String(pt.id).trim() : pk;
        }),
        type: 'task',
        isCritical: criticalKeys.has(key),
        es: ES[key] ?? 0,
        ef: EF[key] ?? toNum(c.duration),
        float: floatOf[key] ?? 0,
        startObj: s ? s.toISOString() : c.startObj,
        endObj: e ? e.toISOString() : c.endObj,
        startDate: c.startDate || (s ? s.toLocaleDateString('en-GB') : ''),
        endDate: c.endDate || (e ? e.toLocaleDateString('en-GB') : ''),
        precedenceRaw:
          c.precedenceRaw ||
          (Array.isArray(c.predecessors) ? c.predecessors.join(',') : ''),
        resource: c.resource || '',
      };
    });
  }, [filteredTasks, tasks, cpmFull]);

  const { timelineHeaders, totalDays, timelineStart, bars } = useMemo(() => {
    if (!minDate || !maxDate) return { timelineHeaders: [], totalDays: 0, timelineStart: null, bars: [] };

    const tStart = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
    const tEnd = new Date(maxDate.getFullYear(), maxDate.getMonth() + 1, 10);
    const total = Math.max(dayDiff(tStart, tEnd), 20);

    const months = [];
    let cur = new Date(tStart);
    while (cur < tEnd) {
      const next = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
      months.push({
        label: cur.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        width: dayDiff(cur, next) * dayWidth,
      });
      cur = next;
    }

    const barList = displayRows
      .map((row, index) => {
        const s = parseISO(row.startObj) || parseISO(row.startDate);
        const e = parseISO(row.endObj) || parseISO(row.endDate);
        if (!s) return null;
        const left = dayDiff(tStart, s) * dayWidth;
        const width = Math.max((dayDiff(s, e || s) + 1) * dayWidth, Math.max(dayWidth, 12));
        return {
          ...row,
          index,
          left,
          width,
          top: index * rowHeight,
          centerY: index * rowHeight + rowHeight / 2,
        };
      })
      .filter(Boolean);

    return { timelineHeaders: months, totalDays: total, timelineStart: tStart, bars: barList };
  }, [displayRows, minDate, maxDate, dayWidth, rowHeight]);

  const arrows = useMemo(() => {
    if (linkMode === 'none') return [];
    const byKey = new Map();
    bars.forEach((b) => {
      if (b._key) byKey.set(b._key, b);
    });

    const lines = [];
    let staggerIdx = 0;
    bars.forEach((b) => {
      (b.predKeys || []).forEach((pk) => {
        const p = byKey.get(pk);
        if (!p) return;
        const x1 = p.left + p.width;
        const y1 = p.centerY;
        const x2 = b.left;
        const y2 = b.centerY;
        if ([x1, y1, x2, y2].some((n) => Number.isNaN(n))) return;

        const isDriving = Math.abs((p.ef ?? 0) - (b.es ?? 0)) < 1e-6;
        const isCritLink = !!(p.isCritical && b.isCritical && isDriving);
        if (linkMode === 'critical' && !isCritLink) return;

        const stagger = ((staggerIdx++ % 7) - 3) * 4;
        const { points, kind } = buildArrowPoints(x1, y1, x2, y2, stagger);
        const veryLong = Math.abs(x2 - x1) > dayWidth * 90;

        lines.push({
          id: `${p._key}->${b._key}`,
          points,
          critical: isCritLink,
          dashed: kind === 'around' || veryLong,
          opacity: isCritLink ? 0.95 : linkMode === 'all' ? (veryLong ? 0.25 : 0.4) : 0.9,
        });
      });
    });
    return lines;
  }, [bars, linkMode, dayWidth]);

  const chartH = displayRows.length * rowHeight;
  const chartW = Math.max(totalDays * dayWidth, 600);
  const barBoxH = Math.max(rowHeight - 16, 10);

  let todayLeft = null;
  if (timelineStart) {
    const t = dayDiff(timelineStart, new Date());
    if (t >= 0 && t <= totalDays) todayLeft = t * dayWidth;
  }

  const openAdd = () => {
    if (!selectedSite) return setError('Pehle site select karo');
    setModalState({ mode: 'add', task: null });
  };

  const openEdit = (row) => {
    const real = tasks.find((t) => taskKey(t) === (row._key || taskKey(row)));
    if (real) setModalState({ mode: 'edit', task: real });
  };

  const stats = useMemo(() => {
    const criticalCount = displayRows.filter((r) => r.isCritical).length;
    const linkTotal = displayRows.reduce((n, r) => n + (r.predKeys?.length || 0), 0);
    return {
      total: tasks.length,
      shown: displayRows.length,
      zones: allZones.length,
      criticalCount,
      activities: new Set(displayRows.map((t) => t.activity)).size,
      totalDuration: displayRows.reduce((s, t) => s + toNum(t.duration), 0),
      arrowsShown: arrows.length,
      linkTotal,
    };
  }, [tasks, displayRows, arrows.length, allZones.length]);

  return (
    <div className="w-full max-w-none msp-print-root">
      {/* HEADER */}
      <div className="mb-4 flex flex-col lg:flex-row lg:items-end justify-between gap-4 no-print">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-1 text-teal-700">
            Construction Project Scheduler
          </p>
          <h1 className="text-2xl font-semibold">MSP Project Plan</h1>
          <p className="text-sm mt-1 text-gray-500">
            Tasks · FS Dependencies · CPM · Gantt · Editable G/H cascade
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
          <div className="w-full sm:w-64">
            <label className="label">Select Site</label>
            <select
              className="input-field"
              value={selectedSite}
              onChange={(e) => setSelectedSite(e.target.value)}
            >
              <option value="">-- Choose site --</option>
              {sites.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={openAdd}
            disabled={!selectedSite}
            className="btn-primary px-5 py-2.5 h-[42px] disabled:opacity-50"
          >
            + Add Task
          </button>
        </div>
      </div>

      {/* STATS */}
      {!loading && tasks.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 mb-4 no-print">
          {[
            { label: 'Total Tasks', value: stats.total, color: '#3b82f6' },
            { label: 'Zones', value: stats.zones, color: '#6366f1' },
            { label: 'Critical', value: stats.criticalCount, color: '#ef4444' },
            { label: 'Duration', value: `${stats.totalDuration}d`, color: '#f59e0b' },
            { label: 'Links shown', value: stats.arrowsShown, color: '#0d9488' },
            { label: 'FS edges', value: stats.linkTotal, color: '#64748b' },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border p-3 bg-white">
              <div className="text-[10px] font-semibold uppercase text-gray-500">{s.label}</div>
              <p className="text-xl font-bold" style={{ color: s.color }}>
                {s.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* TOOLBAR */}
      {!loading && tasks.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-3 px-4 py-2.5 rounded-xl border bg-white no-print">
          <input
            type="text"
            placeholder="Search..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="text-sm border rounded-lg px-3 py-1.5 w-36"
          />

          {allZones.length > 0 && (
            <>
              <div className="w-px self-stretch bg-gray-200" />
              <div className="flex items-center gap-1 flex-wrap">
                <span className="text-xs font-semibold text-gray-500">Zone</span>
                <button
                  type="button"
                  onClick={() => setZoneFilter('')}
                  className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border"
                  style={{
                    borderColor: !zoneFilter ? '#0f766e' : '#e2e8f0',
                    background: !zoneFilter ? '#ccfbf1' : 'transparent',
                    color: !zoneFilter ? '#0f766e' : '#64748b',
                  }}
                >
                  All
                </button>
                {allZones.map((z) => (
                  <button
                    key={z}
                    type="button"
                    onClick={() => setZoneFilter(z)}
                    className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border"
                    style={{
                      borderColor: zoneFilter === z ? '#0f766e' : '#e2e8f0',
                      background: zoneFilter === z ? '#ccfbf1' : 'transparent',
                      color: zoneFilter === z ? '#0f766e' : '#64748b',
                    }}
                  >
                    {z}
                  </button>
                ))}
              </div>
            </>
          )}

          <div className="w-px self-stretch bg-gray-200" />

          <div className="flex items-center gap-1">
            <span className="text-xs font-semibold text-gray-500 mr-1">Links</span>
            {[
              { id: 'critical', label: 'Critical' },
              { id: 'all', label: 'All' },
              { id: 'none', label: 'Hide' },
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setLinkMode(m.id)}
                className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border"
                style={{
                  borderColor: linkMode === m.id ? '#0f766e' : '#e2e8f0',
                  background: linkMode === m.id ? '#ccfbf1' : 'transparent',
                  color: linkMode === m.id ? '#0f766e' : '#64748b',
                }}
              >
                {m.label}
              </button>
            ))}
          </div>

          <div className="w-px self-stretch bg-gray-200" />

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Timeline</span>
            <input
              type="range"
              min={4}
              max={48}
              value={dayWidth}
              onChange={(e) => setDayWidth(+e.target.value)}
              className="w-28"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Rows</span>
            <input
              type="range"
              min={22}
              max={60}
              value={rowHeight}
              onChange={(e) => setRowHeight(+e.target.value)}
              className="w-28"
            />
          </div>

          <button
            type="button"
            onClick={() => window.print()}
            className="ml-auto text-xs font-semibold px-3 py-1.5 rounded-lg text-white bg-teal-700"
          >
            🖨 Print
          </button>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm border border-red-100 no-print">
          {error}
        </div>
      )}

      {/* GANTT */}
      <div className="card overflow-hidden bg-white rounded-xl border msp-gantt-card">
        {!selectedSite && !loading && (
          <div className="p-12 text-center text-gray-500">
            <div className="text-4xl mb-3">📊</div>
            <p className="text-lg font-semibold">Select a Site</p>
          </div>
        )}
        {loading && (
          <div className="p-12 text-center text-gray-500">
            <div className="inline-block w-8 h-8 rounded-full border-2 border-teal-600 border-t-transparent animate-spin mb-2" />
            <p>Loading schedule...</p>
          </div>
        )}
        {!loading && selectedSite && !displayRows.length && (
          <div className="p-12 text-center text-gray-500">
            <div className="text-4xl mb-3">📝</div>
            <p className="text-lg font-semibold">No Tasks Yet</p>
            <button type="button" onClick={openAdd} className="btn-primary mt-4 px-4 py-2">
              + Add Task
            </button>
          </div>
        )}

        {!loading && displayRows.length > 0 && (
          <div className="overflow-auto msp-gantt-scroll" style={{ maxHeight: '72vh' }}>
            <div style={{ width: LEFT_W + chartW, minWidth: '100%', position: 'relative' }}>
              {/* sticky header */}
              <div className="flex sticky top-0 z-40" style={{ height: HEADER_HEIGHT }}>
                <div
                  className="sticky left-0 z-50 shrink-0 grid gap-1 px-2 items-center text-[10px] font-bold uppercase text-white"
                  style={{
                    width: LEFT_W,
                    background: '#115e59',
                    gridTemplateColumns: '30px 45px 60px 80px 80px 35px 65px 65px 90px 80px 30px',
                  }}
                >
                  <div>#</div>
                  <div>ID</div>
                  <div>Zone</div>
                  <div>Activity</div>
                  <div>Sub Act</div>
                  <div>Dur</div>
                  <div>Start</div>
                  <div>End</div>
                  <div>Pred</div>
                  <div>Res</div>
                  <div>⚙</div>
                </div>
                <div className="flex shrink-0" style={{ width: chartW, background: '#115e59' }}>
                  {timelineHeaders.map((m, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-center text-white text-xs font-semibold border-r border-white/20 shrink-0"
                      style={{ width: m.width, minWidth: m.width }}
                    >
                      {m.label}
                    </div>
                  ))}
                </div>
              </div>

              {/* rows */}
              {displayRows.map((row, i) => {
                const rowBg = i % 2 === 0 ? '#fff' : '#fafafa';
                return (
                  <div key={`${row._key}-${i}`} className="flex group" style={{ height: rowHeight }}>
                    <div
                      className="sticky left-0 z-30 shrink-0 grid gap-1 px-2 items-center text-[11px] border-r border-b"
                      style={{
                        width: LEFT_W,
                        borderColor: '#e2e8f0',
                        background: rowBg,
                        gridTemplateColumns: '30px 45px 60px 80px 80px 35px 65px 65px 90px 80px 30px',
                      }}
                    >
                      <div className="text-[10px] text-gray-400">{i + 1}</div>
                      <div
                        className="truncate font-semibold"
                        style={{ color: row.isCritical ? '#dc2626' : '#0f766e' }}
                        title={row.isCritical ? `Critical float=${row.float}` : `float=${row.float}`}
                      >
                        {row.id}
                      </div>
                      <div className="truncate">
                        <EditableCell value={row.zone || ''} field="zone" rowIndex={row.rowIndex} taskId={row.id} siteId={selectedSite} onSave={loadMsp} />
                      </div>
                      <div className="truncate">
                        <EditableCell value={row.activity} field="activity" rowIndex={row.rowIndex} taskId={row.id} siteId={selectedSite} onSave={loadMsp} />
                      </div>
                      <div className="truncate">
                        <EditableCell value={row.subActivity} field="subActivity" rowIndex={row.rowIndex} taskId={row.id} siteId={selectedSite} onSave={loadMsp} />
                      </div>
                      <div>
                        <EditableCell value={String(row.duration || 0)} field="duration" rowIndex={row.rowIndex} taskId={row.id} siteId={selectedSite} onSave={loadMsp} type="number" />
                      </div>
                      {/* G Start — editable inline */}
                      <div className="text-[10px] text-gray-500 truncate">
                        <EditableCell value={row.startDate} field="startDate" rowIndex={row.rowIndex} taskId={row.id} siteId={selectedSite} onSave={loadMsp} />
                      </div>
                      {/* H End — editable inline */}
                      <div className="text-[10px] text-gray-500 truncate">
                        <EditableCell value={row.endDate} field="endDate" rowIndex={row.rowIndex} taskId={row.id} siteId={selectedSite} onSave={loadMsp} />
                      </div>
                      <div className="truncate text-[9px] text-gray-500" title={row.precedenceRaw}>
                        <EditableCell value={row.precedenceRaw || ''} field="precedenceRaw" rowIndex={row.rowIndex} taskId={row.id} siteId={selectedSite} onSave={loadMsp} />
                      </div>
                      <div className="truncate text-[10px] text-gray-600">
                        <EditableCell value={row.resource || ''} field="resource" rowIndex={row.rowIndex} taskId={row.id} siteId={selectedSite} onSave={loadMsp} />
                      </div>
                      <div className="flex justify-center">
                        <button
                          type="button"
                          onClick={() => openEdit(row)}
                          className="opacity-0 group-hover:opacity-100 w-5 h-5 text-blue-600 hover:bg-blue-100 rounded"
                          title="Edit"
                        >
                          ✎
                        </button>
                      </div>
                    </div>
                    <div className="shrink-0 border-b" style={{ width: chartW, background: rowBg, borderColor: '#e2e8f0' }} />
                  </div>
                );
              })}

              {/* chart overlay */}
              <div
                className="absolute pointer-events-none"
                style={{ left: LEFT_W, top: HEADER_HEIGHT, width: chartW, height: chartH }}
              >
                <div className="absolute inset-0 flex">
                  {timelineHeaders.map((m, i) => (
                    <div key={i} style={{ width: m.width, borderRight: '1px solid #e2e8f0' }} />
                  ))}
                </div>

                {todayLeft != null && (
                  <div className="absolute top-0 bottom-0 z-20" style={{ left: todayLeft, width: 2, background: '#ef4444' }}>
                    <span className="absolute left-1/2 -translate-x-1/2 text-[9px] font-bold text-white px-1 rounded bg-red-500">
                      TODAY
                    </span>
                  </div>
                )}

                <svg className="absolute inset-0 z-10" width={chartW} height={chartH} style={{ overflow: 'visible' }}>
                  <defs>
                    <marker id="arrG" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M0,0 L10,5 L0,10 z" fill="#94a3b8" />
                    </marker>
                    <marker id="arrR" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M0,0 L10,5 L0,10 z" fill="#dc2626" />
                    </marker>
                  </defs>
                  {arrows.map((a, idx) => (
                    <polyline
                      key={`${a.id}-${idx}`}
                      points={a.points}
                      fill="none"
                      stroke={a.critical ? '#dc2626' : '#94a3b8'}
                      strokeWidth={a.critical ? 2 : 1.25}
                      strokeDasharray={a.dashed ? '6 4' : undefined}
                      markerEnd={a.critical ? 'url(#arrR)' : 'url(#arrG)'}
                      opacity={a.opacity}
                    />
                  ))}
                </svg>

                <div className="absolute inset-0 z-20" style={{ pointerEvents: 'auto' }}>
                  {bars.map((b) => (
                    <div
                      key={`${b._key}-${b.index}`}
                      className="absolute rounded-sm flex items-center px-1.5 text-[10px] font-semibold text-white shadow-sm cursor-pointer hover:brightness-110"
                      onClick={() => openEdit(b)}
                      style={{
                        left: b.left,
                        top: b.top + (rowHeight - barBoxH) / 2,
                        width: Math.max(b.width, 12),
                        height: barBoxH,
                        background: b.isCritical
                          ? 'linear-gradient(180deg, #f87171 0%, #dc2626 100%)'
                          : 'linear-gradient(180deg, #5eead4 0%, #0d9488 100%)',
                        overflow: 'hidden',
                      }}
                      title={`${b.id} | ${b.zone}\n${b.subActivity || ''}\n${b.startDate} → ${b.endDate}\nPred: ${b.precedenceRaw || '—'}`}
                    >
                      <span className="truncate">{b.subActivity || b.id}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* LEGEND */}
      {!loading && displayRows.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-4 px-4 py-2 rounded-xl border bg-white text-[11px] no-print">
          <span className="font-semibold text-gray-500">Legend:</span>
          <span className="flex items-center gap-1.5">
            <span className="w-5 h-3 rounded-sm" style={{ background: 'linear-gradient(180deg,#5eead4,#0d9488)' }} /> Normal
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-5 h-3 rounded-sm" style={{ background: 'linear-gradient(180deg,#f87171,#dc2626)' }} /> Critical
          </span>
          <span className="text-gray-500">
            Zone: {zoneFilter || 'All'} · Links: {linkMode} · Double-click cells · ✎ full edit (G/H cascade)
          </span>
          <span className="ml-auto text-gray-400">
            {stats.shown}/{stats.total} · Crit {stats.criticalCount} · Arrows {stats.arrowsShown}
          </span>
        </div>
      )}

      {modalState && (
        <TaskModal
          mode={modalState.mode}
          task={modalState.task}
          allTasks={tasks}
          siteId={selectedSite}
          onClose={() => setModalState(null)}
          onSaved={loadMsp}
        />
      )}

      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          .msp-gantt-scroll {
            max-height: none !important;
            overflow: visible !important;
          }
        }
      `}</style>
    </div>
  );
}