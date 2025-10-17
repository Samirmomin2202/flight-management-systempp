import React, { useEffect, useState } from "react";
import axios from "axios";
import AdminSidebar from "./AdminSidebar";

const AdminContacts = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/contact");
        if (res.data.success) {
          setContacts(res.data.contacts);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchContacts();
  }, []);

  if (loading) return <p className="p-4">Loading messages...</p>;

  return (
    <div className="min-h-screen flex">
      <AdminSidebar />
      <div className="flex-1 ml-64 bg-gray-100 p-6 md:p-10">
        <h1 className="text-3xl font-bold text-blue-900 mb-6">Contact Messages</h1>
        {contacts.length === 0 ? (
          <p>No messages yet</p>
        ) : (
          <div className="overflow-x-auto bg-white rounded-lg shadow">
            <table className="min-w-full border">
              <thead className="bg-blue-100 text-blue-900">
                <tr>
                  <th className="p-2 border">Name</th>
                  <th className="p-2 border">Email</th>
                  <th className="p-2 border">Message</th>
                  <th className="p-2 border">Date</th>
                </tr>
              </thead>
              <tbody>
                {contacts.map((c) => (
                  <tr key={c._id} className="border hover:bg-gray-50">
                    <td className="p-2 border">{c.name}</td>
                    <td className="p-2 border">{c.email}</td>
                    <td className="p-2 border">{c.message}</td>
                    <td className="p-2 border">{new Date(c.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminContacts;
