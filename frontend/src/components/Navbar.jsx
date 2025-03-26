import { useState, useRef } from 'react';
import { FaSearch, FaBell, FaTimes } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = ({ searchQuery, setSearchQuery }) => {
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const searchRef = useRef(null);

  const handleSearchClick = () => {
    setIsSearchExpanded(true);
    setTimeout(() => {
      if (searchRef.current) {
        searchRef.current.focus();
      }
    }, 100);
  };

  const handleSearchBlur = () => {
    if (!searchQuery) {
      setIsSearchExpanded(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setIsSearchExpanded(false);
  };

  return (
    <nav className="bg-indigo-600 text-white p-3 flex items-center justify-between fixed top-0 left-0 right-0 z-40 md:left-[calc(16rem+1rem)] md:right-4 md:top-2 md:w-[calc(100%-(16rem+2rem))] md:rounded-xl shadow-md">
      {/* Animated Search Bar */}
      <div className="flex items-center pl-16 md:pl-0">
        <motion.div
          className={`flex items-center ${isSearchExpanded ? 'bg-indigo-700' : 'bg-indigo-700/80'} rounded-xl overflow-hidden`}
          animate={{
            width: isSearchExpanded ? '280px' : '48px',
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        >
          <button 
            onClick={handleSearchClick}
            className="p-3 text-indigo-100 hover:text-white flex-shrink-0"
          >
            <FaSearch />
          </button>
          
          <AnimatePresence>
            {isSearchExpanded && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-center"
              >
                <input
                  ref={searchRef}
                  type="text"
                  placeholder="Search here..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onBlur={handleSearchBlur}
                  className="bg-transparent border-none outline-none text-white placeholder-indigo-200 py-2 pr-2 w-full min-w-[180px]"
                />
                
                {searchQuery && (
                  <motion.button
                    onClick={clearSearch}
                    className="p-2 text-indigo-200 hover:text-white"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <FaTimes />
                  </motion.button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Notification Bell */}
      <div className="ml-4">
        <motion.button 
          className="p-2 rounded-full bg-indigo-700 hover:bg-indigo-800"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <FaBell className="text-lg text-indigo-100 hover:text-white" />
        </motion.button>
      </div> 
    </nav> 
  );
};

export default Navbar;