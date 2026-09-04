import React, { useState } from 'react';
import { Radio, Zap, AlertOctagon, TrendingUp, WifiOff, CheckCircle2 } from 'lucide-react';
import { Station } from '../types';

interface SimulatorPageProps {
  stations: Station[];
  onInjectFault: (stationId: string, faultType: string, param: string, mag: number) => void;
  onClearFaults: () => void;
}

export const SimulatorPage: React.FC<SimulatorPageProps> = ({ stations, onInjectFault, onClearFaults }) => {
  const [selectedStationId, setSelectedStationId] = useState<string>('AWS_GOA_01');
  const [selectedParam, setSelectedParam] = useState<string>('temperature');
  const [magnitude, setMagnitude] = useState<number>(15.0);
  const [lastNotification, setLastNotification] = useState<string | null>(null);

  const handleTrigger = (faultType: string) => {
    onInjectFault(selectedStationId, faultType, selectedParam, magnitude);
    setLastNotification(`FAULT INJECTED: '${faultType.toUpperCase()}' on ${selectedStationId} (${selectedParam})`);
    setTimeout(() => setLastNotification(null), 4000);
  };

  const handleClear = () => {
    onClearFaults();
    setLastNotification(`RESET: All active sensor fault injections cleared.`);
    setTimeout(() => setLastNotification(null), 4000);
  };

  return (
    <div className="space-y-8 pb-12 font-sans text-slate-900">
      
      {/* Header Banner */}
      <div className="luxury-card p-8 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-white border border-amber-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center space-x-3">
            <Radio className="w-6 h-6 text-amber-600 animate-pulse" />
            <h1 className="text-2xl sm:text-3xl font-black font-display uppercase tracking-wider text-slate-900">
              Virtual AWS Hardware Simulator Control Studio
            </h1>
          </div>
          <p className="text-slate-600 text-xs sm:text-sm font-sans mt-2 max-w-3xl leading-relaxed">
            Simulates physical AWS sensor hardware streaming live T, P, and RH telemetry.
            Inject controlled fault modes on demand to demonstrate real-time AI/ML detection working live in production.
          </p>
        </div>
        <button
          onClick={handleClear}
          className="px-5 py-3 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-xl text-xs font-mono font-extrabold transition-all shadow-sm whitespace-nowrap"
        >
          RESET ALL INJECTIONS
        </button>
      </div>

      {lastNotification && (
        <div className="luxury-card p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono font-bold flex items-center space-x-3 shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{lastNotification}</span>
        </div>
      )}

      {/* Control Panel Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans">
        
        {/* Target Config */}
        <div className="luxury-card p-6 bg-white border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-extrabold text-sm text-slate-900 font-display uppercase tracking-wider border-b border-slate-100 pb-3">
            Target Node & Parameter
          </h3>

          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1.5 uppercase font-mono">Target Virtual AWS Node</label>
            <select
              value={selectedStationId}
              onChange={(e) => setSelectedStationId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:border-amber-500 focus:outline-none"
            >
              {stations.map(st => (
                <option key={st.station_id} value={st.station_id} className="bg-white text-slate-900">
                  {st.name} ({st.station_id})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1.5 uppercase font-mono">Target Sensor Parameter</label>
            <select
              value={selectedParam}
              onChange={(e) => setSelectedParam(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:border-amber-500 focus:outline-none"
            >
              <option value="temperature" className="bg-white text-slate-900">Temperature (°C)</option>
              <option value="pressure" className="bg-white text-slate-900">Atmospheric Pressure (hPa)</option>
              <option value="humidity" className="bg-white text-slate-900">Relative Humidity (%)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1.5 uppercase font-mono">Fault Magnitude Offset</label>
            <input
              type="number"
              value={magnitude}
              onChange={(e) => setMagnitude(parseFloat(e.target.value))}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-bold text-blue-600 font-mono focus:border-amber-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Fault Trigger Injectors */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
          
          <div className="luxury-card p-6 bg-white border border-slate-200 border-l-4 border-l-red-500 shadow-sm space-y-4 hover:border-slate-300 transition-all">
            <div className="flex items-center space-x-3 text-red-600">
              <div className="p-2 rounded-xl bg-red-50 border border-red-200">
                <Zap className="w-5 h-5" />
              </div>
              <h4 className="font-extrabold text-sm text-slate-900 font-display uppercase">Spike Fault Anomaly</h4>
            </div>
            <p className="text-xs text-slate-600 font-sans leading-relaxed">
              Injects an immediate single-cycle extreme jump in sensor readings (e.g. +15°C spike). Tests instant rate-of-change detection.
            </p>
            <button
              onClick={() => handleTrigger('spike')}
              className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-mono font-bold text-xs rounded-xl transition-all shadow-sm"
            >
              INJECT SPIKE FAULT →
            </button>
          </div>

          <div className="luxury-card p-6 bg-white border border-slate-200 border-l-4 border-l-amber-500 shadow-sm space-y-4 hover:border-slate-300 transition-all">
            <div className="flex items-center space-x-3 text-amber-600">
              <div className="p-2 rounded-xl bg-amber-50 border border-amber-200">
                <AlertOctagon className="w-5 h-5" />
              </div>
              <h4 className="font-extrabold text-sm text-slate-900 font-display uppercase">Frozen / Stuck Sensor</h4>
            </div>
            <p className="text-xs text-slate-600 font-sans leading-relaxed">
              Locks sensor telemetry at a constant float value across consecutive cycles. Tests zero-variance stuck value detection.
            </p>
            <button
              onClick={() => handleTrigger('frozen')}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-mono font-bold text-xs rounded-xl transition-all shadow-sm"
            >
              FREEZE SENSOR READINGS →
            </button>
          </div>

          <div className="luxury-card p-6 bg-white border border-slate-200 border-l-4 border-l-blue-600 shadow-sm space-y-4 hover:border-slate-300 transition-all">
            <div className="flex items-center space-x-3 text-blue-600">
              <div className="p-2 rounded-xl bg-blue-50 border border-blue-200">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h4 className="font-extrabold text-sm text-slate-900 font-display uppercase">Sensor Bias Drift</h4>
            </div>
            <p className="text-xs text-slate-600 font-sans leading-relaxed">
              Applies a cumulative linear bias shift over time. Tests trend degradation and sliding window calibration tracking.
            </p>
            <button
              onClick={() => handleTrigger('drift')}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-mono font-bold text-xs rounded-xl transition-all shadow-sm"
            >
              INJECT BIAS DRIFT →
            </button>
          </div>

          <div className="luxury-card p-6 bg-white border border-slate-200 border-l-4 border-l-slate-400 shadow-sm space-y-4 hover:border-slate-300 transition-all">
            <div className="flex items-center space-x-3 text-slate-600">
              <div className="p-2 rounded-xl bg-slate-100 border border-slate-200">
                <WifiOff className="w-5 h-5" />
              </div>
              <h4 className="font-extrabold text-sm text-slate-900 font-display uppercase">Telemetry Dropout</h4>
            </div>
            <p className="text-xs text-slate-600 font-sans leading-relaxed">
              Simulates wireless telemetry packet loss and missing station payloads. Tests system fallback handling.
            </p>
            <button
              onClick={() => handleTrigger('dropout')}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-mono font-bold text-xs rounded-xl transition-all shadow-sm"
            >
              TRIGGER PACKET DROPOUT →
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
