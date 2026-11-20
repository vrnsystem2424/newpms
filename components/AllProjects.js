




// 'use client';

// import { useState, useEffect } from 'react';
// import {
//   Building2,
//   Clock,
//   AlertTriangle,
//   Calendar,
//   RefreshCw,
//   TrendingUp,
//   CheckCircle2,
//   Zap,
//   ArrowUpRight,
//   ArrowDownRight,
// } from 'lucide-react';

// export default function AllProjects() {
//   const [projectData, setProjectData] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [filter, setFilter] = useState('all');

//   useEffect(() => {
//     loadData();
//   }, []);

//   const loadData = async () => {
//     try {
//       setLoading(true);
//       setError(null);
//       const res = await fetch('/api/all-projects');
//       const result = await res.json();
//       if (result.success) setProjectData(result.data || []);
//       else setError(result.message || 'Failed to load project data');
//     } catch (err) {
//       setError(err.message || 'Error fetching data');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const getStatus = (bufferPct) => {
//     if (bufferPct > 100) return { 
//       label: 'Delayed', 
//       color: '#dc2626', 
//       bg: '#fef2f2',
//       lightBg: '#fee2e2',
//       gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
//     };
//     if (bufferPct > 80) return { 
//       label: 'At Risk', 
//       color: '#d97706', 
//       bg: '#fffbeb',
//       lightBg: '#fef3c7',
//       gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
//     };
//     return { 
//       label: 'On Track', 
//       color: '#059669', 
//       bg: '#f0fdf4',
//       lightBg: '#dcfce7',
//       gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
//     };
//   };

//   const totalProjects = projectData.length;
//   const onTrackProjects = projectData.filter(p => p.bufferUsedPct <= 80).length;
//   const atRiskProjects = projectData.filter(p => p.bufferUsedPct > 80 && p.bufferUsedPct <= 100).length;
//   const delayedProjects = projectData.filter(p => p.bufferUsedPct > 100).length;

//   const filteredData = projectData.filter(p => {
//     if (filter === 'all') return true;
//     if (filter === 'ontrack') return p.bufferUsedPct <= 80;
//     if (filter === 'risk') return p.bufferUsedPct > 80 && p.bufferUsedPct <= 100;
//     if (filter === 'delayed') return p.bufferUsedPct > 100;
//     return true;
//   });

//   if (loading) {
//     return (
//       <div className="loader-container">
//         <div className="loader"></div>
//         <div className="loader-text">Loading project data...</div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="empty-state">
//         <div className="empty-state-icon"><AlertTriangle size={32} /></div>
//         <div className="empty-state-title">Error Loading Data</div>
//         <p className="text-sm text-slate-500 mt-1">{error}</p>
//         <button className="btn btn-primary mt-4" onClick={loadData}>
//           <RefreshCw size={16} /> Retry
//         </button>
//       </div>
//     );
//   }

//   return (
//     <div>
//       {/* Page Header */}
//       <div className="page-header">
//         <div>
//           <h1 className="page-title">Projects Dashboard</h1>
//           <p className="page-subtitle">Monitor and manage all your active projects</p>
//         </div>
//         <button className="btn btn-primary" onClick={loadData}>
//           <RefreshCw size={16} />
//           Refresh
//         </button>
//       </div>

//       {/* Stats Cards */}
//       <div className="stats-grid">
//         <div className="stat-card">
//           <div className="stat-card-icon primary">
//             <Building2 size={20} />
//           </div>
//           <div className="stat-card-label">Total Projects</div>
//           <div className="stat-card-value">{totalProjects}</div>
//         </div>

//         <div className="stat-card">
//           <div className="stat-card-icon success">
//             <TrendingUp size={20} />
//           </div>
//           <div className="stat-card-label">On Track</div>
//           <div className="stat-card-value">{onTrackProjects}</div>
//         </div>

//         <div className="stat-card">
//           <div className="stat-card-icon warning">
//             <AlertTriangle size={20} />
//           </div>
//           <div className="stat-card-label">At Risk</div>
//           <div className="stat-card-value">{atRiskProjects}</div>
//         </div>

//         <div className="stat-card">
//           <div className="stat-card-icon danger">
//             <Clock size={20} />
//           </div>
//           <div className="stat-card-label">Delayed</div>
//           <div className="stat-card-value">{delayedProjects}</div>
//         </div>
//       </div>

//       {/* Filter Buttons */}
//       <div className="flex gap-2 mt-6 mb-5 flex-wrap">
//         {[
//           { id: 'all', label: 'All Projects', count: totalProjects, color: '#6366f1' },
//           { id: 'ontrack', label: 'On Track', count: onTrackProjects, color: '#10b981' },
//           { id: 'risk', label: 'At Risk', count: atRiskProjects, color: '#f59e0b' },
//           { id: 'delayed', label: 'Delayed', count: delayedProjects, color: '#dc2626' },
//         ].map(f => (
//           <button
//             key={f.id}
//             onClick={() => setFilter(f.id)}
//             style={{
//               padding: '8px 16px',
//               borderRadius: '10px',
//               border: filter === f.id ? `2px solid ${f.color}` : '2px solid #e2e8f0',
//               background: filter === f.id ? f.color + '15' : 'white',
//               color: filter === f.id ? f.color : '#64748b',
//               fontSize: '13px',
//               fontWeight: '600',
//               cursor: 'pointer',
//               display: 'flex',
//               alignItems: 'center',
//               gap: '8px',
//               transition: 'all 0.2s'
//             }}
//           >
//             {f.label}
//             <span style={{
//               background: filter === f.id ? f.color : '#e2e8f0',
//               color: filter === f.id ? 'white' : '#64748b',
//               padding: '2px 8px',
//               borderRadius: '10px',
//               fontSize: '11px',
//               fontWeight: '700'
//             }}>
//               {f.count}
//             </span>
//           </button>
//         ))}
//       </div>

//       {/* Project Cards Grid */}
//       <div style={{ 
//         display: 'grid', 
//         gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', 
//         gap: '20px',
//       }}>
//         {filteredData.map((row, idx) => {
//           const status = getStatus(row.bufferUsedPct);
//           const isDelayed = row.daysLeft < 0;
          
//           return (
//             <div 
//               key={idx}
//               style={{
//                 background: '#ffffff',
//                 borderRadius: '16px',
//                 overflow: 'hidden',
//                 border: '1px solid #e2e8f0',
//                 boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
//                 transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
//                 position: 'relative',
//               }}
//             >
//               <div style={{ height: '4px', background: status.gradient }} />

//               <div style={{ padding: '20px' }}>
//                 <div style={{ 
//                   display: 'flex', 
//                   justifyContent: 'space-between', 
//                   alignItems: 'flex-start',
//                   marginBottom: '20px',
//                   gap: '12px'
//                 }}>
//                   <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flex: 1, minWidth: 0 }}>
//                     <div style={{
//                       width: '44px',
//                       height: '44px',
//                       borderRadius: '12px',
//                       background: status.gradient,
//                       display: 'flex',
//                       alignItems: 'center',
//                       justifyContent: 'center',
//                       color: 'white',
//                       flexShrink: 0,
//                       boxShadow: `0 4px 12px ${status.color}40`
//                     }}>
//                       <Building2 size={22} />
//                     </div>
//                     <div style={{ minWidth: 0, flex: 1 }}>
//                       <div style={{ 
//                         fontSize: '15px', 
//                         fontWeight: '700', 
//                         color: '#0f172a',
//                         whiteSpace: 'nowrap',
//                         overflow: 'hidden',
//                         textOverflow: 'ellipsis'
//                       }}>
//                         {row.siteName}
//                       </div>
//                       <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px', fontWeight: '500' }}>
//                         Project #{idx + 1}
//                       </div>
//                     </div>
//                   </div>
                  
//                   <div style={{
//                     padding: '6px 12px',
//                     borderRadius: '20px',
//                     background: status.lightBg,
//                     color: status.color,
//                     fontSize: '11px',
//                     fontWeight: '700',
//                     display: 'flex',
//                     alignItems: 'center',
//                     gap: '4px',
//                     whiteSpace: 'nowrap'
//                   }}>
//                     <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: status.color }} />
//                     {status.label}
//                   </div>
//                 </div>

//                 <div style={{
//                   display: 'grid',
//                   gridTemplateColumns: '1fr 1fr',
//                   gap: '12px',
//                   marginBottom: '20px'
//                 }}>
//                   <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
//                     <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
//                       <CheckCircle2 size={14} style={{ color: '#8b5cf6' }} />
//                       <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.3px' }}>
//                         Completion
//                       </span>
//                     </div>
//                     <div style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a', lineHeight: '1' }}>
//                       {row.completion}
//                       <span style={{ fontSize: '16px', color: '#94a3b8' }}>%</span>
//                     </div>
//                   </div>

//                   <div style={{ padding: '16px', background: status.bg, borderRadius: '12px', border: `1px solid ${status.lightBg}` }}>
//                     <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
//                       <Zap size={14} style={{ color: status.color }} />
//                       <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.3px' }}>
//                         Buffer Used
//                       </span>
//                     </div>
//                     <div style={{ fontSize: '28px', fontWeight: '800', color: status.color, lineHeight: '1' }}>
//                       {row.bufferUsedPct}
//                       <span style={{ fontSize: '16px' }}>%</span>
//                     </div>
//                   </div>
//                 </div>

//                 <div style={{ marginBottom: '20px' }}>
//                   <div style={{ marginBottom: '12px' }}>
//                     <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '6px', color: '#64748b', fontWeight: '600' }}>
//                       <span>Project Progress</span>
//                       <span style={{ color: '#0f172a' }}>{row.completion}%</span>
//                     </div>
//                     <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '10px', overflow: 'hidden' }}>
//                       <div style={{
//                         height: '100%',
//                         width: `${Math.min(row.completion, 100)}%`,
//                         background: 'linear-gradient(90deg, #8b5cf6, #6366f1)',
//                         borderRadius: '10px',
//                       }} />
//                     </div>
//                   </div>

//                   <div>
//                     <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '6px', color: '#64748b', fontWeight: '600' }}>
//                       <span>Buffer Consumed</span>
//                       <span style={{ color: status.color }}>{row.bufferUsedPct}%</span>
//                     </div>
//                     <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '10px', overflow: 'hidden' }}>
//                       <div style={{
//                         height: '100%',
//                         width: `${Math.min(row.bufferUsedPct, 100)}%`,
//                         background: status.gradient,
//                         borderRadius: '10px',
//                       }} />
//                     </div>
//                   </div>
//                 </div>

//                 <div style={{
//                   display: 'grid',
//                   gridTemplateColumns: 'repeat(3, 1fr)',
//                   gap: '8px',
//                   padding: '14px',
//                   background: '#f8fafc',
//                   borderRadius: '12px',
//                   marginBottom: '16px'
//                 }}>
//                   <div style={{ textAlign: 'center' }}>
//                     <div style={{ fontSize: '16px', fontWeight: '700', color: '#0369a1' }}>{row.totalTime}</div>
//                     <div style={{ fontSize: '9px', color: '#64748b', textTransform: 'uppercase', fontWeight: '600', marginTop: '2px' }}>Total Days</div>
//                   </div>
//                   <div style={{ textAlign: 'center', borderLeft: '1px solid #e2e8f0' }}>
//                     <div style={{ fontSize: '16px', fontWeight: '700', color: '#a16207' }}>{row.totalBuffer}</div>
//                     <div style={{ fontSize: '9px', color: '#64748b', textTransform: 'uppercase', fontWeight: '600', marginTop: '2px' }}>Total Buffer</div>
//                   </div>
//                   <div style={{ textAlign: 'center', borderLeft: '1px solid #e2e8f0' }}>
//                     <div style={{ fontSize: '16px', fontWeight: '700', color: '#059669' }}>{row.remainingBuffer}</div>
//                     <div style={{ fontSize: '9px', color: '#64748b', textTransform: 'uppercase', fontWeight: '600', marginTop: '2px' }}>Buffer Left</div>
//                   </div>
//                 </div>

//                 <div style={{ 
//                   display: 'flex', 
//                   justifyContent: 'space-between', 
//                   alignItems: 'center',
//                   paddingTop: '16px',
//                   borderTop: '1px dashed #e2e8f0'
//                 }}>
//                   <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
//                     <div style={{
//                       width: '32px',
//                       height: '32px',
//                       borderRadius: '8px',
//                       background: '#f1f5f9',
//                       display: 'flex',
//                       alignItems: 'center',
//                       justifyContent: 'center',
//                       color: '#64748b'
//                     }}>
//                       <Calendar size={16} />
//                     </div>
//                     <div>
//                       <div style={{ fontSize: '9px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.5px' }}>Start & Deadline</div>
//                       <div style={{ fontSize: '11px', fontWeight: '700', color: '#0f172a', marginTop: '1px' }}>
//                         {row.startDate || 'N/A'} → {row.endDate || 'N/A'}
//                       </div>
//                     </div>
//                   </div>
                  
//                   <div style={{
//                     display: 'flex',
//                     alignItems: 'center',
//                     gap: '8px',
//                     padding: '8px 14px',
//                     borderRadius: '10px',
//                     background: isDelayed ? '#fef2f2' : '#f0fdf4',
//                     border: `1px solid ${isDelayed ? '#fecaca' : '#bbf7d0'}`
//                   }}>
//                     {isDelayed ? (
//                       <ArrowDownRight size={16} style={{ color: '#dc2626' }} />
//                     ) : (
//                       <ArrowUpRight size={16} style={{ color: '#059669' }} />
//                     )}
//                     <div>
//                       <div style={{ fontSize: '14px', fontWeight: '800', color: isDelayed ? '#dc2626' : '#059669', lineHeight: '1' }}>
//                         {Math.abs(row.daysLeft)}
//                       </div>
//                       <div style={{ fontSize: '9px', color: isDelayed ? '#991b1b' : '#065f46', textTransform: 'uppercase', fontWeight: '700', marginTop: '2px', letterSpacing: '0.3px' }}>
//                         {isDelayed ? 'Overdue' : 'Days Left'}
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           );
//         })}
//       </div>

//       {filteredData.length === 0 && (
//         <div className="empty-state" style={{ marginTop: '20px' }}>
//           <div className="empty-state-icon"><Building2 size={32} /></div>
//           <div className="empty-state-title">No projects found</div>
//           <p>Try changing the filter</p>
//         </div>
//       )}
//     </div>
//   );
// }








'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Building2,
  Clock,
  AlertTriangle,
  Calendar,
  RefreshCw,
  TrendingUp,
  CheckCircle2,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
} from 'lucide-react';

export default function AllProjects() {
  const [projectData, setProjectData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  
  // ✅ Naya State: '-' se pehle wale group ko filter karne ke liye
  const [selectedGroup, setSelectedGroup] = useState('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/all-projects');
      const result = await res.json();
      if (result.success) setProjectData(result.data || []);
      else setError(result.message || 'Failed to load project data');
    } catch (err) {
      setError(err.message || 'Error fetching data');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Helper: Name me se '-' ke pehle ka hissa nikalne ke liye (e.g. "SH-CPMS" -> "SH")
  const getProjectPrefix = (siteName) => {
    if (!siteName) return 'Other';
    const parts = siteName.split('-');
    return parts[0]?.trim() || 'Other';
  };

  // ✅ Sabhi Unique Groups ki list
  const projectGroups = useMemo(() => {
    const groups = new Set();
    projectData.forEach((p) => {
      if (p.siteName) {
        groups.add(getProjectPrefix(p.siteName));
      }
    });
    return Array.from(groups);
  }, [projectData]);

  const getStatus = (bufferPct) => {
    if (bufferPct > 100) return { 
      label: 'Delayed', 
      color: '#dc2626', 
      bg: '#fef2f2',
      lightBg: '#fee2e2',
      gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
    };
    if (bufferPct > 80) return { 
      label: 'At Risk', 
      color: '#d97706', 
      bg: '#fffbeb',
      lightBg: '#fef3c7',
      gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
    };
    return { 
      label: 'On Track', 
      color: '#059669', 
      bg: '#f0fdf4',
      lightBg: '#dcfce7',
      gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
    };
  };

  // ✅ Selected Group ke hisab se projects filter karein
  const groupFilteredData = useMemo(() => {
    if (selectedGroup === 'all') return projectData;
    return projectData.filter((p) => getProjectPrefix(p.siteName) === selectedGroup);
  }, [projectData, selectedGroup]);

  // Status Counts jo selected group ke hisab se update honge
  const totalProjects = groupFilteredData.length;
  const onTrackProjects = groupFilteredData.filter(p => p.bufferUsedPct <= 80).length;
  const atRiskProjects = groupFilteredData.filter(p => p.bufferUsedPct > 80 && p.bufferUsedPct <= 100).length;
  const delayedProjects = groupFilteredData.filter(p => p.bufferUsedPct > 100).length;

  // Final filtered data (Group Filter + Status Filter)
  const filteredData = groupFilteredData.filter(p => {
    if (filter === 'all') return true;
    if (filter === 'ontrack') return p.bufferUsedPct <= 80;
    if (filter === 'risk') return p.bufferUsedPct > 80 && p.bufferUsedPct <= 100;
    if (filter === 'delayed') return p.bufferUsedPct > 100;
    return true;
  });

  if (loading) {
    return (
      <div className="loader-container">
        <div className="loader"></div>
        <div className="loader-text">Loading project data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon"><AlertTriangle size={32} /></div>
        <div className="empty-state-title">Error Loading Data</div>
        <p className="text-sm text-slate-500 mt-1">{error}</p>
        <button className="btn btn-primary mt-4" onClick={loadData}>
          <RefreshCw size={16} /> Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="page-header flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="page-title text-2xl font-bold text-slate-900">Projects Dashboard</h1>
          <p className="page-subtitle text-slate-500 text-sm mt-1">Monitor and manage all your active projects</p>
        </div>

        {/* ✅ Controls: Project Filter Dropdown & Refresh Button */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-sm">
            <Filter size={16} className="text-slate-500 shrink-0" />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Project:</span>
            <select
              value={selectedGroup}
              onChange={(e) => {
                setSelectedGroup(e.target.value);
                setFilter('all'); // Group change hone par status filter reset
              }}
              style={{
                outline: 'none',
                background: 'transparent',
                fontWeight: '700',
                fontSize: '13px',
                color: '#0f172a',
                cursor: 'pointer',
              }}
            >
              <option value="all">All Projects ({projectData.length})</option>
              {projectGroups.map((grp) => {
                const count = projectData.filter(p => getProjectPrefix(p.siteName) === grp).length;
                return (
                  <option key={grp} value={grp}>
                    {grp} ({count})
                  </option>
                );
              })}
            </select>
          </div>

          <button className="btn btn-primary flex items-center gap-2" onClick={loadData}>
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-icon primary">
            <Building2 size={20} />
          </div>
          <div className="stat-card-label">Total Projects {selectedGroup !== 'all' ? `(${selectedGroup})` : ''}</div>
          <div className="stat-card-value">{totalProjects}</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon success">
            <TrendingUp size={20} />
          </div>
          <div className="stat-card-label">On Track</div>
          <div className="stat-card-value">{onTrackProjects}</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon warning">
            <AlertTriangle size={20} />
          </div>
          <div className="stat-card-label">At Risk</div>
          <div className="stat-card-value">{atRiskProjects}</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon danger">
            <Clock size={20} />
          </div>
          <div className="stat-card-label">Delayed</div>
          <div className="stat-card-value">{delayedProjects}</div>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-2 mt-6 mb-5 flex-wrap">
        {[
          { id: 'all', label: 'All Status', count: totalProjects, color: '#6366f1' },
          { id: 'ontrack', label: 'On Track', count: onTrackProjects, color: '#10b981' },
          { id: 'risk', label: 'At Risk', count: atRiskProjects, color: '#f59e0b' },
          { id: 'delayed', label: 'Delayed', count: delayedProjects, color: '#dc2626' },
        ].map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            style={{
              padding: '8px 16px',
              borderRadius: '10px',
              border: filter === f.id ? `2px solid ${f.color}` : '2px solid #e2e8f0',
              background: filter === f.id ? f.color + '15' : 'white',
              color: filter === f.id ? f.color : '#64748b',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s'
            }}
          >
            {f.label}
            <span style={{
              background: filter === f.id ? f.color : '#e2e8f0',
              color: filter === f.id ? 'white' : '#64748b',
              padding: '2px 8px',
              borderRadius: '10px',
              fontSize: '11px',
              fontWeight: '700'
            }}>
              {f.count}
            </span>
          </button>
        ))}
      </div>

      {/* Project Cards Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', 
        gap: '20px',
      }}>
        {filteredData.map((row, idx) => {
          const status = getStatus(row.bufferUsedPct);
          const isDelayed = row.daysLeft < 0;
          return (
            <div 
              key={idx}
              style={{
                background: '#ffffff',
                borderRadius: '16px',
                overflow: 'hidden',
                border: '1px solid #e2e8f0',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
              }}
            >
              <div style={{ height: '4px', background: status.gradient }} />

              <div style={{ padding: '20px' }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'flex-start',
                  marginBottom: '20px',
                  gap: '12px'
                }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flex: 1, minWidth: 0 }}>
                    <div style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '12px',
                      background: status.gradient,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      flexShrink: 0,
                      boxShadow: `0 4px 12px ${status.color}40`
                    }}>
                      <Building2 size={22} />
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ 
                        fontSize: '15px', 
                        fontWeight: '700', 
                        color: '#0f172a',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {row.siteName}
                      </div>
                      <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px', fontWeight: '500' }}>
                        Project #{idx + 1}
                      </div>
                    </div>
                  </div>
                  <div style={{
                    padding: '6px 12px',
                    borderRadius: '20px',
                    background: status.lightBg,
                    color: status.color,
                    fontSize: '11px',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    whiteSpace: 'nowrap'
                  }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: status.color }} />
                    {status.label}
                  </div>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px',
                  marginBottom: '20px'
                }}>
                  <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                      <CheckCircle2 size={14} style={{ color: '#8b5cf6' }} />
                      <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.3px' }}>
                        Completion
                      </span>
                    </div>
                    <div style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a', lineHeight: '1' }}>
                      {row.completion}
                      <span style={{ fontSize: '16px', color: '#94a3b8' }}>%</span>
                    </div>
                  </div>

                  <div style={{ padding: '16px', background: status.bg, borderRadius: '12px', border: `1px solid ${status.lightBg}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                      <Zap size={14} style={{ color: status.color }} />
                      <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.3px' }}>
                        Buffer Used
                      </span>
                    </div>
                    <div style={{ fontSize: '28px', fontWeight: '800', color: status.color, lineHeight: '1' }}>
                      {row.bufferUsedPct}
                      <span style={{ fontSize: '16px' }}>%</span>
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '6px', color: '#64748b', fontWeight: '600' }}>
                      <span>Project Progress</span>
                      <span style={{ color: '#0f172a' }}>{row.completion}%</span>
                    </div>
                    <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '10px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${Math.min(row.completion, 100)}%`,
                        background: 'linear-gradient(90deg, #8b5cf6, #6366f1)',
                        borderRadius: '10px',
                      }} />
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '6px', color: '#64748b', fontWeight: '600' }}>
                      <span>Buffer Consumed</span>
                      <span style={{ color: status.color }}>{row.bufferUsedPct}%</span>
                    </div>
                    <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '10px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${Math.min(row.bufferUsedPct, 100)}%`,
                        background: status.gradient,
                        borderRadius: '10px',
                      }} />
                    </div>
                  </div>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '8px',
                  padding: '14px',
                  background: '#f8fafc',
                  borderRadius: '12px',
                  marginBottom: '16px'
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '16px', fontWeight: '700', color: '#0369a1' }}>{row.totalTime}</div>
                    <div style={{ fontSize: '9px', color: '#64748b', textTransform: 'uppercase', fontWeight: '600', marginTop: '2px' }}>Total Days</div>
                  </div>
                  <div style={{ textAlign: 'center', borderLeft: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '16px', fontWeight: '700', color: '#a16207' }}>{row.totalBuffer}</div>
                    <div style={{ fontSize: '9px', color: '#64748b', textTransform: 'uppercase', fontWeight: '600', marginTop: '2px' }}>Total Buffer</div>
                  </div>
                  <div style={{ textAlign: 'center', borderLeft: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '16px', fontWeight: '700', color: '#059669' }}>{row.remainingBuffer}</div>
                    <div style={{ fontSize: '9px', color: '#64748b', textTransform: 'uppercase', fontWeight: '600', marginTop: '2px' }}>Buffer Left</div>
                  </div>
                </div>

                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  paddingTop: '16px',
                  borderTop: '1px dashed #e2e8f0'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: '#f1f5f9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#64748b'
                    }}>
                      <Calendar size={16} />
                    </div>
                    <div>
                      <div style={{ fontSize: '9px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.5px' }}>Start & Deadline</div>
                      <div style={{ fontSize: '11px', fontWeight: '700', color: '#0f172a', marginTop: '1px' }}>
                        {row.startDate || 'N/A'} → {row.endDate || 'N/A'}
                      </div>
                    </div>
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 14px',
                    borderRadius: '10px',
                    background: isDelayed ? '#fef2f2' : '#f0fdf4',
                    border: `1px solid ${isDelayed ? '#fecaca' : '#bbf7d0'}`
                  }}>
                    {isDelayed ? (
                      <ArrowDownRight size={16} style={{ color: '#dc2626' }} />
                    ) : (
                      <ArrowUpRight size={16} style={{ color: '#059669' }} />
                    )}
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '800', color: isDelayed ? '#dc2626' : '#059669', lineHeight: '1' }}>
                        {Math.abs(row.daysLeft)}
                      </div>
                      <div style={{ fontSize: '9px', color: isDelayed ? '#991b1b' : '#065f46', textTransform: 'uppercase', fontWeight: '700', marginTop: '2px', letterSpacing: '0.3px' }}>
                        {isDelayed ? 'Overdue' : 'Days Left'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredData.length === 0 && (
        <div className="empty-state" style={{ marginTop: '20px' }}>
          <div className="empty-state-icon"><Building2 size={32} /></div>
          <div className="empty-state-title">No projects found</div>
          <p>Try changing the filter or selecting another project group</p>
        </div>
      )}
    </div>
  );
}






