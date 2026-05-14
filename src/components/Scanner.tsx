import React, { useState, useRef, useEffect } from 'react';
import { Camera as CameraIcon, RefreshCw, Save, X, Activity, Scan, ShieldCheck, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { analyzeAnimalHealth, HealthReport } from '../services/geminiService';
import { db, storage } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { User } from 'firebase/auth';
import confetti from 'canvas-confetti';
import { cn } from '../lib/utils';

export function Scanner({ user }: { user: User }) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [report, setReport] = useState<HealthReport | null>(null);
  const [saving, setSaving] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      setStream(mediaStream);
      if (videoRef.current) videoRef.current.srcObject = mediaStream;
    } catch (err) {
      console.error("Camera access denied:", err);
    }
  };

  const stopCamera = () => {
    stream?.getTracks().forEach(track => track.stop());
    setStream(null);
  };

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvasRef.current.toDataURL('image/jpeg');
        setPhoto(dataUrl);
        stopCamera();
      }
    }
  };

  const runAnalysis = async () => {
    if (!photo) return;
    setScanning(true);
    try {
      const base64 = photo.split(',')[1];
      const result = await analyzeAnimalHealth(base64);
      setReport(result);
    } catch (err) {
      console.error(err);
      alert("Analysis failed. Please try again.");
    } finally {
      setScanning(false);
    }
  };

  const handleSave = async () => {
    if (!report || !photo || !user) return;
    setSaving(true);
    try {
      // 1. Upload Photo to Storage
      const storageRef = ref(storage, `scans/${user.uid}/${Date.now()}.jpg`);
      await uploadString(storageRef, photo, 'data_url');
      const photoUrl = await getDownloadURL(storageRef);

      // 2. Save Document to Firestore
      await addDoc(collection(db, 'animals'), {
        species: report.species,
        healthScore: report.health_score,
        observations: report.observations,
        recommendedAction: report.recommended_action,
        photoUrl,
        userId: user.uid,
        timestamp: serverTimestamp(),
      });

      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#2D5A27', '#475569', '#ffffff']
      });

      reset();
    } catch (err) {
      console.error(err);
      alert("Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setPhoto(null);
    setReport(null);
    startCamera();
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="card-agri h-[calc(100vh-14rem)] relative flex flex-col shadow-2xl"
    >
      <div className="flex-1 bg-black relative flex items-center justify-center overflow-hidden">
        {!photo ? (
          <>
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className="w-full h-full object-cover"
            />
            {/* Viewfinder crosshair */}
            <div className="absolute inset-0 border-[40px] border-black/30 pointer-events-none flex items-center justify-center">
              <div className="w-48 h-48 border-2 border-dashed border-white/50 rounded-3xl" />
            </div>
            {/* Label Overlay */}
            <div className="absolute top-6 left-6 flex items-center gap-2 px-3 py-1.5 bg-red-500 rounded-full animate-pulse shadow-lg">
              <div className="w-2 h-2 rounded-full bg-white" />
              <span className="text-[10px] font-bold text-white uppercase tracking-widest">Live Scanner</span>
            </div>
          </>
        ) : (
          <img src={photo} alt="" className="w-full h-full object-cover" />
        )}

        {scanning && (
          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-4 z-20">
            <div className="relative">
              <Scan className="w-16 h-16 text-agri-green animate-pulse" />
              <motion.div 
                animate={{ top: ['0%', '100%', '0%'] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="absolute left-0 right-0 h-0.5 bg-agri-green shadow-[0_0_10px_#2D5A27] pointer-events-none"
              />
            </div>
            <p className="text-white font-mono text-sm tracking-widest uppercase">Analyzing Specimen...</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {report && (
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            className="absolute bottom-0 left-0 right-0 bg-white p-6 border-t border-slate-200 z-30 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="label-agri">AI Report Result</p>
                <h4 className="text-2xl font-bold text-agri-slate capitalize">{report.species}</h4>
              </div>
              <div className={cn(
                "w-16 h-16 rounded-2xl flex flex-col items-center justify-center shadow-lg transition-colors border-2",
                report.health_score > 80 ? "bg-agri-green text-white border-white" : "bg-red-500 text-white border-white"
              )}>
                <span className="text-xs font-bold leading-none mb-1">HEALTH</span>
                <span className="text-2xl font-bold font-mono leading-none">{report.health_score}</span>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-100 grid place-items-center flex-shrink-0">
                  <Activity className="w-4 h-4 text-slate-500" />
                </div>
                <p className="text-sm text-slate-600 leading-relaxed pt-1.5">{report.observations}</p>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-50 grid place-items-center flex-shrink-0">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                </div>
                <p className="text-sm text-blue-700 font-medium leading-relaxed pt-1.5">{report.recommended_action}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={reset}
                className="flex-1 px-6 py-4 rounded-2xl bg-slate-100 text-slate-500 font-bold uppercase tracking-widest text-[10px] hover:bg-slate-200 transition-colors"
                disabled={saving}
              >
                Discard
              </button>
              <button 
                onClick={handleSave}
                disabled={saving}
                className="flex-[2] btn-agri bg-agri-green py-4 text-sm font-bold uppercase tracking-widest shadow-xl shadow-agri-green/20"
              >
                {saving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                {saving ? 'Archiving...' : 'Save Record'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-8 bg-white flex items-center justify-center">
        {!photo ? (
          <button 
            onClick={takePhoto}
            className="w-20 h-20 bg-agri-green text-white rounded-full flex items-center justify-center shadow-2xl active:scale-90 transition-all border-8 border-agri-green/20"
          >
            <CameraIcon className="w-8 h-8" />
          </button>
        ) : !report && (
          <div className="flex gap-4 w-full max-w-sm">
            <button 
              onClick={reset}
              className="flex-1 bg-slate-100 text-slate-500 p-4 rounded-2xl flex items-center justify-center gap-2 font-bold"
            >
              <X className="w-5 h-5" />
              Reset
            </button>
            <button 
              onClick={runAnalysis}
              className="flex-[2] bg-agri-green text-white p-4 rounded-2xl flex items-center justify-center gap-2 font-bold shadow-lg shadow-agri-green/20"
            >
              <Activity className="w-5 h-5" />
              Run Audit
            </button>
          </div>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </motion.div>
  );
}
