import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Logo from '../assets/logoplaceholder.png';

const LoginForm = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  const handleLogin = async (event) => {
    event.preventDefault();
    setError(null);
  
    try {
      const response = await fetch("https://varda-inventory-management-system.onrender.com/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });      
  
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }
  
      // ✅ Store JWT and Role
      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.role);
  
      navigate("/dashboard");
    } catch (error) {
      setError(error.message);
    }
  };
  

  return (
    <div className="h-screen w-screen bg-gray-300 flex justify-center items-center px-4">
      <div className="bg-white w-[600px] md:w-[600px] h-[500px] md:h-[500px] p-8 md:p-16 rounded-2xl shadow-xl">
        <div className="flex flex-row gap-3 pb-4">
          <div>
            <img src={Logo} alt="Logo" className="max-w-[40px] sm:max-w-[50px] md:max-w-[60px] h-auto" />
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-700 my-auto whitespace-nowrap">
            VARDA ENTERPRISE
          </h1>
        </div>
        <form className="flex flex-col" onSubmit={handleLogin}>
          <div className="pb-4">
            <label htmlFor="username" className="block mb-2 text-sm md:text-lg font-bold text-gray-900">
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
            <label htmlFor="password" className="block mb-2 text-sm md:text-lg font-bold text-gray-900">
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

          {error && <p className="text-red-600 text-center mb-4">{error}</p>}

          <button
            type="submit"
            className="w-full text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-4 focus:outline-none focus:ring-indigo-300 font-medium rounded-lg text-base md:text-lg px-6 py-3 text-center mb-6"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginForm;
