import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import { FaFilePdf, FaFileExcel } from "react-icons/fa";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { PDFDownloadLink } from "@react-pdf/renderer";
import PDFDocument from "../components/PDFDocument";

// Branch list
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

const ITEMS_PER_PAGE = 10; // Number of items per page

const History = () => {
  const [selectedBranch, setSelectedBranch] = useState("");
  const [historyData, setHistoryData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [openTables, setOpenTables] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    if (selectedBranch) {
      fetchHistory(selectedBranch);
      setOpenTables({}); // Reset expanded tables when switching branches
    }
  }, [selectedBranch]);

  useEffect(() => {
    filterDataByDateRange();
  }, [historyData, startDate, endDate]);

  const fetchHistory = async (branch) => {
    const branchKey = branch.toUpperCase();
    console.log("🔍 Fetching history for:", branchKey);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/history/${branchKey}`);
      if (!response.ok) throw new Error("Failed to fetch history");
      const data = await response.json();
      setHistoryData(data);
      setFilteredData(data);
    } catch (err) {
      console.error("❌ Failed to fetch history:", err);
    }
  };

  const filterDataByDateRange = () => {
    if (!startDate || !endDate) {
      setFilteredData(historyData);
      return;
    }
  
    const filtered = historyData.filter((record) => {
      const recordDate = new Date(record.date);
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      // Set time to midnight for proper date comparison
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999); // Include entire end date
      recordDate.setHours(0, 0, 0, 0);
      
      return recordDate >= start && recordDate <= end;
    });
  
    setFilteredData(filtered);
    setCurrentPage(1); // Reset to first page after filtering
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
    const headers = ["Name", "Category", "Price", "Beg Inventory", "Delivered", "Waste", "Yesterday Use", "Today's Use", "Withdrawal", "Current"];

    // Add header row
    const headerRow = worksheet.addRow(headers);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4F81BD" } };
      cell.alignment = { horizontal: "center" };
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
        item.yesterdayUse || 0,
        item.todayUse || 0,
        item.withdrawal || 0,
        item.current || 0,
      ]);

      row.eachCell((cell) => {
        cell.alignment = { horizontal: "center" };
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

  // Pagination logic
  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
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

          {/* Branch Selection and Date Range Filter */}
          <div className="flex flex-wrap justify-between items-center mb-5">
            {/* Branch Selection */}
            <div className="w-full md:w-1/3 mb-4 md:mb-0">
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

            {/* Date Range Filter */}
            <div className="w-full md:w-1/3">
              <label className="block text-lg font-semibold mb-2">Filter by Date Range: </label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-1/2 p-2 border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-1/2 p-2 border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {selectedBranch && currentItems.length > 0 ? (
            currentItems.map((record, idx) => (
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
                      <button onClick={() => exportToExcel(record)} className="flex items-center gap-2 px-3 py-2 bg-green-500 text-white font-bold rounded">
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
                            <th className="px-4 py-3 border">Yesterday's Use</th>
                            <th className="px-4 py-3 border">Today's Use</th>
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
                              <td className="px-4 py-3 border">{item.yesterdayUse}</td>
                              <td className="px-4 py-3 border">{item.todayUse}</td>
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

          {/* Pagination */}
          {filteredData.length > ITEMS_PER_PAGE && (
            <div className="flex justify-between items-center mt-6">
              <div className="text-gray-700">
                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredData.length)} of {filteredData.length} logs
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-gray-200 rounded-lg disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="px-4 py-2 bg-gray-200 rounded-lg">{currentPage}</span>
                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-gray-200 rounded-lg disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default History;