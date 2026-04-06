import React, { useState, useEffect, useMemo } from 'react';
// Xóa import từ module để tránh lỗi trong môi trường preview
// import { createClient } from '@supabase/supabase-js';
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
  Sparkles,
  Loader2
} from 'lucide-react';

const apiKey = "";

// 1. Khởi tạo Supabase an toàn (Xử lý fallback cho môi trường preview)
const getEnv = (key) => {
  try {
    return import.meta.env[key] || '';
  } catch (e) {
    return '';
  }
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const supabaseKey = getEnv('VITE_SUPABASE_ANON_KEY');

// Hàm khởi tạo client từ window nếu load qua CDN
const getSupabaseClient = () => {
  if (window.supabase && supabaseUrl && supabaseKey) {
    return window.supabase.createClient(supabaseUrl, supabaseKey);
  }
  return null;
};

// 2. Dữ liệu tĩnh (Đưa ra ngoài component để tối ưu)
const categories = {
  income: ['Lương', 'Thưởng', 'Kinh doanh', 'Vay tiền', 'Khác'],
  expense: ['Ăn uống', 'Di chuyển', 'Nhà cửa', 'Mua sắm', 'Giải trí', 'Học tập', 'Sức khỏe', 'Trả nợ']
};

const categoryColors = {
  'Ăn uống': '#f43f5e', 'Di chuyển': '#f59e0b', 'Nhà cửa': '#8b5cf6',
  'Mua sắm': '#ec4899', 'Giải trí': '#06b6d4', 'Học tập': '#10b981',
  'Sức khỏe': '#ef4444', 'Lương': '#10b981', 'Thưởng': '#3b82f6',
  'Kinh doanh': '#f59e0b', 'Vay tiền': '#14b8a6', 'Trả nợ': '#737373', 'Khác': '#64748b'
};

const formatVND = (n) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

// 3. Component Biểu đồ (Đưa ra ngoài để tránh lỗi Hook của React)
const SmallPieChart = ({ stats }) => {
  const data = Object.entries(stats.expenseByCategory);
  if (data.length === 0) return <div className="py-10 text-center text-slate-400 text-sm italic">Chưa có dữ liệu chi tiêu</div>;
  
  let cumulative = 0;
  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 200 200" className="w-48 h-48 -rotate-90 mb-6">
        {data.map(([cat, val]) => {
          const p = val / stats.expense;
          const x1 = Math.cos(2 * Math.PI * cumulative);
          const y1 = Math.sin(2 * Math.PI * cumulative);
          cumulative += p;
          const x2 = Math.cos(2 * Math.PI * cumulative);
          const y2 = Math.sin(2 * Math.PI * cumulative);
          return <path key={cat} d={`M ${100 + x1*80} ${100 + y1*80} A 80 80 0 ${p > 0.5 ? 1 : 0} 1 ${100 + x2*80} ${100 + y2*80} L 100 100`} fill={categoryColors[cat]} />;
        })}
        <circle cx="100" cy="100" r="50" fill="white" />
      </svg>
      <div className="grid grid-cols-2 gap-x-6 gap-y-2 w-full">
        {data.map(([cat, val]) => (
          <div key={cat} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 truncate">
              <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: categoryColors[cat] }}></div>
              <span className="text-slate-600 truncate">{cat}</span>
            </div>
            <span className="font-bold">{Math.round((val/stats.expense)*100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- COMPONENT CHÍNH ---
const App = () => {
  const [supabase, setSupabase] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [plans, setPlans] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard'); 
  const [showAddModal, setShowAddModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [modalMode, setModalMode] = useState('transaction'); 
  const [currentViewDate, setCurrentViewDate] = useState(new Date());
  const [editingId, setEditingId] = useState(null);
  const [aiAdvice, setAiAdvice] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const defaultFormData = {
    title: '',
    amount: '',
    type: 'expense',
    category: 'Ăn uống',
    date: new Date().toISOString().split('T')[0]
  };
  const [formData, setFormData] = useState(defaultFormData);

  // Hàm mở modal thêm mới
  const handleOpenAddModal = (mode) => {
    setModalMode(mode);
    setEditingId(null);
    setFormData(defaultFormData);
    setShowAddModal(true);
  };

  // Hàm mở modal chỉnh sửa
  const openEditModal = (item, type) => {
    setModalMode(type);
    setEditingId(item.id);
    setFormData({
      title: item.title,
      amount: item.amount,
      type: item.type,
      category: item.category,
      date: item.date
    });
    setShowAddModal(true);
  };

  // Tải Supabase CDN động cho môi trường preview
  useEffect(() => {
    const loadSupabaseScript = async () => {
      if (!window.supabase) {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
        script.async = true;
        document.body.appendChild(script);
        
        script.onload = () => {
          setSupabase(getSupabaseClient());
        };
      } else {
        setSupabase(getSupabaseClient());
      }
    };
    
    loadSupabaseScript();
  }, []);

  // Tải dữ liệu từ Supabase hoặc LocalStorage (fallback) khi mở app
  useEffect(() => {
    if (supabase || (!supabaseUrl && !supabaseKey)) {
      fetchTransactions();
      fetchPlans();
    }
  }, [supabase]);

  // Cập nhật LocalStorage khi có thay đổi (chỉ dùng khi không có Supabase)
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


  const fetchTransactions = async () => {
    if (!supabase) {
      const saved = localStorage.getItem('money_manager_data_fallback_v2');
      if (saved) setTransactions(JSON.parse(saved));
      return;
    }
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('date', { ascending: false });
    if (!error && data) setTransactions(data);
  };

  const fetchPlans = async () => {
    if (!supabase) {
      const saved = localStorage.getItem('money_manager_plans_fallback_v2');
      if (saved) setPlans(JSON.parse(saved));
      return;
    }
    const { data, error } = await supabase
      .from('plans')
      .select('*')
      .order('date', { ascending: true });
    if (!error && data) setPlans(data);
  };

  // Các hàm tính toán thống kê
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const tDate = new Date(t.date);
      return tDate.getMonth() === currentViewDate.getMonth() && 
             tDate.getFullYear() === currentViewDate.getFullYear();
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
    const monthlyData = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      income: 0,
      expense: 0
    }));

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
    if (stats.expense > 10000000) alerts.push(`Vượt hạn mức 10tr tháng này!`);
    if (stats.balance < 1000000 && stats.balance > 0) alerts.push(`Số dư đang ở mức thấp.`);
    if (stats.balance < 0) alerts.push(`Bạn đang chi vượt thu!`);
    
    const upcomingPlans = plans.filter(p => {
      const pDate = new Date(p.date);
      const today = new Date();
      return pDate >= today && (pDate - today) / (1000 * 60 * 60 * 24) <= 3;
    });
    if (upcomingPlans.length > 0) {
      alerts.push(`Bạn có ${upcomingPlans.length} kế hoạch tài chính trong 3 ngày tới.`);
    }
    return alerts;
  }, [stats, plans]);

  // Hàm gọi Gemini API phân tích chi tiêu
  const fetchAIAdvice = async () => {
    setIsAnalyzing(true);
    const categoryDetails = Object.entries(stats.expenseByCategory)
      .map(([k, v]) => `${k} (${formatVND(v)})`)
      .join(', ');
    
    const prompt = `Bạn là một chuyên gia tài chính cá nhân nhiệt tình. Dựa vào dữ liệu thu chi tháng này của tôi: Tổng thu: ${formatVND(stats.income)}, Tổng chi: ${formatVND(stats.expense)}. Các khoản chi tiêu gồm: ${categoryDetails || 'Chưa có khoản chi nào'}. Hãy đưa ra nhận xét ngắn gọn (tối đa 4 câu) và 1 lời khuyên hữu ích để tiết kiệm hoặc tối ưu tài chính. Sử dụng emoji cho sinh động.`;

    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      systemInstruction: { parts: [{ text: "Luôn trả về câu trả lời định dạng text rõ ràng, không dùng markdown in đậm quá mức." }] }
    };

    const callApi = async (attempt = 0) => {
      const delays = [1000, 2000, 4000, 8000, 16000];
      try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('Lỗi API');
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        setAiAdvice(text || "Không có phản hồi từ AI.");
      } catch (error) {
        if (attempt < delays.length) {
          await new Promise(r => setTimeout(r, delays[attempt]));
          await callApi(attempt + 1);
        } else {
          setAiAdvice("Đã xảy ra lỗi khi kết nối với AI. Vui lòng thử lại sau.");
        }
      }
    };

    await callApi();
    setIsAnalyzing(false);
  };

  // Các hàm tương tác Database
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.amount) return;

    const newData = {
      title: formData.title,
      amount: Number(formData.amount),
      type: formData.type,
      category: formData.category,
      date: formData.date
    };

    if (editingId) {
      // TRƯỜNG HỢP: CẬP NHẬT (EDIT)
      if (modalMode === 'transaction') {
        const original = transactions.find(t => t.id === editingId);
        setTransactions(prev => prev.map(t => t.id === editingId ? { ...t, ...newData } : t)); // Cập nhật UI ngay
        if (supabase) {
          supabase.from('transactions').update(newData).eq('id', editingId).then(({ error }) => {
            if (error) setTransactions(prev => prev.map(t => t.id === editingId ? original : t)); // Rollback nếu lỗi
          });
        }
      } else {
        const original = plans.find(p => p.id === editingId);
        setPlans(prev => prev.map(p => p.id === editingId ? { ...p, ...newData } : p));
        if (supabase) {
          supabase.from('plans').update(newData).eq('id', editingId).then(({ error }) => {
            if (error) setPlans(prev => prev.map(p => p.id === editingId ? original : p));
          });
        }
      }
    } else {
      // TRƯỜNG HỢP: THÊM MỚI (ADD)
      const tempId = Date.now();
      if (modalMode === 'transaction') {
        setTransactions(prev => [{ id: tempId, ...newData }, ...prev]);
        if (supabase) {
          supabase.from('transactions').insert([newData]).select().then(({ data, error }) => {
            if (!error && data) setTransactions(prev => prev.map(t => t.id === tempId ? data[0] : t));
            else setTransactions(prev => prev.filter(t => t.id !== tempId));
          });
        }
      } else {
        const planData = { ...newData, completed: false };
        setPlans(prev => [{ id: tempId, ...planData }, ...prev]);
        if (supabase) {
          supabase.from('plans').insert([planData]).select().then(({ data, error }) => {
            if (!error && data) setPlans(prev => prev.map(p => p.id === tempId ? data[0] : p));
            else setPlans(prev => prev.filter(p => p.id !== tempId));
          });
        }
      }
    }

    setFormData(defaultFormData);
    setEditingId(null);
    setShowAddModal(false);
  };

  const handleDeleteTransaction = (id) => {
    // 1. Xóa trên UI ngay
    const backup = [...transactions];
    setTransactions(prev => prev.filter(x => x.id !== id));
    
    // 2. Xóa ngầm trên DB
    if (supabase) {
      supabase.from('transactions').delete().eq('id', id).then(({ error }) => {
        if (error) setTransactions(backup); // Phục hồi nếu lỗi
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
      date: new Date().toISOString().split('T')[0]
    };

    const backupPlans = [...plans];
    
    // 1. Cập nhật UI ngay lập tức: Xóa kế hoạch, Thêm giao dịch
    setPlans(prev => prev.filter(p => p.id !== plan.id));
    setTransactions(prev => [{ id: tempId, ...newTransaction }, ...prev]);

    // 2. Đồng bộ ngầm
    if (supabase) {
      supabase.from('transactions').insert([newTransaction]).select().then(({ data, error }) => {
        if (!error && data) {
          setTransactions(prev => prev.map(t => t.id === tempId ? data[0] : t));
          supabase.from('plans').delete().eq('id', plan.id).then();
        } else {
          // Rollback nếu lỗi
          setTransactions(prev => prev.filter(t => t.id !== tempId));
          setPlans(backupPlans);
        }
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-200 flex items-center justify-center p-4 sm:p-8">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@900&display=swap');
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .font-logo {
          font-family: 'Montserrat', sans-serif;
        }
      `}</style>
      
      {/* Phone Frame Wrapper */}
      <div className="w-full sm:w-[390px] h-[100dvh] sm:h-[844px] bg-[#F8F9FE] sm:rounded-[3rem] shadow-2xl relative overflow-hidden sm:border-[8px] border-slate-900 flex flex-col ring-1 ring-slate-900/10">
        
        {/* Fake Dynamic Island */}
        <div className="hidden sm:block absolute top-3 left-1/2 -translate-x-1/2 w-32 h-7 bg-black rounded-full z-[100]"></div>

        {/* Scrollable Main Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden hide-scrollbar relative text-slate-900 font-sans select-none pb-24">
          
          {/* Header */}
          <header className="pt-14 pb-6 px-6 bg-white rounded-b-[2.5rem] shadow-sm border-b border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex flex-col gap-0.5">
                <h1 className="text-3xl font-logo tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 drop-shadow-sm">
                  FINANCE
                </h1>
                <div className="flex items-center gap-1.5 mt-1">
                  <Calendar size={12} className="text-blue-500" />
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                    Tháng {currentViewDate.getMonth() + 1}, {currentViewDate.getFullYear()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setShowStatsModal(true)}
                  className="p-2.5 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors"
                >
                  <BarChart3 size={20}/>
                </button>
                <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-full border">
                   <button onClick={() => setCurrentViewDate(new Date(currentViewDate.setMonth(currentViewDate.getMonth()-1)))} className="p-2 hover:bg-white rounded-full transition-all"><ChevronLeft size={16}/></button>
                   <button onClick={() => setCurrentViewDate(new Date(currentViewDate.setMonth(currentViewDate.getMonth()+1)))} className="p-2 hover:bg-white rounded-full transition-all"><ChevronRight size={16}/></button>
                </div>
              </div>
            </div>

            {/* Main Card */}
            <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl shadow-slate-200 relative overflow-hidden">
              <div className="absolute top-[-20%] right-[-10%] w-40 h-40 bg-blue-500/20 rounded-full blur-3xl"></div>
              <p className="text-xs font-medium text-slate-400 mb-1">Tổng số dư tháng này</p>
              <h2 className="text-3xl font-black mb-6">{formatVND(stats.balance)}</h2>
              <div className="flex gap-4">
                <div className="flex-1 bg-white/10 rounded-2xl p-3 backdrop-blur-md">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 uppercase mb-1">
                    <TrendingUp size={12}/> Thu nhập
                  </div>
                  <p className="font-bold text-sm">{formatVND(stats.income).replace('₫','')}</p>
                </div>
                <div className="flex-1 bg-white/10 rounded-2xl p-3 backdrop-blur-md">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-rose-400 uppercase mb-1">
                    <TrendingDown size={12}/> Chi tiêu
                  </div>
                  <p className="font-bold text-sm">{formatVND(stats.expense).replace('₫','')}</p>
                </div>
              </div>
            </div>
          </header>

          {/* Content Area */}
          <main className="px-6 pt-8 animate-in fade-in duration-500">
            {activeTab === 'dashboard' && (
              <div className="space-y-6 pb-4">
                <section className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                  <h3 className="text-sm font-black mb-6 text-slate-400 uppercase tracking-widest">Phân bổ chi tiêu</h3>
                  <SmallPieChart stats={stats} />
                </section>
                
                <section className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 rounded-[2rem] text-white shadow-lg relative overflow-hidden">
                  <div className="flex items-center justify-between mb-4 relative z-10">
                    <div className="flex items-center gap-3">
                      <Sparkles size={20} className="text-yellow-300"/>
                      <h3 className="font-bold">✨ Cố vấn AI</h3>
                    </div>
                    <button 
                      onClick={fetchAIAdvice} 
                      disabled={isAnalyzing} 
                      className="bg-white/20 hover:bg-white/30 p-2 px-3 rounded-xl transition-colors text-xs font-bold flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {isAnalyzing ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                      {isAnalyzing ? 'Đang phân tích...' : 'Phân tích'}
                    </button>
                  </div>
                  <div className="relative z-10 text-sm text-indigo-50 leading-relaxed bg-white/10 p-4 rounded-2xl backdrop-blur-sm border border-white/10 whitespace-pre-line">
                    {aiAdvice ? aiAdvice : 'Bấm "Phân tích" để AI xem xét và đưa ra lời khuyên dựa trên chi tiêu tháng này của bạn.'}
                  </div>
                </section>
              </div>
            )}

            {activeTab === 'history' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Lịch sử giao dịch</h3>
                  <span className="text-[10px] font-bold bg-slate-200 px-2 py-0.5 rounded-full uppercase">{filteredTransactions.length} mục</span>
                </div>
                {filteredTransactions.map(t => (
                  <div key={t.id} className="bg-white p-4 rounded-2xl border border-slate-50 flex items-center shadow-sm group active:scale-95 transition-transform">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mr-4 shrink-0 ${t.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                      {t.type === 'income' ? <TrendingUp size={20}/> : <TrendingDown size={20}/>}
                    </div>
                    <div className="flex-1 min-w-0 pr-2">
                      <p className="font-bold text-slate-800 truncate text-sm">{t.title}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">{t.category}</p>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1">
                      <p className={`font-black text-sm ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {t.type === 'income' ? '+' : '-'}{formatVND(t.amount).replace('₫','')}
                      </p>
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleDeleteTransaction(t.id)} className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors">
                          <Trash2 size={16}/>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'alerts' && (
              <div className="space-y-4">
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Thông báo & Nhắc nhở</h3>
                {warnings.length === 0 ? (
                  <div className="text-center py-20 text-slate-400">
                    <Bell size={40} className="mx-auto mb-4 opacity-10"/>
                    <p className="text-sm">Mọi thứ đều ổn định!</p>
                  </div>
                ) : (
                  warnings.map((w, i) => (
                    <div key={i} className="bg-rose-50 border border-rose-100 p-5 rounded-2xl flex items-start gap-4">
                      <div className="w-10 h-10 bg-rose-500 rounded-full flex items-center justify-center text-white shrink-0 shadow-lg shadow-rose-200">
                        <AlertTriangle size={20}/>
                      </div>
                      <div>
                        <p className="font-bold text-rose-900 text-sm">Cảnh báo hệ thống</p>
                        <p className="text-xs text-rose-700 mt-0.5 font-medium">{w}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'planning' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Kế hoạch tài chính</h3>
                  <button 
                    onClick={() => handleOpenAddModal('plan')}
                    className="flex items-center gap-1 text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full shrink-0"
                  >
                    <Plus size={14}/> Lên lịch
                  </button>
                </div>
                
                {plans.length === 0 ? (
                  <div className="text-center py-20 text-slate-400 bg-white rounded-[2rem] border border-dashed border-slate-200">
                    <Calendar size={40} className="mx-auto mb-4 opacity-10"/>
                    <p className="text-sm">Chưa có kế hoạch nào được lập</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {plans.map(p => (
                      <div key={p.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-2 min-w-0 pr-2">
                            <div className={`p-2 rounded-lg shrink-0 ${p.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                              <Clock size={16}/>
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-slate-800 text-sm truncate">{p.title}</p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase truncate">{p.category} • {p.date}</p>
                            </div>
                          </div>
                          <p className={`font-black text-sm shrink-0 ${p.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
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
                            className="w-10 h-10 shrink-0 flex items-center justify-center bg-blue-50 text-blue-400 rounded-xl hover:text-blue-600 hover:bg-blue-100 transition-colors"
                          >
                            <Pencil size={16}/>
                          </button>
                          <button 
                            onClick={() => handleDeletePlan(p.id)}
                            className="w-10 h-10 shrink-0 flex items-center justify-center bg-rose-50 text-rose-400 rounded-xl hover:text-rose-600 hover:bg-rose-100 transition-colors"
                          >
                            <Trash2 size={16}/>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </main>
        </div>

        {/* Yearly Stats Modal - Changed from fixed to absolute */}
        {showStatsModal && (
          <div className="absolute inset-0 z-[60] bg-white animate-in slide-in-from-right duration-300 overflow-y-auto hide-scrollbar">
            <div className="pt-14 px-6 pb-12">
              <div className="flex items-center justify-between mb-8">
                <button onClick={() => setShowStatsModal(false)} className="p-2 bg-slate-100 rounded-full text-slate-600">
                  <ChevronLeft size={24}/>
                </button>
                <h2 className="text-lg font-black tracking-tight">PHÂN TÍCH NĂM {currentViewDate.getFullYear()}</h2>
                <div className="w-10"></div>
              </div>

              {/* Yearly Balance Cards */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                 <div className="bg-emerald-50 p-4 rounded-3xl border border-emerald-100">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 uppercase mb-2">
                      <ArrowUpRight size={14}/> Tổng thu năm
                    </div>
                    <p className="font-black text-emerald-900 truncate">
                      {formatVND(yearlyStats.monthlyData.reduce((s, m) => s + m.income, 0)).replace('₫','')}
                    </p>
                 </div>
                 <div className="bg-rose-50 p-4 rounded-3xl border border-rose-100">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-rose-600 uppercase mb-2">
                      <ArrowDownRight size={14}/> Tổng chi năm
                    </div>
                    <p className="font-black text-rose-900 truncate">
                      {formatVND(yearlyStats.monthlyData.reduce((s, m) => s + m.expense, 0)).replace('₫','')}
                    </p>
                 </div>
              </div>

              {/* Bar Chart */}
              <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm mb-8">
                 <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-8">Biểu đồ 12 tháng</h3>
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
                         <span className="text-[8px] font-bold text-slate-400">T{d.month}</span>
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
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Chi tiết theo tháng</h3>
                {yearlyStats.monthlyData.filter(m => m.income > 0 || m.expense > 0).reverse().map(m => (
                  <div key={m.month} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                    <span className="font-bold text-slate-900">Tháng {m.month}</span>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-emerald-600">+{formatVND(m.income).replace('₫','')}</p>
                      <p className="text-[10px] font-bold text-rose-600">-{formatVND(m.expense).replace('₫','')}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Bottom Tab Bar - Changed from fixed to absolute */}
        <nav className="absolute bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-slate-100 px-6 pb-8 pt-3 flex justify-between items-center z-40">
          <button onClick={() => setActiveTab('dashboard')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'dashboard' ? 'text-blue-600 scale-110' : 'text-slate-400 hover:text-slate-600'}`}>
            <LayoutDashboard size={24}/>
            <span className="text-[10px] font-bold uppercase tracking-tighter">Tổng quan</span>
          </button>
          
          <button onClick={() => setActiveTab('history')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'history' ? 'text-blue-600 scale-110' : 'text-slate-400 hover:text-slate-600'}`}>
            <List size={24}/>
            <span className="text-[10px] font-bold uppercase tracking-tighter">Lịch sử</span>
          </button>

          <div className="relative -top-8 shrink-0">
            <button 
              onClick={() => handleOpenAddModal('transaction')}
              className="w-16 h-16 bg-slate-900 text-white rounded-full shadow-2xl shadow-slate-400 flex items-center justify-center hover:scale-110 active:scale-95 transition-all border-4 border-white"
            >
              <Plus size={32} />
            </button>
          </div>

          <button onClick={() => setActiveTab('alerts')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'alerts' ? 'text-blue-600 scale-110' : 'text-slate-400 hover:text-slate-600'}`}>
            <div className="relative">
              <Bell size={24}/>
              {warnings.length > 0 && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full"></span>}
            </div>
            <span className="text-[10px] font-bold uppercase tracking-tighter">Cảnh báo</span>
          </button>

          <button onClick={() => setActiveTab('planning')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'planning' ? 'text-blue-600 scale-110' : 'text-slate-400 hover:text-slate-600'}`}>
            <Calendar size={24}/>
            <span className="text-[10px] font-bold uppercase tracking-tighter">Lên lịch</span>
          </button>
        </nav>

        {/* Add/Edit Transaction/Plan Modal - Changed from fixed to absolute */}
        {showAddModal && (
          <div className="absolute inset-0 z-50 flex items-end animate-in fade-in duration-300">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => { setShowAddModal(false); setEditingId(null); setFormData(defaultFormData); }}></div>
            <div className="relative w-full max-h-[90%] overflow-y-auto hide-scrollbar bg-white rounded-t-[3rem] p-8 pb-12 animate-in slide-in-from-bottom-full duration-500">
              <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-8 shrink-0"></div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl sm:text-2xl font-black italic tracking-tighter uppercase">
                  {editingId 
                    ? (modalMode === 'transaction' ? 'SỬA GHI CHÉP' : 'SỬA KẾ HOẠCH') 
                    : (modalMode === 'transaction' ? 'GHI CHÉP MỚI' : 'LÊN LỊCH MỚI')}
                </h2>
                <button onClick={() => { setShowAddModal(false); setEditingId(null); setFormData(defaultFormData); }} className="p-2 bg-slate-100 rounded-full text-slate-500"><X size={20}/></button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-100 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, type: 'expense', category: 'Ăn uống'})}
                    className={`py-3 rounded-xl text-xs font-black transition-all uppercase tracking-widest ${formData.type === 'expense' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-400'}`}
                  >
                    Chi tiêu
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, type: 'income', category: 'Lương'})}
                    className={`py-3 rounded-xl text-xs font-black transition-all uppercase tracking-widest ${formData.type === 'income' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}
                  >
                    Thu nhập
                  </button>
                </div>

                <div className="space-y-4">
                  <input
                    type="text"
                    required
                    placeholder={modalMode === 'transaction' ? "Nội dung giao dịch..." : "Nội dung kế hoạch..."}
                    className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-blue-500/20 outline-none font-bold text-slate-700"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                  />
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    placeholder="0 VND"
                    className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-blue-500/20 outline-none font-black text-2xl text-slate-900"
                    value={formData.amount ? Number(formData.amount).toLocaleString('vi-VN') : ''}
                    onChange={(e) => {
                      // Loại bỏ tất cả ký tự không phải là số (để lấy giá trị thực)
                      const rawValue = e.target.value.replace(/\D/g, '');
                      setFormData({...formData, amount: rawValue});
                    }}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <select
                      className="w-full px-4 py-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-blue-500/20 outline-none font-bold text-sm appearance-none"
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                    >
                      {categories[formData.type].map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                    <input
                      type="date"
                      className="w-full px-4 py-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-blue-500/20 outline-none font-bold text-sm"
                      value={formData.date}
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-lg hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 uppercase tracking-widest"
                >
                  {editingId 
                    ? 'Cập Nhật' 
                    : (modalMode === 'transaction' ? 'Lưu Giao Dịch' : 'Thêm Vào Lịch')}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;