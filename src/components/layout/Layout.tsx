import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import MobileNavbar from './MobileNavbar';

const Layout: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="flex flex-1">
        <div className="hidden md:block w-64 bg-white shadow-md">
          <Sidebar />
        </div>
        
        <main className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
      
      <div className="md:hidden">
        <MobileNavbar />
      </div>
    </div>
  );
};

export default Layout;