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
  customer_id?: string;
  items: OrderItem[];
  total: number;
  status: "processing" | "ready" | "delivered" | "picked-up";
  deliveryType: "delivery" | "pickup";
  delivery_type?: "delivery" | "pickup";
  deliveryArea?: "sitra" | "muharraq" | "other";
  delivery_area?: "sitra" | "muharraq" | "other";
  createdAt?: string;
  updatedAt?: string;
  created_at?: string;
  updated_at?: string;
  notes?: string;
}

// In-memory fallback storage for offline/dev
let fallbackOrders: Order[] = [
  {
    id: "1",
    customerId: "1",
    items: [{ productId: "1", quantity: 1, price: 35.0 }],
    total: 35.0,
    status: "delivered",
    deliveryType: "delivery",
    deliveryArea: "sitra",
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-01-15T15:30:00Z",
  },
  {
    id: "2",
    customerId: "2",
    items: [{ productId: "2", quantity: 1, price: 17.5 }],
    total: 17.5,
    status: "processing",
    deliveryType: "pickup",
    deliveryArea: "sitra",
    createdAt: "2024-01-15T11:00:00Z",
    updatedAt: "2024-01-15T11:00:00Z",
  },
];

const generateId = () =>
  Date.now().toString() + Math.random().toString(36).substr(2, 9);

/** Map DB rows to frontend Order objects */
const transformFromDb = (dbOrder: any): Order => ({
  id: dbOrder.id,
  customerId: dbOrder.customer_id,
  customer_id: dbOrder.customer_id,
  items: dbOrder.items,
  total: dbOrder.total,
  status: dbOrder.status,
  deliveryType: dbOrder.delivery_type,
  delivery_type: dbOrder.delivery_type,
  deliveryArea: dbOrder.delivery_area,
  delivery_area: dbOrder.delivery_area,
  createdAt: dbOrder.created_at,
  updatedAt: dbOrder.updated_at,
  created_at: dbOrder.created_at,
  updated_at: dbOrder.updated_at,
  notes: dbOrder.notes,
});

export const orderDb = {
  /** Get all orders */
  async getAll(): Promise<Order[]> {
    if (!supabase) return fallbackOrders;

    try {
      const { data, error } = await supabase
        .from("orders")
        .select(
          `
          *,
          customer:customers!customer_id (
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

      if (error) throw new Error(error.message);
      return (data || []).map(transformFromDb);
    } catch (err) {
      console.warn("Supabase fetch failed, using fallback orders:", err);
      return fallbackOrders;
    }
  },

  /** Create a new order */
  async create(
    order: Omit<
      Order,
      "id" | "created_at" | "updated_at" | "createdAt" | "updatedAt"
    >,
  ): Promise<Order> {
    const newOrderPayload = {
      id: generateId(), // remove if DB auto-generates
      customer_id: order.customerId,
      items: order.items,
      total: order.total,
      status: order.status || "processing",
      delivery_type: order.deliveryType || "delivery",
      delivery_area: order.deliveryArea || "sitra",
      notes: order.notes || null,
    };

    if (!supabase) {
      const fallbackOrder: Order = {
        ...order,
        id: newOrderPayload.id,
        customerId: order.customerId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      fallbackOrders.push(fallbackOrder);
      return fallbackOrder;
    }

    try {
      const { data, error } = await supabase
        .from("orders")
        .insert([newOrderPayload])
        .select()
        .single();

      if (error) throw new Error(error.message);
      return transformFromDb(data);
    } catch (err) {
      console.warn("Supabase insert failed, using fallback orders:", err);
      const fallbackOrder: Order = {
        ...order,
        id: newOrderPayload.id,
        customerId: order.customerId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      fallbackOrders.push(fallbackOrder);
      return fallbackOrder;
    }
  },

  /** Update an order */
  async update(id: string, updates: Partial<Order>): Promise<Order> {
    const dbUpdates: any = {
      ...(updates.customerId && { customer_id: updates.customerId }),
      ...(updates.items && { items: updates.items }),
      ...(updates.total !== undefined && { total: updates.total }),
      ...(updates.status && { status: updates.status }),
      ...(updates.deliveryType && { delivery_type: updates.deliveryType }),
      ...(updates.notes !== undefined && { notes: updates.notes }),
      updated_at: new Date().toISOString(),
    };

    if (!supabase) {
      const index = fallbackOrders.findIndex((o) => o.id === id);
      if (index === -1) throw new Error("Order not found");
      fallbackOrders[index] = {
        ...fallbackOrders[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      return fallbackOrders[index];
    }

    try {
      const { data, error } = await supabase
        .from("orders")
        .update(dbUpdates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return transformFromDb(data);
    } catch (err) {
      console.warn("Supabase update failed, using fallback orders:", err);
      const index = fallbackOrders.findIndex((o) => o.id === id);
      if (index === -1) throw new Error("Order not found");
      fallbackOrders[index] = {
        ...fallbackOrders[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      return fallbackOrders[index];
    }
  },

  /** Delete an order */
  async delete(id: string): Promise<void> {
    if (!supabase) {
      const index = fallbackOrders.findIndex((o) => o.id === id);
      if (index === -1) throw new Error("Order not found");
      fallbackOrders.splice(index, 1);
      return;
    }

    try {
      const { error } = await supabase.from("orders").delete().eq("id", id);
      if (error) throw new Error(error.message);
    } catch (err) {
      console.warn("Supabase delete failed, using fallback orders:", err);
      const index = fallbackOrders.findIndex((o) => o.id === id);
      if (index === -1) throw new Error("Order not found");
      fallbackOrders.splice(index, 1);
    }
  },

  /** Get order by ID */
  async getById(id: string): Promise<Order | null> {
    if (!supabase) {
      return fallbackOrders.find((o) => o.id === id) || null;
    }

    try {
      const { data, error } = await supabase
        .from("orders")
        .select(
          `
          *,
          customer:customers!customer_id (
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
        if (error.code === "PGRST116") return null; // no rows found
        throw new Error(error.message);
      }
      return transformFromDb(data);
    } catch (err) {
      console.warn("Supabase fetch by ID failed, using fallback orders:", err);
      return fallbackOrders.find((o) => o.id === id) || null;
    }
  },
};
