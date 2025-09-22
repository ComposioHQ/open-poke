from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import asyncio

from .models import User, UserMemory
from .message_processor import MessageProcessor
from .connection import initiate_connection, get_connection_status
from composio import Composio
from typing import Dict
from collections import deque

app = FastAPI(title="Poke AI Backend", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174"],  # Frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Simple in-memory storage - no Redis needed
users: Dict[str, User] = {}
memories: Dict[str, UserMemory] = {}
message_queue = deque()

# Global instances
message_processor = MessageProcessor(message_queue, users, memories)
composio_client = Composio()

# Request/Response models
class UserCreateRequest(BaseModel):
    connection_id: str
    name: Optional[str] = None


class MessageRequest(BaseModel):
    user_id: str
    content: str


class ConnectionRequest(BaseModel):
    user_id: str
    auth_config_id: str = None


@app.on_event("startup")
async def startup_event():
    """Start the message processor when the API starts"""
    asyncio.create_task(message_processor.start_processing())


@app.on_event("shutdown")
async def shutdown_event():
    """Stop the message processor when the API shuts down"""
    await message_processor.stop_processing()


@app.post("/users", response_model=dict)
async def create_user(request: UserCreateRequest):
    """Create a new user"""
    try:
        user = User(
            connection_id=request.connection_id,
            name=request.name
        )
        
        users[user.connection_id] = user
        return {"user_id": user.connection_id}
            
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/users/{user_id}")
async def get_user(user_id: str):
    """Get user by ID"""
    try:
        user = users.get(user_id)
        if user:
            return user.model_dump()
        else:
            raise HTTPException(status_code=404, detail="User not found")
            
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.post("/connections/initiate")
async def initiate_user_connection(request: ConnectionRequest):
    """Initiate Gmail connection for user"""
    try:
        connected_account = initiate_connection(
            user_id=request.user_id,
            composio_client=composio_client,
            auth_config_id=request.auth_config_id
        )
        
        return {
            "connection_id": connected_account.id,
            "redirect_url": connected_account.redirect_url,
        }
        
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail="Connection failed")


@app.get("/connections/{connection_id}/status")
async def check_connection_status(connection_id: str):
    """Check connection status"""
    try:
        status = get_connection_status(
            connected_account_id=connection_id,
            composio_client=composio_client
        )
        
        return {"status": status.status, "connection_id": connection_id}
        
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail="Unable to check connection status")


@app.post("/messages")
async def send_message(request: MessageRequest):
    """Send a message to the agent"""
    try:
        # Check if user exists
        user = users.get(request.user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Queue the message for processing and get message_id
        message_id = await message_processor.queue_user_message(request.user_id, request.content)
        
        if message_id:
            return {"message_id": message_id, "status": "queued"}
        else:
            raise HTTPException(status_code=500, detail="Failed to queue message")
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail="Message processing failed")


@app.get("/messages/{message_id}/response")
async def get_message_response(message_id: str):
    """Get response for a specific message"""
    try:
        response_data = message_processor.get_message_response(message_id)
        if response_data.get("status") == "not_found":
            raise HTTPException(status_code=404, detail="Message not found")
        return response_data
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to get message response")


@app.get("/users/{user_id}/memory")
async def get_user_memory(user_id: str):
    """Get user memory and insights"""
    try:
        if user_id not in memories:
            memories[user_id] = UserMemory(user_id=user_id)
        return memories[user_id].model_dump()
        
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail="Unable to retrieve user memory")


@app.get("/users/{user_id}/conversations")
async def get_user_conversations(user_id: str):
    """Get user conversation history"""
    try:
        if user_id not in memories:
            memories[user_id] = UserMemory(user_id=user_id)
        return {"conversations": memories[user_id].conversation_history}
        
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail="Unable to retrieve conversations")


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}