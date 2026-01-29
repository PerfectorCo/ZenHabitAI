import type {
  AtomicHabitRecommendation,
  AtomicHabitRecommendationsResult,
  RecommendationPriority,
  ZenSenseiInsight,
} from "../types";

const RECOMMENDATIONS_MAX = 3;
const ZEN_SENSEI_MESSAGE_MAX_LENGTH = 400;
const LIST_MARKUP_REGEX = /[*_#\-•]/g;

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object";
}

function coercePriority(value: unknown): RecommendationPriority {
  if (value === "low" || value === "high") return value;
  return "medium";
}

/**
 * Validates and normalizes raw model output into AtomicHabitRecommendationsResult.
 * Trims to max 3 items, coerces types, drops invalid items. Returns empty array on failure.
 */
export function validateAtomicHabitRecommendationsResult(
  parsed: unknown,
): AtomicHabitRecommendationsResult {
  if (!isObject(parsed)) {
    return { recommendations: [] };
  }

  const rawList = parsed.recommendations;
  const list = Array.isArray(rawList) ? rawList : [];

  const normalized: AtomicHabitRecommendation[] = list
    .slice(0, RECOMMENDATIONS_MAX)
    .filter((item): item is Record<string, unknown> => isObject(item))
    .map((item) => ({
      title: typeof item.title === "string" ? item.title : String(item.title ?? ""),
      microAction:
        typeof item.microAction === "string" ? item.microAction : String(item.microAction ?? ""),
      explanation:
        typeof item.explanation === "string" ? item.explanation : String(item.explanation ?? ""),
      priority: coercePriority(item.priority),
    }))
    .filter(
      (rec) =>
        rec.title.trim().length > 0 &&
        rec.microAction.trim().length > 0 &&
        rec.explanation.trim().length > 0,
    );

  return { recommendations: normalized };
}

/**
 * Validates and normalizes raw model output into ZenSenseiInsight.
 * Trims message length, strips list markup. Uses fallback for missing or invalid fields.
 */
export function validateZenSenseiInsight(
  parsed: unknown,
  fallback: ZenSenseiInsight,
): ZenSenseiInsight {
  if (!isObject(parsed)) {
    return fallback;
  }

  const title =
    typeof parsed.title === "string" && parsed.title.trim().length > 0
      ? parsed.title.trim()
      : fallback.title;

  let message = typeof parsed.message === "string" ? parsed.message.trim() : "";
  if (message.length > ZEN_SENSEI_MESSAGE_MAX_LENGTH) {
    message = message.slice(0, ZEN_SENSEI_MESSAGE_MAX_LENGTH).trim();
  }
  message = message.replace(LIST_MARKUP_REGEX, "").trim();
  if (message.length === 0) {
    message = fallback.message;
  }

  return { title, message };
}
