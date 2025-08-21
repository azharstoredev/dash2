import { RequestHandler } from "express";
import { adminDb } from "../lib/admin-db";
import { z } from "zod";

// Validation schemas
const loginSchema = z.object({
  password: z.string().min(1, "Password is required"),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
});

const updateEmailSchema = z.object({
  email: z.string().email("Valid email is required"),
});

// Admin login
export const handleAdminLogin: RequestHandler = async (req, res) => {
  try {
    const { password } = loginSchema.parse(req.body);

    const isValid = await adminDb.verifyPassword(password);

    if (isValid) {
      res.json({
        success: true,
        message: "Login successful",
      });
    } else {
      res.status(401).json({
        success: false,
        message: "Invalid password",
      });
    }
  } catch (error) {
    console.error("Admin login error:", error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Invalid request data",
        errors: error.errors,
      });
    }

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Change admin password
export const handleChangePassword: RequestHandler = async (req, res) => {
  try {
    const { currentPassword, newPassword } = changePasswordSchema.parse(
      req.body,
    );

    // Verify current password
    const isCurrentPasswordValid =
      await adminDb.verifyPassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // Update to new password
    const success = await adminDb.updatePassword(newPassword);

    if (success) {
      res.json({
        success: true,
        message: "Password updated successfully",
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Failed to update password",
      });
    }
  } catch (error) {
    console.error("Change password error:", error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Invalid request data",
        errors: error.errors,
      });
    }

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Update admin email
export const handleUpdateEmail: RequestHandler = async (req, res) => {
  try {
    const { email } = updateEmailSchema.parse(req.body);

    const success = await adminDb.updateEmail(email);

    if (success) {
      res.json({
        success: true,
        message: "Email updated successfully",
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Failed to update email",
      });
    }
  } catch (error) {
    console.error("Update email error:", error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Invalid request data",
        errors: error.errors,
      });
    }

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get admin info (without password)
export const handleGetAdminInfo: RequestHandler = async (req, res) => {
  try {
    const admin = await adminDb.getAdminUser();

    if (admin) {
      res.json({
        success: true,
        data: {
          id: admin.id,
          email: admin.email,
          created_at: admin.created_at,
          updated_at: admin.updated_at,
        },
      });
    } else {
      res.status(404).json({
        success: false,
        message: "Admin user not found",
      });
    }
  } catch (error) {
    console.error("Get admin info error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
