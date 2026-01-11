'use client';

import { useState } from 'react';
import { TabType } from '@/types';
import { StoreProvider, useStore } from '@/lib/store';
import { Header, CustomizeFeed, TwitterAlerts, ImportModal, ExportModal, AddHandleModal } from '@/components';

function HomePage() {
  const [activeTab, setActiveTab] = useState<TabType>('customize');
  const [showImportModal, setShowImportModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showAddHandleModal, setShowAddHandleModal] = useState(false);

  const { importList, exportList, addHandle } = useStore();

  const handleAddHandle = (handle: string) => {
    return addHandle(handle);
  };

  return (
    <div className="flex flex-col h-screen bg-black">
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onImport={() => setShowImportModal(true)}
        onExport={() => setShowExportModal(true)}
        onAddHandle={() => setShowAddHandleModal(true)}
      />

      <main className="flex-1 overflow-hidden">
        {activeTab === 'customize' && (
          <CustomizeFeed onAddHandle={handleAddHandle} />
        )}
        {activeTab === 'alerts' && <TwitterAlerts />}
      </main>

      <ImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={importList}
      />

      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        exportData={exportList()}
      />

      <AddHandleModal
        isOpen={showAddHandleModal}
        onClose={() => setShowAddHandleModal(false)}
        onAdd={handleAddHandle}
      />
    </div>
  );
}

export default function Page() {
  return (
    <StoreProvider>
      <HomePage />
    </StoreProvider>
  );
}
