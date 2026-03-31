import React, { useState, useEffect, useLayoutEffect } from "react";
import { 
  LayoutDashboard, 
  Users, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  LogOut, 
  Settings, 
  TrendingUp, 
  DollarSign, 
  RefreshCcw,
  PlusCircle,
  MinusCircle,
  CreditCard,
  History,
  Sun,
  Moon,
  Menu,
  X,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from "recharts";
import { motion, AnimatePresence } from "motion/react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---
interface User {
  id: number;
  username: string;
  role: "user" | "admin";
}

interface Stats {
  total_clients: number;
  monthly_profit: number;
  refunds: number;
  available_balance: number;
  withdrawn_funds: number;
  expenses: number;
  deposits: number;
}

interface Withdrawal {
  id: number;
  amount: number;
  method: string;
  pix_key?: string;
  bank_account?: string;
  status: string;
  created_at: string;
}

interface Transaction {
  id: number;
  type: "expense" | "deposit";
  amount: number;
  description: string;
  created_at: string;
}

// --- Components ---

const Card = ({ title, value = 0, icon: Icon, color, subtitle, isCurrency = true }: any) => (
  <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col gap-2 transition-colors">
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{title}</span>
      <div className={cn("p-2 rounded-lg", color)}>
        <Icon className="w-5 h-5 text-white" />
      </div>
    </div>
    <div className="flex flex-col">
      <span className="text-2xl font-bold text-gray-900 dark:text-white">
        {isCurrency ? "R$ " : ""}{(value || 0).toLocaleString("pt-BR", { minimumFractionDigits: isCurrency ? 2 : 0 })}
      </span>
      {subtitle && <span className="text-xs text-gray-400 dark:text-gray-500 mt-1">{subtitle}</span>}
    </div>
  </div>
);

const Button = ({ children, onClick, variant = "primary", className, disabled, type = "button" }: any) => {
  const variants = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600",
    secondary: "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700",
    danger: "bg-red-600 text-white hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "px-4 py-2 rounded-xl font-medium transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100",
        variants[variant as keyof typeof variants],
        className
      )}
    >
      {children}
    </button>
  );
};

const Input = ({ label, type = "text", value, onChange, placeholder }: any) => (
  <div className="flex flex-col gap-1.5 w-full">
    {label && <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>}
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-gray-50/50 dark:bg-gray-900/50 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600"
    />
  </div>
);

const Gestao = ({ transactions, onAddTransaction, onUpdateTransaction, onDeleteTransaction, isAdmin, selectedUserForAdmin, adminUsers, onSelectUser }: any) => {
  const [showModal, setShowModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const [type, setType] = useState<"deposit" | "expense">("deposit");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");

  const selectedUsername = adminUsers?.find((u: any) => u.id === selectedUserForAdmin)?.username;

  useEffect(() => {
    if (editingTransaction) {
      setType(editingTransaction.type);
      setAmount(editingTransaction.amount.toString());
      setDescription(editingTransaction.description);
      setShowModal(true);
    } else {
      setType("deposit");
      setAmount("");
      setDescription("");
    }
  }, [editingTransaction]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTransaction) {
      onUpdateTransaction(editingTransaction.id, { type, amount: parseFloat(amount), description });
    } else {
      onAddTransaction({ type, amount: parseFloat(amount), description });
    }
    setShowModal(false);
    setEditingTransaction(null);
  };

  const handleClose = () => {
    setShowModal(false);
    setEditingTransaction(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Gestão de Transações 
            {isAdmin && (
              <span className="text-indigo-600 dark:text-indigo-400 text-lg font-medium ml-2">
                {selectedUserForAdmin ? `(${selectedUsername})` : "(Todas)"}
              </span>
            )}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {isAdmin && !selectedUserForAdmin ? "Visualizando todas as transações da plataforma" : "Acompanhe entradas e saídas detalhadas"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isAdmin && (
            <div className="flex items-center gap-2">
              {selectedUserForAdmin && (
                <Button variant="secondary" onClick={() => onSelectUser(null)} className="text-xs">
                  Ver Todas
                </Button>
              )}
              <Button onClick={() => setShowModal(true)} className="flex items-center gap-2">
                <PlusCircle className="w-5 h-5" />
                Lançar
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Data</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tipo</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Descrição</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Valor</th>
                {isAdmin && <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Ações</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {transactions.map((t: any) => (
                <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                    {new Date(t.created_at).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={cn(
                      "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                      t.type === "deposit" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400" : "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400"
                    )}>
                      {t.type === "deposit" ? "Entrada" : "Gasto"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white font-medium">{t.description}</td>
                  <td className={cn(
                    "px-6 py-4 text-sm font-bold text-right whitespace-nowrap",
                    t.type === "deposit" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                  )}>
                    {t.type === "deposit" ? "+" : "-"} R$ {t.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </td>
                  {isAdmin && (
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => setEditingTransaction(t)}
                          className="p-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 transition-colors"
                          title="Editar"
                        >
                          <Settings className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => {
                            if (confirm("Deseja realmente excluir esta transação?")) {
                              onDeleteTransaction(t.id);
                            }
                          }}
                          className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-red-600 dark:text-red-400 transition-colors"
                          title="Excluir"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-gray-400 dark:text-gray-600">
                      <History className="w-10 h-10 opacity-20" />
                      <p className="italic text-sm">Nenhuma transação registrada.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50/50 dark:bg-gray-900/50">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {editingTransaction ? "Editar Lançamento" : "Novo Lançamento"}
                </h3>
                <button onClick={handleClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">
                  <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                <div className="flex p-1 bg-gray-100 dark:bg-gray-900 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => setType("deposit")}
                    className={cn(
                      "flex-1 py-2.5 rounded-xl text-sm font-bold transition-all",
                      type === "deposit" ? "bg-white dark:bg-gray-800 text-emerald-600 dark:text-emerald-400 shadow-sm" : "text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    )}
                  >
                    Entrada
                  </button>
                  <button
                    type="button"
                    onClick={() => setType("expense")}
                    className={cn(
                      "flex-1 py-2.5 rounded-xl text-sm font-bold transition-all",
                      type === "expense" ? "bg-white dark:bg-gray-800 text-rose-600 dark:text-rose-400 shadow-sm" : "text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    )}
                  >
                    Gasto
                  </button>
                </div>

                <Input 
                  label="Valor" 
                  type="number" 
                  value={amount} 
                  onChange={(e: any) => setAmount(e.target.value)} 
                  placeholder="0,00"
                />
                <Input 
                  label="Descrição" 
                  value={description} 
                  onChange={(e: any) => setDescription(e.target.value)} 
                  placeholder="Ex: Pagamento de serviço"
                />

                <div className="flex gap-3 pt-4">
                  <Button variant="secondary" onClick={() => setShowModal(false)} className="flex-1">Cancelar</Button>
                  <Button type="submit" className="flex-1">Confirmar</Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Main App ---

export default function App() {
  console.log("App component rendering...");
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"dashboard" | "admin" | "withdrawals" | "gestao" | "admin_withdrawals">("dashboard");
  const [stats, setStats] = useState<Stats | null>(null);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [adminWithdrawals, setAdminWithdrawals] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("theme");
      if (saved === "dark" || saved === "light") return saved;
    }
    return "light";
  });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Auth state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // Admin state
  const [adminUsers, setAdminUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [editStats, setEditStats] = useState<Stats | null>(null);

  // Withdrawal state
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawMethod, setWithdrawMethod] = useState<"pix" | "bank">("pix");
  const [pixKey, setPixKey] = useState("");
  const [bankAccount, setBankAccount] = useState("");

  useLayoutEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" || "light";
    setTheme(savedTheme);
    document.documentElement.classList.toggle("dark", savedTheme === "dark");
  }, []);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  useEffect(() => {
    if (user) {
      fetchStats();
      fetchWithdrawals();
      fetchTransactions();
      if (user.role === "admin") {
        fetchAdminUsers();
        fetchAdminWithdrawals();
      }
    }
  }, [user]);

  const fetchAdminWithdrawals = async () => {
    const res = await fetch("/api/admin/withdrawals");
    if (res.ok) setAdminWithdrawals(await res.json());
  };

  const handleUpdateWithdrawalStatus = async (id: number, status: string) => {
    const res = await fetch(`/api/admin/withdrawals/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      alert("Status do saque atualizado!");
      fetchAdminWithdrawals();
    }
  };

  useEffect(() => {
    if (user?.role === "admin" && view === "gestao" && selectedUserId) {
      fetchTransactions();
    }
  }, [selectedUserId, view]);

  const checkAuth = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        const data = await res.json();
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: newUsername, password: newPassword }),
      });
      if (res.ok) {
        alert("Usuário criado com sucesso!");
        setNewUsername("");
        setNewPassword("");
        fetchAdminUsers();
      } else {
        const data = await res.json();
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setStats(null);
    setWithdrawals([]);
    setView("dashboard");
  };

  const fetchStats = async () => {
    const res = await fetch("/api/stats");
    if (res.ok) setStats(await res.json());
  };

  const fetchWithdrawals = async () => {
    const res = await fetch("/api/withdrawals");
    if (res.ok) setWithdrawals(await res.json());
  };

  const fetchTransactions = async (userId?: number) => {
    const targetId = userId || selectedUserId;
    const url = targetId ? `/api/admin/transactions/${targetId}` : "/api/transactions";
    const res = await fetch(url);
    if (res.ok) setTransactions(await res.json());
  };

  const refreshData = async () => {
    await Promise.all([
      fetchStats(),
      fetchTransactions()
    ]);
  };

  const handleAddTransaction = async (data: { type: string, amount: number, description: string }) => {
    const targetId = selectedUserId || user?.id;
    if (!targetId) return;
    const res = await fetch(`/api/admin/transactions/${targetId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      alert("Lançamento realizado com sucesso!");
      refreshData();
    } else {
      const err = await res.json();
      alert(err.error || "Erro ao realizar lançamento");
    }
  };

  const handleUpdateTransaction = async (id: number, data: { type: string, amount: number, description: string }) => {
    const res = await fetch(`/api/admin/transactions/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      alert("Lançamento atualizado com sucesso!");
      refreshData();
    } else {
      const err = await res.json();
      alert(err.error || "Erro ao atualizar lançamento");
    }
  };

  const handleDeleteTransaction = async (id: number) => {
    const res = await fetch(`/api/admin/transactions/${id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      alert("Lançamento excluído com sucesso!");
      refreshData();
    } else {
      const err = await res.json();
      alert(err.error || "Erro ao excluir lançamento");
    }
  };

  const fetchAdminUsers = async () => {
    const res = await fetch("/api/admin/users");
    if (res.ok) setAdminUsers(await res.json());
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/withdrawals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: parseFloat(withdrawAmount),
        method: withdrawMethod,
        pix_key: withdrawMethod === "pix" ? pixKey : null,
        bank_account: withdrawMethod === "bank" ? bankAccount : null,
      }),
    });
    if (res.ok) {
      alert("Saque solicitado com sucesso!");
      setWithdrawAmount("");
      setPixKey("");
      setBankAccount("");
      fetchStats();
      fetchWithdrawals();
    } else {
      const data = await res.json();
      alert(data.error);
    }
  };

  const handleAdminEdit = async (userId: number) => {
    const res = await fetch(`/api/admin/stats/${userId}`);
    if (res.ok) {
      const data = await res.json();
      setEditStats(data);
      setSelectedUserId(userId);
    }
  };

  const saveAdminStats = async () => {
    if (!selectedUserId || !editStats) return;
    const res = await fetch(`/api/admin/stats/${selectedUserId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editStats),
    });
    if (res.ok) {
      alert("Dados atualizados!");
      setSelectedUserId(null);
      setEditStats(null);
      refreshData();
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center transition-colors">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
    </div>
  );

  if (!user) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4 transition-colors">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 w-full max-w-md transition-colors"
      >
        <div className="flex flex-col items-center gap-2 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Striper</h1>
          <p className="text-gray-500 dark:text-gray-400">Entre na sua conta</p>
        </div>
        
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <Input 
            label="Usuário" 
            value={username} 
            onChange={(e: any) => setUsername(e.target.value)} 
            placeholder="Seu nome de usuário"
          />
          <Input 
            label="Senha" 
            type="password" 
            value={password} 
            onChange={(e: any) => setPassword(e.target.value)} 
            placeholder="Sua senha"
          />
          <Button type="submit" className="mt-2">
            Entrar
          </Button>
        </form>
      </motion.div>
    </div>
  );

  const chartData = stats ? [
    { name: "Clientes", value: stats.total_clients },
    { name: "Lucro", value: stats.monthly_profit },
    { name: "Gastos", value: stats.expenses },
    { name: "Depósitos", value: stats.deposits },
  ] : [];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-30 transition-colors">
        <span className="text-xl font-bold text-gray-900 dark:text-white">Striper</span>
        <div className="flex items-center gap-2">
          <button 
            onClick={toggleTheme}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {theme === "light" ? <Moon className="w-5 h-5 text-gray-600" /> : <Sun className="w-5 h-5 text-yellow-400" />}
          </button>
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6 text-gray-600 dark:text-gray-400" /> : <Menu className="w-6 h-6 text-gray-600 dark:text-gray-400" />}
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 md:relative bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col transition-all duration-300 ease-in-out",
        "w-72",
        isSidebarCollapsed ? "md:w-20" : "md:w-72",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        <div className={cn("flex items-center p-6", isSidebarCollapsed ? "justify-center" : "justify-between")}>
          {!isSidebarCollapsed && <span className="text-2xl font-bold text-gray-900 dark:text-white">Striper</span>}
          <button 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="hidden md:flex p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
          >
            {isSidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            className="md:hidden p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex flex-col gap-2 flex-grow px-4">
          <button 
            onClick={() => { setView("dashboard"); setIsMobileMenuOpen(false); }}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all",
              view === "dashboard" ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400" : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800",
              isSidebarCollapsed && "justify-center px-0"
            )}
            title="Dashboard"
          >
            <LayoutDashboard className="w-5 h-5" />
            {!isSidebarCollapsed && <span>Dashboard</span>}
          </button>
          <button 
            onClick={() => { setView("withdrawals"); setIsMobileMenuOpen(false); }}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all",
              view === "withdrawals" ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400" : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800",
              isSidebarCollapsed && "justify-center px-0"
            )}
            title="Saques"
          >
            <Wallet className="w-5 h-5" />
            {!isSidebarCollapsed && <span>Saques</span>}
          </button>
          <button 
            onClick={() => { setView("gestao"); setIsMobileMenuOpen(false); }}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all",
              view === "gestao" ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400" : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800",
              isSidebarCollapsed && "justify-center px-0"
            )}
            title="Gestão"
          >
            <History className="w-5 h-5" />
            {!isSidebarCollapsed && <span>Gestão</span>}
          </button>
          {user.role === "admin" && (
            <button 
              onClick={() => { setView("admin_withdrawals"); setIsMobileMenuOpen(false); }}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all relative",
                view === "admin_withdrawals" ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400" : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800",
                isSidebarCollapsed && "justify-center px-0"
              )}
              title="Pendente"
            >
              <History className="w-5 h-5" />
              {!isSidebarCollapsed && <span>Pendente</span>}
              {adminWithdrawals.filter(w => w.status === "Pendente").length > 0 && (
                <span className="absolute top-2 right-2 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
              )}
            </button>
          )}
          {user.role === "admin" && (
            <button 
              onClick={() => { setView("admin"); setIsMobileMenuOpen(false); }}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all",
                view === "admin" ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400" : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800",
                isSidebarCollapsed && "justify-center px-0"
              )}
              title="Painel ADM"
            >
              <Users className="w-5 h-5" />
              {!isSidebarCollapsed && <span>Painel ADM</span>}
            </button>
          )}
        </nav>

        <div className="flex flex-col gap-4 p-4 border-t border-gray-100 dark:border-gray-800">
          <button 
            onClick={toggleTheme}
            className={cn(
              "hidden md:flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all",
              isSidebarCollapsed && "justify-center px-0"
            )}
            title={theme === "light" ? "Modo Escuro" : "Modo Claro"}
          >
            {theme === "light" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5 text-yellow-400" />}
            {!isSidebarCollapsed && <span>{theme === "light" ? "Modo Escuro" : "Modo Claro"}</span>}
          </button>

          <div className={cn("flex items-center gap-3 px-2", isSidebarCollapsed && "justify-center px-0")}>
            <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold shrink-0">
              {user.username[0].toUpperCase()}
            </div>
            {!isSidebarCollapsed && (
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-bold text-gray-900 dark:text-white truncate">{user.username}</span>
                <span className="text-xs text-gray-500 dark:text-gray-500 capitalize">{user.role}</span>
              </div>
            )}
          </div>
          <button 
            onClick={handleLogout}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all",
              isSidebarCollapsed && "justify-center px-0"
            )}
            title="Sair"
          >
            <LogOut className="w-5 h-5" />
            {!isSidebarCollapsed && <span>Sair</span>}
          </button>
        </div>
      </aside>

      {/* Overlay for mobile menu */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-grow p-6 md:p-10 overflow-y-auto">
        <AnimatePresence mode="wait">
          {view === "dashboard" && stats && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col gap-8"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Dashboard {user.role === "admin" && <span className="text-indigo-600 dark:text-indigo-400 text-lg font-medium ml-2">(Global)</span>}
                  </h2>
                  <p className="text-gray-500 dark:text-gray-400">Bem-vindo de volta, {user.username}!</p>
                </div>
                <div className="flex items-center gap-3">
                  <Button onClick={fetchStats} variant="secondary" className="flex items-center gap-2">
                    <RefreshCcw className="w-4 h-4" />
                    Atualizar
                  </Button>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card 
                  title="Clientes Total" 
                  value={stats.total_clients} 
                  icon={Users} 
                  color="bg-green-500" 
                  isCurrency={false}
                />
                <Card 
                  title="Lucro Mês" 
                  value={stats.monthly_profit} 
                  icon={TrendingUp} 
                  color="bg-indigo-500" 
                />
                <Card 
                  title="Saldo Disponível" 
                  value={stats.available_balance} 
                  icon={Wallet} 
                  color="bg-blue-500" 
                  subtitle="Disponível para saque"
                />
                <Card 
                  title="Reembolsos" 
                  value={stats.refunds} 
                  icon={RefreshCcw} 
                  color="bg-orange-500" 
                />
                <Card 
                  title="Retirada de Fundo" 
                  value={stats.withdrawn_funds} 
                  icon={ArrowUpRight} 
                  color="bg-purple-500" 
                />
                <Card 
                  title="Gastos" 
                  value={stats.expenses} 
                  icon={MinusCircle} 
                  color="bg-red-500" 
                />
                <Card 
                  title="Depósitos" 
                  value={stats.deposits} 
                  icon={PlusCircle} 
                  color="bg-teal-500" 
                />
              </div>

              {/* Chart */}
              <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Visão Geral Financeira</h3>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === "dark" ? "#334155" : "#f1f5f9"} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: theme === "dark" ? "#94a3b8" : "#64748b", fontSize: 12 }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: theme === "dark" ? "#94a3b8" : "#64748b", fontSize: 12 }} />
                      <Tooltip 
                        cursor={{ fill: theme === "dark" ? "#1e293b" : "#f8fafc" }}
                        contentStyle={{ 
                          backgroundColor: theme === "dark" ? "#1e293b" : "#ffffff",
                          borderRadius: '12px', 
                          border: 'none', 
                          boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                          color: theme === "dark" ? "#ffffff" : "#000000"
                        }}
                      />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={40}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={['#22c55e', '#6366f1', '#ef4444', '#14b8a6'][index % 4]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </motion.div>
          )}

          {view === "withdrawals" && (
            <motion.div 
              key="withdrawals"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col gap-8 max-w-4xl"
            >
              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Saques</h2>
                <p className="text-gray-500 dark:text-gray-400">Gerencie suas retiradas de fundos.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Withdrawal Form */}
                <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col gap-6 transition-colors">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <ArrowUpRight className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                    Solicitar Saque
                  </h3>
                  
                  <div className="bg-indigo-50 dark:bg-indigo-500/10 p-4 rounded-2xl flex items-center justify-between">
                    <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">Saldo Disponível</span>
                    <span className="text-xl font-bold text-indigo-700 dark:text-indigo-300">
                      R$ {stats?.available_balance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <form onSubmit={handleWithdraw} className="flex flex-col gap-4">
                    <Input 
                      label="Valor do Saque" 
                      type="number" 
                      value={withdrawAmount} 
                      onChange={(e: any) => setWithdrawAmount(e.target.value)} 
                      placeholder="0,00"
                    />
                    
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Método de Retirada</label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setWithdrawMethod("pix")}
                          className={cn(
                            "flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all",
                            withdrawMethod === "pix" ? "border-indigo-600 bg-indigo-50 text-indigo-600 dark:border-indigo-400 dark:bg-indigo-500/10 dark:text-indigo-400" : "border-gray-100 dark:border-gray-700 text-gray-500 dark:text-gray-500 hover:border-gray-200 dark:hover:border-gray-600"
                          )}
                        >
                          <CreditCard className="w-5 h-5" />
                          PIX
                        </button>
                        <button
                          type="button"
                          onClick={() => setWithdrawMethod("bank")}
                          className={cn(
                            "flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all",
                            withdrawMethod === "bank" ? "border-indigo-600 bg-indigo-50 text-indigo-600 dark:border-indigo-400 dark:bg-indigo-500/10 dark:text-indigo-400" : "border-gray-100 dark:border-gray-700 text-gray-500 dark:text-gray-500 hover:border-gray-200 dark:hover:border-gray-600"
                          )}
                        >
                          <ArrowDownLeft className="w-5 h-5" />
                          Transferência
                        </button>
                      </div>
                    </div>

                    {withdrawMethod === "pix" ? (
                      <Input 
                        label="Chave PIX" 
                        value={pixKey} 
                        onChange={(e: any) => setPixKey(e.target.value)} 
                        placeholder="CPF, E-mail, Telefone ou Aleatória"
                      />
                    ) : (
                      <Input 
                        label="Dados Bancários" 
                        value={bankAccount} 
                        onChange={(e: any) => setBankAccount(e.target.value)} 
                        placeholder="Agência, Conta, Banco"
                      />
                    )}

                    <Button type="submit" className="mt-4 py-4 text-lg">
                      Sacar Fundos
                    </Button>
                  </form>
                </div>

                {/* History */}
                <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col gap-6 transition-colors">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <History className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                    Histórico
                  </h3>
                  <div className="flex flex-col gap-4">
                    {withdrawals.length === 0 ? (
                      <p className="text-gray-400 dark:text-gray-600 text-center py-10">Nenhum saque solicitado ainda.</p>
                    ) : (
                      withdrawals.map((w) => (
                        <div key={w.id} className="flex items-center justify-between p-4 rounded-2xl border border-gray-50 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-900/30">
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-900 dark:text-white">R$ {w.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                            <span className="text-xs text-gray-500 dark:text-gray-500 uppercase">{w.method} • {new Date(w.created_at).toLocaleDateString()}</span>
                          </div>
                          <span className={cn(
                            "px-3 py-1 rounded-full text-xs font-bold uppercase",
                            w.status === "Pendente" ? "bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400" : 
                            w.status === "Pagamento Realizado com Sucesso" ? "bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400" :
                            "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400"
                          )}>
                            {w.status}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {view === "gestao" && (
            <motion.div 
              key="gestao"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Gestao 
                transactions={transactions} 
                onAddTransaction={handleAddTransaction}
                onUpdateTransaction={handleUpdateTransaction}
                onDeleteTransaction={handleDeleteTransaction}
                isAdmin={user.role === "admin"}
                selectedUserForAdmin={selectedUserId}
                adminUsers={adminUsers}
                onSelectUser={(id: number) => setSelectedUserId(id)}
              />
            </motion.div>
          )}

          {view === "admin_withdrawals" && user.role === "admin" && (
            <motion.div 
              key="admin_withdrawals"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col gap-8"
            >
              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Solicitações de Saque</h2>
                <p className="text-gray-500 dark:text-gray-400">Gerencie as solicitações de saque dos usuários.</p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                      <tr>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Usuário</th>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Valor</th>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Método</th>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Detalhes</th>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                      {adminWithdrawals.map((w) => (
                        <tr key={w.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                                {w.username?.[0].toUpperCase()}
                              </div>
                              <span className="text-sm font-medium text-gray-900 dark:text-white">{w.username}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm font-bold text-gray-900 dark:text-white whitespace-nowrap">
                            R$ {w.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap uppercase">
                            {w.method}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                            {w.method === "pix" ? `PIX: ${w.pix_key}` : `Banco: ${w.bank_account}`}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={cn(
                              "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                              w.status === "Pendente" ? "bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400" : 
                              w.status === "Pagamento Realizado com Sucesso" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400" :
                              "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400"
                            )}>
                              {w.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right whitespace-nowrap">
                            <select 
                              className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              value={w.status}
                              onChange={(e) => handleUpdateWithdrawalStatus(w.id, e.target.value)}
                            >
                              <option value="Pendente">Pendente</option>
                              <option value="Pagamento Realizado com Sucesso">Sucesso</option>
                              <option value="Recusado - Credenciais Inválidas">Recusado</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                      {adminWithdrawals.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-6 py-16 text-center">
                            <p className="text-gray-400 dark:text-gray-600 italic">Nenhuma solicitação de saque encontrada.</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {view === "admin" && user.role === "admin" && (
            <motion.div 
              key="admin"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col gap-8"
            >
              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Painel Administrativo</h2>
                <p className="text-gray-500 dark:text-gray-400">Gerencie usuários e estatísticas financeiras.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* User List & Registration */}
                <div className="flex flex-col gap-8">
                  {/* Create User Form */}
                  <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col gap-6 transition-colors">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <PlusCircle className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                      Criar Usuário
                    </h3>
                    <form onSubmit={handleRegister} className="flex flex-col gap-4">
                      <Input 
                        label="Novo Usuário" 
                        value={newUsername} 
                        onChange={(e: any) => setNewUsername(e.target.value)} 
                        placeholder="Nome de usuário"
                      />
                      <Input 
                        label="Senha" 
                        type="password" 
                        value={newPassword} 
                        onChange={(e: any) => setNewPassword(e.target.value)} 
                        placeholder="Senha"
                      />
                      <Button type="submit" className="mt-2">
                        Criar Conta
                      </Button>
                    </form>
                  </div>

                  {/* User List */}
                  <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col gap-6 transition-colors">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Usuários</h3>
                    <div className="flex flex-col gap-2">
                      {adminUsers.map((u) => (
                        <button
                          key={u.id}
                          onClick={() => handleAdminEdit(u.id)}
                          className={cn(
                            "flex items-center justify-between p-4 rounded-2xl transition-all text-left",
                            selectedUserId === u.id ? "bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/30" : "hover:bg-gray-50 dark:hover:bg-gray-700/50 border-transparent"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-400 font-bold">
                              {u.username[0].toUpperCase()}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-bold text-gray-900 dark:text-white">{u.username}</span>
                              <span className="text-xs text-gray-500 dark:text-gray-500 capitalize">{u.role}</span>
                            </div>
                          </div>
                          <Settings className="w-4 h-4 text-gray-400 dark:text-gray-600" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Edit Form */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
                  {selectedUserId && editStats ? (
                    <div className="flex flex-col gap-8">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Editar Estatísticas</h3>
                        <div className="flex items-center gap-2">
                          <Button onClick={() => setSelectedUserId(null)} variant="secondary">Cancelar</Button>
                          <Button onClick={saveAdminStats}>Salvar Alterações</Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input 
                          label="Clientes Total" 
                          type="number" 
                          value={editStats.total_clients} 
                          onChange={(e: any) => setEditStats({ ...editStats, total_clients: parseInt(e.target.value) || 0 })} 
                        />
                        <Input 
                          label="Lucro Mês" 
                          type="number" 
                          value={editStats.monthly_profit} 
                          onChange={(e: any) => setEditStats({ ...editStats, monthly_profit: parseFloat(e.target.value) })} 
                        />
                        <Input 
                          label="Reembolsos" 
                          type="number" 
                          value={editStats.refunds} 
                          onChange={(e: any) => setEditStats({ ...editStats, refunds: parseFloat(e.target.value) })} 
                        />
                        <Input 
                          label="Saldo Disponível" 
                          type="number" 
                          value={editStats.available_balance} 
                          onChange={(e: any) => setEditStats({ ...editStats, available_balance: parseFloat(e.target.value) })} 
                        />
                        <Input 
                          label="Retirada de Fundo" 
                          type="number" 
                          value={editStats.withdrawn_funds} 
                          onChange={(e: any) => setEditStats({ ...editStats, withdrawn_funds: parseFloat(e.target.value) })} 
                        />
                        <Input 
                          label="Gastos" 
                          type="number" 
                          value={editStats.expenses} 
                          onChange={(e: any) => setEditStats({ ...editStats, expenses: parseFloat(e.target.value) })} 
                        />
                        <Input 
                          label="Depósitos" 
                          type="number" 
                          value={editStats.deposits} 
                          onChange={(e: any) => setEditStats({ ...editStats, deposits: parseFloat(e.target.value) })} 
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-600 gap-4 py-20">
                      <Users className="w-16 h-16 opacity-20" />
                      <p>Selecione um usuário para editar seus dados financeiros.</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
