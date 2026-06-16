import React, { useState } from 'react';
import { Task, Subject } from '../types';
import { Plus, Check, Trash2, Calendar, BookOpen, Star, Filter, Eye, AlertCircle, Clock, Grid } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import EisenhowerMatrix from './EisenhowerMatrix';

interface TaskListProps {
  tasks: Task[];
  subjects: Subject[];
  onAddTask: (task: Omit<Task, 'id' | 'completed'>) => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onShowToast: (message: string, type: 'success' | 'info' | 'warning') => void;
  onUpdateTasks: (tasks: Task[]) => void;
}

type SortOption = 'dueDate' | 'difficulty' | 'subject';
type FilterOption = 'All' | 'Pending' | 'Completed';

export default function TaskList({
  tasks,
  subjects,
  onAddTask,
  onToggleTask,
  onDeleteTask,
  onShowToast,
  onUpdateTasks,
}: TaskListProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'matrix'>('list');


  // Form State
  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [estimatedTime, setEstimatedTime] = useState(45);
  const [difficulty, setDifficulty] = useState(3);

  // Filter/Sort State
  const [sortBy, setSortBy] = useState<SortOption>('dueDate');
  const [filterBy, setFilterBy] = useState<FilterOption>('All');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      onShowToast('Task title is required', 'warning');
      return;
    }
    if (!subjectId) {
      onShowToast('Please select an associated subject', 'warning');
      return;
    }
    if (!dueDate) {
      onShowToast('Due date is required', 'warning');
      return;
    }

    onAddTask({
      title: title.trim(),
      subjectId,
      dueDate,
      estimatedTime: Number(estimatedTime) || 30,
      difficulty,
    });

    onShowToast(`Task "${title.trim()}" added to your registry!`, 'success');
    setTitle('');
    setSubjectId('');
    setDueDate('');
    setEstimatedTime(45);
    setDifficulty(3);
    setIsAdding(false);
  };

  const getSubjectDetails = (subId: string) => {
    const s = subjects.find(sub => sub.id === subId);
    return s || { name: 'Independent', color: '#10b981' };
  };

  // Filter logic
  const filteredTasks = tasks.filter(task => {
    if (filterBy === 'Completed') return task.completed;
    if (filterBy === 'Pending') return !task.completed;
    return true;
  });

  // Sort logic
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortBy === 'dueDate') {
      return a.dueDate.localeCompare(b.dueDate);
    }
    if (sortBy === 'difficulty') {
      return b.difficulty - a.difficulty; // Descending (hardest first)
    }
    if (sortBy === 'subject') {
      const aSub = getSubjectDetails(a.subjectId).name;
      const bSub = getSubjectDetails(b.subjectId).name;
      return aSub.localeCompare(bSub);
    }
    return 0;
  });

  return (
    <div className="space-y-6" id="tasks-list-section">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-maroon-800 tracking-tight">Smart Task List</h2>
          <p className="text-sm text-gray-500">Plan micro-deadlines, rate difficulty, and tick off tasks with satisfaction</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          {/* List/Matrix view selector */}
          <div className="flex bg-[#FFF5EE] p-1 rounded-xl border border-maroon-800/10">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition ${viewMode === 'list' ? 'bg-maroon-800 text-white shadow-xs' : 'text-maroon-800/60 hover:text-maroon-800'}`}
            >
              List View
            </button>
            <button
              type="button"
              onClick={() => setViewMode('matrix')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition ${viewMode === 'matrix' ? 'bg-maroon-800 text-white shadow-xs' : 'text-maroon-800/60 hover:text-maroon-800'}`}
            >
              Eisenhower Matrix
            </button>
          </div>

          {!isAdding && (
            <button
              onClick={() => setIsAdding(true)}
              className="flex items-center gap-2 bg-maroon-800 hover:bg-maroon-900 text-white px-4 py-2.5 rounded-lg font-medium transition cursor-pointer text-sm shadow-sm"
            >
              <Plus size={16} className="text-peach-400" />
              Add Task
            </button>
          )}
        </div>
      </div>

      {/* Add Task Card Form */}
      {isAdding && (
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-maroon-800 animate-fadeIn" id="task-add-card">
          <h3 className="text-lg font-bold text-maroon-800 mb-4">Log a Study Directive</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Task Title */}
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1">TASK TITLE / DESCRIPTION</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Read Physics Chapter 3 on Thermodynamics, or complete calculus dataset"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-maroon-800 text-sm"
                  required
                />
              </div>

              {/* Subject Select */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">ASSOCIATED SUBJECT</label>
                <select
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-maroon-800 text-sm bg-white"
                  required
                >
                  <option value="">-- Choose Subject --</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">DUE DATE</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-maroon-800 text-sm"
                  required
                />
              </div>

              {/* Time Estimate */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">TIME ESTIMATE (MINUTES)</label>
                <input
                  type="number"
                  min="5"
                  max="480"
                  value={estimatedTime}
                  onChange={(e) => setEstimatedTime(Math.max(5, parseInt(e.target.value) || 0))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-maroon-800 text-sm"
                  required
                />
              </div>

              {/* Difficulty 1-5 Stars */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">ESTIMATED DIFFICULTY (1-5)</label>
                <div className="flex items-center gap-1.5 mt-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setDifficulty(star)}
                      className="text-amber-400 hover:scale-120 transition focus:outline-none cursor-pointer"
                      title={`${star} Star Difficulty`}
                    >
                      <Star size={20} fill={difficulty >= star ? '#f59e0b' : 'none'} stroke="#f59e0b" />
                    </button>
                  ))}
                  <span className="text-xs font-semibold text-gray-500 font-mono ml-2">Rating {difficulty}/5</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-sm bg-maroon-800 hover:bg-maroon-900 text-white font-medium rounded-lg shadow-sm"
              >
                Schedule Task
              </button>
            </div>
          </form>
        </div>
      )}

      {viewMode === 'matrix' ? (
        <EisenhowerMatrix
          tasks={tasks}
          subjects={subjects}
          onUpdateTasks={onUpdateTasks}
          onAddTask={onAddTask}
          onToggleTask={onToggleTask}
          onDeleteTask={onDeleteTask}
          onShowToast={onShowToast}
        />
      ) : (
        <>
          {/* Task Filters & Sort Bar */}
          <div className="bg-white p-4 rounded-xl shadow-xs border border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4" id="task-filter-bar">
            {/* Filters */}
            <div className="flex items-center gap-1.5 self-start sm:self-auto w-full sm:w-auto">
              <Filter size={14} className="text-gray-400 mr-1" />
              {(['All', 'Pending', 'Completed'] as FilterOption[]).map((opt) => (
                <button
                  key={opt}
                  onClick={() => setFilterBy(opt)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    filterBy === opt
                      ? 'bg-maroon-800 text-white'
                      : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>

            {/* Sort Controls */}
            <div className="flex items-center gap-2 self-end sm:self-auto text-xs w-full sm:w-auto justify-end">
              <span className="text-gray-400 font-medium">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white font-medium text-gray-700 focus:outline-none focus:ring-1 focus:ring-maroon-800 cursor-pointer"
              >
                <option value="dueDate">🎯 Due Date</option>
                <option value="difficulty">⭐ Difficulty</option>
                <option value="subject">📖 Subject</option>
              </select>
            </div>
          </div>

          {/* Tasks Display */}
          {sortedTasks.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center space-y-4" id="tasks-empty-state">
              {/* Detailed Empty State Illustration SVG */}
              <svg className="w-48 h-48 text-maroon-200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="40" y="30" width="120" height="140" rx="10" fill="white" stroke="#FFCBA4" strokeWidth="3" />
                <line x1="60" y1="60" x2="140" y2="60" stroke="#800020" strokeWidth="4" strokeLinecap="round" />
                <line x1="60" y1="90" x2="120" y2="90" stroke="#E5E7EB" strokeWidth="3" strokeLinecap="round" />
                <line x1="60" y1="120" x2="110" y2="120" stroke="#E5E7EB" strokeWidth="3" strokeLinecap="round" />
                <circle cx="140" cy="120" r="15" fill="#fdf1f3" stroke="#800020" strokeWidth="1.5" />
                <path d="M135 120H145" stroke="#800020" strokeWidth="2" strokeLinecap="round" />
                <path d="M140 115V125" stroke="#800020" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-maroon-900">No checklists to see</h3>
                <p className="text-sm text-gray-500 max-w-sm">
                  {filterBy === 'All' 
                    ? 'Create a study task above to start pacing your learning!'
                    : `There are no "${filterBy}" tasks in your notebook currently.`}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {sortedTasks.map((task) => {
                  const sub = getSubjectDetails(task.subjectId);
                  
                  return (
                    <motion.div
                      key={task.id}
                      layout
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className={`bg-white p-4 rounded-xl shadow-xs border-l-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-sm transition-all duration-150 ${
                        task.completed ? 'opacity-70 bg-gray-50/50' : ''
                      }`}
                      style={{ borderLeftColor: sub.color }}
                      id={`task-item-${task.id}`}
                    >
                      <div className="flex items-start gap-3.5 flex-1 min-w-0">
                        {/* Peach checkbox with animation support */}
                        <button
                          onClick={() => onToggleTask(task.id)}
                          className={`w-5.5 h-5.5 mt-0.5 rounded-full border-2 cursor-pointer flex items-center justify-center transition-all ${
                            task.completed
                              ? 'bg-peach-400 border-peach-400 ring-2 ring-peach-100'
                              : 'border-gray-300 hover:border-peach-400 hover:bg-peach-5/30'
                          }`}
                          id={`checkbox-task-${task.id}`}
                          title={task.completed ? 'Mark pending' : 'Mark complete'}
                        >
                          {task.completed && <Check size={12} className="text-maroon-800 stroke-[3]" />}
                        </button>

                        <div className="space-y-1 min-w-0 flex-1">
                          <h4
                            className={`text-sm font-bold text-gray-800 break-words transition-all duration-300 ${
                              task.completed ? 'line-through text-gray-400 italic' : ''
                            }`}
                          >
                            {task.title}
                          </h4>
                          {/* Sub-line metadata */}
                          <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1.5 text-[11px] text-gray-500 pt-0.5">
                            <span
                              className="font-semibold px-2 py-0.5 rounded-md label-container"
                              style={{ backgroundColor: `${sub.color}20`, color: sub.color }}
                            >
                              {sub.name}
                            </span>
                            
                            <span className="flex items-center gap-1">
                              <Clock size={12} className="text-gray-400" />
                              {task.estimatedTime}m review duration
                            </span>

                            <span className="flex items-center gap-1 font-medium text-maroon-800">
                              <Calendar size={12} />
                              Due: {task.dueDate}
                            </span>

                            <span className="flex items-center">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  size={11}
                                  className="text-amber-400"
                                  fill={task.difficulty > i ? '#f59e0b' : 'none'}
                                  stroke="#f59e0b"
                                />
                              ))}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right Actions */}
                      <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 border-t sm:border-t-0 border-gray-100 pt-2 sm:pt-0">
                        <button
                          onClick={() => {
                            onDeleteTask(task.id);
                            onShowToast('Task removed from queue', 'info');
                          }}
                          className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-50 transition cursor-pointer"
                          title="Deconstruct Task"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </>
      )}
    </div>
  );
}
