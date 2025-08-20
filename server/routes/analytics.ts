import { RequestHandler } from "express";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

interface AnalyticsEvent {
  timestamp: string;
  type:
    | "page_view"
    | "order_placed"
    | "customer_created"
    | "product_viewed"
    | "error";
  page?: string;
  userAgent?: string;
  ip?: string;
  orderId?: string;
  customerId?: string;
  productId?: string;
  error?: string;
  revenue?: number;
}

interface AnalyticsData {
  events: AnalyticsEvent[];
  sessionData: {
    totalSessions: number;
    uniqueVisitors: number;
    pageViews: number;
    lastUpdated: string;
  };
}

const ANALYTICS_FILE = join(process.cwd(), "analytics_data.json");

// Helper function to read analytics data
function readAnalyticsData(): AnalyticsData {
  if (!existsSync(ANALYTICS_FILE)) {
    const initialData: AnalyticsData = {
      events: [],
      sessionData: {
        totalSessions: 0,
        uniqueVisitors: 0,
        pageViews: 0,
        lastUpdated: new Date().toISOString(),
      },
    };
    writeFileSync(ANALYTICS_FILE, JSON.stringify(initialData, null, 2));
    return initialData;
  }

  try {
    const data = readFileSync(ANALYTICS_FILE, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading analytics data:", error);
    return {
      events: [],
      sessionData: {
        totalSessions: 0,
        uniqueVisitors: 0,
        pageViews: 0,
        lastUpdated: new Date().toISOString(),
      },
    };
  }
}

// Helper function to write analytics data
function writeAnalyticsData(data: AnalyticsData) {
  try {
    writeFileSync(ANALYTICS_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error writing analytics data:", error);
  }
}

// Track analytics event
export const trackEvent: RequestHandler = (req, res) => {
  try {
    const { type, page, orderId, customerId, productId, error, revenue } =
      req.body;

    if (!type) {
      return res.status(400).json({ error: "Event type is required" });
    }

    const analyticsData = readAnalyticsData();

    const event: AnalyticsEvent = {
      timestamp: new Date().toISOString(),
      type,
      page,
      userAgent: req.headers["user-agent"],
      ip: req.ip || req.connection.remoteAddress,
      orderId,
      customerId,
      productId,
      error,
      revenue,
    };

    analyticsData.events.push(event);

    // Update session data based on event type
    if (type === "page_view") {
      analyticsData.sessionData.pageViews++;
    }

    analyticsData.sessionData.lastUpdated = new Date().toISOString();

    // Keep only last 10000 events to prevent file from growing too large
    if (analyticsData.events.length > 10000) {
      analyticsData.events = analyticsData.events.slice(-10000);
    }

    writeAnalyticsData(analyticsData);

    res.json({ success: true, eventId: event.timestamp });
  } catch (error) {
    console.error("Error tracking event:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get analytics dashboard data
export const getAnalytics: RequestHandler = (req, res) => {
  try {
    const { timeRange = "7days" } = req.query;
    const analyticsData = readAnalyticsData();

    const now = new Date();
    const daysAgo =
      timeRange === "7days" ? 7 : timeRange === "30days" ? 30 : 90;
    const startDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

    // Filter events by time range
    const filteredEvents = analyticsData.events.filter(
      (event) => new Date(event.timestamp) >= startDate,
    );

    // Calculate metrics
    const pageViews = filteredEvents.filter(
      (e) => e.type === "page_view",
    ).length;
    const orders = filteredEvents.filter((e) => e.type === "order_placed");
    const errors = filteredEvents.filter((e) => e.type === "error");
    const productViews = filteredEvents.filter(
      (e) => e.type === "product_viewed",
    );

    // Calculate revenue
    const totalRevenue = orders.reduce(
      (sum, order) => sum + (order.revenue || 0),
      0,
    );

    // Get unique visitors (approximate by unique IPs)
    const uniqueIPs = new Set(filteredEvents.map((e) => e.ip)).size;

    // Daily breakdown
    const dailyData = [];
    for (let i = daysAgo - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayStart = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
      );
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

      const dayEvents = filteredEvents.filter((event) => {
        const eventDate = new Date(event.timestamp);
        return eventDate >= dayStart && eventDate < dayEnd;
      });

      const dayPageViews = dayEvents.filter(
        (e) => e.type === "page_view",
      ).length;
      const dayOrders = dayEvents.filter(
        (e) => e.type === "order_placed",
      ).length;
      const dayRevenue = dayEvents
        .filter((e) => e.type === "order_placed")
        .reduce((sum, order) => sum + (order.revenue || 0), 0);

      dailyData.push({
        date: date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        pageViews: dayPageViews,
        orders: dayOrders,
        revenue: dayRevenue,
        visitors: new Set(dayEvents.map((e) => e.ip)).size,
      });
    }

    // Top pages
    const pageViewEvents = filteredEvents.filter(
      (e) => e.type === "page_view" && e.page,
    );
    const pageStats = pageViewEvents.reduce(
      (acc, event) => {
        const page = event.page || "/";
        acc[page] = (acc[page] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const topPages = Object.entries(pageStats)
      .map(([page, views]) => ({
        page,
        views,
        title: page === "/" ? "الصفحة الرئيسية" : page,
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);

    // Browser breakdown (simplified)
    const userAgents = filteredEvents
      .map((e) => e.userAgent || "")
      .filter((ua) => ua);

    const deviceTypes = {
      mobile: userAgents.filter((ua) => /Mobile|Android|iPhone/i.test(ua))
        .length,
      desktop: userAgents.filter(
        (ua) => !/Mobile|Android|iPhone/i.test(ua) && ua.length > 0,
      ).length,
    };

    // Current active sessions (last 5 minutes)
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    const recentEvents = analyticsData.events.filter(
      (event) => new Date(event.timestamp) >= fiveMinutesAgo,
    );
    const activeSessions = new Set(recentEvents.map((e) => e.ip)).size;

    const response = {
      timeRange,
      summary: {
        pageViews,
        orders: orders.length,
        revenue: totalRevenue,
        uniqueVisitors: uniqueIPs,
        activeSessions,
        errors: errors.length,
        productViews: productViews.length,
      },
      dailyData,
      topPages,
      deviceBreakdown: [
        {
          name: "الكمبيوتر المكتبي",
          value: deviceTypes.desktop,
          color: "#8884d8",
        },
        { name: "الهاتف المحمول", value: deviceTypes.mobile, color: "#82ca9d" },
      ],
      errors: errors.slice(-20).map((e) => ({
        timestamp: e.timestamp,
        error: e.error,
        page: e.page,
      })),
      lastUpdated: analyticsData.sessionData.lastUpdated,
    };

    res.json(response);
  } catch (error) {
    console.error("Error getting analytics:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get real-time data
export const getRealTimeData: RequestHandler = (req, res) => {
  try {
    const analyticsData = readAnalyticsData();
    const now = new Date();

    // Last 5 minutes for active users
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    const recentEvents = analyticsData.events.filter(
      (event) => new Date(event.timestamp) >= fiveMinutesAgo,
    );

    const activeSessions = new Set(recentEvents.map((e) => e.ip)).size;

    // Last hour stats
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const hourlyEvents = analyticsData.events.filter(
      (event) => new Date(event.timestamp) >= oneHourAgo,
    );

    const response = {
      activeSessions,
      lastHourPageViews: hourlyEvents.filter((e) => e.type === "page_view")
        .length,
      lastHourOrders: hourlyEvents.filter((e) => e.type === "order_placed")
        .length,
      lastHourErrors: hourlyEvents.filter((e) => e.type === "error").length,
      timestamp: now.toISOString(),
    };

    res.json(response);
  } catch (error) {
    console.error("Error getting real-time data:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
