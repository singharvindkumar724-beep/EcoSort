# Product Requirements Document: EcoSort Web Platform

**An AI-Powered Waste Segregation & Recycling Web Platform**

| | |
|---|---|
| **Document Owner** | Product / Engineering Team |
| **Status** | Draft v2.0 (Web Platform Pivot) |
| **Stage** | Pre-MVP / Concept Validation |

---

## 1. Executive Summary

EcoSort is a responsive, full-stack web application that helps people correctly identify, sort, and dispose of household waste. Users can access the platform via any desktop or mobile browser to upload or snap a photo of an item, or describe it in chat. The AI-driven backend utilizes image classification and retrieval-augmented generation (RAG) to determine the item's category and provide locally accurate disposal instructions. By removing the friction of a native app download, EcoSort Web aims to seamlessly integrate into the daily routines of households, schools, and offices.

---

## 2. Problem Statement

Recycling systems fail because **segregation at the source is inconsistent and confusing**. A single contaminated item can spoil an entire batch of recyclable material.

* Disposal rules vary drastically by municipality and waste contractor.
* Packaging materials are increasingly composite and visually ambiguous.
* Information is static (PDFs, posters) and hard to find.
* **Web-Specific Context:** Schools, local offices, and apartment complex managers often lack a centralized, accessible tool that works across all their existing devices without requiring mobile app installations.

---

## 3. Target Users & Personas

| Persona | Description | Primary Need | Platform Preference |
|---|---|---|---|
| **Priya, the resident** | 28, apartment renter, wants to segregate waste correctly. | Quick, trustworthy answers at the point of disposal. | Mobile Web Browser |
| **Aanya, the eco-club student** | 16, running a school sustainability campaign. | A simple tool to teach peers and track participation. | School Chromebook/Desktop & Mobile Web |
| **Mr. Sharma, facility manager** | Manages waste compliance for 200 flats. | Aggregate visibility into segregation. | Desktop Browser |

*Primary persona for MVP: Priya and Aanya.*

---

## 4. Goals & Non-Goals

### Goals (MVP)
* Deliver a fully responsive web experience (UI adapts seamlessly from a 4K monitor to a mobile screen).
* Identify waste items via webcam capture or file drag-and-drop under 10 seconds.
* Provide local, RAG-grounded disposal instructions.
* Implement lightweight gamification (points/streaks) using browser local storage or lightweight user sessions.

### Non-Goals (Out of Scope for MVP)
* Native iOS/Android applications.
* Complex multi-tenant B2B admin dashboards.
* Hardware integration (smart bins).
* Real-world voucher redemption.

---

## 5. Proposed Technical Stack

Building this as a full-stack web application requires a robust, scalable architecture. 

| Layer | Recommended Technologies | Rationale |
|---|---|---|
| **Frontend** | React or Next.js, Tailwind CSS | Ensures a highly responsive, modular UI. Next.js offers SEO benefits and easy API route integration. |
| **Backend & AI** | Python (FastAPI or Flask) | Python is ideal for handling the image classification models and agentic workflows for the RAG chat system. |
| **Database** | PostgreSQL or MongoDB | For storing local waste rules, user disposal logs, and gamification data. |
| **Infrastructure** | Docker, Cloud Provider (AWS/GCP), GitHub | Containerizing the application with Docker ensures consistency across development and production environments. CI/CD pipelines via GitHub Actions. |

---

## 6. Core Features & Web Modifications

| Feature | Web Implementation Details |
|---|---|
| **Item Identification** | **Desktop:** Drag-and-drop zone or file browser upload. <br>**Mobile Web:** HTML5 `<input type="file" accept="image/*" capture="environment">` to trigger the native device camera. |
| **Disposal Guidance** | Fast API response rendering locally relevant rules retrieved from the RAG database. |
| **Chat Interface** | A persistent chat widget or dedicated page for text-based queries ("Is a tetra pack recyclable here?"). |
| **Progressive Web App (PWA)** | Configured with a `manifest.json` and service workers so users can "Add to Homescreen" for an app-like feel and caching of core UI assets. |

---

## 7. User Flow (End-to-End)

1.  **Onboarding:**
    * User navigates to `ecosort.app` (example domain).
    * Responsive welcome screen: Selects city/locality to load the correct ruleset.
2.  **Core Loop (Desktop):**
    * User drags an image of a plastic container into the upload zone.
    * Backend processes the image → returns category and local instructions.
3.  **Core Loop (Mobile Web):**
    * User taps "Take Photo" → Browser requests camera permissions → user snaps photo.
    * Results and points are displayed on a mobile-optimized card UI.
4.  **Fallback / Chat:**
    * If the image is blurry, the AI agent asks a clarifying text question directly in the browser UI.

---

## 8. MVP Definition & Pilot Launch

The MVP will focus on a single locality to prove the RAG model's accuracy and the frontend's responsiveness.

* **Pilot Location:** Varanasi, Uttar Pradesh (allows testing of Indian municipal wet/dry waste guidelines).
* **Item Identification:** Top 30-50 household items.
* **Platform:** Fully responsive web application, containerized and deployed to a standard cloud instance.
* **Authentication:** Frictionless (cookie/local-storage based) or simple OAuth (Google/GitHub login) to track points across devices.

---

## 9. Success Metrics

| Metric | Target (First 90 days) |
|---|---|
| Cross-Device Usage | Minimum 30% traffic from Desktop, 50% from Mobile Web. |
| Classification Accuracy | ≥ 85% for the top 30 pilot items. |
| Time to First Meaningful Paint (FCP) | < 1.5 seconds (crucial for mobile web retention). |
| Return Visitor Rate | ≥ 20% week-over-week. |
