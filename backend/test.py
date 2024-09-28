from agent import MoleculeAgent
import os

api_key = os.getenv("OPENAI_API_KEY")
agent = MoleculeAgent(api_key)

result = agent.run_conversation("Whatuv the molecular formula of caffeine?")
print(result)