import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

const SignIn = () => {
  const [email, setEmail] = useState("@srm.com");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to home if token exists
    if (localStorage.getItem("authToken")) {
      navigate("/home");
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check email pattern
    const emailPattern = /^[a-zA-Z0-9._%+-]+@srm\.com$/;
    if (!emailPattern.test(email)) {
      alert("Please use an email ending with 'srm.com'");
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:8000/api/auth/signin",
        {
          email,
          password
        }
      );

      localStorage.setItem("authToken", response.data.token);
      alert(response.data.message);
      navigate("/home");
    } catch (error) {
      alert(error.response?.data?.message || "An error occurred");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-2xl">
        <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
          Welcome Back!
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:outline-none focus:border-blue-500 transition duration-200"
              placeholder="Email (e.g., name@srm.com)"
              required
            />
          </div>
          <div className="relative">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:outline-none focus:border-blue-500 transition duration-200"
              placeholder="Password"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full py-3 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold shadow-lg hover:from-blue-600 hover:to-purple-700 focus:outline-none transition duration-200"
          >
            Sign In
          </button>
        </form>
        <p className="mt-4 text-center text-gray-600">
          Don’t have an account?{" "}
          <Link to="/signup" className="text-blue-500 hover:underline">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignIn;
