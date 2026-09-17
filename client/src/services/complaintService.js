import api from './api';

export const COMPLAINT_CATEGORIES = [
  { id: 'ROAD', label: 'Roads & Footpaths', icon: 'Construction', desc: 'Potholes, broken footpaths, road subsidence' },
  { id: 'STREET_LIGHT', label: 'Street Lighting', icon: 'Lightbulb', desc: 'Non-functional lamps, dark stretches, cable faults' },
  { id: 'WATER', label: 'Water Supply', icon: 'Droplets', desc: 'Pipe bursts, contaminated supply, low pressure' },
  { id: 'DRAINAGE', label: 'Drainage & Sewerage', icon: 'Waves', desc: 'Clogged storm drains, sewage overflows, flooding' },
  { id: 'WASTE', label: 'Solid Waste & Sanitation', icon: 'Trash2', desc: 'Overflowing dumpsters, garbage piles, open dumping' },
  { id: 'PUBLIC_TRANSPORT', label: 'Public Transit', icon: 'Bus', desc: 'Damaged bus stops, transit shelters, route signage' },
  { id: 'ELECTRICITY', label: 'Electricity & Grid', icon: 'Zap', desc: 'Exposed wiring, damaged transformers, sparking poles' },
  { id: 'OTHER', label: 'Other Civic Amenity', icon: 'HelpCircle', desc: 'Public park damage, fallen trees, community halls' }
];

export const complaintService = {
  // Submit a new complaint
  async createComplaint(complaintData) {
    return await api.post('/complaints', complaintData);
  },

  // Get current logged-in citizen's complaints
  async getMyComplaints() {
    return await api.get('/complaints/my');
  },

  // Get single complaint by ID
  async getComplaintById(id) {
    return await api.get(`/complaints/${id}`);
  },

  // Get similar/duplicate candidate complaints
  async getSimilarComplaints(id, radius = 1000) {
    return await api.get(`/complaints/${id}/similar?radius=${radius}`);
  },

  // Citizen update complaint details
  async updateComplaint(id, updateData) {
    return await api.patch(`/complaints/${id}`, updateData);
  },

  // Admin: Get all complaints with filters
  async getAdminComplaints(filters = {}) {
    const params = new URLSearchParams();
    if (filters.category && filters.category !== 'ALL') params.append('category', filters.category);
    if (filters.status && filters.status !== 'ALL') params.append('status', filters.status);
    if (filters.severity && filters.severity !== 'ALL') params.append('severity', filters.severity);
    if (filters.search) params.append('search', filters.search);
    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);

    const query = params.toString() ? `?${params.toString()}` : '';
    return await api.get(`/admin/complaints${query}`);
  },

  // Admin: Update status and add audit note
  async updateComplaintStatus(id, status, note) {
    return await api.patch(`/admin/complaints/${id}/status`, { status, note });
  },

  // Admin Analytics Endpoints
  async getAdminAnalyticsOverview() {
    return await api.get('/admin/analytics/overview');
  },

  async getAdminAnalyticsCategories() {
    return await api.get('/admin/analytics/categories');
  },

  async getAdminAnalyticsSeverity() {
    return await api.get('/admin/analytics/severity');
  },

  async getAdminAnalyticsTrends(days = 30) {
    return await api.get(`/admin/analytics/trends?days=${days}`);
  },

  // Admin Geographic Hotspots Endpoint
  async getAdminHotspots(params = {}) {
    const query = new URLSearchParams();
    if (params.radius) query.append('radius', params.radius);
    if (params.minComplaints) query.append('minComplaints', params.minComplaints);
    if (params.category && params.category !== 'ALL') query.append('category', params.category);
    if (params.status && params.status !== 'ALL') query.append('status', params.status);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return await api.get(`/admin/hotspots${qs}`);
  }
};

export default complaintService;
