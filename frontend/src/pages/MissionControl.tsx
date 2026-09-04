import React from 'react';
import { DashboardPage } from './DashboardPage';
import { Station, Reading, AnomalyRecord, DisasterRiskSummary } from '../types';

interface MissionControlProps {
  stations?: Station[];
  liveReadings?: Reading[];
  anomalies?: AnomalyRecord[];
  disasterRisks?: DisasterRiskSummary;
  onNavigateTab?: (tab: string) => void;
  is3DMode?: boolean;
}

export const MissionControl: React.FC<MissionControlProps> = (props) => {
  const dummyNav = () => {};
  return (
    <DashboardPage
      stations={props.stations || []}
      liveReadings={props.liveReadings || []}
      anomalies={props.anomalies || []}
      disasterRisks={props.disasterRisks}
      onNavigateTab={props.onNavigateTab || dummyNav}
      is3DMode={props.is3DMode ?? true}
    />
  );
};

export default MissionControl;
