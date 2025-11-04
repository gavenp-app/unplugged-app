'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getChildren, getActivities, getTimers } from '@/lib/firestore'; // Import getChildren, getActivities, and getTimers
import { Child, Activity, Timer } from '@/types'; // Import Child, Activity, and Timer interface

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState<Child[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activeTimers, setActiveTimers] = useState<Timer[]>([]); // State for active timers
  const [loadingChildren, setLoadingChildren] = useState(true);
  const [loadingActivities, setLoadingActivities] = useState(true);
  const [loadingTimers, setLoadingTimers] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);

        // Fetch children when user is authenticated
        setLoadingChildren(true);
        const fetchedChildren = await getChildren(currentUser.uid);
        setChildren(fetchedChildren);
        setLoadingChildren(false);

        // Fetch activities when user is authenticated
        setLoadingActivities(true);
        const fetchedActivities = await getActivities(currentUser.uid);
        setActivities(fetchedActivities);
        setLoadingActivities(false);

        // Fetch active timers when user is authenticated
        setLoadingTimers(true);
        const fetchedTimers = await getTimers(currentUser.uid);
        setActiveTimers(fetchedTimers.filter(timer => timer.status === 'active' || timer.status === 'paused'));
        setLoadingTimers(false);

      } else {
        router.push('/login'); // Redirect to login if not authenticated
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error: any) {
      console.error("Error logging out:", error.message);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (loading || loadingChildren || loadingActivities || loadingTimers) { // Include loadingTimers
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
        {user && (
          <div>
            <p className="text-gray-700">Welcome, {user.email}!</p>
            <button
              onClick={handleLogout}
              className="mt-4 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Sign Out
            </button>
          </div>
        )}
        <p className="mt-4 text-gray-600">This is your main dashboard. More features coming soon!</p>

        <div className="mt-6">
          <h2 className="text-2xl font-semibold mb-3">Your Children</h2>
          {children.length === 0 ? (
            <p>No children added yet. <Link href="/dashboard/children" className="text-blue-500 hover:underline">Add one here</Link>.</p>
          ) : (
            <ul>
              {children.map(child => (
                <li key={child.id} className="bg-gray-50 p-3 rounded-lg mb-2">
                  <p className="font-bold">{child.name}</p>
                  {child.age && <p className="text-sm text-gray-600">Age: {child.age}</p>}
                </li>
              ))}
            </ul>
          )}
          <Link href="/dashboard/children" className="mt-4 inline-block text-blue-500 hover:underline">
            Manage Children
          </Link>
        </div>

        <div className="mt-8">
          <h2 className="text-2xl font-semibold mb-3">Your Activities</h2>
          {activities.length === 0 ? (
            <p>No activities added yet. <Link href="/dashboard/activities" className="text-blue-500 hover:underline">Add one here</Link>.</p>
          ) : (
            <ul>
              {activities.slice(0, 3).map(activity => (
                <li key={activity.id} className="bg-gray-50 p-3 rounded-lg mb-2">
                  <p className="font-bold">{activity.name} ({activity.category})</p>
                </li>
              ))}
            </ul>
          )}
          <Link href="/dashboard/activities" className="mt-4 inline-block text-blue-500 hover:underline">
            Manage Activities
          </Link>
        </div>

        <div className="mt-8">
          <h2 className="text-2xl font-semibold mb-3">Active Timers</h2>
          {activeTimers.length === 0 ? (
            <p>No active timers. <Link href="/dashboard/timers" className="text-blue-500 hover:underline">Set one here</Link>.</p>
          ) : (
            <ul>
              {activeTimers.map(timer => (
                <li key={timer.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg mb-2">
                  <div>
                    <p className="font-bold">{children.find(c => c.id === timer.childId)?.name || 'Unknown Child'}</p>
                    <p className="text-sm text-gray-600">{formatTime(timer.remainingTime)} ({timer.status})</p>
                  </div>
                  <Link href="/dashboard/timers" className="text-blue-500 hover:underline">Manage</Link>
                </li>
              ))}
            </ul>
          )}
          <Link href="/dashboard/timers" className="mt-4 inline-block text-blue-500 hover:underline">
            Manage Timers
          </Link>
        </div>
      </div>
    </div>
  );
}
