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

import random

# Video Recommendation Database with verified YouTube videos
VIDEO_DATABASE = {
    "menstrual_health": [
        {
            "video_id": "OQEQe2M_U6k",
            "title": "Menstrual Cycle Explained",
            "description": "Understanding your menstrual cycle phases and hormones.",
            "thumbnail": "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400&h=225&fit=crop",
            "url": "https://www.youtube.com/watch?v=OQEQe2M_U6k"
        },
        {
            "video_id": "W5ob14PoxI0",
            "title": "Period Pain Relief Tips",
            "description": "Natural ways to manage period pain and cramps.",
            "thumbnail": "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=225&fit=crop",
            "url": "https://www.youtube.com/watch?v=W5ob14PoxI0"
        },
        {
            "video_id": "gdRmxEzBZxU",
            "title": "Menstrual Health Basics",
            "description": "Everything you need to know about periods and menstrual health.",
            "thumbnail": "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400&h=225&fit=crop",
            "url": "https://www.youtube.com/watch?v=gdRmxEzBZxU"
        }
    ],
    "pcos": [
        {
            "video_id": "nSbKjZiKfvg",
            "title": "What is PCOS?",
            "description": "Understanding Polycystic Ovary Syndrome symptoms and causes.",
            "thumbnail": "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=400&h=225&fit=crop",
            "url": "https://www.youtube.com/watch?v=nSbKjZiKfvg"
        },
        {
            "video_id": "tgIflR_erdc",
            "title": "PCOS Diet Guide",
            "description": "Best foods and nutrition tips for managing PCOS naturally.",
            "thumbnail": "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400&h=225&fit=crop",
            "url": "https://www.youtube.com/watch?v=tgIflR_erdc"
        },
        {
            "video_id": "kSo4W2pKd1M",
            "title": "PCOS Treatment Options",
            "description": "Medical and lifestyle approaches to managing PCOS symptoms.",
            "thumbnail": "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=400&h=225&fit=crop",
            "url": "https://www.youtube.com/watch?v=kSo4W2pKd1M"
        }
    ],
    "nutrition": [
        {
            "video_id": "AWogJXsgk0Y",
            "title": "Healthy Eating for Women",
            "description": "Essential nutrition tips and balanced diet guidelines.",
            "thumbnail": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=225&fit=crop",
            "url": "https://www.youtube.com/watch?v=AWogJXsgk0Y"
        },
        {
            "video_id": "R2roVw3E7SY",
            "title": "Iron Rich Foods",
            "description": "Preventing anemia with proper iron intake and nutrition.",
            "thumbnail": "https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=400&h=225&fit=crop",
            "url": "https://www.youtube.com/watch?v=R2roVw3E7SY"
        },
        {
            "video_id": "QTWc-JLh3Fw",
            "title": "Meal Planning Basics",
            "description": "Simple meal planning strategies for busy women.",
            "thumbnail": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=225&fit=crop",
            "url": "https://www.youtube.com/watch?v=QTWc-JLh3Fw"
        }
    ],
    "mental_health": [
        {
            "video_id": "inpok4MKVLM",
            "title": "5 Minute Stress Relief",
            "description": "Quick and effective stress management techniques.",
            "thumbnail": "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&h=225&fit=crop",
            "url": "https://www.youtube.com/watch?v=inpok4MKVLM"
        },
        {
            "video_id": "ZToicYcHIOU",
            "title": "Mindfulness Meditation",
            "description": "Beginner-friendly meditation for anxiety and stress.",
            "thumbnail": "https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=400&h=225&fit=crop",
            "url": "https://www.youtube.com/watch?v=ZToicYcHIOU"
        },
        {
            "video_id": "8jPQjjsBbIc",
            "title": "Mental Health Tips",
            "description": "Daily practices to improve mental wellness and mood.",
            "thumbnail": "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&h=225&fit=crop",
            "url": "https://www.youtube.com/watch?v=8jPQjjsBbIc"
        }
    ],
    "exercise": [
        {
            "video_id": "v7AYKMP6rOE",
            "title": "Beginner Yoga Flow",
            "description": "Gentle yoga routine perfect for beginners.",
            "thumbnail": "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=225&fit=crop",
            "url": "https://www.youtube.com/watch?v=v7AYKMP6rOE"
        },
        {
            "video_id": "UBMk30rjy0o",
            "title": "Home Workout Routine",
            "description": "No-equipment exercises you can do at home.",
            "thumbnail": "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&h=225&fit=crop",
            "url": "https://www.youtube.com/watch?v=UBMk30rjy0o"
        },
        {
            "video_id": "sTANio_2E0Q",
            "title": "Walking for Health",
            "description": "Benefits of walking and how to get started.",
            "thumbnail": "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=225&fit=crop",
            "url": "https://www.youtube.com/watch?v=sTANio_2E0Q"
        }
    ],
    "pregnancy": [
        {
            "video_id": "YvoanB28PF4",
            "title": "Prenatal Care Essentials",
            "description": "Important health tips for a healthy pregnancy.",
            "thumbnail": "https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=400&h=225&fit=crop",
            "url": "https://www.youtube.com/watch?v=YvoanB28PF4"
        },
        {
            "video_id": "Dna_ZqAUnZE",
            "title": "Pregnancy Nutrition",
            "description": "What to eat during pregnancy for you and baby's health.",
            "thumbnail": "https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?w=400&h=225&fit=crop",
            "url": "https://www.youtube.com/watch?v=Dna_ZqAUnZE"
        },
        {
            "video_id": "nM-ySWyID9o",
            "title": "Pregnancy Exercise Guide",
            "description": "Safe exercises during pregnancy for each trimester.",
            "thumbnail": "https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=400&h=225&fit=crop",
            "url": "https://www.youtube.com/watch?v=nM-ySWyID9o"
        }
    ],
    "hygiene": [
        {
            "video_id": "p40Q1GzVvXc",
            "title": "Personal Hygiene Basics",
            "description": "Essential hygiene practices for women's health.",
            "thumbnail": "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400&h=225&fit=crop",
            "url": "https://www.youtube.com/watch?v=p40Q1GzVvXc"
        },
        {
            "video_id": "TJJ7N5vVEAE",
            "title": "Menstrual Hygiene Tips",
            "description": "Proper period care and hygiene practices.",
            "thumbnail": "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=225&fit=crop",
            "url": "https://www.youtube.com/watch?v=TJJ7N5vVEAE"
        }
    ],
    "general_wellness": [
        {
            "video_id": "aUaInS6HIGo",
            "title": "Daily Wellness Routine",
            "description": "Simple habits for better health and well-being.",
            "thumbnail": "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=225&fit=crop",
            "url": "https://www.youtube.com/watch?v=aUaInS6HIGo"
        },
        {
            "video_id": "R-h1dee2S94",
            "title": "Self-Care Guide",
            "description": "Creating a sustainable self-care routine.",
            "thumbnail": "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&h=225&fit=crop",
            "url": "https://www.youtube.com/watch?v=R-h1dee2S94"
        },
        {
            "video_id": "Z-8YT7Qfv8E",
            "title": "Women's Health Tips",
            "description": "Essential health tips every woman should know.",
            "thumbnail": "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=225&fit=crop",
            "url": "https://www.youtube.com/watch?v=Z-8YT7Qfv8E"
        }
    ]
}

def detect_intent_and_get_videos(message: str) -> List[VideoRecommendation]:
    """Detect user intent from message and return 2-3 randomized relevant video recommendations"""
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
    elif any(word in message_lower for word in ['hygiene', 'clean', 'wash', 'sanitary']):
        videos_data = VIDEO_DATABASE.get("hygiene", [])
    else:
        # Default to general wellness
        videos_data = VIDEO_DATABASE.get("general_wellness", [])
    
    # Randomize and select 2-3 videos
    if len(videos_data) > 3:
        selected_videos = random.sample(videos_data, min(3, len(videos_data)))
    else:
        selected_videos = videos_data[:3]
    
    # Limit to 2-3 videos
    num_videos = random.randint(2, min(3, len(selected_videos)))
    
    # Convert to VideoRecommendation objects
    return [VideoRecommendation(**video) for video in selected_videos[:num_videos]]

# Chat endpoint for Jeevan AI chatbot
@api_router.post("/chat", response_model=ChatResponse)
async def chat_with_jeevan(request: ChatRequest):
    # Generate session ID if not provided
    session_id = request.session_id or str(uuid.uuid4())
    
    try:
        # System message for Jeevan AI (multilingual health companion for women)
        system_messages = {
            "English": "You are Jeevan, an AI health companion for women. Provide short, friendly, and helpful responses about general health, nutrition, exercise, mental wellness, and women's health topics. Keep responses conversational (2-3 sentences). Always remind users to consult healthcare providers for specific medical advice.",
            "Hindi": "आप जीवन हैं, महिलाओं के लिए AI स्वास्थ्य साथी। सामान्य स्वास्थ्य, पोषण, व्यायाम, मानसिक स्वास्थ्य और महिलाओं के स्वास्थ्य विषयों पर संक्षिप्त, मित्रवत और सहायक प्रतिक्रियाएं प्रदान करें। प्रतिक्रियाएं संवादात्मक रखें (2-3 वाक्य)। उपयोगकर्ताओं को विशिष्ट चिकित्सा सलाह के लिए स्वास्थ्य प्रदाता से परामर्श लेने की याद दिलाएं।",
            "Kannada": "ನೀವು ಜೀವನ್, ಮಹಿಳೆಯರಿಗೆ AI ಆರೋಗ್ಯ ಸಹಚರ. ಸಾಮಾನ್ಯ ಆರೋಗ್ಯ, ಪೋಷಣೆ, ವ್ಯಾಯಾಮ, ಮಾನಸಿಕ ಆರೋಗ್ಯ ಮತ್ತು ಮಹಿಳೆಯರ ಆರೋಗ್ಯ ವಿಷಯಗಳ ಬಗ್ಗೆ ಸಂಕ್ಷಿಪ್ತ, ಸ್ನೇಹಪರ ಮತ್ತು ಸಹಾಯಕ ಪ್ರತಿಕ್ರಿಯೆಗಳನ್ನು ನೀಡಿ. ಪ್ರತಿಕ್ರಿಯೆಗಳನ್ನು ಸಂವಾದಾತ್ಮಕವಾಗಿ ಇರಿಸಿ (2-3 ವಾಕ್ಯಗಳು). ನಿರ್ದಿಷ್ಟ ವೈದ್ಯಕೀಯ ಸಲಹೆಗಾಗಿ ಆರೋಗ್ಯ ಪೂರೈಕೆದಾರರನ್ನು ಸಂಪರ್ಕಿಸಲು ಬಳಕೆದಾರರಿಗೆ ನೆನಪಿಸಿ."
        }
        
        system_message = system_messages.get(request.language, system_messages["English"])
        
        # Initialize AI chat
        chat = LlmChat(
            api_key=os.environ.get('EMERGENT_LLM_KEY'),
            session_id=session_id,
            system_message=system_message
        ).with_model("gemini", "gemini-2.5-flash")
        
        # Create user message
        user_message = UserMessage(text=request.message)
        
        # Get AI response
        bot_response = await chat.send_message(user_message)
        
        # Get relevant video recommendations based on user message intent
        try:
            video_recommendations = detect_intent_and_get_videos(request.message)
        except Exception as video_error:
            logger.error(f"Video recommendation error: {str(video_error)}")
            video_recommendations = []
        
        return ChatResponse(
            response=bot_response,
            session_id=session_id,
            videos=video_recommendations
        )
        
    except Exception as e:
        # Fallback response in case of any error
        logger.error(f"Chat endpoint error: {str(e)}")
        
        fallback_responses = {
            "English": "I'm here to help with your health questions. Could you tell me more about what you'd like to know?",
            "Hindi": "मैं आपके स्वास्थ्य प्रश्नों में मदद के लिए यहां हूं। आप क्या जानना चाहेंगे?",
            "Kannada": "ನಿಮ್ಮ ಆರೋಗ್ಯ ಪ್ರಶ್ನೆಗಳಲ್ಲಿ ಸಹಾಯ ಮಾಡಲು ನಾನು ಇಲ್ಲಿದ್ದೇನೆ. ನೀವು ಏನು ತಿಳಿದುಕೊಳ್ಳಲು ಬಯಸುತ್ತೀರಿ?"
        }
        
        return ChatResponse(
            response=fallback_responses.get(request.language, fallback_responses["English"]),
            session_id=session_id,
            videos=[]
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

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()