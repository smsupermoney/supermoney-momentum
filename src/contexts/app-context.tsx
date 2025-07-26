

'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useMemo, useCallback } from 'react';
import type { User, Anchor, Dealer, Vendor, Task, ActivityLog, DailyActivity, Notification, Lender, AnchorSPOC } from '@/lib/types';
import { mockUsers, mockAnchors, mockDealers, mockVendors, mockTasks, mockActivityLogs, mockDailyActivities } from '@/lib/mock-data';
import { isPast, isToday, format, differenceInDays } from 'date-fns';
import { useLanguage } from './language-context';
import { firebaseEnabled, auth, onAuthStateChanged, signOut as firebaseSignOut } from '@/lib/firebase';
import * as firestoreService from '@/services/firestore';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { NewAnchorSchema, NewSpokeSchema, NewTaskSchema, NewDailyActivitySchema, NewUserSchema, EditUserSchema, UpdateSpokeSchema } from '@/lib/validation';
import { sendNotificationEmail, SendNotificationEmailInput } from '@/ai/flows/send-notification-email-flow';
import { generateUniqueId } from '@/lib/utils';


interface AppContextType {
  users: User[];
  addUser: (user: Omit<User, 'uid' | 'id'>) => void;
  updateUser: (user: User) => void;
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
  addNotification: (notification: Omit<Notification, 'id' | 'isRead'>) => void;
  markNotificationAsRead: (notificationId: string) => void;
  markAllNotificationsAsRead: () => void;
  lenders: Lender[];
  addLender: (lender: Omit<Lender, 'id'>) => void;
  deleteLender: (lenderId: string) => void;
  reassignLeads: (fromUserId: string, toUserId: string) => void;
  sendEmail: (input: SendNotificationEmailInput) => Promise<void>;
  t: (key: string, params?: Record<string, string | number>) => string;
  anchorSPOCs: AnchorSPOC[];
  addAnchorSPOC: (spoc: Omit<AnchorSPOC, 'id'>) => void;
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
  const [isDataCleaned, setIsDataCleaned] = useState(false);

  const [anchors, setAnchors] = useState<Anchor[]>([]);
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [dailyActivities, setDailyActivities] = useState<DailyActivity[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [lenders, setLenders] = useState<Lender[]>([]);
  const [anchorSPOCs, setAnchorSPOCs] = useState<AnchorSPOC[]>([]);


  const loadMockData = useCallback(() => {
    setUsers(mockUsers);
    setAnchors(mockAnchors);
    setDealers(mockDealers);
    setVendors(mockVendors);
    setTasks(mockTasks);
    setActivityLogs(mockActivityLogs);
    setDailyActivities(mockDailyActivities);
    setLenders([{ id: 'lender-1', name: 'HDFC Bank'}, { id: 'lender-2', name: 'ICICI Bank'}]);
    setAnchorSPOCs([]);
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
    setIsDataCleaned(false); // Reset cleanup flag on logout
  }, []);

  useEffect(() => {
    if (!firebaseEnabled || !auth) {
      console.log("Firebase not enabled or auth not available. Loading mock data.");
      loadMockData();
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setIsLoading(true);
      if (user) {
        try {
          const userProfile = await firestoreService.checkAndCreateUser(user);
          if (userProfile) {
            setCurrentUser(userProfile);
            sessionStorage.setItem('currentUser', JSON.stringify(userProfile));

            // Fetch all other data AFTER the user profile is confirmed.
            const allUsers = await firestoreService.getUsers();
            setUsers(allUsers);
    
            const [anchorsData, dealersData, vendorsData, tasksData, activityLogsData, dailyActivitiesData, lendersData, spocsData] = await Promise.all([
              firestoreService.getAnchors(),
              firestoreService.getDealers(),
              firestoreService.getVendors(),
              firestoreService.getTasks(),
              firestoreService.getActivityLogs(),
              firestoreService.getDailyActivities(),
              firestoreService.getLenders(),
              firestoreService.getAnchorSPOCs(),
            ]);
    
            setAnchors(anchorsData);
            setDealers(dealersData);
            setVendors(vendorsData);
            setTasks(tasksData);
            setActivityLogs(activityLogsData);
            setDailyActivities(dailyActivitiesData);
            setLenders(lendersData);
            setAnchorSPOCs(spocsData);
          } else {
            console.error(`Could not get or create a user profile for ${user.email}. Logging out.`);
            await logout();
          }
        } catch (error: any) {
            console.error("Firebase error during data load:", error);
            toast({
                variant: 'destructive',
                title: 'Firebase Connection Error',
                description: 'Could not connect to the database. Using mock data.',
                duration: 9000
            });
            loadMockData();
        } finally {
            setIsLoading(false);
        }
      } else {
        // User is signed out
        setCurrentUser(null);
        sessionStorage.removeItem('currentUser');
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [loadMockData, logout, toast]);

  // Data inconsistency cleanup effect
  useEffect(() => {
    if (isLoading || isDataCleaned || (dealers.length === 0 && vendors.length === 0)) {
      return;
    }
  
    const dealersToUpdate = dealers.filter(d => d.status === 'Unassigned Lead' && d.assignedTo);
    const vendorsToUpdate = vendors.filter(v => v.status === 'Unassigned Lead' && v.assignedTo);
  
    if (dealersToUpdate.length > 0) {
      console.log(`Correcting status for ${dealersToUpdate.length} assigned dealer(s) marked as unassigned.`);
      dealersToUpdate.forEach(dealer => {
        updateDealer({ ...dealer, status: 'New' });
      });
    }
  
    if (vendorsToUpdate.length > 0) {
      console.log(`Correcting status for ${vendorsToUpdate.length} assigned vendor(s) marked as unassigned.`);
      vendorsToUpdate.forEach(vendor => {
        updateVendor({ ...vendor, status: 'New' });
      });
    }
  
    // This effect should only run once after the initial data load.
    setIsDataCleaned(true);
  
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, dealers, vendors, isDataCleaned]);


  const visibleUsers = useMemo(() => {
    if (!currentUser || !users.length) return [];
    if (currentUser.role === 'Admin' || currentUser.role === 'Business Development' || currentUser.role === 'BIU' || currentUser.role === 'ETB Manager') {
      return users;
    }
    
    const self = users.find(u => u.uid === currentUser.uid);
    if (!self) return [];

    const subordinates = getAllSubordinates(currentUser.uid, users);
    return [self, ...subordinates];
  }, [currentUser, users]);

  const visibleUserIds = useMemo(() => visibleUsers.map(u => u.uid), [visibleUsers]);

  // --- Notification and Automatic Task Generation ---
  useEffect(() => {
    if (isLoading || !currentUser || !tasks.length || !anchors.length) return;

    // Automatic Re-assignment Logic
    const AUTOMATED_USER_EMAIL = "harshita.nagpal@supermoney.in";
    const STALE_LEAD_THRESHOLD_DAYS = 60;
    const STALE_STATUSES: (typeof dealers[0]['status'])[] = ['New', 'Partial Docs', 'Follow Up'];
    
    const harshitaUser = users.find(u => u.email === AUTOMATED_USER_EMAIL);

    if (harshitaUser) {
        const leadsToReassign = [...dealers, ...vendors].filter(lead => 
            lead.product === 'Primary' &&
            STALE_STATUSES.includes(lead.status) &&
            lead.assignedTo !== harshitaUser.uid &&
            differenceInDays(new Date(), new Date(lead.createdAt)) > STALE_LEAD_THRESHOLD_DAYS
        );

        leadsToReassign.forEach(lead => {
            const leadType = 'contactNumber' in lead ? 'Dealer' : 'Vendor';
            const updateFunction = leadType === 'Dealer' ? updateDealer : updateVendor;
            updateFunction({...lead, assignedTo: harshitaUser.uid});
            addActivityLog({
                dealerId: leadType === 'Dealer' ? lead.id : undefined,
                vendorId: leadType === 'Vendor' ? lead.id : undefined,
                timestamp: new Date().toISOString(),
                type: 'Assignment',
                title: 'Lead Automatically Re-assigned',
                outcome: `Lead '${lead.name}' was automatically re-assigned to ${harshitaUser.name} due to inactivity (TAT > ${STALE_LEAD_THRESHOLD_DAYS} days).`,
                userName: 'System',
                userId: 'system',
                systemGenerated: true,
            });
        });
    }


    const generateNotifications = (): Omit<Notification, 'id' | 'isRead'>[] => {
        const userNotifications: Omit<Notification, 'id' | 'isRead'>[] = [];

        const userTasks = tasks.filter(t => t.assignedTo === currentUser.uid && t.status !== 'Completed');

        userTasks
            .filter(t => isPast(new Date(t.dueDate)) && !isToday(new Date(t.dueDate)))
            .forEach(task => {
                userNotifications.push({
                    userId: currentUser.uid,
                    title: 'Task Overdue',
                    description: `Your task "${task.title}" was due on ${format(new Date(task.dueDate), 'MMM d')}.`,
                    href: `/tasks`,
                    timestamp: task.dueDate,
                    icon: 'AlertTriangle'
                });
                
                // Trigger simulated email for overdue task
                sendNotificationEmail({
                    to: currentUser.email,
                    type: 'TaskOverdue',
                    context: {
                        taskTitle: task.title,
                        taskDueDate: format(new Date(task.dueDate), 'PPP'),
                    }
                });
            });

        userTasks
            .filter(t => isToday(new Date(t.dueDate)))
            .forEach(task => {
                 userNotifications.push({
                    userId: currentUser.uid,
                    title: `Task Due Today`,
                    description: `Your task "${task.title}" is due today. Priority: ${task.priority}.`,
                    href: `/tasks`,
                    timestamp: new Date().toISOString(),
                    icon: 'CalendarClock'
                });
            });

        if (['Admin'].includes(currentUser.role)) {
            const pendingDealers = dealers.filter(a => a.status === 'Unassigned Lead');
            pendingDealers.forEach(lead => {
                 userNotifications.push({
                    userId: currentUser.uid,
                    title: `New Dealer for Assignment`,
                    description: `${lead.name} is waiting for assignment.`,
                    href: `/admin`,
                    timestamp: lead.createdAt,
                    icon: 'Star'
                });
            })
        }
        
        return userNotifications;
    };

    const generatedNotifications = generateNotifications().map((n, index) => ({
      ...n,
      id: `generated-${n.timestamp}-${index}`,
      isRead: false
    }));

    try {
        const readNotifications = JSON.parse(sessionStorage.getItem(`readNotifications_${currentUser.uid}`) || '[]');
        const updatedNotifications = [...notifications.filter(n => !n.id.startsWith('generated-')), ...generatedNotifications]
          .map(n => ({
              ...n,
              isRead: readNotifications.includes(n.id)
          }))
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          
        setNotifications(updatedNotifications);
    } catch (e) {
        const sortedNotifications = [...notifications.filter(n => !n.id.startsWith('generated-')), ...generatedNotifications]
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setNotifications(sortedNotifications);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, currentUser, tasks, dealers, vendors, users]);

  const addNotification = (notificationData: Omit<Notification, 'id' | 'isRead'>) => {
    const newNotification: Notification = {
      ...notificationData,
      id: generateUniqueId('notif'),
      isRead: false,
    };
    
    setNotifications(prev => [newNotification, ...prev].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
  };
  
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
      const dataToSave = {
        ...logData,
        anchorId: logData.anchorId || null,
        dealerId: logData.dealerId || null,
        vendorId: logData.vendorId || null,
        taskId: logData.taskId || null,
      };
      await firestoreService.addActivityLog(dataToSave);
    }
    const newLog = { ...logData, id: generateUniqueId('log') };
    setActivityLogs(prev => [newLog, ...prev]);
  };

  const addAnchor = async (anchorData: Omit<Anchor, 'id'>) => {
    if (!currentUser) return;
    
    const primaryContact = anchorData.contacts[0];
    const dataToValidate = {
      companyName: anchorData.name,
      industry: anchorData.industry,
      annualTurnover: anchorData.annualTurnover,
      primaryContactName: primaryContact.name,
      primaryContactDesignation: primaryContact.designation,
      email: primaryContact.email,
      phone: primaryContact.phone,
      gstin: anchorData.gstin,
      address: anchorData.address,
    };

    try {
      NewAnchorSchema.parse(dataToValidate);
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
    
    const anchorToSave = { ...anchorData, status: 'Active' as const, spocIds: [] };
    let newAnchor: Anchor;

    if (firebaseEnabled) {
      const docRef = await firestoreService.addAnchor(anchorToSave);
      newAnchor = { ...anchorToSave, id: docRef.id };
    } else {
      newAnchor = { ...anchorToSave, id: generateUniqueId('anchor')};
    }
    setAnchors(prev => [newAnchor, ...prev]);
    addActivityLog({
      anchorId: newAnchor.id,
      timestamp: new Date().toISOString(),
      type: 'Creation',
      title: 'Anchor Created',
      outcome: `New anchor '${newAnchor.name}' was created by ${currentUser.name}.`,
      userName: 'System',
      userId: currentUser.uid,
      systemGenerated: true,
    });

    // Notify Admins and BD
    const recipients = users.filter(u => ['Admin', 'Business Development', 'BIU'].includes(u.role));
    recipients.forEach(r => {
      sendNotificationEmail({
        to: r.email,
        type: 'NewAnchorAdded',
        context: {
          anchorName: newAnchor.name,
          creatorName: currentUser.name,
        }
      });
    });
  };

  const updateAnchor = async (anchor: Anchor) => {
    try {
        const primaryContact = anchor.contacts[0] || {};
        const dataToValidate = {
            id: anchor.id,
            companyName: anchor.name,
            industry: anchor.industry,
            annualTurnover: anchor.annualTurnover,
            primaryContactName: primaryContact.name,
            primaryContactDesignation: primaryContact.designation,
            email: primaryContact.email,
            phone: primaryContact.phone,
            gstin: anchor.gstin,
            address: anchor.address,
        };
        NewAnchorSchema.extend({ id: z.string() }).parse(dataToValidate);
    } catch (e) {
        if (e instanceof z.ZodError) {
            console.error("Server-side validation failed for anchor update:", e.flatten().fieldErrors);
            toast({ variant: 'destructive', title: 'Validation Error', description: 'Invalid data for anchor update.' });
            return;
        }
    }
    const oldAnchor = anchors.find(a => a.id === anchor.id);
    if (firebaseEnabled) {
      await firestoreService.updateAnchor(anchor);
    }
    setAnchors(prev => prev.map(a => a.id === anchor.id ? {...anchor, updatedAt: new Date().toISOString()} : a));

    if (oldAnchor && oldAnchor.status !== anchor.status && currentUser) {
        addActivityLog({
            anchorId: anchor.id,
            timestamp: new Date().toISOString(),
            type: 'Status Change',
            title: `Status changed to ${anchor.status}`,
            outcome: `Anchor status was updated from '${oldAnchor.status}' to '${anchor.status}' by ${currentUser.name}.`,
            userName: 'System',
            userId: currentUser.uid,
            systemGenerated: true,
        });
    }
  };

  const addDealer = async (dealerData: Omit<Dealer, 'id'>) => {
    if (!currentUser) return;
    
    // Check for duplicates
    const isDuplicate = dealers.some(
      (dealer) => dealer.name === dealerData.name && dealer.anchorId === dealerData.anchorId
    );

    if (isDuplicate) {
      toast({
        variant: 'destructive',
        title: 'Duplicate Lead',
        description: `A dealer named "${dealerData.name}" already exists for this anchor.`,
      });
      return;
    }

    try {
        NewSpokeSchema.parse(dealerData);
    } catch (e) {
        if (e instanceof z.ZodError) {
            console.error("Validation failed for new dealer:", e.flatten().fieldErrors);
            toast({ variant: 'destructive', title: 'Validation Error', description: 'Invalid data for new dealer.' });
            return;
        }
    }

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
        const newDealer = { ...dealerData, id: generateUniqueId('dealer') };
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
        UpdateSpokeSchema.parse(updatedDealer);
    } catch (e) {
        if (e instanceof z.ZodError) {
            console.error("Validation failed for dealer update:", e.flatten().fieldErrors);
            toast({ variant: 'destructive', title: 'Validation Error', description: 'Invalid data for dealer update.' });
            return;
        }
    }
    const oldDealer = dealers.find(d => d.id === updatedDealer.id);
    const dataToSave = { ...updatedDealer };
    Object.keys(dataToSave).forEach(key => {
        if (dataToSave[key as keyof typeof dataToSave] === undefined) {
            delete dataToSave[key as keyof typeof dataToSave];
        }
    });

    if(firebaseEnabled) {
      await firestoreService.updateDealer(dataToSave);
    }
    setDealers(prev => prev.map(d => d.id === updatedDealer.id ? {...dataToSave, updatedAt: new Date().toISOString()} : d));
    
    if (currentUser && oldDealer) {
        let logMessage = '';
        if (oldDealer.status !== updatedDealer.status) {
            logMessage = `Status changed from '${oldDealer.status}' to '${updatedDealer.status}'.`;
        }
        if (oldDealer.assignedTo !== updatedDealer.assignedTo) {
             const assignedUser = users.find(u => u.uid === updatedDealer.assignedTo);
             logMessage += ` Re-assigned to ${assignedUser?.name || 'Unassigned'}.`;
        }

        if (logMessage) {
            addActivityLog({
                dealerId: updatedDealer.id,
                anchorId: updatedDealer.anchorId || undefined,
                timestamp: new Date().toISOString(),
                type: 'Status Change',
                title: `Dealer Lead Updated`,
                outcome: `Dealer '${updatedDealer.name}' updated by ${currentUser.name}. ${logMessage}`,
                userName: 'System',
                userId: currentUser.uid,
                systemGenerated: true,
            });
        }

        if (oldDealer.assignedTo !== updatedDealer.assignedTo && updatedDealer.assignedTo) {
             const assignedUser = users.find(u => u.uid === updatedDealer.assignedTo);
             if (assignedUser) {
                const notification = {
                    userId: assignedUser.uid,
                    title: 'New Lead Assignment',
                    description: `${currentUser.name} assigned you a new dealer lead: ${updatedDealer.name}.`,
                    href: '/dealers',
                    timestamp: new Date().toISOString(),
                    icon: 'Users'
                };
                addNotification(notification);

                // Send email notification
                sendNotificationEmail({
                  to: assignedUser.email,
                  type: 'NewLeadAssignment',
                  context: {
                    assigneeName: assignedUser.name,
                    leadName: updatedDealer.name,
                    leadType: 'Dealer',
                    assignerName: currentUser.name,
                  }
                })
             }
        }
    }
  };

  const deleteDealer = async (dealerId: string) => {
    if (!currentUser || !['Admin', 'Business Development', 'BIU'].includes(currentUser.role)) {
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
    if (!currentUser) return;
    
    // Check for duplicates
    const isDuplicate = vendors.some(
      (vendor) => vendor.name === vendorData.name && vendor.anchorId === vendorData.anchorId
    );

    if (isDuplicate) {
      toast({
        variant: 'destructive',
        title: 'Duplicate Lead',
        description: `A vendor named "${vendorData.name}" already exists for this anchor.`,
      });
      return;
    }

    try {
        NewSpokeSchema.parse(vendorData);
    } catch (e) {
        if (e instanceof z.ZodError) {
            console.error("Validation failed for new vendor:", e.flatten().fieldErrors);
            toast({ variant: 'destructive', title: 'Validation Error', description: 'Invalid data for new vendor.' });
            return;
        }
    }
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
        const newVendor = { ...vendorData, id: generateUniqueId('vendor') };
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
        UpdateSpokeSchema.parse(updatedVendor);
    } catch (e) {
        if (e instanceof z.ZodError) {
            console.error("Validation failed for vendor update:", e.flatten().fieldErrors);
            toast({ variant: 'destructive', title: 'Validation Error', description: 'Invalid data for vendor update.' });
            return;
        }
    }
    const oldVendor = vendors.find(s => s.id === updatedVendor.id);
    const dataToSave = { ...updatedVendor };
    Object.keys(dataToSave).forEach(key => {
        if (dataToSave[key as keyof typeof dataToSave] === undefined) {
            delete dataToSave[key as keyof typeof dataToSave];
        }
    });

    if(firebaseEnabled) {
      await firestoreService.updateVendor(dataToSave);
    }
    setVendors(prev => prev.map(s => s.id === updatedVendor.id ? {...dataToSave, updatedAt: new Date().toISOString()} : s));

    if (currentUser && oldVendor) {
        let logMessage = '';
        if (oldVendor.status !== updatedVendor.status) {
            logMessage = `Status changed from '${oldVendor.status}' to '${updatedVendor.status}'.`;
        }
        if (oldVendor.assignedTo !== updatedVendor.assignedTo) {
             const assignedUser = users.find(u => u.uid === updatedVendor.assignedTo);
             logMessage += ` Re-assigned to ${assignedUser?.name || 'Unassigned'}.`;
        }

        if (logMessage) {
            addActivityLog({
                vendorId: updatedVendor.id,
                anchorId: updatedVendor.anchorId || undefined,
                timestamp: new Date().toISOString(),
                type: 'Status Change',
                title: `Vendor Lead Updated`,
                outcome: `Vendor '${updatedVendor.name}' updated by ${currentUser.name}. ${logMessage}`,
                userName: 'System',
                userId: currentUser.uid,
                systemGenerated: true,
            });
        }
        
        if (oldVendor.assignedTo !== updatedVendor.assignedTo && updatedVendor.assignedTo) {
             const assignedUser = users.find(u => u.uid === updatedVendor.assignedTo);
             if (assignedUser) {
                const notification = {
                    userId: assignedUser.uid,
                    title: 'New Lead Assignment',
                    description: `${currentUser.name} assigned you a new vendor lead: ${updatedVendor.name}.`,
                    href: '/suppliers',
                    timestamp: new Date().toISOString(),
                    icon: 'Users'
                };
                addNotification(notification);
                
                // Send email notification
                sendNotificationEmail({
                  to: assignedUser.email,
                  type: 'NewLeadAssignment',
                  context: {
                    assigneeName: assignedUser.name,
                    leadName: updatedVendor.name,
                    leadType: 'Vendor',
                    assignerName: currentUser.name,
                  }
                })
             }
        }
    }
  };

  const deleteVendor = async (vendorId: string) => {
    if (!currentUser || !['Admin', 'Business Development', 'BIU'].includes(currentUser.role)) {
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
    const newTask = { ...taskData, id: generateUniqueId('task') };
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
    setTasks(prev => prev.map(t => t.id === updatedTask.id ? {...updatedTask, updatedAt: new Date().toISOString()} : t));

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
    const dataToSave = { ...activityData };
    // Sanitize data before sending to Firestore
    Object.keys(dataToSave).forEach(key => {
        if (dataToSave[key as keyof typeof dataToSave] === undefined) {
            (dataToSave as any)[key] = null;
        }
    });

    if (firebaseEnabled) {
      await firestoreService.addDailyActivity(dataToSave);
    }
    const newActivity = { ...dataToSave, id: generateUniqueId('daily-activity') } as DailyActivity;
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
        const newUser = { id: generateUniqueId('user'), uid: generateUniqueId('user'), ...userData };
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
  
  const updateUser = async (updatedUser: User) => {
    try {
        const dataToValidate = {
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
            managerId: updatedUser.managerId,
            region: updatedUser.region,
            territoryAccess: updatedUser.territoryAccess,
        };
        EditUserSchema.parse(dataToValidate);
    } catch (e) {
        if (e instanceof z.ZodError) {
            console.error("Validation failed for user update:", e.flatten().fieldErrors);
            toast({ variant: 'destructive', title: 'Validation Error', description: 'Invalid data for user update.' });
            return;
        }
    }
    if (!currentUser) return;
     if (firebaseEnabled) {
        await firestoreService.updateUser(updatedUser);
     }
     setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
     addActivityLog({
        timestamp: new Date().toISOString(),
        type: 'Status Change', // Using status change for generic update
        title: 'User Profile Updated',
        outcome: `User profile for '${updatedUser.name}' was updated by ${currentUser.name}.`,
        userName: 'System',
        userId: currentUser.uid,
        systemGenerated: true,
    });
  };

  const deleteUser = async (userId: string) => {
    if (!currentUser || !['Admin', 'BIU'].includes(currentUser.role)) {
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

  const addLender = async (lenderData: Omit<Lender, 'id'>) => {
    if (firebaseEnabled) {
      const newLender = await firestoreService.addLender(lenderData);
      setLenders(prev => [...prev, newLender]);
    } else {
      const newLender = { ...lenderData, id: generateUniqueId('lender') };
      setLenders(prev => [...prev, newLender]);
    }
    toast({ title: 'Lender Added', description: `${lenderData.name} has been added.` });
  };
  
  const deleteLender = async (lenderId: string) => {
    const lenderName = lenders.find(l => l.id === lenderId)?.name || 'the lender';
    if(firebaseEnabled) {
      await firestoreService.deleteLender(lenderId);
    }
    setLenders(prev => prev.filter(l => l.id !== lenderId));
    toast({ title: 'Lender Removed', description: `${lenderName} has been removed.` });
  };

  const reassignLeads = (fromUserId: string, toUserId: string) => {
    if (!currentUser || !['Admin', 'Business Development', 'BIU', 'ETB Manager'].includes(currentUser.role)) {
      toast({ variant: 'destructive', title: 'Permission Denied', description: 'Only authorized users can reassign leads.' });
      return;
    }

    const fromUser = users.find(u => u.uid === fromUserId);
    const toUser = users.find(u => u.uid === toUserId);
    if (!fromUser || !toUser) {
      toast({ variant: 'destructive', title: 'User Not Found' });
      return;
    }

    const updatedDealers = dealers.map(d => {
      if (d.assignedTo === fromUserId) {
        return { ...d, assignedTo: toUserId };
      }
      return d;
    });

    const updatedVendors = vendors.map(v => {
      if (v.assignedTo === fromUserId) {
        return { ...v, assignedTo: toUserId };
      }
      return v;
    });

    setDealers(updatedDealers);
    setVendors(updatedVendors);
    
    // In a real app with a backend, this would be a single transaction.
    // For mock data, we just update the state.

    addActivityLog({
        timestamp: new Date().toISOString(),
        type: 'Assignment',
        title: 'Bulk Lead Reassignment',
        outcome: `All leads reassigned from ${fromUser.name} to ${toUser.name} by ${currentUser.name}.`,
        userName: 'System',
        userId: currentUser.uid,
        systemGenerated: true,
    });
  }

  const sendEmail = async (input: SendNotificationEmailInput) => {
    if (!currentUser) {
        toast({ variant: "destructive", title: "Not logged in" });
        return;
    }
    try {
        const result = await sendNotificationEmail(input);

        // Log this action
        addActivityLog({
            timestamp: new Date().toISOString(),
            type: 'Email',
            title: `Email: ${result.subject}`,
            outcome: result.body,
            userName: currentUser.name,
            userId: currentUser.uid,
            systemGenerated: true, // It's a system-generated email format
        });
    } catch (error) {
        console.error("Failed to send email:", error);
        toast({
            variant: "destructive",
            title: "Email Failed",
            description: "Could not send the email.",
        });
    }
  };

  const addAnchorSPOC = async (spocData: Omit<AnchorSPOC, 'id'>) => {
      if (!currentUser) return;
      if (firebaseEnabled) {
          const newSpoc = await firestoreService.addAnchorSPOC(spocData);
          setAnchorSPOCs(prev => [...prev, newSpoc]);
          // Also update the anchor's spocIds array
          const anchor = anchors.find(a => a.id === spocData.anchorId);
          if (anchor) {
              const updatedAnchor = { ...anchor, spocIds: [...(anchor.spocIds || []), newSpoc.id] };
              updateAnchor(updatedAnchor);
          }
      } else {
          const newSpoc = { ...spocData, id: generateUniqueId('spoc') };
          setAnchorSPOCs(prev => [...prev, newSpoc]);
          const anchor = anchors.find(a => a.id === spocData.anchorId);
           if (anchor) {
              const updatedAnchor = { ...anchor, spocIds: [...(anchor.spocIds || []), newSpoc.id] };
              updateAnchor(updatedAnchor);
          }
      }
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
    updateUser,
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
    addNotification,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    lenders,
    addLender,
    deleteLender,
    reassignLeads,
    sendEmail,
    anchorSPOCs,
    addAnchorSPOC,
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
