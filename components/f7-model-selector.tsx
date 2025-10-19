'use client';

import React from 'react';
import { List, ListItem, f7 } from 'framework7-react';
import useToolsStore from '@/stores/useToolsStore';

const MODEL_OPTIONS = [
  { value: 'gpt-4.1', label: 'GPT-4.1', shortLabel: '4.1' },
  { value: 'gpt-5', label: 'GPT-5', shortLabel: '5' },
  { value: 'gpt-5-pro', label: 'GPT-5 Pro', shortLabel: '5 Pro' },
];

export function ModelSelector() {
  const { selectedModel, setSelectedModel } = useToolsStore();
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleModelChange = () => {
    const buttons = MODEL_OPTIONS.map(model => ({
      text: model.label,
      onClick: () => setSelectedModel(model.value),
      bold: model.value === selectedModel,
      color: model.value === selectedModel ? 'purple' : undefined,
    }));

    const actions = f7.actions.create({
      buttons: [
        ...buttons,
        {
          text: 'Cancel',
          color: 'red',
        }
      ],
      targetEl: document.querySelector('.model-selector'),
    });
    actions.open();
  };

  const currentModel = MODEL_OPTIONS.find(m => m.value === selectedModel);

  return (
    <div 
      className="model-selector chip chip-outline color-purple"
      onClick={handleModelChange}
      style={{
        padding: '4px 12px',
        fontSize: '14px',
        fontWeight: 500,
        cursor: 'pointer',
        borderRadius: '16px',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
      }}
    >
      <i className="f7-icons" style={{ fontSize: '16px' }}>bolt</i>
      <span>
        {isMobile ? currentModel?.shortLabel : currentModel?.label}
      </span>
      <i className="f7-icons" style={{ fontSize: '14px' }}>chevron_down</i>
    </div>
  );
}