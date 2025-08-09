import Dexie, { Table } from 'dexie';
import { Drug, BookmarkedDrug, FlashcardProgress, QuizScore, DailyDrug, StudySession, DrugNote } from '../types/drug.types';
import drugData from './drugData.json';

export class DrugDeckDatabase extends Dexie {
  drugs!: Table<Drug>;
  bookmarks!: Table<BookmarkedDrug>;
  flashcardProgress!: Table<FlashcardProgress>;
  quizScores!: Table<QuizScore>;
  dailyDrugs!: Table<DailyDrug>;
  studySessions!: Table<StudySession>;
  drugNotes!: Table<DrugNote>;

  constructor() {
    super('DrugDeckDatabase');
    
    this.version(1).stores({
      drugs: 'id, name, class, system, moa',
      bookmarks: '++id, drugId, bookmarkedAt',
      flashcardProgress: 'drugId, seen, correctCount, incorrectCount, lastSeen, difficulty, nextReviewDate, needsReview',
      quizScores: 'id, score, totalQuestions, completedAt, system, drugClass',
      dailyDrugs: 'date, drugId',
      studySessions: 'id, startTime, endTime, totalCards, correctCards, studyMode',
      drugNotes: '++id, drugId, createdAt, updatedAt'
    });
  }
}

export const db = new DrugDeckDatabase();

// Initialize database with drug data
export const initializeDatabase = async (): Promise<void> => {
  try {
    // Check if drugs are already loaded
    const drugCount = await db.drugs.count();
    
    if (drugCount === 0) {
      console.log('Initializing database with drug data...');
      
      // Add all drugs from JSON data
      await db.drugs.bulkAdd(drugData as Drug[]);
      
      // Initialize flashcard progress for all drugs
      const flashcardProgressData = drugData.map((drug: any) => ({
        drugId: drug.id,
        userId: 'local-user', // Placeholder for local storage compatibility
        seen: false,
        correctCount: 0,
        incorrectCount: 0,
        lastSeen: new Date(),
        difficulty: 'medium' as const,
        nextReviewDate: new Date(),
        reviewInterval: 1,
        easeFactor: 2.5,
        needsReview: false,
        streakCount: 0
      }));
      
      await db.flashcardProgress.bulkAdd(flashcardProgressData);
      
      // Set initial daily drug
      const today = new Date().toISOString().split('T')[0];
      const randomDrugId = drugData[Math.floor(Math.random() * drugData.length)].id;
      
      await db.dailyDrugs.add({
        date: today,
        drugId: randomDrugId
      });
      
      console.log('Database initialized successfully!');
    } else {
      console.log('Database already initialized with', drugCount, 'drugs');
    }
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

// Force reinitialize database (clears existing data)
export const reinitializeDatabase = async (): Promise<void> => {
  try {
    console.log('Force reinitializing database...');
    
    // Clear all existing data
    await db.drugs.clear();
    await db.flashcardProgress.clear();
    await db.dailyDrugs.clear();
    await db.bookmarks.clear();
    await db.quizScores.clear();
    
    // Add all drugs from JSON data
    await db.drugs.bulkAdd(drugData as Drug[]);
    
    // Initialize flashcard progress for all drugs
    const flashcardProgressData = drugData.map((drug: any) => ({
      drugId: drug.id,
      userId: 'local-user', // Placeholder for local storage compatibility
      seen: false,
      correctCount: 0,
      incorrectCount: 0,
      lastSeen: new Date(),
      difficulty: 'medium' as const,
      nextReviewDate: new Date(),
      reviewInterval: 1,
      easeFactor: 2.5,
      needsReview: false,
      streakCount: 0
    }));
    
    await db.flashcardProgress.bulkAdd(flashcardProgressData);
    
    // Set initial daily drug
    const today = new Date().toISOString().split('T')[0];
    const randomDrugId = drugData[Math.floor(Math.random() * drugData.length)].id;
    
    await db.dailyDrugs.add({
      date: today,
      drugId: randomDrugId
    });
    
    console.log('Database force reinitialized successfully with', drugData.length, 'drugs!');
  } catch (error) {
    console.error('Error force reinitializing database:', error);
    throw error;
  }
};

// Database utility functions
export const getDrugsBySystem = async (system: string): Promise<Drug[]> => {
  return await db.drugs.where('system').equals(system).toArray();
};

export const getDrugsByClass = async (drugClass: string): Promise<Drug[]> => {
  return await db.drugs.where('class').equals(drugClass).toArray();
};

export const searchDrugs = async (query: string): Promise<Drug[]> => {
  const lowerQuery = query.toLowerCase();
  return await db.drugs
    .filter(drug => 
      drug.name.toLowerCase().includes(lowerQuery) ||
      drug.class.toLowerCase().includes(lowerQuery) ||
      drug.system.toLowerCase().includes(lowerQuery)
    )
    .toArray();
};

export const getBookmarkedDrugs = async (): Promise<Drug[]> => {
  const bookmarks = await db.bookmarks.orderBy('bookmarkedAt').reverse().toArray();
  const drugIds = bookmarks.map(b => b.drugId);
  return await db.drugs.where('id').anyOf(drugIds).toArray();
};

export const isBookmarked = async (drugId: number): Promise<boolean> => {
  const bookmark = await db.bookmarks.where('drugId').equals(drugId).first();
  return !!bookmark;
};

export const toggleBookmark = async (drugId: number): Promise<boolean> => {
  const existing = await db.bookmarks.where('drugId').equals(drugId).first();
  
  if (existing) {
    await db.bookmarks.where('drugId').equals(drugId).delete();
    return false;
  } else {
    await db.bookmarks.add({
      drugId,
      userId: 'local-user', // Placeholder for local storage compatibility
      bookmarkedAt: new Date()
    });
    return true;
  }
};

export const getDailyDrug = async (): Promise<Drug | null> => {
  const today = new Date().toISOString().split('T')[0];
  let dailyDrugEntry = await db.dailyDrugs.where('date').equals(today).first();
  
  if (!dailyDrugEntry) {
    // Generate new daily drug
    const allDrugs = await db.drugs.toArray();
    const randomDrug = allDrugs[Math.floor(Math.random() * allDrugs.length)];
    
    dailyDrugEntry = {
      date: today,
      drugId: randomDrug.id
    };
    
    await db.dailyDrugs.add(dailyDrugEntry);
  }
  
  return await db.drugs.get(dailyDrugEntry.drugId) || null;
};

export const updateFlashcardProgress = async (
  drugId: number,
  correct: boolean
): Promise<void> => {
  const progress = await db.flashcardProgress.get(drugId);
  
  if (progress) {
    const newStreakCount = correct ? progress.streakCount + 1 : 0;
    const newEaseFactor = calculateEaseFactor(progress.easeFactor, correct);
    const newInterval = calculateNextInterval(progress.reviewInterval, newEaseFactor, correct);
    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);
    
    // Determine difficulty based on performance
    let newDifficulty = progress.difficulty;
    if (correct && progress.streakCount >= 3) {
      newDifficulty = progress.difficulty === 'hard' ? 'medium' : progress.difficulty === 'medium' ? 'easy' : 'easy';
    } else if (!correct) {
      newDifficulty = progress.difficulty === 'easy' ? 'medium' : progress.difficulty === 'medium' ? 'hard' : 'hard';
    }
    
    await db.flashcardProgress.update(drugId, {
      seen: true,
      correctCount: correct ? progress.correctCount + 1 : progress.correctCount,
      incorrectCount: correct ? progress.incorrectCount : progress.incorrectCount + 1,
      lastSeen: new Date(),
      difficulty: newDifficulty,
      nextReviewDate,
      reviewInterval: newInterval,
      easeFactor: newEaseFactor,
      needsReview: !correct,
      streakCount: newStreakCount
    });
  }
};

// Spaced repetition algorithm functions
const calculateEaseFactor = (currentEase: number, correct: boolean): number => {
  if (correct) {
    return Math.max(1.3, currentEase + 0.1);
  } else {
    return Math.max(1.3, currentEase - 0.2);
  }
};

const calculateNextInterval = (currentInterval: number, easeFactor: number, correct: boolean): number => {
  if (!correct) {
    return 1; // Reset to 1 day if incorrect
  }
  
  if (currentInterval === 1) {
    return 6; // First correct answer: 6 days
  }
  
  return Math.round(currentInterval * easeFactor);
};

export const getFlashcardProgress = async (drugId: number): Promise<FlashcardProgress | undefined> => {
  return await db.flashcardProgress.get(drugId);
};

export const saveQuizScore = async (score: QuizScore): Promise<void> => {
  await db.quizScores.add(score);
};

export const getQuizHistory = async (): Promise<QuizScore[]> => {
  return await db.quizScores.orderBy('completedAt').reverse().toArray();
};

export const getSystemStats = async () => {
  const allDrugs = await db.drugs.toArray();
  // Extract unique systems directly from the drugs data
  const systems = Array.from(new Set(allDrugs.map(drug => drug.system))).sort();
  const stats = await Promise.all(
    systems.map(async (system) => {
      const drugs = await getDrugsBySystem(system);
      const bookmarked = await Promise.all(
        drugs.map(drug => isBookmarked(drug.id))
      );
      const bookmarkedCount = bookmarked.filter(Boolean).length;
      
      return {
        system,
        totalDrugs: drugs.length,
        bookmarkedDrugs: bookmarkedCount
      };
    })
  );
  
  return stats;
};

// Study session management
export const startStudySession = async (
  systems: string[],
  studyMode: 'all' | 'bookmarked' | 'unseen' | 'review',
  totalCards: number
): Promise<string> => {
  const sessionId = `session_${Date.now()}`;
  
  await db.studySessions.add({
    id: sessionId,
    userId: 'local-user', // Placeholder for local storage compatibility
    startTime: new Date(),
    totalCards,
    correctCards: 0,
    incorrectCards: 0,
    systems,
    studyMode,
    timeSpent: 0
  });
  
  return sessionId;
};

export const updateStudySession = async (
  sessionId: string,
  correctCards: number,
  incorrectCards: number
): Promise<void> => {
  const session = await db.studySessions.get(sessionId);
  if (session) {
    await db.studySessions.update(sessionId, {
      correctCards,
      incorrectCards
    });
  }
};

export const endStudySession = async (sessionId: string): Promise<void> => {
  const session = await db.studySessions.get(sessionId);
  if (session) {
    const timeSpent = Math.round((new Date().getTime() - session.startTime.getTime()) / (1000 * 60)); // minutes
    await db.studySessions.update(sessionId, {
      endTime: new Date(),
      timeSpent
    });
  }
};

export const getStudySession = async (sessionId: string): Promise<StudySession | undefined> => {
  return await db.studySessions.get(sessionId);
};

// Get cards that need review
export const getCardsNeedingReview = async (): Promise<Drug[]> => {
  const today = new Date();
  const progressRecords = await db.flashcardProgress
    .filter(progress =>
      progress.needsReview ||
      (progress.seen && progress.nextReviewDate <= today)
    )
    .toArray();
  
  const drugIds = progressRecords.map(p => p.drugId);
  return await db.drugs.where('id').anyOf(drugIds).toArray();
};

// Get study statistics
export const getStudyStatistics = async (): Promise<{
  totalStudied: number;
  totalCorrect: number;
  totalIncorrect: number;
  averageAccuracy: number;
  studyStreak: number;
  cardsNeedingReview: number;
  totalTimeSpent: number;
  sessionsCompleted: number;
}> => {
  const allProgress = await db.flashcardProgress.toArray();
  const allSessions = await db.studySessions.where('endTime').above(new Date(0)).toArray();
  
  const totalStudied = allProgress.filter(p => p.seen).length;
  const totalCorrect = allProgress.reduce((sum, p) => sum + p.correctCount, 0);
  const totalIncorrect = allProgress.reduce((sum, p) => sum + p.incorrectCount, 0);
  const averageAccuracy = totalCorrect + totalIncorrect > 0 ? (totalCorrect / (totalCorrect + totalIncorrect)) * 100 : 0;
  const cardsNeedingReview = allProgress.filter(p => p.needsReview).length;
  const totalTimeSpent = allSessions.reduce((sum, s) => sum + s.timeSpent, 0);
  
  // Calculate study streak (consecutive days with study sessions)
  const today = new Date();
  let studyStreak = 0;
  let foundFirstSession = false;
  
  for (let i = 0; i < 365; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(checkDate.getDate() - i);
    const dayStart = new Date(checkDate.setHours(0, 0, 0, 0));
    const dayEnd = new Date(checkDate.setHours(23, 59, 59, 999));
    
    const hasSession = allSessions.some(s =>
      s.startTime >= dayStart && s.startTime <= dayEnd
    );
    
    if (hasSession) {
      studyStreak++;
      foundFirstSession = true;
    } else if (foundFirstSession) {
      // Only break streak after we've found at least one session
      break;
    }
    // If we haven't found any sessions yet, continue looking back
  }
  
  return {
    totalStudied,
    totalCorrect,
    totalIncorrect,
    averageAccuracy: Math.round(averageAccuracy),
    studyStreak,
    cardsNeedingReview,
    totalTimeSpent,
    sessionsCompleted: allSessions.length
  };
};

// Get performance by system
export const getSystemPerformance = async (): Promise<Array<{
  system: string;
  totalCards: number;
  studiedCards: number;
  accuracy: number;
  averageDifficulty: string;
}>> => {
  const allDrugs = await db.drugs.toArray();
  const allProgress = await db.flashcardProgress.toArray();
  
  const systems = Array.from(new Set(allDrugs.map(d => d.system)));
  
  return systems.map(system => {
    const systemDrugs = allDrugs.filter(d => d.system === system);
    const systemProgress = allProgress.filter(p =>
      systemDrugs.some(d => d.id === p.drugId)
    );
    
    const studiedCards = systemProgress.filter(p => p.seen).length;
    const totalCorrect = systemProgress.reduce((sum, p) => sum + p.correctCount, 0);
    const totalIncorrect = systemProgress.reduce((sum, p) => sum + p.incorrectCount, 0);
    const accuracy = totalCorrect + totalIncorrect > 0 ? (totalCorrect / (totalCorrect + totalIncorrect)) * 100 : 0;
    
    // Calculate average difficulty
    const difficulties = systemProgress.filter(p => p.seen).map(p => p.difficulty);
    const difficultyScore = difficulties.reduce((sum, d) => {
      return sum + (d === 'easy' ? 1 : d === 'medium' ? 2 : 3);
    }, 0);
    const avgDifficultyScore = difficulties.length > 0 ? difficultyScore / difficulties.length : 2;
    const averageDifficulty = avgDifficultyScore <= 1.5 ? 'easy' : avgDifficultyScore <= 2.5 ? 'medium' : 'hard';
    
    return {
      system,
      totalCards: systemDrugs.length,
      studiedCards,
      accuracy: Math.round(accuracy),
      averageDifficulty
    };
  });
};

// Drug Notes functions
export const addDrugNote = async (drugId: number, note: string, tags: string[] = []): Promise<number> => {
  const now = new Date();
  return await db.drugNotes.add({
    drugId,
    userId: 'local-user', // Placeholder for local storage compatibility
    note,
    tags,
    createdAt: now,
    updatedAt: now
  });
};

export const updateDrugNote = async (noteId: number, note: string, tags: string[] = []): Promise<void> => {
  await db.drugNotes.update(noteId, {
    note,
    tags,
    updatedAt: new Date()
  });
};

export const deleteDrugNote = async (noteId: number): Promise<void> => {
  await db.drugNotes.delete(noteId);
};

export const getDrugNotes = async (drugId: number): Promise<DrugNote[]> => {
  const notes = await db.drugNotes
    .where('drugId')
    .equals(drugId)
    .toArray();
  return notes.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
};

export const getAllNotes = async (): Promise<DrugNote[]> => {
  const notes = await db.drugNotes.toArray();
  return notes.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
};

export const searchNotes = async (query: string): Promise<DrugNote[]> => {
  const lowerQuery = query.toLowerCase();
  return await db.drugNotes
    .filter(note => {
      const noteMatches = note.note.toLowerCase().includes(lowerQuery);
      const tagMatches = note.tags ? note.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) : false;
      return noteMatches || tagMatches;
    })
    .toArray();
};

export const getNotesByTag = async (tag: string): Promise<DrugNote[]> => {
  return await db.drugNotes
    .filter(note => note.tags ? note.tags.includes(tag) : false)
    .toArray();
};

export const getAllTags = async (): Promise<string[]> => {
  const notes = await db.drugNotes.toArray();
  const allTags = notes.flatMap(note => note.tags || []);
  return Array.from(new Set(allTags)).sort();
};

// Generate sample data for testing achievements
export const generateSampleAchievementData = async (): Promise<void> => {
  try {
    console.log('Generating sample achievement data...');
    
    // Get some random drugs for sample data
    const allDrugs = await db.drugs.toArray();
    if (allDrugs.length === 0) {
      console.warn('No drugs found, cannot generate sample data');
      return;
    }
    
    const sampleDrugs = allDrugs.slice(0, Math.min(20, allDrugs.length));
    const now = new Date();
    
    // Generate study sessions for the past 5 days
    const sessions = [];
    for (let i = 0; i < 5; i++) {
      const sessionDate = new Date(now);
      sessionDate.setDate(sessionDate.getDate() - i);
      sessionDate.setHours(10 + i, 30, 0, 0); // Different times each day
      
      const sessionId = `sample_session_${i}`;
      const totalCards = 8 + Math.floor(Math.random() * 7); // 8-14 cards
      const correctCards = Math.floor(totalCards * (0.7 + Math.random() * 0.25)); // 70-95% accuracy
      
      sessions.push({
        id: sessionId,
        userId: 'local-user',
        startTime: sessionDate,
        endTime: new Date(sessionDate.getTime() + (15 + Math.random() * 20) * 60000), // 15-35 minutes
        totalCards,
        correctCards,
        incorrectCards: totalCards - correctCards,
        systems: [['Cardiovascular', 'Respiratory', 'Nervous'][Math.floor(Math.random() * 3)]],
        studyMode: ['all', 'bookmarked', 'unseen'][Math.floor(Math.random() * 3)] as any,
        timeSpent: 15 + Math.floor(Math.random() * 20) // 15-35 minutes
      });
    }
    
    // Add sessions to database
    await db.studySessions.bulkAdd(sessions);
    
    // Update flashcard progress for sample drugs
    const progressUpdates = sampleDrugs.map((drug, index) => {
      const seen = index < 15; // First 15 drugs have been seen
      const correctCount = seen ? 2 + Math.floor(Math.random() * 5) : 0; // 2-6 correct
      const incorrectCount = seen ? Math.floor(Math.random() * 3) : 0; // 0-2 incorrect
      
      return {
        drugId: drug.id,
        seen,
        correctCount,
        incorrectCount,
        lastSeen: seen ? new Date(now.getTime() - Math.random() * 5 * 24 * 60 * 60 * 1000) : new Date(),
        difficulty: ['easy', 'medium', 'hard'][Math.floor(Math.random() * 3)] as any,
        nextReviewDate: new Date(now.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000),
        reviewInterval: 1 + Math.floor(Math.random() * 7),
        easeFactor: 2.0 + Math.random() * 1.0,
        needsReview: Math.random() < 0.3, // 30% need review
        streakCount: Math.floor(Math.random() * 5)
      };
    });
    
    // Update flashcard progress
    for (const update of progressUpdates) {
      await db.flashcardProgress.update(update.drugId, update);
    }
    
    // Generate some quiz scores
    const quizScores = [];
    for (let i = 0; i < 8; i++) {
      const quizDate = new Date(now);
      quizDate.setDate(quizDate.getDate() - Math.floor(Math.random() * 10));
      
      const totalQuestions = 5 + Math.floor(Math.random() * 10); // 5-14 questions
      const score = Math.floor(totalQuestions * (0.6 + Math.random() * 0.4)); // 60-100% score
      
      quizScores.push({
        id: `sample_quiz_${i}`,
        score,
        totalQuestions,
        completedAt: quizDate,
        system: ['Cardiovascular', 'Respiratory', 'Nervous', 'Endocrine'][Math.floor(Math.random() * 4)],
        drugClass: ['Beta Blockers', 'ACE Inhibitors', 'Diuretics'][Math.floor(Math.random() * 3)],
        timeTaken: 60 + Math.floor(Math.random() * 180) // 1-4 minutes
      });
    }
    
    // Add quiz scores
    await db.quizScores.bulkAdd(quizScores);
    
    console.log('Sample achievement data generated successfully!');
    console.log(`- ${sessions.length} study sessions`);
    console.log(`- ${progressUpdates.length} flashcard progress records`);
    console.log(`- ${quizScores.length} quiz scores`);
    
  } catch (error) {
    console.error('Error generating sample achievement data:', error);
    throw error;
  }
};

// Clear sample data (for testing)
export const clearSampleAchievementData = async (): Promise<void> => {
  try {
    console.log('Clearing sample achievement data...');
    
    // Clear study sessions
    await db.studySessions.clear();
    
    // Reset flashcard progress
    const allDrugs = await db.drugs.toArray();
    const resetProgress = allDrugs.map(drug => ({
      drugId: drug.id,
      seen: false,
      correctCount: 0,
      incorrectCount: 0,
      lastSeen: new Date(),
      difficulty: 'medium' as const,
      nextReviewDate: new Date(),
      reviewInterval: 1,
      easeFactor: 2.5,
      needsReview: false,
      streakCount: 0
    }));
    
    for (const reset of resetProgress) {
      await db.flashcardProgress.update(reset.drugId, reset);
    }
    
    // Clear quiz scores
    await db.quizScores.clear();
    
    console.log('Sample achievement data cleared successfully!');
    
  } catch (error) {
    console.error('Error clearing sample achievement data:', error);
    throw error;
  }
};