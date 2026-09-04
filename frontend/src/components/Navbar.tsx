import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  AlertTriangle, 
  ShieldAlert, 
  Sliders, 
  BarChart3, 
  Bell, 
  Box, 
  Layers
} from 'lucide-react';
import { motion } from 'framer-motion';

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
  const [timeString, setTimeString] = useState<string>(() => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds} IST`;
  });

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
    <header className="sticky top-0 z-40 glass-nav-bar px-6 py-2.5 flex items-center justify-between font-sans select-none border-b border-slate-200 bg-white/90">
      
      {/* Center Nav Tabs */}
      <nav className="flex items-center space-x-1.5 overflow-x-auto py-1">
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => setActiveTab('dashboard')}
          className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-bold tracking-wider transition-all ${
            activeTab === 'dashboard'
              ? 'bg-sky-50 text-sky-700 border-b-2 border-b-sky-600 border-sky-300 shadow-sm font-black'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Activity className="w-3.5 h-3.5 text-sky-600" />
          <span>MISSION CONTROL</span>
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => setActiveTab('anomalies')}
          className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-bold tracking-wider transition-all ${
            activeTab === 'anomalies'
              ? 'bg-red-50 text-red-700 border-b-2 border-b-red-600 border-red-300 shadow-sm font-black'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
          <span>ANOMALIES</span>
          {activeAlertCount > 0 && (
            <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
          )}
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => setActiveTab('disaster-risk')}
          className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-bold tracking-wider transition-all ${
            activeTab === 'disaster-risk'
              ? 'bg-emerald-50 text-emerald-700 border-b-2 border-b-emerald-600 border-emerald-300 shadow-sm font-black'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5 text-emerald-600" />
          <span>RISK INTELLIGENCE</span>
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => setActiveTab('simulator')}
          className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-bold tracking-wider transition-all ${
            activeTab === 'simulator'
              ? 'bg-amber-50 text-amber-700 border-b-2 border-b-amber-600 border-amber-300 shadow-sm font-black'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Sliders className="w-3.5 h-3.5 text-amber-600" />
          <span>SIMULATOR</span>
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-bold tracking-wider transition-all ${
            activeTab === 'analytics'
              ? 'bg-indigo-50 text-indigo-700 border-b-2 border-b-indigo-600 border-indigo-300 shadow-sm font-black'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5 text-indigo-600" />
          <span>ANALYTICS</span>
        </motion.button>
      </nav>

      {/* Right Controls & Status Bar */}
      <div className="flex items-center space-x-4">
        
        {setIs3DMode && (
          <button
            onClick={() => setIs3DMode(!is3DMode)}
            className={`hidden xl:flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-mono font-bold border transition-all ${
              is3DMode
                ? 'bg-sky-50 text-sky-700 border-sky-300 shadow-sm'
                : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
            }`}
            title="Toggle Spatial Map Renderer"
          >
            {is3DMode ? <Box className="w-3.5 h-3.5 text-sky-600" /> : <Layers className="w-3.5 h-3.5 text-slate-500" />}
            <span>{is3DMode ? '3D RADAR' : '2D RADAR'}</span>
          </button>
        )}

        {/* System Online Badge */}
        <div className="flex items-center space-x-2 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full text-xs font-mono font-bold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>SYSTEM ONLINE</span>
        </div>

        {/* Clock Display */}
        <div className="font-mono text-xs font-extrabold text-sky-800 bg-sky-50/80 px-3 py-1 rounded-lg border border-sky-200">
          {timeString || '11:40:14 IST'}
        </div>

        {/* Notification Bell */}
        <button 
          onClick={() => setActiveTab('anomalies')}
          className="relative p-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 transition-all"
        >
          <Bell className="w-4 h-4 text-sky-600" />
          {activeAlertCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white animate-pulse"></span>
          )}
        </button>

      </div>

    </header>
  );
};
