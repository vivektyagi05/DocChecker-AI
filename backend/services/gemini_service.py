import os
import json
import time
import google.generativeai as genai
from config import Config

class GeminiService:
    _configured = False

    @classmethod
    def _init_client(cls):
        if not cls._configured:
            api_key = Config.GEMINI_API_KEY
            if not api_key:
                raise ValueError("GEMINI_API_KEY is not set in the environment configuration.")
            genai.configure(api_key=api_key)
            cls._configured = True

    @classmethod
    def analyze_document(cls, file_path, file_type):
        cls._init_client()
        
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Document file not found at: {file_path}")

        # System instructions specifying the output schema
        system_instruction = (
            "You are a professional legal counsel and risk auditor. "
            "Analyze the uploaded document. Identify summaries, risk scores, categorized risks, "
            "liabilities, deadlines, and action items. "
            "You must respond with a JSON object strictly matching this schema:\n"
            "{\n"
            "  \"classification\": \"Document Classification (e.g. Employment Contract, Lease, NDA)\",\n"
            "  \"executive_summary\": \"A high-level summary of the contract terms and overall purpose.\",\n"
            "  \"risk_score\": 0 to 100 (where 0 is no risk, 100 is critical danger),\n"
            "  \"risks\": [\n"
            "    {\"category\": \"Category (e.g. Liability, IP, Termination)\", \"clause\": \"Exact text of clause\", \"explanation\": \"Reasoning in plain English\", \"level\": \"High | Medium | Low\"}\n"
            "  ],\n"
            "  \"liabilities\": [\n"
            "    {\"amount\": 0.0 (or null if not numeric), \"description\": \"Description of payment or obligation\", \"frequency\": \"Monthly | One-time | Annual | Event-driven\"}\n"
            "  ],\n"
            "  \"deadlines\": [\n"
            "    {\"date\": \"YYYY-MM-DD (or null if not specified)\", \"description\": \"Event description (e.g. renewal deadline, end date)\"}\n"
            "  ],\n"
            "  \"action_items\": [\n"
            "    {\"item\": \"Recommended course of action (e.g. negotiate liability cap)\"}\n"
            "  ]\n"
            "}"
        )

        user_prompt = "Perform a complete risk analysis and return the structured JSON results. Do not include mock contents."

        max_retries = 3
        delay = 2
        last_error = None

        for attempt in range(max_retries):
            uploaded_file = None
            try:
                # Use Gemini 1.5 Flash for compatibility
                model = genai.GenerativeModel(
                    model_name="gemini-1.5-flash",
                    system_instruction=system_instruction
                )

                # Upload file to File API for native vision and OCR processing
                uploaded_file = genai.upload_file(path=file_path)
                
                # Await file processing
                timeout_limit = 30
                elapsed_time = 0
                while uploaded_file.state.name == "PROCESSING":
                    if elapsed_time >= timeout_limit:
                        raise TimeoutError("Gemini File API processing timed out.")
                    time.sleep(1)
                    elapsed_time += 1
                    uploaded_file = genai.get_file(uploaded_file.name)

                if uploaded_file.state.name == "FAILED":
                    raise ValueError("Gemini File API processing failed.")

                # Generate content
                response = model.generate_content(
                    contents=[uploaded_file, user_prompt],
                    generation_config={"response_mime_type": "application/json"}
                )

                # Parse JSON output
                result = json.loads(response.text)
                return result

            except Exception as e:
                last_error = e
                print(f"[GeminiService] Error during attempt {attempt + 1}: {str(e)}")
                if attempt < max_retries - 1:
                    time.sleep(delay)
                    delay *= 2
            finally:
                # Clean up uploaded file
                if uploaded_file:
                    try:
                        genai.delete_file(uploaded_file.name)
                    except Exception as clean_err:
                        print(f"[GeminiService] Cleanup error: {clean_err}")

        # If all retries fail, raise the last exception
        raise last_error

    @classmethod
    def chat_with_document(cls, chat_history, user_question, document):
        cls._init_client()

        doc_context = f"Document Filename: {document['filename']}\n"
        doc_context += f"Classification: {document.get('classification', 'Unknown')}\n"
        
        if document.get("raw_text"):
            doc_context += f"Raw Document Text:\n{document['raw_text']}\n"
        else:
            analysis = document.get("analysis_results") or {}
            doc_context += f"Document Analysis Results:\n{json.dumps(analysis)}\n"

        system_instruction = (
            "You are DocChecker AI, an interactive contract advisor assistant. "
            "Ground all answers strictly on the document text or summary below. "
            "If the question cannot be answered using the context, state that clearly.\n\n"
            f"--- CONTEXT ---\n{doc_context}\n----------------"
        )

        try:
            model = genai.GenerativeModel(
                model_name="gemini-1.5-flash",
                system_instruction=system_instruction
            )

            contents = []
            for msg in chat_history[-10:]:
                role = "user" if msg["role"] == "user" else "model"
                contents.append({"role": role, "parts": [msg["message"]]})

            contents.append({"role": "user", "parts": [user_question]})
            
            response = model.generate_content(contents)
            return response.text
        except Exception as e:
            print(f"[GeminiService] Chat failure: {e}")
            raise e
