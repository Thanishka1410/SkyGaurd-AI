import React from 'react';
import { MapPin, Compass, Globe } from 'lucide-react';
import { Station } from '../types';

interface StationMapProps {
  stations: Station[];
  selectedStationId: string;
  onSelectStation: (id: string) => void;
  is3DMode?: boolean;
  onToggle3D?: () => void;
}

export const StationMap: React.FC<StationMapProps> = ({ 
  stations, 
  selectedStationId, 
  onSelectStation,
  onToggle3D
}) => {
  return (
    <div className="luxury-card p-6 relative overflow-hidden bg-white text-slate-900 min-h-[460px] flex flex-col justify-between border border-slate-200 space-y-4">
      
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h3 className="font-extrabold text-sm text-slate-900 font-display uppercase tracking-wider">
            LIVE AWS NETWORK
          </h3>
          <p className="text-xs text-slate-500 font-sans mt-0.5">Goa Weather Station Network</p>
        </div>

        {/* 3D View Toggle Button */}
        {onToggle3D && (
          <button 
            onClick={onToggle3D}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-blue-600 rounded-lg text-xs font-semibold shadow-sm transition-all"
          >
            <span>3D View</span>
            <Globe className="w-3.5 h-3.5 text-blue-600" />
          </button>
        )}
      </div>

      {/* Surface Canvas Area */}
      <div className="relative h-[340px] w-full rounded-xl bg-[#eef3f9] border border-slate-200 p-4 flex items-center justify-center overflow-hidden">
        
        {/* Subtle Map Topo Grid & Background Graphic */}
        <div className="absolute inset-0 bg-tactical-grid opacity-20 pointer-events-none"></div>
        
        {/* Stylized Goa Land Outline Path */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 600 340">
          <path 
            d="M 180 40 Q 240 30 320 60 T 480 120 Q 520 200 450 280 T 260 300 Q 150 250 140 180 Z" 
            fill="#dbeafe" 
            opacity="0.4" 
            stroke="#93c5fd" 
            strokeWidth="1.5" 
            strokeDasharray="4 4"
          />
        </svg>

        {/* Legend (Top Left) */}
        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md p-2.5 rounded-xl border border-slate-200 text-[11px] font-sans font-medium space-y-1.5 shadow-sm z-20">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span className="text-slate-700">Normal</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span className="text-slate-700">Warning</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
            <span className="text-slate-700">Fault</span>
          </div>
        </div>

        {/* Compass Rose (Bottom Left) */}
        <div className="absolute bottom-4 left-4 p-2 bg-white/90 backdrop-blur-md rounded-full border border-slate-200 shadow-sm z-20">
          <Compass className="w-8 h-8 text-blue-600 stroke-[1.5]" />
        </div>

        {/* SVG Connection Lines between nodes */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
          {/* Panaji to Mapusa */}
          <line x1="28%" y1="48%" x2="62%" y2="28%" stroke="#0284c7" strokeWidth="1.5" strokeDasharray="5 5" opacity="0.6" />
          {/* Mapusa to Vasco */}
          <line x1="62%" y1="28%" x2="80%" y2="56%" stroke="#0284c7" strokeWidth="1.5" strokeDasharray="5 5" opacity="0.6" />
          {/* Vasco to Margao */}
          <line x1="80%" y1="56%" x2="48%" y2="80%" stroke="#0284c7" strokeWidth="1.5" strokeDasharray="5 5" opacity="0.6" />
          {/* Margao to Panaji */}
          <line x1="48%" y1="80%" x2="28%" y2="48%" stroke="#0284c7" strokeWidth="1.5" strokeDasharray="5 5" opacity="0.6" />
          {/* Panaji to Vasco */}
          <line x1="28%" y1="48%" x2="80%" y2="56%" stroke="#0284c7" strokeWidth="1.5" strokeDasharray="5 5" opacity="0.4" />
        </svg>

        {/* Station Pins Positioned Specifically */}
        <div className="relative w-full h-full z-20">
          
          {stations.map((st) => {
            const isSelected = st.station_id === selectedStationId;
            const health = st.health?.overall_health_score ?? 100;
            const hasFault = health < 60;
            const hasWarning = health >= 60 && health < 85;

            // Custom positioning for Goa stations layout
            let posClass = "top-1/2 left-1/2";
            let subType = "Station";
            if (st.station_id === 'AWS_GOA_01') { // Panaji
              posClass = "top-[42%] left-[24%]";
              subType = "Coastal Station";
            } else if (st.station_id === 'AWS_GOA_04') { // Mapusa
              posClass = "top-[22%] left-[58%]";
              subType = "North Station";
            } else if (st.station_id === 'AWS_GOA_03') { // Vasco
              posClass = "top-[52%] left-[76%]";
              subType = "Harbor Station";
            } else if (st.station_id === 'AWS_GOA_02') { // Margao
              posClass = "top-[74%] left-[44%]";
              subType = "Inland Station";
            }

            const tempStr = st.last_reading?.temperature ? `${st.last_reading.temperature}°C` : '28.5°C';
            const pressStr = st.last_reading?.pressure ? `${st.last_reading.pressure} hPa` : '1012 hPa';

            const statusDotColor = hasFault ? 'bg-red-500' : hasWarning ? 'bg-amber-500' : 'bg-emerald-500';

            return (
              <div
                key={st.station_id}
                onClick={() => onSelectStation(st.station_id)}
                className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-200 hover:scale-105 ${posClass} ${
                  isSelected ? 'z-30' : 'z-20'
                }`}
              >
                <div className="flex flex-col items-center group">
                  {/* Pin Circle with ring */}
                  <div className={`relative p-2 rounded-full bg-white border-2 shadow-md flex items-center justify-center ${
                    isSelected ? 'border-blue-600 ring-4 ring-blue-100' : 'border-slate-300'
                  }`}>
                    <span className={`w-3.5 h-3.5 rounded-full ${statusDotColor} flex items-center justify-center`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-white opacity-80"></span>
                    </span>
                  </div>

                  {/* Label Box */}
                  <div className={`mt-1.5 px-2.5 py-1 rounded-lg text-center border backdrop-blur-md shadow-sm transition-all whitespace-nowrap ${
                    isSelected
                      ? 'bg-white border-blue-500 text-blue-900 ring-2 ring-blue-100'
                      : 'bg-white/95 border-slate-200 text-slate-800 group-hover:border-slate-300'
                  }`}>
                    <div className="font-bold text-xs uppercase tracking-wide font-sans">{st.name.split(' ')[0]}</div>
                    <div className="text-[10px] text-slate-500 font-sans leading-tight">{subType}</div>
                    <div className="text-[10px] font-mono text-slate-600 font-bold mt-0.5">
                      {tempStr} | {pressStr}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

        </div>

      </div>

    </div>
  );
};
