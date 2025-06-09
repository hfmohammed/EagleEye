import React from 'react';

function Footer() {
  return (
    <footer className="bg-gray-200 text-gray-700 py-4 shadow-inner">
      <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center">
        <p className="text-sm">© {new Date().getFullYear()} EagleEye. All rights reserved.</p>
        <div className="flex space-x-4 mt-2 md:mt-0">
          <a href="#" className="text-sm hover:underline">Privacy Policy</a>
          <a href="#" className="text-sm hover:underline">Terms of Service</a>
          <a href="#" className="text-sm hover:underline">Contact</a>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
