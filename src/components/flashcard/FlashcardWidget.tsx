import React, { useState, useEffect } from 'react';
import { Drug } from '../../types/drug.types';
import { drugService } from '../../context/AppContext';

// Define a local interface for progress since we're using Supabase user_progress
interface UserProgress {
  seen: boolean;
  correctCount: number;
  incorrectCount: number;
  difficulty: 'easy' | 'medium' | 'hard';
  streakCount: number;
}

interface FlashcardWidgetProps {
  drug: Drug;
  onNext: () => void;
  onPrevious: () => void;
  onMarkCorrect: (correct: boolean) => void;
  currentIndex: number;
  totalCards: number;
}

const FlashcardWidget: React.FC<FlashcardWidgetProps> = ({
  drug,
  onNext,
  onPrevious,
  onMarkCorrect,
  currentIndex,
  totalCards
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [showFeedback, setShowFeedback] = useState<'correct' | 'incorrect' | null>(null);

  // Reset flip state when drug changes and load progress
  useEffect(() => {
    setIsFlipped(false);
    setShowFeedback(null);
    loadProgress();
  }, [drug.id]);

  const loadProgress = async () => {
    try {
      const drugProgress = await drugService.getUserProgress(drug.id);
      if (drugProgress) {
        setProgress({
          seen: drugProgress.seen,
          correctCount: drugProgress.correct_count,
          incorrectCount: drugProgress.incorrect_count,
          difficulty: drugProgress.difficulty,
          streakCount: drugProgress.streak_count
        });
      } else {
        setProgress(null);
      }
    } catch (error) {
      console.error('Error loading progress:', error);
    }
  };

  const minSwipeDistance = 50;

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && currentIndex < totalCards - 1) {
      onNext();
    }
    if (isRightSwipe && currentIndex > 0) {
      onPrevious();
    }
  };

  const getSystemIcon = (system: string) => {
    const icons: Record<string, string> = {
      'CVS': '❤️',
      'CNS': '🧠',
      'Respiratory': '🫁',
      'GI': '🍽️',
      'Endocrine': '⚖️',
      'Antibiotics': '🦠'
    };
    return icons[system] || '💊';
  };

  const getSystemColor = (system: string) => {
    const colors: Record<string, string> = {
      'CVS': '#e53e3e',
      'CNS': '#805ad5',
      'Respiratory': '#38b2ac',
      'GI': '#d69e2e',
      'Endocrine': '#38a169',
      'Antibiotics': '#3182ce'
    };
    return colors[system] || '#666';
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '#4caf50';
      case 'medium': return '#ff9800';
      case 'hard': return '#f44336';
      default: return '#666';
    }
  };

  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '😊';
      case 'medium': return '😐';
      case 'hard': return '😰';
      default: return '❓';
    }
  };

  const handleMarkCorrectWithFeedback = async (correct: boolean) => {
    setShowFeedback(correct ? 'correct' : 'incorrect');
    
    // Show feedback for a moment, then mark correct and advance
    setTimeout(() => {
      setShowFeedback(null);
      onMarkCorrect(correct);
      
      // Auto-advance to next card if not the last card
      if (currentIndex < totalCards - 1) {
        setTimeout(() => {
          onNext();
          setIsFlipped(false);
        }, 300);
      }
      // If this is the last card, the session completion will be handled by the parent component
    }, 800);
  };

  return (
    <div className="flashcard-container">
      {/* Progress indicator */}
      <div className="flashcard-progress">
        <div className="progress-bar">
          <div 
            className="progress-fill"
            style={{ width: `${((currentIndex + 1) / totalCards) * 100}%` }}
          />
        </div>
        <span className="progress-text">
          {currentIndex + 1} of {totalCards}
        </span>
      </div>

      {/* Flashcard */}
      <div 
        className={`flashcard ${isFlipped ? 'flipped' : ''}`}
        onClick={handleFlip}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="flashcard-inner">
          {/* Front of card */}
          <div className="flashcard-front">
            <div className="card-header">
              <div className="header-left">
                <span
                  className="system-badge"
                  style={{ backgroundColor: getSystemColor(drug.system) }}
                >
                  {getSystemIcon(drug.system)} {drug.system}
                </span>
                {progress && progress.seen && (
                  <span
                    className="difficulty-badge"
                    style={{ backgroundColor: getDifficultyColor(progress.difficulty) }}
                    title={`Difficulty: ${progress.difficulty}`}
                  >
                    {getDifficultyIcon(progress.difficulty)}
                  </span>
                )}
              </div>
              <span className="class-badge">{drug.class}</span>
            </div>
            
            <div className="card-content">
              <h2 className="drug-name">{drug.name}</h2>
              {progress && progress.seen && (
                <div className="progress-indicators">
                  <div className="streak-indicator">
                    🔥 Streak: {progress.streakCount}
                  </div>
                  <div className="accuracy-indicator">
                    📊 {progress.correctCount + progress.incorrectCount > 0
                      ? Math.round((progress.correctCount / (progress.correctCount + progress.incorrectCount)) * 100)
                      : 0}% accuracy
                  </div>
                </div>
              )}
              <p className="tap-hint">Tap to reveal details</p>
            </div>

            <div className="card-footer">
              <div className="swipe-hint">
                ← Swipe to navigate →
              </div>
            </div>
          </div>

          {/* Back of card */}
          <div className="flashcard-back">
            <div className="card-header">
              <h3 className="drug-name-small">{drug.name}</h3>
              <button 
                className="flip-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleFlip();
                }}
              >
                ↩️
              </button>
            </div>

            <div className="card-content-back">
              <div className="info-section">
                <h4>🔬 Mechanism</h4>
                <p>{drug.moa}</p>
              </div>

              <div className="info-section">
                <h4>🎯 Uses</h4>
                <div className="uses-list">
                  {drug.uses.slice(0, 3).map((use, index) => (
                    <span key={index} className="use-badge">{use}</span>
                  ))}
                  {drug.uses.length > 3 && (
                    <span className="use-badge">+{drug.uses.length - 3} more</span>
                  )}
                </div>
              </div>

              <div className="info-section">
                <h4>⚠️ Side Effects</h4>
                <div className="effects-list">
                  {drug.side_effects.slice(0, 3).map((effect, index) => (
                    <span key={index} className="effect-badge">{effect}</span>
                  ))}
                  {drug.side_effects.length > 3 && (
                    <span className="effect-badge">+{drug.side_effects.length - 3} more</span>
                  )}
                </div>
              </div>

              {drug.mnemonic && (
                <div className="info-section mnemonic-section">
                  <h4>🧠 Memory Aid</h4>
                  <p className="mnemonic">"{drug.mnemonic}"</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Feedback overlay */}
      {showFeedback && (
        <div className={`feedback-overlay ${showFeedback}`}>
          <div className="feedback-content">
            {showFeedback === 'correct' ? (
              <>
                <div className="feedback-icon">✅</div>
                <div className="feedback-text">Great job!</div>
              </>
            ) : (
              <>
                <div className="feedback-icon">❌</div>
                <div className="feedback-text">Keep studying!</div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flashcard-actions">
        <button
          className="action-btn incorrect-btn"
          onClick={() => handleMarkCorrectWithFeedback(false)}
          disabled={!isFlipped || showFeedback !== null}
        >
          ❌ Need Review
        </button>
        
        <button
          className="action-btn correct-btn"
          onClick={() => handleMarkCorrectWithFeedback(true)}
          disabled={!isFlipped || showFeedback !== null}
        >
          ✅ Got It!
        </button>
      </div>

      {/* Navigation buttons */}
      <div className="flashcard-navigation">
        <button 
          className="nav-btn"
          onClick={() => {
            onPrevious();
            setIsFlipped(false);
          }}
          disabled={currentIndex === 0}
        >
          ← Previous
        </button>
        
        <button 
          className="nav-btn"
          onClick={() => {
            onNext();
            setIsFlipped(false);
          }}
          disabled={currentIndex === totalCards - 1}
        >
          Next →
        </button>
      </div>
    </div>
  );
};

export default FlashcardWidget;