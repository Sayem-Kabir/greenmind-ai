import {
  Box,
  Typography,
  Chip,
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
  vitalityLabel = "Optimal Condition",
  vitalityColor = "#059669",
  vitalityBg = "rgba(0, 220, 130, 0.12)",
}: CitizenHealthHeroProps) {
  const { tokens } = useAppTheme();

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, sm: 2.5 },
        mb: 3,
        borderRadius: 3,
        background: tokens.cardBg,
        border: `1px solid ${tokens.cardBorder}`,
        boxShadow: "none",
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        alignItems: { xs: "flex-start", sm: "center" },
        justifyContent: "space-between",
        gap: 2,
      }}
    >
      {/* Title & Status Badge */}
      <Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, flexWrap: "wrap" }}>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              color: tokens.textPrimary,
              letterSpacing: "-0.02em",
              fontSize: { xs: "1.25rem", sm: "1.45rem" },
            }}
          >
            Debrecen Environmental Health
          </Typography>

          <Chip
            size="small"
            label={vitalityLabel}
            sx={{
              fontWeight: 600,
              fontSize: "0.72rem",
              height: 22,
              backgroundColor: vitalityBg,
              color: vitalityColor,
              border: `1px solid ${vitalityColor}35`,
            }}
          />
        </Box>
      </Box>

      {/* Compact Health Score Badge */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          px: 2,
          py: 1,
          borderRadius: 2.5,
          backgroundColor: tokens.cardBg,
          border: `1px solid ${tokens.cardBorder}`,
          boxShadow: "none",
          flexShrink: 0,
        }}
      >
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "conic-gradient(#00dc82 0% 89%, #e2e8f0 89% 100%)",
            p: "3px",
          }}
        >
          <Box
            sx={{
              width: "100%",
              height: "100%",
              borderRadius: "50%",
              backgroundColor: tokens.cardBg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 700, color: "#059669", lineHeight: 1 }}>
              {healthScore}
            </Typography>
          </Box>
        </Box>

        <Box>
          <Typography
            variant="caption"
            sx={{
              color: "text.secondary",
              fontWeight: 600,
              letterSpacing: "0.04em",
              fontSize: "0.62rem",
              display: "block",
              lineHeight: 1,
              mb: 0.3,
            }}
          >
            CITY HEALTH SCORE
          </Typography>
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 600,
              color: tokens.textPrimary,
              lineHeight: 1.1,
              fontSize: "0.85rem",
            }}
          >
            Healthy & Safe
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
}
