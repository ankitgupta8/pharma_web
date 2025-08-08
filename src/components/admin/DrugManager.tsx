import React, { useState, useEffect } from 'react';
import { Drug } from '../../types/drug.types';
import { getAllDrugs, getAllDrugClasses, getDrugsByClass, deleteDrug } from '../../services/supabaseService';

interface DrugManagerProps {
  onDrugDeleted?: () => void;
}

const DrugManager: React.FC<DrugManagerProps> = ({ onDrugDeleted }) => {
  const [drugClasses, setDrugClasses] = useState<string[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [expandedClass, setExpandedClass] = useState<string | null>(null);

  useEffect(() => {
    loadDrugClasses();
  }, []);

  const loadDrugClasses = async () => {
    try {
      setIsLoading(true);
      const classes = await getAllDrugClasses();
      setDrugClasses(classes);
    } catch (error) {
      console.error('Error loading drug classes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadDrugsByClass = async (drugClass: string) => {
    try {
      setIsLoading(true);
      const classDrugs = await getDrugsByClass(drugClass);
      setDrugs(classDrugs);
      setSelectedClass(drugClass);
      setExpandedClass(drugClass);
    } catch (error) {
      console.error('Error loading drugs by class:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteDrug = async (drugId: number, drugName: string) => {
    if (!window.confirm(`Are you sure you want to delete "${drugName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setIsDeleting(drugId);
      await deleteDrug(drugId);
      
      // Remove the deleted drug from the current list
      setDrugs(prevDrugs => prevDrugs.filter(drug => drug.id !== drugId));
      
      // Call the callback to refresh parent component
      if (onDrugDeleted) {
        onDrugDeleted();
      }
      
      alert(`Successfully deleted "${drugName}"`);
    } catch (error) {
      console.error('Error deleting drug:', error);
      alert(`Failed to delete "${drugName}". Please try again.`);
    } finally {
      setIsDeleting(null);
    }
  };

  const toggleClassExpansion = (drugClass: string) => {
    if (expandedClass === drugClass) {
      setExpandedClass(null);
      setDrugs([]);
      setSelectedClass('');
    } else {
      loadDrugsByClass(drugClass);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <div style={{
        backgroundColor: '#f8f9fa',
        padding: '15px 20px',
        borderBottom: '1px solid #dee2e6',
        marginBottom: '20px'
      }}>
        <h3 style={{ margin: 0, color: '#495057' }}>Drug Management</h3>
        <p style={{ margin: '5px 0 0 0', color: '#6c757d', fontSize: '14px' }}>
          View and manage drugs organized by classes. Click on a class to expand and see all drugs.
        </p>
      </div>

      {isLoading && !drugs.length ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>
          Loading drug classes...
        </div>
      ) : (
        <div>
          {drugClasses.map((drugClass) => (
            <div key={drugClass} style={{
              marginBottom: '15px',
              border: '1px solid #dee2e6',
              borderRadius: '8px',
              overflow: 'hidden'
            }}>
              <div
                onClick={() => toggleClassExpansion(drugClass)}
                style={{
                  padding: '15px 20px',
                  backgroundColor: expandedClass === drugClass ? '#e9ecef' : '#f8f9fa',
                  cursor: 'pointer',
                  borderBottom: expandedClass === drugClass ? '1px solid #dee2e6' : 'none',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'background-color 0.2s'
                }}
              >
                <div>
                  <h4 style={{ margin: 0, color: '#495057' }}>{drugClass}</h4>
                </div>
                <div style={{
                  fontSize: '18px',
                  color: '#6c757d',
                  transform: expandedClass === drugClass ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s'
                }}>
                  ▼
                </div>
              </div>

              {expandedClass === drugClass && (
                <div style={{ backgroundColor: 'white' }}>
                  {isLoading ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#6c757d' }}>
                      Loading drugs...
                    </div>
                  ) : drugs.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#6c757d' }}>
                      No drugs found in this class.
                    </div>
                  ) : (
                    <div>
                      {drugs.map((drug) => (
                        <div key={drug.id} style={{
                          padding: '15px 20px',
                          borderBottom: '1px solid #f1f3f4',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start'
                        }}>
                          <div style={{ flex: 1 }}>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              marginBottom: '8px'
                            }}>
                              <h5 style={{
                                margin: 0,
                                color: '#495057',
                                fontSize: '16px',
                                fontWeight: 'bold'
                              }}>
                                {drug.name}
                              </h5>
                              <span style={{
                                marginLeft: '10px',
                                padding: '2px 8px',
                                backgroundColor: '#e9ecef',
                                borderRadius: '12px',
                                fontSize: '12px',
                                color: '#6c757d'
                              }}>
                                ID: {drug.id}
                              </span>
                            </div>
                            <div style={{ marginBottom: '5px' }}>
                              <strong style={{ color: '#495057' }}>System:</strong>
                              <span style={{ marginLeft: '5px', color: '#6c757d' }}>{drug.system}</span>
                            </div>
                            <div style={{ marginBottom: '5px' }}>
                              <strong style={{ color: '#495057' }}>MOA:</strong>
                              <span style={{ marginLeft: '5px', color: '#6c757d' }}>{drug.moa}</span>
                            </div>
                            <div style={{ marginBottom: '5px' }}>
                              <strong style={{ color: '#495057' }}>Uses:</strong>
                              <span style={{ marginLeft: '5px', color: '#6c757d' }}>
                                {drug.uses.join(', ')}
                              </span>
                            </div>
                            {drug.dosage && (
                              <div>
                                <strong style={{ color: '#495057' }}>Dosage:</strong>
                                <span style={{ marginLeft: '5px', color: '#6c757d' }}>{drug.dosage}</span>
                              </div>
                            )}
                          </div>
                          <div style={{ marginLeft: '20px' }}>
                            <button
                              onClick={() => handleDeleteDrug(drug.id, drug.name)}
                              disabled={isDeleting === drug.id}
                              style={{
                                padding: '8px 16px',
                                backgroundColor: isDeleting === drug.id ? '#6c757d' : '#dc3545',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: isDeleting === drug.id ? 'not-allowed' : 'pointer',
                                fontSize: '14px',
                                minWidth: '80px'
                              }}
                            >
                              {isDeleting === drug.id ? 'Deleting...' : 'Delete'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {drugClasses.length === 0 && !isLoading && (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          color: '#6c757d',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          border: '1px solid #dee2e6'
        }}>
          <h4 style={{ margin: '0 0 10px 0' }}>No Drug Classes Found</h4>
          <p style={{ margin: 0 }}>Import some drugs first to see them organized by classes.</p>
        </div>
      )}
    </div>
  );
};

export default DrugManager;