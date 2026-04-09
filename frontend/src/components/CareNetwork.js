import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Calendar, Clock, User, ShoppingCart, Heart, CheckCircle, X, ArrowLeft } from "lucide-react";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Mock Data
const DOCTORS = [
  {
    id: 1,
    name: "Dr. Priya Sharma",
    specialization: "Gynecologist",
    description: "15+ years experience in women's health and reproductive medicine",
    availability: "Mon-Sat, 9 AM - 5 PM"
  },
  {
    id: 2,
    name: "Dr. Anjali Verma",
    specialization: "Nutritionist",
    description: "Certified nutritionist specializing in women's dietary needs",
    availability: "Tue-Sun, 10 AM - 6 PM"
  },
  {
    id: 3,
    name: "Dr. Kavita Reddy",
    specialization: "Mental Health",
    description: "Clinical psychologist focusing on stress and anxiety management",
    availability: "Mon-Fri, 11 AM - 7 PM"
  },
  {
    id: 4,
    name: "Dr. Meera Patel",
    specialization: "PCOS Specialist",
    description: "Expert in hormonal health and PCOS management",
    availability: "Wed-Sun, 9 AM - 4 PM"
  }
];

const PRODUCTS = [
  {
    id: 1,
    name: "Period Pain Relief Kit",
    price: 599,
    description: "Natural herbs and heat patches for menstrual cramp relief",
    category: "Wellness"
  },
  {
    id: 2,
    name: "Prenatal Vitamin Pack",
    price: 899,
    description: "Complete prenatal nutrition with folic acid and iron",
    category: "Nutrition"
  },
  {
    id: 3,
    name: "Hygiene Care Bundle",
    price: 449,
    description: "pH-balanced intimate wash and organic cotton products",
    category: "Hygiene"
  },
  {
    id: 4,
    name: "Stress Relief Tea",
    price: 299,
    description: "Herbal tea blend for relaxation and better sleep",
    category: "Wellness"
  },
  {
    id: 5,
    name: "PCOS Support Supplement",
    price: 1299,
    description: "Natural supplement to support hormonal balance",
    category: "Health"
  },
  {
    id: 6,
    name: "Yoga Mat & Guide",
    price: 799,
    description: "Premium yoga mat with women's wellness guide",
    category: "Fitness"
  }
];

const SPONSORED_HELP = [
  {
    id: 1,
    title: "Free First Consultation",
    description: "Get your first doctor consultation absolutely free",
    type: "Consultation",
    status: "Available"
  },
  {
    id: 2,
    title: "50% Off Health Kits",
    description: "Discounted essential health and hygiene kits for those in need",
    type: "Products",
    status: "Available"
  },
  {
    id: 3,
    title: "Mental Health Support",
    description: "Free counseling sessions for stress and anxiety management",
    type: "Support",
    status: "Available"
  },
  {
    id: 4,
    title: "PCOS Care Package",
    description: "Subsidized PCOS management program with diet and exercise plan",
    type: "Program",
    status: "Available"
  }
];

const CareNetwork = ({ onClose }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("doctors");
  const [bookingModal, setBookingModal] = useState(null);
  const [paymentModal, setPaymentModal] = useState(null);
  const [checkoutModal, setCheckoutModal] = useState(null);
  const [helpModal, setHelpModal] = useState(null);
  const [confirmation, setConfirmation] = useState(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  
  // Booking form state
  const [bookingForm, setBookingForm] = useState({
    name: "",
    date: "",
    time: ""
  });
  
  // Help application form state
  const [helpForm, setHelpForm] = useState({
    issue: "",
    description: ""
  });

  const handleBooking = (doctor) => {
    setBookingModal(doctor);
    setBookingForm({ name: "", date: "", time: "" });
  };

  const openPaymentModal = () => {
    // Close booking modal and open payment modal
    setPaymentModal({
      doctor: bookingModal,
      bookingDetails: bookingForm
    });
    setBookingModal(null);
  };

  const handlePayment = async () => {
    setProcessingPayment(true);
    
    // Simulate payment processing
    setTimeout(async () => {
      try {
        // Call existing booking API after successful payment
        const response = await axios.post(`${API}/appointments`, {
          name: paymentModal.bookingDetails.name,
          doctor: paymentModal.doctor.name,
          date: paymentModal.bookingDetails.date,
          time: paymentModal.bookingDetails.time
        });
        
        setConfirmation({
          type: "booking",
          message: `Payment successful! Appointment booked with ${paymentModal.doctor.name} on ${paymentModal.bookingDetails.date} at ${paymentModal.bookingDetails.time}. ID: ${response.data.id}`
        });
        setPaymentModal(null);
        setProcessingPayment(false);
        setTimeout(() => setConfirmation(null), 5000);
      } catch (error) {
        console.error("Booking error:", error);
        setConfirmation({
          type: "error",
          message: "Payment successful but booking failed. Please contact support."
        });
        setPaymentModal(null);
        setProcessingPayment(false);
        setTimeout(() => setConfirmation(null), 5000);
      }
    }, 2000); // 2 second delay to simulate payment processing
  };

  const submitBooking = async () => {
    try {
      const response = await axios.post(`${API}/appointments`, {
        name: bookingForm.name,
        doctor: bookingModal.name,
        date: bookingForm.date,
        time: bookingForm.time
      });
      
      setConfirmation({
        type: "booking",
        message: `Appointment booked with ${bookingModal.name} on ${bookingForm.date} at ${bookingForm.time}. ID: ${response.data.id}`
      });
      setBookingModal(null);
      setTimeout(() => setConfirmation(null), 5000);
    } catch (error) {
      console.error("Booking error:", error);
      setConfirmation({
        type: "error",
        message: "Failed to book appointment. Please try again."
      });
      setTimeout(() => setConfirmation(null), 5000);
    }
  };

  const handleCheckout = (product) => {
    setCheckoutModal(product);
  };

  const submitPurchase = () => {
    setConfirmation({
      type: "purchase",
      message: `Order confirmed! ${checkoutModal.name} will be delivered in 3-5 business days.`
    });
    setCheckoutModal(null);
    setTimeout(() => setConfirmation(null), 5000);
  };

  const handleApplyHelp = (help) => {
    setHelpModal(help);
    setHelpForm({ issue: "", description: "" });
  };

  const submitHelpRequest = async () => {
    try {
      const response = await axios.post(`${API}/support-requests`, {
        issue: helpForm.issue,
        description: helpForm.description,
        title: helpModal.title,
        type: helpModal.type
      });
      
      setConfirmation({
        type: "help",
        message: `Application submitted for "${helpModal.title}". Status: Pending review. ID: ${response.data.id}`
      });
      setHelpModal(null);
      setTimeout(() => setConfirmation(null), 5000);
    } catch (error) {
      console.error("Help request error:", error);
      setConfirmation({
        type: "error",
        message: "Failed to submit application. Please try again."
      });
      setTimeout(() => setConfirmation(null), 5000);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/')}
              className="hover:bg-gray-100 p-2 rounded-full transition-colors"
              aria-label="Back to home"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-2xl font-bold">Jeevan Care Network</h1>
          </div>
          {onClose && (
            <button 
              onClick={onClose}
              className="hover:bg-gray-100 p-2 rounded-full transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
        
        {/* Tabs */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-4 border-b border-gray-200">
            {[
              { id: "doctors", label: "Consult Doctor" },
              { id: "products", label: "Buy Products" },
              { id: "help", label: "Sponsored Help" }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "border-b-2 border-black text-black"
                    : "text-gray-600 hover:text-black"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Confirmation Message */}
        {confirmation && (
          <div className="mb-6 p-4 bg-black text-white rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5" />
              <p className="text-sm">{confirmation.message}</p>
            </div>
            <button onClick={() => setConfirmation(null)}>
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Doctors Tab */}
        {activeTab === "doctors" && (
          <div>
            <h2 className="text-3xl font-bold mb-6">Consult Expert Doctors</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {DOCTORS.map((doctor) => (
                <Card key={doctor.id} className="p-6 border-2 border-gray-200 hover:border-black transition-all">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xl font-semibold">{doctor.name}</h3>
                      <p className="text-sm text-gray-600">{doctor.specialization}</p>
                    </div>
                    <p className="text-gray-700">{doctor.description}</p>
                    <p className="text-sm text-gray-500">
                      <strong>Available:</strong> {doctor.availability}
                    </p>
                    <Button
                      onClick={() => handleBooking(doctor)}
                      className="w-full bg-black text-white hover:bg-gray-800"
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      Book Appointment
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Products Tab */}
        {activeTab === "products" && (
          <div>
            <h2 className="text-3xl font-bold mb-6">Health & Wellness Products</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {PRODUCTS.map((product) => (
                <Card key={product.id} className="p-6 border-2 border-gray-200 hover:border-black transition-all">
                  <div className="space-y-4">
                    <div>
                      <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">{product.category}</span>
                    </div>
                    <h3 className="text-lg font-semibold">{product.name}</h3>
                    <p className="text-sm text-gray-600">{product.description}</p>
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-2xl font-bold">₹{product.price}</span>
                    </div>
                    <Button
                      onClick={() => handleCheckout(product)}
                      className="w-full bg-black text-white hover:bg-gray-800"
                    >
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      Buy Now
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Sponsored Help Tab */}
        {activeTab === "help" && (
          <div>
            <h2 className="text-3xl font-bold mb-6">Sponsored Support Programs</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {SPONSORED_HELP.map((help) => (
                <Card key={help.id} className="p-6 border-2 border-gray-200 hover:border-black transition-all">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <Heart className="h-8 w-8" />
                      <span className="text-xs px-2 py-1 bg-black text-white rounded-full">{help.status}</span>
                    </div>
                    <h3 className="text-xl font-semibold">{help.title}</h3>
                    <p className="text-gray-700">{help.description}</p>
                    <p className="text-sm text-gray-500">Type: {help.type}</p>
                    <Button
                      onClick={() => handleApplyHelp(help)}
                      className="w-full border-2 border-black text-black hover:bg-black hover:text-white transition-all"
                    >
                      Apply for Support
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Booking Modal */}
      <Dialog open={!!bookingModal} onOpenChange={() => setBookingModal(null)}>
        <DialogContent className="sm:max-w-[425px] bg-white">
          <DialogHeader>
            <DialogTitle>Book Appointment</DialogTitle>
          </DialogHeader>
          {bookingModal && (
            <div className="space-y-4">
              <div>
                <p className="font-semibold">{bookingModal.name}</p>
                <p className="text-sm text-gray-600">{bookingModal.specialization}</p>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">Your Name</label>
                  <Input
                    placeholder="Enter your name"
                    value={bookingForm.name}
                    onChange={(e) => setBookingForm({ ...bookingForm, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Date</label>
                  <Input
                    type="date"
                    value={bookingForm.date}
                    onChange={(e) => setBookingForm({ ...bookingForm, date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Time</label>
                  <Input
                    type="time"
                    value={bookingForm.time}
                    onChange={(e) => setBookingForm({ ...bookingForm, time: e.target.value })}
                  />
                </div>
              </div>
              <Button
                onClick={openPaymentModal}
                disabled={!bookingForm.name || !bookingForm.date || !bookingForm.time}
                className="w-full bg-black text-white hover:bg-gray-800 disabled:bg-gray-300"
              >
                Confirm Booking
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Payment Modal - Razorpay Style */}
      <Dialog open={!!paymentModal} onOpenChange={() => !processingPayment && setPaymentModal(null)}>
        <DialogContent className="sm:max-w-[425px] bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 bg-black text-white rounded flex items-center justify-center text-xs font-bold">
                R
              </div>
              Razorpay Payment
            </DialogTitle>
          </DialogHeader>
          {paymentModal && (
            <div className="space-y-6">
              {/* Payment Summary */}
              <div className="border-2 border-gray-200 rounded-lg p-4 space-y-3">
                <h3 className="font-semibold text-sm text-gray-600 uppercase tracking-wide">Payment Details</h3>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="text-sm text-gray-600">Doctor</span>
                    <span className="font-semibold text-right">{paymentModal.doctor.name}</span>
                  </div>
                  
                  <div className="flex justify-between items-start">
                    <span className="text-sm text-gray-600">Specialization</span>
                    <span className="text-sm text-right">{paymentModal.doctor.specialization}</span>
                  </div>
                  
                  <div className="h-px bg-gray-200 my-2"></div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Date</span>
                    <span className="font-medium">{paymentModal.bookingDetails.date}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Time</span>
                    <span className="font-medium">{paymentModal.bookingDetails.time}</span>
                  </div>
                  
                  <div className="h-px bg-gray-200 my-2"></div>
                  
                  <div className="flex justify-between items-center pt-2">
                    <span className="font-semibold">Amount to Pay</span>
                    <span className="text-2xl font-bold">₹500</span>
                  </div>
                </div>
              </div>

              {/* Payment Button */}
              <Button
                onClick={handlePayment}
                disabled={processingPayment}
                className="w-full bg-black text-white hover:bg-gray-800 disabled:bg-gray-400 h-12 text-base font-semibold"
              >
                {processingPayment ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processing Payment...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z"/>
                      <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd"/>
                    </svg>
                    Pay with Razorpay
                  </span>
                )}
              </Button>

              {/* Secure Payment Note */}
              <div className="text-center">
                <p className="text-xs text-gray-500">
                  🔒 Secured by Razorpay • Your payment information is safe
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Checkout Modal */}
      <Dialog open={!!checkoutModal} onOpenChange={() => setCheckoutModal(null)}>
        <DialogContent className="sm:max-w-[425px] bg-white">
          <DialogHeader>
            <DialogTitle>Checkout</DialogTitle>
          </DialogHeader>
          {checkoutModal && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold mb-2">{checkoutModal.name}</h3>
                <p className="text-sm text-gray-600 mb-3">{checkoutModal.description}</p>
                <div className="flex justify-between items-center text-sm">
                  <span>Product Price:</span>
                  <span>₹{checkoutModal.price}</span>
                </div>
                <div className="flex justify-between items-center text-sm mt-1">
                  <span>Delivery:</span>
                  <span className="text-green-600">Free</span>
                </div>
                <div className="border-t border-gray-300 mt-3 pt-3">
                  <div className="flex justify-between items-center font-semibold text-lg">
                    <span>Total:</span>
                    <span>₹{checkoutModal.price}</span>
                  </div>
                </div>
              </div>
              <Button
                onClick={submitPurchase}
                className="w-full bg-black text-white hover:bg-gray-800"
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                Confirm Purchase
              </Button>
              <p className="text-xs text-gray-500 text-center">
                Secure payment • Free delivery • Easy returns
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Help Application Modal */}
      <Dialog open={!!helpModal} onOpenChange={() => setHelpModal(null)}>
        <DialogContent className="sm:max-w-[425px] bg-white">
          <DialogHeader>
            <DialogTitle>Apply for Support</DialogTitle>
          </DialogHeader>
          {helpModal && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold mb-2">{helpModal.title}</h3>
                <p className="text-sm text-gray-600">{helpModal.description}</p>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">Your Issue/Need</label>
                  <Input
                    placeholder="e.g., Financial constraints, Need guidance"
                    value={helpForm.issue}
                    onChange={(e) => setHelpForm({ ...helpForm, issue: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Brief Description</label>
                  <textarea
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                    rows="3"
                    placeholder="Tell us more about your situation..."
                    value={helpForm.description}
                    onChange={(e) => setHelpForm({ ...helpForm, description: e.target.value })}
                  />
                </div>
              </div>
              <Button
                onClick={submitHelpRequest}
                disabled={!helpForm.issue || !helpForm.description}
                className="w-full bg-black text-white hover:bg-gray-800 disabled:bg-gray-300"
              >
                Submit Application
              </Button>
              <p className="text-xs text-gray-500 text-center">
                Our team will review your application within 24-48 hours
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CareNetwork;
