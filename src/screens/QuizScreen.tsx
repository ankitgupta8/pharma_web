import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/common/Layout';
import TopicSelector from '../components/flashcard/TopicSelector';
import { generateQuizQuestions, calculateScore } from '../utils/quizGenerator';
import { QuizQuestion, Drug, DrugSystem } from '../types/drug.types';
import { drugService } from '../context/AppContext';
import { getUniqueSystems } from '../utils/systemUtils';
import '../styles/quiz.css';
import '../styles/flashcard.css';

const QuizScreen: React.FC = () => {
  const navigate = useNavigate();
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isQuizComplete, setIsQuizComplete] = useState(false);
  const [quizResults, setQuizResults] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSystems, setSelectedSystems] = useState<DrugSystem[]>([]);
  const [quizStarted, setQuizStarted] = useState(false);
  const [timedMode, setTimedMode] = useState(false);
  const [timeLimit, setTimeLimit] = useState(30); // seconds per question
  const [timeRemaining, setTimeRemaining] = useState(30);
  const [timerActive, setTimerActive] = useState(false);

  const [systems, setSystems] = useState<DrugSystem[]>([]);

  useEffect(() => {
    loadDrugs();
    loadSystems();
  }, []);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (timerActive && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            // Time's up - auto-advance to next question
            handleTimeUp();
            return timeLimit;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerActive, timeRemaining, timeLimit]);

  const loadSystems = async () => {
    try {
      const allDrugs = await drugService.getAllDrugs();
      const uniqueSystems = getUniqueSystems(allDrugs);
      setSystems(uniqueSystems);
    } catch (error) {
      console.error('Error loading systems:', error);
      setSystems([]);
    }
  };

  const loadDrugs = async () => {
    try {
      const allDrugs = await drugService.getAllDrugs();
      setDrugs(allDrugs);
    } catch (error) {
      console.error('Error loading drugs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSystemToggle = (system: DrugSystem) => {
    setSelectedSystems(prev => {
      if (prev.includes(system)) {
        return prev.filter(s => s !== system);
      } else {
        return [...prev, system];
      }
    });
  };

  const handleSelectAll = () => {
    setSelectedSystems([...systems]);
  };

  const handleClearAll = () => {
    setSelectedSystems([]);
  };

  const handleTimeUp = () => {
    // Auto-select a random answer if no answer is selected
    if (selectedOption === null) {
      const randomOption = Math.floor(Math.random() * questions[currentQuestionIndex].options.length);
      setSelectedOption(randomOption);
    }
    
    // Auto-advance to next question
    setTimeout(() => {
      handleNextQuestion();
    }, 500);
  };

  const startQuiz = () => {
    if (selectedSystems.length === 0) {
      alert('Please select at least one topic to start the quiz.');
      return;
    }

    const filteredDrugs = drugs.filter(drug => selectedSystems.includes(drug.system));
    
    if (filteredDrugs.length < 5) {
      alert('Not enough drugs in the selected topics for a quiz. Please select more topics or different ones.');
      return;
    }

    const quizQuestions = generateQuizQuestions(filteredDrugs, 10);
    setQuestions(quizQuestions);
    setSelectedAnswers(new Array(quizQuestions.length).fill(-1));
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setIsQuizComplete(false);
    setQuizResults(null);
    setQuizStarted(true);
    
    // Initialize timer if timed mode is enabled
    if (timedMode) {
      setTimeRemaining(timeLimit);
      setTimerActive(true);
    }
  };

  const handleOptionSelect = (optionIndex: number) => {
    setSelectedOption(optionIndex);
  };

  const handleNextQuestion = () => {
    if (selectedOption === null && !timedMode) return;

    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestionIndex] = selectedOption !== null ? selectedOption : -1;
    setSelectedAnswers(newAnswers);

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedOption(newAnswers[currentQuestionIndex + 1] !== -1 ? newAnswers[currentQuestionIndex + 1] : null);
      
      // Reset timer for next question if in timed mode
      if (timedMode) {
        setTimeRemaining(timeLimit);
      }
    } else {
      setTimerActive(false);
      completeQuiz(newAnswers);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setSelectedOption(selectedAnswers[currentQuestionIndex - 1] !== -1 ? selectedAnswers[currentQuestionIndex - 1] : null);
    }
  };

  const completeQuiz = async (answers: number[]) => {
    const results = calculateScore(questions, answers);
    setQuizResults(results);
    setIsQuizComplete(true);

    // Save quiz score to database
    try {
      await drugService.saveQuizScore({
        score: results.score,
        totalQuestions: results.totalQuestions,
        completedAt: new Date(),
        system: selectedSystems.length === 1 ? selectedSystems[0] : undefined
      });
    } catch (error) {
      console.error('Error saving quiz score:', error);
    }
  };

  const restartQuiz = () => {
    setQuizStarted(false);
    setSelectedSystems([]);
    setTimerActive(false);
    setTimeRemaining(timeLimit);
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return '#4caf50';
    if (percentage >= 60) return '#ff9800';
    return '#f44336';
  };

  if (loading) {
    return (
      <Layout title="Quiz">
        <div className="page">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading quiz...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!quizStarted) {
    return (
      <Layout title="Quiz">
        <div className="page">
          <div className="container">
            <div className="quiz-setup">
              <h1>📝 Pharmacology Quiz</h1>
              <p>Test your knowledge with multiple choice questions</p>
              
              <TopicSelector
                selectedSystems={selectedSystems}
                onSystemToggle={handleSystemToggle}
                onSelectAll={handleSelectAll}
                onClearAll={handleClearAll}
              />

              {/* Timer Settings */}
              <div className="card" style={{ marginTop: '16px' }}>
                <h3>⏱️ Timer Settings</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="checkbox"
                      checked={timedMode}
                      onChange={(e) => setTimedMode(e.target.checked)}
                    />
                    Enable timed mode
                  </label>
                </div>
                
                {timedMode && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <label>Time per question:</label>
                    <select
                      value={timeLimit}
                      onChange={(e) => setTimeLimit(Number(e.target.value))}
                      style={{
                        padding: '8px',
                        borderRadius: '4px',
                        border: '1px solid var(--border-color)'
                      }}
                    >
                      <option value={15}>15 seconds</option>
                      <option value={30}>30 seconds</option>
                      <option value={45}>45 seconds</option>
                      <option value={60}>1 minute</option>
                      <option value={90}>1.5 minutes</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="quiz-info">
                <div className="info-item">
                  <span className="info-label">Questions:</span>
                  <span className="info-value">10</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Time:</span>
                  <span className="info-value">
                    {timedMode ? `${timeLimit}s per question` : 'No limit'}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">Available Drugs:</span>
                  <span className="info-value">
                    {selectedSystems.length === 0 ? 0 : drugs.filter(d => selectedSystems.includes(d.system)).length}
                  </span>
                </div>
              </div>

              <button
                className="start-quiz-btn"
                onClick={startQuiz}
                disabled={selectedSystems.length === 0}
              >
                Start Quiz
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (isQuizComplete && quizResults) {
    return (
      <Layout title="Quiz Results">
        <div className="page">
          <div className="container">
            <div className="quiz-results">
              <h1>🎉 Quiz Complete!</h1>
              
              <div className="score-display">
                <div
                  className="score-circle"
                  style={{ borderColor: getScoreColor(quizResults.percentage) }}
                >
                  <span className="score-percentage" style={{ color: getScoreColor(quizResults.percentage) }}>
                    {quizResults.percentage}%
                  </span>
                  <span className="score-fraction">
                    {quizResults.score}/{quizResults.totalQuestions}
                  </span>
                </div>
              </div>

              <div className="performance-message">
                {quizResults.percentage >= 80 && (
                  <p className="excellent">Excellent! You have a strong understanding of pharmacology.</p>
                )}
                {quizResults.percentage >= 60 && quizResults.percentage < 80 && (
                  <p className="good">Good work! Keep studying to improve your knowledge.</p>
                )}
                {quizResults.percentage < 60 && (
                  <p className="needs-improvement">Keep studying! Review the flashcards and try again.</p>
                )}
              </div>

              <div className="quiz-actions">
                <button className="secondary-btn" onClick={restartQuiz}>
                  Take Another Quiz
                </button>
                <button className="primary-btn" onClick={() => navigate('/flashcards')}>
                  Study Flashcards
                </button>
              </div>

              <div className="detailed-results">
                <h3>Question Review:</h3>
                {questions.map((question, index) => {
                  const userAnswer = selectedAnswers[index];
                  const isCorrect = userAnswer === question.correctAnswer;
                  
                  return (
                    <div key={question.id} className={`question-review ${isCorrect ? 'correct' : 'incorrect'}`}>
                      <div className="question-header">
                        <span className="question-number">Q{index + 1}</span>
                        <span className={`result-icon ${isCorrect ? 'correct' : 'incorrect'}`}>
                          {isCorrect ? '✓' : '✗'}
                        </span>
                      </div>
                      <p className="question-text">{question.question}</p>
                      <div className="answer-review">
                        <p className="user-answer">
                          Your answer: <span className={isCorrect ? 'correct' : 'incorrect'}>
                            {question.options[userAnswer]}
                          </span>
                        </p>
                        {!isCorrect && (
                          <p className="correct-answer">
                            Correct answer: <span className="correct">
                              {question.options[question.correctAnswer]}
                            </span>
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <Layout title="Quiz">
      <div className="page" style={{ padding: 0 }}>
        <div className="quiz-screen">
          <div className="quiz-header">
            <div className="quiz-progress">
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <span className="progress-text">
                {currentQuestionIndex + 1} of {questions.length}
              </span>
            </div>
            
            {/* Timer Display */}
            {timedMode && (
              <div className="timer-display" style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: timeRemaining <= 5 ? '#ffebee' : '#e3f2fd',
                padding: '8px 16px',
                borderRadius: '20px',
                border: `2px solid ${timeRemaining <= 5 ? '#f44336' : '#2196f3'}`,
                marginTop: '8px'
              }}>
                <span style={{ fontSize: '1.2rem' }}>⏱️</span>
                <span style={{
                  fontWeight: 'bold',
                  color: timeRemaining <= 5 ? '#f44336' : '#2196f3',
                  fontSize: '1.1rem'
                }}>
                  {timeRemaining}s
                </span>
                {timeRemaining <= 5 && (
                  <span style={{ color: '#f44336', fontSize: '0.875rem' }}>
                    Time running out!
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="quiz-content">
            <div className="question-container">
              <h2 className="question-text">{currentQuestion.question}</h2>
              
              <div className="options-container">
                {currentQuestion.options.map((option, index) => (
                  <button
                    key={index}
                    className={`option-btn ${selectedOption === index ? 'selected' : ''}`}
                    onClick={() => handleOptionSelect(index)}
                  >
                    <span className="option-letter">
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span className="option-text">{option}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="quiz-navigation">
              <button
                className="nav-btn secondary"
                onClick={handlePreviousQuestion}
                disabled={currentQuestionIndex === 0}
              >
                Previous
              </button>
              
              <button
                className="nav-btn primary"
                onClick={handleNextQuestion}
                disabled={selectedOption === null}
              >
                {currentQuestionIndex === questions.length - 1 ? 'Finish Quiz' : 'Next'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default QuizScreen;