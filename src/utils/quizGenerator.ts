import { Drug, QuizQuestion } from '../types/drug.types';

export const generateQuizQuestions = (drugs: Drug[], count: number = 10): QuizQuestion[] => {
  const questions: QuizQuestion[] = [];
  const usedDrugs = new Set<number>();
  
  // Shuffle drugs array
  const shuffledDrugs = [...drugs].sort(() => Math.random() - 0.5);
  
  const questionTypes = [
    'moa', 'uses', 'side_effects', 'class', 'system'
  ] as const;
  
  for (let i = 0; i < Math.min(count, drugs.length); i++) {
    const drug = shuffledDrugs[i];
    if (usedDrugs.has(drug.id)) continue;
    
    usedDrugs.add(drug.id);
    
    // Randomly select question type
    const questionType = questionTypes[Math.floor(Math.random() * questionTypes.length)];
    
    let question: QuizQuestion | null = null;
    
    switch (questionType) {
      case 'moa':
        question = generateMOAQuestion(drug, drugs);
        break;
      case 'uses':
        question = generateUsesQuestion(drug, drugs);
        break;
      case 'side_effects':
        question = generateSideEffectsQuestion(drug, drugs);
        break;
      case 'class':
        question = generateClassQuestion(drug, drugs);
        break;
      case 'system':
        question = generateSystemQuestion(drug, drugs);
        break;
    }
    
    if (question) {
      questions.push(question);
    }
  }
  
  return questions;
};

const generateMOAQuestion = (drug: Drug, allDrugs: Drug[]): QuizQuestion => {
  const otherDrugs = allDrugs.filter(d => d.id !== drug.id && d.moa !== drug.moa);
  const wrongAnswers = otherDrugs
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)
    .map(d => d.moa);
  
  const options = [drug.moa, ...wrongAnswers].sort(() => Math.random() - 0.5);
  const correctAnswer = options.indexOf(drug.moa);
  
  return {
    id: `moa_${drug.id}_${Date.now()}`,
    drugId: drug.id,
    question: `What is the mechanism of action of ${drug.name}?`,
    options,
    correctAnswer,
    type: 'moa'
  };
};

const generateUsesQuestion = (drug: Drug, allDrugs: Drug[]): QuizQuestion => {
  const correctUse = drug.uses[Math.floor(Math.random() * drug.uses.length)];
  
  // Get wrong uses from other drugs
  const otherUses = allDrugs
    .filter(d => d.id !== drug.id)
    .flatMap(d => d.uses)
    .filter(use => !drug.uses.includes(use));
  
  const wrongAnswers = Array.from(new Set(otherUses))
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);
  
  const options = [correctUse, ...wrongAnswers].sort(() => Math.random() - 0.5);
  const correctAnswer = options.indexOf(correctUse);
  
  return {
    id: `uses_${drug.id}_${Date.now()}`,
    drugId: drug.id,
    question: `Which of the following is a clinical use of ${drug.name}?`,
    options,
    correctAnswer,
    type: 'uses'
  };
};

const generateSideEffectsQuestion = (drug: Drug, allDrugs: Drug[]): QuizQuestion => {
  const correctSideEffect = drug.side_effects[Math.floor(Math.random() * drug.side_effects.length)];
  
  // Get wrong side effects from other drugs
  const otherSideEffects = allDrugs
    .filter(d => d.id !== drug.id)
    .flatMap(d => d.side_effects)
    .filter(effect => !drug.side_effects.includes(effect));
  
  const wrongAnswers = Array.from(new Set(otherSideEffects))
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);
  
  const options = [correctSideEffect, ...wrongAnswers].sort(() => Math.random() - 0.5);
  const correctAnswer = options.indexOf(correctSideEffect);
  
  return {
    id: `side_effects_${drug.id}_${Date.now()}`,
    drugId: drug.id,
    question: `Which of the following is a side effect of ${drug.name}?`,
    options,
    correctAnswer,
    type: 'side_effects'
  };
};

const generateClassQuestion = (drug: Drug, allDrugs: Drug[]): QuizQuestion => {
  const otherClasses = Array.from(new Set(allDrugs
    .filter(d => d.id !== drug.id && d.class !== drug.class)
    .map(d => d.class)))
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);
  
  const options = [drug.class, ...otherClasses].sort(() => Math.random() - 0.5);
  const correctAnswer = options.indexOf(drug.class);
  
  return {
    id: `class_${drug.id}_${Date.now()}`,
    drugId: drug.id,
    question: `${drug.name} belongs to which drug class?`,
    options,
    correctAnswer,
    type: 'general'
  };
};

const generateSystemQuestion = (drug: Drug, allDrugs: Drug[]): QuizQuestion => {
  const otherSystems = Array.from(new Set(allDrugs
    .filter(d => d.id !== drug.id && d.system !== drug.system)
    .map(d => d.system)))
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);
  
  const options = [drug.system, ...otherSystems].sort(() => Math.random() - 0.5);
  const correctAnswer = options.indexOf(drug.system);
  
  return {
    id: `system_${drug.id}_${Date.now()}`,
    drugId: drug.id,
    question: `${drug.name} primarily affects which body system?`,
    options,
    correctAnswer,
    type: 'general'
  };
};

export const calculateScore = (questions: QuizQuestion[], answers: number[]): {
  score: number;
  totalQuestions: number;
  percentage: number;
  correctAnswers: number[];
} => {
  const correctAnswers = questions.map(q => q.correctAnswer);
  const score = answers.reduce((acc, answer, index) => {
    return acc + (answer === correctAnswers[index] ? 1 : 0);
  }, 0);
  
  return {
    score,
    totalQuestions: questions.length,
    percentage: Math.round((score / questions.length) * 100),
    correctAnswers
  };
};