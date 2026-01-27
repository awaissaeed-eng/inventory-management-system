import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

// Simple window size hook to replace the deleted utility
const useWindowSize = () => {
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowSize;
};


const Layout = () => {
  const { width } = useWindowSize();
  const [sidebarOpen, setSidebarOpen] = useState(width > 767);

  useEffect(() => {
    // Auto-close sidebar on small screens
    if (width <= 767) {
      setSidebarOpen(false);
    } else {
      setSidebarOpen(true);
    }
  }, [width]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div style={{ display: 'flex', height: '100vh', flexDirection: 'column' }}>
      <div style={{ display: 'flex', height: '100%' }}>
        <Sidebar isOpen={sidebarOpen} />
        {sidebarOpen && <div className="sidebar-backdrop" onClick={toggleSidebar} />}
        <div
          className={`main-content ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}
          style={{
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Header toggleSidebar={toggleSidebar} sidebarOpen={sidebarOpen} />
          <main style={{ flexGrow: 1, padding: 0, overflow: 'auto' }}>
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

export default Layout;
