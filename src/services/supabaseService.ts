import { supabase, Database } from '../lib/supabase';
import { Drug, QuizScore, StudySession, DrugNote } from '../types/drug.types';

// Type aliases for cleaner code
type DrugRow = Database['public']['Tables']['drugs']['Row'];
type UserProgressRow = Database['public']['Tables']['user_progress']['Row'];
type BookmarkRow = Database['public']['Tables']['bookmarks']['Row'];
type QuizScoreRow = Database['public']['Tables']['quiz_scores']['Row'];
type StudySessionRow = Database['public']['Tables']['study_sessions']['Row'];
type DrugNoteRow = Database['public']['Tables']['drug_notes']['Row'];
type DailyDrugRow = Database['public']['Tables']['daily_drugs']['Row'];

// Auth helper to get current user
const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }
  return user;
};

// Drug operations
export const getAllDrugs = async (): Promise<Drug[]> => {
  const { data, error } = await supabase
    .from('drugs')
    .select('*')
    .order('name');
  
  if (error) throw error;
  return data.map(transformDrugFromDB);
};

export const getDrugById = async (id: number): Promise<Drug | null> => {
  const { data, error } = await supabase
    .from('drugs')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }
  return transformDrugFromDB(data);
};

export const getDrugsBySystem = async (system: string): Promise<Drug[]> => {
  const { data, error } = await supabase
    .from('drugs')
    .select('*')
    .eq('system', system)
    .order('name');
  
  if (error) throw error;
  return data.map(transformDrugFromDB);
};

export const getDrugsByClass = async (drugClass: string): Promise<Drug[]> => {
  const { data, error } = await supabase
    .from('drugs')
    .select('*')
    .eq('class', drugClass)
    .order('name');
  
  if (error) throw error;
  return data.map(transformDrugFromDB);
};

export const searchDrugs = async (query: string): Promise<Drug[]> => {
  const { data, error } = await supabase
    .from('drugs')
    .select('*')
    .or(`name.ilike.%${query}%,class.ilike.%${query}%,system.ilike.%${query}%`)
    .order('name');
  
  if (error) throw error;
  return data.map(transformDrugFromDB);
};

// Transform database row to Drug type
const transformDrugFromDB = (row: DrugRow): Drug => ({
  id: row.id,
  name: row.name,
  class: row.class,
  system: row.system,
  moa: row.moa,
  uses: row.uses,
  side_effects: row.side_effects,
  mnemonic: row.mnemonic || undefined,
  contraindications: row.contraindications || undefined,
  dosage: row.dosage || undefined,
});

// Bookmark operations
export const getBookmarkedDrugs = async (): Promise<Drug[]> => {
  const user = await getCurrentUser();
  
  const { data, error } = await supabase
    .from('bookmarks')
    .select(`
      drug_id,
      drugs (*)
    `)
    .eq('user_id', user.id)
    .order('bookmarked_at', { ascending: false });
  
  if (error) throw error;
  return data.map(item => transformDrugFromDB((item as any).drugs));
};

export const isBookmarked = async (drugId: number): Promise<boolean> => {
  const user = await getCurrentUser();
  
  const { data, error } = await supabase
    .from('bookmarks')
    .select('id')
    .eq('user_id', user.id)
    .eq('drug_id', drugId)
    .single();
  
  if (error && error.code !== 'PGRST116') throw error;
  return !!data;
};

export const toggleBookmark = async (drugId: number): Promise<boolean> => {
  const user = await getCurrentUser();
  
  const isCurrentlyBookmarked = await isBookmarked(drugId);
  
  if (isCurrentlyBookmarked) {
    const { error } = await supabase
      .from('bookmarks')
      .delete()
      .eq('user_id', user.id)
      .eq('drug_id', drugId);
    
    if (error) throw error;
    return false;
  } else {
    const { error } = await supabase
      .from('bookmarks')
      .insert({
        user_id: user.id,
        drug_id: drugId,
      });
    
    if (error) throw error;
    return true;
  }
};

// Daily drug operations
export const getDailyDrug = async (): Promise<Drug | null> => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // First, try to get today's daily drug
    let { data: dailyDrugData, error } = await supabase
      .from('daily_drugs')
      .select(`
        drug_id,
        drugs (*)
      `)
      .eq('date', today)
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching daily drug:', error);
      throw error;
    }
    
    if (!dailyDrugData) {
      // No daily drug for today, create one
      const { data: allDrugs, error: drugsError } = await supabase
        .from('drugs')
        .select('id')
        .limit(100); // Limit to avoid large queries
      
      if (drugsError) {
        console.error('Error fetching drugs for daily selection:', drugsError);
        throw drugsError;
      }
      
      if (!allDrugs || allDrugs.length === 0) {
        console.warn('No drugs available for daily selection');
        return null;
      }
      
      const randomDrugId = allDrugs[Math.floor(Math.random() * allDrugs.length)].id;
      
      // Try to insert the daily drug with upsert to handle duplicates
      const { data: insertedData, error: insertError } = await supabase
        .from('daily_drugs')
        .upsert({
          date: today,
          drug_id: randomDrugId,
        }, {
          onConflict: 'date'
        })
        .select(`
          drug_id,
          drugs (*)
        `)
        .single();
      
      if (insertError) {
        console.error('Error upserting daily drug:', insertError);
        // If upsert fails, just return the random drug without storing it
        return await getDrugById(randomDrugId);
      }
      
      if (insertedData && insertedData.drugs) {
        return transformDrugFromDB((insertedData as any).drugs);
      }
      
      return await getDrugById(randomDrugId);
    }
    
    if (!dailyDrugData.drugs) {
      console.warn('Daily drug data missing drug details');
      return null;
    }
    
    return transformDrugFromDB((dailyDrugData as any).drugs);
  } catch (error) {
    console.error('Failed to get daily drug:', error);
    // Fallback: return a random drug from local data if available
    try {
      const { data: fallbackDrugs, error: fallbackError } = await supabase
        .from('drugs')
        .select('*')
        .limit(1);
      
      if (!fallbackError && fallbackDrugs && fallbackDrugs.length > 0) {
        return transformDrugFromDB(fallbackDrugs[0]);
      }
    } catch (fallbackError) {
      console.error('Fallback daily drug fetch failed:', fallbackError);
    }
    
    return null;
  }
};

// User progress operations
export const getUserProgress = async (drugId: number): Promise<UserProgressRow | null> => {
  const user = await getCurrentUser();
  
  const { data, error } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', user.id)
    .eq('drug_id', drugId)
    .single();
  
  if (error && error.code !== 'PGRST116') throw error;
  return data;
};

export const updateUserProgress = async (
  drugId: number,
  correct: boolean
): Promise<void> => {
  const user = await getCurrentUser();
  
  let progress = await getUserProgress(drugId);
  
  if (!progress) {
    // Create initial progress record
    const { error } = await supabase
      .from('user_progress')
      .insert({
        user_id: user.id,
        drug_id: drugId,
        seen: true,
        correct_count: correct ? 1 : 0,
        incorrect_count: correct ? 0 : 1,
        last_seen: new Date().toISOString(),
        difficulty: 'medium',
        next_review_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        review_interval: 1,
        ease_factor: 2.5,
        needs_review: !correct,
        streak_count: correct ? 1 : 0,
      });
    
    if (error) throw error;
    return;
  }
  
  // Update existing progress
  const newStreakCount = correct ? progress.streak_count + 1 : 0;
  const newEaseFactor = calculateEaseFactor(progress.ease_factor, correct);
  const newInterval = calculateNextInterval(progress.review_interval, newEaseFactor, correct);
  const nextReviewDate = new Date(Date.now() + newInterval * 24 * 60 * 60 * 1000);
  
  // Determine difficulty based on performance
  let newDifficulty = progress.difficulty;
  if (correct && progress.streak_count >= 3) {
    newDifficulty = progress.difficulty === 'hard' ? 'medium' : progress.difficulty === 'medium' ? 'easy' : 'easy';
  } else if (!correct) {
    newDifficulty = progress.difficulty === 'easy' ? 'medium' : progress.difficulty === 'medium' ? 'hard' : 'hard';
  }
  
  const { error } = await supabase
    .from('user_progress')
    .update({
      seen: true,
      correct_count: correct ? progress.correct_count + 1 : progress.correct_count,
      incorrect_count: correct ? progress.incorrect_count : progress.incorrect_count + 1,
      last_seen: new Date().toISOString(),
      difficulty: newDifficulty,
      next_review_date: nextReviewDate.toISOString(),
      review_interval: newInterval,
      ease_factor: newEaseFactor,
      needs_review: !correct,
      streak_count: newStreakCount,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', user.id)
    .eq('drug_id', drugId);
  
  if (error) throw error;
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

// Get cards that need review
export const getCardsNeedingReview = async (): Promise<Drug[]> => {
  const user = await getCurrentUser();
  const today = new Date().toISOString();
  
  const { data, error } = await supabase
    .from('user_progress')
    .select(`
      drug_id,
      drugs (*)
    `)
    .eq('user_id', user.id)
    .or(`needs_review.eq.true,next_review_date.lte.${today}`)
    .eq('seen', true);
  
  if (error) throw error;
  return data.map(item => transformDrugFromDB((item as any).drugs));
};

// Quiz operations
export const saveQuizScore = async (score: Omit<QuizScore, 'id'>): Promise<void> => {
  const user = await getCurrentUser();
  
  const { error } = await supabase
    .from('quiz_scores')
    .insert({
      id: `quiz_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      user_id: user.id,
      score: score.score,
      total_questions: score.totalQuestions,
      completed_at: score.completedAt.toISOString(),
      system: score.system || null,
      drug_class: score.drugClass || null,
      time_taken: null, // You can add time tracking if needed
    });
  
  if (error) throw error;
};

export const getQuizHistory = async (): Promise<QuizScore[]> => {
  const user = await getCurrentUser();
  
  const { data, error } = await supabase
    .from('quiz_scores')
    .select('*')
    .eq('user_id', user.id)
    .order('completed_at', { ascending: false });
  
  if (error) throw error;
  
  return data.map(row => ({
    id: row.id,
    score: row.score,
    totalQuestions: row.total_questions,
    completedAt: new Date(row.completed_at),
    system: row.system || undefined,
    drugClass: row.drug_class || undefined,
  }));
};

// Study session operations
export const startStudySession = async (
  systems: string[],
  studyMode: 'all' | 'bookmarked' | 'unseen' | 'review',
  totalCards: number
): Promise<string> => {
  const user = await getCurrentUser();
  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const { error } = await supabase
    .from('study_sessions')
    .insert({
      id: sessionId,
      user_id: user.id,
      start_time: new Date().toISOString(),
      total_cards: totalCards,
      correct_cards: 0,
      incorrect_cards: 0,
      systems,
      study_mode: studyMode,
      time_spent: 0,
    });
  
  if (error) throw error;
  return sessionId;
};

export const updateStudySession = async (
  sessionId: string,
  correctCards: number,
  incorrectCards: number
): Promise<void> => {
  const { error } = await supabase
    .from('study_sessions')
    .update({
      correct_cards: correctCards,
      incorrect_cards: incorrectCards,
    })
    .eq('id', sessionId);
  
  if (error) throw error;
};

export const endStudySession = async (sessionId: string): Promise<void> => {
  const { data: session, error: fetchError } = await supabase
    .from('study_sessions')
    .select('start_time')
    .eq('id', sessionId)
    .single();
  
  if (fetchError) throw fetchError;
  
  const timeSpent = Math.round((new Date().getTime() - new Date(session.start_time).getTime()) / (1000 * 60)); // minutes
  
  const { error } = await supabase
    .from('study_sessions')
    .update({
      end_time: new Date().toISOString(),
      time_spent: timeSpent,
    })
    .eq('id', sessionId);
  
  if (error) throw error;
};

export const getStudySession = async (sessionId: string): Promise<StudySession | null> => {
  const { data, error } = await supabase
    .from('study_sessions')
    .select('*')
    .eq('id', sessionId)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  
  return {
    id: data.id,
    userId: data.user_id,
    startTime: new Date(data.start_time),
    endTime: data.end_time ? new Date(data.end_time) : undefined,
    totalCards: data.total_cards,
    correctCards: data.correct_cards,
    incorrectCards: data.incorrect_cards,
    systems: data.systems,
    studyMode: data.study_mode,
    timeSpent: data.time_spent,
  };
};

// Statistics operations
export const getSystemStats = async () => {
  const user = await getCurrentUser();
  
  // Get all systems
  const { data: systemsData, error: systemsError } = await supabase
    .from('drugs')
    .select('system')
    .order('system');
  
  if (systemsError) throw systemsError;
  
  const systems = Array.from(new Set(systemsData.map(d => d.system))).sort();
  
  const stats = await Promise.all(
    systems.map(async (system) => {
      const { data: drugs, error: drugsError } = await supabase
        .from('drugs')
        .select('id')
        .eq('system', system);
      
      if (drugsError) throw drugsError;
      
      const { data: bookmarks, error: bookmarksError } = await supabase
        .from('bookmarks')
        .select('drug_id')
        .eq('user_id', user.id)
        .in('drug_id', drugs.map(d => d.id));
      
      if (bookmarksError) throw bookmarksError;
      
      return {
        system,
        totalDrugs: drugs.length,
        bookmarkedDrugs: bookmarks.length,
      };
    })
  );
  
  return stats;
};

export const getStudyStatistics = async () => {
  const user = await getCurrentUser();
  
  const { data: progressData, error: progressError } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', user.id);
  
  if (progressError) throw progressError;
  
  const { data: sessionsData, error: sessionsError } = await supabase
    .from('study_sessions')
    .select('*')
    .eq('user_id', user.id)
    .not('end_time', 'is', null);
  
  if (sessionsError) throw sessionsError;
  
  const totalStudied = progressData.filter(p => p.seen).length;
  const totalCorrect = progressData.reduce((sum, p) => sum + p.correct_count, 0);
  const totalIncorrect = progressData.reduce((sum, p) => sum + p.incorrect_count, 0);
  const averageAccuracy = totalCorrect + totalIncorrect > 0 ? (totalCorrect / (totalCorrect + totalIncorrect)) * 100 : 0;
  const cardsNeedingReview = progressData.filter(p => p.needs_review).length;
  const totalTimeSpent = sessionsData.reduce((sum, s) => sum + s.time_spent, 0);
  
  // Calculate study streak (consecutive days with study sessions)
  const today = new Date();
  let studyStreak = 0;
  for (let i = 0; i < 365; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(checkDate.getDate() - i);
    const dayStart = checkDate.toISOString().split('T')[0];
    
    const hasSession = sessionsData.some(s => {
      const sessionDate = new Date(s.start_time).toISOString().split('T')[0];
      return sessionDate === dayStart;
    });
    
    if (hasSession) {
      studyStreak++;
    } else if (i > 0) {
      break; // Break streak if no session found (but allow today to be empty)
    }
  }
  
  return {
    totalStudied,
    totalCorrect,
    totalIncorrect,
    averageAccuracy: Math.round(averageAccuracy),
    studyStreak,
    cardsNeedingReview,
    totalTimeSpent,
    sessionsCompleted: sessionsData.length,
  };
};

// Drug notes operations
export const addDrugNote = async (drugId: number, note: string, tags: string[] = []): Promise<number> => {
  const user = await getCurrentUser();
  
  const { data, error } = await supabase
    .from('drug_notes')
    .insert({
      user_id: user.id,
      drug_id: drugId,
      note,
      tags: tags.length > 0 ? tags : null,
    })
    .select('id')
    .single();
  
  if (error) throw error;
  return data.id;
};

export const updateDrugNote = async (noteId: number, note: string, tags: string[] = []): Promise<void> => {
  const { error } = await supabase
    .from('drug_notes')
    .update({
      note,
      tags: tags.length > 0 ? tags : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', noteId);
  
  if (error) throw error;
};

export const deleteDrugNote = async (noteId: number): Promise<void> => {
  const { error } = await supabase
    .from('drug_notes')
    .delete()
    .eq('id', noteId);
  
  if (error) throw error;
};

export const getDrugNotes = async (drugId: number): Promise<DrugNote[]> => {
  const user = await getCurrentUser();
  
  const { data, error } = await supabase
    .from('drug_notes')
    .select('*')
    .eq('user_id', user.id)
    .eq('drug_id', drugId)
    .order('updated_at', { ascending: false });
  
  if (error) throw error;
  
  return data.map(row => ({
    id: row.id,
    userId: row.user_id,
    drugId: row.drug_id,
    note: row.note,
    tags: row.tags || [],
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  }));
};

export const getAllNotes = async (): Promise<DrugNote[]> => {
  const user = await getCurrentUser();
  
  const { data, error } = await supabase
    .from('drug_notes')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });
  
  if (error) throw error;
  
  return data.map(row => ({
    id: row.id,
    userId: row.user_id,
    drugId: row.drug_id,
    note: row.note,
    tags: row.tags || [],
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  }));
};

// Clear all drugs from database
export const clearAllDrugs = async (): Promise<{ deleted: number }> => {
  try {
    // Verify user is authenticated
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('User must be authenticated to clear data');
    }

    console.log('Clearing all drugs from database...');
    
    // First get count of existing drugs
    const { count: beforeCount, error: beforeCountError } = await supabase
      .from('drugs')
      .select('*', { count: 'exact', head: true });
    
    if (beforeCountError) {
      console.error('Error counting drugs before deletion:', beforeCountError);
      throw beforeCountError;
    }
    
    const initialCount = beforeCount || 0;
    
    // Delete all drugs by getting all IDs first, then deleting them
    const { data: allDrugs, error: fetchError } = await supabase
      .from('drugs')
      .select('id');
    
    if (fetchError) {
      console.error('Error fetching drug IDs for deletion:', fetchError);
      throw fetchError;
    }
    
    if (!allDrugs || allDrugs.length === 0) {
      console.log('No drugs to delete');
      return { deleted: 0 };
    }
    
    // Delete all drugs using their IDs
    const drugIds = allDrugs.map(drug => drug.id);
    const { error } = await supabase
      .from('drugs')
      .delete()
      .in('id', drugIds);
    
    if (error) {
      console.error('Error clearing drugs:', error);
      throw error;
    }
    
    // Get count of remaining drugs to verify deletion
    const { count: afterCount, error: afterCountError } = await supabase
      .from('drugs')
      .select('*', { count: 'exact', head: true });
    
    if (afterCountError) {
      console.error('Error counting remaining drugs:', afterCountError);
    }
    
    const remainingCount = afterCount || 0;
    const deletedCount = drugIds.length; // We know how many we tried to delete
    
    console.log(`Cleared ${deletedCount} drugs from database. Remaining: ${remainingCount}`);
    
    return {
      deleted: deletedCount
    };
  } catch (error) {
    console.error('Failed to clear drug data:', error);
    throw error;
  }
};

// Initialize database with drug data (supports both initial setup and updates)
export const initializeDrugData = async (drugData: any[], forceImport: boolean = false): Promise<{ imported: number; updated: number; skipped: number }> => {
  try {
    // Verify user is authenticated
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('User must be authenticated to initialize data');
    }

    // Check if database already has drugs and we're not forcing import
    if (!forceImport) {
      const { count, error: countError } = await supabase
        .from('drugs')
        .select('*', { count: 'exact', head: true });
      
      if (countError) {
        console.error('Error checking existing drug count:', countError);
        throw countError;
      }
      
      const existingCount = count || 0;
      if (existingCount > 0) {
        console.log(`Database already contains ${existingCount} drugs. Use forceImport=true to override.`);
        return {
          imported: 0,
          updated: 0,
          skipped: existingCount
        };
      }
    }

    console.log(`Starting import of ${drugData.length} drugs...`);
    
    let importedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    
    // Process drugs in smaller batches to avoid timeout
    const batchSize = 50;
    for (let i = 0; i < drugData.length; i += batchSize) {
      const batch = drugData.slice(i, i + batchSize);
      
      // Use upsert to handle both new drugs and updates to existing ones
      const { data, error } = await supabase
        .from('drugs')
        .upsert(batch.map(drug => ({
          id: drug.id,
          name: drug.name,
          class: drug.class,
          system: drug.system,
          moa: drug.moa,
          uses: drug.uses,
          side_effects: drug.side_effects,
          mnemonic: drug.mnemonic || null,
          contraindications: drug.contraindications || null,
          dosage: drug.dosage || null,
        })), {
          onConflict: 'id',
          ignoreDuplicates: false
        })
        .select('id');
      
      if (error) {
        console.error(`Error upserting drug batch ${i}-${i + batchSize}:`, error);
        throw error;
      }
      
      // Count the results (upsert returns the affected rows)
      const batchProcessed = data ? data.length : batch.length;
      importedCount += batchProcessed;
      
      console.log(`Processed drugs ${i + 1}-${Math.min(i + batchSize, drugData.length)} of ${drugData.length}`);
    }
    
    console.log(`Import completed: ${importedCount} drugs processed`);
    
    return {
      imported: importedCount,
      updated: 0, // Upsert doesn't distinguish between insert/update
      skipped: skippedCount
    };
  } catch (error) {
    console.error('Failed to initialize drug data:', error);
    throw error;
  }
};

// Delete drug operations
export const deleteDrug = async (drugId: number): Promise<void> => {
  try {
    // Verify user is authenticated
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('User must be authenticated to delete drugs');
    }

    console.log(`Attempting to delete drug with ID: ${drugId}`);
    
    // First, verify the drug exists
    const { data: existingDrug, error: fetchError } = await supabase
      .from('drugs')
      .select('id, name')
      .eq('id', drugId)
      .single();
    
    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        throw new Error(`Drug with ID ${drugId} not found`);
      }
      console.error('Error fetching drug before deletion:', fetchError);
      throw fetchError;
    }
    
    console.log(`Found drug: ${existingDrug.name} (ID: ${existingDrug.id})`);
    
    // Attempt to delete the drug - simplified approach
    const { error } = await supabase
      .from('drugs')
      .delete()
      .eq('id', drugId);
    
    if (error) {
      console.error('Error deleting drug:', error);
      throw new Error(`Failed to delete drug: ${error.message}`);
    }
    
    console.log(`Delete operation completed for drug: ${existingDrug.name} (ID: ${drugId})`);
    
    // Verify that the drug is actually gone
    const { data: verifyData, error: verifyError } = await supabase
      .from('drugs')
      .select('id')
      .eq('id', drugId)
      .single();
    
    if (verifyError && verifyError.code === 'PGRST116') {
      console.log('Deletion verified: Drug no longer exists in database');
    } else if (!verifyError && verifyData) {
      console.error('Drug still exists after delete operation - RLS policy may be blocking deletion');
      throw new Error(`Failed to delete drug with ID ${drugId}. The drug still exists in the database. Please check RLS policies and run the fix-drug-delete-permissions.sql script.`);
    } else {
      console.log('Deletion appears successful');
    }
    
  } catch (error) {
    console.error('Failed to delete drug:', error);
    throw error;
  }
};

// Get all unique drug classes
export const getAllDrugClasses = async (): Promise<string[]> => {
  const { data, error } = await supabase
    .from('drugs')
    .select('class')
    .order('class');
  
  if (error) throw error;
  
  // Get unique classes
  const uniqueClasses = Array.from(new Set(data.map(d => d.class))).sort();
  return uniqueClasses;
};