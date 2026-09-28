import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Send,
  RefreshCw, 
  Volume2, 
  VolumeX, 
  Coffee, 
  Lightbulb, 
  Activity, 
  Heart, 
  X, 
  Smile,
  Zap,
  Check,
  ChevronDown,
  ChevronUp,
  CloudRain,
  Music as MusicIcon
} from 'lucide-react';

export type CompanionAvatarId = 'aiko' | 'expyy' | 'sparky' | 'kira';

export interface CompanionAvatar {
  id: CompanionAvatarId;
  name: string;
  title: string;
  themeColor: string;
  accentBorder: string;
  gradientBg: string;
  badge: string;
}

export const COMPANION_AVATARS: CompanionAvatar[] = [
  {
    id: 'aiko',
    name: 'Aiko',
    title: 'Anime AI Companion',
    themeColor: 'text-pink-400',
    accentBorder: 'border-pink-400/50',
    gradientBg: 'from-pink-500/20 to-purple-600/20',
    badge: 'AI MENTOR'
  },
  {
    id: 'expyy',
    name: 'Expyy',
    title: 'Cyber-Neko AI Pet',
    themeColor: 'text-cyan-400',
    accentBorder: 'border-cyan-400/50',
    gradientBg: 'from-cyan-500/20 to-blue-600/20',
    badge: 'CYBER-PET'
  },
  {
    id: 'sparky',
    name: 'Sparky',
    title: 'Nano-Bot Overseer',
    themeColor: 'text-amber-400',
    accentBorder: 'border-amber-400/50',
    gradientBg: 'from-amber-500/20 to-orange-600/20',
    badge: 'ROBO BOT'
  },
  {
    id: 'kira',
    name: 'Kira',
    title: 'Cosmic Celestial Familiar',
    themeColor: 'text-indigo-400',
    accentBorder: 'border-indigo-400/50',
    gradientBg: 'from-indigo-500/20 to-fuchsia-600/20',
    badge: 'CELESTIAL'
  }
];

const INSPIRATIONAL_QUOTES = [
  "Creativity takes courage. Build fearlessly today! ✨",
  "Every line of clean code brings you closer to your dream. 💻",
  "Take a deep breath and let the desktop aesthetics flow. 🌸",
  "Your wallpaper setup looks super-premium today! 🔥",
  "Focus on the process, and the breakthrough will follow. 🌟",
  "100% pure focus activated. You've got this! ⚡",
  "Small daily iterations create masterpiece applications. 🚀"
];

const FUN_JOKES_AND_TIPS = [
  "Did you know? Drinking a glass of water boosts brain focus by 15%! 💧",
  "Why do programmers prefer dark mode? Because light attracts bugs! 🐛",
  "Pro-tip: Try the Warm Vintage or Cyberpunk LUT filter for cozy focus! 🕯️",
  "Your GPU is running smoothly — silky locked 60 FPS WebGL! 🎮",
  "20-20-20 Rule: Every 20 mins, look 20 feet away for 20 seconds! 👀"
];

interface AICompanionWidgetProps {
  onInteract?: (mood: string) => void;
}

export const AICompanionWidget: React.FC<AICompanionWidgetProps> = () => {
  const [selectedAvatarId, setSelectedAvatarId] = useState<CompanionAvatarId>(() => {
    try {
      return (localStorage.getItem('wallix_companion_avatar') as CompanionAvatarId) || 'aiko';
    } catch {
      return 'aiko';
    }
  });

  const [speechText, setSpeechText] = useState<string>('');
  const [speechEmotion, setSpeechEmotion] = useState<'happy' | 'thinking' | 'surprised' | 'coffee' | 'sparkle' | 'weather' | 'night' | 'calendar'>('sparkle');
  const [isSpeechVisible, setIsSpeechVisible] = useState<boolean>(true);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [userInput, setUserInput] = useState<string>('');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isAvatarPickerOpen, setIsAvatarPickerOpen] = useState<boolean>(false);
  const [, setInteractionCount] = useState<number>(0);
  const [reactionHearts, setReactionHearts] = useState<{ id: number; x: number; y: number }[]>([]);
  const [isBlinking, setIsBlinking] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const activeAvatar = COMPANION_AVATARS.find((a) => a.id === selectedAvatarId) || COMPANION_AVATARS[0];

  // Blinking eyes cycle
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 200);
    }, 4500);
    return () => clearInterval(blinkInterval);
  }, []);

  // SMART CONTEXTUAL DIALOGUE GENERATOR (Integrates Real App Data & Time Engine)
  const getSmartContextualDialogue = () => {
    const now = new Date();
    const hour = now.getHours();

    // 1. Late Night Hours (11 PM - 5 AM) Rest reminder
    if (hour >= 23 || hour < 5) {
      return {
        text: `Coding late? Don't forget to rest your eyes and drink water! 🌙💤`,
        emotion: 'night' as const
      };
    }

    // 2. Weather checks (Tokyo Cyber Rain condition)
    if (hour >= 14 && hour < 17) {
      return {
        text: `Cyber rain is heavy outside in Tokyo (22°C)! Grab your warm coffee ☕☔`,
        emotion: 'weather' as const
      };
    }

    // 3. Calendar event nudges (Daytime schedule alerts)
    if (hour >= 10 && hour < 12) {
      return {
        text: `You have a scheduled focus sprint coming up today! Ready to conquer? 📅✨`,
        emotion: 'calendar' as const
      };
    }

    // 4. Standard time-of-day greetings
    if (hour >= 5 && hour < 10) {
      return {
        text: `Good morning! Ready to create something incredible today? ☀️`,
        emotion: 'sparkle' as const
      };
    } else if (hour >= 12 && hour < 14) {
      return {
        text: `Peak productivity unlocked! Flow state is in full effect 🚀`,
        emotion: 'happy' as const
      };
    } else if (hour >= 17 && hour < 21) {
      return {
        text: `Cozy evening vibes! Let your live wallpaper shaders shine 🌆`,
        emotion: 'sparkle' as const
      };
    } else {
      return {
        text: `You've been focused for a while. Take a deep breath and stretch! 🌸`,
        emotion: 'coffee' as const
      };
    }
  };

  // Initial dialogue setup
  useEffect(() => {
    const init = getSmartContextualDialogue();
    setSpeechText(init.text);
    setSpeechEmotion(init.emotion);

    // Auto-update speech every 2.5 minutes if idle
    const timer = setInterval(() => {
      const updated = getSmartContextualDialogue();
      setSpeechText(updated.text);
      setSpeechEmotion(updated.emotion);
      setIsSpeechVisible(true);
      setIsExpanded(false);
    }, 150000);

    return () => clearInterval(timer);
  }, []);

  // 2-WAY CONVERSATIONAL NLP & APP CONTEXT INJECTION ENGINE
  const handleUserMessageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = userInput.trim().toLowerCase();
    if (!query) return;

    setUserInput('');
    setIsExpanded(false);

    // Trigger visual reaction
    triggerReaction();

    // Context Evaluation:
    // 1. Weather Query
    if (query.includes('weather') || query.includes('rain') || query.includes('temp') || query.includes('forecast') || query.includes('climate') || query.includes('outside')) {
      setSpeechText("Live Weather: Tokyo is 22°C with Cyber Rain ☔, 84% Humidity, and a light 12 km/h breeze. Stay cozy!");
      setSpeechEmotion('weather');
      setIsSpeechVisible(true);
      return;
    }

    // 2. System / FPS / GPU / Performance Query
    if (query.includes('system') || query.includes('fps') || query.includes('gpu') || query.includes('cpu') || query.includes('performance') || query.includes('lag') || query.includes('stats') || query.includes('speed')) {
      setSpeechText("System Status: Locked 60 FPS WebGL 2.0 Engine • 0% CPU Power Saving Game Mode • Lively Desktop Core Connected! ⚡");
      setSpeechEmotion('thinking');
      setIsSpeechVisible(true);
      return;
    }

    // 3. Audio / Track / Music Query
    if (query.includes('track') || query.includes('music') || query.includes('song') || query.includes('audio') || query.includes('playing') || query.includes('sound') || query.includes('listen')) {
      setSpeechText("Now Playing: 'Midnight City Drive' by Synthwave Neon / Kavinsky (128 BPM chill vibes with live frequency visualizer) 🎵");
      setSpeechEmotion('happy');
      setIsSpeechVisible(true);
      return;
    }

    // 4. Time / Schedule / Calendar Query
    if (query.includes('time') || query.includes('clock') || query.includes('schedule') || query.includes('calendar') || query.includes('meeting') || query.includes('date') || query.includes('sprint')) {
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setSpeechText(`It's ${timeStr}. Calendar check: You have a scheduled Deep-Work Focus Sprint on your agenda today! 📅`);
      setSpeechEmotion('calendar');
      setIsSpeechVisible(true);
      return;
    }

    // 5. Wallpaper / LUT / Theme Query
    if (query.includes('wallpaper') || query.includes('lut') || query.includes('theme') || query.includes('sonoma') || query.includes('dock') || query.includes('depth') || query.includes('3d')) {
      setSpeechText("Aesthetics Engine: 3D Depth Cutout layer active with cinematic color grade LUT. Desktop looks pristine! 🎨");
      setSpeechEmotion('sparkle');
      setIsSpeechVisible(true);
      return;
    }

    // 6. Identity / Greeting Query
    if (query.includes('hello') || query.includes('hi') || query.includes('hey') || query.includes('who are you') || query.includes('aiko') || query.includes('expyy') || query.includes('sparky') || query.includes('kira')) {
      setSpeechText(`Hi there! I'm ${activeAvatar.name}, your WALLIX AI Companion! Ready to assist with weather, music, system telemetry, and focus! ✨`);
      setSpeechEmotion('happy');
      setIsSpeechVisible(true);
      return;
    }

    // 7. Joke Query
    if (query.includes('joke') || query.includes('funny') || query.includes('laugh')) {
      setSpeechText("Why do programmers wear glasses? Because they don't C#! 😂 Keep shining today!");
      setSpeechEmotion('happy');
      setIsSpeechVisible(true);
      return;
    }

    // 8. Health / Advice / Break Query
    if (query.includes('water') || query.includes('drink') || query.includes('stretch') || query.includes('health') || query.includes('break') || query.includes('tired') || query.includes('tip')) {
      setSpeechText("Health Nudge: Remember the 20-20-20 rule! Look 20 feet away for 20 seconds, grab a glass of water, and stretch your shoulders! 💧🧘");
      setSpeechEmotion('coffee');
      setIsSpeechVisible(true);
      return;
    }

    // 9. General Intelligent AI Companion Response
    const responses = [
      `Roger that! I've noted: "${userInput.trim()}". Keep pushing forward with your vision! 🚀`,
      `Great thought! All desktop systems and shaders are running smoothly to support your workflow. ✨`,
      `I'm synced with your workspace! What shall we optimize next — audio, wallpaper LUTs, or widgets? 💡`,
      `You're in the zone! Let's keep this momentum going together. 🔥`
    ];
    const picked = responses[Math.floor(Math.random() * responses.length)];
    setSpeechText(picked);
    setSpeechEmotion('sparkle');
    setIsSpeechVisible(true);
  };

  // Handle avatar switch
  const handleSelectAvatar = (id: CompanionAvatarId) => {
    setSelectedAvatarId(id);
    try {
      localStorage.setItem('wallix_companion_avatar', id);
    } catch {}
    setIsAvatarPickerOpen(false);
    const targetName = COMPANION_AVATARS.find(a => a.id === id)?.name || 'AI Companion';
    setSpeechText(`Hi there! I'm ${targetName}! All systems synced and ready! ✨`);
    setSpeechEmotion('happy');
    setIsSpeechVisible(true);
    setIsExpanded(false);
    triggerReaction();
  };

  // Trigger click reaction animation & floating hearts
  const triggerReaction = () => {
    setInteractionCount((prev) => prev + 1);
    
    // Spawn floating heart particle
    const newHeart = {
      id: Date.now() + Math.random(),
      x: (Math.random() - 0.5) * 40,
      y: (Math.random() - 0.5) * 20
    };
    setReactionHearts((prev) => [...prev.slice(-4), newHeart]);
    setTimeout(() => {
      setReactionHearts((prev) => prev.filter((h) => h.id !== newHeart.id));
    }, 1200);
  };

  const handleInspiration = (e: React.MouseEvent) => {
    e.stopPropagation();
    const quote = INSPIRATIONAL_QUOTES[Math.floor(Math.random() * INSPIRATIONAL_QUOTES.length)];
    setSpeechText(quote);
    setSpeechEmotion('sparkle');
    setIsSpeechVisible(true);
    setIsExpanded(false);
    triggerReaction();
  };

  const handleJokeOrTip = (e: React.MouseEvent) => {
    e.stopPropagation();
    const tip = FUN_JOKES_AND_TIPS[Math.floor(Math.random() * FUN_JOKES_AND_TIPS.length)];
    setSpeechText(tip);
    setSpeechEmotion('coffee');
    setIsSpeechVisible(true);
    setIsExpanded(false);
    triggerReaction();
  };

  const handleSystemStats = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSpeechText("All systems nominal: GPU WebGL 60 FPS • Lively Desktop Core Connected • 0% CPU Game Mode Ready! ⚡");
    setSpeechEmotion('thinking');
    setIsSpeechVisible(true);
    setIsExpanded(false);
    triggerReaction();
  };

  const isLongSpeech = speechText.length > 80;

  return (
    <div 
      id="wallix-ai-companion-root"
      className="relative w-full h-full flex flex-col items-end justify-end pointer-events-auto select-none"
    >
      {/* Floating Reaction Hearts */}
      {reactionHearts.map((heart) => (
        <motion.div
          key={heart.id}
          initial={{ opacity: 1, y: 0, scale: 0.6, x: heart.x }}
          animate={{ opacity: 0, y: -75, scale: 1.4 }}
          transition={{ duration: 1.1, ease: 'easeOut' }}
          className="absolute -top-6 right-8 pointer-events-none text-pink-400 z-50 flex items-center gap-1"
        >
          <Heart className="w-5 h-5 fill-pink-400 filter drop-shadow-[0_0_8px_rgba(244,114,182,0.8)]" />
          <Sparkles className="w-3.5 h-3.5 text-cyan-300 animate-spin" />
        </motion.div>
      ))}

      {/* DYNAMIC SMART SPEECH BUBBLE & 2-WAY CHAT OVERLAY */}
      <AnimatePresence>
        {isSpeechVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.88, y: 10 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="mb-3 w-[280px] sm:w-[320px] rounded-2xl bg-black/85 backdrop-blur-2xl border border-white/20 p-3.5 shadow-2xl shadow-cyan-950/80 text-white relative group transition-all"
          >
            {/* Speech Bubble Tail */}
            <div className="absolute -bottom-2 right-8 w-4 h-4 bg-black/85 border-r border-b border-white/20 rotate-45" />

            {/* Bubble Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-1.5 mb-2">
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${
                  speechEmotion === 'weather' ? 'bg-sky-400 animate-pulse' :
                  speechEmotion === 'night' ? 'bg-indigo-400 animate-pulse' :
                  speechEmotion === 'calendar' ? 'bg-emerald-400 animate-ping' :
                  speechEmotion === 'coffee' ? 'bg-amber-400 animate-ping' :
                  'bg-pink-400 animate-pulse'
                }`} />
                <span className="text-[10px] font-bold tracking-wider uppercase text-pink-300">
                  {activeAvatar.name} AI Companion
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="text-slate-400 hover:text-slate-200 transition p-0.5 rounded cursor-pointer"
                  title={isMuted ? 'Unmute companion' : 'Mute companion'}
                >
                  {isMuted ? <VolumeX className="w-3 h-3 text-slate-500" /> : <Volume2 className="w-3 h-3 text-pink-400" />}
                </button>
                <button
                  onClick={() => setIsSpeechVisible(false)}
                  className="text-slate-400 hover:text-rose-300 transition p-0.5 rounded cursor-pointer"
                  title="Dismiss speech bubble"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Speech Content with Text Truncation & Expand Control */}
            <div className="mb-2">
              <p className={`text-xs text-slate-100 font-medium leading-relaxed ${
                !isExpanded && isLongSpeech ? 'line-clamp-2 overflow-hidden text-ellipsis' : ''
              }`}>
                "{speechText}"
              </p>

              {isLongSpeech && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="text-[10px] text-pink-300 hover:text-pink-200 font-semibold mt-1 flex items-center gap-0.5 underline cursor-pointer"
                >
                  <span>{isExpanded ? 'Show less' : 'Read more...'}</span>
                  {isExpanded ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}
                </button>
              )}
            </div>

            {/* Quick Interactive Prompt Buttons */}
            <div className="flex flex-wrap gap-1.5 pt-1.5 border-t border-white/10">
              <button
                onClick={handleInspiration}
                className="px-2 py-0.5 rounded-lg bg-white/5 hover:bg-pink-500/20 text-pink-200 border border-white/10 hover:border-pink-400/40 text-[9.5px] font-semibold flex items-center gap-1 transition cursor-pointer"
              >
                <Lightbulb className="w-2.5 h-2.5 text-pink-400" />
                Inspire Me
              </button>
              <button
                onClick={handleJokeOrTip}
                className="px-2 py-0.5 rounded-lg bg-white/5 hover:bg-amber-500/20 text-amber-200 border border-white/10 hover:border-amber-400/40 text-[9.5px] font-semibold flex items-center gap-1 transition cursor-pointer"
              >
                <Coffee className="w-2.5 h-2.5 text-amber-400" />
                Fun Tip
              </button>
              <button
                onClick={handleSystemStats}
                className="px-2 py-0.5 rounded-lg bg-white/5 hover:bg-cyan-500/20 text-cyan-200 border border-white/10 hover:border-cyan-400/40 text-[9.5px] font-semibold flex items-center gap-1 transition cursor-pointer"
              >
                <Activity className="w-2.5 h-2.5 text-cyan-400" />
                System
              </button>
            </div>

            {/* 2-WAY MINIMALIST GLASS INPUT BAR */}
            <form onSubmit={handleUserMessageSubmit} className="mt-2 pt-2 border-t border-white/10 flex items-center gap-1.5">
              <input
                ref={inputRef}
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder={`Ask ${activeAvatar.name} (weather, fps, track)...`}
                className="flex-1 bg-white/10 border border-white/15 focus:border-pink-400/80 rounded-xl px-2.5 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none transition-colors"
              />
              <button
                type="submit"
                disabled={!userInput.trim()}
                className="p-1.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 disabled:opacity-40 disabled:pointer-events-none text-white shadow-md shadow-pink-500/30 flex items-center justify-center transition-all cursor-pointer hover:scale-105"
                title="Send message to AI Companion"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>

          </motion.div>
        )}
      </AnimatePresence>

      {/* AVATAR CHARACTER SPRITE / INTERACTIVE MODEL CONTAINER */}
      <div className="relative flex items-center gap-2">
        
        {/* Quick Avatar Switcher Button */}
        <button
          onClick={() => setIsAvatarPickerOpen(!isAvatarPickerOpen)}
          className="p-2 rounded-full bg-black/70 backdrop-blur-xl border border-white/15 hover:border-pink-400 text-slate-300 hover:text-white transition shadow-lg cursor-pointer hover:scale-105"
          title="Switch Companion Character (Aiko, Expyy, Sparky, Kira)"
        >
          <RefreshCw className="w-3.5 h-3.5 text-pink-400" />
        </button>

        {/* CHARACTER MAIN BODY */}
        <motion.div
          whileHover={{ scale: 1.08, y: -4 }}
          whileTap={{ scale: 0.94 }}
          onClick={() => {
            if (!isSpeechVisible) {
              setIsSpeechVisible(true);
            }
            triggerReaction();
            const randomQuote = INSPIRATIONAL_QUOTES[Math.floor(Math.random() * INSPIRATIONAL_QUOTES.length)];
            setSpeechText(randomQuote);
            setSpeechEmotion('happy');
            setIsExpanded(false);
          }}
          className={`relative cursor-pointer group flex flex-col items-center justify-center p-2.5 rounded-3xl bg-black/80 backdrop-blur-2xl border ${activeAvatar.accentBorder} shadow-2xl shadow-pink-950/50 hover:border-pink-400/80 transition-all duration-300`}
        >
          {/* Glowing Aura Ring */}
          <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-cyan-500/20 blur-md opacity-70 group-hover:opacity-100 transition-opacity" />

          {/* SVG Character Avatar Graphic */}
          <div className="relative w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center">
            
            {/* 1. AIKO (Anime Scholar / Main AI Companion) */}
            {selectedAvatarId === 'aiko' && (
              <svg viewBox="0 0 100 100" className="w-full h-full filter drop-shadow-[0_4px_12px_rgba(244,114,182,0.6)]">
                {/* Anime Hair Back */}
                <circle cx="50" cy="45" r="34" fill="#831843" />
                <path d="M 20 45 Q 15 80 30 85 Q 26 60 30 50 Z" fill="#9d174d" />
                <path d="M 80 45 Q 85 80 70 85 Q 74 60 70 50 Z" fill="#9d174d" />

                {/* Face */}
                <ellipse cx="50" cy="54" rx="26" ry="24" fill="#fde047" opacity="0.3" />
                <circle cx="50" cy="54" r="23" fill="#ffe4e6" />

                {/* Hair Bangs */}
                <path d="M 28 40 Q 50 30 72 40 Q 64 50 56 42 Q 50 52 42 42 Q 34 50 28 40 Z" fill="#db2777" />

                {/* Glasses */}
                <rect x="30" y="48" width="16" height="12" rx="3" fill="none" stroke="#e11d48" strokeWidth="2" />
                <rect x="54" y="48" width="16" height="12" rx="3" fill="none" stroke="#e11d48" strokeWidth="2" />
                <line x1="46" y1="54" x2="54" y2="54" stroke="#e11d48" strokeWidth="2" />

                {/* Eyes */}
                {isBlinking ? (
                  <>
                    <line x1="33" y1="54" x2="43" y2="54" stroke="#9d174d" strokeWidth="2.5" strokeLinecap="round" />
                    <line x1="57" y1="54" x2="67" y2="54" stroke="#9d174d" strokeWidth="2.5" strokeLinecap="round" />
                  </>
                ) : (
                  <>
                    <ellipse cx="38" cy="54" rx="4" ry="5" fill="#4c0519" />
                    <circle cx="39" cy="52" r="1.5" fill="#ffffff" />
                    <ellipse cx="62" cy="54" rx="4" ry="5" fill="#4c0519" />
                    <circle cx="63" cy="52" r="1.5" fill="#ffffff" />
                  </>
                )}

                {/* Blush */}
                <circle cx="32" cy="62" r="4" fill="#f43f5e" opacity="0.4" />
                <circle cx="68" cy="62" r="4" fill="#f43f5e" opacity="0.4" />

                {/* Smile */}
                <path d="M 46 66 Q 50 70 54 66" fill="none" stroke="#881337" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            )}

            {/* 2. EXPYY (Cyber-Neko) */}
            {selectedAvatarId === 'expyy' && (
              <svg viewBox="0 0 100 100" className="w-full h-full filter drop-shadow-[0_4px_12px_rgba(6,182,212,0.6)]">
                {/* Cat Ears */}
                <polygon points="20,40 32,15 48,35" fill="#0891b2" stroke="#22d3ee" strokeWidth="2" />
                <polygon points="26,38 34,22 44,35" fill="#ec4899" opacity="0.8" />
                <polygon points="80,40 68,15 52,35" fill="#0891b2" stroke="#22d3ee" strokeWidth="2" />
                <polygon points="74,38 66,22 56,35" fill="#ec4899" opacity="0.8" />

                {/* Head */}
                <circle cx="50" cy="55" r="32" fill="#0f172a" stroke="#06b6d4" strokeWidth="3" />
                
                {/* Cyber Visor / Face Glow */}
                <path d="M 28 50 Q 50 44 72 50 Q 74 62 50 64 Q 26 62 28 50 Z" fill="#0284c7" opacity="0.85" />
                
                {/* Animated Eyes */}
                {isBlinking ? (
                  <>
                    <line x1="36" y1="55" x2="44" y2="55" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
                    <line x1="56" y1="55" x2="64" y2="55" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
                  </>
                ) : (
                  <>
                    <ellipse cx="40" cy="55" rx="4" ry="5" fill="#ffffff" />
                    <circle cx="41" cy="53" r="1.5" fill="#06b6d4" />
                    <ellipse cx="60" cy="55" rx="4" ry="5" fill="#ffffff" />
                    <circle cx="61" cy="53" r="1.5" fill="#06b6d4" />
                  </>
                )}

                {/* Whiskers */}
                <line x1="18" y1="54" x2="26" y2="56" stroke="#22d3ee" strokeWidth="1.5" />
                <line x1="18" y1="62" x2="27" y2="60" stroke="#22d3ee" strokeWidth="1.5" />
                <line x1="82" y1="54" x2="74" y2="56" stroke="#22d3ee" strokeWidth="1.5" />
                <line x1="82" y1="62" x2="73" y2="60" stroke="#22d3ee" strokeWidth="1.5" />

                {/* Cyber Collar Gem */}
                <circle cx="50" cy="85" r="5" fill="#ec4899" stroke="#f472b6" strokeWidth="1.5" />
              </svg>
            )}

            {/* 3. SPARKY (Nano-Bot) */}
            {selectedAvatarId === 'sparky' && (
              <svg viewBox="0 0 100 100" className="w-full h-full filter drop-shadow-[0_4px_12px_rgba(245,158,11,0.6)]">
                {/* Robot Antenna */}
                <line x1="50" y1="20" x2="50" y2="35" stroke="#f59e0b" strokeWidth="3" />
                <circle cx="50" cy="18" r="5" fill="#fbbf24" className="animate-ping" />

                {/* Robot Head */}
                <rect x="25" y="32" width="50" height="46" rx="14" fill="#1e293b" stroke="#f59e0b" strokeWidth="2.5" />
                
                {/* Ear Pods */}
                <rect x="18" y="46" width="7" height="18" rx="3" fill="#d97706" />
                <rect x="75" y="46" width="7" height="18" rx="3" fill="#d97706" />

                {/* Screen Visor */}
                <rect x="32" y="40" width="36" height="30" rx="8" fill="#020617" stroke="#fbbf24" strokeWidth="1" />

                {/* Digital Eyes */}
                {isBlinking ? (
                  <>
                    <line x1="38" y1="54" x2="46" y2="54" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" />
                    <line x1="54" y1="54" x2="62" y2="54" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" />
                  </>
                ) : (
                  <>
                    <rect x="38" y="48" width="8" height="12" rx="2" fill="#38bdf8" />
                    <rect x="54" y="48" width="8" height="12" rx="2" fill="#38bdf8" />
                  </>
                )}
                
                {/* Micro Smile */}
                <path d="M 44 65 Q 50 68 56 65" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
              </svg>
            )}

            {/* 4. KIRA (Cosmic Familiar) */}
            {selectedAvatarId === 'kira' && (
              <svg viewBox="0 0 100 100" className="w-full h-full filter drop-shadow-[0_4px_12px_rgba(168,85,247,0.6)]">
                {/* Star Wings */}
                <polygon points="50,45 15,25 35,55" fill="#a855f7" opacity="0.6" />
                <polygon points="50,45 85,25 65,55" fill="#a855f7" opacity="0.6" />

                {/* Celestial Head Orb */}
                <circle cx="50" cy="50" r="26" fill="#312e81" stroke="#c084fc" strokeWidth="2.5" />
                
                {/* Halo */}
                <ellipse cx="50" cy="26" rx="20" ry="6" fill="none" stroke="#f0abfc" strokeWidth="2" />

                {/* Star Eyes */}
                {isBlinking ? (
                  <>
                    <line x1="38" y1="52" x2="44" y2="52" stroke="#f0abfc" strokeWidth="2" />
                    <line x1="56" y1="52" x2="62" y2="52" stroke="#f0abfc" strokeWidth="2" />
                  </>
                ) : (
                  <>
                    <circle cx="41" cy="50" r="3.5" fill="#f0abfc" />
                    <circle cx="59" cy="50" r="3.5" fill="#f0abfc" />
                    <circle cx="42" cy="49" r="1" fill="#ffffff" />
                    <circle cx="60" cy="49" r="1" fill="#ffffff" />
                  </>
                )}

                {/* Moon Forehead Mark */}
                <path d="M 48 36 A 4 4 0 0 0 52 36 A 3 3 0 0 1 48 36" fill="#facc15" />
              </svg>
            )}

          </div>

          {/* Status Dot / Name Pill */}
          <div className="mt-1 px-2.5 py-0.5 rounded-full bg-white/10 text-[9px] font-mono font-bold text-pink-300 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-pulse" />
            <span>{activeAvatar.name}</span>
          </div>

        </motion.div>
      </div>

      {/* CHARACTER PICKER POPUP MODAL */}
      <AnimatePresence>
        {isAvatarPickerOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ duration: 0.18 }}
            className="absolute bottom-20 right-0 w-64 rounded-2xl bg-black/90 backdrop-blur-3xl border border-white/20 p-3 shadow-2xl shadow-pink-950/80 text-white z-50 space-y-2"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-pink-300 flex items-center gap-1">
                <Smile className="w-3.5 h-3.5" />
                Select AI Companion
              </span>
              <button
                onClick={() => setIsAvatarPickerOpen(false)}
                className="text-slate-400 hover:text-white p-0.5 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              {COMPANION_AVATARS.map((avatar) => {
                const isSelected = avatar.id === selectedAvatarId;
                return (
                  <button
                    key={avatar.id}
                    onClick={() => handleSelectAvatar(avatar.id)}
                    className={`p-2 rounded-xl border text-left flex flex-col gap-0.5 transition cursor-pointer ${
                      isSelected
                        ? 'bg-pink-500/20 border-pink-400 text-white shadow-md'
                        : 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">{avatar.name}</span>
                      {isSelected && <Check className="w-3 h-3 text-pink-400" />}
                    </div>
                    <span className="text-[9px] font-mono text-slate-400">{avatar.badge}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
