'use client';

import { useEffect, useState } from 'react';

export default function ExceptionLogPage() {
  const [sites, setSites] = useState([]);
  const [selectedSite, setSelectedSite] = useState('');
  const [headers, setHeaders] = useState([]);
  const [rows, setRows] = useState([]);
  
  const [loadingSites, setLoadingSites] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState('');

  // 1. Sites Load
  useEffect(() => {
    fetch('/api/sites')
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          const list = data.sites || data.data || [];
          setSites(list);
        } else {
          setError(data.message || 'Sites load nahi hui');
        }
        setLoadingSites(false);
      })
      .catch(() => {
        setError('Sites load error');
        setLoadingSites(false);
      });
  }, []);

  // 2. Exception Data Load
  const loadExceptionLog = () => {
    if (!selectedSite) {
      setHeaders([]);
      setRows([]);
      return;
    }
    setLoadingData(true);
    setError('');
    fetch(`/api/exception-log?siteId=${encodeURIComponent(selectedSite)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setHeaders(data.headers || []);
          setRows(data.rows || []);
        } else {
          setError(data.message || 'Data load failed');
          setHeaders([]);
          setRows([]);
        }
        setLoadingData(false);
      })
      .catch(() => {
        setError('Server error while loading log');
        setLoadingData(false);
      });
  };

  useEffect(() => {
    loadExceptionLog();
    // eslint-disable-next-line
  }, [selectedSite]);

  const getSiteName = () => {
    const site = sites.find(s => {
      const val = typeof s === 'object' ? (s.id || s.name) : s;
      return val === selectedSite;
    });
    return typeof site === 'object' ? site.name : site;
  };

  return (
    <div className="w-full max-w-none">
      {/* Page header */}
      <div className="mb-4 sm:mb-6 flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--accent)' }}>
            Module
          </p>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Exception Change Log</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            View updated dates, delays, and remarks for selected project
          </p>
        </div>

        {/* Site Selector and Refresh */}
        <div className="w-full lg:w-auto lg:min-w-[340px] lg:max-w-[400px] flex items-end gap-2">
          <div className="flex-1">
            <label className="label">Select Site</label>
            <select
              className="input-field w-full"
              value={selectedSite}
              onChange={(e) => setSelectedSite(e.target.value)}
              disabled={loadingSites}
            >
              <option value="">
                {loadingSites ? 'Loading sites...' : '-- Choose a site --'}
              </option>
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

          {selectedSite && (
            <button
              onClick={loadExceptionLog}
              disabled={loadingData}
              className="px-4 h-[42px] shrink-0 text-sm font-semibold rounded-xl border flex items-center justify-center gap-1.5 transition-all active:scale-95"
              style={{
                borderColor: 'var(--border-strong)',
                background: 'var(--surface)',
                color: 'var(--text-main)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              }}
              title="Refresh Log"
            >
              {loadingData ? (
                <span
                  className="w-4 h-4 border-2 rounded-full animate-spin shrink-0"
                  style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }}
                />
              ) : (
                <span className="shrink-0">🔄</span>
              )}
              Refresh
            </button>
          )}
        </div>
      </div>

      {error && (
        <div
          className="mb-4 rounded-[10px] px-4 py-3 text-sm font-medium"
          style={{ background: 'var(--danger-soft)', color: 'var(--danger)', border: '1px solid #fecaca' }}
        >
          {error}
        </div>
      )}

      {/* Table Card */}
      <div className="card w-full overflow-hidden">
        {selectedSite && !loadingData && rows.length > 0 && (
          <div
            className="px-3 sm:px-5 py-3 border-b flex flex-wrap items-center justify-between gap-2"
            style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)' }}
          >
            <div className="text-sm truncate">
              <span style={{ color: 'var(--text-muted)' }}>Site: </span>
              <span className="font-semibold">{getSiteName()}</span>
            </div>
            <div className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
              {rows.length} exception records
            </div>
          </div>
        )}

        {!selectedSite && !loadingData && (
          <div className="p-8 sm:p-12 text-center">
            <div
              className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-4"
              style={{ background: 'var(--primary-soft)' }}
            >
              <span className="text-2xl font-bold" style={{ color: 'var(--primary)' }}>→</span>
            </div>
            <p className="font-medium">Select a site to view exceptions log</p>
          </div>
        )}

        {loadingData && (
          <div className="p-8 sm:p-12 text-center">
            <div
              className="inline-block w-8 h-8 rounded-full border-2 animate-spin"
              style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }}
            />
            <p className="text-sm mt-3" style={{ color: 'var(--text-muted)' }}>
              Loading change log...
            </p>
          </div>
        )}

        {selectedSite && !loadingData && rows.length === 0 && !error && (
          <div className="p-8 sm:p-12 text-center">
            <p className="font-medium">Koi exception record nahi mila</p>
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
                </tr>
              </thead>
              <tbody>
                {rows.map((row, rIdx) => (
                  <tr
                    key={rIdx}
                    className="transition-colors"
                    style={{ borderBottom: '1px solid var(--border)' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-elevated)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    {headers.map((h, cIdx) => (
                      <td
                        key={cIdx}
                        className="px-3 sm:px-4 py-2 sm:py-2.5 whitespace-nowrap"
                        style={{ color: 'var(--text-main)' }}
                      >
                        {row[h] ? row[h] : <span style={{ color: 'var(--text-soft)' }}>—</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}