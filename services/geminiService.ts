
import { GoogleGenAI, Type } from "@google/genai";
import {
  Habit,
  Task,
  Recommendation,
  UserProfile,
  FocusSession,
  UserProfileContext,
  HabitSummary,
  ActivitySnapshot,
  AtomicHabitRecommendationsResult,
  ZenSenseiInsight,
} from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Timeless Wisdom Fallbacks for when the AI is "reflecting" (Quota hit)
const getStaticFallbacks = (goal: string, lang: 'en' | 'vi'): Recommendation[] => {
  const isVi = lang === 'vi';
  const fallbacks: Record<string, Recommendation[]> = {
    prod: [
      {
        title: isVi ? "Khởi đầu tĩnh lặng" : "A Quiet Start",
        reason: isVi ? "Bắt đầu ngày mới không thiết bị điện tử giúp tâm trí minh mẫn hơn." : "Starting the day without digital noise allows for deeper clarity.",
        priority: 'high',
        suggestedHabit: { title: isVi ? "10 phút không điện thoại buổi sáng" : "10m No-Phone Morning", category: 'Mindset' }
      },
      {
        title: isVi ? "Nhịp nghỉ tập trung" : "Focused Interval",
        reason: isVi ? "Làm việc theo nhịp độ giúp duy trì năng lượng bền bỉ." : "Working in rhythms prevents exhaustion and maintains quality.",
        priority: 'medium',
        suggestedHabit: { title: isVi ? "Một phiên Pomodoro sâu" : "One Deep Pomodoro", category: 'Work' }
      }
    ],
    fitness: [
      {
        title: isVi ? "Chuyển động nhẹ nhàng" : "Gentle Movement",
        reason: isVi ? "Cơ thể cần sự vận động để lưu thông dòng chảy năng lượng." : "The body thrives on movement to keep the energy flowing.",
        priority: 'high',
        suggestedHabit: { title: isVi ? "Giãn cơ 5 phút" : "5m Mindful Stretching", category: 'Health' }
      }
    ],
    mental: [
      {
        title: isVi ? "Hơi thở chánh niệm" : "Mindful Breath",
        reason: isVi ? "Quay về với hơi thở là cách nhanh nhất để tìm lại sự cân bằng." : "Returning to the breath is the swiftest path to inner balance.",
        priority: 'high',
        suggestedHabit: { title: isVi ? "3 phút hít thở sâu" : "3m Deep Breathing", category: 'Mindset' }
      }
    ]
  };

  const key = Object.keys(fallbacks).find(k => goal.toLowerCase().includes(k)) || 'prod';
  return fallbacks[key];
};

type AtomicHabitsLang = "en" | "vi";

interface AtomicHabitRecommendationsArgs {
  profile: UserProfileContext;
  habits: HabitSummary[];
  activity: ActivitySnapshot;
  lang?: AtomicHabitsLang;
  signal?: AbortSignal;
}

const buildAtomicHabitsToneBlock = (lang: AtomicHabitsLang): string => {
  const label = lang === "vi" ? "Vietnamese (calm, non-teaching)" : "English (reflective, non-optimizing)";

  return `
GLOBAL TONE RULES (MANDATORY):
- Calm, reflective, non-urgent.
- No shame, no judgment, no pressure.
- No productivity or hustle-culture jargon.
- Focus on returning, not perfection.
- Output language: ${label}.
`;
};

const buildAtomicHabitRecommendationsPrompt = (
  profile: UserProfileContext,
  habits: HabitSummary[],
  activity: ActivitySnapshot,
  lang: AtomicHabitsLang,
): string => {
  const habitsSummary = habits.map((h) => ({
    id: h.id,
    title: h.title,
    category: h.category ?? "",
    streak: h.streak,
    completedDates: h.completedDates,
    targetCount: h.targetCount ?? null,
    timeSpentMinutes: h.timeSpentMinutes ?? null,
  }));

  return `
You are ZenHabit AI, an Atomic Habits–aligned assistant.

User profile:
- id: ${profile.id}
- name: ${profile.name ?? ""}
- main goal: ${profile.mainGoal ?? ""}
- identity: ${profile.identityDescription ?? ""}

Habit summary (for context only): ${JSON.stringify(habitsSummary)}

Recent activity snapshot:
- recentCompletions: ${activity.recentCompletions}
- focusMinutesLast7Days: ${activity.focusMinutesLast7Days}
- inactivityDays: ${activity.inactivityDays}

TASK:
- Propose up to 3 tiny habits the user can do TODAY, each taking at most 10 minutes.
- Apply Atomic Habits laws: Make it Obvious, Make it Attractive, Make it Easy.
- Focus on *returning* and consistency, never on guilt or optimization.

${buildAtomicHabitsToneBlock(lang)}

OUTPUT FORMAT:
Return ONLY valid JSON matching this schema:
{
  "recommendations": [
    {
      "title": "short title",
      "microAction": "one concrete action the user can do today in <= 10 minutes",
      "explanation": "why this fits their current situation in a gentle tone",
      "priority": "low" | "medium" | "high"
    }
  ]
}

Rules:
- Max 3 items in the recommendations array.
- Each microAction must describe something the user can start immediately today.
`;
};

export const getAtomicHabitRecommendations = async (
  args: AtomicHabitRecommendationsArgs,
): Promise<AtomicHabitRecommendationsResult> => {
  const { profile, habits, activity, lang = "en" } = args;

  if (args.signal?.aborted) {
    return { recommendations: [] };
  }

  const prompt = buildAtomicHabitRecommendationsPrompt(profile, habits, activity, lang);

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recommendations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  microAction: { type: Type.STRING },
                  explanation: { type: Type.STRING },
                  priority: {
                    type: Type.STRING,
                    enum: ["low", "medium", "high"],
                  },
                },
                required: ["title", "microAction", "explanation", "priority"],
              },
            },
          },
          required: ["recommendations"],
        },
      },
    });

    const raw = JSON.parse(response.text || "{}") as Partial<AtomicHabitRecommendationsResult>;
    const list = Array.isArray(raw.recommendations) ? raw.recommendations : [];

    const normalized = list
      .slice(0, 3)
      .filter(
        (item): item is AtomicHabitRecommendationsResult["recommendations"][number] =>
          typeof item?.title === "string" &&
          typeof item?.microAction === "string" &&
          typeof item?.explanation === "string",
      )
      .map((item) => ({
        title: item.title,
        microAction: item.microAction,
        explanation: item.explanation,
        priority:
          item.priority === "low" || item.priority === "high" ? item.priority : ("medium" as const),
      }));

    return { recommendations: normalized };
  } catch (error) {
    console.warn("Atomic Habits AI Recommendations error:", error);
    return { recommendations: [] };
  }
};

interface ZenSenseiArgs {
  profile: UserProfileContext;
  activity: ActivitySnapshot;
  insightType: "daily" | "weekly" | "monthly";
  lang?: AtomicHabitsLang;
  signal?: AbortSignal;
}

export const getZenSenseiInsight = async (
  args: ZenSenseiArgs,
): Promise<ZenSenseiInsight> => {
  const { profile, activity, insightType, lang = "en" } = args;
  const isVi = lang === "vi";

  const prompt = `
You are Zen Sensei, a quiet, grounded guide.

User profile:
- id: ${profile.id}
- name: ${profile.name ?? ""}
- main goal: ${profile.mainGoal ?? ""}
- identity: ${profile.identityDescription ?? ""}

Recent activity snapshot:
- recentCompletions: ${activity.recentCompletions}
- focusMinutesLast7Days: ${activity.focusMinutesLast7Days}
- inactivityDays: ${activity.inactivityDays}

Insight type: ${insightType}

${buildAtomicHabitsToneBlock(lang)}

ADDITIONAL ZEN SENSEI RULES:
- Treat missing one day as normal.
- When inactivityDays >= 2, gently invite the user back without guilt.
- Do not use "should" or "must".
- No lists, bullets, emojis, or markdown.

OUTPUT FORMAT:
Return ONLY valid JSON matching this schema:
{
  "title": "short title",
  "message": "single cohesive paragraph, max ~400 characters"
}
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            message: { type: Type.STRING },
          },
          required: ["title", "message"],
        },
      },
    });

    const raw = JSON.parse(response.text || "{}") as Partial<ZenSenseiInsight>;
    const title = typeof raw.title === "string" && raw.title.trim().length > 0
      ? raw.title.trim()
      : isVi ? "Gợi ý nhẹ nhàng" : "A gentle reflection";

    let message = typeof raw.message === "string" ? raw.message.trim() : "";
    if (message.length > 400) {
      message = message.slice(0, 400).trim();
    }
    message = message.replace(/[*_#\-•]/g, "").trim();

    if (!message) {
      message = isVi
        ? "Mỗi lần quay lại là một cơ hội mới để bắt đầu nhẹ nhàng từ đầu."
        : "Each return is a new chance to begin gently from where you are.";
    }

    return { title, message };
  } catch (error) {
    console.warn("Zen Sensei insight error:", error);
    return {
      title: isVi ? "Khoảnh khắc tạm dừng" : "A quiet pause",
      message: isVi
        ? "Zen Sensei đang chiêm nghiệm. Bạn có thể bắt đầu lại hôm nay bằng một hành động nhỏ mà không cần vội vàng."
        : "The Zen Sensei is reflecting. You can begin again today with one small action, without any hurry.",
    };
  }
};

export const getAIRecommendations = async (habits: Habit[], profile: UserProfile, lang: 'en' | 'vi' = 'en'): Promise<Recommendation[] | { error: string, fallbacks: Recommendation[] }> => {
  const habitsSummary = habits.map(h => ({
    title: h.title,
    streak: h.streak,
    totalTimeSpent: h.timeSpentMinutes,
    completionRate: h.completedDates.length
  }));

  const totalHistoricalCompletions = habits.reduce((acc, h) => acc + h.completedDates.length, 0);
  const joinedDate = new Date(profile.joinedDate);
  const daysSinceJoined = Math.floor((new Date().getTime() - joinedDate.getTime()) / (1000 * 3600 * 24));

  const isNewUser = daysSinceJoined < 3 && totalHistoricalCompletions === 0;
  const focusArea = profile.mainGoal || 'General growth';

  const prompt = `User Profile:
  Name: ${profile.name}
  Main Habit Focus (Goal): ${focusArea}
  Bio: ${profile.bio}
  User State: ${isNewUser ? 'BRAND NEW USER' : 'EXISTING USER'}

  Current Habit Data: ${JSON.stringify(habitsSummary)}
  Language: ${lang === 'vi' ? 'Vietnamese' : 'English'}

  Your Task:
  Provide 3 highly personalized habit recommendations.

  Zen Tone Rules (STRICT):
  1. Use calm, non-judgmental, and gentle language.
  2. NO emojis, NO bullet points, NO special characters like # or *.
  3. Tone: Like a quiet mentor. Supportive but never pushy.
  4. Language: Natural, conversational ${lang === 'vi' ? 'Vietnamese' : 'English'}.

  Recommendation Logic:
  - If BRAND NEW: Suggest foundational habits for ${focusArea}. Keep them "Atomic" (easy to start).
  - If EXISTING: Suggest habits that complement their routine or fill gaps for ${focusArea}.

  JSON Structure:
  - title: A simple title.
  - reason: A short sentence explaining why this fits their focus.
  - priority: 'low', 'medium', or 'high'.
  - suggestedHabit: { title, category: 'Health', 'Mindset', 'Work', or 'Skills' }

  IMPORTANT: Return valid JSON.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              reason: { type: Type.STRING },
              priority: { type: Type.STRING, enum: ['low', 'medium', 'high'] },
              suggestedHabit: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  category: { type: Type.STRING }
                },
                required: ['title', 'category']
              }
            },
            required: ['title', 'reason', 'priority']
          }
        }
      }
    });

    return JSON.parse(response.text || "[]");
  } catch (error: any) {
    console.warn("AI Recommendations Quota/Error:", error);
    const fallbacks = getStaticFallbacks(focusArea, lang);
    if (error?.message?.includes('429') || error?.status === 429) {
      return { error: 'quota', fallbacks };
    }
    return fallbacks;
  }
};

export const getAIInsights = async (habits: Habit[], tasks: Task[], sessions: FocusSession[], profile: UserProfile, period: string, lang: 'en' | 'vi' = 'en'): Promise<string> => {
  const habitsSummary = habits.map(h => ({ title: h.title, completions: h.completedDates.length, currentStreak: h.streak }));
  const tasksSummary = tasks.map(t => ({ title: t.title, completed: t.completed }));
  const totalFocus = sessions.filter(s => s.type === 'focus').reduce((acc, s) => acc + s.durationMinutes, 0);

  const focusArea = profile.mainGoal || 'their goals';

  const prompt = `Contextual Analysis for User: ${profile.name}
  Main Goal: ${focusArea}
  Recent Data (${period}):
  - Habits: ${JSON.stringify(habitsSummary)}
  - Tasks: ${JSON.stringify(tasksSummary)}
  - Deep Work: ${totalFocus} minutes.
  Preferred Language: ${lang === 'vi' ? 'Vietnamese' : 'English'}

  Your Task:
  As a 'Zen Sensei', provide a brief insight.

  Zen Language Rules (MANDATORY):
  1. MAX 3 SENTENCES.
  2. NO bullet points, NO numbers, NO emojis, NO special symbols.
  3. Tone: Calm, reflective, non-judgmental.
  4. Response must be strictly in ${lang === 'vi' ? 'Vietnamese' : 'English'}.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        temperature: 0.7,
        topP: 0.8,
      }
    });

    let result = response.text || "";
    result = result.replace(/[*_#\-•]/g, '').trim();
    return result;
  } catch (error: any) {
    console.warn("AI Insights Quota/Error:", error);
    if (lang === 'vi') {
      return "Zen Sensei đang chiêm nghiệm sâu sắc. Trong lúc chờ đợi, hãy nhớ rằng mỗi bước đi nhỏ hôm nay đều là một phần của hành trình lớn.";
    }
    return "The Zen Sensei is in deep reflection. While we wait, remember that every small step today is part of a greater journey.";
  }
};
