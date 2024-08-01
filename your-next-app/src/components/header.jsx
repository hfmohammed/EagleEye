import Link from "next/link";
import { FaCamera, FaVideo, FaCog, FaBars, FaUserCircle, FaSignOutAlt, FaTimes } from 'react-icons/fa';
import { useState } from 'react';

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const toggleMenu = () => setMenuOpen(!menuOpen);
  const toggleDropdown = () => setDropdownOpen(!dropdownOpen);

  return (
    <header className="sticky top-0 z-40 w-full text-white bg-gray-800 border-b">
      <div className="flex items-center justify-between h-14 px-4 w-full">
        <Link href="#" className="flex items-center gap-2" prefetch={false}>
          <FaCamera className="w-6 h-6" />
          <span className="font-bold text-lg">CCTV Dashboard</span>
        </Link>
        <div id="right-navbar" className="flex items-center gap-2">
          <Link href="#" className="hidden sm:inline-flex text-sm font-medium hover:underline" prefetch={false}>
            Live Feeds
          </Link>
          <button
            onClick={() => {}}
            className="hidden sm:inline-flex p-2 rounded-full hover:bg-gray-200 hover:text-gray-800"
            aria-label="Settings"
          >
            <FaCog className="w-5 h-5" />
          </button>
          <div className="relative hidden sm:inline-flex">
            <button
              onClick={toggleDropdown}
              className="p-1 rounded-full hover:bg-gray-200"
              aria-label="Toggle user menu"
            >
              <img
                src="../placeholder-user.jpg"
                width={36}
                height={36}
                alt="Avatar"
                className="rounded-full object-cover"
              />
            </button>
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white text-gray-800 border border-gray-300 rounded-md shadow-lg z-50">
                <div className="px-4 py-2 text-sm font-medium">My Account</div>
                <hr className="border-gray-300" />
                <ul>
                  <li className="flex items-center p-2 hover:bg-gray-100 cursor-pointer" onClick={() => {}}>
                    <FaUserCircle className="w-4 h-4 mr-2" />
                    Settings
                  </li>
                  <li className="flex items-center p-2 hover:bg-gray-100 cursor-pointer" onClick={() => {}}>
                    <FaSignOutAlt className="w-4 h-4 mr-2" />
                    Logout
                  </li>
                </ul>
              </div>
            )}
          </div>
          <button
            onClick={toggleMenu}
            className="sm:hidden p-2"
            aria-label="Toggle menu"
          >
            <FaBars className="w-6 h-6" />
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="fixed inset-0 bg-black/50 flex text-gray-800 justify-end items-start z-50">
          <div className="relative w-64 h-full bg-white p-6 shadow-lg border border-gray-300" style={{ backgroundColor: 'white' }}>
            <button
              onClick={toggleMenu}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-200"
              aria-label="Close menu"
            >
              <FaTimes className="w-6 h-6" />
            </button>
            <nav className="space-y-4">
              <Link href="#" className="flex items-center gap-2" prefetch={false}>
                <FaCamera className="w-5 h-5" />
                <span>Dashboard</span>
              </Link>
              <Link href="#" className="flex items-center gap-2" prefetch={false}>
                <FaVideo className="w-5 h-5" />
                <span>Cameras</span>
              </Link>
              <Link href="#" className="flex items-center gap-2" prefetch={false}>
                <FaCog className="w-5 h-5" />
                <span>Settings</span>
              </Link>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
