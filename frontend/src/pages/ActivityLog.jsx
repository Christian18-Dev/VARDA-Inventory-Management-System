import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

const ActivityLog = () => {
  const [logs, setLogs] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [logsPerPage] = useState(15);
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Filter logs based on search query
  const filteredLogs = logs.filter(log => 
    log.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
    new Date(log.timestamp).toLocaleString().toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Reset to first page when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Fetch logs on page load
  useEffect(() => {
    fetchLogs();
  }, []);

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

  const clearLogs = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/activitylogs/clear`, {
        method: "DELETE",
      });

      if (response.ok) {
        setLogs([]);
        setSearchQuery("");
        console.log("Logs cleared successfully!");
      } else {
        console.error("Failed to clear logs.");
      }
    } catch (error) {
      console.error("Error clearing logs:", error);
    }
  };

  // Pagination Logic
  const indexOfLastLog = currentPage * logsPerPage;
  const indexOfFirstLog = indexOfLastLog - logsPerPage;
  const currentLogs = filteredLogs.slice(indexOfFirstLog, indexOfLastLog);
  const totalPages = Math.ceil(filteredLogs.length / logsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="flex min-h-screen bg-gray-50 relative">
      {/* Sidebar - Fixed position that overlaps content */}
      <div className={`w-64`}>
        <Sidebar />
      </div>

      {/* Main Content - Full width */}
      <div className="flex-1 flex flex-col w-full">
        {/* Navbar - Pass the sidebar toggle function */}
        <div className="h-16">
          <Navbar 
            searchQuery={searchQuery} 
            setSearchQuery={setSearchQuery}
            onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          />
        </div>

        {/* Content - Centered with max-width */}
        <div className="p-4 md:p-8 mt-4 w-full max-w-[1800px] mx-auto">
          {/* Header and Clear Button */}
          <div className="flex flex-col md:flex-row justify-between items-center mb-6">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4 md:mb-0">
              Activity Log
            </h2>
            <button
              onClick={clearLogs}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-4 py-2 rounded-lg shadow-md transition-all duration-300 transform hover:scale-105"
            >
              Clear Logs
            </button>
          </div>

          {/* Table Container */}
          <div className="w-full overflow-x-auto bg-white rounded-xl shadow-lg">
            <table className="min-w-full">
              <thead className="bg-gradient-to-r from-blue-600 to-blue-700">
                <tr>
                  <th className="px-3 py-2 md:px-6 md:py-4 text-left text-xs md:text-sm font-semibold text-white uppercase tracking-wider">
                    Username
                  </th>
                  <th className="px-3 py-2 md:px-6 md:py-4 text-left text-xs md:text-sm font-semibold text-white uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-3 py-2 md:px-6 md:py-4 text-left text-xs md:text-sm font-semibold text-white uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-3 py-2 md:px-6 md:py-4 text-left text-xs md:text-sm font-semibold text-white uppercase tracking-wider">
                    Timestamp
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {currentLogs.length > 0 ? (
                  currentLogs.map((log) => {
                    let hoverTimer;
                    
                    const handleMouseEnter = (e) => {
                      const element = e.currentTarget.querySelector('.action-text');
                      hoverTimer = setTimeout(() => {
                        element.classList.remove('truncate');
                        element.classList.add('whitespace-normal');
                      }, 500); 
                    };
                    
                    const handleMouseLeave = (e) => {
                      clearTimeout(hoverTimer);
                      const element = e.currentTarget.querySelector('.action-text');
                      element.classList.add('truncate');
                      element.classList.remove('whitespace-normal');
                    };

                    return (
                      <tr 
                        key={log._id} 
                        className="hover:bg-gray-50 transition-colors duration-200"
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                      >
                        <td className="px-3 py-2 md:px-6 md:py-4 text-xs md:text-sm text-gray-700">
                          {log.username}
                        </td>
                        <td className="px-3 py-2 md:px-6 md:py-4 text-xs md:text-sm text-gray-700">
                          {log.role}
                        </td>
                        <td className="px-3 py-2 md:px-6 md:py-4 text-xs md:text-sm text-gray-700 max-w-[150px] md:max-w-[200px]">
                          <span className="action-text truncate block">{log.action}</span>
                        </td>
                        <td className="px-3 py-2 md:px-6 md:py-4 text-xs md:text-sm text-gray-700">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="4" className="text-center p-6 text-gray-500">
                      {searchQuery ? "No matching logs found" : "No activity logs yet"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filteredLogs.length > logsPerPage && (
            <div className="flex flex-col md:flex-row justify-between items-center mt-6 gap-4">
              <div className="text-gray-700 text-sm md:text-base">
                Showing {indexOfFirstLog + 1} to {Math.min(indexOfLastLog, filteredLogs.length)} of {filteredLogs.length} logs
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 md:px-4 md:py-2 bg-gray-200 rounded-lg disabled:opacity-50 text-sm md:text-base"
                >
                  Previous
                </button>
                <span className="px-3 py-1 md:px-4 md:py-2 bg-gray-200 rounded-lg text-sm md:text-base">
                  {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 md:px-4 md:py-2 bg-gray-200 rounded-lg disabled:opacity-50 text-sm md:text-base"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivityLog;