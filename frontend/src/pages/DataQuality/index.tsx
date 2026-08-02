import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
} from "@mui/material";

import StationTable from "../../components/common/StationTable";
import type { Station } from "../../types/station";

interface DataQualitySummary {
  totalRecords: number;
  airStations: number;
  missingPm25: number;
  missingWindSpeed: number;
  missingWindDirection: number;
  invalidCoordinates: number;
  negativeValuesRemoved: number;
  pm25Completeness: number;
}

interface DataQualityResponse {
  summary: DataQualitySummary;
  stations: Station[];
}

const API_URL = "http://localhost:8000/api/data-quality/";

export default function DataQuality() {
  const [data, setData] = useState<DataQualityResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDataQuality() {
      try {
        const response = await fetch(API_URL);

        if (!response.ok) {
          throw new Error(
            `Request failed: ${response.status} ${response.statusText}`,
          );
        }

        const result: DataQualityResponse = await response.json();
        setData(result);
      } catch {
        setError("Could not load data-quality information.");
      } finally {
        setLoading(false);
      }
    }

    loadDataQuality();
  }, []);

  if (loading) {
    return (
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Data Quality
        </Typography>

        <Typography color="text.secondary" sx={{ mt: 2 }}>
          Loading data-quality report...
        </Typography>
      </Box>
    );
  }

  if (error || !data) {
    return (
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>
          Data Quality
        </Typography>

        <Alert severity="error">
          {error || "Data-quality report is unavailable."}
        </Alert>
      </Box>
    );
  }

  const { summary, stations } = data;

  const cards = [
    {
      title: "Total records",
      value: summary.totalRecords,
      description: "Monitoring records processed by the backend",
    },
    {
      title: "Missing PM2.5",
      value: summary.missingPm25,
      description: "Records without a valid PM2.5 value",
    },
    {
      title: "Missing wind speed",
      value: summary.missingWindSpeed,
      description: "Records without a valid wind-speed value",
    },
    {
      title: "Invalid coordinates",
      value: summary.invalidCoordinates,
      description: "Records outside valid coordinate ranges",
    },
    {
      title: "Negative values removed",
      value: summary.negativeValuesRemoved,
      description: "Invalid negative measurements converted to missing values",
    },
    {
      title: "Missing wind direction",
      value: summary.missingWindDirection,
      description: "Records without a valid wind direction",
    },
  ];

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 700 }}>
        Data Quality
      </Typography>

      <Typography color="text.secondary" sx={{ mt: 1, mb: 3 }}>
        Backend validation and cleaning summary for the Green Sentinel dataset.
      </Typography>

      <Grid container spacing={3}>
        {cards.map((card) => (
          <Grid
            key={card.title}
            size={{ xs: 12, sm: 6, lg: 4 }}
          >
            <Card variant="outlined" sx={{ height: "100%" }}>
              <CardContent>
                <Typography color="text.secondary" variant="body2">
                  {card.title}
                </Typography>

                <Typography variant="h4" sx={{ mt: 1, fontWeight: 700 }}>
                  {card.value}
                </Typography>

                <Typography color="text.secondary" variant="caption">
                  {card.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card variant="outlined" sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            PM2.5 completeness
          </Typography>

          <Typography variant="h3" sx={{ mt: 1 }}>
            {summary.pm25Completeness.toFixed(1)}%
          </Typography>

          <Typography color="text.secondary" sx={{ mt: 1 }}>
            Valid PM2.5 data across {summary.airStations} air-quality stations.
          </Typography>
        </CardContent>
      </Card>

      <StationTable stations={stations} />
    </Box>
  );
}