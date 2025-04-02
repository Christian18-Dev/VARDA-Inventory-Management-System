import { HashRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import LagunaCHKNChopInventory from "./pages/inventory/LagunaCHKNChop";
import LagunaVardaBurgerInventory from "./pages/inventory/LagunaVardaBurger";
import LagunaTheGoodJuiceInventory from "./pages/inventory/LagunaTheGoodJuice";
import LagunaTheGoodNoodleBarInventory from "./pages/inventory/LagunaTheGoodNoodleBar";
import LipaBatangasCHKNChopInventory from "./pages/inventory/LipaBatangasCHKNChop";
import LipaBatangasVardaBurgerInventory from "./pages/inventory/LipaBatangasVardaBurger";
import LipaBatangasSilogInventory from "./pages/inventory/LipaBatangasSilog";
import LipaBatangasNRBInventory from "./pages/inventory/LipaBatangasNRB";
import UserManagement from "./pages/UserManagement";
import History from "./pages/History";
import ActivityLog from "./pages/ActivityLog";

// ✅ PrivateRoute to Protect Routes
const PrivateRoute = ({ element }) => {
  const isAuthenticated = localStorage.getItem("role"); // Check if user is logged in
  return isAuthenticated ? element : <Navigate to="/" replace />;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<PrivateRoute element={<Dashboard />} />} />
        <Route path="/users" element={<PrivateRoute element={<UserManagement />} />} />
        <Route path="/inventory/laguna-chkn-chop" element={<PrivateRoute element={<LagunaCHKNChopInventory />}  />} />
        <Route path="/inventory/laguna-varda-burger" element={<PrivateRoute element={<LagunaVardaBurgerInventory />}  />} />
        <Route path="/inventory/laguna-the-good-juice" element={<PrivateRoute element={<LagunaTheGoodJuiceInventory />}  />} />
        <Route path="/inventory/laguna-the-good-noodle-bar" element={<PrivateRoute element={<LagunaTheGoodNoodleBarInventory />}  />} />
        <Route path="/inventory/lipabatangas-chkn-chop" element={<PrivateRoute element={<LipaBatangasCHKNChopInventory />}  />} />
        <Route path="/inventory/lipabatangas-varda-burger" element={<PrivateRoute element={<LipaBatangasVardaBurgerInventory />}  />} />
        <Route path="/inventory/lipabatangas-silog" element={<PrivateRoute element={<LipaBatangasSilogInventory />}  />} />
        <Route path="/inventory/lipabatangas-nrb" element={<PrivateRoute element={<LipaBatangasNRBInventory />}  />} />
        <Route path="/history" element={<History />} />
        <Route path="/activitylogs" element={<ActivityLog />} />

      </Routes>
    </Router>
  );
}

export default App;
