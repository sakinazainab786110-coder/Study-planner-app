import React, { useEffect, useRef, useState } from 'react';
import { Subject, Task, PomodoroLog } from '../types';

interface SubjectRadarChartProps {
  subjects: Subject[];
  tasks: Task[];
  pomodoroLogs: PomodoroLog[];
}

export default function SubjectRadarChart({
  subjects,
  tasks,
  pomodoroLogs
}: SubjectRadarChartProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 340, height: 320 });

  // Keep track of which subjects are active/toggled on or off
  const [activeSubjectIds, setActiveSubjectIds] = useState<string[]>([]);

  // Synchronize activeSubjectIds when subjects load
  useEffect(() => {
    if (subjects.length > 0 && activeSubjectIds.length === 0) {
      setActiveSubjectIds(subjects.map(s => s.id));
    }
  }, [subjects]);

  const toggleSubject = (id: string) => {
    if (activeSubjectIds.includes(id)) {
      setActiveSubjectIds(activeSubjectIds.filter(x => x !== id));
    } else {
      setActiveSubjectIds([...activeSubjectIds, id]);
    }
  };

  // ResizeObserver for responsive radar container
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width } = entry.contentRect;
        setDimensions({
          width: Math.max(280, width - 24),
          height: 310
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Pre-calculate statistics per subject
  const getSubjectHourMetric = (subId: string) => {
    const logs = pomodoroLogs.filter(log => log.subjectId === subId);
    const sumMins = logs.reduce((sum, log) => sum + log.duration, 0);
    return sumMins / 60;
  };

  const maxHoursStudied = Math.max(1, ...subjects.map(s => getSubjectHourMetric(s.id)));

  const calculateRadarMetrics = (sub: Subject) => {
    const subTasks = tasks.filter(t => t.subjectId === sub.id);
    const completedTasks = subTasks.filter(t => t.completed).length;

    // Axis 1: Progress (committed chapters ratio)
    const progress = (sub.completedChapters / (sub.totalChapters || 1)) * 100;

    // Axis 2: Time Spent (ratio compared to peak studied subject)
    const timeSpent = (getSubjectHourMetric(sub.id) / maxHoursStudied) * 100;

    // Axis 3: Tasks Completion (% of closed task cards)
    const taskComp = subTasks.length > 0 ? (completedTasks / subTasks.length) * 100 : 80; // default to 80% if no tasks

    // Axis 4: Difficulty (avg task star parameter)
    const avgDiff = subTasks.length > 0 
      ? (subTasks.reduce((sum, t) => sum + t.difficulty, 0) / subTasks.length) * 20 
      : 50; // default to 50% difficulty

    // Axis 5: Exam Proximity (Days counting closer)
    let proximity = 20; // default baseline
    if (sub.examDate) {
      const diffTime = new Date(sub.examDate).getTime() - new Date('2026-06-16T12:00:00').getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays <= 2) proximity = 100;
      else if (diffDays <= 7) proximity = 80;
      else if (diffDays <= 14) proximity = 60;
      else if (diffDays <= 30) proximity = 40;
    }

    return [
      progress,    // 0: Progress
      timeSpent,   // 1: Time Spent
      taskComp,    // 2: Tasks Completed
      avgDiff,     // 3: Difficulty
      proximity    // 4: Proximity
    ];
  };

  const axisLabels = [
    'Progress',
    'Time Invested',
    'Task Closed',
    'Difficulty',
    'Exam Proximity'
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, dimensions.width, dimensions.height);

    const centerX = dimensions.width / 2;
    const centerY = dimensions.height / 2 + 10;
    const maxRadius = Math.min(centerX, centerY) - 45; // boundary buffer

    const numAxes = 5;

    // 1. Draw web grid circles or pentagons
    const steps = 4; // levels (25%, 50%, 75%, 100%)
    ctx.strokeStyle = 'rgba(128, 0, 32, 0.08)';
    ctx.lineWidth = 1;

    for (let s = 1; s <= steps; s++) {
      const radius = maxRadius * (s / steps);
      ctx.beginPath();
      for (let idx = 0; idx < numAxes; idx++) {
        const angle = (idx * 2 * Math.PI) / numAxes - Math.PI / 2;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        if (idx === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();
      ctx.stroke();

      // Show grid labels inside web
      ctx.fillStyle = 'rgba(128, 0, 32, 0.35)';
      ctx.font = '7px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`${s * 25}%`, centerX + 5, centerY - radius + 3);
    }

    // 2. Draw axis spikes and labels
    ctx.font = 'bold 9px sans-serif';
    ctx.fillStyle = '#800020';
    ctx.textAlign = 'center';

    for (let idx = 0; idx < numAxes; idx++) {
      const angle = (idx * 2 * Math.PI) / numAxes - Math.PI / 2;
      const x = centerX + maxRadius * Math.cos(angle);
      const y = centerY + maxRadius * Math.sin(angle);

      // Draw spine lines
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(x, y);
      ctx.strokeStyle = 'rgba(128, 0, 32, 0.15)';
      ctx.stroke();

      // Position labels precisely outside edges
      const labelDistance = maxRadius + 18;
      const labelX = centerX + labelDistance * Math.cos(angle);
      const labelY = centerY + labelDistance * Math.sin(angle);

      // Label alignments based on node quadrant orientation
      if (Math.abs(Math.cos(angle)) < 0.1) {
        ctx.textAlign = 'center';
      } else if (Math.cos(angle) > 0) {
        ctx.textAlign = 'left';
      } else {
        ctx.textAlign = 'right';
      }
      ctx.fillText(axisLabels[idx], labelX, labelY + 3);
    }

    // 3. Plot subject polygons
    subjects.forEach((sub) => {
      // Skip if subject is toggled off
      if (!activeSubjectIds.includes(sub.id)) return;

      const metrics = calculateRadarMetrics(sub);
      
      ctx.beginPath();
      metrics.forEach((value, idx) => {
        const angle = (idx * 2 * Math.PI) / numAxes - Math.PI / 2;
        const boundedVal = Math.min(100, Math.max(10, value));
        const radius = maxRadius * (boundedVal / 100);
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);

        if (idx === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.closePath();

      // Fill style: Maroon transparent overlay
      ctx.fillStyle = 'rgba(128, 0, 32, 0.18)'; 
      ctx.fill();

      // Outline stroke: subject color
      ctx.strokeStyle = sub.color || '#800020';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Draw point anchors on axis
      metrics.forEach((value, idx) => {
        const angle = (idx * 2 * Math.PI) / numAxes - Math.PI / 2;
        const boundedVal = Math.min(100, value);
        const radius = maxRadius * (boundedVal / 100);
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);

        ctx.beginPath();
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.strokeStyle = sub.color;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });
    });

  }, [subjects, activeSubjectIds, pomodoroLogs, dimensions]);

  return (
    <div className="bg-white dark:bg-maroon-900/40 p-6 rounded-3xl border-l-8 border-maroon-800 shadow-sm flex flex-col justify-between" ref={containerRef} id="analytical-radar-container">
      <div>
        <h3 className="text-sm font-bold text-maroon-800 dark:text-peach-300 uppercase tracking-wider flex items-center gap-2">
          🕸 Axis Radar Comparison
        </h3>
        <p className="text-xs text-maroon-800/60 dark:text-peach-200/60 mt-0.5">
          Dynamic metrics overlay comparing syllabus complexity
        </p>
      </div>

      <div className="flex-1 flex items-center justify-center py-4">
        <canvas
          ref={canvasRef}
          width={dimensions.width}
          height={dimensions.height}
          className="block max-w-full h-auto"
        />
      </div>

      {subjects.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2 border-t border-maroon-800/5 pt-4">
          {subjects.map(sub => {
            const isActive = activeSubjectIds.includes(sub.id);
            return (
              <button
                key={sub.id}
                onClick={() => toggleSubject(sub.id)}
                className={`text-[9.5px] font-extrabold px-3 py-1.5 rounded-xl cursor-pointer transition-all border flex items-center gap-1.5 ${
                  isActive
                    ? 'border-maroon-800 text-maroon-800 bg-cream font-bold'
                    : 'border-gray-250 text-gray-400 bg-gray-50/50 line-through opacity-60'
                }`}
                style={isActive ? { borderLeft: `4px solid ${sub.color}` } : {}}
              >
                <div 
                  className="w-1.5 h-1.5 rounded-full shrink-0" 
                  style={{ backgroundColor: sub.color }}
                />
                {sub.name}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
