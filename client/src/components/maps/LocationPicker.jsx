import React, { useState } from 'react';
import CivicMap from './CivicMap';
import { 
  toGeoJsonCoords, 
  toLeafletCoords, 
  formatCoords 
} from '../../utils/leafletUtils';
import { 
  MapPin, 
  Navigation, 
  Check, 
  AlertCircle, 
  Loader2
} from 'lucide-react';

/**
 * Citizen Location Picker Component for Complaint Submission
 * 
 * @param {Object} props
 * @param {Array|Object} props.value - Currently selected coordinates [longitude, latitude] or {lat, lng}
 * @param {Function} props.onChange - Callback receiving [longitude, latitude] (GeoJSON format)
 * @param {Array} props.existingComplaints - Optional list of existing complaints in the area
 * @param {string} props.height - Map container height (default: '320px')
 * @param {string} props.label - Component label
 * @param {boolean} props.required - Whether location selection is required
 * @param {string} props.error - Optional error message
 */
export default function LocationPicker({
  value = null,
  onChange = () => {},
  existingComplaints = [],
  height = '320px',
  label = 'Incident Location Pin',
  required = true,
  error = ''
}) {
  const [isLocating, setIsLocating] = useState(false);
  const [gpsStatus, setGpsStatus] = useState(null); // { type: 'success' | 'error', message: string }

  // Normalize current coordinates
  const geoJsonCoords = toGeoJsonCoords(value); // [longitude, latitude]
  const leafletCoords = toLeafletCoords(value); // [latitude, longitude]

  /**
   * Handle map click location selection
   */
  const handleLocationSelect = (newGeoJson, details) => {
    // newGeoJson is [longitude, latitude]
    setGpsStatus(null);
    if (onChange) {
      onChange(newGeoJson, details);
    }
  };

  /**
   * Locate citizen's device using HTML5 Geolocation
   */
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGpsStatus({
        type: 'error',
        message: 'Geolocation is not supported by your browser.'
      });
      return;
    }

    setIsLocating(true);
    setGpsStatus(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        const { latitude, longitude, accuracy } = position.coords;
        // Standard GeoJSON: [longitude, latitude]
        const coords = [Number(longitude), Number(latitude)];
        
        setGpsStatus({
          type: 'success',
          message: `Device GPS located (accurate within ~${Math.round(accuracy)}m)`
        });

        if (onChange) {
          onChange(coords, {
            lat: latitude,
            lng: longitude,
            coordinates: coords,
            accuracy
          });
        }
      },
      (err) => {
        setIsLocating(false);
        let msg = 'Unable to retrieve your location.';
        if (err.code === 1) msg = 'Location permission denied. Please allow location access or click on the map.';
        else if (err.code === 2) msg = 'Location unavailable. Please click manually on the map.';
        else if (err.code === 3) msg = 'Location request timed out. Please try again or tap the map.';
        
        setGpsStatus({
          type: 'error',
          message: msg
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  return (
    <div className="space-y-3">
      {/* Location Picker Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider">
            <MapPin className="w-3.5 h-3.5 text-blue-600" />
            <span>{label}</span>
            {required && <span className="text-rose-500">*</span>}
          </label>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Tap or click the map directly to position the grievance pin
          </p>
        </div>

        {/* GPS Quick Button */}
        <button
          type="button"
          onClick={handleUseCurrentLocation}
          disabled={isLocating}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50/80 hover:bg-blue-100 text-blue-700 text-xs font-semibold transition-colors disabled:opacity-50 self-start sm:self-auto cursor-pointer"
        >
          {isLocating ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Detecting GPS...</span>
            </>
          ) : (
            <>
              <Navigation className="w-3.5 h-3.5" />
              <span>Use Current Location</span>
            </>
          )}
        </button>
      </div>

      {/* GPS Status Banner */}
      {gpsStatus && (
        <div className={`p-2.5 rounded-lg text-xs flex items-center gap-2 animate-in fade-in-50 ${
          gpsStatus.type === 'success' 
            ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' 
            : 'bg-amber-50 border border-amber-200 text-amber-800'
        }`}>
          {gpsStatus.type === 'success' ? (
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          )}
          <span>{gpsStatus.message}</span>
        </div>
      )}

      {/* Interactive Map */}
      <div className="relative">
        <CivicMap
          selectedLocation={geoJsonCoords}
          onLocationSelect={handleLocationSelect}
          complaints={existingComplaints}
          selectable={true}
          draggableMarker={true}
          center={leafletCoords || [28.6139, 77.2090]}
          zoom={geoJsonCoords ? 15 : 13}
          height={height}
          showControls={true}
          showLegend={true}
        />
      </div>

      {/* Coordinates Readout & Verification Box */}
      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`w-3 h-3 rounded-full shrink-0 ${geoJsonCoords ? 'bg-emerald-500 ring-4 ring-emerald-100' : 'bg-slate-300'}`} />
          <div className="min-w-0">
            <div className="font-semibold text-slate-800 truncate">
              {geoJsonCoords 
                ? formatCoords(geoJsonCoords) 
                : 'No pin dropped yet (tap map to position)'}
            </div>
            {geoJsonCoords && (
              <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                Standard GeoJSON: <span className="text-blue-700 font-semibold">[{geoJsonCoords[0].toFixed(5)}, {geoJsonCoords[1].toFixed(5)}]</span> <span className="text-slate-400 font-normal">[longitude, latitude]</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          <span className="text-[10px] text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded font-mono">
            {geoJsonCoords ? 'PIN FIXED' : 'AWAITING PIN'}
          </span>
        </div>
      </div>

      {error && (
        <p className="text-xs text-rose-600 font-medium flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}
