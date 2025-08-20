// Analytics service for tracking real website events

export interface AnalyticsEvent {
  type:
    | "page_view"
    | "order_placed"
    | "customer_created"
    | "product_viewed"
    | "error";
  page?: string;
  orderId?: string;
  customerId?: string;
  productId?: string;
  error?: string;
  revenue?: number;
}

export interface AnalyticsData {
  timeRange: string;
  summary: {
    pageViews: number;
    orders: number;
    revenue: number;
    uniqueVisitors: number;
    activeSessions: number;
    errors: number;
    productViews: number;
  };
  dailyData: Array<{
    date: string;
    pageViews: number;
    orders: number;
    revenue: number;
    visitors: number;
  }>;
  topPages: Array<{
    page: string;
    views: number;
    title: string;
  }>;
  deviceBreakdown: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  errors: Array<{
    timestamp: string;
    error: string;
    page: string;
  }>;
  lastUpdated: string;
}

export interface RealTimeData {
  activeSessions: number;
  lastHourPageViews: number;
  lastHourOrders: number;
  lastHourErrors: number;
  timestamp: string;
}

class AnalyticsService {
  private baseUrl = "/api/analytics";

  // Track an analytics event
  async trackEvent(event: AnalyticsEvent): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/track`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(event),
      });
    } catch (error) {
      console.error("Failed to track analytics event:", error);
    }
  }

  // Track page view
  async trackPageView(page: string): Promise<void> {
    await this.trackEvent({
      type: "page_view",
      page,
    });
  }

  // Track order placement
  async trackOrderPlaced(orderId: string, revenue: number): Promise<void> {
    await this.trackEvent({
      type: "order_placed",
      orderId,
      revenue,
    });
  }

  // Track customer creation
  async trackCustomerCreated(customerId: string): Promise<void> {
    await this.trackEvent({
      type: "customer_created",
      customerId,
    });
  }

  // Track product view
  async trackProductViewed(productId: string, page?: string): Promise<void> {
    await this.trackEvent({
      type: "product_viewed",
      productId,
      page,
    });
  }

  // Track error
  async trackError(error: string, page?: string): Promise<void> {
    await this.trackEvent({
      type: "error",
      error,
      page,
    });
  }

  // Get analytics data
  async getAnalytics(
    timeRange: "7days" | "30days" | "90days" = "7days",
  ): Promise<AnalyticsData> {
    try {
      const response = await fetch(`${this.baseUrl}?timeRange=${timeRange}`);
      if (!response.ok) {
        throw new Error("Failed to fetch analytics data");
      }
      return await response.json();
    } catch (error) {
      console.error("Failed to fetch analytics data:", error);
      throw error;
    }
  }

  // Get real-time data
  async getRealTimeData(): Promise<RealTimeData> {
    try {
      const response = await fetch(`${this.baseUrl}/realtime`);
      if (!response.ok) {
        throw new Error("Failed to fetch real-time data");
      }
      return await response.json();
    } catch (error) {
      console.error("Failed to fetch real-time data:", error);
      throw error;
    }
  }
}

export const analyticsService = new AnalyticsService();

// Utility hook for automatic page tracking
export function usePageTracking() {
  const trackCurrentPage = () => {
    const page = window.location.pathname;
    analyticsService.trackPageView(page);
  };

  return { trackCurrentPage };
}
