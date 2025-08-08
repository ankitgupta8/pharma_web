import React, { useState, useEffect } from 'react';
import { getStudyStatistics, getSystemPerformance } from '../../data/database';

interface StatisticsProps {
  onClose: () => void;
}

const Statistics: React.FC<StatisticsProps> = ({ onClose }) => {
  const [stats, setStats] = useState<any>(null);
  const [systemPerformance, setSystemPerformance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      const [studyStats, systemStats] = await Promise.all([
        getStudyStatistics(),
        getSystemPerformance()
      ]);
      setStats(studyStats);
      setSystemPerformance(systemStats);
    } catch (error) {
      console.error('Error loading statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '#4caf50';
      case 'medium': return '#ff9800';
      case 'hard': return '#f44336';
      default: return '#666';
    }
  };

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 80) return '#4caf50';
    if (accuracy >= 60) return '#ff9800';
    return '#f44336';
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  if (loading) {
    return (
      <div className="statistics-modal">
        <div className="statistics-content">
          <div className="loading">
            <div className="spinner"></div>
            <p>Loading statistics...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="statistics-modal">
      <div className="statistics-content">
        <div className="statistics-header">
          <h2>📊 Your Study Statistics</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="statistics-body">
          {/* Overall Stats */}
          <div className="stats-section">
            <h3>📈 Overall Progress</h3>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-value">{stats.totalStudied}</div>
                <div className="stat-label">Cards Studied</div>
              </div>
              
              <div className="stat-card">
                <div className="stat-value">{stats.averageAccuracy}%</div>
                <div className="stat-label">Average Accuracy</div>
              </div>
              
              <div className="stat-card">
                <div className="stat-value">{stats.studyStreak}</div>
                <div className="stat-label">Study Streak (days)</div>
              </div>
              
              <div className="stat-card">
                <div className="stat-value">{formatTime(stats.totalTimeSpent)}</div>
                <div className="stat-label">Total Time</div>
              </div>
            </div>
          </div>

          {/* Performance Breakdown */}
          <div className="stats-section">
            <h3>🎯 Performance Breakdown</h3>
            <div className="performance-stats">
              <div className="performance-item">
                <span className="performance-label">Correct Answers:</span>
                <span className="performance-value correct">{stats.totalCorrect}</span>
              </div>
              
              <div className="performance-item">
                <span className="performance-label">Incorrect Answers:</span>
                <span className="performance-value incorrect">{stats.totalIncorrect}</span>
              </div>
              
              <div className="performance-item">
                <span className="performance-label">Cards Needing Review:</span>
                <span className="performance-value warning">{stats.cardsNeedingReview}</span>
              </div>
              
              <div className="performance-item">
                <span className="performance-label">Sessions Completed:</span>
                <span className="performance-value">{stats.sessionsCompleted}</span>
              </div>
            </div>
          </div>

          {/* System Performance */}
          <div className="stats-section">
            <h3>🏥 Performance by System</h3>
            <div className="system-performance">
              {systemPerformance.map((system, index) => (
                <div key={index} className="system-card">
                  <div className="system-header">
                    <h4>{system.system}</h4>
                    <div 
                      className="difficulty-badge"
                      style={{ backgroundColor: getDifficultyColor(system.averageDifficulty) }}
                    >
                      {system.averageDifficulty}
                    </div>
                  </div>
                  
                  <div className="system-stats">
                    <div className="system-stat">
                      <span className="system-stat-label">Progress:</span>
                      <span className="system-stat-value">
                        {system.studiedCards}/{system.totalCards}
                      </span>
                    </div>
                    
                    <div className="system-stat">
                      <span className="system-stat-label">Accuracy:</span>
                      <span 
                        className="system-stat-value"
                        style={{ color: getAccuracyColor(system.accuracy) }}
                      >
                        {system.accuracy}%
                      </span>
                    </div>
                  </div>
                  
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ 
                        width: `${(system.studiedCards / system.totalCards) * 100}%`,
                        backgroundColor: getAccuracyColor(system.accuracy)
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Study Recommendations */}
          <div className="stats-section">
            <h3>💡 Study Recommendations</h3>
            <div className="recommendations">
              {stats.cardsNeedingReview > 0 && (
                <div className="recommendation">
                  <span className="rec-icon">📝</span>
                  <span>You have {stats.cardsNeedingReview} cards that need review. Focus on these first!</span>
                </div>
              )}
              
              {stats.averageAccuracy < 70 && (
                <div className="recommendation">
                  <span className="rec-icon">🎯</span>
                  <span>Your accuracy is below 70%. Try studying fewer cards per session to improve retention.</span>
                </div>
              )}
              
              {stats.studyStreak === 0 && (
                <div className="recommendation">
                  <span className="rec-icon">🔥</span>
                  <span>Start a study streak! Consistent daily practice improves long-term retention.</span>
                </div>
              )}
              
              {stats.studyStreak >= 7 && (
                <div className="recommendation">
                  <span className="rec-icon">🌟</span>
                  <span>Amazing! You have a {stats.studyStreak}-day study streak. Keep it up!</span>
                </div>
              )}
              
              <div className="recommendation">
                <span className="rec-icon">⏰</span>
                <span>Optimal study sessions are 15-30 minutes. You've averaged {formatTime(stats.totalTimeSpent / Math.max(1, stats.sessionsCompleted))} per session.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Statistics;