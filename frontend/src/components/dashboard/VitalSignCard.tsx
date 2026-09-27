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
  const { tokens } = useAppTheme();

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
        boxShadow: tokens.cardShadow,
        transition: "border-color 0.2s ease",
        "&:hover": {
          borderColor: statusBadge.color,
        },
      }}
    >
      <Box>
        {/* Header: Icon, Category & Status Badge */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
            <Box
              sx={{
                width: 38,
                height: 38,
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
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: tokens.textPrimary, lineHeight: 1.2 }}>
              {category}
            </Typography>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
            <Chip
              label={statusBadge.label}
              size="small"
              sx={{
                fontWeight: 700,
                fontSize: "0.72rem",
                height: 22,
                backgroundColor: statusBadge.bg,
                color: statusBadge.color,
                border: `1px solid ${statusBadge.color}33`,
              }}
            />
            {onInfoClick && (
              <Tooltip title="Glossary details">
                <IconButton size="small" onClick={onInfoClick} sx={{ color: "text.secondary", p: 0.5 }}>
                  <InfoIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>

        {/* Primary Metric: Big bold number */}
        <Box sx={{ my: 1.5 }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 900,
              color: tokens.textPrimary,
              letterSpacing: "-0.02em",
              fontSize: { xs: "1.5rem", sm: "1.75rem" },
            }}
          >
            {viewMode === "citizen" ? humanValue : technicalValue}
          </Typography>
        </Box>

        {/* Visual Progress Bar & Min/Max Scale */}
        <Box sx={{ mt: 1.5 }}>
          <LinearProgress
            variant="determinate"
            value={progressPercent}
            sx={{
              height: 6,
              borderRadius: 3,
              backgroundColor: tokens.sidebarHoverBg,
              "& .MuiLinearProgress-bar": {
                backgroundColor: progressColor,
                borderRadius: 3,
              },
            }}
          />
          <Box sx={{ display: "flex", justifyContent: "space-between", mt: 0.75 }}>
            <Typography variant="caption" sx={{ fontSize: "0.68rem", color: "text.secondary", fontWeight: 600 }}>
              {scaleLabels[0]}
            </Typography>
            <Typography variant="caption" sx={{ fontSize: "0.68rem", color: "text.secondary", fontWeight: 600 }}>
              {scaleLabels[2]}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
}
