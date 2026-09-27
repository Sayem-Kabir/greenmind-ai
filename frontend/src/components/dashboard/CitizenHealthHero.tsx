import {
  Box,
  Typography,
  Paper,
} from "@mui/material";
import { useAppTheme } from "../../context/ThemeContext";

interface CitizenHealthHeroProps {
  onOpenGlossary?: () => void;
  healthScore?: number;
  averagePm25?: number | null;
  daytimeNoise?: number;
  vitalityLabel?: string;
  vitalityColor?: string;
  vitalityBg?: string;
  headline?: string;
  citizenTip?: string;
  statusSummaryText?: string;
}

export default function CitizenHealthHero({
  healthScore = 89,
  vitalityLabel = "Optimal",
}: CitizenHealthHeroProps) {
  const { tokens, isMidnight } = useAppTheme();

  // Sanitize any verbose text to keep it crisp and human-designed
  const cleanLabel = vitalityLabel
    ?.replace(/\s*&\s*(Fresh|Healthy|Safe)/gi, "")
    ?.replace(/Condition/gi, "")
    ?.trim() || "Optimal";

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, sm: 2.25 },
        mb: 3,
        borderRadius: 3,
        backgroundColor: tokens.cardBg,
        border: `1px solid ${tokens.cardBorder}`,
        boxShadow: "none",
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        alignItems: { xs: "flex-start", sm: "center" },
        justifyContent: "space-between",
        gap: 2,
      }}
    >
      {/* Title & Live Status Indicator */}
      <Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
          <Typography
            sx={{
              fontWeight: 600,
              color: tokens.textPrimary,
              fontSize: { xs: "1.15rem", sm: "1.3rem" },
              letterSpacing: "-0.01em",
            }}
          >
            Debrecen Environmental Status
          </Typography>

          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 0.75,
              px: 1.2,
              py: 0.35,
              borderRadius: 2,
              backgroundColor: isMidnight ? "rgba(5, 150, 105, 0.12)" : "#ecfdf5",
              border: `1px solid ${isMidnight ? "rgba(5, 150, 105, 0.25)" : "#d1fae5"}`,
            }}
          >
            <Box
              sx={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                backgroundColor: "#10b981",
              }}
            />
            <Typography
              sx={{
                fontSize: "0.74rem",
                fontWeight: 500,
                color: isMidnight ? "#34d399" : "#059669",
              }}
            >
              {cleanLabel}
            </Typography>
          </Box>
        </Box>

        <Typography
          sx={{
            color: tokens.textMuted,
            fontSize: "0.8rem",
            mt: 0.35,
          }}
        >
          Continuous environmental telemetry across active municipal monitoring stations
        </Typography>
      </Box>

      {/* Clean, authentic City Health Index Metric */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          px: 1.75,
          py: 0.85,
          borderRadius: 2.5,
          backgroundColor: isMidnight ? "rgba(255, 255, 255, 0.02)" : "#f8fafc",
          border: `1px solid ${isMidnight ? "rgba(255, 255, 255, 0.06)" : "#e2e8f0"}`,
          flexShrink: 0,
        }}
      >
        <Box sx={{ textAlign: "right" }}>
          <Typography
            sx={{
              fontSize: "0.68rem",
              fontWeight: 500,
              color: tokens.textMuted,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              lineHeight: 1.2,
            }}
          >
            City Health Index
          </Typography>
          <Typography
            sx={{
              fontSize: "0.8rem",
              fontWeight: 600,
              color: healthScore >= 80 ? (isMidnight ? "#34d399" : "#059669") : tokens.textPrimary,
              lineHeight: 1.2,
              mt: 0.2,
            }}
          >
            {healthScore >= 80 ? "Optimal & Stable" : "Moderate"}
          </Typography>
        </Box>

        <Box
          sx={{
            px: 1.25,
            py: 0.45,
            minWidth: 42,
            textAlign: "center",
            borderRadius: 2,
            backgroundColor: isMidnight ? "rgba(16, 185, 129, 0.15)" : "#d1fae5",
            color: isMidnight ? "#34d399" : "#065f46",
            fontSize: "1.15rem",
            fontWeight: 700,
            lineHeight: 1,
          }}
        >
          {healthScore}
        </Box>
      </Box>
    </Paper>
  );
}
