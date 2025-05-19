import React from 'react';

interface TracingControlsProps {
  nodeId: string | null;
  onTraceUpstream: () => void;
  onTraceDownstream: () => void;
  onTraceBoth: () => void;
  onClearTrace: () => void;
}

const TracingControls: React.FC<TracingControlsProps> = ({
  nodeId,
  onTraceUpstream,
  onTraceDownstream,
  onTraceBoth,
  onClearTrace,
}) => {
  if (!nodeId) return null;

  return (
    <div className="tracing-controls">
      <div className="tracing-header">
        <span className="tracing-title">Connection Tracing</span>
        <span className="tracing-node-id">{nodeId}</span>
      </div>
      
      <div className="tracing-buttons">
        <button 
          className="tracing-button trace-upstream"
          onClick={onTraceUpstream}
          title="Trace all upstream connections (data sources)"
        >
          ⬆️ Upstream
        </button>
        
        <button 
          className="tracing-button trace-downstream"
          onClick={onTraceDownstream}
          title="Trace all downstream connections (data consumers)"
        >
          ⬇️ Downstream
        </button>
        
        <button 
          className="tracing-button trace-both"
          onClick={onTraceBoth}
          title="Trace both upstream and downstream connections"
        >
          ↕️ Both Directions
        </button>
        
        <button 
          className="tracing-button clear-trace"
          onClick={onClearTrace}
          title="Clear all highlighted connections"
        >
          ❌ Clear Trace
        </button>
      </div>
    </div>
  );
};

export default TracingControls;