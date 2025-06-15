from openai import OpenAI
import os
from dotenv import load_dotenv


load_dotenv()  # loads variables from .env

client = OpenAI(
  api_key = os.getenv('AI_API_KEY')
)

completion = client.chat.completions.create(
  model="gpt-4o-mini",
  store=True,
  messages=[
    {"role": "system", "content": "You are a web development assistant. Only respond with valid, complete HTML code with no indentation or new line characters. Do not include any explanation or markdown formatting. Do not wrap it in triple backticks. Only output raw HTML."},
    {"role": "user", "content": "Create a basic HTML page with a header and a list of three fruits."}
  ]
)

print(completion.choices[0].message.content);
