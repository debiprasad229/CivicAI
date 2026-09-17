import http from 'http';
import mongoose from 'mongoose';
import app from './src/app.js';
import User from './src/models/User.js';
import Complaint from './src/models/Complaint.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/civicai_hotspots_test';

async function runHotspotsTestSuite() {
  console.log('🧪 Starting Geographic Hotspots Detection Test Suite...');
  await mongoose.connect(MONGO_URI);
  await User.deleteMany({});
  await Complaint.deleteMany({});

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // 1. Register Citizen & Admin
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
        name: 'Admin B',
        email: 'adminb@municipal.gov.in',
        password: 'adminpassword123',
        role: 'admin'
      })
    });
    const adminData = await adminRes.json();
    const adminToken = adminData.token;

    // 2. Security Checks: 401 Unauthenticated & 403 Citizen
    console.log('🔒 Testing Authorization: Unauthenticated 401...');
    const unauthRes = await fetch(`${baseUrl}/api/admin/hotspots`);
    if (unauthRes.status !== 401) {
      throw new Error(`Expected 401, got ${unauthRes.status}`);
    }

    console.log('🔒 Testing Authorization: Citizen 403...');
    const citizenAuthRes = await fetch(`${baseUrl}/api/admin/hotspots`, {
      headers: { Authorization: `Bearer ${citizenToken}` }
    });
    if (citizenAuthRes.status !== 403) {
      throw new Error(`Expected 403, got ${citizenAuthRes.status}`);
    }

    // 3. Isolated Complaints Test: Do NOT treat individual complaints as hotspots
    console.log('📍 Testing Isolated Complaints: Verify individual complaints are NOT treated as hotspots...');
    const isolatedComplaints = [
      {
        title: 'Single pothole in Rohini Sector 11',
        description: 'Pothole on neighborhood lane',
        category: 'ROAD',
        severity: 'LOW',
        status: 'SUBMITTED',
        address: 'Rohini Sector 11, New Delhi',
        location: { type: 'Point', coordinates: [77.1150, 28.7250] },
        createdBy: citizenUser.id
      },
      {
        title: 'Single flickering light in Dwarka Sector 6',
        description: 'Single light pole issue',
        category: 'STREET_LIGHT',
        severity: 'LOW',
        status: 'SUBMITTED',
        address: 'Dwarka Sector 6, New Delhi',
        location: { type: 'Point', coordinates: [77.0600, 28.5850] }, // > 20 km away
        createdBy: citizenUser.id
      }
    ];
    await Complaint.insertMany(isolatedComplaints);

    const isolatedRes = await fetch(`${baseUrl}/api/admin/hotspots`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const isolatedData = await isolatedRes.json();
    if (isolatedData.data.hotspots.length !== 0) {
      throw new Error(`Expected 0 hotspots for isolated complaints, got ${isolatedData.data.hotspots.length}`);
    }
    console.log('✅ Passed: Single isolated complaints are NOT treated as hotspots.');

    // 4. Seed Cluster of 3 complaints in Connaught Place within 250m
    console.log('🔥 Testing Clustered Complaints: Seeding 3 complaints in Connaught Place...');
    const clusterConnaught = [
      {
        title: 'Water main rupture flooding radial road',
        description: 'High pressure burst',
        category: 'WATER',
        severity: 'CRITICAL',
        status: 'SUBMITTED',
        address: 'Radial Road 1, Connaught Place, New Delhi',
        location: { type: 'Point', coordinates: [77.2180, 28.6320] },
        createdBy: citizenUser.id
      },
      {
        title: 'Contaminated tap water with low pressure',
        description: 'Brownish sewage mixed water',
        category: 'WATER',
        severity: 'HIGH',
        status: 'UNDER_REVIEW',
        address: 'Block B, Connaught Place, New Delhi',
        location: { type: 'Point', coordinates: [77.2190, 28.6325] },
        createdBy: citizenUser.id
      },
      {
        title: 'Broken footpath pavers near subway entrance',
        description: 'Broken tiles causing tripping hazard',
        category: 'ROAD',
        severity: 'MEDIUM',
        status: 'IN_PROGRESS',
        address: 'Regal Building, Connaught Place, New Delhi',
        location: { type: 'Point', coordinates: [77.2185, 28.6310] },
        createdBy: citizenUser.id
      }
    ];
    await Complaint.insertMany(clusterConnaught);

    const clusterRes = await fetch(`${baseUrl}/api/admin/hotspots`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const clusterData = await clusterRes.json();
    console.log('Hotspots response:', JSON.stringify(clusterData.data.hotspots, null, 2));

    if (clusterData.data.hotspots.length !== 1) {
      throw new Error(`Expected exactly 1 hotspot, got ${clusterData.data.hotspots.length}`);
    }

    const cp = clusterData.data.hotspots[0];

    // Assert required fields
    if (typeof cp.latitude !== 'number' || typeof cp.longitude !== 'number') {
      throw new Error('Expected numeric latitude and longitude');
    }
    if (cp.complaintCount !== 3) {
      throw new Error(`Expected complaintCount 3, got ${cp.complaintCount}`);
    }
    if (cp.highPriorityCount !== 2) { // 1 CRITICAL + 1 HIGH
      throw new Error(`Expected highPriorityCount 2, got ${cp.highPriorityCount}`);
    }
    if (cp.dominantCategory !== 'WATER') {
      throw new Error(`Expected dominantCategory WATER, got ${cp.dominantCategory}`);
    }
    if (typeof cp.priorityScore !== 'number' || cp.priorityScore < 0 || cp.priorityScore > 100) {
      throw new Error(`Expected priorityScore between 0-100, got ${cp.priorityScore}`);
    }
    console.log(`✅ Connaught Place hotspot detected with Priority Score: ${cp.priorityScore}/100`);

    // 5. Seed another cluster of 2 complaints in Hauz Khas
    console.log('🔥 Seeding secondary cluster in Hauz Khas...');
    const clusterHauzKhas = [
      {
        title: 'Open storm drain backing up',
        description: 'Flooding lane',
        category: 'DRAINAGE',
        severity: 'CRITICAL',
        status: 'SUBMITTED',
        address: 'Hauz Khas Village, New Delhi',
        location: { type: 'Point', coordinates: [77.1950, 28.5520] },
        createdBy: citizenUser.id
      },
      {
        title: 'Blocked sewer manhole cover overflowing',
        description: 'Foul odor and stagnation',
        category: 'DRAINAGE',
        severity: 'HIGH',
        status: 'SUBMITTED',
        address: 'Hauz Khas Market, New Delhi',
        location: { type: 'Point', coordinates: [77.1955, 28.5525] },
        createdBy: citizenUser.id
      }
    ];
    await Complaint.insertMany(clusterHauzKhas);

    const twoHotspotsRes = await fetch(`${baseUrl}/api/admin/hotspots`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const twoHotspotsData = await twoHotspotsRes.json();
    if (twoHotspotsData.data.hotspots.length !== 2) {
      throw new Error(`Expected 2 hotspots, got ${twoHotspotsData.data.hotspots.length}`);
    }

    // Verify formula documentation is returned
    if (!twoHotspotsData.data.formulaDocumentation) {
      throw new Error('Expected formulaDocumentation in response');
    }

    console.log('✅ Both hotspots detected and verified!');
    console.log('🎉 ALL GEOGRAPHIC HOTSPOT TESTS PASSED WITH 100% SUCCESS!');

  } finally {
    server.close();
    await mongoose.disconnect();
  }
}

runHotspotsTestSuite().catch((err) => {
  console.error('❌ Hotspot test suite failed:', err);
  process.exit(1);
});
