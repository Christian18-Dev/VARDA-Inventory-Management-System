import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";

const ActivityLog = () => {
  const [logs, setLogs] = useState([]);

  // ✅ Fetch logs on page load
  useEffect(() => {
    fetchLogs();
  }, []);

  // ✅ Fetch logs from backend
  const fetchLogs = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/activitylogs`);
      if (!response.ok) throw new Error("Failed to fetch logs");
      const data = await response.json();
      setLogs(data);
    } catch (error) {
      console.error("Error fetching logs:", error);
    }
  };

  // ✅ Clear logs from backend and UI
  const clearLogs = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/activitylogs/clear`, {
        method: "DELETE",
      });
  
      if (response.ok) {
        setLogs([]); // Clear logs from UI
        console.log("Logs cleared successfully!");
      } else {
        console.error("Failed to clear logs.");
      }
    } catch (error) {
      console.error("Error clearing logs:", error);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar - Fixed Width */}
      <div className="w-64">
        <Sidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 bg-gray-50">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Activity Log</h2>

          {/* ✅ Clear Logs Button */}
          <button
            onClick={clearLogs}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition"
          >
            Clear Logs
          </button>
        </div>

        <div className="overflow-x-auto bg-white rounded-xl shadow">
          <table className="min-w-full border border-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 border">Username</th>
                <th className="px-4 py-2 border">Role</th>
                <th className="px-4 py-2 border">Action</th>
                <th className="px-4 py-2 border">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {logs.length > 0 ? (
                logs.map((log) => (
                  <tr key={log._id} className="text-sm text-gray-700">
                    <td className="px-4 py-2 border">{log.username}</td>
                    <td className="px-4 py-2 border">{log.role}</td>
                    <td className="px-4 py-2 border">{log.action}</td>
                    <td className="px-4 py-2 border">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="text-center p-4 text-gray-500">
                    No activity logs yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ActivityLog;
