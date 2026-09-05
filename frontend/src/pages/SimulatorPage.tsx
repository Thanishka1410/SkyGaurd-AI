import React from 'react';
import { SimulatorStudio } from '../components/SimulatorStudio';
import { Station, Reading, AnomalyRecord } from '../types';

interface SimulatorPageProps {
  stations?: Station[];
  isSimulating?: boolean;
  simSpeed?: number;
  onStartSimulation?: () => void;
  onStopSimulation?: () => void;
  onResetSimulation?: () => void;
  onSpeedChange?: (speed: number) => void;
  onInjectFault?: (stationId: string, faultType: string, param: string, mag: number) => void;
  onClearFaults?: () => void;
  liveReadings?: Reading[];
  anomalies?: AnomalyRecord[];
}

export const SimulatorPage: React.FC<SimulatorPageProps> = () => {
  return <SimulatorStudio />;
};

export { SimulatorStudio };
