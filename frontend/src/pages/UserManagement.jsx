import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [passwordError, setPasswordError] = useState("");
  const [formError, setFormError] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [userFormData, setUserFormData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    role: "",
  });

  const userRole = localStorage.getItem("role");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      const baseUrl = API_BASE_URL.replace(/\/$/, "");

      const response = await fetch(`${baseUrl}/api/auth/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (response.ok) {
        setUsers(data);
      } else {
        console.error("Error fetching users:", data.error);
      }
    } catch (error) {
      console.error("Fetch error:", error);
    }
  };

  const resetForm = () => {
    setUserFormData({ username: "", password: "", confirmPassword: "", role: "" });
    setSelectedUserId(null);
    setIsEditing(false);
    setPasswordError("");
    setFormError("");
  };

  const openAddUserModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditUserModal = (user) => {
    setUserFormData({ 
      username: user.username, 
      password: "", 
      confirmPassword: "", 
      role: user.role 
    });
    setSelectedUserId(user._id);
    setIsEditing(true);
    setShowModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const updatedFormData = { ...userFormData, [name]: value };
    setUserFormData(updatedFormData);

    // Password validation
    if (name === "password" || name === "confirmPassword") {
      // Check password length only when typing in password field
      if (name === "password") {
        if (value && value.length < 6) {
          setPasswordError("Password must be at least 6 characters");
          return;
        } else {
          setPasswordError("");
        }
      }

      // Check if passwords match (only when both fields have values)
      if (updatedFormData.password && updatedFormData.confirmPassword) {
        if (updatedFormData.password !== updatedFormData.confirmPassword) {
          setPasswordError("Passwords do not match");
        } else {
          setPasswordError("");
        }
      } else {
        setPasswordError("");
      }
    }
  };

  const handleSaveUser = async () => {
    // Validate required fields
    if (!userFormData.username || !userFormData.role) {
      setFormError("Username and Role are required");
      return;
    }

    // For new users or when changing password
    if (!isEditing || userFormData.password) {
      // Validate password length
      if (userFormData.password.length < 6) {
        setPasswordError("Password must be at least 6 characters");
        return;
      }

      // Validate password match
      if (userFormData.password !== userFormData.confirmPassword) {
        setPasswordError("Passwords do not match");
        return;
      }
    }

    try {
      const token = localStorage.getItem("token");
      const baseUrl = API_BASE_URL.replace(/\/$/, "");

      const url = isEditing
        ? `${baseUrl}/api/auth/users/${selectedUserId}`
        : `${baseUrl}/api/auth/register`;

      const method = isEditing ? "PUT" : "POST";

      const body = {
        username: userFormData.username,
        role: userFormData.role,
      };

      if (userFormData.password) {
        body.password = userFormData.password;
      }

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to save user");

      fetchUsers();
      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error("Error saving user:", error);
      setFormError("Failed to save user. Please try again.");
    }
  };

  const handleDeleteUser = (user) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-red-50">
      {/* Sidebar */}
      <div className="w-64">
        <Sidebar />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Navbar */}
        <Navbar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

        {/* Page Content */}
        <div className="flex-1 p-4 md:p-8 mt-16">
          <div className="flex flex-col md:flex-row justify-between items-center mb-6">
            <h2 className="text-2xl md:text-3xl font-bold text-yellow-500 mb-4 md:mb-0">
              User Management
            </h2>

            {userRole === "Admin" && (
              <button
                onClick={openAddUserModal}
                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-4 py-2 rounded-lg shadow-md transition-all duration-300 transform hover:scale-105"
              >
                Add New User
              </button>
            )}
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto bg-white rounded-xl shadow-lg">
            <table className="min-w-full">
              <thead className="bg-gradient-to-r from-red-600 to-red-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs md:text-sm font-semibold text-white uppercase tracking-wider">
                    Username
                  </th>
                  <th className="px-4 py-3 text-left text-xs md:text-sm font-semibold text-white uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-4 py-3 text-left text-xs md:text-sm font-semibold text-white uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50 transition-colors duration-200">
                    <td className="px-4 py-3 text-xs md:text-sm text-gray-700">{user.username}</td>
                    <td className="px-4 py-3 text-xs md:text-sm text-gray-700">{user.role}</td>
                    <td className="px-4 py-3 text-xs md:text-sm text-gray-700">
                      {userRole === "Admin" && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => openEditUserModal(user)}
                            className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded-md transition-all duration-300 transform hover:scale-105"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user)}
                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md transition-all duration-300 transform hover:scale-105"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Delete Confirmation Modal */}
          {showDeleteModal && (
            <div className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-lg z-50">
              <div className="bg-white p-6 rounded-lg shadow-md w-96">
                <h2 className="text-xl font-bold mb-4">Confirm Delete</h2>
                <p>
                  Are you sure you want to delete <b>{userToDelete?.username}</b>?
                </p>
                <div className="flex justify-end mt-4">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-md mr-2 transition-all duration-300 transform hover:scale-105"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        const token = localStorage.getItem("token");
                        const baseUrl = API_BASE_URL.replace(/\/$/, "");

                        const response = await fetch(`${baseUrl}/api/auth/users/${userToDelete._id}`, {
                          method: "DELETE",
                          headers: { Authorization: `Bearer ${token}` },
                        });

                        const data = await response.json();
                        if (!response.ok) throw new Error(data.error || "Failed to delete user");

                        setUsers(users.filter((u) => u._id !== userToDelete._id));
                        setShowDeleteModal(false);
                      } catch (error) {
                        console.error("Error deleting user:", error);
                        alert("Unexpected error occurred");
                      }
                    }}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md transition-all duration-300 transform hover:scale-105"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Add/Edit User Modal */}
          {showModal && (
            <div className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-lg z-50">
              <div className="bg-white p-6 rounded-lg shadow-md w-96">
                <h2 className="text-xl font-bold mb-4">{isEditing ? "Edit User" : "Add New User"}</h2>
                {formError && <p className="text-red-500 text-sm mb-2">{formError}</p>}
                <input
                  type="text"
                  name="username"
                  placeholder="Username"
                  value={userFormData.username}
                  onChange={handleInputChange}
                  className="border p-2 w-full mb-2 rounded-md"
                  required
                />
                <input
                  type="password"
                  name="password"
                  placeholder={isEditing ? "New Password (leave blank to keep current)" : "Password"}
                  value={userFormData.password}
                  onChange={handleInputChange}
                  className="border p-2 w-full mb-2 rounded-md"
                />
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm Password"
                  value={userFormData.confirmPassword}
                  onChange={handleInputChange}
                  className="border p-2 w-full mb-2 rounded-md"
                />
                {passwordError && (
                  <p className="text-red-500 text-sm mb-2">{passwordError}</p>
                )}
                <select
                  name="role"
                  value={userFormData.role}
                  onChange={handleInputChange}
                  className="border p-2 w-full mb-4 rounded-md"
                  required
                >
                  <option value="">Select Role</option>
                  {/*MASTER ADMIN*/}
                  <option value="Admin">Admin</option>

                  { /* LAGUNA BRANCH */}
                  <option value="Manager-Laguna-ChknChop">Manager-Laguna-ChknChop</option>
                  <option value="Staff-Laguna-ChknChop">Staff-Laguna-ChknChop</option>
                  <option value="Manager-Laguna-VardaBurger">Manager-Laguna-VardaBurger</option>
                  <option value="Staff-Laguna-VardaBurger">Staff-Laguna-VardaBurger</option>
                  <option value="Manager-Laguna-TheGoodJuice">Manager-Laguna-TheGoodJuice</option>
                  <option value="Staff-Laguna-TheGoodJuice">Staff-Laguna-TheGoodJuice</option>
                  <option value="Manager-Laguna-TheGoodNoodleBar">Manager-Laguna-TheGoodNoodleBar</option>
                  <option value="Staff-Laguna-TheGoodNoodleBar">Staff-Laguna-TheGoodNoodleBar</option>

                  {/* lIPA BATANGAS BRANCH */}
                  <option value="Manager-Lipa-ChknChop">Manager-Lipa-ChknChop</option>
                  <option value="Staff-Lipa-ChknChop">Staff-Lipa-ChknChop</option>
                  <option value="Manager-Lipa-VardaBurger">Manager-Lipa-VardaBurger</option>
                  <option value="Staff-Lipa-VardaBurger">Staff-Lipa-VardaBurger</option>
                  <option value="Manager-Lipa-Silog">Manager-Lipa-Silog</option>
                  <option value="Staff-Lipa-Silog">Staff-Lipa-Silog</option>
                  <option value="Manager-Lipa-NRB">Manager-Lipa-NRB</option>
                  <option value="Staff-Lipa-NRB">Staff-Lipa-NRB</option>
                  <option value="Manager-Lipa-Beverage">Manager-Lipa-Beverage</option>
                  <option value="Staff-Lipa-Beverage">Staff-Lipa-Beverage</option>
                  <option value="Manager-Lipa-Bread">Manager-Lipa-Bread</option>
                  <option value="Staff-Lipa-Bread">Staff-Lipa-Bread</option>

                  {/* PUP MAIN BRANCH */}
                  <option value="Manager-PUPMain-ChknChop">Manager-PUPMain-ChknChop</option>
                  <option value="Staff-PUPMain-ChknChop">Staff-PUPMain-ChknChop</option>
                  <option value="Manager-PUPMain-VardaBurger">Manager-PUPMain-VardaBurger</option>
                  <option value="Staff-PUPMain-VardaBurger">Staff-PUPMain-VardaBurger</option> 
                  <option value="Staff-PUPMain">Staff-PUPMain</option>

                  {/* MAPUA INTRAMUROS BRANCH */}
                  <option value="Manager-MAPUAIntramuros-VardaBurger">Manager-MAPUAIntramuros-VardaBurger</option>
                  <option value="Staff-MAPUAIntramuros-VardaBurger">Staff-MAPUAIntramuros-VardaBurger</option>
                  <option value="Manager-MAPUAIntramuros-TheGoodJuice">Manager-MAPUAIntramuros-TheGoodJuice</option>
                  <option value="Staff-MAPUAIntramuros-TheGoodJuice">Staff-MAPUAIntramuros-TheGoodJuice</option>

                  {/* MAPUA MAKATI BRANCH */}
                  <option value="Manager-MAPUAMakati-ChknChop">Manager-MAPUAMakati-ChknChop</option>
                  <option value="Staff-MAPUAMakati-ChknChop">Staff-MAPUAMakati-ChknChop</option>
                  <option value="Manager-MAPUAMakati-VardaBurger">Manager-MAPUAMakati-VardaBurger</option>
                  <option value="Staff-MAPUAMakati-VardaBurger">Staff-MAPUAMakati-VardaBurger</option>

                  {/* ST JUDE MANILA BRANCH */} 
                  <option value="Manager-STJudeManila-ChknChop">Manager-STJudeManila-ChknChop</option>
                  <option value="Staff-STJudeManila-ChknChop">Staff-STJudeManila-ChknChop</option>
                  <option value="Manager-STJudeManila-VardaBurger">Manager-STJudeManila-VardaBurger</option>
                  <option value="Staff-STJudeManila-VardaBurger">Staff-STJudeManila-VardaBurger</option>

                  {/* ADMU BRANCH */}
                  <option value="Manager-ADMU-VardaBurger">Manager-ADMU-VardaBurger</option>
                  <option value="Staff-ADMU-VardaBurger">Staff-ADMU-VardaBurger</option>
                  
                </select>
                <div className="flex justify-end">
                  <button
                    onClick={() => setShowModal(false)}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-md mr-2 transition-all duration-300 transform hover:scale-105"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveUser}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md transition-all duration-300 transform hover:scale-105"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserManagement;