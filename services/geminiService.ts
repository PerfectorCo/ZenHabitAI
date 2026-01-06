
import { GoogleGenAI, Type } from "@google/genai";
import { Habit, Task, Recommendation, UserProfile, FocusSession } from "../types";

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
