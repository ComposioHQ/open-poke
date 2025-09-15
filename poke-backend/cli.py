#!/usr/bin/env python3

import asyncio
import os
import sys
from typing import Optional
import argparse
import uuid
from datetime import datetime
import time
import random

# Add the server directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'server'))

from server.agent import PokeAgent
from server.models import User
from server.connection import initiate_connection, get_connection_status
from composio import Composio


class PokeChat:
    def __init__(self):
        self.agent = PokeAgent()
        self.composio_client = Composio()
        self.current_user_id = None
        self.gmail_connected = False
    
    def print_slow(self, text: str, delay: float = 0.03):
        """Print text with typing effect"""
        for char in text:
            print(char, end='', flush=True)
            time.sleep(delay)
        print()
    
    def print_agent_message(self, message: str):
        """Print agent message with nice formatting"""
        print(f"\n🤖 ", end='')
        self.print_slow(message, 0.02)
    
    async def setup_user(self) -> str:
        """Setup user with guided questions"""
        print("\n" + "="*50)
        print("🚀 Welcome to Poke AI!")
        print("="*50)
        
        self.print_slow("\nI'm your personal AI assistant. Let me get to know you better!")
        
        # Get basic info
        name = input("\n👤 What's your name? ").strip()
        email = input("📧 What's your email? (optional) ").strip() or None
        
        # Create user
        user_id = str(uuid.uuid4())
        user = User(
            connection_id=user_id,
            name=name or "User",
            email=email
        )
        
        success = self.redis_client.save_user(user)
        if success:
            self.current_user_id = user_id
            self.print_slow(f"\n✨ Great to meet you, {name}!")
            return user_id
        else:
            print("❌ Setup failed")
            return None
    
    async def setup_gmail_connection(self, user_id: str) -> bool:
        """Setup Gmail connection with guided process"""
        try:
            print("\n" + "="*50)
            self.print_slow("🔗 Would you like to connect your Gmail for enhanced features?")
            print("="*50)
            
            connected_account = initiate_connection(
                user_id=user_id,
                composio_client=self.composio_client
            )
            
            print(f"\n🔗 Please visit this URL to authorize Gmail access:")
            print(f"   {connected_account.redirect_url}")
            print("\n⏳ Waiting for you to complete the authorization...")
            
            # Wait for connection
            max_attempts = 60  # 5 minutes
            for attempt in range(max_attempts):
                await asyncio.sleep(5)
                
                status = get_connection_status(
                    connected_account_id=connected_account.id,
                    composio_client=self.composio_client
                )
                
                if status.status == "ACTIVE":
                    self.print_slow("\n🎉 Gmail connected successfully!")
                    self.gmail_connected = True
                    
                    # Immediately research the user using the AI agent
                    print("\n🔍 Let me learn about you...")
                    print("🤖 analyzing your emails and searching online...", end='', flush=True)
                    
                    # Get user info for research
                    user = self.redis_client.get_user(user_id)
                    user_name = user.name if user and user.name else "User"
                    user_email = user.email if user and user.email else ""
                    
                    # Simple research prompt - let Poke's personality system handle the details
                    research_prompt = f"Research and greet {user_name} ({user_email}) - use your Gmail tools to learn about them and give your signature introduction."
                    
                    research_results = await self.agent.process_message(user_id, research_prompt)
                    
                    print('\r' + ' '*50 + '\r', end='')
                    print("\n✨ Here's what I discovered about you:")
                    self.print_agent_message(research_results)
                    
                    # Skip the proactive intro since we already did research
                    return True
                elif status.status == "FAILED":
                    print(f"\n❌ Connection failed: {status}")
                    return False
                
                # Show progress
                dots = "." * (attempt % 4)
                print(f"\r⏳ Still waiting{dots}   ", end='', flush=True)
            
            print(f"\n⏰ Connection timeout. You can try again later.")
            return False
                
        except Exception as e:
            print(f"\n❌ Error setting up Gmail connection. Please try again.")
            # Log detailed error for debugging
            print(f"Debug info: {type(e).__name__}")
            return False
    
    async def start_conversation(self, user_id: str):
        """Start natural conversation with the agent"""
        print("\n" + "="*50)
        print("="*50)
        
        # Only send proactive intro if Gmail wasn't connected (no research was done)
        if not self.gmail_connected:
            await self.send_proactive_intro(user_id)
        
        while True:
            try:
                user_input = input("\n💬 You: ").strip()
                
                if user_input.lower() in ['quit', 'exit', 'q', 'bye', 'goodbye']:
                    farewell = await self.agent.process_message(user_id, f"The user is saying goodbye: {user_input}")
                    self.print_agent_message(farewell)
                    break
                
                if not user_input:
                    continue
                
                # Show typing indicator
                print("🤖 typing...", end='', flush=True)
                
                # Process message through the actual agent
                response = await self.agent.process_message(user_id, user_input)
                
                # Clear typing indicator and show response
                print('\r' + ' '*15 + '\r', end='')
                self.print_agent_message(response)
                
                # Occasionally send proactive follow-ups
                if random.random() < 0.2:  # 20% chance
                    await asyncio.sleep(random.uniform(2, 5))
                    proactive_msg = await self.agent.send_proactive_message(user_id)
                    if proactive_msg and len(proactive_msg.strip()) > 10:
                        self.print_agent_message(f"💭 {proactive_msg}")
                
            except KeyboardInterrupt:
                goodbye_msg = await self.agent.process_message(user_id, "The user pressed Ctrl+C to end the conversation")
                self.print_agent_message(goodbye_msg)
                break
            except Exception as e:
                print(f"\n❌ Something went wrong. Please try again.")
                # Log error type for debugging without exposing details
                print(f"Debug info: {type(e).__name__}")
    
    async def send_proactive_intro(self, user_id: str):
        """Send an initial proactive introduction message"""
        user = self.redis_client.get_user(user_id)
        if user and user.name:
            intro_prompt = f"Generate a friendly, personal introduction message for {user.name}. Ask them about their day or what they'd like help with. Be warm and conversational."
        else:
            intro_prompt = "Generate a friendly introduction message. Ask the user about their day or what they'd like help with."
        
        intro_msg = await self.agent.process_message(user_id, intro_prompt)
        await asyncio.sleep(1)
        self.print_agent_message(intro_msg)
    
    async def show_user_info(self, user_id: str):
        """Show user information and memory"""
        user = self.redis_client.get_user(user_id)
        memory = self.redis_client.get_user_memory(user_id)
        
        if not user:
            print("❌ User not found")
            return
        
        print(f"\n👤 User Information:")
        print(f"ID: {user.connection_id}")
        print(f"Name: {user.name}")
        print(f"Email: {user.email}")
        print(f"Phone: {user.phone}")
        print(f"Created: {user.created_at}")
        print(f"Updated: {user.updated_at}")
        
        print(f"\n🧠 Memory & Insights:")
        print(f"Insights: {len(memory.insights)} items")
        print(f"Conversation history: {len(memory.conversation_history)} messages")
        
        if memory.insights:
            print("\n📝 Key insights:")
            for key, value in memory.insights.items():
                print(f"  • {key}: {value}")


async def main():
    """Main Poke CLI - Simple texting experience"""
    # Load environment variables
    from dotenv import load_dotenv
    load_dotenv()
    
    poke = PokeChat()
    
    try:
        # Step 1: Setup user
        user_id = await poke.setup_user()
        if not user_id:
            return
        
        # Step 2: Setup Gmail connection  
        await poke.setup_gmail_connection(user_id)
        
        # Step 3: Start natural conversation
        await poke.start_conversation(user_id)
        
    except KeyboardInterrupt:
        print("\n👋 See you later!")
    except Exception as e:
        print(f"\n❌ Something went wrong. Please restart the application.")
        # Log error type for debugging
        print(f"Debug info: {type(e).__name__}")


async def advanced_main():
    """Advanced CLI with options"""
    parser = argparse.ArgumentParser(description="Poke AI - Advanced Mode")
    parser.add_argument("--user-id", help="Use existing user ID")
    parser.add_argument("--name", help="Name for new user")
    parser.add_argument("--email", help="Email for new user")
    parser.add_argument("--no-gmail", action="store_true", help="Skip Gmail setup")
    parser.add_argument("--info-only", action="store_true", help="Show user info only")
    
    args = parser.parse_args()
    
    # Load environment variables
    from dotenv import load_dotenv
    load_dotenv()
    
    poke = PokeChat()
    
    # Handle existing user
    if args.user_id:
        user = poke.redis_client.get_user(args.user_id)
        if not user:
            print(f"❌ User {args.user_id} not found")
            return
        poke.current_user_id = args.user_id
        
        if args.info_only:
            await poke.show_user_info(args.user_id)
            return
        
        print(f"👋 Welcome back, {user.name}!")
        user_id = args.user_id
    else:
        # Create new user
        if args.name:
            user_id = str(uuid.uuid4())
            user = User(connection_id=user_id, name=args.name, email=args.email)
            poke.redis_client.save_user(user)
            poke.current_user_id = user_id
        else:
            user_id = await poke.setup_user()
    
    if not user_id:
        return
    
    # Setup Gmail unless skipped
    if not args.no_gmail:
        await poke.setup_gmail_connection(user_id)
    
    # Start conversation
    await poke.start_conversation(user_id)


if __name__ == "__main__":
    asyncio.run(main())