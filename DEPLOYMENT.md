# CivicAI Production Deployment Guide

This guide provides end-to-end instructions for deploying **CivicAI** to production across **Vercel** (Frontend SPA), **Render** (Node.js Backend), and **MongoDB Atlas** (Managed Cloud Database), integrated with **Google Gemini** (AI Categorization/Triage) and **Geoapify** (GIS Maps & Geocoding).

---

## 🏛️ Architecture Overview

```mermaid
flowchart TD
    User["Citizen / Official Browser"] -->|"HTTPS (React SPA)"| Vercel["Vercel Frontend (Vite + React)"]
    Vercel -->|"API Requests (CORS)"| Render["Render Web Service (Node.js/Express)"]
    Render -->|"Database Queries (TLS)"| Atlas["MongoDB Atlas Cluster (M0 Free Tier)"]
    Render -->|"AI Triage & Hotspots"| Gemini["Google Gemini API"]
    Vercel -->|"Vector Map Tiles"| Geoapify["Geoapify GIS API"]
```

| Component | Provider | Tier / Type | Responsibilities |
| :--- | :--- | :--- | :--- |
| **Frontend** | [Vercel](https://vercel.com/) | Hobby (Free) | React 18 SPA, Leaflet GIS map, Vite build, Tailwind CSS |
| **Backend** | [Render](https://render.com/) | Free Web Service | Express API, JWT Auth, AI pipeline, geospatial aggregation |
| **Database** | [MongoDB Atlas](https://www.mongodb.com/atlas) | M0 Sandbox (Free) | Persistent storage, 2dsphere indexes, complaints, users |
| **AI Engine** | [Google AI Studio](https://aistudio.google.com/) | Free Gemini API | Automated categorization, severity scoring, routing |
| **Mapping / GIS**| [Geoapify](https://www.geoapify.com/) | Free Developer Tier | Interactive raster/vector tiles, forward/reverse geocoding |

---

## 📋 Pre-Deployment Checklist

- [ ] A [GitHub](https://github.com/) account with the `CivicAI` repository pushed to `main`.
- [ ] A [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) account.
- [ ] A [Render](https://render.com/) account.
- [ ] A [Vercel](https://vercel.com/) account.
- [ ] A [Google AI Studio](https://aistudio.google.com/app/apikey) Gemini API key.
- [ ] A [Geoapify](https://myprojects.geoapify.com/) API key.

---

## Step 1: Set Up MongoDB Atlas

1. **Create a Free Cluster**:
   - Log into MongoDB Atlas and click **Create Deployment**.
   - Select **M0 Free** (Shared tier).
   - Choose a cloud provider and region closest to your target users (e.g., `AWS / us-east-1` or `AWS / ap-south-1`).
   - Cluster Name: e.g. `Cluster0` or `civicai-cluster`.

2. **Configure Database User**:
   - Go to **Security > Database Access**.
   - Click **Add New Database User**.
   - Authentication Method: **Password**.
   - Set a secure username (e.g., `civicai_admin`) and generate a strong password. Save this password.
   - Built-in Role: **Read and write to any database**.

3. **Configure Network Access**:
   - Go to **Security > Network Access**.
   - Click **Add IP Address**.
   - Select **Allow Access From Anywhere** (`0.0.0.0/0`).
     > *Note*: Render free web services utilize dynamic outbound IP addresses, which requires `0.0.0.0/0` whitelist access.

4. **Obtain Connection String**:
   - In Atlas, go to **Database > Clusters** and click **Connect**.
   - Choose **Drivers** (Node.js).
   - Copy the SRV URI. It looks like:
     ```text
     mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/?retryWrites=true&w=majority
     ```
   - Append the database name `civicai` before the query parameters:
     ```text
     mongodb+srv://civicai_admin:YOUR_PASSWORD@cluster0.abcde.mongodb.net/civicai?retryWrites=true&w=majority
     ```

---

## Step 2: Obtain API Keys & Secrets

### 1. Google Gemini API Key
- Navigate to [Google AI Studio - Get API Key](https://aistudio.google.com/app/apikey).
- Create or select a Google Cloud Project and generate an API key.
- Key format: `AIzaSy...`

### 2. Geoapify API Key
- Navigate to [Geoapify MyProjects Dashboard](https://myprojects.geoapify.com/).
- Create a new project called `CivicAI` and copy your Project API key.

### 3. Generate JWT Secret
Generate a cryptographically secure 256-bit secret for token signing. In your terminal:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Step 3: Deploy Backend on Render

1. **Create New Web Service**:
   - Log into the [Render Dashboard](https://dashboard.render.com/).
   - Click **New +** > **Web Service**.
   - Connect your GitHub repository (`CivicAI`).

2. **Configure Build & Runtime Settings**:
   | Setting | Value |
   | :--- | :--- |
   | **Name** | `civicai-api` (or your choice) |
   | **Region** | Select region matching or closest to MongoDB Atlas |
   | **Branch** | `main` |
   | **Root Directory** | `server` |
   | **Runtime** | `Node` |
   | **Build Command** | `npm install` *(or `npm install && npm run build`)* |
   | **Start Command** | `npm start` |
   | **Instance Type** | Free |

3. **Configure Environment Variables**:
   In the **Environment** tab, add the following variables:

   | Variable Name | Example Value | Description |
   | :--- | :--- | :--- |
   | `NODE_ENV` | `production` | Enables production security & logging |
   | `PORT` | `10000` | (Render sets this automatically; defaults to 5000) |
   | `MONGO_URI` | `mongodb+srv://user:pass@cluster.mongodb.net/civicai?retryWrites=true&w=majority` | Atlas SRV URI from Step 1 |
   | `JWT_SECRET` | `5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8` | Generated 32-byte secret |
   | `GEMINI_API_KEY` | `AIzaSy...` | Google AI Studio Key |
   | `CLIENT_URL` | `https://your-civicai-frontend.vercel.app` | *Leave placeholder for now; update after Vercel step* |
   | `GEOAPIFY_API_KEY`| *(Optional)* | Optional server-side geocoding key |

4. **Deploy**:
   - Click **Create Web Service**.
   - Wait 2–3 minutes for the build and container start.
   - Once deployed, copy your Render URL: e.g. `https://civicai-api.onrender.com`.

5. **Verify Backend Health**:
   Open in your browser:
   ```text
   https://civicai-api.onrender.com/api/health
   ```
   Expected response:
   ```json
   {
     "status": "ok",
     "service": "CivicAI API",
     "server": "running",
     "database": {
       "status": "connected",
       "connected": true,
       "name": "civicai"
     },
     "message": "CivicAI API and MongoDB are running smoothly"
   }
   ```

---

## Step 4: Deploy Frontend on Vercel

1. **Import Project into Vercel**:
   - Log into [Vercel Dashboard](https://vercel.com/dashboard).
   - Click **Add New...** > **Project**.
   - Import your `CivicAI` repository.

2. **Configure Project Settings**:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click *Edit* and select `client` (or leave at `./` since root `vercel.json` will build `client/dist`). Selecting `client` is the standard approach.
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

3. **Configure Environment Variables**:
   Under **Environment Variables**, add:

   | Variable Name | Value | Description |
   | :--- | :--- | :--- |
   | `VITE_API_URL` | `https://civicai-api.onrender.com/api` | Full URL to your Render API with `/api` suffix |
   | `VITE_GEOAPIFY_API_KEY` | `your_geoapify_key` | Geoapify project key for Leaflet map tiles |

4. **Deploy**:
   - Click **Deploy**.
   - Vercel will install dependencies, build the Vite application, and deploy to a production URL (e.g., `https://civicai-gamer.vercel.app`).

---

## Step 5: Finalize Production CORS

1. Return to your **Render Dashboard** for the `civicai-api` service.
2. Go to **Environment**.
3. Update `CLIENT_URL` with your actual Vercel production domain:
   ```text
   CLIENT_URL=https://civicai-gamer.vercel.app
   ```
   *(Multiple domains can be separated by commas, e.g. `https://civicai-gamer.vercel.app,https://civicai.vercel.app`)*.
4. Click **Save Changes**. Render will automatically trigger a zero-downtime redeploy.

---

## Step 6: Post-Deployment Smoke Test

Verify all core flows on the live production URL:

1. **SPA Routing**:
   - Navigate directly to `https://your-app.vercel.app/admin` or `https://your-app.vercel.app/login`.
   - Verify the page loads without 404s (handled by `vercel.json` SPA rewrite rules).

2. **User Authentication**:
   - Visit `/register` and create a test citizen account.
   - Verify JWT is returned and saved to `localStorage`.

3. **AI Complaint Triage**:
   - File a new complaint at `/submit` (e.g., *"Burst water pipeline flooding Main Street"*).
   - Verify that Gemini auto-classifies the category to `Water Supply`, severity to `High`, and routes to `Water Supply & Sewerage Board`.
   - Verify interactive Leaflet map pin selection functions.

4. **Admin Dashboard & Analytics**:
   - Log in with an admin account (or promote user role in MongoDB Atlas).
   - Visit `/admin` to verify KPI cards, AI Hotspots with ML recommendations, and complaints table.

---

## 🛠️ Operational Notes & Free-Tier Gotchas

### Render Free-Tier Spin-Down
Render's free tier spins down web services after **15 minutes of inactivity**.
- The first request after sleep may experience a **30–50 second cold-start delay**.
- To keep the service responsive during demonstrations, you can ping the health check endpoint (`https://civicai-api.onrender.com/api/health`) every 10 minutes using a free uptime monitor such as [UptimeRobot](https://uptimerobot.com/) or [cron-job.org](https://cron-job.org/).

### MongoDB Atlas SRV Records on Windows
The server automatically applies Google Public DNS (`8.8.8.8`) on startup to prevent Windows local DNS SRV resolution timeouts. On Linux (Render), native DNS resolves SRV records immediately.

---

## 🔒 Security Summary

- ✅ **No committed credentials**: All secrets (`.env`) are git-ignored. Only `.env.example` templates with placeholders are tracked.
- ✅ **Strict CORS**: `server/src/app.js` permits only configured origins in production and blocks local ports.
- ✅ **OWASP Headers**: `nosniff`, `DENY` framing, strict referrer policies enabled.
- ✅ **Rate Limiting**: AI endpoints, authentication endpoints, and global routes are guarded by rate limiters.
