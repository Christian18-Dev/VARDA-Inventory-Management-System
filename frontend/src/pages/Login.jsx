import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../assets/logoplaceholder.png";

const LoginForm = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (event) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
  
    try {
      // 🎯 Fetch login and get role dynamically
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/auth/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        }
      );
  
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }
  
      // 📝 Store user data after login
      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.role);
      localStorage.setItem("username", username);
  
      // 🎯 Log the login event with the correct role
      const logResponse = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/activitylogs/log`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: username,
            role: data.role, // ✅ Use role from login response
            action: "has logged in",
          }),
        }
      );
  
      const logData = await logResponse.json();
      if (!logResponse.ok) {
        console.error("❌ Failed to log activity:", logData.error);
      } else {
        console.log("✅ Activity log created:", logData.message);
      }
  
      // 🎉 Navigate to dashboard after successful login
      navigate("/dashboard");
    } catch (error) {
      console.error("❌ Error:", error.message);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };
  

  return (
    <div className="h-screen w-screen bg-gray-300 flex justify-center items-center px-4">
      <div className="bg-white w-[600px] md:w-[600px] h-[500px] md:h-[500px] p-8 md:p-16 rounded-2xl shadow-xl">
        <div className="flex flex-row gap-3 pb-4">
          <div>
            <img
              src={Logo}
              alt="Logo"
              className="max-w-[40px] sm:max-w-[50px] md:max-w-[60px] h-auto"
            />
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-700 my-auto whitespace-nowrap">
            VARDA ENTERPRISE
          </h1>
        </div>
        <form className="flex flex-col" onSubmit={handleLogin}>
          <div className="pb-4">
            <label
              htmlFor="username"
              className="block mb-2 text-sm md:text-lg font-bold text-gray-900"
            >
              Username
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="px-4 py-3 text-base md:text-lg font-medium rounded-lg border focus:outline-none bg-white text-gray-700 border-gray-300 w-full"
              placeholder="Enter username..."
              autoComplete="off"
              required
            />
          </div>

          <div className="pb-6">
            <label
              htmlFor="password"
              className="block mb-2 text-sm md:text-lg font-bold text-gray-900"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••"
              className="px-4 py-3 text-base md:text-lg font-bold rounded-lg border focus:outline-none bg-white text-gray-700 border-gray-300 w-full"
              autoComplete="new-password"
              required
            />
          </div>

          {/* Error Message with Fixed Height */}
          <div className="h-6 mb-2">
            {error && <p className="text-red-600 text-center">{error}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-4 focus:outline-none focus:ring-indigo-300 font-medium rounded-lg text-base md:text-lg px-6 py-3 text-center flex items-center justify-center gap-2 ${
              loading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {loading ? (
              <>
                <svg
                  className="w-5 h-5 text-white animate-spin"
                  viewBox="0 0 50 50"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle
                    cx="25"
                    cy="25"
                    r="20"
                    stroke="white"
                    strokeWidth="4"
                    strokeDasharray="90, 200"
                    strokeDashoffset="0"
                    strokeLinecap="round"
                  />
                </svg>
                Logging in...
              </>
            ) : (
              "Login"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginForm;
