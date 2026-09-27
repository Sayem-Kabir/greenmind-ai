import { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import EngineeringRoundedIcon from "@mui/icons-material/EngineeringRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import EditCalendarRoundedIcon from "@mui/icons-material/EditCalendarRounded";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import AssignmentTurnedInRoundedIcon from "@mui/icons-material/AssignmentTurnedInRounded";
import FilterListRoundedIcon from "@mui/icons-material/FilterListRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";

import { useAppTheme } from "../../context/ThemeContext";
import { useMaintenance } from "../../context/MaintenanceContext";
import type { PriorityLevel, WorkOrder } from "../../services/maintenanceService";

type PriorityFilter = "ALL" | "CRITICAL" | "HIGH" | "ROUTINE";
type SortOption = "DATE_ASC" | "PRIORITY_DESC" | "STATION_ASC";

export default function MaintenanceSchedule() {
  const { tokens, isMidnight } = useAppTheme();
  const {
    orders,
    loading,
    error,
    refreshOrders,
    rescheduleOrder,
    cancelOrder,
    dispatchOrder,
  } = useMaintenance();

  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("ALL");
  const [sortOption, setSortOption] = useState<SortOption>("DATE_ASC");

  // Reschedule dialog state
  const [editingOrder, setEditingOrder] = useState<WorkOrder | null>(null);
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [newPriority, setNewPriority] = useState<PriorityLevel>("HIGH");
  const [newTech, setNewTech] = useState("");
  const [newNotes, setNewNotes] = useState("");

  // Cancel dialog state
  const [cancellingOrder, setCancellingOrder] = useState<WorkOrder | null>(null);

  // Details dialog state
  const [viewingOrder, setViewingOrder] = useState<WorkOrder | null>(null);

  // New order dialog state
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [createStationCode, setCreateStationCode] = useState("DEB-KER01");
  const [createStationName, setCreateStationName] = useState("Szabó Pál street, Medical Clinic");
  const [createDate, setCreateDate] = useState(
    new Date(Date.now() + 86400000 * 2).toISOString().split("T")[0]
  );
  const [createTime, setCreateTime] = useState("10:00");
  const [createPriority, setCreatePriority] = useState<PriorityLevel>("HIGH");
  const [createTech, setCreateTech] = useState("Gábor Kovács (Senior Field Tech)");
  const [createDesc, setCreateDesc] = useState("Scheduled optical sensor cleaning and baseline zero reset.");

  // Open reschedule dialog
  const handleOpenEdit = (order: WorkOrder) => {
    setEditingOrder(order);
    setNewDate(order.scheduledDate);
    setNewTime(order.scheduledTime);
    setNewPriority(order.priority);
    setNewTech(order.assignedTechnician);
    setNewNotes(order.notes || "");
  };

  const handleSaveReschedule = async () => {
    if (!editingOrder) return;
    await rescheduleOrder(editingOrder.id, newDate, newTime, newTech, newNotes);
    setEditingOrder(null);
  };

  const handleConfirmCancel = async () => {
    if (!cancellingOrder) return;
    await cancelOrder(cancellingOrder.id);
    setCancellingOrder(null);
  };

  const handleCreateOrder = async () => {
    await dispatchOrder({
      stationCode: createStationCode,
      stationName: createStationName,
      scheduledDate: createDate,
      scheduledTime: createTime,
      priority: createPriority,
      assignedTechnician: createTech,
      issueDescription: createDesc,
      actionRequired: "Clean optical particulate chamber; verify continuous telemetry stream.",
      estimatedHours: 2.0,
    });
    setIsCreatingOrder(false);
  };

  const getPriorityStyle = (priority: PriorityLevel) => {
    switch (priority) {
      case "CRITICAL":
        return {
          main: "#dc2626",
          bg: "#fef2f2",
          border: "#fecaca",
          label: "Critical",
          icon: <ErrorOutlineRoundedIcon sx={{ fontSize: 15 }} />,
        };
      case "HIGH":
        return {
          main: "#d97706",
          bg: "#fffbeb",
          border: "#fde68a",
          label: "High",
          icon: <WarningAmberRoundedIcon sx={{ fontSize: 15 }} />,
        };
      case "ROUTINE":
      default:
        return {
          main: "#2563eb",
          bg: "#eff6ff",
          border: "#bfdbfe",
          label: "Routine",
          icon: <CheckCircleOutlineRoundedIcon sx={{ fontSize: 15 }} />,
        };
    }
  };

  // Filtered & Sorted orders
  const filteredOrders = useMemo(() => {
    let list = [...orders];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (o) =>
          o.stationCode.toLowerCase().includes(q) ||
          o.stationName.toLowerCase().includes(q) ||
          o.assignedTechnician.toLowerCase().includes(q) ||
          o.issueDescription.toLowerCase().includes(q) ||
          o.id.toLowerCase().includes(q)
      );
    }

    if (priorityFilter !== "ALL") {
      list = list.filter((o) => o.priority === priorityFilter);
    }

    const priorityWeight: Record<PriorityLevel, number> = {
      CRITICAL: 1,
      HIGH: 2,
      ROUTINE: 3,
    };

    list.sort((a, b) => {
      if (sortOption === "DATE_ASC") {
        const dateA = `${a.scheduledDate} ${a.scheduledTime}`;
        const dateB = `${b.scheduledDate} ${b.scheduledTime}`;
        return dateA.localeCompare(dateB);
      }
      if (sortOption === "PRIORITY_DESC") {
        return priorityWeight[a.priority] - priorityWeight[b.priority];
      }
      return a.stationCode.localeCompare(b.stationCode);
    });

    return list;
  }, [orders, searchQuery, priorityFilter, sortOption]);

  // KPI stats
  const totalOrders = orders.length;
  const criticalCount = orders.filter((o) => o.priority === "CRITICAL").length;
  const totalHours = orders.reduce((sum, o) => sum + (o.estimatedHours || 1.5), 0);
  const nextOrder = orders.length > 0 ? orders[0] : null;

  return (
    <Box sx={{ p: 0, maxWidth: 1440, mx: "auto" }}>
      {/* Top Banner Header */}
      <Box
        sx={{
          mb: 3.5,
          p: { xs: 2.5, md: 3.5 },
          borderRadius: 4,
          background: tokens.cardBg,
          border: `1px solid ${isMidnight ? "rgba(0, 220, 130, 0.2)" : "#bbf7d0"}`,
          boxShadow: "none",
          position: "relative",
          overflow: "hidden",
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          alignItems: { xs: "flex-start", md: "center" },
          justifyContent: "space-between",
          gap: 2.5,
        }}
      >
        <Box sx={{ position: "relative", zIndex: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 2.5,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "rgba(0, 220, 130, 0.12)",
                color: isMidnight ? "#79b998" : "#059669",
                border: "1px solid rgba(0, 220, 130, 0.25)",
              }}
            >
              <CalendarMonthRoundedIcon sx={{ fontSize: 26 }} />
            </Box>
            <Box>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  fontSize: { xs: "1.45rem", md: "1.85rem" },
                  color: tokens.textPrimary,
                  letterSpacing: "-0.02em",
                }}
              >
                Sensor Maintenance Schedule
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: tokens.textSecondary,
                  mt: 0.5,
                  fontSize: "0.85rem",
                }}
              >
                Manage active work orders, technician dispatch, and field service schedules.
              </Typography>
            </Box>
          </Box>
        </Box>

        <Box sx={{ display: "flex", gap: 1.5, position: "relative", zIndex: 1 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshRoundedIcon />}
            onClick={refreshOrders}
            disabled={loading}
            sx={{
              borderRadius: 2.5,
              px: 2.2,
              py: 1,
              fontWeight: 600,
              fontSize: "0.85rem",
              textTransform: "none",
              borderColor: isMidnight ? "rgba(0, 220, 130, 0.3)" : "#cbd5e1",
              color: tokens.textPrimary,
              backgroundColor: tokens.cardBg,
              "&:hover": {
                borderColor: tokens.accent,
                backgroundColor: "rgba(0, 220, 130, 0.08)",
              },
            }}
          >
            Refresh
          </Button>

          <Button
            variant="contained"
            startIcon={<AddRoundedIcon />}
            onClick={() => setIsCreatingOrder(true)}
            sx={{
              borderRadius: 2.5,
              px: 2.5,
              py: 1,
              fontWeight: 600,
              fontSize: "0.85rem",
              textTransform: "none",
              backgroundColor: "#00dc82",
              color: "#0b1329",
              boxShadow: "none",
              "&:hover": {
                backgroundColor: "#00c474",
              },
            }}
          >
            Schedule Work Order
          </Button>
        </Box>
      </Box>

      {/* KPI Summary Cards - Strictly Uniform */}
      <Grid container spacing={2.5} sx={{ mb: 3.5, alignItems: "stretch" }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card
            sx={{
              p: 2.5,
              height: "100%",
              minHeight: 165,
              borderRadius: 3.5,
              backgroundColor: tokens.cardBg,
              border: `1px solid ${tokens.cardBorder}`,
              boxShadow: "none",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.5 }}>
                <Typography variant="overline" sx={{ color: tokens.textMuted, fontWeight: 600 }}>
                  Active Work Orders
                </Typography>
                <CalendarMonthRoundedIcon sx={{ color: isMidnight ? "#79b998" : tokens.primary, fontSize: 22 }} />
              </Box>
              <Box sx={{ display: "flex", alignItems: "baseline", gap: 1 }}>
                <Typography variant="h3" sx={{ fontWeight: 700, color: tokens.textPrimary }}>
                  {totalOrders}
                </Typography>
                <Chip
                  size="small"
                  label="In Dispatch Queue"
                  sx={{
                    fontWeight: 600,
                    height: 22,
                    fontSize: "0.72rem",
                    backgroundColor: isMidnight ? "rgba(0,220,130,0.18)" : "#d1fae5",
                    color: isMidnight ? "#79b998" : "#047857",
                  }}
                />
              </Box>
            </Box>
            <Box sx={{ mt: "auto", pt: 1.5 }}>
              <Typography variant="caption" noWrap sx={{ display: "block", color: tokens.textMuted }}>
                Scheduled field appointments
              </Typography>
            </Box>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card
            sx={{
              p: 2.5,
              height: "100%",
              minHeight: 165,
              borderRadius: 3.5,
              backgroundColor: tokens.cardBg,
              border: `1px solid ${tokens.cardBorder}`,
              boxShadow: "none",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.5 }}>
                <Typography variant="overline" sx={{ color: tokens.textMuted, fontWeight: 600 }}>
                  Critical (P1) Priority
                </Typography>
                <ErrorOutlineRoundedIcon sx={{ color: "#dc2626", fontSize: 22 }} />
              </Box>
              <Box sx={{ display: "flex", alignItems: "baseline", gap: 1 }}>
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 700,
                    color: criticalCount > 0 ? "#dc2626" : tokens.textPrimary,
                  }}
                >
                  {criticalCount}
                </Typography>
                <Chip
                  size="small"
                  label={criticalCount > 0 ? "Immediate Dispatch" : "Queue Nominal"}
                  sx={{
                    fontWeight: 600,
                    height: 22,
                    fontSize: "0.72rem",
                    backgroundColor: criticalCount > 0 ? "#fee2e2" : "#d1fae5",
                    color: criticalCount > 0 ? "#dc2626" : "#047857",
                  }}
                />
              </Box>
            </Box>
            <Box sx={{ mt: "auto", pt: 1.5 }}>
              <Typography variant="caption" noWrap sx={{ display: "block", color: tokens.textMuted }}>
                Require technician attention within 48h
              </Typography>
            </Box>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card
            sx={{
              p: 2.5,
              height: "100%",
              minHeight: 165,
              borderRadius: 3.5,
              backgroundColor: tokens.cardBg,
              border: `1px solid ${tokens.cardBorder}`,
              boxShadow: "none",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.5 }}>
                <Typography variant="overline" sx={{ color: tokens.textMuted, fontWeight: 600 }}>
                  Estimated Field Time
                </Typography>
                <AccessTimeRoundedIcon sx={{ color: "#38bdf8", fontSize: 22 }} />
              </Box>
              <Box sx={{ display: "flex", alignItems: "baseline", gap: 1 }}>
                <Typography variant="h3" sx={{ fontWeight: 700, color: tokens.textPrimary }}>
                  {totalHours.toFixed(1)}
                </Typography>
                <Typography variant="body2" sx={{ color: tokens.textSecondary, fontWeight: 600 }}>
                  Total Hours
                </Typography>
              </Box>
            </Box>
            <Box sx={{ mt: "auto", pt: 1.5 }}>
              <Typography variant="caption" noWrap sx={{ display: "block", color: tokens.textMuted }}>
                Allocated across certified technicians
              </Typography>
            </Box>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card
            sx={{
              p: 2.5,
              height: "100%",
              minHeight: 165,
              borderRadius: 3.5,
              backgroundColor: tokens.cardBg,
              border: `1px solid ${tokens.cardBorder}`,
              boxShadow: "none",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.5 }}>
                <Typography variant="overline" sx={{ color: tokens.textMuted, fontWeight: 600 }}>
                  Next Scheduled Visit
                </Typography>
                <AssignmentTurnedInRoundedIcon sx={{ color: "#a855f7", fontSize: 22 }} />
              </Box>
              <Box sx={{ display: "flex", alignItems: "baseline", gap: 1 }}>
                <Typography variant="h5" sx={{ fontWeight: 700, color: tokens.textPrimary }}>
                  {nextOrder ? nextOrder.scheduledDate : "None"}
                </Typography>
                {nextOrder && (
                  <Chip
                    size="small"
                    label={nextOrder.scheduledTime}
                    sx={{
                      fontWeight: 600,
                      height: 22,
                      fontSize: "0.72rem",
                      backgroundColor: "#f1f5f9",
                      color: tokens.textPrimary,
                    }}
                  />
                )}
              </Box>
            </Box>
            <Box sx={{ mt: "auto", pt: 1.5 }}>
              <Typography variant="caption" noWrap sx={{ display: "block", color: tokens.textMuted }}>
                {nextOrder ? nextOrder.stationCode : "All stations nominal"}
              </Typography>
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Search & Priority Filter Toolbar */}
      <Card
        sx={{
          p: 2,
          mb: 3.5,
          borderRadius: 3.5,
          backgroundColor: tokens.cardBg,
          border: `1px solid ${tokens.cardBorder}`,
          boxShadow: "none",
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            alignItems: { xs: "stretch", md: "center" },
            justifyContent: "space-between",
            gap: 2,
          }}
        >
          {/* Search */}
          <TextField
            size="small"
            placeholder="Search work orders by station, technician, or issue..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRoundedIcon sx={{ color: tokens.textMuted }} />
                  </InputAdornment>
                ),
              },
            }}
            sx={{
              minWidth: { xs: "100%", md: 380 },
              "& .MuiOutlinedInput-root": {
                borderRadius: 2.5,
                backgroundColor: "#f8fafc",
              },
            }}
          />

          {/* Priority Chips & Sort */}
          <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1 }}>
            <FilterListRoundedIcon sx={{ color: tokens.textMuted, fontSize: 20 }} />
            {(["ALL", "CRITICAL", "HIGH", "ROUTINE"] as PriorityFilter[]).map((p) => {
              const isSelected = priorityFilter === p;
              const label =
                p === "ALL"
                  ? "All Orders"
                  : p === "CRITICAL"
                  ? "P1 · Critical"
                  : p === "HIGH"
                  ? "P2 · High"
                  : "P3 · Routine";

              return (
                <Chip
                  key={p}
                  label={label}
                  clickable
                  onClick={() => setPriorityFilter(p)}
                  sx={{
                    fontWeight: 600,
                    borderRadius: 2,
                    border: isSelected ? `1.5px solid ${tokens.primary}` : "1px solid #e2e8f0",
                    backgroundColor: isSelected ? "#dcfce7" : "transparent",
                    color: isSelected ? tokens.primary : tokens.textSecondary,
                  }}
                />
              );
            })}

            <Select
              size="small"
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as SortOption)}
              sx={{
                borderRadius: 2.5,
                fontSize: "0.85rem",
                fontWeight: 600,
                backgroundColor: "#f8fafc",
                ml: { xs: 0, md: 1 },
              }}
            >
              <MenuItem value="DATE_ASC">Soonest Appointment</MenuItem>
              <MenuItem value="PRIORITY_DESC">Highest Priority (P1-P3)</MenuItem>
              <MenuItem value="STATION_ASC">Station Code (A-Z)</MenuItem>
            </Select>
          </Box>
        </Box>
      </Card>

      {/* Loading & Error */}
      {loading && (
        <Box sx={{ py: 8, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
          <CircularProgress size={40} sx={{ color: tokens.primary }} />
          <Typography variant="body2" sx={{ color: tokens.textSecondary }}>
            Loading maintenance schedules and work orders...
          </Typography>
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 4, borderRadius: 3 }}>
          {error}
        </Alert>
      )}

      {/* Empty State */}
      {!loading && !error && filteredOrders.length === 0 && (
        <Card
          sx={{
            p: 6,
            textAlign: "center",
            borderRadius: 4,
            backgroundColor: tokens.cardBg,
            border: `1px solid ${tokens.cardBorder}`,
          }}
        >
          <AssignmentTurnedInRoundedIcon sx={{ fontSize: 48, color: "#10b981", mb: 1.5 }} />
          <Typography variant="h6" sx={{ fontWeight: 600, color: tokens.textPrimary }}>
            No Scheduled Work Orders in Queue
          </Typography>
          <Typography variant="body2" sx={{ color: tokens.textSecondary, maxWidth: 440, mx: "auto", mt: 0.5 }}>
            All monitoring stations are operating within nominal thresholds. You can schedule a routine visit
            or dispatch an order from the Sensor Health dashboard.
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddRoundedIcon />}
            onClick={() => setIsCreatingOrder(true)}
            sx={{
              mt: 2.5,
              borderRadius: 2.5,
              fontWeight: 600,
              backgroundColor: "#00dc82",
              color: "#0b1329",
              textTransform: "none",
            }}
          >
            Create New Work Order
          </Button>
        </Card>
      )}

      {/* Work Orders List */}
      {!loading && !error && filteredOrders.length > 0 && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
          {filteredOrders.map((order) => {
            const pStyle = getPriorityStyle(order.priority);

            return (
              <Card
                key={order.id}
                sx={{
                  borderRadius: 3,
                  backgroundColor: tokens.cardBg,
                  border: `1px solid ${tokens.cardBorder}`,
                  boxShadow: "none",
                  transition: "border-color 0.15s ease",
                  "&:hover": {
                    borderColor: tokens.primary,
                  },
                }}
              >
                <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
                  {/* Top: Place, Priority Badge, and Scheduled Time */}
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: { xs: "flex-start", sm: "center" },
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                      gap: 1.5,
                      mb: 1.5,
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: tokens.textPrimary }}>
                        {order.stationName}
                      </Typography>
                      <Chip
                        icon={pStyle.icon}
                        label={pStyle.label}
                        size="small"
                        sx={{
                          fontWeight: 600,
                          fontSize: "0.72rem",
                          height: 22,
                          backgroundColor: pStyle.bg,
                          color: pStyle.main,
                          border: `1px solid ${pStyle.border}`,
                        }}
                      />
                    </Box>

                    {/* Time */}
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 0.75,
                        py: 0.5,
                        px: 1.25,
                        borderRadius: 2,
                        backgroundColor: "#f8fafc",
                        border: "1px solid #e2e8f0",
                        fontSize: "0.82rem",
                        fontWeight: 700,
                        color: tokens.textPrimary,
                      }}
                    >
                      <CalendarMonthRoundedIcon sx={{ fontSize: 17, color: "#059669" }} />
                      <span>{order.scheduledDate} · {order.scheduledTime}</span>
                    </Box>
                  </Box>

                  {/* Middle: Short Issue & Assigned Person Name */}
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      backgroundColor: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      display: "flex",
                      flexDirection: { xs: "column", sm: "row" },
                      alignItems: { xs: "flex-start", sm: "center" },
                      justifyContent: "space-between",
                      gap: 1.5,
                      mb: 2,
                    }}
                  >
                    {/* Short Issue */}
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: tokens.textMuted, textTransform: "uppercase" }}>
                        Issue:
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: tokens.textPrimary }}>
                        {order.issueDescription}
                      </Typography>
                    </Box>

                    {/* Assigned Person Name */}
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, flexShrink: 0 }}>
                      <EngineeringRoundedIcon sx={{ color: "#64748b", fontSize: 18 }} />
                      <Typography variant="body2" sx={{ fontWeight: 600, color: tokens.textPrimary }}>
                        {order.assignedTechnician}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Bottom: Action buttons */}
                  <Box sx={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 1.25 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<VisibilityOutlinedIcon />}
                      onClick={() => setViewingOrder(order)}
                      sx={{
                        borderRadius: 2,
                        px: 2,
                        py: 0.5,
                        fontSize: "0.8rem",
                        fontWeight: 600,
                        textTransform: "none",
                        borderColor: "#cbd5e1",
                        color: tokens.textPrimary,
                        "&:hover": {
                          borderColor: tokens.primary,
                          backgroundColor: "#f8fafc",
                        },
                      }}
                    >
                      Details
                    </Button>

                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      startIcon={<CancelOutlinedIcon />}
                      onClick={() => setCancellingOrder(order)}
                      sx={{
                        borderRadius: 2,
                        px: 2,
                        py: 0.5,
                        fontSize: "0.8rem",
                        fontWeight: 600,
                        textTransform: "none",
                        borderColor: "#fecaca",
                        color: "#dc2626",
                        "&:hover": {
                          backgroundColor: "#fef2f2",
                          borderColor: "#dc2626",
                        },
                      }}
                    >
                      Cancel Order
                    </Button>

                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<EditCalendarRoundedIcon />}
                      onClick={() => handleOpenEdit(order)}
                      sx={{
                        borderRadius: 2,
                        px: 2,
                        py: 0.5,
                        fontSize: "0.8rem",
                        fontWeight: 600,
                        textTransform: "none",
                        borderColor: "#cbd5e1",
                        color: tokens.textPrimary,
                        backgroundColor: "#ffffff",
                        "&:hover": {
                          borderColor: tokens.primary,
                          backgroundColor: "#f8fafc",
                        },
                      }}
                    >
                      Reschedule
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      )}

      {/* Modal 0: Work Order Comprehensive Details Dialog */}
      <Dialog
        open={Boolean(viewingOrder)}
        onClose={() => setViewingOrder(null)}
        maxWidth="sm"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: 4,
              backgroundColor: "#ffffff",
              border: "1px solid #e2e8f0",
              boxShadow: "0 24px 60px rgba(15, 23, 42, 0.18)",
            },
          },
        }}
      >
        {viewingOrder && (
          <>
            <DialogTitle sx={{ p: 3, pb: 1.5, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1, flexWrap: "wrap" }}>
                  <Chip
                    label={viewingOrder.id}
                    size="small"
                    sx={{
                      fontWeight: 700,
                      fontSize: "0.75rem",
                      backgroundColor: "#f1f5f9",
                      color: "#475569",
                      borderRadius: 1.5,
                    }}
                  />
                  <Chip
                    label={viewingOrder.stationCode}
                    size="small"
                    sx={{
                      fontWeight: 700,
                      fontSize: "0.75rem",
                      backgroundColor: "#ecfdf5",
                      color: "#059669",
                      border: "1px solid #a7f3d0",
                      borderRadius: 1.5,
                    }}
                  />
                  {(() => {
                    const p = getPriorityStyle(viewingOrder.priority);
                    return (
                      <Chip
                        icon={p.icon}
                        label={p.label}
                        size="small"
                        sx={{
                          fontWeight: 600,
                          fontSize: "0.72rem",
                          height: 24,
                          backgroundColor: p.bg,
                          color: p.main,
                          border: `1px solid ${p.border}`,
                        }}
                      />
                    );
                  })()}
                  <Chip
                    label={viewingOrder.status}
                    size="small"
                    sx={{
                      fontWeight: 600,
                      fontSize: "0.72rem",
                      height: 24,
                      backgroundColor: "#f8fafc",
                      color: "#64748b",
                      border: "1px solid #e2e8f0",
                    }}
                  />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 800, color: tokens.textPrimary, lineHeight: 1.25 }}>
                  {viewingOrder.stationName}
                </Typography>
              </Box>
              <IconButton onClick={() => setViewingOrder(null)} sx={{ color: "#64748b" }}>
                <CloseRoundedIcon />
              </IconButton>
            </DialogTitle>

            <DialogContent sx={{ p: 3, pt: 1 }}>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                {/* Meta Summary Cards */}
                <Grid container spacing={1.5}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Box
                      sx={{
                        p: 1.75,
                        borderRadius: 2.5,
                        backgroundColor: "#f8fafc",
                        border: "1px solid #e2e8f0",
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                        <CalendarMonthRoundedIcon sx={{ fontSize: 18, color: "#059669" }} />
                        <Typography variant="caption" sx={{ fontWeight: 700, color: tokens.textMuted, textTransform: "uppercase" }}>
                          Scheduled Slot
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: tokens.textPrimary }}>
                        {viewingOrder.scheduledDate} · {viewingOrder.scheduledTime}
                      </Typography>
                      <Typography variant="caption" sx={{ color: tokens.textMuted }}>
                        Estimated Duration: {viewingOrder.estimatedHours} hrs
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Box
                      sx={{
                        p: 1.75,
                        borderRadius: 2.5,
                        backgroundColor: "#f8fafc",
                        border: "1px solid #e2e8f0",
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                        <EngineeringRoundedIcon sx={{ fontSize: 18, color: "#2563eb" }} />
                        <Typography variant="caption" sx={{ fontWeight: 700, color: tokens.textMuted, textTransform: "uppercase" }}>
                          Assigned Technician
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: tokens.textPrimary }}>
                        {viewingOrder.assignedTechnician}
                      </Typography>
                      <Typography variant="caption" sx={{ color: tokens.textMuted }}>
                        Sensor: {viewingOrder.sensorType}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                {/* Issue Diagnosis */}
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2.5,
                    backgroundColor: "#fef2f2",
                    border: "1px solid #fecaca",
                  }}
                >
                  <Typography variant="caption" sx={{ fontWeight: 700, color: "#b91c1c", textTransform: "uppercase", display: "block", mb: 0.5 }}>
                    Sensor Issue & Failure Diagnosis
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: "#7f1d1d", lineHeight: 1.5 }}>
                    {viewingOrder.issueDescription}
                  </Typography>
                </Box>

                {/* Action Required */}
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2.5,
                    backgroundColor: "#f0fdf4",
                    border: "1px solid #bbf7d0",
                  }}
                >
                  <Typography variant="caption" sx={{ fontWeight: 700, color: "#15803d", textTransform: "uppercase", display: "block", mb: 0.5 }}>
                    Recommended Action Required
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: "#14532d", lineHeight: 1.5 }}>
                    {viewingOrder.actionRequired}
                  </Typography>
                </Box>

                {/* Work Notes */}
                {viewingOrder.notes && (
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2.5,
                      backgroundColor: "#f8fafc",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    <Typography variant="caption" sx={{ fontWeight: 700, color: tokens.textMuted, textTransform: "uppercase", display: "block", mb: 0.5 }}>
                      Technician & Site Dispatch Notes
                    </Typography>
                    <Typography variant="body2" sx={{ color: tokens.textSecondary, fontStyle: "italic", lineHeight: 1.5 }}>
                      "{viewingOrder.notes}"
                    </Typography>
                  </Box>
                )}
              </Box>
            </DialogContent>

            <DialogActions sx={{ p: 3, pt: 1, gap: 1.5, justifyContent: "space-between" }}>
              <Button
                variant="outlined"
                color="error"
                startIcon={<CancelOutlinedIcon />}
                onClick={() => {
                  const target = viewingOrder;
                  setViewingOrder(null);
                  setCancellingOrder(target);
                }}
                sx={{
                  borderRadius: 2,
                  px: 2,
                  textTransform: "none",
                  fontWeight: 600,
                  borderColor: "#fecaca",
                  color: "#dc2626",
                  "&:hover": {
                    backgroundColor: "#fef2f2",
                    borderColor: "#dc2626",
                  },
                }}
              >
                Cancel Order
              </Button>

              <Box sx={{ display: "flex", gap: 1.5 }}>
                <Button
                  variant="outlined"
                  onClick={() => setViewingOrder(null)}
                  sx={{
                    borderRadius: 2,
                    px: 2.5,
                    textTransform: "none",
                    fontWeight: 600,
                    borderColor: "#cbd5e1",
                    color: tokens.textPrimary,
                  }}
                >
                  Close
                </Button>
                <Button
                  variant="contained"
                  startIcon={<EditCalendarRoundedIcon />}
                  onClick={() => {
                    const target = viewingOrder;
                    setViewingOrder(null);
                    handleOpenEdit(target);
                  }}
                  sx={{
                    borderRadius: 2,
                    px: 2.5,
                    textTransform: "none",
                    fontWeight: 600,
                    backgroundColor: tokens.primary,
                    color: "#0b1329",
                    "&:hover": { backgroundColor: tokens.primaryDark },
                  }}
                >
                  Reschedule
                </Button>
              </Box>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Modal 1: Modify Time / Reschedule Dialog */}
      <Dialog
        open={Boolean(editingOrder)}
        onClose={() => setEditingOrder(null)}
        maxWidth="sm"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: 4,
              backgroundColor: "#ffffff",
              border: "1px solid #e2e8f0",
              boxShadow: "0 24px 60px rgba(15, 23, 42, 0.18)",
            },
          },
        }}
      >
        {editingOrder && (
          <>
            <DialogTitle sx={{ p: 3, pb: 1, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Box>
                <Typography variant="caption" sx={{ color: tokens.textMuted, fontWeight: 600 }}>
                  Reschedule Work Order #{editingOrder.id}
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, color: tokens.textPrimary }}>
                  {editingOrder.stationName}
                </Typography>
              </Box>
              <IconButton onClick={() => setEditingOrder(null)} sx={{ color: "#64748b" }}>
                <CloseRoundedIcon />
              </IconButton>
            </DialogTitle>

            <DialogContent sx={{ p: 3, pt: 1.5 }}>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                {/* Date & Time Pickers */}
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="caption" sx={{ color: tokens.textMuted, fontWeight: 600, display: "block", mb: 0.75 }}>
                      Scheduled Date
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      type="date"
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                      sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5, backgroundColor: "#f8fafc" } }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="caption" sx={{ color: tokens.textMuted, fontWeight: 600, display: "block", mb: 0.75 }}>
                      Scheduled Time
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      type="time"
                      value={newTime}
                      onChange={(e) => setNewTime(e.target.value)}
                      sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5, backgroundColor: "#f8fafc" } }}
                    />
                  </Grid>
                </Grid>

                {/* Priority Selector */}
                <Box>
                  <Typography variant="caption" sx={{ color: tokens.textMuted, fontWeight: 600, display: "block", mb: 0.75 }}>
                    Dispatch Priority Level
                  </Typography>
                  <Select
                    fullWidth
                    size="small"
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as PriorityLevel)}
                    sx={{ borderRadius: 2.5, backgroundColor: "#f8fafc" }}
                  >
                    <MenuItem value="CRITICAL">P1 · Critical (Immediate Intervention)</MenuItem>
                    <MenuItem value="HIGH">P2 · High Priority (Advisory)</MenuItem>
                    <MenuItem value="ROUTINE">P3 · Routine Maintenance</MenuItem>
                  </Select>
                </Box>

                {/* Assigned Technician */}
                <Box>
                  <Typography variant="caption" sx={{ color: tokens.textMuted, fontWeight: 600, display: "block", mb: 0.75 }}>
                    Assigned Field Technician
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    value={newTech}
                    onChange={(e) => setNewTech(e.target.value)}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5, backgroundColor: "#f8fafc" } }}
                  />
                </Box>

                {/* Notes */}
                <Box>
                  <Typography variant="caption" sx={{ color: tokens.textMuted, fontWeight: 600, display: "block", mb: 0.75 }}>
                    Technician Work Notes
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    placeholder="Enter access codes, gate keys, or specific equipment instructions..."
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5, backgroundColor: "#f8fafc" } }}
                  />
                </Box>
              </Box>
            </DialogContent>

            <DialogActions sx={{ p: 3, pt: 1, gap: 1.5 }}>
              <Button
                variant="outlined"
                onClick={() => setEditingOrder(null)}
                sx={{
                  borderRadius: 2.5,
                  px: 2.5,
                  textTransform: "none",
                  fontWeight: 600,
                  borderColor: "#cbd5e1",
                  color: "#334155",
                }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handleSaveReschedule}
                sx={{
                  borderRadius: 2.5,
                  px: 3,
                  textTransform: "none",
                  fontWeight: 600,
                  backgroundColor: "#00dc82",
                  color: "#0b1329",
                  "&:hover": { backgroundColor: "#00c474" },
                }}
              >
                Save Schedule Changes
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Modal 2: Cancel Order Confirmation Dialog */}
      <Dialog
        open={Boolean(cancellingOrder)}
        onClose={() => setCancellingOrder(null)}
        maxWidth="xs"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: 4,
              backgroundColor: "#ffffff",
              border: "1px solid #e2e8f0",
              boxShadow: "0 24px 60px rgba(15, 23, 42, 0.18)",
            },
          },
        }}
      >
        {cancellingOrder && (
          <>
            <DialogTitle sx={{ p: 3, pb: 1, display: "flex", alignItems: "center", gap: 1.5 }}>
              <Box
                sx={{
                  width: 38,
                  height: 38,
                  borderRadius: 2,
                  backgroundColor: "#fee2e2",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#dc2626",
                }}
              >
                <CancelOutlinedIcon />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: tokens.textPrimary }}>
                Cancel Work Order?
              </Typography>
            </DialogTitle>

            <DialogContent sx={{ p: 3, pt: 1 }}>
              <Typography variant="body2" sx={{ color: tokens.textSecondary, mb: 1.5 }}>
                Are you sure you want to cancel work order <strong>{cancellingOrder.id}</strong> for{" "}
                <strong>{cancellingOrder.stationName}</strong>?
              </Typography>
              <Typography variant="caption" sx={{ color: tokens.textMuted, display: "block" }}>
                This will remove the appointment from the schedule and revert the sensor status in the fleet registry.
              </Typography>
            </DialogContent>

            <DialogActions sx={{ p: 3, pt: 1, gap: 1.5 }}>
              <Button
                variant="outlined"
                onClick={() => setCancellingOrder(null)}
                sx={{
                  borderRadius: 2.5,
                  px: 2.5,
                  textTransform: "none",
                  fontWeight: 600,
                  borderColor: "#cbd5e1",
                  color: "#334155",
                }}
              >
                Keep Order
              </Button>
              <Button
                variant="contained"
                color="error"
                onClick={handleConfirmCancel}
                sx={{
                  borderRadius: 2.5,
                  px: 3,
                  textTransform: "none",
                  fontWeight: 600,
                  backgroundColor: "#dc2626",
                  color: "#ffffff",
                  "&:hover": { backgroundColor: "#b91c1c" },
                }}
              >
                Yes, Cancel Order
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Modal 3: Create New Work Order Dialog */}
      <Dialog
        open={isCreatingOrder}
        onClose={() => setIsCreatingOrder(false)}
        maxWidth="sm"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: 4,
              backgroundColor: "#ffffff",
              border: "1px solid #e2e8f0",
              boxShadow: "0 24px 60px rgba(15, 23, 42, 0.18)",
            },
          },
        }}
      >
        <DialogTitle sx={{ p: 3, pb: 1, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Box>
            <Typography variant="caption" sx={{ color: tokens.textMuted, fontWeight: 600 }}>
              Debrecen Municipal Network
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, color: tokens.textPrimary }}>
              Schedule New Work Order
            </Typography>
          </Box>
          <IconButton onClick={() => setIsCreatingOrder(false)} sx={{ color: "#64748b" }}>
            <CloseRoundedIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 3, pt: 1.5 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            <Box>
              <Typography variant="caption" sx={{ color: tokens.textMuted, fontWeight: 600, display: "block", mb: 0.75 }}>
                Station Code
              </Typography>
              <TextField
                fullWidth
                size="small"
                value={createStationCode}
                onChange={(e) => setCreateStationCode(e.target.value)}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5, backgroundColor: "#f8fafc" } }}
              />
            </Box>

            <Box>
              <Typography variant="caption" sx={{ color: tokens.textMuted, fontWeight: 600, display: "block", mb: 0.75 }}>
                Station / Location Name
              </Typography>
              <TextField
                fullWidth
                size="small"
                value={createStationName}
                onChange={(e) => setCreateStationName(e.target.value)}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5, backgroundColor: "#f8fafc" } }}
              />
            </Box>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" sx={{ color: tokens.textMuted, fontWeight: 600, display: "block", mb: 0.75 }}>
                  Scheduled Date
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  value={createDate}
                  onChange={(e) => setCreateDate(e.target.value)}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5, backgroundColor: "#f8fafc" } }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" sx={{ color: tokens.textMuted, fontWeight: 600, display: "block", mb: 0.75 }}>
                  Scheduled Time
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  type="time"
                  value={createTime}
                  onChange={(e) => setCreateTime(e.target.value)}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5, backgroundColor: "#f8fafc" } }}
                />
              </Grid>
            </Grid>

            <Box>
              <Typography variant="caption" sx={{ color: tokens.textMuted, fontWeight: 600, display: "block", mb: 0.75 }}>
                Dispatch Priority Level
              </Typography>
              <Select
                fullWidth
                size="small"
                value={createPriority}
                onChange={(e) => setCreatePriority(e.target.value as PriorityLevel)}
                sx={{ borderRadius: 2.5, backgroundColor: "#f8fafc" }}
              >
                <MenuItem value="CRITICAL">P1 · Critical (Immediate)</MenuItem>
                <MenuItem value="HIGH">P2 · High Priority (Advisory)</MenuItem>
                <MenuItem value="ROUTINE">P3 · Routine Maintenance</MenuItem>
              </Select>
            </Box>

            <Box>
              <Typography variant="caption" sx={{ color: tokens.textMuted, fontWeight: 600, display: "block", mb: 0.75 }}>
                Assigned Technician
              </Typography>
              <TextField
                fullWidth
                size="small"
                value={createTech}
                onChange={(e) => setCreateTech(e.target.value)}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5, backgroundColor: "#f8fafc" } }}
              />
            </Box>

            <Box>
              <Typography variant="caption" sx={{ color: tokens.textMuted, fontWeight: 600, display: "block", mb: 0.75 }}>
                Reason & Description
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={2}
                value={createDesc}
                onChange={(e) => setCreateDesc(e.target.value)}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5, backgroundColor: "#f8fafc" } }}
              />
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 1, gap: 1.5 }}>
          <Button
            variant="outlined"
            onClick={() => setIsCreatingOrder(false)}
            sx={{
              borderRadius: 2.5,
              px: 2.5,
              textTransform: "none",
              fontWeight: 600,
              borderColor: "#cbd5e1",
              color: "#334155",
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleCreateOrder}
            sx={{
              borderRadius: 2.5,
              px: 3,
              textTransform: "none",
              fontWeight: 600,
              backgroundColor: "#00dc82",
              color: "#0b1329",
              "&:hover": { backgroundColor: "#00c474" },
            }}
          >
            Schedule Work Order
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
