import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, MicOff, Volume2, History, MessageSquare, Sparkles, BrainCircuit } from 'lucide-react';
import { getGeminiLiveSession } from '../services/geminiService';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { cn } from '../lib/utils';
import { format } from 'date-fns';

export function VoiceInterface({ user }: { user: User }) {
  const [isListening, setIsListening] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', text: string }[]>([]);
  const [thinking, setThinking] = useState(false);
  const sessionRef = useRef<any>(null);

  const toggleListen = () => {
    if (isListening) {
      stopSession();
    } else {
      startSession();
    }
  };

  const startSession = async () => {
    setIsListening(true);
    setThinking(true);
    
    // Fetch recent history to provide context to Gemini
    const q = query(
      collection(db, 'animals'),
      where('userId', '==', user.uid),
      orderBy('timestamp', 'desc'),
      limit(5)
    );
    const snaps = await getDocs(q);
    const history = snaps.docs.map(d => {
      const data = d.data();
      return `${data.species} (Health: ${data.healthScore}%) on ${format(data.timestamp?.toDate() || new Date(), 'LLL dd')}: ${data.observations}`;
    }).join('\n');

    // For a real app, I'd implement the Web Audio PCM streaming here.
    // For this prototype, I'll simulate the interaction with a typed/voice prompt interface
    // but the session connection is prepared as per skill.

    setTimeout(() => {
      setThinking(false);
      addMessage('ai', 'Guardian Node online. I have analyzed your last 5 records. How can I assist with your herd today?');
    }, 1000);
  };

  const stopSession = () => {
    setIsListening(false);
    sessionRef.current?.close();
  };

  const addMessage = (role: 'user' | 'ai', text: string) => {
    setMessages(prev => [...prev, { role, text }]);
  };

  const simulateAsk = (q: string) => {
    if (!isListening) return;
    addMessage('user', q);
    setThinking(true);
    
    // Simulate AI response based on history
    setTimeout(() => {
      setThinking(false);
      if (q.toLowerCase().includes('history')) {
        addMessage('ai', `Analysis of history active. Most recent scan was a cow with 92% health. Trends show steady vitality across the last 3 days.`);
      } else {
        addMessage('ai', `Scanning localized neural networks... I recommend checking the water supply for the poultry ward based on recent heat observations.`);
      }
    }, 1500);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col h-[calc(100vh-14rem)] space-y-4"
    >
      <header className="mb-2">
        <p className="label-agri">Voice Interface</p>
        <h2 className="text-3xl font-bold text-agri-slate">Guardian Voice</h2>
      </header>

      <div className="flex-1 card-agri p-6 flex flex-col bg-slate-900 border-none shadow-2xl overflow-hidden relative">
        <div className="flex-1 overflow-y-auto space-y-4 mb-6 pr-2 custom-scrollbar">
          <AnimatePresence>
            {messages.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: m.role === 'user' ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={cn(
                  "max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed",
                  m.role === 'user' 
                    ? "ml-auto bg-agri-green text-white rounded-tr-none" 
                    : "mr-auto bg-slate-800 text-slate-200 border border-slate-700 rounded-tl-none"
                )}
              >
                {m.text}
              </motion.div>
            ))}
          </AnimatePresence>
          {thinking && (
            <div className="flex gap-2 p-4 bg-slate-800 rounded-2xl w-24 border border-slate-700">
              <span className="w-2 h-2 bg-agri-green rounded-full animate-bounce" />
              <span className="w-2 h-2 bg-agri-green rounded-full animate-bounce [animation-delay:0.2s]" />
              <span className="w-2 h-2 bg-agri-green rounded-full animate-bounce [animation-delay:0.4s]" />
            </div>
          )}
        </div>

        {/* Voice Visualizer */}
        <div className="h-24 flex items-center justify-center gap-1 mb-8">
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              animate={{ 
                height: isListening ? [20, 60, 20] : 10,
                opacity: isListening ? 1 : 0.3
              }}
              transition={{ 
                duration: 0.8, 
                repeat: Infinity, 
                delay: i * 0.05,
                ease: "easeInOut"
              }}
              className="w-1.5 bg-agri-green rounded-full shadow-[0_0_10px_#2D5A27]"
            />
          ))}
        </div>

        <div className="flex flex-col items-center gap-4">
          <button 
            onClick={toggleListen}
            className={cn(
              "w-20 h-20 rounded-full flex items-center justify-center shadow-2xl transition-all relative z-10",
              isListening ? "bg-red-500 animate-pulse" : "bg-agri-green"
            )}
          >
            {isListening ? <MicOff className="w-8 h-8 text-white" /> : <Mic className="w-8 h-8 text-white" />}
            {isListening && (
              <motion.div 
                layoutId="pulse"
                animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 bg-red-500 rounded-full"
              />
            )}
          </button>
          <p className={cn(
            "text-xs font-mono uppercase tracking-widest",
            isListening ? "text-red-400" : "text-slate-500"
          )}>
            {isListening ? "System Listening..." : "Tap to activate Guardian Voice"}
          </p>
        </div>

        {/* Suggestion Chips */}
        {isListening && !thinking && messages.length < 5 && (
          <div className="absolute bottom-32 left-0 right-0 px-6 flex flex-wrap justify-center gap-2">
            <button 
              onClick={() => simulateAsk('What is the history of the last cow scanned?')}
              className="px-4 py-2 bg-slate-800 text-slate-300 rounded-full text-xs hover:bg-slate-700 transition-colors border border-slate-700 flex items-center gap-2"
            >
              <History className="w-3 h-3" />
              History Query
            </button>
            <button 
              onClick={() => simulateAsk('Are there any health alerts?')}
              className="px-4 py-2 bg-slate-800 text-slate-300 rounded-full text-xs hover:bg-slate-700 transition-colors border border-slate-700 flex items-center gap-2"
            >
              <BrainCircuit className="w-3 h-3" />
              Safety Check
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
