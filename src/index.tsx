import React from 'react';
import ReactDOM from 'react-dom/client';
import ProvenanceGraph from './ProvenanceGraph';

import './index.css';

const App = () => {
  return (
    <div className="app">
      <div className="header">
        <h1>Hopsworks Provenance Graph - UX Demo</h1>
        <p>Expand and collapse node groups to explore the feature store provenance</p>
      </div>
      <div className="graph-container">
        <ProvenanceGraph 
          onNodeClick={(node) => {
            console.log('Node clicked:', node);
          }}
        />
      </div>
    </div>
  );
};

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);