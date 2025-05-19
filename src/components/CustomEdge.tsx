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
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const count = data?.count;
  const isAggregated = count && count > 1;

  return (
    <>
      <path
        id={id}
        style={{
          ...style,
          strokeWidth: isAggregated ? Math.min(Math.max(1, count / 10), 5) : 1,
        }}
        className={`react-flow__edge-path ${isAggregated ? 'aggregated-edge' : ''}`}
        d={edgePath}
        markerEnd={markerEnd}
      />
      {isAggregated && (
        <EdgeText
          x={labelX}
          y={labelY}
          label={`${count} connections`}
          labelStyle={{ fill: '#888', fontWeight: 500, fontSize: 12 }}
          labelBgStyle={{ fill: 'white', fillOpacity: 0.75, rx: 4 }}
          labelBgPadding={[2, 4]}
          labelBgBorderRadius={4}
        />
      )}
    </>
  );
};

export default CustomEdge;