import React from 'react';
import { Handle, Position } from 'reactflow';
import FilterButton from './FilterButton';

const CollapsedGroupNode = ({ data }: { data: any }) => {
  const groupLabels: Record<string, string> = {
    source: 'Data Sources',
    featureGroup: 'Feature Groups',
    featureView: 'Feature Views',
    trainingDataset: 'Training Datasets',
    model: 'Models',
    deployment: 'Deployments'
  };

  const groupLabel = groupLabels[data.group] || data.group;
  
  return (
    <div className={`node collapsed-group-node collapsed-${data.group}`}>
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
        <div className="node-type">Collapsed Group</div>
        <div className="node-title">{groupLabel}</div>
      </div>
      <div className="node-content">
        <div className="node-count">{data.count} items</div>
        <button 
          className="expand-button"
          onClick={() => data.onExpand && data.onExpand(data.group)}
        >
          Expand Group
        </button>
      </div>
    </div>
  );
};

export default CollapsedGroupNode;