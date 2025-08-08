import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import AuthComponent from './components/auth/AuthComponent';
import HomeScreen from './screens/HomeScreen';
import DrugListScreen from './screens/DrugListScreen';
import DrugDetailScreen from './screens/DrugDetailScreen';
import FlashcardScreen from './screens/FlashcardScreen';
import QuizScreen from './screens/QuizScreen';
import DailyDrugScreen from './screens/DailyDrugScreen';
import BookmarksScreen from './screens/BookmarksScreen';
import ReviewScreen from './screens/ReviewScreen';
import AdminScreen from './screens/AdminScreen';
import './styles/globals.css';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <AuthComponent />;
  }

  return (
    <AppProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<HomeScreen />} />
            <Route path="/drugs" element={<DrugListScreen />} />
            <Route path="/drug/:id" element={<DrugDetailScreen />} />
            <Route path="/flashcards" element={<FlashcardScreen />} />
            <Route path="/quiz" element={<QuizScreen />} />
            <Route path="/bookmarks" element={<BookmarksScreen />} />
            <Route path="/daily" element={<DailyDrugScreen />} />
            <Route path="/review" element={<ReviewScreen />} />
            <Route path="/admin" element={<AdminScreen />} />
            {/* Catch all route */}
            <Route path="*" element={<HomeScreen />} />
          </Routes>
        </div>
      </Router>
    </AppProvider>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
