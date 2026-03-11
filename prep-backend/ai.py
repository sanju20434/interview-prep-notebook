from typing import List, Dict


def summarize_topic_questions(questions: List[str]) -> Dict[str, str]:
    if not questions:
        return {
            "summary": "No questions have been added for this topic yet.",
            "focus_areas": [],
        }

    joined = " ".join(q.lower() for q in questions)

    focus_areas = []
    for keyword in ["array", "tree", "graph", "dynamic programming", "react", "database", "system design"]:
        if keyword in joined:
            focus_areas.append(keyword)

    summary = (
        "This topic currently focuses on interview questions such as "
        + ", ".join(questions[:3])
        + (" and more." if len(questions) > 3 else ".")
    )

    return {
        "summary": summary,
        "focus_areas": focus_areas,
    }


def review_answer(answer: str) -> Dict[str, str]:
    text = (answer or "").strip()
    if not text:
        return {
            "rating": 1,
            "feedback": "No answer was provided. Try writing at least a brief explanation of your approach.",
        }

    length = len(text.split())

    if length < 20:
        rating = 2
        feedback = (
            "Your answer is very brief. Interviewers usually expect more detail about trade-offs, "
            "time and space complexity, and edge cases."
        )
    elif length < 80:
        rating = 4
        feedback = (
            "This is a solid start. You cover the core idea, but you could strengthen it by "
            "explicitly mentioning complexity and potential improvements."
        )
    else:
        rating = 5
        feedback = (
            "Great depth and clarity. You explain the approach, justify decisions, and consider trade-offs. "
            "In a real interview, keep this structure but be concise due to time constraints."
        )

    return {
        "rating": rating,
        "feedback": feedback,
    }

