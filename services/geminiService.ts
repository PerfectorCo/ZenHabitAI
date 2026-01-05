
import { GoogleGenAI, Type } from "@google/genai";
import { Habit, Recommendation, UserProfile, FocusSession } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getAIRecommendations = async (habits: Habit[], profile: UserProfile, lang: 'en' | 'vi' = 'en'): Promise<Recommendation[]> => {
  const habitsSummary = habits.map(h => ({
    title: h.title,
    streak: h.streak,
    totalTimeSpent: h.timeSpentMinutes,
    completionRate: h.completedDates.length
  }));

  const prompt = `User Profile:
  Name: ${profile.name}
  Main Goal: ${profile.mainGoal}
  Bio: ${profile.bio}

  Current Habit Data: ${JSON.stringify(habitsSummary)}
  
  Language: ${lang === 'vi' ? 'Vietnamese' : 'English'}

  Based on this, provide 3 personalized recommendations. At least one should be a "New Habit Suggestion" that the user can immediately add to their tracker. 
  For suggestions that are specifically new habits, include a 'suggestedHabit' object with a short 'title' and 'category' (Health, Mindset, Work, or Skills).
  IMPORTANT: Return all text in ${lang === 'vi' ? 'Vietnamese' : 'English'}.`;

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

export const getAIInsights = async (habits: Habit[], sessions: FocusSession[], period: string, lang: 'en' | 'vi' = 'en'): Promise<string> => {
  const habitsSummary = habits.map(h => ({ title: h.title, completions: h.completedDates.length }));
  const totalFocus = sessions.filter(s => s.type === 'focus').reduce((acc, s) => acc + s.durationMinutes, 0);

  const prompt = `Analyze this user's habit data for the past ${period}:
  Habits: ${JSON.stringify(habitsSummary)}
  Total Focus Time: ${totalFocus} minutes.
  
  Language: ${lang === 'vi' ? 'Vietnamese' : 'English'}

  Give a brief (max 3 sentences), highly motivational and personal insight in a supportive 'Zen coach' tone. Focus on consistency and growth.
  IMPORTANT: Return the response in ${lang === 'vi' ? 'Vietnamese' : 'English'}.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text || "";
  } catch (e) {
    return lang === 'vi' ? "Mọi hành trình vạn dặm đều bắt đầu từ một bước chân." : "Every journey begins with a single step.";
  }
};
