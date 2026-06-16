import React, { useEffect, useState } from 'react';
import { Subject } from '../types';
import { Calendar, Clock, AlertTriangle, ShieldAlert } from 'lucide-react';

interface ExamCountdownWidgetProps {
  subjects: Subject[];
}

export default function ExamCountdownWidget({ subjects }: ExamCountdownWidgetProps) {
  const [timeNow, setTimeNow] = useState(new Date());

  useEffect(() => {
    const timerId = setInterval(() => {
      setTimeNow(new Date());
    }, 1000);
    return () => clearInterval(timerId);
  }, []);

  const subjectsWithExams = subjects.filter(s => !!s.examDate).map(sub => {
    // Calculate remaining milliseconds
    const examDateStr = `${sub.examDate}T09:00:00`; // Standard exam starts at 9AM
    const examTime = new Date(examDateStr).getTime();
    const diffMs = examTime - timeNow.getTime();

    let textCountdown = 'Passed / Started';
    let labelColor = 'text-gray-400 bg-gray-50';
    let statusClass = 'border-gray-100';
    let roundedPercent = 100;
    let labelText = 'Completed';

    if (diffMs > 0) {
      const d = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const h = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diffMs % (1000 * 60)) / 1000);

      textCountdown = `${d}d : ${String(h).padStart(2, '0')}h : ${String(m).padStart(2, '0')}m : ${String(s).padStart(2, '0')}s`;

      // Define standard status levels
      if (d <= 3) {
        labelColor = 'text-red-700 bg-red-50 dark:bg-red-950/20';
        labelText = '🔴 Final stretch';
        statusClass = 'border-red-200 shadow-md animate-pulse';
      } else if (d <= 10) {
        labelColor = 'text-amber-700 bg-amber-50 dark:bg-amber-950/20';
        labelText = '🟡 Getting close';
        statusClass = 'border-amber-200';
      } else {
        labelColor = 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/20';
        labelText = '🟢 Plenty of time';
        statusClass = 'border-emerald-200';
      }

      // Progress calculation from current time and hypothetical creation days (e.g. 30 days scale)
      const daysTotalScale = 30; // standard semester planning range
      const daysElapsed = Math.max(0, daysTotalScale - d);
      roundedPercent = Math.min(100, Math.round((daysElapsed / daysTotalScale) * 100));
    }

    return {
      sub,
      diffMs,
      labelText,
      labelColor,
      statusClass,
      roundedPercent,
      textCountdown
    };
  }).sort((a, b) => a.diffMs - b.diffMs); // Sort upcoming ones to the top

  return (
    <div className="bg-white dark:bg-maroon-900/40 p-6 rounded-3xl border-l-8 border-peach-400 shadow-sm space-y-4" id="exam-countdowns-registry">
      <div>
        <h3 className="text-sm font-bold text-maroon-800 dark:text-peach-300 uppercase tracking-wider flex items-center gap-2">
          ⏰ Live Exam Countdown Timers
        </h3>
        <p className="text-xs text-maroon-800/60 dark:text-peach-200/60 mt-0.5">
          Real-time seconds tickers reminding you of milestone examination deadlines
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {subjectsWithExams.slice(0, 4).map(({ sub, labelText, labelColor, statusClass, roundedPercent, textCountdown, diffMs }) => (
          <div
            key={sub.id}
            className={`p-4 bg-cream/35 dark:bg-maroon-950/10 rounded-2xl border transition-all ${statusClass}`}
          >
            <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
              <span 
                className="text-[10px] font-black px-2.5 py-0.5 rounded-lg text-white uppercase tracking-wider"
                style={{ backgroundColor: sub.color }}
              >
                {sub.name}
              </span>
              <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded-lg tracking-wide ${labelColor}`}>
                {labelText}
              </span>
            </div>

            {/* Live Ticker Clock */}
            <div className="text-sm font-black text-maroon-800 dark:text-white font-mono mt-2 tracking-wider flex items-center gap-1.5 p-1 px-2.5 bg-white justify-center dark:bg-maroon-900/20 border border-maroon-800/5 rounded-xl">
              <Clock size={13} className="text-maroon-800 animate-spin-slow shrink-0" />
              <span>{textCountdown}</span>
            </div>

            {/* countdown progress bar */}
            {diffMs > 0 && (
              <div className="space-y-1 mt-3">
                <div className="w-full bg-peach-100/30 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-peach-400 h-full rounded-full transition-all duration-1000" 
                    style={{ width: `${roundedPercent}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-[8px] font-mono text-maroon-800/40">
                  <span>Days elapsed: {roundedPercent}%</span>
                  <span>Exam: {sub.examDate}</span>
                </div>
              </div>
            )}
          </div>
        ))}

        {subjectsWithExams.length === 0 && (
          <div className="col-span-full py-8 text-center bg-cream/20 border border-dashed border-maroon-800/10 rounded-2xl flex flex-col items-center justify-center">
            <Calendar className="text-maroon-800/20 mb-2" size={28} />
            <p className="text-xs font-bold text-maroon-800/50">No Exam Dates Configured</p>
            <p className="text-[10px] text-maroon-800/40 max-w-xs leading-relaxed mt-0.5">
              Select Subjects tab, click Edit, and add target dates to launch scheduled exam timers.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
