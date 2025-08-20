import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { handleDemo } from "./routes/demo";
import {
  getAllCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerById,
} from "./routes/customers";
import {
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductById,
} from "./routes/products";
import {
  getAllOrders,
  createOrder,
  updateOrder,
  deleteOrder,
  getOrderById,
} from "./routes/orders";
import {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryById,
} from "./routes/categories";
import {
  uploadMiddleware,
  handleImageUpload,
  handleMultipleImageUpload,
  deleteImage,
  getStorageInfo,
} from "./routes/upload";
import { trackEvent, getAnalytics, getRealTimeData } from "./routes/analytics";
import {
  getLogs,
  addLog,
  clearLogs,
  exportLogs,
  getSystemHealth,
  initializeLogs,
} from "./routes/logs";
import { handleFixCharacters } from "./routes/fix-characters";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Serve uploaded files statically
  app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Upload routes
  app.get("/api/upload/info", getStorageInfo);
  app.post("/api/upload", uploadMiddleware, handleImageUpload);
  app.post("/api/upload/multiple", handleMultipleImageUpload);
  app.delete("/api/upload/:filename", deleteImage);

  // Customer routes
  app.get("/api/customers", getAllCustomers);
  app.get("/api/customers/:id", getCustomerById);
  app.post("/api/customers", createCustomer);
  app.put("/api/customers/:id", updateCustomer);
  app.delete("/api/customers/:id", deleteCustomer);

  // Product routes
  app.get("/api/products", getAllProducts);
  app.get("/api/products/:id", getProductById);
  app.post("/api/products", createProduct);
  app.put("/api/products/:id", updateProduct);
  app.delete("/api/products/:id", deleteProduct);

  // Order routes
  app.get("/api/orders", getAllOrders);
  app.get("/api/orders/:id", getOrderById);
  app.post("/api/orders", createOrder);
  app.put("/api/orders/:id", updateOrder);
  app.delete("/api/orders/:id", deleteOrder);

  // Category routes
  app.get("/api/categories", getAllCategories);
  app.get("/api/categories/:id", getCategoryById);
  app.post("/api/categories", createCategory);
  app.put("/api/categories/:id", updateCategory);
  app.delete("/api/categories/:id", deleteCategory);

  // Analytics routes
  app.post("/api/analytics/track", trackEvent);
  app.get("/api/analytics", getAnalytics);
  app.get("/api/analytics/realtime", getRealTimeData);

  // Logs routes
  app.get("/api/logs", getLogs);
  app.post("/api/logs", addLog);
  app.delete("/api/logs", clearLogs);
  app.get("/api/logs/export", exportLogs);
  app.get("/api/logs/health", getSystemHealth);

  // Initialize sample logs
  initializeLogs();

  return app;
}
