import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";

const ActivityLog = () => {
  const [logs, setLogs] = useState([]);
  const [currentPage, setCurrentPage] = useState(1); // Track current page
  const [logsPerPage] = useState(15); // Number of logs per page

  // ✅ Fetch logs on page load
  useEffect(() => {
    fetchLogs();
  }, []);

  // ✅ Fetch logs from backend
  const fetchLogs = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/activitylogs`);
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

  // ✅ Pagination Logic
  const indexOfLastLog = currentPage * logsPerPage;
  const indexOfFirstLog = indexOfLastLog - logsPerPage;
  const currentLogs = logs.slice(indexOfFirstLog, indexOfLastLog);

  // ✅ Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // ✅ Calculate total pages
  const totalPages = Math.ceil(logs.length / logsPerPage);

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar - Fixed Width */}
      <div className="w-64">
        <Sidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 md:p-8">
        {/* Header and Clear Button */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4 md:mb-0">
            Activity Log
          </h2>

          {/* ✅ Clear Logs Button */}
          <button
            onClick={clearLogs}
            className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-4 py-2 rounded-lg shadow-md transition-all duration-300 transform hover:scale-105"
          >
            Clear Logs
          </button>
        </div>

        {/* Table Container */}
        <div className="overflow-x-auto bg-white rounded-xl shadow-lg">
          <table className="min-w-full">
            <thead className="bg-gradient-to-r from-blue-600 to-blue-700">
              <tr>
                <th className="px-4 py-3 md:px-6 md:py-4 text-left text-xs md:text-sm font-semibold text-white uppercase tracking-wider">
                  Username
                </th>
                <th className="px-4 py-3 md:px-6 md:py-4 text-left text-xs md:text-sm font-semibold text-white uppercase tracking-wider">
                  Role
                </th>
                <th className="px-4 py-3 md:px-6 md:py-4 text-left text-xs md:text-sm font-semibold text-white uppercase tracking-wider">
                  Action
                </th>
                <th className="px-4 py-3 md:px-6 md:py-4 text-left text-xs md:text-sm font-semibold text-white uppercase tracking-wider">
                  Timestamp
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {currentLogs.length > 0 ? (
                currentLogs.map((log) => (
                  <tr
                    key={log._id}
                    className="hover:bg-gray-50 transition-colors duration-200"
                  >
                    <td className="px-4 py-3 md:px-6 md:py-4 text-xs md:text-sm text-gray-700">
                      {log.username}
                    </td>
                    <td className="px-4 py-3 md:px-6 md:py-4 text-xs md:text-sm text-gray-700">
                      {log.role}
                    </td>
                    <td className="px-4 py-3 md:px-6 md:py-4 text-xs md:text-sm text-gray-700 whitespace-normal max-w-[200px]">
                      <div className="truncate hover:whitespace-normal" title={log.action}>
                        {log.action}
                      </div>
                    </td>
                    <td className="px-4 py-3 md:px-6 md:py-4 text-xs md:text-sm text-gray-700">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="text-center p-6 text-gray-500">
                    No activity logs yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ✅ Pagination Controls */}
        <div className="flex flex-col md:flex-row justify-between items-center mt-6 space-y-4 md:space-y-0">
          <div className="text-xs md:text-sm text-gray-700">
            Showing {indexOfFirstLog + 1} to {Math.min(indexOfLastLog, logs.length)} of {logs.length} logs
          </div>
          <div className="flex flex-wrap gap-2">
            {/* Previous Button */}
            <button
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1.5 md:px-4 md:py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed text-xs md:text-sm"
            >
              Previous
            </button>

            {/* Page Numbers */}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => paginate(page)}
                className={`px-3 py-1.5 md:px-4 md:py-2 ${
                  currentPage === page
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                } rounded-md text-xs md:text-sm`}
              >
                {page}
              </button>
            ))}

            {/* Next Button */}
            <button
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 md:px-4 md:py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed text-xs md:text-sm"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityLog;