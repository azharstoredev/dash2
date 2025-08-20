import { Customer, Product, Order, Category } from "@/contexts/DataContext";

const API_BASE = "/api";

// Helper function for API calls with retry logic
async function apiCall<T>(url: string, options?: RequestInit, retryCount = 0): Promise<T> {
  const maxRetries = 2;
  const retryDelay = 1000 * (retryCount + 1); // 1s, 2s delay

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const response = await fetch(`${API_BASE}${url}`, {
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      signal: controller.signal,
      ...options,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorMessage = `API Error: ${response.status}`;

      try {
        // Clone the response to avoid "body stream already read" error
        const responseClone = response.clone();
        const errorData = await responseClone.json();

        console.error("API Error details:", {
          url: `${API_BASE}${url}`,
          status: response.status,
          statusText: response.statusText,
          errorData,
        });

        if (errorData?.error) {
          errorMessage = errorData.error;
        } else if (errorData?.message) {
          errorMessage = errorData.message;
        } else {
          errorMessage = `${errorMessage} ${response.statusText}`;
        }
      } catch (parseError) {
        // If response isn't JSON, use status text
        console.error("Failed to parse error response:", parseError);
        errorMessage = `${errorMessage} ${response.statusText || "Unknown error"}`;
      }

      throw new Error(errorMessage);
    }

    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  } catch (error) {
    console.error(`API call failed (attempt ${retryCount + 1}):`, {
      url: `${API_BASE}${url}`,
      error: error instanceof Error ? error.message : String(error),
    });

    // Check if we should retry
    if (retryCount < maxRetries &&
        (error instanceof Error &&
         (error.name === 'AbortError' ||
          error.message.includes('Failed to fetch') ||
          error.message.includes('Network error')))) {

      console.log(`Retrying API call in ${retryDelay}ms...`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
      return apiCall<T>(url, options, retryCount + 1);
    }

    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Network error or server is unavailable");
  }
}

// Customer API
export const customerApi = {
  getAll: () => apiCall<Customer[]>("/customers"),
  create: (customer: Omit<Customer, "id" | "createdAt">) =>
    apiCall<Customer>("/customers", {
      method: "POST",
      body: JSON.stringify(customer),
    }),
  update: (id: string, customer: Partial<Customer>) =>
    apiCall<Customer>(`/customers/${id}`, {
      method: "PUT",
      body: JSON.stringify(customer),
    }),
  delete: (id: string) =>
    apiCall<void>(`/customers/${id}`, {
      method: "DELETE",
    }),
};

// Product API
export const productApi = {
  getAll: () => apiCall<Product[]>("/products"),
  create: (product: Omit<Product, "id">) =>
    apiCall<Product>("/products", {
      method: "POST",
      body: JSON.stringify(product),
    }),
  update: (id: string, product: Partial<Product>) =>
    apiCall<Product>(`/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(product),
    }),
  delete: (id: string) =>
    apiCall<void>(`/products/${id}`, {
      method: "DELETE",
    }),
};

// Order API
export const orderApi = {
  getAll: () => apiCall<Order[]>("/orders"),
  create: (order: Omit<Order, "id" | "createdAt" | "updatedAt">) =>
    apiCall<Order>("/orders", {
      method: "POST",
      body: JSON.stringify(order),
    }),
  update: (id: string, order: Partial<Order>) =>
    apiCall<Order>(`/orders/${id}`, {
      method: "PUT",
      body: JSON.stringify(order),
    }),
  delete: (id: string) =>
    apiCall<void>(`/orders/${id}`, {
      method: "DELETE",
    }),
};

// Category API
export const categoryApi = {
  getAll: () => apiCall<Category[]>("/categories"),
  create: (category: Omit<Category, "id" | "createdAt">) =>
    apiCall<Category>("/categories", {
      method: "POST",
      body: JSON.stringify(category),
    }),
  update: (id: string, category: Partial<Category>) =>
    apiCall<Category>(`/categories/${id}`, {
      method: "PUT",
      body: JSON.stringify(category),
    }),
  delete: (id: string) =>
    apiCall<void>(`/categories/${id}`, {
      method: "DELETE",
    }),
};

// Convenience exports for store components
export const getProducts = productApi.getAll;
export const createCustomer = customerApi.create;
export const createOrder = orderApi.create;
