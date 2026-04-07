import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  Trash2, 
  AlertTriangle,
  Bell,
  Calendar,
  ChevronLeft,
  ChevronRight,
  List,
  LayoutDashboard,
  X,
  CheckCircle2,
  Clock,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Pencil,
  Settings,
  LogOut,
  Moon,
  Sun,
  User,
  Lock,
  Wallet,
  BookOpen
} from 'lucide-react';

const apiKey = "";

// 1. Khởi tạo Supabase an toàn
const getEnv = (key) => {
  try {
    return import.meta.env[key] || '';
  } catch (e) {
    return '';
  }
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const supabaseKey = getEnv('VITE_SUPABASE_ANON_KEY');

const getSupabaseClient = () => {
  if (window.supabase && supabaseUrl && supabaseKey) {
    return window.supabase.createClient(supabaseUrl, supabaseKey);
  }
  return null;
};

// 2. Dữ liệu tĩnh
const categories = {
  income: ['Lương', 'Thưởng', 'Kinh doanh', 'Vay tiền', 'Thu nợ', 'Khác'],
  expense: ['Ăn uống', 'Di chuyển', 'Nhà cửa', 'Mua sắm', 'Giải trí', 'Học tập', 'Sức khỏe', 'Trả nợ']
};

const categoryColors = {
  'Ăn uống': '#f43f5e', 'Di chuyển': '#f59e0b', 'Nhà cửa': '#8b5cf6',
  'Mua sắm': '#ec4899', 'Giải trí': '#06b6d4', 'Học tập': '#10b981',
  'Sức khỏe': '#ef4444', 'Lương': '#10b981', 'Thưởng': '#3b82f6',
  'Kinh doanh': '#f59e0b', 'Vay tiền': '#14b8a6', 'Thu nợ': '#10b981', 
  'Trả nợ': '#0f172a', 'Khác': '#64748b'
};

const formatVND = (n) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

// 3. Component Biểu đồ (Áp dụng React.memo)
const SmallPieChart = React.memo(({ stats, isDark }) => {
  const data = Object.entries(stats.expenseByCategory);
  if (data.length === 0) return <div className="py-10 text-center text-slate-400 text-sm italic">Chưa có dữ liệu chi tiêu</div>;
  
  let cumulative = 0;
  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 200 200" className="w-48 h-48 -rotate-90 mb-4 drop-shadow-md">
        {data.map(([cat, val]) => {
          const p = val / stats.expense;
          if (p === 1) {
            return <circle key={cat} cx="100" cy="100" r="80" fill={categoryColors[cat] || '#64748b'} stroke={isDark ? '#1e293b' : '#ffffff'} strokeWidth="2" />;
          }

          const x1 = Math.cos(2 * Math.PI * cumulative);
          const y1 = Math.sin(2 * Math.PI * cumulative);
          cumulative += p;
          const x2 = Math.cos(2 * Math.PI * cumulative);
          const y2 = Math.sin(2 * Math.PI * cumulative);
          return <path key={cat} d={`M ${100 + x1*80} ${100 + y1*80} A 80 80 0 ${p > 0.5 ? 1 : 0} 1 ${100 + x2*80} ${100 + y2*80} L 100 100`} fill={categoryColors[cat] || '#64748b'} stroke={isDark ? '#1e293b' : '#ffffff'} strokeWidth="2" />;
        })}
        <circle cx="100" cy="100" r="50" fill={isDark ? '#1e293b' : 'white'} />
      </svg>
      <div className="grid grid-cols-2 gap-x-6 gap-y-2 w-full">
        {data.map(([cat, val]) => (
          <div key={cat} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 truncate">
              <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: categoryColors[cat] || '#64748b' }}></div>
              <span className={`truncate ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{cat}</span>
            </div>
            <span className="font-bold">{Math.round((val/stats.expense)*100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
});

// --- COMPONENT MODAL NHẬP KHOẢN NỢ ---
const DebtEntryModal = React.memo(({ isOpen, onClose, onSave, isDark }) => {
  const [form, setForm] = useState({
    person: '',
    amount: '',
    type: 'borrowed', // 'borrowed' (mình nợ) or 'lent' (nợ mình)
    date: new Date().toISOString().split('T')[0],
    note: ''
  });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.person || !form.amount) return;
    onSave({ ...form, amount: Number(form.amount) });
    setForm({ person: '', amount: '', type: 'borrowed', date: new Date().toISOString().split('T')[0], note: '' });
  };

  return (
    <div className="absolute inset-0 z-50 flex items-end animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className={`relative w-full max-h-[90%] overflow-y-auto hide-scrollbar rounded-t-[3rem] p-8 pb-12 animate-in slide-in-from-bottom-full duration-500 ${isDark ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-900'}`}>
        <div className={`w-12 h-1.5 rounded-full mx-auto mb-8 shrink-0 ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}></div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-black italic tracking-tighter uppercase">THÊM KHOẢN NỢ</h2>
          <button type="button" onClick={onClose} className={`p-2 rounded-full ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'}`}><X size={20}/></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className={`grid grid-cols-2 gap-3 p-1.5 rounded-2xl ${isDark ? 'bg-slate-950' : 'bg-slate-100'}`}>
            <button
              type="button"
              onClick={() => setForm({...form, type: 'borrowed'})}
              className={`py-3 rounded-xl text-xs font-black transition-all uppercase tracking-widest ${form.type === 'borrowed' ? (isDark ? 'bg-slate-800 text-rose-400 shadow-sm' : 'bg-white text-rose-600 shadow-sm') : (isDark ? 'text-slate-600' : 'text-slate-400')}`}
            >
              Mình đi vay
            </button>
            <button
              type="button"
              onClick={() => setForm({...form, type: 'lent'})}
              className={`py-3 rounded-xl text-xs font-black transition-all uppercase tracking-widest ${form.type === 'lent' ? (isDark ? 'bg-slate-800 text-emerald-400 shadow-sm' : 'bg-white text-emerald-600 shadow-sm') : (isDark ? 'text-slate-600' : 'text-slate-400')}`}
            >
              Cho người vay
            </button>
          </div>

          <div className="space-y-4">
            <input
              type="text"
              required
              placeholder="Tên người nợ / chủ nợ..."
              className={`w-full px-6 py-4 rounded-2xl border-none focus:ring-2 focus:ring-sky-500/20 outline-none font-bold transition-colors ${isDark ? 'bg-slate-950 text-slate-200 placeholder:text-slate-600' : 'bg-slate-50 text-slate-700'}`}
              value={form.person}
              onChange={(e) => setForm({...form, person: e.target.value})}
            />
            <input
              type="text"
              inputMode="numeric"
              required
              placeholder="Số tiền"
              className={`w-full px-6 py-4 rounded-2xl border-none focus:ring-2 focus:ring-sky-500/20 outline-none font-black text-2xl transition-colors ${isDark ? 'bg-slate-950 text-slate-100 placeholder:text-slate-600' : 'bg-slate-50 text-slate-900'}`}
              value={form.amount ? Number(form.amount).toLocaleString('vi-VN') : ''}
              onChange={(e) => setForm({...form, amount: e.target.value.replace(/\D/g, '')})}
            />
            <input
              type="date"
              className={`w-full px-4 py-4 rounded-2xl border-none focus:ring-2 focus:ring-sky-500/20 outline-none font-bold text-sm transition-colors ${isDark ? 'bg-slate-950 text-slate-300 [color-scheme:dark]' : 'bg-slate-50 text-slate-700'}`}
              value={form.date}
              onChange={(e) => setForm({...form, date: e.target.value})}
            />
          </div>

          <button
            type="submit"
            className={`w-full text-white py-5 rounded-2xl font-black text-lg transition-all shadow-xl uppercase tracking-widest active:scale-95 ${isDark ? 'bg-sky-600 hover:bg-sky-700 shadow-sky-500/20' : 'bg-slate-900 hover:bg-slate-800 shadow-slate-200'}`}
          >
            Lưu Sổ Nợ
          </button>
        </form>
      </div>
    </div>
  );
});

// --- COMPONENT MODAL NHẬP LIỆU GIAO DỊCH/KẾ HOẠCH ---
const DataEntryModal = React.memo(({ isOpen, onClose, onSave, mode, initialData, prefillDebt, prefillDate, processedDebts, isDark }) => {
  const [localForm, setLocalForm] = useState({
    title: '',
    amount: '',
    type: 'expense',
    category: 'Ăn uống',
    date: new Date().toISOString().split('T')[0],
    debtId: ''
  });

  useEffect(() => {
    if (initialData) {
      setLocalForm({ ...initialData, debtId: initialData.debtId || '' });
    } else if (prefillDebt) {
      setLocalForm({
        title: prefillDebt.title,
        amount: String(prefillDebt.amount),
        type: prefillDebt.type,
        category: prefillDebt.category,
        date: new Date().toISOString().split('T')[0],
        debtId: prefillDebt.debtId
      });
    } else {
      setLocalForm({
        title: '',
        amount: '',
        type: mode === 'plan' ? 'expense' : 'expense',
        category: 'Ăn uống',
        date: prefillDate || new Date().toISOString().split('T')[0],
        debtId: ''
      });
    }
  }, [initialData, mode, isOpen, prefillDebt, prefillDate]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!localForm.title || !localForm.amount) return;
    onSave({ ...localForm, amount: Number(localForm.amount) });
  };

  const relevantDebts = localForm.category === 'Trả nợ' 
    ? processedDebts?.filter(d => d.type === 'borrowed' && d.remainingAmount > 0)
    : localForm.category === 'Thu nợ' 
    ? processedDebts?.filter(d => d.type === 'lent' && d.remainingAmount > 0)
    : [];

  return (
    <div className="absolute inset-0 z-50 flex items-end animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className={`relative w-full max-h-[90%] overflow-y-auto hide-scrollbar rounded-t-[3rem] p-8 pb-12 animate-in slide-in-from-bottom-full duration-500 ${isDark ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-900'}`}>
        <div className={`w-12 h-1.5 rounded-full mx-auto mb-8 shrink-0 ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}></div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl sm:text-2xl font-black italic tracking-tighter uppercase">
            {initialData ? 'CẬP NHẬT' : (mode === 'transaction' ? 'GHI CHÉP MỚI' : 'LÊN LỊCH MỚI')}
          </h2>
          <button type="button" onClick={onClose} className={`p-2 rounded-full ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'}`}><X size={20}/></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className={`grid grid-cols-2 gap-3 p-1.5 rounded-2xl ${isDark ? 'bg-slate-950' : 'bg-slate-100'}`}>
            <button
              type="button"
              onClick={() => setLocalForm({...localForm, type: 'expense', category: 'Ăn uống', debtId: ''})}
              className={`py-3 rounded-xl text-xs font-black transition-all uppercase tracking-widest ${localForm.type === 'expense' ? (isDark ? 'bg-slate-800 text-rose-400 shadow-sm' : 'bg-white text-rose-600 shadow-sm') : (isDark ? 'text-slate-600' : 'text-slate-400')}`}
            >
              Chi tiêu
            </button>
            <button
              type="button"
              onClick={() => setLocalForm({...localForm, type: 'income', category: 'Lương', debtId: ''})}
              className={`py-3 rounded-xl text-xs font-black transition-all uppercase tracking-widest ${localForm.type === 'income' ? (isDark ? 'bg-slate-800 text-emerald-400 shadow-sm' : 'bg-white text-emerald-600 shadow-sm') : (isDark ? 'text-slate-600' : 'text-slate-400')}`}
            >
              Thu nhập
            </button>
          </div>

          <div className="space-y-4">
            <input
              type="text"
              required
              placeholder={mode === 'transaction' ? "Nội dung giao dịch..." : "Nội dung kế hoạch..."}
              className={`w-full px-6 py-4 rounded-2xl border-none focus:ring-2 focus:ring-sky-500/20 outline-none font-bold transition-colors ${isDark ? 'bg-slate-950 text-slate-200 placeholder:text-slate-600' : 'bg-slate-50 text-slate-700'}`}
              value={localForm.title}
              onChange={(e) => setLocalForm({...localForm, title: e.target.value})}
            />
            <input
              type="text"
              inputMode="numeric"
              required
              placeholder="0 VND"
              className={`w-full px-6 py-4 rounded-2xl border-none focus:ring-2 focus:ring-sky-500/20 outline-none font-black text-2xl transition-colors ${isDark ? 'bg-slate-950 text-slate-100 placeholder:text-slate-600' : 'bg-slate-50 text-slate-900'}`}
              value={localForm.amount ? Number(localForm.amount).toLocaleString('vi-VN') : ''}
              onChange={(e) => {
                const rawValue = e.target.value.replace(/\D/g, '');
                setLocalForm({...localForm, amount: rawValue});
              }}
            />
            <div className="grid grid-cols-2 gap-4">
              <select
                className={`w-full px-4 py-4 rounded-2xl border-none focus:ring-2 focus:ring-sky-500/20 outline-none font-bold text-sm appearance-none transition-colors ${isDark ? 'bg-slate-950 text-slate-300' : 'bg-slate-50 text-slate-700'}`}
                value={localForm.category}
                onChange={(e) => setLocalForm({...localForm, category: e.target.value, debtId: ''})}
              >
                {categories[localForm.type].map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
              <input
                type="date"
                className={`w-full px-4 py-4 rounded-2xl border-none focus:ring-2 focus:ring-sky-500/20 outline-none font-bold text-sm transition-colors ${isDark ? 'bg-slate-950 text-slate-300 [color-scheme:dark]' : 'bg-slate-50 text-slate-700'}`}
                value={localForm.date}
                onChange={(e) => setLocalForm({...localForm, date: e.target.value})}
              />
            </div>

            {/* Liên kết nợ */}
            {relevantDebts && relevantDebts.length > 0 && (
              <select
                className={`w-full px-4 py-4 rounded-2xl border-2 border-dashed outline-none font-bold text-sm appearance-none transition-colors ${isDark ? 'bg-slate-950 border-slate-700 text-sky-400' : 'bg-slate-50 border-sky-200 text-sky-600'}`}
                value={localForm.debtId || ''}
                onChange={(e) => setLocalForm({...localForm, debtId: e.target.value})}
              >
                <option value="">-- Liên kết với khoản nợ --</option>
                {relevantDebts.map(d => (
                  <option key={d.id} value={d.id}>{d.person} (Còn: {formatVND(d.remainingAmount)})</option>
                ))}
              </select>
            )}
          </div>

          <button
            type="submit"
            className={`w-full text-white py-5 rounded-2xl font-black text-lg transition-all shadow-xl uppercase tracking-widest active:scale-95 ${isDark ? 'bg-sky-600 hover:bg-sky-700 shadow-sky-500/20' : 'bg-slate-900 hover:bg-slate-800 shadow-slate-200'}`}
          >
            Lưu Lại
          </button>
        </form>
      </div>
    </div>
  );
});

// --- COMPONENT CHÍNH ---
const App = () => {
  const [supabase, setSupabase] = useState(null);
  
  // --- STATE ĐĂNG NHẬP ---
  const [isLoggedIn, setIsLoggedIn] = useState(localStorage.getItem('isLoggedIn') === 'true');
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');

  // --- STATE CÀI ĐẶT ---
  const [appSettings, setAppSettings] = useState(() => {
    const saved = localStorage.getItem('money_manager_settings');
    return saved ? JSON.parse(saved) : { theme: 'light', dailyLimit: '', monthlyLimit: '' };
  });

  const [transactions, setTransactions] = useState([]);
  const [plans, setPlans] = useState([]);
  const [debts, setDebts] = useState([]);

  const [activeTab, setActiveTab] = useState('dashboard'); 
  const [showAddModal, setShowAddModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showWarningsModal, setShowWarningsModal] = useState(false);
  const [showDebtModal, setShowDebtModal] = useState(false);

  const [modalMode, setModalMode] = useState('transaction'); 
  const [currentViewDate, setCurrentViewDate] = useState(new Date());

  const handlePrevMonth = () => {
    const prev = new Date(currentViewDate);
    prev.setMonth(prev.getMonth() - 1);
    setCurrentViewDate(prev);
  };

  const handleNextMonth = () => {
    const next = new Date(currentViewDate);
    next.setMonth(next.getMonth() + 1);
    setCurrentViewDate(next);
  };

  const [editingId, setEditingId] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [prefillDebt, setPrefillDebt] = useState(null);
  const [selectedPlanDate, setSelectedPlanDate] = useState(null); // Trạng thái cho tab Lịch

  const isDark = appSettings.theme === 'dark';

  // --- LOGIC ĐĂNG NHẬP & CÀI ĐẶT ---
  const handleLogin = (e) => {
    e.preventDefault();
    if (loginForm.username === 'admin' && loginForm.password === 'admin') {
      setIsLoggedIn(true);
      localStorage.setItem('isLoggedIn', 'true');
      setLoginError('');
    } else {
      setLoginError('Tài khoản hoặc mật khẩu không chính xác!');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('isLoggedIn');
    setLoginForm({ username: '', password: '' });
    setActiveTab('dashboard');
  };

  useEffect(() => {
    localStorage.setItem('money_manager_settings', JSON.stringify(appSettings));
  }, [appSettings]);

  // Load Supabase
  useEffect(() => {
    if (!isLoggedIn) return;
    const loadSupabaseScript = async () => {
      if (!window.supabase) {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
        script.async = true;
        document.body.appendChild(script);
        script.onload = () => setSupabase(getSupabaseClient());
      } else {
        setSupabase(getSupabaseClient());
      }
    };
    loadSupabaseScript();
  }, [isLoggedIn]);

  useEffect(() => {
    if (!isLoggedIn) return;
    if (supabase || (!supabaseUrl && !supabaseKey)) {
      fetchTransactions();
      fetchPlans();
      fetchDebts();
    }
  }, [supabase, isLoggedIn]);

  useEffect(() => {
    if (!supabase && transactions.length > 0) {
      localStorage.setItem('money_manager_data_fallback_v2', JSON.stringify(transactions));
    }
  }, [transactions, supabase]);

  useEffect(() => {
    if (!supabase && plans.length > 0) {
      localStorage.setItem('money_manager_plans_fallback_v2', JSON.stringify(plans));
    }
  }, [plans, supabase]);

  useEffect(() => {
    if (!supabase && debts.length > 0) {
      localStorage.setItem('money_manager_debts_fallback_v2', JSON.stringify(debts));
    }
  }, [debts, supabase]);

  const fetchTransactions = async () => {
    if (!supabase) {
      const saved = localStorage.getItem('money_manager_data_fallback_v2');
      if (saved) setTransactions(JSON.parse(saved));
      return;
    }
    const { data, error } = await supabase.from('transactions').select('*').order('date', { ascending: false });
    if (!error && data) setTransactions(data);
  };

  const fetchPlans = async () => {
    if (!supabase) {
      const saved = localStorage.getItem('money_manager_plans_fallback_v2');
      if (saved) setPlans(JSON.parse(saved));
      return;
    }
    const { data, error } = await supabase.from('plans').select('*').order('date', { ascending: true });
    if (!error && data) setPlans(data);
  };

  const fetchDebts = async () => {
    if (!supabase) {
      const saved = localStorage.getItem('money_manager_debts_fallback_v2');
      if (saved) setDebts(JSON.parse(saved));
      return;
    }
    const { data, error } = await supabase.from('debts').select('*').order('date', { ascending: false });
    if (!error && data) setDebts(data);
  };

  const handleOpenAddModal = (mode) => {
    setModalMode(mode);
    setEditingId(null);
    setEditingItem(null);
    setPrefillDebt(null);
    setShowAddModal(true);
  };

  const openEditModal = (item, type) => {
    setModalMode(type);
    setEditingId(item.id);
    setEditingItem(item);
    setPrefillDebt(null);
    setShowAddModal(true);
  };

  // Tính toán Sổ Nợ
  const processedDebts = useMemo(() => {
    return debts.map(d => {
      const paid = transactions
        .filter(t => t.debtId === d.id)
        .reduce((sum, t) => sum + Number(t.amount), 0);
      return { 
        ...d, 
        paidAmount: paid, 
        remainingAmount: Math.max(0, Number(d.amount) - paid) 
      };
    });
  }, [debts, transactions]);

  const totalBorrowedRemaining = useMemo(() => 
    processedDebts.filter(d => d.type === 'borrowed').reduce((s, d) => s + d.remainingAmount, 0)
  , [processedDebts]);

  const totalLentRemaining = useMemo(() => 
    processedDebts.filter(d => d.type === 'lent').reduce((s, d) => s + d.remainingAmount, 0)
  , [processedDebts]);

  // Các hàm tính toán thống kê (Tổng quan)
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const tDate = new Date(t.date);
      return tDate.getMonth() === currentViewDate.getMonth() && tDate.getFullYear() === currentViewDate.getFullYear();
    });
  }, [transactions, currentViewDate]);

  const stats = useMemo(() => {
    const income = filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0);
    const expense = filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0);
    const expenseByCategory = filteredTransactions.filter(t => t.type === 'expense').reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + Number(t.amount);
      return acc;
    }, {});
    return { income, expense, balance: income - expense, expenseByCategory };
  }, [filteredTransactions]);

  const yearlyStats = useMemo(() => {
    const year = currentViewDate.getFullYear();
    const monthlyData = Array.from({ length: 12 }, (_, i) => ({ month: i + 1, income: 0, expense: 0 }));

    transactions.forEach(t => {
      const d = new Date(t.date);
      if (d.getFullYear() === year) {
        const m = d.getMonth();
        if (t.type === 'income') monthlyData[m].income += Number(t.amount);
        else monthlyData[m].expense += Number(t.amount);
      }
    });

    const maxVal = Math.max(...monthlyData.map(d => Math.max(d.income, d.expense)), 1);
    return { monthlyData, maxVal };
  }, [transactions, currentViewDate]);

  const warnings = useMemo(() => {
    const alerts = [];
    const mLimit = Number(appSettings.monthlyLimit);
    const dLimit = Number(appSettings.dailyLimit);

    if (mLimit > 0 && stats.expense > mLimit) {
      alerts.push(`Tháng này bạn đã tiêu ${formatVND(stats.expense)}, VƯỢT GIỚI HẠN tháng (${formatVND(mLimit)})!`);
    } else if (mLimit > 0 && stats.expense > mLimit * 0.8) {
      alerts.push(`Chú ý: Bạn đã tiêu mức ${(stats.expense/mLimit*100).toFixed(0)}% hạn mức tháng này.`);
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const dailyExpense = transactions
      .filter(t => t.type === 'expense' && t.date === todayStr)
      .reduce((sum, t) => sum + Number(t.amount), 0);

    if (dLimit > 0 && dailyExpense > dLimit) {
      alerts.push(`Hôm nay bạn đã tiêu ${formatVND(dailyExpense)}, VƯỢT GIỚI HẠN ngày (${formatVND(dLimit)})!`);
    }

    if (stats.balance < 1000000 && stats.balance > 0) alerts.push(`Số dư đang ở mức thấp.`);
    if (stats.balance < 0) alerts.push(`Bạn đang chi vượt thu!`);
    
    const upcomingPlans = plans.filter(p => {
      const pDate = new Date(p.date);
      const today = new Date();
      return pDate >= today && (pDate - today) / (1000 * 60 * 60 * 24) <= 3 && !p.completed;
    });
    if (upcomingPlans.length > 0) {
      alerts.push(`Bạn có ${upcomingPlans.length} kế hoạch tài chính trong 3 ngày tới.`);
    }
    return alerts;
  }, [stats, plans, appSettings, transactions]);

  // --- CRUD GIAO DỊCH & KẾ HOẠCH ---
  const handleSaveData = async (newData) => {
    setShowAddModal(false);
    const targetId = editingId;
    setEditingId(null);
    setEditingItem(null);
    setPrefillDebt(null);

    // Chuẩn hoá dữ liệu để tránh lỗi Database type
    const dataToSave = { ...newData };
    if (!dataToSave.debtId) {
      dataToSave.debtId = null;
    }
    
    // Bảng plans không có cột debtId, nên phải loại bỏ trường này nếu đang ở chế độ Lên lịch
    if (modalMode === 'plan') {
      delete dataToSave.debtId;
    }

    if (targetId) {
      if (modalMode === 'transaction') {
        const original = transactions.find(t => t.id === targetId);
        setTransactions(prev => prev.map(t => t.id === targetId ? { ...t, ...dataToSave } : t));
        if (supabase) {
          supabase.from('transactions').update(dataToSave).eq('id', targetId).then(({ error }) => {
            if (error) setTransactions(prev => prev.map(t => t.id === targetId ? original : t));
          });
        }
      } else {
        const original = plans.find(p => p.id === targetId);
        setPlans(prev => prev.map(p => p.id === targetId ? { ...p, ...dataToSave } : p));
        if (supabase) {
          supabase.from('plans').update(dataToSave).eq('id', targetId).then(({ error }) => {
            if (error) setPlans(prev => prev.map(p => p.id === targetId ? original : p));
          });
        }
      }
    } else {
      const tempId = Date.now();
      if (modalMode === 'transaction') {
        setTransactions(prev => [{ id: tempId, ...dataToSave }, ...prev]);
        if (supabase) {
          supabase.from('transactions').insert([dataToSave]).select().then(({ data, error }) => {
            if (!error && data) setTransactions(prev => prev.map(t => t.id === tempId ? data[0] : t));
            else setTransactions(prev => prev.filter(t => t.id !== tempId));
          });
        }
      } else {
        const planData = { ...dataToSave, completed: false };
        setPlans(prev => [{ id: tempId, ...planData }, ...prev]);
        if (supabase) {
          supabase.from('plans').insert([planData]).select().then(({ data, error }) => {
            if (!error && data) setPlans(prev => prev.map(p => p.id === tempId ? data[0] : p));
            else setPlans(prev => prev.filter(p => p.id !== tempId));
          });
        }
      }
    }
  };

  const handleDeleteTransaction = (id) => {
    const backup = [...transactions];
    setTransactions(prev => prev.filter(x => x.id !== id));
    if (supabase) {
      supabase.from('transactions').delete().eq('id', id).then(({ error }) => {
        if (error) setTransactions(backup);
      });
    }
  };

  const handleDeletePlan = (id) => {
    const backup = [...plans];
    setPlans(prev => prev.filter(x => x.id !== id));
    if (supabase) {
      supabase.from('plans').delete().eq('id', id).then(({ error }) => {
        if (error) setPlans(backup);
      });
    }
  };

  const completePlan = (plan) => {
    const tempId = Date.now();
    const newTransaction = {
      title: plan.title,
      amount: plan.amount,
      type: plan.type,
      category: plan.category,
      date: new Date().toISOString().split('T')[0],
      debtId: null
    };
    const backupPlans = [...plans];
    setPlans(prev => prev.filter(p => p.id !== plan.id));
    setTransactions(prev => [{ id: tempId, ...newTransaction }, ...prev]);
    if (supabase) {
      supabase.from('transactions').insert([newTransaction]).select().then(({ data, error }) => {
        if (!error && data) {
          setTransactions(prev => prev.map(t => t.id === tempId ? data[0] : t));
          supabase.from('plans').delete().eq('id', plan.id).then();
        } else {
          setTransactions(prev => prev.filter(t => t.id !== tempId));
          setPlans(backupPlans);
        }
      });
    }
  };

  // --- CRUD SỔ NỢ ---
  const handleSaveDebt = async (newData) => {
    setShowDebtModal(false);
    const tempId = Date.now();
    setDebts(prev => [{ id: tempId, ...newData }, ...prev]);
    if (supabase) {
      supabase.from('debts').insert([newData]).select().then(({ data, error }) => {
        if (!error && data) setDebts(prev => prev.map(d => d.id === tempId ? data[0] : d));
        else setDebts(prev => prev.filter(d => d.id !== tempId));
      });
    }
  };

  const handleDeleteDebt = async (id) => {
    const backup = [...debts];
    setDebts(prev => prev.filter(x => x.id !== id));
    if (supabase) {
      supabase.from('debts').delete().eq('id', id).then(({ error }) => {
        if (error) setDebts(backup);
      });
    }
  };

  // --- LOGIC HIGHLIGHT KHUNG THU CHI ---
  const todayString = new Date().toISOString().split('T')[0];
  const todayExpense = transactions
    .filter(t => t.type === 'expense' && t.date === todayString)
    .reduce((sum, t) => sum + Number(t.amount), 0);
  
  const isExpenseWarning = 
    (Number(appSettings.monthlyLimit) > 0 && stats.expense > Number(appSettings.monthlyLimit)) ||
    (Number(appSettings.dailyLimit) > 0 && todayExpense > Number(appSettings.dailyLimit)) ||
    (stats.balance < 0);
    
  const isIncomeHighlight = stats.income > stats.expense && stats.income > 0;

  // --- RENDER SCREEN ĐĂNG NHẬP ---
  if (!isLoggedIn) {
    return (
      <div className={`min-h-screen flex items-center justify-center sm:p-4 transition-colors duration-500 ${isDark ? 'bg-slate-900' : 'bg-slate-200'}`}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@900&display=swap'); .font-logo { font-family: 'Orbitron', sans-serif; }`}</style>
        <div className={`w-full sm:w-[390px] h-[100dvh] sm:h-[844px] sm:rounded-[3rem] sm:shadow-2xl relative overflow-hidden flex flex-col items-center justify-center p-8 border-none sm:border-[8px] sm:border-slate-900 transition-colors ${isDark ? 'bg-slate-950' : 'bg-[#F8F9FE]'}`}>
          <div className="w-20 h-20 bg-sky-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
            <Wallet size={32} className="text-sky-600" />
          </div>
          <h1 className="text-4xl font-logo tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-600 drop-shadow-[0_0_15px_rgba(56,189,248,0.4)] mb-2">FINANCE</h1>
          <p className="text-slate-500 text-sm mb-10 font-medium">Quản lý chi tiêu cá nhân</p>
          
          <form onSubmit={handleLogin} className="w-full space-y-4">
            {loginError && <div className="p-3 bg-rose-50 text-rose-600 text-xs font-bold rounded-xl text-center border border-rose-100">{loginError}</div>}
            
            <div className="space-y-3">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User size={18} className="text-slate-400" />
                </div>
                <input
                  type="text"
                  placeholder="Tên đăng nhập"
                  className={`w-full pl-12 pr-4 py-4 rounded-2xl border-none focus:ring-2 focus:ring-sky-500/20 outline-none font-medium placeholder:font-normal transition-all ${isDark ? 'bg-slate-900 text-slate-200 placeholder:text-slate-600' : 'bg-white text-slate-700'}`}
                  value={loginForm.username}
                  onChange={e => setLoginForm({...loginForm, username: e.target.value})}
                />
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock size={18} className="text-slate-400" />
                </div>
                <input
                  type="password"
                  placeholder="Mật khẩu"
                  className={`w-full pl-12 pr-4 py-4 rounded-2xl border-none focus:ring-2 focus:ring-sky-500/20 outline-none font-medium placeholder:font-normal transition-all ${isDark ? 'bg-slate-900 text-slate-200 placeholder:text-slate-600' : 'bg-white text-slate-700'}`}
                  value={loginForm.password}
                  onChange={e => setLoginForm({...loginForm, password: e.target.value})}
                />
              </div>
            </div>
            
            <button type="submit" className={`w-full text-white py-4 rounded-2xl font-black uppercase tracking-widest mt-4 shadow-xl active:scale-95 transition-all ${isDark ? 'bg-sky-600 hover:bg-sky-700 shadow-sky-900/20' : 'bg-slate-900 hover:bg-slate-800 shadow-slate-300'}`}>
              Đăng Nhập
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- RENDER APP CHÍNH ---
  return (
    <div className={`min-h-screen flex items-center justify-center sm:p-4 transition-colors duration-500 ${isDark ? 'bg-slate-900' : 'bg-slate-200'}`}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@900&display=swap'); .hide-scrollbar::-webkit-scrollbar { display: none; } .font-logo { font-family: 'Orbitron', sans-serif; }`}</style>
      <div className={`w-full sm:w-[390px] h-[100dvh] sm:h-[844px] sm:rounded-[3rem] sm:shadow-2xl relative overflow-hidden flex flex-col border-none sm:border-[8px] sm:border-slate-900 transition-colors ${isDark ? 'bg-slate-950' : 'bg-[#F8F9FE]'}`}>
        
        {/* Fake Dynamic Island */}
        <div className="hidden sm:block absolute top-3 left-1/2 -translate-x-1/2 w-32 h-7 bg-black rounded-full z-[100]"></div>
        
        <div className={`flex-1 overflow-y-auto hide-scrollbar select-none pb-32 transition-colors ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
          <header className={`pt-14 pb-5 px-5 rounded-b-[2rem] transition-colors ${isDark ? 'bg-slate-900 border-b border-slate-800' : 'bg-white border-b border-slate-100'}`}>
            <div className="flex items-center justify-between mb-5">
              <h1 className="text-3xl font-logo tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-600 drop-shadow-[0_0_12px_rgba(56,189,248,0.5)]">
                FINANCE
              </h1>
              <button 
                onClick={() => setShowStatsModal(true)}
                className={`p-2.5 rounded-full transition-colors ${isDark ? 'bg-sky-500/20 text-sky-400 hover:bg-sky-500/30' : 'bg-sky-50 text-sky-600 hover:bg-sky-100'}`}
              >
                <BarChart3 size={20}/>
              </button>
            </div>

            {/* Main Card */}
            <div className={`rounded-[1.5rem] p-5 shadow-2xl relative overflow-hidden transition-all duration-500 border-2 ${isDark ? 'bg-slate-900 text-white border-slate-700 shadow-sky-900/20' : 'bg-white text-slate-900 border-slate-200 shadow-slate-200/50'}`}>
              <div className={`absolute top-[-20%] right-[-10%] w-40 h-40 rounded-full blur-3xl transition-opacity ${isDark ? 'bg-sky-500/20' : 'bg-sky-500/10'}`}></div>
              
              <div className="flex items-center justify-between mb-5 relative z-10">
                <div className={`flex items-center rounded-xl p-1 border-2 transition-colors ${isDark ? 'bg-white/10 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                  <button onClick={handlePrevMonth} className="p-1.5 rounded-lg hover:bg-sky-500/20 transition-colors text-slate-400 hover:text-sky-500"><ChevronLeft size={16}/></button>
                  <div className="flex items-center gap-1.5 px-3 min-w-[120px] justify-center cursor-default">
                    <Calendar size={12} className={isDark ? 'text-sky-400' : 'text-sky-500'} />
                    <span className={`text-[11px] font-bold tracking-widest uppercase ${isDark ? 'text-white' : 'text-slate-700'}`}>Tháng {currentViewDate.getMonth() + 1}, {currentViewDate.getFullYear()}</span>
                  </div>
                  <button onClick={handleNextMonth} className="p-1.5 rounded-lg hover:bg-sky-500/20 transition-colors text-slate-400 hover:text-sky-500"><ChevronRight size={16}/></button>
                </div>
                <button onClick={() => setShowWarningsModal(true)} className={`p-2 rounded-xl border-2 transition-all ${isDark ? 'bg-white/10 border-white/10 text-sky-400' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                  <div className="relative">
                    <Bell size={18} />
                    {warnings.length > 0 && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full animate-pulse"></span>}
                  </div>
                </button>
              </div>

              <div className="relative z-10">
                <p className={`text-xs font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Tổng số dư</p>
                <h2 className={`text-3xl font-black mb-5 ${isDark ? 'text-white' : 'text-slate-900'}`}>{formatVND(stats.balance)}</h2>
              </div>
              
              <div className="flex gap-3 relative z-10">
                <div className={`flex-1 rounded-xl p-3 border-2 transition-all duration-500 ${isIncomeHighlight ? (isDark ? 'bg-sky-500/20 border-sky-400/60 shadow-[0_0_20px_rgba(56,189,248,0.3)]' : 'bg-sky-50 border-sky-200 shadow-sky-200/50') : (isDark ? 'bg-white/10 border-white/5' : 'bg-slate-50 border-slate-200')}`}>
                  <div className={`flex items-center gap-1.5 text-[10px] font-bold uppercase mb-1 ${isDark ? 'text-sky-400' : 'text-sky-600'}`}><TrendingUp size={12}/> Thu nhập</div>
                  <p className="font-bold text-sm">{formatVND(stats.income).replace('₫','')}</p>
                </div>
                <div className={`flex-1 rounded-xl p-3 border-2 transition-all duration-500 ${isExpenseWarning ? (isDark ? 'bg-slate-800 border-slate-600 shadow-[0_0_20px_rgba(0,0,0,0.5)]' : 'bg-slate-100 border-slate-400') : (isDark ? 'bg-white/10 border-white/5' : 'bg-slate-50 border-slate-200')}`}>
                  <div className={`flex items-center gap-1.5 text-[10px] font-bold uppercase mb-1 ${isDark ? 'text-slate-300' : 'text-slate-500'}`}><TrendingDown size={12}/> Chi tiêu</div>
                  <p className="font-bold text-sm">{formatVND(stats.expense).replace('₫','')}</p>
                </div>
              </div>
            </div>
          </header>

          {/* Content Area */}
          <main className="px-5 pt-5 animate-in fade-in duration-500">

            {activeTab === 'dashboard' && (
              <div className="space-y-4 pb-4">
                <section className={`p-5 rounded-[1.5rem] border-2 shadow-xl transition-all ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-50 shadow-slate-200/30'}`}>
                  <h3 className={`text-sm font-black mb-4 uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>Phân bổ chi tiêu</h3>
                  <SmallPieChart stats={stats} isDark={isDark} />
                </section>
                
                {/* SECTION: SỔ NỢ THU GỌN */}
                <section className={`p-5 rounded-[1.5rem] border-2 shadow-xl transition-all ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-50 shadow-slate-200/30'}`}>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-black uppercase text-slate-400 tracking-widest">Sổ Nợ</h3>
                    <button onClick={() => setActiveTab('debts')} className="text-[10px] font-bold text-sky-600 bg-sky-50 px-3 py-1.5 rounded-full hover:bg-sky-100 transition-colors">Xem chi tiết</button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className={`p-3 rounded-xl border-2 ${isDark ? 'bg-rose-500/10 border-rose-500/20' : 'bg-rose-50 border-rose-100'}`}>
                      <p className="text-[10px] font-bold text-rose-500 uppercase mb-1">Đang nợ</p>
                      <p className={`font-black ${isDark ? 'text-rose-400' : 'text-rose-600'}`}>{formatVND(totalBorrowedRemaining).replace('₫','')}</p>
                    </div>
                    <div className={`p-3 rounded-xl border-2 ${isDark ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-50 border-emerald-100'}`}>
                      <p className="text-[10px] font-bold text-emerald-500 uppercase mb-1">Cho vay</p>
                      <p className={`font-black ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>{formatVND(totalLentRemaining).replace('₫','')}</p>
                    </div>
                  </div>
                </section>
              </div>
            )}

            {/* TAB: SỔ NỢ (DEBTS) */}
            {activeTab === 'debts' && (
              <div className="space-y-6 pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button onClick={() => setActiveTab('dashboard')} className={`p-2 rounded-full ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600'}`}><ChevronLeft size={16}/></button>
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Quản lý sổ nợ</h3>
                  </div>
                  <button onClick={() => setShowDebtModal(true)} className={`flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full ${isDark ? 'bg-sky-500/20 text-sky-400' : 'text-sky-600 bg-sky-50'}`}>
                    <Plus size={14}/> Thêm nợ
                  </button>
                </div>

                {processedDebts.length === 0 ? (
                  <div className={`text-center py-20 rounded-[1.5rem] border-2 border-dashed ${isDark ? 'bg-slate-900 border-slate-800 text-slate-500' : 'bg-white border-slate-200 text-slate-400'}`}>
                    <BookOpen size={40} className="mx-auto mb-4 opacity-20"/>
                    <p className="text-sm font-medium">Chưa có khoản nợ nào được ghi chép</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {processedDebts.map(d => (
                      <div key={d.id} className={`p-5 rounded-2xl border-2 transition-all ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-50 shadow-sm'}`}>
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`p-2.5 rounded-xl ${d.type === 'borrowed' ? (isDark ? 'bg-rose-500/20 text-rose-400' : 'bg-rose-50 text-rose-500') : (isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-50 text-emerald-500')}`}>
                              {d.type === 'borrowed' ? <TrendingDown size={20}/> : <TrendingUp size={20}/>}
                            </div>
                            <div>
                              <p className={`font-bold text-sm ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{d.person}</p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">{d.type === 'borrowed' ? 'Mình đi vay' : 'Cho người vay'} • {d.date}</p>
                            </div>
                          </div>
                          <p className={`font-black text-sm ${d.type === 'borrowed' ? (isDark ? 'text-rose-400' : 'text-rose-500') : (isDark ? 'text-emerald-400' : 'text-emerald-500')}`}>{formatVND(d.amount)}</p>
                        </div>
                        
                        <div className="mt-4">
                          <div className={`flex justify-between text-[10px] font-bold mb-1.5 uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            <span>Đã trả: {formatVND(d.paidAmount)}</span>
                            <span>Còn: {formatVND(d.remainingAmount)}</span>
                          </div>
                          <div className={`w-full rounded-full h-1.5 overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                            <div 
                              className={`h-full rounded-full ${d.type === 'borrowed' ? 'bg-rose-400' : 'bg-emerald-400'}`} 
                              style={{ width: `${Math.min(100, (d.paidAmount / d.amount) * 100)}%` }}
                            ></div>
                          </div>
                        </div>

                        <div className={`flex gap-2 mt-4 pt-4 border-t ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                          <button 
                            onClick={() => {
                               setModalMode('transaction');
                               setPrefillDebt({ 
                                 type: d.type === 'borrowed' ? 'expense' : 'income', 
                                 category: d.type === 'borrowed' ? 'Trả nợ' : 'Thu nợ', 
                                 debtId: d.id, 
                                 amount: d.remainingAmount, 
                                 title: `Thanh toán nợ ${d.type === 'borrowed' ? 'cho' : 'của'} ${d.person}` 
                               });
                               setShowAddModal(true);
                            }}
                            disabled={d.remainingAmount <= 0}
                            className={`flex-1 text-white py-2.5 rounded-xl text-xs font-black transition-colors ${d.remainingAmount <= 0 ? 'bg-emerald-500' : (isDark ? 'bg-slate-800 hover:bg-slate-700' : 'bg-slate-900 hover:bg-slate-800')}`}
                          >
                            {d.remainingAmount <= 0 ? 'Đã hoàn tất 🎉' : (d.type === 'borrowed' ? 'Trả nợ ngay' : 'Thu nợ ngay')}
                          </button>
                          <button onClick={() => handleDeleteDebt(d.id)} className={`w-10 h-10 shrink-0 flex items-center justify-center rounded-xl transition-colors ${isDark ? 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/40' : 'bg-rose-50 text-rose-500 hover:bg-rose-100'}`}><Trash2 size={16}/></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'history' && (
              <div className="space-y-4 pb-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Lịch sử giao dịch</h3>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-700'}`}>{filteredTransactions.length} mục</span>
                </div>
                {filteredTransactions.map(t => (
                  <div key={t.id} className={`p-4 rounded-2xl flex items-center shadow-sm group active:scale-95 transition-all border-2 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-50'}`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mr-4 shrink-0 ${t.type === 'income' ? (isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-50 text-emerald-600') : (isDark ? 'bg-rose-500/20 text-rose-400' : 'bg-rose-50 text-rose-600')}`}>
                      {t.type === 'income' ? <TrendingUp size={20}/> : <TrendingDown size={20}/>}
                    </div>
                    <div className="flex-1 min-w-0 pr-2">
                      <p className={`font-bold truncate text-sm ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{t.title}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">{t.category}</p>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1">
                      <p className={`font-black text-sm ${t.type === 'income' ? (isDark ? 'text-emerald-400' : 'text-emerald-600') : (isDark ? 'text-rose-400' : 'text-rose-600')}`}>
                        {t.type === 'income' ? '+' : '-'}{formatVND(t.amount).replace('₫','')}
                      </p>
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleDeleteTransaction(t.id)} className={`p-1.5 rounded-lg transition-colors ${isDark ? 'text-slate-500 hover:text-rose-400 hover:bg-rose-500/20' : 'text-slate-300 hover:text-rose-500 hover:bg-rose-50'}`}>
                          <Trash2 size={16}/>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TAB LÊN LỊCH VỚI GIAO DIỆN CALENDAR */}
            {activeTab === 'planning' && (() => {
              const year = currentViewDate.getFullYear();
              const month = currentViewDate.getMonth();
              const daysInMonth = new Date(year, month + 1, 0).getDate();
              const firstDay = new Date(year, month, 1).getDay();
              const startingBlankDays = firstDay === 0 ? 6 : firstDay - 1; // 0 = Thứ 2, 6 = Chủ Nhật

              const monthlyPlans = plans.filter(p => {
                const d = new Date(p.date);
                return d.getMonth() === month && d.getFullYear() === year;
              });

              const displayedPlans = selectedPlanDate 
                ? monthlyPlans.filter(p => p.date === selectedPlanDate)
                : monthlyPlans;

              return (
                <div className="space-y-6 pb-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Kế hoạch tài chính</h3>
                    <button 
                      onClick={() => { 
                        setModalMode('plan'); 
                        setShowAddModal(true); 
                      }}
                      className={`flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full shrink-0 transition-colors ${isDark ? 'bg-sky-500/20 text-sky-400' : 'bg-sky-50 text-sky-600'}`}
                    >
                      <Plus size={14}/> Lên lịch
                    </button>
                  </div>

                  {/* Lịch (Calendar View) */}
                  <div className={`p-5 rounded-[1.5rem] border-2 shadow-sm transition-colors ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-50'}`}>
                    <div className="grid grid-cols-7 gap-1 text-center mb-3">
                      {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(d => (
                        <div key={d} className={`text-[10px] font-black ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{d}</div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      {Array.from({ length: startingBlankDays }).map((_, i) => (
                        <div key={`blank-${i}`} className="h-10"></div>
                      ))}
                      {Array.from({ length: daysInMonth }).map((_, i) => {
                        const day = i + 1;
                        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        const dayPlans = monthlyPlans.filter(p => p.date === dateStr);
                        const hasIncome = dayPlans.some(p => p.type === 'income');
                        const hasExpense = dayPlans.some(p => p.type === 'expense');
                        const isToday = dateStr === new Date().toISOString().split('T')[0];
                        const isSelected = selectedPlanDate === dateStr;

                        let baseClass = isDark ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-50 text-slate-700';
                        if (isSelected) {
                          baseClass = isDark ? 'bg-sky-600 text-white shadow-md' : 'bg-slate-900 text-white shadow-md';
                        } else if (isToday) {
                          baseClass = isDark ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' : 'bg-sky-50 text-sky-600 border border-sky-100';
                        } else if (hasIncome || hasExpense) {
                          baseClass = isDark ? 'bg-slate-800 border border-slate-700 text-white shadow-sm' : 'bg-slate-100 border border-slate-200 text-slate-900 shadow-sm';
                        }

                        return (
                          <div 
                            key={day} 
                            onClick={() => setSelectedPlanDate(isSelected ? null : dateStr)}
                            className={`h-10 flex flex-col items-center justify-center rounded-xl relative cursor-pointer transition-all ${baseClass}`}
                          >
                            <span className="text-sm font-bold">{day}</span>
                            <div className="flex gap-1 mt-0.5 absolute bottom-1">
                              {hasIncome && <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : (isDark ? 'bg-emerald-400' : 'bg-emerald-500')}`}></div>}
                              {hasExpense && <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : (isDark ? 'bg-rose-400' : 'bg-rose-500')}`}></div>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* Danh sách Kế hoạch */}
                  <div className="space-y-3">
                    {selectedPlanDate && (
                      <div className="flex justify-between items-center px-1 mb-2 mt-4">
                        <span className={`text-xs font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          Kế hoạch ngày {selectedPlanDate.split('-').reverse().join('/')}
                        </span>
                        <button onClick={() => setSelectedPlanDate(null)} className={`text-[10px] font-bold px-2 py-1 rounded-lg ${isDark ? 'text-sky-400 bg-sky-500/20' : 'text-sky-500 bg-sky-50'}`}>
                          Xem tất cả
                        </button>
                      </div>
                    )}

                    {displayedPlans.length === 0 ? (
                      <div className={`text-center py-10 rounded-[1.5rem] border-2 border-dashed ${isDark ? 'bg-slate-900 border-slate-800 text-slate-500' : 'bg-white border-slate-200 text-slate-400'}`}>
                        <Calendar size={32} className="mx-auto mb-3 opacity-20"/>
                        <p className="text-sm">{selectedPlanDate ? 'Không có kế hoạch cho ngày này' : 'Chưa có kế hoạch nào trong tháng'}</p>
                      </div>
                    ) : (
                      displayedPlans.map(p => (
                        <div key={p.id} className={`p-5 rounded-2xl border-2 transition-all ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-50 shadow-sm'}`}>
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-2 min-w-0 pr-2">
                              <div className={`p-2 rounded-lg shrink-0 ${p.type === 'income' ? (isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-50 text-emerald-600') : (isDark ? 'bg-rose-500/20 text-rose-400' : 'bg-rose-50 text-rose-600')}`}>
                                <Clock size={16}/>
                              </div>
                              <div className="min-w-0">
                                <p className={`font-bold text-sm truncate ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{p.title}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase truncate">{p.category} • {p.date.split('-').reverse().join('/')}</p>
                              </div>
                            </div>
                            <p className={`font-black text-sm shrink-0 ${p.type === 'income' ? (isDark ? 'text-emerald-400' : 'text-emerald-600') : (isDark ? 'text-rose-400' : 'text-rose-600')}`}>
                              {formatVND(p.amount).replace('₫','')}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => completePlan(p)}
                              className="flex-1 flex items-center justify-center gap-2 bg-slate-900 text-white py-2 rounded-xl text-xs font-bold active:scale-95 transition-transform"
                            >
                              <CheckCircle2 size={14}/> Xong
                            </button>
                            <button 
                              onClick={() => openEditModal(p, 'plan')}
                              className={`w-10 h-10 shrink-0 flex items-center justify-center rounded-xl transition-colors ${isDark ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/40' : 'bg-blue-50 text-blue-400 hover:bg-blue-100 hover:text-blue-600'}`}
                            >
                              <Pencil size={16}/>
                            </button>
                            <button 
                              onClick={() => handleDeletePlan(p.id)}
                              className={`w-10 h-10 shrink-0 flex items-center justify-center rounded-xl transition-colors ${isDark ? 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/40' : 'bg-rose-50 text-rose-400 hover:bg-rose-100 hover:text-rose-600'}`}
                            >
                              <Trash2 size={16}/>
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })()}

            {/* TAB CÀI ĐẶT */}
            {activeTab === 'settings' && (
              <div className="space-y-6 pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Cài Đặt Hệ Thống</h3>
                </div>

                {/* Giao diện */}
                <div className={`p-5 rounded-2xl shadow-sm border-2 space-y-4 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                  <h4 className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Giao diện</h4>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${isDark ? 'bg-sky-500/20 text-sky-400' : 'bg-sky-50 text-sky-600'}`}>
                        {isDark ? <Moon size={18}/> : <Sun size={18}/>}
                      </div>
                      <span className={`font-bold text-sm ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Chế độ Tối (Dark Mode)</span>
                    </div>
                    {/* Toggle Switch */}
                    <button 
                      onClick={() => setAppSettings({...appSettings, theme: isDark ? 'light' : 'dark'})}
                      className={`w-12 h-6 rounded-full relative transition-colors duration-300 ${isDark ? 'bg-sky-500' : 'bg-slate-300'}`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-sm transition-transform duration-300 ${isDark ? 'translate-x-6.5 left-0.5' : 'translate-x-0.5'}`}></div>
                    </button>
                  </div>
                </div>

                {/* Giới hạn chi tiêu */}
                <div className={`p-5 rounded-2xl shadow-sm border-2 space-y-4 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                  <h4 className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Giới hạn chi tiêu (VND)</h4>
                  
                  <div className="space-y-3">
                    <div>
                      <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Hạn mức THEO NGÀY (Để trống nếu không giới hạn)</label>
                      <input 
                        type="text"
                        inputMode="numeric"
                        placeholder="VD: 500,000"
                        className={`w-full px-4 py-3 rounded-xl border-none focus:ring-2 focus:ring-sky-500/20 outline-none font-bold text-sm transition-colors ${isDark ? 'bg-slate-950 text-slate-200' : 'bg-slate-50 text-slate-700'}`}
                        value={appSettings.dailyLimit ? Number(appSettings.dailyLimit).toLocaleString('vi-VN') : ''}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '');
                          setAppSettings({...appSettings, dailyLimit: val});
                        }}
                      />
                    </div>
                    <div>
                      <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Hạn mức THEO THÁNG (Để trống nếu không giới hạn)</label>
                      <input 
                        type="text"
                        inputMode="numeric"
                        placeholder="VD: 10,000,000"
                        className={`w-full px-4 py-3 rounded-xl border-none focus:ring-2 focus:ring-sky-500/20 outline-none font-bold text-sm transition-colors ${isDark ? 'bg-slate-950 text-slate-200' : 'bg-slate-50 text-slate-700'}`}
                        value={appSettings.monthlyLimit ? Number(appSettings.monthlyLimit).toLocaleString('vi-VN') : ''}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '');
                          setAppSettings({...appSettings, monthlyLimit: val});
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Tài khoản */}
                <div className={`p-5 rounded-2xl shadow-sm border-2 space-y-4 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                  <h4 className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Tài khoản</h4>
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 bg-rose-500 text-white py-3.5 rounded-xl text-sm font-bold active:scale-95 transition-transform shadow-md shadow-rose-500/20"
                  >
                    <LogOut size={18}/> Đăng Xuất
                  </button>
                </div>
              </div>
            )}
          </main>
        </div>

        {/* Yearly Stats Modal */}
        {showStatsModal && (
          <div className={`absolute inset-0 z-[60] animate-in slide-in-from-right duration-300 overflow-y-auto hide-scrollbar ${isDark ? 'bg-slate-950 text-white' : 'bg-white text-slate-900'}`}>
            <div className="pt-14 px-6 pb-12">
              <div className="flex items-center justify-between mb-8">
                <button onClick={() => setShowStatsModal(false)} className={`p-2 rounded-full ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600'}`}>
                  <ChevronLeft size={24}/>
                </button>
                <h2 className="text-lg font-black tracking-tight">PHÂN TÍCH NĂM {currentViewDate.getFullYear()}</h2>
                <div className="w-10"></div>
              </div>

              {/* Yearly Balance Cards */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                 <div className={`p-4 rounded-3xl border ${isDark ? 'bg-emerald-950/30 border-emerald-900/50' : 'bg-emerald-50 border-emerald-100'}`}>
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-500 uppercase mb-2">
                      <ArrowUpRight size={14}/> Tổng thu năm
                    </div>
                    <p className={`font-black truncate ${isDark ? 'text-emerald-400' : 'text-emerald-900'}`}>
                      {formatVND(yearlyStats.monthlyData.reduce((s, m) => s + m.income, 0)).replace('₫','')}
                    </p>
                 </div>
                 <div className={`p-4 rounded-3xl border ${isDark ? 'bg-rose-950/30 border-rose-900/50' : 'bg-rose-50 border-rose-100'}`}>
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-rose-500 uppercase mb-2">
                      <ArrowDownRight size={14}/> Tổng chi năm
                    </div>
                    <p className={`font-black truncate ${isDark ? 'text-rose-400' : 'text-rose-900'}`}>
                      {formatVND(yearlyStats.monthlyData.reduce((s, m) => s + m.expense, 0)).replace('₫','')}
                    </p>
                 </div>
              </div>

              {/* Bar Chart */}
              <div className={`p-6 rounded-[2.5rem] border shadow-sm mb-8 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                 <h3 className={`text-xs font-black uppercase tracking-widest mb-8 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Biểu đồ 12 tháng</h3>
                 <div className="flex items-end justify-between h-48 gap-1 sm:gap-2">
                    {yearlyStats.monthlyData.map((d, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full group">
                         <div className="w-full flex items-end justify-center gap-[1px] h-full relative">
                            <div 
                              className="w-full bg-emerald-400 rounded-t-[2px] transition-all group-hover:opacity-80" 
                              style={{ height: `${(d.income / yearlyStats.maxVal) * 100}%` }}
                            ></div>
                            <div 
                              className="w-full bg-rose-400 rounded-t-[2px] transition-all group-hover:opacity-80 shadow-sm" 
                              style={{ height: `${(d.expense / yearlyStats.maxVal) * 100}%` }}
                            ></div>
                         </div>
                         <span className={`text-[8px] font-bold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>T{d.month}</span>
                      </div>
                    ))}
                 </div>
                 <div className="mt-6 flex justify-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full"></div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Thu</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 bg-rose-400 rounded-full"></div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Chi</span>
                    </div>
                 </div>
              </div>

              {/* Summary List */}
              <div className="space-y-3">
                <h3 className={`text-xs font-black uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Chi tiết theo tháng</h3>
                {yearlyStats.monthlyData.filter(m => m.income > 0 || m.expense > 0).reverse().map(m => (
                  <div key={m.month} className={`flex items-center justify-between p-4 rounded-2xl ${isDark ? 'bg-slate-900' : 'bg-slate-50'}`}>
                    <span className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>Tháng {m.month}</span>
                    <div className="text-right">
                      <p className={`text-[10px] font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>+{formatVND(m.income).replace('₫','')}</p>
                      <p className={`text-[10px] font-bold ${isDark ? 'text-rose-400' : 'text-rose-600'}`}>-{formatVND(m.expense).replace('₫','')}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Warnings Modal */}
        {showWarningsModal && (
          <div className={`absolute inset-0 z-[60] animate-in slide-in-from-right duration-300 overflow-y-auto hide-scrollbar ${isDark ? 'bg-slate-950 text-white' : 'bg-[#F8F9FE] text-slate-900'}`}>
            <div className="pt-14 px-6 pb-12">
              <div className="flex items-center justify-between mb-8">
                <button onClick={() => setShowWarningsModal(false)} className={`p-2 rounded-full ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-white shadow-sm text-slate-600'}`}>
                  <ChevronLeft size={24}/>
                </button>
                <h2 className="text-lg font-black tracking-tight">THÔNG BÁO</h2>
                <div className="w-10"></div>
              </div>

              <div className="space-y-4">
                {warnings.length === 0 ? (
                  <div className="text-center py-20 text-slate-400">
                    <Bell size={40} className="mx-auto mb-4 opacity-20"/>
                    <p className="text-sm">Không có cảnh báo nào!</p>
                  </div>
                ) : (
                  warnings.map((w, i) => (
                    <div key={i} className={`p-5 rounded-2xl flex items-start gap-4 border shadow-sm ${isDark ? 'bg-rose-950/20 border-rose-900/30' : 'bg-white border-rose-100'}`}>
                      <div className="w-10 h-10 bg-rose-500 rounded-full flex items-center justify-center text-white shrink-0 shadow-lg shadow-rose-500/30">
                        <AlertTriangle size={20}/>
                      </div>
                      <div>
                        <p className={`font-bold text-sm ${isDark ? 'text-rose-400' : 'text-rose-700'}`}>Cảnh báo hệ thống</p>
                        <p className={`text-xs mt-1 font-medium leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{w}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Bottom Tab Bar */}
        <nav className={`absolute bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-[360px] rounded-full px-2 py-2 flex justify-between items-center z-40 shadow-2xl transition-colors duration-500 border-2 ${isDark ? 'bg-slate-900 border-slate-700 shadow-blue-900/20' : 'bg-white border-slate-300 shadow-slate-200/50'}`}>
          <button onClick={() => setActiveTab('dashboard')} className={`flex flex-col items-center gap-1 w-14 transition-all ${activeTab === 'dashboard' ? (isDark ? 'text-white' : 'text-sky-600') : (isDark ? 'text-slate-400 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600')}`}>
            <LayoutDashboard size={20} strokeWidth={activeTab === 'dashboard' ? 2.5 : 2}/>
            <span className="text-[9px] font-medium">Tổng quan</span>
          </button>
          
          <button onClick={() => setActiveTab('history')} className={`flex flex-col items-center gap-1 w-14 transition-all ${activeTab === 'history' ? (isDark ? 'text-white' : 'text-sky-600') : (isDark ? 'text-slate-400 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600')}`}>
            <List size={20} strokeWidth={activeTab === 'history' ? 2.5 : 2}/>
            <span className="text-[9px] font-medium">Lịch sử</span>
          </button>

          <div className="relative shrink-0 flex justify-center items-center px-1">
            <div className="w-[52px] h-[52px] rounded-full bg-gradient-to-tr from-sky-400 via-sky-500 to-indigo-600 p-[2.5px] shadow-lg shadow-sky-500/30">
              <button 
                onClick={() => handleOpenAddModal('transaction')}
                className={`w-full h-full rounded-full flex items-center justify-center hover:scale-95 active:scale-90 transition-transform ${isDark ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`}
              >
                <Plus size={26} strokeWidth={2.5} />
              </button>
            </div>
          </div>

          <button onClick={() => setActiveTab('planning')} className={`flex flex-col items-center gap-1 w-14 transition-all ${activeTab === 'planning' ? (isDark ? 'text-white' : 'text-sky-600') : (isDark ? 'text-slate-400 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600')}`}>
            <Calendar size={20} strokeWidth={activeTab === 'planning' ? 2.5 : 2}/>
            <span className="text-[9px] font-medium">Lên lịch</span>
          </button>

          <button onClick={() => setActiveTab('settings')} className={`flex flex-col items-center gap-1 w-14 transition-all ${activeTab === 'settings' ? (isDark ? 'text-white' : 'text-sky-600') : (isDark ? 'text-slate-400 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600')}`}>
            <Settings size={20} strokeWidth={activeTab === 'settings' ? 2.5 : 2}/>
            <span className="text-[9px] font-medium">Cài đặt</span>
          </button>
        </nav>

        {/* MODAL NHẬP LIỆU GIAO DỊCH (OPTIMIZED) */}
        <DataEntryModal 
          isOpen={showAddModal} 
          onClose={() => { setShowAddModal(false); setEditingId(null); setEditingItem(null); setPrefillDebt(null); }} 
          onSave={handleSaveData} 
          mode={modalMode} 
          initialData={editingItem} 
          prefillDebt={prefillDebt}
          prefillDate={selectedPlanDate} // Truyền ngày đang chọn trên lịch vào Form
          processedDebts={processedDebts}
          isDark={isDark} 
        />

        {/* MODAL TẠO KHOẢN NỢ MỚI */}
        <DebtEntryModal
          isOpen={showDebtModal}
          onClose={() => setShowDebtModal(false)}
          onSave={handleSaveDebt}
          isDark={isDark}
        />
      </div>
    </div>
  );
};

export default App;