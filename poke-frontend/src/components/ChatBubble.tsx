import { clsx } from 'clsx';
import { Check, CheckCheck, Clock } from 'lucide-react';
import type { Message } from '../types';

interface ChatBubbleProps {
  message: Message;
}

export function ChatBubble({ message }: ChatBubbleProps) {
  const isUser = message.sender === 'user';
  
  const getStatusIcon = () => {
    if (!isUser) return null;
    
    switch (message.status) {
      case 'sending':
        return <Clock className="w-3 h-3 text-gray-400" />;
      case 'sent':
        return <Check className="w-3 h-3 text-gray-400" />;
      case 'failed':
        return <div className="w-3 h-3 rounded-full bg-red-500" />;
      default:
        return <CheckCheck className="w-3 h-3 text-blue-500" />;
    }
  };

  return (
    <div className={clsx(
      'flex mb-4 message-appear',
      isUser ? 'justify-end' : 'justify-start'
    )}>
      <div className={clsx(
        'max-w-xs lg:max-w-md px-4 py-2 rounded-2xl relative',
        isUser 
          ? 'bg-blue-500 text-white rounded-br-md' 
          : 'bg-gray-200 text-gray-800 rounded-bl-md'
      )}>
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
        
        <div className={clsx(
          'flex items-center justify-end gap-1 mt-1',
          isUser ? 'text-blue-100' : 'text-gray-500'
        )}>
          <span className="text-xs">
            {message.timestamp.toLocaleTimeString('en-US', { 
              hour: 'numeric', 
              minute: '2-digit',
              hour12: true 
            })}
          </span>
          {getStatusIcon()}
        </div>
      </div>
    </div>
  );
}