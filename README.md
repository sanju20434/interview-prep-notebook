## Interview Prep Assistant

A small full-stack project for practicing technical interview questions. The backend is a **Flask + SQLite** API and the frontend is a **React + Vite** single‑page app. All “AI” behavior is currently implemented with simple Python heuristics, but the contracts are designed so you can swap in a real LLM later.

---

## Stack

- **Backend**: Python, Flask, Flask-CORS, SQLAlchemy, python-dotenv, SQLite
- **Frontend**: React, Vite, Fetch API
- **Database**: SQLite file (default: `interview_prep.db`)

Project layout:

- `prep-backend/` — Flask API + SQLite models + rule‑based AI helpers
- `prep-frontend/` — React/Vite UI talking to the backend

---

## Backend (`prep-backend`)

### Tech

- **Framework**: Flask
- **ORM**: SQLAlchemy
- **DB**: SQLite, connection URL `sqlite:///./interview_prep.db`
- **CORS**: enabled so the Vite dev server can talk to the API

### Data model

Defined in `models.py`:

- **Topic**
  - `id` (int, primary key)
  - `name` (string, unique)
  - `description` (string)
  - `created_at` (datetime)
- **Question**
  - `id` (int, primary key)
  - `topic_id` (FK → `Topic.id`)
  - `title` (string)
  - `body` (string, full question text)
  - `difficulty` (string; e.g. `"Easy" | "Medium" | "Hard"`)
  - `created_at` (datetime)

### Database setup

`database.py`:

- Creates a **SQLite** database at `sqlite:///./interview_prep.db` by default.
- Exposes:
  - `Base` — SQLAlchemy declarative base
  - `SessionLocal` — session factory
  - `init_db()` — creates tables based on the models

### AI utilities (rule‑based heuristics)

Located in `ai.py`:

- **`summarize_topic_questions(questions: List[str])`**
  - Input: list of question bodies for a topic.
  - Output: `{"summary": string, "focus_areas": List[str]}`
  - Implementation: very simple keyword/heuristic analysis over the questions.
- **`review_answer(answer: str)`**
  - Input: the candidate’s free‑form answer.
  - Output: `{"rating": int (1–5), "feedback": string}`
  - Implementation: scores based on length and presence of key phrases, then returns lightweight feedback.

> **Note:** these are intentionally simple so you can easily replace them with a real LLM call (see `ai-guidance.md`).

### Flask application (`app.py`)

- **`create_app()`**:
  - Initializes the database (`init_db()`).
  - Configures CORS.
  - Registers all API routes.
- When run directly (`python app.py`), starts the dev server on **http://localhost:8000**.

#### Health

- **GET `/api/health`**
  - Returns a basic JSON payload so you can verify the backend is running.

#### Topics endpoints

- **POST `/api/topics`**
  - **Body**: `{ "name": string, "description": string }`
  - Validates:
    - `name` is present and non‑empty.
    - No existing topic with the same `name`.
  - **Response**: created topic object.

- **GET `/api/topics`**
  - Lists all topics, typically ordered with **newest first**.
  - **Response**: `[{ id, name, description, created_at }, ...]`

#### Questions endpoints

- **POST `/api/questions`**
  - **Body**:
    ```json
    {
      "topic_id": number,
      "title": "string",
      "body": "string",
      "difficulty": "Easy" | "Medium" | "Hard"   // optional, defaults server-side
    }
    ```
  - Creates a question belonging to an existing topic.
  - **Response**: created question object.

- **GET `/api/questions`**
  - Optional query parameter: `topic_id`.
  - When `topic_id` is provided: returns questions only for that topic.
  - When omitted: returns all questions.
  - **Response**: `[{ id, topic_id, title, body, difficulty, created_at }, ...]`

- **GET `/api/questions/<id>`**
  - Fetch a single question by its ID.
  - **Response**: full question object or 404 if not found.

#### AI endpoints

- **POST `/api/ai/topic-summary`**
  - **Body**: `{ "topic_id": number }`
  - Looks up all questions under that topic, passes their bodies into `summarize_topic_questions`, and returns:
    ```json
    {
      "summary": "High-level summary of topic questions",
      "focus_areas": ["Area 1", "Area 2", "..."]
    }
    ```

- **POST `/api/ai/review-answer`**
  - **Body**: `{ "answer": "string" }`
  - Passes the answer into `review_answer` and returns:
    ```json
    {
      "rating": 1,
      "feedback": "Short explanation of what went well or is missing"
    }
    ```

### Running the backend

```bash
cd prep-backend
pip install -r requirements.txt
python app.py
# Server listens on http://localhost:8000
```

---

## Frontend (`prep-frontend`)

### Tech

- **Framework**: React
- **Bundler/dev server**: Vite
- **Language**: JavaScript (ESNext)

Key files:

- `package.json` — scripts and dependencies.
- `vite.config.mts` — Vite + React plugin config.
- `index.html` — root HTML shell.
- `src/main.jsx` — mounts `<App />` and wires up `styles.css`.
- `src/App.jsx` — top‑level layout and data fetching.

### Global app behavior (`App.jsx`)

State it keeps:

- `topics`, `selectedTopicId`
- `questions`, `selectedQuestionId`
- `loading`, `error`

It talks to the backend using `API_BASE = "http://localhost:8000/api"`:

- Fetches topics via **GET `/api/topics`**.
- When a topic is selected, fetches questions via **GET `/api/questions?topic_id=...`**.

Layout:

- **Left column**: `TopicList` — pick or create topics.
- **Middle column**: `QuestionList` — pick or create questions.
- **Right column**: `QuestionDetail` + `AiPanel` — see question details and interact with the AI helpers.

### Components

- **`TopicList.jsx`**
  - Displays all topics and lets you select one.
  - Contains a simple form to create new topics (POST `/api/topics`).

- **`QuestionList.jsx`**
  - Shows questions for the currently selected topic.
  - Each question is selectable.
  - Contains a form to add a new question (POST `/api/questions`) with a difficulty dropdown (`Easy/Medium/Hard`).

- **`QuestionDetail.jsx`**
  - Shows the full title, body, and difficulty of the selected question.

- **`AiPanel.jsx`**
  - **Topic summary**:
    - Button that calls POST `/api/ai/topic-summary`.
    - Displays the returned summary plus “focus area” tags.
  - **Answer review**:
    - Textarea to type your answer.
    - Button that calls POST `/api/ai/review-answer`.
    - Displays the rating (1–5) and free‑form feedback from the backend.

### Styling (`src/styles.css`)

- Custom layout with:
  - Three‑column **dashboard‑style** grid (topics / questions / detail+AI).
  - Dark gradient background, rounded cards, subtle borders.
  - Difficulty badges, styled buttons, and tuned typography.
- No comments, just clean, modern CSS.

### Running the frontend

```bash
cd prep-frontend
npm install
npm run dev
# Open http://localhost:5173 in your browser
```

Make sure the backend is running on `http://localhost:8000` so the UI can reach the API at `http://localhost:8000/api`.

---

## How the AI logic works today

Right now, *all* AI behavior is **rule‑based**:

- Topic summaries are produced by scanning question bodies and using simple keyword logic.
- Answer reviews are scored based on length / basic patterns and mapped to a 1–5 rating with canned feedback.

This has a few benefits:

- No external dependencies or API keys required.
- Easy to understand and debug.
- Clean interface that you can later redirect to a real LLM.

See `ai-guidance.md` for how to plug in an actual model.

---

## Swapping in a real LLM (high level)

To connect a real LLM:

1. **Pick a provider**  
   For example: OpenAI, Anthropic, Gemini, or any compatible hosted model.

2. **Add a small client wrapper**  
   - Create a module that takes `(prompt, input data)` and calls the provider’s API.
   - Centralize auth (API key from environment variables via `python-dotenv`).

3. **Replace the internals of `ai.py`**  
   - Keep function signatures the same (`summarize_topic_questions`, `review_answer`).
   - Inside those functions, build prompts and call the LLM instead of keyword logic.

4. **Keep responses backward‑compatible**  
   - Continue returning:
     - `{"summary": str, "focus_areas": List[str>}` for topic summaries.
     - `{"rating": int, "feedback": str}` for answer reviews.
   - This keeps the frontend unchanged.

For detailed prompt ideas, see `ai-guidance.md`.

---

## Local development workflow

- **Backend first**:
  - Start the Flask server on `http://localhost:8000`.
  - Verify `/api/health` in the browser or with `curl/Postman`.
- **Frontend next**:
  - Start Vite on `http://localhost:5173`.
  - Create a topic, then add a few questions.
  - Use the AI panel to generate a topic summary and review some test answers.

---

## Risks and future extensions

- **Current “AI” is not real AI**: purely heuristic, not semantic. Quality is limited by design.
- **SQLite limitations**: great for local / single‑user, but not ideal for a multi‑user production deployment.

Potential next steps:

- Plug in a real LLM using the patterns in `ai-guidance.md`.
- Add user auth and per‑user topics/questions.
- Add tagging, difficulty calibration, and spaced‑repetition scheduling.
- Add export/import (JSON or CSV) for topics and questions.

