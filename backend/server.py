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


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

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

class ChatResponse(BaseModel):
    response: str
    session_id: str

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

# Chat endpoint for Jeevan AI chatbot
@api_router.post("/chat", response_model=ChatResponse)
async def chat_with_jeevan(request: ChatRequest):
    try:
        # Generate session ID if not provided
        session_id = request.session_id or str(uuid.uuid4())
        
        # Mock intelligent responses for demo (can be replaced with real API later)
        # This provides context-aware responses for women's health queries
        def get_mock_response(message: str, language: str) -> str:
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
        
        # Get mock response
        bot_response = get_mock_response(request.message, request.language)
        
        return ChatResponse(
            response=bot_response,
            session_id=session_id
        )
        
    except Exception as e:
        logger.error(f"Chat error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Chat service error: {str(e)}")

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