# 🛡️ AURORA SHIELD
### AI-Powered Universal Packaged Product Compliance Scanner
*Smart India Hackathon 2026 Ready • Enterprise-Grade Production Architecture*

> **Architectural Doctrine:** *"AI assists. Human verifies. Rules decide."*

---

## 🚀 Quick Start (Running the Application)

Aurora Shield features a strictly **decoupled architecture** with separate backend and frontend servers.

### 1. Start the Backend Server (Express + TypeScript + PDFKit)
```bash
cd backend
npm install
npm run dev
```
- **Port:** `http://localhost:5000`
- **Health Check Endpoint:** `http://localhost:5000/api/health`

### 2. Start the Frontend Application (React 19 + Vite + Tailwind CSS + Three.js)
```bash
cd frontend
npm install
npm run dev
```
- **Port:** `http://localhost:3000`

---

## 🌟 Hackathon Evaluator Quick Tour

1. Open `http://localhost:3000/login` in your browser.
2. Click **"One-Click Judge / Evaluator Access"** to immediately sign into the regulatory officer portal.
3. Explore the **Cinematic Dashboard** featuring the reactive **3D Aurora Core Compliance Orb**, live metrics, and recent scans.
4. Click **"Run New Scan"** or **"Start New Scan"**:
   - Choose a Packaging Category (e.g. *Food & Beverages*).
   - In Step 2, click **"Load Sample Product (Good Day Cookies)"** to load multi-angle packaging samples (`FRONT` and `BACK` panels).
   - Progress through the 7-step wizard: **Quality Gate -> Neural OCR -> AI Structured Data Extraction -> Human Verification Review -> Deterministic Rule Engine**.
5. Inspect the **Discrepancy Inspector** demonstrating a real-world packaging violation (Front Net Quantity 100g vs Back Net Quantity 120g).
6. Click **"Download Official PDF Report"** to export an audit certificate generated with vector PDFKit on the backend.

---

## 🏛️ System Architecture

Aurora Shield separates non-deterministic AI capabilities from legally-binding regulatory enforcement:

```
┌─────────────────────────────────────────────────────────┐
│                     FRONTEND SPA                        │
│   React 19 • Vite • Tailwind CSS • Three.js Canvas      │
│   7-Step Wizard • Evidence Explorer • 3D Aurora Core    │
└───────────────────────────▲─────────────────────────────┘
                            │ REST JSON & PDF Blobs
┌───────────────────────────▼─────────────────────────────┐
│                    BACKEND REST API                     │
│    Express • TypeScript • Helmet • CORS • Rate-Limit    │
├─────────────────────────────────────────────────────────┤
│  1. Pre-OCR Image Quality Gate (Blur & Contrast)       │
│  2. Neural OCR Engine (Angle-Specific Text Streams)     │
│  3. AI Structured Data Extractor (18+ Statutory Fields) │
│  4. Multi-Label Discrepancy Engine (Cross-Panel Audit)  │
│  5. Deterministic Rule Engine (Legal Metrology & FSSAI) │
│  6. Vector PDFKit Compliance Certificate Generator     │
└─────────────────────────────────────────────────────────┘
```

---

## 📜 Regulatory Standards Implemented
- **Legal Metrology (Packaged Commodities) Rules, 2009**
  - Standardized units of weight & volume (g, kg, ml, l)
  - Minimum font height ratios relative to principal display panel
  - Consumer redressal contact information (toll-free number and email)
- **FSSAI Packaging and Labelling Regulations, 2020**
  - 14-digit FSSAI license number verification and logo placement
  - Prominent allergen alerts (bold text format)
  - Date of manufacture, packaging, and "Best Before / Expiry" declarations

---

## 🔒 Security & Best Practices
- Strict CORS configuration restricting requests to authorized origins.
- Security headers enforced with Helmet.
- Rate limiting to protect against DoS attacks on analysis endpoints.
- Multer file ingestion with mime-type checking and file size limits.
- Zero secrets committed; full `.env` and `.env.example` configurations.

---

*Built for Smart India Hackathon 2026. Empowering regulators, consumers, and brands with transparent packaging compliance.*
