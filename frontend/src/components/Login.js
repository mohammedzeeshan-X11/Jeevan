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
  const [selectedRole, setSelectedRole] = useState(null); // Track selected role
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

  // Role cards data
  const roles = [
    {
      type: 'user',
      title: 'User Login',
      description: 'Access health resources and book appointments',
      icon: '👤'
    },
    {
      type: 'doctor',
      title: 'Doctor Login',
      description: 'Manage appointments and patient consultations',
      icon: '⚕️'
    },
    {
      type: 'sponsor',
      title: 'Sponsor Login',
      description: 'Review and manage sponsorship requests',
      icon: '🤝'
    }
  ];

  // Render role selection screen
  if (!selectedRole) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-4xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-3">Welcome to Jeevan</h1>
            <p className="text-gray-600 text-lg">Select your login type to continue</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {roles.map((role) => (
              <Card
                key={role.type}
                onClick={() => setSelectedRole(role)}
                className="p-6 border-2 border-gray-200 hover:border-black cursor-pointer transition-all hover:shadow-lg"
              >
                <div className="text-center">
                  <div className="text-5xl mb-4">{role.icon}</div>
                  <h2 className="text-xl font-bold mb-2">{role.title}</h2>
                  <p className="text-sm text-gray-600 mb-4">{role.description}</p>
                  <Button className="w-full bg-black text-white hover:bg-gray-800">
                    Login as {role.type.charAt(0).toUpperCase() + role.type.slice(1)}
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          <div className="mt-8 text-center">
            <button
              onClick={() => navigate('/')}
              className="text-sm text-gray-600 hover:text-black"
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render login form for selected role
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <Card className="w-full max-w-md p-8 border-2 border-gray-200">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">{selectedRole.icon}</div>
          <h1 className="text-3xl font-bold mb-2">{selectedRole.title}</h1>
          <p className="text-gray-600">{selectedRole.description}</p>
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

        <div className="mt-4 text-center">
          <button
            onClick={() => {
              setSelectedRole(null);
              setEmail("");
              setPassword("");
              setError("");
            }}
            className="text-sm text-gray-600 hover:text-black"
          >
            ← Back to Role Selection
          </button>
        </div>
      </Card>
    </div>
  );
};

export default Login;
