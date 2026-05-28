// src/pages/PaymentStatus.jsx
import { useEffect, useState, useContext } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../context/axiosInstance";
import { AuthContext } from "../context/AuthContext";

const PaymentStatus = () => {
  const { transactionId } = useParams();
  const { user, loading: authLoading, refreshUser } = useContext(AuthContext);

  const [status, setStatus] = useState("loading"); // "loading" | "success" | "error"
  const [message, setMessage] = useState("");
  const [verified, setVerified] = useState(false); // prevent double-calling

  useEffect(() => {
    // Wait until AuthContext has finished reading from localStorage
    if (authLoading) return;

    // Prevent double-calling if effect re-runs
    if (verified) return;

    // If the user is not logged in after auth has loaded, show error
    if (!user) {
      setStatus("error");
      setMessage("You must be logged in to confirm enrollment.");
      return;
    }

    const confirmPayment = async () => {
      setVerified(true);
      try {
        const response = await api.get(`/payments/verify/${transactionId}`);
        if (response.data.success) {
          // Pull fresh user data so purchasedCourses is up to date everywhere
          await refreshUser();
          setStatus("success");
          setMessage(response.data.message || "You are now enrolled!");
        } else {
          setStatus("error");
          setMessage(response.data.message || "Payment could not be confirmed.");
        }
      } catch (err) {
        setStatus("error");
        setMessage(
          err.response?.data?.message ||
            "Could not verify payment. Please contact support."
        );
      }
    };

    confirmPayment();
  }, [authLoading, user, transactionId]); // Re-runs when auth finishes loading

  return (
    <div className="max-w-md mx-auto mt-20 text-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-8 rounded-lg shadow-sm transition-colors duration-300">
      {status === "loading" && (
        <>
          <div className="text-5xl mb-4 animate-pulse">⏳</div>
          <h2 className="text-2xl font-bold mb-2 text-gray-800 dark:text-gray-200 transition-colors">
            Verifying Payment...
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm transition-colors">
            Please wait while we confirm your transaction with PhonePe.
          </p>
        </>
      )}

      {status === "success" && (
        <>
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-2xl font-bold mb-2 text-gray-950 dark:text-gray-100 transition-colors">
            Payment Complete!
          </h2>
          <p className="text-gray-600 dark:text-gray-450 mb-2 text-sm transition-colors">
            Transaction Reference:{" "}
            <span className="font-mono bg-gray-100 dark:bg-gray-950 px-1.5 py-0.5 rounded text-xs text-gray-700 dark:text-gray-300 transition-colors">
              {transactionId}
            </span>
          </p>
          <p className="text-gray-700 dark:text-gray-300 mb-6 transition-colors">{message}</p>
          <Link
            to="/"
            className="inline-block bg-black dark:bg-white text-white dark:text-black font-bold px-6 py-2.5 rounded hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors cursor-pointer select-none"
          >
            Go to Course Catalog
          </Link>
        </>
      )}

      {status === "error" && (
        <>
          <div className="text-5xl mb-4">❌</div>
          <h2 className="text-2xl font-bold mb-2 text-red-700 dark:text-red-400 transition-colors">
            Payment Issue
          </h2>
          <p className="text-gray-600 dark:text-gray-450 mb-2 text-sm transition-colors">
            Transaction Reference:{" "}
            <span className="font-mono bg-gray-100 dark:bg-gray-950 px-1.5 py-0.5 rounded text-xs text-gray-700 dark:text-gray-300 transition-colors">
              {transactionId}
            </span>
          </p>
          <p className="text-gray-700 dark:text-gray-300 mb-6 transition-colors">{message}</p>
          <Link
            to="/"
            className="inline-block bg-black dark:bg-white text-white dark:text-black font-bold px-6 py-2.5 rounded hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors cursor-pointer select-none"
          >
            Go to Home
          </Link>
        </>
      )}
    </div>
  );
};

export default PaymentStatus;
