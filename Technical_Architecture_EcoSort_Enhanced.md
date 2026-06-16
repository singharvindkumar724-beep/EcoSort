# Technical Architecture Document: EcoSort Web Platform (Enhanced)

**AI-Powered Waste Segregation & Recycling Guide — Web App**

| | |
|---|---|
| **Document Owner** | Engineering |
| **Status** | Draft v1.1 |
| **Scope** | MVP (single city, web app) |

---

## 1. Architecture Overview

EcoSort's MVP is a server-rendered web application featuring a lightweight API layer. It utilizes a relational database for structured data, including rules, users, and logs. Furthermore, it employs a vector store for the RAG knowledge base. To minimize infrastructure overhead during the MVP stage, the AI layer—comprising image classification and the LLM—is accessed via external API calls rather than self-hosted models. 

Building this as a single deployable unit (Next.js) reduces operational complexity, providing a unified repository and deployment pipeline. If scaling demands it later, the database schema and API contracts are designed to allow a straightforward split into separate frontend and backend services.

---

## 2. Enhanced Tech Stack

### 2.1 Frontend
*   **Next.js (React, App Router):** Server components reduce client bundle size, which is critical for mobile-web users on slower connections. Built-in image optimization directly supports the core photo upload feature.
*   **TypeScript:** Catches errors at compile time and ensures data shapes flowing between AI responses, RAG results, and the database are strictly typed.
*   **Tailwind CSS:** Enables fast UI iteration for the MVP.
*   **PWA Capabilities:** Allows for camera access via `<input type="file" capture="environment">` and an installable, near-native feel without app store overhead.

### 2.2 Backend & Infrastructure
*   **Next.js API Routes:** Handles image uploads, classification proxies, RAG queries, and points calculations. 
*   **Zod:** Validates API inputs and outputs at runtime, pairing naturally with TypeScript to handle unpredictable AI responses.
*   **Docker Containerization:** To ensure the application behaves consistently from local development to production, the entire Next.js application will be containerized using Docker. 
*   **CI/CD Pipeline (GitHub Actions):** We will leverage GitHub Actions to automate testing, linting, and building the Docker images upon every push to the main branch.

### 2.3 Database
*   **PostgreSQL:** Ensures relational integrity between users, logs, and waste rules.
*   **pgvector Extension:** Allows for storing embeddings alongside relational data in the same Postgres instance, avoiding the need for a separate vector database at this stage.
*   **Prisma (ORM):** Provides type-safe database access and predictable schema migrations.

### 2.4 AI / ML Services & Agentic Logic
*   **IBM Granite Vision via watsonx.ai:** Evaluates user photos against a constrained prompt to categorize items into one of the designated categories. This trades some custom model accuracy for rapid speed-to-market.
*   **Agentic RAG Workflow (watsonx.ai Text Models):** Instead of a simple pass-through LLM call, the backend will utilize an agentic workflow. The IBM Granite text model will evaluate the retrieved context. If the RAG retrieval yields low confidence or ambiguous instructions, the agent will autonomously trigger a clarifying question back to the user before committing to a final disposal recommendation.
*   **watsonx.ai Embeddings:** Used to embed the local waste-rules documents for vector similarity search.
*   **IAM-Based Authentication:** API keys are exchanged for short-lived access tokens, requiring dedicated token-refresh logic in the application wrapper.

---

## 3. Database Schema Highlights & Seeding

The database relies on strict entity relationships. 

*   A **User** represents a device ID and belongs to a **Locality**. 
*   A **WasteRule** dictates disposal guidance, stores the vector `embedding` for RAG, and is linked to a Locality.
*   A **ClassificationEvent** acts as an audit record logging the AI's predicted category and confidence score, without storing the image itself.
*   A **DisposalLog** tracks actions for point generation, denormalizing the `item_label` and `category` so history remains accurate even if rules change.

**Initial Data Seeding:**
To validate the MVP, the `prisma/seed.ts` script will be initially configured to populate the `locality` table with Varanasi. The corresponding `waste_rule` entries will be strictly mapped to the specific wet/dry municipal segregation guidelines of Varanasi, establishing a highly accurate foundational RAG database before expanding to other regions.

---

## 4. Critical Configuration & Privacy Safeguards

*   **Zero Image Retention:** To comply with privacy commitments, uploaded photos must not be retained. The system will process the image in-memory in the API route and never write it to persistent storage.
*   **Embedding Dimension Lock-in:** The chosen embeddings model has a fixed output dimension. This dimension must be definitively selected before writing the `vector(N)` column in the Prisma schema to avoid disruptive migrations.
*   **Configurable Thresholds:** The `CLASSIFICATION_CONFIDENCE_THRESHOLD` will be exposed as an environment variable. This allows the team to easily tune when the AI should provide a direct answer versus asking a clarifying question without requiring a new code deployment.
*   **API Rate Limiting:** Basic rate limiting will be applied to the AI API routes per device ID or IP address to prevent abuse and manage external API costs.
