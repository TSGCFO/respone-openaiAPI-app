'use client';

import React from 'react';
import {
  Page,
  Navbar,
  NavTitle,
  NavRight,
  Link,
  List,
  ListItem,
  Toggle,
  Block,
  BlockTitle,
  Icon,
  f7,
} from 'framework7-react';
import useToolsStore from '@/stores/useToolsStore';
import useConversationStore from '@/stores/useConversationStore';

export function F7ToolsPanel() {
  const {
    webSearchEnabled,
    fileSearchEnabled,
    codeInterpreterEnabled,
    functionsEnabled,
    mcpEnabled,
    setWebSearchEnabled,
    setFileSearchEnabled,
    setCodeInterpreterEnabled,
    setFunctionsEnabled,
    setMcpEnabled,
  } = useToolsStore();

  const closePanel = () => {
    f7.panel.close();
  };

  return (
    <Page>
      <Navbar>
        <NavTitle>Tools & Settings</NavTitle>
        <NavRight>
          <Link iconF7="xmark" onClick={closePanel} />
        </NavRight>
      </Navbar>

      <BlockTitle>AI Tools</BlockTitle>
      <List inset strong>
        <ListItem>
          <Icon slot="media" f7="search" color="purple" />
          <span>Web Search</span>
          <Toggle
            slot="after"
            checked={webSearchEnabled}
            onToggleChange={(checked) =>
              setWebSearchEnabled(checked)
            }
          />
        </ListItem>

        <ListItem>
          <Icon slot="media" f7="doc_text_search" color="purple" />
          <span>File Search</span>
          <Toggle
            slot="after"
            checked={fileSearchEnabled}
            onToggleChange={(checked) =>
              setFileSearchEnabled(checked)
            }
          />
        </ListItem>

        <ListItem>
          <Icon slot="media" f7="terminal" color="purple" />
          <span>Code Interpreter</span>
          <Toggle
            slot="after"
            checked={codeInterpreterEnabled}
            onToggleChange={(checked) =>
              setCodeInterpreterEnabled(checked)
            }
          />
        </ListItem>

        <ListItem>
          <Icon slot="media" f7="function" color="purple" />
          <span>Functions</span>
          <Toggle
            slot="after"
            checked={functionsEnabled}
            onToggleChange={(checked) =>
              setFunctionsEnabled(checked)
            }
          />
        </ListItem>

        <ListItem>
          <Icon slot="media" f7="cloud" color="purple" />
          <span>MCP Integration</span>
          <Toggle
            slot="after"
            checked={mcpEnabled}
            onToggleChange={(checked) =>
              setMcpEnabled(checked)
            }
          />
        </ListItem>
      </List>

      <BlockTitle>Quick Actions</BlockTitle>
      <List inset>
        <ListItem
          link
          title="Clear Conversations"
          onClick={() => {
            f7.dialog.confirm(
              'This will clear all conversations. Are you sure?',
              'Clear Conversations',
              () => {
                // Clear conversations using the conversation store
                useConversationStore.getState().resetConversation();
                f7.toast
                  .create({
                    text: 'Conversations cleared',
                    position: 'bottom',
                    closeTimeout: 2000,
                  })
                  .open();
              }
            );
          }}
        >
          <Icon slot="media" f7="trash" color="red" />
        </ListItem>

        <ListItem
          link
          title="Export Chat"
          onClick={() => {
            f7.dialog.alert('Export feature coming soon!');
          }}
        >
          <Icon slot="media" f7="square_arrow_up" color="blue" />
        </ListItem>

        <ListItem
          link
          title="Settings"
          onClick={() => {
            f7.dialog.alert('Settings page coming soon!');
          }}
        >
          <Icon slot="media" f7="gear_alt" color="gray" />
        </ListItem>
      </List>

      <Block>
        <p className="text-center text-gray-500 text-sm">
          AI Chat Assistant v1.0
        </p>
        <p className="text-center text-gray-400 text-xs">
          Powered by OpenAI
        </p>
      </Block>
    </Page>
  );
}