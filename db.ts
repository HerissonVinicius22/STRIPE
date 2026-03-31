import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || "";

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing Supabase credentials in .env");
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export interface User { id: number; username: string; role: "user" | "admin"; password?: string; }
export interface Stats { user_id: number; total_clients: number; monthly_profit: number; refunds: number; available_balance: number; withdrawn_funds: number; expenses: number; deposits: number; }
export interface Withdrawal { id: number; user_id: number; amount: number; method: string; pix_key?: string; bank_account?: string; status: string; created_at: string; username?: string; }
export interface Transaction { id: number; user_id: number; type: "expense" | "deposit"; amount: number; description: string; created_at: string; }

class Database {
  async getUsers() {
    const { data } = await supabase.from("users").select("*");
    return data || [];
  }
  async getUserByUsername(username: string) {
    const { data } = await supabase.from("users").select("*").eq("username", username).limit(1).single();
    return data;
  }
  async getUserById(id: number) {
    const { data } = await supabase.from("users").select("*").eq("id", id).limit(1).single();
    return data;
  }
  async addUser(user: Omit<User, "id">) {
    const { data, error } = await supabase.from("users").insert([user]).select().single();
    if (error) console.error("Error adding user:", error);
    return data;
  }
  async getStatsByUserId(userId: number) {
    let { data } = await supabase.from("stats").select("*").eq("user_id", userId).limit(1).single();
    if (!data) {
      const newStats = {
        user_id: userId, total_clients: 0, monthly_profit: 0, refunds: 0,
        available_balance: 0, withdrawn_funds: 0, expenses: 0, deposits: 0
      };
      const { data: inserted, error } = await supabase.from("stats").insert([newStats]).select().single();
      if (error) console.error("Error creating stats:", error);
      data = inserted || newStats;
    }
    return data;
  }
  async updateStats(userId: number, updates: Partial<Stats>) {
    const current = await this.getStatsByUserId(userId);
    const { error } = await supabase.from("stats").update({ ...current, ...updates }).eq("user_id", userId);
    if (error) console.error("Error updating stats:", error);
  }
  async addWithdrawal(withdrawal: Omit<Withdrawal, "id" | "created_at" | "status">) {
    const newW = { ...withdrawal, status: "Pendente" };
    const { data, error } = await supabase.from("withdrawals").insert([newW]).select().single();
    if (error) console.error("Error adding withdrawal:", error);
    return data;
  }
  async getWithdrawalsByUserId(userId: number) {
    const { data } = await supabase.from("withdrawals").select("*").eq("user_id", userId).order("created_at", { ascending: false });
    return data || [];
  }
  async getAllWithdrawals() {
    const { data } = await supabase.from("withdrawals").select("*").order("created_at", { ascending: false });
    return data || [];
  }
  async getGlobalStats() {
    const { data } = await supabase.from("stats").select("*");
    if (!data) return { total_clients: 0, monthly_profit: 0, refunds: 0, available_balance: 0, withdrawn_funds: 0, expenses: 0, deposits: 0 };
    return data.reduce((acc, s) => ({
      total_clients: acc.total_clients + (s.total_clients || 0),
      monthly_profit: acc.monthly_profit + (s.monthly_profit || 0),
      refunds: acc.refunds + (s.refunds || 0),
      available_balance: acc.available_balance + (s.available_balance || 0),
      withdrawn_funds: acc.withdrawn_funds + (s.withdrawn_funds || 0),
      expenses: acc.expenses + (s.expenses || 0),
      deposits: acc.deposits + (s.deposits || 0),
    }), { total_clients: 0, monthly_profit: 0, refunds: 0, available_balance: 0, withdrawn_funds: 0, expenses: 0, deposits: 0 });
  }
  async getAllTransactions() {
    const { data } = await supabase.from("transactions").select("*").order("created_at", { ascending: false });
    return data || [];
  }
  async updateWithdrawalStatus(id: number, status: string) {
    const { data, error } = await supabase.from("withdrawals").update({ status }).eq("id", id).select().single();
    if (error) console.error("Error updating withdrawal status:", error);
    return data;
  }
  async getTransactionsByUserId(userId: number) {
    const { data } = await supabase.from("transactions").select("*").eq("user_id", userId).order("created_at", { ascending: false });
    return data || [];
  }
  async addTransaction(transaction: Omit<Transaction, "id" | "created_at">) {
    const { data, error } = await supabase.from("transactions").insert([transaction]).select().single();
    if (error) console.error("Error adding transaction:", error);
    
    const stats = await this.getStatsByUserId(transaction.user_id);
    if (transaction.type === "expense") {
      await this.updateStats(transaction.user_id, { expenses: (stats.expenses || 0) + transaction.amount });
    } else {
      await this.updateStats(transaction.user_id, { deposits: (stats.deposits || 0) + transaction.amount });
    }
    return data;
  }
  async updateTransaction(id: number, updates: Partial<Transaction>) {
    const { data: oldTransaction } = await supabase.from("transactions").select("*").eq("id", id).limit(1).single();
    if (!oldTransaction) return null;

    const { data: newTransaction, error } = await supabase.from("transactions").update(updates).eq("id", id).select().single();
    if (error) console.error("Error updating transaction:", error);

    const userId = oldTransaction.user_id;
    const userTransactions = await this.getTransactionsByUserId(userId);
    const expenses = userTransactions.filter((t: any) => t.type === "expense").reduce((sum: number, t: any) => sum + t.amount, 0);
    const deposits = userTransactions.filter((t: any) => t.type === "deposit").reduce((sum: number, t: any) => sum + t.amount, 0);
    
    await this.updateStats(userId, { expenses, deposits });
    return newTransaction;
  }
  async deleteTransaction(id: number) {
    const { data: oldTransaction } = await supabase.from("transactions").select("*").eq("id", id).limit(1).single();
    if (!oldTransaction) return false;

    const { error } = await supabase.from("transactions").delete().eq("id", id);
    if (error) {
      console.error("Error deleting transaction:", error);
      return false;
    }

    const userId = oldTransaction.user_id;
    const userTransactions = await this.getTransactionsByUserId(userId);
    const expenses = userTransactions.filter((t: any) => t.type === "expense").reduce((sum: number, t: any) => sum + t.amount, 0);
    const deposits = userTransactions.filter((t: any) => t.type === "deposit").reduce((sum: number, t: any) => sum + t.amount, 0);
    
    await this.updateStats(userId, { expenses, deposits });
    return true;
  }
}

export const db = new Database();
