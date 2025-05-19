import React from 'react';

interface TracingControlsProps {
  nodeId: string | null;
  filteredCount?: number;
  totalCount?: number;
  onClearTrace: () => void;
}

const TracingControls: React.FC<TracingControlsProps> = ({
  nodeId,
  filteredCount,
  totalCount,
  onClearTrace,
}) => {
  if (!nodeId) return null;

  // Format the node ID for display
  const displayName = () => {
    const parts = nodeId.split('-');
    // Handle specific node types differently
    if (parts[0] === 'fg') return `Feature Group ${parts[1]}`;
    if (parts[0] === 'fv') return `Feature View ${parts[1]}`;
    if (parts[0] === 'td') return `Training Dataset ${parts[1]}`;
    if (parts[0] === 'model') return `Model ${parts[1]}`;
    if (parts[0] === 'deploy') return `Deployment ${parts[1]}`;
    if (parts[0] === 'source') return `Source ${parts[1]}`;
    
    // Fallback for unknown types
    return parts.map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
  };

  return (
    <div className="tracing-controls">
      <div className="tracing-header">
        <span className="tracing-title">Filtered View</span>
        <span className="tracing-node-id">
          <span className="tracing-node-label">Selected:</span> {displayName()}
        </span>
      </div>
      
      <div className="tracing-info">
        Showing only the nodes and connections directly related to <strong>{displayName()}</strong>.
        {filteredCount !== undefined && totalCount !== undefined && (
          <div className="tracing-stats">
            <span className="stats-count">
              Showing {filteredCount} of {totalCount} nodes ({Math.round(filteredCount/totalCount * 100)}%)
            </span>
          </div>
        )}
      </div>
      
      <div className="tracing-buttons">
        <button 
          className="tracing-button clear-trace"
          onClick={onClearTrace}
          title="Show all nodes again"
        >
          🔍 Return to Full View
        </button>
      </div>
    </div>
  );
};

export default TracingControls;