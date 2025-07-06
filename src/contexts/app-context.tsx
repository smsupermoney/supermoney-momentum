
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useMemo, useCallback } from 'react';
import type { User, Anchor, Dealer, Vendor, Task, ActivityLog, DailyActivity, Notification } from '@/lib/types';
import { mockUsers, mockAnchors, mockDealers, mockVendors, mockTasks, mockActivityLogs } from '@/lib/mock-data';
import { isPast, isToday, isAfter, subDays, format } from 'date-fns';
import { useLanguage } from './language-context';

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

  useEffect(() => {
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

        // --- Notifications for the Current User ---
        const userTasks = tasks.filter(t => t.assignedTo === currentUser.uid && t.status !== 'Completed');

        // 1. Overdue tasks
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

        // 2. Tasks due today
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


        // --- Notifications for Managers ---
        if (['Admin', 'Zonal Sales Manager', 'Regional Sales Manager', 'National Sales Manager'].includes(currentUser.role)) {
            const subordinateIds = visibleUserIds.filter(id => id !== currentUser.uid);
            
            // 3. Deal Won by a reportee
            const subordinateAnchors = anchors.filter(a => subordinateIds.includes(a.assignedTo || ''));
            
            subordinateAnchors
                .filter(a => a.status === 'Active' && isAfter(new Date(a.updatedAt || a.createdAt), subDays(now, 2))) // Recently became active
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
    const newAnchor = { id: `anchor-${Date.now()}`, createdAt: new Date().toISOString(), ...anchorData };
    setAnchors(prev => [newAnchor, ...prev]);
  };

  const updateAnchor = (updatedAnchor: Anchor) => {
    setAnchors(prev => prev.map(a => a.id === updatedAnchor.id ? {...updatedAnchor, updatedAt: new Date().toISOString()} : a));
  };

  const addDealer = (dealerData: Omit<Dealer, 'id'>) => {
    const newDealer = { id: `dealer-${Date.now()}`, createdAt: new Date().toISOString(), ...dealerData };
    setDealers(prev => [newDealer, ...prev]);
  };
  
  const updateDealer = (updatedDealer: Dealer) => {
    setDealers(prev => prev.map(d => d.id === updatedDealer.id ? updatedDealer : d));
  };
  
  const addVendor = (vendorData: Omit<Vendor, 'id'>) => {
    const newVendor = { id: `vendor-${Date.now()}`, createdAt: new Date().toISOString(), ...vendorData };
    setVendors(prev => [newVendor, ...prev]);
  };

  const updateVendor = (updatedVendor: Vendor) => {
    setVendors(prev => prev.map(s => s.id === updatedVendor.id ? updatedVendor : s));
  };

  const addTask = (taskData: Omit<Task, 'id'>) => {
    const newTask = { id: `task-${Date.now()}`, createdAt: new Date().toISOString(), ...taskData };
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
    setDailyActivities(prev => [newActivity, ...prev].sort((a,b) => new Date(b.activityTimestamp).getTime() - new Date(a.activityTimestamp).getTime()));
  };

  const addUser = (userData: Omit<User, 'uid'|'id'>) => {
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
