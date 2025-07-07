

import { db } from '@/lib/firebase';
import {
  collection,
  getDocs,
  doc,
  addDoc,
  updateDoc,
  query,
  where,
  DocumentData,
  QuerySnapshot,
  orderBy,
  writeBatch,
  deleteDoc,
  getDoc,
} from 'firebase/firestore';
import type { User, Anchor, Dealer, Vendor, Task, ActivityLog, DailyActivity } from '@/lib/types';

// Generic function to convert a snapshot to an array of objects
const snapshotToData = <T extends {}>(snapshot: QuerySnapshot<DocumentData>): T[] => {
  if (snapshot.empty) {
    return [];
  }
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as T),
  }));
};

const getAllSubordinates = (managerId: string, users: User[]): User[] => {
    const subordinates: User[] = [];
    const directReports = users.filter(u => u.managerId === managerId);
    subordinates.push(...directReports);
    directReports.forEach(report => {
        subordinates.push(...getAllSubordinates(report.uid, users));
    });
    return subordinates;
};


// --- User Service ---
export const getUsers = async (): Promise<User[]> => {
  if (!db) return [];
  const usersCollection = collection(db, 'users');
  const snapshot = await getDocs(usersCollection);
  // In Firestore, the doc id is the uid for users
  return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id, uid: doc.id })) as User[];
};

export const addUser = async (user: Omit<User, 'uid' | 'id'>): Promise<User> => {
    if (!db) throw new Error("Firestore not initialized");
    const usersCollection = collection(db, 'users');
    const docRef = await addDoc(usersCollection, user);
    return { uid: docRef.id, id: docRef.id, ...user };
};

export const deleteUser = async (userId: string): Promise<void> => {
    if (!db) throw new Error("Firestore not initialized");
    const userDocRef = doc(db, 'users', userId);
    await deleteDoc(userDocRef);
};

export const checkAndCreateUser = async (authUser: { email: string | null; displayName: string | null; uid: string }): Promise<User | null> => {
    if (!db || !authUser.email) return null;

    const userDocRef = doc(db, 'users', authUser.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
        const userData = userDocSnap.data() as Omit<User, 'uid' | 'id'>;
        return {
            id: userDocSnap.id,
            uid: userDocSnap.id,
            ...userData
        };
    }
    
    // User does not exist, create a new one with a default 'Sales' role
    const newUser: Omit<User, 'uid' | 'id'> = {
        name: authUser.displayName || 'New User',
        email: authUser.email,
        role: 'Sales', // Default role for new sign-ups
    };
    const batch = writeBatch(db);
    batch.set(userDocRef, newUser);
    await batch.commit();
    
    return {
        id: authUser.uid,
        uid: authUser.uid,
        ...newUser
    }
};


// --- Anchor Service ---
export const getAnchors = async (): Promise<Anchor[]> => {
  if (!db) return [];
  const anchorsCollection = collection(db, 'anchors');
  const q = query(anchorsCollection, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshotToData<Omit<Anchor, 'id'>>(snapshot);
};

export const addAnchor = async (anchor: Omit<Anchor, 'id'>) => {
  if (!db) throw new Error("Firestore not initialized");
  const anchorsCollection = collection(db, 'anchors');
  return await addDoc(anchorsCollection, anchor);
};
export const updateAnchor = async (anchor: Anchor) => {
  if (!db) throw new Error("Firestore not initialized");
  const { id, ...anchorData } = anchor;
  const docRef = doc(db, 'anchors', id);
  await updateDoc(docRef, { ...anchorData, updatedAt: new Date().toISOString() });
};


// --- Dealer Service ---
export const getDealers = async (): Promise<Dealer[]> => {
    if (!db) return [];
    const dealersCollection = collection(db, 'dealers');
    const q = query(dealersCollection, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshotToData<Omit<Dealer, 'id'>>(snapshot);
};
export const addDealer = async (dealer: Omit<Dealer, 'id'>) => {
    if (!db) throw new Error("Firestore not initialized");
    const dealersCollection = collection(db, 'dealers');
    return await addDoc(dealersCollection, dealer);
};
export const updateDealer = async (dealer: Dealer) => {
    if (!db) throw new Error("Firestore not initialized");
    const { id, ...dealerData } = dealer;
    await updateDoc(doc(db, 'dealers', id), { ...dealerData, updatedAt: new Date().toISOString() });
};
export const deleteDealer = async (dealerId: string) => {
    if (!db) throw new Error("Firestore not initialized");
    await deleteDoc(doc(db, 'dealers', dealerId));
};

// --- Vendor Service ---
export const getVendors = async (): Promise<Vendor[]> => {
    if (!db) return [];
    const vendorsCollection = collection(db, 'vendors');
    const q = query(vendorsCollection, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshotToData<Omit<Vendor, 'id'>>(snapshot);
};
export const addVendor = async (vendor: Omit<Vendor, 'id'>) => {
    if (!db) throw new Error("Firestore not initialized");
    const vendorsCollection = collection(db, 'vendors');
    return await addDoc(vendorsCollection, vendor);
};
export const updateVendor = async (vendor: Vendor) => {
    if (!db) throw new Error("Firestore not initialized");
    const { id, ...vendorData } = vendor;
    await updateDoc(doc(db, 'vendors', id), { ...vendorData, updatedAt: new Date().toISOString() });
};
export const deleteVendor = async (vendorId: string) => {
    if (!db) throw new Error("Firestore not initialized");
    await deleteDoc(doc(db, 'vendors', vendorId));
};


// --- Task Service ---
export const getTasks = async (): Promise<Task[]> => {
    if (!db) return [];
    const tasksCollection = collection(db, 'tasks');
    const q = query(tasksCollection, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshotToData<Omit<Task, 'id'>>(snapshot);
};
export const addTask = async (task: Omit<Task, 'id'>) => {
    if (!db) throw new Error("Firestore not initialized");
    const tasksCollection = collection(db, 'tasks');
    return await addDoc(tasksCollection, task);
};
export const updateTask = async (task: Task) => {
    if (!db) throw new Error("Firestore not initialized");
    const { id, ...taskData } = task;
    await updateDoc(doc(db, 'tasks', id), { ...taskData });
};


// --- ActivityLog Service ---
export const getActivityLogs = async (): Promise<ActivityLog[]> => {
    if (!db) return [];
    const activityLogsCollection = collection(db, 'activityLogs');
    const queryToRun = query(activityLogsCollection, orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(queryToRun);
    return snapshotToData<Omit<ActivityLog, 'id'>>(snapshot);
};
export const addActivityLog = async (log: Omit<ActivityLog, 'id'>) => {
    if (!db) throw new Error("Firestore not initialized");
    const activityLogsCollection = collection(db, 'activityLogs');
    return await addDoc(activityLogsCollection, log);
};

// --- DailyActivity Service ---
export const getDailyActivities = async (): Promise<DailyActivity[]> => {
    if (!db) return [];
    const dailyActivitiesCollection = collection(db, 'daily_activities');
    const activitiesQuery = query(dailyActivitiesCollection, orderBy('activityTimestamp', 'desc'));
    const snapshot = await getDocs(activitiesQuery);
    return snapshotToData<Omit<DailyActivity, 'id'>>(snapshot);
};

export const addDailyActivity = async (activity: Omit<DailyActivity, 'id'>) => {
    if (!db) throw new Error("Firestore not initialized");
    const dailyActivitiesCollection = collection(db, 'daily_activities');
    return await addDoc(dailyActivitiesCollection, activity);
};

export const updateDailyActivity = async (activity: DailyActivity) => {
    if (!db) throw new Error("Firestore not initialized");
    const { id, ...activityData } = activity;
    const activityDocRef = doc(db, 'daily_activities', id);
    await updateDoc(activityDocRef, { ...activityData, updatedAt: new Date().toISOString() });
};
