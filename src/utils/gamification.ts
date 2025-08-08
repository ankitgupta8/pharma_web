import { Achievement, UserAchievement, StreakData } from '../types/drug.types';

// Define all available achievements
export const ACHIEVEMENTS: Achievement[] = [
  // Streak Achievements
  {
    id: 'streak_3',
    name: 'Getting Started',
    description: 'Study for 3 consecutive days',
    icon: '🔥',
    category: 'streak',
    requirement: 3
  },
  {
    id: 'streak_7',
    name: 'Week Warrior',
    description: 'Study for 7 consecutive days',
    icon: '⚡',
    category: 'streak',
    requirement: 7
  },
  {
    id: 'streak_30',
    name: 'Monthly Master',
    description: 'Study for 30 consecutive days',
    icon: '🏆',
    category: 'streak',
    requirement: 30
  },
  {
    id: 'streak_100',
    name: 'Century Scholar',
    description: 'Study for 100 consecutive days',
    icon: '👑',
    category: 'streak',
    requirement: 100
  },

  // Accuracy Achievements
  {
    id: 'accuracy_80',
    name: 'Sharp Mind',
    description: 'Achieve 80% accuracy overall',
    icon: '🎯',
    category: 'accuracy',
    requirement: 80
  },
  {
    id: 'accuracy_90',
    name: 'Precision Expert',
    description: 'Achieve 90% accuracy overall',
    icon: '🏹',
    category: 'accuracy',
    requirement: 90
  },
  {
    id: 'accuracy_95',
    name: 'Near Perfect',
    description: 'Achieve 95% accuracy overall',
    icon: '💎',
    category: 'accuracy',
    requirement: 95
  },

  // Volume Achievements
  {
    id: 'cards_50',
    name: 'Dedicated Learner',
    description: 'Study 50 flashcards',
    icon: '📚',
    category: 'volume',
    requirement: 50
  },
  {
    id: 'cards_200',
    name: 'Knowledge Seeker',
    description: 'Study 200 flashcards',
    icon: '🎓',
    category: 'volume',
    requirement: 200
  },
  {
    id: 'cards_500',
    name: 'Study Machine',
    description: 'Study 500 flashcards',
    icon: '🤖',
    category: 'volume',
    requirement: 500
  },
  {
    id: 'cards_1000',
    name: 'Master Scholar',
    description: 'Study 1000 flashcards',
    icon: '🧙‍♂️',
    category: 'volume',
    requirement: 1000
  },

  // Speed Achievements
  {
    id: 'quiz_perfect',
    name: 'Perfect Score',
    description: 'Get 100% on any quiz',
    icon: '⭐',
    category: 'speed',
    requirement: 100
  },
  {
    id: 'sessions_10',
    name: 'Consistent Student',
    description: 'Complete 10 study sessions',
    icon: '📖',
    category: 'speed',
    requirement: 10
  },
  {
    id: 'sessions_50',
    name: 'Study Veteran',
    description: 'Complete 50 study sessions',
    icon: '🎖️',
    category: 'speed',
    requirement: 50
  },

  // Mastery Achievements
  {
    id: 'system_master',
    name: 'System Master',
    description: 'Achieve 90% accuracy in any system',
    icon: '🏅',
    category: 'mastery',
    requirement: 90
  },
  {
    id: 'time_10h',
    name: 'Time Invested',
    description: 'Study for 10 total hours',
    icon: '⏰',
    category: 'mastery',
    requirement: 600 // 10 hours in minutes
  },
  {
    id: 'time_50h',
    name: 'Dedicated Scholar',
    description: 'Study for 50 total hours',
    icon: '⌛',
    category: 'mastery',
    requirement: 3000 // 50 hours in minutes
  }
];

export const getAchievementById = (id: string): Achievement | undefined => {
  return ACHIEVEMENTS.find(achievement => achievement.id === id);
};

export const getAchievementsByCategory = (category: Achievement['category']): Achievement[] => {
  return ACHIEVEMENTS.filter(achievement => achievement.category === category);
};

export const checkAchievements = (stats: {
  studyStreak: number;
  averageAccuracy: number;
  totalStudied: number;
  sessionsCompleted: number;
  totalTimeSpent: number;
  systemPerformance: Array<{ accuracy: number }>;
  quizScores: Array<{ score: number; totalQuestions: number }>;
}): Achievement[] => {
  const unlockedAchievements: Achievement[] = [];

  // Check streak achievements
  if (stats.studyStreak >= 3) unlockedAchievements.push(getAchievementById('streak_3')!);
  if (stats.studyStreak >= 7) unlockedAchievements.push(getAchievementById('streak_7')!);
  if (stats.studyStreak >= 30) unlockedAchievements.push(getAchievementById('streak_30')!);
  if (stats.studyStreak >= 100) unlockedAchievements.push(getAchievementById('streak_100')!);

  // Check accuracy achievements
  if (stats.averageAccuracy >= 80) unlockedAchievements.push(getAchievementById('accuracy_80')!);
  if (stats.averageAccuracy >= 90) unlockedAchievements.push(getAchievementById('accuracy_90')!);
  if (stats.averageAccuracy >= 95) unlockedAchievements.push(getAchievementById('accuracy_95')!);

  // Check volume achievements
  if (stats.totalStudied >= 50) unlockedAchievements.push(getAchievementById('cards_50')!);
  if (stats.totalStudied >= 200) unlockedAchievements.push(getAchievementById('cards_200')!);
  if (stats.totalStudied >= 500) unlockedAchievements.push(getAchievementById('cards_500')!);
  if (stats.totalStudied >= 1000) unlockedAchievements.push(getAchievementById('cards_1000')!);

  // Check session achievements
  if (stats.sessionsCompleted >= 10) unlockedAchievements.push(getAchievementById('sessions_10')!);
  if (stats.sessionsCompleted >= 50) unlockedAchievements.push(getAchievementById('sessions_50')!);

  // Check time achievements
  if (stats.totalTimeSpent >= 600) unlockedAchievements.push(getAchievementById('time_10h')!);
  if (stats.totalTimeSpent >= 3000) unlockedAchievements.push(getAchievementById('time_50h')!);

  // Check perfect quiz score
  const hasPerfectScore = stats.quizScores.some(quiz => 
    quiz.score === quiz.totalQuestions && quiz.totalQuestions > 0
  );
  if (hasPerfectScore) unlockedAchievements.push(getAchievementById('quiz_perfect')!);

  // Check system mastery
  const hasSystemMastery = stats.systemPerformance.some(system => system.accuracy >= 90);
  if (hasSystemMastery) unlockedAchievements.push(getAchievementById('system_master')!);

  return unlockedAchievements.filter(Boolean);
};

export const calculateProgress = (achievement: Achievement, stats: any): number => {
  switch (achievement.id) {
    case 'streak_3':
    case 'streak_7':
    case 'streak_30':
    case 'streak_100':
      return Math.min(100, (stats.studyStreak / achievement.requirement) * 100);
    
    case 'accuracy_80':
    case 'accuracy_90':
    case 'accuracy_95':
      return Math.min(100, (stats.averageAccuracy / achievement.requirement) * 100);
    
    case 'cards_50':
    case 'cards_200':
    case 'cards_500':
    case 'cards_1000':
      return Math.min(100, (stats.totalStudied / achievement.requirement) * 100);
    
    case 'sessions_10':
    case 'sessions_50':
      return Math.min(100, (stats.sessionsCompleted / achievement.requirement) * 100);
    
    case 'time_10h':
    case 'time_50h':
      return Math.min(100, (stats.totalTimeSpent / achievement.requirement) * 100);
    
    case 'quiz_perfect':
      const hasPerfectScore = stats.quizScores?.some((quiz: any) => 
        quiz.score === quiz.totalQuestions && quiz.totalQuestions > 0
      );
      return hasPerfectScore ? 100 : 0;
    
    case 'system_master':
      const maxSystemAccuracy = Math.max(...(stats.systemPerformance?.map((s: any) => s.accuracy) || [0]));
      return Math.min(100, (maxSystemAccuracy / achievement.requirement) * 100);
    
    default:
      return 0;
  }
};

export const getMotivationalMessage = (streak: number): string => {
  if (streak === 0) {
    return "Start your learning journey today! 🚀";
  } else if (streak < 3) {
    return `Great start! Keep going to build your streak! 🔥`;
  } else if (streak < 7) {
    return `You're on fire! ${streak} days strong! 🔥`;
  } else if (streak < 30) {
    return `Amazing consistency! ${streak} days of learning! ⚡`;
  } else if (streak < 100) {
    return `Incredible dedication! ${streak} days streak! 🏆`;
  } else {
    return `Legendary scholar! ${streak} days of mastery! 👑`;
  }
};

export const getStreakEmoji = (streak: number): string => {
  if (streak === 0) return "🌱";
  if (streak < 3) return "🔥";
  if (streak < 7) return "⚡";
  if (streak < 30) return "🏆";
  if (streak < 100) return "💎";
  return "👑";
};

export const getNextMilestone = (streak: number): { milestone: number; emoji: string; name: string } | null => {
  const milestones = [
    { milestone: 3, emoji: "🔥", name: "Getting Started" },
    { milestone: 7, emoji: "⚡", name: "Week Warrior" },
    { milestone: 30, emoji: "🏆", name: "Monthly Master" },
    { milestone: 100, emoji: "👑", name: "Century Scholar" }
  ];

  return milestones.find(m => m.milestone > streak) || null;
};