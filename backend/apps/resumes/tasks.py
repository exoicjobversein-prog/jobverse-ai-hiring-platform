import logging
from celery import shared_task
from django.core.exceptions import ObjectDoesNotExist

from .models import Resume
from services.ai_service import evaluate_resume

logger = logging.getLogger(__name__)

@shared_task(bind=True, max_retries=3)
def process_resume_evaluation(self, resume_id, job_requirements):
    """
    Celery task to asynchronously extract text from a resume and evaluate it.
    """
    try:
        resume = Resume.objects.get(id=resume_id)
        
        # For simplicity in this implementation, we assume basic text extraction.
        # A production application would use pdfplumber, PyPDF2, or textract.
        # We will read the file and Decode standard text files, or fallback for demonstration.
        try:
            resume.file.open('r')
            resume_text = resume.file.read()
            if isinstance(resume_text, bytes):
                resume_text = resume_text.decode('utf-8', errors='ignore')
        except Exception as e:
            logger.error(f"Failed to read resume file: {e}")
            resume_text = f"Candidate applied. Manual review required. Could not parse file formatted: {e}"
        finally:
            resume.file.close()

        # Call the Gemini AI service
        evaluation = evaluate_resume(resume_text, job_requirements)
        
        # Update and save the Resume model
        resume.technical_score = evaluation.get('technical_score', 0)
        resume.skills = evaluation.get('skills', [])
        resume.summary = evaluation.get('summary', '')
        resume.is_processed = True
        resume.save()
        
        return f"Evaluated Resume {resume_id} - Score: {resume.technical_score}"

    except ObjectDoesNotExist:
        logger.error(f"Resume {resume_id} not found.")
        return None
    except Exception as exc:
        logger.error(f"Unexpected error in process_resume_evaluation: {exc}")
        # Retry for temporary API failures
        raise self.retry(exc=exc, countdown=60)
