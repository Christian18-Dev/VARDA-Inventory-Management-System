import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, ChevronDown, ChevronUp, LogOut } from "lucide-react";
import logo from "../assets/logoplaceholder.png";

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [showInventoryDropdown, setShowInventoryDropdown] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  useEffect(() => {
    const role = localStorage.getItem("role");
    setUserRole(role);
  }, []);

  const toggleInventoryDropdown = () => {
    setShowInventoryDropdown(!showInventoryDropdown);
    localStorage.setItem("showInventoryDropdown", !showInventoryDropdown);
  };

  useEffect(() => {
    const savedDropdownState = localStorage.getItem("showInventoryDropdown");
    if (savedDropdownState !== null) {
      setShowInventoryDropdown(JSON.parse(savedDropdownState));
    }
  }, []);

  useEffect(() => {
    if (location.pathname === "/dashboard") {
      setShowInventoryDropdown(false);
    }
  }, [location.pathname]);

  const handleLogout = async () => {
    const username = localStorage.getItem("username");
    const role = localStorage.getItem("role");

    try {
      await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/activitylogs/log`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username || "Unknown User",
          role: role || "Unknown Role",
          action: "Logged out",
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (error) {
      console.error("Failed to log logout action:", error);
    }

    localStorage.clear();
    navigate("/");
    window.location.reload();
  };

  const inventoryBranches = [
    { label: "CHKN CHOP", path: "/inventory/chkn-chop" },
    { label: "VARDA BURGER", path: "/inventory/varda-burger" },
    { label: "THE GOOD JUICE", path: "/inventory/the-good-juice" },
    { label: "THE GOOD NOODLES", path: "/inventory/the-good-noodles" },
    { label: "NRB VARDA", path: "/inventory/nrb-varda" },
    { label: "PUP VARDA", path: "/inventory/pup-varda" },
    { label: "ST JUDE VARDA", path: "/inventory/st-jude-varda" },
    { label: "INTRAMUROS VARDA", path: "/inventory/intramuros-varda" },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:flex flex-col w-64 h-full bg-gradient-to-b from-indigo-900 to-indigo-950 text-white p-5 fixed top-0 left-0 overflow-y-auto shadow-lg z-40">
        <div className="flex items-center gap-3 mb-6">
          <img src={logo} alt="Logo" className="w-10" />
          <span className="text-xl font-bold text-white">VARDA ENTERPRISE</span>
        </div>

        <nav className="flex flex-col space-y-2 flex-grow">
          <SidebarLink to="/dashboard" label="Dashboard" currentPath={location.pathname} />

          <button
            className="flex justify-between items-center w-full px-4 py-2 rounded-md hover:bg-indigo-700 transition"
            onClick={toggleInventoryDropdown}
          >
            <span>Inventory</span>
            {showInventoryDropdown ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {showInventoryDropdown && (
            <div className="ml-4 flex flex-col space-y-1">
              {inventoryBranches.map((branch) => (
                <Link
                  key={branch.path}
                  to={branch.path}
                  className={`text-sm px-4 py-1 rounded-md transition ${
                    location.pathname === branch.path
                      ? "bg-indigo-600 text-white"
                      : "hover:bg-indigo-800/50 text-gray-200"
                  }`}
                >
                  {branch.label}
                </Link>
              ))}
            </div>
          )}

          <SidebarLink to="/history" label="History" currentPath={location.pathname} />
          
          {userRole === "Admin" && (
            <SidebarLink to="/activitylogs" label="Activity Logs" currentPath={location.pathname} />
          )}

          {userRole === "Admin" && (
            <SidebarLink to="/users" label="Users" currentPath={location.pathname} />
          )}
        </nav>

        <button
          onClick={() => setIsLogoutModalOpen(true)}
          className="mt-auto flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white py-2 px-4 rounded-md transition"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>

      {/* Mobile Menu Button */}
      {!isOpen && (
        <button
          className="md:hidden fixed top-2 left-2 bg-indigo-900 text-white p-3 rounded-md z-60 shadow-lg hover:bg-indigo-800 transition"
          onClick={() => setIsOpen(true)}
          aria-label="Open menu"
        >
          <Menu size={24} />
        </button>
      )}

      {/* Mobile Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-64 bg-gradient-to-b from-indigo-900 to-indigo-950 text-white p-5 transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } md:hidden z-50 shadow-lg flex flex-col`}
      >
        {/* Close Button */}
        <button
          className="absolute top-4 right-4 text-white p-2 rounded-md hover:bg-indigo-800 transition"
          onClick={() => setIsOpen(false)}
          aria-label="Close menu"
        >
          <X size={24} />
        </button>

        <div className="flex items-center gap-3 mb-6 mt-6">
          <img src={logo} alt="Logo" className="w-8" />
          <span className="text-lg font-bold text-white">VARDA ENTERPRISE</span>
        </div>

        <nav className="flex flex-col space-y-2 flex-grow overflow-y-auto">
          <SidebarLink
            to="/dashboard"
            label="Dashboard"
            currentPath={location.pathname}
            onClick={() => setIsOpen(false)}
          />

          <button
            className="flex justify-between items-center w-full px-4 py-2 rounded-md hover:bg-indigo-700 transition"
            onClick={toggleInventoryDropdown}
          >
            <span>Inventory</span>
            {showInventoryDropdown ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {showInventoryDropdown && (
            <div className="ml-4 flex flex-col space-y-1">
              {inventoryBranches.map((branch) => (
                <Link
                  key={branch.path}
                  to={branch.path}
                  onClick={() => setIsOpen(false)}
                  className={`text-sm px-4 py-1 rounded-md transition ${
                    location.pathname === branch.path
                      ? "bg-indigo-600 text-white"
                      : "hover:bg-indigo-800/50 text-gray-200"
                  }`}
                >
                  {branch.label}
                </Link>
              ))}
            </div>
          )}

          <SidebarLink
            to="/history"
            label="History"
            currentPath={location.pathname}
            onClick={() => setIsOpen(false)}
          />

          {userRole === "Admin" && (
            <SidebarLink
              to="/activitylogs"
              label="Activity Logs"
              currentPath={location.pathname}
              onClick={() => setIsOpen(false)}
            />
          )}

          {userRole === "Admin" && (
            <SidebarLink
              to="/users"
              label="Users"
              currentPath={location.pathname}
              onClick={() => setIsOpen(false)}
            />
          )}
        </nav>

        {/* Logout Button - Fixed at bottom */}
        <div className="mt-auto pt-4">
          <button
            onClick={() => {
              setIsOpen(false);
              setIsLogoutModalOpen(true);
            }}
            className="w-full flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white py-2 px-4 rounded-md transition"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </div>

      {/* Logout Modal */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-lg z-50">
          <div className="bg-white p-5 rounded-lg shadow-lg w-80">
            <h2 className="text-lg font-semibold text-gray-900">Confirm Logout</h2>
            <p className="text-gray-600 mt-2">Are you sure you want to log out?</p>
            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={handleLogout}
                className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-md"
              >
                Yes, Logout
              </button>
              <button
                onClick={() => setIsLogoutModalOpen(false)}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const SidebarLink = ({ to, label, currentPath, onClick }) => (
  <Link
    to={to}
    onClick={onClick}
    className={`block px-4 py-2 rounded-md transition ${
      currentPath === to 
        ? "bg-indigo-600 text-white shadow-md" 
        : "hover:bg-indigo-800/50 text-gray-200"
    }`}
  >
    {label}
  </Link>
);

export default Sidebar;