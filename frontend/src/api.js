export const API_URL = import.meta.env.VITE_API_URL;

// Fetch products for a specific branch
export const fetchProducts = async (branch, page = 1, limit = 100) => {
  try {
    const response = await fetch(`${API_URL}?branch=${encodeURIComponent(branch)}&page=${page}&limit=${limit}`);
    const data = await response.json();
    return data; // { products: [], totalPages: X }
  } catch (error) {
    console.error("❌ Error fetching products:", error);
    return { products: [], totalPages: 1 };
  }
};

// Add product for a specific branch
export const addProduct = async (branch, product) => {
  try {
    console.log("📡 Sending to API:", product);

    const cleanProduct = {
      ...product,
      price: parseFloat(product.price) || 0, // ✅ Force price to be a number
      yesterdayUse: parseFloat(product.yesterdayUse) || 0, // Add new fields
      todayUse: parseFloat(product.todayUse) || 0
    };
    
    const response = await fetch(`${API_URL}?branch=${encodeURIComponent(branch)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cleanProduct),
    });
    
    const data = await response.json();
    console.log("🔍 Response from API:", data);

    if (!response.ok) {
      throw new Error(data.message || "Failed to add product");
    }

    return data;
  } catch (error) {
    console.error("❌ Error adding product:", error);
    return null;
  }
};

// Delete product from a specific branch
export const deleteProduct = async (branch, id) => {
  try {
    await fetch(`${API_URL}/${id}?branch=${encodeURIComponent(branch)}`, {
      method: "DELETE",
    });
  } catch (error) {
    console.error("❌ Error deleting product:", error);
  }
};

// Update product for a specific branch
export const updateProduct = async (branch, id, updatedProduct) => {
  try {
    const cleanProduct = {
      ...updatedProduct,
      yesterdayUse: parseFloat(updatedProduct.yesterdayUse) || 0, // Add new fields
      todayUse: parseFloat(updatedProduct.todayUse) || 0
    };

    const response = await fetch(`${API_URL}/${id}?branch=${encodeURIComponent(branch)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cleanProduct),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to update product");
    }

    return data;
  } catch (error) {
    console.error("❌ Error updating product:", error);
    return null;
  }
};

export const resetInventory = async (branch, productsToUpdate) => {
  try {
    const response = await fetch(`${API_URL}/${encodeURIComponent(branch)}/reset`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ products: productsToUpdate }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to reset inventory");
    }

    return await response.json();
  } catch (error) {
    console.error("❌ Error resetting inventory:", error);
    throw error;
  }
};