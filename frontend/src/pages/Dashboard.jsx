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

const Dashboard = () => {
  const [highInventoryItems, setHighInventoryItems] = useState([]);
  const [lowInventoryItems, setLowInventoryItems] = useState([]);
  const [categoryData, setCategoryData] = useState({ labels: [], values: [] });
  const [recentActivity, setRecentActivity] = useState([]);
  const [inventoryGraphData, setInventoryGraphData] = useState({ labels: [], values: [] });

  useEffect(() => {
    const fetchRecentActivity = async () => {
      try {
        const response = await fetch(`${VITE_API_BASE_URL}/api/activitylogs`);
        if (!response.ok) throw new Error("Failed to fetch activity logs");
        const data = await response.json();
  
        // ✅ Only keep the most recent 5 activities
        setRecentActivity(data.slice(0, 7));
      } catch (error) {
        console.error("Error fetching recent activity:", error);
      }
    };
  
    // 🕒 Fetch logs on load and every 5 seconds
    fetchRecentActivity();
    const interval = setInterval(fetchRecentActivity, 5000); // Poll every 5 seconds
  
    // 🧹 Cleanup interval on unmount
    return () => clearInterval(interval);
  }, []);
  
  

  useEffect(() => {
    const fetchHighInventoryItems = async () => {
      try {
        const response = await fetch(`${VITE_API_BASE_URL}/api/dashboard/inventory-data`);
        const data = await response.json();
        setHighInventoryItems(data);
      } catch (error) {
        console.error("Error fetching highest inventory items:", error);
      }
    };

    const fetchLowInventoryItems = async () => {
      try {
        const response = await fetch(`${VITE_API_BASE_URL}/api/dashboard/lowest-inventory-items`);
        const data = await response.json();
        setLowInventoryItems(data);
      } catch (error) {
        console.error("Error fetching lowest inventory items:", error);
      }
    };

    const fetchCategoryData = async () => {
      try {
        const response = await fetch(`${VITE_API_BASE_URL}/api/dashboard/category-distribution`);
        const data = await response.json();
        const labels = data.map((category) => category.name);
        const values = data.map((category) => category.count);
        setCategoryData({ labels, values });
      } catch (error) {
        console.error("Error fetching category data:", error);
      }
    };

    const fetchInventoryGraphData = async () => {
      try {
        const response = await fetch(`${VITE_API_BASE_URL}/api/dashboard/inventory-data`);
        const data = await response.json();
    
        console.log("Fetched Inventory Data:", data); // Debug API response
    
        // Ensure the API response includes "branch" field
        if (!data.every(item => item.branch)) {
          console.error("Missing branch field in API response");
          return;
        }
    
        // Extract unique product names and branches
        const productNames = [...new Set(data.map(item => item.name))];
        const branches = [...new Set(data.map(item => item.branch))];
    
        // Group data by branch
        const datasets = branches.map(branch => ({
          label: branch, // Branch name as the dataset label
          data: productNames.map(
            product => data.find(item => item.name === product && item.branch === branch)?.stock || 0
          ),
          backgroundColor: `#${Math.floor(Math.random() * 16777215).toString(16)}`, // Random color
        }));
    
        console.log("Processed Chart Data:", { labels: productNames, datasets });
    
        setInventoryGraphData({ labels: productNames, datasets });
      } catch (error) {
        console.error("Error fetching inventory graph data:", error);
      }
    };    
    
    fetchHighInventoryItems();
    fetchLowInventoryItems();
    fetchCategoryData();
    fetchInventoryGraphData();
  }, []);

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 p-6 bg-gray-50 min-h-screen md:ml-64 w-full">
  
        {/* Top Section (Recent Activity + Pie Chart) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Recent Activity */}
          <div className="bg-white p-6 rounded-xl shadow-lg col-span-2">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Recent Activity</h2>
            <ul className="space-y-3">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity, index) => (
                  <li
                    key={index}
                    className="border-b border-gray-200 pb-2 flex justify-start items-center text-sm text-gray-700 hover:bg-gray-50 transition-colors p-2 rounded-md gap-4"
                  >
                    <span className="font-medium text-gray-800 w-1/4">{activity.username}</span>
                    <span className="w-1/2 truncate">{activity.action}</span>
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

          {/* Pie Chart */}
          <div className="bg-white p-6 rounded-xl shadow-lg flex items-center justify-center">
          <div className="w-full max-w-[350px] h-[350px]">
            <h2 className="text-lg font-semibold mb-3 text-gray-800 text-center">Categories</h2>
            {categoryData.labels.length > 0 ? (
              <Pie
                data={{
                  labels: categoryData.labels,
                  datasets: [
                    {
                      data: categoryData.values,
                      backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4CAF50", "#9966FF"],
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: true,
                      position: "bottom",
                      labels: {
                        boxWidth: 20,
                        padding: 20, // Added padding for better spacing
                        font: {
                          size: 14,
                          weight: '500',
                        },
                        color: "#555", // Softer gray color for better contrast
                      },
                      align: "center",
                    },
                  },
                }}
              />
            ) : (
              <p className="text-gray-500 text-center">Loading...</p>
            )}
          </div>
        </div>
        </div>
  
        {/* Middle Section (Graph Chart) */}
        <div className="bg-white p-6 mt-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Product Inventory Levels</h2>
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
                    legend: { display: true, position: "top" },
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
  
        {/* Bottom Section (Tables) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          
          {/* Highest Inventory Items */}
          <div className="bg-white p-5 rounded-xl shadow-lg">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Top Highest Inventory Items</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-200 text-gray-700">
                    <th className="p-3 text-left font-medium">Item Name</th>
                    <th className="p-3 text-left font-medium">Inventory</th>
                    <th className="p-3 text-left font-medium">Branch</th>
                  </tr>
                </thead>
                <tbody>
                  {highInventoryItems.length > 0 ? (
                    highInventoryItems.map((item, index) => (
                      <tr key={index} className="border-b border-gray-200">
                        <td className="p-3 text-gray-800">{item.name}</td>
                        <td className="p-3 text-gray-800">{item.stock}</td>
                        <td className="p-3 text-gray-800">{item.branch}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" className="p-3 text-center text-gray-500">
                        No data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
  
          {/* Lowest Inventory Items */}
          <div className="bg-white p-5 rounded-xl shadow-lg">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Top Lowest Inventory Items</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-200 text-gray-700">
                    <th className="p-3 text-left font-medium">Item Name</th>
                    <th className="p-3 text-left font-medium">Inventory</th>
                    <th className="p-3 text-left font-medium">Branch</th>
                  </tr>
                </thead>
                <tbody>
                  {lowInventoryItems.length > 0 ? (
                    lowInventoryItems.map((item, index) => (
                      <tr key={index} className="border-b border-gray-200">
                        <td className="p-3 text-gray-800">{item.name}</td>
                        <td className="p-3 text-gray-800">{item.stock}</td>
                        <td className="p-3 text-gray-800">{item.branch}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" className="p-3 text-center text-gray-500">
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
