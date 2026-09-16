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
  Trees,
  Crosshair
} from 'lucide-react';
import { INFRASTRUCTURE_CATEGORIES, createComplaint } from '../utils/mockData';
import MapContainer from '../components/common/MapContainer';

export default function SubmitComplaintPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    category: 'Roads & Footpaths',
    categoryId: 'roads',
    title: '',
    description: '',
    address: 'Near Cross Road 3, Civil Lines, Ward 14',
    ward: 'Ward 14 (Central)',
    severity: 'Medium',
    coordinates: { lat: 28.6139, lng: 77.2090 }
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoSelected, setPhotoSelected] = useState(false);

  // Dynamic simulated AI triage preview as user types
  const getPreTriageInsights = () => {
    const text = (formData.title + ' ' + formData.description).toLowerCase();
    
    if (text.includes('danger') || text.includes('fire') || text.includes('hazard') || text.includes('school') || text.includes('burst') || text.includes('hospital')) {
      return {
        severity: 'Critical',
        urgency: 92,
        impact: 'High pedestrian & vehicular collision risk identified',
        dept: 'Emergency Works Response Unit'
      };
    } else if (text.includes('deep') || text.includes('leak') || text.includes('dark') || text.includes('water') || text.includes('overflow')) {
      return {
        severity: 'High',
        urgency: 78,
        impact: 'Localized community disruption & sanitation hazard',
        dept: 'Zonal Engineering Division'
      };
    } else if (text.length > 10) {
      return {
        severity: 'Medium',
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
      address: `Selected Map Point (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}) - Ward 14`
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.description) return;

    setIsSubmitting(true);

    setTimeout(() => {
      const created = createComplaint({
        ...formData,
        severity: aiPreview ? aiPreview.severity : 'Medium'
      });
      setIsSubmitting(false);
      navigate(`/app/complaints/${created.id}`);
    }, 600);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 mb-1">
          <Sparkles className="w-4 h-4 text-blue-600" />
          <span>AI-Assisted Intake Form</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Lodge Infrastructure Grievance
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Provide accurate details and photos. Google Gemini automatically validates the category, calculates urgency, and routes the ticket to the municipal field division.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Category Picker */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            1. Select Infrastructure Category
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {INFRASTRUCTURE_CATEGORIES.map((cat) => {
              const isSelected = formData.categoryId === cat.id;
              return (
                <button
                  type="button"
                  key={cat.id}
                  onClick={() => setFormData({ ...formData, category: cat.name, categoryId: cat.id })}
                  className={`p-3.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/70 text-blue-900 ring-1 ring-blue-600'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="font-semibold text-xs mb-1">{cat.name}</div>
                  <div className="text-[11px] text-slate-500 line-clamp-2">{cat.description}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Issue Details & Real-Time AI Triage Simulation */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            2. Issue Description & Proof
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
              placeholder="Describe the severity, duration, and safety risks (e.g. water leakage depth, traffic slowdown, hazard to pedestrians or children)..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
            />
          </div>

          {/* Real-Time Gemini Pre-Triage Assessment Card */}
          {aiPreview && (
            <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 space-y-2 animate-in fade-in-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-700" />
                  <span className="text-xs font-bold text-blue-900">Gemini Live Pre-Triage Preview</span>
                </div>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                  aiPreview.severity === 'Critical' ? 'bg-red-50 text-red-700 border-red-200' :
                  aiPreview.severity === 'High' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                  'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}>
                  Predicted Severity: {aiPreview.severity} ({aiPreview.urgency}/100)
                </span>
              </div>
              <p className="text-xs text-blue-800 leading-relaxed">
                {aiPreview.impact} • Recommended Route: <strong>{aiPreview.dept}</strong>
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
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                photoSelected ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
              }`}
            >
              <Upload className={`w-8 h-8 mx-auto mb-2 ${photoSelected ? 'text-emerald-600' : 'text-slate-400'}`} />
              {photoSelected ? (
                <div>
                  <p className="text-xs font-bold text-emerald-800">Photo Attached: pothole_evidence_geo.jpg</p>
                  <p className="text-[11px] text-emerald-600 mt-0.5">Geotag extracted from EXIF metadata (Click to change)</p>
                </div>
              ) : (
                <div>
                  <p className="text-xs font-semibold text-slate-700">Click to simulate attaching site photo</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Supports JPG, PNG up to 10MB</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Location & Map Picker */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              3. Location & Coordinates
            </label>
            <span className="text-[11px] text-blue-600 flex items-center gap-1 font-medium">
              <Crosshair className="w-3.5 h-3.5" />
              Click on map to adjust pin
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Street Address / Landmark
              </label>
              <input
                type="text"
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-blue-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Administrative Ward
              </label>
              <input
                type="text"
                required
                value={formData.ward}
                onChange={(e) => setFormData({ ...formData, ward: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-blue-600"
              />
            </div>
          </div>

          {/* Interactive Map Picker */}
          <div>
            <MapContainer
              complaints={[{
                id: 'NEW-PIN',
                title: formData.title || 'Selected Issue Location',
                category: formData.category,
                location: { coordinates: formData.coordinates, address: formData.address },
                aiAnalysis: { severity: aiPreview?.severity || 'Medium' }
              }]}
              center={[formData.coordinates.lat, formData.coordinates.lng]}
              zoom={14}
              height="280px"
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
              <span>Running Gemini AI Triage...</span>
            ) : (
              <>
                <span>Submit Grievance to Municipal Board</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
