import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { ShapBreakdown } from './ShapBreakdown';
import { ImputedValueCard } from './ImputedValueCard';
import { SpatialConsensusPanel } from './SpatialConsensusPanel';
import { AnomalyRecord } from '../types';
import { getCanonicalStationName } from '../store/useSkyGuardStore';

interface AnomaliesViewProps {
  selectedAnomaly?: AnomalyRecord;
}

export const AnomaliesView: React.FC<AnomaliesViewProps> = ({ selectedAnomaly }) => {
  if (!selectedAnomaly) {
    return (
      <div className="luxury-card p-12 bg-white border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center space-y-4 min-h-[400px] font-sans">
        <div className="p-4 bg-sky-50 border border-sky-200 rounded-2xl text-sky-600">
          <ShieldCheck className="w-10 h-10" />
        </div>
        <h3 className="text-base font-black font-display uppercase tracking-wider text-slate-900">
          AWS Station Network Operating Normally
        </h3>
        <p className="text-xs text-slate-600 max-w-md leading-relaxed">
          No anomalies detected. Inject custom fault modes (Temperature Spike, Pressure Drop, Bias Drift, Frozen Sensor) in the <strong>Virtual AWS Simulator Studio</strong> to trigger real-time ML identification, SHAP feature breakdown, and spatio-temporal value imputation.
        </p>
      </div>
    );
  }

  const stationName = getCanonicalStationName(selectedAnomaly.station_id || selectedAnomaly.stationId);

  return (
    <div className="space-y-6 font-sans">
      {/* Top Detail Card */}
      <div className="luxury-card p-6 bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-4 gap-3">
          <div>
            <span className="text-xs font-mono font-bold text-sky-700 tracking-wider">{selectedAnomaly.id}</span>
            <h2 className="text-xl font-black text-slate-900 font-display uppercase tracking-wide mt-0.5">{stationName}</h2>
            <span className="text-xs font-mono text-slate-600">
              TIMESTAMP: {new Date(selectedAnomaly.timestamp).toLocaleString()}
            </span>
          </div>
          <div className="text-left sm:text-right font-mono">
            <span className={`text-xs font-black px-3 py-1 rounded-full border inline-block ${
              selectedAnomaly.severity === 'CRITICAL' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-amber-100 text-amber-700 border-amber-200'
            }`}>
              {selectedAnomaly.severity} SEVERITY
            </span>
            <div className="text-xs text-slate-600 mt-1">
              CALIBRATED CONFIDENCE: <span className="font-bold text-sky-700">{Math.round((selectedAnomaly.confidence || 0.95) * 100)}%</span>
            </div>
          </div>
        </div>

        {/* Readout Parameter Values Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <span className="text-xs text-slate-600 uppercase block font-semibold">Temperature Reading</span>
            <span className="text-xl font-black text-slate-900 mt-1 block">{selectedAnomaly.readings.temperature.toFixed(1)} °C</span>
          </div>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <span className="text-xs text-slate-600 uppercase block font-semibold">Pressure Reading</span>
            <span className="text-xl font-black text-slate-900 mt-1 block">{selectedAnomaly.readings.pressure.toFixed(1)} hPa</span>
          </div>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <span className="text-xs text-slate-600 uppercase block font-semibold">Humidity Reading</span>
            <span className="text-xl font-black text-slate-900 mt-1 block">{selectedAnomaly.readings.humidity.toFixed(1)} %</span>
          </div>
        </div>
      </div>

      {/* Mandatory SHAP Feature Contributions Chart */}
      <ShapBreakdown activeAnomaly={selectedAnomaly} />

      {/* Imputed Value Suggestion */}
      <ImputedValueCard imputation={selectedAnomaly.imputed_value_suggestion} />

      {/* Spatial Consistency Consensus Panel */}
      <SpatialConsensusPanel spatialVerdict={selectedAnomaly.spatial_verdict} />
    </div>
  );
};
