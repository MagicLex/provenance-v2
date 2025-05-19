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

// Base vertical positions for each layer type (fixed grid layout)
const layerPositions: Record<string, number> = {
  source: 0,
  featureGroup: 200,
  featureView: 400,
  trainingDataset: 600,
  model: 800,
  deployment: 1000,
};

const ProvenanceGraphInner: React.FC<ProvenanceGraphProps> = ({ 
  data = { nodes: mockNodes, edges: mockEdges },
  onNodeClick
}) => {
  const reactFlowInstance = useReactFlow();
  
  // We'll use ReactFlow's own tooltip functionality instead of custom tooltips
  
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
  const traceConnections = useCallback((nodeId: string | null) => {
    if (!nodeId) {
      // Clear highlights if no node selected
      setHighlightedNodes(new Set());
      setHighlightedEdges(new Set());
      return;
    }
    
    // Before tracing connections, expand any collapsed groups to show all nodes
    Object.keys(groupState).forEach(group => {
      if (groupState[group]) {
        toggleGroup(group);
      }
    });
    
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
    
    // Always trace both directions
    findAllUpstream(nodeId, visibleEdges);
    findAllDownstream(nodeId, visibleEdges);
    
    setHighlightedNodes(connectedNodes);
    setHighlightedEdges(connectedEdges);
    
  }, [findParentNodes, findChildNodes, visibleEdges, groupState, toggleGroup]);

  // Add highlighting classes to nodes and sort them for proper layering
  const applyNodeHighlighting = useCallback((nodes: Node[]) => {
    // First sort nodes by layer for proper rendering order
    const sortedNodes = [...nodes].sort((a, b) => {
      // Get node types
      const aType = a.type === 'collapsedGroup' 
        ? (a as any).data.group
        : a.type;
      const bType = b.type === 'collapsedGroup'
        ? (b as any).data.group
        : b.type;
      
      // Get layer positions
      const aPos = layerPositions[aType] || 0;
      const bPos = layerPositions[bType] || 0;
      
      // Sort by vertical position first
      if (aPos !== bPos) return aPos - bPos;
      
      // Then by horizontal position for nodes in the same layer
      return a.position.x - b.position.x;
    });
    
    // Then apply the highlighting
    return sortedNodes.map(node => {
      const isHighlighted = highlightedNodes.has(node.id);
      return {
        ...node,
        className: `${node.className || ''} ${isHighlighted ? 'highlighted' : ''}`.trim()
      };
    });
  }, [highlightedNodes, layerPositions]);

  // Filter nodes based on connection tracing
  const filteredNodes = useMemo(() => {
    // If we have highlighted nodes, only show those
    if (highlightedNodes.size > 0) {
      return visibleNodes.filter(node => highlightedNodes.has(node.id));
    }
    // Otherwise show all nodes
    return visibleNodes;
  }, [visibleNodes, highlightedNodes]);

  // Handle direct filtering button click
  const handleFilterClick = useCallback((nodeId: string) => {
    setHighlightedNodeId(nodeId);
    traceConnections(nodeId);
  }, [traceConnections]);

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
    const rootNodes = filteredNodes
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
    return filteredNodes.map(node => {
      const nodeType = node.type === 'collapsedGroup' 
        ? (node as CollapsedGroup).group 
        : node.type;
      
      // For collapsed groups, position them centrally
      if (node.type === 'collapsedGroup') {
        return {
          ...node,
          position: { 
            x: 400, // Center position 
            y: layerPositions[nodeType] || 0
          },
          data: {
            ...node,
            onExpand: toggleGroup,
            onFilter: handleFilterClick,
          },
          style: {
            width: 250,
            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.15)',
            zIndex: 10,
            opacity: highlightedNodes.size > 0 ? 0.6 : 1,
          },
        };
      }

      // Get all nodes of this type to determine x-position
      const sameTypeNodes = filteredNodes.filter(n => {
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
      
      // Base vertical position based on node type (fixed grid)
      let yPosition = layerPositions[nodeType] || 0;
      
      // Calculate horizontal position (strict grid)
      let xPosition;
      
      if (isDerivedFeatureGroup) {
        // Position derived feature groups below their parent groups
        yPosition += 120;
        
        // If it's fg-4, position it below fg-1 and fg-2 (its parents)
        if (node.id === 'fg-4') {
          xPosition = 300; // Between its parents
        } 
        // If it's fg-5, position it below fg-1 and fg-3 (its parents)
        else if (node.id === 'fg-5') {
          xPosition = 600; // Between its parents
        }
      } else {
        // Position regular nodes based on their index
        xPosition = nodeIndex * 300;
        
        // Adjust positions for specific node types
        if (nodeType === 'source') {
          if (node.id === 'source-1') xPosition = 0;
          else if (node.id === 'source-2') xPosition = 300;
          else if (node.id === 'source-3') xPosition = 600;
        } 
        else if (nodeType === 'featureGroup' && !isDerivedFeatureGroup) {
          if (node.id === 'fg-1') xPosition = 0;
          else if (node.id === 'fg-2') xPosition = 300;
          else if (node.id === 'fg-3') xPosition = 600;
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
          onFilter: handleFilterClick,
        },
        style: {
          width: 200,
          boxShadow: '0 3px 8px rgba(0, 0, 0, 0.1)',
          transition: 'opacity 0.2s ease-in-out, filter 0.2s ease-in-out',
          opacity: highlightedNodes.size > 0 && !highlightedNodes.has(node.id) ? 0.6 : 1,
          filter: highlightedNodes.has(node.id) ? 'drop-shadow(0 0 10px rgba(66, 133, 244, 0.5))' : 'none',
          zIndex: highlightedNodes.has(node.id) ? 10 : 0,
        },
      };
    });
  }, [filteredNodes, visibleEdges, toggleGroup, handleFilterClick, highlightedNodes, layerPositions]);
  
  // Filter edges based on connection tracing
  const filteredEdges = useMemo(() => {
    if (highlightedNodes.size > 0) {
      // Only show edges where both source and target are in the highlighted nodes
      return visibleEdges.filter(edge => 
        highlightedNodes.has(edge.source) && highlightedNodes.has(edge.target)
      );
    }
    return visibleEdges;
  }, [visibleEdges, highlightedNodes]);

  // Transform edges to use custom edge type with derived connections and highlighting
  const layoutEdges = useMemo(() => {
    return filteredEdges.map(edge => {
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
          opacity: highlightedEdges.size > 0 && !isHighlighted ? 0.4 : 1,
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
  }, [filteredEdges, highlightedEdges]);

  // Node interactions (we don't need mouse enter/leave since we'll use ReactFlow tooltips)
  const handleNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    // Let the onNodeClick handler work normally - no longer doing tracing here
    // Instead, let the filter button handle that
    onNodeClick?.(node);
  }, [onNodeClick]);

  return (
    <div className="provenance-graph-container">
      <div className="controls-panel">
        <GroupControls 
          groupState={groupState}
          toggleGroup={toggleGroup}
        />
        
        {/* Show tracing controls when a node is highlighted */}
        {highlightedNodeId && (
          <TracingControls
            nodeId={highlightedNodeId}
            onClearTrace={() => {
              setHighlightedNodeId(null);
              setHighlightedNodes(new Set());
              setHighlightedEdges(new Set());
            }}
          />
        )}
      </div>
      
      {/* Floating reset button when in filtered mode */}
      {highlightedNodes.size > 0 && (
        <button 
          className="reset-filter-button"
          onClick={() => {
            setHighlightedNodeId(null);
            setHighlightedNodes(new Set());
            setHighlightedEdges(new Set());
          }}
          title="Show all nodes and connections"
        >
          Reset View
        </button>
      )}
      <div className="flow-wrapper">
        <ReactFlow
          nodes={applyNodeHighlighting(layoutNodes)}
          edges={layoutEdges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
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