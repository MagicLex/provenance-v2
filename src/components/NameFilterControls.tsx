import React, { useState, useEffect } from 'react';

interface NameFilterControlsProps {
  onFilterChange: (nameFilter: string, nodeType: string | null) => void;
  nodeTypeFilter: string | null;
  nameFilter: string;
}

const NameFilterControls: React.FC<NameFilterControlsProps> = ({
  onFilterChange,
  nodeTypeFilter,
  nameFilter,
}) => {
  // Local state for filter inputs
  const [localNameFilter, setLocalNameFilter] = useState(nameFilter);
  const [localNodeType, setLocalNodeType] = useState<string | null>(nodeTypeFilter);

  // Update local state when props change
  useEffect(() => {
    setLocalNameFilter(nameFilter);
    setLocalNodeType(nodeTypeFilter);
  }, [nameFilter, nodeTypeFilter]);

  // Handle input changes
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalNameFilter(e.target.value);
  };

  const handleNodeTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value === 'all' ? null : e.target.value;
    setLocalNodeType(value);
  };

  // Apply filters on button click
  const applyFilter = () => {
    onFilterChange(localNameFilter.trim(), localNodeType);
  };

  // Clear filters
  const clearFilter = () => {
    setLocalNameFilter('');
    setLocalNodeType(null);
    onFilterChange('', null);
  };

  // Apply filter on enter key press
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      applyFilter();
    }
  };

  return (
    <div className="name-filter-controls">
      <h3>Filter by Name</h3>
      
      <div className="filter-form">
        <div className="filter-input-group">
          <label htmlFor="nodeTypeSelect">Node Type:</label>
          <select 
            id="nodeTypeSelect" 
            value={localNodeType || 'all'} 
            onChange={handleNodeTypeChange}
            className="node-type-select"
          >
            <option value="all">All Types</option>
            <option value="model">Models</option>
            <option value="trainingDataset">Training Datasets</option>
            <option value="deployment">Deployments</option>
          </select>
        </div>
        
        <div className="filter-input-group">
          <label htmlFor="nameFilterInput">Name Contains:</label>
          <input
            id="nameFilterInput"
            type="text"
            value={localNameFilter}
            onChange={handleNameChange}
            onKeyPress={handleKeyPress}
            placeholder="Enter name..."
            className="name-filter-input"
          />
        </div>
        
        <div className="filter-buttons">
          <button 
            className="filter-apply-button" 
            onClick={applyFilter}
            disabled={!localNameFilter.trim()}
          >
            Apply Filter
          </button>
          
          <button 
            className="filter-clear-button" 
            onClick={clearFilter}
            disabled={!nameFilter && !nodeTypeFilter}
          >
            Clear
          </button>
        </div>
      </div>
      
      {(nameFilter || nodeTypeFilter) && (
        <div className="active-filter-badge">
          <span className="filter-type">
            {nodeTypeFilter 
              ? nodeTypeFilter.charAt(0).toUpperCase() + nodeTypeFilter.slice(1) 
              : 'All types'}
          </span>
          {nameFilter && (
            <span className="filter-value">
              containing "{nameFilter}"
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default NameFilterControls;