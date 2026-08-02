import { Box, Paper, Typography } from "@mui/material";

const legendItems = [
  { label: "Low PM2.5", color: "#2ecc71" },
  { label: "Moderate PM2.5", color: "#f1c40f" },
  { label: "High PM2.5", color: "#e67e22" },
  { label: "Very high PM2.5", color: "#e74c3c" },
  { label: "Surface water station", color: "#1976d2" },
  { label: "Missing data", color: "#9e9e9e" },
];

export default function MapLegend() {
  return (
    <Paper
      elevation={3}
      sx={{
        position: "absolute",
        bottom: 20,
        right: 20,
        zIndex: 1000,
        p: 2,
        minWidth: 190,
      }}
    >
      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>
        Map legend
      </Typography>

      {legendItems.map((item) => (
        <Box
          key={item.label}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            mb: 0.75,
          }}
        >
          <Box
            sx={{
              width: 14,
              height: 14,
              borderRadius: "50%",
              backgroundColor: item.color,
              border: "1px solid rgba(0,0,0,0.25)",
            }}
          />

          <Typography variant="caption">{item.label}</Typography>
        </Box>
      ))}
    </Paper>
  );
}