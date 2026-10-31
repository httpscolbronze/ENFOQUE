import { GoogleGenAI } from '@google/genai';
import { AppUsage, AppLimit, Subject, WellnessMetricSummary } from '../types/index.ts';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  suggestions?: string[];
}

export class AICoachService {
  private client: GoogleGenAI | null = null;
  private apiKey: string | null = null;

  constructor() {
    const key = (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) ||
      (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GEMINI_API_KEY);
    if (key) {
      this.apiKey = key;
      try {
        this.client = new GoogleGenAI({ apiKey: key });
      } catch (err) {
        console.warn('Failed to initialize GoogleGenAI client:', err);
      }
    }
  }

  async askCoach(params: {
    userPrompt: string;
    screenTime: AppUsage[];
    limits: AppLimit[];
    metrics: WellnessMetricSummary;
    subjects: Subject[];
    conversationHistory: ChatMessage[];
  }): Promise<string> {
    const { userPrompt, screenTime, metrics, subjects, conversationHistory } = params;

    // Construct rich context grounded in real user data
    const topApps = [...screenTime].sort((a, b) => b.minutes - a.minutes).slice(0, 5)
      .map(a => `${a.app} (${a.minutes}m, ${a.category})`).join(', ');

    const exceededApps = metrics.warnings.map(w => 
      `${w.app}: ${w.usage_minutes}m (Limit: ${w.limit_minutes}m, Exceeded: +${w.exceeded_by}m)`
    ).join('; ');

    const subjectList = subjects.map(s => 
      `${s.name} [Priority: ${s.priority}, Deadline: ${s.deadline}, Done: ${s.completed_hours}h/${s.target_hours}h]`
    ).join('; ');

    const systemInstruction = `You are ENFOQUE AI, an elite digital wellness coach, dopamine detox strategist, and academic study optimization mentor.
You analyze real student screen time and study schedules to provide actionable, psychologically sound advice (habit stacking, friction design, Pomodoro, spaced repetition, circadian light habits).

CURRENT STUDENT CONTEXT:
- Total Screen Time Today: ${metrics.total_formatted} (${metrics.total_minutes} mins)
- Digital Wellness Score: ${metrics.wellness_score}/100
- Focus Ratio: ${metrics.focus_ratio}% (Productive vs Total)
- Top Apps Used: ${topApps || 'None logged yet'}
- Limit Violations: ${exceededApps || 'None! Clean record today'}
- Active Study Subjects: ${subjectList || 'None enrolled'}

Tone: Compassionate, hyper-actionable, scientific, encouraging, direct. Format with crisp bullet points, bold key actions, and keep answers concise (under 250 words). Avoid generic fluff.`;

    // If real Gemini API client is available with valid key
    if (this.client) {
      try {
        const response = await this.client.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [
            { role: 'user', parts: [{ text: `${systemInstruction}\n\nUser Question: ${userPrompt}` }] }
          ]
        });
        if (response && response.text) {
          return response.text;
        }
      } catch (err) {
        console.warn('Gemini API call failed, falling back to dynamic context engine:', err);
      }
    }

    // Dynamic intelligent fallback grounded directly in current user data
    return this.generateDynamicResponse(userPrompt, metrics, screenTime, subjects);
  }

  private generateDynamicResponse(
    prompt: string,
    metrics: WellnessMetricSummary,
    screenTime: AppUsage[],
    subjects: Subject[]
  ): string {
    const lower = prompt.toLowerCase();
    const topSocial = screenTime.find(a => a.category === 'Social Media' && a.minutes > 45);
    const topUrgentSub = subjects.find(s => s.priority === 'Urgent') || subjects[0];

    if (lower.includes('doomscroll') || lower.includes('instagram') || lower.includes('tiktok') || lower.includes('social')) {
      const appName = topSocial?.app || 'social media';
      const mins = topSocial?.minutes || 90;
      return `### 🛑 Breaking the ${appName} Dopamine Loop

You've spent **${mins} minutes** on ${appName} today. When studying requires high cognitive load, your brain seeks frictionless dopamine rewards.

**Immediate 3-Step Protocol:**
1. **Friction Injection:** Move ${appName} into a hidden folder or turn on **Grayscale Display** (Settings → Accessibility → Color Filters). Without vibrant colors, dopamine pull drops by ~40%.
2. **The 5-Minute Gateway:** Tell yourself: *"I will open ${topUrgentSub ? topUrgentSub.name : 'my study notes'} and read just for 5 minutes."* Starting friction is 90% of the battle.
3. **Physical Distance:** Place your phone in another room or inside your backpack during study blocks.

Would you like to start a **25-minute Pomodoro session** right now?`;
    }

    if (lower.includes('schedule') || lower.includes('timetable') || lower.includes('plan') || lower.includes('tomorrow')) {
      return `### 📅 Optimized Study & Wellness Timetable

Based on your current deadlines and **${metrics.wellness_score}/100** wellness score:

• **08:30 AM - 09:00 AM:** Low-dopamine morning (water, daylight, zero phone).
• **09:00 AM - 11:00 AM [DEEP WORK]:** **${topUrgentSub ? topUrgentSub.name : 'Urgent Subject'}** (Peak cognitive alertness).
• **11:00 AM - 11:30 AM:** Mindful break (walk, stretching, light hydration).
• **11:30 AM - 01:00 PM:** Secondary study block + practice problems.
• **03:00 PM - 03:45 PM:** Permitted quick social check-in (capped at 20m with a hard timer).
• **09:30 PM:** Digital Sunset (screens off 45m before sleep).

*Tip:* Knocking out your highest-priority exam material before 11:00 AM completely eliminates afternoon guilt!`;
    }

    if (lower.includes('warning') || lower.includes('limit') || lower.includes('exceed')) {
      if (metrics.warnings.length > 0) {
        const topWarn = metrics.warnings[0];
        return `### ⚠️ Limit Analysis: ${topWarn.app} (+${topWarn.exceeded_by}m)

You've surpassed your threshold on **${topWarn.app}** (${topWarn.usage_minutes}m vs ${topWarn.limit_minutes}m limit).

**Why this matters:**
This extra ${topWarn.exceeded_by} minutes represents almost a full study block for **${topUrgentSub ? topUrgentSub.name : 'your upcoming exam'}**.

**Recommended Actions:**
• Enable the app limit lockout in ENFOQUE AI settings.
• Replace passive scrolling with active retrieval: when you feel the urge to open ${topWarn.app}, open 5 flashcards or review 1 theorem instead.`;
      }
      return `### ✅ Clean Record!
None of your monitored apps have exceeded their designated boundaries today. Your Focus Ratio is **${metrics.focus_ratio}%**. Keep this momentum rolling through tomorrow morning!`;
    }

    // Default holistic response
    return `### 💡 Personalized ENFOQUE Wellness Analysis

Here is where your focus energy currently stands:
• **Total Screen Time:** ${metrics.total_formatted} (Focus Ratio: ${metrics.focus_ratio}%)
• **Wellness Score:** ${metrics.wellness_score}/100
• **Primary Distractor:** ${topSocial ? `${topSocial.app} (${topSocial.minutes}m)` : 'None detected'}
• **Next Academic Priority:** ${topUrgentSub ? `${topUrgentSub.name} (Deadline: ${topUrgentSub.deadline})` : 'Coursework review'}

**Coach's Recommendation for Today:**
1. Cap further entertainment screen time to **15 minutes** for the remainder of the evening.
2. Prepare your study environment tonight: open tomorrow morning's subject tab so you can begin without decision fatigue.
3. Review your **Nightly Report** and dispatch your daily progress to WhatsApp!`;
  }
}

export const aiCoachService = new AICoachService();
