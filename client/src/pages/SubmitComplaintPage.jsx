import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Building2, 
  MapPin, 
  Upload, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight, 
  Info,
  Construction,
  Droplets,
  Trash2,
  Lightbulb,
  Bus,
  Waves,
  Zap,
  HelpCircle,
  Crosshair,
  Loader2,
  AlertCircle,
  Users
} from 'lucide-react';
import complaintService, { COMPLAINT_CATEGORIES } from '../services/complaintService';
import MapContainer from '../components/common/MapContainer';

export default function SubmitComplaintPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    category: 'ROAD',
    title: '',
    description: '',
    address: 'Near Cross Road 3, Civil Lines, Ward 14',
    affectedGroup: 'Pedestrians, Local Commuters',
    severity: 'MEDIUM',
    coordinates: { lat: 28.6139, lng: 77.2090 }
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [photoSelected, setPhotoSelected] = useState(false);

  // Dynamic simulated AI triage preview as user types
  const getPreTriageInsights = () => {
    const text = (formData.title + ' ' + formData.description).toLowerCase();
    
    if (text.includes('danger') || text.includes('fire') || text.includes('hazard') || text.includes('school') || text.includes('burst') || text.includes('hospital')) {
      return {
        severity: 'CRITICAL',
        urgency: 92,
        impact: 'High pedestrian & vehicular collision risk identified',
        dept: 'Emergency Works Response Unit'
      };
    } else if (text.includes('deep') || text.includes('leak') || text.includes('dark') || text.includes('water') || text.includes('overflow')) {
      return {
        severity: 'HIGH',
        urgency: 78,
        impact: 'Localized community disruption & sanitation hazard',
        dept: 'Zonal Engineering Division'
      };
    } else if (text.length > 10) {
      return {
        severity: 'MEDIUM',
        urgency: 55,
        impact: 'Standard municipal infrastructure repair',
        dept: 'Public Works & Maintenance Bureau'
      };
    }
    return null;
  };

  const aiPreview = getPreTriageInsights();

  const handleMapLocationSelect = (coords) => {
    setFormData(prev => ({
      ...prev,
      coordinates: coords,
      address: `Selected Point (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}) - Ward 14`
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!formData.title.trim() || !formData.description.trim() || !formData.address.trim()) {
      setErrorMessage('Please fill in title, description, and street address.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Format GeoJSON coordinates: [longitude, latitude]
      const geoJsonLocation = {
        type: 'Point',
        coordinates: [Number(formData.coordinates.lng), Number(formData.coordinates.lat)]
      };

      const groups = formData.affectedGroup
        ? formData.affectedGroup.split(',').map(g => g.trim()).filter(Boolean)
        : [];

      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        severity: aiPreview ? aiPreview.severity : formData.severity,
        address: formData.address.trim(),
        location: geoJsonLocation,
        affectedGroup: groups
      };

      const res = await complaintService.createComplaint(payload);

      if (res && res.complaint) {
        navigate(`/app/complaints/${res.complaint._id}`);
      } else {
        navigate('/app/citizen/complaints');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to submit complaint. Please check your network connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 mb-1">
          <Sparkles className="w-4 h-4 text-blue-600" />
          <span>Municipal Citizen Service</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Lodge Infrastructure Grievance
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Provide accurate details and GPS location. The issue is assigned an official ticket and routed directly to municipal field engineers.
        </p>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-xs text-rose-800 animate-in fade-in-50">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Category Picker */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            1. Select Infrastructure Category *
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {COMPLAINT_CATEGORIES.map((cat) => {
              const isSelected = formData.category === cat.id;
              return (
                <button
                  type="button"
                  key={cat.id}
                  onClick={() => setFormData({ ...formData, category: cat.id })}
                  className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/70 text-blue-900 ring-1 ring-blue-600'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="font-bold text-xs mb-0.5">{cat.label}</div>
                  <div className="text-[10px] text-slate-500 line-clamp-1">{cat.desc}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Issue Details & Real-Time AI Triage Simulation */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            2. Issue Details & Impact
          </label>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Short Summary / Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Deep pothole causing skidding near school gate"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Detailed Description *
            </label>
            <textarea
              required
              rows={4}
              placeholder="Describe the hazard, water leakage depth, duration, or traffic disruption in detail..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Affected Demographics (Optional)
            </label>
            <div className="relative">
              <Users className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="e.g. School Children, Senior Citizens, Daily Bus Commuters (comma separated)"
                value={formData.affectedGroup}
                onChange={(e) => setFormData({ ...formData, affectedGroup: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-blue-600"
              />
            </div>
          </div>

          {/* Real-Time Gemini Pre-Triage Assessment Card */}
          {aiPreview && (
            <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 space-y-2 animate-in fade-in-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-700" />
                  <span className="text-xs font-bold text-blue-900">Pre-Triage Severity Prediction</span>
                </div>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                  aiPreview.severity === 'CRITICAL' ? 'bg-red-50 text-red-700 border-red-200' :
                  aiPreview.severity === 'HIGH' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                  'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}>
                  {aiPreview.severity} ({aiPreview.urgency}/100)
                </span>
              </div>
              <p className="text-xs text-blue-800 leading-relaxed">
                {aiPreview.impact} • Department: <strong>{aiPreview.dept}</strong>
              </p>
            </div>
          )}

          {/* Photo Upload Simulator */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Photographic Evidence
            </label>
            <div 
              onClick={() => setPhotoSelected(!photoSelected)}
              className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors ${
                photoSelected ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
              }`}
            >
              <Upload className={`w-6 h-6 mx-auto mb-1.5 ${photoSelected ? 'text-emerald-600' : 'text-slate-400'}`} />
              {photoSelected ? (
                <div>
                  <p className="text-xs font-bold text-emerald-800">Photo Attached: site_evidence_geo.jpg</p>
                  <p className="text-[10px] text-emerald-600 mt-0.5">EXIF geotag attached (Click to change)</p>
                </div>
              ) : (
                <div>
                  <p className="text-xs font-semibold text-slate-700">Attach site photo (Optional)</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Supports JPG, PNG</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Location & Map Picker */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              3. Location & GPS Coordinates *
            </label>
            <span className="text-[11px] text-blue-600 flex items-center gap-1 font-medium">
              <Crosshair className="w-3.5 h-3.5" />
              Click on map to adjust pin
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Street Address / Landmark *
            </label>
            <input
              type="text"
              required
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-blue-600"
            />
          </div>

          {/* Interactive Map Picker */}
          <div>
            <MapContainer
              complaints={[{
                id: 'NEW-PIN',
                title: formData.title || 'Selected Issue Location',
                category: formData.category,
                location: { coordinates: formData.coordinates, address: formData.address },
                aiAnalysis: { severity: aiPreview?.severity || 'MEDIUM' }
              }]}
              center={[formData.coordinates.lat, formData.coordinates.lng]}
              zoom={14}
              height="260px"
              onLocationSelect={handleMapLocationSelect}
            />
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            to="/app/citizen"
            className="px-4 py-2.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Submitting to Municipal Board...</span>
              </>
            ) : (
              <>
                <span>Submit Grievance</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
