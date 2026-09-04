import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { SHAPFactor } from '../types';
import { Cpu } from 'lucide-react';

interface SHAPChartProps {
  factors: SHAPFactor[];
}

export const SHAPChart: React.FC<SHAPChartProps> = ({ factors }) => {
  if (!factors || factors.length === 0) {
    return <div className="text-xs text-slate-500 italic font-mono p-4">No SHAP breakdown available.</div>;
  }

  const data = factors.map(f => ({
    name: f.feature,
    weight: f.shap_weight,
    value: f.value,
    impact: f.impact,
    description: f.description
  }));

  return (
    <div className="luxury-card p-6 bg-white border border-slate-200 shadow-sm space-y-4 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-600">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 font-display">
              SHAP Feature Contribution Breakdown <span className="text-blue-600 font-mono text-xs">(Explainable AI)</span>
            </h4>
            <p className="text-xs text-slate-500 font-sans mt-0.5">Quantifies exact numerical push of each sensor parameter towards anomaly decision</p>
          </div>
        </div>
        <span className="text-[11px] font-mono font-bold uppercase tracking-wider px-3 py-1 rounded-full tier1-pill">
          TREE EXPLAINER
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
                    <div className="bg-white text-slate-900 p-3 rounded-xl border border-slate-300 shadow-xl text-xs max-w-xs font-mono">
                      <div className="font-bold border-b border-slate-100 pb-1 mb-1 text-blue-600 uppercase">{d.name}</div>
                      <div>OBSERVED VALUE: <span className="font-bold text-slate-900">{d.value}</span></div>
                      <div>SHAP WEIGHT: <span className={`font-bold ${d.weight > 0 ? 'text-red-600' : 'text-blue-600'}`}>{d.weight > 0 ? `+${d.weight}` : d.weight}</span></div>
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
                  fill={entry.weight > 0.3 ? '#ef4444' : entry.weight > 0.1 ? '#f59e0b' : '#0284c7'}
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
            <span className={`font-bold text-xs ${f.shap_weight > 0 ? 'text-red-600' : 'text-blue-600'}`}>
              {f.shap_weight > 0 ? `+${f.shap_weight}` : f.shap_weight}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
