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
  X,
  CreditCard,
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
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-[#00D6B5]/15 text-[#00D6B5] border border-[#00D6B5]/30 shadow-[0_0_15px_rgba(0,214,181,0.15)]">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#F4F7FF] tracking-tight">
                Expense Tracker
              </h1>
              <p className="text-xs text-[#9BAFCB]">
                Track student expenditure, category breakdowns, and monitor your monthly living budget.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsBudgetModalOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-[#071B35] border border-[#17365C] text-[#F4F7FF] hover:border-[#00D9FF]/50 hover:text-[#00D9FF] transition-all flex items-center gap-1.5 shadow-sm"
          >
            <DollarSign className="w-3.5 h-3.5 text-[#00D9FF]" />
            <span>Set Monthly Budget</span>
          </button>
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-[#00D6B5] to-[#087BFF] hover:opacity-95 text-[#020B1A] font-bold shadow-[0_0_20px_rgba(0,214,181,0.25)] transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4 text-[#020B1A]" />
            <span>Add Expense</span>
          </button>
        </div>
      </div>

      {/* Top 3 Summary Cards with High-Fidelity Visual Watermarks & Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Monthly Spend */}
        <div className="relative p-5 rounded-2xl bg-[#071B35] border border-[#17365C] overflow-hidden hover:border-[#00D6B5]/40 transition-all shadow-lg group">
          <div className="absolute -right-2 -bottom-2 text-[#00D6B5]/10 pointer-events-none group-hover:text-[#00D6B5]/20 transition-all">
            <TrendingUp className="w-24 h-24 stroke-[1]" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#00D6B5] uppercase tracking-wider block">
                This Month's Spending
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#00D6B5]/15 text-[#00D6B5] border border-[#00D6B5]/30">
                {currentMonth}
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#F4F7FF] font-mono mt-2 tracking-tight">
              ₹{totalMonthlySpend.toLocaleString('en-IN')}
            </div>
            <p className="text-[11px] text-[#9BAFCB] mt-1.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00D6B5]" />
              <span>{monthlyExpenses.length} transactions recorded this month</span>
            </p>
          </div>
        </div>

        {/* Card 2: Budget Progress & Health Status */}
        <div className="relative p-5 rounded-2xl bg-[#071B35] border border-[#17365C] overflow-hidden hover:border-[#087BFF]/40 transition-all shadow-lg group">
          <div className="absolute -right-2 -bottom-2 text-[#087BFF]/10 pointer-events-none group-hover:text-[#087BFF]/20 transition-all">
            <Wallet className="w-24 h-24 stroke-[1]" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#00D9FF] uppercase tracking-wider">
                Monthly Allowance
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                budgetUtilization > 90
                  ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                  : budgetUtilization > 70
                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                  : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
              }`}>
                {budgetUtilization > 90 ? 'Budget Critical' : budgetUtilization > 70 ? 'Approaching Limit' : 'Safe Zone'}
              </span>
            </div>
            <div className="flex items-baseline justify-between mt-2">
              <div className="text-2xl sm:text-3xl font-extrabold text-[#F4F7FF] font-mono tracking-tight">
                {budgetUtilization}%
              </div>
              <span className="text-xs font-mono text-[#9BAFCB]">
                Limit: ₹{budgetLimit.toLocaleString('en-IN')}
              </span>
            </div>
            {/* Visual segmented progress meter */}
            <div className="w-full bg-[#030E1F] rounded-full h-2.5 mt-2.5 overflow-hidden border border-[#17365C]">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  budgetUtilization > 90
                    ? 'bg-gradient-to-r from-amber-500 to-rose-500'
                    : budgetUtilization > 70
                    ? 'bg-gradient-to-r from-[#00D9FF] to-amber-400'
                    : 'bg-gradient-to-r from-[#00D6B5] to-[#087BFF]'
                }`}
                style={{ width: `${budgetUtilization}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[11px] text-[#9BAFCB] mt-2 font-mono">
              <span>₹{totalMonthlySpend.toLocaleString('en-IN')} spent</span>
              <span className="text-[#00D9FF] font-semibold">₹{remainingBudget.toLocaleString('en-IN')} left</span>
            </div>
          </div>
        </div>

        {/* Card 3: All-Time Expense Total */}
        <div className="relative p-5 rounded-2xl bg-[#071B35] border border-[#17365C] overflow-hidden hover:border-[#713CFF]/40 transition-all shadow-lg group">
          <div className="absolute -right-2 -bottom-2 text-[#713CFF]/10 pointer-events-none group-hover:text-[#713CFF]/20 transition-all">
            <CreditCard className="w-24 h-24 stroke-[1]" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#A78BFA] uppercase tracking-wider block">
                Total College Spend
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#713CFF]/15 text-[#A78BFA] border border-[#713CFF]/30">
                All Time
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#F4F7FF] font-mono mt-2 tracking-tight">
              ₹{totalAllTimeSpend.toLocaleString('en-IN')}
            </div>
            <p className="text-[11px] text-[#9BAFCB] mt-1.5 flex items-center gap-1.5 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-[#713CFF]" />
              <span>Across {expenses.length} total logged expenses</span>
            </p>
          </div>
        </div>
      </div>

      {/* Visual Analytics Chart */}
      {monthlyExpenses.length > 0 && (
        <div className="p-5 sm:p-6 rounded-2xl bg-[#071B35] border border-[#17365C] shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-[#F4F7FF] flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-[#00D9FF]" />
                <span>Monthly Expenditure Breakdown</span>
              </h2>
              <p className="text-xs text-[#9BAFCB]">
                Visual allocation across categories for {currentMonth}
              </p>
            </div>
            <div className="flex rounded-xl bg-[#030E1F] p-1 border border-[#17365C] self-start sm:self-auto">
              <button
                onClick={() => setChartView('pie')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                  chartView === 'pie'
                    ? 'bg-gradient-to-r from-[#00D9FF] to-[#087BFF] text-[#020B1A] shadow-sm'
                    : 'text-[#9BAFCB] hover:text-white'
                }`}
              >
                Donut
              </button>
              <button
                onClick={() => setChartView('bar')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                  chartView === 'bar'
                    ? 'bg-gradient-to-r from-[#00D9FF] to-[#087BFF] text-[#020B1A] shadow-sm'
                    : 'text-[#9BAFCB] hover:text-white'
                }`}
              >
                Bar Chart
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
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="#020B1A" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#071B35',
                      borderColor: '#17365C',
                      borderRadius: '12px',
                      color: '#F4F7FF',
                      fontSize: '12px',
                      boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
                    }}
                    formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Amount']}
                  />
                </PieChart>
              ) : (
                <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#17365C" />
                  <XAxis dataKey="name" stroke="#9BAFCB" fontSize={10} tickLine={false} interval={0} angle={-15} textAnchor="end" />
                  <YAxis stroke="#9BAFCB" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#071B35',
                      borderColor: '#17365C',
                      borderRadius: '12px',
                      color: '#F4F7FF',
                      fontSize: '12px',
                    }}
                    formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Amount']}
                  />
                  <Bar dataKey="value" fill="#00D9FF" radius={[6, 6, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-[#9BAFCB]" />
          <input
            type="text"
            placeholder="Search expense titles, notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-[#061830] border border-[#17365C] text-[#F4F7FF] placeholder-[#9BAFCB]/60 focus:outline-none focus:border-[#00D9FF] transition"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <Filter className="w-3.5 h-3.5 text-[#9BAFCB] shrink-0" />
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              selectedCategory === 'all'
                ? 'bg-[#00D6B5]/15 text-[#00D6B5] border border-[#00D6B5]/40 shadow-sm'
                : 'bg-[#071B35] border border-[#17365C] text-[#9BAFCB] hover:text-[#F4F7FF]'
            }`}
          >
            All Categories
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.name}
              onClick={() => setSelectedCategory(cat.name)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                selectedCategory === cat.name
                  ? 'bg-[#00D6B5]/15 text-[#00D6B5] border border-[#00D6B5]/40 shadow-sm'
                  : 'bg-[#071B35] border border-[#17365C] text-[#9BAFCB] hover:text-[#F4F7FF]'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Expenses History Table */}
      <div className="rounded-2xl bg-[#071B35] border border-[#17365C] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#030E1F] text-[#9BAFCB] font-mono text-[11px] uppercase tracking-wider border-b border-[#17365C]">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Title & Notes</th>
                <th className="py-3.5 px-4 font-semibold">Category</th>
                <th className="py-3.5 px-4 font-semibold">Date</th>
                <th className="py-3.5 px-4 font-semibold">Payment</th>
                <th className="py-3.5 px-4 text-right font-semibold">Amount</th>
                <th className="py-3.5 px-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#17365C]/40">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-14 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="w-14 h-14 rounded-2xl bg-[#00D6B5]/10 border border-[#00D6B5]/20 flex items-center justify-center text-[#00D6B5]">
                        <Wallet className="w-7 h-7" />
                      </div>
                      <p className="text-sm font-semibold text-[#F4F7FF]">No expense records found</p>
                      <p className="text-xs text-[#9BAFCB] max-w-xs">
                        {search || selectedCategory !== 'all'
                          ? 'Try adjusting your search query or category filters'
                          : 'Start tracking your daily college expenses, canteen bills, and books'}
                      </p>
                      <button
                        onClick={handleOpenAddModal}
                        className="mt-2 px-4 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-[#00D6B5] to-[#087BFF] text-[#020B1A] hover:opacity-95 transition"
                      >
                        + Add First Expense
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-[#081F3D]/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-[#F4F7FF]">{exp.title}</div>
                      {exp.notes && (
                        <div className="text-[11px] text-[#9BAFCB] truncate max-w-xs">{exp.notes}</div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#030E1F] border border-[#17365C] text-[#F4F7FF]">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{
                            backgroundColor:
                              CATEGORIES.find((c) => c.name === exp.category)?.color || '#64748b',
                          }}
                        />
                        {exp.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-[#9BAFCB]">{exp.date}</td>
                    <td className="py-3 px-4">
                      <span className="text-[11px] px-2 py-0.5 rounded bg-[#061830] border border-[#17365C] text-[#9BAFCB]">
                        {exp.payment_method}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-sm text-[#00D6B5]">
                      ₹{Number(exp.amount).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEditModal(exp)}
                          className="p-1.5 rounded-lg text-[#9BAFCB] hover:text-[#00D9FF] hover:bg-[#061830] transition"
                          title="Edit Expense"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteExpense(exp.id)}
                          className="p-1.5 rounded-lg text-[#9BAFCB] hover:text-[#F04356] hover:bg-[#061830] transition"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-md rounded-2xl bg-[#071B35] border border-[#17365C] p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#17365C]">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#00D6B5]" />
                <h2 className="text-base font-bold text-[#F4F7FF]">
                  {editingExpense ? 'Edit Expense Record' : 'Add New Expense'}
                </h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-[#9BAFCB] hover:text-[#F4F7FF] hover:bg-[#061830] transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-medium text-[#9BAFCB] block mb-1">Expense Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Data Structures Reference Book"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#061830] border border-[#17365C] text-xs text-[#F4F7FF] placeholder-[#9BAFCB]/60 focus:outline-none focus:border-[#00D9FF] transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-[#9BAFCB] block mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="450"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#061830] border border-[#17365C] text-xs font-mono text-[#F4F7FF] placeholder-[#9BAFCB]/60 focus:outline-none focus:border-[#00D9FF] transition"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-[#9BAFCB] block mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#061830] border border-[#17365C] text-xs font-mono text-[#F4F7FF] focus:outline-none focus:border-[#00D9FF] transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-[#9BAFCB] block mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#061830] border border-[#17365C] text-xs text-[#F4F7FF] focus:outline-none focus:border-[#00D9FF] transition"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.name} value={c.name} className="bg-[#071B35] text-[#F4F7FF]">
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-[#9BAFCB] block mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#061830] border border-[#17365C] text-xs text-[#F4F7FF] focus:outline-none focus:border-[#00D9FF] transition"
                  >
                    <option value="UPI" className="bg-[#071B35] text-[#F4F7FF]">UPI</option>
                    <option value="Cash" className="bg-[#071B35] text-[#F4F7FF]">Cash</option>
                    <option value="Card" className="bg-[#071B35] text-[#F4F7FF]">Card</option>
                    <option value="Net Banking" className="bg-[#071B35] text-[#F4F7FF]">Net Banking</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-[#9BAFCB] block mb-1">Notes / Description</label>
                <textarea
                  rows={2}
                  placeholder="Optional notes or receipt details..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#061830] border border-[#17365C] text-xs text-[#F4F7FF] placeholder-[#9BAFCB]/60 focus:outline-none focus:border-[#00D9FF] transition resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#17365C]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium rounded-xl bg-[#030E1F] border border-[#17365C] text-[#9BAFCB] hover:text-[#F4F7FF] transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-[#00D6B5] to-[#087BFF] text-[#020B1A] hover:opacity-95 shadow-md transition"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-sm rounded-2xl bg-[#071B35] border border-[#17365C] p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#17365C]">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#00D9FF]" />
                <h2 className="text-base font-bold text-[#F4F7FF]">Set Monthly Budget</h2>
              </div>
              <button
                onClick={() => setIsBudgetModalOpen(false)}
                className="p-1 rounded-lg text-[#9BAFCB] hover:text-[#F4F7FF] hover:bg-[#061830] transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBudget} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-medium text-[#9BAFCB] block mb-1">
                  Budget for {currentMonth} (₹)
                </label>
                <input
                  type="number"
                  min="500"
                  required
                  value={budgetLimitInput}
                  onChange={(e) => setBudgetLimitInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#061830] border border-[#17365C] text-xs font-mono text-[#F4F7FF] focus:outline-none focus:border-[#00D9FF] transition"
                />
                <p className="text-[11px] text-[#9BAFCB] mt-1.5">
                  Recommended student budget: ₹4,000 - ₹8,000 / month.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#17365C]">
                <button
                  type="button"
                  onClick={() => setIsBudgetModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium rounded-xl bg-[#030E1F] border border-[#17365C] text-[#9BAFCB] hover:text-[#F4F7FF] transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-[#00D9FF] to-[#087BFF] text-[#020B1A] hover:opacity-95 shadow-md transition"
                >
                  Save Budget Limit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
