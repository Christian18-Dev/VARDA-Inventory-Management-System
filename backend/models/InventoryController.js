// inventoryController.js
exports.resetInventory = async (req, res) => {
    const { branch } = req.params;
    const collectionName = `${branch.toLowerCase().replace(/\s+/g, "")}_inventory`;
  
    try {
      const db = req.app.locals.db;
      const collection = db.collection(collectionName);
      const products = await collection.find({}).toArray();
  
      const updates = products.map(product => {
        const newBegInventory = product.current || 0;
  
        const updatedProduct = {
          begInventory: newBegInventory,
          delivered: 0,
          waste: 0,
          use: 0,
          withdrawal: 0,
          current: newBegInventory // <- just this is enough
        };
  
        return {
          updateOne: {
            filter: { _id: product._id },
            update: { $set: updatedProduct },
          },
        };
      });
  
      if (updates.length > 0) {
        await collection.bulkWrite(updates);
      }
  
      res.status(200).json({ message: "Inventory reset successfully." });
    } catch (err) {
      console.error("Reset error:", err);
      res.status(500).json({ error: "Failed to reset inventory" });
    }
  };
  