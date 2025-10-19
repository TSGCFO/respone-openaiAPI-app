'use client';

import React from 'react';
import { Segmented, Button, f7 } from 'framework7-react';
import useToolsStore from '@/stores/useToolsStore';

export function ReasoningEffortSelector() {
  const { reasoningEffort, setReasoningEffort } = useToolsStore();

  const handleChange = (value: string) => {
    setReasoningEffort(value as 'low' | 'medium' | 'high');
    
    // Haptic feedback on Android
    if ('vibrate' in navigator) {
      navigator.vibrate(1);
    }
  };

  return (
    <div 
      className="reasoning-selector"
      style={{
        display: 'flex',
        gap: '4px',
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        padding: '0 4px',
      }}
    >
      <style jsx>{`
        .reasoning-selector::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      
      <Segmented raised>
        <Button
          active={reasoningEffort === 'low'}
          onClick={() => handleChange('low')}
          small
          style={{
            minWidth: '60px',
            fontSize: '13px',
            fontWeight: reasoningEffort === 'low' ? 600 : 400,
          }}
        >
          Low
        </Button>
        <Button
          active={reasoningEffort === 'medium'}
          onClick={() => handleChange('medium')}
          small
          style={{
            minWidth: '70px',
            fontSize: '13px',
            fontWeight: reasoningEffort === 'medium' ? 600 : 400,
          }}
        >
          Medium
        </Button>
        <Button
          active={reasoningEffort === 'high'}
          onClick={() => handleChange('high')}
          small
          style={{
            minWidth: '60px',
            fontSize: '13px',
            fontWeight: reasoningEffort === 'high' ? 600 : 400,
          }}
        >
          High
        </Button>
      </Segmented>
      
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          paddingLeft: '8px',
          fontSize: '12px',
          color: '#666',
          whiteSpace: 'nowrap',
        }}
      >
        <i className="f7-icons" style={{ fontSize: '14px', marginRight: '4px' }}>
          bolt_horizontal
        </i>
        Reasoning
      </div>
    </div>
  );
}