import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../assets/vardalogo.png";
import '../Login.css'

const LoginForm = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);

  const handleLogin = async (event) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
  
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
  
      const data = await response.json();
  
      if (!response.ok) throw new Error(data.error || "Login failed");
  
      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.role);
      localStorage.setItem("username", username);
  
      await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/activitylogs/log`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username,
          role: data.role,
          action: "Logged in",
        }),
      });
  
      navigate("/dashboard");
    } catch (error) {
      console.error("Error:", error.message);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleContactClick = (e) => {
    e.preventDefault();
    setShowContactModal(true);
  };

  return (
    <div className="relative w-full h-screen flex items-center justify-center overflow-hidden">
      {/* Lava Background */}
      <div className="lava-background">
        <div className="blob" style={{ top: "10%", left: "10%" }}></div>
        <div className="blob"></div>
        <div className="blob"></div>
      </div>

      {/* Floating Particles */}
      <div className="particles-container">
        {[...Array(15)].map((_, i) => (
          <div key={i} className="particle" style={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            width: `${Math.random() * 8 + 2}px`,
            height: `${Math.random() * 8 + 2}px`,
            opacity: Math.random() * 0.5 + 0.1,
            animationDuration: `${Math.random() * 20 + 10}s`,
            animationDelay: `${Math.random() * 5}s`
          }}></div>
        ))}
      </div>

      {/* Contact IT Modal */}
      {showContactModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-50 p-4">
          <div className="bg-white p-6 rounded-2xl shadow-2xl max-w-sm animate-fade-in">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-red-100 p-3 rounded-full animate-pulse">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </div>
            </div>
            <p className="text-gray-600 mb-4 text-center">
              Please contact IT Support Here:
              <a
                href="https://www.facebook.com/profile.php?id=61575392403660"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 pt-3 text-blue-600 hover:underline"
              >
                <svg
                  className="w-5 h-5 fill-current"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                >
                  <path d="M22.675 0H1.325C.593 0 0 .593 0 1.326v21.348C0 23.407.593 24 1.325 
                  24H12.82v-9.294H9.692v-3.622h3.128V8.413c0-3.1 1.893-4.788 4.659-4.788 
                  1.325 0 2.463.099 2.794.143v3.24l-1.918.001c-1.504 
                  0-1.795.715-1.795 1.763v2.312h3.587l-.467 3.622h-3.12V24h6.116C23.407 
                  24 24 23.407 24 22.674V1.326C24 .593 23.407 0 22.675 0z" />
                </svg>
                <span className="bold">VARDA IT Support</span>
              </a>
            </p>

            <button
              onClick={() => setShowContactModal(false)}
              className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-2.5 rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-300 transform hover:-translate-y-0.5 shadow-md"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Enhanced Card */}
      <div className="w-full max-w-2xl relative z-10 px-4">
        {/* Card Shadow */}
        <div className="absolute -inset-3 bg-red-900/20 rounded-3xl -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        
        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] overflow-hidden flex flex-col md:flex-row transform transition-all duration-500 hover:scale-[1.01] group">
          {/* Left Side - Branding */}
          <div className="bg-gradient-to-br from-red-800 to-red-900 p-1 text-yellow-300 flex flex-col justify-center items-center md:w-2/5 relative overflow-hidden">
            {/* Animated gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-300/10 to-red-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            {/* Continuous loading bar at bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-red-700/30 overflow-hidden">
              <div className="h-full bg-yellow-300/80 w-full animate-progress-continuous"></div>
            </div>
            
            <div className="relative z-10 flex flex-col items-center p-6">
              <div className="logo-container transform transition-all duration-500 hover:scale-110">
                <img 
                  src={Logo} 
                  alt="Logo" 
                  className="w-40 h-auto mb-4 drop-shadow-lg filter transition-all duration-500 hover:drop-shadow-xl"
                  style={{ maxWidth: '160px', maxHeight: '160px' }}
                />
              </div>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="p-8 md:w-3/5">
            <h2 className="text-3xl font-bold text-red-900 mb-1">Welcome,</h2>
            <p className="text-gray-600 mb-6">Sign in to your Account.</p>

            <form className="space-y-5" onSubmit={handleLogin}>
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-red-800 mb-1">
                  Username
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-red-200 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-300 pl-10 hover:border-red-300 hover:shadow-sm"
                    placeholder="username"
                    autoComplete="username"
                    required
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-red-400 transition-colors duration-300" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-red-800 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 rounded-lg border border-red-200 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-300 pl-10 pr-10 hover:border-red-300 hover:shadow-sm"
                    autoComplete="current-password"
                    required
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-red-400 transition-colors duration-300" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center group"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <svg className="h-5 w-5 text-red-400 hover:text-red-500 transition-colors duration-300" fill="currentColor" viewBox="0 0 20 20">
                      {showPassword ? (
                        <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                      ) : (
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      )}
                      <path fillRule="evenodd" d="M.458 10C1.732 14.057 5.522 17 10 17c4.478 0 8.268-2.943 9.542-7-1.274-4.057-5.064-7-9.542-7C5.522 3 1.732 5.943.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded-md bg-red-100 p-3 border border-red-200 animate-shake">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-900">{error}</h3>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-md text-lg font-medium text-white bg-gradient-to-r from-red-700 to-red-800 hover:from-red-800 hover:to-red-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-lg ${
                    loading ? "opacity-80 cursor-not-allowed" : ""
                  }`}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Signing in...
                    </>
                  ) : (
                    <>
                      <span className="relative">
                        <span className="absolute -inset-0.5 bg-red-900/30 rounded-lg blur opacity-0 group-hover:opacity-100 transition duration-200"></span>
                        <span className="relative">Sign In</span>
                      </span>
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="mt-6 text-center text-sm text-gray-500">
              <p>
                Need an account or Forgot Password?{' '}
                <button 
                  onClick={handleContactClick}
                  className="font-medium text-red-700 hover:text-red-600 focus:outline-none hover:underline transition-colors duration-300"
                >
                  Contact IT Support
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;