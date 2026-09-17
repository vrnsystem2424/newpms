'use client';

import { useState } from 'react';
import { LayoutDashboard, BarChart3, Calendar } from 'lucide-react';

import AllProjects from '@/components/AllProjects';
import ProjectGraph from '@/components/ProjectGraph';
// import WeeklyGraph from '@/components/WeeklyGraph';

export default function ProjectBufferPage() {
  const [activeTab, setActiveTab] = useState('all-projects');

  const tabs = [
    { id: 'all-projects', label: 'All Projects', icon: LayoutDashboard },
    { id: 'project-graph', label: 'Buffer Analytics', icon: BarChart3 },
    // { id: 'weekly-graph', label: 'Weekly Reports', icon: Calendar },
  ];

  return (
    <div className="w-full max-w-none">
      <div className="mb-6 flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--accent)' }}>
            Module
          </p>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Project Buffer</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Monitor project health, buffers, and weekly trends
          </p>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-sm">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                  isActive
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                }`}
              >
                <Icon size={16} />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4">
        {activeTab === 'all-projects' && <AllProjects />}
        {activeTab === 'project-graph' && <ProjectGraph />}
        {/* {activeTab === 'weekly-graph' && <WeeklyGraph />} */}
      </div>
    </div>
  );
}