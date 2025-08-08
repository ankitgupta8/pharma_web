import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApp, drugService } from '../context/AppContext';
import Layout from '../components/common/Layout';
import AnalyticsDashboard from '../components/analytics/AnalyticsDashboard';
import AchievementsPanel from '../components/gamification/AchievementsPanel';
import { getMotivationalMessage, getStreakEmoji } from '../utils/gamification';
import '../styles/analytics.css';
import '../styles/achievements.css';

const HomeScreen: React.FC = () => {
  const { state } = useApp();
  const [studyStats, setStudyStats] = useState<any>(null);
  const [reviewCardsCount, setReviewCardsCount] = useState(0);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);

  useEffect(() => {
    loadStudyData();
  }, []);

  const loadStudyData = async () => {
    try {
      const [stats, reviewCards] = await Promise.all([
        drugService.getStudyStatistics(),
        drugService.getCardsNeedingReview()
      ]);
      setStudyStats(stats);
      setReviewCardsCount(reviewCards.length);
    } catch (error) {
      console.error('Error loading study data:', error);
    }
  };

  const features = [
    {
      title: 'Browse Drugs',
      description: 'Explore drugs by system and class',
      icon: '💊',
      path: '/drugs',
      color: '#1976d2'
    },
    {
      title: 'Flashcards',
      description: 'Study with interactive flashcards',
      icon: '🃏',
      path: '/flashcards',
      color: '#388e3c'
    },
    {
      title: 'Take Quiz',
      description: 'Test your knowledge',
      icon: '🧠',
      path: '/quiz',
      color: '#f57c00'
    },
    {
      title: 'Daily Drug',
      description: 'Learn one drug every day',
      icon: '📅',
      path: '/daily',
      color: '#7b1fa2'
    },
    {
      title: 'Review Cards',
      description: `${reviewCardsCount} cards need review`,
      icon: '🔄',
      path: '/review',
      color: '#d32f2f',
      badge: reviewCardsCount > 0 ? reviewCardsCount : undefined
    }
  ];

  if (showAnalytics) {
    return (
      <>
        <Layout title="Drug Deck">
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

  if (showAchievements) {
    return (
      <>
        <Layout title="Drug Deck">
          <div className="page">
            <div className="container">
              <div className="card text-center">
                <h3>Loading achievements...</h3>
              </div>
            </div>
          </div>
        </Layout>
        <AchievementsPanel onClose={() => setShowAchievements(false)} />
      </>
    );
  }

  return (
    <Layout title="Drug Deck">
      <div className="page">
        <div className="container">
          {/* Welcome Section */}
          <div className="card fade-in">
            <h2>Welcome to Drug Deck! 👋</h2>
            <p>Master pharmacology with organized drug data, flashcards, and quizzes.</p>
          </div>

          {/* Daily Drug Section */}
          {state.dailyDrug && (
            <div className="card fade-in" style={{ marginTop: '16px' }}>
              <div className="card-header">
                <h3>📅 Today's Drug</h3>
                <Link to="/daily" className="btn btn-outline" style={{ fontSize: '0.75rem', padding: '8px 16px' }}>
                  View Details
                </Link>
              </div>
              <div className="card-subtitle">{state.dailyDrug.class} • {state.dailyDrug.system}</div>
              <h4 style={{ color: 'var(--primary-color)', marginBottom: '8px' }}>
                {state.dailyDrug.name}
              </h4>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                {state.dailyDrug.moa}
              </p>
            </div>
          )}

          {/* Review Alert */}
          {reviewCardsCount > 0 && (
            <div className="card fade-in" style={{
              marginTop: '16px',
              background: 'linear-gradient(135deg, #fff3e0, #ffe0b2)',
              border: '2px solid #ff9800'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ fontSize: '2rem' }}>⚠️</div>
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: '0 0 4px 0', color: '#e65100' }}>
                    {reviewCardsCount} Cards Need Review
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: '#bf360c' }}>
                    These cards need extra attention based on your performance
                  </p>
                </div>
                <Link to="/review" className="btn" style={{
                  background: '#ff9800',
                  color: 'white',
                  fontSize: '0.875rem'
                }}>
                  Review Now
                </Link>
              </div>
            </div>
          )}

          {/* Enhanced Stats Section with Gamification */}
          <div className="card fade-in" style={{ marginTop: '16px' }}>
            <div className="card-header">
              <h3>📊 Your Progress</h3>
              <button
                onClick={() => setShowAchievements(true)}
                className="btn btn-outline"
                style={{ fontSize: '0.75rem', padding: '6px 12px' }}
              >
                🏆 Achievements
              </button>
            </div>
            
            {studyStats && (
              <>
                {/* Streak Highlight */}
                <div style={{
                  background: 'linear-gradient(135deg, #fff3e0, #ffe0b2)',
                  borderRadius: '8px',
                  padding: '16px',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <div style={{ fontSize: '2rem' }}>
                    {getStreakEmoji(studyStats.studyStreak)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                      {studyStats.studyStreak} Day Streak
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      {getMotivationalMessage(studyStats.studyStreak)}
                    </div>
                  </div>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
                  gap: '16px',
                  marginBottom: '20px'
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      fontSize: '1.5rem',
                      fontWeight: 'bold',
                      color: 'var(--primary-color)'
                    }}>
                      {studyStats.totalStudied}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      Cards Studied
                    </div>
                  </div>
                  
                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      fontSize: '1.5rem',
                      fontWeight: 'bold',
                      color: 'var(--success-color)'
                    }}>
                      {studyStats.averageAccuracy}%
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      Accuracy
                    </div>
                  </div>
                  
                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      fontSize: '1.5rem',
                      fontWeight: 'bold',
                      color: 'var(--warning-color)'
                    }}>
                      {studyStats.studyStreak}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      Day Streak
                    </div>
                  </div>
                  
                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      fontSize: '1.5rem',
                      fontWeight: 'bold',
                      color: 'var(--info-color)'
                    }}>
                      {Math.round(studyStats.totalTimeSpent / 60)}h
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      Study Time
                    </div>
                  </div>
                </div>
              </>
            )}
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '16px' }}>
              {state.systemStats.map((stat) => (
                <div key={stat.system} style={{ textAlign: 'center' }}>
                  <div style={{
                    fontSize: '1.25rem',
                    fontWeight: 'bold',
                    color: 'var(--text-primary)'
                  }}>
                    {stat.totalDrugs}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {stat.system}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--success-color)' }}>
                    {stat.bookmarkedDrugs} saved
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Features Grid */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
            gap: '16px', 
            marginTop: '24px' 
          }}>
            {features.map((feature, index) => (
              <Link
                key={feature.path}
                to={feature.path}
                className="card fade-in"
                style={{
                  textDecoration: 'none',
                  animationDelay: `${index * 0.1}s`,
                  borderLeft: `4px solid ${feature.color}`,
                  position: 'relative'
                }}
              >
                <div className="card-header">
                  <div style={{ fontSize: '2rem' }}>{feature.icon}</div>
                  {feature.badge && (
                    <div style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      background: feature.color,
                      color: 'white',
                      borderRadius: '50%',
                      width: '24px',
                      height: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 'bold'
                    }}>
                      {feature.badge}
                    </div>
                  )}
                </div>
                <h4 className="card-title">{feature.title}</h4>
                <p style={{
                  color: 'var(--text-secondary)',
                  fontSize: '0.875rem',
                  margin: 0
                }}>
                  {feature.description}
                </p>
              </Link>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="card fade-in" style={{ marginTop: '24px' }}>
            <h3>🚀 Quick Actions</h3>
            <div style={{ 
              display: 'flex', 
              gap: '12px', 
              marginTop: '16px',
              flexWrap: 'wrap'
            }}>
              <Link to="/flashcards" className="btn btn-primary">
                Start Flashcards
              </Link>
              {reviewCardsCount > 0 && (
                <Link to="/review" className="btn" style={{ background: '#ff9800', color: 'white' }}>
                  Review {reviewCardsCount} Cards
                </Link>
              )}
              <Link to="/quiz" className="btn btn-outline">
                Random Quiz
              </Link>
              <Link to="/bookmarks" className="btn btn-secondary">
                My Saved Drugs
              </Link>
              <button
                onClick={() => setShowAnalytics(true)}
                className="btn"
                style={{ background: '#2196f3', color: 'white' }}
              >
                📊 View Analytics
              </button>
            </div>
          </div>

          {/* Tips Section */}
          <div className="card fade-in" style={{ marginTop: '24px' }}>
            <h3>💡 Study Tips</h3>
            <ul style={{ 
              paddingLeft: '20px', 
              color: 'var(--text-secondary)',
              fontSize: '0.875rem'
            }}>
              <li>Use mnemonics to remember drug mechanisms</li>
              <li>Practice flashcards daily for better retention</li>
              <li>Take quizzes to test your knowledge</li>
              <li>Bookmark important drugs for quick review</li>
            </ul>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default HomeScreen;