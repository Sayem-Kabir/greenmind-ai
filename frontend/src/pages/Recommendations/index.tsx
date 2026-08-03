import { useEffect, useMemo, useState } from "react";
import DirectionsBusOutlinedIcon from "@mui/icons-material/DirectionsBusOutlined";
import InsightsOutlinedIcon from "@mui/icons-material/InsightsOutlined";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  LinearProgress,
  Typography,
} from "@mui/material";

import CityMap from "../../components/map/CityMap";
import SimulateButton from "../../components/recommendations/SimulateButton";
import SimulationImpact from "../../components/recommendations/SimulationImpact";
import SimulationStatus from "../../components/recommendations/SimulationStatus";
import { useSimulation } from "../../context/SimulationContext";
import { getRecommendations } from "../../services/recommendationService";
import type { SensorRecommendation } from "../../types/recommendation";

const MAX_VISIBLE_RECOMMENDATIONS = 3;

function getPriorityStyle(score: number) {
  if (score >= 70) {
    return {
      label: "High priority",
      color: "#b42318",
      background: "#fef3f2",
      border: "#fecdca",
    };
  }

  if (score >= 45) {
    return {
      label: "Medium priority",
      color: "#b54708",
      background: "#fffaeb",
      border: "#fedf89",
    };
  }

  return {
    label: "Lower priority",
    color: "#027a48",
    background: "#ecfdf3",
    border: "#abefc6",
  };
}

function getConfidenceStyle(confidence: number) {
  if (confidence >= 75) {
    return {
      color: "#027a48",
      background: "#ecfdf3",
      border: "#abefc6",
    };
  }

  if (confidence >= 50) {
    return {
      color: "#b54708",
      background: "#fffaeb",
      border: "#fedf89",
    };
  }

  return {
    color: "#475467",
    background: "#f2f4f7",
    border: "#d0d5dd",
  };
}

function formatScore(value: number | undefined): string {
  return `${Math.round(value ?? 0)}/100`;
}

interface MetricBoxProps {
  label: string;
  value: string;
  accent: string;
  background: string;
}

function MetricBox({
  label,
  value,
  accent,
  background,
}: MetricBoxProps) {
  return (
    <Box
      sx={{
        p: 1.5,
        height: "100%",
        borderRadius: 2.5,
        backgroundColor: background,
        border: `1px solid ${accent}22`,
      }}
    >
      <Typography
        variant="caption"
        sx={{
          color: "#667085",
          fontWeight: 600,
        }}
      >
        {label}
      </Typography>

      <Typography
        variant="h6"
        sx={{
          mt: 0.4,
          color: accent,
          fontWeight: 800,
          letterSpacing: "-0.02em",
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}

export default function Recommendations() {
  const [recommendations, setRecommendations] = useState<
    SensorRecommendation[]
  >([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const { simulatedStations } = useSimulation();

  useEffect(() => {
    async function loadRecommendations() {
      setLoading(true);
      setError("");

      try {
        const data = await getRecommendations(
          simulatedStations,
        );

        setRecommendations(data);
      } catch {
        setError(
          "Could not load backend sensor recommendations.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadRecommendations();
  }, [simulatedStations]);

  const visibleRecommendations = useMemo(
    () =>
      recommendations
        .filter(
          (candidate) =>
            !simulatedStations.some(
              (station) =>
                station.lat === candidate.lat &&
                station.lng === candidate.lng,
            ),
        )
        .slice(0, MAX_VISIBLE_RECOMMENDATIONS),
    [recommendations, simulatedStations],
  );

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          alignItems: {
            xs: "flex-start",
            sm: "center",
          },
          justifyContent: "space-between",
          flexDirection: {
            xs: "column",
            sm: "row",
          },
          gap: 2,
          mb: 3,
        }}
      >
        <Box>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              color: "#173c35",
              letterSpacing: "-0.03em",
            }}
          >
            AI Sensor Recommendations
          </Typography>

          <Typography
            color="text.secondary"
            sx={{
              mt: 0.75,
              maxWidth: 880,
              lineHeight: 1.6,
            }}
          >
            The top three locations are ranked using monitoring
            coverage, environmental risk, historical variability,
            low-wind conditions and DKV public-transport activity.
          </Typography>
        </Box>

        <Chip
          icon={<DirectionsBusOutlinedIcon />}
          label="Traffic-aware ranking"
          size="small"
          sx={{
            color: "#5b21b6",
            backgroundColor: "#f3e8ff",
            border: "1px solid #e9d5ff",
            fontWeight: 700,
            "& .MuiChip-icon": {
              color: "#7c3aed",
            },
          }}
        />
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <SimulationStatus />

      <SimulationImpact />

      <Box sx={{ mb: 3 }}>
        <CityMap />
      </Box>

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 1,
          mb: 2,
        }}
      >
        <Typography
          variant="h5"
          sx={{
            fontWeight: 800,
            color: "#213a34",
          }}
        >
          Top 3 Recommended Locations
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
        >
          Ranked by combined environmental and coverage priority
        </Typography>
      </Box>

      {loading && (
        <Box
          sx={{
            mb: 3,
            p: 2,
            borderRadius: 2.5,
            border:
              "1px solid rgba(15, 118, 110, 0.12)",
            backgroundColor: "#f8fbfa",
          }}
        >
          <Typography
            color="text.secondary"
            sx={{ mb: 1 }}
          >
            Recalculating recommendations...
          </Typography>

          <LinearProgress
            sx={{
              height: 7,
              borderRadius: 4,
              backgroundColor: "#dceee9",
              "& .MuiLinearProgress-bar": {
                backgroundColor: "#0f766e",
              },
            }}
          />
        </Box>
      )}

      {!loading &&
        visibleRecommendations.length === 0 && (
          <Alert severity="info">
            No remaining recommendation locations are available.
          </Alert>
        )}

      <Grid container spacing={2.5}>
        {visibleRecommendations.map(
          (candidate, index) => {
            const overallConfidence =
              candidate.overallConfidence ?? 0;

            const trafficActivityScore =
              candidate.trafficActivityScore ?? 0;

            const trafficConfidence =
              candidate.trafficConfidence ?? 0;

            const nearestTrafficStop =
              candidate.nearestTrafficStop ??
              "No nearby DKV stop";

            const trafficDistanceKm =
              candidate.trafficDistanceKm;

            const priorityStyle =
              getPriorityStyle(
                candidate.priorityScore,
              );

            const confidenceStyle =
              getConfidenceStyle(
                overallConfidence,
              );

            return (
              <Grid
                key={candidate.id}
                size={{
                  xs: 12,
                  md: 6,
                  lg: 4,
                }}
              >
                <Card
                  variant="outlined"
                  sx={{
                    height: "100%",
                    borderRadius: 3,
                    display: "flex",
                    flexDirection: "column",
                    borderColor:
                      "rgba(15, 118, 110, 0.12)",
                    borderTop:
                      index === 0
                        ? "4px solid #0f766e"
                        : "1px solid rgba(15, 118, 110, 0.12)",
                    backgroundColor: "#ffffff",
                    transition:
                      "transform 160ms ease, box-shadow 160ms ease",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      boxShadow:
                        "0 14px 30px rgba(31, 60, 52, 0.1)",
                    },
                  }}
                >
                  <CardContent
                    sx={{
                      p: 2.5,
                      display: "flex",
                      flexDirection: "column",
                      height: "100%",
                      "&:last-child": {
                        pb: 2.5,
                      },
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent:
                          "space-between",
                        alignItems:
                          "flex-start",
                        gap: 1.5,
                        mb: 2,
                      }}
                    >
                      <Box>
                        <Typography
                          variant="overline"
                          sx={{
                            color: "#0f766e",
                            fontWeight: 800,
                            letterSpacing: "0.1em",
                          }}
                        >
                          Rank #{index + 1}
                        </Typography>

                        <Typography
                          variant="h6"
                          sx={{
                            mt: 0.2,
                            fontWeight: 800,
                            color: "#1f2f2b",
                          }}
                        >
                          Recommended Location
                        </Typography>
                      </Box>

                      <Box
                        sx={{
                          minWidth: 70,
                          px: 1.25,
                          py: 0.8,
                          textAlign: "center",
                          borderRadius: 2.5,
                          color: priorityStyle.color,
                          backgroundColor:
                            priorityStyle.background,
                          border: `1px solid ${priorityStyle.border}`,
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            display: "block",
                            fontWeight: 700,
                          }}
                        >
                          Priority
                        </Typography>

                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 800,
                            lineHeight: 1.2,
                          }}
                        >
                          {candidate.priorityScore}
                        </Typography>
                      </Box>
                    </Box>

                    <Chip
                      size="small"
                      label={priorityStyle.label}
                      sx={{
                        alignSelf: "flex-start",
                        mb: 2,
                        color: priorityStyle.color,
                        backgroundColor:
                          priorityStyle.background,
                        border: `1px solid ${priorityStyle.border}`,
                        fontWeight: 700,
                      }}
                    />

                    <Grid container spacing={1.25}>
                      <Grid size={{ xs: 6 }}>
                        <MetricBox
                          label="Coverage gap"
                          value={formatScore(
                            candidate.coverageScore,
                          )}
                          accent="#0f766e"
                          background="#ecfdf5"
                        />
                      </Grid>

                      <Grid size={{ xs: 6 }}>
                        <MetricBox
                          label="Pollution risk"
                          value={formatScore(
                            candidate.pollutionRisk,
                          )}
                          accent="#c2410c"
                          background="#fff7ed"
                        />
                      </Grid>

                      <Grid size={{ xs: 6 }}>
                        <MetricBox
                          label="DKV activity"
                          value={formatScore(
                            trafficActivityScore,
                          )}
                          accent="#6d28d9"
                          background="#f5f3ff"
                        />
                      </Grid>

                      <Grid size={{ xs: 6 }}>
                        <MetricBox
                          label="Confidence"
                          value={`${overallConfidence}%`}
                          accent="#2563eb"
                          background="#eff6ff"
                        />
                      </Grid>
                    </Grid>

                    <Divider sx={{ my: 2.25 }} />

                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 1.75,
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          gap: 1.25,
                          alignItems: "flex-start",
                        }}
                      >
                        <Box
                          sx={{
                            width: 34,
                            height: 34,
                            borderRadius: 2,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#0f766e",
                            backgroundColor: "#e4f5f0",
                            flexShrink: 0,
                          }}
                        >
                          <LocationOnOutlinedIcon
                            fontSize="small"
                          />
                        </Box>

                        <Box>
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 700,
                              color: "#344054",
                            }}
                          >
                            Monitoring gap
                          </Typography>

                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mt: 0.25 }}
                          >
                            {candidate.distanceKm.toFixed(
                              2,
                            )}{" "}
                            km from{" "}
                            {candidate.nearestStation}
                          </Typography>
                        </Box>
                      </Box>

                      <Box
                        sx={{
                          display: "flex",
                          gap: 1.25,
                          alignItems: "flex-start",
                        }}
                      >
                        <Box
                          sx={{
                            width: 34,
                            height: 34,
                            borderRadius: 2,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#6d28d9",
                            backgroundColor: "#f3e8ff",
                            flexShrink: 0,
                          }}
                        >
                          <DirectionsBusOutlinedIcon
                            fontSize="small"
                          />
                        </Box>

                        <Box>
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 700,
                              color: "#344054",
                            }}
                          >
                            DKV transport context
                          </Typography>

                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mt: 0.25 }}
                          >
                            {nearestTrafficStop}
                            {trafficDistanceKm !==
                              undefined &&
                            trafficDistanceKm !== null
                              ? ` · ${trafficDistanceKm.toFixed(
                                  2,
                                )} km away`
                              : ""}
                          </Typography>

                          <Typography
                            variant="caption"
                            color="text.secondary"
                          >
                            Traffic data confidence:{" "}
                            {trafficConfidence}%
                          </Typography>
                        </Box>
                      </Box>

                      <Box
                        sx={{
                          display: "flex",
                          gap: 1.25,
                          alignItems: "flex-start",
                        }}
                      >
                        <Box
                          sx={{
                            width: 34,
                            height: 34,
                            borderRadius: 2,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#c2410c",
                            backgroundColor: "#fff7ed",
                            flexShrink: 0,
                          }}
                        >
                          <InsightsOutlinedIcon
                            fontSize="small"
                          />
                        </Box>

                        <Box>
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 700,
                              color: "#344054",
                            }}
                          >
                            Environmental estimate
                          </Typography>

                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mt: 0.25 }}
                          >
                            PM2.5:{" "}
                            {candidate.estimatedPm25.toFixed(
                              2,
                            )}{" "}
                            µg/m³ · Wind risk:{" "}
                            {candidate.windRisk}/100
                          </Typography>
                        </Box>
                      </Box>
                    </Box>

                    <Box
                      sx={{
                        mt: "auto",
                        pt: 2.5,
                      }}
                    >
                      <Divider sx={{ mb: 2 }} />

                      <Chip
                        size="small"
                        label={`${overallConfidence}% confidence`}
                        sx={{
                          mb: 2,
                          color:
                            confidenceStyle.color,
                          backgroundColor:
                            confidenceStyle.background,
                          border: `1px solid ${confidenceStyle.border}`,
                          fontWeight: 700,
                        }}
                      />

                      <SimulateButton
                        recommendation={candidate}
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          },
        )}
      </Grid>
    </Box>
  );
}