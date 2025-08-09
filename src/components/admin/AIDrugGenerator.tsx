import React, { useState } from 'react';
import { geminiService } from '../../services/geminiService';
import { Drug } from '../../types/drug.types';

interface AIDrugGeneratorProps {
  onDrugGenerated: (drugs: Drug[]) => void;
  drugCount?: number | null;
}

const AIDrugGenerator: React.FC<AIDrugGeneratorProps> = ({ onDrugGenerated, drugCount }) => {
  const [drugName, setDrugName] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');
  const [generatedDrugs, setGeneratedDrugs] = useState<Drug[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  const showMessage = (text: string, type: 'success' | 'error' | 'info') => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => setMessage(''), 5000);
  };

  const handleGenerateDrug = async () => {
    if (!drugName.trim()) {
      showMessage('Please enter a drug name', 'error');
      return;
    }

    if (!geminiService.isConfigured()) {
      showMessage('Gemini AI is not configured. Please set REACT_APP_GEMINI_API_KEY in your .env file', 'error');
      return;
    }

    setIsGenerating(true);
    setGeneratedDrugs([]);
    setShowPreview(false);

    try {
      const drugs = await geminiService.generateDrugData(drugName.trim(), drugCount || undefined);
      setGeneratedDrugs(drugs);
      setShowPreview(true);
      showMessage(`Successfully generated information for ${drugs.length} drug(s)!`, 'success');
    } catch (error: any) {
      showMessage(`Failed to generate drug data: ${error.message}`, 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUseDrugs = () => {
    if (generatedDrugs.length > 0) {
      onDrugGenerated(generatedDrugs);
      setGeneratedDrugs([]);
      setShowPreview(false);
      setDrugName('');
      showMessage('Drug data added to importer!', 'success');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isGenerating) {
      handleGenerateDrug();
    }
  };

  const getConfigurationStatus = () => {
    const geminiConfigured = geminiService.isConfigured();

    return {
      geminiConfigured,
      message: geminiConfigured
        ? 'AI Generator ready (Gemini AI configured)'
        : 'AI Generator not configured - please set REACT_APP_GEMINI_API_KEY'
    };
  };

  const configStatus = getConfigurationStatus();

  return (
    <div style={{ 
      padding: '20px', 
      border: '2px solid #007bff', 
      borderRadius: '8px', 
      backgroundColor: '#f8f9fa',
      marginBottom: '20px'
    }}>
      <h3 style={{ color: '#007bff', marginBottom: '15px' }}>
        🤖 AI Drug Generator (Powered by Gemini)
      </h3>
      
      <div style={{
        padding: '10px',
        marginBottom: '15px',
        borderRadius: '4px',
        backgroundColor: configStatus.geminiConfigured ? '#d4edda' : '#f8d7da',
        color: configStatus.geminiConfigured ? '#155724' : '#721c24',
        border: `1px solid ${configStatus.geminiConfigured ? '#c3e6cb' : '#f5c6cb'}`,
        fontSize: '14px'
      }}>
        <strong>Status:</strong> {configStatus.message}
        {!configStatus.geminiConfigured && (
          <div style={{ marginTop: '5px', fontSize: '12px' }}>
            Add your Gemini API key to the .env file to enable this feature.
          </div>
        )}
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label htmlFor="drugNameInput" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
          Enter Drug Name:
        </label>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            id="drugNameInput"
            type="text"
            value={drugName}
            onChange={(e) => setDrugName(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="e.g., Aspirin, Metformin, Lisinopril..."
            disabled={isGenerating || !configStatus.geminiConfigured}
            style={{
              flex: 1,
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          />
          <button
            onClick={handleGenerateDrug}
            disabled={isGenerating || !drugName.trim() || !configStatus.geminiConfigured}
            style={{
              padding: '10px 20px',
              backgroundColor: isGenerating ? '#6c757d' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isGenerating ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              minWidth: '120px'
            }}
          >
            {isGenerating ? 'Generating...' : 'Generate'}
          </button>
        </div>
      </div>

      {message && (
        <div style={{
          padding: '10px',
          marginBottom: '15px',
          borderRadius: '4px',
          backgroundColor: messageType === 'success' ? '#d4edda' : messageType === 'error' ? '#f8d7da' : '#d1ecf1',
          color: messageType === 'success' ? '#155724' : messageType === 'error' ? '#721c24' : '#0c5460',
          border: `1px solid ${messageType === 'success' ? '#c3e6cb' : messageType === 'error' ? '#f5c6cb' : '#bee5eb'}`,
          fontSize: '14px'
        }}>
          {message}
        </div>
      )}

      {showPreview && generatedDrugs.length > 0 && (
        <div style={{
          marginTop: '20px',
          padding: '15px',
          border: '1px solid #28a745',
          borderRadius: '4px',
          backgroundColor: '#f8fff9'
        }}>
          <h4 style={{ color: '#28a745', marginBottom: '10px' }}>Generated Drug Data Preview:</h4>
          <pre style={{
            background: '#f5f5f5',
            padding: '10px',
            borderRadius: '4px',
            fontSize: '12px',
            overflow: 'auto',
            maxHeight: '300px',
            marginBottom: '15px'
          }}>
            {JSON.stringify(generatedDrugs, null, 2)}
          </pre>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleUseDrugs}
              style={{
                padding: '8px 16px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              Use This Data
            </button>
            <button
              onClick={() => {
                setShowPreview(false);
                setGeneratedDrugs([]);
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
              Discard
            </button>
          </div>
        </div>
      )}

      <div style={{ 
        marginTop: '15px', 
        padding: '10px', 
        backgroundColor: '#e7f3ff', 
        borderRadius: '4px',
        fontSize: '12px',
        color: '#0066cc'
      }}>
        <strong>How it works:</strong>
        <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
          <li>Enter any drug name (generic or brand name)</li>
          <li>AI will generate comprehensive drug information including MOA, uses, side effects</li>
          <li>Built-in Google Search grounding provides real-time, accurate medical information</li>
          <li>Review the generated data and click "Use This Data" to add it to the importer</li>
          <li>The data will be automatically formatted and validated</li>
        </ul>
      </div>
    </div>
  );
};

export default AIDrugGenerator;