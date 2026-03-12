import os
import re
import io
import logging
import pdfplumber
from docx import Document
from collections import Counter

logger = logging.getLogger(__name__)

import urllib.request
import cloudinary

def extract_text_from_file(resume):
    """
    Extracts text from a locally stored resume file (PDF or DOCX).
    Files are stored in MEDIA_ROOT/resumes/ on the local filesystem.
    """
    import os
    from django.conf import settings
    
    try:
        file_name_in_db = resume.file.name  # e.g. 'resumes/foo.pdf' or old 'media/resumes/foo.pdf'
        
        # Strip leading 'media/' that old Cloudinary records stored in the name
        if file_name_in_db.startswith('media/'):
            file_name_in_db = file_name_in_db[len('media/'):]
        
        file_path = os.path.join(settings.MEDIA_ROOT, file_name_in_db)
        file_name_lower = file_path.lower()
        
        logger.info(f"Reading resume from local path: {file_path}")
        
        if not os.path.exists(file_path):
            logger.error(f"File not found at {file_path}")
            return "Extraction failed. File not found on server."
        
        with open(file_path, 'rb') as f:
            file_bytes = f.read()
        
        # Detect PDF by magic bytes or extension
        is_pdf = file_name_lower.endswith('.pdf') or file_bytes.startswith(b'%PDF')
        text = ""
        
        if is_pdf:
            with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
                for page in pdf.pages:
                    extracted = page.extract_text()
                    if extracted:
                        text += extracted + "\n"
                        
        # DOCX parsing
        elif file_name.endswith('.docx'):
            doc = Document(io.BytesIO(file_bytes))
            for para in doc.paragraphs:
                text += para.text + "\n"
                
        # Fallback to Text decode
        else:
            if isinstance(file_bytes, bytes):
                text = file_bytes.decode('utf-8', errors='ignore')
            else:
                text = str(file_bytes)
                
        return text.strip()
    except Exception as e:
        logger.error(f"Failed to read file {resume.file.name}: {e}")
        return "Extraction failed. Manual review required."


def calculate_base_ats_score(resume_text, extracted_skills=None):
    """
    Calculates a baseline ATS Score (0-100) using rule-based metrics representing resume quality.
    This doesn't match against a JD, just evaluates the resume itself.
    """
    score = 50 # Start at 50 to indicate a generic baseline
    text_lower = resume_text.lower()
    
    # 1. Length & Word Count Check (Max 15 points)
    words = resume_text.split()
    word_count = len(words)
    if 300 <= word_count <= 1000:
        score += 15
    elif 150 <= word_count < 300:
        score += 10
    
    # 2. Section Headers Detection (Max 15 points)
    # Good resumes have standard headers
    standard_headers = ["experience", "education", "skills", "projects", "certifications", "summary", "objective"]
    headers_found = 0
    for header in standard_headers:
        # Check if the header exists followed by a newline or as a standalone line
        if re.search(r'\b' + header + r'\b[\s]*?\n', text_lower) or re.search(r'^\s*' + header + r'\s*$', text_lower, re.MULTILINE):
            headers_found += 1
            
    header_score = min(headers_found * 3, 15)
    score += header_score
    
    # 3. Action Verbs Check (Max 10 points)
    action_verbs = ['developed', 'managed', 'created', 'led', 'designed', 'improved', 'achieved', 'implemented', 'built', 'reduced', 'increased', 'coordinated']
    verbs_found = sum(1 for verb in action_verbs if verb in text_lower)
    verb_score = min(verbs_found * 2, 10)
    score += verb_score
    
    # 4. Metrics / Numbers Check (Max 10 points)
    # Professional resumes use numbers to quantify achievements
    numbers = re.findall(r'\b\d{1,3}(?:,\d{3})*(?:\.\d+)?%?\b', resume_text)
    metric_score = min(len(numbers), 10)
    score += metric_score
    
    # 5. Check if contact info exists (Email, Phone)
    has_email = bool(re.search(r'[\w\.-]+@[\w\.-]+\.\w+', resume_text))
    has_phone = bool(re.search(r'\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}', resume_text))
    if has_email: score += 5
    if has_phone: score += 5
        
    return min(max(int(score), 0), 100) # Clamp between 0 and 100

def get_keywords_from_text(text):
    """Simple keyword extractor returning a set of lowercase words filtering common stop words."""
    stop_words = {'the', 'a', 'to', 'and', 'of', 'in', 'for', 'with', 'on', 'is', 'as', 'at', 'an'}
    words = set(re.findall(r'\b[a-z]{2,}\b', text.lower()))
    return words - stop_words

def calculate_job_match_score(resume_skills, jd_text):
    """
    Compares a resume against a Job Description. 
    Returns a match score and a list of visually missing skills.
    In a real app, you'd extract 'required_skills' from JD first. We will use Gemini to help later,
    but this provides a fast initial heuristic.
    """
    if not jd_text or not resume_skills:
        return 0, []
        
    jd_keywords = get_keywords_from_text(jd_text)
    
    # Lowercase all resume skills
    resume_skills_lower = [s.lower() for s in resume_skills]
    
    matches = 0
    missing_based_on_heuristic = []
    
    # Simple heuristic: if a JD keyword matches a resume skill
    # We will refine this heavily with AI, this is just a fallback rule-based check
    # Let's count how many resume skills are mentioned in the JD
    for skill in resume_skills_lower:
        skill_words = set(skill.split())
        if skill_words.intersection(jd_keywords):
            matches += 1
            
    match_percentage = 0
    if len(resume_skills_lower) > 0:
        match_percentage = int((matches / len(resume_skills_lower)) * 100)
        
    # Cap to max 100
    match_percentage = min(match_percentage, 100)
    
    return match_percentage, missing_based_on_heuristic
