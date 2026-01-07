// src/Home.js
import React, { useState } from "react";
import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut
} from "firebase/auth";


import bg from "./assets/bg.png";
import bgg from "./assets/bgg.png";
import { auth } from "./firebase";
import { db } from "./firebase";
import { doc, setDoc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { useLocation } from "react-router-dom";

const Home = ({ user }) => {
  const location = useLocation();
  console.log("Query string:", location.search);
  const storeAccessLog = async () => {
    try {
      const accessLogRef = doc(db, "accessLogs", Date.now().toString());
      await setDoc(accessLogRef, {
        queryString: location.search,
        pathname: location.pathname,
        timestamp: new Date(),
        userAgent: navigator.userAgent,
        referrer: document.referrer || "direct"
      });
      console.log("Access log stored successfully");
    } catch (error) {
      console.error("Error storing access log:", error);
    }
  };

  React.useEffect(() => {
    storeAccessLog();
  }, [location.search]);

  // State declarations
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isRegistrationComplete, setIsRegistrationComplete] = useState(false);
  const [isCheckingRegistration, setIsCheckingRegistration] = useState(false);
  const [showInstructionsModal, setShowInstructionsModal] = useState(false);
  const [friendAssignment, setFriendAssignment] = useState(null);

  const loadFriendAssignment = async () => {
    if (!user) return;
    
    try {
      const assignmentDoc = await getDoc(doc(db, "friendAssignments", user.uid));
      if (assignmentDoc.exists()) {
        setFriendAssignment(assignmentDoc.data());
      } else {
        setFriendAssignment(null);
      }
    } catch (error) {
      console.error("Error loading friend assignment:", error);
    }
  };

  // Check if logged-in user has complete registration
  React.useEffect(() => {
    if (user) {
      setIsCheckingRegistration(true);
      const checkUserRegistration = async () => {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            setIsRegistrationComplete(true);
            setShowInstructionsModal(true);
            // Load friend assignment
            setTimeout(() => loadFriendAssignment(), 1000);
          } else {
            // User doesn't exist, logout
            setError("User not found in database");
            await signOut(auth);
          }
        } catch (error) {
          console.error("Error checking user registration:", error);
        } finally {
          setIsCheckingRegistration(false);
        }
      };
      checkUserRegistration();
    } else {
      // Reset states when user logs out
      setIsRegistrationComplete(false);
      setError("");
      setIsCheckingRegistration(false);
    }
  }, [user]);

  // TASK MANAGEMENT FUNCTIONS
  const getTodayDateString = () => {
    return new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
  };

  const saveTaskCompletion = async (taskText, completed) => {
    if (!user) return;
    
    try {
      const todayDate = getTodayDateString();
      const taskDocRef = doc(db, "tasks", `${user.uid}_${todayDate}`);
      
      await setDoc(taskDocRef, {
        userId: user.uid,
        userName: user.displayName,
        date: todayDate,
        task: taskText,
        completed: completed,
        completedAt: completed ? new Date() : null,
        updatedAt: new Date()
      }, { merge: true });
      
      console.log("Task completion saved successfully");
    } catch (error) {
      console.error("Error saving task completion:", error);
    }
  };

  const loadTodayTask = async () => {
    if (!user) return;
    
    try {
      const todayDate = getTodayDateString();
      const taskDocRef = doc(db, "tasks", `${user.uid}_${todayDate}`);
      const taskDoc = await getDoc(taskDocRef);
      
      if (taskDoc.exists()) {
        const taskData = taskDoc.data();
        setCurrentTask(taskData.task || "Call a friend you haven’t spoken to in a while");
        setIsTaskCompleted(taskData.completed || false);
      } else {
        // No task for today, use default
        setCurrentTask("Call a friend you haven’t spoken to in a while");
        setIsTaskCompleted(false);
      }
    } catch (error) {
      console.error("Error loading today's task:", error);
    }
  };

  // GOOGLE SIGN IN
  async function handleGoogleSignIn() {
    setError("");
    setLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user already exists in Firestore
      const userDoc = await getDoc(doc(db, "users", user.uid));

      if (userDoc.exists()) {
        // User found in database - allow them to proceed
        setIsRegistrationComplete(true);
      } else {
        // User not found in database
        setError("User not found. Please contact admin for registration.");
        await signOut(auth);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // CHECK UNIQUENESS
  async function checkUniqueness(mobile, admissionNo) {
    try {
      // Check mobile number uniqueness
      const mobileQuery = query(
        collection(db, "users"),
        where("mobile", "==", mobile)
      );
      const mobileSnapshot = await getDocs(mobileQuery);

      if (!mobileSnapshot.empty) {
        return { isUnique: false, error: "Mobile number is already registered" };
      }

      // Check admission number uniqueness
      const admissionQuery = query(
        collection(db, "users"),
        where("admissionNo", "==", admissionNo)
      );
      const admissionSnapshot = await getDocs(admissionQuery);

      if (!admissionSnapshot.empty) {
        return { isUnique: false, error: "Admission number is already registered" };
      }

      return { isUnique: true, error: null };
    } catch (error) {
      console.error("Error checking uniqueness:", error);
      return { isUnique: false, error: "Error validating data. Please try again." };
    }
  }

  // LOGOUT
  async function handleLogout() {
    try {
      await signOut(auth);
      // Reset all states
      setIsRegistrationComplete(false);
      setError("");
      setIsCheckingRegistration(false);
      setShowInstructionsModal(false);
      setFriendAssignment(null);
    } catch (err) {
      setError(err.message);
    }
  }

  if (user && isCheckingRegistration) {
    return (
      <div className="min-h-screen flex justify-center items-center p-6 bg-gradient-to-b from-red-600 via-rose-600 to-red-700">
        <div className="relative bg-white/90 backdrop-blur-xl p-8 rounded-2xl shadow-2xl w-full max-w-md border border-red-300">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
            <p className="text-red-700 font-semibold">Checking your registration...</p>
          </div>
        </div>
      </div>
    );
  }

  // LOGGED-IN SCREEN - Only show if user is authenticated AND has completed registration
  if (user && isRegistrationComplete) {
    return (
      <div className="min-h-screen flex justify-center items-center p-6 bg-gradient-to-b from-red-600 via-rose-600 to-red-700 relative overflow-hidden">

        {/* ❄ Snowfall */}
        <div className="snow">
          {Array.from({ length: 60 }).map((_, i) => (
            <span
              key={i}
              style={{
                left: Math.random() * 100 + "vw",
                animationDuration: 2 + Math.random() * 5 + "s",
                animationDelay: Math.random() * 5 + "s",
                opacity: 0.5 + Math.random() * 0.5
              }}
            ></span>
          ))}
        </div>

        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1607796991940-53331d31ee6d?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')] opacity-20"></div>

        {/* Instructions Modal */}
        {showInstructionsModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border-2 border-red-300 relative">
              <div className="p-6">
                <div className="text-center mb-4">
                  <div className="text-4xl mb-2">🎄🎁</div>
                  <h2 className="text-2xl font-bold text-green-700">Welcome to Christmas Friend!</h2>
                </div>
                
                <div className="space-y-4 text-sm text-gray-700">
                  <div className="flex items-start gap-3">
                    <span className="text-yellow-600 text-lg">✨</span>
                    <div>
                      <h3 className="font-semibold text-red-700">Keep it Respectful:</h3>
                      <p>Please avoid any vulgar or offensive messages. Let's keep all conversations decent and friendly.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <span className="text-blue-600 text-lg">💬</span>
                    <div>
                      <h3 className="font-semibold text-blue-700">Be Responsible:</h3>
                      <p>You are responsible for your own chats. Maintain a decent, friendly conversation. (Jesus Youth is not responsible for personal chats.)</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <span className="text-green-600 text-lg">🎁</span>
                    <div>
                      <h3 className="font-semibold text-green-700">Gift Exchange - No Pressure:</h3>
                      <p>Gifts can be shared or exchanged as per your wish — no pressure at all!</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <span className="text-pink-600 text-lg">💖</span>
                    <div>
                      <h3 className="font-semibold text-pink-700">Spread Joy & Kindness:</h3>
                      <p>Let's spread joy and kindness together this Christmas season!</p>
                    </div>
                  </div>
                  
          
                  
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-4">
                    <p className="text-center text-red-700 font-semibold text-sm">
                      🤫 Remember: Keep the Christmas spirit alive by staying anonymous until the reveal!
                    </p>
                  </div>
                </div>
                
                <button 
                  onClick={() => setShowInstructionsModal(false)}
                  className="w-full bg-gradient-to-r from-green-600 to-red-600 text-white p-3 rounded-lg mt-6 shadow-lg hover:scale-[1.02] transition-all font-semibold"
                >
                  Got it! Let's spread Christmas joy! 🎄
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="relative flex flex-col bg-white/90 backdrop-blur-xl p-8 rounded-2xl shadow-2xl w-full max-w-md border border-red-300">
          <h1 className="text-2xl font-extrabold text-center text-green-700">
            🎄 Merry Christmas!
          </h1>
        <div className="flex justify-center mb-4">
          <img src={bgg} className="h-[300px] w-[300px]" alt="Background" />

        </div>
        

          <p className="text-center mt-3 text-lg text-dark-700 font-semibold">
            Welcome, {user.displayName}. Your Christmas friend arrives soon!
          </p>
          <div className="mt-6">
            {friendAssignment ? (
              <div>
                <label className="block text-red-700 font-semibold mb-2">
                  🎁 Your Secret Christmas Friend
                </label>
                <div className="bg-gradient-to-br from-red-50 to-green-50 border-2 border-green-300 rounded-lg p-4 mb-3">
                  <div className="space-y-2">
                    <p className="text-green-800 font-bold text-lg">👤 {friendAssignment.friendName}</p>
                    <p className="text-green-700">📱 <span className="font-semibold">{friendAssignment.friendPhone}</span></p>
                    <p className="text-green-700">✉️ <span className="font-semibold text-sm">{friendAssignment.friendEmail}</span></p>
                    <div className="mt-3 pt-3 border-t border-green-200">
                      <p className="text-sm text-green-600 italic">💚 Remember to send them warm wishes and prayers!</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4 mb-3">
                <p className="text-yellow-700 font-medium">⏳ Your Christmas friend assignment hasn't been revealed yet.</p>
                <p className="text-yellow-600 text-sm mt-2">Check back soon! The admin will shuffle and assign friends.</p>
              </div>
            )}
          </div>

          <button
            onClick={handleLogout}
            className="w-full bg-gradient-to-r from-green-600 to-red-600 text-white p-3 rounded-lg mt-6 shadow-lg hover:scale-[1.02] transition-all font-semibold"
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

  // LOGIN / REGISTER SCREEN
  return (
    <div className="min-h-screen flex justify-center items-center p-6 bg-gradient-to-b from-red-600 via-rose-600 to-red-700 relative overflow-hidden">

      {/* ❄ Snowfall */}
      <div className="snow">
        {Array.from({ length: 60 }).map((_, i) => (
          <span
            key={i}
            style={{
              left: Math.random() * 100 + "vw",
              animationDuration: 2 + Math.random() * 5 + "s",
              animationDelay: Math.random() * 5 + "s",
              opacity: 0.5 + Math.random() * 0.5
            }}
          ></span>
        ))}
      </div>

      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1607796991940-53331d31ee6d?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')] opacity-20"></div>

      <div className="relative bg-white backdrop-blur-xl p-8 rounded-2xl shadow-2xl w-full max-w-md border border-red-300">
        <img src={bg} alt="Background" />


        <h1 className="text-[18px] font-extrabold text-center text-red-700  drop-shadow-lg mb-2">
          JY AJCE Christmas Friend
        </h1>

        <h2 className="text-2xl font-extrabold text-center text-red-400 mb-4">
          Welcome!
        </h2>

        {error && (
          <p className="text-red-600 text-sm text-center mt-2 font-semibold">{error}</p>
        )}

        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full bg-white border-2 border-red-300 text-gray-700 p-3 rounded-lg mt-6 shadow-lg hover:bg-gray-50 transition-all font-semibold flex items-center justify-center gap-3"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          {loading ? "Signing in..." : "Continue with Google"}
        </button>
      </div>
    </div>
  );
}

export default Home;
