/**
 * CivicAI Development-Only Seed Script
 * 
 * Generates realistic but strictly FICTIONAL demonstration grievances across Bhubaneswar,
 * including Patia, Khandagiri, Rasulgarh, Saheed Nagar, Jaydev Vihar, Old Town, and Chandrasekharpur.
 * 
 * DISCLAIMER:
 * These records are fictional synthetic data for development, UI testing, and GIS clustering verification.
 * They must NEVER be presented as real government or citizen data.
 * All seeded records have `isDemo: true`.
 * 
 * Production Guard:
 * Script aborts immediately if NODE_ENV === 'production'.
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Complaint from './models/Complaint.js';

dotenv.config();

// STRICT PRODUCTION GUARD
if (process.env.NODE_ENV === 'production') {
  console.error('\n🚫 ERROR: SEED SCRIPT ABORTED!');
  console.error('Cannot run seed script in production environment. This is for local development only.\n');
  process.exit(1);
}

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/civic_ai';

// Helper to compute past dates for historical trend curves
const getDateDaysAgo = (daysAgo, hourOffset = 10) => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(hourOffset, Math.floor(Math.random() * 60), 0, 0);
  return date;
};

// Realistic Fictional Seed Dataset across Bhubaneswar
const BHUBANESWAR_DEMO_COMPLAINTS = [
  // ==========================================
  // CLUSTER 1: PATIA / KIIT SQUARE (Hotspot: Drainage & Waterlogging)
  // ==========================================
  {
    title: 'Severe drainage overflow blocking KIIT Road service lane',
    description: 'The stormwater drain near KIIT square is clogged with silt and plastic debris, causing foul wastewater to spill onto the main carriage road and disrupting vehicular movement.',
    originalDescription: 'The stormwater drain near KIIT square is clogged with silt and plastic debris, causing foul wastewater to spill onto the main carriage road and disrupting vehicular movement.',
    category: 'DRAINAGE',
    severity: 'CRITICAL',
    status: 'IN_PROGRESS',
    language: 'en',
    aiSummary: 'Clogged stormwater canal near KIIT Road overflowing foul wastewater onto active carriage lanes, creating serious pedestrian and traffic disruption.',
    address: 'Near KIIT Square, Patia, Bhubaneswar, Odisha 751024',
    location: { type: 'Point', coordinates: [85.8182, 20.3552] },
    affectedGroup: ['University Students', 'Local Commuters', 'Shop Owners'],
    daysAgo: 2,
    urgencyScore: 92,
    reasoning: 'Active overflow onto arterial thoroughfare creates severe sanitary hazard and traffic gridlock.'
  },
  {
    title: 'Stagnant wastewater pooling behind Patia residential colony',
    description: 'Persistent waterlogging behind residential apartments for the past 5 days. Water is not draining into the municipal outlet, raising severe dengue and malaria mosquito risks.',
    originalDescription: 'Persistent waterlogging behind residential apartments for the past 5 days. Water is not draining into the municipal outlet, raising severe dengue and malaria mosquito risks.',
    category: 'DRAINAGE',
    severity: 'HIGH',
    status: 'UNDER_REVIEW',
    language: 'en',
    aiSummary: 'Stagnant sewage pooling behind Patia residential apartments due to blocked municipal outflow, creating acute vector-borne disease risks.',
    address: 'Lane 4, Patia Station Road, Bhubaneswar, Odisha 751024',
    location: { type: 'Point', coordinates: [85.8178, 20.3548] },
    affectedGroup: ['Apartment Residents', 'Children'],
    daysAgo: 4,
    urgencyScore: 78,
    reasoning: 'Multi-day wastewater stagnation creates vector breeding grounds near high-density housing.'
  },
  {
    title: 'ପଟିଆ ଛକ ନିକଟରେ ଡ୍ରେନେଜ୍ ପାଣି ଜମି ରହିଛି ଏବଂ ଦୁର୍ଗନ୍ଧ ହେଉଛି',
    description: 'ପଟିଆ ମୁଖ୍ୟ ଛକ ପାଖରେ ଥିବା ଡ୍ରେନ୍ ଭାଙ୍ଗି ଯାଇଛି, ଯାହା ଫଳରେ ଗତ ତିନି ଦିନ ହେବ ରାସ୍ତା ଉପରେ ଦୁର୍ଗନ୍ଧଯୁକ୍ତ ପାଣି ଜମି ରହିଛି ଏବଂ ପଦଯାତ୍ରୀମାନେ ଚାଲିପାରୁ ନାହାନ୍ତି।',
    originalDescription: 'ପଟିଆ ମୁଖ୍ୟ ଛକ ପାଖରେ ଥିବା ଡ୍ରେନ୍ ଭାଙ୍ disputeି ଯାଇଛି, ଯାହା ଫଳରେ ଗତ ତିନି ଦିନ ହେବ ରାସ୍ତା ଉପରେ ଦୁର୍ଗନ୍ଧଯୁକ୍ତ ପାଣି ଜମି ରହିଛି ଏବଂ ପଦଯାତ୍ରୀମାନେ ଚାଲିପାରୁ ନାହାନ୍ତି।',
    category: 'DRAINAGE',
    severity: 'HIGH',
    status: 'SUBMITTED',
    language: 'or',
    aiSummary: 'Broken drainage conduit at Patia intersection causing sewage overflow onto walkway for 3 days, obstructing pedestrian movement.',
    address: 'Near Big Bazaar, Patia Square, Bhubaneswar, Odisha 751024',
    location: { type: 'Point', coordinates: [85.8185, 20.3555] },
    affectedGroup: ['ପଦଯାତ୍ରୀ', 'ସ୍ଥାନୀୟ ଦୋକାନୀ'],
    daysAgo: 1,
    urgencyScore: 82,
    reasoning: 'Broken drainage infrastructure spilling sewage into busy commercial precinct.'
  },
  {
    title: 'Waterlogged electrical transformer base near Patia bus stop',
    description: 'The street transformer foundation is completely submerged under 8 inches of dirty drain water. Threat of electrical flashover or live charge leaking into water.',
    originalDescription: 'The street transformer foundation is completely submerged under 8 inches of dirty drain water. Threat of electrical flashover or live charge leaking into water.',
    category: 'ELECTRICITY',
    severity: 'CRITICAL',
    status: 'SUBMITTED',
    language: 'en',
    aiSummary: 'High-voltage electrical transformer base submerged in drainage floodwater near Patia bus stop, presenting acute public electrocution hazard.',
    address: 'Opposite Infocity Avenue, Patia, Bhubaneswar, Odisha 751024',
    location: { type: 'Point', coordinates: [85.8190, 20.3560] },
    affectedGroup: ['Pedestrians', 'Public Transit Commuters'],
    daysAgo: 1,
    urgencyScore: 98,
    reasoning: 'Direct juxtaposition of live power transformer with flooded walkway poses life safety hazard.'
  },

  // ==========================================
  // CLUSTER 2: RASULGARH (Hotspot: Road Degradation & Heavy Transit Hazards)
  // ==========================================
  {
    title: 'Severe road depression and potholes under Rasulgarh flyover',
    description: 'Large, jagged craters have formed on the service road beneath Rasulgarh flyover. Vehicles are skidding and two-wheeler riders have suffered repeated fall injuries.',
    originalDescription: 'Large, jagged craters have formed on the service road beneath Rasulgarh flyover. Vehicles are skidding and two-wheeler riders have suffered repeated fall injuries.',
    category: 'ROAD',
    severity: 'HIGH',
    status: 'IN_PROGRESS',
    language: 'en',
    aiSummary: 'Deep asphalt craters and depressions beneath Rasulgarh flyover causing vehicular skidding and two-wheeler injury accidents.',
    address: 'Rasulgarh Flyover Underpass, National Highway 16, Bhubaneswar, Odisha 751010',
    location: { type: 'Point', coordinates: [85.8672, 20.2962] },
    affectedGroup: ['Two-Wheeler Riders', 'Interstate Truck Drivers'],
    daysAgo: 6,
    urgencyScore: 80,
    reasoning: 'High-speed junction with acute crater hazard causing documented physical injuries.'
  },
  {
    title: 'रसूलगढ़ फ्लाईओवर के नीचे सड़क पर भारी गड्ढा, गाड़ियों की आवाजाही ठप',
    description: 'फ्लाईओवर के ठीक नीचे मुख्य सड़क टूट गई है और 1.5 फीट गहरा गड्ढा बन गया है। कल रात दो मोटरसाइकिलें दुर्घटनाग्रस्त हो गईं। तुरंत पैचवर्क की आवश्यकता है।',
    originalDescription: 'फ्लाईओवर के ठीक नीचे मुख्य सड़क टूट गई है और 1.5 फीट गहरा गड्ढा बन गया है। कल रात दो मोटरसाइकिलें दुर्घटनाग्रस्त हो गईं। तुरंत पैचवर्क की आवश्यकता है।',
    category: 'ROAD',
    severity: 'HIGH',
    status: 'UNDER_REVIEW',
    language: 'hi',
    aiSummary: 'Dangerous 1.5-foot deep road crater beneath Rasulgarh flyover resulting in motorcycle accidents and severe bottlenecking.',
    address: 'Rasulgarh Industrial Square, Bhubaneswar, Odisha 751010',
    location: { type: 'Point', coordinates: [85.8668, 20.2958] },
    affectedGroup: ['मोटरसाइकिल चालक', 'दैनिक यात्री'],
    daysAgo: 3,
    urgencyScore: 84,
    reasoning: 'Deep structural roadway defect directly linked to recent vehicular crashes.'
  },
  {
    title: 'Broken bridge expansion joint on Rasulgarh slip road',
    description: 'Exposed metal rebar and loose steel plate on the expansion joint of the slip road. Driving over it is causing punctured tires and sudden emergency braking.',
    originalDescription: 'Exposed metal rebar and loose steel plate on the expansion joint of the slip road. Driving over it is causing punctured tires and sudden emergency braking.',
    category: 'ROAD',
    severity: 'CRITICAL',
    status: 'SUBMITTED',
    language: 'en',
    aiSummary: 'Exposed structural steel and loose expansion joint plate on Rasulgarh slip road puncturing vehicle tires and risking multi-vehicle pileups.',
    address: 'Cuttack-Puri Bypass Junction, Rasulgarh, Bhubaneswar, Odisha 751010',
    location: { type: 'Point', coordinates: [85.8675, 20.2965] },
    affectedGroup: ['All Motorists', 'Ambulance Routes'],
    daysAgo: 2,
    urgencyScore: 94,
    reasoning: 'Loose bridge metal hardware on major arterial route poses imminent catastrophic tire blowout hazard.'
  },
  {
    title: 'Cracked concrete bus shelter curb spilling rubble into lane',
    description: 'The passenger boarding bay concrete curb has collapsed into the main lane, forcing Mo Bus drivers to stop in the center of the road.',
    originalDescription: 'The passenger boarding bay concrete curb has collapsed into the main lane, forcing Mo Bus drivers to stop in the center of the road.',
    category: 'PUBLIC_TRANSPORT',
    severity: 'MEDIUM',
    status: 'RESOLVED',
    language: 'en',
    aiSummary: 'Damaged concrete curb at Rasulgarh bus bay obstructing public bus access and causing mid-road passenger boarding.',
    address: 'Rasulgarh Mo Bus Terminal Bay, Bhubaneswar, Odisha 751010',
    location: { type: 'Point', coordinates: [85.8665, 20.2955] },
    affectedGroup: ['Bus Passengers', 'Public Transit Drivers'],
    daysAgo: 18,
    urgencyScore: 50,
    reasoning: 'Bus stop curb failure compromises passenger boarding safety.'
  },

  // ==========================================
  // CLUSTER 3: SAHEED NAGAR (Hotspot: Waste & Commercial Sanitation)
  // ==========================================
  {
    title: 'Overflowing municipal waste compactor bin near BMC market',
    description: 'Garbage dumpsters outside Saheed Nagar daily market have not been cleared for 4 days. Rotting organic waste is spilling into the street and blocking parking.',
    originalDescription: 'Garbage dumpsters outside Saheed Nagar daily market have not been cleared for 4 days. Rotting organic waste is spilling into the street and blocking parking.',
    category: 'WASTE',
    severity: 'HIGH',
    status: 'UNDER_REVIEW',
    language: 'en',
    aiSummary: 'Multi-day solid waste accumulation at Saheed Nagar commercial market creating severe stench and obstruction of public thoroughfare.',
    address: 'BMC Market Building, Saheed Nagar, Bhubaneswar, Odisha 751007',
    location: { type: 'Point', coordinates: [85.8452, 20.2917] },
    affectedGroup: ['Market Visitors', 'Food Vendors', 'Shoppers'],
    daysAgo: 3,
    urgencyScore: 72,
    reasoning: 'Uncollected organic refuse in high-footfall commercial district poses sanitation violation.'
  },
  {
    title: 'ସହିଦ ନଗର ମାର୍କେଟ ପାଖରେ ଅଳିଆ ଗଦା ହୋଇ ରହିଛି ଏବଂ ମଶା ବୃଦ୍ଧି ପାଉଛନ୍ତି',
    description: 'ଗତ ଗୋଟିଏ ସପ୍ତାହରୁ ଅଳିଆ ଗାଡ଼ି ଆସୁନାହିଁ। ପଚାପଚି ପନିପରିବା ଏବଂ ପ୍ଲାଷ୍ଟିକ୍ ବର୍ଜ୍ୟବସ୍ତୁ ରାସ୍ତା ଉପରେ ପଡ଼ି ରହିଛି।',
    originalDescription: 'ଗତ ଗୋଟିଏ ସପ୍ତାହରୁ ଅଳିଆ ଗାଡ଼ି ଆସୁନାହିଁ। ପଚାପଚି ପନିପରିବା ଏବଂ ପ୍ଲାଷ୍ଟିକ୍ ବର୍ଜ୍ୟବସ୍ତୁ ରାସ୍ତା ଉପରେ ପଡ଼ି ରହିଛି।',
    category: 'WASTE',
    severity: 'MEDIUM',
    status: 'IN_PROGRESS',
    language: 'or',
    aiSummary: 'Citizen reports one week of missed waste collection in Saheed Nagar market leading to rotting produce accumulation.',
    address: 'Near RD Women\'s College Road, Saheed Nagar, Bhubaneswar, Odisha 751007',
    location: { type: 'Point', coordinates: [85.8448, 20.2912] },
    affectedGroup: ['ସ୍ଥାନୀୟ ବାସିନ୍ଦା', 'ଛାତ୍ରୀ'],
    daysAgo: 5,
    urgencyScore: 60,
    reasoning: 'Prolonged failure of municipal garbage collection route.'
  },
  {
    title: 'Four high-mast streetlights non-functional along inner market lane',
    description: 'Complete blackout on the commercial connector lane between Block A and Block B of Saheed Nagar after 7 PM. Concerns of theft and safety for women commuters.',
    originalDescription: 'Four high-mast streetlights non-functional along inner market lane after 7 PM. Concerns of theft and safety for women commuters.',
    category: 'STREET_LIGHT',
    severity: 'MEDIUM',
    status: 'RESOLVED',
    language: 'en',
    aiSummary: 'Consecutive streetlight luminaire failures causing total nighttime blackout in Saheed Nagar inner commercial corridor.',
    address: 'Block B Commercial Avenue, Saheed Nagar, Bhubaneswar, Odisha 751007',
    location: { type: 'Point', coordinates: [85.8455, 20.2920] },
    affectedGroup: ['Evening Commuters', 'Women Pedestrians'],
    daysAgo: 24,
    urgencyScore: 55,
    reasoning: 'Cluster of dark streetlights creates public safety and security concerns.'
  },

  // ==========================================
  // CLUSTER 4: OLD TOWN / LINGARAJ (Hotspot: Heritage Water Supply & Pipeline Leaks)
  // ==========================================
  {
    title: 'Water main rupture flooding stone heritage pathway near Bindu Sagar',
    description: 'High-pressure treated drinking water pipe ruptured early morning. Water is flooding the centuries-old pedestrian parikrama path near Bindu Sagar tank.',
    originalDescription: 'High-pressure treated drinking water pipe ruptured early morning. Water is flooding the centuries-old pedestrian parikrama path near Bindu Sagar tank.',
    category: 'WATER',
    severity: 'HIGH',
    status: 'IN_PROGRESS',
    language: 'en',
    aiSummary: 'Treated drinking water main rupture flooding heritage pedestrian walkway around Bindu Sagar tank in Old Town.',
    address: 'Bindu Sagar Parikrama Marg, Old Town, Bhubaneswar, Odisha 751002',
    location: { type: 'Point', coordinates: [85.8332, 20.2402] },
    affectedGroup: ['Temple Pilgrims', 'Heritage Tourists', 'Local Residents'],
    daysAgo: 2,
    urgencyScore: 82,
    reasoning: 'High-volume potable water wastage flooding heritage pedestrian path.'
  },
  {
    title: 'ପୁରୁଣା ସହର ବିନ୍ଦୁସାଗର ନିକଟରେ ପାନୀୟ ଜଳ ପାଇପ୍ ଫାଟି ରାସ୍ତା ବୁଡ଼ିଯାଇଛି',
    description: 'ପାଇପ୍ ଫାଟି ଯିବା ଫଳରେ ଆମ ସାହିରେ ଘରେ ପାଣି ପହଞ୍ଚୁ ନାହିଁ ଏବଂ ରାସ୍ତାରେ ହଜାର ହଜାର ଲିଟର ବିଶୁଦ୍ଧ ପାଣି ନଷ୍ଟ ହେଉଛି।',
    originalDescription: 'ପାଇପ୍ ଫାଟି ଯିବା ଫଳରେ ଆମ ସାହିରେ ଘରେ ପାଣି ପହଞ୍ଚୁ ନାହିଁ ଏବଂ ରାସ୍ତାରେ ହଜାର ହଜାର ଲିଟର ବିଶୁଦ୍ଧ ପାଣି ନଷ୍ଟ ହେଉଛି।',
    category: 'WATER',
    severity: 'HIGH',
    status: 'SUBMITTED',
    language: 'or',
    aiSummary: 'Potable water supply pipeline fracture cutting off residential water supply and wasting thousands of liters in Old Town.',
    address: 'Kedargouri Temple Road, Old Town, Bhubaneswar, Odisha 751002',
    location: { type: 'Point', coordinates: [85.8328, 20.2398] },
    affectedGroup: ['ସାହି ବାସିନ୍ଦା', 'ମହିଳା'],
    daysAgo: 1,
    urgencyScore: 78,
    reasoning: 'Residential supply disconnection caused by mainline fracture.'
  },
  {
    title: 'Contaminated muddy water coming from municipal supply taps',
    description: 'Brown discolored water with bad odor coming out of residential taps in Ward 58 for two consecutive days. Sewage might have infiltrated the drinking water line.',
    originalDescription: 'Brown discolored water with bad odor coming out of residential taps in Ward 58 for two consecutive days. Sewage might have infiltrated the drinking water line.',
    category: 'WATER',
    severity: 'CRITICAL',
    status: 'UNDER_REVIEW',
    language: 'en',
    aiSummary: 'Muddy and foul-smelling tap water indicating cross-contamination between municipal water line and nearby sewer in Old Town.',
    address: 'Badu Sahi, Lingaraj Temple Road, Old Town, Bhubaneswar, Odisha 751002',
    location: { type: 'Point', coordinates: [85.8335, 20.2405] },
    affectedGroup: ['Families', 'Children', 'Senior Citizens'],
    daysAgo: 3,
    urgencyScore: 96,
    reasoning: 'Drinking water cross-contamination presents acute gastrointestinal epidemic hazard.'
  },

  // ==========================================
  // CLUSTER 5: KHANDAGIRI (Hotspot: Open Culvert & Drainage Hazards)
  // ==========================================
  {
    title: 'Deep open uncovered manhole along tourist walkway at Khandagiri',
    description: 'A 6-foot deep stormwater manhole slab was broken during road widening. It is completely open without warning tape or guard rails right on the pedestrian footpath.',
    originalDescription: 'A 6-foot deep stormwater manhole slab was broken during road widening. It is completely open without warning tape or guard rails right on the pedestrian footpath.',
    category: 'DRAINAGE',
    severity: 'CRITICAL',
    status: 'IN_PROGRESS',
    language: 'en',
    aiSummary: 'Uncovered 6-foot deep manhole without barricades on Khandagiri pedestrian walkway posing severe fatal fall risk.',
    address: 'Khandagiri Caves Footpath, NH16, Bhubaneswar, Odisha 751030',
    location: { type: 'Point', coordinates: [85.7862, 20.2582] },
    affectedGroup: ['Tourists', 'Pedestrians', 'Morning Walkers'],
    daysAgo: 1,
    urgencyScore: 95,
    reasoning: 'Unprotected deep drop hazard on active pedestrian sidewalk creates severe life safety risk.'
  },
  {
    title: 'खंडगिरि के पास नाला खुला पड़ा है, दुर्घटना का बड़ा खतरा',
    description: 'सड़क किनारे का नाला ढका नहीं गया है। बारिश के समय यह दिखाई नहीं देता और रात में लोग गिर सकते हैं। इसे तुरंत कंक्रीट स्लैब से ढका जाए।',
    originalDescription: 'सड़क किनारे का नाला ढका नहीं गया है। बारिश के समय यह दिखाई नहीं देता और रात में लोग गिर सकते हैं। इसे तुरंत कंक्रीट स्लैब से ढका जाए।',
    category: 'DRAINAGE',
    severity: 'HIGH',
    status: 'UNDER_REVIEW',
    language: 'hi',
    aiSummary: 'Uncovered stormwater drain beside roadway in Khandagiri with zero visibility during rain posing critical fall risk.',
    address: 'Baramunda-Khandagiri Link Road, Bhubaneswar, Odisha 751030',
    location: { type: 'Point', coordinates: [85.7865, 20.2585] },
    affectedGroup: ['पैदल यात्री', 'पर्यटक'],
    daysAgo: 4,
    urgencyScore: 82,
    reasoning: 'Open canal alongside roadway lacks safety covers and visual markings.'
  },
  {
    title: 'Broken concrete drain slab collapsed into gutter',
    description: 'Heavy truck reversed onto the footpath and cracked the drain cover slabs. Now chunks of concrete are resting in the drain bed causing blockages.',
    originalDescription: 'Heavy truck reversed onto the footpath and cracked the drain cover slabs. Now chunks of concrete are resting in the drain bed causing blockages.',
    category: 'DRAINAGE',
    severity: 'MEDIUM',
    status: 'SUBMITTED',
    language: 'en',
    aiSummary: 'Cracked concrete slabs collapsed into roadside drain at Khandagiri, obstructing drainage channel and damaging sidewalk.',
    address: 'Near Khandagiri Police Station, Bhubaneswar, Odisha 751030',
    location: { type: 'Point', coordinates: [85.7858, 20.2578] },
    affectedGroup: ['Local Residents'],
    daysAgo: 7,
    urgencyScore: 58,
    reasoning: 'Physical damage to municipal drainage slab requires civil maintenance crew.'
  },

  // ==========================================
  // CLUSTER 6: JAYDEV VIHAR (Hotspot: Electrical & Traffic Signals)
  // ==========================================
  {
    title: 'Malfunctioning pedestrian crossing signals at Jaydev Vihar square',
    description: 'The pedestrian crossing countdown light has been flashing red continuously. Office workers and school children struggle to cross the 6-lane road safely.',
    originalDescription: 'The pedestrian crossing countdown light has been flashing red continuously. Office workers and school children struggle to cross the 6-lane road safely.',
    category: 'STREET_LIGHT',
    severity: 'HIGH',
    status: 'UNDER_REVIEW',
    language: 'en',
    aiSummary: 'Defective pedestrian signal light at busy Jaydev Vihar junction preventing safe pedestrian transit across multi-lane highway.',
    address: 'Jaydev Vihar Intersection, Nandankanan Road, Bhubaneswar, Odisha 751013',
    location: { type: 'Point', coordinates: [85.8232, 20.2982] },
    affectedGroup: ['IT Employees', 'School Students', 'Pedestrians'],
    daysAgo: 5,
    urgencyScore: 76,
    reasoning: 'Faulty traffic safety signals at high-speed intersection increase pedestrian collision risk.'
  },
  {
    title: 'जयदेव विहार चौराहे के पास स्ट्रीट लाइट खराब है, रात में अंधेरा रहता है',
    description: 'फॉर्च्यून टावर से जयदेव विहार की तरफ जाने वाली सड़क पर पिछले 4 दिनों से 6 खंभों की बत्तियां बंद हैं। रात में लूटपाट और दुर्घटना का डर बना रहता है।',
    originalDescription: 'फॉर्च्यून टावर से जयदेव विहार की तरफ जाने वाली सड़क पर पिछले 4 दिनों से 6 खंभों की बत्तियां बंद हैं। रात में लूटपाट और दुर्घटना का डर बना रहता है।',
    category: 'STREET_LIGHT',
    severity: 'MEDIUM',
    status: 'IN_PROGRESS',
    language: 'hi',
    aiSummary: 'Six streetlight poles non-operational on corridor between Fortune Tower and Jaydev Vihar, resulting in dangerous dark stretches.',
    address: 'Fortune Towers Road, Jaydev Vihar, Bhubaneswar, Odisha 751023',
    location: { type: 'Point', coordinates: [85.8235, 20.2985] },
    affectedGroup: ['दैनिक यात्री', 'कार्यालय कर्मचारी'],
    daysAgo: 8,
    urgencyScore: 56,
    reasoning: 'Multiple streetlight failures along main corporate commuter belt.'
  },
  {
    title: 'Low-hanging live electrical service wire drooping over walkway',
    description: 'Service line detached from pole bracket and is hanging at eye-level (5 feet above ground). Highly dangerous for cyclists and pedestrians carrying umbrellas.',
    originalDescription: 'Service line detached from pole bracket and is hanging at eye-level (5 feet above ground). Highly dangerous for cyclists and pedestrians carrying umbrellas.',
    category: 'ELECTRICITY',
    severity: 'CRITICAL',
    status: 'IN_PROGRESS',
    language: 'en',
    aiSummary: 'Detached electrical wire sagging at head-height over Jaydev Vihar footpath, creating imminent risk of contact electrocution.',
    address: 'Near Mayfair Lagoon Gate, Jaydev Vihar, Bhubaneswar, Odisha 751013',
    location: { type: 'Point', coordinates: [85.8228, 20.2978] },
    affectedGroup: ['Pedestrians', 'Cyclists'],
    daysAgo: 2,
    urgencyScore: 95,
    reasoning: 'Low-clearance power cable creates extreme public safety hazard.'
  },

  // ==========================================
  // CLUSTER 7: CHANDRASEKHARPUR (Hotspot: Road & Public Transport)
  // ==========================================
  {
    title: 'ଚନ୍ଦ୍ରଶେଖରପୁର ଡମଣା ଛକ ନିକଟରେ ରାସ୍ତା ଖରାପ ଥିବାରୁ ଯାତାୟାତରେ ଅସୁବିଧା',
    description: 'ଡମଣା ଛକରୁ ଶୈଳଶ୍ରୀ ବିହାର ଯିବା ରାସ୍ତାରେ ବଡ଼ ବଡ଼ ଖାଲ ସୃଷ୍ଟି ହୋଇଛି, ଯାହା ଫଳରେ ଅଟୋ ଏବଂ ବସ୍ ଯିବା ଆସିବା କରିପାରୁ ନାହାନ୍ତି।',
    originalDescription: 'ଡମଣା ଛକରୁ ଶୈଳଶ୍ରୀ ବିହାର ଯିବା ରାସ୍ତାରେ ବଡ଼ ବଡ଼ ଖାଲ ସୃଷ୍ଟି ହୋଇଛି, ଯାହା ଫଳରେ ଅଟୋ ଏବଂ ବସ୍ ଯିବା ଆସିବା କରିପାରୁ ନାହାନ୍ତି।',
    category: 'ROAD',
    severity: 'MEDIUM',
    status: 'SUBMITTED',
    language: 'or',
    aiSummary: 'Multiple large road craters on Damana Square to Sailashree Vihar corridor obstructing bus and auto-rickshaw transit.',
    address: 'Damana Square, Chandrasekharpur, Bhubaneswar, Odisha 751016',
    location: { type: 'Point', coordinates: [85.8165, 20.3275] },
    affectedGroup: ['ଦୈନିକ ଯାତ୍ରୀ', 'ଅଟୋ ଚାଳକ'],
    daysAgo: 6,
    urgencyScore: 62,
    reasoning: 'Road surface degradation disrupting feeder public transportation.'
  },
  {
    title: 'Sinking asphalt trench left unpaved after telecom cable laying',
    description: 'Contractor dug a 100-meter trench across the main road for fiber optic cables and only covered it with loose sand. Heavy vehicles are sinking into the gravel trench.',
    originalDescription: 'Contractor dug a 100-meter trench across the main road for fiber optic cables and only covered it with loose sand. Heavy vehicles are sinking into the gravel trench.',
    category: 'ROAD',
    severity: 'HIGH',
    status: 'UNDER_REVIEW',
    language: 'en',
    aiSummary: 'Unrepaired 100-meter utility trench on Chandrasekharpur main road sinking under vehicle weight after improper refilling.',
    address: 'Sailashree Vihar Main Road, Chandrasekharpur, Bhubaneswar, Odisha 751021',
    location: { type: 'Point', coordinates: [85.8158, 20.3268] },
    affectedGroup: ['Local Commuters', 'Residents'],
    daysAgo: 10,
    urgencyScore: 74,
    reasoning: 'Improperly backfilled utility trench on active roadway creating structural hazard.'
  },
  {
    title: 'Solid waste dumped on roadside green belt near BDA Colony',
    description: 'Commercial construction debris and packing styrofoam dumped along the community garden perimeter. Needs removal by municipal front-loader truck.',
    originalDescription: 'Commercial construction debris and packing styrofoam dumped along the community garden perimeter. Needs removal by municipal front-loader truck.',
    category: 'WASTE',
    severity: 'LOW',
    status: 'RESOLVED',
    language: 'en',
    aiSummary: 'Commercial construction rubble and packaging waste dumped on public green belt in Chandrasekharpur.',
    address: 'BDA Colony Sector 1, Chandrasekharpur, Bhubaneswar, Odisha 751016',
    location: { type: 'Point', coordinates: [85.8162, 20.3272] },
    affectedGroup: ['Neighborhood Residents'],
    daysAgo: 20,
    urgencyScore: 35,
    reasoning: 'Illegal debris dumping on public green verge.'
  },

  // ==========================================
  // ISOLATED NON-HOTSPOT COMPLAINTS (Demonstrating spatial separation)
  // ==========================================
  {
    title: 'Broken speed breaker rubber casing in Nayapalli residential lane',
    description: 'Bolts of rubber speed bump have come loose and the plastic segment is rattling against cars.',
    originalDescription: 'Bolts of rubber speed bump have come loose and the plastic segment is rattling against cars.',
    category: 'ROAD',
    severity: 'LOW',
    status: 'RESOLVED',
    language: 'en',
    aiSummary: 'Loose rubber speed breaker hardware in Nayapalli residential street.',
    address: 'IRC Village, Nayapalli, Bhubaneswar, Odisha 751015',
    location: { type: 'Point', coordinates: [85.8210, 20.3050] },
    affectedGroup: ['Local Drivers'],
    daysAgo: 26,
    urgencyScore: 25,
    reasoning: 'Minor traffic calming fixture requires re-bolting.'
  },
  {
    title: 'Leaking public drinking water tap at Unit 4 market',
    description: 'Drinking fountain faucet is dripping continuously, wasting clean drinking water into the drain.',
    originalDescription: 'Drinking fountain faucet is dripping continuously, wasting clean drinking water into the drain.',
    category: 'WATER',
    severity: 'LOW',
    status: 'RESOLVED',
    language: 'en',
    aiSummary: 'Continuous leak from public water fountain valve at Unit 4 market.',
    address: 'Unit 4 Fish Market Gate, Bhubaneswar, Odisha 751001',
    location: { type: 'Point', coordinates: [85.8380, 20.2760] },
    affectedGroup: ['Market Shoppers'],
    daysAgo: 28,
    urgencyScore: 30,
    reasoning: 'Minor faucet washer replacement.'
  },
  {
    title: 'Overhanging tree branches touching 11kV overhead line in VSS Nagar',
    description: 'Gulmohar tree branches have grown into the overhead electricity wire. During wind storms, sparks are flying from the branches.',
    originalDescription: 'Gulmohar tree branches have grown into the overhead electricity wire. During wind storms, sparks are flying from the branches.',
    category: 'ELECTRICITY',
    severity: 'MEDIUM',
    status: 'IN_PROGRESS',
    language: 'en',
    aiSummary: 'Tree branches entangling 11kV power lines in VSS Nagar causing sparks during wind gusts.',
    address: 'Phase 2, VSS Nagar, Bhubaneswar, Odisha 751007',
    location: { type: 'Point', coordinates: [85.8600, 20.3150] },
    affectedGroup: ['Local Residents'],
    daysAgo: 12,
    urgencyScore: 65,
    reasoning: 'Vegetation clearance required around medium voltage distribution line.'
  },
  {
    title: 'Broken park bench and concrete path crack in Forest Park',
    description: 'One of the stone benches in the children play area has collapsed.',
    originalDescription: 'One of the stone benches in the children play area has collapsed.',
    category: 'OTHER',
    severity: 'LOW',
    status: 'REJECTED',
    language: 'en',
    aiSummary: 'Damaged recreational park bench in Forest Park children zone.',
    address: 'Biju Patnaik Park (Forest Park), Bhubaneswar, Odisha 751009',
    location: { type: 'Point', coordinates: [85.8290, 20.2600] },
    affectedGroup: ['Park Visitors'],
    daysAgo: 15,
    urgencyScore: 20,
    reasoning: 'Recreation facility maintenance under horticulture department.'
  }
];

async function seedDatabase() {
  console.log('\n=============================================================');
  console.log('🌱 CIVIC-AI DEVELOPMENT SEED SCRIPT (BHUBANESWAR DEMO DATA)');
  console.log('=============================================================\n');

  const primaryUri = process.env.MONGO_URI;
  const localUri = 'mongodb://127.0.0.1:27017/civic_ai';

  if (primaryUri) {
    try {
      console.log('Attempting connection to configured MONGO_URI...');
      await mongoose.connect(primaryUri, { serverSelectionTimeoutMS: 4000 });
      console.log('✅ Connected to configured MongoDB cluster.');
    } catch (primaryErr) {
      console.warn(`\n⚠️ Primary MONGO_URI unreachable (${primaryErr.message}).`);
      console.log('Falling back to local MongoDB at:', localUri);
      await mongoose.connect(localUri);
      console.log('✅ Connected to local MongoDB.');
    }
  } else {
    await mongoose.connect(localUri);
    console.log('✅ Connected to local MongoDB at:', localUri);
  }

  try {
    // 1. Ensure Demo Users Exist
    console.log('👤 Verifying demonstration citizen & admin accounts...');
    
    let demoCitizen = await User.findOne({ email: 'citizen@civic.org' });
    if (!demoCitizen) {
      demoCitizen = await User.create({
        name: 'Demo Citizen (Bhubaneswar)',
        email: 'citizen@civic.org',
        password: 'password123',
        role: 'citizen',
        ward: 'Ward 14 (Central Bhubaneswar)',
        phone: '+91 9876543210'
      });
      console.log('  ✅ Created demo citizen: citizen@civic.org / password123');
    } else {
      console.log('  ℹ️ Demo citizen account already exists.');
    }

    let demoAdmin = await User.findOne({ email: 'admin@municipal.gov.in' });
    if (!demoAdmin) {
      demoAdmin = await User.create({
        name: 'Municipal Admin Chief (BMC)',
        email: 'admin@municipal.gov.in',
        password: 'adminpassword123',
        role: 'admin',
        ward: 'Central Municipal Headquarters',
        phone: '+91 9988776655'
      });
      console.log('  ✅ Created demo administrator: admin@municipal.gov.in / adminpassword123');
    } else {
      console.log('  ℹ️ Demo administrator account already exists.');
    }

    // 2. Clear existing demo complaints to ensure idempotency
    console.log('\n🧹 Cleaning previous demonstration complaints (isDemo: true)...');
    const deleteResult = await Complaint.deleteMany({ isDemo: true });
    console.log(`  Removed ${deleteResult.deletedCount} old demo complaints.`);

    // 3. Insert fresh fictional complaints
    console.log('\n📍 Inserting 25+ realistic fictional complaints around Bhubaneswar...');
    console.log('   Locations: Patia, Rasulgarh, Saheed Nagar, Old Town, Khandagiri, Jaydev Vihar, Chandrasekharpur');

    const createdComplaints = [];
    for (const item of BHUBANESWAR_DEMO_COMPLAINTS) {
      const createdAt = getDateDaysAgo(item.daysAgo);
      const updatedAt = new Date(createdAt.getTime() + 1000 * 60 * 60 * 2);

      // Build structured audit timeline reflecting status
      const timeline = [
        {
          status: 'SUBMITTED',
          note: `Fictional demonstration grievance lodged via citizen portal (${item.language.toUpperCase()})`,
          updatedBy: demoCitizen._id,
          timestamp: createdAt
        }
      ];

      if (['UNDER_REVIEW', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'].includes(item.status)) {
        timeline.push({
          status: 'UNDER_REVIEW',
          note: 'BMC automated triage confirmed category and dispatch parameters',
          updatedBy: demoAdmin._id,
          timestamp: new Date(createdAt.getTime() + 1000 * 60 * 45)
        });
      }

      if (['IN_PROGRESS', 'RESOLVED'].includes(item.status)) {
        timeline.push({
          status: 'IN_PROGRESS',
          note: 'Municipal field engineer crew dispatched to site for physical inspection',
          updatedBy: demoAdmin._id,
          timestamp: new Date(createdAt.getTime() + 1000 * 60 * 60 * 4)
        });
      }

      if (item.status === 'RESOLVED') {
        timeline.push({
          status: 'RESOLVED',
          note: 'Physical remediation completed and verified by ward supervisor',
          updatedBy: demoAdmin._id,
          timestamp: new Date(createdAt.getTime() + 1000 * 60 * 60 * 24)
        });
      } else if (item.status === 'REJECTED') {
        timeline.push({
          status: 'REJECTED',
          note: 'Re-routed to specialized horticulture division; municipal complaint closed',
          updatedBy: demoAdmin._id,
          timestamp: new Date(createdAt.getTime() + 1000 * 60 * 60 * 6)
        });
      }

      const doc = await Complaint.create({
        title: item.title,
        description: item.description,
        originalDescription: item.originalDescription || item.description,
        category: item.category,
        severity: item.severity,
        status: item.status,
        language: item.language,
        aiSummary: item.aiSummary,
        isDemo: true, // STRICT DEMO FLAG
        address: item.address,
        location: item.location,
        affectedGroup: item.affectedGroup,
        createdBy: demoCitizen._id,
        timeline,
        createdAt,
        updatedAt,
        aiAnalysis: {
          status: 'COMPLETED',
          reasoning: item.reasoning,
          urgencyScore: item.urgencyScore,
          completedAt: new Date(createdAt.getTime() + 1000 * 30),
          rawResponse: {
            category: item.category,
            severity: item.severity,
            language: item.language,
            summary: item.aiSummary,
            affectedGroup: item.affectedGroup,
            recommendedAction: ['Dispatch municipal zone crew for site remediation'],
            reasoning: item.reasoning
          }
        }
      });

      createdComplaints.push(doc);
    }

    console.log(`\n✅ Successfully seeded ${createdComplaints.length} demonstration complaints!`);

    // Print summary stats
    const stats = {
      total: createdComplaints.length,
      byLanguage: {
        en: createdComplaints.filter(c => c.language === 'en').length,
        hi: createdComplaints.filter(c => c.language === 'hi').length,
        or: createdComplaints.filter(c => c.language === 'or').length,
      },
      bySeverity: {
        CRITICAL: createdComplaints.filter(c => c.severity === 'CRITICAL').length,
        HIGH: createdComplaints.filter(c => c.severity === 'HIGH').length,
        MEDIUM: createdComplaints.filter(c => c.severity === 'MEDIUM').length,
        LOW: createdComplaints.filter(c => c.severity === 'LOW').length,
      },
      byStatus: {
        SUBMITTED: createdComplaints.filter(c => c.status === 'SUBMITTED').length,
        UNDER_REVIEW: createdComplaints.filter(c => c.status === 'UNDER_REVIEW').length,
        IN_PROGRESS: createdComplaints.filter(c => c.status === 'IN_PROGRESS').length,
        RESOLVED: createdComplaints.filter(c => c.status === 'RESOLVED').length,
        REJECTED: createdComplaints.filter(c => c.status === 'REJECTED').length,
      }
    };

    console.log('\n📊 SEED DATA BREAKDOWN:');
    console.log('   Total Demo Grievances:', stats.total);
    console.log('   Languages:            English:', stats.byLanguage.en, '| Hindi (हिन्दी):', stats.byLanguage.hi, '| Odia (ଓଡ଼ିଆ):', stats.byLanguage.or);
    console.log('   Severities:           CRITICAL:', stats.bySeverity.CRITICAL, '| HIGH:', stats.bySeverity.HIGH, '| MEDIUM:', stats.bySeverity.MEDIUM, '| LOW:', stats.bySeverity.LOW);
    console.log('   Statuses:             SUBMITTED:', stats.byStatus.SUBMITTED, '| UNDER_REVIEW:', stats.byStatus.UNDER_REVIEW, '| IN_PROGRESS:', stats.byStatus.IN_PROGRESS, '| RESOLVED:', stats.byStatus.RESOLVED);
    console.log('\n🔐 Credentials:');
    console.log('   Citizen Portal:       citizen@civic.org / password123');
    console.log('   Admin Intelligence:   admin@municipal.gov.in / adminpassword123\n');

  } catch (error) {
    console.error('❌ Error while seeding database:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed.\n');
  }
}

seedDatabase();
