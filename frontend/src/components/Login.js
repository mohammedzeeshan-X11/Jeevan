import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await axios.post(`${API}/login`, {
        email,
        password
      });

      if (response.data.success) {
        // Store user data in localStorage
        localStorage.setItem('jeevan_user', JSON.stringify(response.data));
        
        // Redirect based on role
        if (response.data.role === 'doctor') {
          navigate('/doctor-portal');
        } else if (response.data.role === 'sponsor') {
          navigate('/sponsor-portal');
        } else {
          navigate('/');
        }
      } else {
        setError(response.data.message || "Login failed");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <Card className="w-full max-w-md p-8 border-2 border-gray-200">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Jeevan Login</h1>
          <p className="text-gray-600">Sign in to access your account</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Email</label>
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="border-gray-300 focus:border-black"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Password</label>
            <Input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="border-gray-300 focus:border-black"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-600">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white hover:bg-gray-800 disabled:bg-gray-300"
          >
            {loading ? "Logging in..." : "Login"}
          </Button>
        </form>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg text-sm">
          <p className="font-semibold mb-2">Demo Accounts:</p>
          <div className="space-y-1 text-gray-600">
            <p>• Doctor: doctor@jeevan.com / doctor123</p>
            <p>• Sponsor: sponsor@jeevan.com / sponsor123</p>
            <p>• User: user@jeevan.com / user123</p>
          </div>
        </div>

        <div className="mt-4 text-center">
          <button
            onClick={() => navigate('/')}
            className="text-sm text-gray-600 hover:text-black"
          >
            ← Back to Home
          </button>
        </div>
      </Card>
    </div>
  );
};

export default Login;
