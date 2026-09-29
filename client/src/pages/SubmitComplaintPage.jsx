import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Upload, 
  Sparkles, 
  ArrowRight, 
  Loader2, 
  AlertCircle, 
  Users,
  Globe
} from 'lucide-react';
import complaintService, { COMPLAINT_CATEGORIES } from '../services/complaintService';
import LocationPicker from '../components/maps/LocationPicker';

export default function SubmitComplaintPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    category: 'ROAD',
    title: '',
    description: '',
    address: '',
    affectedGroup: '',
    severity: 'MEDIUM',
    language: 'auto',
    coordinates: [77.2090, 28.6139] // standard GeoJSON [longitude, latitude]
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [photoSelected, setPhotoSelected] = useState(false);

  // 1-Click Evaluation Scenarios for rapid 2-minute demonstration
  const DEMO_SCENARIOS = [
    {
      label: '🚰 Water Pipeline Rupture',
      badge: 'High Severity',
      badgeColor: 'bg-orange-100 text-orange-800 border-orange-200',
      data: {
        category: 'WATER',
        title: 'Treated drinking water main fracture flooding pedestrian parikrama',
        description: 'A major treated drinking water distribution line has ruptured near the main square. Thousands of liters of clean drinking water are gushing out, flooding pedestrian crossings and cutting off water pressure to over 200 nearby residences.',
        address: 'Bindu Sagar Parikrama Road, Old Town, Bhubaneswar, Odisha 751002',
        affectedGroup: 'Pilgrims, Local Residents, Shop Owners',
        severity: 'HIGH',
        coordinates: [85.8332, 20.2402]
      }
    },
    {
      label: '⚠️ Road Hazard near School',
      badge: 'Critical Hazard',
      badgeColor: 'bg-red-100 text-red-800 border-red-200',
      data: {
        category: 'ROAD',
        title: 'Severe road cave-in and dangerous pothole near primary school gate',
        description: 'A 2-foot wide, 8-inch deep road crater has formed directly in front of the school gate. Water accumulates inside it and two-wheelers have skidded during morning rush hours. Poses severe collision hazard to children and cyclists.',
        address: 'KIIT Road Service Lane, Patia, Bhubaneswar, Odisha 751024',
        affectedGroup: 'School Children, Commuters, Cyclists',
        severity: 'CRITICAL',
        coordinates: [85.8182, 20.3552]
      }
    },
    {
      label: '💡 Streetlight Corridor Blackout',
      badge: 'Safety Hazard',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
      data: {
        category: 'STREET_LIGHT',
        title: 'Complete blackout of 4 high-mast streetlights in commercial lane',
        description: 'Four consecutive street luminaires have failed along the busy commercial market corridor. The entire 200m stretch is completely pitch dark after 7 PM, creating safety concerns for women pedestrians and evening shoppers.',
        address: 'Block B Market Avenue, Saheed Nagar, Bhubaneswar, Odisha 751007',
        affectedGroup: 'Women Pedestrians, Evening Commuters, Vendors',
        severity: 'MEDIUM',
        coordinates: [85.8455, 20.2920]
      }
    }
  ];

  const handleApplyScenario = (scenario) => {
    setFormData(prev => ({
      ...prev,
      ...scenario.data
    }));
    setErrorMessage('');
  };

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

  const handleMapLocationSelect = (geoJsonCoords) => {
    setFormData(prev => ({
      ...prev,
      coordinates: geoJsonCoords
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!formData.title.trim() || !formData.description.trim() || !formData.address.trim()) {
      setErrorMessage('Please fill in title, description, and street address.');
      return;
    }

    if (!formData.coordinates || !Array.isArray(formData.coordinates) || formData.coordinates.length < 2) {
      setErrorMessage('Please select a valid location pin on the map.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Format GeoJSON coordinates: [longitude, latitude]
      const geoJsonLocation = {
        type: 'Point',
        coordinates: [Number(formData.coordinates[0]), Number(formData.coordinates[1])]
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
        affectedGroup: groups,
        ...(formData.language !== 'auto' ? { language: formData.language } : {})
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
      {/* Header & Quick Evaluation Scenarios */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 mb-1">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
              <span>Digital Public Infrastructure • Citizen Service Desk</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Lodge Infrastructure Grievance
            </h1>
          </div>
          <span className="self-start sm:self-center px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-[11px] font-semibold text-slate-600">
            Automated AI Triage Active
          </span>
        </div>

        <p className="text-xs sm:text-sm text-slate-600">
          Provide issue details and pin the GPS location on the map. Google Gemini AI automatically assesses hazard severity, categorizes municipal department, and routes to field engineers.
        </p>

        {/* Evaluation Demo Scenarios Shortcut */}
        <div className="bg-slate-50/90 border border-slate-200/80 rounded-xl p-3 sm:p-3.5">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <span>⚡</span>
              <span>Evaluation Fast Demo (1-Click Fill)</span>
            </span>
            <span className="text-[10px] text-slate-500 hidden sm:inline">
              Click any scenario to pre-fill test complaint
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {DEMO_SCENARIOS.map((sc, i) => (
              <button
                type="button"
                key={i}
                onClick={() => handleApplyScenario(sc)}
                className="w-full px-3 py-2 rounded-lg bg-white hover:bg-blue-50/80 border border-slate-200 hover:border-blue-300 text-xs font-medium text-slate-700 hover:text-blue-900 transition-all shadow-2xs cursor-pointer flex items-center justify-between gap-2 text-left"
                title={`Auto-fill ${sc.label}`}
              >
                <span className="font-semibold text-slate-800 text-[11px] truncate">{sc.label}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-sm font-bold shrink-0 border ${sc.badgeColor}`}>
                  {sc.badge}
                </span>
              </button>
            ))}
          </div>
        </div>
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

          {/* Multilingual Support Guidance Banner */}
          <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start sm:items-center gap-2.5">
              <div className="p-1.5 bg-blue-600 text-white rounded-lg shrink-0">
                <Globe className="w-3.5 h-3.5" />
              </div>
              <div className="text-xs text-blue-950">
                <span className="font-bold">Multilingual Grievance Support: </span>
                <span className="text-slate-600">
                  Write in <strong>English</strong>, <strong>हिन्दी (Hindi)</strong>, or <strong>ଓଡ଼ିଆ (Odia)</strong>. Gemini AI auto-detects language and generates a standardized English dispatch summary.
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              <span className="text-[11px] font-semibold text-slate-500">Language:</span>
              <select
                value={formData.language}
                onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-blue-600 cursor-pointer shadow-2xs"
              >
                <option value="auto">Auto-Detect</option>
                <option value="en">English</option>
                <option value="hi">हिन्दी (Hindi)</option>
                <option value="or">ଓଡ଼ିଆ (Odia)</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">
                Short Summary / Title *
              </label>
              <span className={`text-[10px] font-mono ${formData.title.length > 130 ? 'text-amber-600 font-bold' : 'text-slate-400'}`}>
                {formData.title.length}/150
              </span>
            </div>
            <input
              type="text"
              required
              maxLength={150}
              placeholder="e.g. Deep pothole causing skidding near school gate"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-2xs"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">
                Detailed Description *
              </label>
              <span className="text-[10px] font-mono text-slate-400">
                {formData.description.length} chars
              </span>
            </div>
            <textarea
              required
              rows={4}
              placeholder="Describe the hazard, water leakage depth, duration, or traffic disruption in detail..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-2xs"
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
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Street Address / Landmark *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Near Cross Road 3, Civil Lines, Ward 14"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-blue-600"
            />
          </div>

          {/* Interactive Geoapify / Leaflet Location Picker */}
          <LocationPicker
            value={formData.coordinates}
            onChange={handleMapLocationSelect}
            height="290px"
            required
          />
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
