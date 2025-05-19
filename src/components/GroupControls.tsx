import React from 'react';
import { nodeGroups } from '../mockData';
import { GroupState } from '../types';

interface GroupControlsProps {
  groupState: GroupState;
  toggleGroup: (groupId: string) => void;
}

const GroupControls: React.FC<GroupControlsProps> = ({ groupState, toggleGroup }) => {
  return (
    <div className="group-controls">
      <h3>Layer Controls</h3>
      <div className="group-buttons">
        {nodeGroups.map(group => (
          <button
            key={group.id}
            className={`group-button ${groupState[group.id] ? 'collapsed' : 'expanded'}`}
            onClick={() => toggleGroup(group.id)}
          >
            <span className="group-icon">
              {groupState[group.id] ? '➕' : '➖'}
            </span>
            <span className="group-label">
              {group.label}
            </span>
            <span className="group-count">
              {groupState[group.id] ? `(${group.count})` : ''}
            </span>
          </button>
        ))}
      </div>
      <div className="group-actions">
        <button 
          className="action-button expand-all"
          onClick={() => {
            nodeGroups.forEach(group => {
              if (groupState[group.id]) {
                toggleGroup(group.id);
              }
            });
          }}
        >
          Expand All
        </button>
        <button 
          className="action-button collapse-all"
          onClick={() => {
            nodeGroups.forEach(group => {
              if (!groupState[group.id]) {
                toggleGroup(group.id);
              }
            });
          }}
        >
          Collapse All
        </button>
      </div>
    </div>
  );
};

export default GroupControls;