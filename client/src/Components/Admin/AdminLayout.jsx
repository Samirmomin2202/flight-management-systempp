import React from 'react';
import { Outlet } from 'react-router-dom';
import AdminNavbar from './AdminNavbar';  // same folder
import AdminFooter from './AdminFooter';  // same folder

const AdminLayout = () => {
  return (
    <>
      <AdminNavbar />
      <main className="min-h-screen">
        <Outlet />
      </main>
      <AdminFooter />
    </>
  );
};

export default AdminLayout;
