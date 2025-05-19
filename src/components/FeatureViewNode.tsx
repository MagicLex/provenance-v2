import React from 'react';
import { Handle, Position } from 'reactflow';
import FilterButton from './FilterButton';

const FeatureViewNode = ({ data }: { data: any }) => {
  return (
    <div className="node feature-view-node">
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
      
      {/* Filter button to show only connections related to this node */}
      {data.onFilter && (
        <FilterButton 
          nodeId={data.id} 
          onClick={data.onFilter} 
        />
      )}
      
      <div className="node-header">
        <div className="node-type">Feature View</div>
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

export default FeatureViewNode;