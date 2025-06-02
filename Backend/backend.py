import os
from dotenv import load_dotenv
from agno.agent import Agent
from agno.models.openai import OpenAIChat
from agno.tools.firecrawl import FirecrawlTools
# from agno.tools.googlecalendar import GoogleCalendarTools
from custom_gcal_tools import FixedPortGoogleCalendarTools
from agno.tools import tool
from agno.memory.db.sqlite import SqliteMemoryDb
from agno.memory.v2.memory import Memory
from agno.storage.sqlite import SqliteStorage
import PyPDF2
from datetime import datetime
from tzlocal import get_localzone_name
from agno.tools.tavily import TavilyTools

# Load environment variables
load_dotenv()
db_file = "tmp/agent.db"
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
GOOGLE_CALENDAR_CREDENTIALS = os.getenv("GOOGLE_CALENDAR_CREDENTIALS")
user_id= "38230ti78"
session_id= "343903397"

if not OPENAI_API_KEY:
    raise ValueError("OPENAI_API_KEY is not set in the environment variables.")
if not GOOGLE_CALENDAR_CREDENTIALS:
    print("Warning: GOOGLE_CALENDAR_CREDENTIALS is not set. Google Calendar features will not work.")

UPLOADS_DIR = "uploads"

# Tool to read PDF content from uploads folder
def extract_pdf_text(file_path: str) -> str:
    if not os.path.exists(file_path):
        return f"File not found: {file_path}"
    try:
        with open(file_path, 'rb') as f:
            reader = PyPDF2.PdfReader(f)
            text = ""
            for page in reader.pages:
                text += page.extract_text() or ""
            return text
    except Exception as e:
        return f"Error reading PDF: {e}"

@tool(
    name="pdf_qa",
    description="Answer questions based on an uploaded PDF document."
)
def pdf_qa(filename: str, question: str) -> str:
    file_path = os.path.join(UPLOADS_DIR, filename)
    content = extract_pdf_text(file_path)
    if content.startswith("Error") or content.startswith("File not found"):
        return content
    prompt = f"Context from PDF:\n{content[:2000]}\n\nQuestion: {question}\nAnswer based on the context."
    agent = Agent(model=OpenAIChat(id="gpt-4o"))
    response = agent.run(prompt)
    return response.content

@tool(
    name="list_materials",
    description="List all available documents in the uploads folder."
)
def list_materials() -> str:
    if not os.path.exists(UPLOADS_DIR):
        return "No uploads folder found."
    files = os.listdir(UPLOADS_DIR)
    if not files:
        return "No documents available."
    return "Available documents:\n" + "\n".join(files)

@tool(
    name="get_material",
    description="Get the content or path of a document from the uploads folder."
)
def get_material(filename: str) -> str:
    file_path = os.path.join(UPLOADS_DIR, filename)
    if not os.path.exists(file_path):
        return f"File not found: {filename}"
    return f"Document path: {file_path}"

memory = Memory(
        # Use any model for creating memories
        model=OpenAIChat(id="gpt-4.1-nano"),
        db=SqliteMemoryDb(table_name="user_memories", db_file=db_file),
    )

storage = SqliteStorage(table_name="agent_sessions", db_file=db_file)


# Initialize Agno Agent with tools
agent = Agent(
    model=OpenAIChat(id="gpt-4o"),
    user_id=user_id,
    session_id=session_id,
    memory=memory,
    read_chat_history=True,
    storage=storage,
    tools=[
        # FirecrawlTools(),  # For website Q&A
        TavilyTools(api_key= os.getenv("TAVILY_API_KEY")),
        FixedPortGoogleCalendarTools(credentials_path=GOOGLE_CALENDAR_CREDENTIALS) if GOOGLE_CALENDAR_CREDENTIALS else None,
        pdf_qa,
        list_materials,
        get_material,
    ],
    show_tool_calls=True,
    markdown=True,
    instructions=[
        f"Today is {datetime.now().strftime('%Y-%m-%d')}, and the user's timezone is {get_localzone_name()}.",
        "Always use the current date and week for queries like 'this week', 'today', etc.",
        "When the user asks for events for 'this week', calculate the correct date range based on the current date."
    ],
    add_datetime_to_instructions=True,
)

def main():
    print("Agno Chatbot (PDF/Website Q&A, Meeting Booking, Material Sharing)")
    print("Type 'exit' to quit.")
    while True:
        user_input = input("\nYour query: ")
        if user_input.lower() in ["exit", "quit"]:
            print("Goodbye!")
            break
        try:
            response = agent.print_response(user_input)
            print(f"\nBot: {response}")
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    main()
