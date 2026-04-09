import { useState, useRef, useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { MessageCircle, Brain, BookOpen, Users, Shield, CheckCircle, CreditCard, X, Send, Loader2, AlertTriangle, ChevronRight, ArrowLeft } from "lucide-react";
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

// Education Content Database
const EDUCATION_CONTENT = {
  periods: {
    title: { en: "Menstrual Health", hi: "मासिक धर्म स्वास्थ्य", kn: "ಮುಟ್ಟಿನ ಆರೋಗ್ಯ" },
    hook: { en: "Understanding your cycle for better health", hi: "बेहतर स्वास्थ्य के लिए अपने चक्र को समझें", kn: "ಉತ್ತಮ ಆರೋಗ್ಯಕ್ಕಾಗಿ ನಿಮ್ಮ ಚಕ್ರವನ್ನು ಅರ್ಥಮಾಡಿಕೊಳ್ಳಿ" },
    image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&h=400&fit=crop",
    intro: {
      en: "Menstruation is a natural part of reproductive health. Understanding your cycle helps you track your health and identify any concerns early.",
      hi: "मासिक धर्म प्रजनन स्वास्थ्य का एक स्वाभाविक हिस्सा है। अपने चक्र को समझने से आप अपने स्वास्थ्य पर नज़र रख सकते हैं और किसी भी चिंता की पहचान जल्दी कर सकते हैं।",
      kn: "ಋತುಚಕ್ರವು ಸಂತಾನೋತ್ಪತ್ತಿ ಆರೋಗ್ಯದ ನೈಸರ್ಗಿಕ ಭಾಗವಾಗಿದೆ. ನಿಮ್ಮ ಚಕ್ರವನ್ನು ಅರ್ಥಮಾಡಿಕೊಳ್ಳುವುದು ನಿಮ್ಮ ಆರೋಗ್ಯವನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಲು ಸಹಾಯ ಮಾಡುತ್ತದೆ."
    },
    keyPoints: {
      en: ["Normal cycle is 21-35 days", "Period typically lasts 3-7 days", "Track your cycle to notice changes", "Some cramping is normal"],
      hi: ["सामान्य चक्र 21-35 दिनों का होता है", "पीरियड आमतौर पर 3-7 दिनों तक रहता है", "परिवर्तन देखने के लिए अपने चक्र को ट्रैक करें", "कुछ ऐंठन सामान्य है"],
      kn: ["ಸಾಮಾನ್ಯ ಚಕ್ರ 21-35 ದಿನಗಳು", "ಅವಧಿ ಸಾಮಾನ್ಯವಾಗಿ 3-7 ದಿನಗಳು", "ಬದಲಾವಣೆಗಳನ್ನು ಗಮನಿಸಲು ನಿಮ್ಮ ಚಕ್ರವನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಿ", "ಕೆಲವು ನೋವು ಸಾಮಾನ್ಯ"]
    },
    warnings: {
      en: ["Heavy bleeding (soaking pad every 1-2 hours)", "Severe pain that affects daily activities", "Irregular periods that persist", "Bleeding between periods"],
      hi: ["भारी रक्तस्राव (हर 1-2 घंटे में पैड बदलना)", "गंभीर दर्द जो दैनिक गतिविधियों को प्रभावित करता है", "अनियमित पीरियड जो बने रहते हैं", "पीरियड के बीच रक्तस्राव"],
      kn: ["ಅತಿಯಾದ ರಕ್ತಸ್ರಾವ (ಪ್ರತಿ 1-2 ಗಂಟೆಗಳಿಗೊಮ್ಮೆ ಪ್ಯಾಡ್ ತುಂಬುವುದು)", "ದೈನಂದಿನ ಚಟುವಟಿಕೆಗಳ ಮೇಲೆ ಪರಿಣಾಮ ಬೀರುವ ತೀವ್ರ ನೋವು", "ಮುಂದುವರಿಯುವ ಅನಿಯಮಿತ ಅವಧಿಗಳು", "ಅವಧಿಗಳ ನಡುವೆ ರಕ್ತಸ್ರಾವ"]
    },
    tips: {
      en: ["Use heat packs for cramps", "Stay hydrated", "Track your cycle with an app", "Maintain good hygiene", "Eat iron-rich foods"],
      hi: ["ऐंठन के लिए हीट पैक का उपयोग करें", "हाइड्रेटेड रहें", "ऐप से अपने चक्र को ट्रैक करें", "अच्छी स्वच्छता बनाए रखें", "आयरन युक्त खाद्य पदार्थ खाएं"],
      kn: ["ನೋವಿಗೆ ಬಿಸಿ ಪ್ಯಾಕ್ ಬಳಸಿ", "ಹೈಡ್ರೀಕರಿಸಿ", "ಅಪ್ಲಿಕೇಶನ್‌ನೊಂದಿಗೆ ನಿಮ್ಮ ಚಕ್ರವನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಿ", "ಉತ್ತಮ ನೈರ್ಮಲ್ಯ ಕಾಯ್ದುಕೊಳ್ಳಿ", "ಕಬ್ಬಿಣ-ಸಮೃದ್ಧ ಆಹಾರಗಳನ್ನು ತಿನ್ನಿ"]
    }
  },
  hygiene: {
    title: { en: "Personal Hygiene", hi: "व्यक्तिगत स्वच्छता", kn: "ವೈಯಕ್ತಿಕ ನೈರ್ಮಲ್ಯ" },
    hook: { en: "Essential practices for women's wellness", hi: "महिलाओं की भलाई के लिए आवश्यक प्रथाएं", kn: "ಮಹಿಳೆಯರ ಯೋಗಕ್ಷೇಮಕ್ಕಾಗಿ ಅಗತ್ಯ ಅಭ್ಯಾಸಗಳು" },
    image: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=800&h=400&fit=crop",
    intro: {
      en: "Proper hygiene practices are crucial for preventing infections and maintaining overall health. Small daily habits make a big difference.",
      hi: "संक्रमण को रोकने और समग्र स्वास्थ्य बनाए रखने के लिए उचित स्वच्छता प्रथाएं महत्वपूर्ण हैं। छोटी दैनिक आदतें बड़ा अंतर लाती हैं।",
      kn: "ಸೋಂಕುಗಳನ್ನು ತಡೆಗಟ್ಟಲು ಮತ್ತು ಒಟ್ಟಾರೆ ಆರೋಗ್ಯವನ್ನು ಕಾಪಾಡಿಕೊಳ್ಳಲು ಸರಿಯಾದ ನೈರ್ಮಲ್ಯ ಅಭ್ಯಾಸಗಳು ಮುಖ್ಯವಾಗಿವೆ."
    },
    keyPoints: {
      en: ["Change pads/tampons every 4-6 hours", "Wash intimate areas with water", "Wear breathable cotton underwear", "Avoid douching"],
      hi: ["हर 4-6 घंटे में पैड/टैम्पोन बदलें", "अंतरंग क्षेत्रों को पानी से धोएं", "सांस लेने योग्य कॉटन अंडरवियर पहनें", "डाउचिंग से बचें"],
      kn: ["ಪ್ರತಿ 4-6 ಗಂಟೆಗಳಿಗೊಮ್ಮೆ ಪ್ಯಾಡ್‌ಗಳನ್ನು ಬದಲಾಯಿಸಿ", "ಅಂತರಂಗ ಪ್ರದೇಶಗಳನ್ನು ನೀರಿನಿಂದ ತೊಳೆಯಿರಿ", "ಉಸಿರಾಡುವ ಹತ್ತಿ ಒಳಉಡುಪು ಧರಿಸಿ", "ಡೌಚಿಂಗ್ ತಪ್ಪಿಸಿ"]
    },
    warnings: {
      en: ["Unusual discharge with odor", "Itching or burning sensation", "Redness or swelling", "Pain during urination"],
      hi: ["गंध के साथ असामान्य स्राव", "खुजली या जलन", "लालिमा या सूजन", "पेशाब के दौरान दर्द"],
      kn: ["ವಾಸನೆಯೊಂದಿಗೆ ಅಸಾಮಾನ್ಯ ಡಿಸ್ಚಾರ್ಜ್", "ತುರಿಕೆ ಅಥವಾ ಸುಡುವಿಕೆ", "ಕೆಂಪು ಅಥವಾ ಊತ", "ಮೂತ್ರ ವಿಸರ್ಜನೆ ಸಮಯದಲ್ಲಿ ನೋವು"]
    },
    tips: {
      en: ["Use pH-balanced products", "Keep the area dry", "Avoid tight clothing", "Change underwear daily", "Use unscented products"],
      hi: ["pH-संतुलित उत्पादों का उपयोग करें", "क्षेत्र को सूखा रखें", "टाइट कपड़ों से बचें", "रोजाना अंडरवियर बदलें", "बिना सुगंध वाले उत्पादों का उपयोग करें"],
      kn: ["pH-ಸಮತೋಲಿತ ಉತ್ಪನ್ನಗಳನ್ನು ಬಳಸಿ", "ಪ್ರದೇಶವನ್ನು ಒಣಗಿಸಿ", "ಬಿಗಿ ಬಟ್ಟೆ ತಪ್ಪಿಸಿ", "ಪ್ರತಿದಿನ ಒಳಉಡುಪು ಬದಲಾಯಿಸಿ", "ಸುಗಂಧರಹಿತ ಉತ್ಪನ್ನಗಳನ್ನು ಬಳಸಿ"]
    }
  },
  pcos: {
    title: { en: "PCOS Awareness", hi: "PCOS जागरूकता", kn: "PCOS ಅರಿವು" },
    hook: { en: "Managing hormonal health effectively", hi: "हार्मोनल स्वास्थ्य को प्रभावी ढंग से प्रबंधित करना", kn: "ಹಾರ್ಮೋನ್ ಆರೋಗ್ಯವನ್ನು ಪರಿಣಾಮಕಾರಿಯಾಗಿ ನಿರ್ವಹಿಸುವುದು" },
    image: "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=800&h=400&fit=crop",
    intro: {
      en: "PCOS (Polycystic Ovary Syndrome) affects many women. Early detection and lifestyle changes can help manage symptoms effectively.",
      hi: "PCOS (पॉलीसिस्टिक ओवरी सिंड्रोम) कई महिलाओं को प्रभावित करता है। शीघ्र पता लगाना और जीवनशैली में बदलाव लक्षणों को प्रभावी ढंग से प्रबंधित करने में मदद कर सकते हैं।",
      kn: "PCOS (ಪಾಲಿಸಿಸ್ಟಿಕ್ ಓವರಿ ಸಿಂಡ್ರೋಮ್) ಅನೇಕ ಮಹಿಳೆಯರ ಮೇಲೆ ಪರಿಣಾಮ ಬೀರುತ್ತದೆ. ಆರಂಭಿಕ ಪತ್ತೆ ಮತ್ತು ಜೀವನಶೈಲಿ ಬದಲಾವಣೆಗಳು ಲಕ್ಷಣಗಳನ್ನು ನಿರ್ವಹಿಸಲು ಸಹಾಯ ಮಾಡುತ್ತವೆ."
    },
    keyPoints: {
      en: ["Affects 1 in 10 women", "Can cause irregular periods", "Weight management helps", "Treatable with proper care"],
      hi: ["10 में से 1 महिला को प्रभावित करता है", "अनियमित पीरियड का कारण बन सकता है", "वजन प्रबंधन मदद करता है", "उचित देखभाल से इलाज योग्य"],
      kn: ["10 ರಲ್ಲಿ 1 ಮಹಿಳೆಯ ಮೇಲೆ ಪರಿಣಾಮ", "ಅನಿಯಮಿತ ಅವಧಿಗಳಿಗೆ ಕಾರಣವಾಗಬಹುದು", "ತೂಕ ನಿರ್ವಹಣೆ ಸಹಾಯ ಮಾಡುತ್ತದೆ", "ಸರಿಯಾದ ಆರೈಕೆಯೊಂದಿಗೆ ಚಿಕಿತ್ಸೆ ಸಾಧ್ಯ"]
    },
    warnings: {
      en: ["Missed periods for months", "Excessive hair growth", "Severe acne", "Difficulty conceiving", "Rapid weight gain"],
      hi: ["महीनों तक पीरियड मिस होना", "अत्यधिक बालों का बढ़ना", "गंभीर मुंहासे", "गर्भधारण में कठिनाई", "तेजी से वजन बढ़ना"],
      kn: ["ತಿಂಗಳುಗಳವರೆಗೆ ಅವಧಿಗಳು ಕಾಣೆಯಾಗುವುದು", "ಅತಿಯಾದ ಕೂದಲು ಬೆಳವಣಿಗೆ", "ತೀವ್ರ ಮೊಡವೆ", "ಗರ್ಭಧಾರಣೆಯಲ್ಲಿ ತೊಂದರೆ", "ವೇಗದ ತೂಕ ಹೆಚ್ಚಳ"]
    },
    tips: {
      en: ["Maintain healthy weight", "Exercise regularly", "Eat balanced diet", "Monitor symptoms", "Consult gynecologist"],
      hi: ["स्वस्थ वजन बनाए रखें", "नियमित व्यायाम करें", "संतुलित आहार लें", "लक्षणों की निगरानी करें", "स्त्री रोग विशेषज्ञ से परामर्श लें"],
      kn: ["ಆರೋಗ್ಯಕರ ತೂಕ ನಿರ್ವಹಿಸಿ", "ನಿಯಮಿತವಾಗಿ ವ್ಯಾಯಾಮ ಮಾಡಿ", "ಸಮತೋಲಿತ ಆಹಾರ ತೆಗೆದುಕೊಳ್ಳಿ", "ಲಕ್ಷಣಗಳನ್ನು ಮೇಲ್ವಿಚಾರಣೆ ಮಾಡಿ", "ಸ್ತ್ರೀರೋಗತಜ್ಞರನ್ನು ಸಂಪರ್ಕಿಸಿ"]
    }
  },
  mental_health: {
    title: { en: "Mental Wellness", hi: "मानसिक कल्याण", kn: "ಮಾನಸಿಕ ಯೋಗಕ್ಷೇಮ" },
    hook: { en: "Caring for your mind and emotions", hi: "अपने मन और भावनाओं की देखभाल", kn: "ನಿಮ್ಮ ಮನಸ್ಸು ಮತ್ತು ಭಾವನೆಗಳ ಆರೈಕೆ" },
    image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&h=400&fit=crop",
    intro: {
      en: "Mental health is as important as physical health. Recognizing signs of stress, anxiety, or depression early can lead to better outcomes.",
      hi: "मानसिक स्वास्थ्य शारीरिक स्वास्थ्य जितना ही महत्वपूर्ण है। तनाव, चिंता या अवसाद के संकेतों को जल्दी पहचानने से बेहतर परिणाम मिल सकते हैं।",
      kn: "ಮಾನಸಿಕ ಆರೋಗ್ಯವು ದೈಹಿಕ ಆರೋಗ್ಯದಷ್ಟೇ ಮುಖ್ಯ. ಒತ್ತಡ, ಆತಂಕ ಅಥವಾ ಖಿನ್ನತೆಯ ಚಿಹ್ನೆಗಳನ್ನು ಮುಂಚಿತವಾಗಿ ಗುರುತಿಸುವುದು ಉತ್ತಮ ಫಲಿತಾಂಶಗಳಿಗೆ ಕಾರಣವಾಗಬಹುದು."
    },
    keyPoints: {
      en: ["Stress affects physical health too", "It's okay to ask for help", "Self-care is not selfish", "Mental health is treatable"],
      hi: ["तनाव शारीरिक स्वास्थ्य को भी प्रभावित करता है", "मदद मांगना ठीक है", "आत्म-देखभाल स्वार्थी नहीं है", "मानसिक स्वास्थ्य इलाज योग्य है"],
      kn: ["ಒತ್ತಡವು ದೈಹಿಕ ಆರೋಗ್ಯದ ಮೇಲೂ ಪರಿಣಾಮ ಬೀರುತ್ತದೆ", "ಸಹಾಯ ಕೇಳುವುದು ಸರಿ", "ಸ್ವಯಂ-ಆರೈಕೆ ಸ್ವಾರ್ಥಿಯಲ್ಲ", "ಮಾನಸಿಕ ಆರೋಗ್ಯ ಚಿಕಿತ್ಸೆ ಸಾಧ್ಯ"]
    },
    warnings: {
      en: ["Persistent sadness or hopelessness", "Loss of interest in activities", "Changes in sleep or appetite", "Thoughts of self-harm"],
      hi: ["लगातार उदासी या निराशा", "गतिविधियों में रुचि की कमी", "नींद या भूख में बदलाव", "आत्म-हानि के विचार"],
      kn: ["ನಿರಂತರ ದುಃಖ ಅಥವಾ ನಿರಾಶೆ", "ಚಟುವಟಿಕೆಗಳಲ್ಲಿ ಆಸಕ್ತಿ ಕಳೆದುಕೊಳ್ಳುವುದು", "ನಿದ್ರೆ ಅಥವಾ ಹಸಿವಿನಲ್ಲಿ ಬದಲಾವಣೆಗಳು", "ಸ್ವಯಂ-ಹಾನಿಯ ಆಲೋಚನೆಗಳು"]
    },
    tips: {
      en: ["Practice mindfulness daily", "Talk to trusted friends", "Maintain sleep routine", "Exercise regularly", "Seek professional help when needed"],
      hi: ["रोजाना माइंडफुलनेस अभ्यास करें", "विश्वसनीय दोस्तों से बात करें", "नींद की दिनचर्या बनाए रखें", "नियमित व्यायाम करें", "जरूरत पड़ने पर पेशेवर मदद लें"],
      kn: ["ಪ್ರತಿದಿನ ಮೈಂಡ್‌ಫುಲ್‌ನೆಸ್ ಅಭ್ಯಾಸ ಮಾಡಿ", "ವಿಶ್ವಾಸಾರ್ಹ ಸ್ನೇಹಿತರೊಂದಿಗೆ ಮಾತನಾಡಿ", "ನಿದ್ರೆಯ ದಿನಚರಿ ಕಾಯ್ದುಕೊಳ್ಳಿ", "ನಿಯಮಿತವಾಗಿ ವ್ಯಾಯಾಮ ಮಾಡಿ", "ಅಗತ್ಯವಿದ್ದಾಗ ವೃತ್ತಿಪರ ಸಹಾಯ ಪಡೆಯಿರಿ"]
    }
  }
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

      {/* Education Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white" id="education-section" data-testid="education-section">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4" data-testid="education-title">Health Education</h2>
            <p className="text-gray-600 text-base sm:text-lg" data-testid="education-subtitle">Learn about important women's health topics</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Object.keys(EDUCATION_CONTENT).map((topic) => {
              const content = EDUCATION_CONTENT[topic];
              return (
                <Card 
                  key={topic}
                  className="overflow-hidden border-2 border-gray-200 hover:border-black transition-all duration-300 cursor-pointer group"
                  onClick={() => window.location.href = `/education/${topic}`}
                  data-testid={`education-card-${topic}`}
                >
                  <div className="aspect-video overflow-hidden">
                    <img 
                      src={content.image} 
                      alt={content.title.en}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-6 space-y-2">
                    <h3 className="text-xl font-semibold">{content.title.en}</h3>
                    <p className="text-sm text-gray-600">{content.hook.en}</p>
                    <div className="pt-2 flex items-center text-sm font-medium">
                      Learn more <ChevronRight className="h-4 w-4 ml-1" />
                    </div>
                  </div>
                </Card>
              );
            })}
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
        className="fixed w-14 h-14 bg-black text-white rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-200 flex items-center justify-center z-50"
        style={{ bottom: '20px', left: '20px' }}
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

// Education Detail Page Component
const EducationDetail = () => {
  const { topic } = useParams();
  const navigate = useNavigate();
  const [language, setLanguage] = useState("en");
  const [showSummary, setShowSummary] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  
  const content = EDUCATION_CONTENT[topic];
  
  if (!content) {
    return <div className="min-h-screen flex items-center justify-center">
      <p>Topic not found</p>
    </div>;
  }

  const langMap = { en: "English", hi: "Hindi", kn: "Kannada" };

  return (
    <div className="min-h-screen bg-white">
      {/* Header/Navigation */}
      <div className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center text-gray-600 hover:text-black transition-colors"
            data-testid="back-button"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back
          </button>
          
          {/* Language Toggle */}
          <div className="flex gap-2">
            {['en', 'hi', 'kn'].map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className={`px-3 py-1 text-sm rounded-full transition-all ${
                  language === lang
                    ? "bg-black text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
                data-testid={`lang-${lang}`}
              >
                {langMap[lang]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Image */}
        <div className="aspect-[21/9] overflow-hidden rounded-lg mb-8">
          <img 
            src={content.image} 
            alt={content.title[language]}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Title */}
        <h1 className="text-4xl sm:text-5xl font-bold mb-6" data-testid="detail-title">
          {content.title[language]}
        </h1>

        {/* Intro */}
        <p className="text-lg text-gray-700 leading-relaxed mb-8" data-testid="detail-intro">
          {content.intro[language]}
        </p>

        {/* Quick Summary Toggle */}
        <button
          onClick={() => setShowSummary(!showSummary)}
          className="mb-8 px-4 py-2 border-2 border-black text-black hover:bg-black hover:text-white transition-all rounded-lg"
          data-testid="summary-toggle"
        >
          {showSummary ? '− Hide' : '+ Show'} Quick Summary
        </button>

        {showSummary && (
          <div className="mb-8 p-6 bg-gray-50 rounded-lg border-2 border-gray-200" data-testid="quick-summary">
            <h3 className="font-semibold mb-3">Quick Summary:</h3>
            <ul className="space-y-2">
              {content.keyPoints[language].slice(0, 4).map((point, idx) => (
                <li key={idx} className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Key Points */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Key Points</h2>
          <ul className="space-y-3">
            {content.keyPoints[language].map((point, idx) => (
              <li key={idx} className="flex items-start">
                <CheckCircle className="h-5 w-5 mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">{point}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Warning Signs */}
        <div className="mb-8 p-6 bg-yellow-50 border-2 border-yellow-200 rounded-lg" data-testid="warning-signs">
          <div className="flex items-center mb-4">
            <AlertTriangle className="h-6 w-6 mr-2 text-yellow-800" />
            <h2 className="text-2xl font-semibold">Warning Signs</h2>
          </div>
          <p className="text-sm text-gray-600 mb-4">Consult a healthcare provider if you experience:</p>
          <ul className="space-y-2">
            {content.warnings[language].map((warning, idx) => (
              <li key={idx} className="flex items-start text-gray-700">
                <span className="mr-2 text-yellow-800">⚠</span>
                <span>{warning}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Tips & Solutions */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Tips & Solutions</h2>
          <ul className="space-y-3">
            {content.tips[language].map((tip, idx) => (
              <li key={idx} className="flex items-start">
                <span className="mr-3 text-lg">✓</span>
                <span className="text-gray-700">{tip}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Ask Jeevan Button */}
        <div className="my-12 p-8 bg-gray-50 rounded-lg border-2 border-gray-200 text-center">
          <h3 className="text-xl font-semibold mb-3">Have questions about this topic?</h3>
          <p className="text-gray-600 mb-4">Chat with Jeevan to get personalized guidance</p>
          <Button
            onClick={() => setChatOpen(true)}
            className="bg-black text-white hover:bg-gray-800 px-8 py-6 text-lg"
            data-testid="ask-jeevan-button"
          >
            <MessageCircle className="mr-2 h-5 w-5" />
            Ask Jeevan about {content.title[language]}
          </Button>
        </div>

        {/* Related Topics */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <h3 className="text-xl font-semibold mb-4">Related Topics</h3>
          <div className="grid sm:grid-cols-3 gap-4">
            {Object.keys(EDUCATION_CONTENT)
              .filter(t => t !== topic)
              .slice(0, 3)
              .map((relatedTopic) => {
                const related = EDUCATION_CONTENT[relatedTopic];
                return (
                  <button
                    key={relatedTopic}
                    onClick={() => navigate(`/education/${relatedTopic}`)}
                    className="text-left p-4 border-2 border-gray-200 rounded-lg hover:border-black transition-all"
                    data-testid={`related-${relatedTopic}`}
                  >
                    <h4 className="font-semibold mb-1">{related.title[language]}</h4>
                    <p className="text-sm text-gray-600">{related.hook[language]}</p>
                  </button>
                );
              })}
          </div>
        </div>
      </div>

      {/* Chatbot Modal - Simplified version, reuse from LandingPage if needed */}
      <Dialog open={chatOpen} onOpenChange={setChatOpen}>
        <DialogContent className="sm:max-w-[500px] bg-white">
          <DialogHeader>
            <DialogTitle>Chat with Jeevan</DialogTitle>
          </DialogHeader>
          <div className="p-6 text-center">
            <MessageCircle className="h-16 w-16 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">
              This will open the chatbot with context about {content.title[language]}.
            </p>
            <Button
              onClick={() => {
                setChatOpen(false);
                navigate('/', { state: { openChat: true, topic: content.title[language] } });
              }}
              className="bg-black text-white hover:bg-gray-800"
            >
              Start Chat
            </Button>
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
          <Route path="/education/:topic" element={<EducationDetail />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
