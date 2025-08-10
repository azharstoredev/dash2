import { RequestHandler } from "express";
import { orderDb, Order, OrderItem } from "../lib/orders-db";

export const getAllOrders: RequestHandler = async (req, res) => {
  try {
    const orders = await orderDb.getAll();
    res.json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
};

export const createOrder: RequestHandler = async (req, res) => {
  try {
    console.log("Creating order with data:", req.body);
    const { customerId, items, status, deliveryType, notes } = req.body;

    if (!customerId || !items || !Array.isArray(items) || items.length === 0) {
      console.error("Invalid order data:", { customerId, items });
      return res
        .status(400)
        .json({ error: "Customer ID and items are required" });
    }

    const itemsTotal = items.reduce(
      (sum: number, item: OrderItem) => sum + item.price * item.quantity,
      0,
    );
    const deliveryFee = deliveryType === "delivery" ? 1.5 : 0;
    const total = itemsTotal + deliveryFee;

    const orderData = {
      customerId,
      items,
      total,
      status: status || "processing",
      deliveryType: deliveryType || "delivery",
      notes,
    };

    console.log("Creating order with processed data:", orderData);
    const newOrder = await orderDb.create(orderData);
    console.log("Order created successfully:", newOrder.id);
    res.status(201).json(newOrder);
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ error: "Failed to create order" });
  }
};

export const updateOrder: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Recalculate total if items are updated
    if (updates.items) {
      updates.total = updates.items.reduce(
        (sum: number, item: OrderItem) => sum + item.price * item.quantity,
        0,
      );
    }

    const updatedOrder = await orderDb.update(id, updates);
    res.json(updatedOrder);
  } catch (error) {
    console.error("Error updating order:", error);
    if (error instanceof Error && error.message.includes("not found")) {
      res.status(404).json({ error: "Order not found" });
    } else {
      res.status(500).json({ error: "Failed to update order" });
    }
  }
};

export const deleteOrder: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    await orderDb.delete(id);
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting order:", error);
    if (error instanceof Error && error.message.includes("not found")) {
      res.status(404).json({ error: "Order not found" });
    } else {
      res.status(500).json({ error: "Failed to delete order" });
    }
  }
};

export const getOrderById: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await orderDb.getById(id);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json(order);
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).json({ error: "Failed to fetch order" });
  }
};
