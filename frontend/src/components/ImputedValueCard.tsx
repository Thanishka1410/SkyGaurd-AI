import React from 'react';
import { RefreshCw, CheckCircle2 } from 'lucide-react';
import { ImputedSuggestion } from '../types';

interface ImputedValueCardProps {
  imputation?: ImputedSuggestion;
}

export const ImputedValueCard: React.FC<ImputedValueCardProps> = ({ imputation }) => {
  if (!imputation) return null;

  return (
    <div className="luxury-card p-6 bg-white border border-slate-200 border-l-4 border-l-emerald-600 shadow-sm space-y-4 font-sans">
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700">
            <RefreshCw className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 font-display">
            Automated Physics Imputation & Value Correction
          </h4>
        </div>
        <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
          HYBRID EMA RECOVERY
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 font-mono text-xs">
        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
          <span className="text-slate-500 uppercase font-semibold text-[10px] block">Target Feature</span>
          <span className="font-extrabold text-slate-900 uppercase text-sm mt-1 block">{imputation.target_feature}</span>
        </div>

        <div className="bg-slate-50 p-3.5 rounded-xl border border-red-200">
          <span className="text-red-700 uppercase font-semibold text-[10px] block">Flagged Reading</span>
          <span className="font-extrabold text-red-700 text-sm mt-1 block">{imputation.original_value}</span>
        </div>

        <div className="bg-slate-50 p-3.5 rounded-xl border border-emerald-200">
          <span className="text-emerald-700 uppercase font-semibold text-[10px] block">Corrected Value</span>
          <span className="font-extrabold text-emerald-700 text-sm mt-1 block">{imputation.corrected_value}</span>
        </div>

        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
          <span className="text-slate-500 uppercase font-semibold text-[10px] block">Correction Delta</span>
          <span className="font-extrabold text-sky-700 text-sm mt-1 block">{imputation.difference > 0 ? `+${imputation.difference}` : imputation.difference}</span>
        </div>
      </div>

      <div className="flex items-center space-x-2 text-xs text-emerald-700 font-mono pt-1">
        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
        <span>Imputed via spatiotemporal exponential moving average (Confidence: {Math.round(imputation.confidence * 100)}%)</span>
      </div>
    </div>
  );
};
