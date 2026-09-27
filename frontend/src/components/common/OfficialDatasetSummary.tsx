import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  Typography,
} from "@mui/material";

import {
  getOfficialDatasetSummary,
  type OfficialDatasetSummary as DatasetSummary,
} from "../../services/officialDatasetService";

function formatDate(timestamp: string): string {
  return new Date(timestamp).toLocaleDateString();
}

export default function OfficialDatasetSummary() {
  const [summary, setSummary] = useState<DatasetSummary | null>(
    null,
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSummary() {
      try {
        const data = await getOfficialDatasetSummary();
        setSummary(data);
      } catch {
        setError("Could not load the official dataset summary.");
      } finally {
        setLoading(false);
      }
    }

    loadSummary();
  }, []);

  if (loading) {
    return (
      <Card
        variant="outlined"
        sx={{
          mt: 4,
          minHeight: 180,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress />
      </Card>
    );
  }

  if (error || !summary) {
    return (
      <Alert severity="error" sx={{ mt: 4 }}>
        {error || "Official dataset summary is unavailable."}
      </Alert>
    );
  }

  const cards = [
    {
      title: "Official records",
      value: summary.rows.toLocaleString(),
      subtitle: "Station and timestamp combinations",
    },
    {
      title: "Air-quality stations",
      value: summary.stations,
      subtitle: "Stations in the 30-day dataset",
    },
    {
      title: "Measurement types",
      value: summary.measurementColumns.length,
      subtitle: "Environmental variables available",
    },
    {
      title: "Dataset period",
      value: `${formatDate(summary.startTimestamp)} – ${formatDate(
        summary.endTimestamp,
      )}`,
      subtitle: "Official Green Sentinel sample period",
    },
  ];

  return (
    <Box sx={{ mt: 4 }}>
      <Typography
        variant="h5"
        sx={{
          fontWeight: 600,
          mb: 2,
        }}
      >
        Official 30-Day Dataset
      </Typography>

      <Grid container spacing={3}>
        {cards.map((card) => (
          <Grid
            key={card.title}
            size={{ xs: 12, sm: 6, lg: 3 }}
          >
            <Card variant="outlined" sx={{ height: "100%" }}>
              <CardContent>
                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  {card.title}
                </Typography>

                <Typography
                  variant="h5"
                  sx={{
                    mt: 1,
                    fontWeight: 600,
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
    </Box>
  );
}