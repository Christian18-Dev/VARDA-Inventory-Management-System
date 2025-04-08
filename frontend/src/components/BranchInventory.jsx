import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { fetchProducts, addProduct, deleteProduct, updateProduct, resetInventory, API_URL } from "../api";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;


const calculateInventory = ({ begInventory = 0, delivered = 0, waste = 0, use = 0, withdrawal = 0 }) => {
  const current = begInventory + delivered - waste - use - withdrawal; 
  return { current: Math.max(current, 0) };
};

const BranchInventory = ({ branchName }) => {
  const [role, setRole] = useState(null);
  const [products, setProducts] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: "",
    category: "",
    price: "",
    begInventory: "",
    delivered: "",
    waste: "",
    use: "",
    withdrawal: "",
    current: 0,
  });
  const [editProduct, setEditProduct] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const storedRole = localStorage.getItem("role");
    console.log("Stored role from localStorage:", storedRole);
    if (storedRole) {
      setRole(storedRole.toLowerCase().trim());
    }
  }, []);  
  console.log("Current role state:", role);
  

  useEffect(() => {
    const getProducts = async () => {
      try {
        const data = await fetchProducts(branchName);
        setProducts(data.products);
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };
    getProducts();
  }, [branchName]);

  const logActivity = async (action, details = {}) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/activitylogs/log`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: localStorage.getItem("username") || "Unknown User",
          role: role,
          action: action,
          branch: branchName,
          details: details,
          timestamp: new Date().toISOString(),
        }),
      });
  
      if (!response.ok) {
        console.error("Failed to log activity:", response.statusText);
        throw new Error("Failed to log activity");
      }
  
      const result = await response.json();
      console.log("Activity log response:", result);
    } catch (err) {
      console.error("Activity logging error:", err);
    }
  };

  const handleResetInventory = async () => {
    const confirmed = window.confirm("Are you sure you want to submit the inventory?");
    if (!confirmed) return;
  
    try {
      // 1. Save current inventory to history
      const baseUrl = import.meta.env.VITE_API_BASE_URL.replace(/\/$/, "");
      const saveHistoryResponse = await fetch(`${baseUrl}/api/history/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          branch: branchName, 
          products: products.map(p => ({
            ...p,
            // Include all current values in history
            use: p.use // This preserves the current usage before reset
          }))
        }),
      });
  
      if (!saveHistoryResponse.ok) {
        throw new Error("Failed to save history before reset");
      }
  
      // 2. Prepare updates - reset all operational fields and carry forward current as begInventory
      const updates = products.map(product => ({
        _id: product._id,
        begInventory: product.current, // Carry forward current as new beginning inventory
        delivered: 0,                 // Reset delivered
        waste: 0,                     // Reset waste
        use: 0,                       // Reset use to 0
        withdrawal: 0,                // Reset withdrawal
      }));
  
      // 3. Update the inventory with reset values
      const resetResponse = await resetInventory(branchName, updates);
      
      if (resetResponse.modifiedCount > 0) {
        // 4. Update local state
        setProducts(prevProducts => 
          prevProducts.map(p => {
            const update = updates.find(u => u._id === p._id);
            return {
              ...p,
              ...update,
              current: p.current // Maintain the same current value (it will recalculate on next render)
            };
          })
        );
        
        // 5. Log the submission
        await logActivity(`Submitted Inventory for ${branchName}`, {
          productsCount: products.length,
          timestamp: new Date().toISOString(),
        });
  
        alert("Inventory submitted successfully!");
      } else {
        alert("Failed to submit inventory.");
      }
    } catch (error) {
      console.error("❌ Error during inventory submission:", error);
      alert("Something went wrong during inventory submission.");
    }
  };

  const handleAddProduct = async () => {
    const parsedProduct = {
      name: newProduct.name,
      category: newProduct.category,
      price: parseFloat(newProduct.price) || 0, // Include price field
      begInventory: role === "admin" ? parseFloat(newProduct.begInventory) || 0 : 0,
      delivered: parseFloat(newProduct.delivered) || 0,
      waste: role === "admin" ? parseFloat(newProduct.waste) || 0 : 0,
      use: role === "admin" ? parseFloat(newProduct.use) || 0 : 0,
      withdrawal: role === "admin" ? parseFloat(newProduct.withdrawal) || 0 : 0,
    };
    const { current } = calculateInventory(parsedProduct);
    const productToAdd = { ...parsedProduct, current };
  
    try {
      const added = await addProduct(branchName, productToAdd);
      if (added) {
        setProducts((prev) => [added, ...prev]);
        setNewProduct({
          name: "",
          category: "",
          price: "",
          begInventory: "",
          delivered: "",
          waste: "",
          use: "",
          withdrawal: "",
          current: 0,
        });
        setShowAddModal(false);
  
          // ✅ Log to Activity Log
          const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/activitylogs/log`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              username: localStorage.getItem("username") || "Unknown User",
              role: role,
              action: `Added ${productToAdd.name} from the Inventory at ${branchName}`,
            }),
          });
  
        if (!response.ok) {
          console.error("Failed to log activity:", response.statusText);
          throw new Error("Failed to log activity");
        }
  
        const result = await response.json();
        console.log("Activity log response:", result);
      }
    } catch (err) {
      console.error("Add error:", err);
    }
  };
  
  const handleUpdateProduct = async () => {
    // First preserve the existing use value
    const currentUseValue = editProduct.use || 0;
  
    const parsedProduct = {
      ...editProduct, // Spread all existing product data first
      price: parseFloat(editProduct.price) || 0,
      begInventory: role === "admin" ? parseFloat(editProduct.begInventory) || 0 : editProduct.begInventory,
      delivered: parseFloat(editProduct.delivered) || 0,
      waste: role === "admin" ? parseFloat(editProduct.waste) || 0 : editProduct.waste,
      // Explicitly preserve the use value - only change if admin is modifying it
      use: role === "admin" ? parseFloat(editProduct.use) || currentUseValue : currentUseValue,
      withdrawal: role === "admin" ? parseFloat(editProduct.withdrawal) || 0 : editProduct.withdrawal,
    };
  
    // Calculate current inventory
    const { current } = calculateInventory(parsedProduct);
    const updatedProduct = { ...parsedProduct, current };
  
    try {
      const updated = await updateProduct(branchName, updatedProduct._id, updatedProduct);
      if (updated) {
        setProducts((prev) => prev.map((p) => (p._id === updated._id ? updated : p)));
        setShowEditModal(false);
        setEditProduct(null);
  
        // Log the update action
        await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/activitylogs/log`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: localStorage.getItem("username") || "Unknown User",
            role: role,
            action: `Updated the product ${updatedProduct.name} from the inventory at ${branchName}`,
            branch: branchName,
          }),
        });
      }
    } catch (err) {
      console.error("Update error:", err);
    }
  };
  
  const handleDeleteProduct = async () => {
    if (!productToDelete || typeof productToDelete !== "object") {
      console.error("Product to delete is not defined or invalid");
      return;
    }
  
    // Log to check the final product details
    console.log("Final productToDelete object:", productToDelete);
  
    // Get the product name and ID
    const productName = productToDelete?.name || "Unknown Product";
    const productId = productToDelete?._id;
  
    if (!productId) {
      console.error("Product ID is missing. Cannot delete.");
      return;
    }
  
    try {
      // ✅ Delete the product using the corrected deleteProduct function
      await deleteProduct(branchName, productId);
  
      // ✅ Update state to remove the deleted product
      setProducts((prev) =>
        prev.filter((product) => product._id !== productId)
      );
  
      setShowDeleteConfirm(false);
      setProductToDelete(null);
  
      // ✅ Log the delete action
      await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/activitylogs/log`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: localStorage.getItem("username") || "Unknown User",
          role: role,
          action: `Deleted the product ${productName} from the Inventory at ${branchName}`,
          branch: branchName,
        }),
      });
  
      console.log(`Successfully logged deletion of ${productName}`);
    } catch (err) {
      console.error("Delete error:", err);
    }
  };
  

  if (!role) return null;

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-red-50">
      <Sidebar />
      <div className="flex-1 pt-16 p-4 md:ml-64">
        <Navbar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
        <div className="flex flex-col md:flex-row justify-between items-center mt-6 mb-4">
          <h1 className="text-2xl font-bold text-yellow-500 mb-4 md:mb-0">{branchName}</h1>
          <div className="space-x-2">
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-yellow-500 text-white px-4 py-2 rounded-md hover:bg-yellow-600 transition"
              >
                Add Item
              </button>    
              <button
                onClick={handleResetInventory}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition"
              >
                Submit
              </button>
          </div>
        </div>
  
        {/* Responsive Table Container */}
        <div className="bg-white shadow-lg rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-center border-collapse">
              <thead>
                <tr className="bg-red-600 border-b">
                  {[
                    "Name",
                    "Category",
                    "Price",
                    "Beg Inv",
                    "Delivered",
                    "Waste",
                    "Use",
                    "Withdrawal",
                    "Current",
                    "Actions",
                  ].map((head, idx) => (
                    <th
                      key={idx}
                      className="px-5 py-4 text-yellow-500 font-semibold uppercase tracking-wider text-xs md:text-sm"
                    >
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {products.length > 0 ? (
                  products
                    .filter(
                      (p) =>
                        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        p.category.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((product) => (
                      <tr
                        key={product._id}
                        className="border-b hover:bg-gray-100 transition duration-150"
                      >
                        {[
                          product.name,
                          product.category,
                          `₱ ${product.price}`,
                          product.begInventory,
                          product.delivered,
                          product.waste,
                          product.use,
                          product.withdrawal,
                          product.current,
                        ].map((item, i) => (
                          <td
                            key={i}
                            className={`px-5 py-4 whitespace-nowrap text-black ${
                              i === 2
                                ? "text-green-600 font-medium"
                                : i === 5
                                ? "text-red-500"
                                : i === 6
                                ? "text-yellow-500"
                                : ""
                            }`}
                          >
                            {item}
                          </td>
                        ))}
                        <td className="px-5 py-4 whitespace-nowrap space-x-2">

                            <button
                              className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg shadow-md transition duration-150"
                              onClick={() => {
                                setEditProduct(product);
                                setShowEditModal(true);
                              }}
                            >
                              Edit
                            </button>
                          
                          {role === "admin" && (
                            <button
                              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg shadow-md transition duration-150"
                              onClick={() => {
                                setProductToDelete(product);
                                setShowDeleteConfirm(true);
                              }}
                            >
                              Delete
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                ) : (
                  <tr>
                    <td colSpan="10" className="text-center py-6 text-gray-500">
                      No products found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
  
        {/* Add Product Modal */}
        {showAddModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-lg">
              <h2 className="text-xl font-semibold mb-4">Add Product</h2>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium">Name</label>
                  <input
                    type="text"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    className="w-full border border-gray-300 px-3 py-2 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Category</label>
                  <input
                    type="text"
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                    className="w-full border border-gray-300 px-3 py-2 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Price</label>
                  <input
                    type="number"
                    value={newProduct.price}
                    onChange={(e) =>
                      setNewProduct({
                        ...newProduct,
                        price: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full border border-gray-300 px-3 py-2 rounded-md"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-4">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddProduct}
                  className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        )}
  
        {/* Edit Modal */}
        {showEditModal && editProduct && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-lg">
              <h2 className="text-xl font-semibold mb-4">Edit Product</h2>
              <div className="grid grid-cols-1 gap-4">
                {[
                  "name",
                  "category",
                  ...(role === "admin"
                    ? ["price", "begInventory", "delivered", "waste", "use", "withdrawal"]
                    : ["price", "delivered", "waste", "use", "withdrawal"]),
                ].map((field) => (
                  <div key={field}>
                    <label className="block text-sm font-medium capitalize">{field}</label>
                    <input
                      type={
                        [
                          "price",
                          "begInventory",
                          "delivered",
                          "waste",
                          "use",
                          "withdrawal",
                        ].includes(field)
                          ? "number"
                          : "text"
                      }
                      value={editProduct[field] === 0 ? "" : editProduct[field]}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (["name", "category"].includes(field)) {
                          setEditProduct({ ...editProduct, [field]: value });
                        } else {
                          if (/^\d*\.?\d*$/.test(value)) {
                            setEditProduct({ ...editProduct, [field]: value });
                          }
                        }
                      }}
                      className="w-full border border-gray-300 px-3 py-2 rounded-md"
                      disabled={
                        role === "staff" &&
                        !["name", "category", "delivered", "waste", "use", "withdrawal"].includes(
                          field
                        )
                      }
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-end space-x-2 mt-4">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateProduct}
                  className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
                >
                  Update
                </button>
              </div>
            </div>
          </div>
        )}
  
        {/* Delete Confirm Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-sm text-center">
              <h2 className="text-lg font-semibold mb-4">Confirm Delete</h2>
              <p className="mb-4 text-gray-600">Are you sure you want to delete this product?</p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="bg-yellow-300 px-4 py-2 rounded hover:bg-yellow-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteProduct}
                  className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
  
  };

export default BranchInventory;