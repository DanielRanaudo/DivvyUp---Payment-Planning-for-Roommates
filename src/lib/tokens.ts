export const T = {
  bg: "#f5f5f7",
  card: "rgba(255,255,255,0.8)",
  cardSolid: "#ffffff",
  border: "rgba(0,0,0,0.06)",
  text: "#1d1d1f",
  secondary: "#86868b",
  tertiary: "#aeaeb2",
  blue: "#007AFF",
  green: "#34C759",
  red: "#FF3B30",
  orange: "#FF9500",
  purple: "#AF52DE",
  radius: 16,
  radiusSm: 12,
  shadow: "0 2px 12px rgba(0,0,0,0.06), 0 0 1px rgba(0,0,0,0.08)",
  shadowLg: "0 8px 30px rgba(0,0,0,0.08), 0 0 1px rgba(0,0,0,0.1)",
  font: "'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
  mono: "'JetBrains Mono', 'SF Mono', monospace",
} as const;

export const GRADIENTS = [
  "linear-gradient(135deg, #5856D6, #AF52DE)",
  "linear-gradient(135deg, #FF9500, #FF2D55)",
  "linear-gradient(135deg, #34C759, #30D158)",
  "linear-gradient(135deg, #007AFF, #5AC8FA)",
  "linear-gradient(135deg, #FF2D55, #FF6482)",
  "linear-gradient(135deg, #00C7BE, #34C759)",
  "linear-gradient(135deg, #FF9500, #FFCC00)",
  "linear-gradient(135deg, #5856D6, #007AFF)",
  "linear-gradient(135deg, #AF52DE, #FF2D55)",
  "linear-gradient(135deg, #30D158, #5AC8FA)",
  "linear-gradient(135deg, #FF6482, #FF9500)",
  "linear-gradient(135deg, #5AC8FA, #AF52DE)",
] as const;

export const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: T.radiusSm,
  border: "none",
  fontFamily: T.font,
  fontSize: 15,
  outline: "none",
  background: T.bg,
  boxSizing: "border-box",
  color: T.text,
  transition: "box-shadow 0.2s",
};

export const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 13,
  fontWeight: 500,
  color: T.secondary,
  marginBottom: 6,
};

export const cardStyle: React.CSSProperties = {
  background: T.cardSolid,
  borderRadius: T.radius,
  padding: "18px 20px",
  boxShadow: T.shadow,
};

export const secTitle: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 600,
  color: T.text,
  margin: "0 0 16px 0",
  letterSpacing: "-0.02em",
};

export const FONT_URL =
  "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap";
