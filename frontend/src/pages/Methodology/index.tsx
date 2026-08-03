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
    title: "Multi-environmental data preparation",
    description:
      "The official 30-day Green Sentinel air, noise and groundwater files are standardized before analysis.",
    details: [
      "Loads all available air, noise and subsurface-water source files.",
      "Standardizes every dataset to timestamp, location, measurement type, value and unit.",
      "Parses timestamps and converts measurement values to numeric form.",
      "Converts invalid values to missing instead of inventing measurements.",
      "Removes duplicate rows and invalid timestamps.",
      "Rounds processed measurements for consistent API output.",
      "Creates station-level summaries for air, noise and groundwater.",
    ],
    accent: "#0f766e",
    background: "#ecfdf5",
  },
  {
    number: "02",
    title: "DKV transport data preparation",
    description:
      "Monthly DKV stop statistics are transformed into a geographic transport-activity layer.",
    details: [
      "Loads the official DKV stop list and monthly service statistics.",
      "Uses passenger frequency, passengers entering and passengers leaving.",
      "Normalizes transport indicators to a comparable 0–100 scale.",
      "Calculates one Traffic Activity Score for every stop.",
      "Combines duplicate platforms into one representative stop location.",
      "Links each score to the corresponding latitude and longitude.",
    ],
    accent: "#6d28d9",
    background: "#f5f3ff",
  },
  {
    number: "03",
    title: "Candidate location grid",
    description:
      "A geographic grid is generated across Debrecen and each point is evaluated as a possible monitoring location.",
    details: [
      "Generates candidate coordinates across the configured Debrecen area.",
      "Calculates distance from existing air, noise and groundwater monitoring locations.",
      "Measures a separate coverage gap for every environmental domain.",
      "Keeps final recommendations at least two kilometres apart.",
      "Prevents the Top 5 from clustering in one part of the city.",
    ],
    accent: "#2563eb",
    background: "#eff6ff",
  },
  {
    number: "04",
    title: "Spatial estimation with IDW",
    description:
      "Conditions at candidate locations are estimated from nearby measurements through inverse-distance weighting.",
    details: [
      "Selects nearby valid monitoring stations for each environmental domain.",
      "Gives closer stations greater influence than distant stations.",
      "Uses the inverse-distance weighting rule 1 / distance².",
      "Ignores observations beyond the configured interpolation distance.",
      "Estimates PM2.5, PM10, NO₂, O₃, wind speed and pollutant variability.",
      "Estimates daytime noise, nighttime noise, conductivity, water level and water temperature.",
    ],
    accent: "#0284c7",
    background: "#f0f9ff",
  },
  {
    number: "05",
    title: "Domain suitability calculation",
    description:
      "Air, noise and groundwater are scored independently so different environmental needs remain visible.",
    details: [
      "Air suitability combines air coverage, pollution, historical variability and low-wind risk.",
      "Noise suitability combines noise coverage, measured noise risk and nearby DKV activity.",
      "Groundwater suitability combines groundwater coverage and monitoring priority.",
      "Noise receives direct transport influence because public transport is closely related to urban noise exposure.",
      "The highest domain score becomes the primary monitoring need.",
    ],
    accent: "#c2410c",
    background: "#fff7ed",
  },
  {
    number: "06",
    title: "Full-station priority and confidence",
    description:
      "The three suitability scores are combined into one explainable priority for a complete Green Sentinel station.",
    details: [
      "Overall priority combines air suitability, noise suitability and groundwater suitability.",
      "Noise receives substantial weight because only five locations contain noise measurements.",
      "Air confidence reflects pollution, variability and wind-data support.",
      "Noise and groundwater confidence reflect nearby station count, effective contributors and distance.",
      "DKV confidence reflects nearby stop availability and proximity.",
      "Priority and confidence remain separate so a high-value location can still show limited data support.",
    ],
    accent: "#ea580c",
    background: "#fff7ed",
  },
  {
    number: "07",
    title: "Dynamic network simulation",
    description:
      "A recommendation can be added as a virtual full Green Sentinel station and the network is recalculated.",
    details: [
      "The selected recommendation becomes a simulated multi-environmental station.",
      "The frontend sends simulated station coordinates to the FastAPI backend.",
      "Official and simulated stations form one effective monitoring network.",
      "Coverage, suitability, priority and confidence are recalculated.",
      "Remaining locations are ranked again.",
      "The interface displays the updated Top 3 recommendations and network impact.",
    ],
    accent: "#16a34a",
    background: "#f0fdf4",
  },
];

const priorityFormula: FormulaItem[] = [
  {
    label: "Air suitability",
    weight: "40%",
    color: "#0f766e",
    background: "#ecfdf5",
  },
  {
    label: "Noise suitability",
    weight: "40%",
    color: "#7c3aed",
    background: "#f5f3ff",
  },
  {
    label: "Groundwater suitability",
    weight: "20%",
    color: "#2563eb",
    background: "#eff6ff",
  },
];

const confidenceFormula: FormulaItem[] = [
  {
    label: "Air-data confidence",
    weight: "40%",
    color: "#0f766e",
    background: "#ecfdf5",
  },
  {
    label: "Noise-data confidence",
    weight: "25%",
    color: "#7c3aed",
    background: "#f5f3ff",
  },
  {
    label: "Groundwater-data confidence",
    weight: "20%",
    color: "#2563eb",
    background: "#eff6ff",
  },
  {
    label: "DKV traffic confidence",
    weight: "15%",
    color: "#6d28d9",
    background: "#faf5ff",
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
            GreenMind AI combines official Green Sentinel air, noise and groundwater measurements with DKV public-transport activity and spatial coverage analysis to rank locations for complete environmental monitoring stations in Debrecen.
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
            label="Air · Noise · Water"
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
        Recommendation coordinates are not hardcoded. Every result is calculated from air, noise and groundwater coverage, interpolated measurements, DKV activity and simulated stations.
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
            title="Full-Station Priority Score"
            subtitle="The final priority combines separate air, noise and groundwater suitability scores for a complete Green Sentinel station."
            items={priorityFormula}
          />
        </Grid>

        <Grid size={{ xs: 12, lg: 6 }}>
          <FormulaCard
            title="Overall Confidence"
            subtitle="Confidence is separate from priority and measures how strongly air, noise, groundwater and DKV data support the recommendation."
            items={confidenceFormula}
          />
        </Grid>
      </Grid>

      <Grid container spacing={2.5} sx={{ mt: 0 }}>
        <Grid size={{ xs: 12, lg: 4 }}>
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
                Air Suitability
              </Typography>

              <Typography
                color="text.secondary"
                sx={{ mt: 0.75 }}
              >
                Air monitoring priority combines the spatial gap with
                estimated pollution, variability and low-wind accumulation.
              </Typography>

              <Box
                sx={{
                  mt: 2.5,
                  p: 2.25,
                  borderRadius: 2.5,
                  backgroundColor: "#ecfdf5",
                  border: "1px solid #a7f3d0",
                }}
              >
                <Typography
                  component="div"
                  sx={{
                    fontFamily: "monospace",
                    fontWeight: 700,
                    color: "#0f766e",
                    lineHeight: 1.8,
                  }}
                >
                  Air Suitability =
                  <br />
                  45% × Air Coverage Gap
                  <br />
                  + 30% × Pollution Risk
                  <br />
                  + 15% × Variability Risk
                  <br />
                  + 10% × Low-Wind Risk
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
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
                Noise Suitability
              </Typography>

              <Typography
                color="text.secondary"
                sx={{ mt: 0.75 }}
              >
                Noise monitoring priority emphasizes uncovered areas and
                incorporates measured noise and nearby DKV activity.
              </Typography>

              <Box
                sx={{
                  mt: 2.5,
                  p: 2.25,
                  borderRadius: 2.5,
                  backgroundColor: "#f5f3ff",
                  border: "1px solid #ddd6fe",
                }}
              >
                <Typography
                  component="div"
                  sx={{
                    fontFamily: "monospace",
                    fontWeight: 700,
                    color: "#7c3aed",
                    lineHeight: 1.8,
                  }}
                >
                  Noise Suitability =
                  <br />
                  50% × Noise Coverage Gap
                  <br />
                  + 30% × Noise Risk
                  <br />
                  + 20% × DKV Activity
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
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
                Groundwater Suitability
              </Typography>

              <Typography
                color="text.secondary"
                sx={{ mt: 0.75 }}
              >
                Groundwater monitoring priority combines network coverage
                with conductivity, level and temperature-based monitoring need.
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
                    color: "#2563eb",
                    lineHeight: 1.8,
                  }}
                >
                  Water Suitability =
                  <br />
                  65% × Water Coverage Gap
                  <br />
                  + 35% × Monitoring Priority
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
            Every virtual full station modifies the effective air, noise and groundwater monitoring network and triggers a complete backend recalculation.
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
              "The model uses the official Green Sentinel competition dataset and processed DKV transport data.",
              "DKV statistics represent public-transport activity, not total road traffic volume.",
              "IDW estimates spatial conditions between monitoring locations but does not replace direct physical measurement.",
              "Noise and groundwater suitability indicate monitoring need, not confirmed pollution or regulatory exceedance.",
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