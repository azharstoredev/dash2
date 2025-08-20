import { RequestHandler } from "express";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

export interface LogEntry {
  timestamp: string;
  level: "info" | "warning" | "error" | "debug";
  category:
    | "system"
    | "user"
    | "order"
    | "product"
    | "customer"
    | "analytics"
    | "security";
  message: string;
  details?: any;
  userId?: string;
  ip?: string;
  userAgent?: string;
}

const LOGS_FILE = join(process.cwd(), "system_logs.json");
const MAX_LOGS = 1000; // Keep only the last 1000 log entries

// Helper function to read logs
function readLogs(): LogEntry[] {
  if (!existsSync(LOGS_FILE)) {
    return [];
  }

  try {
    const data = readFileSync(LOGS_FILE, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading logs:", error);
    return [];
  }
}

// Helper function to write logs
function writeLogs(logs: LogEntry[]) {
  try {
    // Keep only the most recent logs
    const recentLogs = logs.slice(-MAX_LOGS);
    writeFileSync(LOGS_FILE, JSON.stringify(recentLogs, null, 2));
  } catch (error) {
    console.error("Error writing logs:", error);
  }
}

// Helper function to add a log entry
export function addLogEntry(logEntry: Omit<LogEntry, "timestamp">) {
  const logs = readLogs();
  const newEntry: LogEntry = {
    ...logEntry,
    timestamp: new Date().toISOString(),
  };

  logs.push(newEntry);
  writeLogs(logs);

  // Also log to console for development
  const logLevel = newEntry.level.toUpperCase();
  const message = `[${newEntry.timestamp}] ${logLevel}: [${newEntry.category}] ${newEntry.message}`;

  switch (newEntry.level) {
    case "error":
      console.error(message, newEntry.details || "");
      break;
    case "warning":
      console.warn(message, newEntry.details || "");
      break;
    case "debug":
      console.debug(message, newEntry.details || "");
      break;
    default:
      console.info(message, newEntry.details || "");
  }
}

// Get logs with filtering and pagination
export const getLogs: RequestHandler = (req, res) => {
  try {
    const {
      level,
      category,
      startDate,
      endDate,
      limit = "100",
      offset = "0",
    } = req.query;

    let logs = readLogs();

    // Apply filters
    if (level) {
      logs = logs.filter((log) => log.level === level);
    }

    if (category) {
      logs = logs.filter((log) => log.category === category);
    }

    if (startDate) {
      const start = new Date(startDate as string);
      logs = logs.filter((log) => new Date(log.timestamp) >= start);
    }

    if (endDate) {
      const end = new Date(endDate as string);
      logs = logs.filter((log) => new Date(log.timestamp) <= end);
    }

    // Sort by timestamp (newest first)
    logs.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );

    // Apply pagination
    const limitNum = parseInt(limit as string);
    const offsetNum = parseInt(offset as string);
    const paginatedLogs = logs.slice(offsetNum, offsetNum + limitNum);

    const response = {
      logs: paginatedLogs,
      total: logs.length,
      hasMore: offsetNum + limitNum < logs.length,
    };

    res.json(response);
  } catch (error) {
    console.error("Error getting logs:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Add a new log entry
export const addLog: RequestHandler = (req, res) => {
  try {
    const { level, category, message, details } = req.body;

    if (!level || !category || !message) {
      return res.status(400).json({
        error: "Missing required fields: level, category, message",
      });
    }

    addLogEntry({
      level,
      category,
      message,
      details,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.headers["user-agent"],
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Error adding log:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Clear all logs
export const clearLogs: RequestHandler = (req, res) => {
  try {
    writeLogs([]);

    // Add a log entry about clearing logs
    addLogEntry({
      level: "info",
      category: "system",
      message: "System logs cleared by administrator",
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.headers["user-agent"],
    });

    res.json({ success: true, message: "Logs cleared successfully" });
  } catch (error) {
    console.error("Error clearing logs:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Export logs as JSON
export const exportLogs: RequestHandler = (req, res) => {
  try {
    const logs = readLogs();

    const exportData = {
      exportTimestamp: new Date().toISOString(),
      totalEntries: logs.length,
      logs: logs,
    };

    res.setHeader("Content-Type", "application/json");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="system-logs-${new Date().toISOString().split("T")[0]}.json"`,
    );
    res.json(exportData);

    // Log the export action
    addLogEntry({
      level: "info",
      category: "system",
      message: `System logs exported (${logs.length} entries)`,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.headers["user-agent"],
    });
  } catch (error) {
    console.error("Error exporting logs:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get system health status
export const getSystemHealth: RequestHandler = (req, res) => {
  try {
    const logs = readLogs();
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const recentLogs = logs.filter(
      (log) => new Date(log.timestamp) >= last24Hours,
    );

    const errorCount = recentLogs.filter((log) => log.level === "error").length;
    const warningCount = recentLogs.filter(
      (log) => log.level === "warning",
    ).length;
    const infoCount = recentLogs.filter((log) => log.level === "info").length;

    const systemHealth = {
      status:
        errorCount > 10 ? "critical" : errorCount > 5 ? "warning" : "healthy",
      last24Hours: {
        errors: errorCount,
        warnings: warningCount,
        info: infoCount,
        total: recentLogs.length,
      },
      totalLogs: logs.length,
      oldestLog: logs.length > 0 ? logs[0].timestamp : null,
      newestLog: logs.length > 0 ? logs[logs.length - 1].timestamp : null,
    };

    res.json(systemHealth);
  } catch (error) {
    console.error("Error getting system health:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Initialize some sample logs for demonstration
export function initializeLogs() {
  const logs = readLogs();

  if (logs.length === 0) {
    const sampleLogs: Omit<LogEntry, "timestamp">[] = [
      {
        level: "info",
        category: "system",
        message: "Server started successfully",
        details: { port: 8080, mode: "development" },
      },
      {
        level: "info",
        category: "user",
        message: "Admin logged into dashboard",
        details: { userAgent: "Browser" },
      },
      {
        level: "info",
        category: "order",
        message: "New order created",
        details: { orderId: "order_001", total: 25.5 },
      },
      {
        level: "info",
        category: "customer",
        message: "New customer registered",
        details: { customerName: "Ahmed Al-Rashid" },
      },
      {
        level: "info",
        category: "product",
        message: "Product inventory updated",
        details: { productName: "USB Cable", newStock: 45 },
      },
      {
        level: "warning",
        category: "system",
        message: "High memory usage detected",
        details: { usage: "85%" },
      },
      {
        level: "info",
        category: "analytics",
        message: "Analytics data refreshed",
        details: { recordsProcessed: 1250 },
      },
    ];

    sampleLogs.forEach((logEntry) => addLogEntry(logEntry));
  }
}
