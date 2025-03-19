import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import { FaFilePdf, FaFileExcel } from "react-icons/fa";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver"
import { PDFDownloadLink } from "@react-pdf/renderer";
import PDFDocument from "../components/PDFDocument";

const branches = [
  "CHKN CHOP",
  "VARDA BURGER",
  "THE GOOD JUICE",
  "THE GOOD NOODLES",
  "NRB VARDA",
  "PUP VARDA",
  "ST JUDE VARDA",
  "INTRAMUROS VARDA",
];

const History = () => {
  const [selectedBranch, setSelectedBranch] = useState("");
  const [historyData, setHistoryData] = useState([]);
  const [openTables, setOpenTables] = useState({});

  useEffect(() => {
    if (selectedBranch) {
      fetchHistory(selectedBranch);
      setOpenTables({}); // Reset expanded tables when switching branches
    }
  }, [selectedBranch]);  

  const fetchHistory = async (branch) => {
    const branchKey = branch.toUpperCase();
    console.log("🔍 Fetching history for:", branchKey);
    try {
      const response = await fetch(`https://varda-inventory-management-system.onrender.com/api/history/${branchKey}`);
      if (!response.ok) throw new Error("Failed to fetch history");
      const data = await response.json();
      setHistoryData(data);
    } catch (err) {
      console.error("❌ Failed to fetch history:", err);
    }
  };

  const toggleTable = (idx) => {
    setOpenTables((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const exportToExcel = async (record) => {
    if (!record || !Array.isArray(record.products)) {
      console.error("❌ Error: Invalid data structure. 'products' is missing or not an array.", record);
      return;
    }
  
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Inventory History");
  
    // Define headers
    const headers = [
      "Name", "Category", "Beg Inventory", "Delivered", 
      "Waste", "Use", "Withdrawal", "Current"
    ];
  
    // Add header row
    const headerRow = worksheet.addRow(headers);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4F81BD" } };
      cell.alignment = { horizontal: "center" }; // Center header text
      cell.border = { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } };
    });
  
    // Add product rows
    record.products.forEach((item) => {
      const row = worksheet.addRow([
        item.name || "N/A",
        item.category || "N/A",
        item.price || 0,
        item.begInventory || 0,
        item.delivered || 0,
        item.waste || 0,
        item.use || 0,
        item.withdrawal || 0,
        item.current || 0
      ]);
  
      // Center align all cells in the row
      row.eachCell((cell) => {
        cell.alignment = { horizontal: "center" }; // Ensures all cells are centered
        cell.border = { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } };
      });
    });
  
    // Auto-adjust column widths
    worksheet.columns.forEach((col, i) => {
      col.width = headers[i].length + 5;
    });
  
    // Freeze header row
    worksheet.views = [{ state: "frozen", ySplit: 1 }];
  
    // Format date for filename
    const formattedDate = record.date ? new Date(record.date).toISOString().split("T")[0] : "UnknownDate";
    const fileName = `Inventory-${selectedBranch.replace(/\s+/g, "_")}-${formattedDate}.xlsx`;
  
    try {
      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), fileName);
    } catch (error) {
      console.error("❌ Error exporting to Excel:", error);
    }
  };

  return (
    <div className="flex bg-gray-100 min-h-screen">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 p-6 md:ml-64 w-full">
        <div className="bg-white p-6 shadow-md rounded-lg">
          <h2 className="text-2xl font-bold mb-5">📜 Inventory History</h2>

          {/* Branch Selection */}
          <div className="mb-5 border p-4 rounded-lg bg-gray-50">
            <label className="block text-lg font-semibold mb-2">Select Branch: </label>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full p-2 border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Select Branch --</option>
              {branches.map((branch, idx) => (
                <option key={idx} value={branch}>
                  {branch}
                </option>
              ))}
            </select>
          </div>

          {selectedBranch && historyData.length > 0 ? (
            historyData.map((record, idx) => (
              <div key={idx} className="mb-5 border border-gray-300 rounded-lg bg-white shadow-md">
                <div
                  onClick={() => toggleTable(idx)}
                  className="p-4 cursor-pointer bg-gray-200 flex justify-between items-center font-bold rounded-t-lg"
                >
                  <span>📅 Reset Date: {new Date(record.date).toLocaleString()}</span>
                  <span>{openTables[idx] ? "▲ Collapse" : "▼ Expand"}</span>
                </div>

                {openTables[idx] && (
                  <div className="p-4">
                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-4 mb-4">
                      <PDFDownloadLink
                        document={<PDFDocument data={record.products} branch={selectedBranch} />}
                        fileName={`Inventory-${selectedBranch.replace(/\s+/g, "_")}-${new Date(record.date).toISOString().split("T")[0]}.pdf`}
                        className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white font-bold rounded-lg shadow"
                      >
                        <FaFilePdf /> PDF
                      </PDFDownloadLink>
                      <button 
                      onClick={() => exportToExcel(record)} 
                      className="flex items-center gap-2 px-3 py-2 bg-green-500 text-white font-bold rounded">
                      <FaFileExcel /> Excel
                    </button>
                    </div>

                    {/* Table - Responsive */}
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[600px] border border-gray-300 bg-white shadow-md rounded-lg">
                        <thead className="bg-gray-300 text-gray-700 text-md">
                          <tr>
                            <th className="px-4 py-3 border">Name</th>
                            <th className="px-4 py-3 border">Category</th>
                            <th className="px-4 py-3 border">Price</th>
                            <th className="px-4 py-3 border">Beg Inventory</th>
                            <th className="px-4 py-3 border">Delivered</th>
                            <th className="px-4 py-3 border">Waste</th>
                            <th className="px-4 py-3 border">Use</th>
                            <th className="px-4 py-3 border">Withdrawal</th>
                            <th className="px-4 py-3 border">Current</th>
                          </tr>
                        </thead>
                        <tbody>
                          {record.products.map((item, i) => (
                            <tr key={i} className="hover:bg-gray-100">
                              <td className="px-4 py-3 border">{item.name}</td>
                              <td className="px-4 py-3 border">{item.category}</td>
                              <td className="px-4 py-3 border">{item.price}</td>
                              <td className="px-4 py-3 border">{item.begInventory}</td>
                              <td className="px-4 py-3 border">{item.delivered}</td>
                              <td className="px-4 py-3 border">{item.waste}</td>
                              <td className="px-4 py-3 border">{item.use}</td>
                              <td className="px-4 py-3 border">{item.withdrawal}</td>
                              <td className="px-4 py-3 border">{item.current}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            selectedBranch && <p className="text-gray-500 text-center">No history data available for this branch yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default History;
