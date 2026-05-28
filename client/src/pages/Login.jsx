import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import api from "../context/axiosInstance";
import { AuthContext } from "../context/AuthContext";

const Login = () => {
  const [isLoginMode, setIsLoginMode] = useState(true);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    try {
      if (isLoginMode) {
        const response = await api.post("/users/login", { email, password });
        login(response.data.result, response.data.token);

        // Redirect based on role
        if (response.data.result.role === "teacher") {
          navigate("/teacher/dashboard");
        } else {
          navigate("/");
        }
      } else {
        // Registration always creates a student account — no role picker
        await api.post("/users/register", { name, email, password });
        setSuccessMessage("Account created! Please sign in.");
        setIsLoginMode(true);
        setPassword("");
        setName("");
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Authentication failed. Please try again.",
      );
    }
  };

  return (
    <div className="max-w-md mx-auto mt-16 bg-white dark:bg-gray-900 p-8 border border-gray-200 dark:border-gray-800 rounded-lg shadow-sm transition-colors duration-300">
      <h2 className="text-2xl font-bold text-center mb-6 text-gray-900 dark:text-gray-100 transition-colors">
        {isLoginMode ? "Sign In to Portal" : "Create Student Account"}
      </h2>

      {error && (
        <div className="bg-red-50 dark:bg-red-955/20 text-red-700 dark:text-red-400 border border-transparent dark:border-red-900/30 p-3 rounded-md mb-4 text-sm font-medium transition-colors">
          {error}
        </div>
      )}
      {successMessage && (
        <div className="bg-green-50 dark:bg-green-955/20 text-green-700 dark:text-green-400 border border-transparent dark:border-green-900/30 p-3 rounded-md mb-4 text-sm font-medium transition-colors">
          {successMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name — sign-up only */}
        {!isLoginMode && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors">
              Full Name
            </label>
            <input
              id="signup-name"
              type="text"
              required
              className="w-full border border-gray-300 dark:border-gray-700 p-2 rounded bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors">
            Email Address
          </label>
          <input
            id="auth-email"
            type="email"
            required
            className="w-full border border-gray-300 dark:border-gray-700 p-2 rounded bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors">
            Password
          </label>
          <input
            id="auth-password"
            type="password"
            required
            className="w-full border border-gray-300 dark:border-gray-700 p-2 rounded bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button
          id="auth-submit-btn"
          type="submit"
          className="w-full bg-black dark:bg-white text-white dark:text-black font-bold py-2.5 rounded hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors mt-2 cursor-pointer select-none"
        >
          {isLoginMode ? "Login" : "Create Account"}
        </button>
      </form>

      <div className="mt-6 text-center border-t dark:border-gray-800 pt-4">
        <button
          type="button"
          onClick={() => {
            setIsLoginMode(!isLoginMode);
            setError("");
            setSuccessMessage("");
          }}
          className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors cursor-pointer select-none"
        >
          {isLoginMode
            ? "New here? Create a student account"
            : "Already have an account? Sign In"}
        </button>
      </div>
    </div>
  );
};

export default Login;
