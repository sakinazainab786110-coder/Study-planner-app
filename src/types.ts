export interface Subject {
  id: string;
  name: string;
  color: string; // hex code or color class name
  totalChapters: number;
  completedChapters: number;
  examDate?: string; // YYYY-MM-DD
}

export type Priority = 'High' | 'Medium' | 'Low';
export type EisenhowerQuadrant = 'ur-im' | 'nur-im' | 'ur-nim' | 'nur-nim'; // Urgent+Important, Not Urgent+Important, Urgent+Not Important, Neither

export interface StudyBlock {
  id: string;
  subjectId: string;
  day: string; // 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun'
  startTime: string; // "09:00"
  endTime: string; // "10:30"
  priority: Priority;
}

export interface Task {
  id: string;
  title: string;
  subjectId: string;
  dueDate: string; // YYYY-MM-DD
  estimatedTime: number; // minutes
  difficulty: number; // 1 to 5 stars
  completed: boolean;
  quadrant?: EisenhowerQuadrant; // Eisenhower Matrix classification
}

export type PomodoroMode = 'Focus' | 'Short Break' | 'Long Break';

export interface PomodoroLog {
  id: string;
  subjectId: string;
  timestamp: string; // YYYY-MM-DDTHH:mm:ss.sssZ
  duration: number; // minutes actually focused
  rating: number; // 1-5 rating logged after completion
  weekAndYear: string; // e.g. "2026-W25" for productivity scoring trend
}

export interface WeeklyGoal {
  hourGoal: number;
  completedHours: number;
}

export interface Note {
  subjectId: string;
  content: string;
  updatedAt: string; // ISO String
}

export interface SrsItem {
  id: string;
  title: string;
  subjectId: string;
  easinessFactor: number; // starts at 2.5
  interval: number; // in days, starts at 1
  repetitions: number; // starts at 0
  nextReviewDate: string; // YYYY-MM-DD
  lastReviewedDate?: string; // YYYY-MM-DD
}

export interface AchievementBadge {
  id: string;
  title: string;
  description: string;
  icon: string; // emoji or lucide designation
  unlockedAt?: string; // date string
}

export interface ProjectData {
  subjects: Subject[];
  tasks: Task[];
  studyBlocks: StudyBlock[];
  notes: Note[];
  pomodoroLogs: PomodoroLog[];
  weeklyHourGoal: number;
  currentStreak: number;
  lastStudiedDate: string | null; // "YYYY-MM-DD"
  xp?: number;
  level?: number;
  unlockedBadges?: string[];
  srsItems?: SrsItem[];
}

