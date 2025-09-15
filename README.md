# Open Poke - Personalised Onboarding Agent

Poke AI is an intelligent agent that automatically researches users by analyzing their Gmail data and web presence, then engages in natural conversations with personalized insights. Built with [Composio](https://composio.dev)

## What Poke AI Does

Poke AI acts as a knowledgeable conversation partner that:

- **Automatically analyzes your Gmail account** to understand your professional background, communication patterns, and work context
- **Researches your web presence** using your email domain and profile information to gather additional professional insights
- **Engages in personalized conversations** with context about your work, interests, and professional activities
- **Maintains conversation history** while referencing discovered information when relevant
- **Provides intelligent responses** that demonstrate understanding of your professional context and background

## How It Works

### Architecture Overview

The system consists of three main components:

1. **Frontend (React + Vite)** - Modern chat interface with WhatsApp/iOS Messages styling
2. **Backend (FastAPI + Python)** - Agent processing engine with message queue system
3. **Composio Integration** - Handles Gmail authentication and tool execution

### Research Process

1. **Gmail Profile Analysis** - Extracts basic profile information and email domain
2. **Email Pattern Analysis** - Analyzes signatures, communication patterns, and professional contacts
3. **Web Research** - Uses email domain and profile data to search for additional professional information
4. **Context Building** - Combines multiple data sources to build comprehensive user profile
5. **Conversation Mode** - Transitions to normal chat while maintaining discovered context

### Technical Stack

- **Frontend**: React, TypeScript, Tailwind CSS, Vite
- **Backend**: FastAPI, Python, LangGraph, LangChain
- **AI Model**: OpenAI GPT-4
- **Integration Platform**: [Composio](https://composio.dev)
- **Storage**: In-memory (no database required)
- **Authentication**: Gmail OAuth via Composio

## Getting Started

### Prerequisites

- Node.js 20.19+ or 22.12+
- Python 3.8+
- OpenAI API key
- Composio account and API key

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd poke-ai
```

2. Set up the backend:
```bash
cd poke-backend
pip install -r requirements.txt
```

3. Set up the frontend:
```bash
cd poke-frontend
npm install
```

4. Configure environment variables:

Create `.env` file in the project root:
```env
OPENAI_API_KEY=your_openai_api_key_here
COMPOSIO_API_KEY=your_composio_api_key_here
COMPOSIO_AUTH_CONFIG_ID=your_gmail_auth_config_id
```

### Running the Application

1. Start the backend:
```bash
cd poke-backend
uvicorn server.api:app --host 0.0.0.0 --port 8000 --reload
```

2. Start the frontend:
```bash
cd poke-frontend
npm run dev
```

3. Open http://localhost:5173 in your browser

## Composio Integration

This project leverages [Composio](https://composio.dev) for seamless Gmail integration. Composio provides:

- **Secure OAuth authentication** for Gmail access
- **Pre-built Gmail tools** for email analysis and search
- **Web search capabilities** for additional research
- **Tool execution framework** with proper error handling

### Key Composio Features Used

- `GMAIL_GET_PROFILE` - Retrieves user profile information
- `GMAIL_SEARCH_PEOPLE` - Searches for professional profiles
- `GMAIL_FETCH_EMAILS` - Analyzes email patterns and signatures
- `COMPOSIO_SEARCH` - Performs web searches for additional context

For more information about Composio's capabilities, visit the [Composio Documentation](https://docs.composio.dev).

## Customization Options

### Modifying the AI Personality

The agent's personality and research approach can be customized by modifying the system prompts in `poke-backend/server/agent.py`. The system supports two modes:

1. **Research Mode** - Initial analysis and profile building
2. **Conversation Mode** - Ongoing chat with discovered context

### Adding New Data Sources

Extend the research capabilities by:

1. Adding new Composio tools in `poke-backend/server/tools.py`
2. Modifying the research strategy in the agent's system prompt
3. Updating the tool selection logic in the agent

### Customizing the Chat Interface

The frontend chat interface can be modified in:

- `poke-frontend/src/components/` - Individual UI components
- `poke-frontend/src/App.tsx` - Main application logic
- `poke-frontend/src/index.css` - Styling and animations

### Response Processing

Customize how responses are processed and stored by modifying:

- `poke-backend/server/message_processor.py` - Message queue handling and data storage
- `poke-backend/server/api.py` - API endpoints and response formatting

## API Endpoints

### User Management
- `POST /users` - Create new user
- `GET /users/{user_id}` - Retrieve user information
- `GET /users/{user_id}/memory` - Get user insights and memory
- `GET /users/{user_id}/conversations` - Retrieve conversation history

### Gmail Integration
- `POST /connections/initiate` - Start Gmail OAuth flow
- `GET /connections/{connection_id}/status` - Check connection status

### Messaging
- `POST /messages` - Send message to agent
- `GET /health` - Health check endpoint

## Configuration

### Agent Behavior

Modify research depth and focus by adjusting:
- Tool selection in `tools.py`
- Research prompts in `agent.py`
- Conversation memory limits in `message_processor.py`

### Security Settings

Configure security measures:
- CORS origins in `api.py`
- API response sanitization in `api.py`
- Environment variable validation

### Performance Tuning

Optimize performance by adjusting:
- Message processing intervals in `message_processor.py`
- In-memory storage size limits
- Frontend polling frequency

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License. See LICENSE file for details.

## Resources

- [Composio Platform](https://composio.dev)
- [Composio Documentation](https://docs.composio.dev)
- [Composio GitHub](https://github.com/ComposioHQ/composio)
- [FastAPI Documentation](https://fastapi.tiangolo.com)
- [React Documentation](https://react.dev)
- [LangChain Documentation](https://langchain.readthedocs.io)

## Support

For questions about this implementation, please open an issue in the repository.

For Composio-specific questions, visit the [Composio Documentation](https://docs.composio.dev) or [Composio Community](https://discord.gg/composio).
