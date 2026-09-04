import React from 'react';
import { 
  ShieldCheck, 
  Home, 
  Radio, 
  AlertTriangle, 
  ShieldAlert, 
  Sliders, 
  BarChart3, 
  Bell, 
  FileText, 
  Settings,
  Server,
  Globe
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  activeAlertCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, activeAlertCount }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Overview', icon: Home },
    { id: 'stations', label: 'Stations', icon: Radio },
    { id: 'anomalies', label: 'Anomalies', icon: Bell, badge: activeAlertCount },
    { id: 'disaster-risk', label: 'Risk Intelligence', icon: ShieldAlert },
    { id: 'simulator', label: 'Simulator', icon: Sliders },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'alerts', label: 'Alerts', icon: AlertTriangle },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between p-4 shrink-0 min-h-screen select-none font-sans">
      
      <div className="space-y-6">
        {/* Brand Header */}
        <div 
          className="flex items-center space-x-3 px-2 py-1 cursor-pointer group"
          onClick={() => setActiveTab('dashboard')}
        >
          <div className="p-2.5 bg-blue-600 rounded-xl text-white shadow-sm flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-black text-lg text-slate-900 tracking-tight leading-none font-display">
              SkyGuard <span className="text-blue-600">AI</span>
            </h1>
            <p className="text-[11px] text-slate-500 font-medium mt-1">AWS Intelligence System</p>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id || (activeTab === 'dashboard' && item.id === 'dashboard');
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === 'overview' || item.id === 'dashboard' || item.id === 'stations') {
                    setActiveTab('dashboard');
                  } else if (item.id === 'alerts') {
                    setActiveTab('anomalies');
                  } else if (item.id === 'reports' || item.id === 'settings') {
                    setActiveTab(item.id);
                  } else {
                    setActiveTab(item.id);
                  }
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-blue-50 text-blue-600 font-bold border-l-4 border-blue-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-red-100 text-red-600 rounded-full">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section: Data Source Info & Vector Graphic */}
      <div className="space-y-4 pt-4 border-t border-slate-100">
        
        {/* Data Source Box */}
        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-2.5 font-sans">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">
            <span>DATA SOURCE</span>
            <span className="flex items-center space-x-1.5 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 text-[10px]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>LIVE</span>
            </span>
          </div>

          <div className="flex items-center space-x-2.5 text-slate-700 text-xs">
            <Server className="w-4 h-4 text-blue-600 shrink-0" />
            <div>
              <div className="font-semibold text-slate-900 leading-none text-xs">AWS Sensors</div>
              <div className="text-[11px] text-emerald-600 font-medium mt-0.5">4 / 4 Online</div>
            </div>
          </div>

          <div className="flex items-center space-x-2.5 text-slate-700 text-xs pt-1 border-t border-slate-200/60">
            <Globe className="w-4 h-4 text-blue-600 shrink-0" />
            <div>
              <div className="font-semibold text-slate-900 leading-none text-xs">Weather API</div>
              <div className="text-[11px] text-emerald-600 font-medium mt-0.5">Live</div>
            </div>
          </div>
        </div>

        {/* Satellite Radar Dish Vector Illustration */}
        <div className="relative h-28 w-full rounded-xl bg-gradient-to-b from-blue-50/60 to-slate-100/90 border border-slate-200/80 overflow-hidden flex items-end justify-center p-2">
          <svg className="w-full h-full text-blue-500/20 absolute inset-0" viewBox="0 0 200 120" fill="none" stroke="currentColor">
            {/* Hills */}
            <path d="M-10 110 Q40 70 100 100 T210 110 L210 130 L-10 130 Z" fill="#e2e8f0" />
            <path d="M-10 115 Q70 60 140 95 T220 115 Z" fill="#cbd5e1" opacity="0.6" />
            
            {/* Signal waves */}
            <circle cx="50" cy="45" r="15" stroke="#0284c7" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.5" />
            <circle cx="50" cy="45" r="28" stroke="#0284c7" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.3" />
            
            {/* Satellite Dish Icon */}
            <g transform="translate(35, 30)">
              {/* Stand */}
              <line x1="20" y1="35" x2="10" y2="60" stroke="#0369a1" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="20" y1="35" x2="30" y2="60" stroke="#0369a1" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="20" y1="35" x2="20" y2="50" stroke="#0369a1" strokeWidth="2" />
              {/* Dish parabola */}
              <path d="M5 20 Q 20 40 35 20" stroke="#0284c7" strokeWidth="4" fill="none" strokeLinecap="round" />
              {/* Receiver arm */}
              <line x1="20" y1="28" x2="32" y2="12" stroke="#0284c7" strokeWidth="2" />
              <circle cx="32" cy="12" r="3" fill="#0284c7" />
            </g>
          </svg>
        </div>

      </div>
    </aside>
  );
};
