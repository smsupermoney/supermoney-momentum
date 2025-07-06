
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useMemo } from 'react';
import type { User, Anchor, Dealer, Vendor, Task, ActivityLog, DailyActivity } from '@/lib/types';
import * as firestoreService from '@/services/firestore';
import { firebaseEnabled } from '@/lib/firebase';
import { mockUsers, mockAnchors, mockDealers, mockVendors, mockTasks, mockActivityLogs } from '@/lib/mock-data';

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
  dailyActivities: DailyActivity[];
  addDailyActivity: (activity: Omit<DailyActivity, 'id'>) => Promise<void>;
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
  const [users, setUsers] = useState<User[]>(mockUsers); // Start with mocks for login page
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDataLoading, setIsDataLoading] = useState(false);

  const [anchors, setAnchors] = useState<Anchor[]>([]);
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [dailyActivities, setDailyActivities] = useState<DailyActivity[]>([]);

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

  const loadAllData = useCallback(async (user: User) => {
    setIsDataLoading(true);
    try {
      const [
        fetchedUsers,
        fetchedAnchors,
        fetchedDealers,
        fetchedVendors,
        fetchedTasks,
        fetchedLogs,
        fetchedDailyActivities,
      ] = await Promise.all([
        firestoreService.getUsers(),
        firestoreService.getAnchors(user),
        firestoreService.getDealers(user),
        firestoreService.getVendors(user),
        firestoreService.getTasks(user),
        firestoreService.getActivityLogs(user),
        firestoreService.getDailyActivities(user),
      ]);
      
      setUsers(fetchedUsers.length > 0 ? fetchedUsers : mockUsers);
      setAnchors(fetchedAnchors);
      setDealers(fetchedDealers);
      setVendors(fetchedVendors);
      setTasks(fetchedTasks);
      setActivityLogs(fetchedLogs);
      setDailyActivities(fetchedDailyActivities);

    } catch (error) {
        console.error("Failed to load data from Firestore:", error);
    } finally {
        setIsDataLoading(false);
    }
  }, []);
  
  const loadMockData = useCallback(() => {
    setIsDataLoading(true);
    setUsers(mockUsers);
    setAnchors(mockAnchors);
    setDealers(mockDealers);
    setVendors(mockVendors);
    setTasks(mockTasks);
    setActivityLogs(mockActivityLogs);
    setDailyActivities([]); // No mock daily activities yet
    setIsDataLoading(false);
  }, []);

  useEffect(() => {
    if (currentUser && !isDataLoading) {
        if (firebaseEnabled) {
            loadAllData(currentUser);
        } else {
            loadMockData();
        }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

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

  const login = async (email: string, password: string): Promise<boolean> => {
    if (firebaseEnabled) {
        const user = await firestoreService.getUserByEmail(email.toLowerCase());
        if (user) { // In a real app, you'd verify the password here
            setCurrentUser(user);
            sessionStorage.setItem('currentUser', JSON.stringify(user));
            return true;
        }
        return false;
    } else {
        // Mock login
        if (password !== 'test123') return false;
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (user) {
          setCurrentUser(user);
          sessionStorage.setItem('currentUser', JSON.stringify(user));
          return true;
        }
        return false;
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setAnchors([]);
    setDealers([]);
    setVendors([]);
    setTasks([]);
    setActivityLogs([]);
    setDailyActivities([]);
    sessionStorage.removeItem('currentUser');
  };

  const addAnchor = async (anchorData: Omit<Anchor, 'id'>) => {
    if (firebaseEnabled) {
        const docRef = await firestoreService.addAnchor(anchorData);
        setAnchors(prev => [{ id: docRef.id, ...anchorData }, ...prev]);
    } else {
        const newAnchor = { id: `anchor-${Date.now()}`, ...anchorData };
        setAnchors(prev => [newAnchor, ...prev]);
    }
  };

  const updateAnchor = async (updatedAnchor: Anchor) => {
    if (firebaseEnabled) {
        await firestoreService.updateAnchor(updatedAnchor);
    }
    setAnchors(prev => prev.map(a => a.id === updatedAnchor.id ? updatedAnchor : a));
  };

  const addDealer = async (dealerData: Omit<Dealer, 'id'>) => {
    if (firebaseEnabled) {
        const docRef = await firestoreService.addDealer(dealerData);
        setDealers(prev => [{ id: docRef.id, ...dealerData }, ...prev]);
    } else {
        const newDealer = { id: `dealer-${Date.now()}`, ...dealerData };
        setDealers(prev => [newDealer, ...prev]);
    }
  };
  
  const updateDealer = async (updatedDealer: Dealer) => {
    if (firebaseEnabled) {
        await firestoreService.updateDealer(updatedDealer);
    }
    setDealers(prev => prev.map(d => d.id === updatedDealer.id ? updatedDealer : d));
  };
  
  const addVendor = async (vendorData: Omit<Vendor, 'id'>) => {
    if (firebaseEnabled) {
        const docRef = await firestoreService.addVendor(vendorData);
        setVendors(prev => [{ id: docRef.id, ...vendorData }, ...prev]);
    } else {
        const newVendor = { id: `vendor-${Date.now()}`, ...vendorData };
        setVendors(prev => [newVendor, ...prev]);
    }
  };

  const updateVendor = async (updatedVendor: Vendor) => {
    if (firebaseEnabled) {
        await firestoreService.updateVendor(updatedVendor);
    }
    setVendors(prev => prev.map(s => s.id === updatedVendor.id ? updatedVendor : s));
  };

  const addTask = async (taskData: Omit<Task, 'id'>) => {
    if (firebaseEnabled) {
        const docRef = await firestoreService.addTask(taskData);
        setTasks(prev => [{ id: docRef.id, ...taskData }, ...prev]);
    } else {
        const newTask = { id: `task-${Date.now()}`, ...taskData };
        setTasks(prev => [newTask, ...prev]);
    }
  };

  const updateTask = async (updatedTask: Task) => {
    if (firebaseEnabled) {
        await firestoreService.updateTask(updatedTask);
    }
    setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
  };
  
  const addActivityLog = async (logData: Omit<ActivityLog, 'id'>) => {
    if (firebaseEnabled) {
        const docRef = await firestoreService.addActivityLog(logData);
        setActivityLogs(prev => [{ id: docRef.id, ...logData }, ...prev]);
    } else {
        const newLog = { id: `log-${Date.now()}`, ...logData };
        setActivityLogs(prev => [newLog, ...prev]);
    }
  }
  
  const addDailyActivity = async (activityData: Omit<DailyActivity, 'id'>) => {
    if (firebaseEnabled) {
        const docRef = await firestoreService.addDailyActivity(activityData);
        setDailyActivities(prev => [{ id: docRef.id, ...activityData }, ...prev]);
    } else {
        const newActivity = { id: `daily-activity-${Date.now()}`, ...activityData };
        setDailyActivities(prev => [newActivity, ...prev]);
    }
  };

  const addUser = async (userData: Omit<User, 'uid'|'id'>) => {
    if (firebaseEnabled) {
        const newUser = await firestoreService.addUser(userData);
        setUsers(prev => [newUser, ...prev]);
    } else {
        const newUser = { id: `user-${Date.now()}`, uid: `user-${Date.now()}`, ...userData };
        setUsers(prev => [newUser, ...prev]);
    }
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

    