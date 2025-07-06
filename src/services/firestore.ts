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
  const snapshot = await getDocs(usersCollection);
  return snapshotToData<Omit<User, 'uid'>>(snapshot).map(u => ({...u, uid: u.id}));
};

export const addUser = async (user: Omit<User, 'uid' | 'id'>): Promise<User> => {
    const docRef = await addDoc(usersCollection, user);
    return { uid: docRef.id, id: docRef.id, ...user };
};

export const getUserByEmail = async (email: string): Promise<User | null> => {
    const q = query(usersCollection, where("email", "==", email));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
        return null;
    }
    const userDoc = snapshot.docs[0];
    const userData = userDoc.data() as Omit<User, 'uid' | 'id'>;
    return { uid: userDoc.id, id: userDoc.id, ...userData };
}

// --- Anchor Service ---
const anchorsCollection = collection(db, 'anchors');
export const getAnchors = async (user: User): Promise<Anchor[]> => {
  let q;
  if (user.role === 'Sales' || user.role === 'Onboarding Specialist') {
    q = query(anchorsCollection, where('assignedTo', '==', user.uid), orderBy('createdAt', 'desc'));
  } else {
    q = query(anchorsCollection, orderBy('createdAt', 'desc'));
  }
  const snapshot = await getDocs(q);
  return snapshotToData<Omit<Anchor, 'id'>>(snapshot);
};
export const addAnchor = async (anchor: Omit<Anchor, 'id'>) => {
  return await addDoc(anchorsCollection, anchor);
};
export const updateAnchor = async (anchor: Anchor) => {
  const { id, ...anchorData } = anchor;
  const docRef = doc(db, 'anchors', id);
  await updateDoc(docRef, { ...anchorData });
};


// --- Dealer Service ---
const dealersCollection = collection(db, 'dealers');
export const getDealers = async (user: User): Promise<Dealer[]> => {
    let q;
    if (user.role === 'Sales' || user.role === 'Onboarding Specialist') {
        q = query(dealersCollection, where('assignedTo', '==', user.uid), orderBy('createdAt', 'desc'));
    } else {
        q = query(dealersCollection, orderBy('createdAt', 'desc'));
    }
    const snapshot = await getDocs(q);
    return snapshotToData<Omit<Dealer, 'id'>>(snapshot);
};
export const addDealer = async (dealer: Omit<Dealer, 'id'>) => {
    return await addDoc(dealersCollection, dealer);
};
export const updateDealer = async (dealer: Dealer) => {
    const { id, ...dealerData } = dealer;
    await updateDoc(doc(db, 'dealers', id), { ...dealerData });
};

// --- Vendor Service ---
const vendorsCollection = collection(db, 'vendors');
export const getVendors = async (user: User): Promise<Vendor[]> => {
    let q;
    if (user.role === 'Sales' || user.role === 'Onboarding Specialist') {
        q = query(vendorsCollection, where('assignedTo', '==', user.uid), orderBy('createdAt', 'desc'));
    } else {
        q = query(vendorsCollection, orderBy('createdAt', 'desc'));
    }
    const snapshot = await getDocs(q);
    return snapshotToData<Omit<Vendor, 'id'>>(snapshot);
};
export const addVendor = async (vendor: Omit<Vendor, 'id'>) => {
    return await addDoc(vendorsCollection, vendor);
};
export const updateVendor = async (vendor: Vendor) => {
    const { id, ...vendorData } = vendor;
    await updateDoc(doc(db, 'vendors', id), { ...vendorData });
};


// --- Task Service ---
const tasksCollection = collection(db, 'tasks');
export const getTasks = async (user: User): Promise<Task[]> => {
    let queryToRun;
    if (user.role === 'Sales' || user.role === 'Onboarding Specialist') {
        queryToRun = query(tasksCollection, where('assignedTo', '==', user.uid), orderBy('createdAt', 'desc'));
    } else {
        // Admins and Managers can see all tasks. The UI will filter for teams.
        queryToRun = query(tasksCollection, orderBy('createdAt', 'desc'));
    }
    const snapshot = await getDocs(queryToRun);
    return snapshotToData<Omit<Task, 'id'>>(snapshot);
};
export const addTask = async (task: Omit<Task, 'id'>) => {
    return await addDoc(tasksCollection, task);
};
export const updateTask = async (task: Task) => {
    const { id, ...taskData } = task;
    await updateDoc(doc(db, 'tasks', id), { ...taskData });
};


// --- ActivityLog Service ---
const activityLogsCollection = collection(db, 'activityLogs');
export const getActivityLogs = async (user: User): Promise<ActivityLog[]> => {
    let queryToRun;
    if (user.role === 'Sales' || user.role === 'Onboarding Specialist') {
        queryToRun = query(activityLogsCollection, where('userId', '==', user.uid), orderBy('timestamp', 'desc'));
    } else {
        // Admins and Managers can see all logs. The UI will filter for teams.
        queryToRun = query(activityLogsCollection, orderBy('timestamp', 'desc'));
    }
    const snapshot = await getDocs(queryToRun);
    return snapshotToData<Omit<ActivityLog, 'id'>>(snapshot);
};
export const addActivityLog = async (log: Omit<ActivityLog, 'id'>) => {
    return await addDoc(activityLogsCollection, log);
};

// --- DailyActivity Service ---
const dailyActivitiesCollection = collection(db, 'daily_activities');

export const getDailyActivities = async (user: User): Promise<DailyActivity[]> => {
    let activitiesQuery;
    
    // For roles other than Sales, the security rules are assumed to allow full reads.
    // For the Sales role, we must filter by their user ID to comply with security rules.
    if (user.role === 'Sales' || user.role === 'Onboarding Specialist') {
        activitiesQuery = query(collection(db, 'daily_activities'), where('userId', '==', user.uid), orderBy('startTime', 'desc'));
    } else {
        activitiesQuery = query(collection(db, 'daily_activities'), orderBy('startTime', 'desc'));
    }
    
    const snapshot = await getDocs(activitiesQuery);
    return snapshotToData<Omit<DailyActivity, 'id'>>(snapshot);
};

export const addDailyActivity = async (activity: Omit<DailyActivity, 'id'>) => {
    return await addDoc(dailyActivitiesCollection, activity);
};

export const updateDailyActivity = async (activity: DailyActivity) => {
    const { id, ...activityData } = activity;
    await updateDoc(doc(db, 'daily_activities', id), { ...activityData });
};
