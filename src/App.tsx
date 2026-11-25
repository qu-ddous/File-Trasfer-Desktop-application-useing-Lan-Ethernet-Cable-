import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard/Dashboard';
import { SendFiles } from './pages/Send/SendFiles';
import { ReceiveFiles } from './pages/Receive/ReceiveFiles';
import { Devices } from './pages/Devices/Devices';
import { ActiveTransfers } from './pages/Transfers/ActiveTransfers';
import { TransferHistory } from './pages/History/TransferHistory';
import { SettingsPage } from './pages/Settings/SettingsPage';
import { ShareApp } from './pages/Share/ShareApp';
import { ConsolePage } from './pages/Console/ConsolePage';
import { IncomingTransferModal } from './components/IncomingTransferModal';

const getInitialTab = () => {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab) return tab;
  }
  return 'dashboard';
};

const AppContent: React.FC = () => {
  const [currentTab, setCurrentTab] = useState(getInitialTab);
  const { networkStatus, activeTransfers } = useApp();

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-[#0F172A] relative">
      <IncomingTransferModal />
      <Sidebar
        currentTab={currentTab}
        setTab={setCurrentTab}
        isOnline={networkStatus?.is_connected ?? false}
        activeCount={activeTransfers.length}
      />
      <main className="flex-1 overflow-y-auto p-8">
        {currentTab === 'dashboard' && <Dashboard onNavigate={setCurrentTab} />}
        {currentTab === 'send' && <SendFiles onNavigate={setCurrentTab} />}
        {currentTab === 'receive' && <ReceiveFiles />}
        {currentTab === 'devices' && <Devices />}
        {currentTab === 'share' && <ShareApp />}
        {currentTab === 'transfers' && <ActiveTransfers />}
        {currentTab === 'history' && <TransferHistory />}
        {currentTab === 'console' && <ConsolePage />}
        {currentTab === 'settings' && <SettingsPage />}
      </main>
    </div>
  );
};

export function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
