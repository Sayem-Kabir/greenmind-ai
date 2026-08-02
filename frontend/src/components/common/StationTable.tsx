import {
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";

import type { Station } from "../../types/station";

interface StationTableProps {
  stations: Station[];
}

export default function StationTable({ stations }: StationTableProps) {
  return (
    <TableContainer component={Paper} variant="outlined" sx={{ mt: 3 }}>
      <Typography variant="h6" sx={{ p: 2, fontWeight: 700 }}>
        Station Data
      </Typography>

      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Station</TableCell>
            <TableCell>Type</TableCell>
            <TableCell align="right">PM2.5</TableCell>
            <TableCell align="right">Wind Speed</TableCell>
            <TableCell align="right">Latitude</TableCell>
            <TableCell align="right">Longitude</TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {stations.map((station) => (
            <TableRow key={station.id} hover>
              <TableCell>{station.name}</TableCell>

              <TableCell>
                <Chip
                  size="small"
                  label={
                    station.station_type === 1
                      ? "Surface water"
                      : "Air quality"
                  }
                  color={station.station_type === 1 ? "primary" : "success"}
                />
              </TableCell>

              <TableCell align="right">
                {station.station_type === 1
                  ? "N/A"
                  : station.pm25?.toFixed(2) ?? "Missing"}
              </TableCell>

              <TableCell align="right">
                {station.windSpeed?.toFixed(2) ?? "Missing"}
              </TableCell>

              <TableCell align="right">
                {station.lat.toFixed(5)}
              </TableCell>

              <TableCell align="right">
                {station.lng.toFixed(5)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}