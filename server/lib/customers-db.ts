import { supabase } from "./supabase";

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  home?: string;
  road?: string;
  block?: string;
  town?: string;
  createdAt: string;
  updatedAt: string;
}

const transformCustomer = (customer: any): Customer => ({
    id: customer.id,
    name: customer.name,
    phone: customer.phone,
    address: customer.address || `House ${customer.home || ''}, Road ${customer.road || ''}, Block ${customer.block || ''}, ${customer.town || ''}`.trim(),
    home: customer.home,
    road: customer.road,
    block: customer.block,
    town: customer.town,
    createdAt: customer.created_at,
    updatedAt: customer.updated_at,
  });

export const customerDb = {
  // Get all customers
  async getAll(): Promise<Customer[]> {
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Supabase error fetching customers: ${error.message}`);
    }

    return (data || []).map(transformCustomer);
  },

  // Create a new customer
  async create(
    customer: Omit<Customer, "id" | "createdAt" | "updatedAt">,
  ): Promise<Customer> {
    const { data, error } = await supabase
      .from("customers")
      .insert([customer])
      .select()
      .single();

    if (error) {
        throw new Error(`Supabase error creating customer: ${error.message}`);
    }

    return transformCustomer(data);
  },

  // Update a customer
  async update(id: string, updates: Partial<Customer>): Promise<Customer> {
    const { data, error } = await supabase
      .from("customers")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) {
        throw new Error(`Supabase error updating customer ${id}: ${error.message}`);
    }

    return transformCustomer(data);
  },

  // Delete a customer
  async delete(id: string): Promise<void> {
    const { error } = await supabase.from("customers").delete().eq("id", id);

    if (error) {
        throw new Error(`Supabase error deleting customer ${id}: ${error.message}`);
    }
  },

  // Get a single customer by ID
  async getById(id: string): Promise<Customer | null> {
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null; // No rows returned
      }
      throw new Error(`Supabase error fetching customer ${id}: ${error.message}`);
    }

    if (!data) return null;

    return transformCustomer(data);
  },
};
