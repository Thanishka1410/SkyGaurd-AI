import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { DashboardPage } from './pages/DashboardPage';
import { AnomaliesPage } from './pages/AnomaliesPage';
import { SimulatorPage } from './pages/SimulatorPage';
import { DisasterRiskPage } from './pages/DisasterRiskPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { Station, Reading, AnomalyRecord, DisasterRiskSummary } from './types';
import { FileText, Settings as SettingsIcon, CheckCircle2 } from 'lucide-react';

// Default initial stations for Goa network
const INITIAL_STATIONS: Station[] = [
  {
    station_id: 'AWS_GOA_01',
    name: 'Panaji Coastal Station',
    coordinates: { lat: 15.4989, lon: 73.8278 },
    elevation_m: 7.0,
    status: 'ONLINE',
    last_reading: { temperature: 28.5, pressure: 1012.0, humidity: 80.0 },
    health: {
      station_id: 'AWS_GOA_01',
      overall_health_score: 94.5,
      maintenance_recommended: false,
      urgency: 'NONE',
      sensor_scores: { temperature: 95.0, pressure: 98.0, humidity: 90.0 },
      degradation_reasons: []
    }
  },
  {
    station_id: 'AWS_GOA_02',
    name: 'Margao Inland Station',
    coordinates: { lat: 15.2736, lon: 73.9581 },
    elevation_m: 12.0,
    status: 'ONLINE',
    last_reading: { temperature: 29.2, pressure: 1011.2, humidity: 74.0 },
    health: {
      station_id: 'AWS_GOA_02',
      overall_health_score: 88.0,
      maintenance_recommended: false,
      urgency: 'NONE',
      sensor_scores: { temperature: 85.0, pressure: 92.0, humidity: 87.0 },
      degradation_reasons: []
    }
  },
  {
    station_id: 'AWS_GOA_03',
    name: 'Vasco Harbor Station',
    coordinates: { lat: 15.3959, lon: 73.8157 },
    elevation_m: 5.0,
    status: 'ONLINE',
    last_reading: { temperature: 28.0, pressure: 1012.5, humidity: 82.0 },
    health: {
      station_id: 'AWS_GOA_03',
      overall_health_score: 96.0,
      maintenance_recommended: false,
      urgency: 'NONE',
      sensor_scores: { temperature: 96.0, pressure: 97.0, humidity: 95.0 },
      degradation_reasons: []
    }
  },
  {
    station_id: 'AWS_GOA_04',
    name: 'Mapusa North Station',
    coordinates: { lat: 15.5926, lon: 73.8117 },
    elevation_m: 18.0,
    status: 'ONLINE',
    last_reading: { temperature: 28.7, pressure: 1010.8, humidity: 74.0 },
    health: {
      station_id: 'AWS_GOA_04',
      overall_health_score: 92.0,
      maintenance_recommended: false,
      urgency: 'NONE',
      sensor_scores: { temperature: 92.0, pressure: 94.0, humidity: 90.0 },
      degradation_reasons: []
    }
  }
];

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [stations, setStations] = useState<Station[]>(INITIAL_STATIONS);
  const [liveReadings, setLiveReadings] = useState<Reading[]>([]);
  const [anomalies, setAnomalies] = useState<AnomalyRecord[]>([]);
  const [disasterRisks, setDisasterRisks] = useState<DisasterRiskSummary | undefined>();
  const [wsConnected, setWsConnected] = useState<boolean>(false);
  const [is3DMode, setIs3DMode] = useState<boolean>(true);

  // Load initial backend REST data
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const resSt = await fetch('/api/stations');
      if (resSt.ok) {
        const data = await resSt.json();
        if (data.stations && data.stations.length > 0) {
          setStations(data.stations);
        }
      }

      const resAnom = await fetch('/api/anomalies');
      if (resAnom.ok) {
        const data = await resAnom.json();
        if (data.anomalies) {
          setAnomalies(data.anomalies);
        }
      }

      const resRisk = await fetch('/api/risks');
      if (resRisk.ok) {
        const data = await resRisk.json();
        if (data.risk_intelligence) {
          setDisasterRisks(data.risk_intelligence);
        }
      }
    } catch (e) {
      console.warn('API sync warning:', e);
    }
  };

  // WebSocket Live Streaming
  useEffect(() => {
    let ws: WebSocket | null = null;
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/readings`;
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setWsConnected(true);
        console.log('[WebSocket] Live stream connected');
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.event === 'SENSOR_STREAM_UPDATE' && payload.readings) {
            setLiveReadings(payload.readings);
            // Update station last_readings in state
            setStations(prev => prev.map(st => {
              const matchingReading = payload.readings.find((r: Reading) => r.station_id === st.station_id);
              if (matchingReading) {
                return {
                  ...st,
                  last_reading: {
                    temperature: matchingReading.temperature,
                    pressure: matchingReading.pressure,
                    humidity: matchingReading.humidity,
                    timestamp: matchingReading.timestamp
                  }
                };
              }
              return st;
            }));
          }
        } catch (err) {
          console.error('[WebSocket] Message parse error:', err);
        }
      };

      ws.onclose = () => {
        setWsConnected(false);
      };

      ws.onerror = () => {
        setWsConnected(false);
      };
    } catch (e) {
      setWsConnected(false);
    }

    return () => {
      if (ws) ws.close();
    };
  }, []);

  const handleInjectFault = async (stationId: string, faultType: string, param: string, mag: number) => {
    try {
      await fetch('/api/simulator/inject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          station_id: stationId,
          fault_type: faultType,
          parameter: param,
          magnitude: mag,
          duration_steps: 5
        })
      });
      fetchData();
    } catch (e) {
      console.error('Failed to inject fault:', e);
    }
  };

  const handleClearFaults = async () => {
    try {
      await fetch('/api/simulator/clear', { method: 'POST' });
      fetchData();
    } catch (e) {
      console.error('Failed to clear faults:', e);
    }
  };

  const activeAlertCount = anomalies.filter(a => a.is_anomaly).length;

  return (
    <div className="min-h-screen bg-[#f1f5f9] text-slate-900 flex font-sans selection:bg-blue-100 selection:text-blue-900">
      
      {/* Left Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeAlertCount={activeAlertCount}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Top Header */}
        <Navbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          wsConnected={wsConnected}
          activeAlertCount={activeAlertCount}
          is3DMode={is3DMode}
          setIs3DMode={setIs3DMode}
        />

        {/* Page Content View */}
        <main className="flex-1 overflow-y-auto p-6">
          {activeTab === 'dashboard' && (
            <DashboardPage
              stations={stations}
              liveReadings={liveReadings}
              anomalies={anomalies}
              disasterRisks={disasterRisks}
              onNavigateTab={setActiveTab}
              is3DMode={is3DMode}
            />
          )}

          {activeTab === 'anomalies' && (
            <AnomaliesPage anomalies={anomalies} />
          )}

          {activeTab === 'simulator' && (
            <SimulatorPage
              stations={stations}
              onInjectFault={handleInjectFault}
              onClearFaults={handleClearFaults}
            />
          )}

          {activeTab === 'disaster-risk' && (
            <DisasterRiskPage risks={disasterRisks} />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsPage />
          )}

          {activeTab === 'reports' && (
            <div className="space-y-6 max-w-4xl font-sans">
              <div className="luxury-card p-8 bg-white border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center space-x-3 text-blue-600">
                  <FileText className="w-6 h-6" />
                  <h1 className="text-xl font-extrabold font-display uppercase tracking-wider text-slate-900">
                    Automated Meteorological Intelligence Reports
                  </h1>
                </div>
                <p className="text-sm text-slate-600">
                  Generates downloadable spatial consensus audit summaries and Tier 1 / Tier 2 anomaly records.
                </p>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs font-mono">
                  <div className="flex justify-between items-center text-slate-700">
                    <span>REPORT_ID: REP_GOA_2026_09_04.PDF</span>
                    <span className="text-emerald-600 font-bold">READY FOR EXPORT</span>
                  </div>
                  <div className="text-slate-500">Includes 4 Coastal AWS nodes, SHAP feature weights, and risk projections.</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6 max-w-4xl font-sans">
              <div className="luxury-card p-8 bg-white border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center space-x-3 text-blue-600">
                  <SettingsIcon className="w-6 h-6" />
                  <h1 className="text-xl font-extrabold font-display uppercase tracking-wider text-slate-900">
                    System Configuration & Threshold Settings
                  </h1>
                </div>
                <p className="text-sm text-slate-600">
                  Configure real-time WebSocket polling intervals, IsolationForest contamination thresholds, and WebGL rendering preferences.
                </p>
                <div className="space-y-3 font-sans text-xs">
                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="font-semibold text-slate-800">IsolationForest Contamination Alpha:</span>
                    <span className="font-mono font-bold text-blue-600">0.05</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="font-semibold text-slate-800">WebSocket Sensor Stream Port:</span>
                    <span className="font-mono font-bold text-blue-600">8000 (/ws/readings)</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="font-semibold text-slate-800">Spatial Consistency Radius:</span>
                    <span className="font-mono font-bold text-blue-600">50.0 km</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Footer Bar */}
        <footer className="bg-white border-t border-slate-200 px-6 py-3 text-xs text-slate-500 font-sans flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="font-medium text-slate-700">SkyGuard AI — AWS Intelligence System</span>
          </div>
          <span className="text-slate-400 font-mono text-[11px]">
            Goa Network Sector · SIH 26073 · OpenML 43409 Trained
          </span>
        </footer>

      </div>

    </div>
  );
};
