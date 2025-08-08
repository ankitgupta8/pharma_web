// DrugSystem is now dynamically determined from the data
// This type will include all systems found in the drug data
export type DrugSystem = string;

export interface Drug {
  id: number;
  name: string;
  class: string;
  system: DrugSystem;
  moa: string; // Mechanism of Action
  uses: string[];
  side_effects: string[];
  mnemonic?: string;
  contraindications?: string[];
  dosage?: string;
}

export interface BookmarkedDrug {
  id?: number;
  userId: string;
  drugId: number;
  bookmarkedAt: Date;
}

export interface FlashcardProgress {
  id?: number;
  userId: string;
  drugId: number;
  seen: boolean;
  correctCount: number;
  incorrectCount: number;
  lastSeen: Date;
  difficulty: 'easy' | 'medium' | 'hard';
  nextReviewDate: Date;
  reviewInterval: number; // days
  easeFactor: number; // for spaced repetition
  needsReview: boolean;
  streakCount: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface StudySession {
  id: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  totalCards: number;
  correctCards: number;
  incorrectCards: number;
  systems: string[];
  studyMode: 'all' | 'bookmarked' | 'unseen' | 'review';
  timeSpent: number; // minutes
}

export interface SessionResult {
  sessionId: string;
  totalCards: number;
  correctCards: number;
  incorrectCards: number;
  accuracy: number;
  timeSpent: number;
  cardsNeedingReview: number;
  newCardsLearned: number;
  systems: string[];
  studyMode: string;
}

export interface QuizScore {
  id: string;
  score: number;
  totalQuestions: number;
  completedAt: Date;
  system?: DrugSystem;
  drugClass?: string;
  timeTaken?: number;
}

export interface DailyDrug {
  date: string; // YYYY-MM-DD format
  drugId: number;
}

export interface QuizQuestion {
  id: string;
  drugId: number;
  question: string;
  options: string[];
  correctAnswer: number; // index of correct option
  type: 'moa' | 'uses' | 'side_effects' | 'general';
}

export interface DrugNote {
  id?: number;
  userId: string;
  drugId: number;
  note: string;
  createdAt: Date;
  updatedAt: Date;
  tags?: string[];
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'streak' | 'accuracy' | 'volume' | 'speed' | 'mastery';
  requirement: number;
  unlockedAt?: Date;
  progress?: number;
}

export interface UserAchievement {
  id?: number;
  achievementId: string;
  unlockedAt: Date;
  progress: number;
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastStudyDate: string;
  streakMilestones: number[];
}