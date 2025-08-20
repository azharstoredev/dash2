import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { customerApi, productApi, orderApi, categoryApi } from "@/services/api";
import { analyticsService } from "@/services/analytics";

// Helper function to add logs
async function addLog(
  level: "info" | "warning" | "error",
  category: string,
  message: string,
  details?: any,
) {
  try {
    await fetch("/api/logs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        level,
        category,
        message,
        details,
      }),
    });
  } catch (error) {
    console.error("Failed to add log:", error);
  }
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string; // Backward compatibility
  home?: string;
  road?: string;
  block?: string;
  town?: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  createdAt: string;
}

export interface ProductVariant {
  id: string;
  name: string;
  stock: number;
  image?: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  variants: ProductVariant[];
  category_id?: string;

  total_stock?: number; // Database field name
}

export interface OrderItem {
  productId: string;
  variantId?: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  customerId: string;
  customer_id?: string; // Database field name
  items: OrderItem[];
  total: number;
  status: "processing" | "ready" | "delivered" | "picked-up";
  deliveryType: "delivery" | "pickup";
  delivery_type?: "delivery" | "pickup"; // Database field name
  createdAt: string;
  updatedAt: string;
  created_at?: string; // Database field name
  updated_at?: string; // Database field name
  notes?: string;
}

interface DataContextType {
  customers: Customer[];
  products: Product[];
  orders: Order[];
  categories: Category[];
  loading: boolean;
  addCustomer: (customer: Omit<Customer, "id" | "createdAt">) => Promise<void>;
  updateCustomer: (id: string, customer: Partial<Customer>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  addProduct: (product: Omit<Product, "id">) => Promise<void>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  addOrder: (
    order: Omit<Order, "id" | "createdAt" | "updatedAt">,
  ) => Promise<void>;
  updateOrder: (id: string, order: Partial<Order>) => Promise<void>;
  deleteOrder: (id: string) => Promise<void>;
  updateOrderStatus: (id: string, status: Order["status"]) => Promise<void>;
  addCategory: (category: Omit<Category, "id" | "createdAt">) => Promise<void>;
  updateCategory: (id: string, category: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  getCustomerById: (id: string) => Customer | undefined;
  getProductById: (id: string) => Product | undefined;
  getVariantById: (
    productId: string,
    variantId: string,
  ) => ProductVariant | undefined;
  getCategoryById: (id: string) => Category | undefined;
  getOrderNumber: (orderId: string) => number;
  refetchData: () => Promise<void>;
  uploadImage: (file: File) => Promise<string>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const loadData = async (retryCount = 0) => {
    const maxRetries = 3;
    const delay = Math.min(1000 * Math.pow(2, retryCount), 5000); // Exponential backoff with max 5s

    try {
      setLoading(true);

      // Load data with better error recovery - try individual endpoints if Promise.all fails
      try {
        const [customersData, productsData, ordersData, categoriesData] =
          await Promise.all([
            customerApi.getAll(),
            productApi.getAll(),
            orderApi.getAll(),
            categoryApi.getAll(),
          ]);
        setCustomers(customersData);
        const normalizedProducts = productsData as Product[];
        setProducts(normalizedProducts);
        setOrders(ordersData);
        setCategories(categoriesData);
      } catch (parallelError) {
        // If parallel loading fails, try loading individually
        console.warn(
          "Parallel loading failed, trying individual requests:",
          parallelError,
        );

        try {
          const customersData = await customerApi.getAll().catch(() => []);
          const productsData = await productApi.getAll().catch(() => []);
          const ordersData = await orderApi.getAll().catch(() => []);
          const categoriesData = await categoryApi.getAll().catch(() => []);

          setCustomers(customersData);
          setProducts(productsData as Product[]);
          setOrders(ordersData);
          setCategories(categoriesData);
        } catch (individualError) {
          throw individualError;
        }
      }

      console.log("Data loaded successfully");
    } catch (error) {
      console.error(`Failed to load data (attempt ${retryCount + 1}):`, error);

      if (retryCount < maxRetries) {
        console.log(`Retrying in ${delay}ms...`);
        setTimeout(() => loadData(retryCount + 1), delay);
        return;
      } else {
        console.error("Max retries reached. Using empty data.");
        // Set empty arrays to allow UI to function
        setCustomers([]);
        setProducts([]);
        setOrders([]);
        setCategories([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Delay to allow server to start up in development
    // Longer delay in development to avoid fetch failures on server restart
    const isDevelopment = process.env.NODE_ENV === "development";
    const delay = isDevelopment ? 1000 : 100;

    const timer = setTimeout(() => {
      loadData();
    }, delay);

    return () => clearTimeout(timer);
  }, []);

  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = "Upload failed";

        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch {
          // If not JSON, use status text
          errorMessage = response.statusText || errorMessage;
        }

        throw new Error(`Image upload failed: ${errorMessage}`);
      }

      const data = await response.json();
      return data.url;
    } catch (error) {
      console.error("Failed to upload image:", error);
      if (error instanceof Error) {
        throw new Error(
          error.message.includes("upload")
            ? error.message
            : `Failed to upload image: ${error.message}`,
        );
      }
      throw new Error("Failed to upload image: Unknown error");
    }
  };

  const addCustomer = async (
    customerData: Omit<Customer, "id" | "createdAt">,
  ) => {
    try {
      const newCustomer = await customerApi.create(customerData);
      setCustomers((prev) => [...prev, newCustomer]);

      // Track customer creation analytics
      analyticsService.trackCustomerCreated(newCustomer.id);

      // Log customer creation
      addLog(
        "info",
        "customer",
        `New customer registered: ${newCustomer.name}`,
        {
          customerId: newCustomer.id,
          customerName: newCustomer.name,
          phone: newCustomer.phone,
        },
      );
    } catch (error) {
      console.error("Failed to add customer:", error);
      addLog("error", "customer", "Failed to create customer", {
        error: error.message,
      });
      throw error;
    }
  };

  const updateCustomer = async (
    id: string,
    customerData: Partial<Customer>,
  ) => {
    try {
      const updatedCustomer = await customerApi.update(id, customerData);
      setCustomers((prev) =>
        prev.map((customer) =>
          customer.id === id ? updatedCustomer : customer,
        ),
      );
    } catch (error) {
      console.error("Failed to update customer:", error);
      throw error;
    }
  };

  const deleteCustomer = async (id: string) => {
    try {
      await customerApi.delete(id);
      setCustomers((prev) => prev.filter((customer) => customer.id !== id));
    } catch (error) {
      console.error("Failed to delete customer:", error);
      throw error;
    }
  };

  const addProduct = async (productData: Omit<Product, "id">) => {
    try {
      const newProduct = await productApi.create(productData);
      setProducts((prev) => [...prev, newProduct]);

      // Log product creation
      addLog("info", "product", `New product added: ${newProduct.name}`, {
        productId: newProduct.id,
        productName: newProduct.name,
        price: newProduct.price,
        variants: newProduct.variants?.length || 0,
      });
    } catch (error) {
      console.error("Failed to add product:", error);
      addLog("error", "product", "Failed to create product", {
        error: error.message,
      });
      throw error;
    }
  };

  const updateProduct = async (id: string, productData: Partial<Product>) => {
    try {
      const updatedProduct = await productApi.update(id, productData);
      setProducts((prev) =>
        prev.map((product) => (product.id === id ? updatedProduct : product)),
      );
    } catch (error) {
      console.error("Failed to update product:", error);
      throw error;
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      await productApi.delete(id);
      setProducts((prev) => prev.filter((product) => product.id !== id));
    } catch (error) {
      console.error("Failed to delete product:", error);
      throw error;
    }
  };

  const addOrder = async (
    orderData: Omit<Order, "id" | "createdAt" | "updatedAt">,
  ) => {
    try {
      const newOrder = await orderApi.create(orderData);
      setOrders((prev) => [...prev, newOrder]);

      // Track order placement analytics
      analyticsService.trackOrderPlaced(newOrder.id, newOrder.total);

      // Log order creation
      addLog("info", "order", `New order created: #${newOrder.id}`, {
        orderId: newOrder.id,
        total: newOrder.total,
        customerId: newOrder.customerId,
        itemCount: newOrder.items.length,
        deliveryType: newOrder.deliveryType,
      });
    } catch (error) {
      console.error("Failed to add order:", error);
      addLog("error", "order", "Failed to create order", {
        error: error.message,
      });
      throw error;
    }
  };

  const updateOrder = async (id: string, orderData: Partial<Order>) => {
    try {
      const updatedOrder = await orderApi.update(id, orderData);
      setOrders((prev) =>
        prev.map((order) => (order.id === id ? updatedOrder : order)),
      );
    } catch (error) {
      console.error("Failed to update order:", error);
      throw error;
    }
  };

  const updateOrderStatus = async (id: string, status: Order["status"]) => {
    try {
      await updateOrder(id, { status });
    } catch (error) {
      console.error("Failed to update order status:", error);
      throw error;
    }
  };

  const deleteOrder = async (id: string) => {
    try {
      await orderApi.delete(id);
      setOrders((prev) => prev.filter((order) => order.id !== id));
    } catch (error) {
      console.error("Failed to delete order:", error);
      throw error;
    }
  };

  const addCategory = async (
    categoryData: Omit<Category, "id" | "createdAt">,
  ) => {
    try {
      const newCategory = await categoryApi.create(categoryData);
      setCategories((prev) => [...prev, newCategory]);
    } catch (error) {
      console.error("Failed to add category:", error);
      throw error;
    }
  };

  const updateCategory = async (
    id: string,
    categoryData: Partial<Category>,
  ) => {
    try {
      const updatedCategory = await categoryApi.update(id, categoryData);
      setCategories((prev) =>
        prev.map((category) =>
          category.id === id ? updatedCategory : category,
        ),
      );
    } catch (error) {
      console.error("Failed to update category:", error);
      throw error;
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      await categoryApi.delete(id);
      setCategories((prev) => prev.filter((category) => category.id !== id));
    } catch (error) {
      console.error("Failed to delete category:", error);
      throw error;
    }
  };

  const getCustomerById = (id: string) =>
    customers.find((customer) => customer.id === id);
  const getProductById = (id: string) =>
    products.find((product) => product.id === id);
  const getVariantById = (productId: string, variantId: string) => {
    const product = getProductById(productId);
    return product?.variants.find((variant) => variant.id === variantId);
  };
  const getCategoryById = (id: string) =>
    categories.find((category) => category.id === id);

  const getOrderNumber = (orderId: string) => {
    // Sort all orders by creation date (oldest first) to create consistent numbering
    const allOrdersSorted = orders.sort((a, b) => {
      const dateA = new Date(a.createdAt || a.created_at || "");
      const dateB = new Date(b.createdAt || b.created_at || "");
      return dateA.getTime() - dateB.getTime();
    });

    const orderIndex = allOrdersSorted.findIndex((o) => o.id === orderId);
    return orderIndex >= 0 ? orderIndex + 1 : 0; // Start from #1, return 0 if not found
  };

  const refetchData = async () => {
    await loadData();
  };

  // Don't render children until the provider is properly mounted
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12">
            <img
              src="https://cdn.builder.io/api/v1/image/assets%2F22d5611cd8c847859f0fef8105890b91%2F9d5f63fd358a4946ace1b6ce56f63e7e?format=webp&width=800"
              alt="أزهار ستور - azharstore"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="animate-spin rounded-full border-2 border-muted border-t-primary w-6 h-6" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <DataContext.Provider
      value={{
        customers,
        products,
        orders,
        categories,
        loading,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        addProduct,
        updateProduct,
        deleteProduct,
        addOrder,
        updateOrder,
        deleteOrder,
        updateOrderStatus,
        addCategory,
        updateCategory,
        deleteCategory,
        getCustomerById,
        getProductById,
        getVariantById,
        getCategoryById,
        getOrderNumber,
        refetchData,
        uploadImage,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
}
