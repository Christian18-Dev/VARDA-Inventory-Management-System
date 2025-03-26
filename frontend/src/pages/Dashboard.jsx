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
    const fetchHighInventoryItems = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/dashboard/inventory-data`);
        const data = await response.json();
        setHighInventoryItems(data);
      } catch (error) {
        console.error("Error fetching highest inventory items:", error);
      }
    };

    const fetchLowInventoryItems = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/dashboard/lowest-inventory-items`);
        const data = await response.json();
        setLowInventoryItems(data);
      } catch (error) {
        console.error("Error fetching lowest inventory items:", error);
      }
    };

    const fetchCategoryData = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/dashboard/category-distribution`);
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
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/dashboard/inventory-data`);
        const data = await response.json();
    
        if (!data.every(item => item.branch)) {
          console.error("Missing branch field in API response");
          return;
        }
    
        const productNames = [...new Set(data.map(item => item.name))];
        const branches = [...new Set(data.map(item => item.branch))];
    
        const datasets = branches.map(branch => ({
          label: branch,
          data: productNames.map(
            product => data.find(item => item.name === product && item.branch === branch)?.stock || 0
          ),
          backgroundColor: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
        }));
    
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
            Used Stock Overview
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
  
        {/* Tables Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          
          {/* Slow Moving Items */}
          <div className="bg-white p-5 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow duration-200">
            <h2 className="text-xl font-semibold mb-4 text-emerald-600 border-b border-emerald-100 pb-2">
              Slow Moving Items
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-indigo-50 text-indigo-700">
                    <th className="p-3 text-left font-medium">Item Name</th>
                    <th className="p-3 text-left font-medium">Inventory</th>
                    <th className="p-3 text-left font-medium">Branch</th>
                  </tr>
                </thead>
                <tbody>
                  {highInventoryItems.length > 0 ? (
                    highInventoryItems.map((item, index) => (
                      <tr key={index} className="border-b border-gray-100 hover:bg-indigo-50/50 transition-colors">
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
  
          {/* Fast Moving Items */}
          <div className="bg-white p-5 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow duration-200">
            <h2 className="text-xl font-semibold mb-4 text-amber-500 border-b border-amber-100 pb-2">
              Fast Moving Items
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-amber-50 text-amber-700">
                    <th className="p-3 text-left font-medium">Item Name</th>
                    <th className="p-3 text-left font-medium">Inventory</th>
                    <th className="p-3 text-left font-medium">Branch</th>
                  </tr>
                </thead>
                <tbody>
                  {lowInventoryItems.length > 0 ? (
                    lowInventoryItems.map((item, index) => (
                      <tr key={index} className="border-b border-gray-100 hover:bg-amber-50/50 transition-colors">
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