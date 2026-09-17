import http from 'http';
import mongoose from 'mongoose';
import app from './src/app.js';
import User from './src/models/User.js';
import Complaint from './src/models/Complaint.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/civicai_analytics_test';

async function runAnalyticsTests() {
  console.log('🧪 Starting Admin Analytics Intelligence Test Suite...');
  await mongoose.connect(MONGO_URI);
  await User.deleteMany({});
  await Complaint.deleteMany({});

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // 1. Create a Citizen
    const citizenRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Citizen Test',
        email: 'citizen@test.org',
        password: 'password123',
        role: 'citizen'
      })
    });
    const citizenData = await citizenRes.json();
    const citizenToken = citizenData.token;
    const citizenUser = citizenData.user;

    // 2. Create an Admin
    const adminRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Admin Test',
        email: 'admin@gov.org',
        password: 'password123',
        role: 'admin'
      })
    });
    const adminData = await adminRes.json();
    const adminToken = adminData.token;

    // 3. Verify Unauthenticated returns 401
    console.log('🔒 Testing Authorization: Unauthenticated requests return 401...');
    const unauthRes = await fetch(`${baseUrl}/api/admin/analytics/overview`);
    if (unauthRes.status !== 401) {
      throw new Error(`Expected 401 for unauthenticated, got ${unauthRes.status}`);
    }

    // 4. Verify Citizen role returns 403
    console.log('🔒 Testing Authorization: Citizen token returns 403 Forbidden...');
    const citizenAuthRes = await fetch(`${baseUrl}/api/admin/analytics/overview`, {
      headers: { Authorization: `Bearer ${citizenToken}` }
    });
    if (citizenAuthRes.status !== 403) {
      throw new Error(`Expected 403 for citizen, got ${citizenAuthRes.status}`);
    }

    // 5. Seed Test Complaints
    console.log('📊 Seeding test complaints across categories, severities, and locations...');
    const testComplaints = [
      {
        title: 'Massive pothole on Inner Circle',
        description: 'Deep road crater causing traffic disruption',
        category: 'ROAD',
        severity: 'CRITICAL',
        status: 'SUBMITTED',
        address: 'Connaught Place, New Delhi',
        location: { type: 'Point', coordinates: [77.2185, 28.6315] },
        createdBy: citizenUser.id
      },
      {
        title: 'Broken water main leaking onto pavement',
        description: 'Fresh water flooding the market entrance',
        category: 'WATER',
        severity: 'HIGH',
        status: 'UNDER_REVIEW',
        address: 'Connaught Place, New Delhi',
        location: { type: 'Point', coordinates: [77.2190, 28.6320] },
        createdBy: citizenUser.id
      },
      {
        title: 'Flickering street lamp near bus stand',
        description: 'Dark stretch dangerous for commuters',
        category: 'STREET_LIGHT',
        severity: 'LOW',
        status: 'RESOLVED',
        address: 'Karol Bagh, New Delhi',
        location: { type: 'Point', coordinates: [77.1900, 28.6500] },
        createdBy: citizenUser.id
      },
      {
        title: 'Blocked stormwater drain overflowing',
        description: 'Heavy smell and stagnation',
        category: 'DRAINAGE',
        severity: 'MEDIUM',
        status: 'IN_PROGRESS',
        address: 'Karol Bagh, New Delhi',
        location: { type: 'Point', coordinates: [77.1910, 28.6510] },
        createdBy: citizenUser.id
      },
      {
        title: 'Garbage dumpster overflowing in colony park',
        description: 'Waste scattered on walkway',
        category: 'WASTE',
        severity: 'HIGH',
        status: 'RESOLVED',
        address: 'Hauz Khas, New Delhi',
        location: { type: 'Point', coordinates: [77.2050, 28.5490] },
        createdBy: citizenUser.id
      }
    ];

    await Complaint.insertMany(testComplaints);

    // 6. Test GET /api/admin/analytics/overview
    console.log('📈 Testing GET /api/admin/analytics/overview...');
    const overviewRes = await fetch(`${baseUrl}/api/admin/analytics/overview`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    if (overviewRes.status !== 200) {
      throw new Error(`Overview endpoint failed with status ${overviewRes.status}`);
    }
    const overview = await overviewRes.json();
    console.log('Overview response:', overview.data);

    if (overview.data.total !== 5) {
      throw new Error(`Expected total 5, got ${overview.data.total}`);
    }
    if (overview.data.submitted !== 1) {
      throw new Error(`Expected submitted 1, got ${overview.data.submitted}`);
    }
    if (overview.data.underReview !== 1) {
      throw new Error(`Expected underReview 1, got ${overview.data.underReview}`);
    }
    if (overview.data.inProgress !== 1) {
      throw new Error(`Expected inProgress 1, got ${overview.data.inProgress}`);
    }
    if (overview.data.resolved !== 2) {
      throw new Error(`Expected resolved 2, got ${overview.data.resolved}`);
    }
    if (overview.data.pending !== 2) { // 1 submitted + 1 underReview
      throw new Error(`Expected pending 2, got ${overview.data.pending}`);
    }
    if (overview.data.highCritical !== 3) { // 1 CRITICAL + 2 HIGH
      throw new Error(`Expected highCritical 3, got ${overview.data.highCritical}`);
    }
    if (!Array.isArray(overview.data.topAreas) || overview.data.topAreas.length === 0) {
      throw new Error('Expected topAreas array in overview');
    }
    console.log('✅ Overview endpoint passed all metric assertions.');

    // 7. Test GET /api/admin/analytics/categories
    console.log('📈 Testing GET /api/admin/analytics/categories...');
    const catRes = await fetch(`${baseUrl}/api/admin/analytics/categories`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    if (catRes.status !== 200) {
      throw new Error(`Categories endpoint failed with status ${catRes.status}`);
    }
    const catData = await catRes.json();
    if (!Array.isArray(catData.data.categories)) {
      throw new Error('Expected categories array');
    }
    const roadCat = catData.data.categories.find(c => c.category === 'ROAD');
    if (!roadCat || roadCat.count !== 1) {
      throw new Error(`Expected ROAD count 1, got ${roadCat?.count}`);
    }
    console.log('✅ Categories endpoint passed.');

    // 8. Test GET /api/admin/analytics/severity
    console.log('📈 Testing GET /api/admin/analytics/severity...');
    const sevRes = await fetch(`${baseUrl}/api/admin/analytics/severity`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    if (sevRes.status !== 200) {
      throw new Error(`Severity endpoint failed with status ${sevRes.status}`);
    }
    const sevData = await sevRes.json();
    if (!Array.isArray(sevData.data.severities)) {
      throw new Error('Expected severities array');
    }
    const criticalSev = sevData.data.severities.find(s => s.severity === 'CRITICAL');
    if (!criticalSev || criticalSev.count !== 1) {
      throw new Error(`Expected CRITICAL count 1, got ${criticalSev?.count}`);
    }
    console.log('✅ Severity endpoint passed.');

    // 9. Test GET /api/admin/analytics/trends
    console.log('📈 Testing GET /api/admin/analytics/trends...');
    const trendsRes = await fetch(`${baseUrl}/api/admin/analytics/trends?days=7`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    if (trendsRes.status !== 200) {
      throw new Error(`Trends endpoint failed with status ${trendsRes.status}`);
    }
    const trendsData = await trendsRes.json();
    if (!Array.isArray(trendsData.data.trends) || trendsData.data.trends.length !== 7) {
      throw new Error(`Expected 7 trend days, got ${trendsData.data?.trends?.length}`);
    }
    console.log('✅ Trends endpoint passed.');

    console.log('🎉 ALL ADMIN ANALYTICS TESTS PASSED SUCCESSFULLY!');
  } finally {
    server.close();
    await mongoose.disconnect();
  }
}

runAnalyticsTests().catch((err) => {
  console.error('❌ Analytics test failed:', err);
  process.exit(1);
});
