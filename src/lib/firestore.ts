import { db } from './firebase';
import { doc, setDoc, getDoc, collection, query, where, getDocs, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { Child, Activity, Timer } from '@/types'; // Import Child, Activity, and Timer interfaces

export const createUserProfile = async (user: User) => {
  if (!user) return;

  const userRef = doc(db, "users", user.uid);
  const userSnapshot = await getDoc(userRef);

  if (!userSnapshot.exists()) {
    const { email, displayName, photoURL } = user;
    const createdAt = new Date();

    try {
      await setDoc(userRef, {
        uid: user.uid,
        email,
        displayName: displayName || email?.split('@')[0],
        photoURL,
        createdAt,
        // Add any other default user data here
      });
    } catch (error) {
      console.error("Error creating user profile:", error);
    }
  }
};

// Child Management Functions
export const addChild = async (parentId: string, child: Omit<Child, 'id' | 'parentId' | 'createdAt'>): Promise<Child | null> => {
  try {
    const childrenCollectionRef = collection(db, 'children');
    const newChildRef = await addDoc(childrenCollectionRef, {
      ...child,
      parentId,
      createdAt: new Date(),
    });
    const newChildDoc = await getDoc(newChildRef);
    return { id: newChildDoc.id, ...newChildDoc.data() } as Child;
  } catch (error) {
    console.error("Error adding child:", error);
    return null;
  }
};

export const getChildren = async (parentId: string): Promise<Child[]> => {
  try {
    const childrenCollectionRef = collection(db, 'children');
    const q = query(childrenCollectionRef, where('parentId', '==', parentId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Child));
  } catch (error) {
    console.error("Error getting children:", error);
    return [];
  }
};

export const updateChild = async (childId: string, updatedFields: Partial<Omit<Child, 'id' | 'parentId' | 'createdAt'>>): Promise<void> => {
  try {
    const childRef = doc(db, 'children', childId);
    await updateDoc(childRef, updatedFields);
  } catch (error) {
    console.error("Error updating child:", error);
  }
};

export const deleteChild = async (childId: string): Promise<void> => {
  try {
    const childRef = doc(db, 'children', childId);
    await deleteDoc(childRef);
  } catch (error) {
    console.error("Error deleting child:", error);
  }
};

// Activity Management Functions
export const addActivity = async (activity: Omit<Activity, 'id' | 'createdAt'>): Promise<Activity | null> => {
  try {
    const activitiesCollectionRef = collection(db, 'activities');
    const newActivityRef = await addDoc(activitiesCollectionRef, {
      ...activity,
      createdAt: new Date(),
    });
    const newActivityDoc = await getDoc(newActivityRef);
    return { id: newActivityDoc.id, ...newActivityDoc.data() } as Activity;
  } catch (error) {
    console.error("Error adding activity:", error);
    return null;
  }
};

export const getActivities = async (parentId?: string): Promise<Activity[]> => {
  try {
    const activitiesCollectionRef = collection(db, 'activities');
    let q;
    if (parentId) {
      // Fetch custom activities for a parent and curated activities
      q = query(activitiesCollectionRef, where('parentId', 'in', [parentId, 'curated'])); // 'curated' is a placeholder for system-wide activities
    } else {
      // Fetch all activities (e.g., for admin or initial population)
      q = query(activitiesCollectionRef);
    }
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Activity));
  } catch (error) {
    console.error("Error getting activities:", error);
    return [];
  }
};

export const updateActivity = async (activityId: string, updatedFields: Partial<Omit<Activity, 'id' | 'createdAt'>>): Promise<void> => {
  try {
    const activityRef = doc(db, 'activities', activityId);
    await updateDoc(activityRef, updatedFields);
  } catch (error) {
    console.error("Error updating activity:", error);
  }
};

export const deleteActivity = async (activityId: string): Promise<void> => {
  try {
    const activityRef = doc(db, 'activities', activityId);
    await deleteDoc(activityRef);
  } catch (error) {
    console.error("Error deleting activity:", error);
  }
};

// Timer Management Functions
export const addTimer = async (timer: Omit<Timer, 'id' | 'createdAt' | 'updatedAt'>): Promise<Timer | null> => {
  try {
    const timersCollectionRef = collection(db, 'timers');
    const newTimerRef = await addDoc(timersCollectionRef, {
      ...timer,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const newTimerDoc = await getDoc(newTimerRef);
    return { id: newTimerDoc.id, ...newTimerDoc.data() } as Timer;
  } catch (error) {
    console.error("Error adding timer:", error);
    return null;
  }
};

export const getTimers = async (parentId: string, childId?: string): Promise<Timer[]> => {
  try {
    const timersCollectionRef = collection(db, 'timers');
    let q = query(timersCollectionRef, where('parentId', '==', parentId));
    if (childId) {
      q = query(q, where('childId', '==', childId));
    }
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Timer));
  } catch (error) {
    console.error("Error getting timers:", error);
    return [];
  }
};

export const updateTimer = async (timerId: string, updatedFields: Partial<Omit<Timer, 'id' | 'createdAt'>>): Promise<void> => {
  try {
    const timerRef = doc(db, 'timers', timerId);
    await updateDoc(timerRef, { ...updatedFields, updatedAt: new Date() });
  } catch (error) {
    console.error("Error updating timer:", error);
  }
};

export const deleteTimer = async (timerId: string): Promise<void> => {
  try {
    const timerRef = doc(db, 'timers', timerId);
    await deleteDoc(timerRef);
  } catch (error) {
    console.error("Error deleting timer:", error);
  }
};
