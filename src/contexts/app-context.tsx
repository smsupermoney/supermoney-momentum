
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useMemo } from 'react';
import type { User, Anchor, Dealer, Vendor, Task, ActivityLog, DailyActivity } from '@/lib/types';
import { mockUsers, mockAnchors, mockDealers, mockVendors, mockTasks, mockActivityLogs } from '@/lib/mock-data';

interface AppContextType {
  users: User[];
  addUser: (user: Omit<User, 'uid' | 'id'>) => void;
  currentUser: User | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  isLoading: boolean;
  anchors: Anchor[];
  addAnchor: (anchor: Omit<Anchor, 'id'>) => void;
  updateAnchor: (anchor: Anchor) => void;
  dealers: Dealer[];
  addDealer: (dealer: Omit<Dealer, 'id'>) => void;
  updateDealer: (dealer: Dealer) => void;
  vendors: Vendor[];
  addVendor: (vendor: Omit<Vendor, 'id'>) => void;
  updateVendor: (vendor: Vendor) => void;
  tasks: Task[];
  addTask: (task: Omit<Task, 'id'>) => void;
  updateTask: (task: Task) => void;
  activityLogs: ActivityLog[];
  addActivityLog: (log: Omit<ActivityLog, 'id'>) => void;
  dailyActivities: DailyActivity[];
  addDailyActivity: (activity: Omit<DailyActivity, 'id'>) => void;
  visibleUserIds: string[];
  visibleUsers: User[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const getAllSubordinates = (managerId: string, users: User[]): User[] => {
    const subordinates: User[] = [];
    const directReports = users.filter(u => u.managerId === managerId);
    subordinates.push(...directReports);
    directReports.forEach(report => {
        subordinates.push(...getAllSubordinates(report.uid, users));
    });
    return subordinates;
};


export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [anchors, setAnchors] = useState<Anchor[]>([]);
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [dailyActivities, setDailyActivities] = useState<DailyActivity[]>([]);

  useEffect(() => {
    // Load all data from mock files
    setUsers(mockUsers);
    setAnchors(mockAnchors);
    setDealers(mockDealers);
    setVendors(mockVendors);
    setTasks(mockTasks);
    setActivityLogs(mockActivityLogs);
    setDailyActivities([]);

    // Check for a logged-in user in session storage
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

  const visibleUsers = useMemo(() => {
      if (!currentUser || users.length === 0) return [];
      if (currentUser.role === 'Admin') return users;
      if (currentUser.role === 'Sales' || currentUser.role === 'Onboarding Specialist') {
          return users.filter(u => u.uid === currentUser.uid);
      }
      // For managers (ZSM, RSM, NSM)
      const subordinates = getAllSubordinates(currentUser.uid, users);
      const self = users.find(u => u.uid === currentUser.uid);
      return self ? [self, ...subordinates] : subordinates;
  }, [currentUser, users]);

  const visibleUserIds = useMemo(() => visibleUsers.map(u => u.uid), [visibleUsers]);

  const login = (email: string, password: string): boolean => {
    // Mock login
    if (password !== 'test123') return false;
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (user) {
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

  const addAnchor = (anchorData: Omit<Anchor, 'id'>) => {
    const newAnchor = { id: `anchor-${Date.now()}`, ...anchorData };
    setAnchors(prev => [newAnchor, ...prev]);
  };

  const updateAnchor = (updatedAnchor: Anchor) => {
    setAnchors(prev => prev.map(a => a.id === updatedAnchor.id ? updatedAnchor : a));
  };

  const addDealer = (dealerData: Omit<Dealer, 'id'>) => {
    const newDealer = { id: `dealer-${Date.now()}`, ...dealerData };
    setDealers(prev => [newDealer, ...prev]);
  };
  
  const updateDealer = (updatedDealer: Dealer) => {
    setDealers(prev => prev.map(d => d.id === updatedDealer.id ? updatedDealer : d));
  };
  
  const addVendor = (vendorData: Omit<Vendor, 'id'>) => {
    const newVendor = { id: `vendor-${Date.now()}`, ...vendorData };
    setVendors(prev => [newVendor, ...prev]);
  };

  const updateVendor = (updatedVendor: Vendor) => {
    setVendors(prev => prev.map(s => s.id === updatedVendor.id ? updatedVendor : s));
  };

  const addTask = (taskData: Omit<Task, 'id'>) => {
    const newTask = { id: `task-${Date.now()}`, ...taskData };
    setTasks(prev => [newTask, ...prev]);
  };

  const updateTask = (updatedTask: Task) => {
    setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
  };
  
  const addActivityLog = (logData: Omit<ActivityLog, 'id'>) => {
    const newLog = { id: `log-${Date.now()}`, ...logData };
    setActivityLogs(prev => [newLog, ...prev]);
  };
  
  const addDailyActivity = (activityData: Omit<DailyActivity, 'id'>) => {
    const newActivity = { id: `daily-activity-${Date.now()}`, ...activityData };
    setDailyActivities(prev => [newActivity, ...prev].sort((a,b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()));
  };

  const addUser = (userData: Omit<User, 'uid'|'id'>) => {
    const newUser = { id: `user-${Date.now()}`, uid: `user-${Date.now()}`, ...userData };
    setUsers(prev => [newUser, ...prev]);
  };

  const value = {
    users,
    addUser,
    currentUser,
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
    addActivityLog,
    dailyActivities,
    addDailyActivity,
    visibleUsers,
    visibleUserIds,
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
