import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { Drug, QuizScore, DrugSystem } from '../types/drug.types';
import { useAuth } from './AuthContext';
import * as supabaseService from '../services/supabaseService';
import drugData from '../data/drugData.json';

// State interface
interface AppState {
  isLoading: boolean;
  isInitialized: boolean;
  dailyDrug: Drug | null;
  systemStats: Array<{
    system: string;
    totalDrugs: number;
    bookmarkedDrugs: number;
  }>;
  currentQuiz: {
    questions: any[];
    currentIndex: number;
    score: number;
    isActive: boolean;
  };
  error: string | null;
  theme: 'light' | 'dark';
}

// Action types
type AppAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_INITIALIZED'; payload: boolean }
  | { type: 'SET_DAILY_DRUG'; payload: Drug | null }
  | { type: 'SET_SYSTEM_STATS'; payload: AppState['systemStats'] }
  | { type: 'START_QUIZ'; payload: any[] }
  | { type: 'NEXT_QUESTION' }
  | { type: 'UPDATE_SCORE'; payload: number }
  | { type: 'END_QUIZ' }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'TOGGLE_THEME' };

// Initial state
const initialState: AppState = {
  isLoading: true,
  isInitialized: false,
  dailyDrug: null,
  systemStats: [],
  currentQuiz: {
    questions: [],
    currentIndex: 0,
    score: 0,
    isActive: false
  },
  error: null,
  theme: 'light'
};

// Reducer
const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_INITIALIZED':
      return { ...state, isInitialized: action.payload };
    
    case 'SET_DAILY_DRUG':
      return { ...state, dailyDrug: action.payload };
    
    case 'SET_SYSTEM_STATS':
      return { ...state, systemStats: action.payload };
    
    case 'START_QUIZ':
      return {
        ...state,
        currentQuiz: {
          questions: action.payload,
          currentIndex: 0,
          score: 0,
          isActive: true
        }
      };
    
    case 'NEXT_QUESTION':
      return {
        ...state,
        currentQuiz: {
          ...state.currentQuiz,
          currentIndex: state.currentQuiz.currentIndex + 1
        }
      };
    
    case 'UPDATE_SCORE':
      return {
        ...state,
        currentQuiz: {
          ...state.currentQuiz,
          score: state.currentQuiz.score + action.payload
        }
      };
    
    case 'END_QUIZ':
      return {
        ...state,
        currentQuiz: {
          questions: [],
          currentIndex: 0,
          score: 0,
          isActive: false
        }
      };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    
    case 'TOGGLE_THEME':
      return { 
        ...state, 
        theme: state.theme === 'light' ? 'dark' : 'light' 
      };
    
    default:
      return state;
  }
};

// Context
const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

// Provider component
interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const { user } = useAuth();

  // Initialize app on mount
  useEffect(() => {
    const initializeApp = async () => {
      if (!user) {
        dispatch({ type: 'SET_LOADING', payload: false });
        dispatch({ type: 'SET_INITIALIZED', payload: false });
        return;
      }

      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        dispatch({ type: 'SET_ERROR', payload: null });
        
        // Wait a bit for auth to fully settle
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Check if database connection is working
        try {
          const existingDrugs = await supabaseService.getAllDrugs();
          console.log(`Database contains ${existingDrugs.length} drugs`);
          
          dispatch({ type: 'SET_INITIALIZED', payload: true });
        } catch (initError) {
          console.error('Failed to check drug data:', initError);
          dispatch({ type: 'SET_ERROR', payload: 'Failed to connect to database. Please ensure you are signed in and have proper permissions.' });
          return;
        }
        
        // Load daily drug with error handling
        try {
          const dailyDrug = await supabaseService.getDailyDrug();
          dispatch({ type: 'SET_DAILY_DRUG', payload: dailyDrug });
        } catch (dailyDrugError) {
          console.warn('Failed to load daily drug:', dailyDrugError);
          // Don't fail the entire initialization for daily drug
        }
        
        // Load system stats with error handling
        try {
          const stats = await supabaseService.getSystemStats();
          dispatch({ type: 'SET_SYSTEM_STATS', payload: stats });
        } catch (statsError) {
          console.warn('Failed to load system stats:', statsError);
          // Don't fail the entire initialization for stats
        }
        
        dispatch({ type: 'SET_ERROR', payload: null });
      } catch (error) {
        console.error('Failed to initialize app:', error);
        dispatch({ type: 'SET_ERROR', payload: 'Failed to initialize app. Please check your connection and try signing in again.' });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    // Only initialize if we have a user and haven't initialized yet
    if (user && !state.isInitialized) {
      initializeApp();
    } else if (!user) {
      dispatch({ type: 'SET_LOADING', payload: false });
      dispatch({ type: 'SET_INITIALIZED', payload: false });
    }
  }, [user, state.isInitialized]);

  // Load theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('drugDeckTheme') as 'light' | 'dark';
    if (savedTheme && savedTheme !== state.theme) {
      dispatch({ type: 'TOGGLE_THEME' });
    }
  }, []);

  // Save theme to localStorage
  useEffect(() => {
    localStorage.setItem('drugDeckTheme', state.theme);
    document.documentElement.setAttribute('data-theme', state.theme);
  }, [state.theme]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

// Custom hook to use the context
export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

// Helper functions for common actions
export const useAppActions = () => {
  const { dispatch } = useApp();

  return {
    setLoading: (loading: boolean) => dispatch({ type: 'SET_LOADING', payload: loading }),
    setError: (error: string | null) => dispatch({ type: 'SET_ERROR', payload: error }),
    toggleTheme: () => dispatch({ type: 'TOGGLE_THEME' }),
    startQuiz: (questions: any[]) => dispatch({ type: 'START_QUIZ', payload: questions }),
    nextQuestion: () => dispatch({ type: 'NEXT_QUESTION' }),
    updateScore: (points: number) => dispatch({ type: 'UPDATE_SCORE', payload: points }),
    endQuiz: () => dispatch({ type: 'END_QUIZ' }),
    refreshDailyDrug: async () => {
      try {
        const dailyDrug = await supabaseService.getDailyDrug();
        dispatch({ type: 'SET_DAILY_DRUG', payload: dailyDrug });
      } catch (error) {
        console.error('Failed to refresh daily drug:', error);
        dispatch({ type: 'SET_ERROR', payload: 'Failed to refresh daily drug' });
      }
    },
    refreshStats: async () => {
      try {
        const stats = await supabaseService.getSystemStats();
        dispatch({ type: 'SET_SYSTEM_STATS', payload: stats });
      } catch (error) {
        console.error('Failed to refresh stats:', error);
        dispatch({ type: 'SET_ERROR', payload: 'Failed to refresh stats' });
      }
    }
  };
};

// Supabase service functions - exposed for components to use
export const drugService = {
  getAllDrugs: supabaseService.getAllDrugs,
  getDrugById: supabaseService.getDrugById,
  getDrugsBySystem: supabaseService.getDrugsBySystem,
  getDrugsByClass: supabaseService.getDrugsByClass,
  searchDrugs: supabaseService.searchDrugs,
  getBookmarkedDrugs: supabaseService.getBookmarkedDrugs,
  isBookmarked: supabaseService.isBookmarked,
  toggleBookmark: supabaseService.toggleBookmark,
  getDailyDrug: supabaseService.getDailyDrug,
  getUserProgress: supabaseService.getUserProgress,
  updateUserProgress: supabaseService.updateUserProgress,
  getCardsNeedingReview: supabaseService.getCardsNeedingReview,
  saveQuizScore: supabaseService.saveQuizScore,
  getQuizHistory: supabaseService.getQuizHistory,
  startStudySession: supabaseService.startStudySession,
  updateStudySession: supabaseService.updateStudySession,
  endStudySession: supabaseService.endStudySession,
  getStudySession: supabaseService.getStudySession,
  getSystemStats: supabaseService.getSystemStats,
  getStudyStatistics: supabaseService.getStudyStatistics,
  addDrugNote: supabaseService.addDrugNote,
  updateDrugNote: supabaseService.updateDrugNote,
  deleteDrugNote: supabaseService.deleteDrugNote,
  getDrugNotes: supabaseService.getDrugNotes,
  getAllNotes: supabaseService.getAllNotes,
};