import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  Grid,
  LinearProgress,
  Typography,
} from "@mui/material";

interface DataQualitySummary {
  totalRecords: number;
  finalRecords: number;
  stationCount: number;
  measurementTypeCount: number;
  duplicateRowsRemoved: number;
  missingTimestamps: number;
  missingValuesBeforeCleaning: number;
  invalidValuesConvertedToMissing: number;
  missingValuesAfterCleaning: number;
}

interface DataQualityResponse {
  source: string;
  summary: DataQualitySummary;
}

const API_URL = "http://localhost:8000/api/data-quality/";

export default function DataQuality() {
  const [data, setData] =
    useState<DataQualityResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDataQuality() {
      try {
        const response = await fetch(API_URL);

        if (!response.ok) {
          throw new Error(
            `Request failed: ${response.status}`,
          );
        }

        const result: DataQualityResponse =
          await response.json();

        setData(result);
      } catch {
        setError(
          "Could not load the official data-quality report.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadDataQuality();
  }, []);

  if (loading) {
    return (
      <Box>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 800,
            color: "#173c35",
            letterSpacing: "-0.03em",
          }}
        >
          Data Quality
        </Typography>

        <Typography
          color="text.secondary"
          sx={{
            mt: 1,
            mb: 2,
          }}
        >
          Processing the official 30-day Green Sentinel dataset...
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
    );
  }

  if (error || !data) {
    return (
      <Box>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 800,
            color: "#173c35",
            mb: 3,
          }}
        >
          Data Quality
        </Typography>

        <Alert severity="error">
          {error || "Data-quality report is unavailable."}
        </Alert>
      </Box>
    );
  }

  const { summary } = data;

  const summaryCards = [
    {
      title: "Raw measurements",
      value: summary.totalRecords.toLocaleString(),
      subtitle: "Rows loaded from official source files",
      accent: "#2563eb",
      background: "#eff6ff",
    },
    {
      title: "Final measurements",
      value: summary.finalRecords.toLocaleString(),
      subtitle: "Rows retained after validation",
      accent: "#0f766e",
      background: "#ecfdf5",
    },
    {
      title: "Air-quality stations",
      value: summary.stationCount,
      subtitle: "Official Green Sentinel stations",
      accent: "#16a34a",
      background: "#f0fdf4",
    },
    {
      title: "Measurement types",
      value: summary.measurementTypeCount,
      subtitle: "Environmental variables detected",
      accent: "#7c3aed",
      background: "#f5f3ff",
    },
    {
      title: "Invalid values",
      value: summary.invalidValuesConvertedToMissing,
      subtitle: "Out-of-range values converted to missing",
      accent: "#ea580c",
      background: "#fff7ed",
    },
    {
      title: "Missing after cleaning",
      value: summary.missingValuesAfterCleaning,
      subtitle: "Values remaining unavailable",
      accent: "#dc2626",
      background: "#fef2f2",
    },
  ];

  const cleaningItems = [
    {
      label: "Duplicate rows removed",
      value: summary.duplicateRowsRemoved,
    },
    {
      label: "Missing timestamps",
      value: summary.missingTimestamps,
    },
    {
      label: "Missing before cleaning",
      value: summary.missingValuesBeforeCleaning,
    },
    {
      label: "Invalid values detected",
      value: summary.invalidValuesConvertedToMissing,
    },
  ];

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
            Data Quality
          </Typography>

          <Typography
            color="text.secondary"
            sx={{
              mt: 0.75,
              lineHeight: 1.6,
            }}
          >
            Validation and cleaning results for the official
            30-day Green Sentinel dataset.
          </Typography>
        </Box>

        <Chip
          label={data.source}
          size="small"
          sx={{
            color: "#0f766e",
            backgroundColor: "#e4f5f0",
            border: "1px solid #cdece4",
            fontWeight: 700,
          }}
        />
      </Box>

      <Grid container spacing={2.5}>
        {summaryCards.map((card) => (
          <Grid
            key={card.title}
            size={{ xs: 12, sm: 6, lg: 4 }}
          >
            <Card
              variant="outlined"
              sx={{
                height: "100%",
                borderRadius: 3,
                borderColor: "rgba(15, 118, 110, 0.12)",
                borderTop: `4px solid ${card.accent}`,
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
                  p: 2.5,
                  "&:last-child": {
                    pb: 2.5,
                  },
                }}
              >
                <Box
                  sx={{
                    display: "inline-flex",
                    px: 1.25,
                    py: 0.5,
                    mb: 1.5,
                    borderRadius: 2,
                    backgroundColor: card.background,
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      color: card.accent,
                      fontWeight: 700,
                    }}
                  >
                    {card.title}
                  </Typography>
                </Box>

                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 800,
                    color: "#1f2f2b",
                    letterSpacing: "-0.03em",
                  }}
                >
                  {card.value}
                </Typography>

                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    display: "block",
                    mt: 0.75,
                    lineHeight: 1.5,
                  }}
                >
                  {card.subtitle}
                </Typography>
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
          borderColor: "rgba(15, 118, 110, 0.12)",
          background:
            "linear-gradient(135deg, #ffffff 0%, #f4faf8 100%)",
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
            variant="h6"
            sx={{
              fontWeight: 800,
              color: "#213a34",
            }}
          >
            Cleaning Summary
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 0.5 }}
          >
            Key validation actions applied before the data was
            used by the recommendation engine.
          </Typography>

          <Grid container spacing={2} sx={{ mt: 1 }}>
            {cleaningItems.map((item) => (
              <Grid
                key={item.label}
                size={{ xs: 12, sm: 6, md: 3 }}
              >
                <Box
                  sx={{
                    height: "100%",
                    p: 2,
                    borderRadius: 2.5,
                    backgroundColor: "#ffffff",
                    border:
                      "1px solid rgba(15, 118, 110, 0.1)",
                  }}
                >
                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    {item.label}
                  </Typography>

                  <Typography
                    variant="h5"
                    sx={{
                      mt: 0.75,
                      fontWeight: 800,
                      color: "#173c35",
                    }}
                  >
                    {item.value.toLocaleString()}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
}