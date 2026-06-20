import os
from werkzeug.utils import secure_filename
from config import Config
import PyPDF2

def allowed_file(filename):
    return "." in filename and \
           filename.rsplit(".", 1)[1].lower() in Config.ALLOWED_EXTENSIONS

def get_safe_filepath(user_id, filename):
    # Ensure user upload folder exists
    user_upload_dir = os.path.join(Config.UPLOAD_FOLDER, str(user_id))
    if not os.path.exists(user_upload_dir):
        os.makedirs(user_upload_dir, exist_ok=True)
    
    cleaned_filename = secure_filename(filename)
    return os.path.join(user_upload_dir, cleaned_filename)

def extract_text_from_pdf(file_path):
    """
    Extracts text locally using PyPDF2.
    For complex PDFs or OCR scans, we also pass the binary/text directly to Gemini.
    """
    text = ""
    try:
        with open(file_path, "rb") as f:
            reader = PyPDF2.PdfReader(f)
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
    except Exception as e:
        print(f"Error extracting text from PDF: {e}")
    return text.strip()
