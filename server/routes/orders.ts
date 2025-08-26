import { RequestHandler } from "express";
import { orderDb, OrderItem } from "../lib/orders-db";
import { productDb } from "../lib/supabase";

export const getAllOrders: RequestHandler = async (req, res) => {
  try {
    const orders = await orderDb.getAll();
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch orders", details: error instanceof Error ? error.message : String(error) });
  }
};

export const createOrder: RequestHandler = async (req, res) => {
  try {
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
      return res.status(400).json({ error: "Customer ID is required" });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        error: "Order items are required and must be a non-empty array",
      });
    }

    // Validate each item and check stock availability
    for (const item of items) {
      if (!item.productId || !item.quantity || !item.price) {
        return res.status(400).json({
          error: "Each item must have productId, quantity, and price",
        });
      }
      if (item.quantity <= 0) {
        return res
          .status(400)
          .json({ error: "Item quantity must be greater than 0" });
      }
      if (item.price < 0) {
        return res.status(400).json({ error: "Item price cannot be negative" });
      }

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

    // Always calculate the total on the server to ensure accuracy
    const itemsTotal = items.reduce(
      (sum: number, item: OrderItem) => sum + item.price * item.quantity,
      0,
    );

    // This is a simplified delivery fee logic.
    // In a real application, this would be more complex.
    const deliveryFee = deliveryType === "delivery" ? 1.5 : 0;
    const finalTotal = itemsTotal + deliveryFee;

    const orderData = {
      customerId,
      items,
      total: finalTotal,
      status: status || "processing",
      deliveryType: deliveryType || "delivery",
      deliveryArea: deliveryArea || "sitra",
      notes: notes || "",
    };

    const newOrder = await orderDb.create(orderData);

    // Reduce stock after successful order creation
    for (const item of items) {
      const product = await productDb.getById(item.productId);
      if (product) {
        if (item.variantId && item.variantId !== "no-variant") {
          const updatedVariants = product.variants.map((variant) =>
            variant.id === item.variantId
              ? { ...variant, stock: variant.stock - item.quantity }
              : variant
          );
          const newTotalStock = updatedVariants.reduce(
            (sum, v) => sum + v.stock,
            0,
          );
          await productDb.update(product.id, {
            variants: updatedVariants,
            total_stock: newTotalStock,
          });
        } else {
          const newTotalStock = (product.total_stock || 0) - item.quantity;
          await productDb.update(product.id, {
            total_stock: Math.max(0, newTotalStock),
          });
        }
      }
    }

    res.status(201).json(newOrder);
  } catch (error) {
    res.status(500).json({ error: "Failed to create order", details: error instanceof Error ? error.message : String(error) });
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
        res.status(500).json({ error: "Failed to update order", details: error instanceof Error ? error.message : String(error) });
    }
  };

  export const deleteOrder: RequestHandler = async (req, res) => {
    try {
      const { id } = req.params;
      await orderDb.delete(id);
      res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: "Failed to delete order", details: error instanceof Error ? error.message : String(error) });
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
        res.status(500).json({ error: "Failed to fetch order", details: error instanceof Error ? error.message : String(error) });
    }
  };
