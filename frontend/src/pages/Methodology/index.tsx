import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  Stack,
  Typography,
} from "@mui/material";

interface MethodStep {
  title: string;
  description: string;
  details: string[];
}

const methodologySteps: MethodStep[] = [
  {
    title: "1. Data preparation and cleaning",
    description:
      "The system processes the official 30-day Green Sentinel air-quality dataset before generating recommendations.",
    details: [
      "Loads all official *_Levego.xlsx files from 16 air-quality stations.",
      "Parses timestamps and standardizes station codes and measurement names.",
      "Converts invalid negative measurements to missing values.",
      "Preserves missing values instead of inventing measurements.",
      "Rounds processed values for consistent API output.",
      "Transforms the long measurement table into a wide station-time dataset.",
      "Caches the processed dataset in memory for faster API responses.",
    ],
  },
  {
    title: "2. Spatial estimation with IDW",
    description:
      "Environmental conditions at candidate locations are estimated from nearby monitoring stations using inverse-distance weighting.",
    details: [
      "The city is divided into candidate grid points.",
      "For each point, the five nearest valid air-quality stations are selected.",
      "Closer stations receive more influence than distant stations.",
      "The weighting follows 1 / distance².",
      "Stations beyond the configured interpolation distance are ignored.",
      "PM2.5, PM10, NO₂, O₃, wind speed and historical variability are estimated separately.",
    ],
  },
  {
    title: "3. Environmental risk calculation",
    description:
      "Each candidate receives interpretable risk components before the final priority score is calculated.",
    details: [
      "Coverage risk measures distance from the nearest existing sensor.",
      "Pollution risk combines PM2.5, PM10, NO₂ and O₃.",
      "Variability risk uses 30-day standard deviations for PM2.5, PM10 and NO₂.",
      "Low-wind risk identifies locations where pollutant dispersion may be weaker.",
      "All components are normalized to a 0–100 scale.",
    ],
  },
  {
    title: "4. Recommendation confidence",
    description:
      "Confidence estimates how strongly the available monitoring network supports each recommendation.",
    details: [
      "Coverage certainty reflects the size of the monitoring gap.",
      "Pollution certainty depends on nearby-station availability and interpolation distance.",
      "Variability certainty reflects support for historical fluctuation estimates.",
      "Wind certainty measures support for the wind-speed estimate.",
      "The overall confidence is a weighted combination of these components.",
    ],
  },
  {
    title: "5. Dynamic simulation workflow",
    description:
      "Simulated sensors are added to the network and the backend recalculates the recommendation model.",
    details: [
      "The selected recommendation becomes a virtual air-quality sensor.",
      "The frontend sends all simulated sensors to the FastAPI backend.",
      "The backend combines official and simulated stations.",
      "Coverage, interpolation, risks, confidence and ranking are recalculated.",
      "The Top 5 recommendations update automatically.",
      "The interface shows before-and-after coverage, blind spots and average station distance.",
    ],
  },
];

const simulationSteps = [
  "Select recommendation",
  "Create virtual sensor",
  "Send to backend",
  "Recalculate network",
  "Generate new Top 5",
  "Show impact",
];

export default function Methodology() {
  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 700 }}>
        Methodology
      </Typography>

      <Typography color="text.secondary" sx={{ mt: 1, mb: 3 }}>
        GreenMind AI uses a transparent spatial decision-support method to
        recommend new environmental sensor locations from the official Green
        Sentinel dataset.
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        The system does not use hardcoded recommendation locations. Every
        result is generated from the current monitoring network, historical
        measurements and simulated sensors.
      </Alert>

      <Grid container spacing={3}>
        {methodologySteps.map((step) => (
          <Grid key={step.title} size={{ xs: 12, md: 6 }}>
            <Card
              variant="outlined"
              sx={{
                height: "100%",
                borderRadius: 3,
              }}
            >
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {step.title}
                </Typography>

                <Typography color="text.secondary" sx={{ mt: 1.25, mb: 2 }}>
                  {step.description}
                </Typography>

                <Stack spacing={1}>
                  {step.details.map((detail) => (
                    <Typography key={detail} variant="body2">
                      • {detail}
                    </Typography>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card
        variant="outlined"
        sx={{
          mt: 3,
          borderRadius: 3,
        }}
      >
        <CardContent>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Priority Score Formula
          </Typography>

          <Typography color="text.secondary" sx={{ mt: 1 }}>
            Every candidate location receives a final score from 0 to 100.
          </Typography>

          <Box
            sx={{
              mt: 3,
              p: 2.5,
              borderRadius: 2,
              bgcolor: "action.hover",
              overflowX: "auto",
            }}
          >
            <Typography
              component="div"
              sx={{
                fontFamily: "monospace",
                fontWeight: 700,
              }}
            >
              Priority Score =
              <br />
              45% × Coverage Gap
              <br />
              + 30% × Pollution Risk
              <br />
              + 15% × Historical Variability
              <br />
              + 10% × Low-Wind Risk
            </Typography>
          </Box>

          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Chip
                label="45% Coverage"
                color="primary"
                variant="outlined"
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Chip
                label="30% Pollution"
                color="warning"
                variant="outlined"
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Chip
                label="15% Variability"
                color="secondary"
                variant="outlined"
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Chip
                label="10% Wind"
                color="success"
                variant="outlined"
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card
        variant="outlined"
        sx={{
          mt: 3,
          borderRadius: 3,
        }}
      >
        <CardContent>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Pollution Risk Formula
          </Typography>

          <Box
            sx={{
              mt: 2,
              p: 2.5,
              borderRadius: 2,
              bgcolor: "action.hover",
              overflowX: "auto",
            }}
          >
            <Typography
              component="div"
              sx={{
                fontFamily: "monospace",
                fontWeight: 700,
              }}
            >
              Pollution Risk =
              <br />
              35% × PM2.5 Risk
              <br />
              + 25% × PM10 Risk
              <br />
              + 25% × NO₂ Risk
              <br />
              + 15% × O₃ Risk
            </Typography>
          </Box>
        </CardContent>
      </Card>

      <Card
        variant="outlined"
        sx={{
          mt: 3,
          borderRadius: 3,
        }}
      >
        <CardContent>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Historical Variability Formula
          </Typography>

          <Box
            sx={{
              mt: 2,
              p: 2.5,
              borderRadius: 2,
              bgcolor: "action.hover",
              overflowX: "auto",
            }}
          >
            <Typography
              component="div"
              sx={{
                fontFamily: "monospace",
                fontWeight: 700,
              }}
            >
              Variability Risk =
              <br />
              50% × PM2.5 Standard-Deviation Risk
              <br />
              + 30% × PM10 Standard-Deviation Risk
              <br />
              + 20% × NO₂ Standard-Deviation Risk
            </Typography>
          </Box>
        </CardContent>
      </Card>

      <Card
        variant="outlined"
        sx={{
          mt: 3,
          borderRadius: 3,
        }}
      >
        <CardContent>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Confidence Formula
          </Typography>

          <Typography color="text.secondary" sx={{ mt: 1 }}>
            Confidence is separate from priority. Priority measures how useful
            a location may be, while confidence measures how strongly the
            available data supports that recommendation.
          </Typography>

          <Box
            sx={{
              mt: 2.5,
              p: 2.5,
              borderRadius: 2,
              bgcolor: "action.hover",
              overflowX: "auto",
            }}
          >
            <Typography
              component="div"
              sx={{
                fontFamily: "monospace",
                fontWeight: 700,
              }}
            >
              Overall Confidence =
              <br />
              40% × Coverage Certainty
              <br />
              + 30% × Pollution Certainty
              <br />
              + 20% × Variability Certainty
              <br />
              + 10% × Wind Certainty
            </Typography>
          </Box>

          <Divider sx={{ my: 3 }} />

          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Interpolation confidence
          </Typography>

          <Typography color="text.secondary" sx={{ mt: 1 }}>
            Measurement confidence considers the number of valid nearby
            stations, the effective number of contributing stations and the
            distance to the nearest valid station.
          </Typography>

          <Box
            sx={{
              mt: 2,
              p: 2,
              borderRadius: 2,
              bgcolor: "action.hover",
            }}
          >
            <Typography variant="body2">
              <strong>Station count:</strong> More valid nearby stations
              increase certainty.
            </Typography>

            <Typography variant="body2" sx={{ mt: 1 }}>
              <strong>Effective station count:</strong> Confidence is higher
              when several stations contribute meaningfully instead of one
              station dominating the estimate.
            </Typography>

            <Typography variant="body2" sx={{ mt: 1 }}>
              <strong>Nearest-station distance:</strong> Shorter interpolation
              distances increase certainty.
            </Typography>
          </Box>
        </CardContent>
      </Card>

      <Card
        variant="outlined"
        sx={{
          mt: 3,
          borderRadius: 3,
        }}
      >
        <CardContent>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Simulation Data Flow
          </Typography>

          <Typography color="text.secondary" sx={{ mt: 1 }}>
            Every simulated sensor changes the effective monitoring network and
            triggers a complete backend recalculation.
          </Typography>

          <Box
            sx={{
              mt: 2.5,
              display: "flex",
              flexDirection: {
                xs: "column",
                md: "row",
              },
              alignItems: {
                xs: "stretch",
                md: "center",
              },
              gap: 1.5,
            }}
          >
            {simulationSteps.map((label, index) => (
              <Box
                key={label}
                sx={{
                  display: "flex",
                  flexDirection: {
                    xs: "column",
                    md: "row",
                  },
                  alignItems: "center",
                  gap: 1.5,
                  flex: 1,
                }}
              >
                <Box
                  sx={{
                    width: "100%",
                    flex: 1,
                    p: 1.5,
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 2,
                    textAlign: "center",
                    fontWeight: 700,
                    bgcolor: "background.paper",
                  }}
                >
                  {label}
                </Box>

                {index < simulationSteps.length - 1 && (
                  <Typography
                    sx={{
                      display: {
                        xs: "none",
                        md: "block",
                      },
                      fontWeight: 700,
                    }}
                  >
                    →
                  </Typography>
                )}
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>

      <Card
        variant="outlined"
        sx={{
          mt: 3,
          borderRadius: 3,
        }}
      >
        <CardContent>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Current Scope and Limitations
          </Typography>

          <Stack spacing={1.25} sx={{ mt: 2 }}>
            <Typography variant="body2">
              • The current system uses the official air-quality files from the
              competition dataset.
            </Typography>

            <Typography variant="body2">
              • Noise and groundwater datasets are not currently included in
              the recommendation score.
            </Typography>

            <Typography variant="body2">
              • IDW estimates spatial conditions but does not replace direct
              physical measurement.
            </Typography>

            <Typography variant="body2">
              • The output is decision support for planners, not an automatic
              infrastructure decision.
            </Typography>

            <Typography variant="body2">
              • Final placement should also consider land ownership, power,
              connectivity, accessibility and regulatory constraints.
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}