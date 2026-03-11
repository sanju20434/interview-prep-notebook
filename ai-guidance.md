## AI Guidance for This Project

This file explains how you can replace the current rule‑based AI in `prep-backend/ai.py` with a real LLM while keeping the same API contract for the frontend.

The key idea: **keep the function signatures and JSON shapes the same**, but delegate the “brain” of each feature to an LLM with well‑designed prompts.

---

## Goals

- **Topic summary**: Given all questions under a topic, generate:
  - A concise, high‑level explanation of what the topic covers.
  - A list of concrete focus areas the candidate should study.
- **Answer review**: Given a candidate’s free‑form answer:
  - Provide a **1–5 rating**.
  - Provide **clear, constructive feedback** pointing out strengths and missing pieces.

The frontend already expects:

- Topic summary:
  ```json
  {
    "summary": "string",
    "focus_areas": ["string", "..."]
  }
  ```
- Answer review:
  ```json
  {
    "rating": 1,
    "feedback": "string"
  }
  ```

Keep these shapes exactly the same when you move to a real LLM.

---

## High‑level integration plan

1. **Choose a provider**  
   Example options:
   - OpenAI (`gpt-4.x`, `gpt-4o` style models)
   - Anthropic (Claude)
   - Google (Gemini)
   - Any self‑hosted / open‑source model behind an HTTP API

2. **Create a thin client wrapper**  
   In `prep-backend`, add something like `llm_client.py`:

   - Reads an API key from environment variables (`.env`) using `python-dotenv`.
   - Exposes a function, e.g. `call_llm(messages: List[dict]) -> dict` that:
     - Accepts chat‑style messages (`role` + `content`).
     - Calls the provider’s API.
     - Returns the parsed JSON content you care about.

3. **Update `ai.py` internals only**  
   - Keep:
     - `summarize_topic_questions(questions: List[str])` → `{"summary", "focus_areas"}`
     - `review_answer(answer: str)` → `{"rating", "feedback"}`
   - Inside those functions:
     - Build prompts.
     - Call `llm_client.call_llm`.
     - Validate/normalize the response into the expected JSON format.

4. **Do not change the Flask routes**  
   - `/api/ai/topic-summary` and `/api/ai/review-answer` should keep the same request/response shapes.
   - This way, the React UI keeps working without any changes.

---

## Prompt design: topic summary

### Recommended system prompt

Use a system message that establishes role, tone, and output format, for example:

> You are an assistant helping a software engineer prepare for technical interviews.  
> You receive several interview questions belonging to the same topic.  
> Your job is to:
> 1. Explain, in a few sentences, what the topic is about at a high level.  
> 2. List 3–7 concrete focus areas the candidate should study.  
>  
> Output **valid JSON only**, with this structure:  
> `{ "summary": string, "focus_areas": string[] }`.  
> Do not include any extra keys. Do not include markdown.

### Recommended user prompt template

When calling `summarize_topic_questions(questions: List[str])`, build a user message like:

> Here are all the questions for a single interview topic.  
> Each question is prefixed with "Q:".  
>  
> Questions:  
> Q: Explain how a hash map works internally.  
> Q: What is the time complexity of inserting into a balanced binary search tree?  
> Q: Compare arrays and linked lists in terms of random access and insertion.  
>  
> Using only these questions, generate a short topic summary and a list of focus areas using the output format described in the system prompt.

In code, you’d join the question bodies into a single string, with `Q:` prefixes or bullet points so the LLM can see clear boundaries.

### Expected LLM response shape

Ask the model to return JSON like:

```json
{
  "summary": "This topic focuses on core data structure concepts...",
  "focus_areas": [
    "Array vs linked list trade-offs",
    "Hash table internals and collision handling",
    "Big-O complexity of common operations",
    "Balanced binary search trees and rotations"
  ]
}
```

In Python, you should:

- Parse the response as JSON.
- Validate:
  - `summary` exists and is a string.
  - `focus_areas` is a non-empty list of strings.
- If parsing or validation fails, fall back to a safe default instead of crashing.

---

## Prompt design: answer review

### Recommended system prompt

For `review_answer(answer: str)`:

> You are an interview coach for software engineers.  
> You will receive a single candidate answer to an interview question.  
> Your job is to rate the answer from 1 to 5 and give concise, constructive feedback.  
>  
> Scoring guidelines:  
> - 1 = very weak, mostly incorrect or extremely incomplete  
> - 2 = weak, some correct ideas but many gaps  
> - 3 = acceptable, covers core ideas but missing depth or clarity  
> - 4 = strong, mostly complete with minor omissions  
> - 5 = excellent, clear, accurate, and thorough  
>  
> Output **valid JSON only** with this structure:  
> `{ "rating": number, "feedback": string }`.  
> `rating` must be an integer between 1 and 5.  
> Do not include markdown or any extra keys.

### Recommended user prompt template

Build a user message like:

> Here is the candidate’s answer to an interview question.  
>  
> Answer:  
> """
> {candidate_answer}
> """
>  
> Use the scoring guidelines from the system prompt.  
> Return JSON only.

Where `{candidate_answer}` is the raw answer string you receive from the frontend.

### Expected LLM response shape

```json
{
  "rating": 4,
  "feedback": "Good explanation of time complexity and space trade-offs. You could improve it by adding more detail on real-world use cases and edge cases."
}
```

Again, parse and validate in Python, and clamp `rating` into the `1–5` range if necessary.

---

## Implementation sketch (Python, pseudo-code)

Below is a rough outline of how `ai.py` might look once wired to an LLM. This is **illustrative only**; adapt it to your chosen provider:

```python
from typing import List, Dict, Any
from .llm_client import call_llm  # your wrapper


def summarize_topic_questions(questions: List[str]) -> Dict[str, Any]:
    system_prompt = (
        "You are an assistant helping a software engineer prepare for technical interviews. "
        "You receive several interview questions belonging to the same topic. "
        "Your job is to: "
        "1) explain, in a few sentences, what the topic is about at a high level; "
        "2) list 3–7 concrete focus areas the candidate should study. "
        'Output valid JSON only with keys "summary" and "focus_areas" (string array). '
        "Do not include markdown."
    )

    questions_text = "\n".join(f"Q: {q}" for q in questions)
    user_prompt = (
        "Here are all the questions for a single interview topic.\n\n"
        "Questions:\n"
        f"{questions_text}\n\n"
        "Using only these questions, generate a short topic summary and a list of focus areas "
        "using the output format described in the system prompt."
    )

    raw = call_llm(system_prompt=system_prompt, user_prompt=user_prompt)
    # `raw` should already be parsed JSON from your client.

    summary = raw.get("summary") or "Summary unavailable."
    focus_areas = raw.get("focus_areas") or []
    if not isinstance(focus_areas, list):
        focus_areas = [str(focus_areas)]

    return {
        "summary": str(summary),
        "focus_areas": [str(x) for x in focus_areas if str(x).strip()],
    }
```

```python
def review_answer(answer: str) -> Dict[str, Any]:
    system_prompt = (
        "You are an interview coach for software engineers. "
        "You will receive a single candidate answer to an interview question. "
        "Your job is to rate the answer from 1 to 5 and give concise, constructive feedback. "
        "Scoring: 1=very weak, 2=weak, 3=acceptable, 4=strong, 5=excellent. "
        'Output valid JSON only with keys "rating" (int 1–5) and "feedback" (string). '
        "Do not include markdown."
    )

    user_prompt = (
        "Here is the candidate's answer to an interview question.\n\n"
        "Answer:\n"
        f'"""\n{answer}\n"""\n\n'
        "Use the scoring guidelines from the system prompt and return JSON only."
    )

    raw = call_llm(system_prompt=system_prompt, user_prompt=user_prompt)
    rating = raw.get("rating", 3)
    try:
        rating = int(rating)
    except (TypeError, ValueError):
        rating = 3
    rating = max(1, min(5, rating))

    feedback = raw.get("feedback") or "Feedback unavailable."

    return {"rating": rating, "feedback": str(feedback)}
```

---

## Safety and robustness tips

- **Timeouts and fallbacks**
  - Set reasonable timeouts on the LLM HTTP call.
  - If the call fails or times out, fall back to your existing heuristic implementation instead of returning a 500.

- **JSON‑only responses**
  - Always ask for “valid JSON only”.
  - Use a robust parser and strip extra whitespace.
  - Consider wrapping parsing in a `try/except` and defaulting to a safe response on failure.

- **Cost control**
  - Truncate very long answers or huge question sets before sending to the LLM.
  - Consider caching summaries for a topic so you don’t recompute them on every click.

- **Determinism for demos**
  - Optionally fix `temperature` to a low value (e.g. 0–0.3) to reduce randomness between runs.

With these patterns, you can turn the current rule‑based helpers into real AI features with minimal changes to the rest of the codebase.

