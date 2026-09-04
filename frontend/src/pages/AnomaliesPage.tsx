import React, { useState } from 'react';
import { SHAPChart } from '../components/SHAPChart';
import { ImputedValueCard } from '../components/ImputedValueCard';
import { SpatialConsensusPanel } from '../components/SpatialConsensusPanel';
import { Filter } from 'lucide-react';
import { AnomalyRecord } from '../types';

interface AnomaliesPageProps {
  anomalies: AnomalyRecord[];
}

export const AnomaliesPage: React.FC<AnomaliesPageProps> = ({ anomalies }) => {
  const [selectedAnomalyId, setSelectedAnomalyId] = useState<string>(anomalies[0]?.id || 'ANOM_2026_001');
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');

  const selectedAnomaly = anomalies.find(a => a.id === selectedAnomalyId) || anomalies[0];
  const filteredAnomalies = anomalies.filter(a => filterSeverity === 'ALL' || a.severity === filterSeverity);

  return (
    <div className="space-y-8 pb-12 font-sans text-slate-900">
      
      {/* Header */}
      <div className="section-header">
        <div className="section-number">
          <span className="w-2 h-2 rounded-full bg-blue-600"></span>
          <span>TIER 1 CORE ANOMALY ENGINE</span>
        </div>
        <h1 className="section-title">Multivariate Anomaly Identification & Explainability Studio</h1>
        <p className="section-subtitle">
          Real-time detection operating strictly on Temperature (°C), Pressure (hPa), and Relative Humidity (%).
          Every flagged anomaly includes mandatory SHAP feature contributions, physics-based imputation, and spatial consensus verification.
        </p>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Flagged Anomaly Feed */}
        <div className="luxury-card p-6 bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-extrabold text-sm text-slate-900 font-display uppercase tracking-wider">Flagged Anomaly Feed</h3>
            
            {/* Filter */}
            <div className="flex items-center space-x-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
              <Filter className="w-3.5 h-3.5 text-blue-600" />
              <select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value)}
                className="text-xs bg-transparent font-mono font-bold text-slate-700 border-none focus:outline-none cursor-pointer"
              >
                <option value="ALL" className="bg-white text-slate-900">ALL SEVERITIES</option>
                <option value="CRITICAL" className="bg-white text-red-600">CRITICAL</option>
                <option value="HIGH" className="bg-white text-amber-600">HIGH</option>
                <option value="MEDIUM" className="bg-white text-blue-600">MEDIUM</option>
              </select>
            </div>
          </div>

          <div className="space-y-3 max-h-[640px] overflow-y-auto pr-1">
            {filteredAnomalies.map((anom) => {
              const isSelected = anom.id === selectedAnomalyId;
              return (
                <div
                  key={anom.id}
                  onClick={() => setSelectedAnomalyId(anom.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer space-y-2.5 ${
                    isSelected
                      ? 'bg-blue-50/70 border-blue-500 ring-2 ring-blue-100 shadow-sm'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900 font-sans">{anom.station_name}</span>
                    <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full ${
                      anom.severity === 'CRITICAL' ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-amber-100 text-amber-700 border border-amber-200'
                    }`}>
                      {anom.severity}
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 flex items-center justify-between font-mono">
                    <span>ROOT CAUSE: <span className="font-semibold text-slate-900">{anom.root_cause}</span></span>
                    <span className="text-blue-600 font-bold">CONF: {Math.round(anom.confidence * 100)}%</span>
                  </div>

                  <div className="text-xs text-slate-700 font-mono bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex justify-between">
                    <span>T: <strong className="text-slate-900">{anom.readings.temperature}°C</strong></span>
                    <span>P: <strong className="text-slate-900">{anom.readings.pressure}hPa</strong></span>
                    <span>RH: <strong className="text-slate-900">{anom.readings.humidity}%</strong></span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 2 Columns: Selected Anomaly Full Inspection */}
        {selectedAnomaly && (
          <div className="lg:col-span-2 space-y-6">
            
            {/* Top Detail Card */}
            <div className="luxury-card p-6 bg-white border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-3">
                <div>
                  <span className="text-xs font-mono font-bold text-blue-600 tracking-wider">{selectedAnomaly.id}</span>
                  <h2 className="text-xl font-black text-slate-900 font-display uppercase tracking-wide mt-0.5">{selectedAnomaly.station_name}</h2>
                  <span className="text-xs font-mono text-slate-500">TIMESTAMP: {new Date(selectedAnomaly.timestamp).toLocaleString()}</span>
                </div>
                <div className="text-left sm:text-right font-mono">
                  <span className={`text-xs font-black px-3 py-1 rounded-full border inline-block ${
                    selectedAnomaly.severity === 'CRITICAL' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    {selectedAnomaly.severity} SEVERITY
                  </span>
                  <div className="text-xs text-slate-500 mt-1">
                    CALIBRATED CONFIDENCE: <span className="font-bold text-blue-600">{Math.round(selectedAnomaly.confidence * 100)}%</span>
                  </div>
                </div>
              </div>

              {/* Readout Parameter Values Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <span className="text-xs text-slate-500 uppercase block font-semibold">Temperature Reading</span>
                  <span className="text-xl font-black text-slate-900 mt-1 block">{selectedAnomaly.readings.temperature} °C</span>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <span className="text-xs text-slate-500 uppercase block font-semibold">Pressure Reading</span>
                  <span className="text-xl font-black text-slate-900 mt-1 block">{selectedAnomaly.readings.pressure} hPa</span>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <span className="text-xs text-slate-500 uppercase block font-semibold">Humidity Reading</span>
                  <span className="text-xl font-black text-slate-900 mt-1 block">{selectedAnomaly.readings.humidity} %</span>
                </div>
              </div>
            </div>

            {/* Mandatory SHAP Feature Contributions Chart */}
            <SHAPChart factors={selectedAnomaly.contributing_factors} />

            {/* Imputed Value Suggestion */}
            <ImputedValueCard imputation={selectedAnomaly.imputed_value_suggestion} />

            {/* Spatial Consistency Consensus Panel */}
            <SpatialConsensusPanel spatialVerdict={selectedAnomaly.spatial_verdict} />

          </div>
        )}

      </div>
    </div>
  );
};
