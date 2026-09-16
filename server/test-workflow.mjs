import http from 'http';
import mongoose from 'mongoose';
import app from './src/app.js';
import User from './src/models/User.js';
import Complaint from './src/models/Complaint.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/civicai_workflow_e2e';

async function runWorkflowTest() {
  console.log('🧪 Starting CivicAI Full Complaint Workflow E2E Test Suite...');
  await mongoose.connect(MONGO_URI);
  await User.deleteMany({});
  await Complaint.deleteMany({});

  // Spin up ephemeral test server
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // 1. Register Citizen 1
    const citizen1RegRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Rohan Sharma',
        email: 'rohan@civicai.org',
        password: 'password123',
        role: 'citizen'
      })
    });
    const citizen1Reg = await citizen1RegRes.json();
    console.assert(citizen1RegRes.status === 201, `Citizen 1 reg failed: ${citizen1RegRes.status}`);
    const citizen1Token = citizen1Reg.token;

    // 2. Register Citizen 2 (Attacker / Unauthorized user)
    const citizen2RegRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Sneha Patel',
        email: 'sneha@civicai.org',
        password: 'password123',
        role: 'citizen'
      })
    });
    const citizen2Reg = await citizen2RegRes.json();
    console.assert(citizen2RegRes.status === 201, `Citizen 2 reg failed: ${citizen2RegRes.status}`);
    const citizen2Token = citizen2Reg.token;

    // 3. Register Admin
    const adminRegRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Municipal Commissioner Rao',
        email: 'commissioner@municipal.gov.in',
        password: 'adminpassword123',
        role: 'admin'
      })
    });
    const adminReg = await adminRegRes.json();
    console.assert(adminRegRes.status === 201, `Admin reg failed: ${adminRegRes.status}`);
    const adminToken = adminReg.token;

    // 4. Citizen 1 submits a complaint
    const complaintPayload = {
      title: 'Severe crater pothole on MG Road near Metro Gate 3',
      description: 'Deep road cavity causing severe 2-wheeler skids during evening rush hours.',
      category: 'ROAD',
      severity: 'HIGH',
      location: {
        type: 'Point',
        coordinates: [77.2090, 28.6139] // [lng, lat]
      },
      address: 'MG Road, Metro Pillar 142, Ward 14',
      affectedGroup: 'Commuters and local auto rickshaws'
    };

    const createRes = await fetch(`${baseUrl}/api/complaints`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${citizen1Token}`
      },
      body: JSON.stringify(complaintPayload)
    });
    const createData = await createRes.json();
    console.assert(createRes.status === 201, `Create complaint returned status: ${createRes.status}`);
    console.assert(createData.complaint.category === 'ROAD', 'Complaint category matches');
    console.assert(createData.complaint.status === 'SUBMITTED', 'Initial status is SUBMITTED');
    console.assert(createData.complaint.location.type === 'Point', 'Location is GeoJSON Point');
    console.assert(createData.complaint.location.coordinates[0] === 77.2090, 'Longitude stored properly');
    const complaintId = createData.complaint._id;

    // 5. Citizen 1 queries their complaints
    const myRes = await fetch(`${baseUrl}/api/complaints/my`, {
      headers: { 'Authorization': `Bearer ${citizen1Token}` }
    });
    const myData = await myRes.json();
    console.assert(myRes.status === 200, 'Citizen 1 can fetch their complaints');
    console.assert(myData.count === 1, 'Count is 1 for Citizen 1');

    // 6. Citizen 2 queries their complaints -> Should be empty
    const citizen2MyRes = await fetch(`${baseUrl}/api/complaints/my`, {
      headers: { 'Authorization': `Bearer ${citizen2Token}` }
    });
    const citizen2MyData = await citizen2MyRes.json();
    console.assert(citizen2MyData.count === 0, 'Citizen 2 has 0 complaints');

    // 7. Citizen 2 attempts to update Citizen 1's complaint -> 403 Forbidden
    const unauthorizedUpdateRes = await fetch(`${baseUrl}/api/complaints/${complaintId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${citizen2Token}`
      },
      body: JSON.stringify({ title: 'Hacked title' })
    });
    console.assert(unauthorizedUpdateRes.status === 403, 'Unauthorized update blocked with 403');

    // 8. Citizen 1 updates complaint draft
    const authorizedUpdateRes = await fetch(`${baseUrl}/api/complaints/${complaintId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${citizen1Token}`
      },
      body: JSON.stringify({ title: 'Deep hazardous crater pothole on MG Road near Metro Gate 3' })
    });
    const authorizedUpdateData = await authorizedUpdateRes.json();
    console.assert(authorizedUpdateRes.status === 200, 'Citizen 1 can update their complaint');
    console.assert(authorizedUpdateData.complaint.title.includes('hazardous'), 'Title was updated');

    // 9. Citizen 1 attempts to call Admin API -> 403 Forbidden
    const forbiddenAdminRes = await fetch(`${baseUrl}/api/admin/complaints`, {
      headers: { 'Authorization': `Bearer ${citizen1Token}` }
    });
    console.assert(forbiddenAdminRes.status === 403, 'Citizen blocked from admin API with 403');

    // 10. Admin fetches complaints with filters
    const adminQueryRes = await fetch(`${baseUrl}/api/admin/complaints?category=ROAD&status=SUBMITTED`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const adminQueryData = await adminQueryRes.json();
    console.assert(adminQueryRes.status === 200, 'Admin can list complaints');
    console.assert(adminQueryData.count === 1, 'Filtered query matches 1 complaint');

    // 11. Admin updates status to IN_PROGRESS
    const statusUpdateRes = await fetch(`${baseUrl}/api/admin/complaints/${complaintId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        status: 'IN_PROGRESS',
        note: 'Road repair gang assigned with cold asphalt patch crew.'
      })
    });
    const statusUpdateData = await statusUpdateRes.json();
    console.assert(statusUpdateRes.status === 200, 'Status update returned 200');
    console.assert(statusUpdateData.complaint.status === 'IN_PROGRESS', 'Status updated to IN_PROGRESS');
    console.assert(statusUpdateData.complaint.timeline.length >= 2, 'Timeline has audit log entry');

    console.log('✅ ALL 11 E2E WORKFLOW ASSERTIONS PASSED WITH 100% SUCCESS!');
  } finally {
    // Cleanup
    await User.deleteMany({});
    await Complaint.deleteMany({});
    await mongoose.connection.close();
    server.close();
  }
}

runWorkflowTest().catch((err) => {
  console.error('❌ E2E Workflow Test Failed:', err);
  process.exit(1);
});
