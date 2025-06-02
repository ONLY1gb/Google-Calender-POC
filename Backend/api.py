"""
FastAPI application for Agno chatbot with streaming responses
"""
import os
import json
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field, validator, constr
from typing import Optional as OptionalField
from fastapi import Query
import urllib.parse
from dotenv import load_dotenv
from agno.agent import Agent
from agno.models.openai import OpenAIChat
from agno.memory.db.sqlite import SqliteMemoryDb
from agno.memory.v2.memory import Memory
from agno.storage.sqlite import SqliteStorage
import PyPDF2
from datetime import datetime
from tzlocal import get_localzone_name
from agno.tools import tool
from agno.tools.tavily import TavilyTools
from custom_gcal_tools import FixedPortGoogleCalendarTools
import shutil

# Create FastAPI app
app = FastAPI(title="Agno Chatbot API", description="API for Agno chatbot with streaming responses")

# app.include_router(file_upload_router, prefix="/api")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # You should restrict this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load environment variables
load_dotenv()
db_file = "tmp/agent.db"
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
GOOGLE_CALENDAR_CREDENTIALS = os.getenv("GOOGLE_CALENDAR_CREDENTIALS")

if not OPENAI_API_KEY:
    raise ValueError("OPENAI_API_KEY is not set in the environment variables.")
if not GOOGLE_CALENDAR_CREDENTIALS:
    print("Warning: GOOGLE_CALENDAR_CREDENTIALS is not set. Google Calendar features will not work.")

UPLOADS_DIR = "uploads"

# Request model
class ChatRequest(BaseModel):
    user_query: str
    user_id: str
    session_id: str
    credentials_path: OptionalField[str] = Field(default=None, description="Path to Google Calendar credentials file")

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

def get_agent(user_id: str, session_id: str, credentials_path: OptionalField[str] = None):
    """Create and return an Agno agent instance with the specified user_id and session_id"""
    memory = Memory(
        model=OpenAIChat(id="gpt-4.1-nano"),
        db=SqliteMemoryDb(table_name="user_memories", db_file=db_file),
    )

    storage = SqliteStorage(table_name="agent_sessions", db_file=db_file)
    
    # Use provided credentials path or fall back to environment variable
    creds_path = credentials_path if credentials_path else GOOGLE_CALENDAR_CREDENTIALS

    # Initialize Agno Agent with tools
    agent = Agent(
        model=OpenAIChat(id="gpt-4o"),
        user_id=user_id,
        session_id=session_id,
        memory=memory,
        read_chat_history=True,
        storage=storage,
        tools=[
            TavilyTools(api_key=os.getenv("TAVILY_API_KEY")),
            FixedPortGoogleCalendarTools(credentials_path=creds_path) if creds_path and os.path.exists(creds_path) else None,
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
    
    return agent

@app.post("/chat")
async def chat(request: ChatRequest):
    """
    Endpoint to chat with the Agno agent and receive streaming responses
    """
    try:
        # Get agent instance with user's session info
        agent = get_agent(request.user_id, request.session_id, request.credentials_path)
        
        # Create a response generator
        def response_generator():
            for chunk in agent.run(request.user_query, stream=True):
                yield chunk.content or ""
                
        return StreamingResponse(
            response_generator(),
            media_type="text/plain"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

# Calendar events request model
class CalendarEventsRequest(BaseModel):
    limit: OptionalField[int] = Field(default=10, description="Maximum number of events to return")
    date_from: OptionalField[str] = Field(default=None, description="Start date in ISO format (default: today)")
    user_id: OptionalField[str] = Field(default="default_user", description="User ID for session management")
    session_id: OptionalField[str] = Field(default="default_session", description="Session ID for session management")
    credentials_path: OptionalField[str] = Field(default=None, description="Path to Google Calendar credentials file")

@app.get("/calendar/events")
async def list_calendar_events(
    limit: OptionalField[int] = Query(10, description="Maximum number of events to return"),
    date_from: OptionalField[str] = Query(None, description="Start date in ISO format (default: today)"),
    user_id: OptionalField[str] = Query("default_user", description="User ID for session management"),
    session_id: OptionalField[str] = Query("default_session", description="Session ID for session management"),
    credentials_path: OptionalField[str] = Query(None, description="Path to Google Calendar credentials file")
):
    """
    List events from the user's Google Calendar
    """
    try:
        # Decode credentials_path if provided
        creds_path = urllib.parse.unquote(credentials_path) if credentials_path else GOOGLE_CALENDAR_CREDENTIALS
        
        # Validate the credentials path
        if not creds_path or not os.path.exists(creds_path):
            raise HTTPException(status_code=400, detail="Valid Google Calendar credentials path not provided")
            
        calendar_tools = FixedPortGoogleCalendarTools(credentials_path=creds_path)
        
        # Call the list_events method
        events_json = calendar_tools.list_events(
            limit=limit,
            date_from=date_from if date_from else datetime.date.today().isoformat()
        )
        
        # Parse the JSON string to Python object
        events = json.loads(events_json)
        
        # Return formatted events
        return events
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching calendar events: {str(e)}")

# Clear history request model
class ClearHistoryRequest(BaseModel):
    user_id: constr(min_length=1) = Field(..., description="User ID to clear history for")
    session_id: constr(min_length=1) = Field(..., description="Session ID to clear history for")
    clear_all_user_data: OptionalField[bool] = Field(default=False, description="Whether to clear all user data or just this session")
    
    @validator('user_id', 'session_id')
    def validate_ids(cls, v):
        if not v or not v.strip():
            raise ValueError("ID cannot be empty")
        return v

@app.post("/clear-history")
async def clear_history(request: ClearHistoryRequest):
    """
    Clear conversation history for a specific user and session
    """
    try:
        # Create storage instance with the same config as the main app
        storage = SqliteStorage(table_name="agent_sessions", db_file=db_file)
        
        # Create memory db instance with the same config as the main app
        memory_db = SqliteMemoryDb(table_name="user_memories", db_file=db_file)
        
        # Delete the session
        storage.delete_session(request.session_id)
        
        if request.clear_all_user_data:
            # Clear all memories for this user
            memories = memory_db.read_memories(user_id=request.user_id)
            for memory in memories:
                memory_db.delete_memory(memory.id)
            
            # Delete all sessions for this user
            sessions = storage.get_all_session_ids(user_id=request.user_id)
            for session_id in sessions:
                storage.delete_session(session_id)
                
            return {
                "status": "success", 
                "message": f"All history cleared for user {request.user_id}",
                "cleared_sessions": len(sessions),
                "cleared_memories": len(memories)
            }
        else:
            # Just delete the specific session
            return {
                "status": "success", 
                "message": f"History cleared for session {request.session_id}"
            }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error clearing history: {str(e)}")

# Health check endpoint
@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {"status": "ok"}

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    """
    Upload a file to the server. Currently supports PDF files.
    """
    # Create uploads directory if it doesn't exist
    os.makedirs(UPLOADS_DIR, exist_ok=True)
    
    # Validate file type
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    
    try:
        # Create file path
        file_path = os.path.join(UPLOADS_DIR, file.filename)
        
        # Save uploaded file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        return {
            "status": "success",
            "filename": file.filename,
            "message": "File uploaded successfully",
            "file_path": file_path
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error uploading file: {str(e)}")

# Main function to run the API with uvicorn when the script is executed directly
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)