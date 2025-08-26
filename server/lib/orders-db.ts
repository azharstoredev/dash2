import { supabase } from "./supabase";

export interface OrderItem {
  productId: string;
  variantId?: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  customerId: string;
  items: OrderItem[];
  total: number;
  status: "processing" | "ready" | "delivered" | "picked-up";
  deliveryType: "delivery" | "pickup";
  deliveryArea?: "sitra" | "muharraq" | "other";
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// The Supabase client automatically maps snake_case columns to camelCase fields.
// We will rely on this and use camelCase in our application code.
// This function also handles the nested customer data.
const transformFromDb = (dbOrder: any): Order => ({
  id: dbOrder.id,
  customerId: dbOrder.customer_id,
  items: dbOrder.items,
  total: dbOrder.total,
  status: dbOrder.status,
  deliveryType: dbOrder.delivery_type,
  deliveryArea: dbOrder.delivery_area,
  notes: dbOrder.notes,
  createdAt: dbOrder.created_at,
  updatedAt: dbOrder.updated_at,
  // Add the joined customer data if it exists
  ...(dbOrder.customer && { customer: dbOrder.customer }),
});

export const orderDb = {
  /** Get all orders */
  async getAll(): Promise<Order[]> {
    const { data, error } = await supabase
      .from("orders")
      .select(
        `
        *,
        customer:customers(
          id,
          name,
          phone,
          address,
          home,
          road,
          block,
          town
        )
      `,
      )
      .order("created_at", { ascending: false });

    if (error) {
        throw new Error(`Supabase error fetching orders: ${error.message}`);
    }

    return (data || []).map(transformFromDb);
  },

  /** Create a new order */
  async create(
    order: Omit<Order, "id" | "createdAt" | "updatedAt">,
  ): Promise<Order> {
    // The payload should use snake_case for the database columns.
    const newOrderPayload = {
        customer_id: order.customerId,
        items: order.items,
        total: order.total,
        status: order.status || "processing",
        delivery_type: order.deliveryType || "delivery",
        delivery_area: order.deliveryArea || "sitra",
        notes: order.notes || null,
      };

    const { data, error } = await supabase
      .from("orders")
      .insert([newOrderPayload])
      .select()
      .single();

    if (error) {
        throw new Error(`Supabase error creating order: ${error.message}`);
    }

    return transformFromDb(data);
  },

  /** Update an order */
  async update(id: string, updates: Partial<Omit<Order, 'id' | 'createdAt'>>): Promise<Order> {
    // Map camelCase updates to snake_case for the database
    const dbUpdates: any = {
        ...(updates.customerId && { customer_id: updates.customerId }),
        ...(updates.items && { items: updates.items }),
        ...(updates.total !== undefined && { total: updates.total }),
        ...(updates.status && { status: updates.status }),
        ...(updates.deliveryType && { delivery_type: updates.deliveryType }),
        ...(updates.deliveryArea && { delivery_area: updates.deliveryArea }),
        ...(updates.notes !== undefined && { notes: updates.notes }),
        updated_at: new Date().toISOString(),
      };


    const { data, error } = await supabase
      .from("orders")
      .update(dbUpdates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
        throw new Error(`Supabase error updating order ${id}: ${error.message}`);
    }
    return transformFromDb(data);
  },

  /** Delete an order */
  async delete(id: string): Promise<void> {
    const { error } = await supabase.from("orders").delete().eq("id", id);
    if (error) {
        throw new Error(`Supabase error deleting order ${id}: ${error.message}`);
    }
  },

  /** Get order by ID */
  async getById(id: string): Promise<Order | null> {
    const { data, error } = await supabase
      .from("orders")
      .select(
        `
        *,
        customer:customers(
          id,
          name,
          phone,
          address,
          home,
          road,
          block,
          town
        )
      `,
      )
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
          return null; // No rows found
      }
      throw new Error(`Supabase error fetching order by id ${id}: ${error.message}`);
    }
    return transformFromDb(data);
  },
};
