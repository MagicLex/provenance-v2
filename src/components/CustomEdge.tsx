import React from 'react';
import { EdgeProps, getBezierPath, EdgeText } from 'reactflow';

const CustomEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data,
  markerEnd,
}: EdgeProps) => {
  // Calculate a more pronounced curve for the path
  // especially if the nodes are derived (to better show hierarchy)
  const isDerivedConnection = data?.isDerived;
  
  // Increase the curvature for derived connections
  const curvature = isDerivedConnection ? 0.5 : 0.25;
  
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetPosition,
    targetX,
    targetY,
    curvature, // Apply custom curvature
  });

  const count = data?.count;
  const isAggregated = count && count > 1;
  
  // Change stroke color and style based on connection type
  const getStrokeStyle = () => {
    if (isAggregated) {
      return {
        strokeWidth: Math.min(Math.max(1, count / 10), 5),
        stroke: '#6C8EBF',
        strokeDasharray: '5 5'
      };
    }
    
    if (isDerivedConnection) {
      return {
        strokeWidth: 2,
        stroke: '#82B366', // Green for derivation
      };
    }
    
    return {
      strokeWidth: 1.5,
      stroke: '#6C8EBF', // Default blue color
    };
  };

  return (
    <>
      <path
        id={id}
        style={{
          ...style,
          ...getStrokeStyle(),
        }}
        className={`react-flow__edge-path ${isAggregated ? 'aggregated-edge' : ''} ${isDerivedConnection ? 'derived-edge' : ''}`}
        d={edgePath}
        markerEnd={markerEnd}
      />
      {isAggregated && (
        <EdgeText
          x={labelX}
          y={labelY}
          label={`${count} connections`}
          labelStyle={{ fill: '#555', fontWeight: 500, fontSize: 12 }}
          labelBgStyle={{ fill: 'white', fillOpacity: 0.9, rx: 4 }}
          labelBgPadding={[3, 6]}
          labelBgBorderRadius={4}
        />
      )}
    </>
  );
};

export default CustomEdge;