// Civic infrastructure categories
export const INFRASTRUCTURE_CATEGORIES = [
  { id: 'roads', name: 'Roads & Footpaths', icon: 'Construction', color: 'amber', description: 'Potholes, broken footpaths, road cave-ins, and uneven surfaces' },
  { id: 'water', name: 'Water Supply & Drainage', icon: 'Droplets', color: 'blue', description: 'Pipeline leaks, contaminated water, stormwater blockages, and sewage overflow' },
  { id: 'sanitation', name: 'Solid Waste & Sanitation', icon: 'Trash2', color: 'emerald', description: 'Uncollected garbage, illegal dumping, public bins overflowing' },
  { id: 'lighting', name: 'Street Lighting & Electrical', icon: 'Lightbulb', color: 'yellow', description: 'Dark stretches, flickering lamps, exposed wires, damaged utility poles' },
  { id: 'transit', name: 'Public Transit & Traffic', icon: 'Bus', color: 'purple', description: 'Damaged bus shelters, faulty traffic signals, obscured road signs' },
  { id: 'parks', name: 'Parks & Public Amenities', icon: 'Trees', color: 'green', description: 'Broken playground gear, hazardous trees, damaged civic benches' }
];

export const MOCK_COMPLAINTS = [
  {
    id: 'CIV-2026-8801',
    title: 'Severe Pothole & Road Subsidence near Primary School',
    description: 'A deep pothole (approx 2 ft wide, 6 inches deep) has developed right in front of St. Jude Primary School gate. During morning school rush hours, multiple two-wheelers have skidded and water accumulates inside it creating severe hazard.',
    category: 'Roads & Footpaths',
    categoryId: 'roads',
    status: 'In Progress',
    location: {
      address: 'Near Gate 2, St. Jude School, Central Ring Road, Ward 14',
      ward: 'Ward 14 (Central)',
      city: 'Metro City',
      coordinates: { lat: 28.6139, lng: 77.2090 }
    },
    citizen: {
      name: 'Rohan Sharma',
      email: 'rohan.s@example.com',
      phone: '+91 98765 43210'
    },
    createdAt: '2026-09-14T08:30:00Z',
    updatedAt: '2026-09-15T10:15:00Z',
    aiAnalysis: {
      urgencyScore: 92,
      severity: 'Critical',
      categoryDetected: 'Roads & Footpaths',
      subCategory: 'Active School Zone Hazard',
      affectedGroups: ['School Children', 'Pedestrians', 'Two-wheeler Commuters'],
      safetyRiskAssessment: 'Extreme hazard of injury during peak morning hours (07:30 - 09:00). High risk of monsoon water-logging and under-wheel collision.',
      estimatedImpactRadiusMeters: 250,
      recommendedDepartment: 'Public Works Department (PWD) - Central Division',
      actionableRecommendations: [
        'Place emergency safety cones and hazard tape within 2 hours.',
        'Deploy cold-mix asphalt patch team for temporary filling before evening school dispersal.',
        'Schedule permanent asphalt resurfacing within 48 hours.'
      ],
      potentialDuplicateOf: null
    },
    timeline: [
      { step: 'Report Submitted', timestamp: '2026-09-14 08:30 AM', note: 'Citizen filed report via mobile portal with location geotag.' },
      { step: 'AI Triage & Classification', timestamp: '2026-09-14 08:30 AM', note: 'Gemini evaluated urgency score 92/100 (Critical: School Zone).' },
      { step: 'Assigned to PWD Central', timestamp: '2026-09-14 10:00 AM', note: 'Dispatched to Officer Rajesh Verma (Lead Road Engineer).' },
      { step: 'Work In Progress', timestamp: '2026-09-15 09:30 AM', note: 'Safety barriers deployed. Cold mix patch underway.' }
    ]
  },
  {
    id: 'CIV-2026-8794',
    title: 'Main Drinking Water Pipeline Rupture & Flooding',
    description: 'Water distribution line burst near the 4th Cross junction. Clean drinking water has been flowing across the street since last night, reducing household water pressure in over 200 homes.',
    category: 'Water Supply & Drainage',
    categoryId: 'water',
    status: 'Assigned',
    location: {
      address: '4th Cross, Ashok Nagar, Opposite Metro Station, Ward 8',
      ward: 'Ward 8 (North)',
      city: 'Metro City',
      coordinates: { lat: 28.6289, lng: 77.2180 }
    },
    citizen: {
      name: 'Ananya Deshmukh',
      email: 'ananya.d@example.com',
      phone: '+91 98220 11223'
    },
    createdAt: '2026-09-15T06:15:00Z',
    updatedAt: '2026-09-15T08:00:00Z',
    aiAnalysis: {
      urgencyScore: 88,
      severity: 'High',
      categoryDetected: 'Water Supply & Drainage',
      subCategory: 'Distribution Pipe Burst',
      affectedGroups: ['Local Residents (200+ households)', 'Street Commuters', 'Commercial Shops'],
      safetyRiskAssessment: 'Substantial loss of treated drinking water. Risk of road foundation erosion and contamination ingress into drinking network.',
      estimatedImpactRadiusMeters: 400,
      recommendedDepartment: 'Municipal Water & Sewerage Board (Jal Nigam)',
      actionableRecommendations: [
        'Isolate valve section V-14 to stop pressurized outflow immediately.',
        'Deploy suction tanker and excavation crew to locate pipe collar fracture.',
        'Issue temporary low-pressure advisory to Ward 8 residents.'
      ],
      potentialDuplicateOf: null
    },
    timeline: [
      { step: 'Report Submitted', timestamp: '2026-09-15 06:15 AM', note: 'Citizen reported continuous pipe leakage.' },
      { step: 'AI Triage & Classification', timestamp: '2026-09-15 06:16 AM', note: 'Urgency scored 88 (High Severity, Resource Loss).' },
      { step: 'Assigned to Jal Board Crew 3', timestamp: '2026-09-15 07:45 AM', note: 'Ticket dispatched to Valve Operations unit.' }
    ]
  },
  {
    id: 'CIV-2026-8789',
    title: 'Overflowing Community Waste Dump & Foul Odor',
    description: 'Community garbage dumpster has not been cleared for 4 consecutive days. Trash has spilled onto the main pedestrian sidewalk, attracting stray animals and creating severe sanitary risk.',
    category: 'Solid Waste & Sanitation',
    categoryId: 'sanitation',
    status: 'In Review',
    location: {
      address: 'Market Yard Corner, Sector 9 Market, Ward 12',
      ward: 'Ward 12 (East)',
      city: 'Metro City',
      coordinates: { lat: 28.6012, lng: 77.2310 }
    },
    citizen: {
      name: 'Vikram Patel',
      email: 'vikram.p@example.com',
      phone: '+91 97110 55443'
    },
    createdAt: '2026-09-15T11:45:00Z',
    updatedAt: '2026-09-15T11:50:00Z',
    aiAnalysis: {
      urgencyScore: 74,
      severity: 'Medium',
      categoryDetected: 'Solid Waste & Sanitation',
      subCategory: 'Dumpster Overflow & Spillage',
      affectedGroups: ['Market Visitors', 'Food Vendors', 'Local Shopkeepers'],
      safetyRiskAssessment: 'Public health concern regarding pathogen spread and vector reproduction during humid weather.',
      estimatedImpactRadiusMeters: 150,
      recommendedDepartment: 'Solid Waste Management (SWM) - Zone East',
      actionableRecommendations: [
        'Deploy compactor truck on priority evening route for full clearance.',
        'Sanitize ground perimeter with lime powder disinfectant.',
        'Audit waste collection vehicle schedule for Sector 9.'
      ],
      potentialDuplicateOf: 'CIV-2026-8780'
    },
    timeline: [
      { step: 'Report Submitted', timestamp: '2026-09-15 11:45 AM', note: 'Report lodged with photographic proof.' },
      { step: 'AI Triage & Duplicate Check', timestamp: '2026-09-15 11:46 AM', note: 'Potential spatial duplicate detected with ticket CIV-2026-8780 (95% location match).' }
    ]
  },
  {
    id: 'CIV-2026-8772',
    title: 'Cluster of 5 Streetlights Inoperative on Ring Road',
    description: 'A 200-meter stretch of the outer service lane has been completely dark for three days due to tripped circuit breaker or damaged cable. Pedestrian crossing safety is severely compromised.',
    category: 'Street Lighting & Electrical',
    categoryId: 'lighting',
    status: 'Resolved',
    location: {
      address: 'Service Lane, Ring Road Pillar 42 to 47, Ward 14',
      ward: 'Ward 14 (Central)',
      city: 'Metro City',
      coordinates: { lat: 28.6180, lng: 77.1990 }
    },
    citizen: {
      name: 'Pooja Iyer',
      email: 'pooja.iyer@example.com',
      phone: '+91 98450 67890'
    },
    createdAt: '2026-09-12T19:20:00Z',
    updatedAt: '2026-09-14T14:30:00Z',
    aiAnalysis: {
      urgencyScore: 82,
      severity: 'High',
      categoryDetected: 'Street Lighting & Electrical',
      subCategory: 'Corridor Blackout',
      affectedGroups: ['Night Pedestrians', 'Female Commuters', 'Cyclists'],
      safetyRiskAssessment: 'Elevated crime risk and pedestrian-vehicle collision probability on unlit multi-lane service road.',
      recommendedDepartment: 'Electrical Department - Public Lighting Division',
      actionableRecommendations: [
        'Inspect Feeder Pillar FP-08 for relay trips or burnt fuse.',
        'Check underground junction box for cable moisture fault.',
        'Restore illumination before 18:00 sunset.'
      ],
      potentialDuplicateOf: null
    },
    timeline: [
      { step: 'Report Submitted', timestamp: '2026-09-12 07:20 PM', note: 'Reported by resident.' },
      { step: 'AI Triage', timestamp: '2026-09-12 07:21 PM', note: 'High safety risk flagged for night commuters.' },
      { step: 'Dispatched to Electrical Crew', timestamp: '2026-09-13 09:00 AM', note: 'Feeder pillar inspected.' },
      { step: 'Resolved & Verified', timestamp: '2026-09-14 02:30 PM', note: 'Faulty 63A MCB replaced. All 5 LED luminaires operational.' }
    ]
  },
  {
    id: 'CIV-2026-8760',
    title: 'Clogged Stormwater Drain Causing Road Waterlogging',
    description: 'Plastic bags and construction debris have completely blocked the open stormwater drain grille. Even light rain causes 6 inches of standing water on the main intersection.',
    category: 'Water Supply & Drainage',
    categoryId: 'water',
    status: 'In Progress',
    location: {
      address: 'Main Commercial Market Junction, Ward 5',
      ward: 'Ward 5 (West)',
      city: 'Metro City',
      coordinates: { lat: 28.6350, lng: 77.1850 }
    },
    citizen: {
      name: 'Rohan Sharma',
      email: 'rohan.s@example.com',
      phone: '+91 98765 43210'
    },
    createdAt: '2026-09-13T14:10:00Z',
    updatedAt: '2026-09-15T09:00:00Z',
    aiAnalysis: {
      urgencyScore: 78,
      severity: 'High',
      categoryDetected: 'Water Supply & Drainage',
      subCategory: 'Drain Blockage & Inundation',
      affectedGroups: ['Motorists', 'Shop Customers', 'Bus Passengers'],
      safetyRiskAssessment: 'Traffic gridlock and water damage to adjacent retail basements.',
      recommendedDepartment: 'Drainage & Stormwater Division',
      actionableRecommendations: [
        'Deploy suction-cum-jetting machine to clear silt and debris trap.',
        'Replace broken iron catch-pit grating.',
        'Inspect upstream discharge line.'
      ],
      potentialDuplicateOf: null
    },
    timeline: [
      { step: 'Report Submitted', timestamp: '2026-09-13 02:10 PM', note: 'Report filed with photo of clogged grille.' },
      { step: 'AI Triage Complete', timestamp: '2026-09-13 02:11 PM', note: 'Severity ranked High due to rain forecast.' },
      { step: 'Work In Progress', timestamp: '2026-09-15 09:00 AM', note: 'Jetting machine deployed on site.' }
    ]
  },
  {
    id: 'CIV-2026-8755',
    title: 'Damaged Roof at City Bus Transit Shelter',
    description: 'Heavy wind dislodged two corrugated fiber sheets from the public bus stop roof. Passenger waiting area is unprotected from heat and rain.',
    category: 'Public Transit & Traffic',
    categoryId: 'transit',
    status: 'Submitted',
    location: {
      address: 'Civic Centre Bus Stop, Outer Avenue, Ward 11',
      ward: 'Ward 11 (South)',
      city: 'Metro City',
      coordinates: { lat: 28.5900, lng: 77.2250 }
    },
    citizen: {
      name: 'Kavita Nair',
      email: 'kavita.n@example.com',
      phone: '+91 99887 76655'
    },
    createdAt: '2026-09-16T09:00:00Z',
    updatedAt: '2026-09-16T09:05:00Z',
    aiAnalysis: {
      urgencyScore: 58,
      severity: 'Medium',
      categoryDetected: 'Public Transit & Traffic',
      subCategory: 'Transit Shelter Structural Damage',
      affectedGroups: ['Daily Transit Passengers', 'Senior Citizens'],
      safetyRiskAssessment: 'Loose fiber sheets pose wind hazard. Loss of commuter shade.',
      recommendedDepartment: 'Urban Transport & Transit Authority',
      actionableRecommendations: [
        'Secure dangling sheet edges immediately.',
        'Procure replacement polycarbonate canopy panels.',
        'Check frame bolts for corrosion.'
      ],
      potentialDuplicateOf: null
    },
    timeline: [
      { step: 'Report Submitted', timestamp: '2026-09-16 09:00 AM', note: 'Filed via web portal.' },
      { step: 'AI Triage Complete', timestamp: '2026-09-16 09:05 AM', note: 'Queued for maintenance engineer review.' }
    ]
  }
];

// Admin KPI summary metrics
export const MOCK_ADMIN_METRICS = {
  totalComplaints: 1248,
  activeComplaints: 142,
  criticalUnresolved: 18,
  resolvedThisMonth: 1106,
  avgResolutionHours: 26.4,
  duplicateReductionPercent: 38.5,
  satisfactionScore: 4.6
};

// Analytics breakdown data
export const MOCK_CATEGORY_DISTRIBUTION = [
  { name: 'Roads & Footpaths', count: 412, active: 48, resolved: 364 },
  { name: 'Water & Drainage', count: 320, active: 39, resolved: 281 },
  { name: 'Solid Waste & Sanitation', count: 245, active: 24, resolved: 221 },
  { name: 'Street Lighting', count: 165, active: 16, resolved: 149 },
  { name: 'Public Transit', count: 72, active: 11, resolved: 61 },
  { name: 'Parks & Amenities', count: 34, active: 4, resolved: 30 }
];

export const MOCK_MONTHLY_TRENDS = [
  { month: 'Apr', complaints: 180, resolved: 165 },
  { month: 'May', complaints: 210, resolved: 190 },
  { month: 'Jun', complaints: 290, resolved: 260 },
  { month: 'Jul', complaints: 340, resolved: 310 },
  { month: 'Aug', complaints: 310, resolved: 295 },
  { month: 'Sep', complaints: 260, resolved: 240 }
];

export const MOCK_DEPARTMENT_PERFORMANCE = [
  { department: 'Public Works (PWD)', avgHours: 32, compliance: 91 },
  { department: 'Water Board (Jal Nigam)', avgHours: 18, compliance: 95 },
  { department: 'Solid Waste Mgmt', avgHours: 14, compliance: 96 },
  { department: 'Public Lighting Division', avgHours: 22, compliance: 93 },
  { department: 'Urban Transport Bureau', avgHours: 44, compliance: 84 }
];

export const MOCK_SEVERITY_BREAKDOWN = [
  { name: 'Critical', value: 18, color: '#ef4444' },
  { name: 'High', value: 46, color: '#f97316' },
  { name: 'Medium', value: 58, color: '#eab308' },
  { name: 'Low', value: 20, color: '#10b981' }
];

// Helper functions
export function getComplaints() {
  const stored = localStorage.getItem('civicai_complaints');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error(e);
    }
  }
  return MOCK_COMPLAINTS;
}

export function saveComplaints(complaints) {
  localStorage.setItem('civicai_complaints', JSON.stringify(complaints));
}

export function getComplaintById(id) {
  const all = getComplaints();
  return all.find(c => c.id === id) || null;
}

export function createComplaint(complaintData) {
  const all = getComplaints();
  const idNumber = Math.floor(8800 + Math.random() * 500);
  const newId = `CIV-2026-${idNumber}`;
  
  // Basic AI triage simulation
  const urgency = complaintData.severity === 'Critical' ? 90 : 
                  complaintData.severity === 'High' ? 78 : 
                  complaintData.severity === 'Medium' ? 55 : 30;

  const newComplaint = {
    id: newId,
    title: complaintData.title,
    description: complaintData.description,
    category: complaintData.category || 'Roads & Footpaths',
    categoryId: complaintData.categoryId || 'roads',
    status: 'Submitted',
    location: {
      address: complaintData.address || 'Civil Lines, Metro City',
      ward: complaintData.ward || 'Ward 14 (Central)',
      city: 'Metro City',
      coordinates: complaintData.coordinates || { lat: 28.6139, lng: 77.2090 }
    },
    citizen: {
      name: 'Rohan Sharma',
      email: 'rohan.s@example.com',
      phone: '+91 98765 43210'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    aiAnalysis: {
      urgencyScore: urgency,
      severity: complaintData.severity || 'Medium',
      categoryDetected: complaintData.category || 'Roads & Footpaths',
      subCategory: 'Automated Rapid Assessment',
      affectedGroups: ['Local Commuters', 'Area Residents'],
      safetyRiskAssessment: 'Automated initial intake analysis by CivicAI Triage Engine. Queued for field officer dispatch.',
      recommendedDepartment: 'Public Works & Municipal Services',
      actionableRecommendations: [
        'Verify geographic coordinates and conduct initial site inspection.',
        'Issue provisional dispatch order to ward technical crew.',
        'Update citizen with scheduled resolution ETA.'
      ],
      potentialDuplicateOf: null
    },
    timeline: [
      { step: 'Report Submitted', timestamp: new Date().toLocaleString(), note: 'Submitted via CivicAI Citizen Portal.' },
      { step: 'AI Triage Completed', timestamp: new Date().toLocaleString(), note: `Urgency scored ${urgency}/100.` }
    ]
  };

  const updated = [newComplaint, ...all];
  saveComplaints(updated);
  return newComplaint;
}
