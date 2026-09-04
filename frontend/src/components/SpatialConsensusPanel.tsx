import React from 'react';
import { Network, Check, X } from 'lucide-react';

interface SpatialConsensusPanelProps {
  spatialVerdict: string;
}

export const SpatialConsensusPanel: React.FC<SpatialConsensusPanelProps> = ({ spatialVerdict }) => {
  const isGenuineEvent = spatialVerdict.includes('CORROBORATED');

  return (
    <div className={`luxury-card p-6 bg-white border ${
      isGenuineEvent
        ? 'border-blue-200 shadow-sm'
        : 'border-amber-200 shadow-sm'
    } space-y-4 font-sans`}>
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center space-x-2.5">
          <div className={`p-2 rounded-xl border ${
            isGenuineEvent ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-amber-50 border-amber-200 text-amber-600'
          }`}>
            <Network className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 font-display">
            Spatial Consistency Consensus
          </h4>
        </div>
        <span className={`text-xs font-mono font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${
          isGenuineEvent
            ? 'bg-blue-50 text-blue-700 border-blue-200'
            : 'bg-amber-50 text-amber-700 border-amber-200'
        }`}>
          {isGenuineEvent ? 'GENUINE WEATHER EVENT' : 'ISOLATED SENSOR FAULT'}
        </span>
      </div>

      <div className="flex items-start space-x-3 bg-slate-50 p-4 rounded-xl border border-slate-200 font-mono">
        <div className={`p-1.5 rounded-full mt-0.5 ${
          isGenuineEvent ? 'bg-blue-100 text-blue-700 border border-blue-300' : 'bg-amber-100 text-amber-700 border border-amber-300'
        }`}>
          {isGenuineEvent ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
        </div>
        <div>
          <div className="text-xs font-bold text-slate-900 uppercase">{spatialVerdict}</div>
          <p className="text-xs text-slate-600 mt-1 font-sans leading-relaxed">
            {isGenuineEvent
              ? "Reading matches spatial gradients of neighboring Goa AWS stations. Classified as a genuine extreme meteorological event."
              : "Reading contradicts spatial gradients of neighboring stations within 50km radius. Confirmed as an isolated AWS sensor hardware fault."}
          </p>
        </div>
      </div>
    </div>
  );
};
