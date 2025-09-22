import asyncio
from typing import Optional
import logging
from .agent import PokeAgent
from .models import Message, User

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class MessageProcessor:
    def __init__(self, message_queue, users, memories):
        self.agent = PokeAgent()
        self.message_queue = message_queue
        self.users = users
        self.memories = memories
        self.processing = False
        self.message_responses = {}  # Track responses by message_id
    
    async def start_processing(self):
        """Start the message processing loop"""
        self.processing = True
        logger.info("Starting message processor...")
        
        while self.processing:
            try:
                # Get next message from queue
                try:
                    message = self.message_queue.pop()
                except IndexError:
                    message = None
                
                if message:
                    await self._process_message(message)
                else:
                    # No messages, wait
                    await asyncio.sleep(1)
                    
            except Exception as e:
                logger.error(f"Error in message processing loop: {type(e).__name__}")
                # Log full error for debugging in development
                logger.debug(f"Full error details: {e}")
                await asyncio.sleep(5)
    
    async def stop_processing(self):
        """Stop the message processing loop"""
        self.processing = False
        logger.info("Stopping message processor...")
    
    async def _process_message(self, message: Message):
        """Process a single message"""
        try:
            logger.info(f"Processing message {message.message_id} from user {message.user_id}")
            
            # Process through agent
            response = await self.agent.process_message(message.user_id, message.content)
            
            # Store the response mapped to message_id
            self.message_responses[message.message_id] = {
                "response": response,
                "timestamp": __import__('datetime').datetime.now().isoformat(),
                "status": "completed"
            }
            
            # Store the conversation for history
            self._add_conversation(message.user_id, message.content, "user")
            self._add_conversation(message.user_id, response, "agent")
            
            logger.info(f"Generated response for message {message.message_id}: {response[:100]}...")
            
        except Exception as e:
            logger.error(f"Error processing message {message.message_id}: {type(e).__name__}")
            # Store error response
            self.message_responses[message.message_id] = {
                "response": "Sorry, I encountered an error processing your message.",
                "timestamp": __import__('datetime').datetime.now().isoformat(),
                "status": "error"
            }
            logger.debug(f"Full error details: {e}")
    
    
    async def queue_user_message(self, user_id: str, content: str) -> str:
        """Queue a user message for processing and return message_id"""
        try:
            import uuid
            message_id = str(uuid.uuid4())
            
            message = Message(
                user_id=user_id,
                content=content,
                message_type="user",
                message_id=message_id
            )
            
            # Mark as processing
            self.message_responses[message_id] = {
                "response": None,
                "timestamp": __import__('datetime').datetime.now().isoformat(),
                "status": "processing"
            }
            
            self.message_queue.appendleft(message)
            return message_id
            
        except Exception as e:
            logger.error(f"Error queuing message: {type(e).__name__}")
            logger.debug(f"Full error details: {e}")
            return ""
    
    def get_message_response(self, message_id: str) -> dict:
        """Get response for a specific message_id"""
        return self.message_responses.get(message_id, {"status": "not_found"})
    
    def _add_conversation(self, user_id: str, message: str, message_type: str) -> bool:
        """Add conversation to user memory"""
        if user_id not in self.memories:
            from .models import UserMemory
            self.memories[user_id] = UserMemory(user_id=user_id)
        
        self.memories[user_id].conversation_history.append({
            "message": message,
            "type": message_type,
            "timestamp": __import__('datetime').datetime.now().isoformat()
        })
        
        # Keep only last 50 conversations
        if len(self.memories[user_id].conversation_history) > 50:
            self.memories[user_id].conversation_history = self.memories[user_id].conversation_history[-50:]
        
        return True