import React, { useEffect, useRef, useState } from 'react';
import { Subject, Task, PomodoroLog } from '../types';
import { 
  Trophy, 
  Flame, 
  TrendingUp, 
  Percent, 
  Clock, 
  CheckCircle,
  HelpCircle,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight
} from 'lucide-react';
import { calculateWeeklyProductivity, getWeekAndYear, getLastWeekString, formatMinutes } from '../utils';

interface DashboardProps {
  subjects: Subject[];
  tasks: Task[];
  pomodoroLogs: PomodoroLog[];
  weeklyHourGoal: number;
  onUpdateHourGoal: (goal: number) => void;
  currentStreak: number;
}

export default function Dashboard({
  subjects,
  tasks,
  pomodoroLogs,
  weeklyHourGoal,
  onUpdateHourGoal,
  currentStreak,
}: DashboardProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 400, height: 260 });
  const [newGoal, setNewGoal] = useState(weeklyHourGoal);
  const [isEditingGoal, setIsEditingGoal] = useState(false);

  const currentWeekStr = getWeekAndYear(new Date());
  const lastWeekStr = getLastWeekString(currentWeekStr);

  // 1. Gather hours studied per subject for active week
  const getHoursStudiedForSubject = (subId: string) => {
    const logs = pomodoroLogs.filter(log => log.subjectId === subId);
    const sumMins = logs.reduce((sum, log) => sum + log.duration, 0);
    return parseFloat((sumMins / 60).toFixed(2));
  };

  const getHoursStudiedThisWeek = () => {
    const weeklyLogs = pomodoroLogs.filter(log => log.weekAndYear === currentWeekStr);
    const sumMins = weeklyLogs.reduce((sum, log) => sum + log.duration, 0);
    return parseFloat((sumMins / 60).toFixed(2));
  };

  const hoursStudiedThisWeek = getHoursStudiedThisWeek();

  // 2. Study score calculations
  const completedTasks = tasks.filter(t => t.completed).length;
  const totalTasks = tasks.length;
  
  const compRatio = totalTasks > 0 ? completedTasks / totalTasks : 1.0;
  const goalRatio = weeklyHourGoal > 0 ? Math.min(1.0, hoursStudiedThisWeek / weeklyHourGoal) : 1.0;
  // Study Score = (completedTasks / totalTasks) * 0.5 + (hoursStudied / goalHours) * 0.5 * 100
  const studyScore = Math.round((compRatio * 0.5 + goalRatio * 0.5) * 100);

  // 3. Pomodoro productivity score trend comparisons
  const thisWeekProd = calculateWeeklyProductivity(pomodoroLogs, currentWeekStr);
  const lastWeekProd = calculateWeeklyProductivity(pomodoroLogs, lastWeekStr);
  const trend = thisWeekProd.score - lastWeekProd.score;

  // 4. ResizeObserver for responsive Canvas
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width } = entry.contentRect;
        // Keep canvas inside bounds
        setDimensions({
          width: Math.max(300, width - 32),
          height: 250
        });
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // 5. Drawing chart on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear and draw background
    ctx.clearRect(0, 0, dimensions.width, dimensions.height);

    // Padding settings
    const paddingLeft = 45;
    const paddingRight = 20;
    const paddingTop = 30;
    const paddingBottom = 40;

    const chartWidth = dimensions.width - paddingLeft - paddingRight;
    const chartHeight = dimensions.height - paddingTop - paddingBottom;

    // Get studies for each subject
    const subjectHours = subjects.map(sub => ({
      name: sub.name,
      hours: getHoursStudiedForSubject(sub.id),
      color: sub.color
    }));

    // Find max value to calibrate yScale
    const maxHours = Math.max(2, ...subjectHours.map(s => s.hours));
    const ceilingValue = Math.ceil(maxHours * 1.25);

    // Draw gridlines (Y axis ticks)
    ctx.strokeStyle = '#f3f4f6';
    ctx.lineWidth = 1;
    ctx.fillStyle = '#6b7280';
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'right';

    const yTicks = 4;
    for (let i = 0; i <= yTicks; i++) {
      const val = (ceilingValue / yTicks) * i;
      const y = paddingTop + chartHeight - (chartHeight * (val / ceilingValue));
      
      // Horizontal gridline
      ctx.beginPath();
      ctx.moveTo(paddingLeft, y);
      ctx.lineTo(dimensions.width - paddingRight, y);
      ctx.stroke();

      // Label text
      ctx.fillText(`${val.toFixed(1)}h`, paddingLeft - 8, y + 4);
    }

    if (subjectHours.length === 0) {
      // Draw standard empty container prompt inside canvas
      ctx.fillStyle = '#9ca3af';
      ctx.font = 'bold 12px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Register subjects to render analytical feedback', dimensions.width / 2, dimensions.height / 2);
      return;
    }

    // Draw bar metrics per subject
    const barSpacing = chartWidth / subjectHours.length;
    const maxBarWidth = Math.min(48, barSpacing * 0.6);

    subjectHours.forEach((item, index) => {
      const x = paddingLeft + (barSpacing * index) + (barSpacing / 2) - (maxBarWidth / 2);
      const valRatio = item.hours / ceilingValue;
      const barHeight = chartHeight * valRatio;
      const y = paddingTop + chartHeight - barHeight;

      // Draw bar border radius / rectangle
      ctx.fillStyle = item.color;
      
      // Draw smooth rounding for top corners
      const radius = Math.min(6, barHeight);
      ctx.beginPath();
      ctx.moveTo(x, y + barHeight);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.lineTo(x + maxBarWidth - radius, y);
      ctx.quadraticCurveTo(x + maxBarWidth, y, x + maxBarWidth, y + radius);
      ctx.lineTo(x + maxBarWidth, y + barHeight);
      ctx.closePath();
      ctx.fill();

      // Show values on hover/top
      ctx.fillStyle = '#374151';
      ctx.font = 'bold 10px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${item.hours}h`, x + maxBarWidth / 2, y - 6);

      // Draw X labels
      ctx.fillStyle = '#4b5563';
      ctx.font = '10px Inter, sans-serif';
      ctx.textAlign = 'center';
      
      // Truncate name if too long for the cell
      let displayName = item.name;
      if (ctx.measureText(displayName).width > barSpacing - 5) {
        while (displayName.length > 0 && ctx.measureText(displayName + '...').width > barSpacing - 5) {
          displayName = displayName.slice(0, -1);
        }
        displayName += '...';
      }
      ctx.fillText(displayName, x + maxBarWidth / 2, paddingTop + chartHeight + 16);
    });

  }, [subjects, pomodoroLogs, dimensions]);

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateHourGoal(newGoal);
    setIsEditingGoal(false);
  };

  return (
    <div className="space-y-6 animate-fadeIn" id="progress-dashboard-section">
      {/* Upper overview widgets layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Study Score Widget */}
        <div id="study-score-card" className="bg-white p-5 rounded-xl shadow-xs border-l-4 border-maroon-800 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Academic Index</span>
            <div className="text-3xl font-black text-maroon-800 font-display flex items-baseline gap-1">
              <span>{studyScore}</span>
              <span className="text-xs font-medium text-gray-500">/ 100</span>
            </div>
            <p className="text-[11px] text-gray-500 font-medium">Weighted task and hours ratio</p>
          </div>
          <div className="bg-maroon-50 p-3 rounded-xl border border-maroon-100">
            <Trophy className="text-maroon-800" size={24} />
          </div>
        </div>

        {/* Hour Goal completion progress */}
        <div id="weekly-goal-card" className="bg-white p-5 rounded-xl shadow-xs border-l-4 border-peach-400 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1.5">
            <div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Hour Goal Completion</span>
              <div className="text-2xl font-black text-gray-900 font-display mt-0.5">
                {hoursStudiedThisWeek} <span className="text-xs font-semibold text-gray-500">/ {weeklyHourGoal} hrs</span>
              </div>
            </div>
            
            {isEditingGoal ? (
              <form onSubmit={handleUpdate} className="flex items-center gap-1">
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={newGoal}
                  onChange={(e) => setNewGoal(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-12 px-1 py-0.5 border border-maroon-800 rounded font-mono text-center text-xs"
                />
                <button type="submit" className="bg-maroon-800 text-white px-1.5 py-0.5 text-[10px] rounded hover:bg-maroon-900 cursor-pointer">OK</button>
              </form>
            ) : (
              <button
                onClick={() => setIsEditingGoal(true)}
                className="text-[10px] text-maroon-700 bg-peach-100 hover:bg-peach-200 font-bold px-2 py-1 rounded transition cursor-pointer"
              >
                Modify
              </button>
            )}
          </div>

          <div className="space-y-1.5 pt-1.5">
            {/* Hour Progress Bar */}
            <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
              <div 
                className="bg-peach-400 h-full rounded-full transition-all duration-500" 
                style={{ width: `${Math.min(100, (hoursStudiedThisWeek / weeklyHourGoal) * 100)}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[10px] text-gray-500 font-medium">
              <span>Goal pace meter</span>
              <span className="font-bold text-maroon-800">{Math.round((hoursStudiedThisWeek / weeklyHourGoal) * 100)}%</span>
            </div>
          </div>
        </div>

        {/* Streak Counter Widget */}
        <div id="streak-meter-card" className="bg-white p-5 rounded-xl shadow-xs border-l-4 border-amber-500 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Consecutive Streak</span>
            <div className="text-3xl font-black text-amber-600 font-display flex items-baseline gap-1">
              <span>{currentStreak}</span>
              <span className="text-xs font-medium text-gray-500">days</span>
            </div>
            <p className="text-[11px] text-gray-500 font-medium">Studied days in succession</p>
          </div>
          <div className="bg-amber-50 p-3 rounded-xl border border-amber-100">
            <Flame className="text-amber-500 fill-amber-400 animate-pulse" size={24} />
          </div>
        </div>

        {/* Pomodoro Productivity Score */}
        <div id="productivity-trend-card" className="bg-white p-5 rounded-xl shadow-xs border-l-4 border-emerald-500 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Productivity Index</span>
            <div className="text-2xl font-black text-gray-900 font-display flex items-center gap-1.5 mt-0.5">
              <span>{thisWeekProd.score} pts</span>
              
              {/* Trend Indicator */}
              <span className="flex items-center">
                {trend > 0 ? (
                  <span className="flex items-center text-xs font-extrabold text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded" title={`Improved by ${trend} compared to last week`}>
                    <ArrowUpRight size={14} className="stroke-[3]" />
                    +{trend}
                  </span>
                ) : trend < 0 ? (
                  <span className="flex items-center text-xs font-extrabold text-red-600 bg-red-50 px-1 py-0.5 rounded" title={`Dropped by ${Math.abs(trend)} compared to last week`}>
                    <ArrowDownRight size={14} className="stroke-[3]" />
                    {trend}
                  </span>
                ) : (
                  <span className="flex items-center text-xs font-bold text-gray-400 bg-gray-50 px-1 py-0.5 rounded" title="Even with previous week index">
                    <ArrowRight size={14} />
                    0
                  </span>
                )}
              </span>
            </div>
            <p className="text-[11px] text-gray-500 font-medium">Rating * count vs last week</p>
          </div>
          <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-110">
            <TrendingUp className="text-emerald-500" size={24} />
          </div>
        </div>
      </div>

      {/* Middle Analytical Split: Canvas Chart and Tasks Pacer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Canvas Bar Chart wrapper */}
        <div className="bg-white p-5 rounded-xl shadow-xs border border-gray-100 lg:col-span-2 space-y-4" ref={containerRef} id="analytical-chart-block">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1">
              <Clock size={16} className="text-maroon-800" />
              Hours Studied Per Subject
            </h3>
            <span className="text-xs text-gray-400 font-mono font-bold">{currentWeekStr} Overview</span>
          </div>

          {/* Actual responsive canvas hook */}
          <div className="bg-gray-50/50 p-3.5 rounded-lg border border-gray-100 border-dashed flex items-center justify-center">
            <canvas 
              ref={canvasRef} 
              width={dimensions.width} 
              height={dimensions.height} 
              className="max-w-full h-auto block"
              id="hours-per-subject-canvas-chart"
            />
          </div>
        </div>

        {/* Tasks pacing panel split */}
        <div className="bg-white p-5 rounded-xl shadow-s border border-gray-100 space-y-4 flex flex-col justify-between" id="tasks-pacer-block">
          <div>
            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5 mb-3">
              <CheckCircle size={16} className="text-maroon-800" />
              Syllabus Completion
            </h3>
            
            <div className="space-y-4 pt-1.5">
              {/* Detailed completed/total counters */}
              <div className="text-center p-4 bg-cream/40 rounded-xl border border-cream border-dashed flex justify-around">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 block tracking-wide uppercase">Finalized Task Cards</span>
                  <span className="text-2xl font-black text-maroon-800 font-mono">{completedTasks} <span className="text-xs text-gray-400">/ {totalTasks}</span></span>
                </div>
                <div className="border-r border-gray-100"></div>
                <div>
                  <span className="text-[10px] font-bold text-gray-400 block tracking-wide uppercase">Total Syllabus Chapters</span>
                  <span className="text-2xl font-black text-maroon-800 font-mono">
                    {subjects.reduce((sum, s) => sum + s.completedChapters, 0)} <span className="text-xs text-gray-400">/ {subjects.reduce((sum, s) => sum + s.totalChapters, 0)}</span>
                  </span>
                </div>
              </div>

              {/* Progress visual */}
              <div className="pt-2">
                <span className="text-xs font-bold text-gray-700 block mb-1">Checklist Target Metrics</span>
                <div className="flex items-center gap-2.5">
                  <div className="flex-1 bg-gray-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-peach-300 h-full rounded-full" 
                      style={{ width: `${totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-gray-500 font-mono">{totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-peach-50 p-3.5 rounded-lg border border-peach-200 mt-4">
            <div className="flex items-start gap-2">
              <Sparkles className="text-peach-700 fill-peach-400 mt-0.5" size={14} />
              <div className="text-xs text-peach-900 leading-relaxed font-semibold">
                Tip: Maintain your focus with daily study sessions. Logging at least one focus Pomodoro consecutive days safeguards your streak from resetting!
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
