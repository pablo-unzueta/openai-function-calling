from openai import OpenAI
from pubchem_api import get_molecule_info

client = OpenAI()


class MoleculeAgent:
    def __init__(self, api_key):
        self.api_key = api_key

        self.functions = [
            {
                "name": "get_molecule_info",
                "description": "Get information about a molecule from PubChem",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "compound_name": {
                            "type": "string",
                            "description": "The name of the chemical compound",
                        }
                    },
                    "required": ["compound_name"],
                },
            }
        ]

    def chat_completion(self, messages):
        response = client.chat.completions.create(
            model="gpt-4o-mini-2024-07-18",
            messages=messages,
            functions=self.functions,
            function_call="auto",
        )
        return response.choices[0].message

    def run_conversation(self, user_input):
        messages = [{"role": "user", "content": user_input}]

        while True:
            response = self.chat_completion(messages)

            if response.function_call:
                function_name = response.function_call.name
                function_args = eval(response.function_call.arguments)

                if function_name == "get_molecule_info":
                    function_response = get_molecule_info(
                        function_args["compound_name"]
                    )

                    messages.append(response)
                    messages.append(
                        {
                            "role": "function",
                            "name": function_name,
                            "content": str(function_response),
                        }
                    )
            else:
                return response.content
