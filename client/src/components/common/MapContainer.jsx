import React from 'react';
import CivicMap from '../maps/CivicMap';

/**
 * Common MapContainer Component (wrapper around CivicMap for backward compatibility)
 */
export default function MapContainer({ 
  complaints = [], 
  selectedComplaint = null, 
  onSelectComplaint = null,
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
