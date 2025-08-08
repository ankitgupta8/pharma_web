import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/common/Layout';
import { Drug } from '../types/drug.types';
import { drugService } from '../context/AppContext';

const BookmarksScreen: React.FC = () => {
  const [bookmarkedDrugs, setBookmarkedDrugs] = useState<Drug[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBookmarkedDrugs();
  }, []);

  const loadBookmarkedDrugs = async () => {
    setLoading(true);
    try {
      const drugs = await drugService.getBookmarkedDrugs();
      setBookmarkedDrugs(drugs);
    } catch (error) {
      console.error('Error loading bookmarked drugs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveBookmark = async (drugId: number) => {
    try {
      await drugService.toggleBookmark(drugId);
      // Reload bookmarked drugs
      await loadBookmarkedDrugs();
    } catch (error) {
      console.error('Error removing bookmark:', error);
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

  const groupedDrugs = bookmarkedDrugs.reduce((acc, drug) => {
    const key = drug.system;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(drug);
    return acc;
  }, {} as Record<string, Drug[]>);

  if (loading) {
    return (
      <Layout title="My Bookmarks">
        <div className="loading">
          <div className="spinner"></div>
        </div>
      </Layout>
    );
  }

  if (bookmarkedDrugs.length === 0) {
    return (
      <Layout title="My Bookmarks">
        <div className="page">
          <div className="container">
            <div className="card text-center">
              <div style={{ fontSize: '4rem', marginBottom: '20px' }}>⭐</div>
              <h2>No bookmarked drugs yet</h2>
              <p style={{ 
                color: 'var(--text-secondary)', 
                fontSize: '1.1rem',
                lineHeight: '1.6',
                marginBottom: '24px'
              }}>
                Start bookmarking drugs you want to review later. 
                You can bookmark drugs from their detail pages or while studying flashcards.
              </p>
              
              <div style={{ 
                display: 'flex', 
                gap: '12px', 
                justifyContent: 'center',
                flexWrap: 'wrap'
              }}>
                <Link to="/drugs" className="btn btn-primary">
                  🔍 Browse Drugs
                </Link>
                <Link to="/flashcards" className="btn btn-outline">
                  🃏 Study Flashcards
                </Link>
                <Link to="/daily" className="btn btn-secondary">
                  📅 Daily Drug
                </Link>
              </div>
            </div>

            {/* Tips Card */}
            <div className="card" style={{ 
              background: 'var(--primary-color)08',
              border: '2px solid var(--primary-color)20'
            }}>
              <h3>💡 Bookmark Tips</h3>
              <ul style={{ 
                paddingLeft: '20px', 
                color: 'var(--text-secondary)',
                lineHeight: '1.6'
              }}>
                <li>Bookmark drugs you find challenging to remember</li>
                <li>Save high-yield drugs for quick review before exams</li>
                <li>Use bookmarks to create your personalized study list</li>
                <li>Review bookmarked drugs regularly for better retention</li>
              </ul>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="My Bookmarks">
      <div className="page">
        <div className="container">
          {/* Header */}
          <div className="card fade-in">
            <div className="flex flex-between" style={{ alignItems: 'center' }}>
              <div>
                <h2 style={{ margin: 0, marginBottom: '4px' }}>⭐ My Bookmarks</h2>
                <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                  {bookmarkedDrugs.length} saved drug{bookmarkedDrugs.length !== 1 ? 's' : ''}
                </p>
              </div>
              <div style={{ 
                display: 'flex', 
                gap: '8px',
                flexWrap: 'wrap'
              }}>
                <Link 
                  to="/flashcards?mode=bookmarked" 
                  className="btn btn-primary"
                  style={{ fontSize: '0.875rem' }}
                >
                  🃏 Study All
                </Link>
                <Link 
                  to="/quiz?mode=bookmarked" 
                  className="btn btn-outline"
                  style={{ fontSize: '0.875rem' }}
                >
                  🧠 Quiz All
                </Link>
              </div>
            </div>
          </div>

          {/* Bookmarked Drugs by System */}
          {Object.entries(groupedDrugs)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([system, drugs]) => (
              <div key={system} className="card fade-in">
                <div className="card-header">
                  <h3 className="card-title" style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px',
                    color: getSystemColor(system)
                  }}>
                    {getSystemIcon(system)} {system} System
                  </h3>
                  <span className="badge" style={{ 
                    backgroundColor: getSystemColor(system) 
                  }}>
                    {drugs.length}
                  </span>
                </div>
                
                <div className="list">
                  {drugs
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((drug) => (
                      <div key={drug.id} className="list-item">
                        <Link
                          to={`/drug/${drug.id}`}
                          className="list-item-content"
                          style={{ 
                            textDecoration: 'none', 
                            color: 'inherit',
                            flex: 1
                          }}
                        >
                          <div className="list-item-title">{drug.name}</div>
                          <div className="list-item-subtitle">
                            {drug.class} • {drug.moa}
                          </div>
                          <div style={{ 
                            marginTop: '8px',
                            display: 'flex',
                            gap: '4px',
                            flexWrap: 'wrap'
                          }}>
                            {drug.uses.slice(0, 2).map((use, index) => (
                              <span 
                                key={index}
                                className="badge badge-success"
                                style={{ fontSize: '0.7rem' }}
                              >
                                {use}
                              </span>
                            ))}
                            {drug.uses.length > 2 && (
                              <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>
                                +{drug.uses.length - 2} more
                              </span>
                            )}
                          </div>
                        </Link>
                        
                        <div style={{ 
                          display: 'flex', 
                          flexDirection: 'column',
                          gap: '8px',
                          alignItems: 'center'
                        }}>
                          <button
                            onClick={() => handleRemoveBookmark(drug.id)}
                            className="btn btn-icon"
                            style={{ 
                              background: 'var(--error-color)',
                              color: 'white',
                              fontSize: '0.875rem',
                              padding: '8px',
                              minWidth: '36px',
                              minHeight: '36px'
                            }}
                            title="Remove bookmark"
                          >
                            🗑️
                          </button>
                          
                          <div style={{ 
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px'
                          }}>
                            <Link
                              to={`/flashcards?drug=${drug.id}`}
                              className="btn btn-outline"
                              style={{ 
                                fontSize: '0.75rem',
                                padding: '4px 8px',
                                minHeight: '32px',
                                textDecoration: 'none'
                              }}
                            >
                              🃏
                            </Link>
                            <Link
                              to={`/quiz?drug=${drug.id}`}
                              className="btn btn-outline"
                              style={{ 
                                fontSize: '0.75rem',
                                padding: '4px 8px',
                                minHeight: '32px',
                                textDecoration: 'none'
                              }}
                            >
                              🧠
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}

          {/* Quick Actions */}
          <div className="card fade-in">
            <h3>🚀 Quick Actions</h3>
            <div style={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '12px',
              marginTop: '16px'
            }}>
              <Link 
                to="/flashcards" 
                className="btn btn-primary"
                style={{ textDecoration: 'none' }}
              >
                🃏 Study All Flashcards
              </Link>
              <Link 
                to="/drugs" 
                className="btn btn-outline"
                style={{ textDecoration: 'none' }}
              >
                🔍 Browse More Drugs
              </Link>
              <Link 
                to="/daily" 
                className="btn btn-secondary"
                style={{ textDecoration: 'none' }}
              >
                📅 Today's Drug
              </Link>
              <Link 
                to="/quiz" 
                className="btn btn-outline"
                style={{ textDecoration: 'none' }}
              >
                🧠 Take Random Quiz
              </Link>
            </div>
          </div>

          {/* Study Stats */}
          <div className="card fade-in text-center" style={{ 
            background: 'var(--success-color)08',
            border: '2px solid var(--success-color)20'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '12px' }}>📊</div>
            <h3 style={{ color: 'var(--success-color)' }}>Study Progress</h3>
            <p style={{ 
              color: 'var(--text-primary)',
              fontSize: '1rem',
              margin: 0
            }}>
              You've bookmarked <strong>{bookmarkedDrugs.length}</strong> drugs across{' '}
              <strong>{Object.keys(groupedDrugs).length}</strong> medical systems.
              Keep up the great work! 🎉
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default BookmarksScreen;