import http from 'http';
import mongoose from 'mongoose';
import app from './src/app.js';
import User from './src/models/User.js';
import Complaint from './src/models/Complaint.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/civicai_multilingual_test';

async function runMultilingualTestSuite() {
  console.log('🧪 Starting Multilingual Complaint Processing Test Suite (English, Hindi, Odia)...');
  await mongoose.connect(MONGO_URI);
  await User.deleteMany({});
  await Complaint.deleteMany({});

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // 1. Register test citizen user
    const citizenRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Multilingual Citizen',
        email: 'multilingual@civic.org',
        password: 'password123',
        role: 'citizen'
      })
    });
    const citizenData = await citizenRes.json();
    const token = citizenData.token;

    // ----------------------------------------------------
    // TEST 1: ENGLISH COMPLAINT
    // ----------------------------------------------------
    console.log('\n📝 Test 1: Submitting English Complaint...');
    const enPayload = {
      title: 'Deep pothole crater on Sector 4 arterial road',
      description: 'A hazardous deep pothole has formed near the main intersection causing vehicular damage and severe congestion.',
      category: 'ROAD',
      severity: 'HIGH',
      address: 'Main Road, Sector 4, New Delhi',
      location: { type: 'Point', coordinates: [77.21, 28.62] },
      affectedGroup: ['Daily Commuters', 'Bus Drivers']
    };

    const enRes = await fetch(`${baseUrl}/api/complaints`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(enPayload)
    });
    const enJson = await enRes.json();
    if (!enRes.ok || !enJson.success) {
      throw new Error(`Failed to submit English complaint: ${JSON.stringify(enJson)}`);
    }

    const enComplaintId = enJson.complaint._id || enJson.complaint.id;
    const enSaved = await Complaint.findById(enComplaintId);
    console.log(`  Saved Complaint #${enSaved._id}: language=${enSaved.language}, aiSummary="${enSaved.aiSummary}"`);

    if (enSaved.originalDescription !== enPayload.description) {
      throw new Error(`Expected originalDescription to match verbatim, got: "${enSaved.originalDescription}"`);
    }
    if (enSaved.description !== enPayload.description) {
      throw new Error(`Expected description to NEVER be overwritten, got: "${enSaved.description}"`);
    }
    if (enSaved.language !== 'en') {
      throw new Error(`Expected language 'en', got: "${enSaved.language}"`);
    }
    if (!enSaved.aiSummary || enSaved.aiSummary.length === 0) {
      throw new Error('Expected non-empty aiSummary');
    }
    console.log('  ✅ English complaint processed, preserved, and standardized.');

    // ----------------------------------------------------
    // TEST 2: HINDI (हिन्दी) COMPLAINT
    // ----------------------------------------------------
    console.log('\n📝 Test 2: Submitting Hindi (Devanagari) Complaint...');
    const hiPayload = {
      title: 'पानी की मुख्य पाइपलाइन फट गई है',
      description: 'सड़क पर पिछले 2 दिनों से पीने का साफ पानी लगातार बह रहा है और पूरी सड़क पर जलभराव हो गया है। कृपया जल्द मरम्मत करें।',
      category: 'WATER',
      severity: 'HIGH',
      address: 'गली नंबर 5, करोल बाग, नई दिल्ली',
      location: { type: 'Point', coordinates: [77.19, 28.65] },
      affectedGroup: ['स्थानीय निवासी', 'पैदल यात्री']
    };

    const hiRes = await fetch(`${baseUrl}/api/complaints`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(hiPayload)
    });
    const hiJson = await hiRes.json();
    if (!hiRes.ok || !hiJson.success) {
      throw new Error(`Failed to submit Hindi complaint: ${JSON.stringify(hiJson)}`);
    }

    const hiComplaintId = hiJson.complaint._id || hiJson.complaint.id;
    const hiSaved = await Complaint.findById(hiComplaintId);
    console.log(`  Saved Complaint #${hiSaved._id}: language=${hiSaved.language}`);
    console.log(`  Original Description: "${hiSaved.originalDescription}"`);
    console.log(`  Standardized English Summary: "${hiSaved.aiSummary}"`);

    // Verify original Hindi text is strictly preserved and NEVER overwritten
    if (hiSaved.originalDescription !== hiPayload.description) {
      throw new Error(`Expected originalDescription to preserve Hindi text verbatim. Got: "${hiSaved.originalDescription}"`);
    }
    if (hiSaved.description !== hiPayload.description) {
      throw new Error(`Expected description to NEVER be overwritten with translation. Got: "${hiSaved.description}"`);
    }
    // Verify language detection
    if (hiSaved.language !== 'hi') {
      throw new Error(`Expected language to be detected as 'hi', got: "${hiSaved.language}"`);
    }
    // Verify category classification
    if (hiSaved.category !== 'WATER') {
      throw new Error(`Expected category 'WATER', got: "${hiSaved.category}"`);
    }
    // Verify standardized English summary was generated
    if (!hiSaved.aiSummary || hiSaved.aiSummary.length === 0) {
      throw new Error('Expected non-empty standardized English aiSummary for Hindi complaint');
    }
    console.log('  ✅ Hindi complaint detected, original Hindi preserved, standardized English summary created.');

    // ----------------------------------------------------
    // TEST 3: ODIA (ଓଡ଼ିଆ) COMPLAINT
    // ----------------------------------------------------
    console.log('\n📝 Test 3: Submitting Odia (Odia Script) Complaint...');
    const orPayload = {
      title: 'ମୁଖ୍ୟ ରାସ୍ତାରେ ବିରାଟ ଖାଲ ଏବଂ ଦୁର୍ଘଟଣା ଆଶଙ୍କା',
      description: 'ମୁଖ୍ୟ ରାସ୍ତା ଉପରେ ବଡ଼ ଖାଲ ସୃଷ୍ଟି ହୋଇଛି ଏବଂ ଯାତାୟାତରେ ଗୁରୁତର ସମସ୍ୟା ଉପୁଜିଛି, ଗାଡ଼ି ଚାଳକମାନେ ଖସି ପଡ଼ୁଛନ୍ତି।',
      category: 'ROAD',
      severity: 'HIGH',
      address: 'ସହିଦ ନଗର, ଭୁବନେଶ୍ୱର',
      location: { type: 'Point', coordinates: [85.83, 20.29] },
      affectedGroup: ['ଯାତ୍ରୀ', 'ସାଧାରଣ ଜନତା']
    };

    const orRes = await fetch(`${baseUrl}/api/complaints`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(orPayload)
    });
    const orJson = await orRes.json();
    if (!orRes.ok || !orJson.success) {
      throw new Error(`Failed to submit Odia complaint: ${JSON.stringify(orJson)}`);
    }

    const orComplaintId = orJson.complaint._id || orJson.complaint.id;
    const orSaved = await Complaint.findById(orComplaintId);
    console.log(`  Saved Complaint #${orSaved._id}: language=${orSaved.language}`);
    console.log(`  Original Description: "${orSaved.originalDescription}"`);
    console.log(`  Standardized English Summary: "${orSaved.aiSummary}"`);

    // Verify original Odia text is strictly preserved and NEVER overwritten
    if (orSaved.originalDescription !== orPayload.description) {
      throw new Error(`Expected originalDescription to preserve Odia text verbatim. Got: "${orSaved.originalDescription}"`);
    }
    if (orSaved.description !== orPayload.description) {
      throw new Error(`Expected description to NEVER be overwritten with translation. Got: "${orSaved.description}"`);
    }
    // Verify language detection
    if (orSaved.language !== 'or') {
      throw new Error(`Expected language to be detected as 'or', got: "${orSaved.language}"`);
    }
    // Verify category classification
    if (orSaved.category !== 'ROAD') {
      throw new Error(`Expected category 'ROAD', got: "${orSaved.category}"`);
    }
    // Verify standardized English summary was generated
    if (!orSaved.aiSummary || orSaved.aiSummary.length === 0) {
      throw new Error('Expected non-empty standardized English aiSummary for Odia complaint');
    }
    console.log('  ✅ Odia complaint detected, original Odia preserved, standardized English summary created.');

    // ----------------------------------------------------
    // TEST 4: GET /api/complaints/:id INTEGRITY
    // ----------------------------------------------------
    console.log('\n🔍 Test 4: Verifying GET /api/complaints/:id Response Integrity...');
    const fetchOrRes = await fetch(`${baseUrl}/api/complaints/${orComplaintId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const fetchOrData = await fetchOrRes.json();
    const comp = fetchOrData.complaint || fetchOrData.data;

    if (!comp) {
      throw new Error('Complaint details not returned');
    }
    if (comp.language !== 'or') {
      throw new Error(`Expected returned complaint language 'or', got '${comp.language}'`);
    }
    if (!comp.originalDescription || comp.originalDescription !== orPayload.description) {
      throw new Error(`Expected returned originalDescription to match Odia text`);
    }
    if (!comp.aiSummary) {
      throw new Error(`Expected returned aiSummary in details`);
    }
    console.log('  ✅ GET /api/complaints/:id returned originalDescription, language, and aiSummary faithfully.');

    console.log('\n🎉 ALL MULTILINGUAL COMPLAINT TESTS (ENGLISH, HINDI, ODIA) PASSED WITH 100% SUCCESS!\n');
  } finally {
    server.close();
    await mongoose.connection.close();
  }
}

runMultilingualTestSuite().catch((err) => {
  console.error('\n❌ Multilingual Test Suite Failed:', err);
  process.exit(1);
});
