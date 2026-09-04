import React from 'react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { ImputedSuggestion } from '../types';

interface ImputedValueCardProps {
  imputation?: ImputedSuggestion;
}

export const ImputedValueCard: React.FC<ImputedValueCardProps> = ({ imputation }) => {
  if (!imputation) return null;

  const unit = imputation.target_feature === 'temperature' ? '°C' : imputation.target_feature === 'pressure' ? 'hPa' : '%';

  return (
    <div className="luxury-card p-6 bg-white border border-emerald-200 shadow-sm space-y-4 font-sans">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <h4 className="text-sm font-extrabold uppercase tracking-wider text-emerald-800 font-display">
            Physics-Guided Value Imputation
          </h4>
        </div>
        <span className="text-xs font-mono font-bold px-3 py-1 rounded-full tier2-pill">
          {Math.round(imputation.confidence * 100)}% CONFIDENCE
        </span>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between bg-slate-50 p-5 rounded-xl border border-slate-200 font-mono gap-4">
        <div>
          <span className="text-xs text-slate-500 block uppercase font-sans font-semibold">Flagged Anomalous Input</span>
          <span className="text-2xl font-black text-red-600 mt-1 block">
            {imputation.original_value} {unit}
          </span>
        </div>

        <div className="p-2.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600">
          <ArrowRight className="w-5 h-5" />
        </div>

        <div className="text-left sm:text-right">
          <span className="text-xs text-slate-500 block uppercase font-sans font-semibold">Physics Imputed Output</span>
          <span className="text-2xl font-black text-emerald-600 mt-1 block">
            {imputation.corrected_value} {unit}
          </span>
        </div>
      </div>

      <p className="text-xs text-emerald-700 font-mono">
        ALGORITHM METHOD: <span className="text-slate-900 font-bold">{imputation.method}</span> (Variance Delta: {imputation.difference > 0 ? `+${imputation.difference}` : imputation.difference} {unit})
      </p>
    </div>
  );
};
