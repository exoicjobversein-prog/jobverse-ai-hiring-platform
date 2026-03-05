import logging
from celery import shared_task
from django.core.exceptions import ObjectDoesNotExist
from django.db import transaction
from django.utils import timezone

from .models import Attempt, Interview, Question, PracticeInterview, PracticeAttempt
from services.ai_service import evaluate_interview_answer, generate_interview_question

logger = logging.getLogger(__name__)

@shared_task(bind=True, max_retries=3)
def process_interview_answer(self, attempt_id):
    """
    Evaluates an interview answer using the JobVerse AI Interview Engine.
    """
    try:
        attempt = Attempt.objects.select_related('question', 'interview__application__job').get(id=attempt_id)
        
        job_requirements = attempt.interview.application.job.requirements
        resume_text = attempt.interview.application.resume.summary if attempt.interview.application.resume else ""
        conversation_history = attempt.interview.conversation_history or []
        
        evaluation = evaluate_interview_answer(
            question=attempt.question.question_text,
            answer=attempt.answer,
            resume_text=resume_text,
            job_requirements=job_requirements
        )

        with transaction.atomic():
            attempt.score = evaluation.get('score', 0)
            attempt.feedback = evaluation.get('feedback', '')
            attempt.save()

            # Update conversation history
            conversation_history.append({
                'question': attempt.question.question_text,
                'answer': attempt.answer,
                'score': attempt.score
            })
            attempt.interview.conversation_history = conversation_history
            attempt.interview.save()
            
            completed_questions = attempt.interview.questions.count()
            avg_score = sum(c.get('score', 0) for c in conversation_history) / len(conversation_history) if conversation_history else 0
            
            # Continue until 5 questions or confidence threshold (avg >=8) reached
            if completed_questions < 5 and avg_score < 8:
                next_question_text = evaluation.get('next_question', "Please elaborate on your previous experience in systems design.")
                Question.objects.create(
                    interview=attempt.interview,
                    question_text=next_question_text,
                    order=completed_questions + 1
                )
            else:
                attempts = Attempt.objects.filter(interview=attempt.interview, score__isnull=False)
                total_score = sum([a.score for a in attempts])
                average_score = int((total_score / (len(attempts) * 10)) * 100) if attempts else 0
                    
                attempt.interview.final_score = average_score
                attempt.interview.overall_feedback = f"JobVerse AI Interview Engine completed your session. Final score: {average_score}%"
                attempt.interview.status = 'COMPLETED'
                attempt.interview.completed_at = timezone.now()
                attempt.interview.save()
            
        return f"Processed Attempt {attempt_id} - Score: {attempt.score}"
        
    except ObjectDoesNotExist:
        logger.error(f"Attempt {attempt_id} not found.")
        return None
    except Exception as exc:
        logger.error(f"Error in process_interview_answer: {exc}")
        raise self.retry(exc=exc, countdown=30)


@shared_task(bind=True, max_retries=3)
def generate_initial_question(self, interview_id):
    """
    Generates the first question for an interview session asynchronously.
    """
    try:
        interview = Interview.objects.get(id=interview_id)
        job_requirements = interview.application.job.requirements
        resume_text = interview.application.resume.summary if interview.application.resume else ""
        
        question_text = generate_interview_question(
            resume_text=resume_text,
            job_requirements=job_requirements,
            previous_questions=[]
        )
        
        Question.objects.create(
            interview=interview,
            question_text=question_text,
            order=1
        )
        
        return f"Generated initial question for Interview {interview_id}"
        
    except ObjectDoesNotExist:
        logger.error(f"Interview {interview_id} not found.")
        return None
    except Exception as exc:
        logger.error(f"Error generating initial question: {exc}")
        raise self.retry(exc=exc, countdown=30)


@shared_task(bind=True, max_retries=3)
def process_practice_answer(self, practice_id, answer_text, is_first=False):
    """
    Evaluates a practice interview answer and generates next question.
    """
    try:
        session = PracticeInterview.objects.get(id=practice_id)
        history = session.conversation_history or []

        if is_first:
            question_text = generate_interview_question(
                resume_text="",
                job_requirements=f"General technical interview on topic: {session.topic}",
                previous_questions=[]
            )
            history.append({'question': question_text, 'answer': '', 'score': None})
            session.conversation_history = history
            session.save()
            return f"Generated first practice question for session {practice_id}"

        # Evaluate the latest attempt
        last_attempt = session.attempts.order_by('-order').first()
        if last_attempt and not last_attempt.score:
            evaluation = evaluate_interview_answer(
                question=last_attempt.question_text,
                answer=answer_text,
                resume_text="",
                job_requirements=f"General technical interview: {session.topic}"
            )
            last_attempt.score = evaluation.get('score', 0)
            last_attempt.feedback = evaluation.get('feedback', '')
            last_attempt.save()

            history.append({'question': last_attempt.question_text, 'answer': answer_text, 'score': last_attempt.score})
            session.conversation_history = history
            
            avg_score = sum(h.get('score', 0) or 0 for h in history if h.get('score') is not None)
            count = len([h for h in history if h.get('score') is not None])
            
            if count < 5:
                # Generate next question
                next_q = evaluation.get('next_question', '')
                if next_q:
                    history.append({'question': next_q, 'answer': '', 'score': None})
        
            session.save()

        return f"Processed practice answer for session {practice_id}"

    except ObjectDoesNotExist:
        logger.error(f"PracticeInterview {practice_id} not found.")
    except Exception as exc:
        logger.error(f"Error in process_practice_answer: {exc}")
        raise self.retry(exc=exc, countdown=30)

