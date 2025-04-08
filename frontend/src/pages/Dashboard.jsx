import Sidebar from "../components/Sidebar";
import { useEffect, useState } from "react";
import { Pie, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
} from "chart.js";
import { motion } from "framer-motion";

ChartJS.register(ArcElement, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

const regions = [
  {
    name: "LAGUNA",
    branches: [
      "LAGUNA CHKN CHOP",
      "LAGUNA VARDA BURGER", 
      "LAGUNA THE GOOD JUICE",
      "LAGUNA THE GOOD NOODLE BAR",
    ]
  },
  {
    name: "LIPA BATANGAS",
    branches: [
      "LIPA BATANGAS CHKN CHOP",
      "LIPA BATANGAS VARDA BURGER",
      "LIPA BATANGAS SILOG",
      "LIPA BATANGAS NRB",
      "LIPA BATANGAS BEVERAGE MAIN C",
      "LIPA BATANGAS BREAD MAIN C",
    ]
  },
  {
    name: "PUP MAIN BRANCH",
    branches: [
      "PUP MAIN BRANCH CHKN CHOP",
      "PUP MAIN BRANCH VARDA BURGER",
    ]
  },
  {
    name: "MAPUA INTRAMUROS",
    branches: [
      "MAPUA INTRAMUROS VARDA BURGER",
      "MAPUA INTRAMUROS THE GOOD JUICE",
    ]
  },
  {
    name: "MAPUA MAKATI",
    branches: [
      "MAPUA MAKATI CHKN CHOP",
      "MAPUA MAKATI VARDA BURGER",
    ]
  },
  {
    name: "ST JUDE MANILA",
    branches: [
      "ST JUDE MANILA CHKN CHOP",
      "ST JUDE MANILA VARDA BURGER",
    ]
  },
];

const allBranches = regions.flatMap(region => region.branches);

const getLocationFromRole = (role) => {
  if (!role || !role.startsWith("Staff-")) return null;
  
  const parts = role.split("-");
  if (parts.length < 3) return null;
  
  // Map role region names to display region names
  const regionMap = {
    "Laguna": "LAGUNA",
    "Lipa": "LIPA BATANGAS",
    "PUPMain": "PUP MAIN BRANCH",
    "MAPUAIntramuros": "MAPUA INTRAMUROS",
    "MAPUAMakati": "MAPUA MAKATI",
    "STJudeManila": "ST JUDE MANILA"
  };
  
  const roleRegion = parts[1];
  const displayRegion = regionMap[roleRegion] || roleRegion.toUpperCase();
  
  // Map role branch types to display branch types
  const branchTypeMap = {
    "ChknChop": "CHKN CHOP",
    "VardaBurger": "VARDA BURGER",
    "TheGoodJuice": "THE GOOD JUICE",
    "TheGoodNoodleBar": "THE GOOD NOODLE BAR",
    "Silog": "SILOG",
    "NRB": "NRB",
    "Beverage": "BEVERAGE MAIN C",
    "Bread": "BREAD MAIN C"
  };
  
  const roleBranchType = parts.slice(2).join(""); // Join remaining parts
  const displayBranchType = branchTypeMap[roleBranchType] || 
                          roleBranchType.replace(/([A-Z])/g, " $1").trim().toUpperCase();
  
  const branch = `${displayRegion} ${displayBranchType}`;
  
  // Verify the branch exists in allBranches
  const matchedBranch = allBranches.find(b => b === branch);
  
  return matchedBranch ? { 
    region: displayRegion, 
    branch: matchedBranch 
  } : null;
};

const Dashboard = () => {
  const [highInventoryItems, setHighInventoryItems] = useState([]);
  const [lowInventoryItems, setLowInventoryItems] = useState([]);
  const [categoryData, setCategoryData] = useState({ labels: [], values: [] });
  const [recentActivity, setRecentActivity] = useState([]);
  const [inventoryGraphData, setInventoryGraphData] = useState({ labels: [], datasets: [] });
  const [selectedRegion, setSelectedRegion] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [availableBranches, setAvailableBranches] = useState(allBranches);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const userRole = localStorage.getItem("role");
  const isAdmin = userRole === "Admin";
  const isStaff = userRole?.startsWith("Staff-");
  const staffLocation = isStaff ? getLocationFromRole(userRole) : null;

  useEffect(() => {
    if (isStaff && staffLocation) {
      setSelectedRegion(staffLocation.region);
      setSelectedBranch(staffLocation.branch);
    }
  }, [userRole]);

  useEffect(() => {
    if (selectedRegion) {
      const region = regions.find(r => r.name === selectedRegion);
      if (region) {
        setAvailableBranches(region.branches);
        if (!isStaff || !staffLocation?.branch) {
          setSelectedBranch("");
        }
      }
    } else {
      setAvailableBranches(allBranches);
      if (!isStaff || !staffLocation?.branch) {
        setSelectedBranch("");
      }
    }
  }, [selectedRegion, userRole]);

  const fetchWithErrorHandling = async (url, options = {}) => {
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Fetch error for ${url}:`, error);
      setError(error.message);
      return null;
    }
  };

  useEffect(() => {
    const fetchRecentActivity = async () => {
      const data = await fetchWithErrorHandling(
        `${import.meta.env.VITE_API_BASE_URL}/api/activitylogs`
      );
      if (data) setRecentActivity(data.slice(0, 7));
    };
  
    fetchRecentActivity();
    const interval = setInterval(fetchRecentActivity, 5000);
    return () => clearInterval(interval);
  }, []);
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const params = new URLSearchParams();
        
        if (isStaff && staffLocation?.branch) {
          params.append('branch', staffLocation.branch);
        } else {
          if (selectedBranch) {
            params.append('branch', selectedBranch);
          } else if (selectedRegion) {
            params.append('region', selectedRegion);
          }
        }

        // Fetch all data in parallel
        const [highData, lowData, categoryData, graphData] = await Promise.all([
          fetchWithErrorHandling(
            `${import.meta.env.VITE_API_BASE_URL}/api/dashboard/highest-inventory-items?${params}`
          ),
          fetchWithErrorHandling(
            `${import.meta.env.VITE_API_BASE_URL}/api/dashboard/lowest-inventory-items?${params}`
          ),
          fetchWithErrorHandling(
            `${import.meta.env.VITE_API_BASE_URL}/api/dashboard/category-distribution?${params}`
          ),
          fetchWithErrorHandling(
            `${import.meta.env.VITE_API_BASE_URL}/api/dashboard/inventory-data?${params}&limit=50`
          )
        ]);

        // Process high inventory items
        if (highData && Array.isArray(highData)) {
          setHighInventoryItems(highData);
        } else {
          setHighInventoryItems([]);
        }

        // Process low inventory items
        if (lowData && Array.isArray(lowData)) {
          setLowInventoryItems(lowData);
        } else {
          setLowInventoryItems([]);
        }

        // Process category data
        if (categoryData && Array.isArray(categoryData)) {
          const labels = categoryData.map((category) => category._id || category.name);
          const values = categoryData.map((category) => category.count || category.value);
          setCategoryData({ labels, values });
        } else {
          setCategoryData({ labels: [], values: [] });
        }

        // Process graph data
        if (graphData && Array.isArray(graphData)) {
          const filteredGraphData = isStaff && staffLocation?.branch
            ? graphData.filter(item => item.branch === staffLocation.branch)
            : selectedRegion && !selectedBranch
              ? graphData.filter(item => 
                  regions.find(r => r.name === selectedRegion)?.branches.includes(item.branch))
              : graphData;
          
          const productNames = [...new Set(filteredGraphData.map(item => item.name))].slice(0, 10);
          const branches = [...new Set(filteredGraphData.map(item => item.branch))].slice(0, 5); // Limit to 5 branches for better visibility
          
          const colorPalette = [
            '#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
            '#ec4899', '#14b8a6', '#f97316', '#64748b', '#a855f7'
          ];
          
          const datasets = branches.map((branch, index) => ({
            label: branch,
            data: productNames.map(
              product => filteredGraphData.find(item => item.name === product && item.branch === branch)?.stock || 0
            ),
            backgroundColor: colorPalette[index % colorPalette.length],
          }));
          
          setInventoryGraphData({ 
            labels: productNames, 
            datasets
          });
        } else {
          setInventoryGraphData({ labels: [], datasets: [] });
        }
      } catch (error) {
        console.error("Error in dashboard data processing:", error);
        setError("Failed to process dashboard data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [selectedBranch, selectedRegion, userRole]);

  // Default chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          boxWidth: 12,
          padding: 20
        }
      }
    }
  };

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 p-6 bg-red-50 min-h-screen md:ml-64 w-full mt-10 md:mt-0">
        {/* Error Message */}
        {error && (
          <div className="bg-red-200 border-l-4 border-red-800 text-red-900 p-4 mb-6 rounded">
            <p>Error: {error}</p>
          </div>
        )}

        {/* Enhanced Dropdown Selectors Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Region Selector */}
          <div className="w-full">
            <label className="block text-sm font-bold text-yellow-600 mb-2 ml-1">Select Region</label>
            <motion.div 
              className="flex items-center bg-white hover:bg-red-100 border-2 border-red-200 hover:border-red-400 rounded-lg overflow-hidden relative transition-all duration-200 h-12"
              whileHover={{ scale: 1.005 }}
              whileTap={{ scale: 0.995 }}
            >
              <div className="pl-3.5 pr-3 text-red-600 flex-shrink-0 h-full flex items-center border-r border-red-100">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
              </div>
              
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="bg-transparent border-none outline-none text-gray-800 pl-3 py-3 pr-10 w-full appearance-none cursor-pointer font-medium text-sm focus:ring-0 focus:border-none"
                disabled={isStaff}
              >
                <option value="">All Regions</option>
                {regions.map((region, idx) => (
                  <option key={idx} value={region.name} className="text-sm">
                    {region.name}
                  </option>
                ))}
              </select>
              
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-red-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </motion.div>
          </div>

          {/* Branch Selector */}
          <div className="w-full">
            <label className="block text-sm font-bold text-yellow-600 mb-2 ml-1">Select Branch</label>
            <motion.div 
              className="flex items-center bg-white hover:bg-red-100 border-2 border-red-200 hover:border-red-400 rounded-lg overflow-hidden relative transition-all duration-200 h-12"
              whileHover={{ scale: 1.005 }}
              whileTap={{ scale: 0.995 }}
            >
              <div className="pl-3.5 pr-3 text-red-600 flex-shrink-0 h-full flex items-center border-r border-red-100">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                </svg>
              </div>
              
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="bg-transparent border-none outline-none text-gray-800 pl-3 py-3 pr-10 w-full appearance-none cursor-pointer font-medium text-sm focus:ring-0 focus:border-none"
                disabled={isStaff}
              >
                <option value="">All Branches</option>
                {availableBranches.map((branch, idx) => (
                  <option key={idx} value={branch} className="text-sm">
                    {branch}
                  </option>
                ))}
              </select>
              
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-red-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </motion.div>
          </div>

          {/* Summary Card */}
          <div className="bg-red-800 p-4 rounded-lg shadow-md flex items-center justify-center hover:shadow-lg transition-shadow border border-yellow-400">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-yellow-300">
                {isStaff && staffLocation?.branch
                  ? staffLocation.branch
                  : selectedBranch 
                    ? selectedBranch 
                    : selectedRegion 
                      ? `${selectedRegion} (All Branches)` 
                      : "All Locations"}
              </h3>
              <p className="text-sm text-yellow-300/80 mt-1">
                {isAdmin ? (
                  selectedBranch 
                    ? "Single Branch View" 
                    : selectedRegion 
                      ? "Regional View" 
                      : "Global View"
                ) : (
                  "Your Branch View"
                )}
              </p>
            </div>
          </div>
        </div>

        {isLoading && (
          <div className="fixed inset-0 flex items-center justify-center z-50 w-full h-full">
            <div className="w-12 h-12 border-4 border-red-800 border-solid border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
  
        {/* Top Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

         {/* Recent Activity Card */}
          <div className="bg-white p-6 rounded-xl shadow-md border border-red-100 lg:col-span-2 hover:shadow-lg transition-shadow duration-200">
            <h2 className="text-xl font-semibold mb-4 text-red-800 border-b border-red-100 pb-2">
              Recent Activity
            </h2>
            <ul className="space-y-3">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity, index) => {
                  let hoverTimer;
                  
                  const handleMouseEnter = (e) => {
                    const element = e.currentTarget.querySelector('.activity-action');
                    hoverTimer = setTimeout(() => {
                      element.classList.remove('truncate');
                    }, 500); 
                  };
                  
                  const handleMouseLeave = (e) => {
                    clearTimeout(hoverTimer);
                    const element = e.currentTarget.querySelector('.activity-action');
                    element.classList.add('truncate');
                  };

                  return (
                    <li
                      key={index}
                      className="border-b border-red-100 pb-2 flex justify-start items-center text-sm text-gray-700 hover:bg-red-50/50 transition-colors p-2 rounded-md gap-4"
                      onMouseEnter={handleMouseEnter}
                      onMouseLeave={handleMouseLeave}
                    >
                      <span className="font-medium text-gray-800 w-1/4">{activity.username}</span>
                      <span className="activity-action w-1/2 truncate">{activity.action}</span>
                      <span className="text-gray-500 w-1/4 text-right">
                        {new Date(activity.timestamp).toLocaleString()}
                      </span>
                    </li>
                  );
                })
              ) : (
                <li className="text-gray-500">No recent activity</li>
              )}
            </ul>
          </div>
          
          {/* Pie Chart Card */}
          <div className="bg-white p-6 rounded-xl shadow-md border border-red-100 hover:shadow-lg transition-shadow duration-200">
            <h2 className="text-lg font-semibold mb-3 text-red-800">
              Categories
            </h2>
            <div className="h-[250px] md:h-[300px] relative">
              {categoryData.labels.length > 0 ? (
                <Pie
                  data={{
                    labels: categoryData.labels,
                    datasets: [{
                      data: categoryData.values,
                      backgroundColor: [
                        "rgba(185, 28, 28, 0.9)",   // red-700
                        "rgba(202, 138, 4, 0.9)",    // amber-600
                        "rgba(234, 179, 8, 0.9)",     // yellow-500
                        "rgba(220, 38, 38, 0.9)",     // red-600
                        "rgba(153, 27, 27, 0.9)"      // red-800
                      ],
                      hoverBackgroundColor: [
                        "rgba(185, 28, 28, 1)",
                        "rgba(202, 138, 4, 1)",
                        "rgba(234, 179, 8, 1)",
                        "rgba(220, 38, 38, 1)",
                        "rgba(153, 27, 27, 1)"
                      ],
                      borderWidth: 5,
                      borderColor: '#fef2f2', // lighter background border
                      hoverOffset: 10, // pops out on hover
                    }],
                  }}
                  options={{
                    ...chartOptions,
                    plugins: {
                      ...chartOptions.plugins,
                      legend: {
                        display: false,
                      },
                      tooltip: {
                        enabled: true,
                      },
                    },
                    cutout: '0%', // full pie (not donut)
                  }}
                />
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-gray-500">{isLoading ? "Loading..." : "No category data available"}</p>
                </div>
              )}
            </div>
          </div>
        </div>
  
        {/* Bar Graph Card */}
        <div className="bg-white p-6 mt-6 rounded-xl shadow-md border border-red-100 hover:shadow-lg transition-shadow duration-200">
          <h2 className="text-xl font-semibold mb-4 text-red-800 border-b border-red-100 pb-2">
            {isStaff && staffLocation?.branch 
              ? `${staffLocation.branch} Inventory` 
              : selectedBranch 
                ? `${selectedBranch} Inventory` 
                : "Inventory Overview"}
          </h2>
          <div className="h-[300px]">
            {inventoryGraphData.labels.length > 0 ? (
              <Bar
                data={inventoryGraphData}
                options={chartOptions}
              />
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-gray-500">{isLoading ? "Loading..." : "No inventory data available"}</p>
              </div>
            )}
          </div>
        </div>
  
        {/* Tables Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {/* Slow Moving Items */}
          <div className="bg-white p-5 rounded-xl shadow-md border border-red-100 hover:shadow-lg transition-shadow duration-200">
            <h2 className="text-xl font-semibold mb-4 text-yellow-600 border-b border-yellow-100 pb-2">
              {isStaff && staffLocation?.branch
                ? `${staffLocation.branch} Slow Moving Items`
                : selectedBranch
                  ? `${selectedBranch} Slow Moving Items`
                  : "Slow Moving Items"}
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-red-50 text-red-800">
                    <th className="p-3 text-left font-medium">Item Name</th>
                    <th className="p-3 text-left font-medium">Inventory</th>
                    {!selectedBranch && !isStaff && <th className="p-3 text-left font-medium">Branch</th>}
                  </tr>
                </thead>
                <tbody>
                  {highInventoryItems.length > 0 ? (
                    highInventoryItems.map((item, index) => (
                      <tr key={index} className="border-b border-red-100 hover:bg-red-50/50 transition-colors">
                        <td className="p-3 text-gray-800">{item.name}</td>
                        <td className="p-3 text-gray-800">{item.stock}</td>
                        {!selectedBranch && !isStaff && <td className="p-3 text-gray-800 truncate max-w-xs">{item.branch}</td>}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={selectedBranch || isStaff ? 2 : 3} className="p-3 text-center text-gray-500">
                        {isLoading ? "Loading..." : "No slow moving items found"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
  
          {/* Fast Moving Items */}
          <div className="bg-white p-5 rounded-xl shadow-md border border-red-100 hover:shadow-lg transition-shadow duration-200">
            <h2 className="text-xl font-semibold mb-4 text-yellow-500 border-b border-yellow-100 pb-2">
              {isStaff && staffLocation?.branch
                ? `${staffLocation.branch} Fast Moving Items`
                : selectedBranch
                  ? `${selectedBranch} Fast Moving Items`
                  : "Fast Moving Items"}
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-yellow-50 text-yellow-700">
                    <th className="p-3 text-left font-medium">Item Name</th>
                    <th className="p-3 text-left font-medium">Inventory</th>
                    {!selectedBranch && !isStaff && <th className="p-3 text-left font-medium">Branch</th>}
                  </tr>
                </thead>
                <tbody>
                  {lowInventoryItems.length > 0 ? (
                    lowInventoryItems.map((item, index) => (
                      <tr key={index} className="border-b border-red-100 hover:bg-yellow-50/50 transition-colors">
                        <td className="p-3 text-gray-800">{item.name}</td>
                        <td className="p-3 text-gray-800">{item.stock}</td>
                        {!selectedBranch && !isStaff && <td className="p-3 text-gray-800 truncate max-w-xs">{item.branch}</td>}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={selectedBranch || isStaff ? 2 : 3} className="p-3 text-center text-gray-500">
                        {isLoading ? "Loading..." : "No fast moving items found"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;