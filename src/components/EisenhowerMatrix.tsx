import React from 'react';
import { Task, Subject, EisenhowerQuadrant } from '../types';
import { Sparkles, Calendar, CheckSquare, Plus, ArrowRight, CornerDownRight, ShieldAlert, BadgeAlert, Trash } from 'lucide-react';

interface EisenhowerMatrixProps {
  tasks: Task[];
  subjects: Subject[];
  onUpdateTasks: (tasks: Task[]) => void;
  onAddTask: (task: Omit<Task, 'id' | 'completed'>) => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onShowToast: (text: string, type: 'success' | 'info' | 'warning') => void;
}

export default function EisenhowerMatrix({
  tasks,
  subjects,
  onUpdateTasks,
  onAddTask,
  onToggleTask,
  onDeleteTask,
  onShowToast
}: EisenhowerMatrixProps) {

  // Group tasks by their quadrant
  // Set fallback quadrants for older items on-the-fly
  const getQuadrantTasks = (quadStr: EisenhowerQuadrant) => {
    return tasks.filter(t => t.quadrant === quadStr);
  };

  const getSubjectColor = (subId: string) => {
    const s = subjects.find(sub => sub.id === subId);
    return s ? s.color : '#800020';
  };

  const getSubjectName = (subId: string) => {
    const s = subjects.find(sub => sub.id === subId);
    return s ? s.name : 'Unknown';
  };

  // Drag-and-drop handlers
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetQuad: EisenhowerQuadrant) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    if (!taskId) return;

    const taskToUpdate = tasks.find(t => t.id === taskId);
    if (taskToUpdate) {
      const updatedList = tasks.map(t => t.id === taskId ? { ...t, quadrant: targetQuad } : t);
      onUpdateTasks(updatedList);
      onShowToast(`Task repositioned inside matrix grid!`, 'success');
    }
  };

  const handleManualMove = (taskId: string, targetQuad: EisenhowerQuadrant) => {
    const updated = tasks.map(t => t.id === taskId ? { ...t, quadrant: targetQuad } : t);
    onUpdateTasks(updated);
    onShowToast(`Task repositioned successfully.`, 'success');
  };

  const quadrantsInfo: { id: EisenhowerQuadrant; title: string; colorClass: string; borderClass: string; desc: string; textClass: string }[] = [
    {
      id: 'ur-im',
      title: '1. Urgent & Important',
      colorClass: 'bg-[#800020] text-peach-100',
      borderClass: 'border border-maroon-850/25',
      desc: 'Do immediately (due soon, critical topics)',
      textClass: 'text-maroon-900',
    },
    {
      id: 'nur-im',
      title: '2. Important & Not Urgent',
      colorClass: 'bg-[#FFCBA4] text-maroon-900',
      borderClass: 'border border-peach-400/30',
      desc: 'Schedule properly (exam prep, routine summaries)',
      textClass: 'text-maroon-800'
    },
    {
      id: 'ur-nim',
      title: '3. Urgent & Not Important',
      colorClass: 'bg-[#FFDAB9]/80 text-[#800020]',
      borderClass: 'border border-orange-200/40',
      desc: 'Keep simple or delegate (unnecessary administration)',
      textClass: 'text-maroon-800/80'
    },
    {
      id: 'nur-nim',
      title: '4. Neither / Backlog',
      colorClass: 'bg-cream text-maroon-800',
      borderClass: 'border border-maroon-800/10',
      desc: 'Eliminate or review leisurely (low value backlog)',
      textClass: 'text-maroon-800/60'
    }
  ];

  return (
    <div className="space-y-4" id="eisenhower-prioritization-matrix">
      <div>
        <h3 className="text-sm font-bold text-maroon-800 dark:text-peach-300 uppercase tracking-wider flex items-center gap-2">
          🧩 Eisenhower Matrix Task Pacer
        </h3>
        <p className="text-xs text-maroon-800/60 dark:text-peach-200/60 mt-0.5">
          Drag cards between quadrants below, or click arrows to reprioritize instantly.
        </p>
      </div>

      {/* Grid Container */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {quadrantsInfo.map(quad => {
          const quadTasks = getQuadrantTasks(quad.id);

          return (
            <div
              key={quad.id}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, quad.id)}
              className={`bg-white dark:bg-maroon-900/40 rounded-3xl p-5 min-h-[300px] flex flex-col justify-between border ${quad.borderClass} shadow-sm transition-all duration-300`}
            >
              <div>
                {/* Quadrant Header banner */}
                <div className={`p-3 rounded-2xl flex flex-col gap-0.5 mb-3 select-none ${quad.colorClass}`}>
                  <span className="text-xs font-black tracking-tight">{quad.title}</span>
                  <span className="text-[9px] font-medium opacity-85">{quad.desc}</span>
                </div>

                {/* Subtasks listing */}
                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {quadTasks.length > 0 ? (
                    quadTasks.map(task => (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, task.id)}
                        className={`p-3 rounded-xl border border-maroon-800/10 hover:bg-cream/40 transition flex items-center justify-between gap-3 bg-white dark:bg-maroon-950/20 shadow-2xs group cursor-grab active:cursor-grabbing`}
                      >
                        <div className="flex items-start gap-2.5 min-w-0 flex-1">
                          {/* Checkbox box */}
                          <button
                            type="button"
                            onClick={() => onToggleTask(task.id)}
                            className={`w-4 h-4 border-2 rounded mt-0.5 shrink-0 transition flex items-center justify-center cursor-pointer ${
                              task.completed 
                                ? 'bg-maroon-800 border-maroon-800 text-white' 
                                : 'border-maroon-800/40 hover:border-maroon-800'
                            }`}
                          >
                            {task.completed && <span className="text-[10px] font-black">✓</span>}
                          </button>

                          <div className="min-w-0">
                            <p className={`text-xs font-semibold text-maroon-950 dark:text-white leading-snug truncate ${task.completed ? 'line-through opacity-40' : ''}`}>
                              {task.title}
                            </p>
                            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                              <span 
                                className="text-[8px] font-extrabold px-1.5 py-0.2 rounded uppercase text-white tracking-wider font-sans"
                                style={{ backgroundColor: getSubjectColor(task.subjectId) }}
                              >
                                {getSubjectName(task.subjectId)}
                              </span>
                              <span className="text-[8px] font-mono text-maroon-800/40 dark:text-peach-200/40">
                                Due: {task.dueDate}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Movers selectors */}
                        <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition shrink-0">
                          {/* Select quick destination dropdown */}
                          <select
                            onChange={(e) => handleManualMove(task.id, e.target.value as EisenhowerQuadrant)}
                            value={quad.id}
                            className="bg-cream border border-maroon-800/10 text-[9px] font-mono font-bold rounded-lg p-1 text-maroon-800 cursor-pointer focus:outline-none"
                            title="Move quadrant"
                          >
                            <option value="ur-im">Q1: Urg+Imp</option>
                            <option value="nur-im">Q2: Imp</option>
                            <option value="ur-nim">Q3: Urg</option>
                            <option value="nur-nim">Q4: Backlog</option>
                          </select>

                          <button
                            type="button"
                            onClick={() => onDeleteTask(task.id)}
                            className="p-1 text-maroon-800/40 hover:text-red-600 rounded-lg hover:bg-red-50 cursor-pointer"
                            title="Delete task"
                          >
                            <Trash size={12} />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-[10px] text-center text-maroon-800/40 font-bold py-6 border border-dashed border-maroon-800/10 rounded-2xl">
                      Drop due study tasks here
                    </div>
                  )}
                </div>
              </div>

              {/* Suggestions metrics */}
              <div className="text-[9px] font-mono font-bold text-maroon-800/40 pt-3 border-t border-maroon-800/5 flex justify-between">
                <span>Task count: {quadTasks.length}</span>
                <span>Quadrant ratio: {tasks.length > 0 ? Math.round((quadTasks.length / tasks.length) * 100) : 0}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
