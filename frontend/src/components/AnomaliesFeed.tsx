import React, { useState } from 'react';
import { Bell, Filter, CheckCircle2, Radio, AlertTriangle, CloudRain, WifiOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AnomalyRecord } from '../types';
import { getCanonicalStationName } from '../store/useSkyGuardStore';

interface AnomaliesFeedProps {
  anomalies?: AnomalyRecord[];
  activeId: string;
  onSelectAnomaly: (id: string) => void;
  filterSeverity: string;
  onFilterChange: (severity: string) => void;
}

export const AnomaliesFeed: React.FC<AnomaliesFeedProps> = ({
  anomalies = [],
  activeId,
  onSelectAnomaly,
  filterSeverity,
  onFilterChange
}) => {
  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  const filteredAnomalies = anomalies.filter(anom => {
    if (filterSeverity !== 'ALL' && anom.severity !== filterSeverity) {
      return false;
    }
    if (filterCategory !== 'ALL') {
      const cat = anom.category || (anom.status === 'Communication Failure' ? 'COMMUNICATION_FAILURE' : 'SENSOR_FAULT');
      if (cat !== filterCategory) return false;
    }
    return true;
  });

  return (
    <div className="luxury-card p-5 sm:p-5.5 bg-white border border-slate-200 shadow-sm flex flex-col font-sans h-full min-h-0 overflow-hidden">
      {/* Fixed Header & Filters */}
      <div className="shrink-0 pb-4 border-b border-slate-200 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-sm text-slate-900 font-display uppercase tracking-wider flex items-center space-x-2">
            <Bell className="w-4 h-4 text-sky-700" />
            <span>Flagged Feed</span>
          </h3>
          <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
            {filteredAnomalies.length} / {anomalies.length}
          </span>
        </div>

        {/* Severity & Category Filters */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="flex items-center space-x-1.5 bg-slate-50 px-2.5 py-2 rounded-lg border border-slate-200 shadow-2xs">
            <Filter className="w-3.5 h-3.5 text-sky-700 shrink-0" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="text-xs bg-transparent font-mono font-bold text-slate-800 border-none focus:outline-none cursor-pointer w-full truncate"
              aria-label="Filter by type"
            >
              <option value="ALL" className="bg-white text-slate-900">ALL TYPES</option>
              <option value="SENSOR_FAULT" className="bg-white text-amber-700">SENSOR FAULT</option>
              <option value="GENUINE_WEATHER_EVENT" className="bg-white text-blue-700">WEATHER EVENT</option>
              <option value="COMMUNICATION_FAILURE" className="bg-white text-purple-700">COMM FAILURE</option>
            </select>
          </div>

          <div className="flex items-center space-x-1.5 bg-slate-50 px-2.5 py-2 rounded-lg border border-slate-200 shadow-2xs">
            <select
              value={filterSeverity}
              onChange={(e) => onFilterChange(e.target.value)}
              className="text-xs bg-transparent font-mono font-bold text-slate-800 border-none focus:outline-none cursor-pointer w-full truncate"
              aria-label="Filter by severity"
            >
              <option value="ALL" className="bg-white text-slate-900">ALL SEVERITIES</option>
              <option value="CRITICAL" className="bg-white text-red-700">CRITICAL</option>
              <option value="HIGH" className="bg-white text-amber-700">HIGH</option>
              <option value="MEDIUM" className="bg-white text-sky-700">MEDIUM</option>
            </select>
          </div>
        </div>
      </div>

      {/* Independently Scrollable Feed List */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden pr-2 pt-3.5 pb-4 space-y-3.5 custom-feed-scrollbar">
        {!filteredAnomalies || filteredAnomalies.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl space-y-3 my-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <div className="font-extrabold text-xs text-slate-900 font-mono uppercase tracking-wider">
              No Active Anomalies Flagged
            </div>
            <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed font-sans">
              All AWS station telemetry streams are operating normally within baseline bounds.
            </p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filteredAnomalies.map((anom) => {
              const isSelected = anom.id === activeId;
              const stationName = getCanonicalStationName(anom.station_id || anom.stationId);
              const rootCauseLabel = (anom.root_cause || anom.rootCause || 'anomaly').replace(/_/g, ' ').toUpperCase();
              const category = anom.category || (anom.status === 'Communication Failure' ? 'COMMUNICATION_FAILURE' : (anom.spatial_verdict?.includes('CORROBORATED') ? 'GENUINE_WEATHER_EVENT' : 'SENSOR_FAULT'));

              let categoryBadge = (
                <span className="text-[9.5px] font-mono font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-200 flex items-center space-x-1 shrink-0">
                  <AlertTriangle className="w-2.5 h-2.5 shrink-0" />
                  <span>SENSOR FAULT</span>
                </span>
              );

              if (category === 'COMMUNICATION_FAILURE') {
                categoryBadge = (
                  <span className="text-[9.5px] font-mono font-bold px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 border border-purple-200 flex items-center space-x-1 shrink-0">
                    <WifiOff className="w-2.5 h-2.5 shrink-0" />
                    <span>COMM FAILURE</span>
                  </span>
                );
              } else if (category === 'GENUINE_WEATHER_EVENT') {
                categoryBadge = (
                  <span className="text-[9.5px] font-mono font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 border border-blue-200 flex items-center space-x-1 shrink-0">
                    <CloudRain className="w-2.5 h-2.5 shrink-0" />
                    <span>WEATHER EVENT</span>
                  </span>
                );
              }

              return (
                <motion.div
                  key={anom.id}
                  layout
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  onClick={() => onSelectAnomaly(anom.id)}
                  className={`p-4 sm:p-4.5 rounded-xl border transition-all cursor-pointer space-y-3 select-none ${
                    isSelected
                      ? 'bg-sky-50/80 border-sky-600 ring-2 ring-sky-200/70 shadow-sm'
                      : 'bg-slate-50/70 border-slate-200 hover:border-sky-300 hover:bg-slate-50/90'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 pb-0.5">
                    <span className="font-bold text-[13px] text-slate-900 font-sans tracking-tight truncate">{stationName}</span>
                    <div className="flex items-center space-x-1.5 shrink-0">
                      {categoryBadge}
                      <span className={`text-[9.5px] font-mono font-bold px-2 py-0.5 rounded-md shrink-0 ${
                        anom.severity === 'CRITICAL' ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-amber-100 text-amber-700 border border-amber-200'
                      }`}>
                        {anom.severity}
                      </span>
                    </div>
                  </div>

                  <div className="text-xs text-slate-600 flex items-center justify-between font-mono">
                    <span className="truncate pr-2">
                      ROOT CAUSE: <strong className="text-slate-900 font-semibold">{rootCauseLabel}</strong>
                    </span>
                    <span className="text-sky-700 font-bold shrink-0">
                      CONF: {category === 'COMMUNICATION_FAILURE' || anom.is_deterministic || anom.confidence === null || anom.confidence === undefined ? 'RULE' : `${Math.round(anom.confidence * 100)}%`}
                    </span>
                  </div>

                  {anom.why_detected && (
                    <div className="p-2.5 rounded-lg border border-slate-200/70 bg-white/90">
                      <p className="text-[11.5px] text-slate-600 leading-relaxed font-sans line-clamp-2 overflow-hidden text-ellipsis">
                        {anom.why_detected}
                      </p>
                    </div>
                  )}

                  {/* Structured 3-column Telemetry Readout Grid */}
                  <div className="grid grid-cols-3 gap-1.5 rounded-lg bg-slate-100/90 p-2 font-mono text-[11px] text-slate-700 text-center border border-slate-200/60">
                    <div className="truncate">
                      <span className="text-slate-400 font-semibold">T:</span>{' '}
                      <strong className="text-slate-900 font-bold">
                        {anom.readings?.temperature !== undefined ? `${anom.readings.temperature.toFixed(1)}°C` : 'N/A'}
                      </strong>
                    </div>
                    <div className="truncate">
                      <span className="text-slate-400 font-semibold">P:</span>{' '}
                      <strong className="text-slate-900 font-bold">
                        {anom.readings?.pressure !== undefined ? `${anom.readings.pressure.toFixed(1)} hPa` : 'N/A'}
                      </strong>
                    </div>
                    <div className="truncate">
                      <span className="text-slate-400 font-semibold">RH:</span>{' '}
                      <strong className="text-slate-900 font-bold">
                        {anom.readings?.humidity !== undefined ? `${anom.readings.humidity.toFixed(1)}%` : 'N/A'}
                      </strong>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};
