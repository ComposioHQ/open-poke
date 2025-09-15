import { useState } from 'react';
import { Mail, User, Loader2, ExternalLink } from 'lucide-react';
import { apiClient } from '../api';

interface ConnectionSetupProps {
  onConnectionEstablished: (userId: string) => void;
}

export function ConnectionSetup({ onConnectionEstablished }: ConnectionSetupProps) {
  const [step, setStep] = useState<'user-info' | 'connecting' | 'auth'>('user-info');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState({
    name: '',
  });
  const [connectionData, setConnectionData] = useState<{
    userId: string;
    redirectUrl?: string;
    connectionId?: string;
  } | null>(null);

  const handleUserInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInfo.name) return;

    setLoading(true);
    setError(null);

    try {
      // Create user
      const userId = `user_${Date.now()}`;
      await apiClient.createUser(userId, userInfo.name);
      
      // Initiate Gmail connection
      const connectionResult = await apiClient.initiateConnection(userId);
      
      setConnectionData({
        userId,
        redirectUrl: connectionResult.redirect_url,
        connectionId: connectionResult.connection_id,
      });

      if (connectionResult.redirect_url) {
        setStep('auth');
      } else {
        // Connection successful without redirect
        onConnectionEstablished(userId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set up connection');
    } finally {
      setLoading(false);
    }
  };

  const handleAuthComplete = () => {
    if (connectionData?.userId) {
      onConnectionEstablished(connectionData.userId);
    }
  };

  const checkConnectionStatus = async () => {
    if (!connectionData?.connectionId) return;

    try {
      const status = await apiClient.checkConnectionStatus(connectionData.connectionId);
      if (status.status === 'ACTIVE' || status.status === 'connected') {
        handleAuthComplete();
      }
    } catch (err) {
      setError('Failed to check connection status');
    }
  };

  if (step === 'user-info') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome to Poke AI</h1>
            <p className="text-gray-600">Connect your Gmail to get started with AI-powered email analysis</p>
          </div>

          <form onSubmit={handleUserInfoSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  id="name"
                  value={userInfo.name}
                  onChange={(e) => setUserInfo({ ...userInfo, name: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your full name"
                  required
                />
              </div>
            </div>


            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !userInfo.name}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-xl font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Connecting...
                </>
              ) : (
                'Connect Gmail'
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (step === 'auth') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ExternalLink className="w-8 h-8 text-green-600" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Authorize Gmail Access</h2>
          <p className="text-gray-600 mb-6">
            Click the button below to authorize Poke AI to access your Gmail account.
          </p>

          <div className="space-y-4">
            {connectionData?.redirectUrl && (
              <a
                href={connectionData.redirectUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-xl font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-center gap-2"
              >
                <ExternalLink className="w-5 h-5" />
                Authorize Gmail Access
              </a>
            )}

            <button
              onClick={checkConnectionStatus}
              className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-xl font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              I've completed authorization
            </button>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}