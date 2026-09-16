import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin } from 'lucide-react';

// Fix Leaflet marker icon asset paths for Vite bundler
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom colored markers based on severity
const createColoredIcon = (colorHex) => {
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div style="
        background-color: ${colorHex};
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 5px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="width: 6px; height: 6px; background-color: white; border-radius: 50%;"></div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12]
  });
};

export default function MapContainer({ 
  complaints = [], 
  selectedComplaint = null, 
  onSelectComplaint = null,
  center = [28.6139, 77.2090], 
  zoom = 13,
  height = '400px',
  interactive = true,
  onLocationSelect = null
}) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersGroupRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // Initialize map if not yet created
    if (!mapInstanceRef.current) {
      const map = L.map(mapRef.current, {
        center: center,
        zoom: zoom,
        scrollWheelZoom: interactive,
        zoomControl: interactive,
        dragging: interactive
      });

      // Standard OpenStreetMap tiles (free, reliable, fast)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
      }).addTo(map);

      // Group for markers
      markersGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;

      // Click event for interactive location picking
      if (onLocationSelect) {
        map.on('click', (e) => {
          onLocationSelect({
            lat: e.latlng.lat,
            lng: e.latlng.lng
          });
        });
      }
    }

    // Cleanup on unmount
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update markers when complaints change
  useEffect(() => {
    if (!mapInstanceRef.current || !markersGroupRef.current) return;

    markersGroupRef.current.clearLayers();

    const severityColors = {
      'CRITICAL': '#ef4444',
      'Critical': '#ef4444',
      'HIGH': '#f97316',
      'High': '#f97316',
      'MEDIUM': '#eab308',
      'Medium': '#eab308',
      'LOW': '#10b981',
      'Low': '#10b981'
    };

    const getCoords = (loc) => {
      if (!loc || !loc.coordinates) return null;
      if (Array.isArray(loc.coordinates) && loc.coordinates.length >= 2) {
        // GeoJSON [longitude, latitude] -> Leaflet [latitude, longitude]
        return [loc.coordinates[1], loc.coordinates[0]];
      }
      if (loc.coordinates.lat != null && loc.coordinates.lng != null) {
        return [loc.coordinates.lat, loc.coordinates.lng];
      }
      return null;
    };

    const validComplaints = complaints
      .map(c => ({ item: c, coords: getCoords(c.location) }))
      .filter(entry => entry.coords !== null);

    validComplaints.forEach(({ item: c, coords }) => {
      const sevKey = c.severity || c.aiAnalysis?.severity;
      const color = severityColors[sevKey] || '#3b82f6';
      const icon = createColoredIcon(color);

      const marker = L.marker(coords, { icon });

      const popupContent = `
        <div style="font-family: inherit; font-size: 12px; max-width: 220px; padding: 2px;">
          <div style="font-weight: 700; color: #0f172a; margin-bottom: 4px; font-size: 13px;">${c.title}</div>
          <div style="color: #64748b; margin-bottom: 6px;">${c.address || c.location?.address || 'Civic Location'}</div>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-weight: 600; font-size: 10px; padding: 2px 6px; border-radius: 4px; background: #f1f5f9; color: #334155;">${c.category}</span>
            <span style="font-weight: 600; font-size: 10px; color: ${color};">${c.severity || c.status}</span>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);

      if (onSelectComplaint) {
        marker.on('click', () => onSelectComplaint(c));
      }

      markersGroupRef.current.addLayer(marker);
    });

    // If single complaint selected or coordinates provided, pan to it
    const selectedCoords = selectedComplaint ? getCoords(selectedComplaint.location) : null;
    if (selectedCoords) {
      mapInstanceRef.current.setView(selectedCoords, 15);
    } else if (validComplaints.length > 0) {
      // Fit bounds
      const bounds = L.latLngBounds(validComplaints.map(e => e.coords));
      mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, [complaints, selectedComplaint]);

  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shadow-xs" style={{ height }}>
      <div ref={mapRef} className="w-full h-full" />
      
      {/* Map overlay legend */}
      <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-xs px-3 py-2 rounded-lg border border-slate-200 text-[11px] shadow-sm z-[1000] flex items-center gap-3">
        <span className="font-semibold text-slate-700">GIS Severity:</span>
        <span className="flex items-center gap-1 text-slate-600"><span className="w-2 h-2 rounded-full bg-red-500" /> Critical</span>
        <span className="flex items-center gap-1 text-slate-600"><span className="w-2 h-2 rounded-full bg-orange-500" /> High</span>
        <span className="flex items-center gap-1 text-slate-600"><span className="w-2 h-2 rounded-full bg-amber-500" /> Med</span>
        <span className="flex items-center gap-1 text-slate-600"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Low</span>
      </div>
    </div>
  );
}
