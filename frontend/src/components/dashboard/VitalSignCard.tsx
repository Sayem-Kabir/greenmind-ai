import type { ReactNode } from "react";
import {
  Box,
  Paper,
  Typography,
  Chip,
  LinearProgress,
  Tooltip,
  IconButton,
} from "@mui/material";
import { InfoOutlined as InfoIcon } from "@mui/icons-material";
import { useAppTheme } from "../../context/ThemeContext";

export interface VitalSignCardProps {
  title?: string;
  category: string;
  icon: ReactNode;
  statusBadge: {
    label: string;
    color: string;
    bg: string;
  };
  humanValue: string;
  technicalValue: string;
  viewMode?: "citizen" | "analyst";
  humanAnalogy?: string;
  technicalDetails?: string;
  progressPercent: number;
  progressColor: string;
  scaleLabels: [string, string, string];
  onInfoClick?: () => void;
}

export default function VitalSignCard({
  category,
  icon,
  statusBadge,
  humanValue,
  technicalValue,
  viewMode = "citizen",
  progressPercent,
  progressColor,
  scaleLabels,
  onInfoClick,
}: VitalSignCardProps) {
  const { tokens, isMidnight } = useAppTheme();

  const displayVal = viewMode === "citizen" ? humanValue : technicalValue;
  // Parse numeric part and unit part for clean typography hierarchy
  const match = displayVal.match(/^([\d.]+)\s*(.*)$/);
  const valuePart = match ? match[1] : displayVal;
  const unitPart = match ? match[2] : "";

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.25,
        borderRadius: 3,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        backgroundColor: tokens.cardBg,
        border: `1px solid ${tokens.cardBorder}`,
        boxShadow: "none",
        transition: "border-color 0.2s ease, box-shadow 0.2s ease",
        "&:hover": {
          borderColor: statusBadge.color,
          boxShadow: isMidnight ? "0 4px 20px rgba(0,0,0,0.3)" : "0 4px 16px rgba(0,0,0,0.04)",
        },
      }}
    >
      <Box>
        {/* Header: Icon, Category & Status Badge */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: statusBadge.bg,
                color: statusBadge.color,
              }}
            >
              {icon}
            </Box>
            <Typography sx={{ fontWeight: 600, color: tokens.textPrimary, fontSize: "0.95rem" }}>
              {category}
            </Typography>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
            <Chip
              label={statusBadge.label}
              size="small"
              sx={{
                fontWeight: 500,
                fontSize: "0.72rem",
                height: 22,
                borderRadius: 1.5,
                backgroundColor: statusBadge.bg,
                color: statusBadge.color,
                border: `1px solid ${statusBadge.color}25`,
              }}
            />
            {onInfoClick && (
              <Tooltip title="Metric details">
                <IconButton size="small" onClick={onInfoClick} sx={{ color: tokens.textMuted, p: 0.35 }}>
                  <InfoIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>

        {/* Primary Metric: Clean value with subtle unit */}
        <Box sx={{ my: 1.25, display: "flex", alignItems: "baseline", gap: 0.75 }}>
          <Typography
            sx={{
              fontWeight: 600,
              color: tokens.textPrimary,
              fontSize: { xs: "1.65rem", sm: "1.85rem" },
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
            }}
          >
            {valuePart}
          </Typography>
          {unitPart && (
            <Typography
              sx={{
                fontWeight: 500,
                color: tokens.textSecondary,
                fontSize: "0.88rem",
              }}
            >
              {unitPart}
            </Typography>
          )}
        </Box>

        {/* Visual Progress Bar & Min/Max Scale */}
        <Box sx={{ mt: 1.5 }}>
          <LinearProgress
            variant="determinate"
            value={progressPercent}
            sx={{
              height: 4,
              borderRadius: 2,
              backgroundColor: isMidnight ? "rgba(255,255,255,0.06)" : "#f1f5f9",
              "& .MuiLinearProgress-bar": {
                backgroundColor: progressColor,
                borderRadius: 2,
              },
            }}
          />
          <Box sx={{ display: "flex", justifyContent: "space-between", mt: 0.75 }}>
            <Typography sx={{ fontSize: "0.72rem", color: tokens.textMuted, fontWeight: 500 }}>
              {scaleLabels[0]}
            </Typography>
            <Typography sx={{ fontSize: "0.72rem", color: tokens.textMuted, fontWeight: 500 }}>
              {scaleLabels[2]}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
}
