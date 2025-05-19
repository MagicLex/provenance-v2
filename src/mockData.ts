import { HopsworksNode, Edge } from './types';

// Generate mock nodes with realistic structure and scale
export const mockNodes: HopsworksNode[] = [
  // Sources (3)
  { 
    id: 'source-1', 
    type: 'source', 
    group: 'source',
    label: 'Customer Database',
    metadata: { 
      type: 'MySQL',
      connectorType: 'JDBC',
      lastUpdated: '2023-05-15T12:30:45Z' 
    }
  },
  { 
    id: 'source-2', 
    type: 'source',
    group: 'source',
    label: 'Transaction Logs',
    metadata: { 
      type: 'Kafka',
      connectorType: 'Streaming',
      topicName: 'transactions',
      lastUpdated: '2023-05-16T09:15:22Z' 
    }
  },
  { 
    id: 'source-3', 
    type: 'source',
    group: 'source',
    label: 'Product Catalog',
    metadata: { 
      type: 'S3',
      connectorType: 'File',
      format: 'Parquet',
      lastUpdated: '2023-05-14T18:45:10Z' 
    }
  },

  // Feature Groups (5)
  { 
    id: 'fg-1', 
    type: 'featureGroup',
    group: 'featureGroup',
    label: 'Customer Features',
    metadata: { 
      version: 1,
      features: ['customer_id', 'age', 'tenure', 'income_bracket'],
      created: '2023-05-17T10:30:00Z' 
    }
  },
  { 
    id: 'fg-2', 
    type: 'featureGroup',
    group: 'featureGroup',
    label: 'Transaction Features',
    metadata: { 
      version: 2,
      features: ['transaction_id', 'amount', 'timestamp', 'merchant_id'],
      created: '2023-05-17T11:45:00Z' 
    }
  },
  { 
    id: 'fg-3', 
    type: 'featureGroup',
    group: 'featureGroup',
    label: 'Product Features',
    metadata: { 
      version: 1,
      features: ['product_id', 'category', 'price', 'inventory_level'],
      created: '2023-05-17T14:15:00Z' 
    }
  },
  { 
    id: 'fg-4', 
    type: 'featureGroup',
    group: 'featureGroup',
    label: 'Customer Spending Patterns',
    metadata: { 
      version: 1,
      features: ['customer_id', 'avg_transaction_value', 'transaction_frequency', 'preferred_category'],
      created: '2023-05-18T09:30:00Z' 
    }
  },
  { 
    id: 'fg-5', 
    type: 'featureGroup',
    group: 'featureGroup',
    label: 'Customer Product Affinity',
    metadata: { 
      version: 1,
      features: ['customer_id', 'product_id', 'purchase_count', 'last_purchase_date'],
      created: '2023-05-18T16:20:00Z' 
    }
  },

  // Feature View (1)
  { 
    id: 'fv-1', 
    type: 'featureView',
    group: 'featureView',
    label: 'Customer 360 View',
    metadata: { 
      version: 1,
      description: 'Unified view of customer data for predictive modeling',
      created: '2023-05-19T11:00:00Z',
      features: [
        'customer_id', 'age', 'tenure', 'income_bracket', 
        'avg_transaction_value', 'transaction_frequency', 'preferred_category'
      ]
    }
  },
];

// Generate 50 training datasets
for (let i = 1; i <= 50; i++) {
  mockNodes.push({
    id: `td-${i}`,
    type: 'trainingDataset',
    group: 'trainingDataset',
    label: `Training Dataset ${i}`,
    metadata: {
      version: 1,
      created: new Date(2023, 5, 20 + Math.floor(i/10)).toISOString(),
      splitRatio: '80/20',
      samples: 10000 + (i * 100),
      features: [
        'customer_id', 'age', 'tenure', 'income_bracket', 
        'avg_transaction_value', 'transaction_frequency', 'preferred_category'
      ],
      target: 'churn_probability'
    }
  });
}

// Generate 75 models
for (let i = 1; i <= 75; i++) {
  const modelType = ['RandomForest', 'XGBoost', 'NeuralNetwork'][i % 3];
  const associatedTrainingDataset = `td-${Math.min(i, 50)}`;
  
  mockNodes.push({
    id: `model-${i}`,
    type: 'model',
    group: 'model',
    label: `${modelType} Model ${i}`,
    metadata: {
      version: 1,
      created: new Date(2023, 5, 25 + Math.floor(i/15)).toISOString(),
      framework: modelType === 'NeuralNetwork' ? 'TensorFlow' : 'Scikit-learn',
      metrics: {
        accuracy: 0.82 + (Math.random() * 0.1),
        f1Score: 0.79 + (Math.random() * 0.1),
        auc: 0.85 + (Math.random() * 0.08)
      },
      hyperparameters: {
        param1: Math.random() * 10,
        param2: Math.random() * 100
      },
      trainingDataset: associatedTrainingDataset
    }
  });
}

// Deployments (3)
mockNodes.push(
  { 
    id: 'deploy-1', 
    type: 'deployment',
    group: 'deployment',
    label: 'Production Endpoint',
    metadata: { 
      version: 1,
      model: 'model-42',
      deployedAt: '2023-06-15T14:30:00Z',
      status: 'active',
      endpoint: 'https://api.example.com/predictions/customer-churn'
    }
  },
  { 
    id: 'deploy-2', 
    type: 'deployment',
    group: 'deployment',
    label: 'Batch Inference Job',
    metadata: { 
      version: 1,
      model: 'model-55',
      deployedAt: '2023-06-16T09:45:00Z',
      status: 'active',
      schedule: 'Daily at 02:00 UTC'
    }
  },
  { 
    id: 'deploy-3', 
    type: 'deployment',
    group: 'deployment',
    label: 'Staging Endpoint',
    metadata: { 
      version: 1,
      model: 'model-73',
      deployedAt: '2023-06-14T16:20:00Z',
      status: 'active',
      endpoint: 'https://staging.example.com/predictions/customer-churn'
    }
  }
);

// Create edges
export const mockEdges: Edge[] = [
  // Source -> Feature Group connections
  { id: 'e-s1-fg1', source: 'source-1', target: 'fg-1' },
  { id: 'e-s2-fg2', source: 'source-2', target: 'fg-2' },
  { id: 'e-s3-fg3', source: 'source-3', target: 'fg-3' },
  
  // Derived Feature Group connections
  { id: 'e-fg1-fg4', source: 'fg-1', target: 'fg-4' },
  { id: 'e-fg2-fg4', source: 'fg-2', target: 'fg-4' },
  { id: 'e-fg1-fg5', source: 'fg-1', target: 'fg-5' },
  { id: 'e-fg3-fg5', source: 'fg-3', target: 'fg-5' },
  
  // Feature Group -> Feature View connections
  { id: 'e-fg1-fv1', source: 'fg-1', target: 'fv-1' },
  { id: 'e-fg4-fv1', source: 'fg-4', target: 'fv-1' }
];

// Feature View -> Training Dataset connections
for (let i = 1; i <= 50; i++) {
  mockEdges.push({
    id: `e-fv1-td${i}`,
    source: 'fv-1',
    target: `td-${i}`
  });
}

// Training Dataset -> Model connections
for (let i = 1; i <= 75; i++) {
  const sourceTrainingDataset = `td-${Math.min(i, 50)}`;
  mockEdges.push({
    id: `e-td${Math.min(i, 50)}-model${i}`,
    source: sourceTrainingDataset,
    target: `model-${i}`
  });
}

// Model -> Deployment connections
mockEdges.push(
  { id: 'e-model42-deploy1', source: 'model-42', target: 'deploy-1' },
  { id: 'e-model55-deploy2', source: 'model-55', target: 'deploy-2' },
  { id: 'e-model73-deploy3', source: 'model-73', target: 'deploy-3' }
);

// Group definitions for controls and organization
export const nodeGroups = [
  { id: 'source', label: 'Data Sources', count: 3 },
  { id: 'featureGroup', label: 'Feature Groups', count: 5 },
  { id: 'featureView', label: 'Feature Views', count: 1 },
  { id: 'trainingDataset', label: 'Training Datasets', count: 50 },
  { id: 'model', label: 'Models', count: 75 },
  { id: 'deployment', label: 'Deployments', count: 3 }
];