import React, { useState } from 'react';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import TestingProcessPage from './pages/TestingProcessPage';
import HistoryTestingPage from './pages/HistoryTestingPage';
import UserManagementPage from './pages/UserManagementPage';
import RoleManagementPage from './pages/RoleManagementPage';
import MasterDataModelPage from './pages/MasterDataModelPage';

import {
  INITIAL_USERS,
  INITIAL_ROLES,
  INITIAL_MODELS,
  INITIAL_HISTORY
} from './data/mockData';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeMenu, setActiveMenu] = useState('testing-process');

  // Application Data States
  const [users, setUsers] = useState(INITIAL_USERS);
  const [roles, setRoles] = useState(INITIAL_ROLES);
  const [models, setModels] = useState(INITIAL_MODELS);
  const [historyList, setHistoryList] = useState(INITIAL_HISTORY);

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    setActiveMenu('testing-process');
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const handleSaveToHistory = (newRecord) => {
    setHistoryList((prev) => [newRecord, ...prev]);
  };

  // If not logged in, render LoginPage
  if (!currentUser) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <Layout
      activeMenu={activeMenu}
      onNavigate={(menu) => setActiveMenu(menu)}
      onLogout={handleLogout}
    >
      {activeMenu === 'testing-process' && (
        <TestingProcessPage
          models={models}
          onNavigateToHistory={() => setActiveMenu('history-testing')}
          onSaveToHistory={handleSaveToHistory}
        />
      )}

      {activeMenu === 'history-testing' && (
        <HistoryTestingPage
          historyList={historyList}
          models={models}
          onBackToTesting={() => setActiveMenu('testing-process')}
        />
      )}

      {activeMenu === 'user-management' && (
        <UserManagementPage users={users} onUpdateUsers={setUsers} roles={roles} />
      )}

      {activeMenu === 'role-management' && (
        <RoleManagementPage roles={roles} onUpdateRoles={setRoles} />
      )}

      {activeMenu === 'master-data-model' && (
        <MasterDataModelPage models={models} onUpdateModels={setModels} />
      )}
    </Layout>
  );
}
