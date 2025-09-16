"use client";

import { useState } from "react";
import { auth } from "../firebase-config";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { useRouter } from "next/navigation";
import { saveUser } from "../services/users";
import { useSearchParams } from "next/navigation";

const Login: React.FC = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") || "/";

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const res = await signInWithPopup(auth, provider);

      if (res?.user) {
        try {
          await saveUser({
            uid: res.user.uid,
            email: res.user.email ?? null,
            displayName: res.user.displayName ?? null,
          });
        } catch (e) {
          console.warn("saveUser after Google sign-in failed (ignored):", e);
        }
      }

      router.push(from, { replace: true });
    } catch (err: any) {
      console.error(
        "Auth error:",
        err?.code ?? err?.name ?? err,
        err?.message ?? err
      );
      setError(err.message ?? String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (isRegister) {
        const userCred = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        if (auth.currentUser && nickname) {
          await updateProfile(auth.currentUser, { displayName: nickname });
        }
        if (userCred.user) {
          await saveUser({
            uid: userCred.user.uid,
            email: userCred.user.email ?? null,
            displayName: (nickname || userCred.user.displayName) ?? null,
          });
        }
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      router.push(from, { replace: true });
    } catch (err: any) {
      console.error(
        "Auth error:",
        err?.code ?? err?.name ?? err,
        err?.message ?? err
      );
      setError(err.message ?? String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center p-3 min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl px-8 py-10 border border-gray-300">
        <div className="flex flex-col items-center mb-5">
          <p className="text-5xl font-light text-gray-800 mb-5">bookify</p>
          <h2 className="text-xl font-semibold text-gray-900 mb-1 tracking-tight">
            {isRegister ? "Create an account" : "Sign in"}
          </h2>
          <p className="text-gray-500 text-base">
            {isRegister
              ? "Enter your details to register"
              : "Welcome back! Login to your account"}
          </p>
        </div>
        {error && (
          <div className="mb-4 text-red-600 text-sm text-center font-medium bg-red-50 rounded-lg py-2 px-3 border border-red-200">
            {error}
          </div>
        )}
        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 hover:border-blue-500 hover:shadow-md text-gray-700 font-medium py-2.5 rounded-xl transition mb-6 focus:outline-none focus:ring-2 focus:ring-blue-200"
          disabled={loading}
          type="button"
        >
          <img
            src="https://www.google.com/favicon.ico"
            alt="Google Logo"
            className="w-6 h-6"
          />
          <span className="font-medium">Continue with Google</span>
        </button>
        <div className="flex items-center mb-6">
          <div className="flex-grow border-t border-gray-200"></div>
          <span className="mx-3 text-gray-400 text-sm">ili</span>
          <div className="flex-grow border-t border-gray-200"></div>
        </div>
        <form onSubmit={handleEmailLogin} className="space-y-5">
          {isRegister && (
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-1">
                Username
              </label>
              <input
                type="text"
                placeholder="Your Username"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50 text-gray-900 transition"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                required
                minLength={2}
              />
            </div>
          )}
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">
              Email address
            </label>
            <input
              type="email"
              placeholder="email@example.com"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50 text-gray-900 transition"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">
              Password
            </label>
            <input
              type="password"
              placeholder="password"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50 text-gray-900 transition"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete={isRegister ? "new-password" : "current-password"}
            />
          </div>
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-yellow-300 to-yellow-500 hover:from-yellow-400 hover:to-yellow-500 font-semibold py-2.5 rounded-xl shadow-md transition focus:outline-none focus:ring-2 focus:ring-blue-300"
            disabled={loading}
          >
            {isRegister ? "Register" : "Login"}
          </button>
        </form>
        <div className="mt-6 text-center">
          {isRegister ? (
            <span className="text-gray-600 text-sm">
              Already have an account?{" "}
              <button
                className="text-blue-600 hover:underline font-medium"
                onClick={() => setIsRegister(false)}
                type="button"
              >
                Sign in
              </button>
            </span>
          ) : (
            <span className="text-gray-600 text-sm">
              Don't have an account?{" "}
              <button
                className="text-blue-600 hover:underline font-medium"
                onClick={() => setIsRegister(true)}
                type="button"
              >
                Register
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
