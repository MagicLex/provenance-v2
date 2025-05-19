export interface HopsworksNode {
  id: string;
  type: 'source' | 'featureGroup' | 'featureView' | 'trainingDataset' | 'model' | 'deployment';
  group: string;
  label: string;
  metadata: Record<string, any>;
}

export interface CollapsedGroup {
  id: string;
  type: 'collapsedGroup';
  group: string;
  label: string;
  count: number;
  nodeIds: string[];
}

export interface Edge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  type?: string;
  animated?: boolean;
  style?: Record<string, any>;
  data?: Record<string, any>;
}

export interface GroupState {
  [key: string]: boolean; // group name -> collapsed state
}