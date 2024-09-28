from pydantic import BaseModel
import openai
from openai import OpenAI

client = OpenAI()

class GetDeliveryDate(BaseModel):
    order_id: int

tools = [openai.pydantic_function_tool(GetDeliveryDate)]

messages = []
messages.append({"role": "system", "content": "You are a helpful customer support assistant. Use the supplied tools to assist the user."})
messages.append({"role": "user", "content": "Hi, can you tell me the delivery date for my order #12345?"}) 

response = client.chat.completions.create(
    model='gpt-4o-2024-08-06',
    messages=messages,
    tools=tools,
    tool_choice='auto',
)

print(response.choices[0].message.tool_calls[0].function)