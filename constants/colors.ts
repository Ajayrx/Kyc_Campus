const cyan = "#22D3EE";
const cyanGlow = "#06B6D4";
const cyanDim = "#0E7490";
const navyDark = "#050E1F";
const navyMid = "#0A1628";
const navyCard = "#0D1F3C";
const navyBorder = "#142444";

export const COLORS = {
  cyan,
  cyanGlow,
  cyanDim,
  navyDark,
  navyMid,
  navyCard,
  navyBorder,

  dark: {
    background: navyDark,
    surface: navyMid,
    card: navyCard,
    border: navyBorder,
    text: "#F0F9FF",
    textSecondary: "#94A3B8",
    textMuted: "#475569",
    accent: cyan,
    accentDim: cyanDim,
    tabBar: "#070F20",
  },

  light: {
    background: "#F0F9FF",
    surface: "#FFFFFF",
    card: "#FFFFFF",
    border: "#BAE6FD",
    text: "#0A1628",
    textSecondary: "#475569",
    textMuted: "#94A3B8",
    accent: "#0284C7",
    accentDim: "#0EA5E9",
    tabBar: "#FFFFFF",
  },
};

export const CATEGORY_COLORS: Record<string, string> = {
  notice: "#22D3EE",
  event: "#A78BFA",
  hackathon: "#F59E0B",
  club: "#34D399",
  placement: "#FB923C",
  academic: "#60A5FA",
  calendar: "#F472B6",
};

export const CATEGORY_LABELS: Record<string, string> = {
  notice: "Notice",
  event: "Event",
  hackathon: "Hackathon",
  club: "Club",
  placement: "Placement",
  academic: "Academic",
  calendar: "Calendar",
};

export default {
  light: {
    text: "#0A1628",
    background: "#F0F9FF",
    tint: "#0284C7",
    tabIconDefault: "#94A3B8",
    tabIconSelected: "#0284C7",
  },
};
