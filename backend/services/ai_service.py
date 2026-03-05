import os
import json
import google.generativeai as genai
from django.conf import settings

# Initialize Gemini
genai.configure(api_key=settings.GEMINI_API_KEY)
# Using gemini-1.5-flash which is standard for text generation tasks
model = genai.GenerativeModel('gemini-1.5-flash')

def evaluate_resume(resume_text, job_requirements):
    """
    Evaluates a resume against job requirements.
    Returns structured JSON with technical_score, skills, and summary.
    """
    prompt = f"""
    You are an expert technical recruiter matching a resume to a job description.
    Job Requirements:
    {job_requirements}

    Resume:
    {resume_text}

    Evaluate the candidate out of 100 based strictly on the job requirements.
    Return ONLY a valid JSON object with the following keys, no markdown formatting:
    {{
        "technical_score": integer between 0-100,
        "skills": list of strings (matched skills),
        "summary": "String explaining the candidate's suitability"
    }}
    """
    
    try:
        response = model.generate_content(prompt)
        result_text = response.text.strip()
        if result_text.startswith('```json'):
            result_text = result_text[7:]
        if result_text.endswith('```'):
            result_text = result_text[:-3]
            
        return json.loads(result_text)
    except Exception as e:
        return {
            "technical_score": 0,
            "skills": [],
            "summary": f"Failed to parse AI response: {str(e)}"
        }


def generate_interview_question(resume_text, job_requirements, previous_questions=None):
    """
    Generates a new, dynamic interview question tailored to the candidate.
    """
    if previous_questions is None:
        previous_questions = []
        
    prompt = f"""
    You are an expert technical interviewer conducting an interview.
    Job Requirements: {job_requirements}
    Candidate Resume: {resume_text}
    Questions Already Asked: {previous_questions}

    Generate the next highly technical interview question for this candidate. Do not repeat previous questions.
    Return ONLY a string containing the question text.
    """
    
    try:
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        print(f"AI Generation Error: {e}")
        return "Could you provide more details about your relevant experience for this role?"


def evaluate_interview_answer(question, answer, resume_text, job_requirements):
    """
    Evaluates a candidate's answer to an interview question.
    Returns structured JSON with score, feedback, and a suggested next question.
    """
    prompt = f"""
    You are an expert technical interviewer. Evaluate the candidate's answer.
    Job Requirements: {job_requirements}
    Resume Context: {resume_text}
    
    Question Asked: {question}
    Candidate's Answer: {answer}

    Return ONLY a valid JSON object with the following keys, no markdown formatting:
    {{
        "score": integer between 1-10 rating the answer,
        "feedback": "Constructive feedback on the answer",
        "next_question": "A logical follow-up question based on their answer, or a new topic if they failed"
    }}
    """
    
    try:
        response = model.generate_content(prompt)
        result_text = response.text.strip()
        if result_text.startswith('```json'):
            result_text = result_text[7:]
        if result_text.endswith('```'):
            result_text = result_text[:-3]
            
        return json.loads(result_text)
    except Exception as e:
        print(f"AI Evaluation Error: {e}")
        return {
            "score": 5,
            "feedback": "Your answer has been recorded, but AI evaluation is temporarily unavailable.",
            "next_question": "Please describe a challenging project you have worked on recently."
        }


def generate_final_report(job_requirements, attempts_data):
    """
    Generates a final evaluation report for the candidate based on their answers.
    attempts_data: list of dicts with {'question': q, 'answer': a, 'score': s, 'feedback': f}
    """
    prompt = f"""
    You are an expert technical interviewer summarizing an interview.
    Job Requirements: {job_requirements}
    Interview Transcript: {json.dumps(attempts_data)}
    
    Provide a final assessment of the candidate based on their performance in the transcript.
    Return ONLY a valid JSON object with the following keys, no markdown formatting:
    {{
        "strengths": "String summarizing candidate's strengths based on the answers.",
        "weaknesses": "String summarizing areas for improvement.",
        "recommendation": "Final recommendation (e.g., 'Proceed to technical round', 'Reject', 'Hire')."
    }}
    """
    try:
        response = model.generate_content(prompt)
        result_text = response.text.strip()
        if result_text.startswith('```json'):
            result_text = result_text[7:]
        if result_text.endswith('```'):
            result_text = result_text[:-3]
            
        return json.loads(result_text)
    except Exception as e:
        print(f"AI Report Generation Error: {e}")
        return {
            "strengths": "The candidate successfully completed the interview.",
            "weaknesses": "Pending detailed manual review due to an AI processing delay.",
            "recommendation": "Review transcript manually."
        }
