import React from 'react';
import { EdgeProps, getBezierPath, EdgeText } from 'reactflow';

// Define a custom circle marker
const CircleMarker = ({ id, color = '#57606a', size = 3 }) => (
  <marker
    id={id}
    viewBox="0 0 10 10"
    refX="5"
    refY="5"
    markerWidth={size}
    markerHeight={size}
  >
    <circle cx="5" cy="5" r="4" fill={color} stroke="none" />
  </marker>
);

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
  
  // Generate a slightly different curvature for each edge to make flow more organic
  // Use the edge ID to create a deterministic random-like value
  const edgeIdHash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const randomFactor = (edgeIdHash % 100) / 300; // Small random factor

  // Increase the curvature for derived connections and add slight variation
  const curvature = isDerivedConnection ? 0.5 + randomFactor : 0.25 + randomFactor;
  
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
  
  // Get whether this edge is highlighted
  const isHighlighted = data?.isHighlighted;
  
  // Change stroke color and style based on connection type and highlight status
  const getStrokeStyle = () => {
    // Use a lower base opacity for subtler lines
    const opacity = 0.5 + (edgeIdHash % 20) / 100;
    
    // If the edge is highlighted, give it special styling
    if (isHighlighted) {
      return {
        strokeWidth: 1.5,
        stroke: '#0969da', // GitHub blue for highlighting
        strokeDasharray: undefined,
        strokeLinecap: 'square',
        filter: 'none'
      };
    }
    
    if (isAggregated) {
      return {
        strokeWidth: Math.min(Math.max(0.75, count / 15), 2),
        stroke: `rgba(87, 96, 106, ${opacity})`, // GitHub gray
        strokeDasharray: '3 3',
        filter: 'none'
      };
    }
    
    if (isDerivedConnection) {
      return {
        strokeWidth: 1,
        stroke: `rgba(87, 96, 106, ${opacity + 0.1})`, // Slightly darker GitHub gray
        strokeDasharray: '2 2',
        filter: 'none'
      };
    }
    
    // For regular connections, keep it simple and light
    return {
      strokeWidth: 1,
      stroke: `rgba(87, 96, 106, ${opacity})`, // GitHub gray
      filter: 'none'
    };
  };

  // Create marker ID specific to this edge to change color
  const markerId = isHighlighted ? 'circle-marker-highlighted' : 'circle-marker';
  const markerColor = isHighlighted ? '#0969da' : '#57606a';
  
  return (
    <>
      <defs>
        <CircleMarker id={markerId} color={markerColor} />
      </defs>
      <path
        id={id}
        style={{
          ...style,
          ...getStrokeStyle(),
        }}
        className={`react-flow__edge-path ${isAggregated ? 'aggregated-edge' : ''} ${isDerivedConnection ? 'derived-edge' : ''}`}
        d={edgePath}
        markerEnd={`url(#${markerId})`}
      />
      {isAggregated && (
        <EdgeText
          x={labelX}
          y={labelY}
          label={`${count} connections`}
          labelStyle={{ fill: '#57606a', fontWeight: 500, fontSize: 11, fontFamily: 'ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, monospace' }}
          labelBgStyle={{ fill: 'white', fillOpacity: 0.95, stroke: '#d0d7de', strokeWidth: 1 }}
          labelBgPadding={[2, 5]}
          labelBgBorderRadius={2}
        />
      )}
    </>
  );
};

export default CustomEdge;