import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/common/Layout';
import { Drug, DrugSystem } from '../types/drug.types';
import { drugService } from '../context/AppContext';
import { getAllSystemOptions } from '../utils/systemUtils';

const DrugListScreen: React.FC = () => {
  const [selectedSystem, setSelectedSystem] = useState<DrugSystem | 'all'>('all');
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  // Advanced filter states
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [selectedUses, setSelectedUses] = useState<string[]>([]);
  const [selectedSideEffects, setSelectedSideEffects] = useState<string[]>([]);
  const [searchField, setSearchField] = useState<'all' | 'name' | 'moa' | 'uses' | 'side_effects'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'class' | 'system'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const [systems, setSystems] = useState<Array<{ key: DrugSystem | 'all'; label: string; icon: string; color: string }>>([]);
  const [availableClasses, setAvailableClasses] = useState<string[]>([]);
  const [availableUses, setAvailableUses] = useState<string[]>([]);
  const [availableSideEffects, setAvailableSideEffects] = useState<string[]>([]);

  useEffect(() => {
    loadSystems();
  }, []);

  useEffect(() => {
    loadDrugs();
  }, [selectedSystem]);

  const loadSystems = async () => {
    try {
      const allDrugs = await drugService.getAllDrugs();
      const systemOptions = getAllSystemOptions(allDrugs);
      setSystems(systemOptions);
      
      // Extract unique classes, uses, and side effects for filters
      const classes = Array.from(new Set(allDrugs.map(drug => drug.class))).sort();
      const uses = Array.from(new Set(allDrugs.flatMap(drug => drug.uses))).sort();
      const sideEffects = Array.from(new Set(allDrugs.flatMap(drug => drug.side_effects))).sort();
      
      setAvailableClasses(classes);
      setAvailableUses(uses);
      setAvailableSideEffects(sideEffects);
    } catch (error) {
      console.error('Error loading systems:', error);
      // Fallback to default systems if there's an error
      setSystems([{ key: 'all', label: 'All Systems', icon: '🏥', color: '#666' }]);
    }
  };

  const loadDrugs = async () => {
    setLoading(true);
    try {
      let drugList: Drug[];
      if (selectedSystem === 'all') {
        drugList = await drugService.getAllDrugs();
      } else {
        drugList = await drugService.getDrugsBySystem(selectedSystem);
      }
      setDrugs(drugList);
    } catch (error) {
      console.error('Error loading drugs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredDrugs = drugs.filter(drug => {
    // Text search filter
    let textMatch = true;
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      switch (searchField) {
        case 'name':
          textMatch = drug.name.toLowerCase().includes(lowerSearchTerm);
          break;
        case 'moa':
          textMatch = drug.moa.toLowerCase().includes(lowerSearchTerm);
          break;
        case 'uses':
          textMatch = drug.uses.some(use => use.toLowerCase().includes(lowerSearchTerm));
          break;
        case 'side_effects':
          textMatch = drug.side_effects.some(effect => effect.toLowerCase().includes(lowerSearchTerm));
          break;
        default:
          textMatch = drug.name.toLowerCase().includes(lowerSearchTerm) ||
                     drug.class.toLowerCase().includes(lowerSearchTerm) ||
                     drug.moa.toLowerCase().includes(lowerSearchTerm) ||
                     drug.uses.some(use => use.toLowerCase().includes(lowerSearchTerm)) ||
                     drug.side_effects.some(effect => effect.toLowerCase().includes(lowerSearchTerm));
      }
    }
    
    // Advanced filters
    const classMatch = selectedClasses.length === 0 || selectedClasses.includes(drug.class);
    const useMatch = selectedUses.length === 0 || selectedUses.some(use => drug.uses.includes(use));
    const sideEffectMatch = selectedSideEffects.length === 0 || selectedSideEffects.some(effect => drug.side_effects.includes(effect));
    
    return textMatch && classMatch && useMatch && sideEffectMatch;
  });

  // Sort filtered drugs
  const sortedDrugs = [...filteredDrugs].sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'class':
        comparison = a.class.localeCompare(b.class);
        break;
      case 'system':
        comparison = a.system.localeCompare(b.system);
        break;
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const groupedDrugs = sortedDrugs.reduce((acc, drug) => {
    const key = drug.class;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(drug);
    return acc;
  }, {} as Record<string, Drug[]>);

  const clearAllFilters = () => {
    setSearchTerm('');
    setSelectedClasses([]);
    setSelectedUses([]);
    setSelectedSideEffects([]);
    setSearchField('all');
    setSortBy('name');
    setSortOrder('asc');
  };

  const hasActiveFilters = searchTerm || selectedClasses.length > 0 || selectedUses.length > 0 || selectedSideEffects.length > 0 || searchField !== 'all' || sortBy !== 'name' || sortOrder !== 'asc';

  return (
    <Layout title="Drug Browser">
      <div className="page">
        <div className="container">
          {/* Enhanced Search Bar */}
          <div className="card">
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <div style={{ flex: 1 }}>
                <input
                  type="text"
                  placeholder="Search drugs, classes, mechanisms, uses, or side effects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid var(--divider-color)',
                    borderRadius: 'var(--border-radius)',
                    fontSize: '1rem',
                    backgroundColor: 'var(--surface-color)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>
              <select
                value={searchField}
                onChange={(e) => setSearchField(e.target.value as any)}
                style={{
                  padding: '12px',
                  border: '2px solid var(--divider-color)',
                  borderRadius: 'var(--border-radius)',
                  backgroundColor: 'var(--surface-color)',
                  color: 'var(--text-primary)',
                  minWidth: '120px'
                }}
              >
                <option value="all">All Fields</option>
                <option value="name">Drug Name</option>
                <option value="moa">Mechanism</option>
                <option value="uses">Uses</option>
                <option value="side_effects">Side Effects</option>
              </select>
            </div>
            
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className={`btn ${showAdvancedFilters ? 'btn-primary' : 'btn-outline'}`}
                style={{ fontSize: '0.875rem' }}
              >
                🔍 Advanced Filters
              </button>
              
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  style={{
                    padding: '6px 8px',
                    border: '1px solid var(--divider-color)',
                    borderRadius: 'var(--border-radius)',
                    backgroundColor: 'var(--surface-color)',
                    color: 'var(--text-primary)',
                    fontSize: '0.875rem'
                  }}
                >
                  <option value="name">Name</option>
                  <option value="class">Class</option>
                  <option value="system">System</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="btn btn-outline"
                  style={{ fontSize: '0.875rem', padding: '6px 8px' }}
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </button>
              </div>
              
              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.875rem' }}
                >
                  Clear All
                </button>
              )}
            </div>
          </div>

          {/* Advanced Filters Panel */}
          {showAdvancedFilters && (
            <div className="card" style={{ background: 'var(--background-color)' }}>
              <h4 style={{ marginBottom: '16px' }}>Advanced Filters</h4>
              
              {/* Drug Classes Filter */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Drug Classes ({selectedClasses.length} selected)
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxHeight: '120px', overflowY: 'auto' }}>
                  {availableClasses.map(drugClass => (
                    <button
                      key={drugClass}
                      onClick={() => {
                        setSelectedClasses(prev =>
                          prev.includes(drugClass)
                            ? prev.filter(c => c !== drugClass)
                            : [...prev, drugClass]
                        );
                      }}
                      className={`btn ${selectedClasses.includes(drugClass) ? 'btn-primary' : 'btn-outline'}`}
                      style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                    >
                      {drugClass}
                    </button>
                  ))}
                </div>
              </div>

              {/* Uses Filter */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Clinical Uses ({selectedUses.length} selected)
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxHeight: '120px', overflowY: 'auto' }}>
                  {availableUses.slice(0, 20).map(use => (
                    <button
                      key={use}
                      onClick={() => {
                        setSelectedUses(prev =>
                          prev.includes(use)
                            ? prev.filter(u => u !== use)
                            : [...prev, use]
                        );
                      }}
                      className={`btn ${selectedUses.includes(use) ? 'btn-primary' : 'btn-outline'}`}
                      style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                    >
                      {use}
                    </button>
                  ))}
                  {availableUses.length > 20 && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', padding: '4px 8px' }}>
                      +{availableUses.length - 20} more...
                    </span>
                  )}
                </div>
              </div>

              {/* Side Effects Filter */}
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Side Effects ({selectedSideEffects.length} selected)
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxHeight: '120px', overflowY: 'auto' }}>
                  {availableSideEffects.slice(0, 20).map(effect => (
                    <button
                      key={effect}
                      onClick={() => {
                        setSelectedSideEffects(prev =>
                          prev.includes(effect)
                            ? prev.filter(e => e !== effect)
                            : [...prev, effect]
                        );
                      }}
                      className={`btn ${selectedSideEffects.includes(effect) ? 'btn-primary' : 'btn-outline'}`}
                      style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                    >
                      {effect}
                    </button>
                  ))}
                  {availableSideEffects.length > 20 && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', padding: '4px 8px' }}>
                      +{availableSideEffects.length - 20} more...
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* System Filter Tabs */}
          <div className="card">
            <h3 style={{ marginBottom: '16px' }}>Filter by System</h3>
            <div style={{ 
              display: 'flex', 
              gap: '8px', 
              overflowX: 'auto',
              paddingBottom: '8px'
            }}>
              {systems.map((system) => (
                <button
                  key={system.key}
                  onClick={() => setSelectedSystem(system.key)}
                  className={`btn ${selectedSystem === system.key ? 'btn-primary' : 'btn-outline'}`}
                  style={{
                    minWidth: 'fit-content',
                    whiteSpace: 'nowrap',
                    fontSize: '0.875rem',
                    padding: '8px 16px'
                  }}
                >
                  {system.icon} {system.label}
                </button>
              ))}
            </div>
          </div>

          {/* Results Summary */}
          <div className="card">
            <div className="flex flex-between" style={{ alignItems: 'center' }}>
              <div>
                <h3>
                  {selectedSystem === 'all' ? 'All Drugs' : 
                   systems.find(s => s.key === selectedSystem)?.label}
                </h3>
                <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                  {sortedDrugs.length} drug{sortedDrugs.length !== 1 ? 's' : ''} found
                  {searchTerm && ` for "${searchTerm}"`}
                  {hasActiveFilters && (
                    <span style={{ fontSize: '0.8rem', marginLeft: '8px' }}>
                      (filtered)
                    </span>
                  )}
                </p>
              </div>
              {selectedSystem !== 'all' && (
                <div style={{ fontSize: '2rem' }}>
                  {systems.find(s => s.key === selectedSystem)?.icon}
                </div>
              )}
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="loading">
              <div className="spinner"></div>
            </div>
          )}

          {/* Drug Groups */}
          {!loading && Object.keys(groupedDrugs).length > 0 && (
            <div>
              {Object.entries(groupedDrugs)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([drugClass, classDrugs]) => (
                  <div key={drugClass} className="card fade-in">
                    <div className="card-header">
                      <h4 className="card-title">{drugClass}</h4>
                      <span className="badge">{classDrugs.length}</span>
                    </div>
                    <div className="list">
                      {classDrugs
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .map((drug) => (
                          <Link
                            key={drug.id}
                            to={`/drug/${drug.id}`}
                            className="list-item"
                          >
                            <div className="list-item-content">
                              <div className="list-item-title">{drug.name}</div>
                              <div className="list-item-subtitle">
                                {drug.system} • {drug.moa}
                              </div>
                              <div style={{ 
                                marginTop: '4px',
                                display: 'flex',
                                gap: '4px',
                                flexWrap: 'wrap'
                              }}>
                                {drug.uses.slice(0, 3).map((use, index) => (
                                  <span 
                                    key={index}
                                    className="badge badge-secondary"
                                    style={{ fontSize: '0.7rem' }}
                                  >
                                    {use}
                                  </span>
                                ))}
                                {drug.uses.length > 3 && (
                                  <span className="badge badge-secondary" style={{ fontSize: '0.7rem' }}>
                                    +{drug.uses.length - 3} more
                                  </span>
                                )}
                              </div>
                            </div>
                            <div style={{ 
                              fontSize: '1.5rem',
                              color: systems.find(s => s.key === drug.system)?.color || 'var(--text-secondary)'
                            }}>
                              {systems.find(s => s.key === drug.system)?.icon || '💊'}
                            </div>
                          </Link>
                        ))}
                    </div>
                  </div>
                ))}
            </div>
          )}

          {/* No Results */}
          {!loading && sortedDrugs.length === 0 && (
            <div className="card text-center">
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🔍</div>
              <h3>No drugs found</h3>
              <p style={{ color: 'var(--text-secondary)' }}>
                {searchTerm 
                  ? `No drugs match "${searchTerm}". Try a different search term.`
                  : 'No drugs available in this system.'
                }
              </p>
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')}
                  className="btn btn-outline"
                  style={{ marginTop: '16px' }}
                >
                  Clear Search
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default DrugListScreen;