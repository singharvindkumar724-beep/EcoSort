import Link from "next/link";
import { BentoGrid, BentoCard } from "@/components/ui/BentoGrid";
import { 
  Leaf, Recycle, AlertTriangle, Ban, BrickWall, Trash2, 
  ClipboardList, Target, Zap, FolderOpen, Camera, MessageSquare, 
  Bot, Lock, CheckCircle2, Cpu, Stethoscope, Armchair, Shirt, Wrench
} from "lucide-react";

// ─── Category icons and colors ────────────────────────────────────────────────
const CATEGORIES = [
  { icon: <Leaf size={24} />, label: "Wet/Organic",  color: "#4CAF50", bg: "#E8F5E9", desc: "Food scraps, peels, garden waste" },
  { icon: <Recycle size={24} />, label: "Recyclable",   color: "#2196F3", bg: "#E3F2FD", desc: "Paper, glass, clean plastics" },
  { icon: <AlertTriangle size={24} />, label: "Hazardous",   color: "#F44336", bg: "#FFEBEE", desc: "Batteries, e-waste, chemicals" },
  { icon: <Ban size={24} />, label: "Sanitary",    color: "#9C27B0", bg: "#F3E5F5", desc: "Diapers, sanitary products" },
  { icon: <BrickWall size={24} />, label: "Inert",       color: "#FF9800", bg: "#FFF3E0", desc: "Thermocol, ceramics, MLP" },
  { icon: <Cpu size={24} />, label: "E-Waste",       color: "#607D8B", bg: "#ECEFF1", desc: "Phones, cables, appliances" },
  { icon: <Stethoscope size={24} />, label: "Biomedical", color: "#D32F2F", bg: "#FFEBEE", desc: "Medicines, bandages, syringes" },
  { icon: <Armchair size={24} />, label: "Bulky",         color: "#795548", bg: "#EFEBE9", desc: "Furniture, mattresses" },
  { icon: <Shirt size={24} />, label: "Textile",       color: "#009688", bg: "#E0F2F1", desc: "Clothes, fabrics, shoes" },
  { icon: <Wrench size={24} />, label: "Metal Scrap",  color: "#455A64", bg: "#CFD8DC", desc: "Scrap metal, aluminum cans" },
];

// ─── Impact stats ─────────────────────────────────────────────────────────────
const IMPACT_STATS = [
  { value: "40+",     label: "Waste Rules",    sub: "Varanasi-specific",    icon: <ClipboardList size={32} /> },
  { value: "85%",     label: "Target Accuracy", sub: "For top 30 items",   icon: <Target size={32} /> },
  { value: "< 10s",   label: "Classification", sub: "Per item scan",        icon: <Zap size={32} /> },
  { value: "11 Cats", label: "Categories",     sub: "Full coverage",        icon: <FolderOpen size={32} /> },
];

export default function HomePage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--eco-bg)",
        paddingBottom: "80px",
      }}
    >
      {/* ── Hero Section ─────────────────────────────────────────────────── */}
      <section
        id="hero"
        style={{
          minHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "60px 20px 40px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background decorative circles */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: "-100px",
            right: "-100px",
            width: "500px",
            height: "500px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(0,230,118,0.08) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
        <div
          aria-hidden
          style={{
            position: "absolute",
            bottom: "-80px",
            left: "-80px",
            width: "400px",
            height: "400px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(26,48,32,0.06) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        {/* Badge */}
        <div
          className="animate-fade-in"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            background: "rgba(0, 230, 118, 0.12)",
            border: "1px solid rgba(0, 230, 118, 0.3)",
            borderRadius: "9999px",
            padding: "6px 16px",
            marginBottom: "28px",
            fontSize: "0.8125rem",
            fontWeight: 500,
            color: "var(--eco-structure)",
          }}
        >
          <Leaf size={16} />
          <span>Varanasi Pilot — MVP v1.0</span>
        </div>

        {/* Headline */}
        <h1
          className="animate-fade-in-up delay-100"
          style={{
            fontSize: "clamp(2.5rem, 7vw, 5.5rem)",
            fontWeight: 900,
            lineHeight: 1.05,
            letterSpacing: "-0.035em",
            color: "var(--eco-structure)",
            maxWidth: "820px",
            marginBottom: "24px",
          }}
        >
          Sort Smarter.{" "}
          <span
            style={{
              background: "linear-gradient(135deg, #00E676, #00C853)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Live Greener.
          </span>
        </h1>

        {/* Subheadline */}
        <p
          className="animate-fade-in-up delay-200"
          style={{
            fontSize: "clamp(1rem, 2.5vw, 1.25rem)",
            color: "var(--eco-text-muted)",
            maxWidth: "560px",
            marginBottom: "40px",
            lineHeight: 1.6,
          }}
        >
          AI-powered waste segregation for Varanasi. Snap a photo, get instant
          disposal guidance based on{" "}
          <strong style={{ color: "var(--eco-structure)" }}>local municipal rules</strong>.
        </p>

        {/* CTAs */}
        <div
          className="animate-fade-in-up delay-300"
          style={{
            display: "flex",
            gap: "12px",
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          <Link href="/scan" id="cta-scan" className="btn-eco" style={{ fontSize: "1rem", padding: "14px 32px", display: "flex", gap: "8px", alignItems: "center" }}>
            <Camera size={18} /> Scan Waste Item
          </Link>
          <Link href="/chat" id="cta-chat" className="btn-ghost" style={{ fontSize: "1rem", display: "flex", gap: "8px", alignItems: "center" }}>
            <MessageSquare size={18} /> Ask EcoBot
          </Link>
        </div>

        {/* Quick stats strip */}
        <div
          className="animate-fade-in-up delay-400"
          style={{
            display: "flex",
            gap: "32px",
            marginTop: "60px",
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          {[
            { value: "37", label: "Varanasi Rules" },
            { value: "5", label: "Waste Categories" },
            { value: "Free", label: "Always" },
          ].map((stat) => (
            <div key={stat.label} style={{ textAlign: "center" }}>
              <div
                style={{
                  fontSize: "1.75rem",
                  fontWeight: 800,
                  color: "var(--eco-structure)",
                  letterSpacing: "-0.03em",
                }}
              >
                {stat.value}
              </div>
              <div style={{ fontSize: "0.8125rem", color: "var(--eco-text-muted)" }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it Works ─────────────────────────────────────────────────── */}
      <section
        id="how-it-works"
        style={{ padding: "40px 20px 60px", maxWidth: "1100px", margin: "0 auto" }}
      >
        <h2
          className="scroll-reveal"
          style={{
            fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
            fontWeight: 800,
            color: "var(--eco-structure)",
            marginBottom: "8px",
            letterSpacing: "-0.025em",
          }}
        >
          How EcoSort Works
        </h2>
        <p style={{ color: "var(--eco-text-muted)", marginBottom: "36px", maxWidth: "480px" }}>
          Three steps to correct waste disposal — in under 10 seconds.
        </p>

        <BentoGrid columns={3} gap={16}>
          {[
            {
              step: "01",
              icon: <Camera size={40} />,
              title: "Snap or Upload",
              desc: "Take a photo with your device camera or drag-and-drop an image into EcoSort.",
              accent: "#00E676",
            },
            {
              step: "02",
              icon: <Bot size={40} />,
              title: "AI Analyses",
              desc: "IBM Granite Vision identifies the item. If uncertain, it asks a clarifying question.",
              accent: "#00BCD4",
            },
            {
              step: "03",
              icon: <Recycle size={40} />,
              title: "Dispose Right",
              desc: "Get step-by-step disposal instructions matched to Varanasi Nagar Nigam guidelines.",
              accent: "#4CAF50",
            },
          ].map((card, i) => (
            <BentoCard
              key={card.step}
              variant="glass"
              id={`how-step-${i + 1}`}
              className={`animate-fade-in-up delay-${(i + 1) * 100}`}
            >
              <div
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  color: card.accent,
                  letterSpacing: "0.1em",
                  marginBottom: "12px",
                }}
              >
                STEP {card.step}
              </div>
              <div style={{ marginBottom: "12px", color: card.accent }}>{card.icon}</div>
              <h3
                style={{
                  fontSize: "1.125rem",
                  fontWeight: 700,
                  color: "var(--eco-structure)",
                  marginBottom: "8px",
                }}
              >
                {card.title}
              </h3>
              <p style={{ fontSize: "0.875rem", color: "var(--eco-text-muted)", lineHeight: 1.5 }}>
                {card.desc}
              </p>
            </BentoCard>
          ))}
        </BentoGrid>
      </section>

      {/* ── Impact Dashboard (Bento) ──────────────────────────────────────── */}
      <section
        id="impact"
        style={{ padding: "40px 20px", maxWidth: "1100px", margin: "0 auto" }}
      >
        <h2
          className="scroll-reveal"
          style={{
            fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
            fontWeight: 800,
            color: "var(--eco-structure)",
            marginBottom: "36px",
            letterSpacing: "-0.025em",
          }}
        >
          Platform Impact
        </h2>

        <BentoGrid columns={3} gap={16}>
          {/* Large accent card */}
          <BentoCard variant="accent" span={2} id="impact-hero-card">
            <div style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: "180px" }}>
              <div>
                <div style={{ fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.1em", opacity: 0.7, marginBottom: "8px" }}>
                  MISSION
                </div>
                <h3 style={{ fontSize: "1.5rem", fontWeight: 800, letterSpacing: "-0.02em", marginBottom: "8px" }}>
                  Zero Contamination,<br />One Bin at a Time
                </h3>
                <p style={{ opacity: 0.75, fontSize: "0.875rem", maxWidth: "360px", lineHeight: 1.5 }}>
                  A single contaminated item can spoil an entire batch of recyclables.
                  EcoSort eliminates that uncertainty with AI precision.
                </p>
              </div>
              <Link
                href="/scan"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "var(--eco-accent)",
                  color: "var(--eco-structure)",
                  borderRadius: "9999px",
                  padding: "10px 20px",
                  fontWeight: 600,
                  fontSize: "0.875rem",
                  textDecoration: "none",
                  alignSelf: "flex-start",
                  marginTop: "20px",
                }}
              >
                Start Scanning →
              </Link>
            </div>
          </BentoCard>

          {/* Stats */}
          {IMPACT_STATS.slice(0, 1).map((s) => (
            <BentoCard key={s.label} variant="glass" id={`stat-${s.label.replace(/ /g, "-").toLowerCase()}`}>
              <div style={{ textAlign: "center", padding: "8px 0" }}>
                <div style={{ display: "flex", justifyContent: "center", color: "var(--eco-accent)", marginBottom: "12px" }}>{s.icon}</div>
                <div style={{ fontSize: "2.25rem", fontWeight: 900, color: "var(--eco-structure)", letterSpacing: "-0.04em", lineHeight: 1 }}>
                  {s.value}
                </div>
                <div style={{ fontWeight: 600, color: "var(--eco-text)", marginTop: "4px", fontSize: "0.9rem" }}>
                  {s.label}
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--eco-text-muted)", marginTop: "2px" }}>
                  {s.sub}
                </div>
              </div>
            </BentoCard>
          ))}

          {/* Remaining stats */}
          {IMPACT_STATS.slice(1).map((s) => (
            <BentoCard key={s.label} variant="solid" id={`stat-${s.label.replace(/ /g, "-").toLowerCase()}`}>
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "16px",
                    background: "rgba(0, 230, 118, 0.12)",
                    color: "var(--eco-accent-dim)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {s.icon}
                </div>
                <div>
                  <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--eco-structure)", letterSpacing: "-0.03em", lineHeight: 1 }}>
                    {s.value}
                  </div>
                  <div style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--eco-text)" }}>
                    {s.label}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--eco-text-muted)" }}>
                    {s.sub}
                  </div>
                </div>
              </div>
            </BentoCard>
          ))}

          {/* Categories card */}
          <BentoCard variant="glass" span={3} id="categories-card">
            <h3
              style={{
                fontSize: "1rem",
                fontWeight: 700,
                color: "var(--eco-structure)",
                marginBottom: "16px",
              }}
            >
              Waste Categories Covered
            </h3>
            <div
              style={{
                display: "flex",
                gap: "12px",
                flexWrap: "wrap",
              }}
            >
              {CATEGORIES.map((cat) => (
                <div
                  key={cat.label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    background: cat.bg,
                    borderRadius: "16px",
                    padding: "10px 16px",
                    border: `1px solid ${cat.color}22`,
                    flex: "1 1 180px",
                  }}
                >
                  <div style={{ color: cat.color }}>{cat.icon}</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "0.875rem", color: cat.color }}>
                      {cat.label}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--eco-text-muted)" }}>
                      {cat.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </BentoCard>
        </BentoGrid>
      </section>

      {/* ── Privacy Banner ────────────────────────────────────────────────── */}
      <section
        id="privacy"
        style={{ padding: "40px 20px", maxWidth: "1100px", margin: "0 auto" }}
      >
        <div
          className="glass-card"
          style={{
            padding: "32px",
            display: "flex",
            alignItems: "center",
            gap: "24px",
            flexWrap: "wrap",
          }}
        >
          <div style={{ color: "var(--eco-structure)" }}><Lock size={48} strokeWidth={1.5} /></div>
          <div style={{ flex: 1, minWidth: "240px" }}>
            <h3
              style={{
                fontSize: "1.25rem",
                fontWeight: 700,
                color: "var(--eco-structure)",
                marginBottom: "8px",
              }}
            >
              Zero Image Retention
            </h3>
            <p style={{ color: "var(--eco-text-muted)", fontSize: "0.9rem", lineHeight: 1.5 }}>
              Your photos are <strong>never stored</strong>. Images are processed
              in-memory and discarded immediately after classification. Only a
              cryptographic hash is retained for audit purposes — your privacy is
              a core architectural constraint.
            </p>
          </div>
          <div
            style={{
              background: "rgba(0, 230, 118, 0.10)",
              border: "1px solid rgba(0, 230, 118, 0.3)",
              borderRadius: "12px",
              padding: "8px 16px",
              fontSize: "0.8125rem",
              fontWeight: 600,
              color: "var(--eco-structure)",
              whiteSpace: "nowrap",
            }}
          >
            <CheckCircle2 size={16} /> Privacy Safe
          </div>
        </div>
      </section>
    </div>
  );
}
