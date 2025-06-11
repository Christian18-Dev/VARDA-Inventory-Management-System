import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import { FaFilePdf, FaFileExcel } from "react-icons/fa";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { PDFDownloadLink } from "@react-pdf/renderer";
import PDFDocument from "../components/PDFDocument";
import { motion } from "framer-motion";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const regions = [
  {
    name: "LAGUNA",
    branches: [
      "LAGUNA CHKN CHOP",
      "LAGUNA VARDA BURGER", 
      "LAGUNA THE GOOD JUICE",
      "LAGUNA THE GOOD NOODLE BAR",
    ]
  },
  {
    name: "LIPA BATANGAS",
    branches: [
      "LIPA BATANGAS CHKN CHOP",
      "LIPA BATANGAS VARDA BURGER",
      "LIPA BATANGAS SILOG",
      "LIPA BATANGAS NRB",
      "LIPA BATANGAS BEVERAGE MAIN C",
      "LIPA BATANGAS BREAD MAIN C",
    ]
  },
  {
    name: "PUP MAIN BRANCH",
    branches: [
      "PUP MAIN BRANCH CHKN CHOP",
      "PUP MAIN BRANCH VARDA BURGER",
    ]
  },
  {
    name: "MAPUA INTRAMUROS",
    branches: [
      "MAPUA INTRAMUROS VARDA BURGER",
      "MAPUA INTRAMUROS THE GOOD JUICE",
    ]
  },
  {
    name: "MAPUA MAKATI",
    branches: [
      "MAPUA MAKATI CHKN CHOP",
      "MAPUA MAKATI VARDA BURGER",
    ]
  },
  {
    name: "ST JUDE MANILA",
    branches: [
      "ST JUDE MANILA CHKN CHOP",
      "ST JUDE MANILA VARDA BURGER",
    ]
  },
  {
    name: "ADMU",
    branches: [
      "ADMU VARDA BURGER"
    ]
  }
];

const allBranches = regions.flatMap(region => region.branches);

const getLocationFromRole = (role) => {
  if (!role || (!role.startsWith("Staff-") && !role.startsWith("Manager-"))) return null;
  
  const parts = role.split("-");
  if (parts.length < 2) return null;
  
  // Map role region names to display region names
  const regionMap = {
    "Laguna": "LAGUNA",
    "Lipa": "LIPA BATANGAS",
    "PUPMain": "PUP MAIN BRANCH",
    "MAPUAIntramuros": "MAPUA INTRAMUROS",
    "MAPUAMakati": "MAPUA MAKATI",
    "STJudeManila": "ST JUDE MANILA",
    "ADMU": "ADMU"
  };
  
  const roleRegion = parts[1];
  const displayRegion = regionMap[roleRegion] || roleRegion.toUpperCase();
  
  // Special case for PUPMain role (no specific branch)
  if (roleRegion === "PUPMain" && parts.length === 2) {
    return { 
      region: displayRegion,
      branch: "" // Empty branch means they can see both
    };
  }
  
  // Map role branch types to display branch types
  const branchTypeMap = {
    "ChknChop": "CHKN CHOP",
    "VardaBurger": "VARDA BURGER",
    "TheGoodJuice": "THE GOOD JUICE",
    "TheGoodNoodleBar": "THE GOOD NOODLE BAR",
    "Silog": "SILOG",
    "NRB": "NRB",
    "Beverage": "BEVERAGE MAIN C",
    "Bread": "BREAD MAIN C"
  };
  
  const roleBranchType = parts.slice(2).join(""); // Join remaining parts
  const displayBranchType = branchTypeMap[roleBranchType] || 
                          roleBranchType.replace(/([A-Z])/g, " $1").trim().toUpperCase();
  
  // For ADMU, we only have VARDA BURGER
  if (roleRegion === "ADMU") {
    return {
      region: "ADMU",
      branch: "ADMU VARDA BURGER"
    };
  }
  
  const branch = `${displayRegion} ${displayBranchType}`;
  
  // Verify the branch exists in allBranches
  const matchedBranch = allBranches.find(b => b === branch);
  
  return matchedBranch ? { 
    region: displayRegion, 
    branch: matchedBranch 
  } : null;
};

const ITEMS_PER_PAGE = 10;

const History = () => {
  // Get user role from localStorage
  const userRole = localStorage.getItem("role");
  const isAdmin = userRole === "Admin";
  const isManager = userRole?.startsWith("Manager-");
  const isStaff = userRole?.startsWith("Staff-");
  const staffOrManagerLocation = (isStaff || isManager) ? getLocationFromRole(userRole) : null;

  const [selectedRegion, setSelectedRegion] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [availableBranches, setAvailableBranches] = useState([]);
  const [historyData, setHistoryData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [openTables, setOpenTables] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Set initial region/branch based on user role
useEffect(() => {
  if ((isStaff || isManager) && staffOrManagerLocation) {
    setSelectedRegion(staffOrManagerLocation.region);
    // Only set branch if it's specific, not for general PUPMain role
    if (staffOrManagerLocation.branch) {
      setSelectedBranch(staffOrManagerLocation.branch);
    }
  }
}, [userRole]);

  useEffect(() => {
    if (selectedRegion) {
      const region = regions.find(r => r.name === selectedRegion);
      if (region) {
        setAvailableBranches(region.branches);
        // Don't reset branch if it's already set by staff/manager role
        if (!(isStaff || isManager) || !staffOrManagerLocation?.branch) {
          setSelectedBranch("");
        }
      }
    } else {
      setAvailableBranches([]);
      // Don't reset branch if it's set by staff/manager role
      if (!(isStaff || isManager) || !staffOrManagerLocation?.branch) {
        setSelectedBranch("");
      }
    }
  }, [selectedRegion, userRole]);

  useEffect(() => {
    if (selectedBranch) {
      fetchHistory(selectedBranch);
      setOpenTables({});
    }
  }, [selectedBranch]);

  useEffect(() => {
    filterDataByDateRange();
  }, [historyData, startDate, endDate]);

  const fetchHistory = async (branch) => {
    const branchKey = branch.toUpperCase();
    console.log("🔍 Fetching history for:", branchKey);

    try {
      const response = await fetch(`${API_BASE_URL}/api/history/${branchKey}`);
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
  
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Set time to beginning and end of day for proper range comparison
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    const filtered = historyData.filter((record) => {
      const recordDate = new Date(record.date);
      return recordDate >= start && recordDate <= end;
    });

    setFilteredData(filtered);
    setCurrentPage(1);
  };

  const toggleTable = (idx) => {
    setOpenTables((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const exportToExcel = async (record) => {
    if (!record || !Array.isArray(record.products)) {
      console.error("❌ Error: Invalid data structure.", record);
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Inventory History");

    // Define headers
    const headers = ["Name", "Category", "Price", "Beg Inventory", "Delivered", "Waste", "Use", "Withdrawal", "Current"];

    // Add header row
    const headerRow = worksheet.addRow(headers);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "DC2626" } };
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
        item.use || 0,
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

  const DateRangePicker = () => (
    <div className="w-full">
      <label className="block text-sm font-bold text-yellow-600 mb-2 ml-1">Filter by Date Range</label>
      <div className="flex flex-col sm:flex-row gap-2">
        <motion.div 
          className="flex items-center bg-white hover:bg-red-50 border-2 border-red-200 hover:border-red-400 rounded-lg overflow-hidden relative transition-all duration-200 h-12 flex-1"
          whileHover={{ scale: 1.005 }}
          whileTap={{ scale: 0.995 }}
        >
          <div className="pl-3.5 pr-3 text-red-600 flex-shrink-0 h-full flex items-center border-r border-red-100">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
            </svg>
          </div>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="bg-transparent border-none outline-none text-gray-800 pl-3 py-3 pr-3 w-full appearance-none cursor-pointer font-medium text-sm focus:ring-0 focus:border-none"
            onClick={(e) => e.target.showPicker()}
          />
        </motion.div>
        
        <motion.div 
          className="flex items-center bg-white hover:bg-red-50 border-2 border-red-200 hover:border-red-400 rounded-lg overflow-hidden relative transition-all duration-200 h-12 flex-1"
          whileHover={{ scale: 1.005 }}
          whileTap={{ scale: 0.995 }}
        >
          <div className="pl-3.5 pr-3 text-red-600 flex-shrink-0 h-full flex items-center border-r border-red-100">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
            </svg>
          </div>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="bg-transparent border-none outline-none text-gray-800 pl-3 py-3 pr-3 w-full appearance-none cursor-pointer font-medium text-sm focus:ring-0 focus:border-none"
            onClick={(e) => e.target.showPicker()}
          />
        </motion.div>
      </div>
    </div>
  );

  return (
    <div className="flex bg-red-50 min-h-screen">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 p-4 md:p-6 md:ml-64 w-full">
        <div className="bg-white p-4 md:p-6 shadow-md rounded-lg border border-red-100">
          <h2 className="text-xl md:text-2xl font-bold mb-5 text-yellow-600">📜 Inventory History</h2>

          {/* Filter Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6">
            {/* Region Selector */}
            <div className="w-full">
              <label className="block text-sm font-bold text-yellow-600 mb-2 ml-1">Select Region</label>
              <motion.div 
                className="flex items-center bg-white hover:bg-red-50 border-2 border-red-200 hover:border-red-400 rounded-lg overflow-hidden relative transition-all duration-200 h-12"
                whileHover={{ scale: 1.005 }}
                whileTap={{ scale: 0.995 }}
              >
                <div className="pl-3.5 pr-3 text-red-600 flex-shrink-0 h-full flex items-center border-r border-red-100">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                </div>
                
                <select
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                  className="bg-transparent border-none outline-none text-gray-800 pl-3 py-3 pr-10 w-full appearance-none cursor-pointer font-medium text-sm focus:ring-0 focus:border-none"
                  disabled={isStaff || isManager}
                >
                  <option value="">All Regions</option>
                  {regions.map((region, idx) => (
                    <option key={idx} value={region.name} className="text-sm">
                      {region.name}
                    </option>
                  ))}
                </select>
                
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-red-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </motion.div>
            </div>

            {/* Branch Selector */}
            <div className="w-full">
              <label className="block text-sm font-bold text-yellow-600 mb-2 ml-1">Select Branch</label>
              <motion.div 
                className="flex items-center bg-white hover:bg-red-50 border-2 border-red-200 hover:border-red-400 rounded-lg overflow-hidden relative transition-all duration-200 h-12"
                whileHover={{ scale: 1.005 }}
                whileTap={{ scale: 0.995 }}
              >
                <div className="pl-3.5 pr-3 text-red-600 flex-shrink-0 h-full flex items-center border-r border-red-100">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                  </svg>
                </div>
                
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="bg-transparent border-none outline-none text-gray-800 pl-3 py-3 pr-10 w-full appearance-none cursor-pointer font-medium text-sm focus:ring-0 focus:border-none"
                  disabled={(isStaff || isManager) && staffOrManagerLocation?.branch}
                >
                  <option value="">All Branches</option>
                  {availableBranches.map((branch, idx) => (
                    <option key={idx} value={branch} className="text-sm">
                      {branch}
                    </option>
                  ))}
                </select>
                
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-red-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </motion.div>
            </div>

            {/* Date Range Picker */}
            <div className="md:col-span-2 lg:col-span-1">
              <DateRangePicker />
            </div>
          </div>

          {/* Summary Card */}
          <div className="mb-6 bg-red-100 p-3 md:p-4 rounded-lg border border-red-200 shadow-sm">
            <h3 className="text-base md:text-lg font-semibold text-red-800">
              {(isStaff || isManager) && staffOrManagerLocation?.branch
                ? `Viewing history for: ${staffOrManagerLocation.branch}`
                : selectedBranch
                  ? `Viewing history for: ${selectedBranch}`
                  : selectedRegion
                    ? `Select a branch in ${selectedRegion} to view history`
                    : "Select a region and branch to view history"}
            </h3>
          </div>

          {/* History Records */}
          {selectedBranch && currentItems.length > 0 ? (
            currentItems.map((record, idx) => (
              <motion.div 
                key={idx} 
                className="mb-5 border border-red-100 rounded-lg bg-white shadow-sm overflow-hidden"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <motion.div
                  onClick={() => toggleTable(idx)}
                  className="p-3 md:p-4 cursor-pointer bg-red-100 flex justify-between items-center font-bold rounded-t-lg"
                  whileHover={{ backgroundColor: "#fee2e2" }}
                >
                  <span className="text-sm md:text-base text-red-800">📅 Reset Date: {new Date(record.date).toLocaleString()}</span>
                  <span className="text-sm md:text-base text-red-600">{openTables[idx] ? "▲ Collapse" : "▼ Expand"}</span>
                </motion.div>

                {openTables[idx] && (
                  <motion.div 
                    className="p-3 md:p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2 md:gap-4 mb-4">
                      <PDFDownloadLink
                        document={<PDFDocument data={record.products} branch={selectedBranch} />}
                        fileName={`Inventory-${selectedBranch.replace(/\s+/g, "_")}-${new Date(record.date).toISOString().split("T")[0]}.pdf`}
                        className="flex items-center gap-2 px-3 py-2 text-sm md:text-base md:px-4 md:py-2 bg-red-600 text-white font-bold rounded-lg shadow hover:bg-red-700 transition-colors"
                      >
                        <FaFilePdf /> PDF
                      </PDFDownloadLink>
                      <motion.button 
                        onClick={() => exportToExcel(record)} 
                        className="flex items-center gap-2 px-3 py-2 text-sm md:text-base md:px-4 md:py-2 bg-yellow-500 text-red-900 font-bold rounded-lg shadow hover:bg-yellow-600 transition-colors"
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                      >
                        <FaFileExcel /> Excel
                      </motion.button>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[600px] border border-red-100 bg-white shadow-sm rounded-lg overflow-hidden">
                        <thead className="bg-red-100 text-red-800 text-sm md:text-md">
                          <tr>
                            <th className="px-2 py-2 md:px-4 md:py-3 border border-red-200">Name</th>
                            <th className="px-2 py-2 md:px-4 md:py-3 border border-red-200">Category</th>
                            <th className="px-2 py-2 md:px-4 md:py-3 border border-red-200">Price</th>
                            <th className="px-2 py-2 md:px-4 md:py-3 border border-red-200">Beg Inv</th>
                            <th className="px-2 py-2 md:px-4 md:py-3 border border-red-200">Delivered</th>
                            <th className="px-2 py-2 md:px-4 md:py-3 border border-red-200">Waste</th>
                            <th className="px-2 py-2 md:px-4 md:py-3 border border-red-200">Use</th>
                            <th className="px-2 py-2 md:px-4 md:py-3 border border-red-200">Withdrawal</th>
                            <th className="px-2 py-2 md:px-4 md:py-3 border border-red-200">Current</th>
                          </tr>
                        </thead>
                        <tbody>
                          {record.products.map((item, i) => (
                            <tr key={i} className="hover:bg-red-50 even:bg-red-50/30">
                              <td className="px-2 py-2 md:px-4 md:py-3 border border-red-100 text-sm md:text-base">{item.name}</td>
                              <td className="px-2 py-2 md:px-4 md:py-3 border border-red-100 text-sm md:text-base">{item.category}</td>
                              <td className="px-2 py-2 md:px-4 md:py-3 border border-red-100 text-sm md:text-base">{item.price}</td>
                              <td className="px-2 py-2 md:px-4 md:py-3 border border-red-100 text-sm md:text-base">{item.begInventory}</td>
                              <td className="px-2 py-2 md:px-4 md:py-3 border border-red-100 text-sm md:text-base">{item.delivered}</td>
                              <td className="px-2 py-2 md:px-4 md:py-3 border border-red-100 text-sm md:text-base">{item.waste}</td>
                              <td className="px-2 py-2 md:px-4 md:py-3 border border-red-100 text-sm md:text-base">{item.use}</td>
                              <td className="px-2 py-2 md:px-4 md:py-3 border border-red-100 text-sm md:text-base">{item.withdrawal}</td>
                              <td className="px-2 py-2 md:px-4 md:py-3 border border-red-100 text-sm md:text-base">{item.current}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ))
          ) : (
            selectedBranch && <p className="text-gray-500 text-center py-6">No history data available for this branch yet.</p>
          )}

          {/* Pagination */}
          {filteredData.length > ITEMS_PER_PAGE && (
            <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
              <div className="text-gray-700 text-sm">
                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredData.length)} of {filteredData.length} logs
              </div>
              <div className="flex gap-2">
                <motion.button
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                  className="px-3 py-1 md:px-4 md:py-2 bg-red-100 text-red-800 rounded-lg disabled:opacity-50 text-sm md:text-base"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Previous
                </motion.button>
                <span className="px-3 py-1 md:px-4 md:py-2 bg-red-600 text-white rounded-lg text-sm md:text-base">{currentPage}</span>
                <motion.button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 md:px-4 md:py-2 bg-red-100 text-red-800 rounded-lg disabled:opacity-50 text-sm md:text-base"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Next
                </motion.button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default History;