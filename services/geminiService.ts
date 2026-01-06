
import { GoogleGenAI, Type } from "@google/genai";
import { Habit, Task, Recommendation, UserProfile, FocusSession } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getAIRecommendations = async (habits: Habit[], profile: UserProfile, lang: 'en' | 'vi' = 'en'): Promise<Recommendation[]> => {
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
  - title: A simple title (e.g., "Morning Breathwork" or "Nhịp thở buổi sáng").
  - reason: A short sentence explaining why this fits their focus (${focusArea}). NO commands.
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
  } catch (error) {
    console.error("AI Error:", error);
    return [];
  }
};

export const getAIInsights = async (habits: Habit[], tasks: Task[], sessions: FocusSession[], profile: UserProfile, period: string, lang: 'en' | 'vi' = 'en'): Promise<string> => {
  const habitsSummary = habits.map(h => ({ title: h.title, completions: h.completedDates.length, currentStreak: h.streak }));
  const tasksSummary = tasks.map(t => ({ title: t.title, completed: t.completed }));
  const totalFocus = sessions.filter(s => s.type === 'focus').reduce((acc, s) => acc + s.durationMinutes, 0);
  
  const totalHistoricalCompletions = habits.reduce((acc, h) => acc + h.completedDates.length, 0) + tasks.filter(t => t.completed).length;
  const joinedDate = new Date(profile.joinedDate);
  const daysSinceJoined = Math.floor((new Date().getTime() - joinedDate.getTime()) / (1000 * 3600 * 24));
  
  const isNewUser = daysSinceJoined < 3 && totalHistoricalCompletions === 0;
  const isInactiveUser = daysSinceJoined >= 7 && habitsSummary.every(h => h.completions === 0) && tasksSummary.every(t => !t.completed) && totalFocus === 0;
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
  2. NO bullet points, NO numbers, NO emojis, NO special symbols (#, *, etc).
  3. Tone: Calm, reflective, non-judgmental. 
  4. Never use "must", "should", or "failed". Use "can", "pause", "begin", "aligned".
  5. If inactive: Offer gentle encouragement that every day is a fresh beginning.
  6. Response must be strictly in ${lang === 'vi' ? 'Vietnamese' : 'English'}.
  
  Example (English): This week you returned more often than you left. Your rhythm is becoming steadier. Keep going in the same gentle way.
  Example (Vietnamese): Tuần này nhịp điệu của bạn đang dần trở nên ổn định hơn. Mỗi ngày là một khởi đầu mới và bạn đang đi đúng hướng. Hãy cứ tiếp tục một cách nhẹ nhàng như vậy.`;

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
    // Clean any residual symbols
    result = result.replace(/[*_#\-•]/g, '').trim();
    return result;
  } catch (e) {
    if (lang === 'vi') {
      return "Mỗi ngày là một khởi đầu mới. Bạn có thể bắt đầu lại bất cứ khi nào sẵn sàng.";
    }
    return "Every day is a fresh beginning. You can start again whenever you are ready.";
  }
};
