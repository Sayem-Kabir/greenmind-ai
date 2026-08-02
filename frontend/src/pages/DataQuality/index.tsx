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

interface MeasurementQuality {
  measurementType: string;
  totalRecords: number;
  validValues: number;
  missingValues: number;
  invalidValues: number;
  completeness: number;
}

interface DataQualityResponse {
  source: string;
  summary: DataQualitySummary;
  measurementQuality: MeasurementQuality[];
}

const API_URL = "http://localhost:8000/api/data-quality/";

function getCompletenessColor(
  completeness: number,
): "success" | "warning" | "error" {
  if (completeness >= 99) {
    return "success";
  }

  if (completeness >= 90) {
    return "warning";
  }

  return "error";
}

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
          sx={{ fontWeight: 700 }}
        >
          Data Quality
        </Typography>

        <Typography
          color="text.secondary"
          sx={{ mt: 2, mb: 2 }}
        >
          Processing the official 30-day dataset...
        </Typography>

        <LinearProgress />
      </Box>
    );
  }

  if (error || !data) {
    return (
      <Box>
        <Typography
          variant="h4"
          sx={{ fontWeight: 700, mb: 3 }}
        >
          Data Quality
        </Typography>

        <Alert severity="error">
          {error || "Data-quality report is unavailable."}
        </Alert>
      </Box>
    );
  }

  const { summary, measurementQuality } = data;

  const summaryCards = [
    {
      title: "Raw measurements",
      value: summary.totalRecords.toLocaleString(),
      subtitle: "Rows loaded from the official Excel files",
    },
    {
      title: "Final measurements",
      value: summary.finalRecords.toLocaleString(),
      subtitle: "Rows retained after validation",
    },
    {
      title: "Air-quality stations",
      value: summary.stationCount,
      subtitle: "Official Green Sentinel stations",
    },
    {
      title: "Measurement types",
      value: summary.measurementTypeCount,
      subtitle: "Environmental variables detected",
    },
    {
      title: "Invalid values",
      value: summary.invalidValuesConvertedToMissing,
      subtitle: "Out-of-range values converted to missing",
    },
    {
      title: "Missing after cleaning",
      value: summary.missingValuesAfterCleaning,
      subtitle: "Values remaining unavailable",
    },
  ];

  return (
    <Box>
      <Typography
        variant="h4"
        sx={{ fontWeight: 700 }}
      >
        Data Quality
      </Typography>

      <Typography
        color="text.secondary"
        sx={{ mt: 1 }}
      >
        Validation and cleaning results for the official
        30-day Green Sentinel dataset.
      </Typography>

      <Chip
        label={data.source}
        color="primary"
        variant="outlined"
        sx={{ mt: 2, mb: 3 }}
      />

      <Grid container spacing={3}>
        {summaryCards.map((card) => (
          <Grid
            key={card.title}
            size={{ xs: 12, sm: 6, lg: 4 }}
          >
            <Card
              variant="outlined"
              sx={{ height: "100%" }}
            >
              <CardContent>
                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  {card.title}
                </Typography>

                <Typography
                  variant="h4"
                  sx={{
                    mt: 1,
                    fontWeight: 700,
                  }}
                >
                  {card.value}
                </Typography>

                <Typography
                  variant="caption"
                  color="text.secondary"
                >
                  {card.subtitle}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card variant="outlined" sx={{ mt: 3 }}>
        <CardContent>
          <Typography
            variant="h6"
            sx={{ fontWeight: 700 }}
          >
            Cleaning Summary
          </Typography>

          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Typography color="text.secondary">
                Duplicate rows removed
              </Typography>

              <Typography
                variant="h6"
                sx={{ fontWeight: 700 }}
              >
                {summary.duplicateRowsRemoved}
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Typography color="text.secondary">
                Missing timestamps
              </Typography>

              <Typography
                variant="h6"
                sx={{ fontWeight: 700 }}
              >
                {summary.missingTimestamps}
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Typography color="text.secondary">
                Missing before cleaning
              </Typography>

              <Typography
                variant="h6"
                sx={{ fontWeight: 700 }}
              >
                {summary.missingValuesBeforeCleaning}
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Typography color="text.secondary">
                Invalid values detected
              </Typography>

              <Typography
                variant="h6"
                sx={{ fontWeight: 700 }}
              >
                {summary.invalidValuesConvertedToMissing}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Typography
        variant="h5"
        sx={{
          mt: 4,
          mb: 2,
          fontWeight: 700,
        }}
      >
        Measurement Completeness
      </Typography>

      <Grid container spacing={3}>
        {measurementQuality.map((measurement) => {
          const color = getCompletenessColor(
            measurement.completeness,
          );

          return (
            <Grid
              key={measurement.measurementType}
              size={{ xs: 12, md: 6, lg: 4 }}
            >
              <Card
                variant="outlined"
                sx={{ height: "100%" }}
              >
                <CardContent>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 2,
                    }}
                  >
                    <Typography
                      variant="h6"
                      sx={{ fontWeight: 700 }}
                    >
                      {measurement.measurementType}
                    </Typography>

                    <Chip
                      size="small"
                      color={color}
                      label={`${measurement.completeness.toFixed(
                        2,
                      )}%`}
                    />
                  </Box>

                  <LinearProgress
                    variant="determinate"
                    value={measurement.completeness}
                    color={color}
                    sx={{
                      mt: 2,
                      mb: 2,
                      height: 8,
                      borderRadius: 4,
                    }}
                  />

                  <Typography variant="body2">
                    <strong>Total records:</strong>{" "}
                    {measurement.totalRecords.toLocaleString()}
                  </Typography>

                  <Typography variant="body2" sx={{ mt: 0.75 }}>
                    <strong>Valid values:</strong>{" "}
                    {measurement.validValues.toLocaleString()}
                  </Typography>

                  <Typography variant="body2" sx={{ mt: 0.75 }}>
                    <strong>Missing values:</strong>{" "}
                    {measurement.missingValues.toLocaleString()}
                  </Typography>

                  <Typography variant="body2" sx={{ mt: 0.75 }}>
                    <strong>Invalid values:</strong>{" "}
                    {measurement.invalidValues.toLocaleString()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
}