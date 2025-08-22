import { RequestHandler } from "express";
import { orderDb, Order, OrderItem } from "../lib/orders-db";
import { productDb } from "../lib/supabase";

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
    const {
      customerId,
      items,
      status,
      deliveryType,
      deliveryArea,
      notes,
      total,
    } = req.body;

    // Validate required fields
    if (!customerId) {
      console.error("Missing customerId:", req.body);
      return res.status(400).json({ error: "Customer ID is required" });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      console.error("Invalid items data:", { items });
      return res.status(400).json({
        error: "Order items are required and must be a non-empty array",
      });
    }

    // Validate each item
    for (const item of items) {
      if (!item.productId || !item.quantity || !item.price) {
        console.error("Invalid item data:", item);
        return res.status(400).json({
          error: "Each item must have productId, quantity, and price",
        });
      }

      if (item.quantity <= 0) {
        console.error("Invalid quantity:", item);
        return res
          .status(400)
          .json({ error: "Item quantity must be greater than 0" });
      }

      if (item.price < 0) {
        console.error("Invalid price:", item);
        return res.status(400).json({ error: "Item price cannot be negative" });
      }
    }

    // Check stock availability before processing order
    for (const item of items) {
      const product = await productDb.getById(item.productId);
      if (!product) {
        return res.status(400).json({
          error: `Product ${item.productId} not found`,
        });
      }

      if (item.variantId && item.variantId !== "no-variant") {
        const variant = product.variants.find((v) => v.id === item.variantId);
        if (!variant) {
          return res.status(400).json({
            error: `Variant ${item.variantId} not found for product ${product.name}`,
          });
        }
        if (variant.stock < item.quantity) {
          return res.status(400).json({
            error: `Insufficient stock for ${product.name} (${variant.name}). Available: ${variant.stock}, Requested: ${item.quantity}`,
          });
        }
      } else {
        if ((product.total_stock || 0) < item.quantity) {
          return res.status(400).json({
            error: `Insufficient stock for ${product.name}. Available: ${product.total_stock || 0}, Requested: ${item.quantity}`,
          });
        }
      }
    }

    // Calculate expected total
    const itemsTotal = items.reduce(
      (sum: number, item: OrderItem) => sum + item.price * item.quantity,
      0,
    );
    const deliveryFee = deliveryType === "delivery" ? 1.5 : 0;
    const expectedTotal = itemsTotal + deliveryFee;

    // Use the total from request if provided, otherwise use calculated total
    const finalTotal = total !== undefined ? total : expectedTotal;

    console.log("Total calculation:", {
      itemsTotal: itemsTotal.toFixed(2),
      deliveryFee: deliveryFee.toFixed(2),
      expectedTotal: expectedTotal.toFixed(2),
      requestTotal: total,
      finalTotal: finalTotal.toFixed(2),
    });

    const orderData = {
      customerId,
      items,
      total: finalTotal,
      status: status || "processing",
      deliveryType: deliveryType || "delivery",
      deliveryArea: deliveryArea || "sitra",
      notes: notes || "",
    };

    console.log("Creating order with processed data:", orderData);
    let newOrder;
    try {
      newOrder = await orderDb.create(orderData);
      console.log("Order created successfully:", newOrder.id);
    } catch (createError) {
      console.error("Failed to create order in database:", createError);
      return res.status(500).json({
        error: "Failed to create order in database",
        details:
          createError instanceof Error
            ? createError.message
            : "Unknown database error",
      });
    }

    // Reduce stock after successful order creation
    for (const item of items) {
      const product = await productDb.getById(item.productId);
      if (product) {
        if (item.variantId && item.variantId !== "no-variant") {
          // Update variant stock
          const updatedVariants = product.variants.map((variant) => {
            if (variant.id === item.variantId) {
              return { ...variant, stock: variant.stock - item.quantity };
            }
            return variant;
          });

          // Recalculate total stock
          const newTotalStock = updatedVariants.reduce(
            (sum, v) => sum + v.stock,
            0,
          );

          await productDb.update(product.id, {
            variants: updatedVariants,
            total_stock: newTotalStock,
          });
        } else {
          // Update total stock directly
          const newTotalStock = (product.total_stock || 0) - item.quantity;
          await productDb.update(product.id, {
            total_stock: Math.max(0, newTotalStock),
          });
        }
      }
    }

    console.log(
      "Order created successfully with stock reduction:",
      newOrder.id,
    );
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
