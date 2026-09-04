import React from 'react';
import { Bell, Filter, CheckCircle2 } from 'lucide-react';
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
  return (
    <div className="luxury-card p-6 bg-white border border-slate-200 shadow-sm space-y-4 font-sans">
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <h3 className="font-extrabold text-sm text-slate-900 font-display uppercase tracking-wider flex items-center space-x-2">
          <Bell className="w-4 h-4 text-sky-700" />
          <span>Flagged Anomaly Feed ({anomalies.length})</span>
        </h3>

        {/* Severity Filter */}
        <div className="flex items-center space-x-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
          <Filter className="w-3.5 h-3.5 text-sky-700" />
          <select
            value={filterSeverity}
            onChange={(e) => onFilterChange(e.target.value)}
            className="text-xs bg-transparent font-mono font-bold text-slate-800 border-none focus:outline-none cursor-pointer"
          >
            <option value="ALL" className="bg-white text-slate-900">ALL SEVERITIES</option>
            <option value="CRITICAL" className="bg-white text-red-700">CRITICAL</option>
            <option value="HIGH" className="bg-white text-amber-700">HIGH</option>
            <option value="MEDIUM" className="bg-white text-sky-700">MEDIUM</option>
          </select>
        </div>
      </div>

      <div className="space-y-3 max-h-[640px] overflow-y-auto pr-1">
        {!anomalies || anomalies.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl space-y-3 my-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <div className="font-extrabold text-xs text-slate-900 font-mono uppercase tracking-wider">
              No Active Anomalies Flagged
            </div>
            <p className="text-[11px] text-slate-500 max-w-xs mx-auto leading-relaxed font-sans">
              All AWS station telemetry streams are operating normally within baseline bounds.
            </p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {anomalies.map((anom) => {
              const isSelected = anom.id === activeId;
              const stationName = getCanonicalStationName(anom.station_id || anom.stationId);
              const rootCauseLabel = (anom.root_cause || anom.rootCause || 'anomaly').replace(/_/g, ' ').toUpperCase();

              return (
                <motion.div
                  key={anom.id}
                  layout
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  onClick={() => onSelectAnomaly(anom.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer space-y-2.5 ${
                    isSelected
                      ? 'bg-sky-50 border-sky-600 ring-2 ring-sky-100 shadow-sm'
                      : 'bg-slate-50 border-slate-200 hover:border-sky-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900 font-sans">{stationName}</span>
                    <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full ${
                      anom.severity === 'CRITICAL' ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-amber-100 text-amber-700 border border-amber-200'
                    }`}>
                      {anom.severity}
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 flex items-center justify-between font-mono">
                    <span>ROOT CAUSE: <span className="font-bold text-slate-900">{rootCauseLabel}</span></span>
                    <span className="text-sky-700 font-bold">CONF: {Math.round((anom.confidence || 0.95) * 100)}%</span>
                  </div>

                  {/* Structured 3-column Telemetry Readout Grid */}
                  <div className="mt-2 grid grid-cols-3 gap-1 rounded-md bg-slate-100/80 p-1.5 font-mono text-[11px] text-slate-700">
                    <div className="truncate">
                      <span className="text-slate-400">T:</span>{' '}
                      <strong className="text-slate-900">
                        {anom.readings?.temperature !== undefined ? `${anom.readings.temperature.toFixed(1)}°C` : 'N/A'}
                      </strong>
                    </div>
                    <div className="truncate">
                      <span className="text-slate-400">P:</span>{' '}
                      <strong className="text-slate-900">
                        {anom.readings?.pressure !== undefined ? `${anom.readings.pressure.toFixed(1)} hPa` : 'N/A'}
                      </strong>
                    </div>
                    <div className="truncate">
                      <span className="text-slate-400">RH:</span>{' '}
                      <strong className="text-slate-900">
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
