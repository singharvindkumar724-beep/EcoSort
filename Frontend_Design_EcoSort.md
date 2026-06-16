# Frontend Design Specifications: EcoSort Web Platform

**UI/UX & Interaction Guidelines**

| | |
|---|---|
| **Document Owner** | Design & Frontend Engineering |
| **Status** | Draft v1.0 |
| **Scope** | Web Platform (Desktop & Mobile Web) |

---

## 1. Executive Summary

This document outlines the frontend design language for the EcoSort Web Platform. It merges top-tier, modern web interaction trends with Google's Material Design 3 Expressive guidelines to create a highly tactile, engaging, and environmentally resonant user experience. Built on our chosen stack of Next.js and Tailwind CSS, this design system ensures the platform feels premium, trustworthy, and deeply integrated with nature.

---

## 2. Trending Frontend & Interaction Specifications

To drive immersion and tell a compelling visual story regarding waste impact, EcoSort will utilize the following high-end interaction patterns:

| Feature Name | Technical Specification | EcoSort Implementation |
|---|---|---|
| **Scrollytelling** | Scroll-driven animations via CSS Scroll-driven Animations or GSAP ScrollTrigger. | As the user scrolls through the onboarding or impact pages, a plastic bottle smoothly morphs into a green leaf or recycled material to visually demonstrate the impact of correct sorting. |
| **Parallax Scrolling** | Multi-layered background and foreground elements moving at different speeds. | Background lush forest scenes move slower than the foreground user metric cards, creating a deep 3D spatial effect. |
| **Bento Grid Layout** | CSS Grid with varied item sizes and heavily rounded corners (24px to 32px). | Used for the "Impact" dashboard to display sustainability stats, waste impact numbers, and quick-action tool cards in a clean, easily scannable grid. |
| **Micro-interactions** | Custom hover states utilizing magnetic effects and tactile spring physics. | Buttons subtly pull toward the user's cursor on desktop. On mobile and desktop, tapping a waste category triggers a satisfying "bounce" reaction. |
| **Glassmorphism** | `backdrop-filter: blur(12px)`, translucent background, and a 1px white border. | Floating navigation bars, chat widgets, and dashboard cards will appear as sleek, frosted glass sheets overlaid on rich green nature backgrounds. |

---

## 3. Rich & Aesthetic Color Combos (Trending + Sustainable)

EcoSort will utilize the 60-30-10 UI rule (60% dominant background, 30% structural elements, 10% vivid accent sparks) to maintain visual balance. The application supports theme switching based on user preference or time of day.

### Theme 1: Eco-Premium (Light Mode Default)
*High-contrast, clean, looks premium and trustworthy.*
*   **Dominant (60%):** `#F4F6F0` (Off-White/Bone)
*   **Secondary (30%):** `#1A3020` (Deep Forest Green)
*   **Accent (10%):** `#00E676` (Vibrant Electric Lime)

### Theme 2: Earth & Tech (Dark Mode Default)
*Dark-mode focused, mysterious, sleek, and highly modern.*
*   **Dominant (60%):** `#0D1310` (Deep Carbon Dark)
*   **Secondary (30%):** `#E2E8F0` (Recycled Paper Grey)
*   **Accent (10%):** `#34D399` (Digital Mint)

### Theme 3: Terracotta Bio (Warm Alternative)
*Warm, organic, friendly, and deeply connected to nature.*
*   **Dominant (60%):** `#FAF7F2` (Warm Clay)
*   **Secondary (30%):** `#4A3525` (Mud Soil Brown)
*   **Accent (10%):** `#FF8A65` (Vibrant Coral Orange)

---

## 4. Google Web & Pixel Phone UI/UX Specifications

To ensure the web platform feels modern, personal, and context-aware, EcoSort will heavily adopt Material Design 3 Expressive principles, mirroring the fluidity of Google Pixel UI.

### Typography
*   **Font Family:** Google Sans Flex or Roboto Flex.
*   **Behavior:** Employs responsive font scaling. Large, bold headlines (Display Large) will fluidly scale up or down depending on the user's screen size (critical for mobile web adaptation).

### Dynamic Color (Material You Engine)
*   **Behavior:** Color tones will pull dynamically from imagery. The website theme adjusts subtly depending on the section image. For example, navigating to a lush forest page shifts the UI tints to a soft moss green.

### Shapes & Containers
*   **Specs:** Extreme corner radius (28px to 48px) and asymmetrical pill shapes.
*   **Implementation:** We will use highly rounded cards. Navigation links will dynamically transform into fully rounded pill-shaped buttons when marked as active.

### Buttons & Pill Menus
*   **Specs:** Dynamic-width menu pills that hug content tightly.
*   **Implementation:** Navigation items will expand or shrink horizontally based strictly on their text length, matching the fluid behavior of Pixel's quick settings panel.

### Card Styles
*   **Hierarchy:** Utilizing Elevated, Filled, and Outlined card containers.
*   **Implementation:** Filled cards will be used for data layouts (like the disposal history). Thin, outlined cards with light borders will be used for clickable waste-category tiles (e.g., Plastic, Organic, Hazardous).

### Tactile Motion & Feedback
*   **Specs:** Fluid stretch-overscroll physics and smooth color-morphing progress indicators.
*   **Implementation:** Recycling goal trackers and gamification streaks will use smooth, wave-form loading meters instead of basic flat loading bars, enhancing the organic feel of the application.
