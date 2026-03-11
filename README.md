# Interview Prep Assistant

A small full-stack application for practicing technical interview questions.

- **Backend:** Flask API  
- **Frontend:** React + Vite  
- **Database:** SQLite  

The application allows users to create interview topics, add questions, and receive simple AI-based summaries and answer feedback.

---

# Tech Stack

## Backend
- Python
- Flask
- SQLAlchemy
- Flask-CORS
- SQLite

## Frontend
- React
- Vite
- Fetch API

---

# Project Structure

```
prep-backend/
  app.py
  models.py
  database.py
  ai.py

prep-frontend/
  src/
    components/
    App.jsx
```

---

# Backend

The backend provides REST APIs built with Flask.

Main endpoints:

```
GET  /api/topics
POST /api/topics

GET  /api/questions
POST /api/questions

POST /api/ai/topic-summary
POST /api/ai/review-answer
```

The backend uses **SQLite with SQLAlchemy ORM** for database management.

---

# Frontend

The frontend is a **React single-page application** built with **Vite**.

Main components:

- **TopicList** – create and select interview topics  
- **QuestionList** – view and add questions  
- **QuestionDetail** – display full question content  
- **AiPanel** – generate topic summary and review answers

---

# AI Logic

Current AI features are implemented using **simple Python heuristics**:

- **Topic Summary** – generates a basic summary from question texts.
- **Answer Review** – rates answers from **1–5** and provides simple feedback.

These functions are designed so they can easily be replaced with a real **LLM API**.

---

# Running the Project

## Backend

```
cd prep-backend
pip install -r requirements.txt
python app.py
```

Backend runs on:

```
http://localhost:8000
```

---

## Frontend

```
cd prep-frontend
npm install
npm run dev
```

Open in browser:

```
http://localhost:5173
```

---

# Future Improvements

- Integrate real LLM APIs
- Add user authentication
- Improve AI feedback quality
- Support multi-user environment with cloud database
