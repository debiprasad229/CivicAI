import http from 'http';
import mongoose from 'mongoose';
import app from './src/app.js';
import User from './src/models/User.js';
import Complaint from './src/models/Complaint.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/civicai_hotspot_rec_test';

async function runHotspotRecommendationTestSuite() {
  console.log('🧪 Starting AI Hotspot Recommendation Test Suite...');
  await mongoose.connect(MONGO_URI);
  await User.deleteMany({});
  await Complaint.deleteMany({});

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // 1. Register Citizen and Admin
    const citizenRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Citizen A',
        email: 'citizena@civic.org',
        password: 'password123',
        role: 'citizen'
      })
    });
    const citizenData = await citizenRes.json();
    const citizenToken = citizenData.token;
    const citizenUser = citizenData.user;

    const adminRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Admin Chief',
        email: 'adminchief@municipal.gov.in',
        password: 'adminpassword123',
        role: 'admin'
      })
    });
    const adminData = await adminRes.json();
    const adminToken = adminData.token;

    // 2. Authorization Checks
    console.log('🔒 Testing Authorization: Unauthenticated 401...');
    const unauthRes = await fetch(`${baseUrl}/api/admin/hotspots/recommendation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hotspotId: 'test' })
    });
    if (unauthRes.status !== 401) {
      throw new Error(`Expected 401, got ${unauthRes.status}`);
    }

    console.log('🔒 Testing Authorization: Citizen 403 Forbidden...');
    const citizenAuthRes = await fetch(`${baseUrl}/api/admin/hotspots/recommendation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${citizenToken}`
      },
      body: JSON.stringify({ hotspotId: 'test' })
    });
    if (citizenAuthRes.status !== 403) {
      throw new Error(`Expected 403, got ${citizenAuthRes.status}`);
    }
    console.log('✅ Authorization enforcement verified.');

    // 3. Seed Hotspot Complaints
    console.log('📍 Seeding cluster of 3 high-severity water complaints in Connaught Place...');
    const clusterComplaints = [
      {
        title: 'Water main rupture flooding radial road',
        description: 'High pressure burst causing traffic disruption and loss of clean water',
        category: 'WATER',
        severity: 'CRITICAL',
        status: 'SUBMITTED',
        address: 'Radial Road 1, Connaught Place, New Delhi',
        location: { type: 'Point', coordinates: [77.2180, 28.6320] },
        createdBy: citizenUser.id
      },
      {
        title: 'Contaminated tap water with low pressure',
        description: 'Brownish sewage-mixed water flowing into commercial taps',
        category: 'WATER',
        severity: 'HIGH',
        status: 'UNDER_REVIEW',
        address: 'Block B, Connaught Place, New Delhi',
        location: { type: 'Point', coordinates: [77.2190, 28.6325] },
        createdBy: citizenUser.id
      },
      {
        title: 'Broken water supply pipe near subway entrance',
        description: 'Underground conduit leaking onto pedestrian footway',
        category: 'WATER',
        severity: 'HIGH',
        status: 'IN_PROGRESS',
        address: 'Regal Building, Connaught Place, New Delhi',
        location: { type: 'Point', coordinates: [77.2185, 28.6310] },
        createdBy: citizenUser.id
      }
    ];
    await Complaint.insertMany(clusterComplaints);

    // 4. Retrieve Hotspots to get real cluster
    const hotspotsRes = await fetch(`${baseUrl}/api/admin/hotspots`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const hotspotsData = await hotspotsRes.json();
    if (!hotspotsData.data.hotspots || hotspotsData.data.hotspots.length === 0) {
      throw new Error('Expected at least 1 hotspot cluster');
    }
    const detectedHotspot = hotspotsData.data.hotspots[0];
    console.log(`Detected Hotspot: ${detectedHotspot.id}, Dominant: ${detectedHotspot.dominantCategory}, Priority: ${detectedHotspot.priorityScore}/100`);

    // 5. Test POST /api/admin/hotspots/recommendation with sanitized hotspot payload
    console.log('🤖 Requesting AI Infrastructure Recommendation...');
    const recRes = await fetch(`${baseUrl}/api/admin/hotspots/recommendation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        hotspot: detectedHotspot
      })
    });

    if (recRes.status !== 200) {
      const errBody = await recRes.text();
      throw new Error(`Recommendation endpoint failed with status ${recRes.status}: ${errBody}`);
    }

    const recData = await recRes.json();
    console.log('AI Recommendation Response:', JSON.stringify(recData, null, 2));

    const rec = recData.data.recommendation;

    // Validate Required Return Fields
    if (!rec.recommendedIntervention || typeof rec.recommendedIntervention !== 'string') {
      throw new Error('Missing or invalid recommendedIntervention');
    }
    if (!rec.reason || typeof rec.reason !== 'string') {
      throw new Error('Missing or invalid reason');
    }
    if (!rec.expectedBenefit || typeof rec.expectedBenefit !== 'string') {
      throw new Error('Missing or invalid expectedBenefit');
    }
    if (!['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(rec.urgency)) {
      throw new Error(`Invalid urgency tier: ${rec.urgency}`);
    }

    // Validate Attribution & Disclaimer
    if (recData.data.attribution !== 'Based on available CivicAI complaint data') {
      throw new Error(`Invalid attribution: ${recData.data.attribution}`);
    }
    if (!recData.data.disclaimer.includes('authority verification')) {
      throw new Error('Missing authority verification in disclaimer');
    }

    console.log('✅ Structured schema and required fields validated.');

    // 6. Test by ID endpoint: POST /api/admin/hotspots/:id/recommendation
    console.log('🤖 Testing recommendation by Hotspot ID endpoint...');
    const byIdRes = await fetch(`${baseUrl}/api/admin/hotspots/${detectedHotspot.id}/recommendation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      }
    });
    if (byIdRes.status !== 200) {
      throw new Error(`Recommendation by ID failed with status ${byIdRes.status}`);
    }
    const byIdData = await byIdRes.json();
    if (!byIdData.data.recommendation.recommendedIntervention) {
      throw new Error('Recommendation by ID returned invalid data');
    }
    console.log('✅ Hotspot recommendation by ID endpoint passed.');

    console.log('🎉 ALL HOTSPOT RECOMMENDATION TESTS PASSED WITH 100% SUCCESS!');
  } finally {
    server.close();
    await mongoose.disconnect();
  }
}

runHotspotRecommendationTestSuite().catch((err) => {
  console.error('❌ Hotspot recommendation test failed:', err);
  process.exit(1);
});
