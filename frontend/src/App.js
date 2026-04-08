import { useState, useRef, useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { MessageCircle, Brain, BookOpen, Users, Shield, CheckCircle, CreditCard, X, Send, Loader2 } from "lucide-react";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// VideoCard Component
const VideoCard = ({ video }) => {
  return (
    <div 
      className="border border-gray-200 rounded-lg overflow-hidden hover:border-black transition-all duration-200 bg-white"
      data-testid="video-card"
    >
      <div className="flex gap-3 p-3">
        {/* Thumbnail */}
        <div className="flex-shrink-0">
          <img 
            src={video.thumbnail} 
            alt={video.title}
            className="w-32 h-20 object-cover rounded bg-gray-100"
            onError={(e) => {
              e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="128" height="80" viewBox="0 0 128 80"%3E%3Crect fill="%23f3f4f6" width="128" height="80"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="14" fill="%239ca3af"%3EVideo%3C/text%3E%3C/svg%3E';
            }}
          />
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm text-black mb-1 line-clamp-2">
            {video.title}
          </h4>
          <p className="text-xs text-gray-600 mb-2 line-clamp-2">
            {video.description}
          </p>
          <a
            href={video.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-xs font-medium text-black hover:underline"
            data-testid="watch-video-button"
          >
            Watch →
          </a>
        </div>
      </div>
    </div>
  );
};

const LandingPage = () => {
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [language, setLanguage] = useState("English");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize chat with welcome message
  useEffect(() => {
    if (chatOpen && messages.length === 0) {
      const welcomeMessages = {
        "English": "Hello! I'm Jeevan, your AI health companion. How can I help you today?",
        "Hindi": "नमस्ते! मैं जीवन हूं, आपका AI स्वास्थ्य साथी। आज मैं आपकी कैसे मदद कर सकता हूं?",
        "Kannada": "ನಮಸ್ಕಾರ! ನಾನು ಜೀವನ್, ನಿಮ್ಮ AI ಆರೋಗ್ಯ ಸಹಚರ. ಇಂದು ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು?"
      };
      setMessages([{
        role: 'bot',
        text: welcomeMessages[language],
        timestamp: new Date()
      }]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatOpen, language]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      role: 'user',
      text: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const response = await axios.post(`${API}/chat`, {
        message: inputMessage,
        language: language,
        session_id: sessionId
      });

      setSessionId(response.data.session_id);

      const botMessage = {
        role: 'bot',
        text: response.data.response,
        videos: response.data.videos || [],
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage = {
        role: 'bot',
        text: "I'm having trouble connecting right now. Please try again.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const resetChat = () => {
    setMessages([]);
    setSessionId(null);
  };

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8" data-testid="hero-section">
        <div className="max-w-5xl w-full text-center space-y-8 py-20">
          {/* Logo/Brand */}
          <div className="space-y-2" data-testid="brand-header">
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight" data-testid="main-title">
              Jeevan
            </h1>
            <p className="text-xl sm:text-2xl font-light text-gray-600" data-testid="tagline">
              Your AI Health Companion
            </p>
          </div>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed" data-testid="subtitle">
            Multilingual support for women's health in English, Hindi, and Kannada
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4" data-testid="cta-buttons">
            <Button 
              size="lg" 
              className="bg-black text-white hover:bg-gray-800 px-8 py-6 text-base sm:text-lg rounded-lg transition-all duration-200 w-full sm:w-auto"
              onClick={() => setChatOpen(true)}
              data-testid="start-chat-button"
            >
              <MessageCircle className="mr-2 h-5 w-5" />
              Start Chat
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-2 border-black text-black hover:bg-black hover:text-white px-8 py-6 text-base sm:text-lg rounded-lg transition-all duration-200 w-full sm:w-auto"
              onClick={() => scrollToSection('education')}
              data-testid="explore-education-button"
            >
              <BookOpen className="mr-2 h-5 w-5" />
              Explore Education
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50" data-testid="features-section">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4" data-testid="features-title">Features</h2>
            <p className="text-gray-600 text-base sm:text-lg" data-testid="features-subtitle">Everything you need for comprehensive health support</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 - AI Chatbot */}
            <Card className="p-8 border-2 border-gray-200 hover:border-black transition-all duration-300 bg-white" data-testid="feature-ai-chatbot">
              <div className="space-y-4">
                <div className="w-12 h-12 bg-black text-white rounded-lg flex items-center justify-center">
                  <Brain className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold">AI Chatbot</h3>
                <p className="text-gray-600 leading-relaxed">
                  Get instant, personalized health guidance from our intelligent AI assistant available 24/7 in your preferred language.
                </p>
              </div>
            </Card>

            {/* Feature 2 - Education */}
            <Card className="p-8 border-2 border-gray-200 hover:border-black transition-all duration-300 bg-white" data-testid="feature-education">
              <div className="space-y-4">
                <div className="w-12 h-12 bg-black text-white rounded-lg flex items-center justify-center">
                  <BookOpen className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold">Education</h3>
                <p className="text-gray-600 leading-relaxed">
                  Access curated health resources, articles, and educational content tailored to women's health needs and concerns.
                </p>
              </div>
            </Card>

            {/* Feature 3 - Care Network */}
            <Card className="p-8 border-2 border-gray-200 hover:border-black transition-all duration-300 bg-white" data-testid="feature-care-network">
              <div className="space-y-4">
                <div className="w-12 h-12 bg-black text-white rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold">Care Network</h3>
                <p className="text-gray-600 leading-relaxed">
                  Connect with verified healthcare professionals and support communities for comprehensive care and guidance.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white" id="education" data-testid="how-it-works-section">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4" data-testid="how-it-works-title">How It Works</h2>
            <p className="text-gray-600 text-base sm:text-lg" data-testid="how-it-works-subtitle">Simple steps to better health</p>
          </div>

          <div className="grid md:grid-cols-3 gap-12 relative">
            {/* Step 1 - Ask */}
            <div className="text-center space-y-4" data-testid="step-ask">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-black text-white rounded-full text-2xl font-bold mb-4">
                1
              </div>
              <h3 className="text-2xl font-semibold">Ask</h3>
              <p className="text-gray-600 leading-relaxed">
                Share your health questions or concerns with our AI chatbot in your preferred language.
              </p>
            </div>

            {/* Arrow for desktop */}
            <div className="hidden md:flex items-center justify-center">
              <div className="text-gray-300 text-4xl">→</div>
            </div>

            {/* Step 2 - Learn */}
            <div className="text-center space-y-4" data-testid="step-learn">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-black text-white rounded-full text-2xl font-bold mb-4">
                2
              </div>
              <h3 className="text-2xl font-semibold">Learn</h3>
              <p className="text-gray-600 leading-relaxed">
                Receive personalized guidance and access educational resources tailored to your needs.
              </p>
            </div>

            {/* Arrow for desktop */}
            <div className="hidden md:flex items-center justify-center">
              <div className="text-gray-300 text-4xl">→</div>
            </div>

            {/* Step 3 - Act */}
            <div className="text-center space-y-4" data-testid="step-act">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-black text-white rounded-full text-2xl font-bold mb-4">
                3
              </div>
              <h3 className="text-2xl font-semibold">Act</h3>
              <p className="text-gray-600 leading-relaxed">
                Take informed actions and connect with our verified care network for professional support.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50" data-testid="trust-section">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4" data-testid="trust-title">Your Trust Matters</h2>
            <p className="text-gray-600 text-base sm:text-lg" data-testid="trust-subtitle">Built with security and privacy at the core</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Trust 1 - Privacy */}
            <div className="text-center space-y-4" data-testid="trust-privacy">
              <div className="inline-flex items-center justify-center w-16 h-16 border-2 border-black rounded-full mb-4">
                <Shield className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold">Privacy First</h3>
              <p className="text-gray-600 leading-relaxed">
                Your health data is encrypted and protected with industry-leading security standards.
              </p>
            </div>

            {/* Trust 2 - Verified Support */}
            <div className="text-center space-y-4" data-testid="trust-verified">
              <div className="inline-flex items-center justify-center w-16 h-16 border-2 border-black rounded-full mb-4">
                <CheckCircle className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold">Verified Support</h3>
              <p className="text-gray-600 leading-relaxed">
                All healthcare professionals in our network are verified and certified experts.
              </p>
            </div>

            {/* Trust 3 - Secure Payments */}
            <div className="text-center space-y-4" data-testid="trust-payments">
              <div className="inline-flex items-center justify-center w-16 h-16 border-2 border-black rounded-full mb-4">
                <CreditCard className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold">Secure Payments</h3>
              <p className="text-gray-600 leading-relaxed">
                All transactions are processed through secure, PCI-compliant payment gateways.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white py-12 px-4 sm:px-6 lg:px-8" data-testid="footer">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {/* Brand */}
            <div className="space-y-4">
              <h3 className="text-2xl font-bold" data-testid="footer-brand">Jeevan</h3>
              <p className="text-gray-400 max-w-md">
                Your AI Health Companion for comprehensive women's health support in English, Hindi, and Kannada.
              </p>
            </div>

            {/* Links */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
              <div className="flex flex-col space-y-2">
                <a href="#about" className="text-gray-400 hover:text-white transition-colors" data-testid="footer-about">About</a>
                <a href="#contact" className="text-gray-400 hover:text-white transition-colors" data-testid="footer-contact">Contact</a>
                <a href="#privacy" className="text-gray-400 hover:text-white transition-colors" data-testid="footer-privacy">Privacy Policy</a>
                <a href="#terms" className="text-gray-400 hover:text-white transition-colors" data-testid="footer-terms">Terms of Service</a>
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div className="pt-8 border-t border-gray-800 text-center text-gray-400" data-testid="footer-copyright">
            <p>© {new Date().getFullYear()} Jeevan. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Floating Chatbot Button */}
      <button
        onClick={() => setChatOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-black text-white rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-200 flex items-center justify-center z-50"
        data-testid="floating-chat-button"
        aria-label="Open chat"
      >
        <MessageCircle className="h-6 w-6" />
      </button>

      {/* Chatbot Modal */}
      <Dialog open={chatOpen} onOpenChange={(open) => {
        setChatOpen(open);
        if (!open) resetChat();
      }}>
        <DialogContent className="sm:max-w-[550px] max-h-[700px] bg-white flex flex-col p-0" data-testid="chatbot-modal">
          <DialogHeader className="p-6 pb-4 border-b border-gray-200">
            <DialogTitle className="text-2xl font-bold flex items-center justify-between">
              <span>Chat with Jeevan</span>
              <button 
                onClick={() => setChatOpen(false)} 
                className="hover:bg-gray-100 p-1 rounded-full transition-colors"
                data-testid="close-chat-button"
              >
                <X className="h-5 w-5" />
              </button>
            </DialogTitle>
            
            {/* Language Toggle */}
            <div className="flex gap-2 mt-4">
              {["English", "Hindi", "Kannada"].map((lang) => (
                <button
                  key={lang}
                  onClick={() => {
                    setLanguage(lang);
                    resetChat();
                  }}
                  className={`px-3 py-1 text-sm rounded-full transition-all ${
                    language === lang
                      ? "bg-black text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                  data-testid={`language-${lang.toLowerCase()}`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </DialogHeader>
          
          {/* Chat Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4" data-testid="chat-messages" style={{ minHeight: '400px', maxHeight: '450px' }}>
            {messages.map((msg, index) => (
              <div key={index}>
                {/* Message Bubble */}
                <div
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  data-testid={`message-${msg.role}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      msg.role === 'user'
                        ? 'bg-black text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                  </div>
                </div>
                
                {/* Video Cards - Show only for bot messages with videos */}
                {msg.role === 'bot' && msg.videos && msg.videos.length > 0 && (
                  <div className="flex justify-start mt-3">
                    <div className="max-w-[80%] space-y-2">
                      {msg.videos.map((video, videoIndex) => (
                        <VideoCard key={videoIndex} video={video} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-2xl px-4 py-3">
                  <Loader2 className="h-5 w-5 animate-spin text-gray-600" />
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="flex gap-2">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={
                  language === "English" ? "Type your message..." :
                  language === "Hindi" ? "अपना संदेश लिखें..." :
                  "ನಿಮ್ಮ ಸಂದೇಶವನ್ನು ಟೈಪ್ ಮಾಡಿ..."
                }
                className="flex-1 border-gray-300 focus:border-black focus:ring-black"
                disabled={isLoading}
                data-testid="chat-input"
              />
              <Button
                onClick={sendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="bg-black text-white hover:bg-gray-800 disabled:bg-gray-300"
                data-testid="send-button"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Jeevan provides general health guidance. Always consult a healthcare provider for medical advice.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
