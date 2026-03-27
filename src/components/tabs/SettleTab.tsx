"use client";

import { T, cardStyle, secTitle } from "@/lib/tokens";
import { calcSettlements } from "@/lib/settlements";
import { uid } from "@/lib/utils";
import type { Group, Member, Charge, Settlement } from "@/lib/types";
import Avatar from "@/components/Avatar";

interface SettleTabProps {
  group: Group;
  setGroup: (updater: (prev: Group) => Group) => void;
  allCharges: Charge[];
  currentUser: Member;
}

export default function SettleTab({
  group,
  setGroup,
  allCharges,
  currentUser,
}: SettleTabProps) {
  const settlements = calcSettlements(
    group.members,
    allCharges,
    group.payments,
    group.smartSettle
  );
  const memberById: Record<string, Member> = {};
  group.members.forEach((m) => (memberById[m.id] = m));
  const payments = group.payments || [];

  const getPaymentStatus = (fromId: string, toId: string) =>
    payments.find(
      (p) =>
        p.fromId === fromId &&
        p.toId === toId &&
        (p.status === "pending" || p.status === "confirmed")
    ) || null;

  const markAsPaid = (
    fromId: string,
    fromName: string,
    toId: string,
    toName: string,
    amount: number
  ) => {
    setGroup((prev) => ({
      ...prev,
      payments: [
        ...(prev.payments || []),
        {
          id: uid(),
          fromId,
          fromName,
          toId,
          toName,
          amount,
          status: "pending" as const,
          date: new Date().toISOString(),
        },
      ],
    }));
  };

  const myDebts = settlements.filter((s) => s.fromId === currentUser.id);
  const owedToMe = settlements.filter((s) => s.toId === currentUser.id);
  const otherSettlements = settlements.filter(
    (s) => s.fromId !== currentUser.id && s.toId !== currentUser.id
  );

  const renderSettlement = (
    s: Settlement,
    i: number,
    showAction: boolean
  ) => {
    const fromM = memberById[s.fromId];
    const existing = getPaymentStatus(s.fromId, s.toId);
    const toM = memberById[s.toId];
    return (
      <div
        key={`${s.fromId}-${s.toId}-${i}`}
        style={{
          padding: "16px 18px",
          borderBottom: `1px solid ${T.border}`,
        }}
      >
        <div
          style={{ display: "flex", alignItems: "center", gap: 12 }}
        >
          <Avatar
            name={s.fromName}
            index={group.members.indexOf(fromM)}
            size={36}
          />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15 }}>
              <span style={{ fontWeight: 600 }}>
                {s.fromName}
                {s.fromId === currentUser.id ? " (you)" : ""}
              </span>
              <span style={{ color: T.tertiary }}> → </span>
              <span style={{ fontWeight: 600 }}>
                {s.toName}
                {s.toId === currentUser.id ? " (you)" : ""}
              </span>
            </div>
            {toM?.venmo && (
              <div
                style={{
                  fontSize: 13,
                  color: T.tertiary,
                  marginTop: 2,
                }}
              >
                {toM.venmo}
              </div>
            )}
          </div>
          <div
            style={{
              fontFamily: T.mono,
              fontWeight: 700,
              fontSize: 17,
              color:
                existing?.status === "confirmed" ? T.green : T.red,
            }}
          >
            ${s.amount.toFixed(2)}
          </div>
        </div>
        {existing?.status === "confirmed" && (
          <div
            style={{
              fontSize: 13,
              color: T.green,
              fontWeight: 500,
              marginTop: 8,
              marginLeft: 48,
            }}
          >
            ✓ Confirmed
          </div>
        )}
        {existing?.status === "pending" && (
          <div
            style={{
              fontSize: 13,
              color: T.orange,
              fontWeight: 500,
              marginTop: 8,
              marginLeft: 48,
            }}
          >
            Waiting for {s.toName} to confirm
          </div>
        )}
        {!existing && showAction && s.fromId === currentUser.id && (
          <div style={{ marginTop: 10, marginLeft: 48 }}>
            <button
              onClick={() =>
                markAsPaid(
                  s.fromId,
                  s.fromName,
                  s.toId,
                  s.toName,
                  s.amount
                )
              }
              style={{
                padding: "8px 20px",
                borderRadius: 20,
                border: "none",
                background: T.blue,
                color: "#fff",
                fontFamily: T.font,
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(0,122,255,0.25)",
              }}
            >
              I Paid This
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <h2 style={secTitle}>Settle Up</h2>
      <p
        style={{
          fontSize: 15,
          color: T.secondary,
          marginTop: -12,
          marginBottom: 24,
        }}
      >
        Pay who you owe, then mark it paid.
      </p>
      {settlements.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: 48,
            color: T.tertiary,
            fontSize: 15,
          }}
        >
          All settled up ✨
        </div>
      )}

      {myDebts.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h3
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: T.red,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: 10,
            }}
          >
            You Owe
          </h3>
          <div style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
            {myDebts.map((s, i) => renderSettlement(s, i, true))}
          </div>
        </div>
      )}
      {owedToMe.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h3
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: T.green,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: 10,
            }}
          >
            Owed to You
          </h3>
          <div style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
            {owedToMe.map((s, i) => renderSettlement(s, i, false))}
          </div>
        </div>
      )}
      {otherSettlements.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h3
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: T.tertiary,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: 10,
            }}
          >
            Others
          </h3>
          <div style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
            {otherSettlements.map((s, i) =>
              renderSettlement(s, i, false)
            )}
          </div>
        </div>
      )}

      {payments.filter(
        (p) => p.status === "confirmed" || p.status === "rejected"
      ).length > 0 && (
        <div style={{ marginTop: 8 }}>
          <h3
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: T.tertiary,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: 10,
            }}
          >
            History
          </h3>
          <div style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
            {payments
              .filter(
                (p) =>
                  p.status === "confirmed" || p.status === "rejected"
              )
              .reverse()
              .map((p) => (
                <div
                  key={p.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "12px 18px",
                    borderBottom: `1px solid ${T.border}`,
                  }}
                >
                  <span style={{ fontSize: 16 }}>
                    {p.status === "confirmed" ? "✅" : "❌"}
                  </span>
                  <div style={{ flex: 1, fontSize: 14 }}>
                    <span style={{ fontWeight: 600 }}>
                      {p.fromName}
                    </span>
                    <span style={{ color: T.tertiary }}> → </span>
                    <span style={{ fontWeight: 600 }}>
                      {p.toName}
                    </span>
                  </div>
                  <span
                    style={{
                      fontFamily: T.mono,
                      fontSize: 14,
                      fontWeight: 600,
                    }}
                  >
                    ${p.amount.toFixed(2)}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
