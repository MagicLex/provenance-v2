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

// Base vertical positions for each layer type
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
  
  // State for tooltips
  const [tooltipData, setTooltipData] = useState<HopsworksNode | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  
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
            y: layerPositions[nodeType] || 0
          },
          data: {
            ...node,
            onExpand: toggleGroup,
          },
          style: {
            width: 250,
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
      
      // Base vertical position based on node type
      let yPosition = layerPositions[nodeType] || 0;
      
      // Calculate horizontal position
      let xPosition;
      
      if (isDerivedFeatureGroup) {
        // Position derived feature groups in a second row
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
        
        // Adjust positions for specific node types to better show relationships
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
        },
        style: {
          width: 200,
        },
      };
    });
  }, [visibleNodes, visibleEdges, toggleGroup]);
  
  // Transform edges to use custom edge type with derived connections
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
      
      return {
        ...edge,
        type: 'custom', // Use our custom edge component
        animated: false,
        data: {
          ...edge.data,
          isDerived, // Add this property to be used in CustomEdge
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: isDerived ? 22 : 20,
          height: isDerived ? 22 : 20,
        },
      };
    });
  }, [visibleEdges]);

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
    onNodeClick?.(node);
  }, [onNodeClick]);

  return (
    <div className="provenance-graph-container">
      <div className="controls-panel">
        <GroupControls 
          groupState={groupState}
          toggleGroup={toggleGroup}
        />
      </div>
      <div className="flow-wrapper">
        <ReactFlow
          nodes={layoutNodes}
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
            gap={12}
            size={1}
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