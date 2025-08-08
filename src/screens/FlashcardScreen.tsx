import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Layout from '../components/common/Layout';
import FlashcardWidget from '../components/flashcard/FlashcardWidget';
import TopicSelector from '../components/flashcard/TopicSelector';
import SessionResults from '../components/flashcard/SessionResults';
import AnalyticsDashboard from '../components/analytics/AnalyticsDashboard';
import { Drug, DrugSystem, SessionResult } from '../types/drug.types';
import { drugService } from '../context/AppContext';
import '../styles/flashcard.css';
import '../styles/analytics.css';

const FlashcardScreen: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedSystems, setSelectedSystems] = useState<DrugSystem[]>([]);
  const [studyMode, setStudyMode] = useState<'all' | 'bookmarked' | 'unseen' | 'review'>('all');
  const [showTopicSelector, setShowTopicSelector] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [sessionResult, setSessionResult] = useState<SessionResult | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sessionStats, setSessionStats] = useState({
    correctCards: 0,
    incorrectCards: 0,
    newCardsLearned: 0,
    startTime: new Date()
  });

  useEffect(() => {
    // Check if specific drug ID is provided
    const drugId = searchParams.get('drug');
    if (drugId) {
      loadSpecificDrug(parseInt(drugId));
    } else {
      loadDrugs();
    }
  }, [searchParams, selectedSystems, studyMode]);

  const loadSpecificDrug = async (drugId: number) => {
    setLoading(true);
    try {
      const drug = await drugService.getDrugById(drugId);
      if (drug) {
        setDrugs([drug]);
        setCurrentIndex(0);
      }
    } catch (error) {
      console.error('Error loading specific drug:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDrugs = async () => {
    setLoading(true);
    try {
      let drugList: Drug[];
      
      if (selectedSystems.length === 0) {
        drugList = [];
      } else {
        // Get all available systems from the database
        const allDrugs = await drugService.getAllDrugs();
        const allSystems = Array.from(new Set(allDrugs.map(drug => drug.system)));
        
        if (selectedSystems.length === allSystems.length) {
          // All systems selected
          drugList = allDrugs;
        } else {
          // Get drugs from multiple selected systems
          const drugPromises = selectedSystems.map(system => drugService.getDrugsBySystem(system));
          const drugArrays = await Promise.all(drugPromises);
          drugList = drugArrays.flat();
          
          // Remove duplicates if any (though shouldn't be any in this case)
          const uniqueDrugs = drugList.filter((drug, index, self) =>
            index === self.findIndex(d => d.id === drug.id)
          );
          drugList = uniqueDrugs;
        }
      }

      // Apply study mode filter
      if (studyMode === 'bookmarked') {
        drugList = await drugService.getBookmarkedDrugs();
        // Filter by selected systems
        if (selectedSystems.length > 0) {
          drugList = drugList.filter(drug => selectedSystems.includes(drug.system));
        }
      } else if (studyMode === 'unseen') {
        // For unseen mode, we need to get drugs that haven't been studied yet
        // This requires checking user progress for each drug
        const unseenDrugs: Drug[] = [];
        for (const drug of drugList) {
          const progress = await drugService.getUserProgress(drug.id);
          if (!progress || !progress.seen) {
            unseenDrugs.push(drug);
          }
        }
        drugList = unseenDrugs;
      } else if (studyMode === 'review') {
        drugList = await drugService.getCardsNeedingReview();
        // Filter by selected systems if not all systems are selected
        if (selectedSystems.length > 0) {
          drugList = drugList.filter(drug => selectedSystems.includes(drug.system));
        }
      }

      // Shuffle drugs for better learning (except for review mode which should be ordered by priority)
      if (studyMode !== 'review') {
        drugList = drugList.sort(() => Math.random() - 0.5);
      }
      
      setDrugs(drugList);
      setCurrentIndex(0);

      // Start a new study session if we have drugs
      if (drugList.length > 0 && !searchParams.get('drug')) {
        const sessionId = await drugService.startStudySession(
          selectedSystems,
          studyMode,
          drugList.length
        );
        setCurrentSessionId(sessionId);
        setSessionStats({
          correctCards: 0,
          incorrectCards: 0,
          newCardsLearned: 0,
          startTime: new Date()
        });
      }
    } catch (error) {
      console.error('Error loading drugs:', error);
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
        const drug = drugs[currentIndex];
        
        // Check if this is a new card
        const progress = await drugService.getUserProgress(drug.id);
        const isNewCard = !progress || !progress.seen;
        
        await drugService.updateUserProgress(drug.id, correct);
        
        // Update session stats
        const newStats = {
          ...sessionStats,
          correctCards: correct ? sessionStats.correctCards + 1 : sessionStats.correctCards,
          incorrectCards: correct ? sessionStats.incorrectCards : sessionStats.incorrectCards + 1,
          newCardsLearned: isNewCard ? sessionStats.newCardsLearned + 1 : sessionStats.newCardsLearned
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
      
      // Calculate cards needing review
      const reviewCards = await drugService.getCardsNeedingReview();
      const cardsNeedingReview = reviewCards.filter(card =>
        selectedSystems.includes(card.system)
      ).length;
      
      const timeSpent = Math.round((new Date().getTime() - sessionStats.startTime.getTime()) / (1000 * 60));
      const accuracy = sessionStats.correctCards + sessionStats.incorrectCards > 0
        ? Math.round((sessionStats.correctCards / (sessionStats.correctCards + sessionStats.incorrectCards)) * 100)
        : 0;
      
      const result: SessionResult = {
        sessionId: currentSessionId,
        totalCards: drugs.length,
        correctCards: sessionStats.correctCards,
        incorrectCards: sessionStats.incorrectCards,
        accuracy,
        timeSpent,
        cardsNeedingReview,
        newCardsLearned: sessionStats.newCardsLearned,
        systems: selectedSystems,
        studyMode
      };
      
      setSessionResult(result);
    }
  };

  const handleStartNewSession = () => {
    setSessionResult(null);
    setCurrentSessionId(null);
    setShowTopicSelector(true);
  };

  const handleReviewCards = () => {
    setSessionResult(null);
    setStudyMode('review');
    setShowTopicSelector(false);
    loadDrugs();
  };

  const handleSystemToggle = (system: DrugSystem) => {
    setSelectedSystems(prev => {
      if (prev.includes(system)) {
        return prev.filter(s => s !== system);
      } else {
        return [...prev, system];
      }
    });
    setCurrentIndex(0);
  };

  const handleSelectAllSystems = async () => {
    try {
      const allDrugs = await drugService.getAllDrugs();
      const allSystems = Array.from(new Set(allDrugs.map(drug => drug.system)));
      setSelectedSystems(allSystems);
      setCurrentIndex(0);
    } catch (error) {
      console.error('Error loading all systems:', error);
    }
  };

  const handleClearAllSystems = () => {
    setSelectedSystems([]);
    setCurrentIndex(0);
  };

  const handleStudyModeChange = (mode: 'all' | 'bookmarked' | 'unseen' | 'review') => {
    setStudyMode(mode);
    setCurrentIndex(0);
  };

  if (loading) {
    return (
      <Layout title="Flashcards">
        <div className="loading">
          <div className="spinner"></div>
        </div>
      </Layout>
    );
  }

  // Show session results
  if (sessionResult) {
    return (
      <Layout title="Session Complete">
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

  // Show analytics modal
  if (showAnalytics) {
    return (
      <>
        <Layout title="Flashcards">
          <div className="page">
            <div className="container">
              <div className="card text-center">
                <h3>Loading analytics...</h3>
              </div>
            </div>
          </div>
        </Layout>
        <AnalyticsDashboard onClose={() => setShowAnalytics(false)} />
      </>
    );
  }

  if (drugs.length === 0 && !loading) {
    return (
      <Layout title="Flashcards">
        <div className="page">
          <div className="container">
            {/* Topic Selector */}
            <TopicSelector
              selectedSystems={selectedSystems}
              onSystemToggle={handleSystemToggle}
              onSelectAll={handleSelectAllSystems}
              onClearAll={handleClearAllSystems}
            />
            
            <div className="card text-center">
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🃏</div>
              <h3>No flashcards available</h3>
              <p style={{ color: 'var(--text-secondary)' }}>
                {selectedSystems.length === 0
                  ? 'Please select at least one topic to study.'
                  : studyMode === 'bookmarked'
                  ? 'You haven\'t bookmarked any drugs from the selected topics yet.'
                  : studyMode === 'unseen'
                  ? 'All drugs from the selected topics have been studied!'
                  : 'No drugs found for the selected topics.'
                }
              </p>
              <div style={{ marginTop: '16px' }}>
                <button
                  onClick={() => handleStudyModeChange('all')}
                  className="btn btn-primary"
                >
                  Study All Drugs
                </button>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Flashcards" showHeader={false}>
      <div className="page" style={{ padding: 0 }}>
        {/* Header with controls */}
        <div style={{
          background: 'var(--primary-color)',
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
            <h1 style={{ margin: 0, fontSize: '1.25rem' }}>🃏 Flashcards</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {/* Topic selector toggle - only show if not studying specific drug */}
              {!searchParams.get('drug') && (
                <>
                  <button
                    onClick={() => setShowTopicSelector(!showTopicSelector)}
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
                    📚 Topics ({selectedSystems.length})
                  </button>
                  <button
                    onClick={() => setShowAnalytics(true)}
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
                    📊 Analytics
                  </button>
                </>
              )}
              <div style={{ fontSize: '0.875rem' }}>
                {drugs.length} card{drugs.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>

          {/* Study mode filter */}
          {!searchParams.get('drug') && (
            <div style={{
              display: 'flex',
              gap: '8px',
              fontSize: '0.75rem'
            }}>
              {[
                { key: 'all', label: 'All Drugs', icon: '📚' },
                { key: 'bookmarked', label: 'Bookmarked', icon: '⭐' },
                { key: 'unseen', label: 'Unseen', icon: '👁️' },
                { key: 'review', label: 'Review', icon: '🔄' }
              ].map((mode) => (
                <button
                  key={mode.key}
                  onClick={() => handleStudyModeChange(mode.key as any)}
                  style={{
                    background: studyMode === mode.key
                      ? 'rgba(255,255,255,0.3)'
                      : 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    cursor: 'pointer'
                  }}
                >
                  {mode.icon} {mode.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Topic Selector - show when toggled and not studying specific drug */}
        {showTopicSelector && !searchParams.get('drug') && (
          <div style={{ padding: '16px', background: 'var(--background-color)' }}>
            <TopicSelector
              selectedSystems={selectedSystems}
              onSystemToggle={handleSystemToggle}
              onSelectAll={handleSelectAllSystems}
              onClearAll={handleClearAllSystems}
            />
            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <button
                onClick={() => setShowTopicSelector(false)}
                className="btn btn-primary"
              >
                Start Studying
              </button>
            </div>
          </div>
        )}

        {/* Flashcard - only show if topics are selected and not showing topic selector */}
        {selectedSystems.length > 0 && !showTopicSelector && (
          <FlashcardWidget
            drug={drugs[currentIndex]}
            onNext={handleNext}
            onPrevious={handlePrevious}
            onMarkCorrect={handleMarkCorrect}
            currentIndex={currentIndex}
            totalCards={drugs.length}
          />
        )}
      </div>
    </Layout>
  );
};

export default FlashcardScreen;