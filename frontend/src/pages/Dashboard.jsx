import Sidebar from "../components/Sidebar";
import { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import "chart.js/auto";

const Dashboard = () => {
  const [inventoryStats, setInventoryStats] = useState({
    totalProducts: 0,
    lowStock: 10,
    totalSuppliers: 5,
    pendingOrders: 8,
  });

  const [recentPurchases] = useState([
    { id: 1, item: "Laptop", quantity: 5, date: "2025-03-06" },
    { id: 2, item: "Keyboard", quantity: 10, date: "2025-03-05" },
    { id: 3, item: "Mouse", quantity: 15, date: "2025-03-04" },
  ]);

  const stockChartData = {
    labels: ["Laptops", "Keyboards", "Mice", "Monitors", "Printers"],
    datasets: [
      {
        label: "Stock Levels",
        data: [50, 100, 75, 20, 10],
        backgroundColor: ["#6366F1", "#22C55E", "#EAB308", "#EF4444", "#3B82F6"],
      },
    ],
  };

  // Fetch Total Products from API
  useEffect(() => {
    const fetchTotalProducts = async () => {
      try {
        const response = await fetch("http://localhost:5001/api/dashboard/total-products");
        const data = await response.json();
        setInventoryStats((prevStats) => ({
          ...prevStats,
          totalProducts: data.totalProducts || 0,
        }));
      } catch (error) {
        console.error("Error fetching total products:", error);
      }
    };

    fetchTotalProducts();
  }, []);

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 p-6 bg-gray-100 min-h-screen md:ml-64 w-full">
        {/* Responsive Grid for Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
          <DashboardCard title="Total Products" value={inventoryStats.totalProducts} color="bg-blue-500" />
          <DashboardCard title="Low Stock Items" value={inventoryStats.lowStock} color="bg-red-500" />
          <DashboardCard title="Total Suppliers" value={inventoryStats.totalSuppliers} color="bg-green-500" />
          <DashboardCard title="Purchase Orders" value={inventoryStats.pendingOrders} color="bg-yellow-500" />
        </div>

        {/* Recent Purchases Table */}
        <div className="bg-white p-4 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-semibold mb-3">Recent Products</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px] border-collapse">
              <thead>
                <tr className="bg-gray-200 text-gray-700">
                  <th className="p-2 text-left">Item</th>
                  <th className="p-2 text-left">Quantity</th>
                  <th className="p-2 text-left">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentPurchases.map((purchase) => (
                  <tr key={purchase.id} className="border-t">
                    <td className="p-2">{purchase.item}</td>
                    <td className="p-2">{purchase.quantity}</td>
                    <td className="p-2">{purchase.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Stock Chart - Responsive */}
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-3">Stock Levels</h2>
          <div className="w-full h-[300px] md:h-[400px] lg:h-[500px] md:w-3/4 lg:w-2/3 xl:w-1/2 mx-auto">
            <Bar
              data={stockChartData}
              options={{ maintainAspectRatio: false }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// Dashboard Card Component
const DashboardCard = ({ title, value, color }) => (
  <div className={`p-5 rounded-lg shadow-md text-white ${color} text-center`}>
    <h2 className="text-lg font-semibold">{title}</h2>
    <p className="text-3xl font-bold mt-2">{value}</p>
  </div>
);

export default Dashboard;
