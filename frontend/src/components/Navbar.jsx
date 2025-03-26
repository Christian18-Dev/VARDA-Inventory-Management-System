import { FaBell, FaCog } from "react-icons/fa";

const Navbar = ({ searchQuery, setSearchQuery }) => {
  return (
    <nav className="bg-[#1E1E1E]/80 backdrop-blur-md text-white p-4 flex items-center justify-between fixed top-2 left-16 right-4 z-40 md:left-[calc(16rem+1rem)] md:right-4 md:w-[calc(100%-(16rem+2rem))] rounded-lg shadow-md transition-all">
      {/* Search Bar */}
      <input
        type="text"
        placeholder="Search here..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="p-2 rounded-md text-black bg-white w-full max-w-xs sm:max-w-md focus:outline-none"
      />

      {/* Icons */}
      <div className="flex items-center space-x-4">
        <FaBell className="cursor-pointer text-xl ml-2" />  
      </div>
    </nav>
  );
};

export default Navbar;
