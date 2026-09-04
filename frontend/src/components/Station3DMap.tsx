import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { StationMap } from './StationMap';
import { Box, MapPin, Sparkles } from 'lucide-react';
import { Station } from '../types';

interface Station3DMapProps {
  stations: Station[];
  selectedStationId: string;
  onSelectStation: (id: string) => void;
  onToggle3D?: () => void;
}

const STATION_POSITIONS: Record<string, [number, number, number]> = {
  AWS_GOA_01: [-3.0, 0.5, -1.0],  // Panaji
  AWS_GOA_02: [3.2, 0.6, 1.2],    // Margao
  AWS_GOA_03: [-0.5, 0.4, -2.5],  // Vasco
  AWS_GOA_04: [-2.0, 0.8, 2.8],   // Mapusa
};

export const Station3DMap: React.FC<Station3DMapProps> = ({ stations, selectedStationId, onSelectStation, onToggle3D }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [webglSupported, setWebglSupported] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);

  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) setWebglSupported(false);
    } catch (e) {
      setWebglSupported(false);
    }
  }, []);

  useEffect(() => {
    if (!webglSupported || !mountRef.current) return;

    let animationFrameId: number;
    let scene: THREE.Scene;
    let camera: THREE.PerspectiveCamera;
    let renderer: THREE.WebGLRenderer;

    const width = mountRef.current.clientWidth || 700;
    const height = 340;

    try {
      scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(0xeef3f9, 0.04);
      scene.background = new THREE.Color(0xeef3f9);

      camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
      camera.position.set(0, 10, 12);
      camera.lookAt(0, 0, 0);

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      while (mountRef.current.firstChild) {
        mountRef.current.removeChild(mountRef.current.firstChild);
      }
      mountRef.current.appendChild(renderer.domElement);

      const ambientLight = new THREE.AmbientLight(0x0284c7, 0.7);
      scene.add(ambientLight);

      const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
      dirLight.position.set(5, 12, 8);
      scene.add(dirLight);

      const gridHelper = new THREE.GridHelper(20, 20, 0x0284c7, 0xcbd5e1);
      scene.add(gridHelper);

      // Topographic Ground Plane
      const planeGeo = new THREE.PlaneGeometry(24, 24, 32, 32);
      const posAttr = planeGeo.attributes.position;
      for (let i = 0; i < posAttr.count; i++) {
        const x = posAttr.getX(i);
        const y = posAttr.getY(i);
        const z = Math.sin(x * 0.4) * Math.cos(y * 0.4) * 0.3;
        posAttr.setZ(i, z);
      }
      planeGeo.computeVertexNormals();

      const planeMat = new THREE.MeshStandardMaterial({
        color: 0x93c5fd,
        wireframe: true
      });
      const terrain = new THREE.Mesh(planeGeo, planeMat);
      terrain.rotation.x = -Math.PI / 2;
      scene.add(terrain);

      // Atmospheric Particle Cloud
      const particleCount = 150;
      const particlesGeo = new THREE.BufferGeometry();
      const particlePositions = new Float32Array(particleCount * 3);
      for (let i = 0; i < particleCount * 3; i += 3) {
        particlePositions[i] = (Math.random() - 0.5) * 20;
        particlePositions[i + 1] = Math.random() * 6 + 0.5;
        particlePositions[i + 2] = (Math.random() - 0.5) * 20;
      }
      particlesGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
      const particleMat = new THREE.PointsMaterial({
        color: 0x0284c7,
        size: 0.14,
        transparent: true,
        opacity: 0.6
      });
      const particleSystem = new THREE.Points(particlesGeo, particleMat);
      scene.add(particleSystem);

      // Node Meshes
      const nodeGroupMap: Record<string, THREE.Group> = {};
      const targetPos = new THREE.Vector3(0, 0, 0);

      stations.forEach((st) => {
        const pos = STATION_POSITIONS[st.station_id] || [0, 0.5, 0];
        const health = st.health?.overall_health_score ?? 100;
        const isSelected = st.station_id === selectedStationId;

        const nodeGroup = new THREE.Group();
        nodeGroup.position.set(pos[0], pos[1], pos[2]);

        const nodeColor = health < 60 ? 0xef4444 : health < 85 ? 0xf59e0b : 0x10b981;

        const sphereGeo = new THREE.SphereGeometry(0.38, 16, 16);
        const sphereMat = new THREE.MeshStandardMaterial({
          color: nodeColor,
          emissive: nodeColor,
          emissiveIntensity: isSelected ? 1.2 : 0.4,
        });
        const sphere = new THREE.Mesh(sphereGeo, sphereMat);
        nodeGroup.add(sphere);

        const ringGeo = new THREE.TorusGeometry(0.7, 0.03, 8, 32);
        const ringMat = new THREE.MeshBasicMaterial({
          color: isSelected ? 0x0284c7 : nodeColor,
          wireframe: true
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2;
        nodeGroup.add(ring);

        if (isSelected) {
          const beamGeo = new THREE.CylinderGeometry(0.02, 0.1, 4, 16);
          const beamMat = new THREE.MeshBasicMaterial({
            color: 0x0284c7,
            transparent: true,
            opacity: 0.4
          });
          const beam = new THREE.Mesh(beamGeo, beamMat);
          beam.position.y = 2;
          nodeGroup.add(beam);

          targetPos.set(pos[0], pos[1] + 1, pos[2]);
        }

        scene.add(nodeGroup);
        nodeGroupMap[st.station_id] = nodeGroup;
      });

      // Animation Loop
      let angle = 0;
      const animate = () => {
        animationFrameId = requestAnimationFrame(animate);

        angle += 0.003;
        particleSystem.rotation.y = angle * 0.5;

        Object.values(nodeGroupMap).forEach((grp) => {
          grp.children[1].rotation.z += 0.02;
        });

        if (targetPos.lengthSq() > 0) {
          const desiredCamPos = new THREE.Vector3(
            targetPos.x + Math.sin(angle * 0.5) * 5,
            targetPos.y + 4.5,
            targetPos.z + Math.cos(angle * 0.5) * 5
          );
          camera.position.lerp(desiredCamPos, 0.03);
          camera.lookAt(targetPos);
        }

        renderer.render(scene, camera);
      };

      animate();
    } catch (err) {
      setHasError(true);
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (renderer) renderer.dispose();
    };
  }, [webglSupported, stations, selectedStationId]);

  if (!webglSupported || hasError) {
    return <StationMap stations={stations} selectedStationId={selectedStationId} onSelectStation={onSelectStation} onToggle3D={onToggle3D} />;
  }

  return (
    <div className="luxury-card p-6 relative overflow-hidden bg-white text-slate-900 min-h-[460px] flex flex-col justify-between border border-slate-200 space-y-4">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h3 className="font-extrabold text-sm text-slate-900 font-display uppercase tracking-wider">
            LIVE AWS NETWORK <span className="text-blue-600 font-mono text-xs">(3D WebGL View)</span>
          </h3>
          <p className="text-xs text-slate-500 font-sans mt-0.5">Goa Weather Station Network</p>
        </div>

        {/* Station Selector Buttons */}
        <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200">
          {stations.map(st => (
            <button
              key={st.station_id}
              onClick={() => onSelectStation(st.station_id)}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                st.station_id === selectedStationId
                  ? 'bg-white text-blue-600 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {st.name.split(' ')[0]}
            </button>
          ))}
          {onToggle3D && (
            <button 
              onClick={onToggle3D}
              className="ml-2 px-2.5 py-1 bg-blue-50 text-blue-600 border border-blue-200 rounded-md text-xs font-bold hover:bg-blue-100"
            >
              2D View
            </button>
          )}
        </div>
      </div>

      {/* 3D Canvas */}
      <div className="relative h-[340px] w-full rounded-xl bg-[#eef3f9] border border-slate-200 overflow-hidden flex items-center justify-center">
        <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
        
        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-lg border border-slate-200 text-[11px] font-mono font-semibold text-blue-600 flex items-center space-x-1.5 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
          <span>3D WebGL TERRAIN ENGINE</span>
        </div>

        <div className="absolute bottom-3 left-3 right-3 bg-white/90 backdrop-blur-md p-2.5 rounded-xl border border-slate-200 flex items-center justify-between text-xs font-sans shadow-sm">
          <div className="flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-blue-600" />
            <span className="text-slate-500 font-medium">Selected Node:</span>
            <span className="font-bold text-slate-900">
              {stations.find(s => s.station_id === selectedStationId)?.name}
            </span>
          </div>
          <div className="text-blue-600 font-mono font-bold text-xs">
            {stations.find(s => s.station_id === selectedStationId)?.last_reading
              ? `${stations.find(s => s.station_id === selectedStationId)?.last_reading?.temperature}°C · ${stations.find(s => s.station_id === selectedStationId)?.last_reading?.pressure} hPa · ${stations.find(s => s.station_id === selectedStationId)?.last_reading?.humidity}% RH`
              : 'TELEMETRY SYNCED'}
          </div>
        </div>
      </div>

    </div>
  );
};
