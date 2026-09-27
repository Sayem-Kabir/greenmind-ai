export type ThemeMode = "midnight" | "classic";

export interface ThemeTokens {
  mode: ThemeMode;
  name: string;

  // Header & Navigation
  headerBg: string;
  headerText: string;
  headerBorder: string;
  headerBackdropBlur: string;

  // Brand Logo Colors
  brandNameWord1: string; // "GreenMind"
  brandNameWord2: string; // "AI"
  brandTagline: string;   // "Democratizing Environmental Intelligence in Debrecen"
  brandTaglineColor: string;
  brandAvatarBg: string;
  brandAvatarIconColor: string;

  // Global Canvas & Surfaces ("keep white part most")
  appBg: string;
  cardBg: string;
  cardBorder: string;
  cardShadow: string;

  // Primary & Accent Palettes
  primaryDark: string;
  primary: string;
  primaryLight: string;
  accent: string;       // Emerald / Mint green
  accentHover: string;
  accentBgSubtle: string;

  // Sidebar Styling
  sidebarBg: string;
  sidebarBorder: string;
  sidebarTextColor: string;
  sidebarHoverBg: string;
  sidebarActiveBg: string;
  sidebarActiveColor: string;
  sidebarActiveIndicator: string;
  sidebarFooterBg: string;
  sidebarFooterBorder: string;

  // Floating Copilot Palette
  copilotTriggerBg: string;
  copilotTriggerColor: string;
  copilotTriggerShadow: string;
  copilotHeaderBg: string;
  copilotHeaderColor: string;
  copilotAccent: string;

  // Text Hierarchy
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
}

export const midnightTheme: ThemeTokens = {
  mode: "midnight",
  name: "Midnight Emerald (Default)",

  // Deep midnight navy topbar matching the uploaded brand image
  headerBg: "#142332",
  headerText: "#ffffff",
  headerBorder: "rgba(255, 255, 255, 0.08)",
  headerBackdropBlur: "none",

  // Exact Logo Typography from the user's reference image
  brandNameWord1: "#ffffff",
  brandNameWord2: "#a3ccb5",
  brandTagline: "Democratizing Environmental Intelligence in Debrecen",
  brandTaglineColor: "#94a3b8",
  brandAvatarBg: "#203b3b",
  brandAvatarIconColor: "#ffffff",

  // Main canvas: clean, predominantly white and soft clean slate for high contrast & readability
  appBg: "#f6f7f9",
  cardBg: "#ffffff",
  cardBorder: "#e2e7e5",
  cardShadow: "none",

  // Primary colors
  primaryDark: "#070c1a",
  primary: "#0b1329",
  primaryLight: "#1e293b",
  accent: "#397859",
  accentHover: "#2e6249",
  accentBgSubtle: "#edf4ef",

  // Sidebar: clean white with dark navy text and emerald accents
  sidebarBg: "#ffffff",
  sidebarBorder: "rgba(15, 23, 42, 0.08)",
  sidebarTextColor: "#334155",
  sidebarHoverBg: "rgba(11, 19, 41, 0.04)",
  sidebarActiveBg: "#edf3ef",
  sidebarActiveColor: "#0b1329",
  sidebarActiveIndicator: "#82b99b",
  sidebarFooterBg: "#142332",
  sidebarFooterBorder: "rgba(0, 220, 130, 0.2)",

  // Copilot matching the midnight & emerald palette
  copilotTriggerBg: "#0b1329",
  copilotTriggerColor: "#ffffff",
  copilotTriggerShadow: "0 3px 12px rgba(11, 19, 41, 0.16)",
  copilotHeaderBg: "#0b1329",
  copilotHeaderColor: "#ffffff",
  copilotAccent: "#a3ccb5",

  textPrimary: "#0f172a",
  textSecondary: "#475569",
  textMuted: "#6b798b",
};

export const classicTheme: ThemeTokens = {
  mode: "classic",
  name: "Classic Teal",

  // Original light teal styling for instant 100% reversion
  headerBg: "#ffffff",
  headerText: "#14332d",
  headerBorder: "rgba(15, 118, 110, 0.12)",
  headerBackdropBlur: "none",

  brandNameWord1: "#0f766e",
  brandNameWord2: "#16a34a",
  brandTagline: "Urban environmental intelligence",
  brandTaglineColor: "#6b7f79",
  brandAvatarBg: "#38785b",
  brandAvatarIconColor: "#ffffff",

  appBg: "#f5f7f5",
  cardBg: "#ffffff",
  cardBorder: "#e2e7e5",
  cardShadow: "none",

  primaryDark: "#042f2e",
  primary: "#0f766e",
  primaryLight: "#14b8a6",
  accent: "#38785b",
  accentHover: "#2d634b",
  accentBgSubtle: "rgba(15, 118, 110, 0.08)",

  sidebarBg: "#ffffff",
  sidebarBorder: "rgba(15, 118, 110, 0.12)",
  sidebarTextColor: "#44534f",
  sidebarHoverBg: "rgba(15, 118, 110, 0.08)",
  sidebarActiveBg: "#e4f5f0",
  sidebarActiveColor: "#0f766e",
  sidebarActiveIndicator: "#0f766e",
  sidebarFooterBg: "rgba(232, 247, 243, 0.72)",
  sidebarFooterBorder: "rgba(15, 118, 110, 0.14)",

  copilotTriggerBg: "#0f766e",
  copilotTriggerColor: "#ffffff",
  copilotTriggerShadow: "0 3px 12px rgba(15, 118, 110, 0.16)",
  copilotHeaderBg: "#0f766e",
  copilotHeaderColor: "#ffffff",
  copilotAccent: "#16a34a",

  textPrimary: "#14332d",
  textSecondary: "#44534f",
  textMuted: "#6b7f79",
};

export const THEMES: Record<ThemeMode, ThemeTokens> = {
  midnight: midnightTheme,
  classic: classicTheme,
};
