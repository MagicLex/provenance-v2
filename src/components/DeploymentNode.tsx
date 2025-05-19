import React from 'react';
import { Handle, Position } from 'reactflow';

const DeploymentNode = ({ data }: { data: any }) => {
  return (
    <div className="node deployment-node">
      <Handle type="target" position={Position.Top} />
      
      <div className="node-header">
        <div className="node-type">Deployment</div>
        <div className="node-title">{data.label}</div>
      </div>
      <div className="node-content">
        <div className="node-property">
          <span className="property-label">Status:</span>
          <span className="property-value">{data.metadata.status}</span>
        </div>
        <div className="node-property">
          <span className="property-label">Deployed:</span>
          <span className="property-value">
            {new Date(data.metadata.deployedAt).toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default DeploymentNode;