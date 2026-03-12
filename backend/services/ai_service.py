import os
import re
import json
import google.generativeai as genai
from django.conf import settings

# Initialize Gemini
genai.configure(api_key=settings.GEMINI_API_KEY)
# Using gemini-flash-latest since 1.5 is unavailable and 2.0 has quota limits
model = genai.GenerativeModel('gemini-flash-latest')

def evaluate_resume_base(resume_text, initial_ats_score):
    """
    Evaluates a resume's overall quality using Gemini to provide a final ATS score, extracted skills, and suggestions.
    """
    prompt = f"""
    You are an expert AI Resume ATS Analyzer.
    A rule-based system gave this resume an initial score of {initial_ats_score} / 100 based on word count, sections, action verbs, and metrics.
    
    Resume Text:
    {resume_text}

    Tasks:
    1. Adjust the ATS score out of 100 based on the actual quality of the content (impact, clarity, relevance).
    2. Extract a list of skills (technical, soft, tools) found in the resume.
    3. List the candidate's strengths.
    4. List areas of weakness or missing sections.
    5. Provide actionable suggestions to improve the resume for ATS systems.

    Return ONLY a valid JSON object with the following keys, no markdown formatting (e.g., do not use ```json...):
    {{
        "final_ats_score": integer between 0-100,
        "skills": ["skill1", "skill2"],
        "strengths": ["strength1", "strength2"],
        "weaknesses": ["weakness1", "weakness2"],
        "suggestions": ["suggestion1"]
    }}
    """
    
    try:
        response = model.generate_content(prompt)
        result_text = response.text.strip()
        # More robust JSON extraction
        match = re.search(r'\{.*\}', result_text, re.DOTALL)
        if match:
            return json.loads(match.group(0))
        return json.loads(result_text)
    except Exception as e:
        print(f"AI Base Evaluation Error: {e}")
        return {
            "final_ats_score": initial_ats_score,
            "skills": [],
            "strengths": ["Unable to generate via AI at this moment."],
            "weaknesses": ["Unable to generate via AI at this moment."],
            "suggestions": ["Ensure file formatting is clean and try again."]
        }

def evaluate_resume_for_job(resume_text, job_description, heuristic_score):
    """
    Evaluates how well a resume matches a specific Job Description.
    """
    prompt = f"""
    You are an expert technical recruiter matching a resume to a job description.
    Job Requirements:
    {job_description}

    Resume:
    {resume_text}

    Tasks:
    1. Evaluate the match between the resume and the job requirements. A heuristic match was {heuristic_score}%. Provide an accurate match score (0-100).
    2. Identify specific required keywords/skills from the job description that are MISSING in the resume.

    Return ONLY a valid JSON object with the following keys, no markdown formatting:
    {{
        "job_match_score": integer between 0-100,
        "missing_skills": ["missing1", "missing2"]
    }}
    """
    
    try:
        response = model.generate_content(prompt)
        result_text = response.text.strip()
        match = re.search(r'\{.*\}', result_text, re.DOTALL)
        if match:
            return json.loads(match.group(0))
        return json.loads(result_text)
    except Exception as e:
        print(f"AI JD Matching Error: {e}")
        return {
            "job_match_score": heuristic_score,
            "missing_skills": ["AI processing failed to detect missing skills"]
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
