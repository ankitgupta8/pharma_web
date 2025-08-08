import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/common/Layout';
import { Drug } from '../types/drug.types';
import { drugService } from '../context/AppContext';

const DailyDrugScreen: React.FC = () => {
  const [dailyDrug, setDailyDrug] = useState<Drug | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookmarked, setBookmarked] = useState(false);

  useEffect(() => {
    loadDailyDrug();
  }, []);

  const loadDailyDrug = async () => {
    setLoading(true);
    try {
      const drug = await drugService.getDailyDrug();
      if (drug) {
        setDailyDrug(drug);
        const isBookmarkedResult = await drugService.isBookmarked(drug.id);
        setBookmarked(isBookmarkedResult);
      }
    } catch (error) {
      console.error('Error loading daily drug:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookmarkToggle = async () => {
    if (!dailyDrug) return;
    
    try {
      const newBookmarkState = await drugService.toggleBookmark(dailyDrug.id);
      setBookmarked(newBookmarkState);
    } catch (error) {
      console.error('Error toggling bookmark:', error);
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

  const getCurrentDate = () => {
    const today = new Date();
    return today.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <Layout title="Daily Drug">
        <div className="loading">
          <div className="spinner"></div>
        </div>
      </Layout>
    );
  }

  if (!dailyDrug) {
    return (
      <Layout title="Daily Drug">
        <div className="page">
          <div className="container">
            <div className="card text-center">
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📅</div>
              <h3>No daily drug available</h3>
              <p style={{ color: 'var(--text-secondary)' }}>
                Unable to load today's drug. Please try again later.
              </p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Daily Drug">
      <div className="page">
        <div className="container">
          {/* Header Card */}
          <div className="card fade-in text-center">
            <div style={{ fontSize: '3rem', marginBottom: '12px' }}>📅</div>
            <h2 style={{ color: 'var(--primary-color)', marginBottom: '8px' }}>
              Daily Drug
            </h2>
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
              {getCurrentDate()}
            </p>
          </div>

          {/* Drug Card */}
          <div className="card fade-in" style={{ 
            background: `linear-gradient(135deg, ${getSystemColor(dailyDrug.system)}10, ${getSystemColor(dailyDrug.system)}05)`,
            border: `2px solid ${getSystemColor(dailyDrug.system)}20`
          }}>
            <div className="card-header">
              <div>
                <h1 style={{ 
                  color: 'var(--primary-color)', 
                  marginBottom: '8px',
                  fontSize: '2.5rem'
                }}>
                  {dailyDrug.name}
                </h1>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '12px',
                  marginBottom: '8px'
                }}>
                  <span className="badge" style={{ 
                    backgroundColor: getSystemColor(dailyDrug.system),
                    fontSize: '1rem'
                  }}>
                    {getSystemIcon(dailyDrug.system)} {dailyDrug.system}
                  </span>
                  <span className="badge badge-secondary" style={{ fontSize: '1rem' }}>
                    {dailyDrug.class}
                  </span>
                </div>
              </div>
              <button
                onClick={handleBookmarkToggle}
                className={`btn btn-icon ${bookmarked ? 'btn-secondary' : 'btn-outline'}`}
                title={bookmarked ? 'Remove bookmark' : 'Add bookmark'}
                style={{ fontSize: '1.5rem' }}
              >
                {bookmarked ? '⭐' : '☆'}
              </button>
            </div>
          </div>

          {/* Focus Learning Card */}
          <div className="card fade-in">
            <h3>🎯 Today's Focus</h3>
            <div style={{ 
              background: 'var(--primary-color)10',
              padding: '20px',
              borderRadius: 'var(--border-radius)',
              border: '2px solid var(--primary-color)20'
            }}>
              <h4 style={{ color: 'var(--primary-color)', marginBottom: '12px' }}>
                🔬 Mechanism of Action
              </h4>
              <p style={{ 
                fontSize: '1.2rem', 
                lineHeight: '1.6',
                color: 'var(--text-primary)',
                margin: 0,
                fontWeight: '500'
              }}>
                {dailyDrug.moa}
              </p>
            </div>
          </div>

          {/* Key Information */}
          <div className="card fade-in">
            <h3>📋 Key Information</h3>
            
            {/* Uses */}
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ marginBottom: '8px' }}>🎯 Clinical Uses</h4>
              <div style={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: '8px'
              }}>
                {dailyDrug.uses.map((use, index) => (
                  <span 
                    key={index}
                    className="badge badge-success"
                    style={{ fontSize: '0.875rem' }}
                  >
                    {use}
                  </span>
                ))}
              </div>
            </div>

            {/* Side Effects */}
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ marginBottom: '8px' }}>⚠️ Common Side Effects</h4>
              <div style={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: '8px'
              }}>
                {dailyDrug.side_effects.map((effect, index) => (
                  <span 
                    key={index}
                    className="badge badge-warning"
                    style={{ fontSize: '0.875rem' }}
                  >
                    {effect}
                  </span>
                ))}
              </div>
            </div>

            {/* Dosage */}
            {dailyDrug.dosage && (
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ marginBottom: '8px' }}>💊 Typical Dosage</h4>
                <p style={{ 
                  fontSize: '1.1rem',
                  fontWeight: '500',
                  color: 'var(--text-primary)',
                  margin: 0,
                  background: 'var(--surface-color)',
                  padding: '12px',
                  borderRadius: 'var(--border-radius)',
                  border: '1px solid var(--divider-color)'
                }}>
                  {dailyDrug.dosage}
                </p>
              </div>
            )}
          </div>

          {/* Memory Aid */}
          {dailyDrug.mnemonic && (
            <div className="card fade-in" style={{ 
              background: 'linear-gradient(135deg, var(--primary-color)15, var(--primary-color)08)',
              border: '2px solid var(--primary-color)30'
            }}>
              <h3>🧠 Memory Aid</h3>
              <div style={{ 
                textAlign: 'center',
                padding: '20px'
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '16px' }}>💡</div>
                <p style={{ 
                  fontSize: '1.3rem',
                  fontWeight: '600',
                  color: 'var(--primary-color)',
                  fontStyle: 'italic',
                  margin: 0,
                  lineHeight: '1.4'
                }}>
                  "{dailyDrug.mnemonic}"
                </p>
              </div>
            </div>
          )}

          {/* Contraindications */}
          {dailyDrug.contraindications && dailyDrug.contraindications.length > 0 && (
            <div className="card fade-in">
              <h3>🚫 Important Contraindications</h3>
              <div style={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: '8px'
              }}>
                {dailyDrug.contraindications.map((contraindication, index) => (
                  <span 
                    key={index}
                    className="badge badge-error"
                    style={{ fontSize: '0.875rem' }}
                  >
                    {contraindication}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Study Actions */}
          <div className="card fade-in">
            <h3>📚 Continue Learning</h3>
            <div style={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '12px',
              marginTop: '16px'
            }}>
              <Link 
                to={`/flashcards?drug=${dailyDrug.id}`}
                className="btn btn-primary"
                style={{ textDecoration: 'none' }}
              >
                🃏 Study as Flashcard
              </Link>
              <Link 
                to={`/quiz?drug=${dailyDrug.id}`}
                className="btn btn-outline"
                style={{ textDecoration: 'none' }}
              >
                🧠 Quiz This Drug
              </Link>
              <Link 
                to={`/drug/${dailyDrug.id}`}
                className="btn btn-secondary"
                style={{ textDecoration: 'none' }}
              >
                📖 Full Details
              </Link>
              <Link 
                to={`/drugs?system=${dailyDrug.system}`}
                className="btn btn-outline"
                style={{ textDecoration: 'none' }}
              >
                {getSystemIcon(dailyDrug.system)} More {dailyDrug.system} Drugs
              </Link>
            </div>
          </div>

          {/* Daily Tip */}
          <div className="card fade-in text-center" style={{ 
            background: 'var(--success-color)10',
            border: '2px solid var(--success-color)30'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '12px' }}>💡</div>
            <h3 style={{ color: 'var(--success-color)' }}>Study Tip</h3>
            <p style={{ 
              color: 'var(--text-primary)',
              fontSize: '1rem',
              lineHeight: '1.6',
              margin: 0
            }}>
              Try to understand the mechanism of action first - it helps you remember 
              the uses and side effects more easily. Create mental connections between 
              the drug's action and its clinical applications.
            </p>
          </div>

          {/* Navigation */}
          <div style={{ 
            display: 'flex', 
            gap: '12px', 
            marginTop: '24px',
            paddingBottom: '24px'
          }}>
            <Link to="/" className="btn btn-outline">
              🏠 Home
            </Link>
            <Link to="/drugs" className="btn btn-outline">
              💊 All Drugs
            </Link>
            <Link to="/flashcards" className="btn btn-primary">
              🃏 Start Flashcards
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DailyDrugScreen;