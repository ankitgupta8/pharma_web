import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/common/Layout';
import FlashcardWidget from '../components/flashcard/FlashcardWidget';
import SessionResults from '../components/flashcard/SessionResults';
import { Drug, SessionResult } from '../types/drug.types';
import { drugService } from '../context/AppContext';
import '../styles/flashcard.css';

const ReviewScreen: React.FC = () => {
  const navigate = useNavigate();
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sessionResult, setSessionResult] = useState<SessionResult | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sessionStats, setSessionStats] = useState({
    correctCards: 0,
    incorrectCards: 0,
    newCardsLearned: 0,
    startTime: new Date()
  });

  useEffect(() => {
    loadReviewCards();
  }, []);

  const loadReviewCards = async () => {
    setLoading(true);
    try {
      const reviewCards = await drugService.getCardsNeedingReview();
      
      // Sort by priority: cards with more incorrect answers first
      const sortedCards = reviewCards.sort((a, b) => {
        // This would require getting progress for each card, simplified for now
        return Math.random() - 0.5; // Random for now, can be improved
      });
      
      setDrugs(sortedCards);
      setCurrentIndex(0);

      if (sortedCards.length > 0) {
        // Start review session
        const systems = Array.from(new Set(sortedCards.map(drug => drug.system)));
        const sessionId = await drugService.startStudySession(systems, 'review', sortedCards.length);
        setCurrentSessionId(sessionId);
        setSessionStats({
          correctCards: 0,
          incorrectCards: 0,
          newCardsLearned: 0,
          startTime: new Date()
        });
      }
    } catch (error) {
      console.error('Error loading review cards:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < drugs.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleMarkCorrect = async (correct: boolean) => {
    if (drugs[currentIndex]) {
      try {
        await drugService.updateUserProgress(drugs[currentIndex].id, correct);
        
        // Update session stats
        const newStats = {
          ...sessionStats,
          correctCards: correct ? sessionStats.correctCards + 1 : sessionStats.correctCards,
          incorrectCards: correct ? sessionStats.incorrectCards : sessionStats.incorrectCards + 1
        };
        setSessionStats(newStats);
        
        // Update session in database
        if (currentSessionId) {
          await drugService.updateStudySession(currentSessionId, newStats.correctCards, newStats.incorrectCards);
        }
        
        // Check if this was the last card
        if (currentIndex === drugs.length - 1) {
          await completeSession();
        }
      } catch (error) {
        console.error('Error updating flashcard progress:', error);
      }
    }
  };

  const completeSession = async () => {
    if (currentSessionId) {
      await drugService.endStudySession(currentSessionId);
      
      // Get updated review cards count
      const updatedReviewCards = await drugService.getCardsNeedingReview();
      
      const timeSpent = Math.round((new Date().getTime() - sessionStats.startTime.getTime()) / (1000 * 60));
      const accuracy = sessionStats.correctCards + sessionStats.incorrectCards > 0
        ? Math.round((sessionStats.correctCards / (sessionStats.correctCards + sessionStats.incorrectCards)) * 100)
        : 0;
      
      const systems = Array.from(new Set(drugs.map(drug => drug.system)));
      
      const result: SessionResult = {
        sessionId: currentSessionId,
        totalCards: drugs.length,
        correctCards: sessionStats.correctCards,
        incorrectCards: sessionStats.incorrectCards,
        accuracy,
        timeSpent,
        cardsNeedingReview: updatedReviewCards.length,
        newCardsLearned: 0, // Review sessions don't have new cards
        systems,
        studyMode: 'review'
      };
      
      setSessionResult(result);
    }
  };

  const handleStartNewSession = () => {
    navigate('/flashcards');
  };

  const handleReviewCards = () => {
    setSessionResult(null);
    setCurrentSessionId(null);
    loadReviewCards();
  };

  if (loading) {
    return (
      <Layout title="Review Cards">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading cards for review...</p>
        </div>
      </Layout>
    );
  }

  // Show session results
  if (sessionResult) {
    return (
      <Layout title="Review Complete">
        <div className="page">
          <div className="container">
            <SessionResults
              result={sessionResult}
              onStartNewSession={handleStartNewSession}
              onReviewCards={handleReviewCards}
            />
          </div>
        </div>
      </Layout>
    );
  }

  if (drugs.length === 0) {
    return (
      <Layout title="Review Cards">
        <div className="page">
          <div className="container">
            <div className="card text-center">
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🎉</div>
              <h3>No cards need review!</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
                Great job! All your cards are up to date. Keep studying to maintain your progress.
              </p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button
                  onClick={() => navigate('/flashcards')}
                  className="btn btn-primary"
                >
                  📚 Study More Cards
                </button>
                <button
                  onClick={() => navigate('/quiz')}
                  className="btn btn-secondary"
                >
                  🧠 Take a Quiz
                </button>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Review Cards" showHeader={false}>
      <div className="page" style={{ padding: 0 }}>
        {/* Header */}
        <div style={{
          background: 'var(--warning-color)',
          color: 'white',
          padding: '16px',
          position: 'sticky',
          top: 0,
          zIndex: 100
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px'
          }}>
            <h1 style={{ margin: 0, fontSize: '1.25rem' }}>🔄 Review Session</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                onClick={() => navigate('/flashcards')}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  color: 'white',
                  padding: '6px 12px',
                  borderRadius: '16px',
                  fontSize: '0.75rem',
                  cursor: 'pointer'
                }}
              >
                ← Back
              </button>
              <div style={{ fontSize: '0.875rem' }}>
                {drugs.length} card{drugs.length !== 1 ? 's' : ''} to review
              </div>
            </div>
          </div>

          <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>
            These cards need extra attention based on your previous performance
          </div>
        </div>

        {/* Flashcard */}
        <FlashcardWidget
          drug={drugs[currentIndex]}
          onNext={handleNext}
          onPrevious={handlePrevious}
          onMarkCorrect={handleMarkCorrect}
          currentIndex={currentIndex}
          totalCards={drugs.length}
        />
      </div>
    </Layout>
  );
};

export default ReviewScreen;