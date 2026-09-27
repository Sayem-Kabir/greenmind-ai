import { Card, CardContent, Typography } from "@mui/material";

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
}

export default function KpiCard({
  title,
  value,
  subtitle,
}: KpiCardProps) {
  return (
    <Card variant="outlined" sx={{ height: "100%" }}>
      <CardContent>
        <Typography color="text.secondary" variant="body2">
          {title}
        </Typography>

        <Typography variant="h4" sx={{ mt: 1, fontWeight: 600 }}>
          {value}
        </Typography>

        {subtitle && (
          <Typography color="text.secondary" variant="caption">
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}