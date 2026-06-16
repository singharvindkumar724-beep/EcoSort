"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Camera, MessageSquare, Lightbulb, Leaf, Recycle, Ban, Building2 } from "lucide-react";
import { BentoGrid, BentoCard } from "@/components/ui/BentoGrid";

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserStats {
  totalPoints: number;
  currentStreak: number;
  longestStreak: number;
  level: number;
  totalScans: number;
}

const LEVEL_THRESHOLDS = [0, 100, 250, 500, 1000, 2000];
const LEVEL_NAMES      = ["Seedling 🌱", "Sprout 🌿", "Sapling 🌳", "Forest 🌲", "Eco Warrior 🦺", "Green Legend 🏆"];

function getLevel(points: number) {
  let level = 0;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (points >= LEVEL_THRESHOLDS[i]) level = i;
  }
  return level;
}

function getLevelProgress(points: number) {
  const level = getLevel(points);
  const current = LEVEL_THRESHOLDS[level] ?? 0;
  const next    = LEVEL_THRESHOLDS[level + 1] ?? LEVEL_THRESHOLDS[level];
  if (next === current) return 100;
  return Math.round(((points - current) / (next - current)) * 100);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [stats, setStats] = useState<UserStats>({
    totalPoints:   0,
    currentStreak: 0,
    longestStreak: 0,
    level:         0,
    totalScans:    0,
  });

  // Load stats from localStorage (frictionless auth)
  useEffect(() => {
    const deviceId = localStorage.getItem("ecosort_device_id");
    if (!deviceId) return;

    // Fetch from API
    fetch(`/api/user/stats?deviceId=${deviceId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.data) setStats(data.data);
      })
      .catch(() => {
        // Silently fail — dashboard still renders with 0 stats
      });
  }, []);

  const level         = getLevel(stats.totalPoints);
  const levelProgress = getLevelProgress(stats.totalPoints);
  const levelName     = LEVEL_NAMES[level] ?? LEVEL_NAMES[0];
  const nextLevelPts  = LEVEL_THRESHOLDS[level + 1];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--eco-bg)",
        padding: "40px 20px 80px",
      }}
    >
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>

        {/* ── Header ───────────────────────────────────────────────────────── */}
        <div style={{ marginBottom: "36px" }}>
          <h1
            style={{
              fontSize: "clamp(2rem, 5vw, 3rem)",
              fontWeight: 900,
              color: "var(--eco-structure)",
              letterSpacing: "-0.03em",
              marginBottom: "8px",
            }}
          >
            Your Impact Dashboard
          </h1>
          <p style={{ color: "var(--eco-text-muted)" }}>
            Track your waste segregation journey in Varanasi
          </p>
        </div>

        {/* ── Bento Grid ───────────────────────────────────────────────────── */}
        <BentoGrid columns={3} gap={16}>

          {/* Level card — large accent */}
          <BentoCard variant="accent" span={2} id="level-card">
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", height: "100%", minHeight: "160px" }}>
              <div>
                <div style={{ fontSize: "0.75rem", letterSpacing: "0.1em", opacity: 0.6, marginBottom: "4px" }}>
                  YOUR LEVEL
                </div>
                <div style={{ fontSize: "2rem", fontWeight: 900, letterSpacing: "-0.02em" }}>
                  {levelName}
                </div>
                <div style={{ fontSize: "0.875rem", opacity: 0.7, marginTop: "4px" }}>
                  Level {level + 1} of {LEVEL_NAMES.length}
                </div>
              </div>

              {/* Wave progress bar */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "0.75rem", opacity: 0.7 }}>
                  <span>{stats.totalPoints} pts</span>
                  {nextLevelPts && <span>Next: {nextLevelPts} pts</span>}
                </div>
                <div className="progress-wave">
                  <div
                    className="progress-wave-fill"
                    style={{
                      width: `${levelProgress}%`,
                      background: "linear-gradient(90deg, rgba(0,230,118,0.9), rgba(0,200,83,0.8))",
                    }}
                  />
                </div>
                <div style={{ fontSize: "0.75rem", opacity: 0.6, marginTop: "4px" }}>
                  {levelProgress}% to next level
                </div>
              </div>
            </div>
          </BentoCard>

          {/* Points card */}
          <BentoCard variant="glass" id="points-card">
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "3rem", marginBottom: "4px" }}>⭐</div>
              <div
                style={{
                  fontSize: "3rem",
                  fontWeight: 900,
                  color: "var(--eco-structure)",
                  letterSpacing: "-0.04em",
                  lineHeight: 1,
                  marginBottom: "4px",
                }}
              >
                {stats.totalPoints.toLocaleString()}
              </div>
              <div style={{ fontWeight: 700, color: "var(--eco-text)", fontSize: "0.9rem" }}>
                Total Points
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--eco-text-muted)", marginTop: "4px" }}>
                +10 pts per scan · +5 per chat
              </div>
            </div>
          </BentoCard>

          {/* Streak card */}
          <BentoCard variant="solid" id="streak-card">
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div
                className={stats.currentStreak > 0 ? "animate-pulse-eco" : ""}
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "20px",
                  background: stats.currentStreak > 0
                    ? "rgba(0, 230, 118, 0.15)"
                    : "var(--eco-surface)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.75rem",
                  flexShrink: 0,
                }}
              >
                🔥
              </div>
              <div>
                <div
                  style={{
                    fontSize: "2rem",
                    fontWeight: 900,
                    color: stats.currentStreak > 0 ? "var(--eco-accent)" : "var(--eco-text)",
                    letterSpacing: "-0.03em",
                    lineHeight: 1,
                  }}
                >
                  {stats.currentStreak}
                </div>
                <div style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--eco-text)" }}>
                  Day Streak
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--eco-text-muted)" }}>
                  Best: {stats.longestStreak} days
                </div>
              </div>
            </div>
          </BentoCard>

          {/* Total scans */}
          <BentoCard variant="solid" id="scans-card">
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "20px",
                  background: "rgba(33, 150, 243, 0.10)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.75rem",
                  flexShrink: 0,
                }}
              >
                <Camera size={28} />
              </div>
              <div>
                <div
                  style={{
                    fontSize: "2rem",
                    fontWeight: 900,
                    color: "var(--eco-structure)",
                    letterSpacing: "-0.03em",
                    lineHeight: 1,
                  }}
                >
                  {stats.totalScans}
                </div>
                <div style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--eco-text)" }}>
                  Items Scanned
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--eco-text-muted)" }}>
                  Keep going! 🌍
                </div>
              </div>
            </div>
          </BentoCard>

          {/* CTA card */}
          <BentoCard variant="glass" id="cta-card">
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", height: "100%" }}>
              <div>
                <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--eco-accent)", letterSpacing: "0.08em", marginBottom: "6px" }}>
                  NEXT ACTION
                </div>
                <h3 style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--eco-structure)", marginBottom: "6px" }}>
                  Scan Your Next Item
                </h3>
                <p style={{ fontSize: "0.8125rem", color: "var(--eco-text-muted)", lineHeight: 1.5 }}>
                  Every correct disposal helps reduce waste contamination in Varanasi.
                </p>
              </div>
              <div style={{ display: "flex", gap: "8px", marginTop: "auto", flexWrap: "wrap" }}>
                <Link href="/scan" id="dash-scan-btn" className="btn-eco" style={{ fontSize: "0.875rem", padding: "10px 18px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Camera size={16} /> Scan
                </Link>
                <Link href="/chat" id="dash-chat-btn" className="btn-ghost" style={{ fontSize: "0.875rem", display: "flex", alignItems: "center", gap: "6px" }}>
                  <MessageSquare size={16} /> Chat
                </Link>
              </div>
            </div>
          </BentoCard>

          {/* Eco Tips card */}
          <BentoCard variant="glass" span={3} id="eco-tips-card">
            <h3
              style={{
                fontSize: "1rem",
                fontWeight: 700,
                color: "var(--eco-structure)",
                marginBottom: "16px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <Lightbulb size={20} color="var(--eco-accent)" /> Varanasi Waste Tips
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px" }}>
              {[
                { icon: <Leaf size={24} color="#2E7D32" />, tip: "Green bin for wet waste", detail: "Food scraps, peels, garden waste go in the green bin — collected daily" },
                { icon: <Recycle size={24} color="#1565C0" />, tip: "Blue bin for dry waste", detail: "Paper, glass, clean plastics, and metals go in the blue bin" },
                { icon: <Ban size={24} color="#C62828" />, tip: "Thin plastic bags are banned", detail: "Bags under 75 microns are banned in UP — switch to jhola bags" },
                { icon: <Building2 size={24} color="#5D4037" />, tip: "Sell to kabadiwallas", detail: "Metal, paper, and certain plastics can earn you money from local recyclers" },
              ].map((t) => (
                <div
                  key={t.tip}
                  style={{
                    background: "var(--eco-surface)",
                    borderRadius: "16px",
                    padding: "14px",
                    border: "1px solid var(--eco-border)",
                  }}
                >
                  <div style={{ marginBottom: "10px" }}>{t.icon}</div>
                  <div style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--eco-structure)", marginBottom: "4px" }}>
                    {t.tip}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--eco-text-muted)", lineHeight: 1.4 }}>
                    {t.detail}
                  </div>
                </div>
              ))}
            </div>
          </BentoCard>
        </BentoGrid>

        {/* No account needed note */}
        <p
          style={{
            textAlign: "center",
            color: "var(--eco-text-muted)",
            fontSize: "0.75rem",
            marginTop: "32px",
          }}
        >
          🔒 No account needed · Stats stored locally · Your data stays on your device
        </p>
      </div>
    </div>
  );
}
