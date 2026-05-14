import React, { useState, useEffect, useRef } from 'react';
import { Camera, ClipboardList, LayoutDashboard, Mic, User as UserIcon, LogOut, ChevronRight, Activity, AlertCircle, TrendingUp, History } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, signInWithGoogle, logout, db } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, query, where, onSnapshot, orderBy, addDoc, limit, serverTimestamp } from 'firebase/firestore';
import { Dashboard } from './components/Dashboard';
import { Scanner } from './components/Scanner';
import { RecordsList } from './components/RecordsList';
import { VoiceInterface } from './components/VoiceInterface';
import { cn } from './lib/utils';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'scan' | 'records' | 'voice'>('dashboard');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-agri-earth">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-agri-green border-t-transparent rounded-full animate-spin" />
          <p className="text-agri-slate font-medium animate-pulse">Initializing Guardian...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-agri-earth flex flex-col items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl border border-slate-100"
        >
          <div className="w-20 h-20 bg-agri-green/10 rounded-2xl grid place-items-center mb-6 mx-auto">
            <Activity className="w-10 h-10 text-agri-green" />
          </div>
          <h1 className="text-3xl font-bold text-center text-agri-slate mb-2">OmniFarm Guardian</h1>
          <p className="text-slate-500 text-center mb-8">
            The next generation of livestock health management powered by Gemini AI.
          </p>
          <button 
            onClick={signInWithGoogle}
            className="w-full btn-agri bg-agri-green hover:bg-agri-green/90 py-4"
          >
            <UserIcon className="w-5 h-5" />
            Sign in with Google
          </button>
          <p className="mt-6 text-[10px] text-center text-slate-400 uppercase tracking-widest leading-relaxed">
            By signing in, you agree to our terms of service and privacy policy. 
            Designed for outdoor reliability.
          </p>
        </motion.div>
      </div>
    );
  }

  const tabs = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'scan', label: 'Scan', icon: Camera },
    { id: 'records', label: 'History', icon: History },
    { id: 'voice', label: 'Voice', icon: Mic },
  ];

  return (
    <div className="min-h-screen bg-agri-earth pb-24 lg:pl-64">
      {/* Sidebar - Desktop */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-slate-200 hidden lg:flex flex-col p-6">
        <div className="flex items-center gap-3 mb-12">
          <Activity className="w-8 h-8 text-agri-green" />
          <span className="font-bold text-xl text-agri-slate tracking-tight">OmniFarm</span>
        </div>

        <nav className="flex-1 flex flex-col gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium",
                activeTab === tab.id 
                  ? "bg-agri-green text-white shadow-lg shadow-agri-green/20" 
                  : "text-slate-500 hover:bg-slate-50 hover:text-agri-slate"
              )}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-100">
          <div className="flex items-center gap-3 mb-4">
            <img src={user.photoURL || ''} alt="" className="w-10 h-10 rounded-full border border-slate-200" />
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-semibold text-agri-slate truncate">{user.displayName}</p>
              <p className="text-xs text-slate-400 truncate">{user.email}</p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto p-4 lg:p-10 pt-8">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && <Dashboard key="dashboard" user={user} />}
          {activeTab === 'scan' && <Scanner key="scan" user={user} />}
          {activeTab === 'records' && <RecordsList key="records" user={user} />}
          {activeTab === 'voice' && <VoiceInterface key="voice" user={user} />}
        </AnimatePresence>
      </main>

      {/* Bottom Nav - Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 h-20 bg-white border-t border-slate-200 flex lg:hidden items-center justify-around px-4 z-50">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className="flex flex-col items-center gap-1 relative px-4"
          >
            <div className={cn(
              "w-12 h-12 rounded-2xl grid place-items-center transition-all",
              activeTab === tab.id ? "bg-agri-green text-white shadow-lg shadow-agri-green/20" : "text-slate-400"
            )}>
              <tab.icon className={cn("w-6 h-6")} />
            </div>
          </button>
        ))}
      </nav>
    </div>
  );
}
