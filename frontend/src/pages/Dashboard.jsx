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
  
  const region = parts[1];
  const branch = `${parts[1]} ${parts[2].replace(/([A-Z])/g, " $1").trim()}`.toUpperCase();
  
  return { region, branch };
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

  useEffect(() => {
    const fetchRecentActivity = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/activitylogs`);
        if (!response.ok) throw new Error("Failed to fetch activity logs");
        const data = await response.json();
        setRecentActivity(data.slice(0, 7));
      } catch (error) {
        console.error("Error fetching recent activity:", error);
      }
    };
  
    fetchRecentActivity();
    const interval = setInterval(fetchRecentActivity, 5000);
    return () => clearInterval(interval);
  }, []);
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
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

        const highResponse = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/api/dashboard/highest-inventory-items?${params}`
        );
        const highData = await highResponse.json();
        setHighInventoryItems(highData);

        const lowResponse = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/api/dashboard/lowest-inventory-items?${params}`
        );
        const lowData = await lowResponse.json();
        setLowInventoryItems(lowData);

        const categoryResponse = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/api/dashboard/category-distribution?${params}`
        );
        const categoryData = await categoryResponse.json();
        const labels = categoryData.map((category) => category.name);
        const values = categoryData.map((category) => category.count);
        setCategoryData({ labels, values });

        const graphResponse = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/api/dashboard/inventory-data?${params}&limit=50`
        );
        const graphData = await graphResponse.json();
    
        if (!graphData.every(item => item.branch)) {
          console.error("Missing branch field in API response");
          return;
        }
    
        const filteredGraphData = isStaff && staffLocation?.branch
          ? graphData.filter(item => item.branch === staffLocation.branch)
          : selectedRegion && !selectedBranch
            ? graphData.filter(item => 
                regions.find(r => r.name === selectedRegion)?.branches.includes(item.branch))
            : graphData;
    
        const productNames = [...new Set(filteredGraphData.map(item => item.name))].slice(0, 10);
        const branches = [...new Set(filteredGraphData.map(item => item.branch))];
    
        const datasets = branches.map(branch => ({
          label: branch,
          data: productNames.map(
            product => filteredGraphData.find(item => item.name === product && item.branch === branch)?.stock || 0
          ),
          backgroundColor: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
        }));
    
        setInventoryGraphData({ 
          labels: productNames, 
          datasets: datasets.slice(0, 10)
        });
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [selectedBranch, selectedRegion, userRole]);

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 p-6 bg-gray-100 min-h-screen md:ml-64 w-full mt-10 md:mt-0">
        {/* Enhanced Dropdown Selectors Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">

         {/* Region Selector */}
          <div className="w-full">
          <label className="block text-sm font-bold text-indigo-800 mb-2 ml-1">Select Region</label>
            <motion.div 
              className="flex items-center bg-white hover:bg-indigo-50 border-2 border-indigo-200 hover:border-indigo-400 rounded-lg overflow-hidden relative transition-all duration-200 h-12"
              whileHover={{ scale: 1.005 }}
              whileTap={{ scale: 0.995 }}
            >
              <div className="pl-3.5 pr-3 text-indigo-600 flex-shrink-0 h-full flex items-center border-r border-indigo-100">
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
              
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-indigo-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </motion.div>
          </div>

          {/* Branch Selector */}
          <div className="w-full">
            <label className="block text-sm font-bold text-indigo-800 mb-2 ml-1">Select Branch</label>
            <motion.div 
              className="flex items-center bg-white hover:bg-indigo-50 border-2 border-indigo-200 hover:border-indigo-400 rounded-lg overflow-hidden relative transition-all duration-200 h-12"
              whileHover={{ scale: 1.005 }}
              whileTap={{ scale: 0.995 }}
            >
              <div className="pl-3.5 pr-3 text-indigo-600 flex-shrink-0 h-full flex items-center border-r border-indigo-100">
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
              
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-indigo-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </motion.div>
          </div>

          {/* Summary Card */}
          <div className="bg-indigo-600 p-4 rounded-lg shadow-md flex items-center justify-center hover:shadow-lg transition-shadow">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-white">
                {isStaff && staffLocation?.branch
                  ? staffLocation.branch
                  : selectedBranch 
                    ? selectedBranch 
                    : selectedRegion 
                      ? `${selectedRegion} (All Branches)` 
                      : "All Locations"}
              </h3>
              <p className="text-sm text-indigo-100 mt-1">
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
            <div className="w-12 h-12 border-4 border-indigo-500 border-solid border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
  
        {/* Top Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Recent Activity Card */}
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 lg:col-span-2 hover:shadow-lg transition-shadow duration-200">
            <h2 className="text-xl font-semibold mb-4 text-indigo-700 border-b border-indigo-100 pb-2">
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
                      className="border-b border-gray-100 pb-2 flex justify-start items-center text-sm text-gray-700 hover:bg-indigo-50/50 transition-colors p-2 rounded-md gap-4"
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
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow duration-200">
            <h2 className="text-lg font-semibold mb-3 text-indigo-700">
              Categories
            </h2>
            <div className="flex-grow flex items-center justify-center relative">
              {categoryData.labels.length > 0 ? (
                <div className="w-full h-[250px] md:h-[300px] relative">
                  {/* 3D Shadow Effect */}
                  <div className="absolute inset-0 transform translate-y-2 opacity-20 blur-sm">
                    <Pie
                      data={{
                        labels: categoryData.labels,
                        datasets: [{
                          data: categoryData.values,
                          backgroundColor: ["#4f46e5", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"].map(c => `${c}80`),
                          borderWidth: 0
                        }],
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        cutout: '60%'
                      }}
                    />
                  </div>
                  
                  {/* Main 3D Pie Chart */}
                  <div className="absolute inset-0">
                    <Pie
                      data={{
                        labels: categoryData.labels,
                        datasets: [{
                          data: categoryData.values,
                          backgroundColor: ["#4f46e5", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"],
                          borderWidth: 2,
                          borderColor: '#fff',
                          weight: 0.5
                        }],
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { 
                          legend: { display: false },
                          tooltip: {
                            callbacks: {
                              label: (context) => `${context.label}: ${context.raw}`
                            }
                          }
                        },
                        rotation: -15,
                        borderRadius: 6,
                        spacing: 2,
                        radius: '90%'
                      }}
                    />
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-center">Loading...</p>
              )}
            </div>
          </div>
        </div>
  
        {/* Bar Graph Card */}
        <div className="bg-white p-6 mt-6 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow duration-200">
          <h2 className="text-xl font-semibold mb-4 text-indigo-700 border-b border-indigo-100 pb-2">
            {isStaff && staffLocation?.branch 
              ? `${staffLocation.branch} Inventory` 
              : selectedBranch 
                ? `${selectedBranch} Inventory` 
                : "Inventory Overview"}
          </h2>
          <div className="w-full h-[300px]">
            {inventoryGraphData.labels.length > 0 ? (
              <Bar
                data={{
                  labels: inventoryGraphData.labels,
                  datasets: inventoryGraphData.datasets,
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { 
                      display: true, 
                      position: "top",
                      labels: {
                        boxWidth: 12,
                        padding: 20
                      }
                    },
                  },
                  scales: {
                    y: { beginAtZero: true },
                  },
                }}
              />
            ) : (
              <p className="text-gray-500 text-center">Loading...</p>
            )}
          </div>
        </div>
  
        {/* Tables Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          
          {/* Slow Moving Items */}
          <div className="bg-white p-5 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow duration-200">
            <h2 className="text-xl font-semibold mb-4 text-emerald-600 border-b border-emerald-100 pb-2">
              {isStaff && staffLocation?.branch
                ? `${staffLocation.branch} Slow Moving Items`
                : selectedBranch
                  ? `${selectedBranch} Slow Moving Items`
                  : "Slow Moving Items"}
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-indigo-50 text-indigo-700">
                    <th className="p-3 text-left font-medium">Item Name</th>
                    <th className="p-3 text-left font-medium">Inventory</th>
                    {!selectedBranch && !isStaff && <th className="p-3 text-left font-medium">Branch</th>}
                  </tr>
                </thead>
                <tbody>
                  {highInventoryItems.length > 0 ? (
                    highInventoryItems.map((item, index) => (
                      <tr key={index} className="border-b border-gray-100 hover:bg-indigo-50/50 transition-colors">
                        <td className="p-3 text-gray-800">{item.name}</td>
                        <td className="p-3 text-gray-800">{item.stock}</td>
                        {!selectedBranch && !isStaff && <td className="p-3 text-gray-800">{item.branch}</td>}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={selectedBranch || isStaff ? 2 : 3} className="p-3 text-center text-gray-500">
                        No data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
  
          {/* Fast Moving Items */}
          <div className="bg-white p-5 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow duration-200">
            <h2 className="text-xl font-semibold mb-4 text-amber-500 border-b border-amber-100 pb-2">
              {isStaff && staffLocation?.branch
                ? `${staffLocation.branch} Fast Moving Items`
                : selectedBranch
                  ? `${selectedBranch} Fast Moving Items`
                  : "Fast Moving Items"}
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-amber-50 text-amber-700">
                    <th className="p-3 text-left font-medium">Item Name</th>
                    <th className="p-3 text-left font-medium">Inventory</th>
                    {!selectedBranch && !isStaff && <th className="p-3 text-left font-medium">Branch</th>}
                  </tr>
                </thead>
                <tbody>
                  {lowInventoryItems.length > 0 ? (
                    lowInventoryItems.map((item, index) => (
                      <tr key={index} className="border-b border-gray-100 hover:bg-amber-50/50 transition-colors">
                        <td className="p-3 text-gray-800">{item.name}</td>
                        <td className="p-3 text-gray-800">{item.stock}</td>
                        {!selectedBranch && !isStaff && <td className="p-3 text-gray-800">{item.branch}</td>}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={selectedBranch || isStaff ? 2 : 3} className="p-3 text-center text-gray-500">
                        No data available
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