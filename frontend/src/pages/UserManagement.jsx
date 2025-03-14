import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [passwordError, setPasswordError] = useState("");
  const [formError, setFormError] = useState(""); 
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);


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
      const response = await fetch("https://varda-inventory-management-system.onrender.com/api/auth/users", {
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
  };

  const openAddUserModal = () => {
    resetForm();
    setFormError(""); // ✅ Clear error when opening modal
    setShowModal(true);
  };

  const openEditUserModal = (user) => {
    resetForm();
    setFormError(""); // ✅ Clear error when opening modal
    setUserFormData({ username: user.username, password: "", confirmPassword: "", role: user.role });
    setSelectedUserId(user._id);
    setIsEditing(true);
    setShowModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "password" || name === "confirmPassword") {
      if (userFormData.confirmPassword && userFormData.confirmPassword !== value) {
        setPasswordError("Passwords do not match. Try again.");
      } else if (name === "confirmPassword" && userFormData.password === "") {
        setPasswordError("Enter a password first.");
      } else if (name === "password" && value.length < 6) {
        setPasswordError("Password must be at least 6 characters long.");
      } else {
        setPasswordError("");
      }
    }
  };

  const handleSaveUser = async () => {
    if (!userFormData.username || !userFormData.role) {
      setFormError("Username and Role are required.");  // ✅ Set error message
      return;
    } else {
      setFormError("");  // Clear error if fields are valid
    }
  

    if (userFormData.confirmPassword && userFormData.password === "") {
      setPasswordError("Enter a new password first.");
      return;
    }

    if (userFormData.password && userFormData.password.length < 6) {
      setPasswordError("Password must be at least 6 characters long.");
      return;
    }

    if (userFormData.password && userFormData.password !== userFormData.confirmPassword) {
      setPasswordError("Passwords do not match. Try again.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const url = isEditing
        ? `https://varda-inventory-management-system.onrender.com/api/auth/users/${selectedUserId}`
        : "https://varda-inventory-management-system.onrender.com/api/auth/register";
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
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to save user");

      fetchUsers();
      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error("Error saving user:", error);
      alert("Unexpected error occurred");
    }
  };

  const handleDeleteUser = (user) => {
    setUserToDelete(user); // Store user info for deletion
    setShowDeleteModal(true); // Show delete confirmation modal
  };

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-grow ml-64 p-6">
        <h2 className="text-2xl font-bold mb-4">User Management</h2>

        {userRole === "Admin" && (
          <button onClick={openAddUserModal} className="bg-blue-500 text-white px-4 py-2 rounded mb-4">
            Add New User
          </button>
        )}

        <table className="min-w-full bg-white border border-gray-300">
          <thead>
            <tr>
              <th className="px-4 py-2 border">Username</th>
              <th className="px-4 py-2 border">Role</th>
              <th className="px-4 py-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user._id}>
                <td className="px-4 py-2 border">{user.username}</td>
                <td className="px-4 py-2 border">{user.role}</td>
                <td className="px-4 py-2 border">
                  {userRole === "Admin" && (
                    <>
                      <button onClick={() => openEditUserModal(user)} className="bg-yellow-500 text-white px-3 py-1 rounded mr-2">
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user)} className="bg-red-500 text-white px-3 py-1 rounded">
                        Delete
                      </button>

                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {showDeleteModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-lg z-50">
          <div className="bg-white p-6 rounded shadow-md w-96">
            <h2 className="text-xl font-bold mb-4">Confirm Delete</h2>
            <p>Are you sure you want to delete <b>{userToDelete?.username}</b>?</p>
            <div className="flex justify-end mt-4">
              <button onClick={() => setShowDeleteModal(false)} className="bg-gray-500 text-white px-4 py-2 rounded mr-2">
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    const token = localStorage.getItem("token");
                    const response = await fetch(`https://varda-inventory-management-system.onrender.com/api/auth/users/${userToDelete._id}`, {
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
                className="bg-red-500 text-white px-4 py-2 rounded"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

        {showModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-lg z-50">
            <div className="bg-white p-6 rounded shadow-md w-96">
              <h2 className="text-xl font-bold mb-4">{isEditing ? "Edit User" : "Add New User"}</h2>
              <input
                type="text"
                name="username"
                placeholder="Username"
                value={userFormData.username}
                onChange={handleInputChange}
                className="border p-2 w-full mb-2"
              />
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={userFormData.password}
                onChange={handleInputChange}
                className="border p-2 w-full mb-2"
              />
              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm Password"
                value={userFormData.confirmPassword}
                onChange={handleInputChange}
                className="border p-2 w-full mb-2"
              />
              
              <select name="role" value={userFormData.role} onChange={handleInputChange} className="border p-2 w-full mb-2">
                <option value="">Select Role</option>
                <option value="Admin">Admin</option>
                <option value="Staff">Staff</option>
              </select>
              {passwordError && <p className="text-red-500 text-sm">{passwordError}</p>}
              {formError && <p className="text-red-500 text-sm">{formError}</p>}
              <div className="flex justify-end">
                <button onClick={() => setShowModal(false)} className="bg-gray-500 text-white px-4 py-2 rounded mr-2">
                  Cancel
                </button>
                <button onClick={handleSaveUser} className="bg-blue-500 text-white px-4 py-2 rounded">
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement;
