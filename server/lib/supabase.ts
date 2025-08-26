import { createClient } from "@supabase/supabase-js";

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Check if environment variables are properly configured. If not, throw an error.
if (!supabaseUrl || !supabaseServiceKey || supabaseUrl === "your_supabase_project_url" || supabaseServiceKey === "your_supabase_service_role_key") {
  throw new Error("Supabase environment variables SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are not configured. The server cannot start without a database connection.");
}

// Create Supabase client with service role key for server-side operations
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

console.log("✅ Supabase client initialized successfully");

export { supabase };

// Database types
export interface Category {
  id: string;
  name: string;
  name_ar?: string; // Added for multilingual support
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
  name_ar?: string; // Added for multilingual support
  description_ar?: string; // Added for multilingual support
  price: number;
  images: string[];
  variants: ProductVariant[];
  category_id?: string;
  total_stock: number;
  created_at?: string;
  updated_at?: string;
}

// Product database operations
export const productDb = {
  // Get all products
  async getAll(): Promise<Product[]> {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Supabase error fetching products: ${error.message}`);
    }

    return data || [];
  },

  // Create a new product
  async create(
    product: Omit<Product, "id" | "created_at" | "updated_at">,
  ): Promise<Product> {
    const { data, error } = await supabase
      .from("products")
      .insert([product])
      .select()
      .single();

    if (error) {
      throw new Error(`Supabase error creating product: ${error.message}`);
    }

    return data;
  },

  // Update a product
  async update(id: string, updates: Partial<Product>): Promise<Product> {
    const { data, error } = await supabase
      .from("products")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw new Error(`Supabase error updating product ${id}: ${error.message}`);
    }

    return data;
  },

  // Delete a product
  async delete(id: string): Promise<void> {
    const { error } = await supabase.from("products").delete().eq("id", id);

    if (error) {
      throw new Error(`Supabase error deleting product ${id}: ${error.message}`);
    }
  },

  // Get a single product by ID
  async getById(id: string): Promise<Product | null> {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null; // No rows returned, not an error
      }
      throw new Error(`Supabase error fetching product ${id}: ${error.message}`);
    }

    return data;
  },
};

// Category database operations
export const categoryDb = {
  // Get all categories
  async getAll(): Promise<Category[]> {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Supabase error fetching categories: ${error.message}`);
    }

    return data || [];
  },

  // Create a new category
  async create(
    category: Omit<Category, "id" | "created_at">,
  ): Promise<Category> {
    const { data, error } = await supabase
      .from("categories")
      .insert([category])
      .select()
      .single();

    if (error) {
      throw new Error(`Supabase error creating category: ${error.message}`);
    }

    return data;
  },

  // Update a category
  async update(id: string, updates: Partial<Category>): Promise<Category> {
    const { data, error } = await supabase
      .from("categories")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw new Error(`Supabase error updating category ${id}: ${error.message}`);
    }

    return data;
  },

  // Delete a category
  async delete(id: string): Promise<void> {
    const { error } = await supabase.from("categories").delete().eq("id", id);

    if (error) {
      throw new Error(`Supabase error deleting category ${id}: ${error.message}`);
    }
  },

  // Get a single category by ID
  async getById(id: string): Promise<Category | null> {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null; // No rows returned, not an error
      }
      throw new Error(`Supabase error fetching category ${id}: ${error.message}`);
    }

    return data;
  },
};
