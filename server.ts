import express from "express";
import path from "path";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import cors from "cors";
import { db } from "./db.ts";
import dotenv from "dotenv";

dotenv.config();

console.log("Server starting...");

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || "striper-secret-key-123";

async function initDb() {
  const adminUsername = "admin";
  const adminPassword = "adminpassword";
  try {
    const existingAdmin = await db.getUserByUsername(adminUsername);
    if (!existingAdmin) {
      const hashedPassword = bcrypt.hashSync(adminPassword, 10);
      await db.addUser({ username: adminUsername, password: hashedPassword, role: "admin" });
      console.log("Default admin created.");
    }
  } catch (err) {
    console.error("Error creating default admin:", err);
  }
}

app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: true,
  credentials: true
}));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", env: process.env.NODE_ENV || "development" });
});

const authenticate = (req: any, res: any, next: any) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
};

const isAdmin = (req: any, res: any, next: any) => {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Forbidden" });
  next();
};

app.post("/api/auth/register", authenticate, isAdmin, async (req: any, res) => {
  try {
    const { username, password } = req.body;
    const existingUser = await db.getUserByUsername(username);
    if (existingUser) return res.status(400).json({ error: "User already exists" });
    
    const hashedPassword = bcrypt.hashSync(password, 10);
    await db.addUser({ username, password: hashedPassword, role: "user" });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await db.getUserByUsername(username);
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: "1d" });
    res.cookie("token", token, { httpOnly: true, secure: true, sameSite: "none" });
    res.json({ user: { id: user.id, username: user.username, role: user.role } });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/auth/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ success: true });
});

app.get("/api/auth/me", authenticate, (req: any, res) => {
  res.json({ user: req.user });
});

app.get("/api/stats", authenticate, async (req: any, res) => {
  try {
    const stats = await db.getGlobalStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/admin/users", authenticate, isAdmin, async (req, res) => {
  try {
    const users = await db.getUsers();
    res.json(users.map((u: any) => ({ id: u.id, username: u.username, role: u.role })));
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/admin/stats/:userId", authenticate, isAdmin, async (req, res) => {
  try {
    const stats = await db.getStatsByUserId(parseInt(req.params.userId));
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/admin/stats/:userId", authenticate, isAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    await db.updateStats(userId, req.body);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/withdrawals", authenticate, async (req: any, res) => {
  try {
    const { amount, method, pix_key, bank_account } = req.body;
    
    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ error: "Valor inválido" });
    }

    const globalStats = await db.getGlobalStats();
    
    if (globalStats.available_balance < amount) {
      return res.status(400).json({ error: "Saldo insuficiente" });
    }

    await db.addWithdrawal({
      user_id: req.user.id,
      amount,
      method,
      pix_key,
      bank_account
    });

    const adminStats = await db.getStatsByUserId(1);
    await db.updateStats(1, {
      available_balance: adminStats.available_balance - amount,
      withdrawn_funds: adminStats.withdrawn_funds + amount
    });
      
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/withdrawals", authenticate, async (req: any, res) => {
  try {
    const withdrawals = await db.getWithdrawalsByUserId(req.user.id);
    res.json(withdrawals.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/admin/withdrawals", authenticate, isAdmin, async (req, res) => {
  try {
    const rawWithdrawals = await db.getAllWithdrawals();
    const withdrawals = [];
    for (const w of rawWithdrawals) {
      const user = await db.getUserById(w.user_id);
      withdrawals.push({ ...w, username: user?.username });
    }
    res.json(withdrawals.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

app.put("/api/admin/withdrawals/:id", authenticate, isAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status } = req.body;
    const withdrawal = await db.updateWithdrawalStatus(id, status);
    if (!withdrawal) return res.status(404).json({ error: "Withdrawal not found" });
    res.json(withdrawal);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/transactions", authenticate, async (req: any, res) => {
  try {
    const transactions = await db.getAllTransactions();
    res.json(transactions.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/admin/transactions/:userId", authenticate, isAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const transactions = await db.getTransactionsByUserId(userId);
    res.json(transactions.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/admin/transactions/:userId", authenticate, isAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const { type, amount, description } = req.body;
    const transaction = await db.addTransaction({
      user_id: userId,
      type,
      amount,
      description
    });
    res.json(transaction);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

app.put("/api/admin/transactions/:id", authenticate, isAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const transaction = await db.updateTransaction(id, req.body);
    if (!transaction) return res.status(404).json({ error: "Transaction not found" });
    res.json(transaction);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

app.delete("/api/admin/transactions/:id", authenticate, isAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const success = await db.deleteTransaction(id);
    if (!success) return res.status(404).json({ error: "Transaction not found" });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

let isInitialized = false;

app.use(async (req, res, next) => {
  if (!isInitialized) {
    await initDb();
    isInitialized = true;
  }
  next();
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

if (!process.env.VERCEL) {
  startServer().catch(err => {
    console.error("Failed to start server:", err);
  });
}

export default app;
