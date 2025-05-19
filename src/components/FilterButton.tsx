import React from 'react';

interface FilterButtonProps {
  nodeId: string;
  onClick: (nodeId: string) => void;
}

const FilterButton: React.FC<FilterButtonProps> = ({ nodeId, onClick }) => {
  return (
    <button
      className="node-filter-button"
      title="Filter to show only connections related to this node"
      onClick={(e) => {
        e.stopPropagation(); // Prevent node selection event from triggering
        onClick(nodeId);
      }}
    >
      <span className="filter-icon">🔍</span>
    </button>
  );
};

export default FilterButton;