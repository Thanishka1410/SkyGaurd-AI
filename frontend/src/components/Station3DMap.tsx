import React from 'react';
import { StationMap } from './StationMap';
import { Station } from '../types';

interface Station3DMapProps {
  stations: Station[];
  selectedStationId: string;
  onSelectStation: (id: string) => void;
  onToggle3D?: () => void;
}

export const Station3DMap: React.FC<Station3DMapProps> = (props) => {
  return <StationMap {...props} />;
};
