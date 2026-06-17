"use client";

import { useState, useRef, useEffect } from "react";
import { Leaf, MessageSquare, User, Bot, ClipboardList, Recycle, Ban, Zap, ArrowRight, AlertTriangle, ImagePlus, X } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  imageUrl?: string;
  matchedRule?: {
    itemName: string;
    category: string;
    disposalInstructions: string;
    isRecyclable: boolean;
  };
  requiresClarification?: boolean;
  isRagGrounded?: boolean;
}

// ─── Suggested questions ──────────────────────────────────────────────────────

const SUGGESTIONS = [
  "Where do I put a plastic water bottle?",
  "Is a tetra pak recyclable in Varanasi?",
  "How do I dispose of old batteries?",
  "What bin does a used tissue go in?",
  "Can I recycle old newspapers?",
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function ChatPage() {
  const [messages, setMessages]   = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Namaste! I'm **EcoBot**, your AI waste management guide for Varanasi.\n\nAsk me anything about waste disposal — I'll give you advice based on **Varanasi Nagar Nigam guidelines**. You can type in English or Hindi!",
    },
  ]);
  const [input, setInput]         = useState("");
  const [loading, setLoading]     = useState(false);
  const [file, setFile]           = useState<File | null>(null);
  const [preview, setPreview]     = useState<string | null>(null);
  const messagesEndRef             = useRef<HTMLDivElement>(null);
  const inputRef                   = useRef<HTMLTextAreaElement>(null);
  const fileInputRef               = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Send message ──────────────────────────────────────────────────────────

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      if (!f.type.startsWith("image/")) {
        alert("Please upload an image file.");
        return;
      }
      setFile(f);
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(f);
    }
  };

  const send = async (text: string) => {
    if ((!text.trim() && !file) || loading) return;

    const messageText = text.trim() || "How do I dispose of this?";
    const currentFile = file;
    const currentPreview = preview;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: messageText,
      imageUrl: currentPreview || undefined,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setFile(null);
    setPreview(null);
    setLoading(true);

    // Build history (last 10 messages, excluding welcome)
    const history = messages
      .filter((m) => m.id !== "welcome")
      .slice(-9)
      .map((m) => ({ role: m.role, content: m.content }));

    try {
      let deviceId = localStorage.getItem("ecosort_device_id");
      if (!deviceId) {
        deviceId = crypto.randomUUID();
        localStorage.setItem("ecosort_device_id", deviceId);
      }

      let classificationContext = undefined;

      if (currentFile) {
        const form = new FormData();
        form.append("image", currentFile);
        form.append("deviceId", deviceId);

        const classRes = await fetch("/api/classify", { method: "POST", body: form });
        const classJson = await classRes.json();

        if (classJson.success && classJson.data) {
          classificationContext = {
            itemLabel: classJson.data.itemLabel,
            category: classJson.data.category,
            confidence: classJson.data.confidence,
          };
        } else {
          setMessages((prev) => [
            ...prev,
            {
              id: crypto.randomUUID(),
              role: "assistant",
              content: classJson.error || "Failed to analyze the uploaded image. Please try again.",
            },
          ]);
          setLoading(false);
          return;
        }
      }

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: messageText,
          deviceId,
          history,
          classificationContext,
        }),
      });

      const json = await res.json();

      if (json.success && json.data) {
        const assistantMsg: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: json.data.response,
          matchedRule: json.data.matchedRule,
          requiresClarification: json.data.requiresClarification,
          isRagGrounded: json.data.isRagGrounded,
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: (json.error ?? "Something went wrong. Please try again."),
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Network error. Please check your connection and try again.",
        },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  // ── Simple markdown renderer ──────────────────────────────────────────────

  const renderMarkdown = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/\n/g, "<br/>");
  };

  return (
    <div
      style={{
        height: "calc(100vh - 80px)",
        display: "flex",
        flexDirection: "column",
        background: "var(--eco-bg)",
        maxWidth: "800px",
        margin: "0 auto",
        padding: "0 20px",
      }}
    >
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{ padding: "24px 0 16px", flexShrink: 0 }}>
        <h1
          style={{
            fontSize: "clamp(1.5rem, 4vw, 2rem)",
            fontWeight: 900,
            color: "var(--eco-structure)",
            letterSpacing: "-0.03em",
            marginBottom: "4px",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}
        >
          <MessageSquare size={32} /> EcoBot Chat
        </h1>
        <p style={{ color: "var(--eco-text-muted)", fontSize: "0.875rem" }}>
          Ask anything about waste disposal in Varanasi · Powered by IBM Granite
        </p>
      </div>

      {/* ── Messages ───────────────────────────────────────────────────────── */}
      <div
        id="chat-messages"
        style={{
          flex: 1,
          overflowY: "auto",
          paddingBottom: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
        aria-live="polite"
        aria-label="Chat messages"
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`animate-fade-in-up`}
            style={{
              display: "flex",
              flexDirection: msg.role === "user" ? "row-reverse" : "row",
              gap: "10px",
              alignItems: "flex-end",
            }}
          >
            {/* Avatar */}
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                background:
                  msg.role === "user"
                    ? "var(--eco-accent)"
                    : "var(--eco-structure)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.875rem",
                flexShrink: 0,
              }}
              aria-hidden
            >
              {msg.role === "user" ? <User size={18} /> : <Bot size={18} />}
            </div>

            {/* Bubble */}
            <div
              style={{
                maxWidth: "75%",
                padding: "12px 16px",
                borderRadius:
                  msg.role === "user"
                    ? "20px 20px 4px 20px"
                    : "20px 20px 20px 4px",
                background:
                  msg.role === "user"
                    ? "var(--eco-structure)"
                    : "var(--eco-glass)",
                backdropFilter: msg.role === "assistant" ? "blur(12px)" : "none",
                border:
                  msg.role === "assistant"
                    ? "1px solid var(--eco-border)"
                    : "none",
                color: msg.role === "user" ? "var(--eco-bg)" : "var(--eco-text)",
                fontSize: "0.9rem",
                lineHeight: 1.55,
                boxShadow:
                  msg.role === "user"
                    ? "0 2px 12px rgba(26,48,32,0.2)"
                    : "0 2px 12px rgba(0,0,0,0.06)",
              }}
            >
              {msg.imageUrl && (
                <img
                  src={msg.imageUrl}
                  alt="Uploaded image"
                  style={{
                    maxWidth: "100%",
                    maxHeight: "200px",
                    borderRadius: "12px",
                    marginBottom: "8px",
                    objectFit: "contain",
                  }}
                />
              )}
              <div
                dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
              />

              {/* RAG matched rule card */}
              {msg.matchedRule && (
                <div
                  style={{
                    marginTop: "10px",
                    background: "rgba(0, 230, 118, 0.08)",
                    border: "1px solid rgba(0, 230, 118, 0.2)",
                    borderRadius: "12px",
                    padding: "10px 12px",
                    fontSize: "0.8125rem",
                  }}
                >
                  <div style={{ fontWeight: 600, color: "var(--eco-structure)", marginBottom: "4px", display: "flex", alignItems: "center", gap: "6px" }}>
                    <ClipboardList size={14} /> {msg.matchedRule.itemName}
                  </div>
                  <div style={{ color: "var(--eco-text-muted)", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "4px" }}>
                    {msg.matchedRule.isRecyclable ? <><Recycle size={12} /> Recyclable</> : <><Ban size={12} /> Not recyclable</>} ·{" "}
                    {msg.matchedRule.category.replace("_", " ")}
                  </div>
                </div>
              )}

              {/* RAG grounding indicator */}
              {msg.isRagGrounded === false && msg.role === "assistant" && msg.id !== "welcome" && (
                <div
                  style={{
                    marginTop: "8px",
                    fontSize: "0.6875rem",
                    color: "var(--eco-text-muted)",
                    opacity: 0.7,
                    display: "flex",
                    alignItems: "center",
                    gap: "4px"
                  }}
                >
                  <Zap size={12} /> General guidance (not rule-matched)
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {loading && (
          <div style={{ display: "flex", gap: "10px", alignItems: "flex-end" }}>
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                background: "var(--eco-structure)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.875rem",
              }}
            >
              <Bot size={18} />
            </div>
            <div
              style={{
                padding: "14px 18px",
                background: "var(--eco-glass)",
                border: "1px solid var(--eco-border)",
                borderRadius: "20px 20px 20px 4px",
                display: "flex",
                gap: "6px",
                alignItems: "center",
              }}
            >
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: "var(--eco-accent)",
                    animation: "pulse-eco 1.2s ease infinite",
                    animationDelay: `${i * 0.2}s`,
                    opacity: 0.7,
                  }}
                />
              ))}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Suggestions ────────────────────────────────────────────────────── */}
      {messages.length <= 2 && !loading && (
        <div
          style={{
            display: "flex",
            gap: "8px",
            overflowX: "auto",
            paddingBottom: "8px",
            flexShrink: 0,
          }}
        >
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              id={`suggestion-${s.slice(0, 20).replace(/ /g, "-")}`}
              onClick={() => send(s)}
              style={{
                background: "var(--eco-glass)",
                border: "1px solid var(--eco-border)",
                borderRadius: "9999px",
                padding: "8px 14px",
                fontSize: "0.8125rem",
                color: "var(--eco-text)",
                cursor: "pointer",
                whiteSpace: "nowrap",
                backdropFilter: "blur(8px)",
                transition: "all 150ms ease",
                flexShrink: 0,
              }}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* ── Input area ─────────────────────────────────────────────────────── */}
      <div
        id="chat-input-area"
        style={{
          flexShrink: 0,
          paddingBottom: "20px",
          paddingTop: "8px",
        }}
      >
        {preview && (
          <div style={{ position: "relative", display: "inline-block", marginBottom: "8px", marginLeft: "18px" }}>
            <img src={preview} alt="Preview" style={{ height: "60px", borderRadius: "8px", border: "1px solid var(--eco-border)", objectFit: "cover" }} />
            <button
              onClick={() => { setFile(null); setPreview(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
              style={{ position: "absolute", top: "-6px", right: "-6px", background: "var(--eco-bg)", border: "1px solid var(--eco-border)", borderRadius: "50%", padding: "2px", cursor: "pointer", color: "var(--eco-text)", display: "flex", alignItems: "center", justifyContent: "center" }}
              aria-label="Remove image"
            >
              <X size={14} />
            </button>
          </div>
        )}
        <div
          className="glass"
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: "10px",
            borderRadius: "24px",
            padding: "10px 12px 10px 18px",
          }}
        >
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--eco-text-muted)",
              cursor: loading ? "not-allowed" : "pointer",
              padding: "4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "2px",
            }}
            aria-label="Upload image"
          >
            <ImagePlus size={20} />
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            accept="image/*" 
            style={{ display: "none" }} 
            onChange={handleFileChange} 
          />
          <textarea
            ref={inputRef}
            id="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about waste disposal… (Enter to send)"
            disabled={loading}
            rows={1}
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              resize: "none",
              color: "var(--eco-text)",
              fontSize: "0.9375rem",
              lineHeight: 1.5,
              maxHeight: "120px",
              fontFamily: "inherit",
              padding: "4px 0",
            }}
            aria-label="Chat input"
          />
          <button
            id="btn-send"
            onClick={() => send(input)}
            disabled={(!input.trim() && !file) || loading}
            className="btn-eco"
            style={{
              padding: "10px 18px",
              fontSize: "0.9rem",
              opacity: (!input.trim() && !file) || loading ? 0.5 : 1,
              flexShrink: 0,
            }}
            aria-label="Send message"
          >
            {loading ? "…" : <ArrowRight size={18} />}
          </button>
        </div>
        <p
          style={{
            textAlign: "center",
            color: "var(--eco-text-muted)",
            fontSize: "0.6875rem",
            marginTop: "6px",
          }}
        >
          Powered by IBM Granite + Varanasi Nagar Nigam Rules · RAG-grounded responses
        </p>
      </div>
    </div>
  );
}
