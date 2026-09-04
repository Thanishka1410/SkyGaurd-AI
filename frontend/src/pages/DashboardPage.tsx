import React, { useState } from 'react';
import { StationMap } from '../components/StationMap';
import { Station3DMap } from '../components/Station3DMap';
import { SHAPChart } from '../components/SHAPChart';
import { ImputedValueCard } from '../components/ImputedValueCard';
import { SpatialConsensusPanel } from '../components/SpatialConsensusPanel';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Radio, 
  Activity, 
  Thermometer, 
  Gauge, 
  Droplets, 
  Wind,
  CloudRain, 
  CheckCircle2, 
  ArrowRight,
  TrendingUp,
  TrendingDown,
  AlertTriangle
} from 'lucide-react';
import { Station, Reading, AnomalyRecord, DisasterRiskSummary } from '../types';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface DashboardPageProps {
  stations: Station[];
  liveReadings: Reading[];
  anomalies: AnomalyRecord[];
  disasterRisks?: DisasterRiskSummary;
  onNavigateTab: (tab: string) => void;
  is3DMode?: boolean;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  stations,
  liveReadings,
  anomalies,
  disasterRisks,
  onNavigateTab,
  is3DMode: initial3DMode = true
}) => {
  const [selectedStationId, setSelectedStationId] = useState<string>('AWS_GOA_04');
  const [is3DView, setIs3DView] = useState<boolean>(initial3DMode);

  const selectedStation = stations.find(s => s.station_id === selectedStationId) || stations[3] || stations[0];
  const activeAnomaliesCount = anomalies.filter(a => a.is_anomaly).length;

  // Mock trend history for selected station to render trend line chart matching screenshot
  const trendData = [
    { time: '09:12', temp: 28.1, press: 1011.0, hum: 70 },
    { time: '09:20', temp: 28.2, press: 1011.2, hum: 71 },
    { time: '09:28', temp: 28.4, press: 1011.0, hum: 72 },
    { time: '09:36', temp: 28.5, press: 1010.9, hum: 73 },
    { time: '09:42', temp: selectedStation.last_reading?.temperature || 28.7, press: selectedStation.last_reading?.pressure || 1010.8, hum: selectedStation.last_reading?.humidity || 74 },
  ];

  const currentTemp = selectedStation.last_reading?.temperature ?? 28.7;
  const currentPress = selectedStation.last_reading?.pressure ?? 1010.8;
  const currentHum = selectedStation.last_reading?.humidity ?? 74;

  const activeAnomalyRecord = anomalies.find(a => a.station_id === selectedStationId && a.is_anomaly) || anomalies[0];

  return (
    <div className="space-y-6 pb-12 font-sans text-slate-900">
      
      {/* ROW 1: TOP 5 KPI OVERVIEW CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* Card 1: SYSTEM OVERVIEW */}
        <div className="luxury-card p-5 relative overflow-hidden bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="space-y-1 relative z-10">
            <span className="text-[11px] font-mono font-bold text-blue-600 uppercase tracking-wider block">
              SYSTEM OVERVIEW
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-display tracking-tight leading-tight">
              ATMOSPHERIC INTELLIGENCE
            </h2>
            <p className="text-xs text-slate-500 font-sans leading-relaxed mt-1">
              Real-time AWS Monitoring, Anomaly Detection & Disaster Risk Intelligence
            </p>
          </div>
          {/* Faint Background Shield Logo Watermark */}
          <ShieldCheck className="absolute -bottom-2 -right-2 w-24 h-24 text-blue-50/60 pointer-events-none stroke-[1]" />
        </div>

        {/* Card 2: ACTIVE STATIONS */}
        <div className="luxury-card p-5 bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider">
              ACTIVE STATIONS
            </span>
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <Radio className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-3xl font-extrabold text-slate-900 tracking-tight font-sans">
              0{stations.length}
            </div>
            <div className="text-xs font-semibold text-emerald-600 flex items-center space-x-1 mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>100% Operational</span>
            </div>
          </div>
          {/* Sparkline */}
          <div className="mt-3 h-6 w-full opacity-80">
            <svg className="w-full h-full text-blue-500" viewBox="0 0 100 25" fill="none">
              <path d="M0 20 Q 25 15, 50 18 T 100 8" stroke="#0284c7" strokeWidth="2" fill="none" />
            </svg>
          </div>
        </div>

        {/* Card 3: ACTIVE ANOMALIES */}
        <div className="luxury-card p-5 bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider">
              ACTIVE ANOMALIES
            </span>
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-3xl font-extrabold text-slate-900 tracking-tight font-sans">
              0{activeAnomaliesCount}
            </div>
            <div className={`text-xs font-semibold flex items-center space-x-1 mt-1 ${
              activeAnomaliesCount > 0 ? 'text-red-600' : 'text-emerald-600'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${activeAnomaliesCount > 0 ? 'bg-red-500' : 'bg-emerald-500'}`}></span>
              <span>{activeAnomaliesCount > 0 ? `${activeAnomaliesCount} Flagged` : 'All Systems Nominal'}</span>
            </div>
          </div>
          {/* Sparkline */}
          <div className="mt-3 h-6 w-full opacity-80">
            <svg className="w-full h-full text-blue-500" viewBox="0 0 100 25" fill="none">
              <path d="M0 22 Q 30 20, 60 12 T 100 18" stroke="#0284c7" strokeWidth="2" fill="none" />
            </svg>
          </div>
        </div>

        {/* Card 4: SYSTEM HEALTH */}
        <div className="luxury-card p-5 bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider">
              SYSTEM HEALTH
            </span>
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <Gauge className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-3xl font-extrabold text-slate-900 tracking-tight font-sans">
              100%
            </div>
            <div className="text-xs font-semibold text-emerald-600 flex items-center space-x-1 mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>Excellent</span>
            </div>
          </div>
          {/* Sparkline */}
          <div className="mt-3 h-6 w-full opacity-80">
            <svg className="w-full h-full text-blue-500" viewBox="0 0 100 25" fill="none">
              <path d="M0 18 Q 30 10, 70 15 T 100 5" stroke="#0284c7" strokeWidth="2" fill="none" />
            </svg>
          </div>
        </div>

        {/* Card 5: CURRENT RISK */}
        <div className="luxury-card p-5 bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider">
              CURRENT RISK
            </span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-3xl font-extrabold text-emerald-600 tracking-tight font-sans">
              {disasterRisks?.composite_risk_level || 'LOW'}
            </div>
            <div className="text-xs font-semibold text-emerald-600 flex items-center space-x-1 mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>No Immediate Threat</span>
            </div>
          </div>
          {/* Sparkline */}
          <div className="mt-3 h-6 w-full opacity-80">
            <svg className="w-full h-full text-emerald-500" viewBox="0 0 100 25" fill="none">
              <path d="M0 15 Q 40 22, 70 12 T 100 20" stroke="#059669" strokeWidth="2" fill="none" />
            </svg>
          </div>
        </div>

      </div>


      {/* ROW 2: LIVE AWS NETWORK MAP (~60%) + SELECTED STATION TELEMETRY (~40%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Map Panel (~60% -> 7 columns on lg grid) */}
        <div className="lg:col-span-7">
          {is3DView ? (
            <Station3DMap
              stations={stations}
              selectedStationId={selectedStationId}
              onSelectStation={setSelectedStationId}
              onToggle3D={() => setIs3DView(false)}
            />
          ) : (
            <StationMap
              stations={stations}
              selectedStationId={selectedStationId}
              onSelectStation={setSelectedStationId}
              onToggle3D={() => setIs3DView(true)}
            />
          )}
        </div>

        {/* Right Selected Station Details (~40% -> 5 columns on lg grid) */}
        <div className="lg:col-span-5 luxury-card p-6 bg-white border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
          
          {/* Station Title Header */}
          <div className="flex items-start justify-between border-b border-slate-100 pb-3">
            <div>
              <span className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider block">
                SELECTED STATION
              </span>
              <h3 className="text-lg font-extrabold text-slate-900 font-sans tracking-tight uppercase mt-0.5">
                {selectedStation.name}
              </h3>
              <p className="text-xs font-mono text-slate-500 mt-0.5">
                {selectedStation.station_id} · {selectedStation.coordinates.lat}° N, {selectedStation.coordinates.lon}° E
              </p>
            </div>

            {/* Status Normal Pill */}
            <div className="flex items-center space-x-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>NORMAL</span>
            </div>
          </div>

          {/* 3 Parameter Readout Cards */}
          <div className="grid grid-cols-3 gap-3 font-sans">
            
            {/* Temperature Tile */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-center">
              <div className="flex items-center justify-center space-x-1 text-slate-500 text-[11px] font-bold uppercase">
                <Thermometer className="w-3.5 h-3.5 text-red-500" />
                <span>TEMPERATURE</span>
              </div>
              <div className="text-2xl font-extrabold text-slate-900 font-sans tracking-tight mt-1.5">
                {currentTemp}°C
              </div>
              <div className="text-[10px] font-semibold text-emerald-600 mt-1 flex items-center justify-center space-x-0.5">
                <TrendingUp className="w-3 h-3 text-emerald-600" />
                <span>1.2°C vs expected</span>
              </div>
            </div>

            {/* Pressure Tile */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-center">
              <div className="flex items-center justify-center space-x-1 text-slate-500 text-[11px] font-bold uppercase">
                <Gauge className="w-3.5 h-3.5 text-blue-600" />
                <span>PRESSURE</span>
              </div>
              <div className="text-2xl font-extrabold text-slate-900 font-sans tracking-tight mt-1.5">
                {currentPress} <span className="text-xs font-semibold text-slate-500">hPa</span>
              </div>
              <div className="text-[10px] font-semibold text-blue-600 mt-1 flex items-center justify-center space-x-0.5">
                <TrendingDown className="w-3 h-3 text-blue-600" />
                <span>2 hPa vs expected</span>
              </div>
            </div>

            {/* Humidity Tile */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-center">
              <div className="flex items-center justify-center space-x-1 text-slate-500 text-[11px] font-bold uppercase">
                <Droplets className="w-3.5 h-3.5 text-blue-500" />
                <span>HUMIDITY</span>
              </div>
              <div className="text-2xl font-extrabold text-slate-900 font-sans tracking-tight mt-1.5">
                {currentHum}%
              </div>
              <div className="text-[10px] font-semibold text-emerald-600 mt-1 flex items-center justify-center space-x-0.5">
                <TrendingUp className="w-3 h-3 text-emerald-600" />
                <span>5% vs expected</span>
              </div>
            </div>

          </div>

          {/* Live Sensor Trend Chart */}
          <div className="pt-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-600 mb-2">
              <span className="uppercase tracking-wider font-mono text-[11px]">LIVE SENSOR TREND (Last 30 Minutes)</span>
              <div className="flex items-center space-x-3 text-[10px] font-sans">
                <span className="flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                  <span>Temp (°C)</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                  <span>Pressure (hPa)</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>Humidity (%)</span>
                </span>
              </div>
            </div>

            <div className="h-44 w-full bg-slate-50/70 rounded-xl border border-slate-200 p-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} domain={['dataMin - 2', 'dataMax + 2']} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '8px', fontSize: '11px' }} 
                  />
                  <Line type="monotone" dataKey="temp" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="press" stroke="#0284c7" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="hum" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

      </div>


      {/* ROW 3: TIER 1 & TIER 2 SIDE-BY-SIDE PANELS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative">
        
        {/* TIER 1 PANEL */}
        <div className="luxury-card p-6 bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2 text-blue-600">
              <ShieldCheck className="w-4 h-4" />
              <h3 className="font-extrabold text-xs uppercase tracking-wider font-mono">
                TIER 1 · SENSOR ANOMALY DETECTION
              </h3>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
            
            {/* Sub 1: Parameter status list */}
            <div className="space-y-2.5 font-sans text-xs">
              <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <span className="flex items-center space-x-2 text-slate-700">
                  <Thermometer className="w-3.5 h-3.5 text-red-500" />
                  <span>Temperature</span>
                </span>
                <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">Normal</span>
              </div>

              <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <span className="flex items-center space-x-2 text-slate-700">
                  <Gauge className="w-3.5 h-3.5 text-blue-600" />
                  <span>Pressure</span>
                </span>
                <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">Normal</span>
              </div>

              <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <span className="flex items-center space-x-2 text-slate-700">
                  <Droplets className="w-3.5 h-3.5 text-blue-500" />
                  <span>Humidity</span>
                </span>
                <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">Normal</span>
              </div>
            </div>

            {/* Sub 2: ANOMALY SCORE Arc Meter */}
            <div className="flex flex-col items-center justify-center p-2 text-center">
              <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-1">
                ANOMALY SCORE
              </span>
              
              {/* Semi-Circle SVG Gauge */}
              <div className="relative w-36 h-20 flex items-end justify-center">
                <svg className="w-36 h-36 transform -rotate-90 overflow-visible" viewBox="0 0 100 100">
                  <circle 
                    cx="50" cy="50" r="40" 
                    stroke="#e2e8f0" strokeWidth="8" 
                    fill="none" 
                    strokeDasharray="125 250"
                  />
                  <circle 
                    cx="50" cy="50" r="40" 
                    stroke="#10b981" strokeWidth="8" 
                    fill="none" 
                    strokeDasharray="125 250"
                    strokeDashoffset="125"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
                  <span className="text-3xl font-extrabold text-slate-900 font-sans tracking-tight leading-none">
                    0.00
                  </span>
                  <span className="text-[11px] font-extrabold text-emerald-600 uppercase tracking-wider mt-1">
                    NORMAL
                  </span>
                </div>
              </div>
            </div>

            {/* Sub 3: Detection metadata */}
            <div className="space-y-2 text-xs font-sans text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-mono">DETECTION TIME</span>
                <span className="font-bold text-slate-900 font-mono text-xs">09:42:15 IST</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-mono">CONFIDENCE</span>
                <span className="font-bold text-emerald-600">100%</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-mono">REASON</span>
                <span className="text-[11px] text-slate-600 leading-tight block mt-0.5">
                  All sensor readings within expected operational range.
                </span>
              </div>
            </div>

          </div>
        </div>

        {/* Center Connecting Arrow Icon */}
        <div className="hidden lg:flex absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white border border-slate-300 shadow-md items-center justify-center text-blue-600">
          <ArrowRight className="w-4 h-4" />
        </div>

        {/* TIER 2 PANEL */}
        <div className="luxury-card p-6 bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2 text-blue-600">
              <ShieldAlert className="w-4 h-4" />
              <h3 className="font-extrabold text-xs uppercase tracking-wider font-mono">
                TIER 2 · ENVIRONMENTAL RISK INTELLIGENCE
              </h3>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
            
            {/* Sub 1: Weather Context */}
            <div className="space-y-2 font-sans text-xs">
              <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider block mb-1">
                WEATHER CONTEXT
              </span>
              
              <div className="space-y-1.5 text-slate-700 text-xs">
                <div className="flex items-center space-x-2">
                  <Thermometer className="w-3.5 h-3.5 text-blue-600" />
                  <span>28°C Temperature</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Droplets className="w-3.5 h-3.5 text-blue-600" />
                  <span>82% Humidity</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CloudRain className="w-3.5 h-3.5 text-blue-600" />
                  <span>Light Rain Conditions</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Wind className="w-3.5 h-3.5 text-blue-600" />
                  <span>18 km/h Wind Speed</span>
                </div>
              </div>
            </div>

            {/* Sub 2: RISK ASSESSMENT Arc Meter */}
            <div className="flex flex-col items-center justify-center p-2 text-center">
              <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-1">
                RISK ASSESSMENT
              </span>

              {/* Semi-Circle SVG Gauge */}
              <div className="relative w-36 h-20 flex items-end justify-center">
                <svg className="w-36 h-36 transform -rotate-90 overflow-visible" viewBox="0 0 100 100">
                  <circle 
                    cx="50" cy="50" r="40" 
                    stroke="#e2e8f0" strokeWidth="8" 
                    fill="none" 
                    strokeDasharray="125 250"
                  />
                  <circle 
                    cx="50" cy="50" r="40" 
                    stroke="#10b981" strokeWidth="8" 
                    fill="none" 
                    strokeDasharray="125 250"
                    strokeDashoffset="125"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
                  <span className="text-3xl font-extrabold text-emerald-600 font-sans tracking-tight leading-none">
                    LOW
                  </span>
                  <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider mt-1">
                    RISK LEVEL
                  </span>
                </div>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">No immediate environmental threat</p>
            </div>

            {/* Sub 3: Impact Analysis */}
            <div className="space-y-2 text-xs font-sans text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider block mb-1">
                IMPACT ANALYSIS
              </span>
              
              <div className="flex justify-between items-center text-xs py-0.5">
                <span className="flex items-center space-x-1.5">
                  <AlertTriangle className="w-3 h-3 text-slate-400" />
                  <span>Flood Risk</span>
                </span>
                <span className="font-bold text-emerald-600">LOW</span>
              </div>

              <div className="flex justify-between items-center text-xs py-0.5 border-t border-slate-200/60">
                <span className="flex items-center space-x-1.5">
                  <Thermometer className="w-3 h-3 text-slate-400" />
                  <span>Heatwave Risk</span>
                </span>
                <span className="font-bold text-emerald-600">LOW</span>
              </div>

              <div className="flex justify-between items-center text-xs py-0.5 border-t border-slate-200/60">
                <span className="flex items-center space-x-1.5">
                  <Wind className="w-3 h-3 text-slate-400" />
                  <span>Storm Risk</span>
                </span>
                <span className="font-bold text-emerald-600">LOW</span>
              </div>

              <div className="flex justify-between items-center text-xs py-0.5 border-t border-slate-200/60 font-bold">
                <span className="flex items-center space-x-1.5 text-slate-900">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>Overall Impact</span>
                </span>
                <span className="text-emerald-600">MINIMAL</span>
              </div>
            </div>

          </div>
        </div>

      </div>


      {/* ROW 4: SYSTEM ALERTS BOTTOM BAR */}
      <div className="luxury-card p-4 bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between text-xs font-sans gap-3">
        <div className="flex flex-wrap items-center gap-6">
          <span className="font-extrabold text-slate-900 uppercase font-mono tracking-wider flex items-center space-x-2">
            <Activity className="w-4 h-4 text-blue-600" />
            <span>SYSTEM ALERTS</span>
          </span>

          <div className="flex items-center space-x-2 text-slate-700 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>All systems operational</span>
          </div>

          <div className="flex items-center space-x-2 text-slate-700 font-medium">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            <span>No active anomalies in other stations</span>
          </div>

          <div className="flex items-center space-x-2 text-slate-700 font-medium">
            <span className="w-2 h-2 rounded-full bg-purple-500"></span>
            <span>Weather data synced</span>
          </div>
        </div>

        <button
          onClick={() => onNavigateTab('anomalies')}
          className="text-blue-600 hover:text-blue-800 font-bold font-mono text-xs flex items-center space-x-1 whitespace-nowrap"
        >
          <span>View All Alerts</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Additional Deep Inspection components when active anomalies exist */}
      {activeAnomaliesCount > 0 && activeAnomalyRecord && (
        <div className="space-y-6 pt-4">
          <div className="section-header">
            <div className="section-number">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              <span>ACTIVE ANOMALY EXPLAINABILITY</span>
            </div>
            <h2 className="section-title">Deep Inspection & SHAP Breakdown</h2>
          </div>

          <SHAPChart factors={activeAnomalyRecord.contributing_factors} />
          <ImputedValueCard imputation={activeAnomalyRecord.imputed_value_suggestion} />
          <SpatialConsensusPanel spatialVerdict={activeAnomalyRecord.spatial_verdict} />
        </div>
      )}

    </div>
  );
};
