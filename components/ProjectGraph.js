
// 'use client';

// import { useState, useEffect } from 'react';
// import { TrendingUp, TrendingDown, Shield, Activity, Target, AlertCircle } from 'lucide-react';
// import {
//   ComposedChart,
//   Area,
//   Line,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
//   ResponsiveContainer,
//   ReferenceLine,
// } from 'recharts';

// export default function ProjectGraph() {
//   const [sites, setSites] = useState([]);
//   const [selectedSite, setSelectedSite] = useState('');
//   const [loading, setLoading] = useState(false);
//   const [projectData, setProjectData] = useState(null);
//   const [trendData, setTrendData] = useState([]);

//   useEffect(() => {
//     loadSites();
//   }, []);

//   const loadSites = async () => {
//     try {
//       const res = await fetch('/api/sites');
//       const result = await res.json();
//       if (result.success) setSites(result.sites || result.data || []);
//     } catch (err) {
//       console.error(err);
//     }
//   };

//   const handleSiteChange = async (e) => {
//     const site = e.target.value;
//     setSelectedSite(site);
//     if (!site) {
//       setProjectData(null);
//       setTrendData([]);
//       return;
//     }
//     setLoading(true);
//     try {
//       const [pRes, tRes] = await Promise.all([
//         fetch(`/api/buffer/project?site=${encodeURIComponent(site)}`),
//         fetch(`/api/buffer/trend?site=${encodeURIComponent(site)}`),
//       ]);
//       const pResult = await pRes.json();
//       const tResult = await tRes.json();
//       if (pResult.success) setProjectData(pResult.data);
//       if (tResult.success) setTrendData(tResult.data || []);
//     } catch (err) {
//       alert('Error: ' + err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Y-axis Bounds calculation
//   const getYAxisBounds = () => {
//     if (!trendData?.length) return { yMin: 0, yMax: 100 };
//     const vals = trendData.map((p) => Number(p.bufferUsed) || 0);
//     const maxB = Math.max(...vals, 0);
//     const minB = Math.min(...vals, 0);
//     let yMax = 100;
//     if (maxB > 100) yMax = Math.ceil(maxB / 25) * 25;
//     let yMin = 0;
//     if (minB < 0) yMin = Math.min(-10, Math.floor(minB / 10) * 10);
//     return { yMin, yMax };
//   };

//   // Zoom setup for early phases
//   const getXAxisDomain = () => {
//     if (!trendData?.length) return [0, 100];
//     const maxP = Math.max(...trendData.map((p) => Number(p.progress) || 0), 0);
//     if (maxP < 12) return [0, Math.max(15, Math.ceil(maxP * 2.5 + 4))];
//     if (maxP < 35) return [0, Math.min(100, Math.ceil(maxP * 1.6))];
//     return [0, 100];
//   };

//   const buildChartData = () => {
//     const { yMin, yMax } = getYAxisBounds();
//     const [, xMax] = getXAxisDomain();

//     const raw = [];
//     const step = xMax <= 20 ? 1 : xMax <= 50 ? 2 : 5;
//     for (let i = 0; i <= xMax; i += step) {
//       const p = i;
//       const p100 = xMax >= 100 ? p : (p / xMax) * 100;
//       raw.push({
//         progress: i,
//         greenZone: (p100 / 100) * 33,
//         yellowZone: 33 + (p100 / 100) * 33,
//         redZone: yMax < 100 ? Math.max(yMax, 100) : 100,
//         bufferLine: null,
//         isTaskDot: false,
//       });
//     }

//     if (trendData?.length) {
//       const sorted = [...trendData].sort(
//         (a, b) => (Number(a.progress) || 0) - (Number(b.progress) || 0)
//       );
//       const minGap = Math.max(xMax / Math.max(sorted.length * 3, 1), 0.6);
      
//       // Start Graph from 0,0
//       raw.push({
//         progress: 0,
//         trueProgress: 0,
//         greenZone: 0,
//         yellowZone: 33,
//         redZone: yMax < 100 ? Math.max(yMax, 100) : 100,
//         bufferLine: 0,
//         isTaskDot: false, 
//       });

//       let lastX = 0;

//       sorted.forEach((point) => {
//         let x = Number(point.progress) || 0;
//         if (x < lastX + minGap) x = lastX + minGap;
//         if (x > xMax) x = xMax;
//         lastX = x;

//         const p100 = xMax >= 100 ? x : (x / xMax) * 100;
//         raw.push({
//           progress: x,
//           trueProgress: point.progress,
//           greenZone: (p100 / 100) * 33,
//           yellowZone: 33 + (p100 / 100) * 33,
//           redZone: yMax < 100 ? Math.max(yMax, 100) : 100,
//           bufferLine: point.bufferUsed, 
//           activity: point.activity,
//           subActivity: point.subActivity,
//           uid: point.uid,
//           taskDelay: point.taskDelay,
//           cumulativeDelay: point.cumulativeDelay,
//           totalTasksInSheet: point.totalTasksInSheet,
//           isTaskDot: true,
//         });
//       });
//     }

//     raw.sort((a, b) => a.progress - b.progress);
//     return raw;
//   };

//   const getZoneStatus = (used, progress) => {
//     const g = (progress / 100) * 33;
//     const y = 33 + (progress / 100) * 33;
//     if (used <= g) return { color: '#16a34a', label: 'On Track', icon: '✅' };
//     if (used <= y) return { color: '#ca8a04', label: 'At Risk', icon: '⚠️' };
//     return { color: '#dc2626', label: 'Critical', icon: '🚨' };
//   };

//   const CustomTooltip = ({ active, payload }) => {
//     if (!active || !payload?.length) return null;
//     const bufferPoint = payload.find((p) => p.dataKey === 'bufferLine');
//     if (!bufferPoint || bufferPoint.value === null || bufferPoint.value === undefined || !bufferPoint.payload.isTaskDot) return null;
//     const data = bufferPoint.payload;
//     const trueP = data.trueProgress != null ? data.trueProgress : data.progress;
//     const zone = getZoneStatus(bufferPoint.value, trueP);
    
//     return (
//       <div
//         style={{
//           background: '#1e293b',
//           padding: 14,
//           borderRadius: 8,
//           border: `2px solid ${zone.color}`,
//           minWidth: 230,
//         }}
//       >
//         <p style={{ color: '#94a3b8', fontSize: 11 }}>{data.uid}</p>
//         <p style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>{data.activity}</p>
//         <p style={{ color: '#cbd5e1', fontSize: 11 }}>{data.subActivity}</p>
//         <div style={{ borderTop: '1px solid #334155', marginTop: 8, paddingTop: 8 }}>
//           <p style={{ color: '#94a3b8', fontSize: 11 }}>
//             Progress:{' '}
//             <strong style={{ color: '#fff' }}>{Number(trueP).toFixed(2)}%</strong>
//           </p>
//           <p style={{ color: '#94a3b8', fontSize: 11 }}>
//             Buffer used:{' '}
//             <strong style={{ color: zone.color }}>{Number(bufferPoint.value).toFixed(2)}%</strong>
//           </p>
//           <p style={{ color: '#94a3b8', fontSize: 11 }}>
//             Task delay (Col K):{' '}
//             <strong
//               style={{
//                 color: data.taskDelay > 0 ? '#ef4444' : data.taskDelay < 0 ? '#22c55e' : '#38bdf8',
//               }}
//             >
//               {data.taskDelay > 0 ? '+' : ''}
//               {data.taskDelay} days
//             </strong>
//           </p>
//           <p style={{ color: '#94a3b8', fontSize: 11 }}>
//             Cumulative delay: <strong style={{ color: '#fff' }}>{data.cumulativeDelay} d</strong>
//           </p>
//           <p style={{ color: zone.color, fontSize: 12, marginTop: 6, fontWeight: 700 }}>
//             {zone.icon} {zone.label}
//           </p>
//         </div>
//       </div>
//     );
//   };

//   if (loading) {
//     return (
//       <div className="loader-container">
//         <div className="loader" />
//         <div className="loader-text">Loading analytics...</div>
//       </div>
//     );
//   }

//   const chartData = buildChartData();
//   const { yMin, yMax } = getYAxisBounds();
//   const [xMin, xMax] = getXAxisDomain();
//   const totalInSheet = trendData[0]?.totalTasksInSheet;
//   const currentZone = projectData
//     ? getZoneStatus(projectData.usedPercent, projectData.projectProgress || 0)
//     : null;

//   return (
//     <div>
//       <div className="page-header">
//         <div>
//           <h1 className="page-title">Buffer Analytics</h1>
//           <p className="page-subtitle">Fever Chart — % buffer used vs % complete</p>
//         </div>
//         <div className="site-selector">
//           <select className="site-select" value={selectedSite} onChange={handleSiteChange}>
//             <option value="">-- Select Site --</option>
//             {sites.map((s, idx) => {
//               const val = typeof s === 'object' ? s.id || s.name : s;
//               const name = typeof s === 'object' ? s.name : s;
//               return (
//                 <option key={idx} value={val}>
//                   {name}
//                 </option>
//               );
//             })}
//           </select>
//         </div>
//       </div>

//       {!selectedSite ? (
//         <div className="empty-state">
//           <div className="empty-state-icon">
//             <Activity size={32} />
//           </div>
//           <div className="empty-state-title">No Site Selected</div>
//           <p>Select a site to view fever chart</p>
//         </div>
//       ) : projectData ? (
//         <>
//           <div className="stats-grid">
//             <div className="stat-card">
//               <div className="stat-card-icon primary">
//                 <Shield size={20} />
//               </div>
//               <div className="stat-card-label">Total Buffer</div>
//               <div className="stat-card-value">{Number(projectData.totalBuffer).toFixed(0)}</div>
//             </div>
//             <div className="stat-card">
//               <div className="stat-card-icon success">
//                 <Target size={20} />
//               </div>
//               <div className="stat-card-label">Remaining</div>
//               <div className="stat-card-value">{Number(projectData.remainingBuffer).toFixed(0)}</div>
//             </div>
//             <div className="stat-card">
//               <div className="stat-card-icon warning">
//                 <Activity size={20} />
//               </div>
//               <div className="stat-card-label">Consumed</div>
//               <div className="stat-card-value">{Number(projectData.bufferConsumeDay).toFixed(0)}</div>
//             </div>
//             <div className="stat-card">
//               <div
//                 className="stat-card-icon"
//                 style={{ background: currentZone?.color || '#16a34a' }}
//               >
//                 {projectData.usedPercent > 66 ? (
//                   <TrendingUp size={20} />
//                 ) : (
//                   <TrendingDown size={20} />
//                 )}
//               </div>
//               <div className="stat-card-label">Buffer Used</div>
//               <div
//                 className="stat-card-value"
//                 style={{ color: currentZone?.color || '#16a34a' }}
//               >
//                 {Number(projectData.usedPercent).toFixed(1)}%
//               </div>
//             </div>
//           </div>

//           <div className="chart-wrapper">
//             <div className="chart-wrapper-header">
//               <div>
//                 <div className="chart-title">Buffer Management — Fever Chart</div>
//                 <div className="chart-subtitle">
//                   {trendData.length} completed
//                   {totalInSheet ? ` / ${totalInSheet} in Project Buffer` : ''}
//                   {xMax < 100 ? ` · view 0–${xMax}% (early)` : ' · full 0–100%'}
//                   {' · '}+delay ↑ red · −delay ↓ green
//                 </div>
//               </div>
//             </div>

//             <div className="chart-container" style={{ height: 520 }}>
//               <ResponsiveContainer width="100%" height="100%">
//                 <ComposedChart data={chartData} margin={{ top: 16, right: 28, left: 8, bottom: 28 }}>
//                   <defs>
//                     <linearGradient id="feverGreen" x1="0" y1="0" x2="0" y2="1">
//                       <stop offset="0%" stopColor="#4ade80" stopOpacity={0.95} />
//                       <stop offset="100%" stopColor="#22c55e" stopOpacity={0.9} />
//                     </linearGradient>
//                     <linearGradient id="feverYellow" x1="0" y1="0" x2="0" y2="1">
//                       <stop offset="0%" stopColor="#facc15" stopOpacity={0.95} />
//                       <stop offset="100%" stopColor="#eab308" stopOpacity={0.9} />
//                     </linearGradient>
//                     <linearGradient id="feverRed" x1="0" y1="0" x2="0" y2="1">
//                       <stop offset="0%" stopColor="#f87171" stopOpacity={0.95} />
//                       <stop offset="100%" stopColor="#ef4444" stopOpacity={0.9} />
//                     </linearGradient>
//                   </defs>

//                   <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" opacity={0.35} />

//                   <XAxis
//                     dataKey="progress"
//                     type="number"
//                     domain={[xMin, xMax]}
//                     tickFormatter={(v) => `${v}%`}
//                     stroke="#475569"
//                     label={{
//                       value: '% of project complete (Project Buffer tasks)',
//                       position: 'insideBottom',
//                       offset: -12,
//                       fill: '#64748b',
//                       fontSize: 11,
//                     }}
//                   />
//                   <YAxis
//                     type="number"
//                     domain={[yMin, Math.max(yMax, 100)]}
//                     tickFormatter={(v) => `${v}%`}
//                     stroke="#475569"
//                     label={{
//                       value: '% of buffer consumed',
//                       angle: -90,
//                       position: 'insideLeft',
//                       fill: '#64748b',
//                       fontSize: 11,
//                     }}
//                   />

//                   <Tooltip content={<CustomTooltip />} />

//                   {/* Stacked fever bands: red full → yellow → green (bottom) */}
//                   <Area
//                     type="monotone"
//                     dataKey="redZone"
//                     stroke="none"
//                     fill="url(#feverRed)"
//                     isAnimationActive={false}
//                   />
//                   <Area
//                     type="monotone"
//                     dataKey="yellowZone"
//                     stroke="none"
//                     fill="url(#feverYellow)"
//                     isAnimationActive={false}
//                   />
//                   <Area
//                     type="monotone"
//                     dataKey="greenZone"
//                     stroke="none"
//                     fill="url(#feverGreen)"
//                     isAnimationActive={false}
//                   />

//                   {yMin < 0 && <ReferenceLine y={0} stroke="#334155" strokeDasharray="4 4" />}

//                   {/* Buffer line */}
//                   <Line
//                     type="monotone"
//                     dataKey="bufferLine"
//                     stroke="#0f172a"
//                     strokeWidth={2.75}
//                     connectNulls
//                     dot={(props) => {
//                       const { cx, cy, payload, index } = props;
//                       if (!payload?.isTaskDot || payload.bufferLine == null || cx == null) {
//                         return null;
//                       }
//                       const late = (payload.taskDelay || 0) > 0;
//                       const early = (payload.taskDelay || 0) < 0;
//                       return (
//                         <circle
//                           key={`d-${index}-${payload.uid}`}
//                           cx={cx}
//                           cy={cy}
//                           r={6}
//                           fill={late ? '#ef4444' : early ? '#22c55e' : '#38bdf8'}
//                           stroke="#0f172a"
//                           strokeWidth={1.5}
//                         />
//                       );
//                     }}
//                     activeDot={{ r: 8 }}
//                   />
//                 </ComposedChart>
//               </ResponsiveContainer>
//             </div>
//           </div>
//         </>
//       ) : (
//         <div className="empty-state">
//           <div className="empty-state-icon">
//             <AlertCircle size={32} />
//           </div>
//           <div className="empty-state-title">No Data Available</div>
//         </div>
//       )}
//     </div>
//   );
// }









'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Shield, Activity, Target, AlertCircle } from 'lucide-react';
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

export default function ProjectGraph() {
  const [sites, setSites] = useState([]);
  const [selectedSite, setSelectedSite] = useState('');
  const [loading, setLoading] = useState(false);
  const [projectData, setProjectData] = useState(null);
  const [trendData, setTrendData] = useState([]);

  useEffect(() => {
    loadSites();
  }, []);

  const loadSites = async () => {
    try {
      const res = await fetch('/api/sites');
      const result = await res.json();
      if (result.success) setSites(result.sites || result.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSiteChange = async (e) => {
    const site = e.target.value;
    setSelectedSite(site);
    if (!site) {
      setProjectData(null);
      setTrendData([]);
      return;
    }
    setLoading(true);
    try {
      const [pRes, tRes] = await Promise.all([
        fetch(`/api/buffer/project?site=${encodeURIComponent(site)}`),
        fetch(`/api/buffer/trend?site=${encodeURIComponent(site)}`),
      ]);
      const pResult = await pRes.json();
      const tResult = await tRes.json();
      if (pResult.success) setProjectData(pResult.data);
      if (tResult.success) setTrendData(tResult.data || []);
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const getYAxisBounds = () => {
    if (!trendData?.length) return { yMin: 0, yMax: 100 };
    const vals = trendData.map((p) => Number(p.bufferUsed) || 0);
    const maxB = Math.max(...vals, 0);
    const minB = Math.min(...vals, 0);
    let yMax = 100;
    if (maxB > 100) yMax = Math.ceil(maxB / 25) * 25;
    let yMin = 0;
    if (minB < 0) yMin = Math.min(-10, Math.floor(minB / 10) * 10);
    return { yMin, yMax };
  };

  const getXAxisDomain = () => {
    if (!trendData?.length) return [0, 100];
    const maxP = Math.max(...trendData.map((p) => Number(p.progress) || 0), 0);
    if (maxP < 12) return [0, Math.max(15, Math.ceil(maxP * 2.5 + 4))];
    if (maxP < 35) return [0, Math.min(100, Math.ceil(maxP * 1.6))];
    return [0, 100];
  };

  const buildChartData = () => {
    const { yMin, yMax } = getYAxisBounds();
    const [, xMax] = getXAxisDomain();

    const raw = [];
    const step = xMax <= 20 ? 1 : xMax <= 50 ? 2 : 5;
    for (let i = 0; i <= xMax; i += step) {
      const p = i;
      const p100 = xMax >= 100 ? p : (p / xMax) * 100;
      
      const greenTop = (p100 / 100) * 66;
      const yellowTop = 33 + (p100 / 100) * 67;

      raw.push({
        progress: i,
        greenZone: greenTop,
        yellowZone: yellowTop,
        redZone: yMax < 100 ? Math.max(yMax, 100) : 100,
        bufferLine: null,
        isTaskDot: false,
      });
    }

    if (trendData?.length) {
      const sorted = [...trendData].sort(
        (a, b) => (Number(a.progress) || 0) - (Number(b.progress) || 0)
      );
      const minGap = Math.max(xMax / Math.max(sorted.length * 3, 1), 0.6);
      
      const p100_0 = xMax >= 100 ? 0 : (0 / xMax) * 100;
      raw.push({
        progress: 0,
        trueProgress: 0,
        greenZone: (p100_0 / 100) * 66,
        yellowZone: 33 + (p100_0 / 100) * 67,
        redZone: yMax < 100 ? Math.max(yMax, 100) : 100,
        bufferLine: 0,
        isTaskDot: false, 
      });

      let lastX = 0;

      sorted.forEach((point) => {
        let x = Number(point.progress) || 0;
        if (x < lastX + minGap) x = lastX + minGap;
        if (x > xMax) x = xMax;
        lastX = x;

        const p100 = xMax >= 100 ? x : (x / xMax) * 100;
        raw.push({
          progress: x,
          trueProgress: point.progress,
          greenZone: (p100 / 100) * 66,
          yellowZone: 33 + (p100 / 100) * 67,
          redZone: yMax < 100 ? Math.max(yMax, 100) : 100,
          bufferLine: point.bufferUsed, 
          activity: point.activity,
          subActivity: point.subActivity,
          uid: point.uid,
          taskDelay: point.taskDelay,
          cumulativeDelay: point.cumulativeDelay,
          totalTasksInSheet: point.totalTasksInSheet,
          isTaskDot: true,
        });
      });
    }

    raw.sort((a, b) => a.progress - b.progress);
    return raw;
  };

  const getZoneStatus = (used, progress) => {
    const g = (progress / 100) * 66;
    const y = 33 + (progress / 100) * 67;
    if (used <= g) return { color: '#16a34a', label: 'On Track', icon: '✅' };
    if (used <= y) return { color: '#ca8a04', label: 'At Risk', icon: '⚠️' };
    return { color: '#dc2626', label: 'Critical', icon: '🚨' };
  };

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const bufferPoint = payload.find((p) => p.dataKey === 'bufferLine');
    if (!bufferPoint || bufferPoint.value === null || bufferPoint.value === undefined || !bufferPoint.payload.isTaskDot) return null;
    const data = bufferPoint.payload;
    const trueP = data.trueProgress != null ? data.trueProgress : data.progress;
    const zone = getZoneStatus(bufferPoint.value, trueP);
    
    return (
      <div
        style={{
          background: '#1e293b',
          padding: 14,
          borderRadius: 8,
          border: `2px solid ${zone.color}`,
          minWidth: 230,
        }}
      >
        <p style={{ color: '#94a3b8', fontSize: 11 }}>{data.uid}</p>
        <p style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>{data.activity}</p>
        <p style={{ color: '#cbd5e1', fontSize: 11 }}>{data.subActivity}</p>
        <div style={{ borderTop: '1px solid #334155', marginTop: 8, paddingTop: 8 }}>
          <p style={{ color: '#94a3b8', fontSize: 11 }}>
            Progress:{' '}
            <strong style={{ color: '#fff' }}>{Number(trueP).toFixed(2)}%</strong>
          </p>
          <p style={{ color: '#94a3b8', fontSize: 11 }}>
            Buffer used:{' '}
            <strong style={{ color: zone.color }}>{Number(bufferPoint.value).toFixed(2)}%</strong>
          </p>
          <p style={{ color: '#94a3b8', fontSize: 11 }}>
            Task delay (Col K):{' '}
            <strong
              style={{
                color: data.taskDelay > 0 ? '#ef4444' : data.taskDelay < 0 ? '#22c55e' : '#38bdf8',
              }}
            >
              {data.taskDelay > 0 ? '+' : ''}
              {data.taskDelay} days
            </strong>
          </p>
          <p style={{ color: '#94a3b8', fontSize: 11 }}>
            Cumulative delay: <strong style={{ color: '#fff' }}>{data.cumulativeDelay} d</strong>
          </p>
          <p style={{ color: zone.color, fontSize: 12, marginTop: 6, fontWeight: 700 }}>
            {zone.icon} {zone.label}
          </p>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="loader-container">
        <div className="loader" />
        <div className="loader-text">Loading analytics...</div>
      </div>
    );
  }

  const chartData = buildChartData();
  const { yMin, yMax } = getYAxisBounds();
  const [xMin, xMax] = getXAxisDomain();
  const totalInSheet = trendData[0]?.totalTasksInSheet;
  const currentZone = projectData
    ? getZoneStatus(projectData.usedPercent, projectData.projectProgress || 0)
    : null;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Buffer Analytics</h1>
          <p className="page-subtitle">Fever Chart — % buffer used vs % complete</p>
        </div>
        <div className="site-selector">
          <select className="site-select" value={selectedSite} onChange={handleSiteChange}>
            <option value="">-- Select Site --</option>
            {sites.map((s, idx) => {
              const val = typeof s === 'object' ? s.id || s.name : s;
              const name = typeof s === 'object' ? s.name : s;
              return (
                <option key={idx} value={val}>
                  {name}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {!selectedSite ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <Activity size={32} />
          </div>
          <div className="empty-state-title">No Site Selected</div>
          <p>Select a site to view fever chart</p>
        </div>
      ) : projectData ? (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-card-icon primary">
                <Shield size={20} />
              </div>
              <div className="stat-card-label">Total Buffer</div>
              <div className="stat-card-value">{Number(projectData.totalBuffer).toFixed(0)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-icon success">
                <Target size={20} />
              </div>
              <div className="stat-card-label">Remaining</div>
              <div className="stat-card-value">{Number(projectData.remainingBuffer).toFixed(0)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-icon warning">
                <Activity size={20} />
              </div>
              <div className="stat-card-label">Consumed</div>
              <div className="stat-card-value">{Number(projectData.bufferConsumeDay).toFixed(0)}</div>
            </div>
            <div className="stat-card">
              <div
                className="stat-card-icon"
                style={{ background: currentZone?.color || '#16a34a' }}
              >
                {projectData.usedPercent > 66 ? (
                  <TrendingUp size={20} />
                ) : (
                  <TrendingDown size={20} />
                )}
              </div>
              <div className="stat-card-label">Buffer Used</div>
              <div
                className="stat-card-value"
                style={{ color: currentZone?.color || '#16a34a' }}
              >
                {Number(projectData.usedPercent).toFixed(1)}%
              </div>
            </div>
          </div>

          <div className="chart-wrapper">
            <div className="chart-wrapper-header">
              <div>
                <div className="chart-title">Buffer Management — Fever Chart</div>
                <div className="chart-subtitle">
                  {trendData.length} completed
                  {totalInSheet ? ` / ${totalInSheet} in Project Buffer` : ''}
                  {xMax < 100 ? ` · view 0–${xMax}% (early)` : ' · full 0–100%'}
                  {' · '}+delay ↑ red · −delay ↓ green
                </div>
              </div>
            </div>

            <div className="chart-container" style={{ height: 520 }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 16, right: 28, left: 8, bottom: 28 }}>
                  <defs>
                    <linearGradient id="feverGreen" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4ade80" stopOpacity={0.95} />
                      <stop offset="100%" stopColor="#22c55e" stopOpacity={0.9} />
                    </linearGradient>
                    <linearGradient id="feverYellow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#facc15" stopOpacity={0.95} />
                      <stop offset="100%" stopColor="#eab308" stopOpacity={0.9} />
                    </linearGradient>
                    <linearGradient id="feverRed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f87171" stopOpacity={0.95} />
                      <stop offset="100%" stopColor="#ef4444" stopOpacity={0.9} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" opacity={0.35} />

                  {/* Axis labels removed, only clean number ticks are displayed now */}
                  <XAxis
                    dataKey="progress"
                    type="number"
                    domain={[xMin, xMax]}
                    ticks={[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]}
                    tickFormatter={(v) => `${v}`}
                    stroke="#475569"
                    tick={{ fill: '#475569', fontSize: 12 }}
                  />
                  <YAxis
                    type="number"
                    domain={[yMin, Math.max(yMax, 100)]}
                    ticks={[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]}
                    tickFormatter={(v) => `${v}`}
                    stroke="#475569"
                    tick={{ fill: '#475569', fontSize: 12 }}
                  />

                  <Tooltip content={<CustomTooltip />} />

                  {/* Slanted CCPM Zones */}
                  <Area
                    type="monotone"
                    dataKey="redZone"
                    stroke="none"
                    fill="url(#feverRed)"
                    isAnimationActive={false}
                  />
                  <Area
                    type="monotone"
                    dataKey="yellowZone"
                    stroke="none"
                    fill="url(#feverYellow)"
                    isAnimationActive={false}
                  />
                  <Area
                    type="monotone"
                    dataKey="greenZone"
                    stroke="none"
                    fill="url(#feverGreen)"
                    isAnimationActive={false}
                  />

                  {yMin < 0 && <ReferenceLine y={0} stroke="#334155" strokeDasharray="4 4" />}

                  {/* Buffer line */}
                  <Line
                    type="monotone"
                    dataKey="bufferLine"
                    stroke="#0f172a"
                    strokeWidth={2.75}
                    connectNulls
                    dot={(props) => {
                      const { cx, cy, payload, index } = props;
                      if (!payload?.isTaskDot || payload.bufferLine == null || cx == null) {
                        return null;
                      }
                      const late = (payload.taskDelay || 0) > 0;
                      const early = (payload.taskDelay || 0) < 0;
                      return (
                        <circle
                          key={`d-${index}-${payload.uid}`}
                          cx={cx}
                          cy={cy}
                          r={6}
                          fill={late ? '#ef4444' : early ? '#22c55e' : '#38bdf8'}
                          stroke="#0f172a"
                          strokeWidth={1.5}
                        />
                      );
                    }}
                    activeDot={{ r: 8 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon">
            <AlertCircle size= {32} />
          </div>
          <div className="empty-state-title">No Data Available</div>
        </div>
      )}
    </div>
  );
}