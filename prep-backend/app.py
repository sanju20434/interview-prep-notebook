from contextlib import contextmanager

from flask import Flask, jsonify, request
from flask_cors import CORS

from database import get_db, init_db
from models import Topic, Question
from ai import summarize_topic_questions, review_answer


def create_app():
  app = Flask(__name__)
  CORS(app, resources={r"/api/*": {"origins": "*"}})

  init_db()

  @contextmanager
  def db_session():
    db_gen = get_db()
    db = next(db_gen)
    try:
      yield db
    finally:
      db_gen.close()

  @app.get("/api/health")
  def health():
    return jsonify({"status": "ok"})

  @app.post("/api/topics")
  def create_topic():
    data = request.get_json() or {}
    name = (data.get("name") or "").strip()
    description = (data.get("description") or "").strip() or None

    if not name:
      return jsonify({"error": "Topic name is required."}), 400

    with db_session() as db:
      existing = db.query(Topic).filter(Topic.name == name).first()
      if existing:
        return jsonify({"error": "A topic with this name already exists."}), 400

      topic = Topic(name=name, description=description)
      db.add(topic)
      db.commit()
      db.refresh(topic)

      return jsonify(
        {
          "id": topic.id,
          "name": topic.name,
          "description": topic.description,
          "created_at": topic.created_at.isoformat(),
        }
      )

  @app.get("/api/topics")
  def list_topics():
    with db_session() as db:
      topics = db.query(Topic).order_by(Topic.created_at.desc()).all()
      return jsonify(
        [
          {
            "id": t.id,
            "name": t.name,
            "description": t.description,
            "created_at": t.created_at.isoformat(),
          }
          for t in topics
        ]
      )

  @app.put("/api/topics/<int:topic_id>")
  def update_topic(topic_id: int):
    data = request.get_json() or {}
    name = (data.get("name") or "").strip()
    description = (data.get("description") or "").strip() or None

    if not name:
      return jsonify({"error": "Topic name is required."}), 400

    with db_session() as db:
      topic = db.query(Topic).get(topic_id)
      if not topic:
        return jsonify({"error": "Topic not found."}), 404

      existing = (
        db.query(Topic)
        .filter(Topic.name == name)
        .filter(Topic.id != topic_id)
        .first()
      )
      if existing:
        return jsonify({"error": "A topic with this name already exists."}), 400

      topic.name = name
      topic.description = description
      db.commit()
      db.refresh(topic)

      return jsonify(
        {
          "id": topic.id,
          "name": topic.name,
          "description": topic.description,
          "created_at": topic.created_at.isoformat(),
        }
      )

  @app.post("/api/questions")
  def create_question():
    data = request.get_json() or {}
    topic_id = data.get("topic_id")
    title = (data.get("title") or "").strip()
    body = (data.get("body") or "").strip()
    difficulty = (data.get("difficulty") or "").strip() or None

    if not topic_id or not title or not body:
      return jsonify({"error": "topic_id, title and body are required."}), 400

    with db_session() as db:
      topic = db.query(Topic).get(topic_id)
      if not topic:
        return jsonify({"error": "Topic not found."}), 404

      question = Question(
        topic_id=topic_id,
        title=title,
        body=body,
        difficulty=difficulty,
      )
      db.add(question)
      db.commit()
      db.refresh(question)

      return jsonify(
        {
          "id": question.id,
          "topic_id": question.topic_id,
          "title": question.title,
          "body": question.body,
          "difficulty": question.difficulty,
          "created_at": question.created_at.isoformat(),
        }
      )

  @app.put("/api/questions/<int:question_id>")
  def update_question(question_id: int):
    data = request.get_json() or {}
    title = (data.get("title") or "").strip()
    body = (data.get("body") or "").strip()
    difficulty = (data.get("difficulty") or "").strip() or None

    if not title or not body:
      return jsonify({"error": "title and body are required."}), 400

    with db_session() as db:
      q = db.query(Question).get(question_id)
      if not q:
        return jsonify({"error": "Question not found."}), 404

      q.title = title
      q.body = body
      q.difficulty = difficulty
      db.commit()
      db.refresh(q)

      return jsonify(
        {
          "id": q.id,
          "topic_id": q.topic_id,
          "title": q.title,
          "body": q.body,
          "difficulty": q.difficulty,
          "created_at": q.created_at.isoformat(),
        }
      )

  @app.get("/api/questions")
  def list_questions():
    topic_id = request.args.get("topic_id")
    with db_session() as db:
      query = db.query(Question)
      if topic_id:
        query = query.filter(Question.topic_id == int(topic_id))
      questions = query.order_by(Question.created_at.desc()).all()
      return jsonify(
        [
          {
            "id": q.id,
            "topic_id": q.topic_id,
            "title": q.title,
            "body": q.body,
            "difficulty": q.difficulty,
            "created_at": q.created_at.isoformat(),
          }
          for q in questions
        ]
      )

  @app.get("/api/questions/<int:question_id>")
  def get_question(question_id: int):
    with db_session() as db:
      q = db.query(Question).get(question_id)
      if not q:
        return jsonify({"error": "Question not found."}), 404

      return jsonify(
        {
          "id": q.id,
          "topic_id": q.topic_id,
          "title": q.title,
          "body": q.body,
          "difficulty": q.difficulty,
          "created_at": q.created_at.isoformat(),
        }
      )

  @app.post("/api/ai/topic-summary")
  def topic_summary():
    data = request.get_json() or {}
    topic_id = data.get("topic_id")

    if not topic_id:
      return jsonify({"error": "topic_id is required."}), 400

    with db_session() as db:
      topic = db.query(Topic).get(topic_id)
      if not topic:
        return jsonify({"error": "Topic not found."}), 404

      questions = [q.title for q in topic.questions]
      ai_result = summarize_topic_questions(questions)

      return jsonify(
        {
          "topic": topic.name,
          "summary": ai_result["summary"],
          "focus_areas": ai_result["focus_areas"],
        }
      )

  @app.post("/api/ai/review-answer")
  def ai_review_answer():
    data = request.get_json() or {}
    answer = data.get("answer") or ""

    ai_result = review_answer(answer)
    return jsonify(ai_result)

  return app


app = create_app()


if __name__ == "__main__":
  app.run(host="0.0.0.0", port=8000, debug=True)

