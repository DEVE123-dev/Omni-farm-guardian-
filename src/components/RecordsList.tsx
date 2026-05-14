import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { Activity, Trash2, Calendar, ShieldCheck, ChevronRight, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../lib/utils';

interface Record {
  id: string;
  species: string;
  healthScore: number;
  observations: string;
  recommendedAction: string;
  photoUrl: string;
  timestamp: any;
}

export function RecordsList({ user }: { user: User }) {
  const [records, setRecords] = useState<Record[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<Record | null>(null);

  useEffect(() => {
    const q = query(
      collection(db, 'animals'),
      where('userId', '==', user.uid),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setRecords(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Record)));
    });

    return () => unsubscribe();
  }, [user.uid]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Permanent delete?")) {
      await deleteDoc(doc(db, 'animals', id));
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      <header className="mb-8">
        <p className="label-agri">Archives</p>
        <h2 className="text-3xl font-bold text-agri-slate">Historical Logs</h2>
        <p className="text-slate-400 text-sm mt-1">Found {records.length} records in system.</p>
      </header>

      <div className="space-y-3">
        {records.map((record) => (
          <motion.div 
            key={record.id}
            layoutId={record.id}
            onClick={() => setSelectedRecord(record)}
            className="card-agri p-4 flex items-center gap-4 cursor-pointer hover:bg-slate-50 transition-colors"
          >
            <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
              <img src={record.photoUrl} alt="" className="w-full h-full object-cover" />
            </div>
            
            <div className="flex-1 overflow-hidden">
              <div className="flex items-center gap-3 mb-1">
                <h4 className="font-bold text-agri-slate capitalize truncate">{record.species}</h4>
                <span className={cn(
                  "px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-tight",
                  record.healthScore > 80 ? "bg-agri-green/10 text-agri-green" : "bg-red-50 text-red-500"
                )}>
                  Health {record.healthScore}%
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Calendar className="w-3 h-3" />
                {format(record.timestamp?.toDate() || new Date(), 'LLL dd, yyyy • HH:mm')}
              </div>
            </div>

            <button 
              onClick={(e) => handleDelete(record.id, e)}
              className="p-2 hover:bg-red-50 rounded-lg text-slate-300 hover:text-red-500 transition-colors"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            <ChevronRight className="w-5 h-5 text-slate-300" />
          </motion.div>
        ))}

        {records.length === 0 && (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
            <Activity className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400 font-medium">No records found. Start scanning.</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedRecord && (
          <div className="fixed inset-0 z-50 grid place-items-center p-4 lg:p-10 pointer-events-none">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedRecord(null)}
              className="absolute inset-0 bg-agri-slate/40 backdrop-blur-sm pointer-events-auto"
            />
            <motion.div 
              layoutId={selectedRecord.id}
              className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl pointer-events-auto flex flex-col relative"
            >
              <button 
                onClick={() => setSelectedRecord(null)}
                className="absolute top-4 right-4 w-10 h-10 bg-white/20 backdrop-blur rounded-full grid place-items-center text-white hover:bg-white/40 transition-colors z-10"
              >
                <Trash2 className="w-5 h-5 rotate-45" />
              </button>

              <div className="h-64 bg-slate-900 border-b border-slate-100">
                <img src={selectedRecord.photoUrl} alt="" className="w-full h-full object-cover" />
              </div>

              <div className="p-8">
                <div className="flex items-start justify-between mb-8">
                  <div>
                    <p className="label-agri">Archive Details</p>
                    <h3 className="text-3xl font-bold text-agri-slate capitalize mb-1">{selectedRecord.species}</h3>
                    <div className="flex items-center gap-2 text-slate-400 text-sm">
                      <Calendar className="w-4 h-4" />
                      {format(selectedRecord.timestamp?.toDate() || new Date(), 'PPPP')}
                    </div>
                  </div>
                  <div className={cn(
                    "w-16 h-16 rounded-2xl flex flex-col items-center justify-center shadow-lg border-2",
                    selectedRecord.healthScore > 80 ? "bg-agri-green text-white border-white" : "bg-red-500 text-white border-white"
                  )}>
                    <span className="text-xs font-bold leading-none mb-1">HQI</span>
                    <span className="text-2xl font-bold font-mono leading-none">{selectedRecord.healthScore}</span>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h5 className="flex items-center gap-2 text-agri-slate font-bold text-sm uppercase tracking-wider mb-2">
                      <Activity className="w-4 h-4 text-agri-green" />
                      Visual Observations
                    </h5>
                    <p className="text-slate-600 text-sm leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                      {selectedRecord.observations}
                    </p>
                  </div>

                  <div>
                    <h5 className="flex items-center gap-2 text-agri-slate font-bold text-sm uppercase tracking-wider mb-2">
                      <ShieldCheck className="w-4 h-4 text-blue-500" />
                      Recommended Protocol
                    </h5>
                    <p className="text-blue-700 bg-blue-50/50 p-4 rounded-xl border border-blue-100 text-sm font-medium leading-relaxed">
                      {selectedRecord.recommendedAction}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
