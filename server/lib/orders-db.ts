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
  customer_id?: string; // Database field name
  items: OrderItem[];
  total: number;
  status: "processing" | "ready" | "delivered" | "picked-up";
  deliveryType: "delivery" | "pickup";
  delivery_type?: "delivery" | "pickup"; // Database field name
  createdAt?: string; // Frontend field name
  updatedAt?: string; // Frontend field name
  created_at?: string; // Database field name
  updated_at?: string; // Database field name
  notes?: string;
}

// In-memory fallback storage
let fallbackOrders: Order[] = [
  {
    id: "1",
    customerId: "1",
    customer_id: "1",
    items: [{ productId: "1", quantity: 1, price: 35.0 }],
    total: 35.0,
    status: "delivered",
    deliveryType: "delivery",
    delivery_type: "delivery",
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-01-15T15:30:00Z",
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-01-15T15:30:00Z",
  },
  {
    id: "2",
    customerId: "2",
    customer_id: "2",
    items: [{ productId: "2", quantity: 1, price: 17.5 }],
    total: 17.5,
    status: "processing",
    deliveryType: "pickup",
    delivery_type: "pickup",
    createdAt: "2024-01-15T11:00:00Z",
    updatedAt: "2024-01-15T11:00:00Z",
    created_at: "2024-01-15T11:00:00Z",
    updated_at: "2024-01-15T11:00:00Z",
  },
];

const generateId = () =>
  Date.now().toString() + Math.random().toString(36).substr(2, 9);

export const orderDb = {
  // Get all orders
  async getAll(): Promise<Order[]> {
    if (!supabase) {
      return fallbackOrders;
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
        .order("created_at", { ascending: false });

      if (error) {
        console.warn(
          "Supabase error, falling back to in-memory storage:",
          error.message,
        );
        return fallbackOrders;
      }

      // Transform database data to match frontend expectations
      const transformedData = (data || []).map((order: any) => ({
        id: order.id,
        customerId: order.customer_id || order.customerId,
        customer_id: order.customer_id,
        items: order.items,
        total: order.total,
        status: order.status,
        deliveryType: order.delivery_type || order.deliveryType,
        delivery_type: order.delivery_type,
        createdAt: order.created_at || order.createdAt,
        updatedAt: order.updated_at || order.updatedAt,
        created_at: order.created_at,
        updated_at: order.updated_at,
        notes: order.notes,
      }));

      return transformedData;
    } catch (error) {
      console.warn("Supabase connection failed, using in-memory storage");
      return fallbackOrders;
    }
  },

  // Create a new order
  async create(
    order: Omit<
      Order,
      "id" | "created_at" | "updated_at" | "createdAt" | "updatedAt"
    >,
  ): Promise<Order> {
    const newOrder: Order = {
      ...order,
      id: generateId(),
      customer_id: order.customerId,
      delivery_type: order.deliveryType,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (!supabase) {
      fallbackOrders.push(newOrder);
      return newOrder;
    }

    try {
      const insertPayload = {
        id: newOrder.id,
        customer_id: newOrder.customer_id,
        items: newOrder.items,
        total: newOrder.total,
        status: newOrder.status,
        delivery_type: newOrder.delivery_type,
        notes: newOrder.notes,
        created_at: newOrder.created_at,
        updated_at: newOrder.updated_at,
      };

      const { data, error } = await supabase
        .from("orders")
        .insert([insertPayload])
        .select()
        .single();

      if (error) {
        console.warn(
          "Supabase error, falling back to in-memory storage:",
          error.message,
        );
        fallbackOrders.push(newOrder);
        return newOrder;
      }

      // Transform database response to match frontend expectations
      return {
        id: data.id,
        customerId: data.customer_id || data.customerId,
        customer_id: data.customer_id,
        items: data.items,
        total: data.total,
        status: data.status,
        deliveryType: data.delivery_type || data.deliveryType,
        delivery_type: data.delivery_type,
        createdAt: data.created_at || data.createdAt,
        updatedAt: data.updated_at || data.updatedAt,
        created_at: data.created_at,
        updated_at: data.updated_at,
        notes: data.notes,
      };
    } catch (error) {
      console.warn("Supabase connection failed, using in-memory storage");
      fallbackOrders.push(newOrder);
      return newOrder;
    }
  },

  // Update an order
  async update(id: string, updates: Partial<Order>): Promise<Order> {
    if (!supabase) {
      const index = fallbackOrders.findIndex((o) => o.id === id);
      if (index === -1) {
        throw new Error("Order not found");
      }
      fallbackOrders[index] = {
        ...fallbackOrders[index],
        ...updates,
        updated_at: new Date().toISOString(),
      };
      return fallbackOrders[index];
    }

    try {
      const payload: any = { updated_at: new Date().toISOString() };
      if (updates.items !== undefined) payload.items = updates.items;
      if (updates.total !== undefined) payload.total = updates.total;
      if (updates.status !== undefined) payload.status = updates.status;
      if (updates.deliveryType !== undefined)
        payload.delivery_type = updates.deliveryType;
      if (updates.notes !== undefined) payload.notes = updates.notes;
      if (updates.customerId !== undefined)
        payload.customer_id = updates.customerId;

      const { data, error } = await supabase
        .from("orders")
        .update(payload)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.warn(
          "Supabase error, falling back to in-memory storage:",
          error.message,
        );
        const index = fallbackOrders.findIndex((o) => o.id === id);
        if (index === -1) {
          throw new Error("Order not found");
        }
        fallbackOrders[index] = {
          ...fallbackOrders[index],
          ...updates,
          updated_at: new Date().toISOString(),
        };
        return fallbackOrders[index];
      }

      // Transform database response to match frontend expectations
      return {
        id: data.id,
        customerId: data.customer_id || data.customerId,
        customer_id: data.customer_id,
        items: data.items,
        total: data.total,
        status: data.status,
        deliveryType: data.delivery_type || data.deliveryType,
        delivery_type: data.delivery_type,
        createdAt: data.created_at || data.createdAt,
        updatedAt: data.updated_at || data.updatedAt,
        created_at: data.created_at,
        updated_at: data.updated_at,
        notes: data.notes,
      };
    } catch (error) {
      console.warn("Supabase connection failed, using in-memory storage");
      const index = fallbackOrders.findIndex((o) => o.id === id);
      if (index === -1) {
        throw new Error("Order not found");
      }
      fallbackOrders[index] = {
        ...fallbackOrders[index],
        ...updates,
        updated_at: new Date().toISOString(),
      };
      return fallbackOrders[index];
    }
  },

  // Delete an order
  async delete(id: string): Promise<void> {
    if (!supabase) {
      const index = fallbackOrders.findIndex((o) => o.id === id);
      if (index === -1) {
        throw new Error("Order not found");
      }
      fallbackOrders.splice(index, 1);
      return;
    }

    try {
      const { error } = await supabase.from("orders").delete().eq("id", id);

      if (error) {
        console.warn(
          "Supabase error, falling back to in-memory storage:",
          error.message,
        );
        const index = fallbackOrders.findIndex((o) => o.id === id);
        if (index === -1) {
          throw new Error("Order not found");
        }
        fallbackOrders.splice(index, 1);
        return;
      }
    } catch (error) {
      console.warn("Supabase connection failed, using in-memory storage");
      const index = fallbackOrders.findIndex((o) => o.id === id);
      if (index === -1) {
        throw new Error("Order not found");
      }
      fallbackOrders.splice(index, 1);
    }
  },

  // Get a single order by ID
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
        if (error.code === "PGRST116") {
          return null; // No rows returned
        }
        console.warn(
          "Supabase error, falling back to in-memory storage:",
          error.message,
        );
        return fallbackOrders.find((o) => o.id === id) || null;
      }

      if (!data) return null;

      // Transform database response to match frontend expectations
      return {
        id: data.id,
        customerId: data.customer_id || data.customerId,
        customer_id: data.customer_id,
        items: data.items,
        total: data.total,
        status: data.status,
        deliveryType: data.delivery_type || data.deliveryType,
        delivery_type: data.delivery_type,
        createdAt: data.created_at || data.createdAt,
        updatedAt: data.updated_at || data.updatedAt,
        created_at: data.created_at,
        updated_at: data.updated_at,
        notes: data.notes,
      };
    } catch (error) {
      console.warn("Supabase connection failed, using in-memory storage");
      return fallbackOrders.find((o) => o.id === id) || null;
    }
  },
};
