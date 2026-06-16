import React, { useState } from 'react';
import { PomodoroLog, Subject } from '../types';

interface StudyHeatmapProps {
  pomodoroLogs: PomodoroLog[];
  subjects: Subject[];
}

export default function StudyHeatmap({ pomodoroLogs, subjects }: StudyHeatmapProps) {
  const [hoveredDay, setHoveredDay] = useState<{
    dateStr: string;
    hours: number;
    subjectsList: string[];
    x: number;
    y: number;
  } | null>(null);

  // Focus reference date: 2026-06-16
  const today = new Date('2026-06-16T12:00:00');

  // Let's generate a flat list of 12 weeks * 7 days = 84 days ending on today (or Sunday of the current week)
  // To make the grid structured mathematically:
  // Let's find the current day's weekday. Mon = 1, Tue = 2... Sun = 0. Let's map so Monday is the top of the column.
  const dayOfWeek = today.getDay() === 0 ? 6 : today.getDay() - 1; // Mon=0, Tue=1, ..., Sun=6
  
  // We want to generate a grid of 12 columns and 7 rows.
  // The bottom-right square represents Sunday of the current week (or today).
  // Let's generate 84 dates.
  const datesGrid: Date[][] = []; // 7 rows (Mon-Sun), 12 columns
  for (let r = 0; r < 7; r++) {
    datesGrid[r] = [];
  }

  // To find the Monday of the week 11 weeks ago, we backtrack:
  // Backtrack to current week's Monday, then subtract 11 weeks.
  const currentMonday = new Date(today);
  currentMonday.setDate(today.getDate() - dayOfWeek);

  const startMonday = new Date(currentMonday);
  startMonday.setDate(currentMonday.getDate() - 11 * 7); // Go back 11 weeks

  for (let col = 0; col < 12; col++) {
    for (let r = 0; r < 7; r++) {
      const d = new Date(startMonday);
      d.setDate(startMonday.getDate() + col * 7 + r);
      datesGrid[r][col] = d;
    }
  }

  // Pre-calculate study hours per day
  // Format: YYYY-MM-DD -> { duration: mins, subjectIds: Set<string> }
  const studyMap: Record<string, { duration: number; subjectIds: Set<string> }> = {};

  pomodoroLogs.forEach(log => {
    try {
      const dateStr = new Date(log.timestamp).toISOString().split('T')[0];
      if (!studyMap[dateStr]) {
        studyMap[dateStr] = { duration: 0, subjectIds: new Set() };
      }
      studyMap[dateStr].duration += log.duration;
      studyMap[dateStr].subjectIds.add(log.subjectId);
    } catch (e) {
      // Ignore invalid date strings
    }
  });

  const getHeatColor = (hours: number) => {
    if (hours === 0) return 'bg-[#FFF5EE] dark:bg-maroon-900/20 border-maroon-800/10 border';
    if (hours < 1) return 'bg-[#FFD9C0] border-maroon-800/10 border'; // very light peach
    if (hours < 3) return 'bg-[#FFB085] border-maroon-800/15 border'; // medium peach
    if (hours < 5) return 'bg-[#D96B43] text-white border-maroon-800/20 border'; // dark peach
    return 'bg-[#800020] text-peach-100 border-maroon-950/20 border'; // maroon peak
  };

  const weekdays = ['Mon', 'Wed', 'Fri', 'Sun'];

  return (
    <div className="bg-white dark:bg-maroon-900/40 p-6 rounded-3xl shadow-sm border-l-8 border-maroon-800 space-y-4 relative" id="heatmap-analytics-panel">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-sm font-bold text-maroon-800 dark:text-peach-300 uppercase tracking-wider flex items-center gap-2">
            📊 GitHub-Style Study Heatmap
          </h3>
          <p className="text-xs text-maroon-800/60 dark:text-peach-200/60 mt-0.5">
            Visualize your consistent study density over the past 12 weeks
          </p>
        </div>
        
        {/* Colors Legend representation */}
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-maroon-800/70 dark:text-peach-200/70">
          <span>Less</span>
          <div className="w-3 h-3 rounded bg-[#FFF5EE] border border-maroon-800/10"></div>
          <div className="w-3 h-3 rounded bg-[#FFD9C0]"></div>
          <div className="w-3 h-3 rounded bg-[#FFB085]"></div>
          <div className="w-3 h-3 rounded bg-[#D96B43]"></div>
          <div className="w-3 h-3 rounded bg-[#800020]"></div>
          <span>More</span>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-start md:items-center gap-4 overflow-x-auto pb-2">
        {/* Row Label header */}
        <div className="flex md:flex-col gap-2 md:gap-1 text-[10px] font-mono text-maroon-800/40 dark:text-peach-200/40 w-8 pr-1 mt-1 shrink-0">
          <span>Mon</span>
          <span className="hidden md:inline"></span>
          <span>Wed</span>
          <span className="hidden md:inline"></span>
          <span>Fri</span>
          <span className="hidden md:inline"></span>
          <span>Sun</span>
        </div>

        {/* Heat Grid blocks */}
        <div className="flex-1 min-w-0">
          <div className="grid grid-rows-7 grid-flow-col gap-1.5" style={{ gridAutoColumns: 'minmax(14px, 1fr)' }}>
            {datesGrid.map((row, rIdx) =>
              row.map((date, colIdx) => {
                const dateStr = date.toISOString().split('T')[0];
                const stats = studyMap[dateStr] || { duration: 0, subjectIds: new Set<string>() };
                const hours = parseFloat((stats.duration / 60).toFixed(2));
                const subjectNames = Array.from(stats.subjectIds).map(id => {
                  const s = subjects.find(sub => sub.id === id);
                  return s ? s.name : 'Unknown';
                });

                return (
                  <div
                    key={`${rIdx}-${colIdx}`}
                    className={`w-4 h-4 rounded-md transition-all duration-150 cursor-pointer ${getHeatColor(hours)} hover:scale-125 hover:rotate-3 relative`}
                    onMouseEnter={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const parentRect = e.currentTarget.offsetParent?.getBoundingClientRect() || { left: 0, top: 0 };
                      setHoveredDay({
                        dateStr,
                        hours,
                        subjectsList: subjectNames,
                        x: rect.left - parentRect.left + 8,
                        y: rect.top - parentRect.top - 70
                      });
                    }}
                    onMouseLeave={() => setHoveredDay(null)}
                  />
                );
              })
            )}
          </div>
          
          {/* Months label track */}
          <div className="flex justify-between text-[9px] font-mono font-bold text-maroon-800/45 dark:text-peach-200/40 mt-2 px-1">
            <span>Mar</span>
            <span>Apr</span>
            <span>May</span>
            <span>Jun (Today)</span>
          </div>
        </div>
      </div>

      {/* Grid Hover tooltip template floating */}
      {hoveredDay && (
        <div
          className="absolute z-50 bg-maroon-900 text-[#FFF5EE] p-3 rounded-xl shadow-xl border border-peach-400/20 text-xs w-48 pointer-events-none transition-opacity duration-150 animate-fadeIn"
          style={{
            left: `${hoveredDay.x}px`,
            top: `${hoveredDay.y}px`,
            transform: 'translateX(-50%)'
          }}
        >
          <div className="font-bold text-[10px] uppercase tracking-wider text-peach-300">
            {new Date(hoveredDay.dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
          <div className="text-sm font-black mt-1">
            {hoveredDay.hours === 0 ? 'No study logged' : `${hoveredDay.hours} hrs studied`}
          </div>
          {hoveredDay.subjectsList.length > 0 && (
            <div className="mt-1.5 pt-1.5 border-t border-white/10 text-[9px] text-peach-200/90 leading-tight">
              Subjects: {hoveredDay.subjectsList.join(', ')}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
