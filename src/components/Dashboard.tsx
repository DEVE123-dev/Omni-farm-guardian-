import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, orderBy, Timestamp } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { Activity, AlertCircle, TrendingUp, Info, Droplets, Calendar } from 'lucide-react';
import { format, subHours } from 'date-fns';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';

interface Record {
  id: string;
  species: string;
  healthScore: number;
  timestamp: any;
}

import { cn } from '../lib/utils';

export function Dashboard({ user }: { user: User }) {
  const [records, setRecords] = useState<Record[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    highAlerts: 0,
    avgHealth: 0,
    milkYield: 42.5 // Mock for now as per requirement
  });

  useEffect(() => {
    const q = query(
      collection(db, 'animals'),
      where('userId', '==', user.uid),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Record));
      setRecords(docs);

      const last24h = subHours(new Date(), 24);
      const highAlerts = docs.filter(d => d.healthScore < 50 && d.timestamp?.toDate() > last24h).length;
      const avgHealth = docs.length > 0 ? Math.round(docs.reduce((acc, curr) => acc + curr.healthScore, 0) / docs.length) : 0;

      setStats({
        total: docs.length,
        highAlerts,
        avgHealth,
        milkYield: 42.5 + (Math.random() * 5 - 2.5) // Dynamic mock
      });
    });

    return () => unsubscribe();
  }, [user.uid]);

  const chartData = records.slice(0, 10).reverse().map(r => ({
    name: format(r.timestamp?.toDate() || new Date(), 'MM/dd'),
    score: r.healthScore
  }));

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div>
          <p className="label-agri">Overview</p>
          <h2 className="text-3xl font-bold text-agri-slate font-sans">Farm Health Deck</h2>
        </div>
        <div className="bg-white rounded-xl px-4 py-2 border border-slate-200 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-agri-green" />
          <span className="text-sm font-medium">{format(new Date(), 'EEEE, MMM do')}</span>
        </div>
      </header>

      {/* Primary Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard 
          icon={Activity} 
          label="Animal Count" 
          value={stats.total.toString()} 
          color="text-blue-600"
          bg="bg-blue-50"
        />
        <MetricCard 
          icon={AlertCircle} 
          label="High Alerts" 
          value={stats.highAlerts.toString()} 
          color="text-red-600"
          bg="bg-red-50"
          alert={stats.highAlerts > 0}
        />
        <MetricCard 
          icon={TrendingUp} 
          label="Avg Health" 
          value={`${stats.avgHealth}%`} 
          color="text-agri-green"
          bg="bg-agri-green/10"
        />
        <MetricCard 
          icon={Droplets} 
          label="Milk Yield" 
          value={`${stats.milkYield.toFixed(1)}L`} 
          color="text-indigo-600"
          bg="bg-indigo-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Health Trend Chart */}
        <div className="lg:col-span-2 card-agri p-6 h-[400px] flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-lg text-agri-slate">Health Trajectory</h3>
            <div className="flex gap-2">
              <span className="w-3 h-3 rounded-full bg-agri-green" />
              <span className="text-xs font-mono">Real-time Data</span>
            </div>
          </div>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94A3B8', fontSize: 12 }} 
                />
                <YAxis 
                  domain={[0, 100]} 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94A3B8', fontSize: 12 }} 
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' 
                  }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#2D5A27" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: '#2D5A27', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Feeding Schedule & Alerts */}
        <div className="card-agri p-6 flex flex-col">
          <h3 className="font-bold text-lg text-agri-slate mb-4">Maintenance</h3>
          <div className="space-y-4 flex-1 overflow-y-auto">
            <ScheduleItem 
              time="05:30" 
              task="Morning Feed" 
              status="Completed" 
              icon={TrendingUp}
            />
            <ScheduleItem 
              time="11:00" 
              task="Vet Checkup" 
              status="Scheduled" 
              icon={Activity}
            />
            <ScheduleItem 
              time="16:00" 
              task="Vaccination Cycle" 
              status="Pending" 
              icon={AlertCircle}
              urgent
            />
          </div>
          <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Daily Progress</span>
            <span className="font-bold text-agri-green">65%</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
            <div className="bg-agri-green h-full w-[65%]" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function MetricCard({ icon: Icon, label, value, color, bg, alert }: any) {
  return (
    <div className={cn("card-agri p-5 border-none", bg)}>
      <Icon className={cn("w-6 h-6 mb-3", color, alert && "animate-bounce")} />
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{label}</p>
      <div className="flex items-baseline gap-1">
        <span className={cn("text-2xl font-bold font-mono tracking-tighter", color)}>{value}</span>
      </div>
    </div>
  );
}

function ScheduleItem({ time, task, status, icon: Icon, urgent }: any) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 transition-hover hover:border-agri-green/30">
      <div className={cn(
        "p-2 rounded-lg",
        urgent ? "bg-red-100 text-red-600" : "bg-white text-agri-slate shadow-sm"
      )}>
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[10px] font-mono text-slate-400">{time}</span>
          <span className={cn(
            "text-[9px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded",
            urgent ? "bg-red-200 text-red-700" : "bg-slate-200 text-slate-500"
          )}>{status}</span>
        </div>
        <p className="text-sm font-semibold text-agri-slate">{task}</p>
      </div>
    </div>
  );
}
