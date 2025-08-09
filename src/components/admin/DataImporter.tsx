import React, { useState } from 'react';
import { initializeDrugData, getAllDrugs, clearAllDrugs } from '../../services/supabaseService';
import { Drug } from '../../types/drug.types';
import AIDrugGenerator from './AIDrugGenerator';

interface DataImporterProps {
  onImportComplete?: (count: number) => void;
  drugCount?: number | null;
}

const DataImporter: React.FC<DataImporterProps> = ({ onImportComplete, drugCount }) => {
  
  const [jsonInput, setJsonInput] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');

  const showMessage = (text: string, type: 'success' | 'error' | 'info') => {
    
    setMessage(text);
    setMessageType(type);
    setTimeout(() => setMessage(''), 5000);
  };

  const validateDrugData = (data: any[]): string[] => {
    const errors: string[] = [];
    const requiredFields = ['id', 'name', 'class', 'system', 'moa', 'uses', 'side_effects'];

    data.forEach((drug, index) => {
      requiredFields.forEach(field => {
        if (!drug[field]) {
          errors.push(`Drug ${index + 1}: Missing required field '${field}'`);
        }
      });

      if (drug.uses && !Array.isArray(drug.uses)) {
        errors.push(`Drug ${index + 1}: 'uses' must be an array`);
      }

      if (drug.side_effects && !Array.isArray(drug.side_effects)) {
        errors.push(`Drug ${index + 1}: 'side_effects' must be an array`);
      }

      if (drug.contraindications && !Array.isArray(drug.contraindications)) {
        errors.push(`Drug ${index + 1}: 'contraindications' must be an array`);
      }
    });

    return errors;
  };

  const handleImport = async () => {
    if (!jsonInput.trim()) {
      showMessage('Please enter JSON data', 'error');
      return;
    }

    setIsImporting(true);

    try {
      const data = JSON.parse(jsonInput);
      
      if (!Array.isArray(data)) {
        showMessage('JSON must be an array of drug objects', 'error');
        return;
      }

      const validationErrors = validateDrugData(data);
      if (validationErrors.length > 0) {
        showMessage(`Validation errors:\n${validationErrors.slice(0, 5).join('\n')}${validationErrors.length > 5 ? '\n...and more' : ''}`, 'error');
        return;
      }

      const result = await initializeDrugData(data, true); // Force import
      showMessage(`Successfully processed ${result.imported} drugs!`, 'success');
      setJsonInput('');
      onImportComplete?.(result.imported);

    } catch (error: any) {
      if (error.name === 'SyntaxError') {
        showMessage('Invalid JSON format. Please check your JSON syntax.', 'error');
      } else if (error.message.includes('User not authenticated')) {
        showMessage('Authentication required: Please sign in to import data. If you are signed in, try refreshing the page.', 'error');
      } else if (error.message.includes('permission') || error.message.includes('policy')) {
        showMessage('Permission denied: You need proper database permissions to import data. Please contact your administrator or run the fix-drug-import-permissions.sql script in your Supabase dashboard.', 'error');
      } else {
        showMessage(`Import failed: ${error.message}`, 'error');
      }
    } finally {
      setIsImporting(false);
    }
  };

  const loadSampleData = () => {
    
    const sampleData = [
      {
        "id": 999,
        "name": "Sample Drug",
        "class": "Sample Class",
        "system": "Sample System",
        "moa": "Sample mechanism of action",
        "uses": ["Sample use 1", "Sample use 2"],
        "side_effects": ["Sample side effect 1", "Sample side effect 2"],
        "mnemonic": "Sample mnemonic",
        "contraindications": ["Sample contraindication"],
        "dosage": "Sample dosage"
      }
    ];
    setJsonInput(JSON.stringify(sampleData, null, 2));
  };

  const handleClearDatabase = async () => {
    if (!window.confirm('Are you sure you want to delete ALL drugs from the database? This action cannot be undone!')) {
      return;
    }

    setIsClearing(true);

    try {
      const result = await clearAllDrugs();
      showMessage(`Successfully deleted ${result.deleted} drugs from the database!`, 'success');
      onImportComplete?.(0); // Update parent with 0 drug count
    } catch (error: any) {
      if (error.message.includes('User not authenticated')) {
        showMessage('Authentication required: Please sign in to clear data.', 'error');
      } else if (error.message.includes('permission') || error.message.includes('policy')) {
        showMessage('Permission denied: You need proper database permissions to clear data.', 'error');
      } else {
        showMessage(`Clear failed: ${error.message}`, 'error');
      }
    } finally {
      setIsClearing(false);
    }
  };

  const handleAIGeneratedDrugs = (drugs: Drug[]) => {
    // Convert the generated drugs to JSON and populate the textarea
    const jsonString = JSON.stringify(drugs, null, 2);
    setJsonInput(jsonString);
    showMessage(`AI generated ${drugs.length} drug(s) - review and import when ready!`, 'info');
  };

  return (
    
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      
      <h2>Drug Data Importer</h2>
      <p>Import drug data using JSON format. The data will be added to your Supabase database.</p>
      
      {drugCount != null && (
        <div style={{
          marginBottom: '20px',
          padding: '15px',
          backgroundColor: '#e7f3ff',
          borderRadius: '6px',
          border: '1px solid #b3d9ff'
        }}>
          <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#0066cc' }}>
            Current Database: {drugCount} drugs
          </div>
          <div style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>
            New imports will be added to the existing collection
          </div>
        </div>
      )}

      <AIDrugGenerator
        onDrugGenerated={handleAIGeneratedDrugs}
        drugCount={drugCount}
      />
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Required JSON Format:</h3>
        <pre style={{ 
          background: '#f5f5f5', 
          padding: '10px', 
          borderRadius: '4px',
          fontSize: '12px',
          overflow: 'auto'
        }}>
{`[
  {
    "id": 1,                    // Required: Unique number
    "name": "Drug Name",        // Required: String
    "class": "Drug Class",      // Required: String
    "system": "Body System",    // Required: String
    "moa": "Mechanism",         // Required: String
    "uses": ["Use 1", "Use 2"], // Required: Array of strings
    "side_effects": ["SE 1"],   // Required: Array of strings
    "mnemonic": "Optional",     // Optional: String
    "contraindications": [],    // Optional: Array of strings
    "dosage": "Optional"        // Optional: String
  }
]

// Example body systems
ANS (Autonomic Nervous System) 
CNS (Central Nervous System) 
CVS (Cardiovascular System) 
Renal 
Respiratory 
GIT (Gastrointestinal Tract) 
Endocrine 
Reproductive 
Hematological 
Immune 
Musculoskeletal 
Antimicrobial 
Antiparasitic 
Antiviral 
Antifungal 
Anticancer 
Dermatological 
Vitamins 
Toxicology 
Miscellaneous 
Vaccines 
Start your drug id numbering from ${drugCount != null ? drugCount+1 : 'N/A'}
Give detailed moa, uses, side effects, and contraindications.
Give me the drug list for 
`}
        </pre>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={loadSampleData}
          style={{
            padding: '8px 16px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginBottom: '10px'
          }}
        >
          Load Sample Data
        </button>
        
        <button
          onClick={handleClearDatabase}
          disabled={isClearing}
          style={{
            padding: '8px 16px',
            backgroundColor: isClearing ? '#6c757d' : '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isClearing ? 'not-allowed' : 'pointer',
            marginLeft: '10px'
          }}
        >
          {isClearing ? 'Clearing...' : 'Clear All Drugs'}
        </button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label htmlFor="jsonInput" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
          JSON Data:
        </label>
        <textarea
          id="jsonInput"
          value={jsonInput}
          onChange={(e) => setJsonInput(e.target.value)}
          placeholder="Paste your JSON data here..."
          style={{
            width: '100%',
            height: '300px',
            padding: '10px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontFamily: 'monospace',
            fontSize: '12px'
          }}
        />
      </div>

      {message && (
        <div style={{
          padding: '10px',
          marginBottom: '20px',
          borderRadius: '4px',
          backgroundColor: messageType === 'success' ? '#d4edda' : messageType === 'error' ? '#f8d7da' : '#d1ecf1',
          color: messageType === 'success' ? '#155724' : messageType === 'error' ? '#721c24' : '#0c5460',
          border: `1px solid ${messageType === 'success' ? '#c3e6cb' : messageType === 'error' ? '#f5c6cb' : '#bee5eb'}`,
          whiteSpace: 'pre-line'
        }}>
          {message}
        </div>
      )}

      <button
        onClick={handleImport}
        disabled={isImporting || isClearing || !jsonInput.trim()}
        style={{
          padding: '12px 24px',
          backgroundColor: isImporting ? '#6c757d' : '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: isImporting ? 'not-allowed' : 'pointer',
          fontSize: '16px',
          fontWeight: 'bold'
        }}
      >
        {isImporting ? 'Importing...' : 'Import Data'}
      </button>

      <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#fff3cd', borderRadius: '4px', border: '1px solid #ffeaa7' }}>
        <h4>⚠️ Important Notes:</h4>
        <ul>
          <li>Make sure each drug has a unique ID</li>
          <li>Required fields: id, name, class, system, moa, uses, side_effects</li>
          <li>Arrays fields: uses, side_effects, contraindications</li>
          <li>The import will add new drugs or update existing ones with the same ID</li>
          <li>Large imports may take some time to process</li>
        </ul>
      </div>
    </div>
  );
};

export default DataImporter;