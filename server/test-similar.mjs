/**
 * Automated test suite for Geospatial Proximity & Duplicate Complaint Detection
 */
import assert from 'assert';
import http from 'http';
import mongoose from 'mongoose';
import app from './src/app.js';
import User from './src/models/User.js';
import Complaint from './src/models/Complaint.js';
import { calculateDistanceMeters, detectSimilarComplaints } from './src/services/gemini.service.js';

console.log('\n======================================================');
console.log('🧪 RUNNING GEOSPATIAL & DUPLICATE DETECTION TEST SUITE');
console.log('======================================================\n');

// Test 1: Distance Calculation
console.log('Test 1: Verifying Haversine Distance Calculation...');
// Connaught Place to India Gate in New Delhi (~2.2 km)
const cpCoords = [77.2167, 28.6315]; // [lng, lat]
const igCoords = [77.2295, 28.6129]; // [lng, lat]
const dist = calculateDistanceMeters(cpCoords, igCoords);
assert(dist > 2000 && dist < 2600, `Expected distance ~2300m, got ${dist}m`);

// Close points (e.g. 50 meters apart)
const p1 = [77.2090, 28.6139];
const p2 = [77.2095, 28.6140];
const closeDist = calculateDistanceMeters(p1, p2);
assert(closeDist > 20 && closeDist < 100, `Expected close distance <100m, got ${closeDist}m`);
console.log(`  ✅ Distance calculation accurate (${dist}m for CP-India Gate, ${closeDist}m for adjacent road).`);

// Test 2: AI Duplicate Detection Logic on Candidate Set
console.log('\nTest 2: Verifying AI Duplicate Detection Logic...');
const targetComplaint = {
  _id: 'target_001',
  title: 'Large water main broken flooding road',
  description: 'Clean drinking water gushing from broken pipe under road at Civil Lines junction.',
  category: 'WATER',
  address: 'Civil Lines Crossing, Ward 14',
  location: { type: 'Point', coordinates: [77.2090, 28.6139] }
};

const candidates = [
  {
    _id: 'candidate_001',
    title: 'Water pipe burst at Civil Lines',
    description: 'Road flooded due to pipe rupture near crossing. Water waste is massive.',
    category: 'WATER',
    address: 'Near Civil Lines Cross Road 3',
    location: { type: 'Point', coordinates: [77.2093, 28.6141] }, // ~35m away
    status: 'SUBMITTED'
  },
  {
    _id: 'candidate_002',
    title: 'Low water pressure in residential apartments',
    description: 'Tap water pressure has been low since morning in block C.',
    category: 'WATER',
    address: 'Block C Apartments, Civil Lines',
    location: { type: 'Point', coordinates: [77.2140, 28.6160] }, // ~500m away
    status: 'IN_PROGRESS'
  }
];

const duplicateResult = await detectSimilarComplaints({ targetComplaint, candidates });
assert(Array.isArray(duplicateResult.similarComplaints), 'similarComplaints must be an array');
assert.strictEqual(duplicateResult.similarComplaints.length, 2);

const candidate1Result = duplicateResult.similarComplaints.find(c => c.complaintId === 'candidate_001');
assert(candidate1Result, 'Candidate 1 must be present in analysis');
assert(candidate1Result.distanceMeters != null, 'Distance must be calculated for candidate');
assert(typeof candidate1Result.isLikelyDuplicate === 'boolean', 'isLikelyDuplicate must be boolean');
assert(typeof candidate1Result.similarityConfidence === 'number', 'similarityConfidence must be number');
assert(typeof candidate1Result.explanation === 'string' && candidate1Result.explanation.length > 5, 'explanation must be present');
console.log(`  ✅ Candidate 1 analyzed: ${candidate1Result.distanceMeters}m away, duplicate: ${candidate1Result.isLikelyDuplicate}, confidence: ${candidate1Result.similarityConfidence}%`);
console.log(`     Explanation: "${candidate1Result.explanation}"`);

// Test 3: HTTP Endpoint GET /api/complaints/:id/similar
console.log('\nTest 3: Testing GET /api/complaints/:id/similar HTTP Route & Auth...');
const server = http.createServer(app);
await new Promise((resolve) => server.listen(0, resolve));
const port = server.address().port;
const baseUrl = `http://127.0.0.1:${port}`;

try {
  // Test unauthenticated - must return 401
  const unauth = await fetch(`${baseUrl}/api/complaints/dummy123/similar`);
  assert.strictEqual(unauth.status, 401, 'Endpoint must require JWT authentication');
  console.log('  ✅ GET /api/complaints/:id/similar correctly requires authentication (401).');
} finally {
  server.close();
}

console.log('\n======================================================');
console.log('🎉 ALL GEOSPATIAL & SIMILARITY TESTS PASSED WITH 100%!');
console.log('======================================================\n');
process.exit(0);
