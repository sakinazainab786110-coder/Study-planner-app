import { Subject, Task, StudyBlock, PomodoroLog, ProjectData, Note } from './types';

// Web Audio API sound helper
export function playBellSound() {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    
    // First tone (high metallic strike)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, ctx.currentTime); // A5
    osc1.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 1.0); // decay to A4
    
    gain1.gain.setValueAtTime(0.5, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
    
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    
    // Subtone (warm body)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(440, ctx.currentTime);
    
    gain2.gain.setValueAtTime(0.3, ctx.currentTime);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);
    
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    
    osc1.start();
    osc2.start();
    osc1.stop(ctx.currentTime + 1.5);
    osc2.stop(ctx.currentTime + 1.5);
  } catch (error) {
    console.warn('Audio play block or not supported:', error);
  }
}

// Default Data Seed
export const initialSubjects: Subject[] = [
  { id: 'sub-1', name: 'Mathematics', color: '#800020', totalChapters: 12, completedChapters: 4, examDate: '2026-06-25' },
  { id: 'sub-2', name: 'Quantum Physics', color: '#3b82f6', totalChapters: 10, completedChapters: 3, examDate: '2026-06-28' },
  { id: 'sub-3', name: 'World History', color: '#10b981', totalChapters: 15, completedChapters: 8, examDate: '2026-07-02' }
];

export const initialTasks: Task[] = [
  { id: 'task-1', title: 'Solve Calculus Chapter 5 problems', subjectId: 'sub-1', dueDate: '2026-06-18', estimatedTime: 60, difficulty: 4, completed: false },
  { id: 'task-2', title: 'Read Bohr Atom Model notes', subjectId: 'sub-2', dueDate: '2026-06-20', estimatedTime: 45, difficulty: 3, completed: false },
  { id: 'task-3', title: 'Draft French Revolution essay', subjectId: 'sub-3', dueDate: '2026-06-17', estimatedTime: 90, difficulty: 5, completed: false },
  { id: 'task-4', title: 'Memorize trigonometric identities', subjectId: 'sub-1', dueDate: '2026-06-22', estimatedTime: 30, difficulty: 2, completed: true }
];

export const initialStudyBlocks: StudyBlock[] = [
  { id: 'block-1', subjectId: 'sub-1', day: 'Mon', startTime: '09:00', endTime: '10:30', priority: 'High' },
  { id: 'block-2', subjectId: 'sub-2', day: 'Wed', startTime: '11:00', endTime: '12:30', priority: 'Medium' },
  { id: 'block-3', subjectId: 'sub-3', day: 'Fri', startTime: '14:00', endTime: '16:00', priority: 'Low' }
];

export const initialNotes: Note[] = [
  { subjectId: 'sub-1', content: 'Focus heavily on Integration by Parts and Trigonometric Substitutions.\nExam contains at least 3 multi-part questions from these sections.', updatedAt: new Date().toISOString() },
  { subjectId: 'sub-2', content: 'Double-check Bohr postulates on quantized energy states.\nEnergy transition formula: E = h*nu.', updatedAt: new Date().toISOString() }
];

export const initialPomodoroLogs: PomodoroLog[] = [
  // Last week logs (let's say 2026-W24)
  { id: 'p1', subjectId: 'sub-1', timestamp: '2026-06-08T10:00:00.000Z', duration: 25, rating: 4, weekAndYear: '2026-W24' },
  { id: 'p2', subjectId: 'sub-1', timestamp: '2026-06-09T11:00:00.000Z', duration: 25, rating: 5, weekAndYear: '2026-W24' },
  { id: 'p3', subjectId: 'sub-2', timestamp: '2026-06-10T14:00:00.000Z', duration: 25, rating: 3, weekAndYear: '2026-W24' },
  // This week logs (2026-W25)
  { id: 'p4', subjectId: 'sub-1', timestamp: '2026-06-15T09:00:00.000Z', duration: 25, rating: 5, weekAndYear: '2026-W25' },
  { id: 'p5', subjectId: 'sub-2', timestamp: '2026-06-15T15:30:00.000Z', duration: 25, rating: 4, weekAndYear: '2026-W25' }
];

export const STORAGE_KEY = 'study_planner_app_data';

export const initialSrsItems: SrsItem[] = [
  { id: 'srs-1', title: 'Integration by Parts formulae', subjectId: 'sub-1', easinessFactor: 2.5, interval: 1, repetitions: 0, nextReviewDate: '2026-06-16' },
  { id: 'srs-2', title: 'Calculus derivatives of trig functions', subjectId: 'sub-1', easinessFactor: 2.3, interval: 3, repetitions: 1, nextReviewDate: '2026-06-17', lastReviewedDate: '2026-06-14' },
  { id: 'srs-3', title: 'Schrödinger wave equation axioms', subjectId: 'sub-2', easinessFactor: 2.5, interval: 1, repetitions: 0, nextReviewDate: '2026-06-16' },
  { id: 'srs-4', title: 'French Revolution chronological milestones', subjectId: 'sub-3', easinessFactor: 2.6, interval: 6, repetitions: 2, nextReviewDate: '2026-06-15', lastReviewedDate: '2026-06-09' }
];

export function getInitialData(): ProjectData {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.subjects && parsed.tasks) {
        return {
          ...parsed,
          xp: parsed.xp ?? 0,
          level: parsed.level ?? 1,
          unlockedBadges: parsed.unlockedBadges ?? [],
          srsItems: parsed.srsItems ?? initialSrsItems,
          // Upgrade older tasks to have quadrant if missing
          tasks: parsed.tasks.map((t: any) => ({
            ...t,
            quadrant: t.quadrant ?? (t.dueDate <= '2026-06-18' ? (t.difficulty >= 4 ? 'ur-im' : 'ur-nim') : (t.difficulty >= 4 ? 'nur-im' : 'nur-nim'))
          }))
        } as ProjectData;
      }
    }
  } catch (error) {
    console.error('Failed to parse study planner storage:', error);
  }

  // Default seeded project data with new interactive modes
  return {
    subjects: initialSubjects,
    tasks: initialTasks.map((t, idx) => ({
      ...t,
      quadrant: idx === 0 ? 'ur-im' : idx === 1 ? 'nur-im' : idx === 2 ? 'ur-nim' : 'nur-nim'
    })),
    studyBlocks: initialStudyBlocks,
    notes: initialNotes,
    pomodoroLogs: initialPomodoroLogs,
    weeklyHourGoal: 10,
    currentStreak: 3,
    lastStudiedDate: '2026-06-15',
    xp: 120,
    level: 2,
    unlockedBadges: ['focused-1'],
    srsItems: initialSrsItems
  };
}

export function saveProjectData(data: ProjectData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save to localStorage:', e);
  }
}

// Get the ISO week string (e.g. "2026-W25")
export function getWeekAndYear(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

// Algorithm A: Smart Study Recommender
// urgencyScore = (daysUntilDue <= 2 ? 3 : 1) + (1 - progress) * 2 + difficultyWeight
export interface RecommendedSubject {
  subject: Subject;
  urgencyScore: number;
  reason: string;
}

export function getSmartRecommendations(subjects: Subject[], tasks: Task[]): RecommendedSubject[] {
  const today = new Date('2026-06-16T01:51:46-07:00'); // current time mock boundary

  const recommendations = subjects.map(sub => {
    // 1. Get tasks due soon for this subject
    const pendingTasks = tasks.filter(t => t.subjectId === sub.id && !t.completed);
    
    let daysUntilDue = 999;
    let avgDifficulty = 0;
    
    if (pendingTasks.length > 0) {
      avgDifficulty = pendingTasks.reduce((sum, t) => sum + t.difficulty, 0) / pendingTasks.length;
      
      // Calculate min days until due
      pendingTasks.forEach(t => {
        const diffTime = new Date(t.dueDate).getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays >= 0 && diffDays < daysUntilDue) {
          daysUntilDue = diffDays;
        }
      });
    }

    // Progress = completed / total
    const total = sub.totalChapters || 1;
    const progress = sub.completedChapters / total;

    // urgencyScore calculation
    const examUrgency = (sub.examDate && (new Date(sub.examDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24) <= 5) ? 2 : 0;
    const dueUrgency = daysUntilDue <= 2 ? 3 : 1;
    const progressFactor = (1 - progress) * 2;
    const difficultyWeight = avgDifficulty * 0.4; // Weight standard is 1-5, so up to 2.0

    const urgencyScore = dueUrgency + progressFactor + difficultyWeight + examUrgency;

    // Reason generation
    let reason = '';
    if (daysUntilDue <= 2) {
      reason = `Task is due in ${daysUntilDue} day(s).`;
    } else if (examUrgency > 0 && sub.examDate) {
      reason = `Exam is approaching soon (${sub.examDate}).`;
    } else if (progress < 0.3) {
      reason = `Progress is critically low (${Math.round(progress * 100)}%).`;
    } else if (pendingTasks.length > 0) {
      reason = `Has ${pendingTasks.length} pending high-priority tasks.`;
    } else {
      reason = `Requires routine review to keep up chapter counts.`;
    }

    return {
      subject: sub,
      urgencyScore: parseFloat(urgencyScore.toFixed(2)),
      reason
    };
  });

  // Sort descending and return top 3
  return recommendations.sort((a, b) => b.urgencyScore - a.urgencyScore).slice(0, 3);
}

// Algorithm B: Auto Scheduler Algorithm
// User inputs: available hours per day, exam dates per subject
// Distributes study sessions across days using a greedy interval allocation
export function runAutoScheduler(
  subjects: Subject[], 
  availableHoursPerDay: number,
  examDates: Record<string, string> // subjectId -> YYYY-MM-DD
): StudyBlock[] {
  const resultBlocks: StudyBlock[] = [];
  const days: ('Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun')[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  if (subjects.length === 0) return [];

  const today = new Date('2026-06-16T01:51:46-07:00');

  // Let's filter/sort subjects based on exam dates (ascending)
  const sortedSubjects = [...subjects].map(sub => {
    const exDateStr = examDates[sub.id] || sub.examDate || '';
    const exDateTime = exDateStr ? new Date(exDateStr).getTime() : today.getTime() + (30 * 24 * 60 * 60 * 1000); // 30 days away if none
    const daysRemaining = Math.max(1, Math.ceil((exDateTime - today.getTime()) / (1000 * 60 * 60 * 24)));
    return {
      ...sub,
      examDate: exDateStr,
      daysRemaining
    };
  }).sort((a, b) => a.daysRemaining - b.daysRemaining);

  // Allocate hours using greedy distribution
  // Formula: targetMinutesMultiplier = (remainingChapters / totalChapters) * availableHours * urgencyMultiplier
  // Then we allocate blocks on the calendar.
  
  // Available schedule slots: Mon to Sun. Let's create blocks dynamically.
  // We can fit blocks in the mornings (09:00 - 11:30) and afternoons (14:00 - 16:30) or any appropriate sequence
  let blockIndex = 1;
  const timePreferences = [
    { start: '09:00', end: '10:30' },
    { start: '11:00', end: '12:30' },
    { start: '14:00', end: '15:30' },
    { start: '16:00', end: '17:30' }
  ];

  days.forEach((day, dayIdx) => {
    let slotsUsed = 0;
    const maxSlotsForDay = Math.min(timePreferences.length, Math.ceil(availableHoursPerDay / 1.5));

    // Distribute subjects proportionally based on score
    sortedSubjects.forEach(sub => {
      if (slotsUsed >= maxSlotsForDay) return;

      const remainingChapters = Math.max(1, sub.totalChapters - sub.completedChapters);
      const total = sub.totalChapters || 1;
      const chProgressRatio = remainingChapters / total;
      
      // Urgency is higher if exam is closer
      const urgencyMultiplier = sub.daysRemaining <= 3 ? 2.5 : sub.daysRemaining <= 7 ? 1.8 : 1.0;
      const allocateScore = chProgressRatio * urgencyMultiplier;

      // Decide if we should allocate a session for this subject today
      // Higher score subjects get scheduled earlier and more frequently
      if (allocateScore > 0.3) {
        // Find next free time preference
        if (slotsUsed < maxSlotsForDay) {
          const pref = timePreferences[slotsUsed];
          const hasExamDate = !!sub.examDate;
          const priority = urgencyMultiplier > 2 ? 'High' : urgencyMultiplier > 1.5 ? 'Medium' : 'Low';

          resultBlocks.push({
            id: `auto-block-${blockIndex++}`,
            subjectId: sub.id,
            day,
            startTime: pref.start,
            endTime: pref.end,
            priority
          });
          slotsUsed++;
        }
      }
    });

    // If still have unused hours, allocate some standard reviews for remaining slots
    if (slotsUsed < maxSlotsForDay && sortedSubjects.length > 0) {
      for (let s = slotsUsed; s < maxSlotsForDay; s++) {
        const sub = sortedSubjects[s % sortedSubjects.length];
        const pref = timePreferences[s];
        resultBlocks.push({
          id: `auto-block-${blockIndex++}`,
          subjectId: sub.id,
          day,
          startTime: pref.start,
          endTime: pref.end,
          priority: 'Low'
        });
      }
    }
  });

  return resultBlocks;
}

// Algorithm C: Pomodoro Productivity Score
// Weekly productivity score: avg(focusRatings) * completedPomodoros / targetPomodoros * 100
// Target Pomodoros is 8 for a perfect week.
export function calculateWeeklyProductivity(logs: PomodoroLog[], weekStr: string, targetPomodoros: number = 8) {
  const weeklyLogs = logs.filter(log => log.weekAndYear === weekStr);
  const completedPomodoros = weeklyLogs.length;

  if (completedPomodoros === 0) {
    return {
      score: 0,
      completed: 0,
      avgRating: 0
    };
  }

  const sumRatings = weeklyLogs.reduce((sum, log) => sum + log.rating, 0);
  const avgRating = sumRatings / completedPomodoros;

  // Formula as requested: avg(focusRatings) * completedPomodoros / targetPomodoros * 100
  // To avoid scores soaring above 100 if completed exceeds target, cap completedPomodoros / targetPomodoros at 1 OR allow it to go above but let's cap ratings multiplier at max rating of 5, which means 5 * 1 * 20 = 100. Let's make it:
  const mathScore = (avgRating / 5) * Math.min(1, completedPomodoros / targetPomodoros) * 100;
  
  return {
    score: Math.round(mathScore),
    completed: completedPomodoros,
    avgRating: parseFloat(avgRating.toFixed(1))
  };
}

// Get last week string
export function getLastWeekString(weekStr: string): string {
  // Parsing YYYY-WN
  const parts = weekStr.split('-W');
  if (parts.length !== 2) return weekStr;
  const year = parseInt(parts[0]);
  const week = parseInt(parts[1]);

  if (week === 1) {
    return `${year - 1}-W52`; // Approximation
  } else {
    return `${year}-W${String(week - 1).padStart(2, '0')}`;
  }
}

// Format minutes into clean text
export function formatMinutes(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
}
