import { useEffect, useMemo, useState } from "react";
import AddIcon from "@mui/icons-material/Add";
import AddBusinessIcon from "@mui/icons-material/AddBusiness";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteIcon from "@mui/icons-material/Delete";
import DownloadIcon from "@mui/icons-material/Download";
import EditLocationAltIcon from "@mui/icons-material/EditLocationAlt";
import RemoveIcon from "@mui/icons-material/Remove";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import SendIcon from "@mui/icons-material/Send";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import CloseIcon from "@mui/icons-material/Close";
import SensorsOutlinedIcon from "@mui/icons-material/SensorsOutlined";
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
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Select,
  Slider,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

import { useSimulation } from "../../context/SimulationContext";
import { getRecommendations } from "../../services/recommendationService";
import type { SensorRecommendation } from "../../types/recommendation";
import {
  PLANNING_PACKAGES,
  TIER_CONFIGS,
  type BudgetOptimizationResult,
  type BudgetPlanningPackage,
  type CustomTierSpecs,
  type OptimizationStrategy,
  type OptimizedStation,
  type PortfolioTradeoffComparison,
  type SensorTier,
  type TierConfig,
} from "../../types/budget";

export default function BudgetOptimizer() {
  const [budget, setBudget] = useState<number>(0);
  const [strategy, setStrategy] = useState<OptimizationStrategy>("balanced");
  const [result, setResult] = useState<BudgetOptimizationResult>({
    strategy: "balanced",
    totalBudget: 0,
    allocatedSpend: 0,
    remainingBudget: 0,
    budgetUtilizationPercent: 0,
    totalStations: 0,
    tierCounts: { air: 0, water: 0, noise: 0 },
    estimatedAnnualOm: 0,
    fiveYearTco: 0,
    costPerResident: 0,
    costPerKm2: 0,
    regulatoryComplianceScore: 0,
    calibrationRatio: "0:0:0",
    estimatedCoverageGainPercent: 0,
    meanConfidenceScore: 0,
    estimatedPopulationCovered: 0,
    allocatedStations: [],
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error] = useState<string>("");
  const [isDeployed, setIsDeployed] = useState<boolean>(false);

  // Directly editable string inputs for hardware tier cards
  const [tierInputValues, setTierInputValues] = useState<Record<SensorTier, string>>({
    air: "0",
    water: "0",
    noise: "0",
  });

  // Keep direct string inputs in sync whenever optimization result or tier counts update
  useEffect(() => {
    if (result?.tierCounts) {
      setTierInputValues({
        air: String(result.tierCounts.air ?? 0),
        water: String(result.tierCounts.water ?? 0),
        noise: String(result.tierCounts.noise ?? 0),
      });
    }
  }, [result?.tierCounts]);

  // Custom hardware tier values (unit costs, O&M, radius)
  const [customTierSpecs, setCustomTierSpecs] = useState<CustomTierSpecs>({
    air: {
      unitCost: TIER_CONFIGS.air.unitCost,
      annualOm: TIER_CONFIGS.air.annualOm,
      radiusKm: TIER_CONFIGS.air.radiusKm,
    },
    water: {
      unitCost: TIER_CONFIGS.water.unitCost,
      annualOm: TIER_CONFIGS.water.annualOm,
      radiusKm: TIER_CONFIGS.water.radiusKm,
    },
    noise: {
      unitCost: TIER_CONFIGS.noise.unitCost,
      annualOm: TIER_CONFIGS.noise.annualOm,
      radiusKm: TIER_CONFIGS.noise.radiusKm,
    },
  });

  // Tab mode:
  // 0 = Portfolio Optimizer
  const [activeTab, setActiveTab] = useState<number>(0);

  // Station roster filters & in-memory station overrides (for tier / position edits)
  const [tierFilter, setTierFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Notification toast
  const [toastMessage, setToastMessage] = useState<string>("");

  // Candidate pool for expanding suggested allocations
  const [candidatePool, setCandidatePool] = useState<SensorRecommendation[]>([]);
  const [selectedRosterStation, setSelectedRosterStation] = useState<OptimizedStation | null>(null);

  // Package customized recommended tiers
  const [packageTiers, setPackageTiers] = useState<
    Record<string, { air: number; water: number; noise: number }>
  >(() => {
    const initial: Record<string, { air: number; water: number; noise: number }> = {};
    PLANNING_PACKAGES.forEach((p) => {
      initial[p.id] = { ...p.recommendedTiers };
    });
    return initial;
  });

  useEffect(() => {
    let active = true;
    getRecommendations()
      .then((recs) => {
        if (active) setCandidatePool(recs);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const {
    deployOptimizedPlan,
    clearSimulation,
    simulatedStations,
    updateStationTier,
  } = useSimulation();

  // Synchronize budget and hardware fleet directly from chosen recommendations in SimulationContext
  useEffect(() => {
    // If no sensors are selected from recommendations, default strictly to zero
    if (simulatedStations.length === 0) {
      setResult({
        strategy,
        totalBudget: 0,
        allocatedSpend: 0,
        remainingBudget: 0,
        budgetUtilizationPercent: 0,
        totalStations: 0,
        tierCounts: { air: 0, water: 0, noise: 0 },
        estimatedAnnualOm: 0,
        fiveYearTco: 0,
        costPerResident: 0,
        costPerKm2: 0,
        regulatoryComplianceScore: 0,
        calibrationRatio: "0:0:0",
        estimatedCoverageGainPercent: 0,
        meanConfidenceScore: 0,
        estimatedPopulationCovered: 0,
        allocatedStations: [],
      });
      setBudget(0);
      setLoading(false);
      return;
    }

    // When sensors are chosen from sensor recommendations, show those specific budgets only
    const allocatedStations: OptimizedStation[] = simulatedStations.map((station) => {
      const tier: SensorTier = station.sensorTier || "air";
      const config = TIER_CONFIGS[tier] || TIER_CONFIGS.air;
      const unitCost = customTierSpecs[tier]?.unitCost ?? config.unitCost;
      const annualOm = customTierSpecs[tier]?.annualOm ?? config.annualOm;
      const radiusKm = customTierSpecs[tier]?.radiusKm ?? config.radiusKm;
      const confidenceRating = config.confidence;
      const rec = (station.recommendation || {}) as Partial<SensorRecommendation>;

      return {
        ...rec,
        id: station.id,
        lat: station.lat,
        lng: station.lng,
        nearestStation: rec.nearestStation || "Debrecen Mesh",
        distanceKm: rec.distanceKm ?? 1.2,
        recommendationType:
          rec.recommendationType ||
          (tier === "water" ? "water_sensor" : tier === "noise" ? "noise_sensor" : "air_sensor"),
        recommendedSensor: rec.recommendedSensor || config.name,
        primaryMonitoringNeed: rec.primaryMonitoringNeed || (tier as any),
        coverageScore: rec.coverageScore ?? 80,
        airCoverageScore: rec.airCoverageScore ?? 75,
        noiseCoverageScore: rec.noiseCoverageScore ?? 60,
        waterCoverageScore: rec.waterCoverageScore ?? 0,
        pm25Risk: rec.pm25Risk ?? 10,
        pm10Risk: rec.pm10Risk ?? 15,
        no2Risk: rec.no2Risk ?? 8,
        o3Risk: rec.o3Risk ?? 5,
        pm25VariabilityRisk: rec.pm25VariabilityRisk ?? 5,
        pm10VariabilityRisk: rec.pm10VariabilityRisk ?? 5,
        no2VariabilityRisk: rec.no2VariabilityRisk ?? 5,
        pollutionRisk: rec.pollutionRisk ?? 10,
        variabilityRisk: rec.variabilityRisk ?? 8,
        windRisk: rec.windRisk ?? 4,
        noiseRisk: rec.noiseRisk ?? 6,
        waterMonitoringPriority: rec.waterMonitoringPriority ?? 0,
        priorityScore: rec.priorityScore ?? 85,
        sensorTier: tier,
        tierName: config.name,
        tierBadge: config.badge,
        tierDescription: config.description || config.name,
        unitCost,
        annualOm,
        effectiveRadiusKm: radiusKm,
        confidenceRating,
        placementRationale:
          rec.placementRationale ||
          `Selected from sensor recommendations: ${config.name}.`,
        isSimulated: true,
        isCustomPin: Boolean(station.isCustom),
      } as unknown as OptimizedStation;
    });

    const airCount = allocatedStations.filter((s) => s.sensorTier === "air").length;
    const waterCount = allocatedStations.filter((s) => s.sensorTier === "water").length;
    const noiseCount = allocatedStations.filter((s) => s.sensorTier === "noise").length;

    const totalSpend = allocatedStations.reduce((sum, s) => sum + s.unitCost, 0);
    const totalOm = allocatedStations.reduce((sum, s) => sum + s.annualOm, 0);
    const fiveYearTco = totalSpend + 5 * totalOm;

    setResult({
      strategy,
      totalBudget: totalSpend,
      allocatedSpend: totalSpend,
      remainingBudget: 0,
      budgetUtilizationPercent: 100,
      totalStations: allocatedStations.length,
      tierCounts: { air: airCount, water: waterCount, noise: noiseCount },
      estimatedAnnualOm: totalOm,
      fiveYearTco,
      costPerResident: roundNum(totalSpend / 200000),
      costPerKm2: roundNum(totalSpend / 95),
      regulatoryComplianceScore: roundNum(Math.min(100, airCount * 30 + waterCount * 25 + noiseCount * 20)),
      calibrationRatio: `${airCount}:${waterCount}:${noiseCount}`,
      estimatedCoverageGainPercent: roundNum(Math.min(100, allocatedStations.length * 8)),
      meanConfidenceScore: 88,
      estimatedPopulationCovered: Math.min(200000, allocatedStations.length * 15000),
      allocatedStations,
    });
    setBudget(totalSpend);
    setLoading(false);
  }, [simulatedStations, customTierSpecs, strategy]);

  function handleDeploy() {
    if (!result || result.allocatedStations.length === 0) return;
    deployOptimizedPlan(result.allocatedStations);
    setIsDeployed(true);
    setToastMessage(`Deployed ${result.totalStations} stations to map! You can drag any marker on the map to reposition it.`);
  }

  function handleClear() {
    clearSimulation();
    setIsDeployed(false);
    setToastMessage("Simulation stations cleared from map.");
  }

  function handleApplyPackageSuggestion(pkg: BudgetPlanningPackage) {
    setBudget(pkg.budget);
    setStrategy(pkg.strategy);
    if (pkg.customSpecs) {
      setCustomTierSpecs((prev) => ({ ...prev, ...pkg.customSpecs }));
    }
    const currentPkgTiers = packageTiers[pkg.id] || pkg.recommendedTiers;
    setActiveTab(0);
    setToastMessage(
      `Applied package: "${pkg.title}" (€${pkg.budget.toLocaleString()}). Configured ${currentPkgTiers.air} Air, ${currentPkgTiers.water} Water, ${currentPkgTiers.noise} Noise.`,
    );
  }

  function handlePackageTierChange(
    pkgId: string,
    tier: SensorTier,
    delta: number,
  ) {
    setPackageTiers((prev) => {
      const current = prev[pkgId] || { air: 0, water: 0, noise: 0 };
      const currentVal = current[tier] || 0;
      const nextVal = Math.max(0, currentVal + delta);
      return {
        ...prev,
        [pkgId]: {
          ...current,
          [tier]: nextVal,
        },
      };
    });
  }

  function handlePackageTierSet(
    pkgId: string,
    tier: SensorTier,
    targetCount: number,
  ) {
    setPackageTiers((prev) => {
      const current = prev[pkgId] || { air: 0, water: 0, noise: 0 };
      const nextVal = Math.max(0, Math.floor(targetCount));
      return {
        ...prev,
        [pkgId]: {
          ...current,
          [tier]: nextVal,
        },
      };
    });
  }

  function handleApplyComparisonPathway(comp: PortfolioTradeoffComparison) {
    setStrategy(comp.strategy);
    setActiveTab(0);
    setToastMessage(`Switched strategy to "${comp.name}". Recalculating...`);
  }

  // Update a tier parameter in custom specs
  function handleUpdateTierParam(
    tier: SensorTier,
    param: "unitCost" | "annualOm" | "radiusKm",
    value: number,
  ) {
    setCustomTierSpecs((prev) => ({
      ...prev,
      [tier]: {
        ...prev[tier],
        [param]: value,
      },
    }));
  }

  // Reset tier parameters to defaults
  function handleResetTierDefaults() {
    setCustomTierSpecs({
      air: {
        unitCost: TIER_CONFIGS.air.unitCost,
        annualOm: TIER_CONFIGS.air.annualOm,
        radiusKm: TIER_CONFIGS.air.radiusKm,
      },
      water: {
        unitCost: TIER_CONFIGS.water.unitCost,
        annualOm: TIER_CONFIGS.water.annualOm,
        radiusKm: TIER_CONFIGS.water.radiusKm,
      },
      noise: {
        unitCost: TIER_CONFIGS.noise.unitCost,
        annualOm: TIER_CONFIGS.noise.annualOm,
        radiusKm: TIER_CONFIGS.noise.radiusKm,
      },
    });
    setToastMessage("Sensor type costs and radii reset to factory defaults.");
  }

  // In-roster tier switch for an individual station
  function handleStationTierChange(stationId: number, newTier: SensorTier) {
    if (!result) return;
    const tierConfig: TierConfig = {
      ...TIER_CONFIGS[newTier],
      unitCost: customTierSpecs[newTier]?.unitCost ?? TIER_CONFIGS[newTier].unitCost,
      annualOm: customTierSpecs[newTier]?.annualOm ?? TIER_CONFIGS[newTier].annualOm,
      radiusKm: customTierSpecs[newTier]?.radiusKm ?? TIER_CONFIGS[newTier].radiusKm,
    };

    // Update locally in result
    setResult((prev) => {
      if (!prev) return prev;
      const updatedStations = prev.allocatedStations.map((st) => {
        if (st.id !== stationId) return st;
        return {
          ...st,
          sensorTier: newTier,
          tierName: tierConfig.name,
          tierBadge: tierConfig.badge,
          unitCost: tierConfig.unitCost,
          annualOm: tierConfig.annualOm,
          effectiveRadiusKm: tierConfig.radiusKm,
          confidenceRating: tierConfig.confidence,
        };
      });

      const newSpent = updatedStations.reduce((sum, s) => sum + s.unitCost, 0);
      const newOm = updatedStations.reduce((sum, s) => sum + s.annualOm, 0);

      const airCount = updatedStations.filter((s) => s.sensorTier === "air").length;
      const waterCount = updatedStations.filter((s) => s.sensorTier === "water").length;
      const noiseCount = updatedStations.filter((s) => s.sensorTier === "noise").length;

      return {
        ...prev,
        allocatedStations: updatedStations,
        allocatedSpend: newSpent,
        remainingBudget: Math.max(0, prev.totalBudget - newSpent),
        budgetUtilizationPercent: roundNum((newSpent / prev.totalBudget) * 100),
        estimatedAnnualOm: newOm,
        fiveYearTco: newSpent + 5 * newOm,
        tierCounts: { air: airCount, water: waterCount, noise: noiseCount },
      };
    });

    // Also update in simulation context if live
    updateStationTier(stationId, newTier, tierConfig);
    setToastMessage(`Station #${stationId} converted to ${tierConfig.name}.`);
  }

  // Synchronize and recompute result whenever suggested allocation is adjusted
  function applyUpdatedStations(
    updatedStations: OptimizedStation[],
    message?: string,
  ) {
    if (!result) return;
    const newSpent = updatedStations.reduce((sum, s) => sum + s.unitCost, 0);
    const newOm = updatedStations.reduce((sum, s) => sum + s.annualOm, 0);

    const airCount = updatedStations.filter((s) => s.sensorTier === "air").length;
    const waterCount = updatedStations.filter((s) => s.sensorTier === "water").length;
    const noiseCount = updatedStations.filter((s) => s.sensorTier === "noise").length;

    setResult((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        allocatedStations: updatedStations,
        allocatedSpend: newSpent,
        remainingBudget: Math.max(0, prev.totalBudget - newSpent),
        budgetUtilizationPercent: roundNum((newSpent / prev.totalBudget) * 100),
        estimatedAnnualOm: newOm,
        fiveYearTco: newSpent + 5 * newOm,
        totalStations: updatedStations.length,
        tierCounts: { air: airCount, water: waterCount, noise: noiseCount },
      };
    });

    if (isDeployed || simulatedStations.some((s) => !s.isCustom)) {
      deployOptimizedPlan(updatedStations);
    }

    if (message) {
      setToastMessage(message);
    }
  }

  // Directly set quantity of suggested stations for a specific tier to any number
  function handleSetTierCount(tier: SensorTier, targetCount: number) {
    if (!result) return;
    const clampedTarget = Math.max(0, Math.min(150, Math.floor(targetCount)));
    const stationsInTier = result.allocatedStations.filter(
      (s) => s.sensorTier === tier,
    );
    const currentCount = stationsInTier.length;

    if (clampedTarget === currentCount) return;

    if (clampedTarget < currentCount) {
      // Remove (currentCount - clampedTarget) stations, starting from lowest priority
      const removeCount = currentCount - clampedTarget;
      const sortedByPriority = [...stationsInTier].sort(
        (a, b) => a.priorityScore - b.priorityScore,
      );
      const idsToRemove = new Set(
        sortedByPriority.slice(0, removeCount).map((s) => s.id),
      );
      const updatedStations = result.allocatedStations.filter(
        (s) => !idsToRemove.has(s.id),
      );
      applyUpdatedStations(
        updatedStations,
        `Adjusted ${TIER_CONFIGS[tier].name} to ${clampedTarget} units.`,
      );
    } else {
      // Add (clampedTarget - currentCount) stations
      const addCount = clampedTarget - currentCount;
      const config = TIER_CONFIGS[tier];
      const unitCost = customTierSpecs[tier]?.unitCost ?? config.unitCost;
      const annualOm = customTierSpecs[tier]?.annualOm ?? config.annualOm;
      const radiusKm = customTierSpecs[tier]?.radiusKm ?? config.radiusKm;
      const confidenceRating =
        customTierSpecs[tier]?.confidence ?? config.confidence;

      const allocatedIds = new Set(result.allocatedStations.map((s) => s.id));
      const availableCandidates = candidatePool.filter(
        (c) => !allocatedIds.has(c.id),
      );

      const stationsToAdd: OptimizedStation[] = [];
      for (let i = 0; i < addCount; i++) {
        let candidate = availableCandidates[i];
        if (!candidate) {
          const base = result.allocatedStations[0] || candidatePool[0];
          const pseudoId = 9100 + result.allocatedStations.length + i + 1;
          candidate = {
            ...base,
            id: pseudoId,
            lat: 47.5316 + Math.sin(pseudoId * 1.7) * 0.035,
            lng: 21.6273 + Math.cos(pseudoId * 1.7) * 0.045,
            priorityScore: Math.max(40, 78 - i * 2),
            primaryMonitoringNeed: "air",
          };
        }

        stationsToAdd.push({
          ...candidate,
          sensorTier: tier,
          tierName: config.name,
          tierBadge: config.badge,
          unitCost,
          annualOm,
          effectiveRadiusKm: radiusKm,
          confidenceRating,
          placementRationale: `Direct municipal allocation: Assigned ${config.name} for ${candidate.primaryMonitoringNeed || "coverage expansion"}.`,
          tierDescription: config.description,
        });
      }

      const updatedStations = [...result.allocatedStations, ...stationsToAdd];
      applyUpdatedStations(
        updatedStations,
        `Adjusted ${config.name} to ${clampedTarget} units.`,
      );
    }
  }

  // Remove one suggested station from a specific tier (e.g., from 3 meshes to 2 meshes)
  function handleRemoveStationFromTier(tier: SensorTier) {
    if (!result) return;
    const current = result.tierCounts[tier] || 0;
    handleSetTierCount(tier, Math.max(0, current - 1));
  }

  // Add one station to a specific tier in suggestions
  function handleAddStationToTier(tier: SensorTier) {
    if (!result) return;
    const current = result.tierCounts[tier] || 0;
    handleSetTierCount(tier, current + 1);
  }

  // Remove individual station by ID from allocation roster
  function handleRemoveIndividualStation(stationId: number) {
    if (!result) return;
    const target = result.allocatedStations.find((s) => s.id === stationId);
    const updated = result.allocatedStations.filter((s) => s.id !== stationId);
    applyUpdatedStations(
      updated,
      `Removed station #${stationId} (${target?.tierName || "station"}) from allocation roster.`,
    );
  }

  // Helper rounding
  function roundNum(num: number) {
    return Math.round(num * 10) / 10;
  }

  // Filter allocated stations for roster view
  const filteredStations = useMemo(() => {
    if (!result) return [];
    return result.allocatedStations.filter((st) => {
      const matchesTier = tierFilter === "all" || st.sensorTier === tierFilter;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        st.id.toString().includes(q) ||
        st.tierName.toLowerCase().includes(q) ||
        st.primaryMonitoringNeed.toLowerCase().includes(q) ||
        st.placementRationale.toLowerCase().includes(q);
      return matchesTier && matchesSearch;
    });
  }, [result, tierFilter, searchQuery]);

  // Export CSV Handler
  function handleDownloadCsv() {
    if (!result || result.allocatedStations.length === 0) return;
    const headers = [
      "Station ID",
      "Tier",
      "Unit Cost (€)",
      "Annual O&M (€)",
      "5-Year TCO (€)",
      "Latitude",
      "Longitude",
      "Primary Need",
      "Priority Score",
      "Confidence (%)",
      "Placement Rationale",
    ];
    const rows = result.allocatedStations.map((s) => [
      s.id,
      s.tierName,
      s.unitCost,
      s.annualOm,
      s.unitCost + 5 * s.annualOm,
      s.lat.toFixed(5),
      s.lng.toFixed(5),
      s.primaryMonitoringNeed,
      s.priorityScore,
      s.confidenceRating,
      `"${s.placementRationale.replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Debrecen_Sensor_Allocation_${strategy}_${budget}EUR.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setToastMessage("Procurement roster CSV downloaded.");
  }

  // Export JSON Handler
  function handleDownloadJson() {
    if (!result) return;
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(result, null, 2));
    const link = document.createElement("a");
    link.setAttribute("href", dataStr);
    link.setAttribute(
      "download",
      `Debrecen_Sensor_Portfolio_${strategy}_${budget}EUR.json`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setToastMessage("Technical specification JSON downloaded.");
  }

  // Copy Executive Summary
  function handleCopySummary() {
    if (!result) return;
    const text = `GREENMIND AI - MUNICIPAL SENSOR INVESTMENT DOSSIER
City: Debrecen, Hungary
Capital Budget: €${budget.toLocaleString()}
Selected Strategy: ${strategy.toUpperCase()} (${result.name || "Optimal Hybrid"})
Total Stations Allocated: ${result.totalStations}
- Air Quality Sensors: ${result.tierCounts.air}
- Water Quality Sensors: ${result.tierCounts.water}
- Noise Pollution Sensors: ${result.tierCounts.noise}

ECONOMIC & LIFECYCLE BREAKDOWN:
- Upfront CapEx Spend: €${result.allocatedSpend.toLocaleString()}
- Annual O&M Maintenance: €${result.estimatedAnnualOm.toLocaleString()}/yr
- 5-Year Total Cost of Ownership (TCO): €${result.fiveYearTco.toLocaleString()}
- Budget Utilization: ${result.budgetUtilizationPercent}%

URBAN & CITIZEN PROTECTION IMPACT:
- Estimated Citywide Coverage Gain: +${result.estimatedCoverageGainPercent}%
- Estimated Population Protected: ~${result.estimatedPopulationCovered.toLocaleString()} citizens
- Cost Per Resident Protected: €${result.costPerResident}/citizen
- Mean Sensor Confidence Score: ${result.meanConfidenceScore}%
- EU Clean Air Directive Compliance Readiness: ${result.regulatoryComplianceScore}/100
- Calibration Anchor Ratio: ${result.calibrationRatio}
`;
    navigator.clipboard.writeText(text);
    setToastMessage("Council briefing summary copied to clipboard!");
  }

  const activeDeployedCount = simulatedStations.filter((s) => !s.isCustom).length;

  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 3.5,
        mb: 3,
        borderColor: "rgba(15, 118, 110, 0.2)",
        backgroundColor: "#ffffff",
        boxShadow: "none",
        overflow: "hidden",
      }}
    >
      <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* TAB 0: PORTFOLIO OPTIMIZER */}
        {activeTab === 0 && (
          <>
            {loading && (
              <Box sx={{ py: 4, textAlign: "center" }}>
                <CircularProgress size={32} sx={{ color: "#0f766e", mb: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Calculating hardware allocation...
                </Typography>
              </Box>
            )}

            {/* Results Section */}
            {!loading && result && (
              <>
                {/* Selected Hardware Tier Allocation Cards */}
                <Box
                  sx={{
                    mb: 2,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 1.5,
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 600, color: "#1e293b" }}
                  >
                    Hardware Fleet Allocation
                  </Typography>
                  <Chip
                    label={`${result.totalStations} Stations Allocated · €${result.allocatedSpend.toLocaleString()}`}
                    size="small"
                    sx={{
                      fontWeight: 600,
                      fontSize: "0.75rem",
                      backgroundColor: "#ecfdf5",
                      color: "#065f46",
                      border: "1px solid #a7f3d0",
                    }}
                  />
                </Box>

                <Grid container spacing={2} sx={{ mb: 3 }}>
                  {(["air", "water", "noise"] as SensorTier[]).map((tierKey) => {
                    const config = TIER_CONFIGS[tierKey];
                    const custom = customTierSpecs[tierKey];
                    const unitCost = custom?.unitCost ?? config.unitCost;
                    const annualOm = custom?.annualOm ?? config.annualOm;
                    const radiusKm = custom?.radiusKm ?? config.radiusKm;
                    const count = result.tierCounts[tierKey] || 0;
                    const subtotal = count * unitCost;

                    return (
                      <Grid size={{ xs: 12, md: 4 }} key={tierKey}>
                        <Paper
                          elevation={0}
                          sx={{
                            p: 2,
                            borderRadius: 2.5,
                            backgroundColor: config.bgColor,
                            border: `1.5px solid ${config.borderColor}`,
                            height: "100%",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "space-between",
                            transition: "all 0.2s ease",
                            "&:hover": {
                              boxShadow: "none",
                            },
                          }}
                        >
                          <Box>
                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                mb: 1.25,
                              }}
                            >
                              <Chip
                                size="small"
                                label={config.badge}
                                sx={{
                                  backgroundColor: config.color,
                                  color: "#ffffff",
                                  fontWeight: 600,
                                  fontSize: "0.72rem",
                                }}
                              />

                              {/* Interactive Stepper: [-] [directly editable quantity] [+] */}
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 0.5,
                                  backgroundColor: "#ffffff",
                                  px: 0.75,
                                  py: 0.25,
                                  borderRadius: 2,
                                  border: `1.5px solid ${config.borderColor}`,
                                  boxShadow: "none",
                                  transition: "border-color 0.2s ease, box-shadow 0.2s ease",
                                  "&:focus-within": {
                                    borderColor: config.color,
                                    boxShadow: `0 0 0 2px ${config.color}33`,
                                  },
                                }}
                              >
                                <Tooltip
                                  title={`Remove 1 ${config.name} from suggestions`}
                                  arrow
                                >
                                  <span>
                                    <IconButton
                                      size="small"
                                      disabled={count <= 0}
                                      onClick={() => handleRemoveStationFromTier(tierKey)}
                                      sx={{
                                        p: 0.5,
                                        color: config.color,
                                        "&:hover": { backgroundColor: `${config.borderColor}25` },
                                        "&.Mui-disabled": { opacity: 0.3 },
                                      }}
                                    >
                                      <RemoveIcon sx={{ fontSize: 16 }} />
                                    </IconButton>
                                  </span>
                                </Tooltip>

                                <Box
                                  component="input"
                                  type="text"
                                  inputMode="numeric"
                                  pattern="[0-9]*"
                                  value={tierInputValues[tierKey] ?? String(count)}
                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                    const raw = e.target.value;
                                    // Accept only digits or empty string while editing
                                    if (raw === "" || /^\d+$/.test(raw)) {
                                      setTierInputValues((prev) => ({ ...prev, [tierKey]: raw }));
                                      if (raw !== "") {
                                        const parsed = parseInt(raw, 10);
                                        if (!isNaN(parsed) && parsed >= 0) {
                                          handleSetTierCount(tierKey, parsed);
                                        }
                                      }
                                    }
                                  }}
                                  onBlur={() => {
                                    const currentVal = tierInputValues[tierKey];
                                    if (currentVal === "" || isNaN(parseInt(currentVal, 10))) {
                                      setTierInputValues((prev) => ({ ...prev, [tierKey]: String(count) }));
                                      handleSetTierCount(tierKey, count);
                                    } else {
                                      const parsed = Math.max(0, parseInt(currentVal, 10));
                                      setTierInputValues((prev) => ({ ...prev, [tierKey]: String(parsed) }));
                                      handleSetTierCount(tierKey, parsed);
                                    }
                                  }}
                                  onFocus={(e: React.FocusEvent<HTMLInputElement>) => {
                                    e.target.select();
                                  }}
                                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                                    if (e.key === "Enter") {
                                      (e.target as HTMLInputElement).blur();
                                    }
                                  }}
                                  aria-label={`${config.name} quantity`}
                                  title="Click to directly type quantity"
                                  sx={{
                                    width: 44,
                                    minWidth: 36,
                                    textAlign: "center",
                                    fontWeight: 700,
                                    color: config.color,
                                    fontFamily: "inherit",
                                    fontSize: "1.05rem",
                                    border: "none",
                                    outline: "none",
                                    backgroundColor: "transparent",
                                    p: "2px 0",
                                    m: 0,
                                    borderRadius: 1,
                                    transition: "background-color 0.15s ease",
                                    "&:hover": {
                                      backgroundColor: `${config.borderColor}15`,
                                    },
                                    "&:focus": {
                                      backgroundColor: `${config.borderColor}25`,
                                    },
                                    "&::-webkit-outer-spin-button, &::-webkit-inner-spin-button": {
                                      WebkitAppearance: "none",
                                      margin: 0,
                                    },
                                    MozAppearance: "textfield",
                                    cursor: "text",
                                  }}
                                />

                                <Tooltip
                                  title={`Add 1 ${config.name} to suggestions`}
                                  arrow
                                >
                                  <IconButton
                                    size="small"
                                    onClick={() => handleAddStationToTier(tierKey)}
                                    sx={{
                                      p: 0.5,
                                      color: config.color,
                                      "&:hover": { backgroundColor: `${config.borderColor}25` },
                                    }}
                                  >
                                    <AddIcon sx={{ fontSize: 16 }} />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            </Box>

                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 600, color: "#1e293b" }}
                            >
                              {config.name}
                            </Typography>


                          </Box>

                          <Box sx={{ mt: 1.5 }}>
                            <Divider sx={{ mb: 1.25, borderColor: `${config.borderColor}55` }} />

                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                              }}
                            >
                              <Typography variant="caption" color="text.secondary">
                                Unit: €{unitCost.toLocaleString()} · Radius: {radiusKm} km · O&M: €{annualOm}/yr
                              </Typography>
                              <Typography
                                variant="caption"
                                sx={{
                                  fontWeight: 600,
                                  color: config.color,
                                  fontFamily: "inherit",
                                }}
                              >
                                Subtotal: €{subtotal.toLocaleString()}
                              </Typography>
                            </Box>
                          </Box>
                        </Paper>
                      </Grid>
                    );
                  })}
                </Grid>

                {/* Action Bar: Deploy / Clear Simulation & Map Reposition Guidance */}
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    borderRadius: 2.5,
                    backgroundColor: "#f8fafc",
                    border: "1px solid #cbd5e1",
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 2,
                    mb: 3,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <SendIcon sx={{ color: "#0f766e" }} />
                    <Box>
                      <Typography
                        variant="subtitle2"
                        sx={{ fontWeight: 600, color: "#0f172a" }}
                      >
                        Synchronize With City Map (Repositionable Sensors)
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Deploy this {result.totalStations}-station multi-tier portfolio to the live map.
                        <strong> You can drag & drop any station marker on the map to test new positions!</strong>
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: "flex", gap: 1.5 }}>
                    {activeDeployedCount > 0 && (
                      <Button
                        variant="outlined"
                        color="inherit"
                        size="small"
                        startIcon={<DeleteIcon />}
                        onClick={handleClear}
                        sx={{
                          textTransform: "none",
                          fontWeight: 600,
                          borderColor: "#cbd5e1",
                        }}
                      >
                        Clear Simulation
                      </Button>
                    )}

                    <Button
                      variant="contained"
                      size="small"
                      disabled={result.totalStations === 0}
                      startIcon={
                        isDeployed ? (
                          <CheckCircleIcon />
                        ) : (
                          <AddBusinessIcon />
                        )
                      }
                      onClick={handleDeploy}
                      sx={{
                        textTransform: "none",
                        fontWeight: 600,
                        px: 2.5,
                        backgroundColor: isDeployed ? "#059669" : "#0f766e",
                        "&:hover": {
                          backgroundColor: isDeployed ? "#047857" : "#115e59",
                        },
                      }}
                    >
                      {isDeployed
                        ? `Plan Deployed (${result.totalStations} Stations Live · Draggable on Map)`
                        : `Deploy Plan to Live Map (${result.totalStations} Stations)`}
                    </Button>
                  </Box>
                </Paper>

                {/* Allocated Station Roster Controls & Interactive Table */}
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 1.5,
                    mb: 1.5,
                  }}
                >
                  <Box>
                    <Typography
                      variant="subtitle2"
                      sx={{ fontWeight: 600, color: "#1e293b" }}
                    >
                      Allocated Stations Roster ({filteredStations.length} of{" "}
                      {result.allocatedStations.length} Shown)
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      You can change any station’s tier directly below or drag markers on the map.
                    </Typography>
                  </Box>

                  <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                    <TextField
                      size="small"
                      placeholder="Search roster..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      sx={{
                        width: 180,
                        "& .MuiInputBase-input": {
                          fontSize: "0.8rem",
                          py: 0.5,
                        },
                      }}
                    />

                    <Box sx={{ display: "flex", gap: 0.5 }}>
                      {[
                        { label: "All", value: "all" },
                        { label: "Air", value: "air" },
                        { label: "Water", value: "water" },
                        { label: "Noise", value: "noise" },
                      ].map((t) => (
                        <Chip
                          key={t.value}
                          label={t.label}
                          size="small"
                          clickable
                          onClick={() => setTierFilter(t.value)}
                          sx={{
                            fontWeight: 600,
                            fontSize: "0.72rem",
                            backgroundColor:
                              tierFilter === t.value ? "#0f766e" : "#f1f5f9",
                            color: tierFilter === t.value ? "#ffffff" : "#475569",
                          }}
                        />
                      ))}
                    </Box>
                  </Box>
                </Box>

                <TableContainer
                  component={Paper}
                  elevation={0}
                  sx={{
                    borderRadius: 2.5,
                    border: "1px solid #e2e8f0",
                    maxHeight: 380,
                  }}
                >
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: "#f8fafc" }}>
                        <TableCell sx={{ fontWeight: 600, fontSize: "0.75rem" }}>
                          Rank / ID
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: "0.75rem" }}>
                          Hardware Classification (Change Tier)
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: "0.75rem" }}>
                          Coordinates (GPS)
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: "0.75rem" }}>
                          Unit CapEx
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: "0.75rem" }}>
                          Annual O&M
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: "0.75rem" }}>
                          Target Need
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: "0.75rem" }}>
                          Placement Rationale
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{ fontWeight: 600, fontSize: "0.75rem" }}
                        >
                          Priority
                        </TableCell>
                        <TableCell
                          align="center"
                          sx={{ fontWeight: 600, fontSize: "0.75rem" }}
                        >
                          Action
                        </TableCell>
                      </TableRow>
                    </TableHead>

                    <TableBody>
                      {filteredStations.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={9} align="center" sx={{ py: 4, color: "text.secondary" }}>
                            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.75 }}>
                              <SensorsOutlinedIcon sx={{ fontSize: 32, color: "#94a3b8" }} />
                              <Typography variant="body2" sx={{ fontWeight: 600, color: "#475569" }}>
                                No sensors selected yet
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Select and simulate sensors from AI Recommendations, or use the steppers above to allocate hardware.
                              </Typography>
                            </Box>
                          </TableCell>
                        </TableRow>
                      )}
                      {filteredStations.map((station, index) => {
                        const tierConfig = TIER_CONFIGS[station.sensorTier];

                        return (
                          <TableRow
                            key={station.id}
                            hover
                            sx={{
                              "&:last-child td, &:last-child th": { border: 0 },
                            }}
                          >
                            <TableCell sx={{ fontWeight: 600, fontSize: "0.78rem" }}>
                              #{index + 1} ({station.id})
                            </TableCell>

                            {/* Inline Tier Selector */}
                            <TableCell>
                              <Select
                                size="small"
                                value={station.sensorTier}
                                onChange={(e) =>
                                  handleStationTierChange(
                                    station.id,
                                    e.target.value as SensorTier,
                                  )
                                }
                                sx={{
                                  fontSize: "0.75rem",
                                  fontWeight: 600,
                                  height: 28,
                                  backgroundColor: tierConfig.bgColor,
                                  color: tierConfig.color,
                                  "& .MuiOutlinedInput-notchedOutline": {
                                    borderColor: tierConfig.borderColor,
                                  },
                                }}
                              >
                                <MenuItem value="air" sx={{ fontSize: "0.75rem", fontWeight: 600 }}>
                                  Air Quality (€{customTierSpecs.air?.unitCost ?? 4500})
                                </MenuItem>
                                <MenuItem value="water" sx={{ fontSize: "0.75rem", fontWeight: 600 }}>
                                  Water Quality (€{customTierSpecs.water?.unitCost ?? 6200})
                                </MenuItem>
                                <MenuItem value="noise" sx={{ fontSize: "0.75rem", fontWeight: 600 }}>
                                  Noise Sensor (€{customTierSpecs.noise?.unitCost ?? 2800})
                                </MenuItem>
                              </Select>
                            </TableCell>

                            <TableCell sx={{ fontSize: "0.75rem", fontFamily: "inherit" }}>
                              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                                <span>{(Number(station.lat) || 0).toFixed(4)}, {(Number(station.lng) || 0).toFixed(4)}</span>
                                <Tooltip title="Draggable on map: Drag this marker on the map to test new positions" arrow>
                                  <EditLocationAltIcon sx={{ fontSize: 16, color: "#0f766e" }} />
                                </Tooltip>
                              </Box>
                            </TableCell>

                            <TableCell
                              sx={{
                                fontSize: "0.78rem",
                                fontWeight: 600,
                                fontFamily: "inherit",
                              }}
                            >
                              €{station.unitCost.toLocaleString()}
                            </TableCell>

                            <TableCell
                              sx={{
                                fontSize: "0.78rem",
                                color: "#64748b",
                                fontFamily: "inherit",
                              }}
                            >
                              €{station.annualOm.toLocaleString()}
                            </TableCell>

                            <TableCell sx={{ textTransform: "capitalize", fontSize: "0.78rem" }}>
                              {station.primaryMonitoringNeed}
                            </TableCell>

                            <TableCell
                              sx={{
                                fontSize: "0.75rem",
                                color: "#475569",
                                maxWidth: 280,
                              }}
                            >
                              <Tooltip title={station.tierDescription} arrow>
                                <span>{station.placementRationale}</span>
                              </Tooltip>
                            </TableCell>

                            <TableCell
                              align="right"
                              sx={{
                                fontWeight: 600,
                                fontSize: "0.78rem",
                                color: "#0f766e",
                              }}
                            >
                              {station.priorityScore}/100
                              {station.informationGainScore !== undefined && (
                                <Typography
                                  variant="caption"
                                  sx={{
                                    display: "block",
                                    color: "#0284c7",
                                    fontWeight: 600,
                                    fontSize: "0.7rem",
                                  }}
                                >
                                  IG: {station.informationGainScore}%
                                </Typography>
                              )}
                            </TableCell>

                            <TableCell align="center">
                              <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                                <Tooltip title={`View full sensor details for station #${station.id}`} arrow>
                                  <IconButton
                                    size="small"
                                    onClick={() => setSelectedRosterStation(station)}
                                    sx={{
                                      color: "#0f766e",
                                      p: 0.5,
                                      mr: 0.5,
                                      "&:hover": { backgroundColor: "#f0fdfa" },
                                    }}
                                  >
                                    <VisibilityOutlinedIcon sx={{ fontSize: 18 }} />
                                  </IconButton>
                                </Tooltip>

                                <Tooltip title={`Remove station #${station.id} from suggestions`} arrow>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleRemoveIndividualStation(station.id)}
                                    sx={{
                                      color: "#ef4444",
                                      p: 0.5,
                                      "&:hover": { backgroundColor: "#fee2e2" },
                                    }}
                                  >
                                    <DeleteIcon sx={{ fontSize: 18 }} />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* Selected Roster Station Details Modal */}
                <Dialog
                  open={Boolean(selectedRosterStation)}
                  onClose={() => setSelectedRosterStation(null)}
                  maxWidth="sm"
                  fullWidth
                  slotProps={{ paper: { sx: { borderRadius: 3, p: 1 } } }}
                >
                  {selectedRosterStation && (
                    <>
                      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", pb: 1 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <SensorsOutlinedIcon sx={{ color: "#0f766e" }} />
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            Sensor #{selectedRosterStation.id} ({selectedRosterStation.tierName})
                          </Typography>
                        </Box>
                        <IconButton size="small" onClick={() => setSelectedRosterStation(null)}>
                          <CloseIcon />
                        </IconButton>
                      </DialogTitle>

                      <DialogContent dividers sx={{ py: 2 }}>
                        <Box sx={{ p: 1.5, mb: 2, borderRadius: 2, backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                          <Typography variant="caption" sx={{ fontWeight: 600, color: "#166534", textTransform: "uppercase" }}>
                            Placement Rationale
                          </Typography>
                          <Typography variant="body2" sx={{ color: "#14532d", fontWeight: 600, mt: 0.25 }}>
                            {selectedRosterStation.placementRationale}
                          </Typography>
                        </Box>

                        <Grid container spacing={1.5}>
                          <Grid size={{ xs: 6 }}>
                            <Box sx={{ p: 1.25, borderRadius: 2, bgcolor: "#f8fafc", border: "1px solid #e2e8f0" }}>
                              <Typography variant="caption" color="text.secondary">Hardware Tier</Typography>
                              <Typography variant="body2" sx={{ fontWeight: 600, color: "#0f766e" }}>
                                {selectedRosterStation.tierBadge}
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid size={{ xs: 6 }}>
                            <Box sx={{ p: 1.25, borderRadius: 2, bgcolor: "#f8fafc", border: "1px solid #e2e8f0" }}>
                              <Typography variant="caption" color="text.secondary">CapEx / Annual O&M</Typography>
                              <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: "inherit" }}>
                                €{selectedRosterStation.unitCost.toLocaleString()} / €{selectedRosterStation.annualOm.toLocaleString()}/yr
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid size={{ xs: 6 }}>
                            <Box sx={{ p: 1.25, borderRadius: 2, bgcolor: "#f8fafc", border: "1px solid #e2e8f0" }}>
                              <Typography variant="caption" color="text.secondary">Estimated PM2.5</Typography>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {selectedRosterStation.estimatedPm25 != null ? `${Number(selectedRosterStation.estimatedPm25).toFixed(1)} µg/m³` : "5.1 µg/m³"}
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid size={{ xs: 6 }}>
                            <Box sx={{ p: 1.25, borderRadius: 2, bgcolor: "#f8fafc", border: "1px solid #e2e8f0" }}>
                              <Typography variant="caption" color="text.secondary">Coverage Radius</Typography>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {selectedRosterStation.effectiveRadiusKm || 1.5} km
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid size={{ xs: 6 }}>
                            <Box sx={{ p: 1.25, borderRadius: 2, bgcolor: "#f8fafc", border: "1px solid #e2e8f0" }}>
                              <Typography variant="caption" color="text.secondary">Coordinates</Typography>
                              <Typography variant="caption" sx={{ fontWeight: 600, display: "block", fontFamily: "inherit" }}>
                                {(Number(selectedRosterStation.lat) || 0).toFixed(4)}, {(Number(selectedRosterStation.lng) || 0).toFixed(4)}
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid size={{ xs: 6 }}>
                            <Box sx={{ p: 1.25, borderRadius: 2, bgcolor: "#f8fafc", border: "1px solid #e2e8f0" }}>
                              <Typography variant="caption" color="text.secondary">Nearest Station</Typography>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {selectedRosterStation.nearestStation || "Debrecen Active Mesh"}
                              </Typography>
                            </Box>
                          </Grid>
                        </Grid>
                      </DialogContent>

                      <DialogActions sx={{ p: 1.5 }}>
                        <Button onClick={() => setSelectedRosterStation(null)} sx={{ textTransform: "none", fontWeight: 600 }}>
                          Close
                        </Button>
                      </DialogActions>
                    </>
                  )}
                </Dialog>
              </>
            )}
          </>
        )}

        {/* TAB 1: AI STRATEGIC PLANNING PACKAGES & SUGGESTIONS */}
        {activeTab === 1 && (
          <Box>
            <Box sx={{ mb: 3 }}>
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 600, color: "#0f172a" }}
              >
                AI Municipal Planning Packages & Curated Suggestions
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Select from 5 strategic municipal investment blueprints designed for Debrecen’s
                urban topography, vulnerable schools, industrial corridors, and transit routes.
                Clicking any package instantly pre-configures your budget, strategy, and tier composition.
              </Typography>
            </Box>

            <Grid container spacing={2.5}>
              {PLANNING_PACKAGES.map((pkg) => (
                <Grid size={{ xs: 12, md: 6, lg: 4 }} key={pkg.id}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2.5,
                      borderRadius: 3,
                      backgroundColor: "#ffffff",
                      border: "1px solid #e2e8f0",
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      transition: "all 0.2s ease",
                      "&:hover": {
                        transform: "none",
                        borderColor: pkg.color,
                        boxShadow: "none",
                      },
                    }}
                  >
                    <Box>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          mb: 1.5,
                        }}
                      >
                        <Chip
                          size="small"
                          label={pkg.badge}
                          sx={{
                            backgroundColor: `${pkg.color}18`,
                            color: pkg.color,
                            fontWeight: 600,
                            fontSize: "0.75rem",
                            border: `1px solid ${pkg.color}40`,
                          }}
                        />
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 700,
                            color: pkg.color,
                            fontFamily: "inherit",
                          }}
                        >
                          €{pkg.budget.toLocaleString()}
                        </Typography>
                      </Box>

                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                        <Typography sx={{ fontSize: 24 }}>{pkg.icon}</Typography>
                        <Typography
                          variant="subtitle1"
                          sx={{ fontWeight: 600, color: "#1e293b", lineHeight: 1.3 }}
                        >
                          {pkg.title}
                        </Typography>
                      </Box>

                      <Typography
                        variant="caption"
                        sx={{ color: "#64748b", display: "block", mb: 1.5, fontWeight: 600 }}
                      >
                        {pkg.subtitle}
                      </Typography>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontSize: "0.82rem", lineHeight: 1.45, mb: 2 }}
                      >
                        {pkg.rationale}
                      </Typography>

                      <Divider sx={{ my: 1.5 }} />

                      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                          <Typography variant="caption" color="text.secondary">
                            Strategy:
                          </Typography>
                          <Typography variant="caption" sx={{ fontWeight: 600, textTransform: "capitalize" }}>
                            {pkg.strategy}
                          </Typography>
                        </Box>

                        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, mt: 0.5 }}>
                          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <Typography variant="caption" color="text.secondary">
                              Suggested Tiers:
                            </Typography>
                            <Typography variant="caption" sx={{ fontWeight: 600, color: pkg.color }}>
                              {packageTiers[pkg.id]?.air ?? pkg.recommendedTiers.air} Air · {packageTiers[pkg.id]?.water ?? pkg.recommendedTiers.water} Water · {packageTiers[pkg.id]?.noise ?? pkg.recommendedTiers.noise} Noise
                            </Typography>
                          </Box>

                          {/* Stepper controls to edit package suggested numbers */}
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              px: 1,
                              py: 0.75,
                              borderRadius: 2,
                              backgroundColor: "#f8fafc",
                              border: "1px solid #e2e8f0",
                              gap: 0.5,
                            }}
                          >
                            {(["air", "water", "noise"] as SensorTier[]).map((tKey) => {
                              const currentCount = packageTiers[pkg.id]?.[tKey] ?? pkg.recommendedTiers[tKey];
                              const tLabel = tKey === "air" ? "Air" : tKey === "water" ? "Water" : "Noise";
                              const tColor = TIER_CONFIGS[tKey].color;
                              return (
                                <Box key={tKey} sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                  <Typography variant="caption" sx={{ fontWeight: 600, color: tColor, fontSize: "0.68rem" }}>
                                    {tLabel}:
                                  </Typography>
                                  <IconButton
                                    size="small"
                                    disabled={currentCount <= 0}
                                    onClick={() => handlePackageTierChange(pkg.id, tKey, -1)}
                                    sx={{ p: 0.25, width: 22, height: 22 }}
                                  >
                                    <RemoveIcon sx={{ fontSize: 13 }} />
                                  </IconButton>
                                  <Box
                                    component="input"
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    value={currentCount}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                      const raw = e.target.value;
                                      if (raw === "" || /^\d+$/.test(raw)) {
                                        const parsed = parseInt(raw, 10);
                                        handlePackageTierSet(pkg.id, tKey, isNaN(parsed) ? 0 : parsed);
                                      }
                                    }}
                                    onFocus={(e: React.FocusEvent<HTMLInputElement>) => e.target.select()}
                                    onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                                      if (e.key === "Enter") {
                                        (e.target as HTMLInputElement).blur();
                                      }
                                    }}
                                    aria-label={`${tLabel} count`}
                                    sx={{
                                      fontWeight: 700,
                                      fontSize: "0.82rem",
                                      width: 26,
                                      textAlign: "center",
                                      border: "none",
                                      outline: "none",
                                      backgroundColor: "transparent",
                                      p: 0,
                                      m: 0,
                                      fontFamily: "inherit",
                                      borderRadius: 0.5,
                                      transition: "background-color 0.15s ease",
                                      "&:hover": { backgroundColor: "#e2e8f0" },
                                      "&:focus": { backgroundColor: "#ffffff", boxShadow: `0 0 0 1px ${tColor}` },
                                      "&::-webkit-outer-spin-button, &::-webkit-inner-spin-button": {
                                        WebkitAppearance: "none",
                                        margin: 0,
                                      },
                                      MozAppearance: "textfield",
                                      cursor: "text",
                                    }}
                                  />
                                  <IconButton
                                    size="small"
                                    onClick={() => handlePackageTierChange(pkg.id, tKey, 1)}
                                    sx={{ p: 0.25, width: 22, height: 22 }}
                                  >
                                    <AddIcon sx={{ fontSize: 13 }} />
                                  </IconButton>
                                </Box>
                              );
                            })}
                          </Box>
                        </Box>

                        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                          <Typography variant="caption" color="text.secondary">
                            Target Focus:
                          </Typography>
                          <Typography variant="caption" sx={{ fontWeight: 600, maxWidth: 190, textAlign: "right" }}>
                            {pkg.targetFocus}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>

                    <Button
                      fullWidth
                      variant="contained"
                      size="small"
                      onClick={() => handleApplyPackageSuggestion(pkg)}
                      sx={{
                        mt: 2.5,
                        textTransform: "none",
                        fontWeight: 600,
                        backgroundColor: pkg.color,
                        "&:hover": {
                          backgroundColor: pkg.color,
                          filter: "brightness(0.9)",
                        },
                      }}
                    >
                      Apply This Municipal Package
                    </Button>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* TAB 2: HARDWARE TIER VALUES & SPECS MODELER */}
        {activeTab === 2 && (
          <Box>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 1.5,
                mb: 3,
              }}
            >
              <Box>
                <Typography
                  variant="subtitle1"
                  sx={{ fontWeight: 600, color: "#0f172a" }}
                >
                  Custom Hardware Tier Economics & Values Modeler
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Adjust unit CapEx costs, annual maintenance (O&M), and effective coverage radii
                  for Air Quality, Water Quality, and Noise Pollution sensors. The optimizer
                  recalculates portfolio economics and live map rings in real time.
                </Typography>
              </Box>

              <Button
                variant="outlined"
                color="inherit"
                size="small"
                startIcon={<RestartAltIcon />}
                onClick={handleResetTierDefaults}
                sx={{ textTransform: "none", fontWeight: 600 }}
              >
                Reset to Factory Defaults
              </Button>
            </Box>

            <Grid container spacing={3}>
              {(["air", "water", "noise"] as SensorTier[]).map((tierKey) => {
                const config = TIER_CONFIGS[tierKey];
                const custom = customTierSpecs[tierKey];
                const unitCost = custom?.unitCost ?? config.unitCost;
                const annualOm = custom?.annualOm ?? config.annualOm;
                const radiusKm = custom?.radiusKm ?? config.radiusKm;

                return (
                  <Grid size={{ xs: 12, md: 4 }} key={tierKey}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2.5,
                        borderRadius: 3,
                        backgroundColor: config.bgColor,
                        border: `2px solid ${config.borderColor}`,
                        height: "100%",
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          mb: 1.5,
                        }}
                      >
                        <Chip
                          size="small"
                          label={config.badge}
                          sx={{
                            backgroundColor: config.color,
                            color: "#ffffff",
                            fontWeight: 600,
                            fontSize: "0.75rem",
                          }}
                        />
                        <Typography
                          variant="caption"
                          sx={{ fontWeight: 600, color: config.color }}
                        >
                          Confidence: {config.confidence}%
                        </Typography>
                      </Box>

                      <Typography
                        variant="subtitle1"
                        sx={{ fontWeight: 600, color: "#1e293b", mb: 0.5 }}
                      >
                        {config.name}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ display: "block", color: "text.secondary", mb: 2.5, lineHeight: 1.4 }}
                      >
                        {config.description}
                      </Typography>

                      <Divider sx={{ mb: 2, borderColor: `${config.borderColor}55` }} />

                      {/* 1. Unit CapEx Input */}
                      <Box sx={{ mb: 2.5 }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                          <Typography variant="caption" sx={{ fontWeight: 600, color: "#334155" }}>
                            Unit Procurement CapEx
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{ fontWeight: 600, color: config.color, fontFamily: "inherit" }}
                          >
                            €{unitCost.toLocaleString()}
                          </Typography>
                        </Box>
                        <TextField
                          fullWidth
                          size="small"
                          type="number"
                          value={unitCost}
                          onChange={(e) =>
                            handleUpdateTierParam(
                              tierKey,
                              "unitCost",
                              Math.max(100, Number(e.target.value)),
                            )
                          }
                          slotProps={{
                            input: {
                              startAdornment: (
                                <InputAdornment position="start">€</InputAdornment>
                              ),
                            },
                          }}
                          sx={{
                            backgroundColor: "#ffffff",
                            "& .MuiInputBase-input": {
                              fontWeight: 600,
                              fontFamily: "inherit",
                            },
                          }}
                        />
                      </Box>

                      {/* 2. Annual O&M Input */}
                      <Box sx={{ mb: 2.5 }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                          <Typography variant="caption" sx={{ fontWeight: 600, color: "#334155" }}>
                            Annual Maintenance (O&M)
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{ fontWeight: 600, color: config.color, fontFamily: "inherit" }}
                          >
                            €{annualOm.toLocaleString()}/yr
                          </Typography>
                        </Box>
                        <TextField
                          fullWidth
                          size="small"
                          type="number"
                          value={annualOm}
                          onChange={(e) =>
                            handleUpdateTierParam(
                              tierKey,
                              "annualOm",
                              Math.max(0, Number(e.target.value)),
                            )
                          }
                          slotProps={{
                            input: {
                              startAdornment: (
                                <InputAdornment position="start">€</InputAdornment>
                              ),
                              endAdornment: (
                                <InputAdornment position="end">/year</InputAdornment>
                              ),
                            },
                          }}
                          sx={{
                            backgroundColor: "#ffffff",
                            "& .MuiInputBase-input": {
                              fontWeight: 600,
                              fontFamily: "inherit",
                            },
                          }}
                        />
                      </Box>

                      {/* 3. Coverage Radius Slider */}
                      <Box sx={{ mb: 1 }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                          <Typography variant="caption" sx={{ fontWeight: 600, color: "#334155" }}>
                            Coverage Radius (km)
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{ fontWeight: 600, color: config.color, fontFamily: "inherit" }}
                          >
                            {radiusKm} km
                          </Typography>
                        </Box>
                        <Slider
                          value={radiusKm}
                          min={0.3}
                          max={6.0}
                          step={0.1}
                          onChange={(_, val) =>
                            handleUpdateTierParam(tierKey, "radiusKm", val as number)
                          }
                          valueLabelDisplay="auto"
                          sx={{
                            color: config.color,
                          }}
                        />
                      </Box>
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>

            <Box sx={{ mt: 3, textAlign: "right" }}>
              <Button
                variant="contained"
                onClick={() => setActiveTab(0)}
                sx={{
                  textTransform: "none",
                  fontWeight: 600,
                  px: 3,
                  backgroundColor: "#0f766e",
                  "&:hover": { backgroundColor: "#115e59" },
                }}
              >
                Apply Values & Return to Optimizer
              </Button>
            </Box>
          </Box>
        )}

        {/* TAB 3: LOW-COST VS REFERENCE TRADE-OFF MATRIX */}
        {activeTab === 3 && result && result.comparisons?.referenceOnly && result.comparisons?.iotOnly && (
          <Box>
            <Box sx={{ mb: 3 }}>
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 600, color: "#0f172a" }}
              >
                Low-Cost vs Reference Station Strategic Trade-Off Analysis
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Municipal city council comparative assessment: contrasting pure regulatory
                pathways against hyper-dense low-cost mesh deployments for the allocated
                budget of <strong>€{budget.toLocaleString()}</strong>.
              </Typography>
            </Box>

            <Grid container spacing={2.5}>
              {/* Option A: Pure Regulatory Reference */}
              {(() => {
                const comp = result.comparisons.referenceOnly!;
                return (
                  <Grid size={{ xs: 12, md: 4 }}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2.5,
                        borderRadius: 3,
                        backgroundColor: "#fffbeb",
                        border: "2px solid #fde68a",
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                      }}
                    >
                      <Box>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            mb: 1.5,
                          }}
                        >
                          <Chip
                            size="small"
                            label="Path A: Pure Regulatory"
                            sx={{
                              backgroundColor: "#b45309",
                              color: "#ffffff",
                              fontWeight: 600,
                              fontSize: "0.75rem",
                            }}
                          />
                          <Typography
                            variant="h6"
                            sx={{ fontWeight: 700, color: "#92400e" }}
                          >
                            {comp.totalStations} Stations
                          </Typography>
                        </Box>

                        <Typography
                          variant="subtitle1"
                          sx={{ fontWeight: 600, color: "#78350f" }}
                        >
                          100% Certified Reference
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mt: 0.5, mb: 2, fontSize: "0.82rem" }}
                        >
                          {comp.description}
                        </Typography>

                        <Divider sx={{ my: 1.5, borderColor: "#fde68a" }} />

                        {/* Metrics */}
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                            <Typography variant="caption" color="text.secondary">
                              Coverage Footprint:
                            </Typography>
                            <Typography variant="caption" sx={{ fontWeight: 600 }}>
                              +{comp.estimatedCoverageGainPercent}% (High blind spots)
                            </Typography>
                          </Box>
                          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                            <Typography variant="caption" color="text.secondary">
                              Sensor Confidence:
                            </Typography>
                            <Typography variant="caption" sx={{ fontWeight: 600, color: "#059669" }}>
                              {comp.meanConfidenceScore}% (Legal gold standard)
                            </Typography>
                          </Box>
                          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                            <Typography variant="caption" color="text.secondary">
                              EU Regulatory Compliance:
                            </Typography>
                            <Typography variant="caption" sx={{ fontWeight: 600, color: "#059669" }}>
                              {comp.regulatoryComplianceScore}/100 (Court-admissible)
                            </Typography>
                          </Box>
                          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                            <Typography variant="caption" color="text.secondary">
                              Annual Maintenance:
                            </Typography>
                            <Typography variant="caption" sx={{ fontWeight: 600, color: "#b45309" }}>
                              €{comp.estimatedAnnualOm.toLocaleString()}/yr
                            </Typography>
                          </Box>
                          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                            <Typography variant="caption" color="text.secondary">
                              Cost / Resident Protected:
                            </Typography>
                            <Typography variant="caption" sx={{ fontWeight: 600 }}>
                              €{comp.costPerResident}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>

                      <Button
                        fullWidth
                        variant="outlined"
                        size="small"
                        onClick={() => handleApplyComparisonPathway(comp)}
                        sx={{
                          mt: 2.5,
                          textTransform: "none",
                          fontWeight: 600,
                          borderColor: "#d97706",
                          color: "#b45309",
                          "&:hover": {
                            backgroundColor: "#fef3c7",
                            borderColor: "#b45309",
                          },
                        }}
                      >
                        Apply Reference-Only Strategy
                      </Button>
                    </Paper>
                  </Grid>
                );
              })()}

              {/* Option B: Pure Low-Cost IoT Mesh */}
              {(() => {
                const comp = result.comparisons.iotOnly!;
                return (
                  <Grid size={{ xs: 12, md: 4 }}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2.5,
                        borderRadius: 3,
                        backgroundColor: "#f0fdfa",
                        border: "2px solid #a7f3d0",
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                      }}
                    >
                      <Box>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            mb: 1.5,
                          }}
                        >
                          <Chip
                            size="small"
                            label="Path B: Hyper-Local Mesh"
                            sx={{
                              backgroundColor: "#0f766e",
                              color: "#ffffff",
                              fontWeight: 600,
                              fontSize: "0.75rem",
                            }}
                          />
                          <Typography
                            variant="h6"
                            sx={{ fontWeight: 700, color: "#0f766e" }}
                          >
                            {comp.totalStations} Stations
                          </Typography>
                        </Box>

                        <Typography
                          variant="subtitle1"
                          sx={{ fontWeight: 600, color: "#115e59" }}
                        >
                          100% Low-Cost IoT Mesh
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mt: 0.5, mb: 2, fontSize: "0.82rem" }}
                        >
                          {comp.description}
                        </Typography>

                        <Divider sx={{ my: 1.5, borderColor: "#a7f3d0" }} />

                        {/* Metrics */}
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                            <Typography variant="caption" color="text.secondary">
                              Coverage Footprint:
                            </Typography>
                            <Typography variant="caption" sx={{ fontWeight: 600, color: "#059669" }}>
                              +{comp.estimatedCoverageGainPercent}% (Ultra-high density)
                            </Typography>
                          </Box>
                          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                            <Typography variant="caption" color="text.secondary">
                              Sensor Confidence:
                            </Typography>
                            <Typography variant="caption" sx={{ fontWeight: 600, color: "#dc2626" }}>
                              {comp.meanConfidenceScore}% (Uncalibrated drift risk)
                            </Typography>
                          </Box>
                          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                            <Typography variant="caption" color="text.secondary">
                              EU Regulatory Compliance:
                            </Typography>
                            <Typography variant="caption" sx={{ fontWeight: 600, color: "#dc2626" }}>
                              {comp.regulatoryComplianceScore}/100 (Non-statutory)
                            </Typography>
                          </Box>
                          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                            <Typography variant="caption" color="text.secondary">
                              Annual Maintenance:
                            </Typography>
                            <Typography variant="caption" sx={{ fontWeight: 600, color: "#0f766e" }}>
                              €{comp.estimatedAnnualOm.toLocaleString()}/yr
                            </Typography>
                          </Box>
                          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                            <Typography variant="caption" color="text.secondary">
                              Cost / Resident Protected:
                            </Typography>
                            <Typography variant="caption" sx={{ fontWeight: 600 }}>
                              €{comp.costPerResident}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>

                      <Button
                        fullWidth
                        variant="outlined"
                        size="small"
                        onClick={() => handleApplyComparisonPathway(comp)}
                        sx={{
                          mt: 2.5,
                          textTransform: "none",
                          fontWeight: 600,
                          borderColor: "#14b8a6",
                          color: "#0f766e",
                          "&:hover": {
                            backgroundColor: "#ccfbf1",
                            borderColor: "#0f766e",
                          },
                        }}
                      >
                        Apply Pure-Mesh Strategy
                      </Button>
                    </Paper>
                  </Grid>
                );
              })()}

              {/* Option C: AI Optimal Multi-Tier Hybrid */}
              {(() => {
                const comp = result.comparisons.currentHybrid;
                return (
                  <Grid size={{ xs: 12, md: 4 }}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2.5,
                        borderRadius: 3,
                        backgroundColor: "#f5f3ff",
                        border: "2.5px solid #8b5cf6",
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        boxShadow: "none",
                      }}
                    >
                      <Box>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            mb: 1.5,
                          }}
                        >
                          <Chip
                            size="small"
                            icon={<VerifiedUserIcon sx={{ color: "#ffffff !important" }} />}
                            label="Path C: AI Multi-Tier Hybrid"
                            sx={{
                              backgroundColor: "#7c3aed",
                              color: "#ffffff",
                              fontWeight: 600,
                              fontSize: "0.75rem",
                            }}
                          />
                          <Typography
                            variant="h6"
                            sx={{ fontWeight: 700, color: "#6d28d9" }}
                          >
                            {comp.totalStations} Stations
                          </Typography>
                        </Box>

                        <Typography
                          variant="subtitle1"
                          sx={{ fontWeight: 600, color: "#5b21b6" }}
                        >
                          Optimal Co-Location Portfolio
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mt: 0.5, mb: 2, fontSize: "0.82rem" }}
                        >
                          {comp.description}
                        </Typography>

                        <Divider sx={{ my: 1.5, borderColor: "#ddd6fe" }} />

                        {/* Metrics */}
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                            <Typography variant="caption" color="text.secondary">
                              Coverage Footprint:
                            </Typography>
                            <Typography variant="caption" sx={{ fontWeight: 600, color: "#059669" }}>
                              +{comp.estimatedCoverageGainPercent}% (High citywide reach)
                            </Typography>
                          </Box>
                          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                            <Typography variant="caption" color="text.secondary">
                              Sensor Confidence:
                            </Typography>
                            <Typography variant="caption" sx={{ fontWeight: 600, color: "#059669" }}>
                              {comp.meanConfidenceScore}% (Cross-calibrated)
                            </Typography>
                          </Box>
                          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                            <Typography variant="caption" color="text.secondary">
                              EU Regulatory Compliance:
                            </Typography>
                            <Typography variant="caption" sx={{ fontWeight: 600, color: "#059669" }}>
                              {comp.regulatoryComplianceScore}/100 (Certified anchor)
                            </Typography>
                          </Box>
                          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                            <Typography variant="caption" color="text.secondary">
                              Calibration Anchor Ratio:
                            </Typography>
                            <Typography variant="caption" sx={{ fontWeight: 600, color: "#6d28d9" }}>
                              {comp.calibrationRatio} (Ideal EPA/WHO)
                            </Typography>
                          </Box>
                          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                            <Typography variant="caption" color="text.secondary">
                              Cost / Resident Protected:
                            </Typography>
                            <Typography variant="caption" sx={{ fontWeight: 600 }}>
                              €{comp.costPerResident} (Lowest lifecycle cost)
                            </Typography>
                          </Box>
                        </Box>
                      </Box>

                      <Button
                        fullWidth
                        variant="contained"
                        size="small"
                        onClick={() => handleApplyComparisonPathway(comp)}
                        sx={{
                          mt: 2.5,
                          textTransform: "none",
                          fontWeight: 600,
                          backgroundColor: "#7c3aed",
                          "&:hover": { backgroundColor: "#6d28d9" },
                        }}
                      >
                        Selected Recommended Portfolio
                      </Button>
                    </Paper>
                  </Grid>
                );
              })()}
            </Grid>
          </Box>
        )}

        {/* TAB 4: PROCUREMENT DOSSIER & RFP EXPORT */}
        {activeTab === 4 && result && (
          <Box>
            <Box sx={{ mb: 3 }}>
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 600, color: "#0f172a" }}
              >
                Municipal Procurement Dossier & RFP Documentation
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Generate and export formal procurement briefs for Debrecen city council,
                environmental committee review, and hardware procurement tenders.
              </Typography>
            </Box>

            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: 2.5,
                backgroundColor: "#f8fafc",
                border: "1px solid #cbd5e1",
                mb: 3,
                fontFamily: "inherit",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 1.5,
                }}
              >
                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: 600, color: "#0f766e" }}
                >
                  DEBRECEN MUNICIPAL SENSOR ALLOCATION SUMMARY
                </Typography>

                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<ContentCopyIcon />}
                  onClick={handleCopySummary}
                  sx={{ textTransform: "none", fontWeight: 600 }}
                >
                  Copy Council Briefing Memo
                </Button>
              </Box>

              <Typography variant="body2" sx={{ lineHeight: 1.7, color: "#1e293b" }}>
                <strong>Total Allocated Capital:</strong> €{result.allocatedSpend.toLocaleString()} of €{budget.toLocaleString()} ({result.budgetUtilizationPercent}% utilized)
                <br />
                <strong>5-Year Lifecycle TCO:</strong> €{result.fiveYearTco.toLocaleString()} (Includes €{result.estimatedAnnualOm.toLocaleString()}/yr maintenance)
                <br />
                <strong>Network Hardware:</strong> {result.totalStations} stations — {result.tierCounts.air} Air Quality (€{customTierSpecs.air?.unitCost ?? 4500}), {result.tierCounts.water} Water Quality (€{customTierSpecs.water?.unitCost ?? 6200}), {result.tierCounts.noise} Noise Sensor (€{customTierSpecs.noise?.unitCost ?? 2800})
                <br />
                <strong>Citizen Impact:</strong> +{result.estimatedCoverageGainPercent}% coverage gain, protecting ~{result.estimatedPopulationCovered.toLocaleString()} residents at €{result.costPerResident}/citizen
                <br />
                <strong>Statutory Compliance:</strong> {result.regulatoryComplianceScore}/100 readiness index (Directive 2008/50/EC alignment)
              </Typography>
            </Paper>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<DownloadIcon />}
                  onClick={handleDownloadCsv}
                  sx={{
                    py: 1.5,
                    textTransform: "none",
                    fontWeight: 600,
                    backgroundColor: "#0f766e",
                    "&:hover": { backgroundColor: "#115e59" },
                  }}
                >
                  Download Procurement Roster (CSV)
                </Button>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={handleDownloadJson}
                  sx={{
                    py: 1.5,
                    textTransform: "none",
                    fontWeight: 600,
                    borderColor: "#0f766e",
                    color: "#0f766e",
                    "&:hover": {
                      backgroundColor: "#f0fdfa",
                      borderColor: "#115e59",
                    },
                  }}
                >
                  Download Technical Specification (JSON)
                </Button>
              </Grid>
            </Grid>
          </Box>
        )}
      </CardContent>

      <Snackbar
        open={Boolean(toastMessage)}
        autoHideDuration={4000}
        onClose={() => setToastMessage("")}
        message={toastMessage}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />
    </Card>
  );
}
