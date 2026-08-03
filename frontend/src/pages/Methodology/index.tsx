import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  Typography,
} from "@mui/material";

interface MethodStep {
  number: string;
  title: string;
  description: string;
  details: string[];
  accent: string;
  background: string;
}

interface FormulaItem {
  label: string;
  weight: string;
  color: string;
  background: string;
}

const methodologySteps: MethodStep[] = [
  {
    number: "01",
    title: "Green Sentinel data preparation",
    description:
      "The official 30-day environmental dataset is validated and transformed before it is used by the recommendation engine.",
    details: [
      "Loads the official Green Sentinel air-quality station files.",
      "Parses timestamps and standardizes station and measurement names.",
      "Converts invalid negative measurements to missing values.",
      "Preserves missing values rather than inventing environmental readings.",
      "Removes duplicate rows and invalid timestamps.",
      "Rounds processed measurements for consistent API output.",
      "Transforms the source records into station-level environmental summaries.",
    ],
    accent: "#0f766e",
    background: "#ecfdf5",
  },
  {
    number: "02",
    title: "DKV transport data preparation",
    description:
      "Monthly DKV stop statistics are transformed into a geographic public-transport activity layer.",
    details: [
      "Loads the official list of DKV stops and monthly stop statistics.",
      "Uses passenger frequency, passengers entering, passengers leaving and vehicle occupancy.",
      "Converts invalid passenger values into valid missing or zero values.",
      "Normalizes each transport indicator to a comparable scale.",
      "Calculates one Traffic Activity Score from 0 to 100.",
      "Combines duplicate platforms into one representative stop location.",
      "Links the activity score with the stop latitude and longitude.",
    ],
    accent: "#6d28d9",
    background: "#f5f3ff",
  },
  {
    number: "03",
    title: "Debrecen candidate grid",
    description:
      "The city boundary is used to create valid candidate locations for future environmental sensors.",
    details: [
      "Generates a geographic grid covering the Debrecen administrative area.",
      "Uses the Debrecen GeoJSON boundary to identify valid city locations.",
      "Excludes points outside the defined city boundary.",
      "Evaluates each remaining point as a possible sensor location.",
      "Keeps recommended locations separated to avoid clustering.",
    ],
    accent: "#2563eb",
    background: "#eff6ff",
  },
  {
    number: "04",
    title: "Spatial estimation with IDW",
    description:
      "Environmental conditions at candidate locations are estimated from nearby stations through inverse-distance weighting.",
    details: [
      "Selects up to five nearby valid air-quality stations.",
      "Gives closer stations more influence than distant stations.",
      "Uses the inverse-distance weighting rule 1 / distance².",
      "Ignores measurements beyond the configured interpolation distance.",
      "Estimates PM2.5, PM10, NO₂, O₃ and wind speed separately.",
      "Estimates historical pollutant variability from 30-day standard deviations.",
    ],
    accent: "#0284c7",
    background: "#f0f9ff",
  },
  {
    number: "05",
    title: "Traffic influence estimation",
    description:
      "Nearby DKV stops influence each candidate according to their activity and distance from the proposed sensor location.",
    details: [
      "Finds DKV stops within the configured transport search radius.",
      "Weights nearby stops using inverse-distance weighting.",
      "Gives greater influence to busy stops located close to the candidate.",
      "Calculates a local Traffic Activity Score from 0 to 100.",
      "Records the nearest DKV stop and its distance.",
      "Calculates transport-data confidence using stop count, effective contributors and distance.",
    ],
    accent: "#7c3aed",
    background: "#faf5ff",
  },
  {
    number: "06",
    title: "Risk and confidence calculation",
    description:
      "Each candidate receives interpretable environmental, coverage and transport indicators before final ranking.",
    details: [
      "Coverage gap reflects distance from the nearest existing air-quality sensor.",
      "Pollution risk combines PM2.5, PM10, NO₂ and O₃.",
      "Variability risk represents historical pollutant fluctuation.",
      "Low-wind risk highlights weaker pollutant dispersion.",
      "Traffic risk represents nearby DKV public-transport activity.",
      "Overall confidence combines Green Sentinel and DKV data support.",
    ],
    accent: "#c2410c",
    background: "#fff7ed",
  },
  {
    number: "07",
    title: "Dynamic simulation",
    description:
      "A selected recommendation can be added as a virtual sensor and the network is recalculated.",
    details: [
      "The selected recommendation becomes a simulated air-quality station.",
      "The frontend sends simulated sensor locations to the FastAPI backend.",
      "Official and simulated stations are combined into one effective network.",
      "Coverage, interpolation, risk and confidence values are recalculated.",
      "The remaining recommendations are ranked again.",
      "The interface displays the updated Top 3 recommendation locations.",
    ],
    accent: "#16a34a",
    background: "#f0fdf4",
  },
];

const priorityFormula: FormulaItem[] = [
  {
    label: "Coverage gap",
    weight: "35%",
    color: "#0f766e",
    background: "#ecfdf5",
  },
  {
    label: "Pollution risk",
    weight: "25%",
    color: "#c2410c",
    background: "#fff7ed",
  },
  {
    label: "DKV transport activity",
    weight: "15%",
    color: "#6d28d9",
    background: "#f5f3ff",
  },
  {
    label: "Historical variability",
    weight: "15%",
    color: "#2563eb",
    background: "#eff6ff",
  },
  {
    label: "Low-wind risk",
    weight: "10%",
    color: "#15803d",
    background: "#f0fdf4",
  },
];

const confidenceFormula: FormulaItem[] = [
  {
    label: "Coverage certainty",
    weight: "30%",
    color: "#0f766e",
    background: "#ecfdf5",
  },
  {
    label: "Pollution certainty",
    weight: "25%",
    color: "#c2410c",
    background: "#fff7ed",
  },
  {
    label: "DKV traffic certainty",
    weight: "20%",
    color: "#6d28d9",
    background: "#f5f3ff",
  },
  {
    label: "Variability certainty",
    weight: "15%",
    color: "#2563eb",
    background: "#eff6ff",
  },
  {
    label: "Wind certainty",
    weight: "10%",
    color: "#15803d",
    background: "#f0fdf4",
  },
];

const simulationSteps = [
  "Select recommendation",
  "Create virtual sensor",
  "Send updated network",
  "Recalculate indicators",
  "Generate new Top 3",
  "Show network impact",
];

function FormulaCard({
  title,
  subtitle,
  items,
}: {
  title: string;
  subtitle: string;
  items: FormulaItem[];
}) {
  return (
    <Card
      variant="outlined"
      sx={{
        height: "100%",
        borderRadius: 3,
        borderColor: "rgba(15, 118, 110, 0.12)",
        background:
          "linear-gradient(135deg, #ffffff 0%, #f8fbfa 100%)",
      }}
    >
      <CardContent
        sx={{
          p: 3,
          "&:last-child": {
            pb: 3,
          },
        }}
      >
        <Typography
          variant="h5"
          sx={{
            fontWeight: 800,
            color: "#213a34",
            letterSpacing: "-0.02em",
          }}
        >
          {title}
        </Typography>

        <Typography
          color="text.secondary"
          sx={{
            mt: 0.75,
            lineHeight: 1.6,
          }}
        >
          {subtitle}
        </Typography>

        <Box
          sx={{
            mt: 2.5,
            display: "flex",
            flexDirection: "column",
            gap: 1,
          }}
        >
          {items.map((item) => (
            <Box
              key={item.label}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 2,
                px: 1.75,
                py: 1.25,
                borderRadius: 2.5,
                backgroundColor: item.background,
                border: `1px solid ${item.color}22`,
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 700,
                  color: "#344054",
                }}
              >
                {item.label}
              </Typography>

              <Chip
                label={item.weight}
                size="small"
                sx={{
                  minWidth: 58,
                  color: item.color,
                  backgroundColor: "#ffffff",
                  border: `1px solid ${item.color}44`,
                  fontWeight: 800,
                }}
              />
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
}

export default function Methodology() {
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
            Methodology
          </Typography>

          <Typography
            color="text.secondary"
            sx={{
              mt: 0.75,
              maxWidth: 900,
              lineHeight: 1.6,
            }}
          >
            GreenMind AI combines official Green Sentinel measurements,
            DKV public-transport activity and spatial coverage analysis to
            rank possible environmental sensor locations in Debrecen.
          </Typography>
        </Box>

        <Box
          sx={{
            display: "flex",
            gap: 1,
            flexWrap: "wrap",
          }}
        >
          <Chip
            label="Explainable scoring"
            size="small"
            sx={{
              color: "#0f766e",
              backgroundColor: "#e4f5f0",
              border: "1px solid #cdece4",
              fontWeight: 700,
            }}
          />

          <Chip
            label="Traffic-aware"
            size="small"
            sx={{
              color: "#6d28d9",
              backgroundColor: "#f3e8ff",
              border: "1px solid #e9d5ff",
              fontWeight: 700,
            }}
          />
        </Box>
      </Box>

      <Alert
        severity="info"
        sx={{
          mb: 3,
          borderRadius: 2.5,
          border: "1px solid #bae6fd",
          backgroundColor: "#f0f9ff",
        }}
      >
        Recommendation coordinates are not hardcoded. Every result is
        calculated from the current monitoring network, environmental
        measurements, DKV activity and simulated sensors.
      </Alert>

      <Grid container spacing={2.5}>
        {methodologySteps.map((step) => (
          <Grid
            key={step.number}
            size={{ xs: 12, md: 6 }}
          >
            <Card
              variant="outlined"
              sx={{
                height: "100%",
                borderRadius: 3,
                borderColor: "rgba(15, 118, 110, 0.12)",
                backgroundColor: "#ffffff",
                transition:
                  "transform 160ms ease, box-shadow 160ms ease",
                "&:hover": {
                  transform: "translateY(-3px)",
                  boxShadow:
                    "0 12px 28px rgba(31, 60, 52, 0.09)",
                },
              }}
            >
              <CardContent
                sx={{
                  p: 2.75,
                  "&:last-child": {
                    pb: 2.75,
                  },
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 1.5,
                  }}
                >
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: 2.5,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      color: step.accent,
                      backgroundColor: step.background,
                      border: `1px solid ${step.accent}33`,
                      fontWeight: 800,
                    }}
                  >
                    {step.number}
                  </Box>

                  <Box>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 800,
                        color: "#1f2f2b",
                      }}
                    >
                      {step.title}
                    </Typography>

                    <Typography
                      color="text.secondary"
                      sx={{
                        mt: 0.75,
                        lineHeight: 1.55,
                      }}
                    >
                      {step.description}
                    </Typography>
                  </Box>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 1,
                  }}
                >
                  {step.details.map((detail) => (
                    <Box
                      key={detail}
                      sx={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 1,
                      }}
                    >
                      <Box
                        sx={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          mt: "7px",
                          flexShrink: 0,
                          backgroundColor: step.accent,
                        }}
                      />

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ lineHeight: 1.55 }}
                      >
                        {detail}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2.5} sx={{ mt: 0 }}>
        <Grid size={{ xs: 12, lg: 6 }}>
          <FormulaCard
            title="Traffic-Aware Priority Score"
            subtitle="The final score measures how valuable a new monitoring sensor could be at each candidate location."
            items={priorityFormula}
          />
        </Grid>

        <Grid size={{ xs: 12, lg: 6 }}>
          <FormulaCard
            title="Overall Confidence"
            subtitle="Confidence is separate from priority and measures how strongly the available data supports the recommendation."
            items={confidenceFormula}
          />
        </Grid>
      </Grid>

      <Grid container spacing={2.5} sx={{ mt: 0 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card
            variant="outlined"
            sx={{
              height: "100%",
              borderRadius: 3,
              borderColor: "rgba(15, 118, 110, 0.12)",
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 800,
                  color: "#213a34",
                }}
              >
                Pollution Risk
              </Typography>

              <Typography
                color="text.secondary"
                sx={{ mt: 0.75 }}
              >
                Multiple pollutants are combined so the model does not
                depend on PM2.5 alone.
              </Typography>

              <Box
                sx={{
                  mt: 2.5,
                  p: 2.25,
                  borderRadius: 2.5,
                  backgroundColor: "#fff7ed",
                  border: "1px solid #fed7aa",
                }}
              >
                <Typography
                  component="div"
                  sx={{
                    fontFamily: "monospace",
                    fontWeight: 700,
                    color: "#9a3412",
                    lineHeight: 1.8,
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
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card
            variant="outlined"
            sx={{
              height: "100%",
              borderRadius: 3,
              borderColor: "rgba(15, 118, 110, 0.12)",
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 800,
                  color: "#213a34",
                }}
              >
                Historical Variability
              </Typography>

              <Typography
                color="text.secondary"
                sx={{ mt: 0.75 }}
              >
                Higher variability indicates locations where pollutant
                levels may fluctuate and require additional observation.
              </Typography>

              <Box
                sx={{
                  mt: 2.5,
                  p: 2.25,
                  borderRadius: 2.5,
                  backgroundColor: "#eff6ff",
                  border: "1px solid #bfdbfe",
                }}
              >
                <Typography
                  component="div"
                  sx={{
                    fontFamily: "monospace",
                    fontWeight: 700,
                    color: "#1d4ed8",
                    lineHeight: 1.8,
                  }}
                >
                  Variability Risk =
                  <br />
                  50% × PM2.5 Standard Deviation
                  <br />
                  + 30% × PM10 Standard Deviation
                  <br />
                  + 20% × NO₂ Standard Deviation
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card
        variant="outlined"
        sx={{
          mt: 2.5,
          borderRadius: 3,
          borderColor: "rgba(15, 118, 110, 0.12)",
          background:
            "linear-gradient(135deg, #ffffff 0%, #f4faf8 100%)",
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 800,
              color: "#213a34",
            }}
          >
            Simulation Data Flow
          </Typography>

          <Typography
            color="text.secondary"
            sx={{
              mt: 0.75,
              lineHeight: 1.6,
            }}
          >
            Every virtual sensor modifies the effective monitoring
            network and triggers a complete backend recalculation.
          </Typography>

          <Box
            sx={{
              mt: 2.5,
              display: "flex",
              flexDirection: {
                xs: "column",
                lg: "row",
              },
              alignItems: "stretch",
              gap: 1,
            }}
          >
            {simulationSteps.map((label, index) => (
              <Box
                key={label}
                sx={{
                  display: "flex",
                  flexDirection: {
                    xs: "column",
                    lg: "row",
                  },
                  alignItems: "center",
                  gap: 1,
                  flex: 1,
                }}
              >
                <Box
                  sx={{
                    width: "100%",
                    minHeight: 72,
                    px: 1.5,
                    py: 1.25,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 2.5,
                    textAlign: "center",
                    color: index === 0 ? "#0f766e" : "#344054",
                    backgroundColor:
                      index === 0 ? "#ecfdf5" : "#ffffff",
                    border:
                      index === 0
                        ? "1px solid #a7f3d0"
                        : "1px solid rgba(15, 118, 110, 0.14)",
                    fontWeight: 700,
                  }}
                >
                  {label}
                </Box>

                {index < simulationSteps.length - 1 && (
                  <Typography
                    sx={{
                      display: {
                        xs: "none",
                        lg: "block",
                      },
                      color: "#98a2b3",
                      fontWeight: 800,
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
          mt: 2.5,
          borderRadius: 3,
          borderColor: "rgba(15, 118, 110, 0.12)",
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 800,
              color: "#213a34",
            }}
          >
            Scope and Limitations
          </Typography>

          <Box
            sx={{
              mt: 2,
              display: "flex",
              flexDirection: "column",
              gap: 1.25,
            }}
          >
            {[
              "The current environmental model uses the official Green Sentinel competition dataset.",
              "DKV statistics represent public-transport activity, not total road traffic volume.",
              "IDW estimates spatial conditions but does not replace direct physical measurement.",
              "The system provides decision support and does not make automatic infrastructure decisions.",
              "Final installation should also consider land ownership, electricity, connectivity, accessibility and regulatory restrictions.",
            ].map((limitation) => (
              <Box
                key={limitation}
                sx={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 1,
                }}
              >
                <Box
                  sx={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    mt: "7px",
                    flexShrink: 0,
                    backgroundColor: "#f59e0b",
                  }}
                />

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ lineHeight: 1.6 }}
                >
                  {limitation}
                </Typography>
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}