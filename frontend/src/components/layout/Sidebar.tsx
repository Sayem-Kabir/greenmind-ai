import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import DataObjectRoundedIcon from "@mui/icons-material/DataObjectRounded";
import InsightsRoundedIcon from "@mui/icons-material/InsightsRounded";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import {
  Box,
  Chip,
  Divider,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from "@mui/material";
import { Link, useLocation } from "react-router-dom";

const drawerWidth = 280;

const menu = [
  {
    text: "Dashboard",
    path: "/",
    icon: <DashboardRoundedIcon />,
  },
  {
    text: "Sensor Recommendations",
    path: "/recommendations",
    icon: <InsightsRoundedIcon />,
  },
  {
    text: "Data Quality",
    path: "/data-quality",
    icon: <DataObjectRoundedIcon />,
  },
  {
    text: "Methodology",
    path: "/methodology",
    icon: <MenuBookRoundedIcon />,
  },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        display: {
          xs: "none",
          md: "block",
        },
        "& .MuiDrawer-paper": {
          width: drawerWidth,
          boxSizing: "border-box",
          top: 76,
          height: "calc(100vh - 76px)",
          borderRight:
            "1px solid rgba(15, 118, 110, 0.12)",
          background:
            "linear-gradient(180deg, #ffffff 0%, #f4faf8 100%)",
        },
      }}
    >
      <Box
        sx={{
          px: 2,
          pt: 3,
          pb: 2,
        }}
      >
        <Typography
          variant="overline"
          sx={{
            color: "#7a8c87",
            fontWeight: 800,
            letterSpacing: "0.12em",
          }}
        >
          Navigation
        </Typography>
      </Box>

      <List
        sx={{
          px: 1.5,
          py: 0,
        }}
      >
        {menu.map((item) => {
          const selected =
            location.pathname === item.path;

          return (
            <ListItemButton
              key={item.text}
              component={Link}
              to={item.path}
              selected={selected}
              sx={{
                position: "relative",
                minHeight: 52,
                mb: 0.75,
                px: 1.5,
                borderRadius: 2.5,
                color: selected
                  ? "#0f766e"
                  : "#44534f",
                transition:
                  "background-color 160ms ease, color 160ms ease, transform 160ms ease",
                "&:hover": {
                  backgroundColor:
                    "rgba(15, 118, 110, 0.08)",
                  color: "#0f766e",
                  transform: "translateX(2px)",
                },
                "&.Mui-selected": {
                  backgroundColor: "#e4f5f0",
                  color: "#0f766e",
                  "&:hover": {
                    backgroundColor: "#d9f0e9",
                  },
                },
                "&.Mui-selected::before": {
                  content: '""',
                  position: "absolute",
                  left: 0,
                  top: 10,
                  bottom: 10,
                  width: 4,
                  borderRadius: "0 6px 6px 0",
                  backgroundColor: "#0f766e",
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 42,
                  color: "inherit",
                }}
              >
                {item.icon}
              </ListItemIcon>

              <ListItemText
                primary={item.text}
                slotProps={{
                  primary: {
                    sx: {
                      fontWeight: selected ? 750 : 600,
                      fontSize: "0.95rem",
                    },
                  },
                }}
              />
            </ListItemButton>
          );
        })}
      </List>

      <Box sx={{ flexGrow: 1 }} />

      <Box
        sx={{
          mt: "auto",
          px: 2,
          pb: 3,
        }}
      >
        <Divider sx={{ mb: 2.5 }} />

        <Box
          sx={{
            p: 2,
            borderRadius: 3,
            border:
              "1px solid rgba(15, 118, 110, 0.14)",
            backgroundColor:
              "rgba(232, 247, 243, 0.72)",
          }}
        >
          <Chip
            size="small"
            label="DEIK.AI Challenge 2026"
            sx={{
              mb: 1.25,
              color: "#0f766e",
              backgroundColor: "#d8f1ea",
              fontWeight: 700,
            }}
          />

          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 800,
              color: "#183d35",
            }}
          >
            GreenMind AI
          </Typography>

          <Typography
            variant="caption"
            sx={{
              display: "block",
              mt: 0.5,
              color: "#6b7f79",
              lineHeight: 1.5,
            }}
          >
            Environmental sensor planning for Debrecen.
          </Typography>
        </Box>
      </Box>
    </Drawer>
  );
}