"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Home, Camera, MessageSquare, LayoutDashboard, Recycle, Sun, Moon } from "lucide-react";

// ─── Nav Items ────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { href: "/",          label: "Home",      icon: <Home size={18} /> },
  { href: "/scan",      label: "Scan",      icon: <Camera size={18} /> },
  { href: "/chat",      label: "Chat",      icon: <MessageSquare size={18} /> },
  { href: "/dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
];

export default function FloatingNav() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [visible, setVisible]   = useState(true);
  const [lastY, setLastY]       = useState(0);
  const [theme, setTheme]       = useState<"light" | "dark">("light");

  useEffect(() => {
    const currentTheme = document.documentElement.getAttribute("data-theme") as "light" | "dark" | null;
    if (currentTheme) {
      setTheme(currentTheme);
    } else {
      setTheme(window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("ecosort_theme", newTheme);
  };

  // Hide nav on scroll down, show on scroll up
  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 20);
      setVisible(y < lastY || y < 60);
      setLastY(y);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastY]);

  return (
    <header
      id="floating-nav"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        display: "flex",
        justifyContent: "center",
        padding: scrolled ? "10px 20px" : "16px 20px",
        transform: visible ? "translateY(0)" : "translateY(-120%)",
        transition: "transform 350ms cubic-bezier(0.34, 1.56, 0.64, 1), padding 250ms ease",
      }}
    >
      <nav
        className="glass"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "4px",
          padding: "8px 12px",
          borderRadius: "9999px",
          width: "100%",
          maxWidth: "600px",
          justifyContent: "space-between",
        }}
      >
        {/* Logo */}
        <Link
          href="/"
          id="nav-logo"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontWeight: 700,
            fontSize: "1rem",
            color: "var(--eco-structure)",
            textDecoration: "none",
            padding: "6px 12px",
            borderRadius: "9999px",
            flexShrink: 0,
            transition: "color 150ms ease",
          }}
        >
          <Recycle size={20} strokeWidth={2.5} />
          <span style={{ letterSpacing: "-0.02em" }}>EcoSort</span>
        </Link>

        {/* Nav links */}
        <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                id={`nav-${item.label.toLowerCase()}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: isActive ? "7px 16px" : "7px 12px",
                  borderRadius: "9999px",
                  textDecoration: "none",
                  fontSize: "0.875rem",
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? "var(--eco-structure)" : "var(--eco-text-muted)",
                  background: isActive ? "var(--eco-accent)" : "transparent",
                  transition:
                    "background 200ms ease, color 200ms ease, padding 200ms cubic-bezier(0.34, 1.56, 0.64, 1)",
                  whiteSpace: "nowrap",
                  boxShadow: isActive
                    ? "0 2px 10px rgba(0, 230, 118, 0.3)"
                    : "none",
                }}
                aria-current={isActive ? "page" : undefined}
              >
                <span
                  style={{
                    fontSize: "0.9rem",
                    transition: "transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1)",
                  }}
                >
                  {item.icon}
                </span>
                <span
                  style={{
                    // Hide label on very small screens
                    display: "var(--label-display, inline)",
                  }}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}

          <div style={{ width: "1px", height: "24px", background: "var(--eco-border)", margin: "0 4px" }} />
          
          <button
            onClick={toggleTheme}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "34px",
              height: "34px",
              borderRadius: "50%",
              background: "transparent",
              border: "none",
              color: "var(--eco-text-muted)",
              cursor: "pointer",
              transition: "color 200ms ease, background 200ms ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--eco-structure)";
              e.currentTarget.style.background = "var(--eco-glass-dark)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--eco-text-muted)";
              e.currentTarget.style.background = "transparent";
            }}
            aria-label="Toggle theme"
          >
            {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
          </button>
        </div>
      </nav>

      {/* Responsive label hide for xs screens */}
      <style>{`
        @media (max-width: 420px) {
          #floating-nav a span:last-child { display: none; }
          #floating-nav a { padding: 8px !important; }
        }
      `}</style>
    </header>
  );
}
