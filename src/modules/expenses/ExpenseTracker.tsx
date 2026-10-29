import React, { useState, useEffect, useMemo } from 'react';
import {
  Wallet,
  Plus,
  Trash2,
  Edit2,
  DollarSign,
  TrendingUp,
  PieChart as PieIcon,
  Filter,
  Search,
  Calendar,
  AlertCircle,
  X,
  CreditCard,
  Check,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../services/apiService';
import { Expense, Budget } from '../../types';

const CATEGORIES = [
  { name: 'Food & Canteen', color: '#06b6d4' },
  { name: 'Books & Stationery', color: '#38bdf8' },
  { name: 'Travel & Transit', color: '#8b5cf6' },
  { name: 'Hostel & Rent', color: '#a855f7' },
  { name: 'Utilities', color: '#10b981' },
  { name: 'Entertainment', color: '#f59e0b' },
  { name: 'Others', color: '#64748b' },
];

export const ExpenseTracker: React.FC = () => {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budget, setBudget] = useState<Budget | null>(null);
  const [loading, setLoading] = useState(true);

  // Filter & Search states
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [chartView, setChartView] = useState<'pie' | 'bar'>('pie');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<Expense['category']>('Food & Canteen');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<Expense['payment_method']>('UPI');
  const [notes, setNotes] = useState('');
  const [budgetLimitInput, setBudgetLimitInput] = useState('6500');

  const currentMonth = new Date().toISOString().slice(0, 7);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [expList, bgt] = await Promise.all([
        apiService.getExpenses(user.id),
        apiService.getBudget(user.id, currentMonth),
      ]);
      setExpenses(expList);
      setBudget(bgt);
      setBudgetLimitInput(String(bgt.monthly_limit));
    } catch (err) {
      console.error('Failed to load expense data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Calculations
  const monthlyExpenses = useMemo(() => {
    return expenses.filter((e) => e.date.startsWith(currentMonth));
  }, [expenses, currentMonth]);

  const totalMonthlySpend = useMemo(() => {
    return monthlyExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
  }, [monthlyExpenses]);

  const totalAllTimeSpend = useMemo(() => {
    return expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  }, [expenses]);

  const budgetLimit = budget?.monthly_limit || 5000;
  const budgetUtilization = Math.min(100, Math.round((totalMonthlySpend / budgetLimit) * 100));
  const remainingBudget = Math.max(0, budgetLimit - totalMonthlySpend);

  // Category breakdown for chart
  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    monthlyExpenses.forEach((e) => {
      map[e.category] = (map[e.category] || 0) + Number(e.amount);
    });

    return Object.entries(map).map(([name, value]) => {
      const catObj = CATEGORIES.find((c) => c.name === name);
      return {
        name,
        value,
        color: catObj ? catObj.color : '#38bdf8',
      };
    });
  }, [monthlyExpenses]);

  // Filtered expenses list
  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      const matchesSearch =
        e.title.toLowerCase().includes(search.toLowerCase()) ||
        (e.notes && e.notes.toLowerCase().includes(search.toLowerCase()));
      const matchesCategory =
        selectedCategory === 'all' || e.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [expenses, search, selectedCategory]);

  const handleOpenAddModal = () => {
    setEditingExpense(null);
    setTitle('');
    setAmount('');
    setCategory('Food & Canteen');
    setDate(new Date().toISOString().split('T')[0]);
    setPaymentMethod('UPI');
    setNotes('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (exp: Expense) => {
    setEditingExpense(exp);
    setTitle(exp.title);
    setAmount(String(exp.amount));
    setCategory(exp.category);
    setDate(exp.date);
    setPaymentMethod(exp.payment_method);
    setNotes(exp.notes || '');
    setIsModalOpen(true);
  };

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !amount || Number(amount) <= 0) return;

    try {
      if (editingExpense) {
        await apiService.updateExpense(editingExpense.id, {
          title,
          amount: Number(amount),
          category,
          date,
          payment_method: paymentMethod,
          notes,
        });
      } else {
        await apiService.addExpense(user.id, {
          title,
          amount: Number(amount),
          category,
          date,
          payment_method: paymentMethod,
          notes,
        });
      }
      setIsModalOpen(false);
      await loadData();
    } catch (err) {
      console.error('Error saving expense:', err);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!window.confirm('Delete this expense entry?')) return;
    try {
      await apiService.deleteExpense(id);
      await loadData();
    } catch (err) {
      console.error('Error deleting expense:', err);
    }
  };

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const limit = Number(budgetLimitInput);
    if (limit <= 0) return;

    try {
      await apiService.saveBudget(user.id, currentMonth, limit);
      setIsBudgetModalOpen(false);
      await loadData();
    } catch (err) {
      console.error('Error saving budget:', err);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header title & Add Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Wallet className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Expense Tracker & Budget
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Track student expenditure, category breakdowns, and monitor your monthly living budget.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsBudgetModalOpen(true)}
            className="px-3.5 py-2 text-xs font-medium rounded-xl glass-panel text-slate-200 hover:text-cyan-300 hover:border-cyan-500/40 transition flex items-center gap-1.5"
          >
            <DollarSign className="w-3.5 h-3.5 text-cyan-400" />
            <span>Set Monthly Budget</span>
          </button>
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-95 text-white shadow-glow-blue transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Expense</span>
          </button>
        </div>
      </div>

      {/* Top 3 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Monthly Spend */}
        <div className="p-5 rounded-2xl glass-panel border border-emerald-500/20">
          <span className="text-xs font-mono text-emerald-400 uppercase tracking-wider block">
            This Month's Spending
          </span>
          <div className="text-2xl font-extrabold text-white font-mono mt-2">
            ₹{totalMonthlySpend.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 font-mono">
            {monthlyExpenses.length} transactions in {currentMonth}
          </p>
        </div>

        {/* Card 2: Budget Progress */}
        <div className="p-5 rounded-2xl glass-panel border border-cyan-500/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider">
              Budget Allowance
            </span>
            <span className="text-[11px] font-mono text-slate-300">
              ₹{budgetLimit.toLocaleString('en-IN')} Limit
            </span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2.5 mt-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                budgetUtilization > 90 ? 'bg-rose-500' : budgetUtilization > 75 ? 'bg-amber-400' : 'bg-emerald-400'
              }`}
              style={{ width: `${budgetUtilization}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[11px] text-slate-400 mt-2 font-mono">
            <span>{budgetUtilization}% utilized</span>
            <span>₹{remainingBudget.toLocaleString('en-IN')} remaining</span>
          </div>
        </div>

        {/* Card 3: All-Time Expense Total */}
        <div className="p-5 rounded-2xl glass-panel border border-violet-500/20">
          <span className="text-xs font-mono text-violet-400 uppercase tracking-wider block">
            All-Time College Expenditure
          </span>
          <div className="text-2xl font-extrabold text-white font-mono mt-2">
            ₹{totalAllTimeSpend.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 font-mono">
            Across {expenses.length} total logged expenses
          </p>
        </div>
      </div>

      {/* Visual Analytics Chart */}
      {monthlyExpenses.length > 0 && (
        <div className="p-5 rounded-2xl glass-panel border border-slate-800/80">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-cyan-400" />
                <span>Monthly Category Breakdown</span>
              </h2>
              <p className="text-xs text-slate-400">
                Visual expenditure allocation for {currentMonth}
              </p>
            </div>
            <div className="flex rounded-lg bg-slate-900 p-0.5 border border-slate-800">
              <button
                onClick={() => setChartView('pie')}
                className={`px-3 py-1 text-xs rounded-md transition ${
                  chartView === 'pie' ? 'bg-cyan-500/20 text-cyan-300 font-medium' : 'text-slate-400'
                }`}
              >
                Donut
              </button>
              <button
                onClick={() => setChartView('bar')}
                className={`px-3 py-1 text-xs rounded-md transition ${
                  chartView === 'bar' ? 'bg-cyan-500/20 text-cyan-300 font-medium' : 'text-slate-400'
                }`}
              >
                Bar
              </button>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              {chartView === 'pie' ? (
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="#070b14" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0d1527',
                      borderColor: 'rgba(56, 189, 248, 0.3)',
                      borderRadius: '12px',
                      color: '#f8fafc',
                      fontSize: '12px',
                    }}
                    formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Amount']}
                  />
                </PieChart>
              ) : (
                <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} interval={0} angle={-15} textAnchor="end" />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0d1527',
                      borderColor: 'rgba(56, 189, 248, 0.3)',
                      borderRadius: '12px',
                      color: '#f8fafc',
                    }}
                    formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Amount']}
                  />
                  <Bar dataKey="value" fill="#38bdf8" radius={[6, 6, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search expense titles, notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl glass-input"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition ${
              selectedCategory === 'all'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Categories
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.name}
              onClick={() => setSelectedCategory(cat.name)}
              className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                selectedCategory === cat.name
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Expenses History Table */}
      <div className="rounded-2xl glass-panel border border-slate-800/80 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 font-mono text-[11px] uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Title & Notes</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <p className="text-sm">No expense records found.</p>
                    <button
                      onClick={handleOpenAddModal}
                      className="mt-2 text-xs text-cyan-400 hover:underline"
                    >
                      Log your first college expense
                    </button>
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-100">{exp.title}</p>
                      {exp.notes && (
                        <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{exp.notes}</p>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-cyan-300 border border-slate-700">
                        {exp.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-300">{exp.date}</td>
                    <td className="py-3 px-4 font-mono text-slate-400">{exp.payment_method}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-white">
                      ₹{Number(exp.amount).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEditModal(exp)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition"
                          title="Edit Expense"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteExpense(exp.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                          title="Delete Expense"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md rounded-2xl glass-panel border border-cyan-500/30 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-base font-bold text-white">
                {editingExpense ? 'Edit Expense Record' : 'Add New Expense'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Expense Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Data Structures Reference Book"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl glass-input text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="450"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl glass-input text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl glass-input text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl glass-input text-xs"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.name} value={c.name} className="bg-slate-900 text-white">
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl glass-input text-xs"
                  >
                    <option value="UPI" className="bg-slate-900 text-white">UPI</option>
                    <option value="Cash" className="bg-slate-900 text-white">Cash</option>
                    <option value="Card" className="bg-slate-900 text-white">Card</option>
                    <option value="Net Banking" className="bg-slate-900 text-white">Net Banking</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Notes / Description</label>
                <textarea
                  rows={2}
                  placeholder="Optional notes or receipt details..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl glass-input text-xs resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-glow-blue hover:opacity-95 transition"
                >
                  {editingExpense ? 'Save Changes' : 'Record Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Set Monthly Budget Modal */}
      {isBudgetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-sm rounded-2xl glass-panel border border-cyan-500/30 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-base font-bold text-white">Set Monthly Budget Limit</h2>
              <button
                onClick={() => setIsBudgetModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBudget} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  Budget for {currentMonth} (₹)
                </label>
                <input
                  type="number"
                  min="500"
                  required
                  value={budgetLimitInput}
                  onChange={(e) => setBudgetLimitInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl glass-input text-xs font-mono"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Recommended student budget: ₹4,000 - ₹8,000 / month.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsBudgetModalOpen(false)}
                  className="px-4 py-2 text-xs rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white transition"
                >
                  Update Budget
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
