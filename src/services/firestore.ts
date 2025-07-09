

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
  setDoc,
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
    
    // Find if a user with this email already exists
    const q = query(collection(db, 'users'), where("email", "==", user.email));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
        throw new Error(`User with email ${user.email} already exists.`);
    }

    // Since we don't know the UID yet, we add the document with an auto-generated ID.
    // The checkAndCreateUser function will handle migrating this to a UID-keyed doc on first login.
    const docRef = await addDoc(collection(db, 'users'), user);
    
    // For the purpose of the calling function, we create a temporary UID/ID.
    const tempId = docRef.id;
    return { uid: tempId, id: tempId, ...user };
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
    
    // If user doc with UID doesn't exist, check if an admin has pre-created a profile for this email.
    const usersCollection = collection(db, 'users');
    const q = query(usersCollection, where("email", "==", authUser.email));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
        // A profile for this email exists, but with a temporary, auto-generated ID.
        // We migrate the data to a new doc with the correct ID (the auth UID) and delete the old one.
        console.log(`Migrating pre-created user profile for ${authUser.email}`);
        const oldDoc = querySnapshot.docs[0];
        const oldData = oldDoc.data() as Omit<User, 'uid' | 'id'>;
        
        const batch = writeBatch(db);
        
        // Create the new document with the correct UID as the ID
        batch.set(userDocRef, oldData);
        
        // Delete the old document with the incorrect, auto-generated ID
        batch.delete(oldDoc.ref);
        
        await batch.commit();

        return { id: authUser.uid, uid: authUser.uid, ...oldData };
    }

    // This is a brand new user, not pre-created by an admin.
    // Assign a default role. An admin can change this later.
    const newUser: Omit<User, 'uid' | 'id'> = {
        name: authUser.displayName || 'New User',
        email: authUser.email,
        role: 'Area Sales Manager', 
    };
    
    // Use setDoc with the specific UID as the document ID
    await setDoc(userDocRef, newUser);
    
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
