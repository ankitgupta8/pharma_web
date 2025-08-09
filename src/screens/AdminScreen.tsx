import React, { useState } from 'react';
import Layout from '../components/common/Layout';
import DataImporter from '../components/admin/DataImporter';
import DrugManager from '../components/admin/DrugManager';
import { getAllDrugs } from '../services/supabaseService';
import { generateSampleAchievementData, clearSampleAchievementData } from '../data/database';

const AdminScreen: React.FC = () => {
  const [drugCount, setDrugCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingData, setIsGeneratingData] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'import' | 'manage'>('overview');
  const [showClearConfirmation, setShowClearConfirmation] = useState(false);

  const loadDrugCount = async () => {
    setIsLoading(true);
    try {
      const drugs = await getAllDrugs();
      setDrugCount(drugs.length);
    } catch (error) {
      console.error('Error loading drug count:', error);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    loadDrugCount();
  }, []);

  const handleImportComplete = (importedCount: number) => {
    // Refresh the drug count after import
    loadDrugCount();
  };

  const handleGenerateSampleData = async () => {
    setIsGeneratingData(true);
    try {
      await generateSampleAchievementData();
      alert('Sample achievement data generated successfully! You can now test the achievements system.');
    } catch (error) {
      console.error('Error generating sample data:', error);
      alert('Error generating sample data. Check console for details.');
    } finally {
      setIsGeneratingData(false);
    }
  };

  const handleClearSampleData = async () => {
    setIsGeneratingData(true);
    try {
      await clearSampleAchievementData();
      alert('Sample achievement data cleared successfully!');
    } catch (error) {
      console.error('Error clearing sample data:', error);
      alert('Error clearing sample data. Check console for details.');
    } finally {
      setIsGeneratingData(false);
      setShowClearConfirmation(false);
    }
  };

  const handleClearConfirmation = () => {
    setShowClearConfirmation(true);
  };

  const handleCancelClear = () => {
    setShowClearConfirmation(false);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <>
            <div style={{
              backgroundColor: '#f8f9fa',
              padding: '20px',
              borderRadius: '8px',
              marginBottom: '30px',
              border: '1px solid #dee2e6'
            }}>
              <h2 style={{ margin: '0 0 15px 0', color: '#495057' }}>Database Statistics</h2>
              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                <div style={{
                  backgroundColor: 'white',
                  padding: '15px',
                  borderRadius: '6px',
                  border: '1px solid #dee2e6',
                  minWidth: '150px'
                }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#007bff' }}>
                    {isLoading ? '...' : drugCount || 0}
                  </div>
                  <div style={{ color: '#6c757d', fontSize: '14px' }}>Total Drugs</div>
                </div>
                <button
                  onClick={loadDrugCount}
                  disabled={isLoading}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    alignSelf: 'flex-end'
                  }}
                >
                  {isLoading ? 'Loading...' : 'Refresh'}
                </button>
              </div>
            </div>

            <div style={{
              marginTop: '30px',
              padding: '20px',
              backgroundColor: '#e9ecef',
              borderRadius: '8px',
              border: '1px solid #ced4da'
            }}>
              <h4 style={{ margin: '0 0 15px 0', color: '#495057' }}>Quick Actions</h4>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => window.open('https://supabase.com', '_blank')}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#17a2b8',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Open Supabase Dashboard
                </button>
                <button
                  onClick={() => {
                    const sampleJson = JSON.stringify([
                      {
                        "id": Math.floor(Math.random() * 10000),
                        "name": "New Drug",
                        "class": "New Class",
                        "system": "New System",
                        "moa": "Mechanism of action",
                        "uses": ["Use 1", "Use 2"],
                        "side_effects": ["Side effect 1", "Side effect 2"],
                        "mnemonic": "Memory aid",
                        "contraindications": ["Contraindication 1"],
                        "dosage": "Dosage information"
                      }
                    ], null, 2);
                    navigator.clipboard.writeText(sampleJson);
                    alert('Sample JSON copied to clipboard!');
                  }}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Copy Sample JSON
                </button>
              </div>
            </div>

            <div style={{
              marginTop: '30px',
              padding: '20px',
              backgroundColor: '#fff3cd',
              borderRadius: '8px',
              border: '1px solid #ffeaa7'
            }}>
              <h4 style={{ margin: '0 0 15px 0', color: '#856404' }}>Achievement System Testing</h4>
              <p style={{ margin: '0 0 15px 0', color: '#856404', fontSize: '14px' }}>
                Generate sample data to test the achievements system, or clear existing data to start fresh.
              </p>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  onClick={handleGenerateSampleData}
                  disabled={isGeneratingData}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: isGeneratingData ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    opacity: isGeneratingData ? 0.6 : 1
                  }}
                >
                  {isGeneratingData ? 'Generating...' : '🏆 Generate Sample Achievement Data'}
                </button>
                <button
                  onClick={handleClearConfirmation}
                  disabled={isGeneratingData}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: isGeneratingData ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    opacity: isGeneratingData ? 0.6 : 1
                  }}
                >
                  {isGeneratingData ? 'Clearing...' : '🗑️ Clear Achievement Data'}
                </button>
              </div>
            </div>
          </>
        );
      case 'import':
        return (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            border: '1px solid #dee2e6',
            overflow: 'hidden'
          }}>
            <div style={{
              backgroundColor: '#f8f9fa',
              padding: '15px 20px',
              borderBottom: '1px solid #dee2e6'
            }}>
              <h3 style={{ margin: 0, color: '#495057' }}>Data Import</h3>
            </div>
            <DataImporter
              onImportComplete={handleImportComplete}
              drugCount={drugCount}
            />
          </div>
        );
      case 'manage':
        return (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            border: '1px solid #dee2e6',
            overflow: 'hidden'
          }}>
            <DrugManager onDrugDeleted={loadDrugCount} />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Layout title="Admin Panel" showHeader={true}>
      <div style={{ padding: '20px' }}>
        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          marginBottom: '30px',
          borderBottom: '2px solid #dee2e6',
          backgroundColor: 'white',
          borderRadius: '8px 8px 0 0',
          overflow: 'hidden'
        }}>
          <button
            onClick={() => setActiveTab('overview')}
            style={{
              padding: '15px 25px',
              backgroundColor: activeTab === 'overview' ? '#007bff' : 'transparent',
              color: activeTab === 'overview' ? 'white' : '#495057',
              border: 'none',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: activeTab === 'overview' ? 'bold' : 'normal',
              borderBottom: activeTab === 'overview' ? '3px solid #007bff' : '3px solid transparent',
              transition: 'all 0.2s'
            }}
          >
            📊 Overview
          </button>
          <button
            onClick={() => setActiveTab('import')}
            style={{
              padding: '15px 25px',
              backgroundColor: activeTab === 'import' ? '#007bff' : 'transparent',
              color: activeTab === 'import' ? 'white' : '#495057',
              border: 'none',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: activeTab === 'import' ? 'bold' : 'normal',
              borderBottom: activeTab === 'import' ? '3px solid #007bff' : '3px solid transparent',
              transition: 'all 0.2s'
            }}
          >
            📥 Import Data
          </button>
          <button
            onClick={() => setActiveTab('manage')}
            style={{
              padding: '15px 25px',
              backgroundColor: activeTab === 'manage' ? '#007bff' : 'transparent',
              color: activeTab === 'manage' ? 'white' : '#495057',
              border: 'none',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: activeTab === 'manage' ? 'bold' : 'normal',
              borderBottom: activeTab === 'manage' ? '3px solid #007bff' : '3px solid transparent',
              transition: 'all 0.2s'
            }}
          >
            🗂️ Manage Drugs
          </button>
        </div>

        {/* Tab Content */}
        {renderTabContent()}

        {/* Confirmation Modal */}
        {showClearConfirmation && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: 'white',
              padding: '30px',
              borderRadius: '8px',
              maxWidth: '400px',
              width: '90%',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
            }}>
              <h3 style={{ margin: '0 0 15px 0', color: '#495057' }}>Confirm Clear Data</h3>
              <p style={{ margin: '0 0 20px 0', color: '#6c757d' }}>
                Are you sure you want to clear all achievement data? This will reset all progress and cannot be undone.
              </p>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  onClick={handleCancelClear}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleClearSampleData}
                  disabled={isGeneratingData}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: isGeneratingData ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    opacity: isGeneratingData ? 0.6 : 1
                  }}
                >
                  {isGeneratingData ? 'Clearing...' : 'Clear Data'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AdminScreen;