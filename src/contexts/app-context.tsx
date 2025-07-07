
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useMemo, useCallback } from 'react';
import type { User, Anchor, Dealer, Vendor, Task, ActivityLog, DailyActivity, Notification } from '@/lib/types';
import { mockUsers, mockAnchors, mockDealers, mockVendors, mockTasks, mockActivityLogs } from '@/lib/mock-data';
import { isPast, isToday, isAfter, subDays, format } from 'date-fns';
import { useLanguage } from './language-context';
import { firebaseEnabled, auth, onAuthStateChanged, signOut as firebaseSignOut } from '@/lib/firebase';
import * as firestoreService from '@/services/firestore';
import { useToast } from '@/hooks/use-toast';

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
  notifications: Notification[];
  markNotificationAsRead: (notificationId: string) => void;
  markAllNotificationsAsRead: () => void;
  t: (key: string, params?: Record<string, string | number>) => string;
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
  const { t: translate } = useLanguage();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [anchors, setAnchors] = useState<Anchor[]>([]);
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [dailyActivities, setDailyActivities] = useState<DailyActivity[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const loadMockData = useCallback(() => {
    setUsers(mockUsers);
    setAnchors(mockAnchors);
    setDealers(mockDealers);
    setVendors(mockVendors);
    setTasks(mockTasks);
    setActivityLogs(mockActivityLogs);
    setDailyActivities([]);
    try {
      const storedUser = sessionStorage.getItem('currentUser');
      if (storedUser) {
        setCurrentUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Could not parse user from session storage", error);
    }
    setIsLoading(false);
  }, []);
  
  const logout = useCallback(async () => {
    if (firebaseEnabled && auth) {
      await firebaseSignOut(auth);
    }
    setCurrentUser(null);
    sessionStorage.removeItem('currentUser');
    setUsers(mockUsers); // Reset users to show login options
  }, []);

  useEffect(() => {
    if (!firebaseEnabled) {
      console.log("Firebase is not enabled. Loading mock data.");
      loadMockData();
      return;
    }
    
    if (!auth) {
        console.log("Firebase Auth is not available. Loading mock data.");
        loadMockData();
        return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      // Handle user being signed out
      if (!user) {
        setCurrentUser(null);
        sessionStorage.removeItem('currentUser');
        setUsers(mockUsers);
        setAnchors([]);
        setDealers([]);
        setVendors([]);
        setTasks([]);
        setActivityLogs([]);
        setDailyActivities([]);
        setIsLoading(false);
        return;
      }

      // Handle user being signed in
      try {
        setIsLoading(true);
        const userProfile = await firestoreService.checkAndCreateUser(user);
        
        if (!userProfile) {
          console.error(`Could not get or create a user profile for ${user.email}.`);
          await logout();
          setIsLoading(false);
          return;
        }

        // Set the current user and show the app shell immediately
        setCurrentUser(userProfile);
        const allUsers = await firestoreService.getUsers();
        setUsers(allUsers);
        setIsLoading(false);

        // Fetch remaining data in the background
        const [anchorsData, dealersData, vendorsData, tasksData, activityLogsData, dailyActivitiesData] = await Promise.all([
          firestoreService.getAnchors(userProfile, allUsers),
          firestoreService.getDealers(),
          firestoreService.getVendors(),
          firestoreService.getTasks(),
          firestoreService.getActivityLogs(),
          firestoreService.getDailyActivities(),
        ]);

        setAnchors(anchorsData);
        setDealers(dealersData);
        setVendors(vendorsData);
        setTasks(tasksData);
        setActivityLogs(activityLogsData);
        setDailyActivities(dailyActivitiesData);

      } catch (error: any) {
        console.error("Firebase error caught in onAuthStateChanged:", error);
        if (error.code === 'auth/invalid-api-key' || (error.message && error.message.includes('api-key-not-valid'))) {
            console.warn("Firebase API key is invalid. Falling back to mock data mode. Please check your .env file.");
            toast({
                variant: 'destructive',
                title: 'Invalid Firebase API Key',
                description: 'Falling back to mock data. Please check your .env file configuration.',
                duration: 9000
            })
            loadMockData();
        } else {
            console.error("An unexpected Firebase error occurred during data fetch:", error);
            toast({
                variant: 'destructive',
                title: 'Firebase Connection Error',
                description: 'Could not connect to the database. Using mock data.',
                duration: 9000
            })
            loadMockData();
        }
      }
    });

    return () => unsubscribe();
  }, [loadMockData, logout, toast]);

  const visibleUsers = useMemo(() => {
      if (!currentUser || users.length === 0) return [];
      if (currentUser.role === 'Admin') return users;
      if (currentUser.role === 'Sales' || currentUser.role === 'Onboarding Specialist') {
          return users.filter(u => u.uid === currentUser.uid);
      }
      const subordinates = getAllSubordinates(currentUser.uid, users);
      const self = users.find(u => u.uid === currentUser.uid);
      return self ? [self, ...subordinates] : subordinates;
  }, [currentUser, users]);

  const visibleUserIds = useMemo(() => visibleUsers.map(u => u.uid), [visibleUsers]);

  // --- Notification Generation ---
  useEffect(() => {
    if (isLoading || !currentUser || !tasks.length || !anchors.length) return;

    const generateNotifications = (): Notification[] => {
        const userNotifications: Notification[] = [];
        const now = new Date();

        const userTasks = tasks.filter(t => t.assignedTo === currentUser.uid && t.status !== 'Completed');

        userTasks
            .filter(t => isPast(new Date(t.dueDate)) && !isToday(new Date(t.dueDate)))
            .forEach(task => {
                userNotifications.push({
                    id: `notif-overdue-${task.id}`,
                    userId: currentUser.uid,
                    title: 'Task Overdue',
                    description: `Your task "${task.title}" was due on ${format(new Date(task.dueDate), 'MMM d')}.`,
                    href: `/tasks`,
                    timestamp: task.dueDate,
                    isRead: false,
                    icon: 'AlertTriangle'
                });
            });

        userTasks
            .filter(t => isToday(new Date(t.dueDate)))
            .forEach(task => {
                 userNotifications.push({
                    id: `notif-today-${task.id}`,
                    userId: currentUser.uid,
                    title: `Task Due Today`,
                    description: `Your task "${task.title}" is due today. Priority: ${task.priority}.`,
                    href: `/tasks`,
                    timestamp: new Date().toISOString(),
                    isRead: false,
                    icon: 'CalendarClock'
                });
            });

        if (['Admin', 'Zonal Sales Manager', 'Regional Sales Manager', 'National Sales Manager'].includes(currentUser.role)) {
            const subordinateIds = visibleUserIds.filter(id => id !== currentUser.uid);
            const subordinateAnchors = anchors.filter(a => subordinateIds.includes(a.assignedTo || ''));
            
            subordinateAnchors
                .filter(a => a.status === 'Active' && isAfter(new Date(a.updatedAt || a.createdAt), subDays(now, 2)))
                .forEach(anchor => {
                    const assignedUser = users.find(u => u.uid === anchor.assignedTo);
                    userNotifications.push({
                        id: `notif-deal-won-${anchor.id}`,
                        userId: currentUser.uid,
                        title: `Deal Won by ${assignedUser?.name || 'team'}`,
                        description: `${anchor.name} is now an active anchor.`,
                        href: `/anchors/${anchor.id}`,
                        timestamp: anchor.updatedAt || anchor.createdAt,
                        isRead: false,
                        icon: 'Trophy'
                    });
                });
        }
        
        return userNotifications;
    };

    const newNotifications = generateNotifications();
    try {
        const readNotifications = JSON.parse(sessionStorage.getItem(`readNotifications_${currentUser.uid}`) || '[]');
        const finalNotifications = newNotifications.map(n => ({
            ...n,
            isRead: readNotifications.includes(n.id)
        })).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setNotifications(finalNotifications);
    } catch (e) {
        setNotifications(newNotifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
    }

  }, [isLoading, currentUser, tasks, anchors, users, visibleUserIds]);
  
  const markNotificationAsRead = (notificationId: string) => {
      setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n));
      try {
          const read = JSON.parse(sessionStorage.getItem(`readNotifications_${currentUser?.uid}`) || '[]');
          if (!read.includes(notificationId)) {
              sessionStorage.setItem(`readNotifications_${currentUser?.uid}`, JSON.stringify([...read, notificationId]));
          }
      } catch (e) {}
  };

  const markAllNotificationsAsRead = () => {
      const allIds = notifications.map(n => n.id);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      try {
          sessionStorage.setItem(`readNotifications_${currentUser?.uid}`, JSON.stringify(allIds));
      } catch (e) {}
  };

  const login = (email: string, password: string): boolean => {
    if (firebaseEnabled) {
      toast({ variant: 'destructive', title: 'Login method changed', description: 'Please use the "Sign in with Google" button.' });
      return false;
    }
    if (password !== 'test123') return false;
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (user) {
      setCurrentUser(user);
      sessionStorage.setItem('currentUser', JSON.stringify(user));
      return true;
    }
    return false;
  };

  const addAnchor = async (anchorData: Omit<Anchor, 'id'>) => {
    if (firebaseEnabled) {
      await firestoreService.addAnchor(anchorData);
      setAnchors(prev => [{ ...anchorData, id: `temp-${Date.now()}` }, ...prev]); // Optimistic update
    } else {
      const newAnchor = { ...anchorData, id: `anchor-${Date.now()}`};
      setAnchors(prev => [newAnchor, ...prev]);
    }
  };

  const updateAnchor = async (updatedAnchor: Anchor) => {
    if (firebaseEnabled) {
      await firestoreService.updateAnchor(updatedAnchor);
    }
    setAnchors(prev => prev.map(a => a.id === updatedAnchor.id ? {...updatedAnchor, updatedAt: new Date().toISOString()} : a));
  };

  const addDealer = async (dealerData: Omit<Dealer, 'id'>) => {
    if(firebaseEnabled) {
      await firestoreService.addDealer(dealerData);
    }
    const newDealer = { ...dealerData, id: `dealer-${Date.now()}` };
    setDealers(prev => [newDealer, ...prev]);
  };
  
  const updateDealer = async (updatedDealer: Dealer) => {
    if(firebaseEnabled) {
      await firestoreService.updateDealer(updatedDealer);
    }
    setDealers(prev => prev.map(d => d.id === updatedDealer.id ? updatedDealer : d));
  };
  
  const addVendor = async (vendorData: Omit<Vendor, 'id'>) => {
    if (firebaseEnabled) {
      await firestoreService.addVendor(vendorData);
    }
    const newVendor = { ...vendorData, id: `vendor-${Date.now()}` };
    setVendors(prev => [newVendor, ...prev]);
  };

  const updateVendor = async (updatedVendor: Vendor) => {
    if(firebaseEnabled) {
      await firestoreService.updateVendor(updatedVendor);
    }
    setVendors(prev => prev.map(s => s.id === updatedVendor.id ? updatedVendor : s));
  };

  const addTask = async (taskData: Omit<Task, 'id'>) => {
    if (firebaseEnabled) {
      await firestoreService.addTask(taskData);
    }
    const newTask = { ...taskData, id: `task-${Date.now()}` };
    setTasks(prev => [newTask, ...prev]);
  };

  const updateTask = async (updatedTask: Task) => {
    if (firebaseEnabled) {
      await firestoreService.updateTask(updatedTask);
    }
    setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
  };
  
  const addActivityLog = async (logData: Omit<ActivityLog, 'id'>) => {
    if (firebaseEnabled) {
      await firestoreService.addActivityLog(logData);
    }
    const newLog = { ...logData, id: `log-${Date.now()}` };
    setActivityLogs(prev => [newLog, ...prev]);
  };
  
  const addDailyActivity = async (activityData: Omit<DailyActivity, 'id'>) => {
    if (firebaseEnabled) {
      await firestoreService.addDailyActivity(activityData);
    }
    const newActivity = { ...activityData, id: `daily-activity-${Date.now()}` };
    setDailyActivities(prev => [newActivity, ...prev].sort((a,b) => new Date(b.activityTimestamp).getTime() - new Date(a.activityTimestamp).getTime()));
  };

  const addUser = async (userData: Omit<User, 'uid'|'id'>) => {
     if (firebaseEnabled) {
      toast({ variant: 'destructive', title: 'Action Not Allowed', description: 'User creation should be handled via Firebase Authentication console.' });
      return;
    }
    const newUser = { id: `user-${Date.now()}`, uid: `user-${Date.now()}`, ...userData };
    setUsers(prev => [newUser, ...prev]);
  };
  
  const t = useCallback((key: string, params?: Record<string, string | number>) => {
    let str = translate(key);
    if(params) {
        Object.keys(params).forEach(pKey => {
            str = str.replace(`{${pKey}}`, String(params[pKey]));
        })
    }
    return str;
  }, [translate]);

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
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    t
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
