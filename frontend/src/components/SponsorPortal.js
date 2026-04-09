import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Heart, LogOut, RefreshCw, CheckCircle, XCircle } from "lucide-react";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const SponsorPortal = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check if user is logged in and is a sponsor
    const userData = localStorage.getItem('jeevan_user');
    if (!userData) {
      navigate('/login');
      return;
    }
    
    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== 'sponsor') {
      navigate('/');
      return;
    }
    
    setUser(parsedUser);
    fetchRequests();
  }, [navigate]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/support-requests`);
      setRequests(response.data);
    } catch (error) {
      console.error("Failed to fetch support requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateRequestStatus = async (requestId, status) => {
    try {
      await axios.patch(`${API}/support-requests/${requestId}`, {
        status
      });
      // Refresh the list
      fetchRequests();
    } catch (error) {
      console.error("Failed to update support request:", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('jeevan_user');
    navigate('/login');
  };

  const getStatusBadge = (status) => {
    const styles = {
      'Pending': 'bg-gray-200 text-gray-700',
      'Approved': 'bg-black text-white',
      'Rejected': 'bg-gray-300 text-gray-600'
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-200'}`}>
        {status}
      </span>
    );
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Sponsor Portal</h1>
            <p className="text-sm text-gray-600">Welcome, {user.name}</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={fetchRequests}
              variant="outline"
              className="border-black"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="border-black"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-6">
          <h2 className="text-xl font-semibold">Support Requests</h2>
          <p className="text-gray-600">Review and manage sponsorship applications</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading support requests...</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-12">
            <Heart className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">No support requests yet</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {requests.map((request) => (
              <Card key={request.id} className="p-6 border-2 border-gray-200 hover:border-black transition-all">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{request.title}</h3>
                        {getStatusBadge(request.status)}
                      </div>
                      <div className="space-y-2 text-sm">
                        <p><strong>Type:</strong> {request.type}</p>
                        <p><strong>Issue:</strong> {request.issue}</p>
                        <p className="text-gray-600">{request.description}</p>
                      </div>
                    </div>
                  </div>
                  
                  {request.status === 'Pending' && (
                    <div className="flex gap-2 pt-2 border-t border-gray-200">
                      <Button
                        onClick={() => updateRequestStatus(request.id, 'Approved')}
                        className="bg-black text-white hover:bg-gray-800"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        onClick={() => updateRequestStatus(request.id, 'Rejected')}
                        variant="outline"
                        className="border-black hover:bg-gray-100"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  )}
                  
                  {request.status === 'Approved' && (
                    <div className="pt-2 border-t border-gray-200">
                      <div className="text-sm text-green-600 font-medium flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        This request has been approved
                      </div>
                    </div>
                  )}
                  
                  {request.status === 'Rejected' && (
                    <div className="pt-2 border-t border-gray-200">
                      <div className="text-sm text-gray-600 font-medium flex items-center gap-2">
                        <XCircle className="h-4 w-4" />
                        This request has been rejected
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SponsorPortal;
