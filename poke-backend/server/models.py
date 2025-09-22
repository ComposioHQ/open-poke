from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class User(BaseModel):
    connection_id: str
    name: Optional[str] = None


class Message(BaseModel):
    user_id: str
    content: str
    message_type: str  # "user", "agent", "system"
    timestamp: datetime = datetime.now()
    message_id: str = ""


class UserMemory(BaseModel):
    user_id: str
    conversation_history: list = []