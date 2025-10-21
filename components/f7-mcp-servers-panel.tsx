'use client';

import React, { useState } from 'react';
import {
  Page,
  Navbar,
  NavTitle,
  NavRight,
  Link,
  List,
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  Button,
  Toggle,
  Block,
  BlockTitle,
  Icon,
  Fab,
  f7,
  Sheet,
  Toolbar,
  PageContent,
  ListInput,
} from 'framework7-react';
import useToolsStore, { McpServer } from '@/stores/useToolsStore';

export function F7McpServersPanel() {
  const { mcpServers, addMcpServer, updateMcpServer, removeMcpServer } = useToolsStore();
  const [sheetOpened, setSheetOpened] = useState(false);
  const [editingServer, setEditingServer] = useState<any>(null);
  const [formData, setFormData] = useState({
    label: '',
    url: '',
    authToken: '',
    allowed_tools: '',
    skip_approval: true,
  });

  const closePanel = () => {
    f7.panel.close();
  };

  const openAddSheet = () => {
    setEditingServer(null);
    setFormData({ label: '', url: '', authToken: '', allowed_tools: '', skip_approval: true });
    setSheetOpened(true);
  };

  const openEditSheet = (server: McpServer) => {
    setEditingServer(server);
    setFormData({
      label: server.label,
      url: server.url,
      authToken: server.authToken || '',
      allowed_tools: server.allowed_tools || '',
      skip_approval: server.skip_approval !== false,
    });
    setSheetOpened(true);
  };

  const handleSave = () => {
    if (!formData.label || !formData.url) {
      f7.dialog.alert('Please fill in all required fields');
      return;
    }

    if (editingServer) {
      updateMcpServer(editingServer.id, formData);
      f7.toast.create({
        text: 'Server updated',
        position: 'bottom',
        closeTimeout: 2000,
      }).open();
    } else {
      addMcpServer({
        ...formData,
        enabled: true,
      });
      f7.toast.create({
        text: 'Server added',
        position: 'bottom',
        closeTimeout: 2000,
      }).open();
    }

    setSheetOpened(false);
    setFormData({ label: '', url: '', authToken: '', allowed_tools: '', skip_approval: true });
  };

  const handleDelete = (server: McpServer) => {
    f7.dialog.confirm(
      `Delete "${server.label}" server?`,
      'Delete Server',
      () => {
        removeMcpServer(server.id);
        f7.toast.create({
          text: 'Server removed',
          position: 'bottom',
          closeTimeout: 2000,
        }).open();
      }
    );
  };

  const handleToggle = (server: McpServer, enabled: boolean) => {
    updateMcpServer(server.id, { enabled });
    
    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(1);
    }
  };

  return (
    <>
      <Page>
        <Navbar>
          <NavTitle>MCP Servers</NavTitle>
          <NavRight>
            <Link iconF7="xmark" onClick={closePanel} />
          </NavRight>
        </Navbar>

        <Block>
          <p>Manage your Model Context Protocol servers for enhanced AI capabilities.</p>
        </Block>

        {mcpServers.length === 0 ? (
          <Block className="text-center">
            <Icon f7="server_rack" size={48} color="gray" />
            <p className="text-gray-500 mt-2">No servers configured</p>
            <p className="text-gray-400 text-sm">Add your first MCP server to get started</p>
          </Block>
        ) : (
          <div className="cards-container">
            {mcpServers.map((server) => (
              <Card key={server.id}>
                <CardHeader>
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <Icon f7="server_rack" size={20} color="purple" />
                      <span className="font-medium">{server.label}</span>
                    </div>
                    <Toggle
                      checked={server.enabled}
                      onToggleChange={(checked) => handleToggle(server, checked)}
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    <strong>Host:</strong> {server.url}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Status:</strong>{' '}
                    <span className={server.enabled ? 'text-green-600' : 'text-gray-400'}>
                      {server.enabled ? 'Active' : 'Inactive'}
                    </span>
                  </p>
                  {server.authToken && (
                    <p className="text-sm text-gray-600">
                      <strong>Auth:</strong> <span className="text-gray-400">••••••••</span>
                    </p>
                  )}
                </CardContent>
                <CardFooter>
                  <Link onClick={() => openEditSheet(server)}>Edit</Link>
                  <Link onClick={() => handleDelete(server)} className="color-red">
                    Delete
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {/* FAB for adding new server */}
        <Fab
          position="right-bottom"
          slot="fixed"
          color="purple"
          onClick={openAddSheet}
        >
          <Icon f7="plus" />
        </Fab>
      </Page>

      {/* Add/Edit Server Sheet */}
      <Sheet
        opened={sheetOpened}
        onSheetClosed={() => setSheetOpened(false)}
        swipeToClose
        backdrop
      >
        <Toolbar>
          <div className="left">
            <Link onClick={() => setSheetOpened(false)}>Cancel</Link>
          </div>
          <div className="right">
            <Link onClick={handleSave} className="font-bold">
              {editingServer ? 'Update' : 'Add'}
            </Link>
          </div>
        </Toolbar>
        <PageContent>
          <BlockTitle>{editingServer ? 'Edit Server' : 'Add MCP Server'}</BlockTitle>
          <List>
            <ListInput
              label="Server Name"
              type="text"
              placeholder="e.g., My Server"
              value={formData.label}
              onInput={(e) => setFormData({ ...formData, label: e.target.value })}
              required
              validate
              clearButton
            />
            <ListInput
              label="Host URL"
              type="url"
              placeholder="https://api.example.com"
              value={formData.url}
              onInput={(e) => setFormData({ ...formData, url: e.target.value })}
              required
              validate
              clearButton
            />
            <ListInput
              label="Auth Token"
              type="password"
              placeholder="Optional"
              value={formData.authToken}
              onInput={(e) => setFormData({ ...formData, authToken: e.target.value })}
              clearButton
              info="Leave empty if not required"
            />
          </List>
          <Block>
            <Button fill raised onClick={handleSave} color="purple">
              {editingServer ? 'Update Server' : 'Add Server'}
            </Button>
          </Block>
        </PageContent>
      </Sheet>
    </>
  );
}