# TrustNews📰⚖️
> **Trust-Aware Multi-Objective Optimization & Editorial News Recommendation Framework**

TrustNews-MOO is a state-of-the-art news ranking and reading platform that addresses algorithmic filter bubbles, sensationalist clickbait, and publisher monopolies. By synthesizing **Multi-Objective Optimization (MOO)**, **Source Credibility Evaluation**, **Topical Diversity**, and **Fair Exposure Calibration**, TrustNews-MOO delivers a personalized news feed that prioritizes truth and breadth without sacrificing user relevance.

---

## 🌟 Key Features

### 1. 🎯 Multi-Objective Ranking Engine
Instead of solely optimizing for Click-Through Rate (CTR) or engagement dwell time, TrustNews-MOO evaluates articles simultaneously across five competing objectives:
- **User Relevance ($w_{\text{rel}}$)**: Semantic alignment between reader persona/reading history and article embeddings.
- **Source Credibility ($w_{\text{cred}}$)**: Algorithmic trust scoring derived from fact-checking track records, domain transparency, and editorial standards.
- **Topical Diversity ($w_{\text{div}}$)**: Intra-list diversity (ILD) metrics penalizing topical echo chambers and redundant coverage.
- **Temporal Freshness ($w_{\text{fresh}}$)**: Half-life decay modeling prioritizing timely developments.
- **Fair Exposure ($w_{\text{fair}}$)**: Gini-calibrated publisher exposure ensuring independent and local reporting receives visibility alongside legacy conglomerates.

### 2. 🗞️ Live Editorial News Feed & Global Wire
- **Real-Time Integration**: Direct connection with NewsAPI.org with seamless caching and fallback to a curated 80+ article dispatch pool.
- **Multi-Region Support**: Instant switching across United States (`us`), United Kingdom (`gb`), Canada (`ca`), Australia (`au`), Germany (`de`), France (`fr`), and India (`in`).
- **Strict Deduplication**: Dual-layer normalized headline and ID matching prevents duplicated wire syndications.
- **Clean Editorial Layout**: Magazine grid and list views with responsive 16:9 imagery, reading duration estimates, and trust badges.
- **Full Article Reader Modal**: Distraction-free reader view with keyboard navigation (`←` / `→`), font sizing, automated dwell-time telemetry, and direct source links.

### 3. 🔍 Gemini AI Fact-Checking & Credibility Inspector
- Powered by the `@google/genai` SDK and Gemini models.
- **Deep Fact Analysis**: Analyzes claims, citations, potential bias indicators, and sensationalist framing.
- **Publisher Transparency**: Displays historical accuracy ratings, ownership transparency, and methodology breakdowns.

### 4. 💬 Community Social Wire & Public Profiles
- **Interactive Wire**: Share quotes, repost articles with commentary, and engage with community insights in an X/Twitter-inspired live timeline.
- **Public Profiles**: Every user gets a persistent public profile URL (`#user-{id}`) showcasing their saved bookmarks, published reflections, and custom objective weights.
- **Saved Bookmarks**: Organize articles for deep reading across devices.

### 5. 📊 Academic Research & Evaluation Dashboard
- **Pareto Frontier Visualizer**: Interactive trade-off frontier plotting Relevance vs. Credibility vs. Diversity.
- **Benchmark Suite**: Direct evaluation on the Microsoft News Dataset (MIND-Small).
- **Statistical Significance**: Built-in Paired Student's t-test and Wilcoxon Signed-Rank tests measuring algorithmic lift.
- **Ablation Studies**: Component-wise analysis highlighting the contribution of each objective function.

---

## 🛠️ Tech Stack

- **Framework**: [React 19](https://react.dev/) + [Vite](https://vitejs.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Server**: [Express](https://expressjs.com/) on Node.js / [tsx](https://github.com/privatenumber/tsx)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Animations & Motion**: [Motion (Framer Motion v12)](https://motion.dev/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Cloud Database & Auth**: [Firebase Firestore & Firebase Auth](https://firebase.google.com/)
- **Artificial Intelligence**: [Google Gemini API (`@google/genai`)](https://ai.google.dev/)
- **Design System Elements**: Ruixen UI Components (`HaloReel`, `ProductCardHero`, `PromoteHeader`, `AccountMenu`)

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v20+ recommended)
- npm or bun

### 1. Clone the repository
```bash
git clone https://github.com/your-username/trustnews-moo.git
cd trustnews-moo
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Edit `.env` with your API credentials:
```env
# Required for Gemini AI fact-checking and automated bias analysis
GEMINI_API_KEY="your_gemini_api_key_here"

# Application host URL (defaults to http://localhost:3000 in dev)
APP_URL="http://localhost:3000"

# Optional: Real-time global headlines from NewsAPI.org
NEWS_API_KEY="your_newsapi_org_key_here"
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Run Development Server
```bash
npm run dev
```
The application will launch at `http://localhost:3000`.

### 5. Production Build
```bash
npm run build
npm start
```

---

## 📁 Project Architecture

```plaintext
├── server.ts                   # Express server with Vite middleware, NewsAPI proxy, and deduplication
├── src/
│   ├── App.tsx                 # Core application shell, route state, and live sync engine
│   ├── main.tsx                # React DOM entry point
│   ├── index.css               # Tailwind CSS v4 styling rules
│   ├── firebase.ts             # Firebase client SDK initialization
│   ├── context/
│   │   └── FirebaseContext.tsx # Context for User Auth, Bookmarks, and Social Wire posts
│   ├── algorithms/
│   │   ├── multiObjectiveOptimizer.ts # Scalarization, Pareto domination, and diversity reranking
│   │   ├── recommenderEngines.ts      # Collaborative & content-based filtering models
│   │   ├── evaluationMetrics.ts       # NDCG@K, MRR, ILD Diversity, and Gini coefficient
│   │   └── statisticalTesting.ts      # Student t-test and Wilcoxon signed-rank tests
│   ├── components/
│   │   ├── LiveFeedView.tsx           # Clean editorial news feed, pagination, and toolbar
│   │   ├── ArticleReaderModal.tsx     # Distraction-free article reader with dwell-time logs
│   │   ├── AiFactCheckInspector.tsx   # Gemini-powered fact-checking analyzer
│   │   ├── ParetoFrontierView.tsx     # 2D/3D trade-off interactive scatter plot
│   │   ├── ModelComparisonView.tsx    # Benchmark comparisons vs baseline models
│   │   ├── BiasFairnessView.tsx       # Publisher Gini curve and exposure distribution
│   │   ├── AblationStatsView.tsx      # Ablation study breakdown tables
│   │   ├── SourceCredibilityDashboard.tsx # Domain trustworthiness index
│   │   ├── UniversalSearchModal.tsx   # Instant keyboard search (Cmd/Ctrl + K)
│   │   └── Header.tsx                 # Navigation bar and account controls
│   ├── data/
│   │   ├── mindSmallDataset.ts        # Seed articles, benchmark personas, and default weights
│   │   └── newsSourcesData.ts         # Verified source ratings, bias charts, and trust scores
│   ├── ruixenui/                      # Polished UI showcase components
│   └── types/
│       └── index.ts                   # TypeScript interfaces and domain schemas
├── firestore.rules             # Granular database security rules
├── firebase-blueprint.json     # Schema blueprint documentation
└── metadata.json               # Applet capabilities and runtime permissions
```

---

## 📐 Mathematical Formulation

The ranking score $S(a, u)$ for an article $a$ and user $u$ is formulated as a scalarized multi-objective utility function:

$$S(a, u) = w_{\text{rel}} \cdot \text{Rel}(a, u) + w_{\text{cred}} \cdot \text{Cred}(a) + w_{\text{fresh}} \cdot \text{Fresh}(a) + w_{\text{div}} \cdot \text{Div}(a, R) - \lambda \cdot \text{GiniPenalty}(P)$$

Where:
- $\text{Rel}(a, u)$ represents cosine similarity between user history embeddings and article latent features.
- $\text{Cred}(a) \in [0, 1]$ represents the algorithmic source trustworthiness score.
- $\text{Fresh}(a) = \exp(-\lambda_t \cdot \Delta t)$ represents exponential temporal decay.
- $\text{Div}(a, R) = \frac{1}{|R|} \sum_{r \in R} (1 - \text{Sim}(a, r))$ computes minimum distance to already ranked items.
- $\sum w_i = 1.0$ constrained over non-negative objective weights.

---

## 🔒 Security & Privacy

- **Client Environment Protection**: Secret keys (`GEMINI_API_KEY`) remain secure on the Express server and are never exposed to client-side bundles.
- **Firestore Security Rules**: Database rules enforce that users may only create, edit, or delete their own bookmarks, weights, and reposted reflections.
- **Privacy-Preserving Telemetry**: Dwell-time logging and reading sessions are stored strictly under authenticated user tokens.

---

## 📄 License

This project is licensed under the Apache License 2.0. See the `LICENSE` file for details.
