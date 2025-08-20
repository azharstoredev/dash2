import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import {
  Eye,
  Users,
  ShoppingBag,
  TrendingUp,
  Activity,
  AlertCircle,
  RefreshCw,
  Globe,
  Clock,
  Smartphone,
  Monitor,
} from "lucide-react";
import {
  analyticsService,
  AnalyticsData,
  RealTimeData,
} from "@/services/analytics";

const Analytics = () => {
  const { language, t } = useLanguage();
  const [timeRange, setTimeRange] = useState<"7days" | "30days" | "90days">(
    "7days",
  );
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(
    null,
  );
  const [realTimeData, setRealTimeData] = useState<RealTimeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load analytics data
  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await analyticsService.getAnalytics(timeRange);
      setAnalyticsData(data);
    } catch (err) {
      console.error("Failed to load analytics:", err);
      setError("فشل في تحميل بيانات التحليلات");
    } finally {
      setLoading(false);
    }
  };

  // Load real-time data
  const loadRealTimeData = async () => {
    try {
      const data = await analyticsService.getRealTimeData();
      setRealTimeData(data);
    } catch (err) {
      console.error("Failed to load real-time data:", err);
    }
  };

  useEffect(() => {
    loadAnalyticsData();
  }, [timeRange]);

  useEffect(() => {
    // Load real-time data immediately and then every 30 seconds
    loadRealTimeData();
    const interval = setInterval(loadRealTimeData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    loadAnalyticsData();
    loadRealTimeData();
  };

  // Translation helpers
  const getTimeRangeLabel = (range: string) => {
    switch (range) {
      case "7days":
        return language === "ar" ? "آخر 7 أيام" : "Last 7 days";
      case "30days":
        return language === "ar" ? "آخر 30 يوماً" : "Last 30 days";
      case "90days":
        return language === "ar" ? "آخر 90 يوماً" : "Last 90 days";
      default:
        return range;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
          <p className="text-muted-foreground">
            {language === "ar"
              ? "جارٍ تحميل بيانات التحليلات..."
              : "Loading analytics data..."}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={handleRefresh}>
                <RefreshCw className="w-4 h-4 mr-2" />
                {language === "ar" ? "إعادة المحاولة" : "Try Again"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
              <p className="text-muted-foreground">
                {language === "ar"
                  ? "لا توجد بيانات تحليلات متاحة حالياً. ابدأ باستخدام الموقع لجمع البيانات."
                  : "No analytics data available yet. Start using the website to collect data."}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">
            {language === "ar" ? "تحليلات الموقع" : "Website Analytics"}
          </h1>
          <p className="text-muted-foreground mt-2">
            {language === "ar"
              ? "إحصائيات حقيقية لأداء موقعك والزوار"
              : "Real website performance and visitor insights"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={timeRange}
            onValueChange={(value: any) => setTimeRange(value)}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">
                {getTimeRangeLabel("7days")}
              </SelectItem>
              <SelectItem value="30days">
                {getTimeRangeLabel("30days")}
              </SelectItem>
              <SelectItem value="90days">
                {getTimeRangeLabel("90days")}
              </SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            {language === "ar" ? "تحديث" : "Refresh"}
          </Button>
        </div>
      </div>

      {/* Real-time Status */}
      {realTimeData && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-sm font-medium">
                  {language === "ar"
                    ? "تتبع مباشر نشط"
                    : "Real-time tracking active"}
                </span>
                <Badge variant="secondary" className="ml-2">
                  {realTimeData.activeSessions}{" "}
                  {language === "ar" ? "نشط الآن" : "active now"}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                {language === "ar" ? "آخر تحديث: " : "Last updated: "}
                {new Date(realTimeData.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === "ar" ? "مشاهدات الصفحات" : "Page Views"}
            </CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {analyticsData.summary.pageViews.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {getTimeRangeLabel(timeRange)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === "ar" ? "زوار فريدون" : "Unique Visitors"}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {analyticsData.summary.uniqueVisitors}
            </div>
            <p className="text-xs text-muted-foreground">
              {getTimeRangeLabel(timeRange)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === "ar" ? "إجمالي الطلبات" : "Total Orders"}
            </CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {analyticsData.summary.orders}
            </div>
            <p className="text-xs text-muted-foreground">
              {getTimeRangeLabel(timeRange)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === "ar" ? "إجمالي الإيرادات" : "Total Revenue"}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {language === "ar" ? "د.ب" : "BD"}{" "}
              {analyticsData.summary.revenue.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {getTimeRangeLabel(timeRange)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Trends */}
        <Card>
          <CardHeader>
            <CardTitle>
              {language === "ar" ? "الاتجاهات اليومية" : "Daily Trends"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={analyticsData.dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip
                  labelFormatter={(value) =>
                    `${language === "ar" ? "التاريخ" : "Date"}: ${value}`
                  }
                  formatter={(value, name) => [
                    value,
                    name === "pageViews"
                      ? language === "ar"
                        ? "مشاهدات الصفحات"
                        : "Page Views"
                      : name === "visitors"
                        ? language === "ar"
                          ? "الزوار"
                          : "Visitors"
                        : name === "orders"
                          ? language === "ar"
                            ? "الطلبات"
                            : "Orders"
                          : name,
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="pageViews"
                  stackId="1"
                  stroke="#8884d8"
                  fill="#8884d8"
                  fillOpacity={0.6}
                />
                <Area
                  type="monotone"
                  dataKey="visitors"
                  stackId="1"
                  stroke="#82ca9d"
                  fill="#82ca9d"
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Device Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>
              {language === "ar" ? "توزيع الأجهزة" : "Device Breakdown"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analyticsData.deviceBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analyticsData.deviceBreakdown}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {analyticsData.deviceBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                <div className="text-center">
                  <Monitor className="w-8 h-8 mx-auto mb-2" />
                  <p>
                    {language === "ar"
                      ? "لا توجد بيانات أجهزة متاحة"
                      : "No device data available"}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Pages & Errors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Pages */}
        <Card>
          <CardHeader>
            <CardTitle>
              {language === "ar" ? "أهم الصفحات" : "Top Pages"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analyticsData.topPages.length > 0 ? (
              <div className="space-y-4">
                {analyticsData.topPages.map((page, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <div className="font-medium">{page.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {page.page}
                      </div>
                    </div>
                    <div className="font-bold">{page.views}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                <div className="text-center">
                  <Globe className="w-8 h-8 mx-auto mb-2" />
                  <p>
                    {language === "ar"
                      ? "لا توجد بيانات صفحات متاحة"
                      : "No page data available"}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Errors */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {language === "ar" ? "الأخطاء الأخيرة" : "Recent Errors"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analyticsData.errors.length > 0 ? (
              <div className="space-y-3">
                {analyticsData.errors.slice(0, 5).map((error, index) => (
                  <div key={index} className="text-sm">
                    <div className="font-medium text-red-600">
                      {error.error}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {error.page} •{" "}
                      {new Date(error.timestamp).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                <div className="text-center">
                  <Activity className="w-8 h-8 mx-auto mb-2 text-green-500" />
                  <p>
                    {language === "ar"
                      ? "لا توجد أخطاء - الموقع يعمل بشكل جيد!"
                      : "No errors - site running smoothly!"}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Data Collection Notice */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            {language === "ar" ? "حول هذه البيانات" : "About This Data"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              {language === "ar"
                ? "تُظهر هذه اللوحة بيانات حقيقية من استخدام موقعك. البيانات محدثة كل 30 ثانية."
                : "This dashboard shows real data from your website usage. Data is updated every 30 seconds."}
            </p>
            <div className="flex flex-wrap gap-4 text-xs">
              <span>
                {language === "ar" ? "آخر تحديث: " : "Last updated: "}
                {new Date(analyticsData.lastUpdated).toLocaleString()}
              </span>
              <span>
                {language === "ar" ? "الأخطاء: " : "Errors: "}
                {analyticsData.summary.errors}
              </span>
              <span>
                {language === "ar" ? "مشاهدات المنتجات: " : "Product views: "}
                {analyticsData.summary.productViews}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Analytics;
