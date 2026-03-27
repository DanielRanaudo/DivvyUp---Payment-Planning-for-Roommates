"use client";

import { useState } from "react";
import { T, inputStyle, labelStyle, cardStyle, secTitle } from "@/lib/tokens";
import { uid } from "@/lib/utils";
import type { Group, Member } from "@/lib/types";

interface ExpensesTabProps {
  group: Group;
  setGroup: (updater: (prev: Group) => Group) => void;
  currentUser: Member;
  isTreasurer: boolean;
}

export default function ExpensesTab({
  group,
  setGroup,
  currentUser,
  isTreasurer,
}: ExpensesTabProps) {
  const [showForm, setShowForm] = useState(false);
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const pending = group.expenses.filter((e) => e.status === "pending");
  const approved = group.expenses.filter((e) => e.status === "approved");

  const submitExpense = () => {
    const amt = parseFloat(amount);
    if (!desc.trim() || isNaN(amt) || amt <= 0) return;
    setGroup((prev) => ({
      ...prev,
      expenses: [
        ...prev.expenses,
        {
          id: uid(),
          description: desc.trim(),
          amount: amt,
          submittedBy: currentUser.id,
          submittedByName: currentUser.name,
          status: "pending" as const,
          date: new Date().toISOString(),
        },
      ],
    }));
    setDesc("");
    setAmount("");
    setShowForm(false);
  };

  const approveExpense = (id: string) => {
    setGroup((prev) => ({
      ...prev,
      expenses: prev.expenses.map((e) => {
        if (e.id !== id) return e;
        const splits: Record<string, number> = {};
        const share = e.amount / prev.members.length;
        prev.members.forEach(
          (m) => (splits[m.id] = Math.round(share * 100) / 100)
        );
        return { ...e, status: "approved" as const, splits };
      }),
    }));
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <div>
          <h2 style={{ ...secTitle, marginBottom: 4 }}>Expenses</h2>
          <p style={{ fontSize: 14, color: T.secondary, margin: 0 }}>
            Requires treasurer approval
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            padding: "8px 16px",
            borderRadius: 20,
            border: "none",
            background: showForm ? T.bg : T.blue,
            color: showForm ? T.text : "#fff",
            fontFamily: T.font,
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {showForm ? "Cancel" : "+ Submit"}
        </button>
      </div>

      {showForm && (
        <div style={{ ...cardStyle, marginBottom: 20 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
              marginBottom: 14,
            }}
          >
            <div>
              <label style={labelStyle}>Description</label>
              <input
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="Toilet paper, etc."
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Amount</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                style={inputStyle}
              />
            </div>
          </div>
          <button
            onClick={submitExpense}
            style={{
              width: "100%",
              padding: "12px 0",
              borderRadius: T.radiusSm,
              border: "none",
              background: desc.trim() && amount ? T.blue : "#c7c7cc",
              color: "#fff",
              fontFamily: T.font,
              fontSize: 15,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Submit for Approval
          </button>
        </div>
      )}

      {pending.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h3
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: T.orange,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: 10,
            }}
          >
            Pending · {pending.length}
          </h3>
          <div style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
            {pending.map((e, i) => (
              <div
                key={e.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "14px 18px",
                  borderBottom:
                    i < pending.length - 1
                      ? `1px solid ${T.border}`
                      : "none",
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: "rgba(255,149,0,0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 17,
                  }}
                >
                  🛒
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, fontSize: 14 }}>
                    {e.description}
                  </div>
                  <div style={{ fontSize: 12, color: T.tertiary }}>
                    by {e.submittedByName}
                  </div>
                </div>
                <div
                  style={{
                    fontFamily: T.mono,
                    fontWeight: 600,
                    fontSize: 14,
                  }}
                >
                  ${e.amount.toFixed(2)}
                </div>
                {isTreasurer && (
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      onClick={() => approveExpense(e.id)}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        border: "none",
                        background: T.green,
                        color: "#fff",
                        fontSize: 16,
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      ✓
                    </button>
                    <button
                      onClick={() =>
                        setGroup((prev) => ({
                          ...prev,
                          expenses: prev.expenses.map((x) =>
                            x.id === e.id
                              ? { ...x, status: "denied" as const }
                              : x
                          ),
                        }))
                      }
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        border: "none",
                        background: T.bg,
                        color: T.secondary,
                        fontSize: 16,
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      ✗
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {approved.length > 0 && (
        <div>
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
            Approved
          </h3>
          <div style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
            {[...approved].reverse().map((e, i) => (
              <div
                key={e.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 18px",
                  borderBottom:
                    i < approved.length - 1
                      ? `1px solid ${T.border}`
                      : "none",
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: "rgba(88,86,214,0.08)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 17,
                  }}
                >
                  🛒
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, fontSize: 14 }}>
                    {e.description}
                  </div>
                  <div style={{ fontSize: 12, color: T.tertiary }}>
                    by {e.submittedByName} · $
                    {(e.amount / group.members.length).toFixed(2)}/person
                  </div>
                </div>
                <div
                  style={{
                    fontFamily: T.mono,
                    fontWeight: 600,
                    fontSize: 14,
                  }}
                >
                  ${e.amount.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {pending.length === 0 && approved.length === 0 && !showForm && (
        <div
          style={{
            textAlign: "center",
            padding: 48,
            color: T.tertiary,
            fontSize: 15,
          }}
        >
          No expenses yet
        </div>
      )}
    </div>
  );
}
