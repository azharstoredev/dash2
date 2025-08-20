import { RequestHandler } from "express";
import { productDb, ProductVariant, Product } from "../lib/supabase";

const generateId = () =>
  Date.now().toString() + Math.random().toString(36).substr(2, 9);

export const getAllProducts: RequestHandler = async (req, res) => {
  try {
    const products = await productDb.getAll();
    res.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Failed to fetch products" });
  }
};

export const createProduct: RequestHandler = async (req, res) => {
  try {
    const { name, description, price, images, variants } = req.body;

    if (!name || !description || price === undefined) {
      return res
        .status(400)
        .json({ error: "Name, description, and price are required" });
    }

    // Validate category_id if provided
    if (req.body.category_id && req.body.category_id.trim() === "") {
      // Convert empty string to null
      req.body.category_id = null;
    }

    // Calculate total stock from variants or use provided stock
    const totalStock =
      variants && variants.length > 0
        ? variants.reduce(
            (sum: number, variant: ProductVariant) => sum + variant.stock,
            0,
          )
        : parseInt(req.body.total_stock) || parseInt(req.body.stock) || parseInt(req.body.totalStock) || 0;

    const newProduct = {
      name,
      description,
      price: parseFloat(price),
      images: Array.isArray(images) ? images : [],
      variants: Array.isArray(variants)
        ? variants.map((v: any) => ({
            id: v.id || generateId(),
            name: v.name,
            stock: parseInt(v.stock) || 0,
            image: v.image || "",
          }))
        : [],
      category_id: req.body.category_id || null,
      total_stock: totalStock,
    };

    console.log(
      "Creating product with data:",
      JSON.stringify(newProduct, null, 2),
    );

    const createdProduct = await productDb.create(newProduct);
    res.status(201).json(createdProduct);
  } catch (error) {
    console.error("Error creating product:", error);

    // Provide specific error messages for common issues
    if (error instanceof Error) {
      if (
        error.message.includes("foreign key constraint") &&
        error.message.includes("category_id")
      ) {
        return res.status(400).json({
          error:
            "Invalid category selected. Please choose a valid category or leave it empty.",
        });
      }
      if (
        error.message.includes("duplicate key") ||
        error.message.includes("already exists")
      ) {
        return res.status(400).json({
          error:
            "A product with this name already exists. Please choose a different name.",
        });
      }
      if (
        error.message.includes("check constraint") ||
        error.message.includes("price")
      ) {
        return res.status(400).json({
          error: "Invalid price value. Price must be a positive number.",
        });
      }

      // Log the actual error for debugging
      console.error("Detailed error:", error.message);
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({ error: "Failed to create product" });
  }
};

export const updateProduct: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    console.log("Updating product with ID:", id);
    console.log("ID type:", typeof id, "ID length:", id.length);
    console.log("Update data:", updates);

    if (!id) {
      return res.status(400).json({ error: "Product ID is required" });
    }

    if (updates.price !== undefined) {
      updates.price = parseFloat(updates.price);
    }

    // Recalculate total stock if variants are updated or if stock is provided
    if (updates.variants && updates.variants.length > 0) {
      updates.total_stock = updates.variants.reduce(
        (sum: number, variant: ProductVariant) => sum + variant.stock,
        0,
      );
    } else if (updates.totalStock !== undefined) {
      updates.total_stock = updates.totalStock;
    } else if (updates.stock !== undefined) {
      updates.total_stock = updates.stock;
    }

    const updatedProduct = await productDb.update(id, updates);
    console.log("Product updated successfully:", updatedProduct.id);
    res.json(updatedProduct);
  } catch (error) {
    console.error("Error updating product:", error);
    if (error instanceof Error) {
      if (
        error.message.includes("No rows") ||
        error.message.includes("Product not found")
      ) {
        res.status(404).json({ error: "Product not found" });
      } else {
        res
          .status(500)
          .json({ error: `Failed to update product: ${error.message}` });
      }
    } else {
      res
        .status(500)
        .json({ error: "Failed to update product: Unknown error" });
    }
  }
};

export const deleteProduct: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    await productDb.delete(id);
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting product:", error);
    if (error instanceof Error && error.message.includes("No rows")) {
      res.status(404).json({ error: "Product not found" });
    } else {
      res.status(500).json({ error: "Failed to delete product" });
    }
  }
};

export const getProductById: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await productDb.getById(id);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ error: "Failed to fetch product" });
  }
};
