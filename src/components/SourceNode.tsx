import React from 'react';
import { Handle, Position } from 'reactflow';
import FilterButton from './FilterButton';

const SourceNode = ({ data }: { data: any }) => {
  return (
    <div className="node source-node">
      <Handle type="source" position={Position.Bottom} />
      
      {/* Filter button to show only connections related to this node */}
      {data.onFilter && (
        <FilterButton 
          nodeId={data.id} 
          onClick={data.onFilter} 
        />
      )}
      
      <div className="node-header">
        <div className="node-type">Source</div>
        <div className="node-title">{data.label}</div>
      </div>
      <div className="node-content">
        <div className="node-property">
          <span className="property-label">Type:</span>
          <span className="property-value">{data.metadata.type}</span>
        </div>
        <div className="node-property">
          <span className="property-label">Connector:</span>
          <span className="property-value">{data.metadata.connectorType}</span>
        </div>
      </div>
    </div>
  );
};

export default SourceNode;