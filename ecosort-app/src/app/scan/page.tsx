"use client";

import { useState, useRef, useCallback } from "react";
import { 
  Leaf, Recycle, AlertTriangle, Ban, BrickWall, Trash2, 
  HelpCircle, Camera, FolderOpen, Search, Bot, Lightbulb, Send, MessageSquare,
  Cpu, Stethoscope, Armchair, Shirt, Wrench
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ClassifyResult {
  itemLabel: string;
  category: string;
  confidence: number;
  requiresClarification: boolean;
  clarifyingQuestion?: string;
  disposalInstructions?: string;
  tips?: string | null;
  isRecyclable?: boolean;
  pointsEarned?: number;
}

// ─── UI Meta ──────────────────────────────────────────────────────────────────

const CATEGORY_META: Record<string, { color: string; bg: string; icon: React.ReactNode; binColor: string }> = {
  WET_ORGANIC:    { color: "#2E7D32", bg: "#E8F5E9", icon: <Leaf size={32} />, binColor: "GREEN bin" },
  DRY_RECYCLABLE: { color: "#1565C0", bg: "#E3F2FD", icon: <Recycle size={32} />, binColor: "BLUE bin" },
  HAZARDOUS:      { color: "#C62828", bg: "#FFEBEE", icon: <AlertTriangle size={32} />, binColor: "designated e-waste point" },
  SANITARY:       { color: "#6A1B9A", bg: "#F3E5F5", icon: <Ban size={32} />, binColor: "BLACK bag" },
  CONSTRUCTION:   { color: "#37474F", bg: "#ECEFF1", icon: <BrickWall size={32} />, binColor: "construction waste" },
  INERT:          { color: "#E65100", bg: "#FFF3E0", icon: <Trash2 size={32} />, binColor: "general waste bin" },
  E_WASTE:        { color: "#607D8B", bg: "#ECEFF1", icon: <Cpu size={32} />, binColor: "e-waste collection point" },
  BIOMEDICAL:     { color: "#D32F2F", bg: "#FFEBEE", icon: <Stethoscope size={32} />, binColor: "yellow/red medical bag" },
  BULKY:          { color: "#795548", bg: "#EFEBE9", icon: <Armchair size={32} />, binColor: "special bulky pickup" },
  TEXTILE:        { color: "#009688", bg: "#E0F2F1", icon: <Shirt size={32} />, binColor: "donation or textile recycling" },
  METAL_SCRAP:    { color: "#455A64", bg: "#CFD8DC", icon: <Wrench size={32} />, binColor: "scrap dealer/kabadiwalla" },
  UNKNOWN:        { color: "#616161", bg: "#FAFAFA", icon: <HelpCircle size={32} />, binColor: "unknown" },
};

const CONFIDENCE_LABEL = (c: number) =>
  c >= 0.9 ? "Very High" : c >= 0.75 ? "High" : c >= 0.5 ? "Moderate" : "Low";

// ─── Component ────────────────────────────────────────────────────────────────

export default function ScanPage() {
  const [dragOver, setDragOver]     = useState(false);
  const [preview, setPreview]       = useState<string | null>(null);
  const [file, setFile]             = useState<File | null>(null);
  const [loading, setLoading]       = useState(false);
  const [result, setResult]         = useState<ClassifyResult | null>(null);
  const [error, setError]           = useState<string | null>(null);
  const [clarifyInput, setClarify]  = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // ── File handlers ───────────────────────────────────────────────────────────

  const handleFile = useCallback((f: File) => {
    if (!f.type.startsWith("image/")) {
      setError("Please upload an image file (JPEG, PNG, WebP, or HEIC).");
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setError("File too large. Maximum size is 10 MB.");
      return;
    }
    setFile(f);
    setError(null);
    setResult(null);

    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(f);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const dropped = e.dataTransfer.files[0];
      if (dropped) handleFile(dropped);
    },
    [handleFile]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) handleFile(selected);
  };

  // ── Classification ──────────────────────────────────────────────────────────

  const classify = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const form = new FormData();
      form.append("image", file);

      let deviceId = localStorage.getItem("ecosort_device_id");
      if (!deviceId) {
        deviceId = crypto.randomUUID();
        localStorage.setItem("ecosort_device_id", deviceId);
      }
      form.append("deviceId", deviceId);

      const res = await fetch("/api/classify", { method: "POST", body: form });
      const json = await res.json();

      if (!json.success) {
        setError(json.error ?? "Classification failed. Please try again.");
        return;
      }

      setResult(json.data);
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const submitClarification = async () => {
    if (!clarifyInput.trim() || !result) return;
    setLoading(true);
    setError(null);
    try {
      const deviceId = localStorage.getItem("ecosort_device_id") || crypto.randomUUID();
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: clarifyInput, 
          deviceId, 
          history: [
            { role: "assistant", content: result.clarifyingQuestion }
          ]
        }),
      });
      const json = await res.json();
      if (json.success) {
        setResult({
          ...result,
          requiresClarification: json.data.requiresClarification,
          clarifyingQuestion: json.data.clarifyingQuestion,
          disposalInstructions: json.data.matchedRule?.disposalInstructions || json.data.response,
          tips: json.data.matchedRule?.tips,
          isRecyclable: json.data.matchedRule?.isRecyclable,
          pointsEarned: json.data.pointsEarned ?? result.pointsEarned
        });
      } else {
        setError(json.error || "Failed to process clarification.");
      }
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setPreview(null);
    setFile(null);
    setResult(null);
    setError(null);
    setClarify("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  const meta = result ? (CATEGORY_META[result.category] ?? CATEGORY_META.UNKNOWN) : null;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--eco-bg)",
        padding: "40px 20px 80px",
      }}
    >
      <div style={{ maxWidth: "720px", margin: "0 auto" }}>

        <div style={{ marginBottom: "32px" }}>
          <h1
            style={{
              fontSize: "clamp(2rem, 5vw, 3rem)",
              fontWeight: 900,
              color: "var(--eco-structure)",
              letterSpacing: "-0.03em",
              marginBottom: "8px",
            }}
          >
            Scan Waste Item
          </h1>
          <p style={{ color: "var(--eco-text-muted)", fontSize: "1rem" }}>
            Upload a photo or use your camera. Get disposal instructions in seconds.
          </p>
        </div>

        {!result && (
          <>
            <div
              id="upload-zone"
              className={`upload-zone ${dragOver ? "drag-over" : ""}`}
              style={{
                minHeight: "320px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "16px",
                padding: "40px 24px",
                marginBottom: "20px",
                position: "relative",
                overflow: "hidden",
              }}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => !preview && fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              aria-label="Upload waste item image"
              onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
            >
              {preview ? (
                <div style={{ width: "100%", textAlign: "center" }}>
                  <img
                    src={preview}
                    alt="Selected waste item"
                    style={{
                      maxHeight: "260px",
                      maxWidth: "100%",
                      borderRadius: "20px",
                      objectFit: "contain",
                      boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
                    }}
                  />
                  <p style={{ color: "var(--eco-text-muted)", fontSize: "0.8125rem", marginTop: "12px" }}>
                    {file?.name} · {file ? (file.size / 1024).toFixed(0) + " KB" : ""}
                  </p>
                </div>
              ) : (
                <>
                  <div style={{ display: "flex", justifyContent: "center", marginBottom: "12px", opacity: 0.8, color: "var(--eco-text-muted)" }}><Camera size={48} strokeWidth={1.5} /></div>
                  <p style={{ fontWeight: 600, color: "var(--eco-structure)", marginBottom: "8px" }}>
                    Snap a photo or drop image here
                  </p>
                  <p style={{ fontSize: "0.875rem", color: "var(--eco-text-muted)", marginBottom: "20px" }}>
                    EcoSort will automatically classify the waste
                  </p>
                  <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
                    <span className="btn-eco" style={{ padding: "8px 16px", fontSize: "0.875rem", display: "flex", gap: "6px", alignItems: "center" }}>
                      <Camera size={16} /> Open Camera
                    </span>
                    <span className="btn-ghost" style={{ padding: "8px 16px", fontSize: "0.875rem", display: "flex", gap: "6px", alignItems: "center" }}>
                      <FolderOpen size={16} /> Browse
                    </span>
                  </div>
                </>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleInputChange}
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              style={{ display: "none" }}
              onChange={handleInputChange}
            />

            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "16px" }}>
              {preview ? (
                <>
                  <button
                    id="btn-classify"
                    className="btn-eco"
                    style={{ flex: 1, fontSize: "1rem" }}
                    onClick={classify}
                    disabled={loading}
                  >
                    {loading ? "Analysing…" : "Classify Item"}
                  </button>
                  <button
                    id="btn-reset"
                    className="btn-ghost"
                    onClick={reset}
                    disabled={loading}
                  >
                    Clear
                  </button>
                </>
              ) : null}
            </div>

            {error && (
              <div
                role="alert"
                style={{
                  background: "#FFEBEE",
                  border: "1px solid #FFCDD2",
                  borderRadius: "16px",
                  padding: "14px 18px",
                  color: "#C62828",
                  fontSize: "0.875rem",
                }}
              >
                {error}
              </div>
            )}

            {loading && (
              <div
                aria-live="polite"
                aria-label="Classifying your item"
                style={{ marginTop: "24px" }}
              >
                <div className="glass-card" style={{ padding: "28px" }}>
                  <div className="animate-bounce" style={{ display: "flex", justifyContent: "center", color: "var(--eco-accent)", marginBottom: "16px" }}>
                    <Search size={40} />
                  </div>
                  <p style={{ fontWeight: 600, color: "var(--eco-structure)", display: "flex", gap: "8px", alignItems: "center", justifyContent: "center" }}>
                    <Bot size={20} /> Classifying...
                  </p>
                </div>
              </div>
            )}
          </>
        )}

        {result && meta && (
          <div className="animate-scale-in" id="result-card">
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                background: meta.bg,
                border: `1px solid ${meta.color}33`,
                borderRadius: "9999px",
                padding: "8px 18px",
                marginBottom: "20px",
                fontSize: "0.875rem",
                fontWeight: 600,
                color: meta.color,
              }}
            >
              {meta.icon} {result.category.replace("_", " ")}
            </div>

            <div className="glass-card" style={{ padding: "28px", marginBottom: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
                <div>
                  <h2
                    style={{
                      fontSize: "1.5rem",
                      fontWeight: 800,
                      color: "var(--eco-structure)",
                      letterSpacing: "-0.02em",
                      marginBottom: "4px",
                    }}
                  >
                    {result.itemLabel}
                  </h2>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div
                      style={{
                        height: "6px",
                        width: "80px",
                        borderRadius: "9999px",
                        background: "var(--eco-surface)",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        className="animate-fade-in"
                        style={{
                          height: "100%",
                          width: `${result.confidence * 100}%`,
                          background: `linear-gradient(90deg, ${meta.color}, ${meta.color}aa)`,
                          borderRadius: "9999px",
                          transition: "width 600ms var(--spring-bounce)",
                        }}
                      />
                    </div>
                    <span style={{ fontSize: "0.75rem", color: "var(--eco-text-muted)" }}>
                      {CONFIDENCE_LABEL(result.confidence)} ({ (result.confidence * 100).toFixed(0) }%)
                    </span>
                  </div>
                </div>
              </div>

              {result.requiresClarification ? (
                <div
                  style={{
                    background: "rgba(255, 152, 0, 0.08)",
                    border: "1px solid rgba(255, 152, 0, 0.25)",
                    borderRadius: "16px",
                    padding: "16px",
                    marginBottom: "16px",
                  }}
                >
                  <p style={{ fontWeight: 600, color: "#E65100", marginBottom: "12px", fontSize: "0.9rem" }}>
                    {result.clarifyingQuestion}
                  </p>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <input
                      type="text"
                      placeholder="Describe the item…"
                      value={clarifyInput}
                      onChange={(e) => setClarify(e.target.value)}
                      style={{
                        flex: 1,
                        padding: "10px 14px",
                        borderRadius: "12px",
                        border: "1.5px solid var(--eco-border)",
                        background: "var(--eco-bg)",
                        color: "var(--eco-text)",
                        fontSize: "0.875rem",
                        outline: "none",
                      }}
                    />
                    <button className="btn-eco" disabled={loading} style={{ padding: "8px 16px", fontSize: "0.875rem", opacity: loading ? 0.7 : 1, display: "flex", gap: "6px", alignItems: "center" }} onClick={submitClarification}>
                      {loading ? "..." : <><Send size={16} /> Send</>}
                    </button>
                  </div>
                </div>
              ) : result.disposalInstructions ? (
                <>
                  <div
                    style={{
                      background: meta.bg,
                      border: `1px solid ${meta.color}22`,
                      borderRadius: "16px",
                      padding: "14px 16px",
                      marginBottom: "12px",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <span style={{ fontWeight: 600, color: meta.color, fontSize: "0.9rem" }}>
                      Dispose in: <strong>{meta.binColor}</strong>
                    </span>
                  </div>

                  <div style={{ background: "var(--eco-surface)", borderRadius: "16px", padding: "16px" }}>
                    <p style={{ fontSize: "0.875rem", color: "var(--eco-text)", lineHeight: 1.6 }}>
                      {result.disposalInstructions}
                    </p>
                  </div>

                  {result.tips && (
                    <div style={{ marginTop: "12px", padding: "12px", background: "rgba(255, 193, 7, 0.1)", border: "1px solid rgba(255, 193, 7, 0.3)", borderRadius: "8px", fontSize: "0.875rem", color: "#664d03", display: "flex", gap: "10px", alignItems: "flex-start" }}>
                      <div style={{ color: "#d39e00", marginTop: "2px" }}><Lightbulb size={18} /></div>
                      <div>
                        <strong>Pro Tip:</strong> {result.tips}
                      </div>
                    </div>
                  )}
                </>
              ) : null}

              {result.isRecyclable !== undefined && (
                <div style={{ marginTop: "16px", display: "inline-flex", alignItems: "center", gap: "6px", background: result.isRecyclable ? "rgba(0, 230, 118, 0.1)" : "rgba(244, 67, 54, 0.1)", color: result.isRecyclable ? "#2E7D32" : "#C62828", padding: "4px 10px", borderRadius: "9999px", fontSize: "0.75rem", fontWeight: 600 }}>
                  {result.isRecyclable ? <><Recycle size={14} /> Recyclable</> : <><Ban size={14} /> Not Recyclable</>}
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div style={{ display: "flex", gap: "12px" }}>
              <button id="btn-scan-again" className="btn-eco" style={{ flex: 1, display: "flex", gap: "6px", alignItems: "center", justifyContent: "center" }} onClick={reset}>
                <Camera size={18} /> Scan Another
              </button>
              <button
                id="btn-scan-chat"
                className="btn-ghost"
                style={{ flex: 1, display: "flex", gap: "6px", alignItems: "center", justifyContent: "center" }}
                onClick={() => {
                  window.location.href = `/chat?q=${encodeURIComponent(`I have a ${result.category.replace("_", " ")}. ${result.clarifyingQuestion ? "But I need clarification." : "What else should I know?"}`)}`;
                }}
              >
                <MessageSquare size={18} /> Ask Follow-up
              </button>
            </div>
          </div>
        )}

        {/* ── Privacy note ─────────────────────────────────────────────────── */}
        <p
          style={{
            textAlign: "center",
            color: "var(--eco-text-muted)",
            fontSize: "0.75rem",
            marginTop: "32px",
          }}
        >
          🔒 Your image is never stored. Processed in-memory and immediately discarded.
        </p>
      </div>
    </div>
  );
}
