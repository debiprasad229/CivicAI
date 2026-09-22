import L from 'leaflet';

/**
 * Fix Leaflet default marker icons for modern Vite/Webpack bundlers
 */
export const fixLeafletIcons = () => {
  try {
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });
  } catch (err) {
    // Ignore in non-browser test environments
  }
};

// Auto-run on module load
fixLeafletIcons();

/**
 * Severity configuration with colors, labels and urgency weights
 */
export const SEVERITY_CONFIG = {
  CRITICAL: {
    label: 'Critical',
    color: '#EF4444',
    bgColor: '#FEF2F2',
    borderColor: '#FCA5A5',
    textColor: '#991B1B',
    pulseClass: 'animate-critical-pulse'
  },
  HIGH: {
    label: 'High',
    color: '#F97316',
    bgColor: '#FFF7ED',
    borderColor: '#FDBA74',
    textColor: '#9A3412',
    pulseClass: ''
  },
  MEDIUM: {
    label: 'Medium',
    color: '#F59E0B',
    bgColor: '#FFFBEB',
    borderColor: '#FCD34D',
    textColor: '#92400E',
    pulseClass: ''
  },
  LOW: {
    label: 'Low',
    color: '#10B981',
    bgColor: '#ECFDF5',
    borderColor: '#6EE7B7',
    textColor: '#065F46',
    pulseClass: ''
  },
  DEFAULT: {
    label: 'Standard',
    color: '#3B82F6',
    bgColor: '#EFF6FF',
    borderColor: '#93C5FD',
    textColor: '#1E40AF',
    pulseClass: ''
  }
};

/**
 * Normalize severity key from raw complaint
 */
export const getSeverityConfig = (severityStr) => {
  if (!severityStr) return SEVERITY_CONFIG.DEFAULT;
  const key = String(severityStr).toUpperCase().trim();
  return SEVERITY_CONFIG[key] || SEVERITY_CONFIG.DEFAULT;
};

/**
 * Convert various coordinate formats into Leaflet [latitude, longitude]
 * @param {Array|Object} coords - GeoJSON [longitude, latitude] or {lat, lng} or {coordinates: [lng, lat]}
 * @returns {[number, number]|null} Leaflet [lat, lng]
 */
export const toLeafletCoords = (coords) => {
  if (!coords) return null;

  // If already GeoJSON object { type: 'Point', coordinates: [lng, lat] }
  if (coords.coordinates && Array.isArray(coords.coordinates)) {
    const [lng, lat] = coords.coordinates;
    if (lat != null && lng != null && !isNaN(lat) && !isNaN(lng)) {
      return [Number(lat), Number(lng)];
    }
  }

  // If array: GeoJSON standard is [longitude, latitude]
  if (Array.isArray(coords)) {
    if (coords.length >= 2) {
      const [lng, lat] = coords;
      if (lat != null && lng != null && !isNaN(lat) && !isNaN(lng)) {
        return [Number(lat), Number(lng)];
      }
    }
    return null;
  }

  // If object with lat and lng
  if (typeof coords === 'object') {
    const lat = coords.lat ?? coords.latitude;
    const lng = coords.lng ?? coords.longitude;
    if (lat != null && lng != null && !isNaN(lat) && !isNaN(lng)) {
      return [Number(lat), Number(lng)];
    }
  }

  return null;
};

/**
 * Convert any coordinate representation to GeoJSON standard [longitude, latitude]
 * @param {Array|Object} coords - Input coordinates
 * @returns {[number, number]|null} GeoJSON [longitude, latitude]
 */
export const toGeoJsonCoords = (coords) => {
  if (!coords) return null;

  // If LatLng object from Leaflet event { lat, lng }
  if (typeof coords === 'object' && !Array.isArray(coords)) {
    if (coords.coordinates && Array.isArray(coords.coordinates)) {
      return [Number(coords.coordinates[0]), Number(coords.coordinates[1])];
    }
    const lat = coords.lat ?? coords.latitude;
    const lng = coords.lng ?? coords.longitude;
    if (lat != null && lng != null && !isNaN(lat) && !isNaN(lng)) {
      return [Number(lng), Number(lat)];
    }
  }

  // If already an array [lng, lat]
  if (Array.isArray(coords) && coords.length >= 2) {
    return [Number(coords[0]), Number(coords[1])];
  }

  return null;
};

/**
 * Format coordinates for human-readable display
 * @param {[number, number]|Object} coords - [longitude, latitude] or {lat, lng}
 * @returns {string} Formatted string e.g. "28.6139° N, 77.2090° E"
 */
export const formatCoords = (coords, precision = 4) => {
  const leaflet = toLeafletCoords(coords);
  if (!leaflet) return 'Coordinates unavailable';
  const [lat, lng] = leaflet;
  const latDir = lat >= 0 ? 'N' : 'S';
  const lngDir = lng >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(precision)}° ${latDir}, ${Math.abs(lng).toFixed(precision)}° ${lngDir}`;
};

// Static Icon Caches to prevent thousands of DOM/Icon re-allocations on render
const severityIconCache = new Map();
let cachedSelectedLocationIcon = null;

/**
 * Create custom SVG marker for selected complaint location
 */
export const createSelectedLocationIcon = () => {
  if (cachedSelectedLocationIcon) return cachedSelectedLocationIcon;

  cachedSelectedLocationIcon = L.divIcon({
    className: 'custom-selected-pin-container',
    html: `
      <div style="position: relative; width: 36px; height: 44px; display: flex; flex-direction: column; align-items: center; justify-content: flex-end;">
        <!-- Base ground ripple pulse -->
        <div class="animate-marker-pulse" style="
          position: absolute;
          bottom: 2px;
          left: 50%;
          transform: translateX(-50%);
          width: 14px;
          height: 8px;
          background: rgba(37, 99, 235, 0.4);
          border-radius: 50%;
          z-index: 1;
        "></div>
        <!-- Pin SVG -->
        <svg width="34" height="42" viewBox="0 0 34 42" fill="none" xmlns="http://www.w3.org/2000/svg" style="
          filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3));
          position: relative;
          z-index: 2;
        ">
          <path d="M17 0C7.61116 0 0 7.61116 0 17C0 26.5 14.5 40.5 16.2 42C16.6 42.4 17.4 42.4 17.8 42C19.5 40.5 34 26.5 34 17C34 7.61116 26.3888 0 17 0Z" fill="#2563EB"/>
          <path d="M17 1C8.16344 1 1 8.16344 1 17C1 26 15 39.5 17 41.2C19 39.5 33 26 33 17C33 8.16344 25.8366 1 17 1Z" stroke="#FFFFFF" stroke-width="1.5"/>
          <circle cx="17" cy="16" r="6.5" fill="#FFFFFF"/>
          <circle cx="17" cy="16" r="3" fill="#2563EB"/>
        </svg>
      </div>
    `,
    iconSize: [36, 44],
    iconAnchor: [18, 42],
    popupAnchor: [0, -42]
  });

  return cachedSelectedLocationIcon;
};

/**
 * Create custom SVG marker for existing complaints differentiated by severity
 */
export const createSeverityMarkerIcon = (severity, isSelected = false) => {
  const normSeverity = String(severity || 'MEDIUM').toUpperCase().trim();
  const cacheKey = `${normSeverity}:${isSelected ? 'selected' : 'default'}`;

  if (severityIconCache.has(cacheKey)) {
    return severityIconCache.get(cacheKey);
  }

  const conf = getSeverityConfig(normSeverity);
  const isCritical = normSeverity === 'CRITICAL';
  const size = isSelected ? 32 : (isCritical ? 28 : 24);
  const anchor = size / 2;

  const pulseMarkup = isCritical
    ? `<div class="animate-critical-pulse" style="
        position: absolute;
        inset: -4px;
        border-radius: 50%;
        background: rgba(239, 68, 68, 0.4);
        z-index: 0;
      "></div>`
    : '';

  const icon = L.divIcon({
    className: `civic-severity-marker ${isSelected ? 'is-selected' : ''}`,
    html: `
      <div style="position: relative; width: ${size}px; height: ${size}px; display: flex; align-items: center; justify-content: center;">
        ${pulseMarkup}
        <div style="
          position: relative;
          z-index: 1;
          width: ${size}px;
          height: ${size}px;
          border-radius: 50%;
          background: ${conf.color};
          border: ${isSelected ? '3px solid #0f172a' : '2.5px solid #ffffff'};
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.2s ease;
        ">
          <div style="
            width: ${size * 0.35}px;
            height: ${size * 0.35}px;
            background-color: #ffffff;
            border-radius: 50%;
          "></div>
        </div>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [anchor, anchor],
    popupAnchor: [0, -anchor]
  });

  severityIconCache.set(cacheKey, icon);
  return icon;
};

const hotspotIconCache = new Map();

/**
 * Create custom Hotspot GIS Marker Icon
 * Distinct from individual complaint markers: uses radar ring, flame icon, and priority score
 */
export const createHotspotMarkerIcon = (hotspot, isSelected = false) => {
  const score = hotspot.priorityScore || 0;
  const count = hotspot.complaintCount || 2;
  const cacheKey = `${score}:${count}:${isSelected ? 'selected' : 'default'}`;

  if (hotspotIconCache.has(cacheKey)) {
    return hotspotIconCache.get(cacheKey);
  }

  // Determine color scheme based on priorityScore
  let color = '#ef4444'; // Red (High hazard)
  let glowColor = 'rgba(239, 68, 68, 0.4)';
  let bgGradient = 'linear-gradient(135deg, #ef4444, #b91c1c)';

  if (score < 45) {
    color = '#3b82f6';
    glowColor = 'rgba(59, 130, 246, 0.4)';
    bgGradient = 'linear-gradient(135deg, #3b82f6, #1d4ed8)';
  } else if (score < 70) {
    color = '#f97316';
    glowColor = 'rgba(249, 115, 22, 0.4)';
    bgGradient = 'linear-gradient(135deg, #f97316, #c2410c)';
  }

  const size = isSelected ? 48 : 42;
  const anchor = size / 2;

  const icon = L.divIcon({
    className: 'civic-hotspot-marker',
    html: `
      <div style="position: relative; width: ${size}px; height: ${size}px; display: flex; items-center; justify-content: center;">
        <!-- Pulsing Radar Ring -->
        <div style="
          position: absolute;
          inset: -4px;
          border-radius: 9999px;
          border: 2px solid ${color};
          animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
          opacity: 0.6;
        "></div>
        
        <!-- Outer Glowing Circle -->
        <div style="
          width: 100%;
          height: 100%;
          border-radius: 9999px;
          background: ${bgGradient};
          box-shadow: 0 4px 14px ${glowColor}, 0 0 0 2px #ffffff;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          font-family: ui-sans-serif, system-ui, sans-serif;
          cursor: pointer;
          transform: ${isSelected ? 'scale(1.15)' : 'scale(1)'};
          transition: transform 0.2s ease;
        ">
          <div style="display: flex; align-items: center; gap: 2px; font-weight: 800; font-size: 11px; line-height: 1;">
            <span>🔥</span>
            <span>${count}</span>
          </div>
          <div style="font-size: 8px; font-weight: 700; opacity: 0.95; letter-spacing: -0.2px; line-height: 1; margin-top: 1px;">
            ${score}pt
          </div>
        </div>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [anchor, anchor],
    popupAnchor: [0, -anchor - 4]
  });

  hotspotIconCache.set(cacheKey, icon);
  return icon;
};

/**
 * Set up tile layer: uses Geoapify if VITE_GEOAPIFY_API_KEY is available;
 * seamlessly falls back to OpenStreetMap on missing key or load errors.
 */
export const setupTileLayer = (map, options = {}) => {
  const apiKey = import.meta.env.VITE_GEOAPIFY_API_KEY?.trim();
  const style = options.style || 'osm-bright';

  // Attribution
  const geoapifyAttribution =
    'Powered by <a href="https://www.geoapify.com/" target="_blank" rel="noopener noreferrer">Geoapify</a> | <a href="https://openmaptiles.org/" target="_blank" rel="noopener noreferrer">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>';
  const osmAttribution =
    '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors';

  let activeLayer;
  let provider = 'osm';

  const createOsmLayer = () => {
    return L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: osmAttribution,
      maxZoom: 19,
      crossOrigin: true
    });
  };

  if (apiKey) {
    // Geoapify raster tiles
    const geoapifyUrl = `https://maps.geoapify.com/v1/tile/${style}/{z}/{x}/{y}.png?apiKey=${apiKey}`;
    activeLayer = L.tileLayer(geoapifyUrl, {
      attribution: geoapifyAttribution,
      maxZoom: 20,
      crossOrigin: true
    });
    provider = 'geoapify';

    // Graceful fallback to OSM on tile errors (e.g. invalid API key, quota limit)
    let fallbackTriggered = false;
    activeLayer.on('tileerror', () => {
      if (!fallbackTriggered) {
        fallbackTriggered = true;
        console.warn('Geoapify tile loading error. Falling back to OpenStreetMap tiles.');
        try {
          map.removeLayer(activeLayer);
          const osm = createOsmLayer();
          osm.addTo(map);
        } catch (e) {
          // ignore cleanup errors
        }
      }
    });
  } else {
    activeLayer = createOsmLayer();
    provider = 'osm';
  }

  activeLayer.addTo(map);
  return { layer: activeLayer, provider };
};

/**
 * HTML entity escaping helper to prevent XSS in Leaflet HTML popups
 */
export const escapeHtml = (str) => {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};
