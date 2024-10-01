from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from openai import OpenAI
import os
import logging
from fastapi.middleware.cors import CORSMiddleware
from io import StringIO
import time
import random  # Add this import
from typing import Optional  # Add this import

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


class ChatResponse(BaseModel):
    response: str
    logging: list[str]
    response_time: float
    image_path: Optional[str] = None  # Change this line


@app.post("/api/chat")
async def chat(request: Message):
    start_time = time.time()
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
                {
                    "role": "system",
                    "content": "You are a helpful assistant. Format your responses to break lines at 80 characters. If the response is too long, break it down in smaller sections.",
                },
                {"role": "user", "content": request.content},
            ],
        )
        logger.info(f"OpenAI response: {response.choices[0].message.content}")

        # Replace this with your actual logic for determining when to send an image
        image_path = None
        if "image" in response.choices[0].message.content.lower():
            # This is a placeholder. In a real scenario, you'd have logic to select appropriate images.
            image_path = "/images/sample_image.png"

        end_time = time.time()
        response_time = round(end_time - start_time, 2)
        return ChatResponse(
            response=response.choices[0].message.content,
            logging=log_capture.getvalue().splitlines(),
            response_time=response_time,
            image_path=image_path
        )
    except Exception as e:
        logger.error(f"Error in chat endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        logger.removeHandler(handler)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
