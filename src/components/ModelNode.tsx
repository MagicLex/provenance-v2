import React from 'react';
import { Handle, Position } from 'reactflow';
import FilterButton from './FilterButton';

const ModelNode = ({ data }: { data: any }) => {
  return (
    <div className="node model-node">
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
      
      {/* Filter button to show only connections related to this node */}
      {data.onFilter && (
        <FilterButton 
          nodeId={data.id} 
          onClick={data.onFilter} 
        />
      )}
      
      <div className="node-header">
        <div className="node-type">Model</div>
        <div className="node-title">{data.label}</div>
      </div>
      <div className="node-content">
        <div className="node-property">
          <span className="property-label">Framework:</span>
          <span className="property-value">{data.metadata.framework}</span>
        </div>
        <div className="node-property">
          <span className="property-label">Accuracy:</span>
          <span className="property-value">
            {data.metadata.metrics?.accuracy?.toFixed(3) || 'N/A'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ModelNode;