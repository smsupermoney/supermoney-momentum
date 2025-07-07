
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
  writeBatch
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
const usersCollection = collection(db, 'users');

export const getUsers = async (): Promise<User[]> => {
  if (!db) return [];
  const snapshot = await getDocs(usersCollection);
  // In Firestore, the doc id is the uid for users
  return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id, uid: doc.id })) as User[];
};

export const addUser = async (user: Omit<User, 'uid' | 'id'>): Promise<User> => {
    if (!db) throw new Error("Firestore not initialized");
    const docRef = await addDoc(usersCollection, user);
    return { uid: docRef.id, id: docRef.id, ...user };
};

export const getUserByEmail = async (email: string): Promise<User | null> => {
    if (!db) return null;
    const q = query(usersCollection, where("email", "==", email));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
        return null;
    }
    const userDoc = snapshot.docs[0];
    const userData = userDoc.data() as Omit<User, 'uid' | 'id'>;
    return { uid: userDoc.id, id: userDoc.id, ...userData };
}

export const checkAndCreateUser = async (authUser: { email: string | null; displayName: string | null; uid: string }): Promise<User | null> => {
    if (!db || !authUser.email) return null;

    const userProfile = await getUserByEmail(authUser.email);

    if (userProfile) {
        return userProfile;
    }
    
    // User does not exist, create a new one with a default 'Sales' role
    const newUser: Omit<User, 'uid' | 'id'> = {
        name: authUser.displayName || 'New User',
        email: authUser.email,
        role: 'Sales', // Default role for new sign-ups
    };
    const batch = writeBatch(db);
    const userDocRef = doc(db, 'users', authUser.uid);
    batch.set(userDocRef, newUser);
    await batch.commit();
    
    return {
        id: authUser.uid,
        uid: authUser.uid,
        ...newUser
    }
};


// --- Anchor Service ---
const anchorsCollection = collection(db, 'anchors');
export const getAnchors = async (user: User, allUsers: User[]): Promise<Anchor[]> => {
  if (!db) return [];
  let q;
  const visibleUserIds = (user.role === 'Admin')
      ? allUsers.map(u => u.uid)
      : (user.role === 'Sales' || user.role === 'Onboarding Specialist')
          ? [user.uid]
          : [user.uid, ...allUsers.filter(u => u.managerId === user.uid).map(u => u.uid)];

  q = query(anchorsCollection, where('assignedTo', 'in', visibleUserIds), orderBy('createdAt', 'desc'));
  
  const snapshot = await getDocs(q);
  return snapshotToData<Omit<Anchor, 'id'>>(snapshot);
};
export const addAnchor = async (anchor: Omit<Anchor, 'id'>) => {
  if (!db) throw new Error("Firestore not initialized");
  return await addDoc(anchorsCollection, anchor);
};
export const updateAnchor = async (anchor: Anchor) => {
  if (!db) throw new Error("Firestore not initialized");
  const { id, ...anchorData } = anchor;
  const docRef = doc(db, 'anchors', id);
  await updateDoc(docRef, { ...anchorData, updatedAt: new Date().toISOString() });
};


// --- Dealer Service ---
const dealersCollection = collection(db, 'dealers');
export const getDealers = async (): Promise<Dealer[]> => {
    if (!db) return [];
    const q = query(dealersCollection, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshotToData<Omit<Dealer, 'id'>>(snapshot);
};
export const addDealer = async (dealer: Omit<Dealer, 'id'>) => {
    if (!db) throw new Error("Firestore not initialized");
    return await addDoc(dealersCollection, dealer);
};
export const updateDealer = async (dealer: Dealer) => {
    if (!db) throw new Error("Firestore not initialized");
    const { id, ...dealerData } = dealer;
    await updateDoc(doc(db, 'dealers', id), { ...dealerData, updatedAt: new Date().toISOString() });
};

// --- Vendor Service ---
const vendorsCollection = collection(db, 'vendors');
export const getVendors = async (): Promise<Vendor[]> => {
    if (!db) return [];
    const q = query(vendorsCollection, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshotToData<Omit<Vendor, 'id'>>(snapshot);
};
export const addVendor = async (vendor: Omit<Vendor, 'id'>) => {
    if (!db) throw new Error("Firestore not initialized");
    return await addDoc(vendorsCollection, vendor);
};
export const updateVendor = async (vendor: Vendor) => {
    if (!db) throw new Error("Firestore not initialized");
    const { id, ...vendorData } = vendor;
    await updateDoc(doc(db, 'vendors', id), { ...vendorData, updatedAt: new Date().toISOString() });
};


// --- Task Service ---
const tasksCollection = collection(db, 'tasks');
export const getTasks = async (): Promise<Task[]> => {
    if (!db) return [];
    const q = query(tasksCollection, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshotToData<Omit<Task, 'id'>>(snapshot);
};
export const addTask = async (task: Omit<Task, 'id'>) => {
    if (!db) throw new Error("Firestore not initialized");
    return await addDoc(tasksCollection, task);
};
export const updateTask = async (task: Task) => {
    if (!db) throw new Error("Firestore not initialized");
    const { id, ...taskData } = task;
    await updateDoc(doc(db, 'tasks', id), { ...taskData });
};


// --- ActivityLog Service ---
const activityLogsCollection = collection(db, 'activityLogs');
export const getActivityLogs = async (): Promise<ActivityLog[]> => {
    if (!db) return [];
    const queryToRun = query(activityLogsCollection, orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(queryToRun);
    return snapshotToData<Omit<ActivityLog, 'id'>>(snapshot);
};
export const addActivityLog = async (log: Omit<ActivityLog, 'id'>) => {
    if (!db) throw new Error("Firestore not initialized");
    return await addDoc(activityLogsCollection, log);
};

// --- DailyActivity Service ---
const dailyActivitiesCollection = collection(db, 'daily_activities');

export const getDailyActivities = async (): Promise<DailyActivity[]> => {
    if (!db) return [];
    const activitiesQuery = query(collection(db, 'daily_activities'), orderBy('activityTimestamp', 'desc'));
    const snapshot = await getDocs(activitiesQuery);
    return snapshotToData<Omit<DailyActivity, 'id'>>(snapshot);
};

export const addDailyActivity = async (activity: Omit<DailyActivity, 'id'>) => {
    if (!db) throw new Error("Firestore not initialized");
    return await addDoc(dailyActivitiesCollection, activity);
};

export const updateDailyActivity = async (activity: DailyActivity) => {
    if (!db) throw new Error("Firestore not initialized");
    const { id, ...activityData } = activity;
    await updateDoc(doc(db, 'daily_activities', id), { ...activityData, updatedAt: new Date().toISOString() });
};
