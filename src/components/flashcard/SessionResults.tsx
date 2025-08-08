import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SessionResult } from '../../types/drug.types';

interface SessionResultsProps {
  result: SessionResult;
  onStartNewSession: () => void;
  onReviewCards: () => void;
}

const SessionResults: React.FC<SessionResultsProps> = ({
  result,
  onStartNewSession,
  onReviewCards
}) => {
  const navigate = useNavigate();

  const getPerformanceMessage = (accuracy: number) => {
    if (accuracy >= 90) return { message: "Outstanding! You're mastering these concepts!", emoji: "🌟", color: "#4caf50" };
    if (accuracy >= 80) return { message: "Excellent work! Keep up the great progress!", emoji: "🎉", color: "#4caf50" };
    if (accuracy >= 70) return { message: "Good job! You're making solid progress!", emoji: "👍", color: "#ff9800" };
    if (accuracy >= 60) return { message: "Nice effort! Keep studying to improve!", emoji: "📚", color: "#ff9800" };
    return { message: "Keep practicing! Review the cards that need work.", emoji: "💪", color: "#f44336" };
  };

  const performance = getPerformanceMessage(result.accuracy);

  const formatTime = (minutes: number) => {
    if (minutes < 1) return "< 1 min";
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="session-results">
      <div className="results-header">
        <div className="results-icon" style={{ color: performance.color }}>
          {performance.emoji}
        </div>
        <h2>Session Complete!</h2>
        <p className="performance-message" style={{ color: performance.color }}>
          {performance.message}
        </p>
      </div>

      <div className="results-stats">
        <div className="stat-card primary">
          <div className="stat-value">{result.accuracy}%</div>
          <div className="stat-label">Accuracy</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-value">{result.correctCards}</div>
          <div className="stat-label">Correct</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-value">{result.incorrectCards}</div>
          <div className="stat-label">Incorrect</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-value">{formatTime(result.timeSpent)}</div>
          <div className="stat-label">Time Spent</div>
        </div>
      </div>

      <div className="results-breakdown">
        <div className="breakdown-item">
          <span className="breakdown-label">Total Cards Studied:</span>
          <span className="breakdown-value">{result.totalCards}</span>
        </div>
        
        <div className="breakdown-item">
          <span className="breakdown-label">New Cards Learned:</span>
          <span className="breakdown-value">{result.newCardsLearned}</span>
        </div>
        
        <div className="breakdown-item">
          <span className="breakdown-label">Cards Need Review:</span>
          <span className="breakdown-value highlight">{result.cardsNeedingReview}</span>
        </div>
        
        <div className="breakdown-item">
          <span className="breakdown-label">Study Mode:</span>
          <span className="breakdown-value capitalize">{result.studyMode}</span>
        </div>
        
        <div className="breakdown-item">
          <span className="breakdown-label">Systems Studied:</span>
          <span className="breakdown-value">{result.systems.join(', ')}</span>
        </div>
      </div>

      <div className="results-actions">
        {result.cardsNeedingReview > 0 && (
          <button 
            className="btn btn-warning"
            onClick={onReviewCards}
          >
            📝 Review {result.cardsNeedingReview} Cards
          </button>
        )}
        
        <button 
          className="btn btn-primary"
          onClick={onStartNewSession}
        >
          🔄 Study More Cards
        </button>
        
        <button 
          className="btn btn-secondary"
          onClick={() => navigate('/quiz')}
        >
          🧠 Take a Quiz
        </button>
        
        <button 
          className="btn btn-secondary"
          onClick={() => navigate('/')}
        >
          🏠 Back to Home
        </button>
      </div>

      <div className="results-tips">
        <h4>💡 Study Tips</h4>
        <ul>
          {result.accuracy < 70 && (
            <li>Focus on reviewing cards you got wrong - they'll appear more frequently</li>
          )}
          {result.cardsNeedingReview > 0 && (
            <li>Cards marked for review use spaced repetition to help you remember better</li>
          )}
          {result.newCardsLearned > 0 && (
            <li>Great job learning {result.newCardsLearned} new cards! They'll be scheduled for review</li>
          )}
          <li>Consistent daily practice is more effective than long cramming sessions</li>
          <li>Try explaining the concepts out loud to reinforce your understanding</li>
        </ul>
      </div>
    </div>
  );
};

export default SessionResults;