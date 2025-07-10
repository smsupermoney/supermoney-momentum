

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
import type { User, Anchor, Dealer, Vendor, Task, ActivityLog, DailyActivity, Lender } from '@/lib/types';

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

    // This function is for admins creating users BEFORE they log in.
    // The document will have an auto-generated ID.
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
  let userDocSnap = await getDoc(userDocRef);

  if (!userDocSnap.exists()) {
    // If user doc with UID doesn't exist, check if a profile was pre-created by an Admin
    const q = query(collection(db, 'users'), where("email", "==", authUser.email));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      // A profile exists, created by an admin. We need to migrate it.
      const oldDoc = querySnapshot.docs[0];
      const userData = oldDoc.data() as Omit<User, 'uid' | 'id'>;

      const batch = writeBatch(db);
      batch.set(userDocRef, userData); // Create new doc with UID as ID
      batch.delete(oldDoc.ref);       // Delete old doc with auto-ID
      await batch.commit();
      
      userDocSnap = await getDoc(userDocRef); // Re-fetch the newly created doc
      
    } else {
      // If no profile exists at all, create a brand new one with a default role.
      const newUser: Omit<User, 'uid' | 'id'> = {
          name: authUser.displayName || 'New User',
          email: authUser.email,
          role: 'Area Sales Manager', // Assign a default role
          managerId: null,
          region: 'Unassigned',
      };
      await setDoc(userDocRef, newUser);
      userDocSnap = await getDoc(userDocRef);
    }
  }

  // Final check for data integrity before returning the user profile.
  // This handles cases where a document might exist but be malformed.
  const userData = userDocSnap.data() as Partial<Omit<User, 'uid' | 'id'>>;
  const finalUserData: User = {
    id: userDocSnap.id,
    uid: userDocSnap.id,
    name: userData.name || authUser.displayName || 'Unnamed User',
    email: userData.email || authUser.email,
    role: userData.role || 'Area Sales Manager', // Default role if missing
    managerId: userData.managerId !== undefined ? userData.managerId : null,
    region: userData.region || 'Unassigned',
  };
  
  // If data was missing and we had to add defaults, update the document in Firestore.
  if (JSON.stringify(finalUserData) !== JSON.stringify({id: userDocSnap.id, uid: userDocSnap.id, ...userData})) {
      await setDoc(userDocRef, {
        name: finalUserData.name,
        email: finalUserData.email,
        role: finalUserData.role,
        managerId: finalUserData.managerId,
        region: finalUserData.region,
      }, { merge: true });
  }

  return finalUserData;
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

// --- Lender Service ---
export const getLenders = async (): Promise<Lender[]> => {
    if (!db) return [];
    const lendersCollection = collection(db, 'lenders');
    const snapshot = await getDocs(lendersCollection);
    return snapshotToData<Omit<Lender, 'id'>>(snapshot);
};

export const addLender = async (lender: Omit<Lender, 'id'>): Promise<Lender> => {
    if (!db) throw new Error("Firestore not initialized");
    const docRef = await addDoc(collection(db, 'lenders'), lender);
    return { id: docRef.id, ...lender };
};

export const deleteLender = async (lenderId: string): Promise<void> => {
    if (!db) throw new Error("Firestore not initialized");
    await deleteDoc(doc(db, 'lenders', lenderId));
};
