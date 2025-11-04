'use client';

import { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { addChild, getChildren, updateChild, deleteChild } from '@/lib/firestore';
import { Child } from '@/types';

export default function ChildrenPage() {
  const [user, loadingAuth, errorAuth] = useAuthState(auth);
  const router = useRouter();
  const [children, setChildren] = useState<Child[]>([]);
  const [childName, setChildName] = useState('');
  const [childAge, setChildAge] = useState<number | ''>('');
  const [editingChild, setEditingChild] = useState<Child | null>(null);
  const [loadingChildren, setLoadingChildren] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!loadingAuth && !user) {
      router.push('/login');
    }
  }, [user, loadingAuth, router]);

  useEffect(() => {
    const fetchChildren = async () => {
      if (user) {
        setLoadingChildren(true);
        const fetchedChildren = await getChildren(user.uid);
        setChildren(fetchedChildren);
        setLoadingChildren(false);
      }
    };
    fetchChildren();
  }, [user]);

  const handleAddChild = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!user || !childName) {
      setFormError('Child name is required.');
      return;
    }
    try {
      const newChild = await addChild(user.uid, {
        name: childName,
        age: childAge === '' ? undefined : childAge,
        // avatar: '' // Add avatar logic later
      });
      if (newChild) {
        setChildren(prev => [...prev, newChild]);
        setChildName('');
        setChildAge('');
      }
    } catch (error: any) {
      setFormError(error.message);
    }
  };

  const handleUpdateChild = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!user || !editingChild || !editingChild.name) {
      setFormError('Child name is required.');
      return;
    }
    try {
      await updateChild(editingChild.id, {
        name: editingChild.name,
        age: (typeof editingChild.age !== 'number') ? undefined : editingChild.age,
      });
      setChildren(prev => prev.map(child => child.id === editingChild.id ? editingChild : child));
      setEditingChild(null);
    } catch (error: any) {
      setFormError(error.message);
    }
  };

  const handleDeleteChild = async (childId: string) => {
    if (!user || !confirm('Are you sure you want to delete this child?')) return;
    try {
      await deleteChild(childId);
      setChildren(prev => prev.filter(child => child.id !== childId));
    } catch (error: any) {
      setFormError(error.message);
    }
  };

  if (loadingAuth || loadingChildren) {
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
      <h1 className="text-3xl font-bold mb-6">Manage Children</h1>

      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-2xl font-semibold mb-4">{editingChild ? 'Edit Child' : 'Add New Child'}</h2>
        <form onSubmit={editingChild ? handleUpdateChild : handleAddChild}>
          <div className="mb-4">
            <label htmlFor="childName" className="block text-gray-700 text-sm font-bold mb-2">Child's Name:</label>
            <input
              type="text"
              id="childName"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={editingChild ? editingChild.name : childName}
              onChange={(e) => editingChild ? setEditingChild({ ...editingChild, name: e.target.value }) : setChildName(e.target.value)}
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="childAge" className="block text-gray-700 text-sm font-bold mb-2">Child's Age (optional):</label>
            <input
              type="number"
              id="childAge"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={editingChild ? (editingChild.age || '') : childAge}
              onChange={(e) => {
                const value = e.target.value;
                editingChild ? setEditingChild({ ...editingChild, age: value === '' ? undefined : parseInt(value) }) : setChildAge(value === '' ? '' : parseInt(value));
              }}
            />
          </div>
          {formError && <p className="text-red-500 text-xs italic mb-4">{formError}</p>}
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            {editingChild ? 'Update Child' : 'Add Child'}
          </button>
          {editingChild && (
            <button
              type="button"
              onClick={() => setEditingChild(null)}
              className="ml-4 bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Cancel Edit
            </button>
          )}
        </form>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold mb-4">Your Children</h2>
        {children.length === 0 ? (
          <p>No children added yet. Add one above!</p>
        ) : (
          <ul>
            {children.map(child => (
              <li key={child.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg mb-2">
                <div>
                  <p className="font-bold">{child.name}</p>
                  {child.age && <p className="text-sm text-gray-600">Age: {child.age}</p>}
                </div>
                <div>
                  <button
                    onClick={() => setEditingChild(child)}
                    className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-1 px-3 rounded text-sm focus:outline-none focus:shadow-outline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteChild(child.id)}
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
