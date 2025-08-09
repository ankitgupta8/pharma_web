import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import Layout from '../components/common/Layout';
import NotesManager from '../components/notes/NotesManager';
import { Drug } from '../types/drug.types';
import { drugService } from '../context/AppContext';
import '../styles/notes.css';

const DrugDetailScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [drug, setDrug] = useState<Drug | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookmarked, setBookmarked] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [notesCount, setNotesCount] = useState(0);

  useEffect(() => {
    if (id) {
      loadDrug(parseInt(id));
    }
  }, [id]);

  const loadDrug = async (drugId: number) => {
    setLoading(true);
    try {
      const drugData = await drugService.getDrugById(drugId);
      if (drugData) {
        setDrug(drugData);
        const isBookmarkedResult = await drugService.isBookmarked(drugId);
        setBookmarked(isBookmarkedResult);
        
        // Load notes count
        const notes = await drugService.getDrugNotes(drugId);
        setNotesCount(notes.length);
      } else {
        navigate('/drugs');
      }
    } catch (error) {
      console.error('Error loading drug:', error);
      navigate('/drugs');
    } finally {
      setLoading(false);
    }
  };

  const handleBookmarkToggle = async () => {
    if (!drug) return;
    
    try {
      const newBookmarkState = await drugService.toggleBookmark(drug.id);
      setBookmarked(newBookmarkState);
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    }
  };

  const handleNotesClose = async () => {
    setShowNotes(false);
    // Reload notes count
    if (drug) {
      const notes = await drugService.getDrugNotes(drug.id);
      setNotesCount(notes.length);
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

  if (loading) {
    return (
      <Layout title="Loading...">
        <div className="loading">
          <div className="spinner"></div>
        </div>
      </Layout>
    );
  }

  if (!drug) {
    return (
      <Layout title="Drug Not Found">
        <div className="page">
          <div className="container">
            <div className="card text-center">
              <h3>Drug not found</h3>
              <p>The requested drug could not be found.</p>
              <button onClick={() => navigate('/drugs')} className="btn btn-primary">
                Back to Drugs
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (showNotes && drug) {
    return (
      <>
        <Layout title={drug.name}>
          <div className="page">
            <div className="container">
              <div className="card text-center">
                <h3>Loading notes...</h3>
              </div>
            </div>
          </div>
        </Layout>
        <NotesManager
          drugId={drug.id}
          drugName={drug.name}
          onClose={handleNotesClose}
        />
      </>
    );
  }

  return (
    <Layout title={drug.name}>
      <div className="page">
        <div className="container">
          {/* Header Card */}
          <div className="card fade-in">
            <div className="card-header">
              <div>
                <h1 style={{ 
                  color: 'var(--primary-color)', 
                  marginBottom: '8px',
                  fontSize: '2rem'
                }}>
                  {drug.name}
                </h1>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '12px',
                  marginBottom: '8px'
                }}>
                  <span className="badge" style={{ 
                    backgroundColor: getSystemColor(drug.system),
                    fontSize: '0.875rem'
                  }}>
                    {getSystemIcon(drug.system)} {drug.system}
                  </span>
                  <span className="badge badge-secondary">
                    {drug.class}
                  </span>
                </div>
              </div>
              <button
                onClick={handleBookmarkToggle}
                className={`btn btn-icon ${bookmarked ? 'btn-secondary' : 'btn-outline'}`}
                title={bookmarked ? 'Remove bookmark' : 'Add bookmark'}
              >
                {bookmarked ? '⭐' : '☆'}
              </button>
            </div>
          </div>

          {/* Mechanism of Action */}
          <div className="card fade-in">
            <h3>🔬 Mechanism of Action</h3>
            <div style={{
              fontSize: '1.1rem',
              lineHeight: '1.6',
              color: 'var(--text-primary)',
              margin: 0
            }}>
              <ReactMarkdown
                components={{
                  p: ({children}) => <p style={{margin: '0 0 12px 0'}}>{children}</p>,
                  ol: ({children}) => <ol style={{margin: '8px 0', paddingLeft: '20px'}}>{children}</ol>,
                  ul: ({children}) => <ul style={{margin: '8px 0', paddingLeft: '20px'}}>{children}</ul>,
                  li: ({children}) => <li style={{margin: '4px 0'}}>{children}</li>,
                  strong: ({children}) => <strong style={{fontWeight: '600'}}>{children}</strong>
                }}
              >
                {drug.moa}
              </ReactMarkdown>
            </div>
          </div>

          {/* Uses */}
          <div className="card fade-in">
            <h3>🎯 Clinical Uses</h3>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              marginTop: '12px'
            }}>
              {drug.uses.map((use, index) => (
                <div
                  key={index}
                  className="badge badge-success"
                  style={{
                    fontSize: '0.875rem',
                    padding: '12px',
                    textAlign: 'left',
                    lineHeight: '1.5'
                  }}
                >
                  <ReactMarkdown
                    components={{
                      p: ({children}) => <span style={{margin: 0, display: 'block'}}>{children}</span>,
                      ol: ({children}) => <ol style={{margin: '4px 0', paddingLeft: '16px'}}>{children}</ol>,
                      ul: ({children}) => <ul style={{margin: '4px 0', paddingLeft: '16px'}}>{children}</ul>,
                      li: ({children}) => <li style={{margin: '2px 0'}}>{children}</li>,
                      strong: ({children}) => <strong style={{fontWeight: '600'}}>{children}</strong>
                    }}
                  >
                    {use}
                  </ReactMarkdown>
                </div>
              ))}
            </div>
          </div>

          {/* Side Effects */}
          <div className="card fade-in">
            <h3>⚠️ Side Effects</h3>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              marginTop: '12px'
            }}>
              {drug.side_effects.map((effect, index) => (
                <div
                  key={index}
                  className="badge badge-warning"
                  style={{
                    fontSize: '0.875rem',
                    padding: '12px',
                    textAlign: 'left',
                    lineHeight: '1.5'
                  }}
                >
                  <ReactMarkdown
                    components={{
                      p: ({children}) => <span style={{margin: 0, display: 'block'}}>{children}</span>,
                      ol: ({children}) => <ol style={{margin: '4px 0', paddingLeft: '16px'}}>{children}</ol>,
                      ul: ({children}) => <ul style={{margin: '4px 0', paddingLeft: '16px'}}>{children}</ul>,
                      li: ({children}) => <li style={{margin: '2px 0'}}>{children}</li>,
                      strong: ({children}) => <strong style={{fontWeight: '600'}}>{children}</strong>
                    }}
                  >
                    {effect}
                  </ReactMarkdown>
                </div>
              ))}
            </div>
          </div>

          {/* Mnemonic */}
          {drug.mnemonic && (
            <div className="card fade-in" style={{ 
              background: 'linear-gradient(135deg, var(--primary-color)10, var(--primary-color)05)',
              border: '2px solid var(--primary-color)20'
            }}>
              <h3>🧠 Memory Aid</h3>
              <p style={{ 
                fontSize: '1.1rem',
                fontWeight: '500',
                color: 'var(--primary-color)',
                fontStyle: 'italic',
                margin: 0
              }}>
                "{drug.mnemonic}"
              </p>
            </div>
          )}

          {/* Contraindications */}
          {drug.contraindications && drug.contraindications.length > 0 && (
            <div className="card fade-in">
              <h3>🚫 Contraindications</h3>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                marginTop: '12px'
              }}>
                {drug.contraindications.map((contraindication, index) => (
                  <div
                    key={index}
                    className="badge badge-error"
                    style={{
                      fontSize: '0.875rem',
                      padding: '12px',
                      textAlign: 'left',
                      lineHeight: '1.5'
                    }}
                  >
                    <ReactMarkdown
                      components={{
                        p: ({children}) => <span style={{margin: 0, display: 'block'}}>{children}</span>,
                        ol: ({children}) => <ol style={{margin: '4px 0', paddingLeft: '16px'}}>{children}</ol>,
                        ul: ({children}) => <ul style={{margin: '4px 0', paddingLeft: '16px'}}>{children}</ul>,
                        li: ({children}) => <li style={{margin: '2px 0'}}>{children}</li>,
                        strong: ({children}) => <strong style={{fontWeight: '600'}}>{children}</strong>
                      }}
                    >
                      {contraindication}
                    </ReactMarkdown>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Dosage */}
          {drug.dosage && (
            <div className="card fade-in">
              <h3>💊 Dosage</h3>
              <div style={{
                fontSize: '1.1rem',
                fontWeight: '500',
                color: 'var(--text-primary)',
                margin: 0,
                lineHeight: '1.6'
              }}>
                <ReactMarkdown
                  components={{
                    p: ({children}) => <p style={{margin: '0 0 12px 0'}}>{children}</p>,
                    ol: ({children}) => <ol style={{margin: '8px 0', paddingLeft: '20px'}}>{children}</ol>,
                    ul: ({children}) => <ul style={{margin: '8px 0', paddingLeft: '20px'}}>{children}</ul>,
                    li: ({children}) => <li style={{margin: '4px 0'}}>{children}</li>,
                    strong: ({children}) => <strong style={{fontWeight: '600'}}>{children}</strong>
                  }}
                >
                  {drug.dosage}
                </ReactMarkdown>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="card fade-in">
            <h3>📚 Study Actions</h3>
            <div style={{ 
              display: 'flex', 
              gap: '12px', 
              marginTop: '16px',
              flexWrap: 'wrap'
            }}>
              <button 
                onClick={() => navigate(`/flashcards?drug=${drug.id}`)}
                className="btn btn-primary"
              >
                🃏 Study Flashcard
              </button>
              <button 
                onClick={() => navigate(`/quiz?drug=${drug.id}`)}
                className="btn btn-outline"
              >
                🧠 Quiz This Drug
              </button>
              <button
                onClick={() => navigate(`/drugs?system=${drug.system}`)}
                className="btn btn-secondary"
              >
                {getSystemIcon(drug.system)} More {drug.system} Drugs
              </button>
              <button
                onClick={() => setShowNotes(true)}
                className="btn"
                style={{ background: '#9c27b0', color: 'white' }}
              >
                📝 Notes {notesCount > 0 && `(${notesCount})`}
              </button>
            </div>
          </div>

          {/* Navigation */}
          <div style={{ 
            display: 'flex', 
            gap: '12px', 
            marginTop: '24px',
            paddingBottom: '24px'
          }}>
            <button 
              onClick={() => navigate(-1)}
              className="btn btn-outline"
            >
              ← Back
            </button>
            <button 
              onClick={() => navigate('/drugs')}
              className="btn btn-outline"
            >
              🏠 All Drugs
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DrugDetailScreen;