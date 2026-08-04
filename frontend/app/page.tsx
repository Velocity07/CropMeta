"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import { Leaf, Droplets, Thermometer, FlaskConical, CloudRain, AlertCircle, Loader2 } from "lucide-react";

// PERFORMANCE UPGRADE: Lazy load the heavy 3D engine. 
const Spline = dynamic(() => import("@splinetool/react-spline"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/40 backdrop-blur-md rounded-2xl z-0">
      <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mb-2" />
      <p className="text-slate-400 text-sm font-medium tracking-wide">Loading 3D Engine...</p>
    </div>
  ),
});

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<{ crop: string; confidence: string } | null>(null);
  
  const [formData, setFormData] = useState({
    N: 90, P: 42, K: 43, temperature: 20.8, humidity: 82.0, ph: 6.5, rainfall: 202.9
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: parseFloat(e.target.value) || 0 }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setPrediction(null);

    try {
      const response = await fetch("http://127.0.0.1:8000/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      
      if (response.ok) {
        const data = await response.json();
        setPrediction(data);
      } else {
        setError("AI Engine Error: Failed to generate prediction.");
      }
    } catch (err) {
      setError("Connection Refused: Ensure your FastAPI backend is running.");
    } finally {
      setLoading(false);
    }
  };

  // THE FIX: Added "as const" so TypeScript knows this is strictly a spring animation
  const springAnim = { type: "spring" as const, stiffness: 400, damping: 30 };

  return (
    <main className="min-h-screen p-6 md:p-12 flex flex-col items-center justify-center font-sans overflow-hidden">
      
      <motion.div 
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={springAnim}
        className="text-center mb-12 z-10"
      >
        <h1 className="text-5xl md:text-6xl font-black bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-400 mb-4 tracking-tight">
          AI Smart Agriculture
        </h1>
        <p className="text-slate-400 max-w-xl mx-auto text-lg leading-relaxed">
          Input your environmental telemetry. Our Machine Learning engine will compute the optimal crop for your specific microclimate.
        </p>
      </motion.div>

      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10">
        
        <motion.div 
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={springAnim}
          className="glass-panel rounded-3xl p-8"
        >
          <h2 className="text-2xl font-bold mb-8 flex items-center gap-3 text-white">
            <div className="p-2 bg-emerald-500/20 rounded-lg border border-emerald-500/30">
              <Leaf className="text-emerald-400 w-5 h-5" />
            </div>
            Soil Telemetry
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-3 gap-5">
              {[
                { label: "Nitrogen (N)", name: "N" },
                { label: "Phosphorus (P)", name: "P" },
                { label: "Potassium (K)", name: "K" }
              ].map((field) => (
                <div key={field.name} className="group">
                  <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider group-hover:text-emerald-400 transition-colors">{field.label}</label>
                  <input type="number" name={field.name} value={formData[field.name as keyof typeof formData]} onChange={handleInputChange} className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all" step="any" required />
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-5 pt-2">
              {[
                { label: "Temperature (°C)", name: "temperature", icon: Thermometer },
                { label: "Humidity (%)", name: "humidity", icon: Droplets },
                { label: "Soil pH", name: "ph", icon: FlaskConical },
                { label: "Rainfall (mm)", name: "rainfall", icon: CloudRain }
              ].map((field) => (
                <div key={field.name} className="group">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider group-hover:text-emerald-400 transition-colors">
                    <field.icon size={14} /> {field.label}
                  </label>
                  <input type="number" name={field.name} value={formData[field.name as keyof typeof formData]} onChange={handleInputChange} className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all" step="any" required />
                </div>
              ))}
            </div>

            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mt-4 flex items-center gap-3 text-red-400 text-sm font-medium"
                >
                  <AlertCircle size={18} /> {error}
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button 
              whileHover={{ scale: 1.01, boxShadow: "0 0 20px rgba(16, 185, 129, 0.4)" }}
              whileTap={{ scale: 0.98 }}
              type="submit" 
              disabled={loading}
              className="w-full mt-6 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold py-4 px-4 rounded-xl shadow-lg transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
            >
              {loading ? (
                <><Loader2 className="animate-spin w-5 h-5" /> Processing Data...</>
              ) : (
                "Compute Prediction"
              )}
            </motion.button>
          </form>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={springAnim}
          className="flex flex-col gap-8 h-full"
        >
         <div className="rounded-3xl overflow-hidden h-[320px] w-full relative flex items-center justify-center group cursor-grab active:cursor-grabbing">
  
  {/* -inset-20 expands the canvas 80px in every direction outside the parent. */}
  {/* The 3D model stays dead center, but the bottom-right logo is banished into the void! */}
  <div className="absolute -inset-20 z-10 transition-opacity duration-500 group-hover:opacity-75">
    <Spline scene="https://prod.spline.design/rtHLauzoBdcql2EB/scene.splinecode" />
  </div>

</div>

          <AnimatePresence mode="wait">
            {prediction ? (
              <motion.div 
                key="result"
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={springAnim}
                className="bg-slate-900/60 backdrop-blur-xl rounded-3xl p-8 flex-1 flex flex-col items-center justify-center border border-emerald-500/40 shadow-[0_0_30px_rgba(16,185,129,0.15)] relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-emerald-500/5 blur-3xl rounded-full scale-150"></div>
                
                <p className="text-emerald-400/80 mb-3 uppercase tracking-[0.2em] text-xs font-bold z-10">Optimal Target Crop</p>
                <h2 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white via-emerald-100 to-emerald-400 drop-shadow-sm mb-6 z-10 capitalize">
                  {prediction.crop}
                </h2>
                
                <div className="flex items-center gap-2 bg-emerald-500/10 px-5 py-2.5 rounded-full border border-emerald-500/20 z-10">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                  <p className="text-emerald-300 text-sm font-semibold tracking-wide">
                    Confidence Level: {prediction.confidence}
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="glass-panel rounded-3xl p-8 flex-1 flex flex-col items-center justify-center text-slate-500 border-dashed border-slate-700 border-2"
              >
                <FlaskConical className="w-12 h-12 mb-4 opacity-20" />
                <p className="text-sm font-medium tracking-wide">Awaiting Telemetry Data...</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

      </div>
    </main>
  );
}