'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { User, Anchor, Dealer, Supplier, Task, ActivityLog } from '@/lib/types';
import { mockUsers, mockAnchors, mockDealers, mockSuppliers, mockTasks, mockActivityLogs } from '@/lib/mock-data';

interface AppContextType {
  users: User[];
  currentUser: User;
  setCurrentUser: (user: User) => void;
  anchors: Anchor[];
  addAnchor: (anchor: Anchor) => void;
  updateAnchor: (anchor: Anchor) => void;
  dealers: Dealer[];
  addDealer: (dealer: Dealer) => void;
  updateDealer: (dealer: Dealer) => void;
  suppliers: Supplier[];
  addSupplier: (supplier: Supplier) => void;
  updateSupplier: (supplier: Supplier) => void;
  tasks: Task[];
  addTask: (task: Task) => void;
  updateTask: (task: Task) => void;
  activityLogs: ActivityLog[];
  addActivityLog: (log: ActivityLog) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [users] = useState<User[]>(mockUsers);
  const [currentUser, setCurrentUser] = useState<User>(mockUsers.find(u => u.role === 'Sales') || mockUsers[0]);
  const [anchors, setAnchors] = useState<Anchor[]>(mockAnchors);
  const [dealers, setDealers] = useState<Dealer[]>(mockDealers);
  const [suppliers, setSuppliers] = useState<Supplier[]>(mockSuppliers);
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(mockActivityLogs);

  const addAnchor = (anchor: Anchor) => setAnchors(prev => [anchor, ...prev]);
  const updateAnchor = (updatedAnchor: Anchor) => {
    setAnchors(prev => prev.map(a => a.id === updatedAnchor.id ? updatedAnchor : a));
  };

  const addDealer = (dealer: Dealer) => setDealers(prev => [dealer, ...prev]);
    const updateDealer = (updatedDealer: Dealer) => {
    setDealers(prev => prev.map(d => d.id === updatedDealer.id ? updatedDealer : d));
  };
  
  const addSupplier = (supplier: Supplier) => setSuppliers(prev => [supplier, ...prev]);
    const updateSupplier = (updatedSupplier: Supplier) => {
    setSuppliers(prev => prev.map(s => s.id === updatedSupplier.id ? updatedSupplier : s));
  };

  const addTask = (task: Task) => setTasks(prev => [task, ...prev]);
  const updateTask = (updatedTask: Task) => {
    setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
  };
  
  const addActivityLog = (log: ActivityLog) => {
    const user = users.find(u => u.uid === currentUser.uid);
    const logWithUser = {...log, userName: user?.name || 'Unknown User'}
    setActivityLogs(prev => [logWithUser, ...prev]);
  }

  const value = {
    users,
    currentUser,
    setCurrentUser,
    anchors,
    addAnchor,
    updateAnchor,
    dealers,
    addDealer,
    updateDealer,
    suppliers,
    addSupplier,
    updateSupplier,
    tasks,
    addTask,
    updateTask,
    activityLogs,
    addActivityLog
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
