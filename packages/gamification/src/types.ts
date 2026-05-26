export type Difficulty = 'beginner' | 'intermediate' | 'advanced'

export interface LessonXpInput {
  /** Base XP declared on the lesson meta. */
  xp: number
  difficulty: Difficulty
}

export interface QuizScore {
  correct: number
  total: number
}

export interface StreakState {
  current: number
  longest: number
  /** ISO 'YYYY-MM-DD' in the user's local-day frame. */
  lastActiveDate: string
}
