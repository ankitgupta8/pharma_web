import React, { useState, useEffect } from 'react';
import { Achievement } from '../../types/drug.types';
import { 
  ACHIEVEMENTS, 
  checkAchievements, 
  calculateProgress, 
  getMotivationalMessage,
  getStreakEmoji,
  getNextMilestone,
  getAchievementsByCategory
} from '../../utils/gamification';
import { 
  getStudyStatistics, 
  getSystemPerformance, 
  getQuizHistory 
} from '../../data/database';

interface AchievementsPanelProps {
  onClose: () => void;
}

const AchievementsPanel: React.FC<AchievementsPanelProps> = ({ onClose }) => {
  const [unlockedAchievements, setUnlockedAchievements] = useState<Achievement[]>([]);
  const [allAchievements, setAllAchievements] = useState<Achievement[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<Achievement['category'] | 'all'>('all');

  useEffect(() => {
    loadAchievements();
  }, []);

  const loadAchievements = async () => {
    try {
      const [studyStats, systemPerformance, quizHistory] = await Promise.all([
        getStudyStatistics(),
        getSystemPerformance(),
        getQuizHistory()
      ]);

      const combinedStats = {
        ...studyStats,
        systemPerformance,
        quizScores: quizHistory
      };

      setStats(combinedStats);
      
      const unlocked = checkAchievements(combinedStats);
      setUnlockedAchievements(unlocked);
      
      // Add progress to all achievements
      const achievementsWithProgress = ACHIEVEMENTS.map(achievement => ({
        ...achievement,
        progress: calculateProgress(achievement, combinedStats),
        unlockedAt: unlocked.find(u => u.id === achievement.id)?.unlockedAt
      }));
      
      setAllAchievements(achievementsWithProgress);
    } catch (error) {
      console.error('Error loading achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredAchievements = () => {
    if (activeCategory === 'all') {
      return allAchievements;
    }
    return getAchievementsByCategory(activeCategory).map(achievement => 
      allAchievements.find(a => a.id === achievement.id) || achievement
    );
  };

  const getAchievementStatus = (achievement: Achievement) => {
    const isUnlocked = unlockedAchievements.some(u => u.id === achievement.id);
    const progress = achievement.progress || 0;
    
    if (isUnlocked) return 'unlocked';
    if (progress >= 50) return 'close';
    return 'locked';
  };

  const categories = [
    { key: 'all' as const, name: 'All', icon: '🏆' },
    { key: 'streak' as const, name: 'Streaks', icon: '🔥' },
    { key: 'accuracy' as const, name: 'Accuracy', icon: '🎯' },
    { key: 'volume' as const, name: 'Volume', icon: '📚' },
    { key: 'speed' as const, name: 'Speed', icon: '⚡' },
    { key: 'mastery' as const, name: 'Mastery', icon: '👑' }
  ];

  if (loading) {
    return (
      <div className="achievements-modal">
        <div className="achievements-content">
          <div className="loading">
            <div className="spinner"></div>
            <p>Loading achievements...</p>
          </div>
        </div>
      </div>
    );
  }

  const nextMilestone = getNextMilestone(stats?.studyStreak || 0);

  return (
    <div className="achievements-modal">
      <div className="achievements-content">
        <div className="achievements-header">
          <h2>🏆 Achievements</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {/* Streak Highlight */}
        <div className="streak-highlight">
          <div className="streak-info">
            <div className="streak-icon">
              {getStreakEmoji(stats?.studyStreak || 0)}
            </div>
            <div className="streak-details">
              <h3>{stats?.studyStreak || 0} Day Streak</h3>
              <p>{getMotivationalMessage(stats?.studyStreak || 0)}</p>
              {nextMilestone && (
                <div className="next-milestone">
                  <span>Next: {nextMilestone.emoji} {nextMilestone.name} ({nextMilestone.milestone} days)</span>
                  <div className="milestone-progress">
                    <div 
                      className="milestone-fill"
                      style={{ width: `${((stats?.studyStreak || 0) / nextMilestone.milestone) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="achievement-stats">
            <div className="stat-item">
              <span className="stat-value">{unlockedAchievements.length}</span>
              <span className="stat-label">Unlocked</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{ACHIEVEMENTS.length}</span>
              <span className="stat-label">Total</span>
            </div>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="category-tabs">
          {categories.map(category => (
            <button
              key={category.key}
              className={`category-tab ${activeCategory === category.key ? 'active' : ''}`}
              onClick={() => setActiveCategory(category.key)}
            >
              {category.icon} {category.name}
            </button>
          ))}
        </div>

        {/* Achievements Grid */}
        <div className="achievements-grid">
          {getFilteredAchievements().map(achievement => {
            const status = getAchievementStatus(achievement);
            const progress = achievement.progress || 0;
            
            return (
              <div key={achievement.id} className={`achievement-card ${status}`}>
                <div className="achievement-icon">
                  {achievement.icon}
                </div>
                
                <div className="achievement-info">
                  <h4>{achievement.name}</h4>
                  <p>{achievement.description}</p>
                  
                  {status !== 'unlocked' && (
                    <div className="achievement-progress">
                      <div className="progress-bar">
                        <div 
                          className="progress-fill"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className="progress-text">{Math.round(progress)}%</span>
                    </div>
                  )}
                  
                  {status === 'unlocked' && (
                    <div className="unlocked-badge">
                      ✅ Unlocked!
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {getFilteredAchievements().length === 0 && (
          <div className="no-achievements">
            <p>No achievements in this category yet!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AchievementsPanel;