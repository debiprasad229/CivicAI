import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import { 
  toLeafletCoords, 
  toGeoJsonCoords, 
  createSelectedLocationIcon, 
  createSeverityMarkerIcon, 
  getSeverityConfig,
  setupTileLayer,
  SEVERITY_CONFIG
} from '../../utils/leafletUtils';
import { 
  Layers, 
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Crosshair
} from 'lucide-react';

/**
 * Reusable Civic GIS Map Component
 * 
 * @param {Object} props
 * @param {Array} props.complaints - Array of existing complaint objects
 * @param {Array|Object} props.selectedLocation - Currently selected coordinates [longitude, latitude] or {lat, lng}
 * @param {Function} props.onLocationSelect - Callback receiving [longitude, latitude]
 * @param {Object} props.selectedComplaint - Highlighted complaint
 * @param {Function} props.onSelectComplaint - Callback when an existing complaint marker is clicked
 * @param {Array} props.center - Initial map center [lat, lng] (default: [28.6139, 77.2090])
 * @param {number} props.zoom - Initial zoom level (default: 13)
 * @param {string} props.height - Container height (default: '400px')
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.selectable - Whether clicking sets selectedLocation (default: false)
 * @param {boolean} props.draggableMarker - Whether the selected marker can be dragged (default: false)
 * @param {boolean} props.showLegend - Whether to display GIS severity legend (default: true)
 * @param {boolean} props.showControls - Whether to show GIS tools toolbar (default: true)
 * @param {boolean} props.fitBoundsOnLoad - Automatically fit bounds to complaints (default: true)
 * @param {string} props.geoapifyStyle - Geoapify map style (default: 'osm-bright')
 */
export default function CivicMap({
  complaints = [],
  selectedLocation = null,
  onLocationSelect = null,
  selectedComplaint = null,
  onSelectComplaint = null,
  center = [28.6139, 77.2090],
  zoom = 13,
  height = '400px',
  className = '',
  selectable = false,
  draggableMarker = false,
  showLegend = true,
  showControls = true,
  fitBoundsOnLoad = true,
  geoapifyStyle = 'osm-bright'
}) {
  const containerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const complaintsLayerRef = useRef(null);
  const selectedMarkerRef = useRef(null);
  const tileLayerRef = useRef(null);

  const [mapProvider, setMapProvider] = useState('loading');
  const [legendCollapsed, setLegendCollapsed] = useState(false);

  // Normalize selected location to Leaflet [lat, lng] and GeoJSON [lng, lat]
  const leafletSelected = toLeafletCoords(selectedLocation);

  /**
   * Handle map click for location picking
   */
  const handleMapClick = useCallback((e) => {
    if (!selectable && !onLocationSelect) return;
    const { lat, lng } = e.latlng;
    // Standard GeoJSON format: [longitude, latitude]
    const geoJsonCoords = [Number(lng), Number(lat)];
    
    if (onLocationSelect) {
      // Pass standard [longitude, latitude]
      onLocationSelect(geoJsonCoords, { lat, lng, coordinates: geoJsonCoords });
    }
  }, [selectable, onLocationSelect]);

  /**
   * Initialize Map
   */
  useEffect(() => {
    if (!containerRef.current) return;

    if (!mapInstanceRef.current) {
      const initialCenter = leafletSelected || center;

      const map = L.map(containerRef.current, {
        center: initialCenter,
        zoom: zoom,
        zoomControl: false, // We add zoom control in bottom-right for clean UX
        scrollWheelZoom: true,
        touchZoom: true,
        attributionControl: false // Add cleanly with custom positioning
      });

      // Custom positioned zoom controls
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Attribution control in bottom-left
      L.control.attribution({ 
        position: 'bottomleft',
        prefix: false 
      }).addTo(map);

      // Setup Geoapify with OSM fallback
      const { layer, provider } = setupTileLayer(map, { style: geoapifyStyle });
      tileLayerRef.current = layer;
      setMapProvider(provider);

      // Dedicated layer groups
      complaintsLayerRef.current = L.layerGroup().addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Attach click handler
    map.off('click');
    if (selectable || onLocationSelect) {
      map.on('click', handleMapClick);
    }

    // Responsive container resize observer
    const resizeObserver = new ResizeObserver(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    });

    resizeObserver.observe(containerRef.current);

    // Initial invalidate after DOM settling
    const timer = setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 150);

    return () => {
      clearTimeout(timer);
      resizeObserver.disconnect();
    };
  }, [center, zoom, selectable, onLocationSelect, handleMapClick, geoapifyStyle, leafletSelected]);

  /**
   * Cleanup on full unmount
   */
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  /**
   * Render Selected Location Marker
   */
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // If marker already exists, remove it
    if (selectedMarkerRef.current) {
      map.removeLayer(selectedMarkerRef.current);
      selectedMarkerRef.current = null;
    }

    if (leafletSelected) {
      const icon = createSelectedLocationIcon();
      const marker = L.marker(leafletSelected, {
        icon,
        draggable: draggableMarker,
        zIndexOffset: 1000
      });

      if (draggableMarker) {
        marker.on('dragend', (e) => {
          const latlng = e.target.getLatLng();
          const geoJson = [Number(latlng.lng), Number(latlng.lat)];
          if (onLocationSelect) {
            onLocationSelect(geoJson, { 
              lat: latlng.lat, 
              lng: latlng.lng, 
              coordinates: geoJson 
            });
          }
        });
      }

      // GeoJSON [longitude, latitude] formatted display
      const geoJson = toGeoJsonCoords(selectedLocation);
      const coordsText = geoJson 
        ? `[${geoJson[0].toFixed(5)}, ${geoJson[1].toFixed(5)}]` 
        : `${leafletSelected[0].toFixed(5)}, ${leafletSelected[1].toFixed(5)}`;

      marker.bindPopup(`
        <div class="p-3 text-xs" style="min-width: 190px;">
          <div class="flex items-center gap-1.5 font-bold text-blue-700 mb-1">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            <span>Target Location</span>
          </div>
          <div class="text-[11px] text-slate-600 mb-1">Stored GeoJSON coordinates:</div>
          <div class="font-mono text-[11px] bg-slate-100 text-slate-800 p-1.5 rounded border border-slate-200 break-all font-semibold">
            ${coordsText}
          </div>
          <div class="text-[10px] text-slate-400 mt-1.5">
            [longitude, latitude]
          </div>
        </div>
      `, { className: 'civic-leaflet-popup' });

      marker.addTo(map);
      selectedMarkerRef.current = marker;
    }
  }, [leafletSelected, draggableMarker, selectedLocation, onLocationSelect]);

  /**
   * Render Existing Complaints Markers
   */
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layer = complaintsLayerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();

    const validEntries = [];

    complaints.forEach((c) => {
      // Find coordinates: GeoJSON [longitude, latitude] or lat/lng object
      const rawCoords = c.location?.coordinates || c.coordinates || (c.location && [c.location.lng, c.location.lat]);
      const coords = toLeafletCoords(rawCoords);

      if (!coords) return;

      const severity = c.severity || c.aiAnalysis?.severity || 'MEDIUM';
      const isSelected = selectedComplaint && (
        (selectedComplaint._id && selectedComplaint._id === c._id) ||
        (selectedComplaint.id && selectedComplaint.id === c.id)
      );

      const icon = createSeverityMarkerIcon(severity, isSelected);
      const marker = L.marker(coords, {
        icon,
        zIndexOffset: isSelected ? 500 : (String(severity).toUpperCase() === 'CRITICAL' ? 200 : 50)
      });

      const sevConf = getSeverityConfig(severity);
      const complaintId = c._id || c.id || '';
      const category = c.category || 'General';
      const address = c.address || c.location?.address || 'Civic Infrastructure Point';
      const status = c.status || 'SUBMITTED';

      const popupHtml = `
        <div class="p-3.5 text-xs" style="min-width: 220px; max-width: 280px;">
          <div class="flex items-center justify-between gap-2 mb-1.5">
            <span class="px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase" style="background-color: ${sevConf.bgColor}; color: ${sevConf.textColor}; border: 1px solid ${sevConf.borderColor};">
              ${sevConf.label}
            </span>
            <span class="text-[10px] font-semibold text-slate-500 uppercase">${status}</span>
          </div>

          <h4 class="font-bold text-slate-900 text-xs mb-1 line-clamp-2 leading-snug">${c.title || 'Civic Grievance'}</h4>
          
          <div class="text-[11px] text-slate-600 mb-2 line-clamp-1 flex items-center gap-1">
            <span>📍</span>
            <span>${address}</span>
          </div>

          <div class="flex items-center justify-between border-t border-slate-100 pt-2 text-[10px] text-slate-500">
            <span class="font-medium text-slate-700">${category}</span>
            ${complaintId ? `<a href="/app/complaints/${complaintId}" class="font-semibold text-blue-600 hover:text-blue-800 hover:underline">View Dossier &rarr;</a>` : ''}
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, { className: 'civic-leaflet-popup' });

      marker.on('click', () => {
        if (onSelectComplaint) {
          onSelectComplaint(c);
        }
      });

      layer.addLayer(marker);
      validEntries.push(coords);
    });

    // Auto fit bounds if requested and complaints exist
    if (fitBoundsOnLoad && validEntries.length > 0 && !selectedLocation) {
      try {
        const bounds = L.latLngBounds(validEntries);
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
      } catch {
        // ignore bounds calculation edge cases
      }
    }
  }, [complaints, selectedComplaint, onSelectComplaint, fitBoundsOnLoad, selectedLocation]);

  /**
   * Reset / Recenter Map View
   */
  const handleRecenter = () => {
    if (!mapInstanceRef.current) return;
    if (leafletSelected) {
      mapInstanceRef.current.setView(leafletSelected, 15, { animate: true });
    } else if (center) {
      mapInstanceRef.current.setView(center, zoom, { animate: true });
    }
  };

  return (
    <div 
      className={`relative w-full rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shadow-xs select-none ${className}`} 
      style={{ height }}
    >
      {/* Leaflet DOM container */}
      <div ref={containerRef} className="w-full h-full z-0" />

      {/* Top Controls Overlay */}
      {showControls && (
        <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
          {/* Tile Provider Badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/90 backdrop-blur-xs border border-slate-200/80 text-[10px] font-semibold text-slate-700 shadow-xs">
            <Layers className="w-3 h-3 text-blue-600" />
            <span>{mapProvider === 'geoapify' ? 'Geoapify Vector GIS' : 'OpenStreetMap'}</span>
          </div>

          {/* Recenter Button */}
          <button
            type="button"
            onClick={handleRecenter}
            title="Recenter Map"
            className="p-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/80 shadow-xs transition-colors flex items-center justify-center cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Click-to-Pin Hint Banner (when in selection mode) */}
      {selectable && !selectedLocation && (
        <div className="absolute top-3 left-3 z-10 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium shadow-md flex items-center gap-1.5 pointer-events-none animate-pulse">
          <Crosshair className="w-3.5 h-3.5" />
          <span>Click anywhere on the map to place incident pin</span>
        </div>
      )}

      {/* Bottom Floating Legend */}
      {showLegend && (
        <div className="absolute bottom-3 left-3 z-10 max-w-[calc(100%-70px)] sm:max-w-none">
          <div className="bg-white/95 backdrop-blur-xs rounded-lg border border-slate-200/90 shadow-sm text-[11px] p-2 transition-all">
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold text-slate-800 text-[10px] uppercase tracking-wider flex items-center gap-1">
                <span>Severity Index</span>
              </span>
              <button
                type="button"
                onClick={() => setLegendCollapsed(!legendCollapsed)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer sm:hidden"
              >
                {legendCollapsed ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>

            {!legendCollapsed && (
              <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                {Object.entries(SEVERITY_CONFIG).filter(([k]) => k !== 'DEFAULT').map(([key, item]) => (
                  <div key={key} className="flex items-center gap-1 text-slate-600 font-medium text-[10px]">
                    <span 
                      className="w-2.5 h-2.5 rounded-full inline-block shrink-0 shadow-xs" 
                      style={{ backgroundColor: item.color }} 
                    />
                    <span>{item.label}</span>
                  </div>
                ))}
                {selectable && (
                  <div className="flex items-center gap-1 text-blue-700 font-bold text-[10px]">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block shrink-0 ring-2 ring-blue-300" />
                    <span>Selected Pin</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
