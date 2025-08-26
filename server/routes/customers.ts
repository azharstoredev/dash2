import { RequestHandler } from "express";
import { customerDb, Customer } from "../lib/customers-db";

export const getAllCustomers: RequestHandler = async (req, res) => {
  try {
    const customers = await customerDb.getAll();
    res.json(customers);
  } catch (error) {
    console.error("Error fetching customers:", error);
    res.status(500).json({ error: "Failed to fetch customers" });
  }
};

export const createCustomer: RequestHandler = async (req, res) => {
  try {
    // Detailed logging of the incoming request
    console.log("Received request to create customer.");
    console.log("Request Body:", JSON.stringify(req.body, null, 2));
    console.log("Type of req.body.id:", typeof req.body.id);


    // The client should NOT send an ID. The database will generate it.
    // If an 'id' field is present, even if null or undefined, it can cause issues.
    // We will create a new object with only the fields we need.
    const { name, phone, address, home, road, block, town } = req.body;
    const customerData = { name, phone, address, home, road, block, town };

    if (!name || !phone || !address) {
      console.error("Validation failed: Missing required fields.", customerData);
      return res
        .status(400)
        .json({ error: "Name, phone, and address are required" });
    }

    console.log("Attempting to create customer with cleaned data:", customerData);

    const newCustomer = await customerDb.create(customerData);

    console.log("Customer created successfully in DB:", newCustomer.id);
    res.status(201).json(newCustomer);
  } catch (error) {
    console.error("Error creating customer:", error);
    res.status(500).json({ error: `Failed to create customer: ${error.message}` });
  }
};

export const updateCustomer: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const updatedCustomer = await customerDb.update(id, updates);
    res.json(updatedCustomer);
  } catch (error) {
    console.error("Error updating customer:", error);
    if (error instanceof Error && error.message.includes("not found")) {
      res.status(404).json({ error: "Customer not found" });
    } else {
      res.status(500).json({ error: "Failed to update customer" });
    }
  }
};

export const deleteCustomer: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    await customerDb.delete(id);
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting customer:", error);
    if (error instanceof Error && error.message.includes("not found")) {
      res.status(404).json({ error: "Customer not found" });
    } else {
      res.status(500).json({ error: "Failed to delete customer" });
    }
  }
};

export const getCustomerById: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const customer = await customerDb.getById(id);
    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }

    res.json(customer);
  } catch (error) {
    console.error("Error fetching customer:", error);
    res.status(500).json({ error: "Failed to fetch customer" });
  }
};
