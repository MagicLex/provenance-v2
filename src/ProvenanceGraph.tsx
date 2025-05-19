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

const nodePositionsByType: Record<string, { x: number, y: number }> = {
  source: { x: 0, y: 0 },
  featureGroup: { x: 0, y: 200 },
  featureView: { x: 0, y: 400 },
  trainingDataset: { x: 0, y: 600 },
  model: { x: 0, y: 800 },
  deployment: { x: 0, y: 1000 },
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
  
  // Transform nodes with positions
  const layoutNodes = useMemo(() => {
    return visibleNodes.map((node, index) => {
      const nodeType = node.type === 'collapsedGroup' 
        ? (node as CollapsedGroup).group 
        : node.type;
      
      // Calculate X position based on node index within its type
      const sameTypeIndex = visibleNodes
        .filter(n => {
          const nType = n.type === 'collapsedGroup' 
            ? (n as CollapsedGroup).group 
            : n.type;
          return nType === nodeType;
        })
        .findIndex(n => n.id === node.id);
      
      const basePosition = nodePositionsByType[nodeType] || { x: 0, y: 0 };
      const xOffset = sameTypeIndex * 300; // Horizontal spacing
      
      // For collapsed groups, position them in the center of their group
      const xPosition = node.type === 'collapsedGroup' 
        ? 400 // Center position for collapsed groups
        : basePosition.x + xOffset;
      
      return {
        ...node,
        position: { 
          x: xPosition, 
          y: basePosition.y 
        },
        data: {
          ...node,
          onExpand: node.type === 'collapsedGroup' ? toggleGroup : undefined,
        },
        style: {
          width: node.type === 'collapsedGroup' ? 250 : 200,
        },
      };
    });
  }, [visibleNodes, toggleGroup]);
  
  // Transform edges to use custom edge type
  const layoutEdges = useMemo(() => {
    return visibleEdges.map(edge => ({
      ...edge,
      type: 'custom', // Use our custom edge component
      animated: false,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 20,
        height: 20,
      },
    }));
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