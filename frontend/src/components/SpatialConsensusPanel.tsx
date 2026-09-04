import React from 'react';
import { Compass, CheckCircle2, AlertTriangle } from 'lucide-react';

interface SpatialConsensusPanelProps {
  spatialVerdict?: string;
}

export const SpatialConsensusPanel: React.FC<SpatialConsensusPanelProps> = ({ spatialVerdict = 'NOT_CHECKED' }) => {
  const isGenuineEvent = spatialVerdict.includes('GENUINE') || spatialVerdict.includes('CORROBORATED');
  const isIsolatedFault = spatialVerdict.includes('CONTRADICTED') || spatialVerdict.includes('ISOLATED');

  return (
    <div className="luxury-card p-6 bg-white border border-slate-200 shadow-sm space-y-4 font-sans">
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-sky-50 border border-sky-200 text-sky-700">
            <Compass className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 font-display">
            Spatial Consistency & Regional Neighbor Consensus
          </h4>
        </div>
        <span className={`text-[10px] font-mono font-bold px-3 py-1 rounded-full border ${
          isGenuineEvent 
            ? 'bg-amber-50 text-amber-700 border-amber-200' 
            : isIsolatedFault 
            ? 'bg-red-50 text-red-700 border-red-200' 
            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
        }`}>
          {spatialVerdict}
        </span>
      </div>

      <p className="text-xs text-slate-600 leading-relaxed font-sans">
        Cross-validates target station telemetry against neighboring coastal AWS nodes within a 50 km geographic radius. Distinguishes isolated sensor hardware malfunctions from genuine severe meteorological events.
      </p>

      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center space-x-3 text-xs font-mono">
        {isGenuineEvent ? (
          <>
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 animate-pulse" />
            <span className="text-amber-800">
              VERDICT: Nearby stations corroborate reading deviation. Confirmed Regional Severe Weather Event.
            </span>
          </>
        ) : (
          <>
            <CheckCircle2 className="w-5 h-5 text-sky-600 shrink-0" />
            <span className="text-slate-800">
              VERDICT: Reading contradicted by regional neighbor consensus. Flagged as Isolated Hardware Fault.
            </span>
          </>
        )}
      </div>
    </div>
  );
};
