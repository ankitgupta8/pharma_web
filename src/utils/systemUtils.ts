import { Drug } from '../types/drug.types';
import drugData from '../data/drugData.json';

export interface SystemInfo {
  key: string;
  label: string;
  icon: string;
  color: string;
}

// Default system metadata - can be extended as new systems are found in data
const systemMetadata: Record<string, Omit<SystemInfo, 'key'>> = {
  'ANS': { label: 'Autonomic Nervous System', icon: '🔗', color: '#9f7aea' },
  'CNS': { label: 'Central Nervous System', icon: '🧠', color: '#805ad5' },
  'CVS': { label: 'Cardiovascular System', icon: '❤️', color: '#e53e3e' },
  'Renal': { label: 'Renal System / Diuretics', icon: '🫘', color: '#4299e1' },
  'Respiratory': { label: 'Respiratory System', icon: '🫁', color: '#38b2ac' },
  'GIT': { label: 'Gastrointestinal System', icon: '🍽️', color: '#d69e2e' },
  'Endocrine': { label: 'Endocrine System', icon: '⚖️', color: '#38a169' },
  'Reproductive': { label: 'Reproductive System', icon: '🌸', color: '#ed64a6' },
  'Hematological': { label: 'Hematological System', icon: '🩸', color: '#c53030' },
  'Immune': { label: 'Immune System / Immunomodulators', icon: '🛡️', color: '#48bb78' },
  'Musculoskeletal': { label: 'Musculoskeletal System', icon: '🦴', color: '#a0aec0' },
  'Antimicrobial': { label: 'Antimicrobial Drugs', icon: '🦠', color: '#3182ce' },
  'Antiparasitic': { label: 'Antiparasitic Drugs', icon: '🪱', color: '#f56500' },
  'Antiviral': { label: 'Antiviral Drugs', icon: '🦠', color: '#0bc5ea' },
  'Antifungal': { label: 'Antifungal Drugs', icon: '🍄', color: '#68d391' },
  'Anticancer': { label: 'Anticancer / Chemotherapy', icon: '🎗️', color: '#fc8181' },
  'Dermatological': { label: 'Skin and Mucous Membranes', icon: '🧴', color: '#fbb6ce' },
  'Vitamins': { label: 'Vitamins and Minerals', icon: '💊', color: '#fbd38d' },
  'Toxicology': { label: 'Toxicology / Antidotes', icon: '☠️', color: '#718096' },
  'Miscellaneous': { label: 'Miscellaneous / Others', icon: '🔬', color: '#a78bfa' },
  'Vaccines': { label: 'Vaccines & Diagnostic Agents', icon: '💉', color: '#4fd1c7' },
  // Legacy mappings for backward compatibility
  'GI': { label: 'Gastrointestinal System', icon: '🍽️', color: '#d69e2e' },
  'Antibiotics': { label: 'Antimicrobial Drugs', icon: '🦠', color: '#3182ce' },
  'Hemo': { label: 'Hematological System', icon: '🩸', color: '#c53030' },
  'Cardio': { label: 'Cardiovascular System', icon: '❤️', color: '#e53e3e' },
};

// Default metadata for unknown systems
const defaultSystemMetadata = { label: 'Unknown', icon: '💊', color: '#666' };

/**
 * Extract unique systems from drug data
 */
export const getUniqueSystems = (drugs: Drug[] = drugData as Drug[]): string[] => {
  const systems = new Set<string>();
  drugs.forEach(drug => {
    if (drug.system) {
      systems.add(drug.system);
    }
  });
  return Array.from(systems).sort();
};

/**
 * Get system information with metadata
 */
export const getSystemsWithMetadata = (drugs: Drug[] = drugData as Drug[]): SystemInfo[] => {
  const uniqueSystems = getUniqueSystems(drugs);
  
  return uniqueSystems.map(system => ({
    key: system,
    ...systemMetadata[system] || {
      ...defaultSystemMetadata,
      label: system // Use the system key as label if no metadata exists
    }
  }));
};

/**
 * Get system information for a specific system
 */
export const getSystemInfo = (systemKey: string): SystemInfo => {
  return {
    key: systemKey,
    ...systemMetadata[systemKey] || {
      ...defaultSystemMetadata,
      label: systemKey
    }
  };
};

/**
 * Get all systems including 'all' option
 */
export const getAllSystemOptions = (drugs: Drug[] = drugData as Drug[]): Array<SystemInfo & { key: string | 'all' }> => {
  const systems = getSystemsWithMetadata(drugs);
  
  return [
    { key: 'all', label: 'All Systems', icon: '🏥', color: '#666' },
    ...systems
  ];
};

/**
 * Check if a system exists in the data
 */
export const isValidSystem = (systemKey: string, drugs: Drug[] = drugData as Drug[]): boolean => {
  const uniqueSystems = getUniqueSystems(drugs);
  return uniqueSystems.includes(systemKey);
};

const systemUtils = {
  getUniqueSystems,
  getSystemsWithMetadata,
  getSystemInfo,
  getAllSystemOptions,
  isValidSystem
};

export default systemUtils;