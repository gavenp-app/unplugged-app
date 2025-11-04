'use client';

import { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { addActivity, getActivities, updateActivity, deleteActivity } from '@/lib/firestore';
import { Activity } from '@/types';

export default function ActivitiesPage() {
  const [user, loadingAuth, errorAuth] = useAuthState(auth);
  const router = useRouter();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activityName, setActivityName] = useState('');
  const [activityDescription, setActivityDescription] = useState('');
  const [activityCategory, setActivityCategory] = useState('Movement');
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [loadingActivities, setLoadingActivities] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

  const categories = ['Movement', 'Crafts', 'Learning', 'Family Games', 'Chores', 'Reading', 'Outdoor'];

  useEffect(() => {
    if (!loadingAuth && !user) {
      router.push('/login');
    }
  }, [user, loadingAuth, router]);

  useEffect(() => {
    const fetchActivities = async () => {
      if (user) {
        setLoadingActivities(true);
        const fetchedActivities = await getActivities(user.uid);
        setActivities(fetchedActivities);
        setLoadingActivities(false);
      }
    };
    fetchActivities();
  }, [user]);

  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!user || !activityName || !activityCategory) {
      setFormError('Activity name and category are required.');
      return;
    }
    try {
      const newActivity = await addActivity({
        parentId: user.uid,
        name: activityName,
        description: activityDescription,
        category: activityCategory,
        isCustom: true,
      });
      if (newActivity) {
        setActivities(prev => [...prev, newActivity]);
        setActivityName('');
        setActivityDescription('');
        setActivityCategory('Movement');
      }
    } catch (error: any) {
      setFormError(error.message);
    }
  };

  const handleUpdateActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!user || !editingActivity || !editingActivity.name || !editingActivity.category) {
      setFormError('Activity name and category are required.');
      return;
    }
    try {
      await updateActivity(editingActivity.id, {
        name: editingActivity.name,
        description: editingActivity.description,
        category: editingActivity.category,
      });
      setActivities(prev => prev.map(activity => activity.id === editingActivity.id ? editingActivity : activity));
      setEditingActivity(null);
    } catch (error: any) {
      setFormError(error.message);
    }
  };

  const handleDeleteActivity = async (activityId: string) => {
    if (!user || !confirm('Are you sure you want to delete this activity?')) return;
    try {
      await deleteActivity(activityId);
      setActivities(prev => prev.filter(activity => activity.id !== activityId));
    } catch (error: any) {
      setFormError(error.message);
    }
  };

  if (loadingAuth || loadingActivities) {
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
      <h1 className="text-3xl font-bold mb-6">Manage Activities</h1>

      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-2xl font-semibold mb-4">{editingActivity ? 'Edit Activity' : 'Add New Activity'}</h2>
        <form onSubmit={editingActivity ? handleUpdateActivity : handleAddActivity}>
          <div className="mb-4">
            <label htmlFor="activityName" className="block text-gray-700 text-sm font-bold mb-2">Activity Name:</label>
            <input
              type="text"
              id="activityName"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={editingActivity ? editingActivity.name : activityName}
              onChange={(e) => editingActivity ? setEditingActivity({ ...editingActivity, name: e.target.value }) : setActivityName(e.target.value)}
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="activityDescription" className="block text-gray-700 text-sm font-bold mb-2">Description (optional):</label>
            <textarea
              id="activityDescription"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={editingActivity ? editingActivity.description : activityDescription}
              onChange={(e) => editingActivity ? setEditingActivity({ ...editingActivity, description: e.target.value }) : setActivityDescription(e.target.value)}
              rows={3}
            />
          </div>
          <div className="mb-4">
            <label htmlFor="activityCategory" className="block text-gray-700 text-sm font-bold mb-2">Category:</label>
            <select
              id="activityCategory"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={editingActivity ? editingActivity.category : activityCategory}
              onChange={(e) => editingActivity ? setEditingActivity({ ...editingActivity, category: e.target.value }) : setActivityCategory(e.target.value)}
              required
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          {formError && <p className="text-red-500 text-xs italic mb-4">{formError}</p>}
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            {editingActivity ? 'Update Activity' : 'Add Activity'}
          </button>
          {editingActivity && (
            <button
              type="button"
              onClick={() => setEditingActivity(null)}
              className="ml-4 bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Cancel Edit
            </button>
          )}
        </form>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold mb-4">Your Activities</h2>
        {activities.length === 0 ? (
          <p>No activities added yet. Add one above!</p>
        ) : (
          <ul>
            {activities.map(activity => (
              <li key={activity.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg mb-2">
                <div>
                  <p className="font-bold">{activity.name} ({activity.category})</p>
                  {activity.description && <p className="text-sm text-gray-600">{activity.description}</p>}
                </div>
                <div>
                  <button
                    onClick={() => setEditingActivity(activity)}
                    className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-1 px-3 rounded text-sm focus:outline-none focus:shadow-outline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteActivity(activity.id)}
                    className="ml-2 bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-sm focus:outline-none focus:shadow-outline"
                  >
                    Delete
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
