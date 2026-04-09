from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
from emergentintegrations.llm.chat import LlmChat, UserMessage
import sqlite3
import hashlib


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# SQLite database setup (lightweight for care network)
DB_PATH = ROOT_DIR / 'jeevan.db'

def init_db():
    """Initialize SQLite database and create tables"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT NOT NULL CHECK(role IN ('user', 'doctor', 'sponsor'))
        )
    ''')
    
    # Appointments table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS appointments (
            id TEXT PRIMARY KEY,
            user_name TEXT NOT NULL,
            doctor_name TEXT NOT NULL,
            date TEXT NOT NULL,
            time TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'Pending' CHECK(status IN ('Pending', 'Confirmed'))
        )
    ''')
    
    # Support Requests table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS support_requests (
            id TEXT PRIMARY KEY,
            issue TEXT NOT NULL,
            description TEXT NOT NULL,
            title TEXT NOT NULL,
            type TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'Pending' CHECK(status IN ('Pending', 'Approved', 'Rejected'))
        )
    ''')
    
    # Create default users if not exists
    try:
        # Default doctor
        cursor.execute(
            "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
            ("Dr. Priya", "doctor@jeevan.com", hashlib.sha256("doctor123".encode()).hexdigest(), "doctor")
        )
        # Default sponsor
        cursor.execute(
            "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
            ("Sponsor Admin", "sponsor@jeevan.com", hashlib.sha256("sponsor123".encode()).hexdigest(), "sponsor")
        )
        # Default user
        cursor.execute(
            "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
            ("Test User", "user@jeevan.com", hashlib.sha256("user123".encode()).hexdigest(), "user")
        )
    except sqlite3.IntegrityError:
        pass  # Users already exist
    
    conn.commit()
    conn.close()

# Initialize database on startup
init_db()

def get_db():
    """Get database connection"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")  # Ignore MongoDB's _id field
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

# Chat Models
class ChatRequest(BaseModel):
    message: str
    language: str = "English"  # English, Hindi, Kannada
    session_id: Optional[str] = None

class VideoRecommendation(BaseModel):
    video_id: str
    title: str
    description: str
    thumbnail: str
    url: str

class ChatResponse(BaseModel):
    response: str
    session_id: str
    videos: List[VideoRecommendation] = []

# Login Models
class LoginRequest(BaseModel):
    email: str
    password: str

class LoginResponse(BaseModel):
    success: bool
    user_id: Optional[int] = None
    name: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
    message: Optional[str] = None

# Care Network Models
class AppointmentCreate(BaseModel):
    name: str
    doctor: str
    date: str
    time: str

class Appointment(BaseModel):
    id: str
    name: str
    doctor: str
    date: str
    time: str
    status: str = "Pending"

class SupportRequestCreate(BaseModel):
    issue: str
    description: str
    title: str
    type: str

class SupportRequest(BaseModel):
    id: str
    issue: str
    description: str
    title: str
    type: str
    status: str = "Pending"

class StatusUpdate(BaseModel):
    status: str

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Hello World"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    
    # Convert to dict and serialize datetime to ISO string for MongoDB
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    _ = await db.status_checks.insert_one(doc)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    # Exclude MongoDB's _id field from the query results
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    
    # Convert ISO string timestamps back to datetime objects
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    
    return status_checks

# Video Recommendation Database (Mock data - replace with real YouTube videos)
VIDEO_DATABASE = {
    "menstrual_health": [
        {
            "video_id": "menstrual_1",
            "title": "Understanding Your Menstrual Cycle",
            "description": "Learn about the phases of your menstrual cycle and what's normal.",
            "thumbnail": "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400&h=225&fit=crop",
            "url": "https://www.youtube.com/watch?v=example1"
        },
        {
            "video_id": "menstrual_2",
            "title": "Managing Period Pain Naturally",
            "description": "Natural remedies and tips for reducing menstrual cramps and discomfort.",
            "thumbnail": "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=225&fit=crop",
            "url": "https://www.youtube.com/watch?v=example2"
        }
    ],
    "pcos": [
        {
            "video_id": "pcos_1",
            "title": "PCOS Explained: Symptoms and Management",
            "description": "Understanding PCOS and how to manage symptoms through lifestyle changes.",
            "thumbnail": "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=400&h=225&fit=crop",
            "url": "https://www.youtube.com/watch?v=pcos1"
        },
        {
            "video_id": "pcos_2",
            "title": "PCOS Diet and Nutrition Guide",
            "description": "Dietary recommendations for managing PCOS and improving hormonal balance.",
            "thumbnail": "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400&h=225&fit=crop",
            "url": "https://www.youtube.com/watch?v=pcos2"
        }
    ],
    "nutrition": [
        {
            "video_id": "nutrition_1",
            "title": "Balanced Diet for Women's Health",
            "description": "Essential nutrients and meal planning tips for optimal women's health.",
            "thumbnail": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=225&fit=crop",
            "url": "https://www.youtube.com/watch?v=nutrition1"
        },
        {
            "video_id": "nutrition_2",
            "title": "Iron-Rich Foods for Women",
            "description": "Preventing anemia with iron-rich foods and proper nutrition.",
            "thumbnail": "https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=400&h=225&fit=crop",
            "url": "https://www.youtube.com/watch?v=nutrition2"
        }
    ],
    "mental_health": [
        {
            "video_id": "mental_1",
            "title": "Stress Management Techniques",
            "description": "Effective strategies for managing stress and improving mental well-being.",
            "thumbnail": "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&h=225&fit=crop",
            "url": "https://www.youtube.com/watch?v=mental1"
        },
        {
            "video_id": "mental_2",
            "title": "Mindfulness and Meditation for Beginners",
            "description": "Simple mindfulness practices to reduce anxiety and improve mental health.",
            "thumbnail": "https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=400&h=225&fit=crop",
            "url": "https://www.youtube.com/watch?v=mental2"
        }
    ],
    "exercise": [
        {
            "video_id": "exercise_1",
            "title": "Yoga for Women's Health",
            "description": "Gentle yoga poses specifically beneficial for women's wellness.",
            "thumbnail": "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=225&fit=crop",
            "url": "https://www.youtube.com/watch?v=exercise1"
        },
        {
            "video_id": "exercise_2",
            "title": "Home Workout Routine for Beginners",
            "description": "Simple exercises you can do at home to stay fit and healthy.",
            "thumbnail": "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&h=225&fit=crop",
            "url": "https://www.youtube.com/watch?v=exercise2"
        }
    ],
    "pregnancy": [
        {
            "video_id": "pregnancy_1",
            "title": "Prenatal Care Essentials",
            "description": "Important prenatal health tips and what to expect during pregnancy.",
            "thumbnail": "https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=400&h=225&fit=crop",
            "url": "https://www.youtube.com/watch?v=pregnancy1"
        },
        {
            "video_id": "pregnancy_2",
            "title": "Nutrition During Pregnancy",
            "description": "Essential nutrients and healthy eating during pregnancy.",
            "thumbnail": "https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?w=400&h=225&fit=crop",
            "url": "https://www.youtube.com/watch?v=pregnancy2"
        }
    ],
    "general_wellness": [
        {
            "video_id": "wellness_1",
            "title": "Daily Wellness Habits for Women",
            "description": "Simple daily habits to improve overall health and well-being.",
            "thumbnail": "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=225&fit=crop",
            "url": "https://www.youtube.com/watch?v=wellness1"
        },
        {
            "video_id": "wellness_2",
            "title": "Self-Care Routine Guide",
            "description": "Creating a sustainable self-care routine for better health.",
            "thumbnail": "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&h=225&fit=crop",
            "url": "https://www.youtube.com/watch?v=wellness2"
        }
    ]
}

def detect_intent_and_get_videos(message: str) -> List[VideoRecommendation]:
    """Detect user intent from message and return relevant video recommendations"""
    message_lower = message.lower()
    
    # Check for specific health topics
    if any(word in message_lower for word in ['period', 'menstrual', 'menstruation', 'cycle', 'cramp', 'pms']):
        videos_data = VIDEO_DATABASE.get("menstrual_health", [])
    elif any(word in message_lower for word in ['pcos', 'polycystic', 'ovary', 'ovarian']):
        videos_data = VIDEO_DATABASE.get("pcos", [])
    elif any(word in message_lower for word in ['pregnant', 'pregnancy', 'prenatal', 'baby', 'expecting']):
        videos_data = VIDEO_DATABASE.get("pregnancy", [])
    elif any(word in message_lower for word in ['stress', 'anxiety', 'mental', 'depression', 'worried', 'overwhelmed']):
        videos_data = VIDEO_DATABASE.get("mental_health", [])
    elif any(word in message_lower for word in ['nutrition', 'diet', 'food', 'eat', 'meal', 'vitamin']):
        videos_data = VIDEO_DATABASE.get("nutrition", [])
    elif any(word in message_lower for word in ['exercise', 'workout', 'fitness', 'yoga', 'physical', 'active']):
        videos_data = VIDEO_DATABASE.get("exercise", [])
    else:
        # Default to general wellness
        videos_data = VIDEO_DATABASE.get("general_wellness", [])
    
    # Convert to VideoRecommendation objects (limit to 2-3 videos)
    return [VideoRecommendation(**video) for video in videos_data[:2]]

# Chat endpoint for Jeevan AI chatbot
@api_router.post("/chat", response_model=ChatResponse)
async def chat_with_jeevan(request: ChatRequest):
    # Generate session ID if not provided
    session_id = request.session_id or str(uuid.uuid4())
    
    # Default fallback response (always safe and friendly)
    def get_fallback_response(language: str) -> str:
        fallback_responses = {
            "English": "I'm here to help with your health questions. Could you tell me more about what you'd like to know? I can provide guidance on nutrition, exercise, mental wellness, and general health topics.",
            "Hindi": "मैं आपके स्वास्थ्य प्रश्नों में मदद के लिए यहां हूं। क्या आप मुझे बता सकते हैं कि आप क्या जानना चाहेंगे? मैं पोषण, व्यायाम, मानसिक कल्याण पर मार्गदर्शन प्रदान कर सकता हूं।",
            "Kannada": "ನಿಮ್ಮ ಆರೋಗ್ಯ ಪ್ರಶ್ನೆಗಳಲ್ಲಿ ಸಹಾಯ ಮಾಡಲು ನಾನು ಇಲ್ಲಿದ್ದೇನೆ. ನೀವು ಏನು ತಿಳಿದುಕೊಳ್ಳಲು ಬಯಸುತ್ತೀರಿ? ನಾನು ಪೋಷಣೆ, ವ್ಯಾಯಾಮ, ಮಾನಸಿಕ ಯೋಗಕ್ಷೇಮದ ಬಗ್ಗೆ ಮಾರ್ಗದರ್ಶನ ನೀಡಬಲ್ಲೆ."
        }
        return fallback_responses.get(language, fallback_responses["English"])
    
    # Mock intelligent responses (context-aware fallback system)
    def get_mock_response(message: str, language: str) -> str:
        try:
            message_lower = message.lower()
            
            # English responses
            if language == "English":
                if any(word in message_lower for word in ['hello', 'hi', 'hey', 'greetings']):
                    return "Hello! I'm Jeevan, your health companion. I'm here to help with general health information and guidance. What would you like to know about today?"
                elif any(word in message_lower for word in ['healthy', 'health', 'wellness', 'fit']):
                    return "Great question! Staying healthy involves balanced nutrition, regular exercise, adequate sleep (7-9 hours), and stress management. Stay hydrated and maintain regular health check-ups. This is general guidance - consult a healthcare provider for personalized advice."
                elif any(word in message_lower for word in ['nutrition', 'diet', 'food', 'eat']):
                    return "A balanced diet includes fruits, vegetables, whole grains, lean proteins, and healthy fats. Aim for variety and moderation. Stay hydrated with water. For specific dietary needs, please consult a nutritionist or healthcare provider."
                elif any(word in message_lower for word in ['exercise', 'workout', 'fitness', 'physical activity']):
                    return "Regular physical activity is important - aim for 150 minutes of moderate exercise weekly. This can include walking, yoga, swimming, or any activity you enjoy. Start slowly and build up. Consult your doctor before starting a new exercise routine."
                elif any(word in message_lower for word in ['stress', 'anxiety', 'mental health', 'worried']):
                    return "Mental health is as important as physical health. Try deep breathing, meditation, or talking to loved ones. Regular exercise and good sleep also help. If stress persists, please reach out to a mental health professional."
                elif any(word in message_lower for word in ['pregnancy', 'pregnant', 'prenatal']):
                    return "Pregnancy requires special care - maintain prenatal vitamins, regular check-ups, balanced nutrition, and gentle exercise. Each pregnancy is unique, so please follow your healthcare provider's guidance closely."
                elif any(word in message_lower for word in ['period', 'menstrual', 'cycle', 'menstruation']):
                    return "Menstrual health is important. Track your cycle, manage discomfort with heat packs or gentle exercise, and maintain good hygiene. If you experience unusual changes or severe pain, consult a healthcare provider."
                else:
                    return "I'm here to provide general health guidance for women. I can help with questions about nutrition, exercise, mental wellness, and general health. For specific medical concerns, always consult a healthcare provider. What would you like to know?"
            
            # Hindi responses
            elif language == "Hindi":
                if any(word in message_lower for word in ['hello', 'hi', 'hey', 'namaste', 'नमस्ते', 'हेलो']):
                    return "नमस्ते! मैं जीवन हूं, आपकी स्वास्थ्य साथी। मैं सामान्य स्वास्थ्य जानकारी और मार्गदर्शन के लिए यहां हूं। आज आप क्या जानना चाहेंगी?"
                elif any(word in message_lower for word in ['healthy', 'स्वस्थ', 'स्वास्थ्य', 'सेहत']):
                    return "बहुत अच्छा सवाल! स्वस्थ रहने के लिए संतुलित पोषण, नियमित व्यायाम, पर्याप्त नींद (7-9 घंटे), और तनाव प्रबंधन जरूरी है। पानी पिएं और नियमित स्वास्थ्य जांच कराएं। व्यक्तिगत सलाह के लिए स्वास्थ्य प्रदाता से परामर्श लें।"
                elif any(word in message_lower for word in ['पोषण', 'भोजन', 'आहार', 'खाना', 'diet']):
                    return "संतुलित आहार में फल, सब्जियां, साबुत अनाज, प्रोटीन और स्वस्थ वसा शामिल हैं। विविधता और संयम का ध्यान रखें। पानी पिएं। विशिष्ट आहार आवश्यकताओं के लिए पोषण विशेषज्ञ से परामर्श लें।"
                elif any(word in message_lower for word in ['व्यायाम', 'कसरत', 'exercise']):
                    return "नियमित शारीरिक गतिविधि महत्वपूर्ण है - साप्ताहिक 150 मिनट मध्यम व्यायाम करें। इसमें चलना, योग, तैरना शामिल हो सकता है। धीरे-धीरे शुरू करें। नई व्यायाम दिनचर्या शुरू करने से पहले डॉक्टर से परामर्श लें।"
                elif any(word in message_lower for word in ['तनाव', 'चिंता', 'मानसिक', 'stress']):
                    return "मानसिक स्वास्थ्य उतना ही महत्वपूर्ण है। गहरी सांस लेने, ध्यान, या प्रियजनों से बात करने का प्रयास करें। यदि तनाव बना रहता है, तो मानसिक स्वास्थ्य पेशेवर से संपर्क करें।"
                else:
                    return "मैं महिलाओं के स्वास्थ्य के लिए सामान्य मार्गदर्शन प्रदान करती हूं। मैं पोषण, व्यायाम, मानसिक स्वास्थ्य के बारे में मदद कर सकती हूं। विशिष्ट चिकित्सा चिंताओं के लिए स्वास्थ्य प्रदाता से परामर्श लें। आप क्या जानना चाहेंगी?"
            
            # Kannada responses
            elif language == "Kannada":
                if any(word in message_lower for word in ['hello', 'hi', 'hey', 'namaste', 'ನಮಸ್ಕಾರ']):
                    return "ನಮಸ್ಕಾರ! ನಾನು ಜೀವನ್, ನಿಮ್ಮ ಆರೋಗ್ಯ ಸಹಚರ. ನಾನು ಸಾಮಾನ್ಯ ಆರೋಗ್ಯ ಮಾಹಿತಿ ಮತ್ತು ಮಾರ್ಗದರ್ಶನಕ್ಕಾಗಿ ಇಲ್ಲಿದ್ದೇನೆ. ಇಂದು ನೀವು ಏನು ತಿಳಿದುಕೊಳ್ಳಲು ಬಯಸುತ್ತೀರಿ?"
                elif any(word in message_lower for word in ['healthy', 'ಆರೋಗ್ಯ', 'ಆರೋಗ್ಯವಂತ']):
                    return "ಉತ್ತಮ ಪ್ರಶ್ನೆ! ಆರೋಗ್ಯವಾಗಿರಲು ಸಮತೋಲಿತ ಪೋಷಣೆ, ನಿಯಮಿತ ವ್ಯಾಯಾಮ, ಸಾಕಷ್ಟು ನಿದ್ರೆ (7-9 ಗಂಟೆಗಳು), ಮತ್ತು ಒತ್ತಡ ನಿರ್ವಹಣೆ ಅಗತ್ಯ. ನೀರು ಕುಡಿಯಿರಿ ಮತ್ತು ನಿಯಮಿತ ಆರೋಗ್ಯ ಪರೀಕ್ಷೆಗಳನ್ನು ಮಾಡಿಸಿ. ವೈಯಕ್ತಿಕ ಸಲಹೆಗಾಗಿ ಆರೋಗ್ಯ ಪೂರೈಕೆದಾರರನ್ನು ಸಂಪರ್ಕಿಸಿ."
                elif any(word in message_lower for word in ['ಪೋಷಣೆ', 'ಆಹಾರ', 'ತಿನಿಸು', 'diet']):
                    return "ಸಮತೋಲಿತ ಆಹಾರದಲ್ಲಿ ಹಣ್ಣುಗಳು, ತರಕಾರಿಗಳು, ಧಾನ್ಯಗಳು, ಪ್ರೋಟೀನ್ ಮತ್ತು ಆರೋಗ್ಯಕರ ಕೊಬ್ಬುಗಳು ಸೇರಿವೆ. ವೈವಿಧ್ಯತೆ ಮತ್ತು ಮಿತತ್ವವನ್ನು ಗುರಿಯಾಗಿರಿಸಿ. ನೀರು ಕುಡಿಯಿರಿ. ನಿರ್ದಿಷ್ಟ ಆಹಾರ ಅವಶ್ಯಕತೆಗಳಿಗಾಗಿ ಪೋಷಣೆ ತಜ್ಞರನ್ನು ಸಂಪರ್ಕಿಸಿ."
                elif any(word in message_lower for word in ['ವ್ಯಾಯಾಮ', 'exercise']):
                    return "ನಿಯಮಿತ ದೈಹಿಕ ಚಟುವಟಿಕೆ ಮುಖ್ಯ - ವಾರಕ್ಕೆ 150 ನಿಮಿಷಗಳ ಮಧ್ಯಮ ವ್ಯಾಯಾಮ ಮಾಡಿ. ಇದು ನಡೆಯುವುದು, ಯೋಗ, ಈಜು ಸೇರಿರಬಹುದು. ನಿಧಾನವಾಗಿ ಪ್ರಾರಂಭಿಸಿ. ಹೊಸ ವ್ಯಾಯಾಮ ದಿನಚರಿ ಪ್ರಾರಂಭಿಸುವ ಮೊದಲು ವೈದ್ಯರನ್ನು ಸಂಪರ್ಕಿಸಿ."
                elif any(word in message_lower for word in ['ಒತ್ತಡ', 'ಆತಂಕ', 'stress']):
                    return "ಮಾನಸಿಕ ಆರೋಗ್ಯ ಎಷ್ಟೇ ಮುಖ್ಯ. ಆಳವಾದ ಉಸಿರಾಟ, ಧ್ಯಾನ, ಅಥವಾ ಪ್ರೀತಿಪಾತ್ರರೊಂದಿಗೆ ಮಾತನಾಡಲು ಪ್ರಯತ್ನಿಸಿ. ಒತ್ತಡ ಮುಂದುವರಿದರೆ, ಮಾನಸಿಕ ಆರೋಗ್ಯ ವೃತ್ತಿಪರರನ್ನು ಸಂಪರ್ಕಿಸಿ."
                else:
                    return "ನಾನು ಮಹಿಳೆಯರ ಆರೋಗ್ಯಕ್ಕಾಗಿ ಸಾಮಾನ್ಯ ಮಾರ್ಗದರ್ಶನವನ್ನು ಒದಗಿಸುತ್ತೇನೆ. ನಾನು ಪೋಷಣೆ, ವ್ಯಾಯಾಮ, ಮಾನಸಿಕ ಆರೋಗ್ಯದ ಬಗ್ಗೆ ಸಹಾಯ ಮಾಡಬಹುದು. ನಿರ್ದಿಷ್ಟ ವೈದ್ಯಕೀಯ ಕಾಳಜಿಗಳಿಗಾಗಿ ಆರೋಗ್ಯ ಪೂರೈಕೆದಾರರನ್ನು ಸಂಪರ್ಕಿಸಿ. ನೀವು ಏನು ತಿಳಿದುಕೊಳ್ಳಲು ಬಯಸುತ್ತೀರಿ?"
            
            return "Thank you for your question. I'm here to provide general health guidance. For specific medical advice, please consult a healthcare provider."
        
        except Exception as e:
            # If anything fails in mock response, use ultimate fallback
            logger.error(f"Mock response error: {str(e)}")
            return get_fallback_response(language)
    
    try:
        # Get context-aware mock response
        bot_response = get_mock_response(request.message, request.language)
        
        # Get relevant video recommendations based on user message intent
        try:
            video_recommendations = detect_intent_and_get_videos(request.message)
        except Exception as video_error:
            # If video detection fails, return empty list (don't break the chat)
            logger.error(f"Video recommendation error: {str(video_error)}")
            video_recommendations = []
        
        return ChatResponse(
            response=bot_response,
            session_id=session_id,
            videos=video_recommendations
        )
        
    except Exception as e:
        # Ultimate fallback - always return a friendly response, never show errors to user
        logger.error(f"Chat endpoint error: {str(e)}")
        
        return ChatResponse(
            response=get_fallback_response(request.language),
            session_id=session_id,
            videos=[]
        )

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# ===== CARE NETWORK API ENDPOINTS =====

# Login
@api_router.post("/login", response_model=LoginResponse)
async def login(login_req: LoginRequest):
    """Simple login endpoint"""
    conn = get_db()
    cursor = conn.cursor()
    
    # Hash password
    password_hash = hashlib.sha256(login_req.password.encode()).hexdigest()
    
    # Check credentials
    cursor.execute(
        "SELECT id, name, email, role FROM users WHERE email = ? AND password = ?",
        (login_req.email, password_hash)
    )
    user = cursor.fetchone()
    conn.close()
    
    if user:
        return LoginResponse(
            success=True,
            user_id=user[0],
            name=user[1],
            email=user[2],
            role=user[3]
        )
    else:
        return LoginResponse(
            success=False,
            message="Invalid email or password"
        )

# Appointments
@api_router.post("/appointments", response_model=Appointment)
async def create_appointment(appointment: AppointmentCreate):
    """Create a new doctor appointment"""
    conn = get_db()
    cursor = conn.cursor()
    
    appointment_id = str(uuid.uuid4())
    cursor.execute(
        "INSERT INTO appointments (id, user_name, doctor_name, date, time, status) VALUES (?, ?, ?, ?, ?, ?)",
        (appointment_id, appointment.name, appointment.doctor, appointment.date, appointment.time, "Pending")
    )
    conn.commit()
    conn.close()
    
    logger.info(f"Appointment created: {appointment_id}")
    return Appointment(
        id=appointment_id,
        name=appointment.name,
        doctor=appointment.doctor,
        date=appointment.date,
        time=appointment.time,
        status="Pending"
    )

@api_router.get("/appointments", response_model=List[Appointment])
async def get_appointments():
    """Get all appointments (for doctor portal)"""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, user_name, doctor_name, date, time, status FROM appointments")
    rows = cursor.fetchall()
    conn.close()
    
    appointments = [
        Appointment(
            id=row[0],
            name=row[1],
            doctor=row[2],
            date=row[3],
            time=row[4],
            status=row[5]
        )
        for row in rows
    ]
    return appointments

@api_router.patch("/appointments/{appointment_id}", response_model=Appointment)
async def update_appointment_status(appointment_id: str, status_update: StatusUpdate):
    """Update appointment status"""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute(
        "UPDATE appointments SET status = ? WHERE id = ?",
        (status_update.status, appointment_id)
    )
    conn.commit()
    
    cursor.execute("SELECT id, user_name, doctor_name, date, time, status FROM appointments WHERE id = ?", (appointment_id,))
    row = cursor.fetchone()
    conn.close()
    
    if row:
        logger.info(f"Appointment {appointment_id} status updated to {status_update.status}")
        return Appointment(
            id=row[0],
            name=row[1],
            doctor=row[2],
            date=row[3],
            time=row[4],
            status=row[5]
        )
    raise HTTPException(status_code=404, detail="Appointment not found")

# Support Requests
@api_router.post("/support-requests", response_model=SupportRequest)
async def create_support_request(request: SupportRequestCreate):
    """Create a new support request"""
    conn = get_db()
    cursor = conn.cursor()
    
    request_id = str(uuid.uuid4())
    cursor.execute(
        "INSERT INTO support_requests (id, issue, description, title, type, status) VALUES (?, ?, ?, ?, ?, ?)",
        (request_id, request.issue, request.description, request.title, request.type, "Pending")
    )
    conn.commit()
    conn.close()
    
    logger.info(f"Support request created: {request_id}")
    return SupportRequest(
        id=request_id,
        issue=request.issue,
        description=request.description,
        title=request.title,
        type=request.type,
        status="Pending"
    )

@api_router.get("/support-requests", response_model=List[SupportRequest])
async def get_support_requests():
    """Get all support requests (for sponsor portal)"""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, issue, description, title, type, status FROM support_requests")
    rows = cursor.fetchall()
    conn.close()
    
    requests = [
        SupportRequest(
            id=row[0],
            issue=row[1],
            description=row[2],
            title=row[3],
            type=row[4],
            status=row[5]
        )
        for row in rows
    ]
    return requests

@api_router.patch("/support-requests/{request_id}", response_model=SupportRequest)
async def update_support_request_status(request_id: str, status_update: StatusUpdate):
    """Update support request status"""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute(
        "UPDATE support_requests SET status = ? WHERE id = ?",
        (status_update.status, request_id)
    )
    conn.commit()
    
    cursor.execute("SELECT id, issue, description, title, type, status FROM support_requests WHERE id = ?", (request_id,))
    row = cursor.fetchone()
    conn.close()
    
    if row:
        logger.info(f"Support request {request_id} status updated to {status_update.status}")
        return SupportRequest(
            id=row[0],
            issue=row[1],
            description=row[2],
            title=row[3],
            type=row[4],
            status=row[5]
        )
    raise HTTPException(status_code=404, detail="Support request not found")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()