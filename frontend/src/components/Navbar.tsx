import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  AlertTriangle, 
  ShieldAlert, 
  Sliders, 
  BarChart3, 
  FileText, 
  Bell, 
  Box, 
  Layers
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  wsConnected: boolean;
  activeAlertCount: number;
  is3DMode?: boolean;
  setIs3DMode?: (mode: boolean) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  wsConnected,
  activeAlertCount,
  is3DMode = true,
  setIs3DMode
}) => {
  const [timeString, setTimeString] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      setTimeString(`${hours}:${minutes}:${seconds} IST`);
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 px-6 py-2.5 flex items-center justify-between">
      
      {/* Center Nav Tabs */}
      <nav className="flex items-center space-x-1.5 overflow-x-auto py-1">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
            activeTab === 'dashboard'
              ? 'bg-blue-50 text-blue-600 border border-blue-200 font-bold shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Activity className="w-3.5 h-3.5 text-blue-600" />
          <span>Mission Control</span>
        </button>

        <button
          onClick={() => setActiveTab('anomalies')}
          className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
            activeTab === 'anomalies'
              ? 'bg-blue-50 text-blue-600 border border-blue-200 font-bold shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-slate-500" />
          <span>Anomalies</span>
          {activeAlertCount > 0 && (
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('disaster-risk')}
          className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
            activeTab === 'disaster-risk'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5 text-emerald-600" />
          <span>Risk Intelligence</span>
        </button>

        <button
          onClick={() => setActiveTab('simulator')}
          className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
            activeTab === 'simulator'
              ? 'bg-amber-50 text-amber-700 border border-amber-200 font-bold shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Sliders className="w-3.5 h-3.5 text-amber-600" />
          <span>Simulator</span>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
            activeTab === 'analytics'
              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5 text-indigo-600" />
          <span>Analytics</span>
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
            activeTab === 'reports'
              ? 'bg-blue-50 text-blue-600 border border-blue-200 font-bold shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <FileText className="w-3.5 h-3.5 text-slate-500" />
          <span>Reports</span>
        </button>
      </nav>

      {/* Right Controls & Status Bar */}
      <div className="flex items-center space-x-4">
        
        {/* Optional 3D Mode Quick Toggle */}
        {setIs3DMode && (
          <button
            onClick={() => setIs3DMode(!is3DMode)}
            className={`hidden xl:flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-mono font-semibold border transition-all ${
              is3DMode
                ? 'bg-blue-50 text-blue-700 border-blue-300'
                : 'bg-slate-100 text-slate-600 border-slate-300'
            }`}
            title="Toggle Map Renderer"
          >
            {is3DMode ? <Box className="w-3.5 h-3.5 text-blue-600" /> : <Layers className="w-3.5 h-3.5 text-slate-500" />}
            <span>{is3DMode ? '3D VIEW' : '2D VIEW'}</span>
          </button>
        )}

        {/* System Online Badge */}
        <div className="flex items-center space-x-2 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>System Online</span>
        </div>

        {/* IST Clock Display */}
        <div className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
          {timeString || '09:42:18 IST'}
        </div>

        {/* Notification Bell */}
        <button 
          onClick={() => setActiveTab('anomalies')}
          className="relative p-2 rounded-full bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 transition-all"
        >
          <Bell className="w-4 h-4" />
          {activeAlertCount > 0 && (
            <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
          )}
        </button>

      </div>

    </header>
  );
};
