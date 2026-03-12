import logging
from django.core.exceptions import ObjectDoesNotExist

from .models import Resume
from services.ai_service import evaluate_resume_base, evaluate_resume_for_job
from services.resume_service import extract_text_from_file, calculate_base_ats_score, calculate_job_match_score

logger = logging.getLogger(__name__)


def process_resume_base_evaluation(resume_id):
    """
    Evaluates the base quality of a resume.
    Runs in a background thread (no Celery broker required).
    """
    try:
        resume = Resume.objects.get(id=resume_id)

        logger.info(f"[ATS] Starting base evaluation for Resume {resume_id}")

        # 1. Extract text
        resume_text = extract_text_from_file(resume)
        logger.info(f"[ATS] Extracted {len(resume_text)} chars from Resume {resume_id}")

        # 2. Heuristic ATS score
        initial_score = calculate_base_ats_score(resume_text)
        resume.initial_ats_score = initial_score
        resume.save(update_fields=['initial_ats_score'])

        # 3. AI Evaluation (Gemini)
        logger.info(f"[ATS] Calling Gemini for Resume {resume_id}, initial_score={initial_score}")
        evaluation = evaluate_resume_base(resume_text, initial_score)

        # 4. Save all results
        resume.final_ats_score = evaluation.get('final_ats_score', initial_score)
        resume.technical_score = resume.final_ats_score
        resume.skills = evaluation.get('skills', [])
        resume.strengths = evaluation.get('strengths', [])
        resume.weaknesses = evaluation.get('weaknesses', [])
        resume.suggestions = evaluation.get('suggestions', [])
        resume.is_processed = True
        resume.save()

        logger.info(f"[ATS] Resume {resume_id} done — Final ATS: {resume.final_ats_score}")
        return f"Evaluated Resume {resume_id} - Base ATS: {resume.final_ats_score}"

    except ObjectDoesNotExist:
        logger.error(f"[ATS] Resume {resume_id} not found.")
    except Exception as exc:
        logger.exception(f"[ATS] Unexpected error evaluating Resume {resume_id}: {exc}")


def process_job_matching(resume_id, job_description):
    """
    Evaluates how well a resume matches a Job Description.
    Runs in a background thread (no Celery broker required).
    """
    try:
        resume = Resume.objects.get(id=resume_id)
        resume_text = extract_text_from_file(resume)

        # 1. Heuristic matching
        heuristic_score, _ = calculate_job_match_score(resume.skills, job_description)

        # 2. AI Matching
        match_results = evaluate_resume_for_job(resume_text, job_description, heuristic_score)

        # 3. Save
        resume.job_match_score = match_results.get('job_match_score', heuristic_score)
        resume.missing_skills = match_results.get('missing_skills', [])
        resume.save(update_fields=['job_match_score', 'missing_skills'])

        logger.info(f"[JD] Resume {resume_id} matched — Score: {resume.job_match_score}")
        return f"Matched Resume {resume_id} - Score: {resume.job_match_score}"

    except ObjectDoesNotExist:
        logger.error(f"[JD] Resume {resume_id} not found.")
    except Exception as exc:
        logger.exception(f"[JD] Unexpected error matching Resume {resume_id}: {exc}")
