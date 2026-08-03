import {
  AppBar,
  Avatar,
  Box,
  Chip,
  CssBaseline,
  Stack,
  Toolbar,
  Typography,
} from "@mui/material";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import ParkIcon from "@mui/icons-material/Park";
import { Outlet } from "react-router-dom";

import Sidebar from "../components/layout/Sidebar";

const DRAWER_WIDTH = 280;

export default function MainLayout() {
  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #f3f8f6 0%, #f7faf9 50%, #eef7f4 100%)",
      }}
    >
      <CssBaseline />

      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          height: 76,
          justifyContent: "center",
          backgroundColor: "rgba(255, 255, 255, 0.88)",
          color: "#14332d",
          borderBottom: "1px solid rgba(15, 118, 110, 0.12)",
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
        }}
      >
        <Toolbar
          sx={{
            minHeight: "76px !important",
            px: {
              xs: 2,
              sm: 3,
            },
          }}
        >
          <Box
            sx={{
              width: {
                xs: "auto",
                md: DRAWER_WIDTH - 24,
              },
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              flexShrink: 0,
            }}
          >
            <Avatar
              sx={{
                width: 44,
                height: 44,
                background:
                  "linear-gradient(135deg, #0f766e 0%, #16a34a 100%)",
                boxShadow:
                  "0 10px 24px rgba(15, 118, 110, 0.25)",
              }}
            >
              <ParkIcon />
            </Avatar>

            <Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 800,
                  letterSpacing: "-0.03em",
                  lineHeight: 1.1,
                }}
              >
                GreenMind AI
              </Typography>

              <Typography
                variant="caption"
                sx={{
                  color: "#6b7f79",
                  fontWeight: 500,
                  display: {
                    xs: "none",
                    sm: "block",
                  },
                }}
              >
                Urban environmental intelligence
              </Typography>
            </Box>
          </Box>

          <Box sx={{ flexGrow: 1 }} />

          <Box
  sx={{
    display: "flex",
    alignItems: "center",
    gap: 1.5,
  }}
>
  <Chip
    icon={<AutoAwesomeRoundedIcon />}
    label="AI Decision Support"
    size="small"
    sx={{
      display: {
        xs: "none",
        sm: "flex",
      },
      height: 34,
      px: 0.5,
      color: "#6d28d9",
      backgroundColor: "#f3e8ff",
      border: "1px solid #e9d5ff",
      fontWeight: 700,
      "& .MuiChip-icon": {
        color: "#7c3aed",
      },
    }}
  />

  <Chip
    label="Debrecen"
    size="small"
    sx={{
      height: 34,
      px: 0.75,
      color: "#0f766e",
      backgroundColor: "#e8f7f3",
      border: "1px solid #cdece4",
      fontWeight: 700,
    }}
  />
</Box>
        </Toolbar>
      </AppBar>

      <Sidebar />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minWidth: 0,
          minHeight: "100vh",
          pt: "76px",
          ml: {
            xs: 0,
            md: 0,
          },
        }}
      >
        <Box
          sx={{
            width: "100%",
            maxWidth: 1600,
            mx: "auto",
            px: {
              xs: 2,
              sm: 3,
              lg: 4,
            },
            py: {
              xs: 3,
              sm: 4,
            },
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}