import React from 'react';
import { Handle, Position } from 'reactflow';

const FeatureGroupNode = ({ data }: { data: any }) => {
  return (
    <div className="node feature-group-node">
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
      
      <div className="node-header">
        <div className="node-type">Feature Group</div>
        <div className="node-title">{data.label}</div>
      </div>
      <div className="node-content">
        <div className="node-property">
          <span className="property-label">Version:</span>
          <span className="property-value">{data.metadata.version}</span>
        </div>
        <div className="node-property">
          <span className="property-label">Features:</span>
          <span className="property-value">
            {Array.isArray(data.metadata.features) 
              ? `${data.metadata.features.length} features` 
              : 'N/A'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default FeatureGroupNode;