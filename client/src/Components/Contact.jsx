import React, { useState } from "react";
import axios from "axios";

const Contact = () => {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("Sending...");
    try {
      const res = await axios.post("http://localhost:5000/api/contact", form);
      if (res.data.success) {
        setStatus("✅ Message sent successfully!");
        setForm({ name: "", email: "", message: "" });
      } else {
        setStatus("❌ Failed to send message.");
      }
    } catch (err) {
      setStatus("⚠️ Error sending message.");
    }
  };

  return (
    <div className="w-full min-h-screen bg-white">
      {/* Hero Section */}
      <div className="bg-blue-950 text-white py-12 px-4 text-center">
        <h1 className="text-3xl md:text-5xl font-bold mb-2">Get in Touch</h1>
        <p className="text-sm md:text-base text-slate-200">
          We'd love to hear from you. Reach out with any questions or feedback.
        </p>
      </div>

      {/* Contact Section */}
      <div className="w-full px-4 py-10 md:px-20 flex flex-col md:flex-row gap-10 bg-[#f9fbfd]">
        {/* Contact Form */}
        <div className="w-full md:w-2/3 bg-white p-6 shadow-md rounded-md">
          <h2 className="text-xl font-semibold text-blue-950 mb-4">
            Send Us a Message
          </h2>
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <input
              type="text"
              name="name"
              placeholder="Your Name"
              value={form.name}
              onChange={handleChange}
              className="border rounded-md p-2 focus:outline-blue-400"
              required
            />
            <input
              type="email"
              name="email"
              placeholder="Your Email"
              value={form.email}
              onChange={handleChange}
              className="border rounded-md p-2 focus:outline-blue-400"
              required
            />
            <textarea
              rows="5"
              name="message"
              placeholder="Your Message"
              value={form.message}
              onChange={handleChange}
              className="border rounded-md p-2 focus:outline-blue-400 resize-none"
              required
            />
            <button
              type="submit"
              className="bg-blue-950 text-white px-4 py-2 rounded hover:bg-blue-900 transition duration-200"
            >
              Send Message
            </button>
          </form>
          {status && (
            <p className="mt-4 text-sm text-blue-900 font-medium">{status}</p>
          )}
        </div>

        {/* Contact Info */}
        <div className="w-full md:w-1/3 flex flex-col gap-4">
          <div className="bg-white p-6 rounded-md shadow-sm">
            <h3 className="text-lg font-medium text-blue-950 mb-2">
              Contact Info
            </h3>
            <p className="text-sm text-slate-700 mb-1">
              <strong>Email:</strong> flightsupport@gmail.com
            </p>
            <p className="text-sm text-slate-700 mb-1">
              <strong>Phone:</strong> +91 936448223
            </p>
            <p className="text-sm text-slate-700">
              <strong>Address:</strong> Ahemdabad
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
