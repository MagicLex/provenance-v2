import React from 'react';
import { Handle, Position, NodeToolbar } from 'reactflow';
import FilterButton from './FilterButton';

const FeatureGroupNode = ({ data }: { data: any }) => {
  // Create tooltip content
  const getTooltipContent = () => (
    <div className="node-tooltip">
      <div className="tooltip-header">
        <div className="tooltip-type">Feature Group</div>
        <div className="tooltip-title">{data.label}</div>
      </div>
      <div className="tooltip-content">
        <div className="tooltip-property">
          <span className="tooltip-label">Version:</span>
          <span className="tooltip-value">{data.metadata.version}</span>
        </div>
        <div className="tooltip-property">
          <span className="tooltip-label">Created:</span>
          <span className="tooltip-value">
            {new Date(data.metadata.created).toLocaleString()}
          </span>
        </div>
        <div className="tooltip-property">
          <span className="tooltip-label">Features:</span>
          <span className="tooltip-value">
            {Array.isArray(data.metadata.features) 
              ? data.metadata.features.join(', ')
              : 'N/A'}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <NodeToolbar 
        className="node-custom-toolbar"
        position={Position.Right}
        isVisible={true}
        offset={5}
      >
        {getTooltipContent()}
      </NodeToolbar>
      
      <div className="node feature-group-node">
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
    </>
  );
};

export default FeatureGroupNode;