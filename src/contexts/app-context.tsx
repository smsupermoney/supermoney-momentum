'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { User, Anchor, Dealer, Vendor, Task, ActivityLog } from '@/lib/types';
import { mockUsers, mockAnchors, mockDealers, mockVendors, mockTasks, mockActivityLogs } from '@/lib/mock-data';

interface AppContextType {
  users: User[];
  addUser: (user: User) => void;
  currentUser: User | null;
  setCurrentUser: (user: User) => void;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  isLoading: boolean;
  anchors: Anchor[];
  addAnchor: (anchor: Anchor) => void;
  updateAnchor: (anchor: Anchor) => void;
  dealers: Dealer[];
  addDealer: (dealer: Dealer) => void;
  updateDealer: (dealer: Dealer) => void;
  vendors: Vendor[];
  addVendor: (vendor: Vendor) => void;
  updateVendor: (vendor: Vendor) => void;
  tasks: Task[];
  addTask: (task: Task) => void;
  updateTask: (task: Task) => void;
  activityLogs: ActivityLog[];
  addActivityLog: (log: ActivityLog) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [anchors, setAnchors] = useState<Anchor[]>(mockAnchors);
  const [dealers, setDealers] = useState<Dealer[]>(mockDealers);
  const [vendors, setVendors] = useState<Vendor[]>(mockVendors);
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(mockActivityLogs);

  useEffect(() => {
    try {
      const storedUser = sessionStorage.getItem('currentUser');
      if (storedUser) {
        setCurrentUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Could not parse user from session storage", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = (email: string, password: string): boolean => {
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (user && password === 'test123') {
      setCurrentUser(user);
      sessionStorage.setItem('currentUser', JSON.stringify(user));
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    sessionStorage.removeItem('currentUser');
  };

  const addAnchor = (anchor: Anchor) => setAnchors(prev => [anchor, ...prev]);
  const updateAnchor = (updatedAnchor: Anchor) => {
    setAnchors(prev => prev.map(a => a.id === updatedAnchor.id ? updatedAnchor : a));
  };

  const addDealer = (dealer: Dealer) => setDealers(prev => [dealer, ...prev]);
    const updateDealer = (updatedDealer: Dealer) => {
    setDealers(prev => prev.map(d => d.id === updatedDealer.id ? updatedDealer : d));
  };
  
  const addVendor = (vendor: Vendor) => setVendors(prev => [vendor, ...prev]);
    const updateVendor = (updatedVendor: Vendor) => {
    setVendors(prev => prev.map(s => s.id === updatedVendor.id ? updatedVendor : s));
  };

  const addTask = (task: Task) => setTasks(prev => [task, ...prev]);
  const updateTask = (updatedTask: Task) => {
    setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
  };
  
  const addActivityLog = (log: ActivityLog) => {
    const user = users.find(u => u.name === log.userName);
    const logWithUser = {...log, userName: user?.name || 'Unknown User'}
    setActivityLogs(prev => [logWithUser, ...prev]);
  }
  
  const addUser = (user: User) => setUsers(prev => [user, ...prev]);

  const value = {
    users,
    addUser,
    currentUser,
    setCurrentUser,
    login,
    logout,
    isLoading,
    anchors,
    addAnchor,
    updateAnchor,
    dealers,
    addDealer,
    updateDealer,
    vendors,
    addVendor,
    updateVendor,
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
