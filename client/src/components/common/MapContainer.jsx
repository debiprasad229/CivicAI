import React from 'react';
import CivicMap from '../maps/CivicMap';

/**
 * Common MapContainer Component (wrapper around CivicMap for backward compatibility and hotspot support)
 */
export default function MapContainer({ 
  complaints = [], 
  selectedComplaint = null, 
  onSelectComplaint = null,
  hotspots = [],
  selectedHotspot = null,
  onSelectHotspot = null,
  showHotspots = true,
  showComplaints = true,
  center = [28.6139, 77.2090], 
  zoom = 13, 
  height = '400px',
  interactive = true,
  onLocationSelect = null,
  selectedLocation = null,
  className = ''
}) {
  return (
    <CivicMap
      complaints={complaints}
      selectedComplaint={selectedComplaint}
      onSelectComplaint={onSelectComplaint}
      hotspots={hotspots}
      selectedHotspot={selectedHotspot}
      onSelectHotspot={onSelectHotspot}
      showHotspots={showHotspots}
      showComplaints={showComplaints}
      selectedLocation={selectedLocation}
      onLocationSelect={onLocationSelect}
      center={center}
      zoom={zoom}
      height={height}
      className={className}
      selectable={Boolean(onLocationSelect)}
      showControls={interactive}
      showLegend={true}
    />
  );
}
