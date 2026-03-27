"use client";

import { T } from "@/lib/tokens";

interface WelcomeScreenProps {
  onStart: () => void;
  onJoin: () => void;
}

export default function WelcomeScreen({ onStart, onJoin }: WelcomeScreenProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "90vh",
        padding: 32,
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: 18,
          background: "linear-gradient(135deg, #007AFF, #5856D6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 20,
          boxShadow: "0 8px 24px rgba(0,122,255,0.3)",
        }}
      >
        <span
          style={{
            fontSize: 28,
            color: "#fff",
            fontWeight: 700,
            fontFamily: T.font,
          }}
        >
          ÷
        </span>
      </div>
      <div
        style={{
          fontSize: 34,
          fontWeight: 700,
          letterSpacing: "-0.03em",
          marginBottom: 6,
          color: T.text,
        }}
      >
        divvyup
      </div>
      <p
        style={{
          fontSize: 17,
          color: T.secondary,
          marginBottom: 44,
          maxWidth: 260,
          lineHeight: 1.5,
        }}
      >
        Split expenses with your roommates, effortlessly.
      </p>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
          width: "100%",
          maxWidth: 320,
        }}
      >
        <button
          onClick={onStart}
          style={{
            padding: "14px 24px",
            borderRadius: T.radius,
            border: "none",
            background: "#007AFF",
            color: "#fff",
            fontFamily: T.font,
            fontSize: 17,
            fontWeight: 600,
            cursor: "pointer",
            boxShadow: "0 4px 16px rgba(0,122,255,0.3)",
            transition: "transform 0.15s, box-shadow 0.15s",
          }}
          onMouseDown={(e) =>
            ((e.target as HTMLElement).style.transform = "scale(0.97)")
          }
          onMouseUp={(e) =>
            ((e.target as HTMLElement).style.transform = "scale(1)")
          }
        >
          Start a Group
        </button>
        <button
          onClick={onJoin}
          style={{
            padding: "14px 24px",
            borderRadius: T.radius,
            border: "none",
            background: "rgba(0,122,255,0.1)",
            color: "#007AFF",
            fontFamily: T.font,
            fontSize: 17,
            fontWeight: 600,
            cursor: "pointer",
            transition: "transform 0.15s",
          }}
          onMouseDown={(e) =>
            ((e.target as HTMLElement).style.transform = "scale(0.97)")
          }
          onMouseUp={(e) =>
            ((e.target as HTMLElement).style.transform = "scale(1)")
          }
        >
          Join a Group
        </button>
      </div>
    </div>
  );
}
