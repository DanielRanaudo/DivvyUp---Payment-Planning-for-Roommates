"use client";

import { useState, useMemo } from "react";
import { T } from "@/lib/tokens";
import { uid, groupCode } from "@/lib/utils";
import type { Group, Member, Charge } from "@/lib/types";

import TabBar from "@/components/TabBar";
import UserSwitcher from "@/components/UserSwitcher";
import WelcomeScreen from "@/components/screens/WelcomeScreen";
import CreateGroupScreen from "@/components/screens/CreateGroupScreen";
import JoinGroupScreen from "@/components/screens/JoinGroupScreen";
import DashboardTab from "@/components/tabs/DashboardTab";
import RentTab from "@/components/tabs/RentTab";
import UtilitiesTab from "@/components/tabs/UtilitiesTab";
import ExpensesTab from "@/components/tabs/ExpensesTab";
import SettleTab from "@/components/tabs/SettleTab";
import MembersTab from "@/components/tabs/MembersTab";

export default function DivvyUp() {
  const [screen, setScreen] = useState<"welcome" | "create" | "join" | "app">(
    "welcome"
  );
  const [groups, setGroups] = useState<Group[]>([]);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<Member | null>(null);
  const [tab, setTab] = useState("dashboard");

  const group = groups.find((g) => g.id === activeGroupId) ?? null;
  const isTreasurer = currentUser?.isTreasurer || false;

  const setGroup = (updater: (prev: Group) => Group) => {
    setGroups((prev) =>
      prev.map((g) => (g.id === activeGroupId ? updater(g) : g))
    );
  };

  const handleCreate = (
    groupName: string,
    userName: string,
    venmo: string
  ) => {
    const user: Member = {
      id: uid(),
      name: userName,
      venmo,
      isTreasurer: true,
    };
    const demoMembers: Member[] = [
      { id: uid(), name: "Alex", venmo: "@alex-v", isTreasurer: false },
      { id: uid(), name: "Jordan", venmo: "@jordanp", isTreasurer: false },
      { id: uid(), name: "Sam", venmo: "@samwise", isTreasurer: false },
      { id: uid(), name: "Riley", venmo: "", isTreasurer: false },
      { id: uid(), name: "Casey", venmo: "@caseyg", isTreasurer: false },
      { id: uid(), name: "Morgan", venmo: "", isTreasurer: false },
      { id: uid(), name: "Taylor", venmo: "@taylork", isTreasurer: false },
      { id: uid(), name: "Jamie", venmo: "@jamiej", isTreasurer: false },
      { id: uid(), name: "Quinn", venmo: "@quinnr", isTreasurer: false },
    ];
    const g: Group = {
      id: uid(),
      name: groupName,
      code: groupCode(),
      members: [user, ...demoMembers],
      rent: null,
      utilities: [],
      expenses: [],
      payments: [],
      smartSettle: false,
    };
    setGroups((prev) => [...prev, g]);
    setActiveGroupId(g.id);
    setCurrentUser(user);
    setScreen("app");
  };

  const handleJoin = (groupId: string, userName: string, venmo: string) => {
    const user: Member = {
      id: uid(),
      name: userName,
      venmo,
      isTreasurer: false,
    };
    setGroups((prev) =>
      prev.map((g) =>
        g.id === groupId ? { ...g, members: [...g.members, user] } : g
      )
    );
    setActiveGroupId(groupId);
    setCurrentUser(user);
    setScreen("app");
  };

  const allCharges = useMemo<Charge[]>(() => {
    if (!group) return [];
    const charges: Charge[] = [];
    const treasurer = group.members.find((m) => m.isTreasurer);
    const treasurerId = treasurer?.id;
    if (group.rent?.splits)
      charges.push({
        id: group.rent.id,
        type: "rent",
        description: "Rent",
        amount: group.rent.amount,
        splits: group.rent.splits,
        recurring: group.rent.recurring,
        paidBy: treasurerId,
      });
    group.utilities.forEach((u) =>
      charges.push({
        id: u.id,
        type: "utility",
        description: u.name,
        amount: u.amount,
        splits: u.splits,
        recurring: u.recurring,
        paidBy: treasurerId,
      })
    );
    group.expenses
      .filter((e) => e.status === "approved")
      .forEach((e) =>
        charges.push({
          id: e.id,
          type: "expense",
          description: e.description,
          amount: e.amount,
          splits: e.splits!,
          submittedByName: e.submittedByName,
          paidBy: e.submittedBy,
          recurring: false,
        })
      );
    return charges;
  }, [group]);

  const pendingExpenses =
    group?.expenses.filter((e) => e.status === "pending").length || 0;
  const pendingPayments = currentUser
    ? (group?.payments || []).filter(
        (p) => p.toId === currentUser.id && p.status === "pending"
      ).length
    : 0;

  const treasurerTabs = [
    { id: "dashboard", label: "Home", badge: pendingPayments || null },
    { id: "rent", label: "Rent" },
    { id: "utilities", label: "Bills" },
    {
      id: "expenses",
      label: "Expenses",
      badge: pendingExpenses || null,
    },
    { id: "settle", label: "Settle" },
    { id: "members", label: "Group" },
  ];
  const memberTabs = [
    { id: "dashboard", label: "Home", badge: pendingPayments || null },
    {
      id: "expenses",
      label: "Expenses",
      badge: pendingExpenses || null,
    },
    { id: "settle", label: "Settle" },
    { id: "members", label: "Group" },
  ];

  return (
    <div
      style={{
        fontFamily: T.font,
        color: T.text,
        background: T.bg,
        minHeight: "100vh",
      }}
    >
      {screen === "welcome" && (
        <WelcomeScreen
          onStart={() => setScreen("create")}
          onJoin={() => setScreen("join")}
        />
      )}
      {screen === "create" && (
        <CreateGroupScreen
          onBack={() => setScreen("welcome")}
          onCreate={handleCreate}
        />
      )}
      {screen === "join" && (
        <JoinGroupScreen
          onBack={() => setScreen("welcome")}
          onJoin={handleJoin}
          groups={groups}
        />
      )}

      {screen === "app" && group && currentUser && (
        <div
          style={{
            maxWidth: 560,
            margin: "0 auto",
            padding: "12px 20px",
            paddingBottom: 80,
          }}
        >
          <div
            style={{
              padding: "12px 0 8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <h1
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  margin: 0,
                  letterSpacing: "-0.02em",
                }}
              >
                divvyup
              </h1>
              <div
                style={{
                  fontSize: 13,
                  color: T.tertiary,
                  fontWeight: 500,
                  marginTop: 1,
                }}
              >
                {group.name}
              </div>
            </div>
            <button
              onClick={() => {
                setScreen("welcome");
                setActiveGroupId(null);
                setCurrentUser(null);
                setTab("dashboard");
              }}
              style={{
                background: T.bg,
                border: "none",
                borderRadius: 20,
                padding: "7px 14px",
                fontSize: 13,
                color: T.secondary,
                cursor: "pointer",
                fontWeight: 500,
                fontFamily: T.font,
              }}
            >
              Leave
            </button>
          </div>

          <TabBar
            tabs={isTreasurer ? treasurerTabs : memberTabs}
            active={tab}
            onChange={setTab}
          />

          {tab === "dashboard" && (
            <DashboardTab
              group={group}
              currentUser={currentUser}
              allCharges={allCharges}
              setGroup={setGroup}
              setTab={setTab}
            />
          )}
          {tab === "rent" && isTreasurer && (
            <RentTab group={group} setGroup={setGroup} />
          )}
          {tab === "utilities" && isTreasurer && (
            <UtilitiesTab group={group} setGroup={setGroup} />
          )}
          {tab === "expenses" && (
            <ExpensesTab
              group={group}
              setGroup={setGroup}
              currentUser={currentUser}
              isTreasurer={isTreasurer}
            />
          )}
          {tab === "settle" && (
            <SettleTab
              group={group}
              setGroup={setGroup}
              allCharges={allCharges}
              currentUser={currentUser}
            />
          )}
          {tab === "members" && (
            <MembersTab
              group={group}
              setGroup={setGroup}
              currentUser={currentUser}
              isTreasurer={isTreasurer}
            />
          )}

          <UserSwitcher
            group={group}
            currentUser={currentUser}
            setCurrentUser={setCurrentUser}
          />
        </div>
      )}
    </div>
  );
}
