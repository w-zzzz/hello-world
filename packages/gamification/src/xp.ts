import type { LessonXpInput, QuizScore } from './types'

/**
 * Base XP for completing a lesson, scaled by difficulty.
 */
export function xpForLessonComplete(lesson: LessonXpInput): number {
  const factor =
    lesson.difficulty === 'beginner' ? 1.0 : lesson.difficulty === 'intermediate' ? 1.5 : 2.0
  return Math.round(lesson.xp * factor)
}

/**
 * Quiz multiplier ∈ [0.5, 1.0]. Floor 0.5 even on 0/total to keep XP non-zero
 * so users never feel punished for trying.
 */
export function quizScoreMultiplier(quiz: QuizScore | null | undefined): number {
  if (!quiz || quiz.total <= 0) return 1.0
  const fraction = Math.max(0, Math.min(1, quiz.correct / quiz.total))
  return 0.5 + 0.5 * fraction
}

/**
 * Bonus multiplier applied when the lesson was completed on the first attempt.
 */
export function firstTryBonus(attempts: number): number {
  return attempts <= 1 ? 1.25 : 1.0
}

/**
 * Streak bonus XP awarded *on top of* the lesson base, scaling with current streak (capped at 30).
 */
export function streakBonus(currentStreak: number): number {
  return Math.max(0, Math.min(currentStreak, 30)) * 5
}

export interface XpAwardInput {
  lesson: LessonXpInput
  quiz?: QuizScore
  attempts: number
  currentStreak: number
}

export interface XpAward {
  base: number
  quizMultiplier: number
  firstTry: number
  streakBonus: number
  total: number
}

/**
 * Compose all XP factors into a single award. Inverse-engineerable from the breakdown.
 */
export function computeXpAward(input: XpAwardInput): XpAward {
  const base = xpForLessonComplete(input.lesson)
  const quizMultiplier = quizScoreMultiplier(input.quiz)
  const firstTry = firstTryBonus(input.attempts)
  const streak = streakBonus(input.currentStreak)
  const total = Math.round(base * quizMultiplier * firstTry) + streak
  return { base, quizMultiplier, firstTry, streakBonus: streak, total }
}
