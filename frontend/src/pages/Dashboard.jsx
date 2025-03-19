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
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const API_BACK_URL = import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    const fetchRecentActivity = async () => {
      try {
        const response = await fetch(`${API_BACK_URL}/api/activitylogs`);
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
        const response = await fetch(`${API_BACK_URL}/api/dashboard/inventory-data`);
        const data = await response.json();
        setHighInventoryItems(data);
      } catch (error) {
        console.error("Error fetching highest inventory items:", error);
      }
    };

    const fetchLowInventoryItems = async () => {
      try {
        const response = await fetch(`${API_BACK_URL}/api/dashboard/lowest-inventory-items`);
        const data = await response.json();
        setLowInventoryItems(data);
      } catch (error) {
        console.error("Error fetching lowest inventory items:", error);
      }
    };

    const fetchCategoryData = async () => {
      try {
        const response = await fetch(`${API_BACK_URL}/api/dashboard/category-distribution`);
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
        const response = await fetch(`${API_BACK_URL}/api/dashboard/inventory-data`);
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
      <div className="flex-1 p-6 bg-gray-100 min-h-screen md:ml-64 w-full">

        {/* Top Section (Recent Activity + Pie Chart) */}
        <div className="grid grid-cols-3 gap-8">
          
          {/* Recent Activity */}
          <div className="bg-white p-6 rounded-lg shadow-md col-span-2">
            <h2 className="text-xl font-semibold mb-3">Recent Activity</h2>
            <ul className="space-y-2 text-gray-700">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity, index) => (
                  <li key={index} className="border-b pb-2">
                    <span className="font-semibold">{activity.username}</span>{" "}
                    {activity.action} on{" "}
                    <span className="text-gray-500">
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
          <div className="flex justify-end col-span-1">
            <div className="bg-white p-6 rounded-lg shadow-md flex flex-col items-center justify-center w-[400px] h-[400px]">
              <h2 className="text-lg font-semibold mb-4">Categories</h2>
              <div className="w-full h-[350px]">
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
                    options={{ responsive: true, maintainAspectRatio: false }}
                  />
                ) : (
                  <p className="text-gray-500 text-sm">Loading...</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Middle Section (Graph Chart) */}
        <div className="bg-white p-6 mt-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Product Inventory Levels</h2>
          <div className="w-full h-[300px]">
            {inventoryGraphData.labels.length > 0 ? (
             <Bar
             data={{
               labels: inventoryGraphData.labels, // Product Names
               datasets: inventoryGraphData.datasets, // Per-branch datasets
             }}
             options={{
               responsive: true,
               maintainAspectRatio: false,
               plugins: {
                 legend: {
                   display: true, // Enable clickable branch labels
                   position: "top",
                 },
               },
               scales: {
                 y: { beginAtZero: true },
               },
             }}
           />
             
            ) : (
              <p className="text-gray-500 text-sm">Loading...</p>
            )}
          </div>
        </div>

        {/* Bottom Section (Tables) */}
        <div className="grid grid-cols-2 gap-8 mt-6">
          
          {/* Highest Inventory Items */}
          <div className="bg-white p-4 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-3">Top Highest Inventory Items</h2>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[500px] border-collapse">
                <thead>
                  <tr className="bg-gray-200 text-gray-700">
                    <th className="p-2 text-left">Item Name</th>
                    <th className="p-2 text-left">Inventory</th>
                    <th className="p-2 text-left">Branch</th>
                  </tr>
                </thead>
                <tbody>
                  {highInventoryItems.length > 0 ? (
                    highInventoryItems.map((item, index) => (
                      <tr key={index} className="border-t">
                        <td className="p-2">{item.name}</td>
                        <td className="p-2">{item.stock}</td>
                        <td className="p-2">{item.branch}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" className="p-2 text-center">No data available</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Lowest Inventory Items */}
          <div className="bg-white p-4 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-3">Top Lowest Inventory Items</h2>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[500px] border-collapse">
                <thead>
                  <tr className="bg-gray-200 text-gray-700">
                    <th className="p-2 text-left">Item Name</th>
                    <th className="p-2 text-left">Inventory</th>
                    <th className="p-2 text-left">Branch</th>
                  </tr>
                </thead>
                <tbody>
                  {lowInventoryItems.length > 0 ? (
                    lowInventoryItems.map((item, index) => (
                      <tr key={index} className="border-t">
                        <td className="p-2">{item.name}</td>
                        <td className="p-2">{item.stock}</td>
                        <td className="p-2">{item.branch}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" className="p-2 text-center">No data available</td>
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
