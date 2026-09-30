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
  const [plcConnected, setPlcConnected] = useState(true);

  // Application Data States
  const [users, setUsers] = useState(INITIAL_USERS);
  const [roles, setRoles] = useState(INITIAL_ROLES);
  const [models, setModels] = useState(INITIAL_MODELS);
  const [historyList, setHistoryList] = useState(INITIAL_HISTORY);

  const isOperator =
    currentUser?.role === 'Operator' ||
    currentUser?.username === 'suep_astemo' ||
    currentUser?.idCard === 'AST-OP-002';

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    setActiveMenu('testing-process');
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const handleNavigate = (menu) => {
    // Suep (Operator) can only view Testing Process
    if (isOperator && menu !== 'testing-process') {
      return;
    }
    setActiveMenu(menu);
  };

  const handleSaveToHistory = (newRecord) => {
    setHistoryList((prev) => [newRecord, ...prev]);
  };

  const togglePlc = () => {
    setPlcConnected((prev) => !prev);
  };

  // If not logged in, render LoginPage
  if (!currentUser) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <Layout
      activeMenu={activeMenu}
      onNavigate={handleNavigate}
      onLogout={handleLogout}
      currentUser={currentUser}
      plcConnected={plcConnected}
      onTogglePlc={togglePlc}
    >
      {activeMenu === 'testing-process' && (
        <TestingProcessPage
          models={models}
          currentUser={currentUser}
          plcConnected={plcConnected}
          onNavigateToHistory={() => handleNavigate('history-testing')}
          onSaveToHistory={handleSaveToHistory}
        />
      )}

      {!isOperator && activeMenu === 'history-testing' && (
        <HistoryTestingPage
          historyList={historyList}
          models={models}
          onBackToTesting={() => handleNavigate('testing-process')}
        />
      )}

      {!isOperator && activeMenu === 'user-management' && (
        <UserManagementPage users={users} onUpdateUsers={setUsers} roles={roles} />
      )}

      {!isOperator && activeMenu === 'role-management' && (
        <RoleManagementPage roles={roles} onUpdateRoles={setRoles} />
      )}

      {!isOperator && activeMenu === 'master-data-model' && (
        <MasterDataModelPage models={models} onUpdateModels={setModels} />
      )}
    </Layout>
  );
}
