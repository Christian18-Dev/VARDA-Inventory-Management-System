import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import CHKNChopInventory from "./pages/inventory/CHKNChop";
import VardaBurgerInventory from "./pages/inventory/VardaBurger";
import TheGoodJuiceInventory from "./pages/inventory/TheGoodJuice";
import TheGoodNoodlesInventory from "./pages/inventory/TheGoodNoodles";
import NRBVardaInventory from "./pages/inventory/NRBVarda";
import PUPVardaInventory from "./pages/inventory/PUPVarda";
import StJudeVardaInventory from "./pages/inventory/StJudeVarda";
import IntramurosVardaInventory from "./pages/inventory/IntramurosVarda";
import UserManagement from "./pages/UserManagement";
import History from "./pages/History";

// ✅ PrivateRoute to Protect Routes
const PrivateRoute = ({ element }) => {
  const isAuthenticated = localStorage.getItem("role"); // Check if user is logged in
  return isAuthenticated ? element : <Navigate to="/" replace />;
};

function App() {
  return (
    <Router basename="/VARDA-Inventory-Management-System">
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<PrivateRoute element={<Dashboard />} />} />
        <Route path="/users" element={<PrivateRoute element={<UserManagement />} />} />
        <Route path="/inventory/chkn-chop" element={<PrivateRoute element={<CHKNChopInventory />} />} />
        <Route path="/inventory/varda-burger" element={<PrivateRoute element={<VardaBurgerInventory />} />} />
        <Route path="/inventory/the-good-juice" element={<PrivateRoute element={<TheGoodJuiceInventory />} />} />
        <Route path="/inventory/the-good-noodles" element={<PrivateRoute element={<TheGoodNoodlesInventory />} />} />
        <Route path="/inventory/nrb-varda" element={<PrivateRoute element={<NRBVardaInventory />} />} />
        <Route path="/inventory/pup-varda" element={<PrivateRoute element={<PUPVardaInventory />} />} />
        <Route path="/inventory/st-jude-varda" element={<PrivateRoute element={<StJudeVardaInventory />} />} />
        <Route path="/inventory/intramuros-varda" element={<PrivateRoute element={<IntramurosVardaInventory />} />} />
        <Route path="/history" element={<History />} />
      </Routes>
    </Router>
  );
}

export default App;
