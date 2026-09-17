'use client';

import { useState, useEffect } from 'react';
import {
  Calendar,
  TrendingUp,
  TrendingDown,
  Activity,
  BarChart3,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from 'recharts';

export default function WeeklyGraph() {
  const [sites, setSites] = useState([]);
  const [selectedSite, setSelectedSite] = useState('');
  const [loading, setLoading] = useState(false);
  const [bufferData, setBufferData] = useState([]);
  const [progressData, setProgressData] = useState([]);

  useEffect(() => {
    loadSites();
  }, []);

  const loadSites = async () => {
    try {
      const res = await fetch('/api/sites');
      const result = await res.json();
      if (result.success) {
        const list = result.sites || result.data || [];
        setSites(list);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSiteChange = async (e) => {
    const site = e.target.value;
    setSelectedSite(site);
    if (!site) {
      setBufferData([]);
      setProgressData([]);
      return;
    }
    setLoading(true);
    try {
      const [bufRes, progRes] = await Promise.all([
        fetch(`/api/buffer/weekly?site=${encodeURIComponent(site)}`),
        fetch(`/api/buffer/progress?site=${encodeURIComponent(site)}`),
      ]);
      const bufResult = await bufRes.json();
      const progResult = await progRes.json();
      if (bufResult.success) setBufferData(bufResult.data || []);
      if (progResult.success) setProgressData(progResult.data || []);
    } catch (err) {
      alert('Error loading weekly data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const getBufferTrend = () => {
    if (bufferData.length < 2) return { trend: 'flat', percent: 0 };
    const last = bufferData[bufferData.length - 1].consumed;
    const prev = bufferData[bufferData.length - 2].consumed;
    const diff = last - prev;
    const percent = prev > 0 ? ((diff / prev) * 100).toFixed(1) : 0;
    return { trend: diff > 0 ? 'up' : diff < 0 ? 'down' : 'flat', percent: Math.abs(percent) };
  };

  const getProgressTrend = () => {
    if (progressData.length < 2) return { trend: 'flat', percent: 0 };
    const last = progressData[progressData.length - 1].progress;
    const prev = progressData[progressData.length - 2].progress;
    const diff = last - prev;
    return { trend: diff > 0 ? 'up' : diff < 0 ? 'down' : 'flat', percent: Math.abs(diff).toFixed(1) };
  };

  const bufferTrend = getBufferTrend();
  const progressTrend = getProgressTrend();

  const CustomTooltip = ({ active, payload, label, unit = '' }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: '#1e293b',
          padding: '12px 16px',
          borderRadius: '8px',
          border: '1px solid #334155',
          boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
        }}>
          <p style={{ color: '#94a3b8', fontSize: '11px', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {label}
          </p>
          {payload.map((entry, index) => (
            <p key={index} style={{ 
              color: entry.color, 
              fontSize: '14px', 
              fontWeight: '700',
              margin: '2px 0'
            }}>
              {entry.name}: {entry.value}{unit}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="loader-container">
        <div className="loader"></div>
        <div className="loader-text">Loading weekly reports...</div>
      </div>
    );
  }

  const hasData = bufferData.length > 0 || progressData.length > 0;

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Weekly Reports</h1>
          <p className="page-subtitle">Weekly analytics for your project</p>
        </div>
        <div className="site-selector">
          <select className="site-select" value={selectedSite} onChange={handleSiteChange}>
            <option value="">-- Select Site --</option>
            {sites.map((s, idx) => {
              const val = typeof s === 'object' ? (s.id || s.name) : s;
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
            <BarChart3 size={32} />
          </div>
          <div className="empty-state-title">No Site Selected</div>
          <p>Please select a site to view weekly reports</p>
        </div>
      ) : !hasData ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <AlertTriangle size={32} />
          </div>
          <div className="empty-state-title">No Weekly Data Found</div>
          <p className="text-sm text-slate-500 mt-1">
            Is site ke liye Google Sheet me 'Weekwise Buffer consumed' ya 'Project Buffer' me weekly data nahi mila.
          </p>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-card-icon primary">
                <Activity size={20} />
              </div>
              <div className="stat-card-label">Total Weeks</div>
              <div className="stat-card-value">{Math.max(bufferData.length, progressData.length)}</div>
            </div>

            <div className="stat-card">
              <div className="stat-card-icon info">
                <BarChart3 size={20} />
              </div>
              <div className="stat-card-label">Buffer Trend</div>
              <div className="stat-card-value" style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                color: bufferTrend.trend === 'up' ? '#ef4444' : '#10b981'
              }}>
                {bufferTrend.trend === 'up' ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                {bufferTrend.percent}%
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-card-icon success">
                <TrendingUp size={20} />
              </div>
              <div className="stat-card-label">Progress Change</div>
              <div className="stat-card-value" style={{
                color: progressTrend.trend === 'up' ? '#10b981' : '#ef4444'
              }}>
                {progressTrend.trend === 'up' ? '+' : '-'}{progressTrend.percent}%
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-card-icon warning">
                <AlertTriangle size={20} />
              </div>
              <div className="stat-card-label">Current Status</div>
              <div className="stat-card-value" style={{ fontSize: '16px', marginTop: '8px' }}>
                {bufferTrend.trend === 'up' ? '⚠️ Rising' : '✅ Stable'}
              </div>
            </div>
          </div>

          {/* Chart 1: Buffer Consumption */}
          {bufferData.length > 0 && (
            <div className="chart-wrapper">
              <div className="chart-wrapper-header">
                <div>
                  <div className="chart-title">📈 Buffer Consumption Trend</div>
                  <div className="chart-subtitle">Week-by-week buffer usage analysis</div>
                </div>
                <div className={`badge ${bufferTrend.trend === 'up' ? 'badge-danger' : 'badge-success'}`}>
                  {bufferTrend.trend === 'up' ? '▲' : '▼'} {bufferTrend.percent}%
                </div>
              </div>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={bufferData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="bufferGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="week" stroke="#94a3b8" style={{ fontSize: '12px' }} />
                    <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
                    <Tooltip content={<CustomTooltip unit=" days" />} />
                    <Area
                      type="monotone"
                      dataKey="consumed"
                      stroke="#6366f1"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#bufferGradient)"
                      name="Buffer Consumed"
                      dot={{ fill: '#6366f1', r: 4 }}
                      activeDot={{ r: 7, fill: '#6366f1', stroke: '#fff', strokeWidth: 3 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Chart 2: Task Completion */}
          {progressData.length > 0 && (
            <div className="chart-wrapper mt-6">
              <div className="chart-wrapper-header">
                <div>
                  <div className="chart-title">📊 Weekly Task Completion</div>
                  <div className="chart-subtitle">Compare planned vs completed tasks</div>
                </div>
              </div>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={progressData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="completedGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                        <stop offset="100%" stopColor="#10b981" stopOpacity={0.6} />
                      </linearGradient>
                      <linearGradient id="plannedGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#94a3b8" stopOpacity={1} />
                        <stop offset="100%" stopColor="#94a3b8" stopOpacity={0.6} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="week" stroke="#94a3b8" style={{ fontSize: '12px' }} />
                    <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ paddingTop: '16px' }} iconType="circle" />
                    <Bar dataKey="tasksInWeek" fill="url(#plannedGradient)" name="Planned Tasks" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="tasksCompleted" fill="url(#completedGradient)" name="Completed Tasks" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Chart 3: Progress % */}
          {progressData.length > 0 && (
            <div className="chart-wrapper mt-6">
              <div className="chart-wrapper-header">
                <div>
                  <div className="chart-title">📈 Project Progress Trend</div>
                  <div className="chart-subtitle">Cumulative progress over weeks</div>
                </div>
                <div className={`badge ${progressTrend.trend === 'up' ? 'badge-success' : 'badge-danger'}`}>
                  {progressTrend.trend === 'up' ? '▲' : '▼'} {progressTrend.percent}%
                </div>
              </div>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={progressData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="progressGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="week" stroke="#94a3b8" style={{ fontSize: '12px' }} />
                    <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                    <Tooltip content={<CustomTooltip unit="%" />} />
                    <ReferenceLine y={50} stroke="#f59e0b" strokeDasharray="5 5" label={{ value: '50% Mark', fill: '#f59e0b', fontSize: 11 }} />
                    <Area
                      type="monotone"
                      dataKey="progress"
                      stroke="#10b981"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#progressGradient)"
                      name="Progress"
                      dot={{ fill: '#10b981', r: 4 }}
                      activeDot={{ r: 7, fill: '#10b981', stroke: '#fff', strokeWidth: 3 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}