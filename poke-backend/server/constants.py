from composio import Composio
from composio_langchain import LangchainProvider
from langchain_openai import ChatOpenAI
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

composio = Composio(
    api_key=os.getenv("COMPOSIO_API_KEY"),
    provider=LangchainProvider(),
)

openai = ChatOpenAI(
    api_key=os.getenv("OPENAI_API_KEY"),
    model='gpt-5'
)