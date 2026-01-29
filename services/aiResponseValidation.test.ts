import { describe, it, expect } from "vitest";
import {
  validateAtomicHabitRecommendationsResult,
  validateZenSenseiInsight,
} from "./aiResponseValidation";

const zenFallback = {
  title: "A gentle reflection",
  message: "Each return is a new chance to begin gently from where you are.",
};

describe("validateAtomicHabitRecommendationsResult", () => {
  it("returns empty recommendations for invalid JSON (non-object)", () => {
    expect(validateAtomicHabitRecommendationsResult(null)).toEqual({
      recommendations: [],
    });
    expect(validateAtomicHabitRecommendationsResult(undefined)).toEqual({
      recommendations: [],
    });
    expect(validateAtomicHabitRecommendationsResult("not an object")).toEqual({
      recommendations: [],
    });
    expect(validateAtomicHabitRecommendationsResult(42)).toEqual({
      recommendations: [],
    });
  });

  it("returns empty recommendations when recommendations is not an array", () => {
    expect(validateAtomicHabitRecommendationsResult({})).toEqual({
      recommendations: [],
    });
    expect(validateAtomicHabitRecommendationsResult({ recommendations: null })).toEqual({
      recommendations: [],
    });
    expect(validateAtomicHabitRecommendationsResult({ recommendations: "string" })).toEqual({
      recommendations: [],
    });
  });

  it("trims over-long arrays to max 3", () => {
    const five = [
      { title: "A", microAction: "a", explanation: "x", priority: "low" },
      { title: "B", microAction: "b", explanation: "x", priority: "medium" },
      { title: "C", microAction: "c", explanation: "x", priority: "high" },
      { title: "D", microAction: "d", explanation: "x", priority: "low" },
      { title: "E", microAction: "e", explanation: "x", priority: "medium" },
    ];
    const result = validateAtomicHabitRecommendationsResult({ recommendations: five });
    expect(result.recommendations).toHaveLength(3);
    expect(result.recommendations.map((r) => r.title)).toEqual(["A", "B", "C"]);
  });

  it("drops items with missing required string fields", () => {
    const raw = {
      recommendations: [
        { title: "Ok", microAction: "do it", explanation: "why", priority: "high" },
        { title: "", microAction: "x", explanation: "y", priority: "medium" },
        { title: "Only", microAction: "", explanation: "z", priority: "low" },
        { microAction: "no title", explanation: "e", priority: "medium" },
      ],
    };
    const result = validateAtomicHabitRecommendationsResult(raw);
    expect(result.recommendations).toHaveLength(1);
    expect(result.recommendations[0].title).toBe("Ok");
  });

  it("coerces wrong primitive types where safe", () => {
    const raw = {
      recommendations: [
        {
          title: 123,
          microAction: "do it",
          explanation: "reason",
          priority: "invalid",
        },
      ],
    };
    const result = validateAtomicHabitRecommendationsResult(raw);
    expect(result.recommendations).toHaveLength(1);
    expect(result.recommendations[0].title).toBe("123");
    expect(result.recommendations[0].priority).toBe("medium");
  });

  it("coerces priority to medium when not low/high", () => {
    const raw = {
      recommendations: [
        { title: "T", microAction: "M", explanation: "E", priority: "unknown" },
      ],
    };
    const result = validateAtomicHabitRecommendationsResult(raw);
    expect(result.recommendations).toHaveLength(1);
    expect(result.recommendations[0].priority).toBe("medium");
  });

  it("returns valid result for well-formed input", () => {
    const raw = {
      recommendations: [
        { title: "One", microAction: "Step one", explanation: "Because", priority: "high" },
        { title: "Two", microAction: "Step two", explanation: "Reason", priority: "low" },
      ],
    };
    const result = validateAtomicHabitRecommendationsResult(raw);
    expect(result.recommendations).toHaveLength(2);
    expect(result.recommendations[0]).toEqual({
      title: "One",
      microAction: "Step one",
      explanation: "Because",
      priority: "high",
    });
    expect(result.recommendations[1].priority).toBe("low");
  });
});

describe("validateZenSenseiInsight", () => {
  it("returns fallback for invalid JSON (non-object)", () => {
    expect(validateZenSenseiInsight(null, zenFallback)).toEqual(zenFallback);
    expect(validateZenSenseiInsight(undefined, zenFallback)).toEqual(zenFallback);
    expect(validateZenSenseiInsight("string", zenFallback)).toEqual(zenFallback);
  });

  it("returns fallback title and message when missing", () => {
    expect(validateZenSenseiInsight({}, zenFallback)).toEqual(zenFallback);
    expect(validateZenSenseiInsight({ title: "" }, zenFallback)).toEqual(zenFallback);
    expect(validateZenSenseiInsight({ message: "" }, zenFallback)).toEqual(zenFallback);
  });

  it("trims message to max length and strips list markup", () => {
    const long = "a".repeat(500);
    const result = validateZenSenseiInsight(
      { title: "T", message: long },
      zenFallback,
    );
    expect(result.title).toBe("T");
    expect(result.message.length).toBeLessThanOrEqual(400);
  });

  it("uses fallback message when message is empty after trim", () => {
    const result = validateZenSenseiInsight(
      { title: "Only Title", message: "   " },
      zenFallback,
    );
    expect(result.title).toBe("Only Title");
    expect(result.message).toBe(zenFallback.message);
  });

  it("returns valid insight for well-formed input", () => {
    const input = {
      title: "Short title",
      message: "A calm, reflective paragraph.",
    };
    const result = validateZenSenseiInsight(input, zenFallback);
    expect(result).toEqual(input);
  });
});
