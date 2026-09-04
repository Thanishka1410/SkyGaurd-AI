import React, { useState, useMemo } from 'react';
import { AnomaliesFeed } from '../components/AnomaliesFeed';
import { AnomaliesView } from '../components/AnomaliesView';
import { AnomalyRecord, DisasterRiskSummary } from '../types';
import { useSkyGuardStore } from '../store/useSkyGuardStore';

interface AnomaliesPageProps {
  anomalies: AnomalyRecord[];
  risks?: DisasterRiskSummary;
}

export const AnomaliesPage: React.FC<AnomaliesPageProps> = ({ anomalies = [], risks }) => {
  const storeRisks = useSkyGuardStore((state) => state.disasterRisks);
  const effectiveRisks = risks || storeRisks;

  const [selectedAnomalyId, setSelectedAnomalyId] = useState<string>('');
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');

  const filteredAnomalies = useMemo(() => {
    return (anomalies || []).filter(a => filterSeverity === 'ALL' || a.severity === filterSeverity);
  }, [anomalies, filterSeverity]);

  const activeId = useMemo(() => {
    if (selectedAnomalyId && filteredAnomalies.some(a => a.id === selectedAnomalyId)) {
      return selectedAnomalyId;
    }
    return filteredAnomalies[0]?.id || '';
  }, [selectedAnomalyId, filteredAnomalies]);

  const selectedAnomaly = useMemo(() => {
    return filteredAnomalies.find(a => a.id === activeId) || filteredAnomalies[0];
  }, [filteredAnomalies, activeId]);

  const compRisk = effectiveRisks?.composite_risk_level || 'LOW';
  const hazards = effectiveRisks?.hazards;

  return (
    <div className="space-y-8 pb-12 font-sans text-slate-900">
      
      {/* Header Banner */}
      <div className="section-header flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="section-number">
            <span className="w-2 h-2 rounded-full bg-sky-600 animate-pulse"></span>
            <span>TIER 1 CORE ANOMALY ENGINE & TIER 2 RISK INTELLIGENCE</span>
          </div>
          <h1 className="section-title text-slate-900">Multivariate Anomaly Identification & SHAP Studio</h1>
          <p className="section-subtitle text-slate-600">
            Real-time detection operating strictly on Temperature (°C), Pressure (hPa), and Relative Humidity (%).
            Every flagged anomaly includes mandatory SHAP feature contribution analysis, sensor degradation signals, physics-based imputation, and spatial consensus verification.
          </p>
        </div>

        {/* Live Risk Intelligence Quick Summary Badge */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm font-mono text-xs space-y-2 min-w-[260px]">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-[10px] text-slate-500 font-bold uppercase">COMPOSITE HAZARD RISK</span>
            <span className={`font-black px-2.5 py-0.5 rounded-full text-xs ${
              compRisk === 'CRITICAL' || compRisk === 'HIGH' ? 'bg-red-100 text-red-700 border border-red-200' : compRisk === 'MEDIUM' ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
            }`}>
              {compRisk}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-[11px] pt-0.5 text-center">
            <div className="bg-slate-50 p-1.5 rounded border border-slate-200">
              <span className="text-[9px] text-slate-500 block">FLOOD</span>
              <strong className="text-sky-700">{hazards?.flood?.risk_level || 'LOW'}</strong>
            </div>
            <div className="bg-slate-50 p-1.5 rounded border border-slate-200">
              <span className="text-[9px] text-slate-500 block">HEAT</span>
              <strong className="text-amber-700">{hazards?.heatwave?.risk_level || 'LOW'}</strong>
            </div>
            <div className="bg-slate-50 p-1.5 rounded border border-slate-200">
              <span className="text-[9px] text-slate-500 block">CYCLONE</span>
              <strong className="text-emerald-700">{hazards?.cyclone?.risk_level || 'LOW'}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Deduplicated Flagged Anomaly Feed */}
        <AnomaliesFeed
          anomalies={filteredAnomalies}
          activeId={activeId}
          onSelectAnomaly={setSelectedAnomalyId}
          filterSeverity={filterSeverity}
          onFilterChange={setFilterSeverity}
        />

        {/* Right 2 Columns: Selected Anomaly Inspection View */}
        <div className="lg:col-span-2">
          <AnomaliesView selectedAnomaly={selectedAnomaly} />
        </div>

      </div>
    </div>
  );
};
