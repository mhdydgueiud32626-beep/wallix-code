import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Check, 
  Download, 
  Sparkles, 
  Monitor, 
  Clock, 
  Sun, 
  Music, 
  Calendar, 
  Layers, 
  ArrowRight,
  ShieldCheck,
  FileJson,
  Keyboard,
  Minimize2
} from 'lucide-react';
import { DesktopPresetItem, DESKTOP_SKETCH_PRESETS } from '../data/layoutPresets';
import { downloadFile } from '../desktop/backgroundEngine';
import confetti from 'canvas-confetti';

interface PresetApplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  preset: DesktopPresetItem | null;
  onConfirmApplyToDesktop: (preset: DesktopPresetItem) => void;
}

export const PresetApplyModal: React.FC<PresetApplyModalProps> = ({
  isOpen,
  onClose,
  preset,
  onConfirmApplyToDesktop,
}) => {
  const [isApplying, setIsApplying] = useState(false);
  const [step, setStep] = useState<'confirm' | 'downloading' | 'applied'>('confirm');

  if (!isOpen || !preset) return null;

  const handleConfirm = () => {
    setIsApplying(true);
    setStep('downloading');

    // Simulate fast asset validation & layout initialization
    setTimeout(() => {
      setStep('applied');
      try {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.6 }
        });
      } catch {}

      setTimeout(() => {
        setIsApplying(false);
        setStep('confirm');
        onConfirmApplyToDesktop(preset);
      }, 1200);
    }, 1000);
  };

  const handleExportJson = () => {
    downloadFile(
      JSON.stringify(preset, null, 2),
      `${preset.id}_config.json`,
      'application/json'
    );
  };

  return (
    <div 
      id="wallix-preset-apply-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div 
        id="wallix-preset-apply-modal-content"
        className="relative w-full max-w-xl bg-zinc-950/95 border border-cyan-500/40 rounded-3xl p-6 md:p-8 shadow-2xl shadow-cyan-950/70 text-white overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glowing Background Orbs */}
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="space-y-2 mb-6">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-mono font-bold border border-cyan-400/40 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
              <span>{preset.sketchLabel}</span>
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-mono font-bold border border-emerald-400/30">
              Auto-Spawn Ready
            </span>
          </div>

          <h2 className="text-2xl font-black tracking-tight text-white">
            {preset.name}
          </h2>
          <p className="text-sm text-slate-300">
            {preset.description}
          </p>
        </div>

        {/* Visual Blueprint Diagram (Sketch Preview) */}
        <div className="p-4 rounded-2xl bg-black/60 border border-white/10 space-y-3 mb-6">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>LAYOUT BLUEPRINT</span>
            <span className="text-cyan-400">Clock: {preset.clockMode === 'analog' ? 'Analog Dial' : 'Digital HUD'}</span>
          </div>

          <div className="relative h-44 rounded-xl bg-zinc-900/90 border border-cyan-500/30 p-2 overflow-hidden flex flex-col justify-between">
            {/* Top Row Widgets */}
            <div className="flex justify-between items-start gap-2">
              <div className="p-2 rounded-lg bg-cyan-950/80 border border-cyan-400/40 text-cyan-300 text-[10px] font-mono flex items-center gap-1.5 shadow-sm">
                <Clock className="w-3.5 h-3.5 text-cyan-300" />
                <span>{preset.clockMode === 'analog' ? 'Analog Dial Clock' : '01:21:25 Digital Clock'}</span>
              </div>
              
              {preset.widgetsVisibility.weather && (
                <div className="p-2 rounded-lg bg-amber-950/70 border border-amber-400/40 text-amber-300 text-[10px] font-mono flex items-center gap-1.5 shadow-sm">
                  <Sun className="w-3.5 h-3.5 text-amber-300" />
                  <span>22°C Live Weather</span>
                </div>
              )}
            </div>

            {/* Middle Row Widgets */}
            <div className="flex justify-between items-center gap-2">
              {preset.widgetsVisibility.calendar ? (
                <div className="p-2 rounded-lg bg-indigo-950/70 border border-indigo-400/40 text-indigo-300 text-[10px] font-mono flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-indigo-300" />
                  <span>Calendar Grid</span>
                </div>
              ) : (
                <div className="p-2 rounded-lg bg-purple-950/70 border border-purple-400/40 text-purple-300 text-[10px] font-mono flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-300" />
                  <span>AI Companion</span>
                </div>
              )}

              {preset.widgetsVisibility.music && (
                <div className="p-2 rounded-lg bg-rose-950/70 border border-rose-400/40 text-rose-300 text-[10px] font-mono flex items-center gap-1.5">
                  <Music className="w-3.5 h-3.5 text-rose-300" />
                  <span>Audio Waveform</span>
                </div>
              )}
            </div>

            {/* Bottom Row / Dock */}
            {preset.widgetsVisibility.dock && (
              <div className="mx-auto px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-slate-300 text-[10px] font-mono flex items-center gap-2">
                <span>Apps: Terminal</span>
                <span>•</span>
                <span>Music</span>
                <span>•</span>
                <span>Browser</span>
                <span>•</span>
                <span>Finder</span>
              </div>
            )}
          </div>
        </div>

        {/* Confirmation Question / Banner */}
        <div className="p-3.5 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 text-xs text-slate-200 flex items-start gap-2.5 mb-6">
          <Minimize2 className="w-4 h-4 text-cyan-300 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-white">
              क्या आप इस Preset को डेस्कटॉप पर अप्लाई करना चाहते हैं?
            </p>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              अप्लाई करने पर ऐप बैकग्राउंड (System Tray) में चला जाएगा और डेस्कटॉप पर सीधे विगेट्स लोड हो जाएंगे। आप <kbd className="px-1.5 py-0.5 bg-black/60 border border-white/20 rounded text-[10px] font-mono text-cyan-300">Ctrl + Shift + W</kbd> या Tray Icon से कभी भी वापस आ सकते हैं।
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            onClick={handleExportJson}
            className="w-full sm:w-auto px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-slate-300 hover:text-white border border-white/10 text-xs font-mono font-bold flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <FileJson className="w-4 h-4 text-cyan-400" />
            <span>Export JSON</span>
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onClose}
              disabled={isApplying}
              className="px-5 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 text-xs font-bold transition cursor-pointer flex-1 sm:flex-initial"
            >
              Cancel
            </button>

            <button
              onClick={handleConfirm}
              disabled={isApplying}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-black text-xs shadow-lg shadow-cyan-500/30 transition cursor-pointer flex items-center justify-center gap-2 flex-1 sm:flex-initial"
            >
              {step === 'downloading' ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Applying Layout...</span>
                </>
              ) : step === 'applied' ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>Applied to Desktop!</span>
                </>
              ) : (
                <>
                  <Monitor className="w-4 h-4 text-cyan-200" />
                  <span>Yes, Apply to Desktop</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
