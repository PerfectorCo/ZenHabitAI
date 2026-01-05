
export interface UserProfile {
  name: string;
  email: string;
  bio: string;
  mainGoal: string;
  avatarUrl?: string;
  joinedDate: string;
}

export interface Category {
  id: string;
  name: string;
  userId: string;
}

export interface Habit {
  id: string;
  title: string;
  category: string;
  completedDates: string[]; // ISO Strings
  createdAt: string;
  targetCount: number; // sessions per day/week
  streak: number;
  timeSpentMinutes: number;
  reminderTime?: string; // HH:mm format
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  completedDates?: string[]; // Track when task was completed (useful for recurring tasks)
  skippedDates?: string[]; // Track when task was skipped for the day
  repeatDays?: number[]; // [0,1,2,3,4,5,6] where 0 is Sunday
  timeSpent: number; // in seconds
  createdAt: string;
  reminderTime?: string; // HH:mm format
  isRecurring?: boolean; // If true, resets on scheduled days
}

export interface TaskTemplate {
  id: string;
  title: string;
  category: string;
  isRecurring: boolean;
  repeatDays?: number[];
}

export interface FocusSession {
  id: string;
  type: 'focus' | 'break';
  goalTitle: string;
  durationMinutes: number;
  timestamp: string;
}

export interface Recommendation {
  title: string;
  reason: string;
  priority: 'low' | 'medium' | 'high';
  suggestedHabit?: {
    title: string;
    category: string;
  };
}

export type ViewType = 'dashboard' | 'habits' | 'pomodoro' | 'analytics' | 'profile';
