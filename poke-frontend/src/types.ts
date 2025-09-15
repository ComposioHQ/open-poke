export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'agent';
  timestamp: Date;
  status?: 'sending' | 'sent' | 'failed';
}

export interface User {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  connection_id: string;
}

export interface ConnectionStatus {
  status: string;
  connection_id: string;
  redirect_url?: string;
}