import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";

const ActivityLog = () => {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/activitylogs`);
        const data = await response.json();
        setLogs(data);
      } catch (error) {
        console.error("Failed to fetch activity logs:", error);
      }
    };

    fetchLogs();
  }, []);

  return (
    <div className="flex min-h-screen">
      {/* Sidebar - Fixed Width */}
      <div className="w-64">
        <Sidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 bg-gray-50">
        <h2 className="text-2xl font-bold mb-4">Activity Log</h2>
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
              {logs.map((log) => (
                <tr key={log._id} className="text-sm text-gray-700">
                  <td className="px-4 py-2 border">{log.username}</td>
                  <td className="px-4 py-2 border">{log.role}</td>
                  <td className="px-4 py-2 border">{log.action}</td>
                  <td className="px-4 py-2 border">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {logs.length === 0 && (
            <div className="p-4 text-center text-gray-500">No activity logs yet.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivityLog;
