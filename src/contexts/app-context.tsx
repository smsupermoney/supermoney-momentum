

'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useMemo, useCallback } from 'react';
import type { User, Anchor, Dealer, Vendor, Task, ActivityLog, DailyActivity, Notification } from '@/lib/types';
import { mockUsers, mockAnchors, mockDealers, mockVendors, mockTasks, mockActivityLogs, mockDailyActivities } from '@/lib/mock-data';
import { isPast, isToday, isAfter, subDays, format } from 'date-fns';
import { useLanguage } from './language-context';
import { firebaseEnabled, auth, onAuthStateChanged, signOut as firebaseSignOut } from '@/lib/firebase';
import * as firestoreService from '@/services/firestore';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { NewAnchorSchema, NewSpokeSchema, NewTaskSchema, NewDailyActivitySchema, NewUserSchema } from '@/lib/validation';


interface AppContextType {
  users: User[];
  addUser: (user: Omit<User, 'uid' | 'id'>) => void;
  deleteUser: (userId: string) => void;
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
  deleteDealer: (dealerId: string) => void;
  vendors: Vendor[];
  addVendor: (vendor: Omit<Vendor, 'id'>) => void;
  updateVendor: (vendor: Vendor) => void;
  deleteVendor: (vendorId: string) => void;
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
    setDailyActivities(mockDailyActivities);
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
    if (!firebaseEnabled || !auth) {
      console.log("Firebase not enabled or auth not available. Loading mock data.");
      loadMockData();
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        // Handle sign out
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

      // **Optimistic UI update**
      // Create a temporary user object from the auth data to show the UI immediately.
      const optimisticUser: User = {
        id: user.uid,
        uid: user.uid,
        name: user.displayName || 'User',
        email: user.email || '',
        role: 'Area Sales Manager', // Default role, will be updated shortly
      };

      // Set the optimistic user and stop the main loading screen.
      setCurrentUser(optimisticUser);
      setIsLoading(false);

      // **Full data load in the background**
      const loadFullUserData = async () => {
        try {
          // Get the full, correct user profile from Firestore.
          const userProfile = await firestoreService.checkAndCreateUser(user);

          if (!userProfile) {
            console.error(`Could not get or create a user profile for ${user.email}.`);
            await logout();
            return;
          }

          // Update the context with the full user profile, including the correct role.
          setCurrentUser(userProfile);
          sessionStorage.setItem('currentUser', JSON.stringify(userProfile));

          // Now fetch all other data based on the correct profile.
          const allUsers = await firestoreService.getUsers();
          setUsers(allUsers);
  
          const [anchorsData, dealersData, vendorsData, tasksData, activityLogsData, dailyActivitiesData] = await Promise.all([
            firestoreService.getAnchors(),
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
            console.error("Firebase error caught during full data load:", error);
            if (error.code === 'auth/api-key-not-valid' || (error.message && error.message.includes('api-key-not-valid'))) {
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
      };

      loadFullUserData();
    });

    return () => unsubscribe();
  }, [loadMockData, logout, toast]);

  const visibleUsers = useMemo(() => {
      if (!currentUser || users.length === 0) return [];
      if (currentUser.role === 'Admin' || currentUser.role === 'Business Development') return users;
      if (currentUser.role === 'Area Sales Manager') {
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

        if (['Admin'].includes(currentUser.role)) {
            const pendingAnchors = anchors.filter(a => a.status === 'Pending Approval');
            pendingAnchors.forEach(anchor => {
                 const creator = users.find(u => u.uid === anchor.createdBy);
                 userNotifications.push({
                    id: `notif-approval-${anchor.id}`,
                    userId: currentUser.uid,
                    title: `New Anchor for Approval`,
                    description: `${anchor.name} created by ${creator?.name || 'BD'} is waiting for your approval.`,
                    href: `/admin`,
                    timestamp: anchor.createdAt,
                    isRead: false,
                    icon: 'Star'
                });
            })
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
  
  const addActivityLog = async (logData: Omit<ActivityLog, 'id'>) => {
    if (firebaseEnabled) {
      await firestoreService.addActivityLog(logData);
    }
    const newLog = { ...logData, id: `log-${Date.now()}` };
    setActivityLogs(prev => [newLog, ...prev]);
  };

  const addAnchor = async (anchorData: Omit<Anchor, 'id'>) => {
    try {
      NewAnchorSchema.parse(anchorData);
    } catch (e) {
      if (e instanceof z.ZodError) {
        console.error("Server-side validation failed for new anchor:", e.flatten().fieldErrors);
        toast({
          variant: 'destructive',
          title: 'Validation Error',
          description: Object.values(e.flatten().fieldErrors).flat().join(', '),
        });
        return;
      }
    }
    if (!currentUser) return;

    if (firebaseEnabled) {
      const docRef = await firestoreService.addAnchor(anchorData);
      const newAnchor = { ...anchorData, id: docRef.id };
      setAnchors(prev => [newAnchor, ...prev]);
      addActivityLog({
        anchorId: newAnchor.id,
        timestamp: new Date().toISOString(),
        type: 'Creation',
        title: 'Anchor Lead Created',
        outcome: `New anchor '${newAnchor.name}' was created by ${currentUser.name}.`,
        userName: 'System',
        userId: currentUser.uid,
        systemGenerated: true,
      });
    } else {
      const newAnchor = { ...anchorData, id: `anchor-${Date.now()}`};
      setAnchors(prev => [newAnchor, ...prev]);
      addActivityLog({
        anchorId: newAnchor.id,
        timestamp: new Date().toISOString(),
        type: 'Creation',
        title: 'Anchor Lead Created',
        outcome: `New anchor '${newAnchor.name}' was created by ${currentUser.name}.`,
        userName: 'System',
        userId: currentUser.uid,
        systemGenerated: true,
      });
    }
  };

  const updateAnchor = async (updatedAnchor: Anchor) => {
    try {
        NewAnchorSchema.extend({ id: z.string() }).parse(updatedAnchor);
    } catch (e) {
        if (e instanceof z.ZodError) {
            console.error("Server-side validation failed for anchor update:", e.flatten().fieldErrors);
            toast({ variant: 'destructive', title: 'Validation Error', description: 'Invalid data for anchor update.' });
            return;
        }
    }
    const oldAnchor = anchors.find(a => a.id === updatedAnchor.id);
    if (firebaseEnabled) {
      await firestoreService.updateAnchor(updatedAnchor);
    }
    setAnchors(prev => prev.map(a => a.id === updatedAnchor.id ? {...updatedAnchor, updatedAt: new Date().toISOString()} : a));

    if (oldAnchor && oldAnchor.status !== updatedAnchor.status && currentUser) {
        addActivityLog({
            anchorId: updatedAnchor.id,
            timestamp: new Date().toISOString(),
            type: 'Status Change',
            title: `Status changed to ${updatedAnchor.status}`,
            outcome: `Anchor status was updated from '${oldAnchor.status}' to '${updatedAnchor.status}' by ${currentUser.name}.`,
            userName: 'System',
            userId: currentUser.uid,
            systemGenerated: true,
        });
    }
  };

  const addDealer = async (dealerData: Omit<Dealer, 'id'>) => {
    try {
        NewSpokeSchema.parse(dealerData);
    } catch (e) {
        if (e instanceof z.ZodError) {
            console.error("Validation failed for new dealer:", e.flatten().fieldErrors);
            toast({ variant: 'destructive', title: 'Validation Error', description: 'Invalid data for new dealer.' });
            return;
        }
    }
    if (!currentUser) return;

    if(firebaseEnabled) {
      const docRef = await firestoreService.addDealer(dealerData);
      const newDealer = { ...dealerData, id: docRef.id };
      setDealers(prev => [newDealer, ...prev]);
      addActivityLog({
        dealerId: newDealer.id,
        anchorId: newDealer.anchorId || undefined,
        timestamp: new Date().toISOString(),
        type: 'Creation',
        title: 'Dealer Lead Created',
        outcome: `New dealer '${newDealer.name}' was created by ${currentUser.name}.`,
        userName: 'System',
        userId: currentUser.uid,
        systemGenerated: true,
      });
    } else {
        const newDealer = { ...dealerData, id: `dealer-${Date.now()}` };
        setDealers(prev => [newDealer, ...prev]);
        addActivityLog({
            dealerId: newDealer.id,
            anchorId: newDealer.anchorId || undefined,
            timestamp: new Date().toISOString(),
            type: 'Creation',
            title: 'Dealer Lead Created',
            outcome: `New dealer '${newDealer.name}' was created by ${currentUser.name}.`,
            userName: 'System',
            userId: currentUser.uid,
            systemGenerated: true,
        });
    }
  };
  
  const updateDealer = async (updatedDealer: Dealer) => {
    try {
        NewSpokeSchema.extend({ id: z.string() }).parse(updatedDealer);
    } catch (e) {
        if (e instanceof z.ZodError) {
            console.error("Validation failed for dealer update:", e.flatten().fieldErrors);
            toast({ variant: 'destructive', title: 'Validation Error', description: 'Invalid data for dealer update.' });
            return;
        }
    }
    const oldDealer = dealers.find(d => d.id === updatedDealer.id);
    if(firebaseEnabled) {
      await firestoreService.updateDealer(updatedDealer);
    }
    setDealers(prev => prev.map(d => d.id === updatedDealer.id ? updatedDealer : d));
    
    if (currentUser && oldDealer) {
        if (oldDealer.status !== updatedDealer.status) {
            addActivityLog({
                dealerId: updatedDealer.id,
                anchorId: updatedDealer.anchorId || undefined,
                timestamp: new Date().toISOString(),
                type: 'Status Change',
                title: `Dealer status changed`,
                outcome: `Dealer '${updatedDealer.name}' status changed from '${oldDealer.status}' to '${updatedDealer.status}' by ${currentUser.name}.`,
                userName: 'System',
                userId: currentUser.uid,
                systemGenerated: true,
            });
        }
        if (oldDealer.assignedTo !== updatedDealer.assignedTo) {
             const assignedUser = users.find(u => u.uid === updatedDealer.assignedTo);
             addActivityLog({
                dealerId: updatedDealer.id,
                anchorId: updatedDealer.anchorId || undefined,
                timestamp: new Date().toISOString(),
                type: 'Assignment',
                title: `Dealer reassigned`,
                outcome: `Dealer '${updatedDealer.name}' was assigned to ${assignedUser?.name || 'Unassigned'} by ${currentUser.name}.`,
                userName: 'System',
                userId: currentUser.uid,
                systemGenerated: true,
            });
        }
    }
  };

  const deleteDealer = async (dealerId: string) => {
    if (!currentUser || !['Admin', 'Business Development'].includes(currentUser.role)) {
        toast({ variant: 'destructive', title: 'Permission Denied', description: 'You do not have permission to delete leads.' });
        return;
    }
    const dealerToDelete = dealers.find(d => d.id === dealerId);
    if (firebaseEnabled) {
        await firestoreService.deleteDealer(dealerId);
    }
    setDealers(prev => prev.filter(d => d.id !== dealerId));
    toast({
        title: 'Dealer Deleted',
        description: 'The dealer has been removed from the system.',
    });
    if (dealerToDelete && currentUser) {
        addActivityLog({
            dealerId: dealerId,
            anchorId: dealerToDelete.anchorId || undefined,
            timestamp: new Date().toISOString(),
            type: 'Deletion',
            title: `Dealer Deleted`,
            outcome: `Dealer '${dealerToDelete.name}' was deleted by ${currentUser.name}.`,
            userName: 'System',
            userId: currentUser.uid,
            systemGenerated: true,
        });
    }
  };
  
  const addVendor = async (vendorData: Omit<Vendor, 'id'>) => {
     try {
        NewSpokeSchema.parse(vendorData);
    } catch (e) {
        if (e instanceof z.ZodError) {
            console.error("Validation failed for new vendor:", e.flatten().fieldErrors);
            toast({ variant: 'destructive', title: 'Validation Error', description: 'Invalid data for new vendor.' });
            return;
        }
    }
    if (!currentUser) return;
    if (firebaseEnabled) {
      const docRef = await firestoreService.addVendor(vendorData);
      const newVendor = { ...vendorData, id: docRef.id };
      setVendors(prev => [newVendor, ...prev]);
       addActivityLog({
          vendorId: newVendor.id,
          anchorId: newVendor.anchorId || undefined,
          timestamp: new Date().toISOString(),
          type: 'Creation',
          title: 'Vendor Lead Created',
          outcome: `New vendor '${newVendor.name}' was created by ${currentUser.name}.`,
          userName: 'System',
          userId: currentUser.uid,
          systemGenerated: true,
      });
    } else {
        const newVendor = { ...vendorData, id: `vendor-${Date.now()}` };
        setVendors(prev => [newVendor, ...prev]);
         addActivityLog({
          vendorId: newVendor.id,
          anchorId: newVendor.anchorId || undefined,
          timestamp: new Date().toISOString(),
          type: 'Creation',
          title: 'Vendor Lead Created',
          outcome: `New vendor '${newVendor.name}' was created by ${currentUser.name}.`,
          userName: 'System',
          userId: currentUser.uid,
          systemGenerated: true,
      });
    }
  };

  const updateVendor = async (updatedVendor: Vendor) => {
     try {
        NewSpokeSchema.extend({ id: z.string() }).parse(updatedVendor);
    } catch (e) {
        if (e instanceof z.ZodError) {
            console.error("Validation failed for vendor update:", e.flatten().fieldErrors);
            toast({ variant: 'destructive', title: 'Validation Error', description: 'Invalid data for vendor update.' });
            return;
        }
    }
    const oldVendor = vendors.find(s => s.id === updatedVendor.id);
    if(firebaseEnabled) {
      await firestoreService.updateVendor(updatedVendor);
    }
    setVendors(prev => prev.map(s => s.id === updatedVendor.id ? updatedVendor : s));

    if (currentUser && oldVendor) {
        if (oldVendor.status !== updatedVendor.status) {
            addActivityLog({
                vendorId: updatedVendor.id,
                anchorId: updatedVendor.anchorId || undefined,
                timestamp: new Date().toISOString(),
                type: 'Status Change',
                title: `Vendor status changed`,
                outcome: `Vendor '${updatedVendor.name}' status changed from '${oldVendor.status}' to '${updatedVendor.status}' by ${currentUser.name}.`,
                userName: 'System',
                userId: currentUser.uid,
                systemGenerated: true,
            });
        }
        if (oldVendor.assignedTo !== updatedVendor.assignedTo) {
             const assignedUser = users.find(u => u.uid === updatedVendor.assignedTo);
             addActivityLog({
                vendorId: updatedVendor.id,
                anchorId: updatedVendor.anchorId || undefined,
                timestamp: new Date().toISOString(),
                type: 'Assignment',
                title: `Vendor reassigned`,
                outcome: `Vendor '${updatedVendor.name}' was assigned to ${assignedUser?.name || 'Unassigned'} by ${currentUser.name}.`,
                userName: 'System',
                userId: currentUser.uid,
                systemGenerated: true,
            });
        }
    }
  };

  const deleteVendor = async (vendorId: string) => {
    if (!currentUser || !['Admin', 'Business Development'].includes(currentUser.role)) {
        toast({ variant: 'destructive', title: 'Permission Denied', description: 'You do not have permission to delete leads.' });
        return;
    }
    const vendorToDelete = vendors.find(v => v.id === vendorId);
    if (firebaseEnabled) {
        await firestoreService.deleteVendor(vendorId);
    }
    setVendors(prev => prev.filter(v => v.id !== vendorId));
    toast({
        title: 'Vendor Deleted',
        description: 'The vendor has been removed from the system.',
    });
    if (vendorToDelete && currentUser) {
        addActivityLog({
            vendorId: vendorId,
            anchorId: vendorToDelete.anchorId || undefined,
            timestamp: new Date().toISOString(),
            type: 'Deletion',
            title: `Vendor Deleted`,
            outcome: `Vendor '${vendorToDelete.name}' was deleted by ${currentUser.name}.`,
            userName: 'System',
            userId: currentUser.uid,
            systemGenerated: true,
        });
    }
  };

  const addTask = async (taskData: Omit<Task, 'id'>) => {
     try {
        NewTaskSchema.parse(taskData);
    } catch (e) {
        if (e instanceof z.ZodError) {
            console.error("Validation failed for new task:", e.flatten().fieldErrors);
            toast({ variant: 'destructive', title: 'Validation Error', description: 'Invalid data for new task.' });
            return;
        }
    }
    if (!currentUser) return;
    if (firebaseEnabled) {
      await firestoreService.addTask(taskData);
    }
    const newTask = { ...taskData, id: `task-${Date.now()}` };
    setTasks(prev => [newTask, ...prev]);
    addActivityLog({
        taskId: newTask.id,
        anchorId: newTask.associatedWith.anchorId,
        dealerId: newTask.associatedWith.dealerId,
        vendorId: newTask.associatedWith.vendorId,
        timestamp: new Date().toISOString(),
        type: 'Creation',
        title: 'Task Created',
        outcome: `Task '${newTask.title}' was created by ${currentUser.name}.`,
        userName: 'System',
        userId: currentUser.uid,
        systemGenerated: true,
    });
  };

  const updateTask = async (updatedTask: Task) => {
    try {
        NewTaskSchema.extend({ id: z.string() }).parse(updatedTask);
    } catch (e) {
        if (e instanceof z.ZodError) {
            console.error("Validation failed for task update:", e.flatten().fieldErrors);
            toast({ variant: 'destructive', title: 'Validation Error', description: 'Invalid data for task update.' });
            return;
        }
    }
    const oldTask = tasks.find(t => t.id === updatedTask.id);
    if (firebaseEnabled) {
      await firestoreService.updateTask(updatedTask);
    }
    setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));

    if (currentUser && oldTask && oldTask.status !== updatedTask.status) {
         addActivityLog({
            taskId: updatedTask.id,
            anchorId: updatedTask.associatedWith.anchorId,
            dealerId: updatedTask.associatedWith.dealerId,
            vendorId: updatedTask.associatedWith.vendorId,
            timestamp: new Date().toISOString(),
            type: 'Status Change',
            title: `Task status changed`,
            outcome: `Task '${updatedTask.title}' status changed from '${oldTask.status}' to '${updatedTask.status}' by ${currentUser.name}.`,
            userName: 'System',
            userId: currentUser.uid,
            systemGenerated: true,
         });
    }
  };
  
  const addDailyActivity = async (activityData: Omit<DailyActivity, 'id'>) => {
     try {
        NewDailyActivitySchema.parse(activityData);
    } catch (e) {
        if (e instanceof z.ZodError) {
            console.error("Validation failed for new daily activity:", e.flatten().fieldErrors);
            toast({ variant: 'destructive', title: 'Validation Error', description: 'Invalid data for daily activity.' });
            return;
        }
    }
    if (firebaseEnabled) {
      await firestoreService.addDailyActivity(activityData);
    }
    const newActivity = { ...activityData, id: `daily-activity-${Date.now()}` };
    setDailyActivities(prev => [newActivity, ...prev].sort((a,b) => new Date(b.activityTimestamp).getTime() - new Date(a.activityTimestamp).getTime()));
  };

  const addUser = async (userData: Omit<User, 'uid'|'id'>) => {
    try {
        NewUserSchema.parse(userData);
    } catch (e) {
        if (e instanceof z.ZodError) {
            console.error("Validation failed for new user:", e.flatten().fieldErrors);
            toast({ variant: 'destructive', title: 'Validation Error', description: 'Invalid data for new user.' });
            return;
        }
    }
    if (!currentUser) return;
     if (firebaseEnabled) {
        try {
            const newUser = await firestoreService.addUser(userData);
            setUsers(prev => [newUser, ...prev]);
             addActivityLog({
                timestamp: new Date().toISOString(),
                type: 'Creation',
                title: 'User Created',
                outcome: `New user '${newUser.name}' (${newUser.role}) was created by ${currentUser.name}.`,
                userName: 'System',
                userId: currentUser.uid,
                systemGenerated: true,
            });
        } catch (error) {
            console.error("Failed to add user to Firestore:", error);
            toast({ variant: 'destructive', title: 'Database Error', description: 'Could not save the new user.' });
        }
    } else { // mock mode
        const newUser = { id: `user-${Date.now()}`, uid: `user-${Date.now()}`, ...userData };
        setUsers(prev => [newUser, ...prev]);
         addActivityLog({
            timestamp: new Date().toISOString(),
            type: 'Creation',
            title: 'User Created',
            outcome: `New user '${newUser.name}' (${newUser.role}) was created by ${currentUser.name}.`,
            userName: 'System',
            userId: currentUser.uid,
            systemGenerated: true,
        });
    }
  };

  const deleteUser = async (userId: string) => {
    if (!currentUser || currentUser.role !== 'Admin') {
        toast({ variant: 'destructive', title: 'Permission Denied', description: 'Only Admins can delete users.' });
        return;
    }
    if (currentUser.uid === userId) {
        toast({ variant: 'destructive', title: 'Action Not Allowed', description: 'You cannot delete your own account.' });
        return;
    }
    const userToDelete = users.find(u => u.uid === userId);
    if(firebaseEnabled) {
      try {
        await firestoreService.deleteUser(userId);
        setUsers(prev => prev.filter(u => u.uid !== userId));
        toast({
          title: 'User Profile Deleted',
          description: 'The user profile has been removed from the CRM. Note: The authentication account still exists in Firebase.',
        });
      } catch (error) {
        console.error("Failed to delete user from Firestore:", error);
        toast({ variant: 'destructive', title: 'Database Error', description: 'Could not delete the user profile.' });
      }
    } else { // mock mode
        setUsers(prev => prev.filter(u => u.uid !== userId));
        toast({
          title: 'User Deleted',
          description: 'The user has been removed from the system.',
        });
    }
    if (userToDelete && currentUser) {
        addActivityLog({
            timestamp: new Date().toISOString(),
            type: 'Deletion',
            title: 'User Deleted',
            outcome: `User '${userToDelete.name}' was deleted by ${currentUser.name}.`,
            userName: 'System',
            userId: currentUser.uid,
            systemGenerated: true,
        });
    }
  }
  
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
    deleteUser,
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
    deleteDealer,
    vendors,
    addVendor,
    updateVendor,
    deleteVendor,
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
