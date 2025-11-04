'use client';

import { useState, useEffect, useRef } from 'react';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { getChildren, getActivities, addTimer, updateTimer, deleteTimer, getTimers } from '@/lib/firestore';
import { Child, Activity, Timer } from '@/types';

export default function TimersPage() {
  const [user, loadingAuth, errorAuth] = useAuthState(auth);
  const router = useRouter();
  const [children, setChildren] = useState<Child[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activeTimers, setActiveTimers] = useState<Timer[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string | ''>('');
  const [timerDuration, setTimerDuration] = useState<number>(15); // Default 15 minutes
  const [formError, setFormError] = useState<string | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  const intervalRefs = useRef<{ [key: string]: NodeJS.Timeout }>({});

  useEffect(() => {
    if (!loadingAuth && !user) {
      router.push('/login');
    }
  }, [user, loadingAuth, router]);

  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        setLoadingData(true);
        const fetchedChildren = await getChildren(user.uid);
        setChildren(fetchedChildren);
        const fetchedActivities = await getActivities(user.uid);
        setActivities(fetchedActivities);
        const fetchedTimers = await getTimers(user.uid);
        setActiveTimers(fetchedTimers);
        setLoadingData(false);
      }
    };
    fetchData();
  }, [user]);

  useEffect(() => {
    activeTimers.forEach(timer => {
      if (timer.status === 'active' && !intervalRefs.current[timer.id]) {
        intervalRefs.current[timer.id] = setInterval(() => {
          setActiveTimers(prevTimers => prevTimers.map(t => {
            if (t.id === timer.id && t.remainingTime > 0) {
              const newRemainingTime = t.remainingTime - 1;
              if (newRemainingTime <= 0) {
                clearInterval(intervalRefs.current[t.id]);
                delete intervalRefs.current[t.id];
                handleTimerEnd(t);
                return { ...t, remainingTime: 0, status: 'completed' };
              }
              return { ...t, remainingTime: newRemainingTime };
            }
            return t;
          }));
        }, 1000);
      }
    });

    return () => {
      Object.values(intervalRefs.current).forEach(clearInterval);
      intervalRefs.current = {};
    };
  }, [activeTimers]);

  const handleTimerEnd = async (timer: Timer) => {
    // Logic for when a timer ends
    console.log(`Timer for ${timer.childId} ended!`);
    // Here you would implement the activity reveal logic
    // For MVP, we'll just update its status to completed
    await updateTimer(timer.id, { status: 'completed', remainingTime: 0 });
    // Optionally, trigger a notification or show a modal
  };

  const handleStartTimer = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!user || !selectedChildId || !timerDuration) {
      setFormError('Please select a child and set a duration.');
      return;
    }

    try {
      const newTimer = await addTimer({
        parentId: user.uid,
        childId: selectedChildId,
        initialDuration: timerDuration,
        remainingTime: timerDuration * 60, // Convert minutes to seconds
        status: 'active',
        startTime: new Date(),
      });
      if (newTimer) {
        setActiveTimers(prev => [...prev, newTimer]);
        setSelectedChildId('');
        setTimerDuration(15);
      }
    } catch (error: any) {
      setFormError(error.message);
    }
  };

  const handlePauseResumeTimer = async (timer: Timer) => {
    const newStatus = timer.status === 'active' ? 'paused' : 'active';
    await updateTimer(timer.id, { status: newStatus });
    setActiveTimers(prev => prev.map(t => t.id === timer.id ? { ...t, status: newStatus } : t));
    if (newStatus === 'paused') {
      clearInterval(intervalRefs.current[timer.id]);
      delete intervalRefs.current[timer.id];
    }
  };

  const handleCancelTimer = async (timerId: string) => {
    if (!confirm('Are you sure you want to cancel this timer?')) return;
    await deleteTimer(timerId);
    setActiveTimers(prev => prev.filter(t => t.id !== timerId));
    clearInterval(intervalRefs.current[timerId]);
    delete intervalRefs.current[timerId];
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (loadingAuth || loadingData) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (errorAuth) {
    return <div className="min-h-screen flex items-center justify-center text-red-500">Error: {errorAuth.message}</div>;
  }

  if (!user) {
    return null; // Should redirect to login via useEffect
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-3xl font-bold mb-6">Manage Timers</h1>

      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-2xl font-semibold mb-4">Set New Timer</h2>
        <form onSubmit={handleStartTimer}>
          <div className="mb-4">
            <label htmlFor="childSelect" className="block text-gray-700 text-sm font-bold mb-2">Select Child:</label>
            <select
              id="childSelect"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={selectedChildId}
              onChange={(e) => setSelectedChildId(e.target.value)}
              required
            >
              <option value="">-- Select a child --</option>
              {children.map(child => (
                <option key={child.id} value={child.id}>{child.name}</option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            <label htmlFor="timerDuration" className="block text-gray-700 text-sm font-bold mb-2">Duration (minutes):</label>
            <input
              type="number"
              id="timerDuration"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={timerDuration}
              onChange={(e) => setTimerDuration(parseInt(e.target.value))}
              min="1"
              required
            />
          </div>
          {formError && <p className="text-red-500 text-xs italic mb-4">{formError}</p>}
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Start Timer
          </button>
        </form>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold mb-4">Active Timers</h2>
        {activeTimers.filter(t => t.status === 'active' || t.status === 'paused').length === 0 ? (
          <p>No active timers. Set one above!</p>
        ) : (
          <ul>
            {activeTimers.filter(t => t.status === 'active' || t.status === 'paused').map(timer => (
              <li key={timer.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg mb-2">
                <div>
                  <p className="font-bold">{children.find(c => c.id === timer.childId)?.name || 'Unknown Child'}</p>
                  <p className="text-sm text-gray-600">{formatTime(timer.remainingTime)} ({timer.status})</p>
                </div>
                <div>
                  <button
                    onClick={() => handlePauseResumeTimer(timer)}
                    className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-1 px-3 rounded text-sm focus:outline-none focus:shadow-outline"
                  >
                    {timer.status === 'active' ? 'Pause' : 'Resume'}
                  </button>
                  <button
                    onClick={() => handleCancelTimer(timer.id)}
                    className="ml-2 bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-sm focus:outline-none focus:shadow-outline"
                  >
                    Cancel
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
