
export interface UserProfile {
  name: string;
  email: string;
  bio: string;
  mainGoal: string;
  avatarUrl?: string;
  joinedDate: string;
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
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  timeSpent: number; // in seconds
  createdAt: string;
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
