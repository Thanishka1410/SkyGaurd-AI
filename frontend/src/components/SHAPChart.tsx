import React from 'react';
import { ShapBreakdown } from './ShapBreakdown';
import { SHAPFactor } from '../types';

interface SHAPChartProps {
  factors?: SHAPFactor[];
}

export const SHAPChart: React.FC<SHAPChartProps> = () => {
  return <ShapBreakdown />;
};
