<div align="center">
  <h1>🌍 EcoSort Web Platform</h1>
  <p><strong>AI-Powered Waste Classification and Management System</strong></p>
  
  [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fsingharvindkumar724-beep%2FEcoSort)
  
  ![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
  ![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white)
  ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
  ![IBM Watsonx](https://img.shields.io/badge/IBM_Watsonx-052FAD?style=for-the-badge&logo=ibm&logoColor=white)
  ![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
</div>

---

## 🌟 Overview

**EcoSort** is an intelligent waste classification application built with Next.js. It leverages the power of **IBM Watsonx.ai** to accurately analyze and classify different types of waste. With an interactive chat interface and image scanning features, EcoSort helps users sort waste properly and access detailed recycling rules and statistics.

---

## ✨ Features

- 🤖 **AI-Powered Classification:** Uses `IBM Watsonx Vision & Text Models` to instantly identify and classify waste from images.
- 💬 **Interactive RAG Chat:** A built-in Retrieval-Augmented Generation agent to answer your complex recycling questions.
- 📊 **User Statistics Dashboard:** Track the environmental impact of correctly sorted waste.
- ⚡ **Lightning Fast:** Built on Next.js 16 with Turbopack for snappy interactions.
- 🎨 **Beautiful UI:** Styled with Tailwind CSS and dynamic micro-animations.

---

## 💻 Tech Stack

- **Framework:** Next.js (App Router)
- **Styling:** Tailwind CSS
- **Database:** PostgreSQL (Supabase with `pgvector`)
- **ORM:** Prisma
- **AI Integration:** IBM Watsonx (Llama 3 Vision, Granite 3, Slate Embeddings)
- **Deployment:** Vercel

---

## 🚀 Getting Started Locally

### 1. Clone the repository
```bash
git clone https://github.com/singharvindkumar724-beep/EcoSort.git
cd EcoSort/ecosort-app
```

### 2. Install dependencies
```bash
npm install
```

### 3. Setup Environment Variables
Create a `.env.local` file in the `ecosort-app` directory and add your keys:

```env
# Database
DATABASE_URL="your-supabase-transaction-pooler-url"
DIRECT_URL="your-supabase-session-pooler-url"

# IBM Watsonx
WATSONX_API_KEY="your-watsonx-api-key"
WATSONX_PROJECT_ID="your-project-id"
WATSONX_BASE_URL="https://us-south.ml.cloud.ibm.com"
WATSONX_IAM_URL="https://iam.cloud.ibm.com/identity/token"

# Models
WATSONX_VISION_MODEL_ID="meta-llama/llama-3-2-11b-vision-instruct"
WATSONX_TEXT_MODEL_ID="ibm/granite-3-8b-instruct"
WATSONX_EMBED_MODEL_ID="ibm/slate-30m-english-rtrvr-v2"
WATSONX_EMBED_DIMENSION="384"
```

### 4. Setup the Database
```bash
npx prisma generate
npx prisma db push
```

### 5. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

---

## ☁️ Deployment

EcoSort is optimized for Vercel. 
1. Push your code to GitHub.
2. Import the repository into Vercel.
3. Set the **Root Directory** to `ecosort-app`.
4. Add your Environment Variables in the Vercel dashboard.
5. Deploy!

---

<div align="center">
  <i>Built with ❤️ for a cleaner planet.</i>
</div>
