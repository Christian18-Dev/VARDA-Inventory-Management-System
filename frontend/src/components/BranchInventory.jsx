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
  const categories = ["Others", "Condiments", "Cups", "Juices", "Cold Items", "Veggies", "Bread", "Meat", "Frozen Meat"];
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
  const [endInventory, setEndInventory] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [showStockWarning, setShowStockWarning] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage] = useState(20);

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
        // Ensure we're getting all products without any limit
        setProducts(data.products || []);
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };
    getProducts();
  }, [branchName]);

  // Calculate use based on beginning inventory and end inventory
  const calculateUse = (begInv, deliveredItems, wasteItems, withdrawalItems, endInv) => {
    // Parse values to ensure they're numbers
    const beginning = parseFloat(begInv) || 0;
    const delivered = parseFloat(deliveredItems) || 0;
    const waste = parseFloat(wasteItems) || 0;
    const withdrawal = parseFloat(withdrawalItems) || 0;
    const ending = parseFloat(endInv) || 0;

    // Calculate total available stock
    const availableStock = beginning + delivered - waste - withdrawal;
    
    // Calculate use (what was consumed)
    const useAmount = availableStock - ending;
    
    // Ensure use is not negative
    return Math.max(useAmount, 0);
  };

  // Update use value when end inventory changes
  const handleEndInventoryChange = (value) => {
    setEndInventory(value);
    
    if (editProduct) {
      const use = calculateUse(
        editProduct.begInventory,
        editProduct.delivered,
        editProduct.waste,
        editProduct.withdrawal,
        value
      );
      
      setEditProduct({
        ...editProduct,
        use: use
      });
    }
  };

  // Filter products based on search query
  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Reset to first page when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Pagination Logic
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

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
    setShowSubmitConfirm(true);
  };
  
  const confirmResetInventory = async () => {
    setShowSubmitConfirm(false);
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
            use: p.use
          }))
        }),
      });
  
      if (!saveHistoryResponse.ok) {
        throw new Error("Failed to save history before reset");
      }
  
      // 2. Prepare updates
      const updates = products.map(product => ({
        _id: product._id,
        begInventory: product.current,
        delivered: 0,
        waste: 0,
        use: 0,
        withdrawal: 0,
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
              current: p.current
            };
          })
        );
        
        // 5. Log the submission
        await logActivity(`Submitted Inventory for ${branchName}`, {
          productsCount: products.length,
          timestamp: new Date().toISOString(),
        });
  
        console.log("Inventory submitted successfully!");
      } else {
        console.log("No changes made during inventory submission.");
      }
    } catch (error) {
      console.error("Error during inventory submission:", error);
      console.log("Something went wrong during inventory submission.");
    }
  };

  const handleAddProduct = async () => {
    const parsedProduct = {
      name: newProduct.name,
      category: newProduct.category,
      price: parseFloat(newProduct.price) || 0,
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
    const parsedProduct = {
      ...editProduct,
      price: parseFloat(editProduct.price) || 0,
      begInventory: role === "admin" ? parseFloat(editProduct.begInventory) || 0 : editProduct.begInventory,
      delivered: parseFloat(editProduct.delivered) || 0,
      waste: role === "admin" ? parseFloat(editProduct.waste) || 0 : editProduct.waste,
      use: parseFloat(editProduct.use) || 0, // Use is now calculated from end inventory
      withdrawal: role === "admin" ? parseFloat(editProduct.withdrawal) || 0 : editProduct.withdrawal,
    };
  
    // Calculate available stock
    const availableStock = parsedProduct.begInventory + parsedProduct.delivered - parsedProduct.waste - parsedProduct.withdrawal;
    
    // Check if trying to use more than available stock
    if (parsedProduct.use > availableStock) {
      setShowStockWarning(true);
      return;
    }
  
    const { current } = calculateInventory(parsedProduct);
    const updatedProduct = { ...parsedProduct, current };
  
    try {
      const updated = await updateProduct(branchName, updatedProduct._id, updatedProduct);
      if (updated) {
        setProducts((prev) => prev.map((p) => (p._id === updated._id ? updated : p)));
        setShowEditModal(false);
        setEditProduct(null);
        setEndInventory("");
  
        await logActivity(`Updated the product ${updatedProduct.name} from the inventory at ${branchName}`);
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
  
    console.log("Final productToDelete object:", productToDelete);
  
    const productName = productToDelete?.name || "Unknown Product";
    const productId = productToDelete?._id;
  
    if (!productId) {
      console.error("Product ID is missing. Cannot delete.");
      return;
    }
  
    try {
      await deleteProduct(branchName, productId);
  
      setProducts((prev) =>
        prev.filter((product) => product._id !== productId)
      );
  
      setShowDeleteConfirm(false);
      setProductToDelete(null);
  
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
  
  // When opening edit modal, initialize the end inventory based on current values
  const openEditModal = (product) => {
    setEditProduct(product);
    // Calculate what the end inventory should be based on current values
    const endInv = product.begInventory + product.delivered - product.waste - product.use - product.withdrawal;
    setEndInventory(Math.max(endInv, 0));
    setShowEditModal(true);
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

        {/* Submit Confirm Modal */}
        {showSubmitConfirm && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-sm text-center">
              <h2 className="text-lg font-semibold mb-4">Confirm Submission</h2>
              <div className="mb-4 text-left">
                <p className="text-gray-600 mb-2">Are you sure you want to submit the inventory?</p>
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-yellow-700">
                        <strong>Reminder:</strong> Make sure to only submit the Inventory if its Final for the Day.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => setShowSubmitConfirm(false)}
                  className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmResetInventory}
                  className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        )}
          
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
                {currentProducts.length > 0 ? (
                  currentProducts.map((product) => (
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
                            openEditModal(product);
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
                      {searchQuery ? "No matching products found" : "No products found"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {filteredProducts.length > productsPerPage && (
          <div className="flex flex-col md:flex-row justify-between items-center mt-6 gap-4">
            <div className="text-gray-700 text-sm md:text-base">
              Showing {indexOfFirstProduct + 1} to {Math.min(indexOfLastProduct, filteredProducts.length)} of {filteredProducts.length} products
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
                  <select
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                    className="w-full border border-gray-300 px-3 py-2 rounded-md"
                  >
                    <option value="">Select a category</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
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
  
       {/* Responsive Edit Modal */}
{showEditModal && editProduct && (
  <div className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-50 p-2 sm:p-4">
    <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-[95vw] sm:max-w-lg mx-auto overflow-y-auto" 
         style={{ maxHeight: "90vh" }}>
      <div className="flex justify-between items-center mb-3 sm:mb-4">
        <h2 className="text-lg sm:text-xl font-semibold">Edit Product</h2>
        <button 
          onClick={() => setShowEditModal(false)}
          className="sm:hidden text-gray-500 hover:text-gray-700 text-lg"
        >
          ✕
        </button>
      </div>
      
      <div className="grid grid-cols-1 gap-2 sm:gap-4">
        {[
          "name",
          "category",
          ...(role === "admin"
            ? ["price", "begInventory", "delivered", "waste", "endInventory", "withdrawal"]
            : ["price", "delivered", "waste", "endInventory", "withdrawal"]),
          "use"
        ].map((field) => (
          <div key={field}>
            <label className="block text-xs sm:text-sm font-medium text-gray-600 capitalize">
              {field}
            </label>
            {field === "category" ? (
              <select
                value={editProduct[field] === 0 ? "" : editProduct[field]}
                onChange={(e) => setEditProduct({ ...editProduct, [field]: e.target.value })}
                className="w-full border border-gray-200 sm:border-gray-300 px-2 py-1.5 sm:px-3 sm:py-2 rounded text-xs sm:text-base"
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            ) : field === "endInventory" ? (
              <input
                type="number"
                value={endInventory === 0 ? "" : endInventory}
                onChange={(e) => {
                  const value = e.target.value;
                  if (/^\d*\.?\d*$/.test(value)) {
                    handleEndInventoryChange(value);
                  }
                }}
                className="w-full border border-gray-200 sm:border-gray-300 px-2 py-1.5 sm:px-3 sm:py-2 rounded text-xs sm:text-base"
                disabled={role === "staff" && !["name", "category", "delivered", "waste", "endInventory", "withdrawal"].includes(field)}
              />
            ) : (
              <input
                type={["price", "begInventory", "delivered", "waste", "use", "withdrawal"].includes(field)
                  ? "number"
                  : "text"}
                value={editProduct[field] === 0 ? "" : editProduct[field]}
                onChange={(e) => {
                  const value = e.target.value;
                  if (["name", "category"].includes(field)) {
                    setEditProduct({ ...editProduct, [field]: value });
                  } else if (/^\d*\.?\d*$/.test(value)) {
                    setEditProduct({ ...editProduct, [field]: value });
                  }
                }}
                className="w-full border border-gray-200 sm:border-gray-300 px-2 py-1.5 sm:px-3 sm:py-2 rounded text-xs sm:text-base"
                disabled={
                  field === "use" || (role === "staff" &&
                  !["name", "category", "delivered", "waste", "withdrawal"].includes(field))
                }
              />
            )}
          </div>
        ))}
      </div>
      
      <div className="flex justify-end space-x-2 mt-4">
        <button
          onClick={() => setShowEditModal(false)}
          className="bg-gray-200 sm:bg-gray-300 px-3 py-1.5 sm:px-4 sm:py-2 rounded text-xs sm:text-base hover:bg-gray-300 sm:hover:bg-gray-400"
        >
          Cancel
        </button>
        <button
          onClick={handleUpdateProduct}
          className="bg-yellow-500 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded text-xs sm:text-base hover:bg-yellow-600"
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

        {/* Stock Warning Modal */}
        {showStockWarning && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-sm text-center">
              <h2 className="text-lg font-semibold mb-4 text-red-600">Insufficient Stock</h2>
              <p className="mb-4 text-gray-600">
                You do not have enough stock to use. Please check your Inventory.
              </p>
              <div className="flex justify-center">
                <button
                  onClick={() => setShowStockWarning(false)}
                  className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
                >
                  OK
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