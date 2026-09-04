import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { Cpu } from 'lucide-react';
import { useTelemetryStore, evaluateTier1Anomaly } from '../store/useSkyGuardStore';
import { Station, Reading, AnomalyRecord } from '../types';

interface ShapBreakdownProps {
  selectedStation?: Station;
  currentReading?: Reading;
  activeAnomaly?: AnomalyRecord;
}

export const ShapBreakdown: React.FC<ShapBreakdownProps> = ({
  selectedStation: propStation,
  currentReading: propReading,
  activeAnomaly: propAnomaly
}) => {
  const { stations, liveReadings, anomalies } = useTelemetryStore();

  const selectedStation = propStation || stations[0];
  const stationId = selectedStation?.station_id || selectedStation?.id || 'AWS-01';

  const currentReading = propReading || liveReadings.find(
    r => r.station_id === stationId || r.station_id === selectedStation?.id
  );

  const activeAnomaly = propAnomaly || anomalies.find(
    a => (a.station_id === stationId || a.station_id === selectedStation?.id) && a.is_anomaly
  );

  const temp = currentReading?.temperature ?? selectedStation?.last_reading?.temperature ?? 28.5;
  const press = currentReading?.pressure ?? selectedStation?.last_reading?.pressure ?? 1012.0;
  const hum = currentReading?.humidity ?? selectedStation?.last_reading?.humidity ?? 75.0;
  const faultType = currentReading?.injected_fault_type || (activeAnomaly?.root_cause !== 'normal' ? activeAnomaly?.root_cause : undefined);

  // Evaluate dynamic SHAP factors from current feature deltas
  const evalResult = evaluateTier1Anomaly(temp, press, hum, faultType, activeAnomaly || currentReading?.anomaly_evaluation);

  const factors = (currentReading?.contributing_factors && currentReading.contributing_factors.length > 0)
    ? currentReading.contributing_factors
    : (activeAnomaly?.contributing_factors && activeAnomaly.contributing_factors.length > 0)
    ? activeAnomaly.contributing_factors
    : evalResult.shapFactors;

  const data = factors.map(f => ({
    name: f.feature.toUpperCase(),
    weight: f.shap_weight,
    value: f.value,
    impact: f.impact,
    description: f.description
  }));

  return (
    <div className="luxury-card p-6 bg-white border border-slate-200 shadow-sm space-y-4 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-3 gap-2">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-sky-50 border border-sky-200 text-sky-700">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 font-display">
              SHAP Feature Contribution Breakdown <span className="text-sky-700 font-mono text-xs">(Explainable AI)</span>
            </h4>
            <p className="text-xs text-slate-600 font-sans mt-0.5">
              Dynamically quantifies exact numerical contribution of each sensor parameter towards anomaly decisions.
            </p>
          </div>
        </div>
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-sky-700">
          DYNAMIC TREE EXPLAINER
        </span>
      </div>

      <div className="h-56 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart layout="vertical" data={data} margin={{ top: 5, right: 30, left: 70, bottom: 5 }}>
            <XAxis type="number" domain={[-1, 1]} tick={{ fontSize: 11, fill: '#64748b' }} />
            <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#0f172a', fontWeight: 700 }} />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload;
                  return (
                    <div className="bg-white text-slate-900 p-3 rounded-xl border border-slate-200 shadow-xl text-xs max-w-xs font-mono">
                      <div className="font-bold border-b border-slate-200 pb-1 mb-1 text-sky-700 uppercase">{d.name}</div>
                      <div>OBSERVED VALUE: <span className="font-bold text-slate-900">{d.value}</span></div>
                      <div>SHAP WEIGHT: <span className={`font-bold ${d.weight > 0 ? 'text-red-600' : 'text-sky-700'}`}>{d.weight > 0 ? `+${d.weight}` : d.weight}</span></div>
                      <div className="text-xs text-slate-600 mt-1.5 font-sans leading-relaxed">{d.description}</div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <ReferenceLine x={0} stroke="#cbd5e1" strokeDasharray="4 4" />
            <Bar dataKey="weight" radius={[0, 6, 6, 0]}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={Math.abs(entry.weight) > 0.3 ? '#dc2626' : Math.abs(entry.weight) > 0.1 ? '#d97706' : '#0284c7'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="space-y-2 font-mono text-xs pt-1">
        {factors.map((f, idx) => (
          <div key={idx} className="flex items-center justify-between bg-slate-50 px-3.5 py-2 rounded-lg border border-slate-200">
            <span className="font-bold text-slate-900 uppercase">{f.feature}:</span>
            <span className="text-slate-600 text-xs font-sans truncate mx-3 max-w-[320px]">{f.description}</span>
            <span className={`font-bold text-xs ${f.shap_weight > 0 ? 'text-red-700' : 'text-sky-700'}`}>
              {f.shap_weight > 0 ? `+${f.shap_weight}` : f.shap_weight}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
