import { useState, useEffect, useRef } from 'react';
import { User } from 'lucide-react';
import { ConnectionSetup } from './components/ConnectionSetup';
import { ChatBubble } from './components/ChatBubble';
import { TypingIndicator } from './components/TypingIndicator';
import { MessageInput } from './components/MessageInput';
import { apiClient } from './api';
import type { Message } from './types';

function App() {
  const [userId, setUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Save messages to localStorage whenever messages change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('poke_messages', JSON.stringify(messages));
    }
  }, [messages]);

  // Save typing and loading states
  useEffect(() => {
    localStorage.setItem('poke_is_typing', JSON.stringify(isTyping));
  }, [isTyping]);

  useEffect(() => {
    localStorage.setItem('poke_is_loading', JSON.stringify(isLoading));
  }, [isLoading]);

  useEffect(() => {
    // Check if user is already connected and restore state
    const savedUserId = localStorage.getItem('poke_user_id');
    const savedMessages = localStorage.getItem('poke_messages');
    const savedIsTyping = localStorage.getItem('poke_is_typing');
    const savedIsLoading = localStorage.getItem('poke_is_loading');

    if (savedUserId) {
      setUserId(savedUserId);
      
      // Restore messages if they exist
      if (savedMessages) {
        try {
          const parsedMessages = JSON.parse(savedMessages).map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }));
          setMessages(parsedMessages);
        } catch (error) {
          console.error('Failed to parse saved messages:', error);
        }
      }

      // Restore typing state
      if (savedIsTyping) {
        try {
          setIsTyping(JSON.parse(savedIsTyping));
        } catch (error) {
          console.error('Failed to parse saved typing state:', error);
        }
      }

      // Restore loading state
      if (savedIsLoading) {
        try {
          setIsLoading(JSON.parse(savedIsLoading));
        } catch (error) {
          console.error('Failed to parse saved loading state:', error);
        }
      }

      // Only send initial message if there are no saved messages
      if (!savedMessages || savedMessages === '[]') {
        handleInitialMessage(savedUserId);
      }
    }
  }, []);

  const clearStoredState = () => {
    localStorage.removeItem('poke_messages');
    localStorage.removeItem('poke_is_typing');
    localStorage.removeItem('poke_is_loading');
  };

  const handleDisconnect = () => {
    localStorage.removeItem('poke_user_id');
    clearStoredState();
    setUserId(null);
    setMessages([]);
    setIsTyping(false);
    setIsLoading(false);
  };

  const handleConnectionEstablished = (newUserId: string) => {
    // Clear previous state when establishing new connection
    clearStoredState();
    setMessages([]);
    setIsTyping(false);
    setIsLoading(false);
    
    setUserId(newUserId);
    localStorage.setItem('poke_user_id', newUserId);
    handleInitialMessage(newUserId);
  };

  const handleInitialMessage = async (userIdToUse: string) => {
    setIsTyping(true);
    try {
      // Send an initial message to trigger Poke's research
      await apiClient.sendMessage(userIdToUse, "Hello Poke! Tell me what you've discovered about me.");
      
      // Add a placeholder agent message while waiting for the actual response
      const agentMessage: Message = {
        id: `msg_${Date.now()}`,
        content: "Let me research you real quick... 🔍",
        sender: 'agent',
        timestamp: new Date(),
      };
      
      setMessages([agentMessage]);
      
      // Poll for real responses from the backend
      pollForResponses(userIdToUse);
      
    } catch (error) {
      console.error('Failed to send initial message:', error);
      setIsTyping(false);
    }
  };

  const pollForResponses = async (userIdToUse: string) => {
    let attempts = 0;
    const maxAttempts = 24; // 2 minutes of polling (24 * 5 seconds)
    
    const poll = async () => {
      try {
        const conversations = await apiClient.getUserConversations(userIdToUse);
        if (conversations.conversations && conversations.conversations.length > 0) {
          // Convert backend conversations to frontend messages
          const backendMessages = conversations.conversations.map((conv: any, index: number) => ({
            id: `msg_${index}`,
            content: conv.message,
            sender: conv.type as 'user' | 'agent',
            timestamp: new Date(conv.timestamp),
          }));
          
          setMessages(backendMessages);
          setIsTyping(false);
          return;
        }
        
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 5000); // Poll every 5 seconds
        } else {
          setIsTyping(false);
          // Fallback message if polling times out
          setMessages([{
            id: `msg_fallback`,
            content: "I'm still analyzing your data. This might take a moment as I research your Gmail and web presence thoroughly.",
            sender: 'agent',
            timestamp: new Date(),
          }]);
        }
      } catch (error) {
        console.error('Failed to poll for responses:', error);
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 5000);
        } else {
          setIsTyping(false);
        }
      }
    };
    
    poll();
  };

  const pollForMessageResponse = async (messageId: string) => {
    let attempts = 0;
    const maxAttempts = 30; // 2.5 minutes of polling (30 * 5 seconds)
    
    const poll = async () => {
      try {
        const responseData = await apiClient.getMessageResponse(messageId);
        
        if (responseData.status === 'completed') {
          // Add the agent response
          const agentMessage: Message = {
            id: `msg_${Date.now()}`,
            content: responseData.response,
            sender: 'agent',
            timestamp: new Date(),
          };
          
          setMessages(prev => [...prev, agentMessage]);
          setIsTyping(false);
          return;
        } else if (responseData.status === 'error') {
          // Handle error
          const errorMessage: Message = {
            id: `msg_${Date.now()}`,
            content: "Sorry, I encountered an error processing your message.",
            sender: 'agent',
            timestamp: new Date(),
          };
          
          setMessages(prev => [...prev, errorMessage]);
          setIsTyping(false);
          return;
        }
        
        // Still processing, continue polling
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 5000); // Poll every 5 seconds
        } else {
          setIsTyping(false);
          // Timeout fallback
          const timeoutMessage: Message = {
            id: `msg_timeout`,
            content: "I'm taking longer than usual to respond. Please try your message again.",
            sender: 'agent',
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, timeoutMessage]);
        }
      } catch (error) {
        console.error('Failed to poll for response:', error);
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 5000);
        } else {
          setIsTyping(false);
        }
      }
    };
    
    poll();
  };

  const handleSendMessage = async (content: string) => {
    if (!userId) return;

    // Add user message immediately
    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      content,
      sender: 'user',
      timestamp: new Date(),
      status: 'sending',
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Send message to backend and get message_id
      const result = await apiClient.sendMessage(userId, content);
      
      // Update message status to sent
      setMessages(prev => 
        prev.map(msg => 
          msg.id === userMessage.id 
            ? { ...msg, status: 'sent' as const }
            : msg
        )
      );

      // Show typing indicator and poll for specific message response
      setIsTyping(true);
      
      // Poll for the specific message response
      pollForMessageResponse(result.message_id);

    } catch (error) {
      console.error('Failed to send message:', error);
      
      // Update message status to failed
      setMessages(prev => 
        prev.map(msg => 
          msg.id === userMessage.id 
            ? { ...msg, status: 'failed' as const }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!userId) {
    return <ConnectionSetup onConnectionEstablished={handleConnectionEstablished} />;
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 flex items-center gap-3">
        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
          <span className="text-lg">🌴</span>
        </div>
        <div>
          <h1 className="font-semibold text-gray-900">Poke AI</h1>
          <p className="text-sm text-gray-500">AI Email Analyst</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 scrollbar-hide">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <User className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Welcome to Open Poke!</h3>
            <p className="text-gray-500 max-w-sm">
              Send me a message to get started!
            </p>
          </div>
        ) : (
          <>
            {messages.map(message => (
              <ChatBubble key={message.id} message={message} />
            ))}
            {isTyping && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Message Input */}
      <MessageInput 
        onSendMessage={handleSendMessage}
        disabled={isLoading}
        placeholder="Ask Poke about your email patterns, contacts, or insights..."
      />
    </div>
  );
}

export default App;
