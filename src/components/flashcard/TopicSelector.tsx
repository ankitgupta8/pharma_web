import React, { useState, useEffect } from 'react';
import { DrugSystem } from '../../types/drug.types';
import { getSystemsWithMetadata, SystemInfo } from '../../utils/systemUtils';
import { drugService } from '../../context/AppContext';

interface TopicSelectorProps {
  selectedSystems: DrugSystem[];
  onSystemToggle: (system: DrugSystem) => void;
  onSelectAll: () => void | Promise<void>;
  onClearAll: () => void;
}

const TopicSelector: React.FC<TopicSelectorProps> = ({
  selectedSystems,
  onSystemToggle,
  onSelectAll,
  onClearAll
}) => {
  const [systems, setSystems] = useState<SystemInfo[]>([]);

  useEffect(() => {
    loadSystems();
  }, []);

  const loadSystems = async () => {
    try {
      const allDrugs = await drugService.getAllDrugs();
      const systemsWithMetadata = getSystemsWithMetadata(allDrugs);
      setSystems(systemsWithMetadata);
    } catch (error) {
      console.error('Error loading systems:', error);
      setSystems([]);
    }
  };

  const allSelected = selectedSystems.length === systems.length;
  const noneSelected = selectedSystems.length === 0;

  return (
    <div className="topic-selector">
      <div className="topic-selector-header">
        <h3>📚 Select Topics to Study</h3>
        <div className="topic-selector-actions">
          <button
            onClick={() => {
              const result = onSelectAll();
              if (result instanceof Promise) {
                result.catch(console.error);
              }
            }}
            disabled={allSelected}
            className="topic-action-btn"
          >
            Select All
          </button>
          <button
            onClick={onClearAll}
            disabled={noneSelected}
            className="topic-action-btn"
          >
            Clear All
          </button>
        </div>
      </div>
      
      <div className="topic-grid">
        {systems.map((system) => {
          const isSelected = selectedSystems.includes(system.key);
          return (
            <div
              key={system.key}
              className={`topic-card ${isSelected ? 'selected' : ''}`}
              onClick={() => onSystemToggle(system.key)}
            >
              <div className="topic-checkbox">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onSystemToggle(system.key)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <div className="topic-content">
                <div className="topic-icon">{system.icon}</div>
                <div className="topic-label">{system.label}</div>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="topic-selector-summary">
        {selectedSystems.length > 0 ? (
          <p>
            <strong>{selectedSystems.length}</strong> topic{selectedSystems.length !== 1 ? 's' : ''} selected
          </p>
        ) : (
          <p className="no-selection">Please select at least one topic to study</p>
        )}
      </div>
    </div>
  );
};

export default TopicSelector;