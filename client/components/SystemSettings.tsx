import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useData } from "@/contexts/DataContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Monitor,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Info,
  Download,
  Trash2,
  RefreshCw,
  Activity,
  Database,
  Server,
  Clock,
  Eye,
  Filter,
} from "lucide-react";

interface LogEntry {
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

interface LogsResponse {
  logs: LogEntry[];
  total: number;
  hasMore: boolean;
}

interface SystemHealth {
  status: "healthy" | "warning" | "critical";
  last24Hours: {
    errors: number;
    warnings: number;
    info: number;
    total: number;
  };
  totalLogs: number;
  oldestLog: string | null;
  newestLog: string | null;
}

export default function SystemSettings() {
  const { t, language } = useLanguage();
  const { products, orders, customers, refetchData } = useData();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterLevel, setFilterLevel] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch logs from the server
  const fetchLogs = async () => {
    try {
      const params = new URLSearchParams();
      if (filterLevel !== "all") params.append("level", filterLevel);
      if (filterCategory !== "all") params.append("category", filterCategory);
      params.append("limit", "50");

      const response = await fetch(`/api/logs?${params}`);
      if (response.ok) {
        const data: LogsResponse = await response.json();
        setLogs(data.logs);
      }
    } catch (error) {
      console.error("Failed to fetch logs:", error);
    }
  };

  // Fetch system health
  const fetchSystemHealth = async () => {
    try {
      const response = await fetch("/api/logs/health");
      if (response.ok) {
        const data: SystemHealth = await response.json();
        setSystemHealth(data);
      }
    } catch (error) {
      console.error("Failed to fetch system health:", error);
    }
  };

  // Clear all logs
  const clearLogs = async () => {
    try {
      const response = await fetch("/api/logs", { method: "DELETE" });
      if (response.ok) {
        setLogs([]);
        await fetchSystemHealth();
      }
    } catch (error) {
      console.error("Failed to clear logs:", error);
    }
  };

  // Export logs
  const exportLogs = async () => {
    try {
      const response = await fetch("/api/logs/export");
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `system-logs-${new Date().toISOString().split("T")[0]}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error("Failed to export logs:", error);
    }
  };

  // Refresh data
  const handleRefresh = async () => {
    setLoading(true);
    await Promise.all([fetchLogs(), fetchSystemHealth(), refetchData()]);
    setLoading(false);
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchLogs(), fetchSystemHealth()]);
      setLoading(false);
    };

    loadData();
  }, [filterLevel, filterCategory]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchLogs();
      fetchSystemHealth();
    }, 10000); // Refresh every 10 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, filterLevel, filterCategory]);

  const getLevelIcon = (level: string) => {
    switch (level) {
      case "error":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case "debug":
        return <Eye className="w-4 h-4 text-gray-500" />;
      default:
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case "error":
        return "text-red-600 bg-red-50 border-red-200";
      case "warning":
        return "text-yellow-700 bg-yellow-50 border-yellow-200";
      case "debug":
        return "text-gray-600 bg-gray-50 border-gray-200";
      default:
        return "text-blue-600 bg-blue-50 border-blue-200";
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      system: "bg-purple-100 text-purple-800",
      user: "bg-blue-100 text-blue-800",
      order: "bg-green-100 text-green-800",
      product: "bg-orange-100 text-orange-800",
      customer: "bg-pink-100 text-pink-800",
      analytics: "bg-indigo-100 text-indigo-800",
      security: "bg-red-100 text-red-800",
    };
    return (
      colors[category as keyof typeof colors] || "bg-gray-100 text-gray-800"
    );
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString(),
    };
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="w-5 h-5" />
            {language === "ar" ? "معلومات النظام" : "System Information"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                {language === "ar" ? "البيئة" : "Environment"}
              </Label>
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {import.meta.env.MODE === "development"
                    ? language === "ar"
                      ? "تطوير"
                      : "Development"
                    : language === "ar"
                      ? "إنتاج"
                      : "Production"}
                </Badge>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                {language === "ar" ? "حالة الخادم" : "Server Status"}
              </Label>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-green-600">
                  {language === "ar" ? "يعمل" : "Running"}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                {language === "ar" ? "وقت التشغيل" : "Uptime"}
              </Label>
              <p className="text-sm text-muted-foreground">
                {language === "ar" ? "متصل" : "Connected"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Health */}
      {systemHealth && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              {language === "ar" ? "صحة النظام" : "System Health"}
              <Badge
                variant={
                  systemHealth.status === "healthy"
                    ? "default"
                    : systemHealth.status === "warning"
                      ? "secondary"
                      : "destructive"
                }
              >
                {systemHealth.status === "healthy"
                  ? language === "ar"
                    ? "سليم"
                    : "Healthy"
                  : systemHealth.status === "warning"
                    ? language === "ar"
                      ? "تحذير"
                      : "Warning"
                    : language === "ar"
                      ? "حرج"
                      : "Critical"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {systemHealth.last24Hours.errors}
                </div>
                <div className="text-sm text-red-700">
                  {language === "ar" ? "أخطاء (24 ساعة)" : "Errors (24h)"}
                </div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">
                  {systemHealth.last24Hours.warnings}
                </div>
                <div className="text-sm text-yellow-700">
                  {language === "ar" ? "تحذيرات (24 ساع��)" : "Warnings (24h)"}
                </div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {systemHealth.last24Hours.info}
                </div>
                <div className="text-sm text-blue-700">
                  {language === "ar" ? "معلومات (24 ساعة)" : "Info (24h)"}
                </div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {systemHealth.totalLogs}
                </div>
                <div className="text-sm text-green-700">
                  {language === "ar" ? "إجمالي السجلات" : "Total Logs"}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Database Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            {language === "ar" ? "حالة قاعدة البيانات" : "Database Status"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {products.length}
              </div>
              <div className="text-sm text-green-700">
                {language === "ar" ? "المنتجات" : "Products"}
              </div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {orders.length}
              </div>
              <div className="text-sm text-blue-700">
                {language === "ar" ? "الطلبات" : "Orders"}
              </div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {customers.length}
              </div>
              <div className="text-sm text-purple-700">
                {language === "ar" ? "العملاء" : "Customers"}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            {language === "ar" ? "سجلات النشاط" : "Activity Logs"}
          </CardTitle>
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="levelFilter" className="text-sm">
                {language === "ar" ? "المستوى:" : "Level:"}
              </Label>
              <Select value={filterLevel} onValueChange={setFilterLevel}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {language === "ar" ? "الكل" : "All"}
                  </SelectItem>
                  <SelectItem value="error">
                    {language === "ar" ? "خطأ" : "Error"}
                  </SelectItem>
                  <SelectItem value="warning">
                    {language === "ar" ? "تحذير" : "Warning"}
                  </SelectItem>
                  <SelectItem value="info">
                    {language === "ar" ? "معلومات" : "Info"}
                  </SelectItem>
                  <SelectItem value="debug">
                    {language === "ar" ? "تصحيح" : "Debug"}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="categoryFilter" className="text-sm">
                {language === "ar" ? "الفئة:" : "Category:"}
              </Label>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {language === "ar" ? "الكل" : "All"}
                  </SelectItem>
                  <SelectItem value="system">
                    {language === "ar" ? "النظام" : "System"}
                  </SelectItem>
                  <SelectItem value="user">
                    {language === "ar" ? "المستخدم" : "User"}
                  </SelectItem>
                  <SelectItem value="order">
                    {language === "ar" ? "الطلبات" : "Orders"}
                  </SelectItem>
                  <SelectItem value="product">
                    {language === "ar" ? "المنتجات" : "Products"}
                  </SelectItem>
                  <SelectItem value="customer">
                    {language === "ar" ? "العملاء" : "Customers"}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleRefresh}
              disabled={loading}
            >
              <RefreshCw
                className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
              />
              {language === "ar" ? "تحديث" : "Refresh"}
            </Button>
            <Button size="sm" variant="outline" onClick={exportLogs}>
              <Download className="w-4 h-4 mr-2" />
              {language === "ar" ? "تصدير" : "Export"}
            </Button>
            <Button size="sm" variant="outline" onClick={clearLogs}>
              <Trash2 className="w-4 h-4 mr-2" />
              {language === "ar" ? "مسح" : "Clear"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {logs.length > 0 ? (
              logs.map((log, index) => {
                const timestamp = formatTimestamp(log.timestamp);
                return (
                  <div
                    key={index}
                    className={`p-3 border rounded-lg ${getLevelColor(log.level)}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        {getLevelIcon(log.level)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge
                              variant="outline"
                              className={getCategoryColor(log.category)}
                            >
                              {log.category}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {timestamp.date} {timestamp.time}
                            </span>
                          </div>
                          <p className="text-sm font-medium">{log.message}</p>
                          {log.details && (
                            <pre className="text-xs text-muted-foreground mt-1 bg-white/50 p-2 rounded overflow-x-auto">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="w-8 h-8 mx-auto mb-2" />
                <p>
                  {language === "ar"
                    ? "لا توجد سجلات متاحة"
                    : "No logs available"}
                </p>
              </div>
            )}
          </div>
          {logs.length > 0 && (
            <div className="mt-4 text-sm text-muted-foreground text-center">
              {language === "ar"
                ? `عرض ${logs.length} من السجلات الأخيرة`
                : `Showing ${logs.length} recent log entries`}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
