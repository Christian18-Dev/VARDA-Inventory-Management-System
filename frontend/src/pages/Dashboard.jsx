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
  }
];

const allBranches = regions.flatMap(region => region.branches);

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

  useEffect(() => {
    if (selectedRegion) {
      const region = regions.find(r => r.name === selectedRegion);
      if (region) {
        setAvailableBranches(region.branches);
        setSelectedBranch(""); // Reset branch when region changes
      }
    } else {
      setAvailableBranches(allBranches);
      setSelectedBranch("");
    }
  }, [selectedRegion]);

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
        if (selectedBranch) {
          params.append('branch', selectedBranch);
        } else if (selectedRegion) {
          params.append('region', selectedRegion);
        }

        // Fetch high inventory items
        const highResponse = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/api/dashboard/highest-inventory-items?${params}`
        );
        const highData = await highResponse.json();
        setHighInventoryItems(highData);

        // Fetch low inventory items
        const lowResponse = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/api/dashboard/lowest-inventory-items?${params}`
        );
        const lowData = await lowResponse.json();
        setLowInventoryItems(lowData);

        // Fetch category data
        const categoryResponse = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/api/dashboard/category-distribution?${params}`
        );
        const categoryData = await categoryResponse.json();
        const labels = categoryData.map((category) => category.name);
        const values = categoryData.map((category) => category.count);
        setCategoryData({ labels, values });

        // Fetch inventory graph data
        const graphResponse = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/api/dashboard/inventory-data?${params}&limit=50`
        );
        const graphData = await graphResponse.json();
    
        if (!graphData.every(item => item.branch)) {
          console.error("Missing branch field in API response");
          return;
        }
    
        // Filter data to only include selected region's branches if a region is selected
        const filteredGraphData = selectedRegion && !selectedBranch
          ? graphData.filter(item => 
              regions.find(r => r.name === selectedRegion)?.branches.includes(item.branch))
          : graphData;
    
        // Group by product and show top products across branches
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
          datasets: datasets.slice(0, 10) // Limit to 10 branches
        });
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [selectedBranch, selectedRegion]);

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 p-6 bg-gray-100 min-h-screen md:ml-64 w-full">
        {/* Region and Branch Selection */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Region Selection */}
          <div>
            <label className="block text-lg font-semibold mb-2">Select Region</label>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="w-full p-2 border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Regions</option>
              {regions.map((region, idx) => (
                <option key={idx} value={region.name}>
                  {region.name}
                </option>
              ))}
            </select>
          </div>

          {/* Branch Selection */}
          <div>
            <label className="block text-lg font-semibold mb-2">Select Branch</label>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full p-2 border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Branches</option>
              {availableBranches.map((branch, idx) => (
                <option key={idx} value={branch}>
                  {branch}
                </option>
              ))}
            </select>
          </div>

          {/* Summary Card */}
          <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200 flex items-center justify-center">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-700">
                {selectedBranch 
                  ? selectedBranch 
                  : selectedRegion 
                    ? `${selectedRegion} (All Branches)` 
                    : "All Locations"}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {selectedBranch 
                  ? "Single Branch View" 
                  : selectedRegion 
                    ? "Regional View" 
                    : "Global View"}
              </p>
            </div>
          </div>
        </div>

        {isLoading && (
          <div className="fixed inset-0 flex items-center justify-center z-50 w-full h-full">
            <div className="w-12 h-12 border-4 border-blue-500 border-solid border-t-transparent rounded-full animate-spin"></div>
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
                recentActivity.map((activity, index) => (
                  <li
                    key={index}
                    className="border-b border-gray-100 pb-2 flex justify-start items-center text-sm text-gray-700 hover:bg-indigo-50/50 transition-colors p-2 rounded-md gap-4"
                  >
                    <span className="font-medium text-gray-800 w-1/4">{activity.username}</span>
                    <span className="w-1/2 truncate hover:whitespace-normal">{activity.action}</span>
                    <span className="text-gray-500 w-1/4 text-right">
                      {new Date(activity.timestamp).toLocaleString()}
                    </span>
                  </li>
                ))
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
            {selectedBranch ? `${selectedBranch} Inventory` : "Inventory Overview"}
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
              {selectedBranch ? `${selectedBranch} Slow Moving Items` : "Slow Moving Items"}
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-indigo-50 text-indigo-700">
                    <th className="p-3 text-left font-medium">Item Name</th>
                    <th className="p-3 text-left font-medium">Inventory</th>
                    {!selectedBranch && <th className="p-3 text-left font-medium">Branch</th>}
                  </tr>
                </thead>
                <tbody>
                  {highInventoryItems.length > 0 ? (
                    highInventoryItems.map((item, index) => (
                      <tr key={index} className="border-b border-gray-100 hover:bg-indigo-50/50 transition-colors">
                        <td className="p-3 text-gray-800">{item.name}</td>
                        <td className="p-3 text-gray-800">{item.stock}</td>
                        {!selectedBranch && <td className="p-3 text-gray-800">{item.branch}</td>}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={selectedBranch ? 2 : 3} className="p-3 text-center text-gray-500">
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
              {selectedBranch ? `${selectedBranch} Fast Moving Items` : "Fast Moving Items"}
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-amber-50 text-amber-700">
                    <th className="p-3 text-left font-medium">Item Name</th>
                    <th className="p-3 text-left font-medium">Inventory</th>
                    {!selectedBranch && <th className="p-3 text-left font-medium">Branch</th>}
                  </tr>
                </thead>
                <tbody>
                  {lowInventoryItems.length > 0 ? (
                    lowInventoryItems.map((item, index) => (
                      <tr key={index} className="border-b border-gray-100 hover:bg-amber-50/50 transition-colors">
                        <td className="p-3 text-gray-800">{item.name}</td>
                        <td className="p-3 text-gray-800">{item.stock}</td>
                        {!selectedBranch && <td className="p-3 text-gray-800">{item.branch}</td>}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={selectedBranch ? 2 : 3} className="p-3 text-center text-gray-500">
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