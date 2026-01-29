
export interface UserProfile {
  name: string;
  email: string;
  bio: string;
  mainGoal: string;
  customGoalOptions?: string[];
  hiddenStandardGoals?: string[]; // IDs of standard goals the user has "deleted"
  avatarUrl?: string;
  joinedDate: string;
  onboardingCompleted?: boolean;
  subscription: 'free' | 'pro' | 'master';
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
  userId?: string;
  type: 'focus' | 'break';
  goalTitle: string;
  durationMinutes: number;
  timestamp: string;
}

export interface FeedbackSubmission {
  id: string;
  userId: string;
  type: 'bug' | 'suggestion' | 'other';
  message: string;
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

export interface StoredAIRecommendations {
  recommendations: Recommendation[];
  timestamp: string;
  mainGoal: string;
  language: string;
}

export interface StoredAIInsights {
  period: string;
  insight: string;
  timestamp: string;
  language: string;
}

export type ViewType = 'dashboard' | 'habits' | 'pomodoro' | 'analytics' | 'profile' | 'onboarding' | 'feedback';

/**
 * Atomic Habits AI – shared context for AI contracts.
 * This shape is designed to be reusable across multiple AI features.
 */
export interface UserProfileContext {
  id: string;
  name?: string;
  language: string;
  mainGoal?: string;
  identityDescription?: string;
}

/**
 * Lightweight summary of a habit for AI prompts.
 * Mirrors the persisted habit shape but keeps only fields needed for AI.
 */
export interface HabitSummary {
  id: string;
  title: string;
  category?: string;
  completedDates: string[];
  streak: number;
  targetCount?: number;
  timeSpentMinutes?: number;
}

/**
 * Aggregated activity metrics used to contextualize AI responses.
 */
export interface ActivitySnapshot {
  recentCompletions: number;
  focusMinutesLast7Days: number;
  inactivityDays: number;
}

/**
 * Priority for a recommendation, encoded as a small, explicit union.
 */
export type RecommendationPriority = 'low' | 'medium' | 'high';

/**
 * Core Atomic Habits–aligned recommendation unit.
 * Each microAction should take ≤ 10 minutes and be actionable today.
 */
export interface AtomicHabitRecommendation {
  title: string;
  microAction: string;
  explanation: string;
  priority: RecommendationPriority;
}

/**
 * Wrapper for Atomic Habits recommendations.
 *
 * Behavioural contract:
 * - The service enforces a maximum of three recommendations per call.
 * - Callers should never rely on more than three items in the array.
 */
export interface AtomicHabitRecommendationsResult {
  recommendations: AtomicHabitRecommendation[];
}

/**
 * Convenience alias for the bounded recommendations list.
 * The runtime service guarantees this list is truncated to at most three items.
 */
export type AtomicHabitRecommendationList = AtomicHabitRecommendation[];

/**
 * Zen Sensei insight payload.
 *
 * Behavioural contract:
 * - Exactly one message string per call.
 * - Intended to be short and digestible in UI (roughly <= 400 characters).
 */
export interface ZenSenseiInsight {
  title: string;
  message: string;
}
