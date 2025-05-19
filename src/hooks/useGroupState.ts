import { useState, useCallback, useMemo } from 'react';
import { HopsworksNode, Edge, CollapsedGroup, GroupState } from '../types';

export const useGroupState = (
  initialNodes: HopsworksNode[],
  initialEdges: Edge[],
  initialCollapsedGroups: string[] = ['trainingDataset', 'model']
) => {
  // Track which groups are collapsed
  const [groupState, setGroupState] = useState<GroupState>(
    initialCollapsedGroups.reduce((acc, group) => ({ ...acc, [group]: true }), {})
  );

  // Toggle collapse/expand for a group
  const toggleGroup = useCallback((groupId: string) => {
    setGroupState(current => ({
      ...current,
      [groupId]: !current[groupId]
    }));
  }, []);

  // Get visible nodes based on collapsed state
  const { visibleNodes, visibleEdges } = useMemo(() => {
    // Start with all nodes
    const allNodes = [...initialNodes];
    const collapsedGroupNodes: CollapsedGroup[] = [];
    
    // Handle collapsed groups
    Object.entries(groupState).forEach(([groupId, isCollapsed]) => {
      if (isCollapsed) {
        // Find all nodes in this group
        const groupNodes = initialNodes.filter(node => node.group === groupId);
        
        if (groupNodes.length > 0) {
          // Remove individual nodes from this group
          const groupNodeIds = groupNodes.map(node => node.id);
          
          // Create a collapsed group node to represent them
          collapsedGroupNodes.push({
            id: `collapsed-${groupId}`,
            type: 'collapsedGroup',
            group: groupId,
            label: `${groupId} Group`,
            count: groupNodes.length,
            nodeIds: groupNodeIds
          });
        }
      }
    });
    
    // Filter out nodes that are part of collapsed groups
    const filteredNodes = allNodes.filter(node => {
      return !groupState[node.group];
    });
    
    // Create new edges that connect to/from collapsed group nodes
    const newEdges = [...initialEdges];
    const processedEdges = new Set<string>();
    const collapsedGroupEdges: Edge[] = [];
    
    // Process edges for collapsed groups
    initialEdges.forEach(edge => {
      if (processedEdges.has(edge.id)) return;
      
      const sourceNode = initialNodes.find(n => n.id === edge.source);
      const targetNode = initialNodes.find(n => n.id === edge.target);
      
      if (!sourceNode || !targetNode) return;
      
      const isSourceCollapsed = groupState[sourceNode.group];
      const isTargetCollapsed = groupState[targetNode.group];
      
      if (isSourceCollapsed && isTargetCollapsed) {
        // Both ends are in collapsed groups
        const sourceGroup = `collapsed-${sourceNode.group}`;
        const targetGroup = `collapsed-${targetNode.group}`;
        
        // Check if we already have this group-to-group edge
        const existingGroupEdge = collapsedGroupEdges.find(e => 
          e.source === sourceGroup && e.target === targetGroup
        );
        
        if (!existingGroupEdge) {
          collapsedGroupEdges.push({
            id: `edge-${sourceGroup}-${targetGroup}`,
            source: sourceGroup,
            target: targetGroup,
            animated: edge.animated,
            style: edge.style,
            data: { ...edge.data, count: 1 }
          });
        } else {
          // Increment the count of connections between these groups
          existingGroupEdge.data = { 
            ...existingGroupEdge.data, 
            count: (existingGroupEdge.data?.count || 1) + 1 
          };
        }
      } else if (isSourceCollapsed) {
        // Source is in a collapsed group
        const sourceGroup = `collapsed-${sourceNode.group}`;
        
        // Check if we already have this group-to-node edge
        const existingGroupEdge = collapsedGroupEdges.find(e => 
          e.source === sourceGroup && e.target === edge.target
        );
        
        if (!existingGroupEdge) {
          collapsedGroupEdges.push({
            id: `edge-${sourceGroup}-${edge.target}`,
            source: sourceGroup,
            target: edge.target,
            animated: edge.animated,
            style: edge.style,
            data: { ...edge.data, count: 1 }
          });
        } else {
          // Increment the count of connections from this group to this node
          existingGroupEdge.data = { 
            ...existingGroupEdge.data, 
            count: (existingGroupEdge.data?.count || 1) + 1 
          };
        }
      } else if (isTargetCollapsed) {
        // Target is in a collapsed group
        const targetGroup = `collapsed-${targetNode.group}`;
        
        // Check if we already have this node-to-group edge
        const existingGroupEdge = collapsedGroupEdges.find(e => 
          e.source === edge.source && e.target === targetGroup
        );
        
        if (!existingGroupEdge) {
          collapsedGroupEdges.push({
            id: `edge-${edge.source}-${targetGroup}`,
            source: edge.source,
            target: targetGroup,
            animated: edge.animated,
            style: edge.style,
            data: { ...edge.data, count: 1 }
          });
        } else {
          // Increment the count of connections from this node to this group
          existingGroupEdge.data = { 
            ...existingGroupEdge.data, 
            count: (existingGroupEdge.data?.count || 1) + 1 
          };
        }
      } else {
        // Neither end is collapsed, keep the original edge
        return;
      }
      
      // Mark this edge as processed
      processedEdges.add(edge.id);
    });
    
    // Filter out edges that connect to/from nodes in collapsed groups
    const filteredEdges = newEdges.filter(edge => {
      const sourceNode = initialNodes.find(n => n.id === edge.source);
      const targetNode = initialNodes.find(n => n.id === edge.target);
      
      return (
        sourceNode && 
        targetNode && 
        !groupState[sourceNode.group] && 
        !groupState[targetNode.group]
      );
    });
    
    // Combine visible nodes and edges
    return {
      visibleNodes: [
        ...filteredNodes,
        ...collapsedGroupNodes
      ],
      visibleEdges: [
        ...filteredEdges,
        ...collapsedGroupEdges
      ]
    };
  }, [initialNodes, initialEdges, groupState]);

  return {
    groupState,
    toggleGroup,
    visibleNodes,
    visibleEdges
  };
};

export default useGroupState;