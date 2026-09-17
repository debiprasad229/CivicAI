# CivicAI 🏛️🤖
### AI-Powered Citizen Infrastructure & Municipal Governance Platform

CivicAI empowers citizens to report civic infrastructure issues (potholes, streetlights, broken water pipelines, overflowing garbage, drainage blocks, public transit issues) and equips municipal authorities with an AI-driven mission control center for automated complaint triage, priority assessment, duplicate detection, and actionable resolution roadmaps.

---

## 🚀 Key Features

1. **Citizen Reporting & Geo-tagging**
   - Streamlined reporting wizard with geolocation and interactive map pin placement (powered by Leaflet & Geoapify).
   - Instant tracking link & timeline for transparency.

2. **AI-Driven Infrastructure Triage (Google Gemini)**
   - **Automated Categorization**: Accurately classifies issues into civic departments (Roads, Water, Sanitation, Electrical, Transit).
   - **Severity & Urgency Scoring**: Quantifies hazard risk on a 1-100 index and assigns priority (Low, Medium, High, Critical).
   - **Demographic Impact Assessment**: Identifies impacted vulnerable groups (e.g. school zones, hospital access routes, elderly pedestrians).
   - **Duplicate Detection**: Identifies spatially proximate and semantically similar complaints to prevent municipal duplicate ticket sprawl.
   - **Actionable Municipal Guidance**: Generates practical, step-by-step remediation plans and equipment requirements for public works crews.

3. **Authority Operations Dashboard**
   - Interactive GIS Map of all active citizen complaints with color-coded severity markers.
   - Hotspot clustering and high-risk zone alerts.
   - Departmental workload and resolution analytics powered by Recharts.
   - Status dispatch workflow: *Submitted -> In Review -> Assigned -> In Progress -> Resolved*.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite, Tailwind CSS, React Router, Leaflet, React Leaflet, Recharts, Lucide React, Axios |
| **Backend** | Node.js, Express.js (ES Modules), MongoDB & Mongoose, JWT, bcryptjs, CORS, dotenv |
| **AI Engine** | Google Gemini API via official `@google/genai` SDK |
| **Mapping & GIS** | Geoapify Geocoding API & OpenStreetMap Tiles via Leaflet |
| **Deployment** | Frontend: Vercel \| Backend: Render \| Database: MongoDB Atlas |

---

## 📦 Project Setup

### 1. Backend (`server/`)
```bash
cd server
npm install
cp .env.example .env
# Fill in your MONGODB_URI, GEMINI_API_KEY, GEOAPIFY_API_KEY, and JWT_SECRET
npm run dev
```

### 2. Frontend (`client/`)
```bash
cd client
npm install
cp .env.example .env
# Fill in VITE_API_URL and VITE_GEOAPIFY_API_KEY
npm run dev
```
