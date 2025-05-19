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
    // Use edge ID to get a deterministic but varied opacity
    const opacity = 0.7 + (edgeIdHash % 30) / 100;
    
    // If the edge is highlighted, give it special styling
    if (isHighlighted) {
      return {
        strokeWidth: 3.5,
        stroke: '#FF5722', // Bright orange for highlighting
        filter: 'drop-shadow(0 0 8px rgba(255, 87, 34, 0.7))',
        strokeDasharray: isDerivedConnection ? '8 4' : undefined,
        strokeLinecap: 'round',
        strokeLinejoin: 'round'
      };
    }
    
    if (isAggregated) {
      return {
        strokeWidth: Math.min(Math.max(1, count / 10), 5),
        stroke: `rgba(108, 142, 191, ${opacity})`,
        strokeDasharray: '5 5',
        filter: 'drop-shadow(0 0 1px rgba(108, 142, 191, 0.3))'
      };
    }
    
    if (isDerivedConnection) {
      // Create slight color variations for derived edges
      const hueShift = (edgeIdHash % 20) - 10; // -10 to +10 hue shift
      return {
        strokeWidth: 2,
        stroke: `rgba(130, ${179 + hueShift}, ${102 + hueShift}, ${opacity})`, // Slightly varied green
        filter: 'drop-shadow(0 0 2px rgba(130, 179, 102, 0.3))'
      };
    }
    
    // For regular connections, add subtle variations
    const blueVariation = (edgeIdHash % 30) - 15; // -15 to +15
    return {
      strokeWidth: 1.5,
      stroke: `rgba(${108 + blueVariation}, ${142 + blueVariation}, ${191 + blueVariation}, ${opacity})`,
      filter: 'drop-shadow(0 0 1px rgba(108, 142, 191, 0.2))'
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