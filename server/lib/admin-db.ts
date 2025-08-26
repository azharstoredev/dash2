import { supabase } from "./supabase";

// Dynamically import bcrypt to avoid issues in environments where native modules might fail on startup.
async function getBcrypt() {
  try {
    const bcrypt = await import("bcrypt");
    return bcrypt.default;
  } catch (error) {
    console.error("Failed to load bcrypt:", error);
    throw new Error("Bcrypt password hashing library is not available.");
  }
}

// Admin user interface
export interface AdminUser {
  id: string;
  email: string;
  password_hash: string;
  created_at?: string;
  updated_at?: string;
}

// Admin database operations
export const adminDb = {
  // Get admin user (there should be only one)
  async getAdminUser(): Promise<AdminUser | null> {
    const { data, error } = await supabase
      .from("admin_users")
      .select("*")
      .limit(1)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null; // No admin user found, not an error
      }
      throw new Error(`Supabase error fetching admin user: ${error.message}`);
    }
    return data;
  },

  // Verify admin password
  async verifyPassword(password: string): Promise<boolean> {
    const admin = await this.getAdminUser();
    if (!admin) {
      return false;
    }
    const bcrypt = await getBcrypt();
    return await bcrypt.compare(password, admin.password_hash);
  },

  // Update admin password
  async updatePassword(newPassword: string): Promise<boolean> {
    const admin = await this.getAdminUser();
    if (!admin) {
      return false;
    }

    const bcrypt = await getBcrypt();
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const updates = {
      password_hash: hashedPassword,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("admin_users")
      .update(updates)
      .eq("id", admin.id);

    if (error) {
        throw new Error(`Supabase error updating password: ${error.message}`);
    }

    return true;
  },

  // Update admin email
  async updateEmail(newEmail: string): Promise<boolean> {
    const admin = await this.getAdminUser();
    if (!admin) {
      return false;
    }

    const updates = {
      email: newEmail,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("admin_users")
      .update(updates)
      .eq("id", admin.id);

    if (error) {
        throw new Error(`Supabase error updating email: ${error.message}`);
    }

    return true;
  },
};
