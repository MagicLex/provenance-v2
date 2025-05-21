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
  applyNodeChanges,
  NodeChange,
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
import NameFilterControls from './components/NameFilterControls';

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

// Grid settings for snap-to-grid layout
const GRID_SIZE = 80; // Size of grid cells - increased for more visible effect
const NODE_HORIZONTAL_DISTANCE = 320; // Fixed horizontal distance between node levels (multiple of grid size)
const NODE_VERTICAL_DISTANCE = 160; // Base vertical distance between nodes (multiple of grid size)

// Function to snap a position to the grid
const snapToGrid = (position: number): number => {
  return Math.round(position / GRID_SIZE) * GRID_SIZE;
};

const ProvenanceGraphInner: React.FC<ProvenanceGraphProps> = ({ 
  data = { nodes: mockNodes, edges: mockEdges },
  onNodeClick
}) => {
  const reactFlowInstance = useReactFlow();
  
  // State for connection highlighting
  const [highlightedNodeId, setHighlightedNodeId] = useState<string | null>(null);
  const [highlightedNodes, setHighlightedNodes] = useState<Set<string>>(new Set());
  const [highlightedEdges, setHighlightedEdges] = useState<Set<string>>(new Set());
  
  // State for name filtering
  const [nameFilter, setNameFilter] = useState<string>('');
  const [nodeTypeFilter, setNodeTypeFilter] = useState<string | null>(null);
  
  // State for storing node positions (for manual node dragging)
  const [manualPositions, setManualPositions] = useState<Record<string, { x: number, y: number }>>({});
  
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

  // Add highlighting classes to nodes
  const applyNodeHighlighting = useCallback((nodes: Node[]) => {
    // Apply highlighting to nodes without sorting by columns
    return nodes.map(node => {
      const isHighlighted = highlightedNodes.has(node.id);
      return {
        ...node,
        className: `${node.className || ''} ${isHighlighted ? 'highlighted' : ''}`.trim()
      };
    });
  }, [highlightedNodes]);

  // Handle name filter changes
  const handleNameFilterChange = useCallback((name: string, nodeType: string | null) => {
    setNameFilter(name);
    setNodeTypeFilter(nodeType);
    
    // Clear connection highlighting when applying a name filter
    if (name || nodeType) {
      setHighlightedNodeId(null);
      setHighlightedNodes(new Set());
      setHighlightedEdges(new Set());
    }
  }, []);
  
  // Filter nodes based on both connection tracing and name filtering
  const filteredNodes = useMemo(() => {
    let result = visibleNodes;
    
    // First apply connection tracing if active
    if (highlightedNodes.size > 0) {
      result = result.filter(node => highlightedNodes.has(node.id));
    }
    
    // Then apply name filtering if active
    if (nameFilter || nodeTypeFilter) {
      result = result.filter(node => {
        // Apply node type filter if specified
        if (nodeTypeFilter && node.type !== nodeTypeFilter && node.type !== 'collapsedGroup') {
          return false;
        }
        
        // For collapsed groups, check if they match the node type filter
        if (nodeTypeFilter && node.type === 'collapsedGroup') {
          const groupType = (node as any).group;
          if (groupType !== nodeTypeFilter) {
            return false;
          }
        }
        
        // Apply name filter if specified
        if (nameFilter) {
          const label = node.data?.label?.toLowerCase() || '';
          return label.includes(nameFilter.toLowerCase());
        }
        
        return true;
      });
    }
    
    return result;
  }, [visibleNodes, highlightedNodes, nameFilter, nodeTypeFilter]);

  // Handle direct filtering button click
  const handleFilterClick = useCallback((nodeId: string) => {
    setHighlightedNodeId(nodeId);
    traceConnections(nodeId);
  }, [traceConnections]);
  
  // Add a reset positions button that's always visible
  const ResetPositionsButton = () => (
    <button 
      className="reset-positions-button"
      onClick={handleResetNodePositions}
      title="Reset node positions to automatic layout"
      style={{
        position: 'absolute',
        top: '16px',
        right: '16px',
        zIndex: 1000,
      }}
    >
      <span className="reset-positions-icon">↻</span>
      Reset Positions
    </button>
  );

  // Handle node dragging and positioning with grid snapping
  const onNodesChange = useCallback((changes: NodeChange[]) => {
    // Update manual positions when nodes are dragged, with grid snapping
    changes.forEach(change => {
      if (change.type === 'position' && change.position) {
        // If the node has stopped dragging, snap its final position to the grid
        if (!change.dragging) {
          const snappedX = snapToGrid(change.position.x);
          const snappedY = snapToGrid(change.position.y);
          
          setManualPositions(prev => ({
            ...prev,
            [change.id]: { x: snappedX, y: snappedY }
          }));
          
          // Update the position in the change object to show the snap
          change.position.x = snappedX;
          change.position.y = snappedY;
        } else {
          // During dragging, just track the position normally
          setManualPositions(prev => ({
            ...prev,
            [change.id]: { x: change.position!.x, y: change.position!.y }
          }));
        }
      }
    });
  }, []);

  // Create a more organic force-directed layout
  const layoutNodes = useMemo(() => {
    // If there are no nodes, return an empty array
    if (filteredNodes.length === 0) return [];
    
    // Create maps for parent-child relationships
    const childrenByParent = new Map();
    const parentsByNode = new Map();
    const nodeDepths = new Map();
    
    // Step 1: Build the parent-child relationship maps
    visibleEdges.forEach(edge => {
      const parents = parentsByNode.get(edge.target) || [];
      parents.push(edge.source);
      parentsByNode.set(edge.target, parents);
      
      const children = childrenByParent.get(edge.source) || [];
      children.push(edge.target);
      childrenByParent.set(edge.source, children);
    });
    
    // Step 2: Calculate node depths (distance from any root)
    const calculateDepth = (nodeId: string, depth: number, visited = new Set<string>()) => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);
      
      const currentDepth = nodeDepths.get(nodeId) || 0;
      nodeDepths.set(nodeId, Math.max(currentDepth, depth));
      
      const children = childrenByParent.get(nodeId) || [];
      children.forEach(childId => {
        calculateDepth(childId, depth + 1, visited);
      });
    };
    
    // Find root nodes (nodes with no parents)
    const rootNodes = filteredNodes
      .filter(node => {
        const parents = parentsByNode.get(node.id) || [];
        return parents.length === 0;
      })
      .map(node => node.id);
    
    // Calculate depths starting from root nodes
    rootNodes.forEach(nodeId => calculateDepth(nodeId, 0));
    
    // Step 3: Position nodes based on their parents and children
    return filteredNodes.map(node => {
      // Check if this node has a manually set position
      if (manualPositions[node.id]) {
        // Use the manually positioned coordinates
        const manualPos = manualPositions[node.id];
        return {
          ...node,
          position: manualPos,
          draggable: true, // Ensure node is draggable
          data: {
            ...node,
            onFilter: handleFilterClick,
            onExpand: node.type === 'collapsedGroup' ? toggleGroup : undefined,
          },
          style: {
            width: 190,
            boxShadow: '0 3px 8px rgba(0, 0, 0, 0.1)',
            transition: 'opacity 0.2s ease-in-out, filter 0.2s ease-in-out',
            opacity: highlightedNodes.size > 0 && !highlightedNodes.has(node.id) ? 0.6 : 1,
            filter: highlightedNodes.has(node.id) ? 'drop-shadow(0 0 10px rgba(66, 133, 244, 0.5))' : 'none',
            zIndex: highlightedNodes.has(node.id) ? 10 : 0,
          },
        };
      }
      
      // Get the node's depth in the graph (based on parent-child relationships)
      const depth = nodeDepths.get(node.id) || 0;
      
      // For a more organic layout, position based on parents or depth
      let xPosition, yPosition;
      
      // Get parent nodes
      const parentIds = parentsByNode.get(node.id) || [];
      
      if (parentIds.length > 0) {
        // If node has parents, position it relative to them
        const parentPositions = [];
        let parentCenterX = 0;
        let parentCenterY = 0;
        
        parentIds.forEach(parentId => {
          const parentNode = filteredNodes.find(n => n.id === parentId);
          if (parentNode && parentNode.position) {
            parentPositions.push(parentNode.position);
            parentCenterX += parentNode.position.x;
            parentCenterY += parentNode.position.y;
          }
        });
        
        if (parentPositions.length > 0) {
          // Position to the right of the average parent position
          parentCenterX /= parentPositions.length;
          parentCenterY /= parentPositions.length;
          
          // Calculate exact grid column position based on parent depth
          // Enforce strict ordering based on node type
          const nodeTypeIndex = node.type === 'source' ? 0 : 
                               node.type === 'featureGroup' ? 1 :
                               node.type === 'featureView' ? 2 :
                               node.type === 'trainingDataset' ? 3 :
                               node.type === 'model' ? 4 : 5;
          
          // Position based on its proper place in the hierarchy
          // This ensures correct left-to-right sequence regardless of parent positioning
          xPosition = nodeTypeIndex * NODE_HORIZONTAL_DISTANCE;
          
          // Find all siblings (nodes with the same parents)
          const siblings = filteredNodes.filter(n => {
            const nParents = parentsByNode.get(n.id) || [];
            return nParents.some(p => parentIds.includes(p));
          });
          
          // Get index of this node among siblings
          const siblingIndex = siblings.findIndex(n => n.id === node.id);
          const totalSiblings = siblings.length;
          
          // Center siblings vertically relative to parent
          // Calculate offset from center based on position in sibling group
          const middleIndex = (totalSiblings - 1) / 2;
          const offsetFromMiddle = siblingIndex - middleIndex;
          
          // Position node centered around parent's vertical position
          yPosition = parentCenterY + offsetFromMiddle * GRID_SIZE * 2;
          
          // Snap to grid
          xPosition = snapToGrid(xPosition);
          yPosition = snapToGrid(yPosition);
          
          // For nodes with the same parents, spread them vertically
          const nodesWithSameParents = filteredNodes.filter(n => {
            const nParents = parentsByNode.get(n.id) || [];
            // Same parent set check
            return n.id !== node.id && 
                  nParents.length === parentIds.length && 
                  nParents.every(p => parentIds.includes(p));
          });
          
          if (nodesWithSameParents.length > 0) {
            // Add vertical offset to avoid overlap with siblings (grid-aligned)
            const siblingIndex = nodesWithSameParents.findIndex(n => n.id === node.id);
            if (siblingIndex >= 0) {
              yPosition += siblingIndex * GRID_SIZE * 2;
              // Re-snap to grid after adding offset
              yPosition = snapToGrid(yPosition);
            }
          }
        } else {
          // Fallback if parent positions aren't found (grid-aligned)
          xPosition = depth * NODE_HORIZONTAL_DISTANCE;
          yPosition = (parseInt(node.id.split('-')[1]) || 0) * GRID_SIZE * 2;
          
          // Snap to grid
          xPosition = snapToGrid(xPosition);
          yPosition = snapToGrid(yPosition);
        }
      } else {
        // For root nodes or nodes without parent positions, use grid-aligned placement
        xPosition = depth * NODE_HORIZONTAL_DISTANCE;
        
        // Arrange vertically by node type with consistent grid spacing
        const typeIndex = node.type === 'source' ? 0 : 
                         node.type === 'featureGroup' ? 1 :
                         node.type === 'featureView' ? 2 :
                         node.type === 'trainingDataset' ? 3 :
                         node.type === 'model' ? 4 : 5;
        
        // Calculate vertical position with significant spacing between node types
        // Enforce strict left-to-right order based on node type
        // Source -> FeatureGroup -> FeatureView -> TrainingDataset -> Model -> Deployment
        xPosition = typeIndex * NODE_HORIZONTAL_DISTANCE;
        
        // Vertical position based on type and then index
        const sameTypeNodes = filteredNodes.filter(n => n.type === node.type);
        const nodeIndex = sameTypeNodes.findIndex(n => n.id === node.id);
        const totalSameType = sameTypeNodes.length;
        
        // Center nodes of same type vertically
        const middleIndex = (totalSameType - 1) / 2;
        const offsetFromMiddle = nodeIndex - middleIndex;
        
        // Position vertically centered with consistent spacing
        yPosition = GRID_SIZE * 4 + offsetFromMiddle * GRID_SIZE * 2;
        
        // Snap to grid
        xPosition = snapToGrid(xPosition);
        yPosition = snapToGrid(yPosition);
      }
      
      // Special handling for collapsed groups
      if (node.type === 'collapsedGroup') {
        // Position collapsed groups at fixed grid positions
        const collapsedGroup = (node as CollapsedGroup).group;
        
        // Determine column based on node type
        const typeIndex = collapsedGroup === 'source' ? 0 : 
                         collapsedGroup === 'featureGroup' ? 1 :
                         collapsedGroup === 'featureView' ? 2 :
                         collapsedGroup === 'trainingDataset' ? 3 :
                         collapsedGroup === 'model' ? 4 : 5;
        
        // Position collapsed groups in strict hierarchical order
        // Enforce the correct sequence: Source -> FeatureGroup -> FeatureView -> TrainingDataset -> Model -> Deployment
        xPosition = typeIndex * NODE_HORIZONTAL_DISTANCE;
        
        // Center vertically
        yPosition = GRID_SIZE * 4;
        
        // Snap to grid
        xPosition = snapToGrid(xPosition);
        yPosition = snapToGrid(yPosition);
      }
      
      return {
        ...node,
        position: { 
          x: xPosition, 
          y: yPosition 
        },
        draggable: true, // Allow dragging for all nodes
        data: {
          ...node,
          onFilter: handleFilterClick,
        },
        style: {
          width: 190,
          boxShadow: '0 3px 8px rgba(0, 0, 0, 0.1)',
          transition: 'opacity 0.2s ease-in-out, filter 0.2s ease-in-out',
          opacity: highlightedNodes.size > 0 && !highlightedNodes.has(node.id) ? 0.6 : 1,
          filter: highlightedNodes.has(node.id) ? 'drop-shadow(0 0 10px rgba(66, 133, 244, 0.5))' : 'none',
          zIndex: highlightedNodes.has(node.id) ? 10 : 0,
        },
      };
    });
  }, [filteredNodes, visibleEdges, toggleGroup, handleFilterClick, highlightedNodes, manualPositions, NODE_HORIZONTAL_DISTANCE, NODE_VERTICAL_DISTANCE, GRID_SIZE, snapToGrid]);
  
  // Filter edges based on connection tracing and name filtering
  const filteredEdges = useMemo(() => {
    let result = visibleEdges;
    
    // For connection tracing, only show edges where both source and target are highlighted
    if (highlightedNodes.size > 0) {
      result = result.filter(edge => 
        highlightedNodes.has(edge.source) && highlightedNodes.has(edge.target)
      );
    }
    
    // For name filtering, only show edges where both source and target are in the filtered nodes
    if (nameFilter || nodeTypeFilter) {
      // Get the IDs of all filtered nodes for quick lookup
      const filteredNodeIds = new Set(filteredNodes.map(node => node.id));
      
      result = result.filter(edge => 
        filteredNodeIds.has(edge.source) && filteredNodeIds.has(edge.target)
      );
    }
    
    return result;
  }, [visibleEdges, highlightedNodes, filteredNodes, nameFilter, nodeTypeFilter]);

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
        // Custom circle markers are now defined in the CustomEdge component
        // We don't need to specify markerEnd here as it's handled in CustomEdge
      };
    });
  }, [filteredEdges, highlightedEdges]);

  // Node interactions
  const handleNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    // Let the onNodeClick handler work normally - no longer doing tracing here
    // Instead, let the filter button handle that
    onNodeClick?.(node);
  }, [onNodeClick]);
  
  // Clear manual positions, returning nodes to their algorithmic positions
  const handleResetNodePositions = useCallback(() => {
    setManualPositions({});
  }, []);

  return (
    <div className={`provenance-graph-container ${(highlightedNodes.size > 0 || nameFilter || nodeTypeFilter) ? 'filtering-active' : ''}`}>
      <div className="controls-panel">
        <GroupControls 
          groupState={groupState}
          toggleGroup={toggleGroup}
        />
        
        {/* Show tracing controls when a node is highlighted */}
        {highlightedNodeId && (
          <TracingControls
            nodeId={highlightedNodeId}
            filteredCount={filteredNodes.length}
            totalCount={visibleNodes.length}
            onClearTrace={() => {
              setHighlightedNodeId(null);
              setHighlightedNodes(new Set());
              setHighlightedEdges(new Set());
            }}
          />
        )}
        
        {/* Name filtering controls */}
        <NameFilterControls
          onFilterChange={handleNameFilterChange}
          nameFilter={nameFilter}
          nodeTypeFilter={nodeTypeFilter}
        />
        
        {/* Reset node positions button in the control panel */}
        <div className="position-controls">
          <h3>Layout Controls</h3>
          <button 
            className="action-button"
            onClick={handleResetNodePositions}
            title="Reset node positions to automatic layout"
          >
            <span className="reset-positions-icon">↻</span> Reset Node Positions
          </button>
          <div className="control-info">
            <p>You can drag nodes to position them manually</p>
          </div>
        </div>
      </div>
      
      {/* Floating reset button when any filtering is active */}
      {/* Show filter reset button when filtering is active */}
      {(highlightedNodes.size > 0 || nameFilter || nodeTypeFilter) && (
        <button 
          className="reset-filter-button"
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            zIndex: 1000,
          }}
          onClick={() => {
            // Clear both connection tracing and name filtering
            setHighlightedNodeId(null);
            setHighlightedNodes(new Set());
            setHighlightedEdges(new Set());
            setNameFilter('');
            setNodeTypeFilter(null);
          }}
          title="Show all nodes and connections"
        >
          <span className="reset-filter-icon">🔍</span>
          Reset All Filters
        </button>
      )}
      
      {/* Show reset positions button when filtering is NOT active */}
      {!(highlightedNodes.size > 0 || nameFilter || nodeTypeFilter) && (
        <ResetPositionsButton />
      )}
      <div className="flow-wrapper">
        <ReactFlow
          nodes={applyNodeHighlighting(layoutNodes)}
          edges={layoutEdges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodeClick={handleNodeClick}
          onNodesChange={onNodesChange}
          fitView
          attributionPosition="bottom-right"
          connectionLineType={ConnectionLineType.Bezier}
          defaultViewport={{ x: 0, y: 0, zoom: 0.5 }}
          snapToGrid={true}
          snapGrid={[GRID_SIZE, GRID_SIZE]}
          minZoom={0.5}
          maxZoom={2.0}
          panOnScroll={true}
          selectionOnDrag={false}
          panOnDrag={[1, 2]} // Enable panning with left and middle mouse buttons
        >
          <Controls />
          <MiniMap 
            nodeStrokeWidth={1}
            nodeColor={(node) => {
              switch (node.type) {
                case 'source': return '#0969da';
                case 'featureGroup': return '#1a7f37';
                case 'featureView': return '#9a6700';
                case 'trainingDataset': return '#cf222e';
                case 'model': return '#6639ba';
                case 'deployment': return '#bf3989';
                case 'collapsedGroup': return '#d0d7de';
                default: return '#d0d7de';
              }
            }}
            maskColor="rgba(240, 242, 244, 0.7)"
            zoomable
            pannable
          />
          <Background
            variant="grid"
            gap={GRID_SIZE}
            size={1}
            color="rgba(0, 0, 0, 0.04)"
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