import { describe, it, expect } from "vitest";
import {
  normalizeAnswer,
  isAnswerCorrect,
  gradeObjective,
  rawToBand,
  roundToHalf,
  overallBand,
} from "./scoring.js";

describe("normalizeAnswer", () => {
  it("trims, lowercases and collapses whitespace", () => {
    expect(normalizeAnswer("  The   Quick ")).toBe("the quick");
  });
  it("strips surrounding punctuation", () => {
    expect(normalizeAnswer('"answer".')).toBe("answer");
  });
});

describe("isAnswerCorrect", () => {
  it("matches case-insensitively", () => {
    expect(isAnswerCorrect("True", "true")).toBe(true);
  });
  it("accepts / alternatives", () => {
    expect(isAnswerCorrect("colour/color", "color")).toBe(true);
    expect(isAnswerCorrect("colour/color", "COLOUR")).toBe(true);
  });
  it("rejects wrong and empty answers", () => {
    expect(isAnswerCorrect("cat", "dog")).toBe(false);
    expect(isAnswerCorrect("cat", "")).toBe(false);
    expect(isAnswerCorrect("cat", null)).toBe(false);
  });
});

describe("gradeObjective", () => {
  const qs = [
    { id: "a", answer: "True" },
    { id: "b", answer: "10/ten" },
    { id: "c", answer: "photosynthesis" },
  ];
  it("counts correct answers with alternatives + normalization", () => {
    const res = gradeObjective(qs, { a: "true", b: "ten", c: "Wrong" });
    expect(res.correct).toBe(2);
    expect(res.total).toBe(3);
    expect(res.results.find((r) => r.id === "c")?.correct).toBe(false);
  });
  it("treats missing answers as incorrect", () => {
    const res = gradeObjective(qs, {});
    expect(res.correct).toBe(0);
  });
});

describe("rawToBand", () => {
  it("maps a perfect score to band 9", () => {
    expect(rawToBand(40, 40, "listening")).toBe(9);
    expect(rawToBand(10, 10, "reading")).toBe(9);
  });
  it("scales sub-40 totals to the /40 table", () => {
    // 8/10 listening -> 32/40 -> band 7.5
    expect(rawToBand(8, 10, "listening")).toBe(7.5);
    // 7/10 reading -> 28/40 -> band 6.5
    expect(rawToBand(7, 10, "reading")).toBe(6.5);
  });
  it("handles zero / empty safely", () => {
    expect(rawToBand(0, 10, "reading")).toBe(2.5);
    expect(rawToBand(5, 0, "listening")).toBe(0);
  });
});

describe("roundToHalf", () => {
  it("rounds to nearest half, half up", () => {
    expect(roundToHalf(6.25)).toBe(6.5);
    expect(roundToHalf(6.75)).toBe(7);
    expect(roundToHalf(6.1)).toBe(6);
    expect(roundToHalf(6.4)).toBe(6.5);
  });
});

describe("overallBand", () => {
  it("applies the IELTS averaging rule (.25 -> .5)", () => {
    // mean = 6.25 -> 6.5
    expect(overallBand(6, 6, 6.75)).toBe(6.5);
  });
  it("applies .75 -> next whole", () => {
    // mean = 6.75 -> 7.0
    expect(overallBand(6.5, 7, 6.75)).toBe(7);
  });
  it("ignores missing sections", () => {
    expect(overallBand(7, null, undefined)).toBe(7);
    expect(overallBand(null, undefined)).toBeNull();
  });
});
