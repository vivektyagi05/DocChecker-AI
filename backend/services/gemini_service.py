import os
import json
import time
from google import genai
from config import Config

class GeminiService:
    _configured = False

    @classmethod
    def _init_client(cls):
        if not cls._configured:
            api_key = Config.GEMINI_API_KEY
            if not api_key:
                raise ValueError("GEMINI_API_KEY is not set in the environment configuration.")
            cls._configured = True

    @classmethod
    def analyze_document(cls, document_text):

        if not document_text:
            raise ValueError(
                "Document text is empty."
            )

        prompt = f"""
    You are DocChecker AI Pro.

    You are an expert:

    - Legal Contract Auditor
    - Compliance Analyst
    - Risk Assessment Specialist
    - Business Agreement Reviewer

    Your task is to analyze the document and return ONLY valid JSON.

    Analyze:

    1. Document Type
    2. Executive Summary
    3. Risk Score (0-100)
    4. Risks
    5. Financial Liabilities
    6. Deadlines
    7. Action Items

    Risk Score Guide:

    0-20 = Very Safe
    21-40 = Low Risk
    41-60 = Medium Risk
    61-80 = High Risk
    81-100 = Critical Risk

    Return EXACT JSON:

    {{
    "classification":"",
    "executive_summary":"",
    "risk_score":0,
    "risks":[
        {{
        "category":"",
        "clause":"",
        "explanation":"",
        "level":""
        }}
    ],
    "liabilities":[
        {{
        "amount":0,
        "description":"",
        "frequency":""
        }}
    ],
    "deadlines":[
        {{
        "date":"",
        "description":""
        }}
    ],
    "action_items":[
        {{
        "item":""
        }}
    ]
    }}

    DOCUMENT:

    {document_text[:30000]}
    """

        try:

            client = genai.Client(
                api_key=Config.GEMINI_API_KEY
            )

            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt
            )

            text = response.text.strip()

            if text.startswith("```json"):
                text = text.replace("```json", "")
                text = text.replace("```", "")
                text = text.strip()

            return json.loads(text)

        except Exception as e:
            raise Exception(
                f"Gemini Analysis Error: {str(e)}"
            )

    @classmethod
    def chat_with_document(
        cls,
        chat_history,
        user_question,
        document
    ):

        if document.get("raw_text"):
            context = document["raw_text"][:30000]

        else:
            context = json.dumps(
                document.get("analysis_results", {}),
                indent=2
            )

        conversation = ""

        for msg in chat_history[-10:]:

            role = msg.get("role")

            if role == "user":
                conversation += f"\nUser: {msg['message']}"

            else:
                conversation += f"\nAssistant: {msg['message']}"

        prompt = f"""
    You are DocChecker AI.

    Rules:

    - Answer ONLY from document context.
    - Never hallucinate.
    - If answer not present say:
    "This information is not available in the document."
    - Explain clauses in simple language.
    - Highlight risks when relevant.
    - Give professional recommendations.

    DOCUMENT:

    {context}

    CHAT HISTORY:

    {conversation}

    QUESTION:

    {user_question}
    """

        try:

            client = genai.Client(
                api_key=Config.GEMINI_API_KEY
            )

            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt
            )

            return response.text

        except Exception as e:
            raise Exception(
                f"Chat Error: {str(e)}"
            )