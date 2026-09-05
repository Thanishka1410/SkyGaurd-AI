import React from 'react';
import { ShieldAlert, Thermometer, Droplets, CloudRain, Wind, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTelemetryStore, evaluateTier1Anomaly, evaluateTier2Risk } from '../store/useSkyGuardStore';
import { Station, Reading, AnomalyRecord } from '../types';
import { AnimatedNumber } from './Tier1DetectionCard';

interface Tier2RiskCardProps {
  selectedStation?: Station;
  currentReading?: Reading;
  activeAnomaly?: AnomalyRecord;
}

export const Tier2RiskCard: React.FC<Tier2RiskCardProps> = ({
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
  const rain = currentReading?.rainfall ?? 0.0;
  const wind = currentReading?.wind_speed ?? 12.0;
  const faultType = currentReading?.injected_fault_type || (activeAnomaly?.root_cause !== 'normal' ? activeAnomaly?.root_cause : undefined);

  const tier1Eval = evaluateTier1Anomaly(temp, press, hum, faultType, activeAnomaly || currentReading?.anomaly_evaluation);
  const tier2Eval = evaluateTier2Risk(temp, press, hum, rain, wind, tier1Eval);

  const isSevereOrHigh = tier2Eval.compositeRiskLevel === 'SEVERE' || tier2Eval.compositeRiskLevel === 'HIGH';
  const isModerate = tier2Eval.compositeRiskLevel === 'MODERATE';

  const riskBadgeColor =
    tier2Eval.compositeRiskLevel === 'SEVERE'
      ? 'text-red-700 font-extrabold bg-red-100 border-red-300'
      : tier2Eval.compositeRiskLevel === 'HIGH'
      ? 'text-amber-700 font-extrabold bg-amber-100 border-amber-300'
      : tier2Eval.compositeRiskLevel === 'MODERATE'
      ? 'text-yellow-700 font-bold bg-yellow-100 border-yellow-200'
      : 'text-emerald-700 font-bold bg-emerald-100 border-emerald-200';

  const strokeColor = isSevereOrHigh ? '#dc2626' : isModerate ? '#d97706' : '#059669';

  const gaugeOffset =
    tier2Eval.compositeRiskLevel === 'SEVERE'
      ? 0
      : tier2Eval.compositeRiskLevel === 'HIGH'
      ? 30
      : tier2Eval.compositeRiskLevel === 'MODERATE'
      ? 70
      : 125;

  return (
    <motion.div
      whileHover={{ y: -2, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.02)' }}
      transition={{ duration: 0.2 }}
      className="luxury-card p-6 bg-white border border-slate-200 shadow-sm space-y-4 font-sans hover:border-emerald-300 transition-colors"
    >
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center space-x-2 text-emerald-700">
          <ShieldAlert className="w-4 h-4" />
          <h3 className="font-extrabold text-xs uppercase tracking-widest font-mono">
            TIER 2 · ENVIRONMENTAL RISK INTELLIGENCE
          </h3>
        </div>

        <AnimatePresence mode="wait">
          <motion.span
            key={tier2Eval.compositeRiskLevel}
            initial={{ scale: 1.15, filter: 'brightness(1.3)' }}
            animate={{ scale: 1, filter: 'brightness(1)' }}
            exit={{ scale: 0.9 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border shadow-sm ${riskBadgeColor}`}
          >
            {tier2Eval.compositeRiskLevel} RISK
          </motion.span>
        </AnimatePresence>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
        {/* Weather Context */}
        <div className="space-y-2 font-sans text-xs">
          <span className="text-[10px] font-mono font-extrabold text-emerald-700 uppercase tracking-widest block mb-1">
            WEATHER CONTEXT
          </span>
          <div className="space-y-1.5 text-slate-700 text-xs font-mono">
            <div className="flex items-center space-x-2">
              <Thermometer className="w-3.5 h-3.5 text-sky-600" />
              <span>{temp.toFixed(1)}°C Temp</span>
            </div>
            <div className="flex items-center space-x-2">
              <Droplets className="w-3.5 h-3.5 text-sky-600" />
              <span>{hum.toFixed(1)}% Humidity</span>
            </div>
            <div className="flex items-center space-x-2">
              <CloudRain className="w-3.5 h-3.5 text-sky-600" />
              <span>{rain > 0 ? `${rain.toFixed(1)} mm Rain` : 'No Rain'}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Wind className="w-3.5 h-3.5 text-sky-600" />
              <span>{wind.toFixed(1)} km/h Wind</span>
            </div>
          </div>
        </div>

        {/* Risk Assessment Gauge */}
        <div className="flex flex-col items-center justify-center p-2 text-center">
          <span className="text-[10px] font-mono font-extrabold text-emerald-700 uppercase tracking-widest mb-1">
            RISK ASSESSMENT
          </span>

          <div className={`relative w-36 h-20 flex items-end justify-center transition-all duration-500 ${
            isSevereOrHigh
              ? 'drop-shadow-[0_0_12px_rgba(239,68,68,0.55)]'
              : isModerate
              ? 'drop-shadow-[0_0_8px_rgba(217,119,6,0.4)]'
              : ''
          }`}>
            <svg className="w-36 h-36 transform -rotate-90 overflow-visible" viewBox="0 0 100 100">
              <circle
                cx="50" cy="50" r="40"
                stroke="#e2e8f0" strokeWidth="8"
                fill="none"
                strokeDasharray="125 250"
              />
              <motion.circle
                cx="50" cy="50" r="40"
                stroke={strokeColor}
                strokeWidth="8"
                fill="none"
                strokeDasharray="125 250"
                initial={{ strokeDashoffset: 125 }}
                animate={{ strokeDashoffset: gaugeOffset }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
              <motion.span
                animate={isSevereOrHigh ? { scale: [1, 1.04, 1] } : { scale: 1 }}
                transition={{ repeat: isSevereOrHigh ? Infinity : 0, duration: 2, ease: "easeInOut" }}
                className={`text-3xl font-extrabold font-mono tracking-tight leading-none ${
                  isSevereOrHigh ? 'text-red-700' : isModerate ? 'text-amber-700' : 'text-emerald-700'
                }`}
              >
                {tier2Eval.compositeRiskLevel}
              </motion.span>
              <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider mt-1">
                RISK LEVEL
              </span>
            </div>
          </div>
          <p className="text-[10px] text-slate-500 mt-1 font-mono">
            Score: <AnimatedNumber value={tier2Eval.compositeRiskScore} decimals={0} />/100
          </p>
        </div>

        {/* Progress Meters & Threat Alert */}
        <div className="space-y-2 text-xs font-sans text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200">
          <span className="text-[10px] font-mono font-extrabold text-emerald-700 uppercase tracking-widest block mb-1">
            HAZARD PROGRESS METERS
          </span>

          {/* Flood Risk Meter */}
          <div>
            <div className="flex justify-between items-center text-xs mb-1">
              <span className="flex items-center space-x-1.5">
                <AlertTriangle className="w-3 h-3 text-sky-600" />
                <span>Flood Risk</span>
              </span>
              <span className={`font-mono font-bold text-[11px] ${tier2Eval.floodRiskLevel === 'HIGH' || tier2Eval.floodRiskLevel === 'SEVERE' ? 'text-red-700' : 'text-emerald-700'}`}>
                {tier2Eval.floodRiskScore}% ({tier2Eval.floodRiskLevel})
              </span>
            </div>
            <div className="w-full h-2 bg-slate-200/80 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${tier2Eval.floodMeterPct}%` }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className={`h-full rounded-full ${
                  tier2Eval.floodRiskLevel === 'SEVERE' || tier2Eval.floodRiskLevel === 'HIGH' ? 'bg-red-600' : 'bg-sky-600'
                }`}
              />
            </div>
          </div>

          {/* Heatwave Risk Meter */}
          <div className="pt-1">
            <div className="flex justify-between items-center text-xs mb-1">
              <span className="flex items-center space-x-1.5">
                <Thermometer className="w-3 h-3 text-red-600" />
                <span>Heatwave Risk</span>
              </span>
              <span className={`font-mono font-bold text-[11px] ${tier2Eval.heatwaveRiskLevel === 'HIGH' || tier2Eval.heatwaveRiskLevel === 'SEVERE' ? 'text-red-700' : 'text-emerald-700'}`}>
                {tier2Eval.heatwaveRiskScore}% ({tier2Eval.heatwaveRiskLevel})
              </span>
            </div>
            <div className="w-full h-2 bg-slate-200/80 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${tier2Eval.heatwaveMeterPct}%` }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className={`h-full rounded-full ${
                  tier2Eval.heatwaveRiskLevel === 'SEVERE' || tier2Eval.heatwaveRiskLevel === 'HIGH' ? 'bg-red-600' : 'bg-amber-500'
                }`}
              />
            </div>
          </div>

          {/* Real-time Threat Alert text with AnimatePresence slide transition */}
          <div className="pt-2 border-t border-slate-200">
            <span className="text-[10px] font-mono font-extrabold text-slate-500 uppercase tracking-widest block mb-0.5">
              REAL-TIME THREAT ALERT
            </span>
            <AnimatePresence mode="wait">
              <motion.p
                key={tier2Eval.threatAlert}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className={`text-[11px] font-mono font-medium leading-tight ${
                  tier2Eval.alertType === 'CRITICAL' ? 'text-red-700 font-bold' : tier2Eval.alertType === 'WARNING' ? 'text-amber-700' : 'text-slate-600'
                }`}
              >
                {tier2Eval.threatAlert}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
