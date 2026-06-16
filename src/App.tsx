import React, { useState, useEffect } from 'react';
import { Subject, Task, StudyBlock, PomodoroLog, ProjectData, Note, PomodoroMode } from './types';
import { 
  getInitialData, 
  saveProjectData, 
  getWeekAndYear, 
  getSmartRecommendations,
  formatMinutes
} from './utils';

// Import Icons
import { 
  LayoutDashboard, 
  BookOpen, 
  Calendar, 
  CheckSquare, 
  Timer, 
  FileText, 
  Download, 
  Upload, 
  Moon, 
  Sun, 
  Menu, 
  X,
  Sparkles,
  Award,
  Zap
} from 'lucide-react';

// Import Components
import Dashboard from './components/Dashboard';
import SubjectManager from './components/SubjectManager';
import StudyScheduler from './components/StudyScheduler';
import TaskList from './components/TaskList';
import PomodoroTimer from './components/PomodoroTimer';
import NotesPanel from './components/NotesPanel';
import Recommendations from './components/Recommendations';

interface ToastMessage {
  id: string;
  text: string;
  type: 'success' | 'info' | 'warning';
}

export default function App() {
  // State Initialization
  const [data, setData] = useState<ProjectData>(getInitialData);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'subjects' | 'schedule' | 'tasks' | 'timer' | 'notes'>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Track state alterations to preserve to localStorage
  useEffect(() => {
    saveProjectData(data);
  }, [data]);

  // System Toast Alerts
  const showToast = (text: string, type: 'success' | 'info' | 'warning') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // Keyboard Navigation shortcut spacebar check is hosted inside PomodoroTimer
  // Let's implement Streak Log counting inside Pomodoro Log
  const handleLogPomodoroSession = (subjectId: string, duration: number, rating: number) => {
    const todayStr = new Date('2026-06-16T01:51:46-07:00').toISOString().split('T')[0]; // Current mock time YYYY-MM-DD
    const newLog: PomodoroLog = {
      id: `pomodoro-log-${Date.now()}`,
      subjectId,
      timestamp: new Date().toISOString(),
      duration,
      rating,
      weekAndYear: getWeekAndYear(new Date())
    };

    setData(prev => {
      // Calculate Streaks
      let updatedStreak = prev.currentStreak;
      const lastStudy = prev.lastStudiedDate;

      if (lastStudy === null) {
        // First study session ever
        updatedStreak = 1;
      } else if (lastStudy === todayStr) {
        // Already studied today, conserve the current streak
      } else {
        // Did they study yesterday? Let's check day subtraction
        const yesterday = new Date('2026-06-16T01:51:46-07:00');
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        if (lastStudy === yesterdayStr) {
          updatedStreak += 1; // Studied consecutively, increase streak!
        } else {
          updatedStreak = 1; // Streak broken, restart at 1
        }
      }

      return {
        ...prev,
        pomodoroLogs: [...prev.pomodoroLogs, newLog],
        currentStreak: updatedStreak,
        lastStudiedDate: todayStr
      };
    });

    showToast(`Study session tracked. Streak is now at ${data.currentStreak + 1} days!`, 'success');
  };

  // 1. Subjects Handlers
  const handleAddSubject = (newSub: Omit<Subject, 'id'>) => {
    const created: Subject = {
      ...newSub,
      id: `subj-${Date.now()}`
    };
    setData(prev => ({
      ...prev,
      subjects: [...prev.subjects, created]
    }));
  };

  const handleEditSubject = (updated: Subject) => {
    setData(prev => ({
      ...prev,
      subjects: prev.subjects.map(s => s.id === updated.id ? updated : s)
    }));
  };

  const handleDeleteSubject = (id: string) => {
    setData(prev => ({
      ...prev,
      subjects: prev.subjects.filter(s => s.id !== id),
      // Clean locks and notes associated with it
      studyBlocks: prev.studyBlocks.filter(b => b.subjectId !== id),
      tasks: prev.tasks.filter(t => t.subjectId !== id),
      notes: prev.notes.filter(n => n.subjectId !== id),
      pomodoroLogs: prev.pomodoroLogs.filter(p => p.subjectId !== id)
    }));
  };

  // 2. Study Blocks Scheduler Handlers
  const handleAddBlock = (block: Omit<StudyBlock, 'id'>) => {
    const created: StudyBlock = {
      ...block,
      id: `block-${Date.now()}`
    };
    setData(prev => ({
      ...prev,
      studyBlocks: [...prev.studyBlocks, created]
    }));
  };

  const handleDeleteBlock = (id: string) => {
    setData(prev => ({
      ...prev,
      studyBlocks: prev.studyBlocks.filter(b => b.id !== id)
    }));
  };

  const handleOverwriteBlocks = (blocks: StudyBlock[]) => {
    setData(prev => ({
      ...prev,
      studyBlocks: blocks
    }));
  };

  // 3. Tasks Handlers
  const handleAddTask = (task: Omit<Task, 'id' | 'completed'>) => {
    const created: Task = {
      ...task,
      id: `task-${Date.now()}`,
      completed: false
    };
    setData(prev => ({
      ...prev,
      tasks: [...prev.tasks, created]
    }));
  };

  const handleToggleTask = (id: string) => {
    setData(prev => {
      const task = prev.tasks.find(t => t.id === id);
      const wasCompleted = task ? task.completed : false;
      if (task && !wasCompleted) {
        showToast('🎯 Outstanding work! Task checked off.', 'success');
      }
      return {
        ...prev,
        tasks: prev.tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t)
      };
    });
  };

  const handleDeleteTask = (id: string) => {
    setData(prev => ({
      ...prev,
      tasks: prev.tasks.filter(t => t.id !== id)
    }));
  };

  // 4. Notes Saving Debounced Handler
  const handleSaveNote = (subjectId: string, content: string) => {
    setData(prev => {
      const existing = prev.notes.find(n => n.subjectId === subjectId);
      const timestamp = new Date().toISOString();
      let updatedNotes;

      if (existing) {
        updatedNotes = prev.notes.map(n => n.subjectId === subjectId ? { ...n, content, updatedAt: timestamp } : n);
      } else {
        updatedNotes = [...prev.notes, { subjectId, content, updatedAt: timestamp }];
      }

      return {
        ...prev,
        notes: updatedNotes
      };
    });
  };

  // 5. Backup - Restore Actions
  const handleBackupExport = () => {
    try {
      const fileString = JSON.stringify(data, null, 2);
      const blob = new Blob([fileString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `StudyPlanner_Backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast('📦 Local study backlog exported successfully!', 'success');
    } catch (e) {
      showToast('Export failed. Review permissions', 'warning');
    }
  };

  const handleBackupImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.subjects && parsed.tasks && parsed.studyBlocks) {
          setData(parsed as ProjectData);
          showToast('🔋 Backpack restored! Study data is fully recovered.', 'success');
          setActiveTab('dashboard');
        } else {
          showToast('Invalid file structure. Backup failed.', 'warning');
        }
      } catch (err) {
        showToast('Corrupted JSON input data file', 'warning');
      }
    };
    reader.readAsText(file);
    // Reset file input value
    e.target.value = '';
  };

  // Triggered when recommendations action triggers timer load
  const handleRecommendFocusStart = (subjId: string) => {
    setActiveTab('timer');
    showToast('Timer configured. Tap Space to unlock flow state!', 'info');
  };

  // Top Bar or Navigation Side list
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'subjects', label: 'Subjects', icon: BookOpen },
    { id: 'schedule', label: 'Schedule', icon: Calendar },
    { id: 'tasks', label: 'TaskList', icon: CheckSquare },
    { id: 'timer', label: 'Timer', icon: Timer },
    { id: 'notes', label: 'Memos', icon: FileText },
  ] as const;

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark bg-maroon-950 text-peach-100' : 'bg-cream text-gray-800'} transition-colors duration-300 flex font-sans`}>
      {/* SIDEBAR NAVIGATION GRID */}
      <aside 
        id="side-nav-rail"
        className={`fixed top-0 bottom-0 left-0 z-40 bg-maroon-900 border-r border-maroon-950 text-white flex flex-col justify-between transition-all duration-300 ${
          isSidebarOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full md:w-20 md:translate-x-0'
        }`}
      >
        <div>
          {/* Logo Brand Header */}
          <div className="p-5 flex items-center justify-between border-b border-maroon-950">
            <div className={`flex items-center gap-2.5 ${!isSidebarOpen ? 'md:justify-center w-full' : ''}`}>
              <div className="bg-peach-400 p-2 rounded-xl text-maroon-900 shadow-md transform hover:rotate-6 transition duration-200 shrink-0">
                <Sparkles size={20} className="fill-peach-100 animate-pulse" />
              </div>
              <span className={`font-display font-black text-lg tracking-tight text-peach-300 transition-opacity ${!isSidebarOpen ? 'md:hidden' : 'block'}`}>
                StudyPlanner
              </span>
            </div>
            {/* Collapse cross icon on Mobile */}
            <button 
              onClick={() => setIsSidebarOpen(false)} 
              className="p-1 text-peach-200 hover:text-white hover:bg-maroon-800 rounded md:hidden transition cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5" id="sidebar-navigation-rail">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    // Close sidebar on mobile
                    if (window.innerWidth < 768) {
                      setIsSidebarOpen(false);
                    }
                  }}
                  className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-150 cursor-pointer ${
                    isActive 
                      ? 'bg-maroon-800 text-peach-400 border-l-4 border-peach-400 shadow-md' 
                      : 'text-maroon-100 hover:bg-maroon-800/50 hover:text-white'
                  } ${!isSidebarOpen ? 'md:justify-center' : ''}`}
                  title={item.label}
                  id={`nav-item-${item.id}`}
                >
                  <Icon size={18} className={isActive ? 'text-peach-400' : 'text-maroon-200'} />
                  <span className={`${!isSidebarOpen ? 'md:hidden' : 'block'}`}>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Administration Footer Block */}
        <div className={`p-4 border-t border-maroon-950 bg-maroon-950/40 space-y-3 ${!isSidebarOpen ? 'md:p-2 md:items-center' : ''}`}>
          {/* Backup / Export buttons */}
          <div className={`flex gap-2 ${!isSidebarOpen ? 'md:flex-col items-center' : 'justify-between'}`}>
            <button
              onClick={handleBackupExport}
              className="flex-1 flex items-center justify-center gap-1.5 bg-maroon-800 hover:bg-maroon-850 border border-maroon-700 text-peach-200 hover:text-peach-100 py-2 px-2.5 rounded text-xs font-semibold transition cursor-pointer"
              title="Backup Data"
              id="backup-export-button"
            >
              <Download size={14} />
              <span className={`${!isSidebarOpen ? 'md:hidden' : ''}`}>Backup</span>
            </button>

            <label
              className="flex-1 flex items-center justify-center gap-1.5 bg-maroon-800 hover:bg-maroon-850 border border-maroon-700 text-peach-200 hover:text-peach-100 py-2 px-2.5 rounded text-xs font-semibold transition cursor-pointer"
              title="Restore Backups"
              id="backup-import-label"
            >
              <Upload size={14} />
              <span className={`${!isSidebarOpen ? 'md:hidden' : ''}`}>Restore</span>
              <input
                type="file"
                accept=".json"
                onChange={handleBackupImport}
                className="hidden"
              />
            </label>
          </div>

          {/* Dark Mode toggle widget */}
          <button
            onClick={() => {
              setIsDarkMode(!isDarkMode);
              showToast(!isDarkMode ? 'Night study theme activated' : 'Soft daylight theme activated', 'info');
            }}
            className={`w-full flex items-center gap-2.5 text-xs font-bold justify-center py-2 border border-maroon-800 hover:bg-maroon-800 rounded transition cursor-pointer text-peach-300 ${!isSidebarOpen ? 'md:w-8 md:h-8 md:p-0' : ''}`}
            title="Toggle theme appearance"
            id="theme-mode-toggle"
          >
            {isDarkMode ? <Sun size={14} /> : <Moon size={14} />}
            <span className={`${!isSidebarOpen ? 'md:hidden' : ''}`}>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTAINER CONTENT BODY */}
      <main className={`flex-1 transition-all duration-300 min-w-0 ${isSidebarOpen ? 'md:pl-64' : 'md:pl-20'}`}>
        {/* TOP NAV BAR */}
        <header className={`px-6 py-4 border-b flex items-center justify-between z-10 sticky top-0 backdrop-blur-md ${
          isDarkMode 
            ? 'bg-maroon-950/70 border-maroon-900 text-peach-100' 
            : 'bg-cream/40 border-gray-100 text-gray-800'
        }`}>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 bg-maroon-800 text-peach-400 hover:bg-maroon-900 rounded-lg shadow-sm transition hover:scale-105 cursor-pointer"
              id="sidebar-toggle-trigger"
            >
              <Menu size={18} />
            </button>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight font-display">Study Planner Hub</h1>
              <p className="text-[11px] font-medium text-gray-400">Time-balanced scheduler analytics dashboard</p>
            </div>
          </div>

          {/* User profile capsule */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-bold font-display text-maroon-800 dark:text-peach-300">Sakina</span>
              <span className="text-[10px] text-gray-400 font-mono">Streak: {data.currentStreak} Days</span>
            </div>
            <div className="w-9 h-9 rounded-full bg-maroon-800 flex items-center justify-center border-2 border-peach-400 font-bold text-sm text-peach-400 shadow-md">
              S
            </div>
          </div>
        </header>

        {/* WORKSPACE VIEWPORT */}
        <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
          {/* Smart recommendations banner at top of dashboard */}
          {activeTab === 'dashboard' && (
            <Recommendations 
              subjects={data.subjects} 
              tasks={data.tasks} 
              onNavigateToTimer={handleRecommendFocusStart} 
            />
          )}

          {/* RENDER ACTIVE TAB VIEWPORT */}
          <div className="transition-all duration-300">
            {activeTab === 'dashboard' && (
              <Dashboard
                subjects={data.subjects}
                tasks={data.tasks}
                pomodoroLogs={data.pomodoroLogs}
                weeklyHourGoal={data.weeklyHourGoal}
                onUpdateHourGoal={(goal) => setData(prev => ({ ...prev, weeklyHourGoal: goal }))}
                currentStreak={data.currentStreak}
              />
            )}

            {activeTab === 'subjects' && (
              <SubjectManager
                subjects={data.subjects}
                onAddSubject={handleAddSubject}
                onEditSubject={handleEditSubject}
                onDeleteSubject={handleDeleteSubject}
                onShowToast={showToast}
              />
            )}

            {activeTab === 'schedule' && (
              <StudyScheduler
                subjects={data.subjects}
                studyBlocks={data.studyBlocks}
                onAddBlock={handleAddBlock}
                onDeleteBlock={handleDeleteBlock}
                onOverwriteBlocks={handleOverwriteBlocks}
                onShowToast={showToast}
              />
            )}

            {activeTab === 'tasks' && (
              <TaskList
                tasks={data.tasks}
                subjects={data.subjects}
                onAddTask={handleAddTask}
                onToggleTask={handleToggleTask}
                onDeleteTask={handleDeleteTask}
                onShowToast={showToast}
              />
            )}

            {activeTab === 'timer' && (
              <PomodoroTimer
                subjects={data.subjects}
                onLogSession={handleLogPomodoroSession}
                onShowToast={showToast}
              />
            )}

            {activeTab === 'notes' && (
              <NotesPanel
                subjects={data.subjects}
                notes={data.notes}
                onSaveNote={handleSaveNote}
                onShowToast={showToast}
              />
            )}
          </div>
        </div>
      </main>

      {/* FLOATING SYSTEM TOAST MESSAGES */}
      <div 
        id="toast-anchor-portal"
        className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`min-w-[280px] max-w-sm pointer-events-auto p-4 rounded-xl shadow-lg border-l-4 float-right transition-all duration-300 transform translate-y-0 animate-slideIn ${
              toast.type === 'success'
                ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-semibold'
                : toast.type === 'warning'
                  ? 'bg-red-50 border-red-500 text-red-950 font-semibold'
                  : 'bg-peach-50 border-maroon-800 text-maroon-950 font-semibold'
            }`}
            id={`toast-card-${toast.id}`}
          >
            <div className="text-xs uppercase font-extrabold tracking-wider opacity-60 mb-1">
              {toast.type === 'success' ? '✔ Completed' : toast.type === 'warning' ? '⚠ System warning' : 'ℹ Notification'}
            </div>
            <div className="text-xs leading-relaxed">{toast.text}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
