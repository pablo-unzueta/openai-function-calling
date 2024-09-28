from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from openai import OpenAI
import os
import logging
from fastapi.middleware.cors import CORSMiddleware
from io import StringIO

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Message(BaseModel):
    content: str


@app.post("/api/chat")
async def chat(request: Message):
    log_capture = StringIO()
    handler = logging.StreamHandler(log_capture)
    logger = logging.getLogger()
    logger.addHandler(handler)
    logger.setLevel(logging.INFO)

    logger.info(f"Received message: {request.content}")
    try:
        if not client.api_key:
            raise HTTPException(status_code=500, detail="OpenAI API key not set")

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": request.content},
            ],
        )
        logger.info(f"OpenAI response: {response.choices[0].message.content}")
        return {
            "response": response.choices[0].message.content,
            "logging": log_capture.getvalue().splitlines(),
        }
    except Exception as e:
        logger.error(f"Error in chat endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        logger.removeHandler(handler)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
