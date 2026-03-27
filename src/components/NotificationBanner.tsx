"use client";

import { T, cardStyle } from "@/lib/tokens";
import type { Payment, Group } from "@/lib/types";
import Avatar from "./Avatar";

interface NotificationBannerProps {
  notifications: Payment[];
  onAction: (paymentId: string, status: "confirmed" | "rejected") => void;
  group: Group;
}

export default function NotificationBanner({
  notifications,
  onAction,
  group,
}: NotificationBannerProps) {
  if (notifications.length === 0) return null;
  return (
    <div style={{ marginBottom: 20 }}>
      {notifications.map((n) => {
        const fromMember = group.members.find((m) => m.id === n.fromId);
        const fromIdx = fromMember ? group.members.indexOf(fromMember) : 0;
        return (
          <div
            key={n.id}
            style={{
              ...cardStyle,
              padding: "16px 18px",
              marginBottom: 8,
              background:
                "linear-gradient(135deg, rgba(255,149,0,0.08), rgba(255,45,85,0.06))",
              border: "1px solid rgba(255,149,0,0.15)",
            }}
          >
            <div
              style={{ display: "flex", alignItems: "center", gap: 12 }}
            >
              <Avatar name={n.fromName} index={fromIdx} size={40} />
              <div style={{ flex: 1 }}>
                <div
                  style={{ fontSize: 15, fontWeight: 600, color: T.text }}
                >
                  {n.fromName} paid you
                </div>
                <div
                  style={{
                    fontFamily: T.mono,
                    fontSize: 15,
                    fontWeight: 600,
                    color: T.green,
                    marginTop: 2,
                  }}
                >
                  ${n.amount.toFixed(2)}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
              <button
                onClick={() => onAction(n.id, "confirmed")}
                style={{
                  flex: 1,
                  padding: "10px 0",
                  borderRadius: T.radiusSm,
                  border: "none",
                  background: T.green,
                  color: "#fff",
                  fontFamily: T.font,
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Confirm
              </button>
              <button
                onClick={() => onAction(n.id, "rejected")}
                style={{
                  flex: 1,
                  padding: "10px 0",
                  borderRadius: T.radiusSm,
                  border: "none",
                  background: "rgba(0,0,0,0.05)",
                  color: T.secondary,
                  fontFamily: T.font,
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Deny
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
