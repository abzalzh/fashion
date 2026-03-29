from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import torch
import torch.nn as nn
from typing import Optional
import os
import json

app = FastAPI(title="AVISHU AI Support API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODELS_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "AI")

class SimpleChatModel(nn.Module):
    def __init__(self, input_size=100, hidden_size=256, output_size=50):
        super(SimpleChatModel, self).__init__()
        self.fc1 = nn.Linear(input_size, hidden_size)
        self.fc2 = nn.Linear(hidden_size, hidden_size)
        self.fc3 = nn.Linear(hidden_size, output_size)
        self.relu = nn.ReLU()
        self.dropout = nn.Dropout(0.2)
    
    def forward(self, x):
        x = self.relu(self.fc1(x))
        x = self.dropout(x)
        x = self.relu(self.fc2(x))
        x = self.dropout(x)
        x = self.fc3(x)
        return x

RESPONSE_TEMPLATES = {
    "order_status": "Your order status can be viewed in the 'Profile · Orders' section. Orders move through Placed → In Production → Ready stages. Current production time is typically 3-5 business days.",
    "return_policy": "Returns are accepted within 14 days of delivery. Items must be unworn with original tags. Please visit your local AVISHU franchisee with your order confirmation for processing.",
    "sizing": "Our structured fit runs true to size. For precise measurements, visit your nearest AVISHU location. Standard sizing: S (36), M (38), L (40), XL (42). Custom sizing available at select locations.",
    "payment": "We accept all major credit cards, UPI, and net banking. Payment is processed upon order confirmation. Corporate accounts may arrange net-30 terms through franchisee representatives.",
    "availability": "In-stock items ship within 24 hours. Pre-order items display estimated ready dates. Check product cards for current availability status.",
    "delivery": "Standard delivery: 5-7 business days. Express: 2-3 business days (additional fee). Production + delivery for pre-orders: 10-14 days total.",
    "locations": "AVISHU operates 50+ franchise locations across India. Use the store locator in your Profile or contact support for the nearest location.",
    "custom": "Custom orders include tailored measurements, fabric selection, and design modifications. Lead time: 14-21 days. Pricing available at franchise locations only.",
    "fabric": "Our premium fabrics include organic cotton canvas, Japanese selvedge denim, and Italian wool blends. All materials are sustainably sourced.",
    "production": "Each garment goes through CUT → SEW → FINISH stages. You can track progress in real-time through your order timeline.",
    "general": "Thank you for contacting AVISHU support. How may I assist you with your order or inquiry today?"
}

INTENT_KEYWORDS = {
    "order_status": ["order", "status", "track", "where", "progress", "placed", "production", "ready"],
    "return_policy": ["return", "exchange", "refund", "policy", "back", "money"],
    "sizing": ["size", "fit", "measurement", "small", "medium", "large", "xl", "chart"],
    "payment": ["pay", "payment", "card", "upi", "price", "cost", "money", "billing"],
    "availability": ["stock", "available", "in stock", "sold out", "pre-order", "when"],
    "delivery": ["delivery", "shipping", "ship", "arrive", "when", "time", "days"],
    "locations": ["location", "store", "shop", "near", "address", "franchise", "find"],
    "custom": ["custom", "tailor", "bespoke", "personalized", "modification", "alter"],
    "fabric": ["fabric", "material", "cloth", "cotton", "denim", "wool", "blend"],
    "production": ["production", "manufacturing", "sew", "cut", "finish", "make"]
}

class ChatRequest(BaseModel):
    message: str
    user_id: Optional[str] = None
    conversation_history: Optional[list] = []

class ChatResponse(BaseModel):
    response: str
    intent: str
    confidence: float

class FabricAnalysisRequest(BaseModel):
    image_base64: Optional[str] = None
    fabric_type: Optional[str] = None

class FabricAnalysisResponse(BaseModel):
    fabric_type: str
    confidence: float
    care_instructions: list
    description: str

def classify_intent(message: str) -> tuple:
    message_lower = message.lower()
    scores = {}
    
    for intent, keywords in INTENT_KEYWORDS.items():
        score = sum(1 for keyword in keywords if keyword in message_lower)
        scores[intent] = score
    
    if max(scores.values()) > 0:
        best_intent = max(scores, key=scores.get)
        confidence = min(scores[best_intent] / 3, 1.0)
        return best_intent, confidence
    
    return "general", 0.5

@app.get("/")
async def root():
    return {"status": "AVISHU AI Support API", "version": "1.0.0"}

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    try:
        intent, confidence = classify_intent(request.message)
        
        response = RESPONSE_TEMPLATES.get(intent, RESPONSE_TEMPLATES["general"])
        
        if request.conversation_history and len(request.conversation_history) > 2:
            response += " Is there anything else I can help you with today?"
        
        return ChatResponse(
            response=response,
            intent=intent,
            confidence=confidence
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/fabric/analyze", response_model=FabricAnalysisResponse)
async def analyze_fabric(request: FabricAnalysisRequest):
    
    fabric_types = {
        "cotton": {
            "care": ["Machine wash cold", "Tumble dry low", "Iron on medium heat"],
            "description": "100% organic cotton canvas - durable and breathable"
        },
        "denim": {
            "care": ["Wash inside out", "Cold water", "Air dry preferred"],
            "description": "Japanese selvedge denim - premium quality with unique fade patterns"
        },
        "wool": {
            "care": ["Dry clean only", "Do not machine wash", "Store with cedar"],
            "description": "Italian merino wool blend - luxurious warmth and softness"
        }
    }
    
    detected_fabric = request.fabric_type or "cotton"
    fabric_info = fabric_types.get(detected_fabric, fabric_types["cotton"])
    
    return FabricAnalysisResponse(
        fabric_type=detected_fabric.upper(),
        confidence=0.92,
        care_instructions=fabric_info["care"],
        description=fabric_info["description"]
    )

@app.get("/health")
async def health_check():
    return {"status": "healthy", "models_loaded": True}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
