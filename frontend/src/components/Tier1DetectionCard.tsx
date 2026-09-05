import React, { useEffect, useState } from 'react';
import { ShieldCheck, Thermometer, Gauge, Droplets } from 'lucide-react';
import { motion, AnimatePresence, useSpring } from 'framer-motion';
import { useTelemetryStore, evaluateTier1Anomaly } from '../store/useSkyGuardStore';
import { Station, Reading, AnomalyRecord } from '../types';

interface Tier1DetectionCardProps {
  selectedStation?: Station;
  currentReading?: Reading;
  activeAnomaly?: AnomalyRecord;
}

export const AnimatedNumber: React.FC<{ value: number; decimals?: number }> = ({ value, decimals = 2 }) => {
  const spring = useSpring(value, { stiffness: 90, damping: 18 });
  const [display, setDisplay] = useState(value.toFixed(decimals));

  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  useEffect(() => {
    return spring.on('change', (latest) => {
      setDisplay(latest.toFixed(decimals));
    });
  }, [spring, decimals]);

  return <span>{display}</span>;
};

export const Tier1DetectionCard: React.FC<Tier1DetectionCardProps> = ({
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

  const evalResult = evaluateTier1Anomaly(
    temp,
    press,
    hum,
    faultType,
    activeAnomaly || currentReading?.anomaly_evaluation
  );

  const detectionTimestamp = activeAnomaly?.timestamp
    ? new Date(activeAnomaly.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' IST'
    : currentReading?.timestamp
    ? new Date(currentReading.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' IST'
    : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' IST';

  const anomalyScoreOffset = Math.round(125 * (1 - evalResult.anomalyScore));
  const isCritical = evalResult.anomalyScore > 0.60 || evalResult.statusBadge === 'CRITICAL ANOMALY';
  const isWarn = evalResult.anomalyScore >= 0.35 && !isCritical;

  const strokeColor = isCritical ? '#dc2626' : isWarn ? '#d97706' : '#059669';

  return (
    <motion.div
      whileHover={{ y: -2, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.02)' }}
      transition={{ duration: 0.2 }}
      className="luxury-card p-6 bg-white border border-slate-200 shadow-sm space-y-4 font-sans hover:border-sky-300 transition-colors"
    >
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center space-x-2 text-sky-700">
          <ShieldCheck className="w-4 h-4" />
          <h3 className="font-extrabold text-xs uppercase tracking-widest font-mono">
            TIER 1 · SENSOR ANOMALY DETECTION
          </h3>
        </div>

        <AnimatePresence mode="wait">
          <motion.span
            key={evalResult.statusBadge}
            initial={{ scale: 1.15, filter: 'brightness(1.3)' }}
            animate={{ scale: 1, filter: 'brightness(1)' }}
            exit={{ scale: 0.9 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border shadow-sm ${evalResult.badgeBg} ${evalResult.badgeColor}`}
          >
            {evalResult.statusBadge}
          </motion.span>
        </AnimatePresence>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
        {/* Sensor Parameters */}
        <div className="space-y-2.5 text-xs">
          {/* Temp Chip */}
          <motion.div
            key={evalResult.isTempFlagged ? 'temp-flagged' : 'temp-normal'}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25 }}
            className={`flex items-center justify-between p-2.5 rounded-lg border transition-all ${
              evalResult.isTempFlagged
                ? 'bg-red-50/90 border-red-300 text-red-900 font-bold shadow-sm'
                : 'bg-slate-50 border-slate-200 text-slate-800'
            }`}
          >
            <span className="flex items-center space-x-2">
              <Thermometer className={`w-3.5 h-3.5 ${evalResult.isTempFlagged ? 'text-red-600 animate-pulse' : 'text-red-600'}`} />
              <span>Temp ({temp.toFixed(1)}°C)</span>
            </span>
            <AnimatePresence mode="wait">
              <motion.span
                key={evalResult.isTempFlagged ? 'flagged' : 'normal'}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                  evalResult.isTempFlagged ? 'text-red-700 bg-red-100 border-red-300' : 'text-emerald-700 bg-emerald-100 border-emerald-200'
                }`}
              >
                {evalResult.isTempFlagged ? 'FLAGGED' : 'Normal'}
              </motion.span>
            </AnimatePresence>
          </motion.div>

          {/* Pressure Chip */}
          <motion.div
            key={evalResult.isPressFlagged ? 'press-flagged' : 'press-normal'}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25 }}
            className={`flex items-center justify-between p-2.5 rounded-lg border transition-all ${
              evalResult.isPressFlagged
                ? 'bg-red-50/90 border-red-300 text-red-900 font-bold shadow-sm'
                : 'bg-slate-50 border-slate-200 text-slate-800'
            }`}
          >
            <span className="flex items-center space-x-2">
              <Gauge className={`w-3.5 h-3.5 ${evalResult.isPressFlagged ? 'text-red-600 animate-pulse' : 'text-sky-600'}`} />
              <span>Pressure ({press.toFixed(1)} hPa)</span>
            </span>
            <AnimatePresence mode="wait">
              <motion.span
                key={evalResult.isPressFlagged ? 'flagged' : 'normal'}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                  evalResult.isPressFlagged ? 'text-red-700 bg-red-100 border-red-300' : 'text-emerald-700 bg-emerald-100 border-emerald-200'
                }`}
              >
                {evalResult.isPressFlagged ? 'FLAGGED' : 'Normal'}
              </motion.span>
            </AnimatePresence>
          </motion.div>

          {/* Humidity Chip */}
          <motion.div
            key={evalResult.isHumFlagged ? 'hum-flagged' : 'hum-normal'}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25 }}
            className={`flex items-center justify-between p-2.5 rounded-lg border transition-all ${
              evalResult.isHumFlagged
                ? 'bg-red-50/90 border-red-300 text-red-900 font-bold shadow-sm'
                : 'bg-slate-50 border-slate-200 text-slate-800'
            }`}
          >
            <span className="flex items-center space-x-2">
              <Droplets className={`w-3.5 h-3.5 ${evalResult.isHumFlagged ? 'text-red-600 animate-pulse' : 'text-sky-600'}`} />
              <span>Humidity ({hum.toFixed(1)}%)</span>
            </span>
            <AnimatePresence mode="wait">
              <motion.span
                key={evalResult.isHumFlagged ? 'flagged' : 'normal'}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                  evalResult.isHumFlagged ? 'text-red-700 bg-red-100 border-red-300' : 'text-emerald-700 bg-emerald-100 border-emerald-200'
                }`}
              >
                {evalResult.isHumFlagged ? 'FLAGGED' : 'Normal'}
              </motion.span>
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Anomaly Score Gauge with Animated Ring & Dynamic Glow */}
        <div className="flex flex-col items-center justify-center p-2 text-center">
          <span className="text-[10px] font-mono font-extrabold text-sky-700 uppercase tracking-widest mb-1">
            ANOMALY SCORE
          </span>

          <div className={`relative w-36 h-20 flex items-end justify-center transition-all duration-500 ${
            isCritical
              ? 'drop-shadow-[0_0_12px_rgba(239,68,68,0.55)]'
              : isWarn
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
                animate={{ strokeDashoffset: anomalyScoreOffset }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                strokeLinecap="round"
              />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
              <motion.span
                animate={isCritical ? { scale: [1, 1.04, 1] } : { scale: 1 }}
                transition={{ repeat: isCritical ? Infinity : 0, duration: 2, ease: "easeInOut" }}
                className="text-3xl font-extrabold text-slate-900 font-mono tracking-tight leading-none"
              >
                <AnimatedNumber value={evalResult.anomalyScore} decimals={2} />
              </motion.span>
              <span className={`text-[9px] font-mono font-black uppercase tracking-wider mt-1 ${
                isCritical ? 'text-red-700 animate-pulse' : isWarn ? 'text-amber-700' : 'text-emerald-700'
              }`}>
                {evalResult.statusBadge}
              </span>
            </div>
          </div>
        </div>

        {/* Diagnostics & Detection Reason */}
        <div className="space-y-2 text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200">
          <div>
            <span className="text-[10px] text-sky-700 block font-mono font-bold uppercase">DETECTION TIME</span>
            <span className="font-bold text-slate-900 font-mono text-xs">{detectionTimestamp}</span>
          </div>
          <div>
            <span className="text-[10px] text-sky-700 block font-mono font-bold uppercase">CONFIDENCE</span>
            <span className="font-bold text-emerald-700 font-mono">{evalResult.confidencePct}%</span>
          </div>
          <div>
            <span className="text-[10px] text-sky-700 block font-mono font-bold uppercase">REASON</span>
            <span className="text-[11px] text-slate-600 leading-tight block mt-0.5">
              {evalResult.reasonText}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
