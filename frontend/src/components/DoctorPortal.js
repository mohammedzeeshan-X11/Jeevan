import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar, LogOut, RefreshCw } from "lucide-react";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const DoctorPortal = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check if user is logged in and is a doctor
    const userData = localStorage.getItem('jeevan_user');
    if (!userData) {
      navigate('/login');
      return;
    }
    
    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== 'doctor') {
      navigate('/');
      return;
    }
    
    setUser(parsedUser);
    fetchAppointments();
  }, [navigate]);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/appointments`);
      setAppointments(response.data);
    } catch (error) {
      console.error("Failed to fetch appointments:", error);
    } finally {
      setLoading(false);
    }
  };

  const confirmAppointment = async (appointmentId) => {
    try {
      await axios.patch(`${API}/appointments/${appointmentId}`, {
        status: "Confirmed"
      });
      // Refresh the list
      fetchAppointments();
    } catch (error) {
      console.error("Failed to confirm appointment:", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('jeevan_user');
    navigate('/login');
  };

  const getStatusBadge = (status) => {
    const styles = {
      'Pending': 'bg-gray-200 text-gray-700',
      'Confirmed': 'bg-black text-white'
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
            <h1 className="text-2xl font-bold">Doctor Portal</h1>
            <p className="text-sm text-gray-600">Welcome, Dr. {user.name}</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={fetchAppointments}
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
          <h2 className="text-xl font-semibold">All Appointments</h2>
          <p className="text-gray-600">Manage patient appointments</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading appointments...</p>
          </div>
        ) : appointments.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">No appointments yet</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {appointments.map((appointment) => (
              <Card key={appointment.id} className="p-6 border-2 border-gray-200 hover:border-black transition-all">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{appointment.name}</h3>
                      {getStatusBadge(appointment.status)}
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p><strong>Doctor:</strong> {appointment.doctor}</p>
                      <p><strong>Date:</strong> {appointment.date}</p>
                      <p><strong>Time:</strong> {appointment.time}</p>
                    </div>
                  </div>
                  
                  {appointment.status === 'Pending' && (
                    <Button
                      onClick={() => confirmAppointment(appointment.id)}
                      className="bg-black text-white hover:bg-gray-800"
                    >
                      Confirm Appointment
                    </Button>
                  )}
                  
                  {appointment.status === 'Confirmed' && (
                    <div className="text-sm text-green-600 font-medium">
                      ✓ Confirmed
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

export default DoctorPortal;
