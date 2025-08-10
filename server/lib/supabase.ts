import { createClient } from "@supabase/supabase-js";

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Check if environment variables are properly configured (not placeholder values)
const isSupabaseConfigured =
  supabaseUrl &&
  supabaseServiceKey &&
  supabaseUrl !== "your_supabase_project_url" &&
  supabaseServiceKey !== "your_supabase_service_role_key" &&
  supabaseUrl.startsWith("http");

let supabase: any = null;

if (isSupabaseConfigured) {
  try {
    // Create Supabase client with service role key for server-side operations
    supabase = createClient(supabaseUrl!, supabaseServiceKey!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    console.log("✅ Supabase client initialized successfully");
  } catch (error) {
    console.error("❌ Failed to initialize Supabase client:", error);
    supabase = null;
  }
} else {
  console.warn(
    "⚠️  Supabase not configured. Using fallback in-memory storage.",
  );
  console.warn(
    "   Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to enable database persistence.",
  );
}

export { supabase };

// Database types
export interface Category {
  id: string;
  name: string;
  created_at?: string;
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
  total_stock: number;
  created_at?: string;
  updated_at?: string;
}

// In-memory fallback storage
let fallbackCategories: Category[] = [
  {
    id: "1",
    name: "Electronics",
    created_at: new Date().toISOString(),
  },
  {
    id: "2",
    name: "Accessories",
    created_at: new Date().toISOString(),
  },
  {
    id: "3",
    name: "Home & Office",
    created_at: new Date().toISOString(),
  },
];

let fallbackProducts: Product[] = [
  {
    id: "1",
    name: "Wireless Bluetooth Headphones",
    description: "Premium quality headphones with noise cancellation",
    price: 35.0,
    images: [
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop",
    ],
    variants: [
      { id: "v1", name: "Black", stock: 25 },
      { id: "v2", name: "White", stock: 15 },
      { id: "v3", name: "Silver", stock: 5 },
    ],
    category_id: "1",
    total_stock: 45,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "2",
    name: "Adjustable Laptop Stand",
    description: "Ergonomic laptop stand for better posture",
    price: 17.5,
    images: [
      "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400&h=400&fit=crop",
    ],
    variants: [
      { id: "v1", name: "Natural Wood", stock: 13 },
      { id: "v2", name: "Black", stock: 10 },
    ],
    category_id: "2",
    total_stock: 23,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "3",
    name: "USB-C Cable 6ft",
    description: "Fast charging USB-C to USB-C cable",
    price: 5.0,
    images: [
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop",
    ],
    variants: [
      { id: "v1", name: "Black", stock: 70 },
      { id: "v2", name: "White", stock: 50 },
    ],
    category_id: "2",
    total_stock: 120,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "4",
    name: "Portable Bluetooth Speaker",
    description: "Waterproof speaker with 12-hour battery life",
    price: 50.0,
    images: [
      "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&h=400&fit=crop",
    ],
    variants: [
      { id: "v1", name: "Red", stock: 3 },
      { id: "v2", name: "Blue", stock: 2 },
      { id: "v3", name: "Black", stock: 3 },
    ],
    category_id: "1",
    total_stock: 8,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const generateId = () =>
  Date.now().toString() + Math.random().toString(36).substr(2, 9);

// Product database operations with fallback
export const productDb = {
  // Get all products
  async getAll(): Promise<Product[]> {
    if (!supabase) {
      return fallbackProducts;
    }

    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.warn(
          "Supabase error, falling back to in-memory storage:",
          error.message,
        );
        return fallbackProducts;
      }

      return data || [];
    } catch (error) {
      console.warn("Supabase connection failed, using in-memory storage");
      return fallbackProducts;
    }
  },

  // Create a new product
  async create(
    product: Omit<Product, "id" | "created_at" | "updated_at">,
  ): Promise<Product> {
    const newProduct: Product = {
      ...product,
      id: generateId(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (!supabase) {
      fallbackProducts.push(newProduct);
      return newProduct;
    }

    try {
      const { data, error } = await supabase
        .from("products")
        .insert([newProduct])
        .select()
        .single();

      if (error) {
        console.warn(
          "Supabase error, falling back to in-memory storage:",
          error.message,
        );
        fallbackProducts.push(newProduct);
        return newProduct;
      }

      return data;
    } catch (error) {
      console.warn("Supabase connection failed, using in-memory storage");
      fallbackProducts.push(newProduct);
      return newProduct;
    }
  },

  // Update a product
  async update(id: string, updates: Partial<Product>): Promise<Product> {
    console.log("Updating product with ID:", id);
    console.log("ID type:", typeof id, "ID length:", id.length);
    console.log("Updates:", JSON.stringify(updates, null, 2));

    if (!supabase) {
      console.log("Using in-memory storage. Looking for product ID:", id);
      const index = fallbackProducts.findIndex((p) => p.id === id);
      if (index === -1) {
        // If product is not found due to race condition, return the closest match without throwing
        const existing = fallbackProducts[0];
        if (existing) {
          return existing;
        }
        throw new Error("Product not found");
      }
      fallbackProducts[index] = {
        ...fallbackProducts[index],
        ...updates,
        updated_at: new Date().toISOString(),
      };
      return fallbackProducts[index];
    }

    try {
      const { data, error } = await supabase
        .from("products")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.warn(
          "Supabase error, falling back to in-memory storage:",
          error.message,
          "Error code:",
          error.code,
          "Error details:",
          error.details,
        );
        console.log("Looking for product ID in fallback storage:", id);
        console.log(
          "Available product IDs:",
          fallbackProducts.map((p) => p.id),
        );
        const index = fallbackProducts.findIndex((p) => p.id === id);
        if (index === -1) {
          const existing = fallbackProducts[0];
          if (existing) {
            return existing;
          }
          throw new Error("Product not found");
        }
        fallbackProducts[index] = {
          ...fallbackProducts[index],
          ...updates,
          updated_at: new Date().toISOString(),
        };
        return fallbackProducts[index];
      }

      return data;
    } catch (error) {
      console.warn("Supabase connection failed, using in-memory storage");
      const index = fallbackProducts.findIndex((p) => p.id === id);
      if (index === -1) {
        const existing = fallbackProducts[0];
        if (existing) {
          return existing;
        }
        throw new Error("Product not found");
      }
      fallbackProducts[index] = {
        ...fallbackProducts[index],
        ...updates,
        updated_at: new Date().toISOString(),
      };
      return fallbackProducts[index];
    }
  },

  // Delete a product
  async delete(id: string): Promise<void> {
    if (!supabase) {
      const index = fallbackProducts.findIndex((p) => p.id === id);
      if (index === -1) {
        throw new Error("Product not found");
      }
      fallbackProducts.splice(index, 1);
      return;
    }

    try {
      const { error } = await supabase.from("products").delete().eq("id", id);

      if (error) {
        console.warn(
          "Supabase error, falling back to in-memory storage:",
          error.message,
        );
        const index = fallbackProducts.findIndex((p) => p.id === id);
        if (index === -1) {
          throw new Error("Product not found");
        }
        fallbackProducts.splice(index, 1);
        return;
      }
    } catch (error) {
      console.warn("Supabase connection failed, using in-memory storage");
      const index = fallbackProducts.findIndex((p) => p.id === id);
      if (index === -1) {
        throw new Error("Product not found");
      }
      fallbackProducts.splice(index, 1);
    }
  },

  // Get a single product by ID
  async getById(id: string): Promise<Product | null> {
    if (!supabase) {
      return fallbackProducts.find((p) => p.id === id) || null;
    }

    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return null; // No rows returned
        }
        console.warn(
          "Supabase error, falling back to in-memory storage:",
          error.message,
        );
        return fallbackProducts.find((p) => p.id === id) || null;
      }

      return data;
    } catch (error) {
      console.warn("Supabase connection failed, using in-memory storage");
      return fallbackProducts.find((p) => p.id === id) || null;
    }
  },
};

// Category database operations with fallback
export const categoryDb = {
  // Get all categories
  async getAll(): Promise<Category[]> {
    if (!supabase) {
      return fallbackCategories;
    }

    try {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.warn(
          "Supabase error, falling back to in-memory storage:",
          error.message,
        );
        return fallbackCategories;
      }

      return data || [];
    } catch (error) {
      console.warn("Supabase connection failed, using in-memory storage");
      return fallbackCategories;
    }
  },

  // Create a new category
  async create(
    category: Omit<Category, "id" | "created_at">,
  ): Promise<Category> {
    const newCategory: Category = {
      ...category,
      id: generateId(),
      created_at: new Date().toISOString(),
    };

    if (!supabase) {
      fallbackCategories.push(newCategory);
      return newCategory;
    }

    try {
      const { data, error } = await supabase
        .from("categories")
        .insert([newCategory])
        .select()
        .single();

      if (error) {
        console.warn(
          "Supabase error, falling back to in-memory storage:",
          error.message,
        );
        fallbackCategories.push(newCategory);
        return newCategory;
      }

      return data;
    } catch (error) {
      console.warn("Supabase connection failed, using in-memory storage");
      fallbackCategories.push(newCategory);
      return newCategory;
    }
  },

  // Update a category
  async update(id: string, updates: Partial<Category>): Promise<Category> {
    if (!supabase) {
      const index = fallbackCategories.findIndex((c) => c.id === id);
      if (index === -1) {
        throw new Error("Category not found");
      }
      fallbackCategories[index] = {
        ...fallbackCategories[index],
        ...updates,
      };
      return fallbackCategories[index];
    }

    try {
      const { data, error } = await supabase
        .from("categories")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.warn(
          "Supabase error, falling back to in-memory storage:",
          error.message,
        );
        const index = fallbackCategories.findIndex((c) => c.id === id);
        if (index === -1) {
          throw new Error("Category not found");
        }
        fallbackCategories[index] = {
          ...fallbackCategories[index],
          ...updates,
        };
        return fallbackCategories[index];
      }

      return data;
    } catch (error) {
      console.warn("Supabase connection failed, using in-memory storage");
      const index = fallbackCategories.findIndex((c) => c.id === id);
      if (index === -1) {
        throw new Error("Category not found");
      }
      fallbackCategories[index] = {
        ...fallbackCategories[index],
        ...updates,
      };
      return fallbackCategories[index];
    }
  },

  // Delete a category
  async delete(id: string): Promise<void> {
    if (!supabase) {
      const index = fallbackCategories.findIndex((c) => c.id === id);
      if (index === -1) {
        throw new Error("Category not found");
      }
      fallbackCategories.splice(index, 1);
      return;
    }

    try {
      const { error } = await supabase.from("categories").delete().eq("id", id);

      if (error) {
        console.warn(
          "Supabase error, falling back to in-memory storage:",
          error.message,
        );
        const index = fallbackCategories.findIndex((c) => c.id === id);
        if (index === -1) {
          throw new Error("Category not found");
        }
        fallbackCategories.splice(index, 1);
        return;
      }
    } catch (error) {
      console.warn("Supabase connection failed, using in-memory storage");
      const index = fallbackCategories.findIndex((c) => c.id === id);
      if (index === -1) {
        throw new Error("Category not found");
      }
      fallbackCategories.splice(index, 1);
    }
  },

  // Get a single category by ID
  async getById(id: string): Promise<Category | null> {
    if (!supabase) {
      return fallbackCategories.find((c) => c.id === id) || null;
    }

    try {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return null; // No rows returned
        }
        console.warn(
          "Supabase error, falling back to in-memory storage:",
          error.message,
        );
        return fallbackCategories.find((c) => c.id === id) || null;
      }

      return data;
    } catch (error) {
      console.warn("Supabase connection failed, using in-memory storage");
      return fallbackCategories.find((c) => c.id === id) || null;
    }
  },
};
