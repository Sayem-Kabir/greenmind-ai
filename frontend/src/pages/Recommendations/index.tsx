import { useEffect, useMemo, useState } from "react";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
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
import { explainRecommendation } from "../../utils/explainRecommendation";

function getScoreColor(
  score: number,
): "success" | "warning" | "error" {
  if (score >= 70) {
    return "error";
  }

  if (score >= 45) {
    return "warning";
  }

  return "success";
}

function getPriorityLabel(score: number): string {
  if (score >= 70) {
    return "High priority";
  }

  if (score >= 45) {
    return "Medium priority";
  }

  return "Lower priority";
}

function getConfidenceColor(
  confidence: number,
): "success" | "warning" | "default" {
  if (confidence >= 75) {
    return "success";
  }

  if (confidence >= 50) {
    return "warning";
  }

  return "default";
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
      recommendations.filter(
        (candidate) =>
          !simulatedStations.some(
            (station) =>
              station.lat === candidate.lat &&
              station.lng === candidate.lng,
          ),
      ),
    [recommendations, simulatedStations],
  );

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 700 }}>
        AI Sensor Recommendations
      </Typography>

      <Typography color="text.secondary" sx={{ mt: 1, mb: 3 }}>
        Recommendations use the official 30-day Green Sentinel dataset,
        monitoring coverage, pollution levels, historical variability and
        low-wind dispersion risk.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <SimulationStatus />

      <SimulationImpact />

      <Box sx={{ mb: 4 }}>
        <CityMap />
      </Box>

      <Typography
        variant="h5"
        sx={{
          fontWeight: 700,
          mb: 2,
        }}
      >
        Top Recommended Locations
      </Typography>

      {loading && (
        <Box sx={{ mb: 3 }}>
          <Typography color="text.secondary" sx={{ mb: 1 }}>
            Recalculating recommendations...
          </Typography>

          <LinearProgress />
        </Box>
      )}

      {!loading && visibleRecommendations.length === 0 && (
        <Alert severity="info">
          No remaining recommendation locations are available.
        </Alert>
      )}

      <Grid container spacing={3}>
        {visibleRecommendations.map((candidate, index) => {
          const explanation = explainRecommendation(candidate);

          const overallConfidence =
            candidate.overallConfidence ??
            explanation.confidence;

          return (
            <Grid
              key={candidate.id}
              size={{ xs: 12, md: 6, lg: 4 }}
            >
              <Card
                variant="outlined"
                sx={{
                  height: "100%",
                  borderRadius: 3,
                }}
              >
                <CardContent>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 2,
                      mb: 2,
                    }}
                  >
                    <Typography
                      variant="h6"
                      sx={{ fontWeight: 700 }}
                    >
                      {`Recommendation #${index + 1}`}
                    </Typography>

                    <Chip
                      label={`Score ${candidate.priorityScore}`}
                      color={getScoreColor(
                        candidate.priorityScore,
                      )}
                    />
                  </Box>

                  <Grid container spacing={1.5}>
                    <Grid size={{ xs: 6 }}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                      >
                        Coverage gap
                      </Typography>

                      <Typography sx={{ fontWeight: 700 }}>
                        {candidate.coverageScore}/100
                      </Typography>
                    </Grid>

                    <Grid size={{ xs: 6 }}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                      >
                        Pollution risk
                      </Typography>

                      <Typography sx={{ fontWeight: 700 }}>
                        {candidate.pollutionRisk}/100
                      </Typography>
                    </Grid>

                    <Grid size={{ xs: 6 }}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                      >
                        Distance
                      </Typography>

                      <Typography sx={{ fontWeight: 700 }}>
                        {candidate.distanceKm.toFixed(2)} km
                      </Typography>
                    </Grid>

                    <Grid size={{ xs: 6 }}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                      >
                        Confidence
                      </Typography>

                      <Typography sx={{ fontWeight: 700 }}>
                        {overallConfidence}%
                      </Typography>
                    </Grid>
                  </Grid>

                  <Divider sx={{ my: 2 }} />

                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 1,
                      mb: 1.5,
                    }}
                  >
                    <Typography
                      variant="subtitle1"
                      sx={{ fontWeight: 700 }}
                    >
                      AI Explanation
                    </Typography>

                    <Chip
                      size="small"
                      label={getPriorityLabel(
                        candidate.priorityScore,
                      )}
                      color={getScoreColor(
                        candidate.priorityScore,
                      )}
                    />
                  </Box>

                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: 700,
                      mb: 1,
                    }}
                  >
                    {explanation.title}
                  </Typography>

                  {explanation.reasons.map((reason) => (
                    <Typography
                      key={reason}
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 0.75 }}
                    >
                      • {reason}
                    </Typography>
                  ))}

                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: 1,
                      mt: 2,
                    }}
                  >
                    <Chip
                      color={getConfidenceColor(
                        overallConfidence,
                      )}
                      label={`${overallConfidence}% confidence`}
                    />

                    <Typography
                      variant="caption"
                      color="text.secondary"
                    >
                      Explainable backend decision support
                    </Typography>
                  </Box>

                  <Accordion
                    disableGutters
                    elevation={0}
                    sx={{
                      mt: 2,
                      border: "1px solid",
                      borderColor: "divider",
                      borderRadius: 2,
                      overflow: "hidden",
                      "&:before": {
                        display: "none",
                      },
                    }}
                  >
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon />}
                    >
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 700 }}
                      >
                        View technical details
                      </Typography>
                    </AccordionSummary>

                    <AccordionDetails>
                      <Typography
                        variant="subtitle2"
                        sx={{ fontWeight: 700 }}
                      >
                        Environmental estimates
                      </Typography>

                      <Typography variant="body2" sx={{ mt: 1 }}>
                        <strong>PM2.5:</strong>{" "}
                        {candidate.estimatedPm25.toFixed(2)} µg/m³
                      </Typography>

                      <Typography variant="body2" sx={{ mt: 0.75 }}>
                        <strong>PM10:</strong>{" "}
                        {candidate.estimatedPm10.toFixed(2)} µg/m³
                      </Typography>

                      <Typography variant="body2" sx={{ mt: 0.75 }}>
                        <strong>NO₂:</strong>{" "}
                        {candidate.estimatedNo2.toFixed(2)} µg/m³
                      </Typography>

                      <Typography variant="body2" sx={{ mt: 0.75 }}>
                        <strong>O₃:</strong>{" "}
                        {candidate.estimatedO3.toFixed(2)} µg/m³
                      </Typography>

                      <Typography variant="body2" sx={{ mt: 0.75 }}>
                        <strong>Wind speed:</strong>{" "}
                        {candidate.estimatedWindSpeed.toFixed(2)} km/h
                      </Typography>

                      <Divider sx={{ my: 1.5 }} />

                      <Typography
                        variant="subtitle2"
                        sx={{ fontWeight: 700 }}
                      >
                        Historical variability
                      </Typography>

                      <Typography variant="body2" sx={{ mt: 1 }}>
                        <strong>PM2.5 σ:</strong>{" "}
                        {candidate.estimatedPm25Std.toFixed(2)}
                      </Typography>

                      <Typography variant="body2" sx={{ mt: 0.75 }}>
                        <strong>PM10 σ:</strong>{" "}
                        {candidate.estimatedPm10Std.toFixed(2)}
                      </Typography>

                      <Typography variant="body2" sx={{ mt: 0.75 }}>
                        <strong>NO₂ σ:</strong>{" "}
                        {candidate.estimatedNo2Std.toFixed(2)}
                      </Typography>

                      <Typography variant="body2" sx={{ mt: 0.75 }}>
                        <strong>Combined variability risk:</strong>{" "}
                        {candidate.variabilityRisk}/100
                      </Typography>

                      <Typography variant="body2" sx={{ mt: 0.75 }}>
                        <strong>Low-wind risk:</strong>{" "}
                        {candidate.windRisk}/100
                      </Typography>

                      <Divider sx={{ my: 1.5 }} />

                      <Typography
                        variant="subtitle2"
                        sx={{ fontWeight: 700 }}
                      >
                        Station details
                      </Typography>

                      <Typography variant="body2" sx={{ mt: 1 }}>
                        <strong>Nearest station:</strong>{" "}
                        {candidate.nearestStation}
                      </Typography>

                      <Typography variant="body2" sx={{ mt: 0.75 }}>
                        <strong>Distance:</strong>{" "}
                        {candidate.distanceKm.toFixed(2)} km
                      </Typography>

                      <Typography variant="body2" sx={{ mt: 0.75 }}>
                        <strong>Coordinates:</strong>{" "}
                        {candidate.lat.toFixed(5)},{" "}
                        {candidate.lng.toFixed(5)}
                      </Typography>

                      {candidate.coverageConfidence !== undefined && (
                        <>
                          <Divider sx={{ my: 1.5 }} />

                          <Typography
                            variant="subtitle2"
                            sx={{ fontWeight: 700 }}
                          >
                            Confidence breakdown
                          </Typography>

                          <Typography variant="body2" sx={{ mt: 1 }}>
                            <strong>Coverage certainty:</strong>{" "}
                            {candidate.coverageConfidence}%
                          </Typography>

                          <Typography
                            variant="body2"
                            sx={{ mt: 0.75 }}
                          >
                            <strong>Pollution certainty:</strong>{" "}
                            {candidate.pollutionConfidence ?? 0}%
                          </Typography>

                          <Typography
                            variant="body2"
                            sx={{ mt: 0.75 }}
                          >
                            <strong>Variability certainty:</strong>{" "}
                            {candidate.variabilityConfidence ?? 0}%
                          </Typography>

                          <Typography
                            variant="body2"
                            sx={{ mt: 0.75 }}
                          >
                            <strong>Wind certainty:</strong>{" "}
                            {candidate.windConfidence ?? 0}%
                          </Typography>
                        </>
                      )}
                    </AccordionDetails>
                  </Accordion>

                  <SimulateButton recommendation={candidate} />
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
}