import { HashRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import LagunaCHKNChopInventory from "./pages/inventory/Laguna/LagunaCHKNChop";
import LagunaVardaBurgerInventory from "./pages/inventory/Laguna/LagunaVardaBurger";
import LagunaTheGoodJuiceInventory from "./pages/inventory/Laguna/LagunaTheGoodJuice";
import LagunaTheGoodNoodleBarInventory from "./pages/inventory/Laguna/LagunaTheGoodNoodleBar";
import LipaBatangasCHKNChopInventory from "./pages/inventory/LipaBatangas/LipaBatangasCHKNChop";
import LipaBatangasVardaBurgerInventory from "./pages/inventory/LipaBatangas/LipaBatangasVardaBurger";
import LipaBatangasSilogInventory from "./pages/inventory/LipaBatangas/LipaBatangasSilog";
import LipaBatangasNRBInventory from "./pages/inventory/LipaBatangas/LipaBatangasNRB";
import LipaBatangasBeverageMainCInventory from "./pages/inventory/LipaBatangas/LipaBatangasBeverageMainC";
import LipaBatangasBreadMainCInventory from "./pages/inventory/LipaBatangas/LipaBatangasBreadMainC";
import PUPMainVardaBurgerInventory from "./pages/inventory/PUPMainBranch/PUPMainVardaBurger";
import PUPMainCHKNChopInventory from "./pages/inventory/PUPMainBranch/PUPMainCHKNChop";
import MAPUAIntramurosVardaBurgerInventory from "./pages/inventory/MAPUA/MAPUAIntramurosVardaBurger";
import MAPUAIntramurosTheGoodJuiceInventory from "./pages/inventory/MAPUA/MAPUAIntramurosTheGoodJuice";
import MAPUAMakatiVardaBurgerInventory from "./pages/inventory/MAPUA/MAPUAMakatiVardaBurger";
import MAPUAMakatiCHKNChopInventory from "./pages/inventory/MAPUA/MAPUAMakatiCHKNChop";
import STJudeManilaCHKNChopInventory from "./pages/inventory/STJude/STJudeManilaCHKNChop";
import STJudeManilaVardaBurgerInventory from "./pages/inventory/STJude/STJudeManilaVardaBurger";
import UserManagement from "./pages/UserManagement";
import History from "./pages/History";
import ActivityLog from "./pages/ActivityLog";
import DailyTimeRecord from "./pages/DailyTimeRecord";

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
        <Route path="/inventory/lipabatangas-beverage-main-c" element={<PrivateRoute element={<LipaBatangasBeverageMainCInventory />}  />} />
        <Route path="/inventory/lipabatangas-bread-main-c" element={<PrivateRoute element={<LipaBatangasBreadMainCInventory />}  />} />
        <Route path="/inventory/pup-main-varda-burger" element={<PrivateRoute element={<PUPMainVardaBurgerInventory />}  />} />
        <Route path="/inventory/pup-main-chkn-chop" element={<PrivateRoute element={<PUPMainCHKNChopInventory />}  />} />
        <Route path="/inventory/mapua-intramuros-varda-burger" element={<PrivateRoute element={<MAPUAIntramurosVardaBurgerInventory />}  />} />
        <Route path="/inventory/mapua-intramuros-the-good-juice" element={<PrivateRoute element={<MAPUAIntramurosTheGoodJuiceInventory />}  />} />
        <Route path="/inventory/mapua-makati-varda-burger" element={<PrivateRoute element={<MAPUAMakatiVardaBurgerInventory />}  />} />
        <Route path="/inventory/mapua-makati-chkn-chop" element={<PrivateRoute element={<MAPUAMakatiCHKNChopInventory />}  />} />
        <Route path="/inventory/st-jude-manila-chkn-chop" element={<PrivateRoute element={<STJudeManilaCHKNChopInventory />}  />} />
        <Route path="/inventory/st-jude-manila-varda-burger" element={<PrivateRoute element={<STJudeManilaVardaBurgerInventory />}  />} />
        <Route path="/history" element={<History />} />
        <Route path="/activitylogs" element={<ActivityLog />} />
        <Route path="/DailyTimeRecord" element={<DailyTimeRecord />} />

      </Routes>
    </Router>
  );
}

export default App;
