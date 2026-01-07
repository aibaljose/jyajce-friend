import React, { useState, useEffect } from "react";
import { collection, getDocs, setDoc, doc, getDoc } from "firebase/firestore";
import { db } from "./firebase";

const Admin = ({ user }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [friendAssignments, setFriendAssignments] = useState({});

  // Fetch all users
  useEffect(() => {
    fetchUsers();
    fetchFriendAssignments();
  }, []);

  const fetchUsers = async () => {
    try {
      const usersCollection = collection(db, "users");
      const snapshot = await getDocs(usersCollection);
      const usersData = snapshot.docs.map((doc) => ({
        uid: doc.id,
        ...doc.data()
      }));
      setUsers(usersData);
    } catch (error) {
      console.error("Error fetching users:", error);
      setMessage("Error fetching users");
    }
  };

  const fetchFriendAssignments = async () => {
    try {
      const assignmentsCollection = collection(db, "friendAssignments");
      const snapshot = await getDocs(assignmentsCollection);
      const assignments = {};
      snapshot.docs.forEach((doc) => {
        assignments[doc.id] = doc.data();
      });
      setFriendAssignments(assignments);
    } catch (error) {
      console.error("Error fetching assignments:", error);
    }
  };

  // Fisher-Yates shuffle algorithm
  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Shuffle and assign Christmas friends
  const handleShuffleFriends = async () => {
    if (users.length < 2) {
      setMessage("Need at least 2 users to assign friends");
      return;
    }

    setLoading(true);
    setMessage("Shuffling Christmas friends...");

    try {
      // Create a shuffled list for assignments
      const shuffledUsers = shuffleArray(users);

      // Assign each user to the next user in the shuffled list (circular)
      const assignments = [];
      for (let i = 0; i < shuffledUsers.length; i++) {
        const currentUser = shuffledUsers[i];
        const friendUser = shuffledUsers[(i + 1) % shuffledUsers.length]; // Circular assignment

        assignments.push({
          userId: currentUser.uid,
          userName: currentUser.name,
          userPhone: currentUser.mobile,
          friendId: friendUser.uid,
          friendName: friendUser.name,
          friendPhone: friendUser.mobile,
          friendEmail: friendUser.email,
          assignedAt: new Date()
        });
      }

      // Save all assignments to Firestore
      for (const assignment of assignments) {
        await setDoc(doc(db, "friendAssignments", assignment.userId), assignment);
      }

      setMessage(`✅ Successfully shuffled and assigned ${assignments.length} Christmas friends!`);
      fetchFriendAssignments();
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Error shuffling friends:", error);
      setMessage("Error shuffling friends: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Reset all assignments
  const handleResetAssignments = async () => {
    if (!window.confirm("Are you sure you want to reset all friend assignments? This cannot be undone.")) {
      return;
    }

    setLoading(true);
    setMessage("Resetting assignments...");

    try {
      const assignmentsCollection = collection(db, "friendAssignments");
      const snapshot = await getDocs(assignmentsCollection);
      
      for (const doc_ of snapshot.docs) {
        await doc(db, "friendAssignments", doc_.id);
      }

      setFriendAssignments({});
      setMessage("✅ All assignments have been reset!");
      
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Error resetting assignments:", error);
      setMessage("Error resetting assignments: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Check if user is admin (you can add admin verification logic here)
  if (!user) {
    return (
      <div className="min-h-screen flex justify-center items-center p-6 bg-gradient-to-b from-red-600 via-rose-600 to-red-700">
        <div className="bg-white/90 backdrop-blur-xl p-8 rounded-2xl shadow-2xl w-full max-w-md border border-red-300">
          <p className="text-red-700 text-center font-semibold">Please sign in to access admin panel</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-gradient-to-b from-red-600 via-rose-600 to-red-700">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-red-300 p-8">
          <h1 className="text-3xl font-bold text-green-700 mb-2">🎄 Admin Panel - Christmas Friend Shuffle</h1>
          <p className="text-gray-700 mb-6">Manage and shuffle Christmas friend assignments</p>

          {message && (
            <div className={`mb-4 p-4 rounded-lg ${message.includes("✅") ? "bg-green-100 border border-green-300 text-green-700" : "bg-red-100 border border-red-300 text-red-700"}`}>
              {message}
            </div>
          )}

          {/* Users Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-blue-50 border border-blue-300 rounded-lg p-4">
              <p className="text-blue-700 font-semibold">Total Users</p>
              <p className="text-2xl font-bold text-blue-900">{users.length}</p>
            </div>
            <div className="bg-purple-50 border border-purple-300 rounded-lg p-4">
              <p className="text-purple-700 font-semibold">Assignments Made</p>
              <p className="text-2xl font-bold text-purple-900">{Object.keys(friendAssignments).length}</p>
            </div>
            <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4">
              <p className="text-yellow-700 font-semibold">Remaining Users</p>
              <p className="text-2xl font-bold text-yellow-900">{Math.max(0, users.length - Object.keys(friendAssignments).length)}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 mb-8">
            <button
              onClick={handleShuffleFriends}
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white p-3 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50"
            >
              {loading ? "Shuffling..." : "🎲 Shuffle Christmas Friends"}
            </button>
            <button
              onClick={handleResetAssignments}
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-red-600 to-rose-600 text-white p-3 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50"
            >
              {loading ? "Resetting..." : "🔄 Reset All Assignments"}
            </button>
          </div>

          {/* Users Table */}
          <div className="overflow-x-auto">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Registered Users</h2>
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-red-100 border-b-2 border-red-300">
                  <th className="p-3 text-left text-gray-800 font-semibold">Name</th>
                  <th className="p-3 text-left text-gray-800 font-semibold">Email</th>
                  <th className="p-3 text-left text-gray-800 font-semibold">Mobile</th>
                  <th className="p-3 text-left text-gray-800 font-semibold">Admission No</th>
                  <th className="p-3 text-left text-gray-800 font-semibold">Friend Assignment</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const assignment = friendAssignments[u.uid];
                  return (
                    <tr key={u.uid} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="p-3 text-gray-700">{u.name}</td>
                      <td className="p-3 text-gray-600">{u.email}</td>
                      <td className="p-3 text-gray-700">{u.mobile}</td>
                      <td className="p-3 text-gray-700">{u.admissionNo}</td>
                      <td className="p-3">
                        {assignment ? (
                          <div className="bg-green-100 border border-green-300 rounded p-2 text-sm">
                            <p className="font-semibold text-green-800">👤 {assignment.friendName}</p>
                            <p className="text-green-700">📱 {assignment.friendPhone}</p>
                            <p className="text-green-600 text-xs">✉️ {assignment.friendEmail}</p>
                          </div>
                        ) : (
                          <span className="text-gray-500 italic">Not assigned yet</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {users.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-600 font-semibold">No users registered yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Admin;
