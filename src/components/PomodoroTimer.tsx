import React, { useState, useEffect, useRef } from 'react';
import { Subject, PomodoroMode, PomodoroLog } from '../types';
import { Play, Pause, RotateCcw, Award, Zap, BookOpen, Star, Sparkles, Volume2 } from 'lucide-react';
import { playBellSound, getWeekAndYear } from '../utils';

interface PomodoroTimerProps {
  subjects: Subject[];
  onLogSession: (subjectId: string, duration: number, rating: number) => void;
  onShowToast: (message: string, type: 'success' | 'info' | 'warning') => void;
}

export default function PomodoroTimer({
  subjects,
  onLogSession,
  onShowToast,
}: PomodoroTimerProps) {
  // Mode parameters (minutes)
  const MODE_TIMES: Record<PomodoroMode, number> = {
    'Focus': 25,
    'Short Break': 5,
    'Long Break': 15,
  };

  const [mode, setMode] = useState<PomodoroMode>('Focus');
  const [timeLeft, setTimeLeft] = useState(MODE_TIMES['Focus'] * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [completedCycles, setCompletedCycles] = useState(0);

  // Focus Log Modal State
  const [showLogModal, setShowLogModal] = useState(false);
  const [logSubjectId, setLogSubjectId] = useState('');
  const [logRating, setLogRating] = useState(4);

  // Time ticks ref
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Hydrate Timer when mode shifts
  useEffect(() => {
    setTimeLeft(MODE_TIMES[mode] * 60);
    setIsRunning(false);
  }, [mode]);

  // Main countdown logic
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // Timer Complete!
            clearInterval(timerRef.current!);
            setIsRunning(false);
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, mode]);

  // Spacebar Keyboard Shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Do not trigger if user is writing in any form fields
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        document.activeElement?.tagName === 'SELECT'
      ) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault(); // prevent scrolling
        setIsRunning(prev => !prev);
        onShowToast(!isRunning ? 'Timer Started' : 'Timer Paused', 'info');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isRunning]);

  const handleTimerComplete = () => {
    playBellSound();
    onShowToast(`🎉 Session Complete: ${mode} session completed!`, 'success');

    if (mode === 'Focus') {
      setCompletedCycles((prev) => prev + 1);
      // Auto switch candidate, but open Dialog to rate focus first
      setShowLogModal(true);
    } else {
      // Switch back to Focus after completed break
      setMode('Focus');
    }
  };

  const handleLogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!logSubjectId) {
      onShowToast('Please select the subject you studied', 'warning');
      return;
    }

    const duration = MODE_TIMES['Focus'];
    onLogSession(logSubjectId, duration, logRating);
    onShowToast('Productivity logs updated successfully!', 'success');
    
    // Close modal and transition to next session
    setShowLogModal(false);
    // Auto-switch modes: standard Pomorodo: after Focus -> show short break (unless cycles reaches 4, then long break)
    const nextMode = (completedCycles % 4 === 0) ? 'Long Break' : 'Short Break';
    setMode(nextMode);
  };

  const handleSkipLog = () => {
    setShowLogModal(false);
    const nextMode = (completedCycles % 4 === 0) ? 'Long Break' : 'Short Break';
    setMode(nextMode);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(MODE_TIMES[mode] * 60);
    onShowToast('Session timers reset', 'info');
  };

  // Sound test button
  const triggerBellTest = () => {
    playBellSound();
    onShowToast('Ding! Bell test triggered.', 'success');
  };

  // Progress circle computations
  const totalDuration = MODE_TIMES[mode] * 60;
  const progressRatio = timeLeft / totalDuration;
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progressRatio);

  // Time format
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const cycleDisplay = `Pomodoro ${Math.min(4, (completedCycles % 4) + 1)} of 4`;

  return (
    <div className="bg-white p-6 rounded-xl shadow-xs border border-gray-100 flex flex-col items-center justify-center space-y-6" id="pomodoro-timer-section">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-maroon-800 tracking-tight">Focus Pomodoro</h2>
        <p className="text-sm text-gray-500 mt-1">Harness flow-state using strategic rest-and-focus iterations</p>
      </div>

      {/* Mode Switches */}
      <div className="flex gap-1.5 p-1 bg-peach-50 rounded-xl" id="timer-mode-buttons">
        {(['Focus', 'Short Break', 'Long Break'] as PomodoroMode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              mode === m
                ? 'bg-maroon-800 text-white shadow-xs'
                : 'text-maroon-900 hover:bg-peach-100'
            }`}
          >
            {m === 'Focus' ? '🎯 Focus' : m === 'Short Break' ? '☕ Short Break' : '🌴 Long Break'}
          </button>
        ))}
      </div>

      {/* Countdown Ring */}
      <div className="relative w-48 h-48 flex items-center justify-center" id="countdown-ring-block">
        <svg className="w-full h-full transform -rotate-90">
          {/* Base gray background path */}
          <circle
            cx="96"
            cy="96"
            r={radius}
            stroke="#f5ebe6"
            strokeWidth="8"
            fill="transparent"
          />
          {/* Depleting maroon progress path */}
          <circle
            cx="96"
            cy="96"
            r={radius}
            stroke="#800020"
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-300 ease-linear"
          />
        </svg>

        {/* Center Digital Clock */}
        <div className="absolute text-center">
          <span className="text-3xl font-black text-maroon-800 font-mono tracking-tight block">
            {formatTime(timeLeft)}
          </span>
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mt-0.5">
            {mode === 'Focus' ? 'Studying' : 'Resting'}
          </span>
        </div>
      </div>

      {/* Core Controls */}
      <div className="flex items-center gap-4">
        {/* Reset */}
        <button
          onClick={handleReset}
          className="p-3 text-gray-400 hover:text-maroon-800 hover:bg-gray-100 rounded-lg transition cursor-pointer"
          title="Reset timer"
        >
          <RotateCcw size={20} />
        </button>

        {/* Toggle Play Pause */}
        <button
          onClick={() => {
            setIsRunning(!isRunning);
            onShowToast(isRunning ? 'Timer Paused' : 'Timer Running', 'info');
          }}
          className="bg-maroon-800 hover:bg-maroon-900 text-white p-4 rounded-full transition shadow-md hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center cursor-pointer"
          title={isRunning ? 'Pause (Space)' : 'Play (Space)'}
        >
          {isRunning ? <Pause size={24} className="fill-white" /> : <Play size={24} className="fill-white" />}
        </button>

        {/* Bell Sound Test */}
        <button
          onClick={triggerBellTest}
          className="p-3 text-gray-400 hover:text-maroon-800 hover:bg-gray-100 rounded-lg transition cursor-pointer"
          title="Test Bell Notification Audio"
        >
          <Volume2 size={20} />
        </button>
      </div>

      {/* Cycle Indicator & Shortcut Tips */}
      <div className="text-center space-y-2 border-t border-gray-100 pt-4 w-full">
        <div className="text-xs font-bold text-gray-700 font-display flex items-center justify-center gap-1.5">
          <Award size={14} className="text-[#800020]" />
          <span>{cycleDisplay}</span>
          <span className="text-[10px] bg-peach-100 text-maroon-900 px-1.5 py-0.5 rounded ml-1 font-mono">
            {completedCycles} focus session(s)
          </span>
        </div>
        <p className="text-[11px] text-gray-400 font-medium">
          💡 Keyboard tip: Tap <kbd className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 border border-gray-200">Space</kbd> anytime to Pause/Resume countdown.
        </p>
      </div>

      {/* FOCUS LOG DIALOG / MODAL */}
      {showLogModal && (
        <div className="fixed inset-0 bg-transparent flex items-center justify-center p-4 z-50 animate-fadeIn" id="focus-log-modal-container">
          <div className="absolute inset-0 bg-maroon-950/40 backdrop-blur-xs" onClick={handleSkipLog}></div>
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border-t-8 border-maroon-800 relative z-10 animate-scaleUp">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="text-peach-500 fill-peach-400" size={24} />
              <h3 className="text-lg font-bold text-maroon-800 font-display">Log Your Study Focus</h3>
            </div>
            
            <p className="text-xs text-gray-500 mb-4 leading-relaxed">
              Fantastic work completing this focus session! Let’s record what you worked on to evaluate your weekly productivity and study trends.
            </p>

            <form onSubmit={handleLogSubmit} className="space-y-4">
              {/* Subject */}
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">WHICH CRITERION / SUBJECT?</label>
                <select
                  value={logSubjectId}
                  onChange={(e) => setLogSubjectId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-maroon-800"
                  required
                >
                  <option value="">-- Choose Subject --</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              {/* Rating */}
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5">FOCUS QUALITY RATING (1-5)</label>
                <div className="flex items-center gap-2 justify-center py-2 bg-gray-50 rounded-lg">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setLogRating(star)}
                      className="text-amber-400 hover:scale-120 transition focus:outline-none cursor-pointer"
                      title={`${star} Star Rating`}
                    >
                      <Star size={24} fill={logRating >= star ? '#f59e0b' : 'none'} stroke="#f59e0b" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3.5 pt-3 border-t border-gray-50">
                <button
                  type="button"
                  onClick={handleSkipLog}
                  className="px-4 py-2 text-xs font-medium text-gray-500 hover:bg-gray-100 rounded-lg transition"
                >
                  Skip Log
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-maroon-800 hover:bg-maroon-900 text-white rounded-lg shadow"
                >
                  Confirm Study Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
