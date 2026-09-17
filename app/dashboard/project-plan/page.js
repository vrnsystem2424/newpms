// 'use client';

// import { useEffect, useState } from 'react';

// // File → base64 helper
// function fileToBase64(file) {
//   return new Promise((resolve, reject) => {
//     const reader = new FileReader();
//     reader.onload = () => {
//       const result = reader.result || '';
//       resolve({
//         base64: String(result).split(',')[1] || '',
//         mimeType: file.type,
//         name: file.name,
//       });
//     };
//     reader.onerror = reject;
//     reader.readAsDataURL(file);
//   });
// }

// export default function ProjectPlanPage() {
//   // Table data
//   const [sites, setSites] = useState([]);
//   const [selectedSite, setSelectedSite] = useState('');
//   const [headers, setHeaders] = useState([]);
//   const [rows, setRows] = useState([]);

//   // UI states
//   const [loadingSites, setLoadingSites] = useState(true);
//   const [loadingData, setLoadingData] = useState(false);
//   const [error, setError] = useState('');

//   // Fullkitting Modal states
//   const [modalOpen, setModalOpen] = useState(false);
//   const [taskDetails, setTaskDetails] = useState(null);
//   const [kittingItems, setKittingItems] = useState([]);
//   const [loadingKitting, setLoadingKitting] = useState(false);
//   const [formState, setFormState] = useState({});
//   const [submitting, setSubmitting] = useState(false);
//   const [modalError, setModalError] = useState('');

//   // Start / Completed Confirmation Modal states
//   const [confirmModal, setConfirmModal] = useState({
//     isOpen: false,
//     type: null, // 'start' | 'complete'
//     row: null,
//   });
//   const [actionSubmitting, setActionSubmitting] = useState(false);

//   // Edit Modal state
//   const [editModal, setEditModal] = useState({
//     isOpen: false,
//     row: null,
//     plannedStart: '',
//     plannedEnd: '',
//     remarks: '',
//     submitting: false,
//     error: '',
//   });

//   // 1. Load Sites
//   useEffect(() => {
//     fetch('/api/sites')
//       .then((r) => r.json())
//       .then((data) => {
//         if (data.success) setSites(data.sites);
//         else setError(data.message || 'Sites load nahi hui');
//         setLoadingSites(false);
//       })
//       .catch(() => {
//         setError('Sites load error');
//         setLoadingSites(false);
//       });
//   }, []);

//   // 2. Table loader
//   const loadPlan = () => {
//     if (!selectedSite) {
//       setHeaders([]);
//       setRows([]);
//       return;
//     }
//     setLoadingData(true);
//     setError('');
//     fetch(`/api/project-plan?siteId=${encodeURIComponent(selectedSite)}`)
//       .then((r) => r.json())
//       .then((data) => {
//         if (data.success) {
//           setHeaders(data.headers || []);
//           setRows(data.rows || []);
//         } else {
//           setError(data.message || 'Data load nahi hua');
//           setHeaders([]);
//           setRows([]);
//         }
//         setLoadingData(false);
//       })
//       .catch(() => {
//         setError('Server se data nahi aya');
//         setLoadingData(false);
//       });
//   };

//   useEffect(() => {
//     loadPlan();
//     // eslint-disable-next-line
//   }, [selectedSite]);

//   // 3. Open Fullkitting Modal
//   const openFullkitting = (row) => {
//     const activity = row[headers[3]] || '';
//     const subActivity = row[headers[4]] || '';
//     const uid = row[headers[0]] || '';

//     setTaskDetails({
//       rowIndex: row._rowIndex,
//       uid,
//       activity,
//       subActivity,
//     });
//     setModalOpen(true);
//     setLoadingKitting(true);
//     setKittingItems([]);
//     setFormState({});
//     setModalError('');

//     const url = `/api/project-plan?action=getKitting&siteId=${encodeURIComponent(
//       selectedSite
//     )}&activity=${encodeURIComponent(activity)}&subActivity=${encodeURIComponent(subActivity)}`;

//     fetch(url)
//       .then((r) => r.json())
//       .then((data) => {
//         if (data.success) setKittingItems(data.items || []);
//         else setModalError(data.message || 'Load failed');
//         setLoadingKitting(false);
//       })
//       .catch(() => {
//         setModalError('Server error');
//         setLoadingKitting(false);
//       });
//   };

//   // 4. Submit Fullkitting Form
//   const handleFullkittingSubmit = async () => {
//     setModalError('');
//     const missing = kittingItems.find((it) => !formState[it.rowIndex]?.file);
//     if (missing) {
//       setModalError('Har checklist item ki photo upload karna zaruri hai');
//       return;
//     }

//     setSubmitting(true);
//     try {
//       const payloadItems = await Promise.all(
//         kittingItems.map(async (it) => {
//           const image = await fileToBase64(formState[it.rowIndex].file);
//           return {
//             rowIndex: it.rowIndex,
//             remarks: formState[it.rowIndex]?.remarks || '',
//             image,
//           };
//         })
//       );

//       const res = await fetch('/api/project-plan', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//           siteId: selectedSite,
//           projectPlanRowIndex: taskDetails.rowIndex,
//           items: payloadItems,
//         }),
//       });

//       const data = await res.json();
//       if (data.success) {
//         setModalOpen(false);
//         loadPlan();
//       } else {
//         setModalError(data.message || 'Submit failed');
//       }
//     } catch (e) {
//       setModalError(e.message || 'Something went wrong');
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   // 5. Open Start / Complete Confirmation Modal
//   const openConfirmModal = (type, row) => {
//     setConfirmModal({ isOpen: true, type, row });
//   };

//   const handleConfirmAction = async () => {
//     if (!confirmModal.row || !confirmModal.type) return;

//     setActionSubmitting(true);
//     try {
//       const res = await fetch('/api/project-plan', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//           siteId: selectedSite,
//           projectPlanRowIndex: confirmModal.row._rowIndex,
//           action: confirmModal.type,
//         }),
//       });

//       const data = await res.json();
//       if (data.success) {
//         setConfirmModal({ isOpen: false, type: null, row: null });
//         loadPlan();
//       } else {
//         alert(data.message || 'Action update failed');
//       }
//     } catch (e) {
//       alert('Something went wrong: ' + e.message);
//     } finally {
//       setActionSubmitting(false);
//     }
//   };

//   // 6. Open Edit Modal
//   const openEditModal = (row) => {
//     setEditModal({
//       isOpen: true,
//       row,
//       plannedStart: '',
//       plannedEnd: '',
//       remarks: '',
//       submitting: false,
//       error: '',
//     });
//   };

//   const closeEditModal = () => {
//     setEditModal({
//       isOpen: false,
//       row: null,
//       plannedStart: '',
//       plannedEnd: '',
//       remarks: '',
//       submitting: false,
//       error: '',
//     });
//   };

//   // 7. Submit Edit Form
//   const handleEditSubmit = async () => {
//     if (!editModal.plannedStart || !editModal.plannedEnd) {
//       setEditModal((s) => ({ ...s, error: 'Please select both dates' }));
//       return;
//     }
//     if (new Date(editModal.plannedEnd) < new Date(editModal.plannedStart)) {
//       setEditModal((s) => ({ ...s, error: 'End date cannot be before Start date' }));
//       return;
//     }

//     setEditModal((s) => ({ ...s, submitting: true, error: '' }));

//     try {
//       const res = await fetch('/api/project-plan', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//           siteId: selectedSite,
//           projectPlanRowIndex: editModal.row._rowIndex,
//           action: 'edit',
//           editData: {
//             plannedStart: editModal.plannedStart,
//             plannedEnd: editModal.plannedEnd,
//             remarks: editModal.remarks,
//           },
//         }),
//       });

//       const data = await res.json();
//       if (data.success) {
//         closeEditModal();
//         loadPlan();
//       } else {
//         setEditModal((s) => ({ ...s, submitting: false, error: data.message || 'Update failed' }));
//       }
//     } catch (e) {
//       setEditModal((s) => ({ ...s, submitting: false, error: e.message || 'Something went wrong' }));
//     }
//   };

//   const selectedSiteName = sites.find((s) => s.id === selectedSite)?.name || '';

//   return (
//     <div className="w-full max-w-none">
//       {/* Page header */}
//       <div className="mb-4 sm:mb-6 flex flex-col lg:flex-row lg:items-end justify-between gap-4">
//         <div className="min-w-0">
//           <p
//             className="text-xs font-semibold uppercase tracking-wider mb-1"
//             style={{ color: 'var(--accent)' }}
//           >
//             Module
//           </p>
//           <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Project Plan</h1>
//           <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
//             Pending tasks as per precedence
//           </p>
//         </div>

//         {/* Site Selector and Refresh Button */}
//         <div className="w-full lg:w-auto lg:min-w-[340px] lg:max-w-[400px] flex items-end gap-2">
//           <div className="flex-1">
//             <label className="label">Select Site</label>
//             <select
//               className="input-field w-full"
//               value={selectedSite}
//               onChange={(e) => setSelectedSite(e.target.value)}
//               disabled={loadingSites}
//             >
//               <option value="">
//                 {loadingSites ? 'Loading sites...' : '-- Choose a site --'}
//               </option>
//               {sites.map((s) => (
//                 <option key={s.id} value={s.id}>
//                   {s.name}
//                 </option>
//               ))}
//             </select>
//           </div>

//           {selectedSite && (
//             <button
//               onClick={loadPlan}
//               disabled={loadingData}
//               className="px-4 h-[42px] shrink-0 text-sm font-semibold rounded-xl border flex items-center justify-center gap-1.5 transition-all active:scale-95"
//               style={{
//                 borderColor: 'var(--border-strong)',
//                 background: 'var(--surface)',
//                 color: 'var(--text-main)',
//                 boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
//               }}
//               title="Refresh Plan Data"
//             >
//               {loadingData ? (
//                 <span
//                   className="w-4 h-4 border-2 rounded-full animate-spin shrink-0"
//                   style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }}
//                 />
//               ) : (
//                 <span className="shrink-0">🔄</span>
//               )}
//               Refresh
//             </button>
//           )}
//         </div>
//       </div>

//       {error && (
//         <div
//           className="mb-4 rounded-[10px] px-4 py-3 text-sm font-medium"
//           style={{
//             background: 'var(--danger-soft)',
//             color: 'var(--danger)',
//             border: '1px solid #fecaca',
//           }}
//         >
//           {error}
//         </div>
//       )}

//       {/* Table */}
//       <div className="card w-full overflow-hidden">
//         {selectedSite && !loadingData && rows.length > 0 && (
//           <div
//             className="px-3 sm:px-5 py-3 border-b flex flex-wrap items-center justify-between gap-2"
//             style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)' }}
//           >
//             <div className="text-sm truncate">
//               <span style={{ color: 'var(--text-muted)' }}>Site: </span>
//               <span className="font-semibold">{selectedSiteName}</span>
//             </div>
//             <div className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
//               {rows.length} pending tasks
//             </div>
//           </div>
//         )}

//         {!selectedSite && !loadingData && (
//           <div className="p-8 sm:p-12 text-center">
//             <div
//               className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-4"
//               style={{ background: 'var(--primary-soft)' }}
//             >
//               <span className="text-2xl font-bold" style={{ color: 'var(--primary)' }}>
//                 →
//               </span>
//             </div>
//             <p className="font-medium">Select a site to begin</p>
//           </div>
//         )}

//         {loadingData && (
//           <div className="p-8 sm:p-12 text-center">
//             <div
//               className="inline-block w-8 h-8 rounded-full border-2 animate-spin"
//               style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }}
//             />
//             <p className="text-sm mt-3" style={{ color: 'var(--text-muted)' }}>
//               Loading project plan...
//             </p>
//           </div>
//         )}

//         {selectedSite && !loadingData && rows.length === 0 && !error && (
//           <div className="p-8 sm:p-12 text-center">
//             <p className="font-medium">Koi pending task nahi hai</p>
//           </div>
//         )}

//         {!loadingData && rows.length > 0 && (
//           <div className="w-full overflow-x-auto">
//             <table className="w-full min-w-max text-sm border-collapse">
//               <thead>
//                 <tr style={{ background: 'var(--primary)' }}>
//                   {headers.map((h, i) => (
//                     <th
//                       key={i}
//                       className="px-3 sm:px-4 py-2.5 sm:py-3 text-left font-semibold whitespace-nowrap"
//                       style={{
//                         color: '#fff',
//                         fontSize: '0.7rem',
//                         textTransform: 'uppercase',
//                         letterSpacing: '0.04em',
//                         borderRight: '1px solid rgba(255,255,255,0.15)',
//                       }}
//                     >
//                       {h}
//                     </th>
//                   ))}
//                   <th
//                     className="px-3 sm:px-4 py-2.5 sm:py-3 text-center font-semibold whitespace-nowrap"
//                     style={{
//                       color: '#fff',
//                       fontSize: '0.7rem',
//                       textTransform: 'uppercase',
//                       letterSpacing: '0.04em',
//                     }}
//                   >
//                     Actions
//                   </th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {rows.map((row, rIdx) => {
//                   const isKitted = row._isKitted;
//                   const isStarted = row._isStarted;
//                   const isCompleted = row._isCompleted;

//                   return (
//                     <tr
//                       key={rIdx}
//                       className="transition-colors"
//                       style={{ borderBottom: '1px solid var(--border)' }}
//                       onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-elevated)')}
//                       onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
//                     >
//                       {headers.map((h, cIdx) => (
//                         <td
//                           key={cIdx}
//                           className="px-3 sm:px-4 py-2 sm:py-2.5 whitespace-nowrap"
//                           style={{ color: 'var(--text-main)' }}
//                         >
//                           {row[h] ? row[h] : <span style={{ color: 'var(--text-soft)' }}>—</span>}
//                         </td>
//                       ))}

//                       {/* Action Buttons */}
//                       <td className="px-3 sm:px-4 py-2 sm:py-2.5 text-center">
//                         <div className="flex items-center justify-center gap-2 flex-wrap">
//                           {/* 1. Fullkitting */}
//                           <button
//                             onClick={() => openFullkitting(row)}
//                             disabled={isKitted}
//                             className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-all ${
//                               isKitted
//                                 ? 'opacity-50 cursor-not-allowed bg-gray-200 text-gray-600'
//                                 : 'text-white hover:scale-105'
//                             }`}
//                             style={
//                               !isKitted
//                                 ? { background: 'var(--primary)', boxShadow: '0 2px 6px rgba(15, 92, 86, 0.25)' }
//                                 : {}
//                             }
//                           >
//                             {isKitted ? 'Fullkitted ✓' : 'Fullkitting'}
//                           </button>

//                           {/* 2. Start */}
//                           <button
//                             onClick={() => openConfirmModal('start', row)}
//                             disabled={isStarted}
//                             className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-all ${
//                               isStarted
//                                 ? 'opacity-50 cursor-not-allowed bg-blue-100 text-blue-800'
//                                 : 'bg-blue-600 text-white hover:bg-blue-700 hover:scale-105'
//                             }`}
//                             style={!isStarted ? { boxShadow: '0 2px 6px rgba(37, 99, 235, 0.25)' } : {}}
//                           >
//                             {isStarted ? 'Started ✓' : 'Start'}
//                           </button>

//                           {/* 3. Edit (NEW) */}
//                           <button
//                             onClick={() => openEditModal(row)}
//                             className="text-xs font-semibold px-3 py-1.5 rounded-full transition-all bg-amber-500 text-white hover:bg-amber-600 hover:scale-105"
//                             style={{ boxShadow: '0 2px 6px rgba(245, 158, 11, 0.25)' }}
//                           >
//                             ✎ Edit
//                           </button>

//                           {/* 4. Completed */}
//                           <button
//                             onClick={() => openConfirmModal('complete', row)}
//                             disabled={isCompleted}
//                             className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-all ${
//                               isCompleted
//                                 ? 'opacity-50 cursor-not-allowed bg-green-100 text-green-800'
//                                 : 'bg-emerald-600 text-white hover:bg-emerald-700 hover:scale-105'
//                             }`}
//                             style={!isCompleted ? { boxShadow: '0 2px 6px rgba(16, 185, 129, 0.25)' } : {}}
//                           >
//                             {isCompleted ? 'Completed ✓' : 'Completed'}
//                           </button>
//                         </div>
//                       </td>
//                     </tr>
//                   );
//                 })}
//               </tbody>
//             </table>
//           </div>
//         )}
//       </div>

//       {/* ========================================== */}
//       {/* START / COMPLETE CONFIRMATION MODAL */}
//       {/* ========================================== */}
//       {confirmModal.isOpen && (
//         <div
//           className="fixed inset-0 z-[120] flex items-center justify-center p-4"
//           style={{ background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)' }}
//         >
//           <div
//             className="w-full max-w-md rounded-2xl shadow-2xl p-6 text-center"
//             style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
//           >
//             <div
//               className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center text-xl font-bold"
//               style={{
//                 background:
//                   confirmModal.type === 'start'
//                     ? 'rgba(37, 99, 235, 0.12)'
//                     : 'rgba(16, 185, 129, 0.12)',
//                 color: confirmModal.type === 'start' ? '#2563eb' : '#10b981',
//               }}
//             >
//               {confirmModal.type === 'start' ? '🚀' : '✓'}
//             </div>

//             <h3 className="text-lg font-bold mb-2">
//               Confirm {confirmModal.type === 'start' ? 'Task Start' : 'Task Completion'}?
//             </h3>

//             <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
//               Kya aap sure hain ki Task <b>{confirmModal.row?.[headers[0]] || ''}</b> ({confirmModal.row?.[headers[3]] || ''}) ko{' '}
//               <b>{confirmModal.type === 'start' ? 'Start' : 'Completed'}</b> mark karna chahte hain?
//             </p>

//             <div className="flex gap-3 justify-center">
//               <button
//                 type="button"
//                 disabled={actionSubmitting}
//                 onClick={() => setConfirmModal({ isOpen: false, type: null, row: null })}
//                 className="px-5 py-2 text-sm font-semibold rounded-xl border"
//                 style={{ borderColor: 'var(--border-strong)', color: 'var(--text-muted)' }}
//               >
//                 No, Cancel
//               </button>

//               <button
//                 type="button"
//                 disabled={actionSubmitting}
//                 onClick={handleConfirmAction}
//                 className="px-6 py-2 text-sm font-semibold text-white rounded-xl shadow-md transition-transform hover:scale-105"
//                 style={{ background: confirmModal.type === 'start' ? '#2563eb' : '#10b981' }}
//               >
//                 {actionSubmitting ? 'Updating...' : 'Yes, Confirm'}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* ========================================== */}
//       {/* EDIT MODAL (NEW) */}
//       {/* ========================================== */}
//       {editModal.isOpen && (
//         <div
//           className="fixed inset-0 z-[115] flex items-center justify-center p-4"
//           style={{ background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)' }}
//         >
//           <div
//             className="w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
//             style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
//           >
//             {/* Header */}
//             <div
//               className="px-5 py-4 border-b flex items-center justify-between"
//               style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)' }}
//             >
//               <div>
//                 <p
//                   className="text-[10px] font-semibold uppercase tracking-wider"
//                   style={{ color: 'var(--accent)' }}
//                 >
//                   Edit / Exception — {editModal.row?.[headers[0]] || ''}
//                 </p>
//                 <h2 className="text-base font-semibold mt-0.5">
//                   {editModal.row?.[headers[3]] || ''}{' '}
//                   <span style={{ color: 'var(--text-muted)' }}>›</span>{' '}
//                   {editModal.row?.[headers[4]] || ''}
//                 </h2>
//               </div>
//               <button
//                 onClick={closeEditModal}
//                 disabled={editModal.submitting}
//                 className="w-9 h-9 rounded-lg border shrink-0 flex items-center justify-center font-bold"
//                 style={{ borderColor: 'var(--border-strong)', background: 'var(--surface)' }}
//               >
//                 ✕
//               </button>
//             </div>

//             {/* Body */}
//             <div className="px-5 py-5 space-y-4">
//               {editModal.error && (
//                 <div
//                   className="rounded-[10px] px-4 py-2 text-sm font-medium"
//                   style={{
//                     background: 'var(--danger-soft)',
//                     color: 'var(--danger)',
//                     border: '1px solid #fecaca',
//                   }}
//                 >
//                   {editModal.error}
//                 </div>
//               )}

//               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//                 <div>
//                   <label className="label">Next Planned Start Date *</label>
//                   <input
//                     type="date"
//                     className="input-field w-full"
//                     value={editModal.plannedStart}
//                     onChange={(e) =>
//                       setEditModal((s) => ({ ...s, plannedStart: e.target.value }))
//                     }
//                     disabled={editModal.submitting}
//                   />
//                 </div>
//                 <div>
//                   <label className="label">Next Planned End Date *</label>
//                   <input
//                     type="date"
//                     className="input-field w-full"
//                     value={editModal.plannedEnd}
//                     onChange={(e) =>
//                       setEditModal((s) => ({ ...s, plannedEnd: e.target.value }))
//                     }
//                     disabled={editModal.submitting}
//                   />
//                 </div>
//               </div>

//               <div>
//                 <label className="label">Remarks</label>
//                 <textarea
//                   rows={3}
//                   className="input-field w-full"
//                   placeholder="Reason for change / notes..."
//                   value={editModal.remarks}
//                   onChange={(e) =>
//                     setEditModal((s) => ({ ...s, remarks: e.target.value }))
//                   }
//                   disabled={editModal.submitting}
//                 />
//               </div>

//               <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
//                 Note: Yeh entry <b>Exception Change Log</b> me save hogi aur Project Plan me{' '}
//                 <b>Planned Start (K)</b> & <b>Planned End (L)</b> update ho jayengi.
//               </p>
//             </div>

//             {/* Footer */}
//             <div
//               className="px-5 py-3 border-t flex justify-end gap-2"
//               style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
//             >
//               <button
//                 onClick={closeEditModal}
//                 disabled={editModal.submitting}
//                 className="text-sm font-semibold px-4 py-2 rounded-[10px] border"
//                 style={{
//                   borderColor: 'var(--border-strong)',
//                   color: 'var(--text-muted)',
//                   background: 'var(--surface)',
//                 }}
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={handleEditSubmit}
//                 disabled={editModal.submitting}
//                 className="text-sm font-semibold px-5 py-2 rounded-[10px] text-white transition-transform hover:scale-105"
//                 style={{
//                   background: '#f59e0b',
//                   boxShadow: '0 2px 6px rgba(245, 158, 11, 0.35)',
//                 }}
//               >
//                 {editModal.submitting ? 'Saving...' : 'Save Changes'}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* ========================================== */}
//       {/* FULLKITTING CHECKLIST MODAL */}
//       {/* ========================================== */}
//       {modalOpen && (
//         <div
//           className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4"
//           style={{ background: 'rgba(15, 23, 42, 0.55)', backdropFilter: 'blur(4px)' }}
//         >
//           <div
//             className="w-full max-w-3xl max-h-[92vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden"
//             style={{ background: 'var(--surface)' }}
//           >
//             {/* Header */}
//             <div
//               className="px-4 sm:px-6 py-4 border-b flex items-center justify-between gap-3"
//               style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)' }}
//             >
//               <div className="min-w-0">
//                 <p
//                   className="text-[10px] font-semibold uppercase tracking-wider"
//                   style={{ color: 'var(--accent)' }}
//                 >
//                   Full Kitting — {taskDetails?.uid}
//                 </p>
//                 <h2 className="text-lg font-semibold truncate">
//                   {taskDetails?.activity}{' '}
//                   <span style={{ color: 'var(--text-muted)' }}>›</span>{' '}
//                   {taskDetails?.subActivity}
//                 </h2>
//               </div>
//               <button
//                 onClick={() => setModalOpen(false)}
//                 className="w-9 h-9 rounded-lg border shrink-0 flex items-center justify-center font-bold"
//                 style={{ borderColor: 'var(--border-strong)', background: 'var(--surface)' }}
//               >
//                 ✕
//               </button>
//             </div>

//             {/* Body */}
//             <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5">
//               {loadingKitting && (
//                 <div className="py-12 text-center">
//                   <div
//                     className="inline-block w-8 h-8 rounded-full border-2 animate-spin"
//                     style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }}
//                   />
//                   <p className="text-sm mt-3" style={{ color: 'var(--text-muted)' }}>
//                     Loading checklist...
//                   </p>
//                 </div>
//               )}

//               {!loadingKitting && kittingItems.length === 0 && !modalError && (
//                 <div className="py-10 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
//                   Is activity ke liye Full Kitting Master me koi checklist nahi mili
//                 </div>
//               )}

//               {modalError && (
//                 <div
//                   className="mb-4 rounded-[10px] px-4 py-3 text-sm font-medium"
//                   style={{
//                     background: 'var(--danger-soft)',
//                     color: 'var(--danger)',
//                     border: '1px solid #fecaca',
//                   }}
//                 >
//                   {modalError}
//                 </div>
//               )}

//               <div className="space-y-4">
//                 {kittingItems.map((it, idx) => {
//                   const state = formState[it.rowIndex] || {};
//                   return (
//                     <div
//                       key={it.rowIndex}
//                       className="rounded-[12px] border p-4"
//                       style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)' }}
//                     >
//                       <div className="flex items-start gap-3 mb-3">
//                         <div
//                           className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
//                           style={{ background: 'var(--primary)', color: '#fff' }}
//                         >
//                           {idx + 1}
//                         </div>
//                         <div className="min-w-0 flex-1">
//                           <p className="font-semibold text-sm leading-snug">{it.checklist}</p>
//                           <div className="flex flex-wrap gap-2 mt-2">
//                             {it.verificationType && (
//                               <span
//                                 className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
//                                 style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}
//                               >
//                                 {it.verificationType}
//                               </span>
//                             )}
//                             {it.responsibleRole && (
//                               <span
//                                 className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
//                                 style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
//                               >
//                                 {it.responsibleRole}
//                               </span>
//                             )}
//                           </div>
//                         </div>
//                       </div>

//                       {/* Photo Upload */}
//                       <div className="mb-3">
//                         <label className="label">Evidence Photo *</label>
//                         <input
//                           type="file"
//                           accept="image/*"
//                           className="hidden"
//                           id={`file-${it.rowIndex}`}
//                           onChange={(e) =>
//                             setFormState((s) => ({
//                               ...s,
//                               [it.rowIndex]: {
//                                 ...(s[it.rowIndex] || {}),
//                                 file: e.target.files?.[0] || null,
//                               },
//                             }))
//                           }
//                         />
//                         <label
//                           htmlFor={`file-${it.rowIndex}`}
//                           className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-[10px] border-2 border-dashed cursor-pointer text-sm font-medium transition-colors"
//                           style={{
//                             borderColor: state.file ? 'var(--primary)' : 'var(--border-strong)',
//                             color: state.file ? 'var(--primary)' : 'var(--text-muted)',
//                             background: state.file ? 'var(--primary-soft)' : 'var(--surface)',
//                           }}
//                         >
//                           {state.file ? `✓ ${state.file.name}` : '📷 Click to upload photo'}
//                         </label>
//                       </div>

//                       {/* Remarks */}
//                       <div>
//                         <label className="label">Remarks (optional)</label>
//                         <textarea
//                           rows={2}
//                           className="input-field"
//                           placeholder="Koi note ho to yahan likhein..."
//                           value={state.remarks || ''}
//                           onChange={(e) =>
//                             setFormState((s) => ({
//                               ...s,
//                               [it.rowIndex]: {
//                                 ...(s[it.rowIndex] || {}),
//                                 remarks: e.target.value,
//                               },
//                             }))
//                           }
//                         />
//                       </div>
//                     </div>
//                   );
//                 })}
//               </div>
//             </div>

//             {/* Footer */}
//             {kittingItems.length > 0 && (
//               <div
//                 className="px-4 sm:px-6 py-3 border-t flex items-center justify-between gap-3"
//                 style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
//               >
//                 <p className="text-xs hidden sm:block" style={{ color: 'var(--text-muted)' }}>
//                   Sab items submit hone par Full Kitting Master me update ho jayegi
//                 </p>
//                 <div className="flex gap-2 ml-auto">
//                   <button
//                     onClick={() => setModalOpen(false)}
//                     disabled={submitting}
//                     className="text-sm font-semibold px-4 py-2 rounded-[10px] border"
//                     style={{
//                       borderColor: 'var(--border-strong)',
//                       color: 'var(--text-muted)',
//                       background: 'var(--surface)',
//                     }}
//                   >
//                     Cancel
//                   </button>
//                   <button
//                     onClick={handleFullkittingSubmit}
//                     disabled={submitting}
//                     className="btn-primary px-5 py-2"
//                   >
//                     {submitting ? 'Uploading...' : 'Submit & Update'}
//                   </button>
//                 </div>
//               </div>
//             )}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }





'use client';

import { useEffect, useState } from 'react';

// File → base64 helper
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result || '';
      resolve({
        base64: String(result).split(',')[1] || '',
        mimeType: file.type,
        name: file.name,
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function ProjectPlanPage() {
  const [sites, setSites] = useState([]);
  const [selectedSite, setSelectedSite] = useState('');
  const [headers, setHeaders] = useState([]);
  const [rows, setRows] = useState([]);

  const [loadingSites, setLoadingSites] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [taskDetails, setTaskDetails] = useState(null);
  const [kittingItems, setKittingItems] = useState([]);
  const [loadingKitting, setLoadingKitting] = useState(false);
  const [formState, setFormState] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: null, 
    row: null,
  });
  const [actionSubmitting, setActionSubmitting] = useState(false);
  
  const [completeFile, setCompleteFile] = useState(null);

  const [editModal, setEditModal] = useState({
    isOpen: false,
    row: null,
    plannedStart: '',
    plannedEnd: '',
    remarks: '',
    submitting: false,
    error: '',
  });

  useEffect(() => {
    fetch('/api/sites')
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setSites(data.sites);
        else setError(data.message || 'Sites load nahi hui');
        setLoadingSites(false);
      })
      .catch(() => {
        setError('Sites load error');
        setLoadingSites(false);
      });
  }, []);

  const loadPlan = () => {
    if (!selectedSite) {
      setHeaders([]);
      setRows([]);
      return;
    }
    setLoadingData(true);
    setError('');
    fetch(`/api/project-plan?siteId=${encodeURIComponent(selectedSite)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setHeaders(data.headers || []);
          setRows(data.rows || []);
        } else {
          setError(data.message || 'Data load nahi hua');
          setHeaders([]);
          setRows([]);
        }
        setLoadingData(false);
      })
      .catch(() => {
        setError('Server se data nahi aya');
        setLoadingData(false);
      });
  };

  useEffect(() => {
    loadPlan();
    // eslint-disable-next-line
  }, [selectedSite]);

  const openFullkitting = (row) => {
    const activity = row[headers[3]] || '';
    const subActivity = row[headers[4]] || '';
    const uid = row[headers[0]] || '';

    setTaskDetails({
      rowIndex: row._rowIndex,
      uid,
      activity,
      subActivity,
    });
    setModalOpen(true);
    setLoadingKitting(true);
    setKittingItems([]);
    setFormState({});
    setModalError('');

    const url = `/api/project-plan?action=getKitting&siteId=${encodeURIComponent(
      selectedSite
    )}&activity=${encodeURIComponent(activity)}&subActivity=${encodeURIComponent(subActivity)}`;

    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setKittingItems(data.items || []);
        else setModalError(data.message || 'Load failed');
        setLoadingKitting(false);
      })
      .catch(() => {
        setModalError('Server error');
        setLoadingKitting(false);
      });
  };

  const handleFullkittingSubmit = async () => {
    setModalError('');
    const missing = kittingItems.find((it) => !formState[it.rowIndex]?.file);
    if (missing) {
      setModalError('Har checklist item ki photo upload karna zaruri hai');
      return;
    }

    setSubmitting(true);
    try {
      const payloadItems = await Promise.all(
        kittingItems.map(async (it) => {
          const image = await fileToBase64(formState[it.rowIndex].file);
          return {
            rowIndex: it.rowIndex,
            remarks: formState[it.rowIndex]?.remarks || '',
            image,
          };
        })
      );

      const res = await fetch('/api/project-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteId: selectedSite,
          projectPlanRowIndex: taskDetails.rowIndex,
          items: payloadItems,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setModalOpen(false);
        loadPlan();
      } else {
        setModalError(data.message || 'Submit failed');
      }
    } catch (e) {
      setModalError(e.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const openConfirmModal = (type, row) => {
    setCompleteFile(null);
    setConfirmModal({ isOpen: true, type, row });
  };

  const handleConfirmAction = async () => {
    if (!confirmModal.row || !confirmModal.type) return;

    let imagePayload = null;
    if (confirmModal.type === 'complete') {
      if (!completeFile) {
        alert('Please upload an evidence photo to mark as completed.');
        return;
      }
      imagePayload = await fileToBase64(completeFile);
    }

    setActionSubmitting(true);
    try {
      const res = await fetch('/api/project-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteId: selectedSite,
          projectPlanRowIndex: confirmModal.row._rowIndex,
          action: confirmModal.type,
          image: imagePayload,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setConfirmModal({ isOpen: false, type: null, row: null });
        setCompleteFile(null);
        loadPlan();
      } else {
        alert(data.message || 'Action update failed');
      }
    } catch (e) {
      alert('Something went wrong: ' + e.message);
    } finally {
      setActionSubmitting(false);
    }
  };

  const openEditModal = (row) => {
    setEditModal({
      isOpen: true,
      row,
      plannedStart: '',
      plannedEnd: '',
      remarks: '',
      submitting: false,
      error: '',
    });
  };

  const closeEditModal = () => {
    setEditModal({
      isOpen: false,
      row: null,
      plannedStart: '',
      plannedEnd: '',
      remarks: '',
      submitting: false,
      error: '',
    });
  };

  const handleEditSubmit = async () => {
    if (!editModal.plannedStart || !editModal.plannedEnd) {
      setEditModal((s) => ({ ...s, error: 'Please select both dates' }));
      return;
    }
    if (new Date(editModal.plannedEnd) < new Date(editModal.plannedStart)) {
      setEditModal((s) => ({ ...s, error: 'End date cannot be before Start date' }));
      return;
    }

    setEditModal((s) => ({ ...s, submitting: true, error: '' }));

    try {
      const res = await fetch('/api/project-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteId: selectedSite,
          projectPlanRowIndex: editModal.row._rowIndex,
          action: 'edit',
          editData: {
            plannedStart: editModal.plannedStart,
            plannedEnd: editModal.plannedEnd,
            remarks: editModal.remarks,
          },
        }),
      });

      const data = await res.json();
      if (data.success) {
        closeEditModal();
        loadPlan();
      } else {
        setEditModal((s) => ({ ...s, submitting: false, error: data.message || 'Update failed' }));
      }
    } catch (e) {
      setEditModal((s) => ({ ...s, submitting: false, error: e.message || 'Something went wrong' }));
    }
  };

  const selectedSiteName = sites.find((s) => s.id === selectedSite)?.name || '';

  return (
    <div className="w-full max-w-none">
      <div className="mb-4 sm:mb-6 flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--accent)' }}>
            Module
          </p>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Project Plan</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Pending tasks as per precedence
          </p>
        </div>

        <div className="w-full lg:w-auto lg:min-w-[340px] lg:max-w-[400px] flex items-end gap-2">
          <div className="flex-1">
            <label className="label">Select Site</label>
            <select
              className="input-field w-full"
              value={selectedSite}
              onChange={(e) => setSelectedSite(e.target.value)}
              disabled={loadingSites}
            >
              <option value="">{loadingSites ? 'Loading sites...' : '-- Choose a site --'}</option>
              {sites.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {selectedSite && (
            <button
              onClick={loadPlan}
              disabled={loadingData}
              className="px-4 h-[42px] shrink-0 text-sm font-semibold rounded-xl border flex items-center justify-center gap-1.5 transition-all active:scale-95"
              style={{
                borderColor: 'var(--border-strong)',
                background: 'var(--surface)',
                color: 'var(--text-main)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              }}
              title="Refresh Plan Data"
            >
              {loadingData ? (
                <span className="w-4 h-4 border-2 rounded-full animate-spin shrink-0" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
              ) : (
                <span className="shrink-0">🔄</span>
              )}
              Refresh
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-[10px] px-4 py-3 text-sm font-medium" style={{ background: 'var(--danger-soft)', color: 'var(--danger)', border: '1px solid #fecaca' }}>
          {error}
        </div>
      )}

      {/* Table */}
      <div className="card w-full overflow-hidden">
        {selectedSite && !loadingData && rows.length > 0 && (
          <div className="px-3 sm:px-5 py-3 border-b flex flex-wrap items-center justify-between gap-2" style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)' }}>
            <div className="text-sm truncate">
              <span style={{ color: 'var(--text-muted)' }}>Site: </span>
              <span className="font-semibold">{selectedSiteName}</span>
            </div>
            <div className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
              {rows.length} pending tasks
            </div>
          </div>
        )}

        {!selectedSite && !loadingData && (
          <div className="p-8 sm:p-12 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-4" style={{ background: 'var(--primary-soft)' }}>
              <span className="text-2xl font-bold" style={{ color: 'var(--primary)' }}>→</span>
            </div>
            <p className="font-medium">Select a site to begin</p>
          </div>
        )}

        {loadingData && (
          <div className="p-8 sm:p-12 text-center">
            <div className="inline-block w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
            <p className="text-sm mt-3" style={{ color: 'var(--text-muted)' }}>Loading project plan...</p>
          </div>
        )}

        {selectedSite && !loadingData && rows.length === 0 && !error && (
          <div className="p-8 sm:p-12 text-center">
            <p className="font-medium">Koi pending task nahi hai</p>
          </div>
        )}

        {!loadingData && rows.length > 0 && (
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-max text-sm border-collapse">
              <thead>
                <tr style={{ background: 'var(--primary)' }}>
                  {headers.map((h, i) => (
                    <th
                      key={i}
                      className="px-3 sm:px-4 py-2.5 sm:py-3 text-left font-semibold whitespace-nowrap"
                      style={{
                        color: '#fff',
                        fontSize: '0.7rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        borderRight: '1px solid rgba(255,255,255,0.15)',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                  <th className="px-3 sm:px-4 py-2.5 sm:py-3 text-center font-semibold whitespace-nowrap" style={{ color: '#fff', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, rIdx) => {
                  const isKitted = row._isKitted;
                  const isStarted = row._isStarted;
                  const isCompleted = row._isCompleted;

                  // 🔥 Logical Step Flow Conditions
                  const canStart = isKitted && !isStarted; 
                  const canComplete = isStarted && !isCompleted; 

                  return (
                    <tr
                      key={rIdx}
                      className="transition-colors"
                      style={{ borderBottom: '1px solid var(--border)' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-elevated)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      {headers.map((h, cIdx) => (
                        <td key={cIdx} className="px-3 sm:px-4 py-2 sm:py-2.5 whitespace-nowrap" style={{ color: 'var(--text-main)' }}>
                          {row[h] ? row[h] : <span style={{ color: 'var(--text-soft)' }}>—</span>}
                        </td>
                      ))}
                      
                      <td className="px-3 sm:px-4 py-2 sm:py-2.5 text-center">
                        <div className="flex items-center justify-center gap-2 flex-wrap">
                          
                          {/* 1. Fullkitting */}
                          <button
                            onClick={() => openFullkitting(row)}
                            disabled={isKitted}
                            className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-all ${
                              isKitted ? 'opacity-50 cursor-not-allowed bg-gray-200 text-gray-600' : 'text-white hover:scale-105'
                            }`}
                            style={!isKitted ? { background: 'var(--primary)', boxShadow: '0 2px 6px rgba(15, 92, 86, 0.25)' } : {}}
                          >
                            {isKitted ? 'Fullkitted ✓' : 'Fullkitting'}
                          </button>

                          {/* 2. Start */}
                          <button
                            onClick={() => openConfirmModal('start', row)}
                            disabled={!canStart}
                            title={!isKitted ? 'Pehle Fullkitting complete karein' : ''}
                            className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-all ${
                              isStarted 
                                ? 'opacity-50 cursor-not-allowed bg-blue-100 text-blue-800' 
                                : !isKitted 
                                  ? 'opacity-50 cursor-not-allowed bg-gray-200 text-gray-500' // Waiting for kitting
                                  : 'bg-blue-600 text-white hover:bg-blue-700 hover:scale-105 shadow-md'
                            }`}
                          >
                            {isStarted ? 'Started ✓' : 'Start'}
                          </button>

                          {/* 3. Edit (Always Enabled) */}
                          <button
                            onClick={() => openEditModal(row)}
                            className="text-xs font-semibold px-3 py-1.5 rounded-full transition-all bg-amber-500 text-white hover:bg-amber-600 hover:scale-105"
                            style={{ boxShadow: '0 2px 6px rgba(245, 158, 11, 0.25)' }}
                          >
                            ✎ Edit
                          </button>

                          {/* 4. Completed */}
                          <button
                            onClick={() => openConfirmModal('complete', row)}
                            disabled={!canComplete}
                            title={isCompleted ? '' : !isStarted ? 'Pehle Task Start karein' : ''}
                            className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-all ${
                              isCompleted 
                                ? 'opacity-50 cursor-not-allowed bg-green-100 text-green-800' 
                                : !isStarted 
                                  ? 'opacity-50 cursor-not-allowed bg-gray-200 text-gray-500' // Waiting for start
                                  : 'bg-emerald-600 text-white hover:bg-emerald-700 hover:scale-105 shadow-md'
                            }`}
                          >
                            {isCompleted ? 'Completed ✓' : 'Completed'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CONFIRM MODAL (Start / Complete) */}
      {confirmModal.isOpen && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center p-4"
          style={{ background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)' }}
        >
          <div
            className="w-full max-w-md rounded-2xl shadow-2xl p-6 text-center"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <div
              className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center text-xl font-bold"
              style={{
                background: confirmModal.type === 'start' ? 'rgba(37, 99, 235, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                color: confirmModal.type === 'start' ? '#2563eb' : '#10b981',
              }}
            >
              {confirmModal.type === 'start' ? '🚀' : '✓'}
            </div>

            <h3 className="text-lg font-bold mb-2">
              Confirm {confirmModal.type === 'start' ? 'Task Start' : 'Task Completion'}?
            </h3>

            <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
              Kya aap sure hain ki Task <b>{confirmModal.row?.[headers[0]] || ''}</b> ko{' '}
              <b>{confirmModal.type === 'start' ? 'Start' : 'Completed'}</b> mark karna chahte hain?
            </p>

            {/* Image Upload Field when Complete */}
            {confirmModal.type === 'complete' && (
              <div className="mb-6 text-left p-3 rounded-lg bg-slate-50 border border-slate-200">
                <label className="label mb-2 block font-semibold text-sm">Upload Evidence Photo *</label>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  id="complete-file-upload"
                  onChange={(e) => setCompleteFile(e.target.files?.[0] || null)}
                />
                <label
                  htmlFor="complete-file-upload"
                  className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-[10px] border-2 border-dashed cursor-pointer text-sm font-medium transition-colors"
                  style={{
                    borderColor: completeFile ? 'var(--primary)' : 'var(--border-strong)',
                    color: completeFile ? 'var(--primary)' : 'var(--text-muted)',
                    background: completeFile ? 'var(--primary-soft)' : 'var(--surface)',
                  }}
                >
                  {completeFile ? `✓ ${completeFile.name}` : '📷 Click to choose photo'}
                </label>
              </div>
            )}

            <div className="flex gap-3 justify-center mt-4">
              <button
                type="button"
                disabled={actionSubmitting}
                onClick={() => { setConfirmModal({ isOpen: false, type: null, row: null }); setCompleteFile(null); }}
                className="px-5 py-2 text-sm font-semibold rounded-xl border"
                style={{ borderColor: 'var(--border-strong)', color: 'var(--text-muted)' }}
              >
                No, Cancel
              </button>

              <button
                type="button"
                disabled={actionSubmitting}
                onClick={handleConfirmAction}
                className="px-6 py-2 text-sm font-semibold text-white rounded-xl shadow-md transition-transform hover:scale-105"
                style={{ background: confirmModal.type === 'start' ? '#2563eb' : '#10b981' }}
              >
                {actionSubmitting ? 'Updating...' : 'Yes, Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editModal.isOpen && (
        <div className="fixed inset-0 z-[115] flex items-center justify-center p-4" style={{ background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)' }}>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--accent)' }}>Edit / Exception</p>
                <h2 className="text-base font-semibold mt-0.5">{editModal.row?.[headers[3]] || ''}</h2>
              </div>
              <button onClick={closeEditModal} disabled={editModal.submitting} className="w-9 h-9 rounded-lg border font-bold text-gray-500">✕</button>
            </div>
            <div className="px-5 py-5 space-y-4">
              {editModal.error && <div className="rounded-[10px] px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200">{editModal.error}</div>}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Next Planned Start Date *</label>
                  <input type="date" className="input-field w-full" value={editModal.plannedStart} onChange={(e) => setEditModal((s) => ({ ...s, plannedStart: e.target.value }))} disabled={editModal.submitting} />
                </div>
                <div>
                  <label className="label">Next Planned End Date *</label>
                  <input type="date" className="input-field w-full" value={editModal.plannedEnd} onChange={(e) => setEditModal((s) => ({ ...s, plannedEnd: e.target.value }))} disabled={editModal.submitting} />
                </div>
              </div>
              <div>
                <label className="label">Remarks</label>
                <textarea rows={3} className="input-field w-full" value={editModal.remarks} onChange={(e) => setEditModal((s) => ({ ...s, remarks: e.target.value }))} disabled={editModal.submitting} />
              </div>
            </div>
            <div className="px-5 py-3 border-t flex justify-end gap-2" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
              <button onClick={closeEditModal} disabled={editModal.submitting} className="text-sm font-semibold px-4 py-2 rounded-[10px] border text-gray-500">Cancel</button>
              <button onClick={handleEditSubmit} disabled={editModal.submitting} className="text-sm font-semibold px-5 py-2 rounded-[10px] text-white bg-amber-500">{editModal.submitting ? 'Saving...' : 'Save Changes'}</button>
            </div>
          </div>
        </div>
      )}

      {/* FULLKITTING MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4" style={{ background: 'rgba(15, 23, 42, 0.55)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-3xl max-h-[92vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden" style={{ background: 'var(--surface)' }}>
            <div className="px-4 sm:px-6 py-4 border-b flex items-center justify-between gap-3" style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)' }}>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--accent)' }}>Full Kitting — {taskDetails?.uid}</p>
                <h2 className="text-lg font-semibold truncate">{taskDetails?.activity} <span style={{ color: 'var(--text-muted)' }}>›</span> {taskDetails?.subActivity}</h2>
              </div>
              <button onClick={() => setModalOpen(false)} className="w-9 h-9 rounded-lg border flex items-center justify-center font-bold" style={{ borderColor: 'var(--border-strong)', background: 'var(--surface)' }}>✕</button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5">
              {loadingKitting && (
                <div className="py-12 text-center">
                  <div className="inline-block w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
                  <p className="text-sm mt-3" style={{ color: 'var(--text-muted)' }}>Loading checklist...</p>
                </div>
              )}
              {!loadingKitting && kittingItems.length === 0 && !modalError && (
                <div className="py-10 text-center text-sm" style={{ color: 'var(--text-muted)' }}>Is activity ke liye Full Kitting Master me koi checklist nahi mili</div>
              )}
              {modalError && (
                <div className="mb-4 rounded-[10px] px-4 py-3 text-sm font-medium" style={{ background: 'var(--danger-soft)', color: 'var(--danger)', border: '1px solid #fecaca' }}>{modalError}</div>
              )}
              <div className="space-y-4">
                {kittingItems.map((it, idx) => {
                  const state = formState[it.rowIndex] || {};
                  return (
                    <div key={it.rowIndex} className="rounded-[12px] border p-4" style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)' }}>
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ background: 'var(--primary)', color: '#fff' }}>{idx + 1}</div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-sm leading-snug">{it.checklist}</p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {it.verificationType && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}>{it.verificationType}</span>}
                            {it.responsibleRole && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>{it.responsibleRole}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="mb-3">
                        <label className="label">Evidence Photo *</label>
                        <input type="file" accept="image/*" className="hidden" id={`file-${it.rowIndex}`} onChange={(e) => setFormState((s) => ({ ...s, [it.rowIndex]: { ...(s[it.rowIndex] || {}), file: e.target.files?.[0] || null } }))} />
                        <label htmlFor={`file-${it.rowIndex}`} className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-[10px] border-2 border-dashed cursor-pointer text-sm font-medium transition-colors" style={{ borderColor: state.file ? 'var(--primary)' : 'var(--border-strong)', color: state.file ? 'var(--primary)' : 'var(--text-muted)', background: state.file ? 'var(--primary-soft)' : 'var(--surface)' }}>
                          {state.file ? `✓ ${state.file.name}` : '📷 Click to upload photo'}
                        </label>
                      </div>
                      <div>
                        <label className="label">Remarks (optional)</label>
                        <textarea rows={2} className="input-field" placeholder="Koi note ho to yahan likhein..." value={state.remarks || ''} onChange={(e) => setFormState((s) => ({ ...s, [it.rowIndex]: { ...(s[it.rowIndex] || {}), remarks: e.target.value } }))} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            {kittingItems.length > 0 && (
              <div className="px-4 sm:px-6 py-3 border-t flex items-center justify-between gap-3" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
                <p className="text-xs hidden sm:block" style={{ color: 'var(--text-muted)' }}>Sab items submit hone par Full Kitting Master me update ho jayegi</p>
                <div className="flex gap-2 ml-auto">
                  <button onClick={() => setModalOpen(false)} disabled={submitting} className="text-sm font-semibold px-4 py-2 rounded-[10px] border" style={{ borderColor: 'var(--border-strong)', color: 'var(--text-muted)', background: 'var(--surface)' }}>Cancel</button>
                  <button onClick={handleFullkittingSubmit} disabled={submitting} className="btn-primary px-5 py-2">{submitting ? 'Uploading...' : 'Submit & Update'}</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}