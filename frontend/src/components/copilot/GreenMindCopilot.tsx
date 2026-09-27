import { useState, useRef, useEffect, useCallback } from "react";
import {
  Box,
  Paper,
  Typography,
  IconButton,
  TextField,
  Chip,
  CircularProgress,
  Tooltip,
  Fade,
  Badge,
  Divider,
} from "@mui/material";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import CloseIcon from "@mui/icons-material/Close";
import SendIcon from "@mui/icons-material/Send";
import DeleteIcon from "@mui/icons-material/Delete";
import OpenInFullIcon from "@mui/icons-material/OpenInFull";
import CloseFullscreenIcon from "@mui/icons-material/CloseFullscreen";
import RemoveIcon from "@mui/icons-material/Remove";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckIcon from "@mui/icons-material/Check";
import SchoolIcon from "@mui/icons-material/School";
import PrecisionManufacturingIcon from "@mui/icons-material/PrecisionManufacturing";
import BalanceIcon from "@mui/icons-material/Balance";
import DescriptionIcon from "@mui/icons-material/Description";

import {
  sendCopilotChat,
  type CopilotMessage,
} from "../../services/copilotService";
import { useSimulation } from "../../context/SimulationContext";
import { useAppTheme } from "../../context/ThemeContext";

const DEFAULT_SUGGESTIONS = [
  {
    icon: <SchoolIcon sx={{ fontSize: 13 }} />,
    text: "School €50k allocation",
  },
  {
    icon: <BalanceIcon sx={{ fontSize: 13 }} />,
    text: "Reference vs IoT trade-offs",
  },
  {
    icon: <PrecisionManufacturingIcon sx={{ fontSize: 13 }} />,
    text: "Industrial zone risks",
  },
  {
    icon: <DescriptionIcon sx={{ fontSize: 13 }} />,
    text: "Council briefing",
  },
];

const INITIAL_GREETING: CopilotMessage = {
  role: "assistant",
  content: `👋 **Hi, I'm GreenMind Copilot.**
Connected to Debrecen's sensor grid & budget optimizer.
Ask me about air quality, sensor placement, or budget decisions!`,
  timestamp: Date.now(),
};

// Simple Markdown Renderer for clean formatted output
function FormattedMessage({ content }: { content: string }) {
  const lines = content.split("\n");

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <Box key={idx} sx={{ height: 3 }} />;
        }

        // Headers
        if (trimmed.startsWith("### ")) {
          return (
            <Typography
              key={idx}
              variant="caption"
              sx={{ fontWeight: 600, color: "#0f766e", mt: 0.5, display: "block" }}
            >
              {renderBoldText(trimmed.replace(/^###\s*/, ""))}
            </Typography>
          );
        }
        if (trimmed.startsWith("## ")) {
          return (
            <Typography
              key={idx}
              variant="subtitle2"
              sx={{ fontWeight: 600, color: "#064e3b", mt: 0.5 }}
            >
              {renderBoldText(trimmed.replace(/^##\s*/, ""))}
            </Typography>
          );
        }

        // Bullet points
        if (trimmed.startsWith("* ") || trimmed.startsWith("- ")) {
          return (
            <Box
              key={idx}
              sx={{ display: "flex", alignItems: "flex-start", gap: 0.75, pl: 0.25 }}
            >
              <Typography
                component="span"
                sx={{ color: "#0f766e", fontWeight: 700, lineHeight: 1.3, fontSize: "0.8rem" }}
              >
                •
              </Typography>
              <Typography
                variant="body2"
                sx={{ fontSize: "0.82rem", lineHeight: 1.4, color: "#334155" }}
              >
                {renderBoldText(trimmed.replace(/^[\*\-]\s*/, ""))}
              </Typography>
            </Box>
          );
        }

        return (
          <Typography
            key={idx}
            variant="body2"
            sx={{ fontSize: "0.82rem", lineHeight: 1.4, color: "#334155" }}
          >
            {renderBoldText(trimmed)}
          </Typography>
        );
      })}
    </Box>
  );
}

function renderBoldText(text: string) {
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);

  return parts.map((part, idx) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={idx} style={{ color: "#0f766e", fontWeight: 700 }}>
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={idx}
          style={{
            backgroundColor: "#f1f5f9",
            padding: "1px 4px",
            borderRadius: 3,
            fontSize: "0.78rem",
            color: "#0f766e",
            fontFamily: "monospace",
          }}
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

export default function GreenMindCopilot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<CopilotMessage[]>([INITIAL_GREETING]);
  const [inputQuery, setInputQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState(DEFAULT_SUGGESTIONS);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Dragging states
  const [btnPos, setBtnPos] = useState<{ x: number; y: number } | null>(null);
  const [winPos, setWinPos] = useState<{ x: number; y: number } | null>(null);

  const btnDraggingRef = useRef(false);
  const btnStartRef = useRef({ mouseX: 0, mouseY: 0, startX: 0, startY: 0 });
  const btnMovedRef = useRef(false);

  const winDraggingRef = useRef(false);
  const winStartRef = useRef({ mouseX: 0, mouseY: 0, startX: 0, startY: 0 });

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const { simulatedStations } = useSimulation();
  const { tokens, isMidnight } = useAppTheme();

  const currentWinWidth = isExpanded ? 520 : 350;
  const currentWinHeight = isExpanded ? 560 : 440;

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, isLoading]);

  // Floating trigger pointer handlers
  const handleBtnPointerDown = useCallback((e: React.PointerEvent) => {
    btnDraggingRef.current = true;
    btnMovedRef.current = false;
    const currentX = btnPos?.x ?? (window.innerWidth - 68);
    const currentY = btnPos?.y ?? (window.innerHeight - 72);
    btnStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      startX: currentX,
      startY: currentY,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, [btnPos]);

  const handleBtnPointerMove = useCallback((e: React.PointerEvent) => {
    if (!btnDraggingRef.current) return;
    const dx = e.clientX - btnStartRef.current.mouseX;
    const dy = e.clientY - btnStartRef.current.mouseY;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
      btnMovedRef.current = true;
    }
    const newX = Math.min(Math.max(10, btnStartRef.current.startX + dx), window.innerWidth - 60);
    const newY = Math.min(Math.max(10, btnStartRef.current.startY + dy), window.innerHeight - 60);
    setBtnPos({ x: newX, y: newY });
  }, []);

  const handleBtnPointerUp = useCallback(() => {
    btnDraggingRef.current = false;
    if (!btnMovedRef.current) {
      setIsOpen(true);
    }
  }, []);

  // Chat window header drag handlers
  const handleWinPointerDown = useCallback((e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("button")) return;
    winDraggingRef.current = true;
    const currentX = winPos?.x ?? (window.innerWidth - currentWinWidth - 20);
    const currentY = winPos?.y ?? (window.innerHeight - currentWinHeight - 20);
    winStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      startX: currentX,
      startY: currentY,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, [winPos, currentWinWidth, currentWinHeight]);

  const handleWinPointerMove = useCallback((e: React.PointerEvent) => {
    if (!winDraggingRef.current) return;
    const dx = e.clientX - winStartRef.current.mouseX;
    const dy = e.clientY - winStartRef.current.mouseY;
    const maxX = window.innerWidth - currentWinWidth - 10;
    const maxY = window.innerHeight - currentWinHeight - 10;
    const newX = Math.min(Math.max(10, winStartRef.current.startX + dx), maxX);
    const newY = Math.min(Math.max(10, winStartRef.current.startY + dy), maxY);
    setWinPos({ x: newX, y: newY });
  }, [currentWinWidth, currentWinHeight]);

  const handleWinPointerUp = useCallback(() => {
    winDraggingRef.current = false;
  }, []);

  async function handleSendMessage(textToSend?: string) {
    const query = (textToSend || inputQuery).trim();
    if (!query || isLoading) return;

    const userMessage: CopilotMessage = {
      role: "user",
      content: query,
      timestamp: Date.now(),
    };

    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setInputQuery("");
    setIsLoading(true);

    try {
      const clientContext = {
        currentPage: window.location.pathname,
        totalSimulatedStations: simulatedStations.length,
        customPinsCount: simulatedStations.filter((s) => s.isCustom).length,
        simulatedStationsRoster: simulatedStations.map((s) => ({
          name: s.name,
          tier: s.sensorTier || "iot",
          capex: s.unitCost || 1200,
          coordinates: [s.lat, s.lng],
          isCustom: !!s.isCustom,
        })),
        totalSimulatedCapex: simulatedStations.reduce((sum, s) => sum + (s.unitCost || 1200), 0),
      };

      const result = await sendCopilotChat(newHistory, clientContext);

      const assistantMessage: CopilotMessage = {
        role: "assistant",
        content: result.reply,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (result.suggestions && result.suggestions.length > 0) {
        setSuggestions(
          result.suggestions.map((s) => ({
            icon: <AutoAwesomeIcon sx={{ fontSize: 13 }} />,
            text: s,
          })),
        );
      }
    } catch (err) {
      const errorMessage: CopilotMessage = {
        role: "assistant",
        content: `⚠️ **Copilot Connection Error**: ${err instanceof Error ? err.message : "Failed to reach AI service."}`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleClearChat() {
    setMessages([INITIAL_GREETING]);
    setSuggestions(DEFAULT_SUGGESTIONS);
  }

  function handleCopyMessage(text: string, index: number) {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  }

  return (
    <>
      {/* Floating Action Button (Compact, Circular, Draggable) */}
      {!isOpen && (
        <Fade in={!isOpen}>
          <Box
            onPointerDown={handleBtnPointerDown}
            onPointerMove={handleBtnPointerMove}
            onPointerUp={handleBtnPointerUp}
            sx={{
              position: "fixed",
              left: btnPos ? btnPos.x : undefined,
              top: btnPos ? btnPos.y : undefined,
              right: btnPos ? undefined : 20,
              bottom: btnPos ? undefined : 20,
              zIndex: 1300,
              touchAction: "none",
              cursor: "grab",
              "&:active": { cursor: "grabbing" },
            }}
          >
            <Badge
              color="success"
              variant="dot"
              overlap="circular"
              anchorOrigin={{ vertical: "top", horizontal: "right" }}
              sx={{
                "& .MuiBadge-badge": {
                  boxShadow: "0 0 0 2px white",
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                },
              }}
            >
              <Tooltip title="GreenMind Copilot • Click to open or drag to move" arrow placement="left">
                <Paper
                  elevation={4}
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: tokens.copilotTriggerBg,
                    color: tokens.copilotTriggerColor,
                    boxShadow: "0 6px 20px rgba(15, 118, 110, 0.35)",
                    border: isMidnight ? "1px solid rgba(0, 220, 130, 0.4)" : "1px solid rgba(255, 255, 255, 0.4)",
                    transition: "transform 0.15s ease, box-shadow 0.15s ease",
                    "&:hover": {
                      transform: "scale(1.08)",
                      boxShadow: "0 8px 24px rgba(15, 118, 110, 0.45)",
                    },
                  }}
                >
                  <SmartToyIcon sx={{ fontSize: 24, color: isMidnight ? "#79b998" : "#ffffff" }} />
                </Paper>
              </Tooltip>
            </Badge>
          </Box>
        </Fade>
      )}

      {/* Floating Chat Window (Compact, Movable, Non-intrusive) */}
      {isOpen && (
        <Fade in={isOpen}>
          <Paper
            elevation={10}
            sx={{
              position: "fixed",
              left: winPos ? winPos.x : undefined,
              top: winPos ? winPos.y : undefined,
              right: winPos ? undefined : { xs: 12, sm: 20 },
              bottom: winPos ? undefined : { xs: 12, sm: 20 },
              width: {
                xs: "calc(100vw - 24px)",
                sm: currentWinWidth,
              },
              height: {
                xs: "65vh",
                sm: currentWinHeight,
              },
              maxHeight: "80vh",
              borderRadius: 3,
              overflow: "hidden",
              zIndex: 1400,
              display: "flex",
              flexDirection: "column",
              backgroundColor: "#ffffff",
              border: `1px solid ${tokens.cardBorder}`,
              boxShadow: "0 16px 38px rgba(15, 23, 42, 0.18)",
              transition: winDraggingRef.current ? "none" : "width 0.2s ease, height 0.2s ease",
            }}
          >
            {/* Draggable Header */}
            <Box
              onPointerDown={handleWinPointerDown}
              onPointerMove={handleWinPointerMove}
              onPointerUp={handleWinPointerUp}
              sx={{
                px: 1.5,
                py: 1,
                background: isMidnight
                  ? "linear-gradient(135deg, #0b1329 0%, #1e293b 100%)"
                  : "linear-gradient(135deg, #0f766e 0%, #064e3b 100%)",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                cursor: "grab",
                touchAction: "none",
                userSelect: "none",
                "&:active": { cursor: "grabbing" },
                borderBottom: isMidnight ? "1px solid rgba(0, 220, 130, 0.2)" : "none",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <DragIndicatorIcon sx={{ fontSize: 18, color: "rgba(255, 255, 255, 0.6)" }} />
                <SmartToyIcon sx={{ color: isMidnight ? "#79b998" : "#5eead4", fontSize: 20 }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 600, lineHeight: 1.2, fontSize: "0.85rem" }}>
                  GreenMind Copilot
                </Typography>
                <Chip
                  size="small"
                  label="GPT-4o"
                  sx={{
                    height: 16,
                    fontSize: "0.58rem",
                    fontWeight: 600,
                    backgroundColor: isMidnight ? "#79b998" : "#14b8a6",
                    color: isMidnight ? "#0b1329" : "#ffffff",
                    px: 0.2,
                  }}
                />
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", gap: 0.25 }}>
                <Tooltip title="Clear chat" arrow>
                  <IconButton
                    size="small"
                    onClick={handleClearChat}
                    sx={{ color: "rgba(255, 255, 255, 0.75)", p: 0.5, "&:hover": { color: "#ffffff" } }}
                  >
                    <DeleteIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>

                <Tooltip title="Minimize" arrow>
                  <IconButton
                    size="small"
                    onClick={() => setIsOpen(false)}
                    sx={{ color: "rgba(255, 255, 255, 0.75)", p: 0.5, "&:hover": { color: "#ffffff" } }}
                  >
                    <RemoveIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>

                <Tooltip title={isExpanded ? "Standard size" : "Expand size"} arrow>
                  <IconButton
                    size="small"
                    onClick={() => setIsExpanded((prev) => !prev)}
                    sx={{
                      color: "rgba(255, 255, 255, 0.75)",
                      p: 0.5,
                      "&:hover": { color: "#ffffff" },
                      display: { xs: "none", sm: "inline-flex" },
                    }}
                  >
                    {isExpanded ? (
                      <CloseFullscreenIcon sx={{ fontSize: 16 }} />
                    ) : (
                      <OpenInFullIcon sx={{ fontSize: 16 }} />
                    )}
                  </IconButton>
                </Tooltip>

                <Tooltip title="Close" arrow>
                  <IconButton
                    size="small"
                    onClick={() => setIsOpen(false)}
                    sx={{ color: "rgba(255, 255, 255, 0.75)", p: 0.5, "&:hover": { color: "#ffffff" } }}
                  >
                    <CloseIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>

            {/* Compact Context Banner */}
            <Box
              sx={{
                px: 1.5,
                py: 0.5,
                backgroundColor: "#f0fdfa",
                borderBottom: "1px solid #ccfbf1",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Typography
                variant="caption"
                noWrap
                sx={{ color: "#0f766e", fontWeight: 600, fontSize: "0.7rem" }}
              >
                {simulatedStations.length > 0
                  ? `📡 ${simulatedStations.length} simulated stations (€${simulatedStations.reduce((acc, s) => acc + (s.unitCost || 1200), 0).toLocaleString()})`
                  : "🔒 Connected to Debrecen Sensor Grid"}
              </Typography>
            </Box>

            {/* Chat Messages Stream */}
            <Box
              sx={{
                flex: 1,
                overflowY: "auto",
                p: 1.5,
                backgroundColor: "#f8fafc",
                display: "flex",
                flexDirection: "column",
                gap: 1.25,
              }}
            >
              {messages.map((msg, index) => {
                const isUser = msg.role === "user";

                return (
                  <Box
                    key={index}
                    sx={{
                      display: "flex",
                      justifyContent: isUser ? "flex-end" : "flex-start",
                    }}
                  >
                    <Paper
                      elevation={0}
                      sx={{
                        maxWidth: "90%",
                        p: 1.25,
                        borderRadius: 2.5,
                        borderTopRightRadius: isUser ? 0 : 2.5,
                        borderTopLeftRadius: isUser ? 2.5 : 0,
                        backgroundColor: isUser ? "#0f766e" : "#ffffff",
                        color: isUser ? "#ffffff" : "#1e293b",
                        border: isUser ? "none" : "1px solid #e2e8f0",
                        boxShadow: isUser
                          ? "0 2px 8px rgba(15, 118, 110, 0.2)"
                          : "0 1px 4px rgba(0, 0, 0, 0.04)",
                        position: "relative",
                        "&:hover .copy-btn": { opacity: 1 },
                      }}
                    >
                      {!isUser ? (
                        <>
                          <FormattedMessage content={msg.content} />
                          <IconButton
                            className="copy-btn"
                            size="small"
                            onClick={() => handleCopyMessage(msg.content, index)}
                            sx={{
                              position: "absolute",
                              top: 4,
                              right: 4,
                              opacity: 0,
                              transition: "opacity 0.2s",
                              color: "#64748b",
                              p: 0.3,
                            }}
                            title="Copy response"
                          >
                            {copiedIndex === index ? (
                              <CheckIcon sx={{ fontSize: 13, color: "#059669" }} />
                            ) : (
                              <ContentCopyIcon sx={{ fontSize: 13 }} />
                            )}
                          </IconButton>
                        </>
                      ) : (
                        <Typography
                          variant="body2"
                          sx={{ fontSize: "0.82rem", lineHeight: 1.35, fontWeight: 500 }}
                        >
                          {msg.content}
                        </Typography>
                      )}
                    </Paper>
                  </Box>
                );
              })}

              {isLoading && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, p: 0.5 }}>
                  <CircularProgress size={14} sx={{ color: "#0f766e" }} />
                  <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 600, fontSize: "0.75rem" }}>
                    Analyzing sensor data...
                  </Typography>
                </Box>
              )}

              <div ref={messagesEndRef} />
            </Box>

            {/* Quick Suggestions Chips (Compact scroll) */}
            <Box
              sx={{
                px: 1,
                py: 0.75,
                backgroundColor: "#ffffff",
                borderTop: "1px solid #f1f5f9",
                display: "flex",
                flexWrap: "nowrap",
                overflowX: "auto",
                gap: 0.5,
                "&::-webkit-scrollbar": { display: "none" },
              }}
            >
              {suggestions.map((item, idx) => (
                <Chip
                  key={idx}
                  size="small"
                  icon={item.icon}
                  label={item.text}
                  clickable
                  onClick={() => handleSendMessage(item.text)}
                  disabled={isLoading}
                  sx={{
                    flexShrink: 0,
                    fontSize: "0.68rem",
                    height: 24,
                    fontWeight: 600,
                    backgroundColor: "#f0fdfa",
                    color: "#0f766e",
                    border: "1px solid #99f6e4",
                    "&:hover": {
                      backgroundColor: "#ccfbf1",
                      borderColor: "#0f766e",
                    },
                  }}
                />
              ))}
            </Box>

            <Divider />

            {/* Input Bar */}
            <Box
              sx={{
                p: 1,
                backgroundColor: "#ffffff",
                display: "flex",
                alignItems: "center",
                gap: 0.75,
              }}
            >
              <TextField
                fullWidth
                size="small"
                placeholder="Ask about air, budget, or sensors..."
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                disabled={isLoading}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    fontSize: "0.8rem",
                    py: 0.25,
                    backgroundColor: "#f8fafc",
                    "&.Mui-focused": {
                      backgroundColor: "#ffffff",
                      boxShadow: "0 0 0 2px rgba(15, 118, 110, 0.2)",
                    },
                  },
                }}
              />

              <IconButton
                color="primary"
                onClick={() => handleSendMessage()}
                disabled={!inputQuery.trim() || isLoading}
                sx={{
                  width: 34,
                  height: 34,
                  backgroundColor: inputQuery.trim() ? "#0f766e" : "#e2e8f0",
                  color: "#ffffff",
                  "&:hover": {
                    backgroundColor: "#0d655e",
                  },
                  "&.Mui-disabled": {
                    backgroundColor: "#f1f5f9",
                    color: "#94a3b8",
                  },
                }}
              >
                <SendIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Box>
          </Paper>
        </Fade>
      )}
    </>
  );
}