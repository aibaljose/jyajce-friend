// src/Home.js
import React, { useState } from "react";
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut
} from "firebase/auth";

import { auth } from "./firebase";
import { db } from "./firebase";
import { doc, setDoc } from "firebase/firestore";
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
  
  // Store query params to Firestore

  const [isRegister, setIsRegister] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");    
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [admissionNo, setAdmissionNo] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  async function handleRegister(e) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      return setError("Passwords do not match");
    }

    const mobileRegex = /^[\+]?[1-9][\d]{0,15}$/;
    const cleanMobile = mobile.replace(/[\s\-\(\)]/g, '');

    if (!mobileRegex.test(cleanMobile) || cleanMobile.length < 10 || cleanMobile.length > 15) {
      return setError("Please enter a valid mobile number (10-15 digits)");
    }

    try {
      setLoading(true);

      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCred.user;

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name,
        email,
        mobile,
        admissionNo,
        createdAt: new Date()
      });

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // LOGIN
  async function handleLogin(e) {
    e.preventDefault();
    setError("");

    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // LOGOUT
  async function handleLogout() {
    try {
      await signOut(auth);
    } catch (err) {
      setError(err.message);
    }
  }

  // LOGGED-IN SCREEN
  if (user) {
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

        <div className="relative bg-white/90 backdrop-blur-xl p-8 rounded-2xl shadow-2xl w-full max-w-md border border-red-300">
          <h1 className="text-3xl font-extrabold text-center text-green-700">
            🎄 Merry Christmas!
          </h1>

          <p className="text-center mt-3 text-lg text-red-700 font-semibold">
            Welcome, {user.email}. Your Christmas friend arrives soon!
          </p>

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

      <div className="relative bg-white/90 backdrop-blur-xl p-8 rounded-2xl shadow-2xl w-full max-w-md border border-red-300">
        
        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-4xl">
          🎄
        </div>

        <h1 className="text-2xl font-extrabold text-center text-transparent bg-gradient-to-r from-red-600 to-green-600 bg-clip-text drop-shadow-lg mb-2">
          JY AJCE Christmas Friend
        </h1>

        <h2 className="text-2xl font-extrabold text-center text-red-700 mb-4">
          {isRegister ? "Create Account" : "Welcome Back!"}
        </h2>

        {error && (
          <p className="text-red-600 text-sm text-center mt-2 font-semibold">{error}</p>
        )}

        <form onSubmit={isRegister ? handleRegister : handleLogin}>
          {isRegister && (
            <input 
              type="text"
              placeholder="Full Name"
              className="w-full p-3 mt-4 rounded-lg border-2 border-red-300 bg-white/70"
              onChange={(e) => setName(e.target.value)}
              required
            />
          )}

          <input 
            type="email"
            placeholder="Email"
            className="w-full p-3 mt-4 rounded-lg border-2 border-red-300 bg-white/70"
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          {isRegister && (
            <input 
              type="tel"
              placeholder="Mobile Number"
              className="w-full p-3 mt-4 rounded-lg border-2 border-red-300 bg-white/70"
              onChange={(e) => setMobile(e.target.value)}
              required
            />
          )}

          {isRegister && (
            <input 
              type="text"
              placeholder="Admission Number"
              className="w-full p-3 mt-4 rounded-lg border-2 border-red-300 bg-white/70"
              onChange={(e) => setAdmissionNo(e.target.value)}
              required
            />
          )}

          <input 
            type="password"
            placeholder="Password"
            className="w-full p-3 mt-4 rounded-lg border-2 border-red-300 bg-white/70"
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {isRegister && (
            <input 
              type="password"
              placeholder="Confirm Password"
              className="w-full p-3 mt-4 rounded-lg border-2 border-red-300 bg-white/70"
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          )}

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-green-600 to-red-600 text-white p-3 rounded-lg mt-6 shadow-lg hover:scale-[1.02]"
          >
            {loading ? "Please wait..." : isRegister ? "Sign Up" : "Login"}
          </button>
        </form>

        {!isRegister && (
          <button 
            onClick={() => sendPasswordResetEmail(auth, email)}
            className="text-sm text-red-700 mt-3 block text-center hover:underline"
          >
            Forgot Password?
          </button>
        )}

        <button 
          onClick={() => setIsRegister(!isRegister)}
          className="text-sm text-green-700 mt-4 block text-center hover:underline font-semibold"
        >
          {isRegister ? "Already have an account? Login" : "Create an Account"}
        </button>
      </div>
    </div>
  );
}

export default Home;
