import { Card, CardContent, Divider, Stack, Typography } from "@mui/material";

interface StationSummaryProps {
  totalStations: number;
  airStations: number;
  waterStations: number;
  validPm25Stations: number;
}

export default function StationSummary({
  totalStations,
  airStations,
  waterStations,
  validPm25Stations,
}: StationSummaryProps) {
  return (
    <Card variant="outlined" sx={{ mt: 3 }}>
      <CardContent>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
          Monitoring Network Summary
        </Typography>

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          divider={<Divider orientation="vertical" flexItem />}
        >
          <Typography>
            <strong>Total stations:</strong> {totalStations}
          </Typography>

          <Typography>
            <strong>Air-quality stations:</strong> {airStations}
          </Typography>

          <Typography>
            <strong>Surface-water stations:</strong> {waterStations}
          </Typography>

          <Typography>
            <strong>Valid PM2.5 readings:</strong> {validPm25Stations}
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
}