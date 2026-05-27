import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import api from "../context/axiosInstance";
import { AuthContext } from "../context/AuthContext";

const Login = () => {
  // Toggle state: true for Login, false for Register
  const [isLoginMode, setIsLoginMode] = useState(true);

  // Form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student"); // Default role for registration

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
        // 1. Handle Login Flow
        const response = await api.post("/users/login", { email, password });
        login(response.data.result, response.data.token);

        // Redirect based on role
        if (response.data.result.role === "teacher") {
          navigate("/teacher/dashboard");
        } else {
          navigate("/");
        }
      } else {
        // 2. Handle Registration Flow
        await api.post("/users/register", { name, email, password, role });
        setSuccessMessage("Account created successfully! Please sign in.");
        setIsLoginMode(true); // Automatically switch to login mode
        setPassword(""); // Clear password field for safety
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Authentication failed. Please try again.",
      );
    }
  };

  return (
    <div className="max-w-md mx-auto mt-16 bg-white p-8 border border-gray-200 rounded-lg shadow-sm">
      <h2 className="text-2xl font-bold text-center mb-6 text-gray-900">
        {isLoginMode ? "Sign In to Portal" : "Create an Account"}
      </h2>

      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-md mb-4 text-sm font-medium">
          {error}
        </div>
      )}
      {successMessage && (
        <div className="bg-green-50 text-green-700 p-3 rounded-md mb-4 text-sm font-medium">
          {successMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Registration-only field: Name */}
        {!isLoginMode && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              required
              className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          <input
            type="email"
            required
            className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            type="password"
            required
            className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {/* Registration-only field: Role Selection */}
        {!isLoginMode && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              I am registering as a:
            </label>
            <select
              className="w-full border border-gray-300 p-2 rounded bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
            </select>
          </div>
        )}

        <button
          type="submit"
          className="w-full bg-black text-white font-bold py-2.5 rounded hover:bg-gray-800 transition-colors mt-2"
        >
          {isLoginMode ? "Login" : "Register"}
        </button>
      </form>

      {/* Mode Switch Button */}
      <div className="mt-6 text-center border-t pt-4">
        <button
          type="button"
          onClick={() => {
            setIsLoginMode(!isLoginMode);
            setError("");
            setSuccessMessage("");
          }}
          className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors"
        >
          {isLoginMode
            ? "Don't have an account? Sign Up"
            : "Already have an account? Sign In"}
        </button>
      </div>
    </div>
  );
};

export default Login;
