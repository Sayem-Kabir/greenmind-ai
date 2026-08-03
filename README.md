# 🌿 GreenMind AI
### Intelligent Multi-Environmental Monitoring Recommendation System

GreenMind AI is an AI-powered decision support system developed for the **Debrecen Green Sentinel Environmental Monitoring Challenge**.

Instead of only visualizing existing environmental measurements, GreenMind AI recommends the best locations for expanding Debrecen's environmental monitoring network by identifying monitoring blind spots and environmentally important areas.

---

## 🚀 Features

- 🌍 Interactive environmental monitoring dashboard
- 🤖 AI-powered sensor location recommendations
- 🌫️ Air quality suitability analysis
- 🔊 Noise suitability analysis
- 💧 Groundwater suitability analysis
- 🚌 DKV public transport integration
- 📈 Data quality assessment
- 🗺️ Interactive city map
- 🔄 Real-time sensor simulation
- 📊 Transparent AI methodology and scoring

---

## 🧠 How It Works

GreenMind AI combines multiple environmental datasets to estimate conditions at locations without monitoring stations.

The recommendation engine evaluates every candidate location using:

- Monitoring coverage
- Air pollution levels (PM2.5, PM10, NO₂, O₃)
- Wind conditions
- Historical environmental variability
- Noise estimates
- Groundwater conditions
- DKV public transport activity

Each location receives:

- Air Suitability Score
- Noise Suitability Score
- Groundwater Suitability Score
- Overall Priority Score
- Confidence Score

The highest-ranked locations are recommended for future Green Sentinel monitoring stations.

---

## 🔬 Methodology

### Data Sources

- Green Sentinel 30-day environmental dataset
- DKV public transport passenger data

### Data Preprocessing

- Standardize environmental measurements
- Remove duplicate records
- Convert invalid values to missing values
- Validate timestamps
- Clean and normalize datasets

### Environmental Estimation

Environmental conditions at unmonitored locations are estimated using:

- Inverse Distance Weighting (IDW) interpolation

Estimated variables include:

- PM2.5
- PM10
- NO₂
- O₃
- Wind Speed
- Noise Levels
- Groundwater Conditions

### Recommendation Engine

The AI calculates independent suitability scores for:

- Air Monitoring
- Noise Monitoring
- Groundwater Monitoring

These are combined into a final **Priority Score**, while a **Confidence Score** indicates prediction reliability.

---

## 🖥️ Tech Stack

### Frontend

- React
- TypeScript
- Material UI
- Leaflet
- Vite

### Backend

- FastAPI
- Python
- Pandas
- NumPy
- SciPy

### Data Processing

- IDW Interpolation
- Spatial Analysis
- Environmental Scoring
- Recommendation Engine

---

## 📂 Project Structure

```
GreenMind-AI/
│
├── backend/          # FastAPI backend
├── frontend/         # React application
├── data/             # Environmental datasets
├── notebooks/        # Data analysis notebooks
├── docs/             # Documentation
└── README.md
```

---

## ⚙️ Installation

### Clone Repository

```bash
git clone https://github.com/yourusername/GreenMind-AI.git
cd GreenMind-AI
```

### Backend

```bash
cd backend

python -m venv .venv

# Windows
.venv\Scripts\activate

# Linux / macOS
source .venv/bin/activate

pip install -r requirements.txt

uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend

npm install

npm run dev
```

---

## 🎯 Project Goal

GreenMind AI helps municipalities:

- Reduce environmental monitoring blind spots
- Improve sensor placement decisions
- Optimize investment in monitoring infrastructure
- Support evidence-based urban planning
- Simulate future monitoring network expansion

---

## 📸 Screenshots

Add screenshots here:

- Dashboard
- Recommendation Page
- Data Quality
- Methodology
- Interactive Simulation

---

## 👨‍💻 Author

**S M Sadman Sakib**

University of Debrecen

AI Demo Competition – Debrecen Green Sentinel Challenge

---

## 📄 License

This project was developed for the Debrecen AI Demo Competition.
