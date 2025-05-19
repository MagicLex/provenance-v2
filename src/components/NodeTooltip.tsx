import React from 'react';

interface NodeTooltipProps {
  data: any;
}

const NodeTooltip: React.FC<NodeTooltipProps> = ({ data }) => {
  if (!data) return null;

  const { metadata, type } = data;
  
  const renderMetadata = () => {
    switch (type) {
      case 'source':
        return (
          <>
            <div className="tooltip-property">
              <span className="tooltip-label">Type:</span>
              <span className="tooltip-value">{metadata.type}</span>
            </div>
            <div className="tooltip-property">
              <span className="tooltip-label">Connector:</span>
              <span className="tooltip-value">{metadata.connectorType}</span>
            </div>
            <div className="tooltip-property">
              <span className="tooltip-label">Last Updated:</span>
              <span className="tooltip-value">
                {new Date(metadata.lastUpdated).toLocaleString()}
              </span>
            </div>
          </>
        );
        
      case 'featureGroup':
        return (
          <>
            <div className="tooltip-property">
              <span className="tooltip-label">Version:</span>
              <span className="tooltip-value">{metadata.version}</span>
            </div>
            <div className="tooltip-property">
              <span className="tooltip-label">Created:</span>
              <span className="tooltip-value">
                {new Date(metadata.created).toLocaleString()}
              </span>
            </div>
            <div className="tooltip-property">
              <span className="tooltip-label">Features:</span>
              <span className="tooltip-value">
                {Array.isArray(metadata.features) 
                  ? metadata.features.join(', ')
                  : 'N/A'}
              </span>
            </div>
          </>
        );
        
      case 'featureView':
        return (
          <>
            <div className="tooltip-property">
              <span className="tooltip-label">Version:</span>
              <span className="tooltip-value">{metadata.version}</span>
            </div>
            <div className="tooltip-property">
              <span className="tooltip-label">Created:</span>
              <span className="tooltip-value">
                {new Date(metadata.created).toLocaleString()}
              </span>
            </div>
            <div className="tooltip-property">
              <span className="tooltip-label">Description:</span>
              <span className="tooltip-value">{metadata.description}</span>
            </div>
            <div className="tooltip-property">
              <span className="tooltip-label">Features:</span>
              <span className="tooltip-value">
                {Array.isArray(metadata.features) 
                  ? metadata.features.join(', ')
                  : 'N/A'}
              </span>
            </div>
          </>
        );
        
      case 'trainingDataset':
        return (
          <>
            <div className="tooltip-property">
              <span className="tooltip-label">Version:</span>
              <span className="tooltip-value">{metadata.version}</span>
            </div>
            <div className="tooltip-property">
              <span className="tooltip-label">Created:</span>
              <span className="tooltip-value">
                {new Date(metadata.created).toLocaleString()}
              </span>
            </div>
            <div className="tooltip-property">
              <span className="tooltip-label">Split Ratio:</span>
              <span className="tooltip-value">{metadata.splitRatio}</span>
            </div>
            <div className="tooltip-property">
              <span className="tooltip-label">Samples:</span>
              <span className="tooltip-value">{metadata.samples.toLocaleString()}</span>
            </div>
            <div className="tooltip-property">
              <span className="tooltip-label">Target:</span>
              <span className="tooltip-value">{metadata.target}</span>
            </div>
          </>
        );
        
      case 'model':
        return (
          <>
            <div className="tooltip-property">
              <span className="tooltip-label">Version:</span>
              <span className="tooltip-value">{metadata.version}</span>
            </div>
            <div className="tooltip-property">
              <span className="tooltip-label">Created:</span>
              <span className="tooltip-value">
                {new Date(metadata.created).toLocaleString()}
              </span>
            </div>
            <div className="tooltip-property">
              <span className="tooltip-label">Framework:</span>
              <span className="tooltip-value">{metadata.framework}</span>
            </div>
            <div className="tooltip-property">
              <span className="tooltip-label">Metrics:</span>
              <div className="tooltip-nested">
                <div className="tooltip-nested-property">
                  <span className="tooltip-nested-label">Accuracy:</span>
                  <span className="tooltip-nested-value">
                    {metadata.metrics?.accuracy?.toFixed(3) || 'N/A'}
                  </span>
                </div>
                <div className="tooltip-nested-property">
                  <span className="tooltip-nested-label">F1 Score:</span>
                  <span className="tooltip-nested-value">
                    {metadata.metrics?.f1Score?.toFixed(3) || 'N/A'}
                  </span>
                </div>
                <div className="tooltip-nested-property">
                  <span className="tooltip-nested-label">AUC:</span>
                  <span className="tooltip-nested-value">
                    {metadata.metrics?.auc?.toFixed(3) || 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </>
        );
        
      case 'deployment':
        return (
          <>
            <div className="tooltip-property">
              <span className="tooltip-label">Version:</span>
              <span className="tooltip-value">{metadata.version}</span>
            </div>
            <div className="tooltip-property">
              <span className="tooltip-label">Deployed:</span>
              <span className="tooltip-value">
                {new Date(metadata.deployedAt).toLocaleString()}
              </span>
            </div>
            <div className="tooltip-property">
              <span className="tooltip-label">Status:</span>
              <span className="tooltip-value">{metadata.status}</span>
            </div>
            {metadata.endpoint && (
              <div className="tooltip-property">
                <span className="tooltip-label">Endpoint:</span>
                <span className="tooltip-value">{metadata.endpoint}</span>
              </div>
            )}
            {metadata.schedule && (
              <div className="tooltip-property">
                <span className="tooltip-label">Schedule:</span>
                <span className="tooltip-value">{metadata.schedule}</span>
              </div>
            )}
          </>
        );
        
      default:
        return (
          <div className="tooltip-property">
            <span className="tooltip-value">No additional details available</span>
          </div>
        );
    }
  };

  return (
    <div className="node-tooltip">
      <div className="tooltip-header">
        <div className="tooltip-type">{type}</div>
        <div className="tooltip-title">{data.label}</div>
      </div>
      <div className="tooltip-content">
        {renderMetadata()}
      </div>
    </div>
  );
};

export default NodeTooltip;