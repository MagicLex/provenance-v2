# Hopsworks Provenance Graph - UX Demo

A React component demonstration of the grouping/collapsing UX for feature store provenance visualization. This demo showcases smart visualization techniques to handle the explosion problem in feature store lineage graphs.

## Key Features

- **Smart Grouping/Collapsing**: Handle large numbers of nodes (100+ training datasets, models) with intuitive grouping
- **Progressive Disclosure**: Start with a clean overview, then drill down to details as needed
- **Edge Bundling**: Aggregated connections when groups are collapsed
- **Interactive Experience**: Tooltips, expand/collapse animations, and responsive layout
- **Connection Tracing**: Filter the graph to show only nodes connected to a selected node
- **Visual Feedback**: Clear highlighting of traced connections with count statistics
- **Smooth Transitions**: Animated state changes for better user understanding

## Implementation Focus

The demo focuses purely on the UX and interaction patterns, with:

- Realistic mock data structure and scale
- Custom node and edge components
- Smart positioning and layout
- Responsive group controls

## Project Structure

```
src/
├── ProvenanceGraph.tsx      # Main component
├── ProvenanceGraph.css      # Styling
├── types.ts                 # Entity definitions
├── mockData.ts              # Realistic test data
├── hooks/                   # State management
│   └── useGroupState.ts     # Collapse/expand logic
└── components/              # Custom nodes and controls
    ├── SourceNode.tsx
    ├── FeatureGroupNode.tsx
    ├── CollapsedGroupNode.tsx
    ├── FilterButton.tsx     # Node filtering control
    ├── TracingControls.tsx  # Connection tracing panel 
    ├── GroupControls.tsx    # Group collapse controls
    ├── CustomEdge.tsx       # Styled edge renderer
    └── ...
```

## Usage

To integrate the component in your own project:

```jsx
import { ProvenanceGraph } from './ProvenanceGraph';

// In your app
<ProvenanceGraph data={mockData} onNodeClick={handleNodeClick} />
```

## Setup Instructions

1. Install dependencies:
   ```
   npm install react react-dom reactflow
   npm install --save-dev typescript @types/react @types/react-dom
   ```

2. Set up your project with:
   ```
   npm init -y
   ```

3. Start the development server with your preferred bundler (Webpack, Vite, etc.)

## Package Dependencies

- React 18+
- React Flow - for the graph visualization
- TypeScript - for type safety

## What This Demo Solves

- **The Explosion Problem**: 1 feature view → 100 training datasets → 100 models
- **Visual Hierarchy**: Clear entity relationships
- **Progressive Disclosure**: Overview → drill-down workflow
- **Edge Chaos**: Smart edge bundling when groups collapse
- **Connection Understanding**: Ability to trace and view only relevant connections
- **Visual Clutter**: Filter out irrelevant nodes when analyzing specific lineage