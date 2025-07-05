'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import type { User, Anchor, Dealer, Vendor, Task, ActivityLog } from '@/lib/types';
import * as firestoreService from '@/services/firestore';
import { mockUsers as demoUsers } from '@/lib/mock-data';

interface AppContextType {
  users: User[];
  addUser: (user: Omit<User, 'uid' | 'id'>) => Promise<void>;
  currentUser: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  anchors: Anchor[];
  addAnchor: (anchor: Omit<Anchor, 'id'>) => Promise<void>;
  updateAnchor: (anchor: Anchor) => Promise<void>;
  dealers: Dealer[];
  addDealer: (dealer: Omit<Dealer, 'id'>) => Promise<void>;
  updateDealer: (dealer: Dealer) => Promise<void>;
  vendors: Vendor[];
  addVendor: (vendor: Omit<Vendor, 'id'>) => Promise<void>;
  updateVendor: (vendor: Vendor) => Promise<void>;
  tasks: Task[];
  addTask: (task: Omit<Task, 'id'>) => Promise<void>;
  updateTask: (task: Task) => Promise<void>;
  activityLogs: ActivityLog[];
  addActivityLog: (log: Omit<ActivityLog, 'id'>) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [users, setUsers] = useState<User[]>(demoUsers); // Keep demo users for login page list
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); // For initial auth check
  const [isDataLoading, setIsDataLoading] = useState(false); // For data fetching after login

  const [anchors, setAnchors] = useState<Anchor[]>([]);
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);

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

  const loadAllData = useCallback(async () => {
    setIsDataLoading(true);
    try {
      const [
        fetchedUsers,
        fetchedAnchors,
        fetchedDealers,
        fetchedVendors,
        fetchedTasks,
        fetchedLogs,
      ] = await Promise.all([
        firestoreService.getUsers(),
        firestoreService.getAnchors(),
        firestoreService.getDealers(),
        firestoreService.getVendors(),
        firestoreService.getTasks(),
        firestoreService.getActivityLogs(),
      ]);
      
      setUsers(fetchedUsers.length > 0 ? fetchedUsers : demoUsers);
      setAnchors(fetchedAnchors);
      setDealers(fetchedDealers);
      setVendors(fetchedVendors);
      setTasks(fetchedTasks);
      setActivityLogs(fetchedLogs);

    } catch (error) {
        console.error("Failed to load data from Firestore:", error);
    } finally {
        setIsDataLoading(false);
    }
  }, []);
  
  useEffect(() => {
      if (currentUser && !isDataLoading) {
          loadAllData();
      }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const login = async (email: string, password: string): Promise<boolean> => {
    if (password !== 'test123') return false;

    const user = await firestoreService.getUserByEmail(email.toLowerCase());
    
    if (user) {
      setCurrentUser(user);
      sessionStorage.setItem('currentUser', JSON.stringify(user));
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    setAnchors([]);
    setDealers([]);
    setVendors([]);
    setTasks([]);
    setActivityLogs([]);
    sessionStorage.removeItem('currentUser');
  };

  const addAnchor = async (anchorData: Omit<Anchor, 'id'>) => {
    const docRef = await firestoreService.addAnchor(anchorData);
    setAnchors(prev => [{ id: docRef.id, ...anchorData }, ...prev]);
  };

  const updateAnchor = async (updatedAnchor: Anchor) => {
    await firestoreService.updateAnchor(updatedAnchor);
    setAnchors(prev => prev.map(a => a.id === updatedAnchor.id ? updatedAnchor : a));
  };

  const addDealer = async (dealerData: Omit<Dealer, 'id'>) => {
    const docRef = await firestoreService.addDealer(dealerData);
    setDealers(prev => [{ id: docRef.id, ...dealerData }, ...prev]);
  };
  
  const updateDealer = async (updatedDealer: Dealer) => {
    await firestoreService.updateDealer(updatedDealer);
    setDealers(prev => prev.map(d => d.id === updatedDealer.id ? updatedDealer : d));
  };
  
  const addVendor = async (vendorData: Omit<Vendor, 'id'>) => {
    const docRef = await firestoreService.addVendor(vendorData);
    setVendors(prev => [{ id: docRef.id, ...vendorData }, ...prev]);
  };

  const updateVendor = async (updatedVendor: Vendor) => {
    await firestoreService.updateVendor(updatedVendor);
    setVendors(prev => prev.map(s => s.id === updatedVendor.id ? updatedVendor : s));
  };

  const addTask = async (taskData: Omit<Task, 'id'>) => {
    const docRef = await firestoreService.addTask(taskData);
    setTasks(prev => [{ id: docRef.id, ...taskData }, ...prev]);
  };

  const updateTask = async (updatedTask: Task) => {
    await firestoreService.updateTask(updatedTask);
    setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
  };
  
  const addActivityLog = async (logData: Omit<ActivityLog, 'id'>) => {
    const user = users.find(u => u.name === logData.userName);
    const logWithUser = {...logData, userName: user?.name || 'Unknown User'}
    const docRef = await firestoreService.addActivityLog(logWithUser);
    setActivityLogs(prev => [{ id: docRef.id, ...logWithUser }, ...prev]);
  }
  
  const addUser = async (userData: Omit<User, 'uid'|'id'>) => {
    const newUser = await firestoreService.addUser(userData);
    setUsers(prev => [newUser, ...prev]);
  };

  const value = {
    users,
    addUser,
    currentUser,
    login,
    logout,
    isLoading: isLoading || (!!currentUser && isDataLoading),
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
