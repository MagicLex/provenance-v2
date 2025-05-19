import React from 'react';
import { Handle, Position } from 'reactflow';

const TrainingDatasetNode = ({ data }: { data: any }) => {
  return (
    <div className="node training-dataset-node">
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
      
      <div className="node-header">
        <div className="node-type">Training Dataset</div>
        <div className="node-title">{data.label}</div>
      </div>
      <div className="node-content">
        <div className="node-property">
          <span className="property-label">Created:</span>
          <span className="property-value">
            {new Date(data.metadata.created).toLocaleDateString()}
          </span>
        </div>
        <div className="node-property">
          <span className="property-label">Samples:</span>
          <span className="property-value">{data.metadata.samples.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};

export default TrainingDatasetNode;