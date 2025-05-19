import React, { useCallback, useState, useMemo } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  useReactFlow,
  useNodesState,
  useEdgesState,
  MarkerType,
  Node,
  Edge,
  NodeTypes,
  EdgeTypes,
  ConnectionLineType,
} from 'reactflow';
import 'reactflow/dist/style.css';

import useGroupState from './hooks/useGroupState';
import { mockNodes, mockEdges } from './mockData';
import { HopsworksNode, CollapsedGroup } from './types';

// Import custom node components
import SourceNode from './components/SourceNode';
import FeatureGroupNode from './components/FeatureGroupNode';
import FeatureViewNode from './components/FeatureViewNode';
import TrainingDatasetNode from './components/TrainingDatasetNode';
import ModelNode from './components/ModelNode';
import DeploymentNode from './components/DeploymentNode';
import CollapsedGroupNode from './components/CollapsedGroupNode';
import GroupControls from './components/GroupControls';
import CustomEdge from './components/CustomEdge';
import NodeTooltip from './components/NodeTooltip';
import TracingControls from './components/TracingControls';

import './ProvenanceGraph.css';

// Define custom node types
const nodeTypes: NodeTypes = {
  source: SourceNode,
  featureGroup: FeatureGroupNode,
  featureView: FeatureViewNode,
  trainingDataset: TrainingDatasetNode,
  model: ModelNode,
  deployment: DeploymentNode,
  collapsedGroup: CollapsedGroupNode,
};

// Define custom edge types
const edgeTypes: EdgeTypes = {
  custom: CustomEdge,
};

interface ProvenanceGraphProps {
  data?: {
    nodes: HopsworksNode[];
    edges: Edge[];
  };
  onNodeClick?: (node: Node) => void;
}

// Base vertical positions for each layer type with some flexibility
const layerPositionsRange: Record<string, {base: number, variance: number}> = {
  source: { base: 0, variance: 40 },
  featureGroup: { base: 200, variance: 60 },
  featureView: { base: 400, variance: 40 },
  trainingDataset: { base: 600, variance: 80 },
  model: { base: 800, variance: 100 },
  deployment: { base: 1000, variance: 60 },
};

const ProvenanceGraphInner: React.FC<ProvenanceGraphProps> = ({ 
  data = { nodes: mockNodes, edges: mockEdges },
  onNodeClick
}) => {
  const reactFlowInstance = useReactFlow();
  
  // State for tooltips
  const [tooltipData, setTooltipData] = useState<HopsworksNode | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  
  // State for connection highlighting
  const [highlightedNodeId, setHighlightedNodeId] = useState<string | null>(null);
  const [highlightedNodes, setHighlightedNodes] = useState<Set<string>>(new Set());
  const [highlightedEdges, setHighlightedEdges] = useState<Set<string>>(new Set());
  
  // Use the group state hook for collapsible groups
  const { groupState, toggleGroup, visibleNodes, visibleEdges } = useGroupState(
    data.nodes,
    data.edges,
    ['trainingDataset', 'model'] // Initially collapsed groups
  );
  
  // Helper to find all parent nodes of a given node
  const findParentNodes = useCallback((nodeId: string, edges: Edge[]) => {
    return edges
      .filter(edge => edge.target === nodeId)
      .map(edge => edge.source);
  }, []);
  
  // Helper to find all child nodes of a given node
  const findChildNodes = useCallback((nodeId: string, edges: Edge[]) => {
    return edges
      .filter(edge => edge.source === nodeId)
      .map(edge => edge.target);
  }, []);
  
  // Function to trace connections through the graph
  const traceConnections = useCallback((nodeId: string | null, direction: 'upstream' | 'downstream' | 'both') => {
    if (!nodeId) {
      // Clear highlights if no node selected
      setHighlightedNodes(new Set());
      setHighlightedEdges(new Set());
      return;
    }
    
    const connectedNodes = new Set<string>([nodeId]);
    const connectedEdges = new Set<string>();
    
    // Recursively find all upstream nodes (parents)
    const findAllUpstream = (currentNodeId: string, edges: Edge[], visited = new Set<string>()) => {
      if (visited.has(currentNodeId)) return;
      visited.add(currentNodeId);
      
      const parents = findParentNodes(currentNodeId, edges);
      
      parents.forEach(parentId => {
        connectedNodes.add(parentId);
        
        // Find and add the edge between parent and current node
        const edge = edges.find(e => e.source === parentId && e.target === currentNodeId);
        if (edge) connectedEdges.add(edge.id);
        
        // Continue recursively
        findAllUpstream(parentId, edges, visited);
      });
    };
    
    // Recursively find all downstream nodes (children)
    const findAllDownstream = (currentNodeId: string, edges: Edge[], visited = new Set<string>()) => {
      if (visited.has(currentNodeId)) return;
      visited.add(currentNodeId);
      
      const children = findChildNodes(currentNodeId, edges);
      
      children.forEach(childId => {
        connectedNodes.add(childId);
        
        // Find and add the edge between current node and child
        const edge = edges.find(e => e.source === currentNodeId && e.target === childId);
        if (edge) connectedEdges.add(edge.id);
        
        // Continue recursively
        findAllDownstream(childId, edges, visited);
      });
    };
    
    // Trace in the requested direction(s)
    if (direction === 'upstream' || direction === 'both') {
      findAllUpstream(nodeId, visibleEdges);
    }
    
    if (direction === 'downstream' || direction === 'both') {
      findAllDownstream(nodeId, visibleEdges);
    }
    
    setHighlightedNodes(connectedNodes);
    setHighlightedEdges(connectedEdges);
    
  }, [findParentNodes, findChildNodes, visibleEdges]);

  // Add highlighting classes to nodes
  const applyNodeHighlighting = useCallback((nodes: Node[]) => {
    return nodes.map(node => {
      const isHighlighted = highlightedNodes.has(node.id);
      return {
        ...node,
        className: `${node.className || ''} ${isHighlighted ? 'highlighted' : ''}`.trim()
      };
    });
  }, [highlightedNodes]);

  // Transform nodes with positions using hierarchical layout
  const layoutNodes = useMemo(() => {
    // Step 1: Create a map to track node positions and hierarchy levels
    const nodeMap = new Map();
    const nodeLevels = new Map();
    const childrenByParent = new Map();
    const parentsByNode = new Map();

    // Step 2: Identify parent-child relationships
    visibleEdges.forEach(edge => {
      const parents = parentsByNode.get(edge.target) || [];
      parents.push(edge.source);
      parentsByNode.set(edge.target, parents);
      
      const children = childrenByParent.get(edge.source) || [];
      children.push(edge.target);
      childrenByParent.set(edge.source, children);
    });

    // Step 3: Identify root nodes (nodes with no parents but have children)
    const rootNodes = visibleNodes
      .filter(node => {
        const parents = parentsByNode.get(node.id) || [];
        const children = childrenByParent.get(node.id) || [];
        return parents.length === 0 && (children.length > 0 || node.type === 'source');
      })
      .map(node => node.id);

    // Step 4: Assign initial levels and positions
    const assignLevel = (nodeId: string, level: number, visited = new Set()) => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);

      const currentLevel = nodeLevels.get(nodeId) || 0;
      nodeLevels.set(nodeId, Math.max(level, currentLevel));
      
      const children = childrenByParent.get(nodeId) || [];
      children.forEach(childId => {
        assignLevel(childId, level + 1, visited);
      });
    };

    rootNodes.forEach(nodeId => assignLevel(nodeId, 0));

    // Step 5: Position nodes based on their type and level
    return visibleNodes.map(node => {
      const nodeType = node.type === 'collapsedGroup' 
        ? (node as CollapsedGroup).group 
        : node.type;
      
      // For collapsed groups, position them centrally
      if (node.type === 'collapsedGroup') {
        return {
          ...node,
          position: { 
            x: 400, // Center position 
            y: layerPositionsRange[nodeType]?.base || 0
          },
          data: {
            ...node,
            onExpand: toggleGroup,
          },
          style: {
            width: 250,
            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.15)',
            transform: 'scale(1.05)',
            zIndex: 10,
            opacity: highlightedNodes.size > 0 ? 0.25 : 1,
          },
        };
      }

      // Get all nodes of this type to determine x-position
      const sameTypeNodes = visibleNodes.filter(n => {
        const nType = n.type === 'collapsedGroup' 
          ? (n as CollapsedGroup).group 
          : n.type;
        return nType === nodeType && n.type !== 'collapsedGroup';
      });
      
      const nodeIndex = sameTypeNodes.findIndex(n => n.id === node.id);
      
      // Special positioning for derived feature groups
      const isDerivedFeatureGroup = 
        nodeType === 'featureGroup' && 
        (node.id === 'fg-4' || node.id === 'fg-5');
      
      // Get layer positioning info
      const layerInfo = layerPositionsRange[nodeType] || { base: 0, variance: 0 };
      
      // Create a deterministic but seemingly random offset for this node
      // Use the node ID as a seed to ensure consistent positioning
      const nodeIdHash = node.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const randomOffset = (nodeIdHash % 100) / 100; // Between 0 and 1
      
      // Base vertical position based on node type with organic variance
      let yPosition = layerInfo.base + (randomOffset * layerInfo.variance * 2 - layerInfo.variance);
      
      // Calculate horizontal position with organic offset
      let xPosition;
      const horizOffset = Math.sin(nodeIdHash) * 30; // Small horizontal jitter based on node ID
      
      if (isDerivedFeatureGroup) {
        // Position derived feature groups below their parent groups with some organic feel
        yPosition += 120 + (randomOffset * 40 - 20);
        
        // If it's fg-4, position it below fg-1 and fg-2 (its parents) with slight offset
        if (node.id === 'fg-4') {
          // Find midpoint between parents with organic offset
          xPosition = 300 + horizOffset; 
        } 
        // If it's fg-5, position it below fg-1 and fg-3 (its parents) with slight offset
        else if (node.id === 'fg-5') {
          xPosition = 600 + horizOffset;
        }
      } else {
        // Base position with node index
        const baseX = nodeIndex * 300;
        
        // Add some organic variance for regular nodes
        xPosition = baseX + horizOffset;
        
        // Adjust positions for specific node types to maintain relationships but with organic feel
        if (nodeType === 'source') {
          if (node.id === 'source-1') xPosition = horizOffset;
          else if (node.id === 'source-2') xPosition = 300 + horizOffset;
          else if (node.id === 'source-3') xPosition = 600 + horizOffset;
        } 
        else if (nodeType === 'featureGroup' && !isDerivedFeatureGroup) {
          if (node.id === 'fg-1') xPosition = 0 + horizOffset;
          else if (node.id === 'fg-2') xPosition = 300 + horizOffset;
          else if (node.id === 'fg-3') xPosition = 600 + horizOffset;
        }
      }
      
      return {
        ...node,
        position: { 
          x: xPosition, 
          y: yPosition 
        },
        data: {
          ...node,
        },
        style: {
          width: 200,
          boxShadow: '0 3px 8px rgba(0, 0, 0, 0.1)',
          transition: 'all 0.2s ease-in-out',
          opacity: highlightedNodes.size > 0 && !highlightedNodes.has(node.id) ? 0.25 : 1,
          filter: highlightedNodes.has(node.id) ? 'drop-shadow(0 0 10px rgba(66, 133, 244, 0.5))' : 'none',
          zIndex: highlightedNodes.has(node.id) ? 10 : 0,
        },
      };
    });
  }, [visibleNodes, visibleEdges, toggleGroup]);
  
  // Transform edges to use custom edge type with derived connections and highlighting
  const layoutEdges = useMemo(() => {
    return visibleEdges.map(edge => {
      // Check if this is a derived connection
      const isDerived = 
        // Feature groups derived from other feature groups
        (edge.source.startsWith('fg-') && edge.target.startsWith('fg-')) ||
        // Feature groups to feature views
        (edge.source.startsWith('fg-') && edge.target.startsWith('fv-'));
        
      // Special handling for aggregated edges
      const isAggregated = edge.data?.count && edge.data.count > 1;
      
      // Check if this edge is highlighted
      const isHighlighted = highlightedEdges.has(edge.id);
      
      // Determine edge animation based on highlighting and type
      const animated = isHighlighted;
      
      return {
        ...edge,
        type: 'custom', // Use our custom edge component
        animated,
        style: {
          ...edge.style,
          opacity: highlightedEdges.size > 0 && !isHighlighted ? 0.15 : 1,
          zIndex: isHighlighted ? 1000 : 0,
        },
        data: {
          ...edge.data,
          isDerived, // Add this property to be used in CustomEdge
          isHighlighted,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: (isDerived || isHighlighted) ? 22 : 20,
          height: (isDerived || isHighlighted) ? 22 : 20,
        },
      };
    });
  }, [visibleEdges, highlightedEdges]);

  // Node interactions
  const handleNodeMouseEnter = useCallback((event: React.MouseEvent, node: Node) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltipPosition({
      x: rect.right + 10,
      y: rect.top,
    });
    setTooltipData(node.data);
  }, []);

  const handleNodeMouseLeave = useCallback(() => {
    setTooltipData(null);
  }, []);

  const handleNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    // Toggle highlighting when a node is clicked
    if (highlightedNodeId === node.id) {
      // Clear highlighting if the same node is clicked again
      setHighlightedNodeId(null);
      traceConnections(null, 'both');
    } else {
      // Highlight connections for this node
      setHighlightedNodeId(node.id);
      traceConnections(node.id, 'both');
    }
    
    // Also call the external handler if provided
    onNodeClick?.(node);
  }, [onNodeClick, highlightedNodeId, traceConnections]);

  return (
    <div className="provenance-graph-container">
      <div className="controls-panel">
        <GroupControls 
          groupState={groupState}
          toggleGroup={toggleGroup}
        />
        
        {highlightedNodeId && (
          <TracingControls
            nodeId={highlightedNodeId}
            onTraceUpstream={() => traceConnections(highlightedNodeId, 'upstream')}
            onTraceDownstream={() => traceConnections(highlightedNodeId, 'downstream')}
            onTraceBoth={() => traceConnections(highlightedNodeId, 'both')}
            onClearTrace={() => {
              setHighlightedNodeId(null);
              setHighlightedNodes(new Set());
              setHighlightedEdges(new Set());
            }}
          />
        )}
      </div>
      <div className="flow-wrapper">
        <ReactFlow
          nodes={applyNodeHighlighting(layoutNodes)}
          edges={layoutEdges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodeMouseEnter={handleNodeMouseEnter}
          onNodeMouseLeave={handleNodeMouseLeave}
          onNodeClick={handleNodeClick}
          fitView
          attributionPosition="bottom-right"
          connectionLineType={ConnectionLineType.Bezier}
        >
          <Controls />
          <MiniMap 
            nodeStrokeWidth={3}
            zoomable
            pannable
          />
          <Background
            variant="dots"
            gap={20}
            size={1.5}
            color="rgba(0, 0, 0, 0.03)"
          />
        </ReactFlow>
        {tooltipData && (
          <div 
            className="tooltip-container"
            style={{
              position: 'absolute',
              left: `${tooltipPosition.x}px`,
              top: `${tooltipPosition.y}px`,
              zIndex: 1000,
            }}
          >
            <NodeTooltip data={tooltipData} />
          </div>
        )}
      </div>
    </div>
  );
};

// Wrap with ReactFlowProvider for access to the instance
const ProvenanceGraph: React.FC<ProvenanceGraphProps> = (props) => {
  return (
    <ReactFlowProvider>
      <ProvenanceGraphInner {...props} />
    </ReactFlowProvider>
  );
};

export default ProvenanceGraph;