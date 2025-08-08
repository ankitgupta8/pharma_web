import React, { useState, useEffect } from 'react';
import { getStudyStatistics, getSystemPerformance, getQuizHistory } from '../../data/database';

interface AnalyticsDashboardProps {
  onClose: () => void;
}

interface ChartData {
  label: string;
  value: number;
  color: string;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ onClose }) => {
  const [stats, setStats] = useState<any>(null);
  const [systemPerformance, setSystemPerformance] = useState<any[]>([]);
  const [quizHistory, setQuizHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'systems' | 'progress' | 'insights'>('overview');

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const [studyStats, systemStats, quizData] = await Promise.all([
        getStudyStatistics(),
        getSystemPerformance(),
        getQuizHistory()
      ]);
      setStats(studyStats);
      setSystemPerformance(systemStats);
      setQuizHistory(quizData.slice(0, 10)); // Last 10 quizzes
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderProgressChart = (data: ChartData[]) => {
    const maxValue = Math.max(...data.map(d => d.value));
    
    return (
      <div className="chart-container">
        {data.map((item, index) => (
          <div key={index} className="chart-bar">
            <div className="chart-label">{item.label}</div>
            <div className="chart-bar-container">
              <div 
                className="chart-bar-fill"
                style={{
                  width: `${(item.value / maxValue) * 100}%`,
                  backgroundColor: item.color
                }}
              />
              <span className="chart-value">{item.value}</span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderAccuracyChart = () => {
    if (!stats) return null;
    
    const accuracyData = [
      { label: 'Correct', value: stats.totalCorrect, color: '#4caf50' },
      { label: 'Incorrect', value: stats.totalIncorrect, color: '#f44336' }
    ];

    const total = stats.totalCorrect + stats.totalIncorrect;
    
    return (
      <div className="pie-chart-container">
        <div className="pie-chart">
          <div 
            className="pie-slice correct"
            style={{
              '--percentage': `${(stats.totalCorrect / total) * 100}%`
            } as React.CSSProperties}
          />
        </div>
        <div className="pie-legend">
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#4caf50' }} />
            <span>Correct ({stats.totalCorrect})</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#f44336' }} />
            <span>Incorrect ({stats.totalIncorrect})</span>
          </div>
        </div>
      </div>
    );
  };

  const renderSystemChart = () => {
    const chartData = systemPerformance.map(system => ({
      label: system.system.substring(0, 12) + (system.system.length > 12 ? '...' : ''),
      value: system.accuracy,
      color: system.accuracy >= 80 ? '#4caf50' : system.accuracy >= 60 ? '#ff9800' : '#f44336'
    }));

    return renderProgressChart(chartData);
  };

  const renderQuizTrend = () => {
    if (quizHistory.length === 0) return <p>No quiz history available</p>;

    return (
      <div className="trend-chart">
        <div className="trend-line">
          {quizHistory.reverse().map((quiz, index) => {
            const percentage = (quiz.score / quiz.totalQuestions) * 100;
            return (
              <div key={index} className="trend-point">
                <div 
                  className="trend-dot"
                  style={{
                    backgroundColor: percentage >= 80 ? '#4caf50' : percentage >= 60 ? '#ff9800' : '#f44336',
                    bottom: `${percentage}%`
                  }}
                  title={`Quiz ${index + 1}: ${percentage.toFixed(0)}%`}
                />
                <div className="trend-label">Q{index + 1}</div>
              </div>
            );
          })}
        </div>
        <div className="trend-axis">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
      </div>
    );
  };

  const getInsights = () => {
    if (!stats || !systemPerformance.length) return [];

    const insights = [];

    // Performance insights
    if (stats.averageAccuracy >= 90) {
      insights.push({
        type: 'success',
        icon: '🌟',
        title: 'Excellent Performance!',
        message: `Your ${stats.averageAccuracy}% accuracy is outstanding. You're mastering the material!`
      });
    } else if (stats.averageAccuracy < 60) {
      insights.push({
        type: 'warning',
        icon: '📚',
        title: 'Focus on Fundamentals',
        message: 'Consider reviewing basic concepts and studying fewer cards per session for better retention.'
      });
    }

    // Study streak insights
    if (stats.studyStreak >= 30) {
      insights.push({
        type: 'success',
        icon: '🔥',
        title: 'Study Streak Master!',
        message: `${stats.studyStreak} days of consistent study! You're building excellent habits.`
      });
    } else if (stats.studyStreak === 0) {
      insights.push({
        type: 'info',
        icon: '🎯',
        title: 'Start Your Streak',
        message: 'Daily practice, even for 10 minutes, significantly improves retention.'
      });
    }

    // System-specific insights
    const weakestSystem = systemPerformance.reduce((prev, current) => 
      prev.accuracy < current.accuracy ? prev : current
    );
    
    if (weakestSystem && weakestSystem.accuracy < 70) {
      insights.push({
        type: 'warning',
        icon: '🎯',
        title: 'Focus Area Identified',
        message: `${weakestSystem.system} needs attention (${weakestSystem.accuracy}% accuracy). Consider extra practice in this area.`
      });
    }

    // Time-based insights
    const avgSessionTime = stats.totalTimeSpent / Math.max(1, stats.sessionsCompleted);
    if (avgSessionTime > 45) {
      insights.push({
        type: 'info',
        icon: '⏰',
        title: 'Optimize Study Sessions',
        message: 'Consider shorter, more frequent sessions (20-30 minutes) for better focus and retention.'
      });
    }

    return insights;
  };

  if (loading) {
    return (
      <div className="analytics-modal">
        <div className="analytics-content">
          <div className="loading">
            <div className="spinner"></div>
            <p>Loading analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  const insights = getInsights();

  return (
    <div className="analytics-modal">
      <div className="analytics-content">
        <div className="analytics-header">
          <h2>📊 Enhanced Analytics Dashboard</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="analytics-tabs">
          <button 
            className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            📈 Overview
          </button>
          <button 
            className={`tab-btn ${activeTab === 'systems' ? 'active' : ''}`}
            onClick={() => setActiveTab('systems')}
          >
            🏥 Systems
          </button>
          <button 
            className={`tab-btn ${activeTab === 'progress' ? 'active' : ''}`}
            onClick={() => setActiveTab('progress')}
          >
            📊 Progress
          </button>
          <button 
            className={`tab-btn ${activeTab === 'insights' ? 'active' : ''}`}
            onClick={() => setActiveTab('insights')}
          >
            💡 Insights
          </button>
        </div>

        <div className="analytics-body">
          {activeTab === 'overview' && (
            <div className="tab-content">
              <div className="metrics-grid">
                <div className="metric-card primary">
                  <div className="metric-icon">🎯</div>
                  <div className="metric-value">{stats.averageAccuracy}%</div>
                  <div className="metric-label">Overall Accuracy</div>
                </div>
                
                <div className="metric-card success">
                  <div className="metric-icon">📚</div>
                  <div className="metric-value">{stats.totalStudied}</div>
                  <div className="metric-label">Cards Studied</div>
                </div>
                
                <div className="metric-card warning">
                  <div className="metric-icon">🔥</div>
                  <div className="metric-value">{stats.studyStreak}</div>
                  <div className="metric-label">Day Streak</div>
                </div>
                
                <div className="metric-card info">
                  <div className="metric-icon">⏱️</div>
                  <div className="metric-value">{Math.round(stats.totalTimeSpent / 60)}h</div>
                  <div className="metric-label">Study Time</div>
                </div>
              </div>

              <div className="chart-section">
                <h3>Accuracy Breakdown</h3>
                {renderAccuracyChart()}
              </div>
            </div>
          )}

          {activeTab === 'systems' && (
            <div className="tab-content">
              <h3>Performance by System</h3>
              {renderSystemChart()}
              
              <div className="system-details">
                {systemPerformance.map((system, index) => (
                  <div key={index} className="system-detail-card">
                    <div className="system-name">{system.system}</div>
                    <div className="system-progress">
                      <div className="progress-info">
                        <span>{system.studiedCards}/{system.totalCards} cards</span>
                        <span className="accuracy">{system.accuracy}% accuracy</span>
                      </div>
                      <div className="progress-bar">
                        <div 
                          className="progress-fill"
                          style={{ 
                            width: `${(system.studiedCards / system.totalCards) * 100}%`,
                            backgroundColor: system.accuracy >= 80 ? '#4caf50' : system.accuracy >= 60 ? '#ff9800' : '#f44336'
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'progress' && (
            <div className="tab-content">
              <h3>Quiz Performance Trend</h3>
              {renderQuizTrend()}
              
              <div className="progress-stats">
                <div className="stat-row">
                  <span>Total Sessions:</span>
                  <span>{stats.sessionsCompleted}</span>
                </div>
                <div className="stat-row">
                  <span>Average Session Time:</span>
                  <span>{Math.round(stats.totalTimeSpent / Math.max(1, stats.sessionsCompleted))} minutes</span>
                </div>
                <div className="stat-row">
                  <span>Cards Needing Review:</span>
                  <span>{stats.cardsNeedingReview}</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'insights' && (
            <div className="tab-content">
              <h3>Personalized Insights</h3>
              <div className="insights-container">
                {insights.map((insight, index) => (
                  <div key={index} className={`insight-card ${insight.type}`}>
                    <div className="insight-icon">{insight.icon}</div>
                    <div className="insight-content">
                      <h4>{insight.title}</h4>
                      <p>{insight.message}</p>
                    </div>
                  </div>
                ))}
                
                {insights.length === 0 && (
                  <div className="no-insights">
                    <p>Keep studying to unlock personalized insights!</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;