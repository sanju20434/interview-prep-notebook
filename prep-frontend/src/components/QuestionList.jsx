import { useState } from "react";

const difficulties = ["Easy", "Medium", "Hard"];

export function QuestionList({
  apiBase,
  topic,
  questions,
  selectedQuestionId,
  onSelectQuestion,
  onQuestionsChanged,
  loading,
}) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const [editDifficulty, setEditDifficulty] = useState("");
  const [editError, setEditError] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  function startEdit(q) {
    setEditingQuestionId(q.id);
    setEditTitle(q.title || "");
    setEditBody(q.body || "");
    setEditDifficulty(q.difficulty || "");
    setEditError("");
  }

  function cancelEdit() {
    setEditingQuestionId(null);
    setEditTitle("");
    setEditBody("");
    setEditDifficulty("");
    setEditError("");
    setEditSaving(false);
  }

  async function createQuestion(event) {
    event.preventDefault();
    if (!topic) {
      setError("Select a topic first.");
      return;
    }
    const trimmedTitle = title.trim();
    const trimmedBody = body.trim();
    if (!trimmedTitle || !trimmedBody) {
      setError("Title and question text are required.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const res = await fetch(`${apiBase}/questions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic_id: topic.id,
          title: trimmedTitle,
          body: trimmedBody,
          difficulty: difficulty || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed to create question.");
      }

      setTitle("");
      setBody("");
      setDifficulty("");
      onQuestionsChanged();
    } catch (e) {
      setError(e.message || "Failed to create question.");
    } finally {
      setSaving(false);
    }
  }

  async function saveEdit(event) {
    event.preventDefault();
    if (!editingQuestionId) return;

    const trimmedTitle = editTitle.trim();
    const trimmedBody = editBody.trim();
    if (!trimmedTitle || !trimmedBody) {
      setEditError("Title and question text are required.");
      return;
    }

    setEditSaving(true);
    setEditError("");
    try {
      const res = await fetch(`${apiBase}/questions/${editingQuestionId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: trimmedTitle,
          body: trimmedBody,
          difficulty: editDifficulty || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed to update question.");
      }
      await onQuestionsChanged();
      cancelEdit();
    } catch (e) {
      setEditError(e.message || "Failed to update question.");
    } finally {
      setEditSaving(false);
    }
  }

  return (
    <section className="questions-column">
      <header className="questions-header">
        <div>
          <h2 className="questions-title">
            {topic ? topic.name : "Select a topic"}
          </h2>
          <p className="questions-subtitle">
            {topic
              ? "Add questions under this topic, then practice and track your answers."
              : "Choose or create a topic to start adding interview questions."}
          </p>
        </div>
      </header>

      <div className="questions-list-wrapper">
        {loading ? (
          <p className="questions-empty">Loading questions…</p>
        ) : questions.length === 0 ? (
          <p className="questions-empty">No questions yet for this topic.</p>
        ) : (
          <ul className="questions-list">
            {questions.map((q) => (
              <li key={q.id}>
                {editingQuestionId === q.id ? (
                  <form onSubmit={saveEdit} className="inline-editor">
                    <input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      placeholder="Question title"
                      className="questions-input"
                      autoFocus
                    />
                    <textarea
                      value={editBody}
                      onChange={(e) => setEditBody(e.target.value)}
                      placeholder="Full question text"
                      rows={4}
                      className="questions-textarea"
                    />
                    <select
                      value={editDifficulty}
                      onChange={(e) => setEditDifficulty(e.target.value)}
                      className="questions-select"
                    >
                      <option value="">Difficulty (optional)</option>
                      {difficulties.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                    <div className="inline-editor-actions">
                      <button
                        type="submit"
                        disabled={editSaving}
                        className="pill-button pill-button--primary"
                      >
                        {editSaving ? "Saving..." : "Save"}
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        disabled={editSaving}
                        className="pill-button"
                      >
                        Cancel
                      </button>
                    </div>
                    {editError && <p className="questions-error">{editError}</p>}
                  </form>
                ) : (
                  <div className="question-row">
                    <button
                      type="button"
                      className={
                        q.id === selectedQuestionId
                          ? "questions-item questions-item--active"
                          : "questions-item"
                      }
                      onClick={() => onSelectQuestion(q.id)}
                    >
                      <span className="questions-item-title">{q.title}</span>
                      {q.difficulty && (
                        <span
                          className={`questions-badge questions-badge--${q.difficulty.toLowerCase()}`}
                        >
                          {q.difficulty}
                        </span>
                      )}
                    </button>
                    <button
                      type="button"
                      className="icon-button"
                      onClick={() => startEdit(q)}
                      aria-label={`Edit question ${q.title}`}
                      title="Edit"
                    >
                      Edit
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <form onSubmit={createQuestion} className="questions-form">
        <h3 className="questions-form-title">New question</h3>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Question title (e.g. Implement LRU cache)"
          className="questions-input"
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write the full question text or prompt."
          rows={3}
          className="questions-textarea"
        />
        <select
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
          className="questions-select"
        >
          <option value="">Difficulty (optional)</option>
          {difficulties.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <button type="submit" disabled={saving} className="questions-button">
          {saving ? "Saving..." : "Add question"}
        </button>
        {error && <p className="questions-error">{error}</p>}
      </form>
    </section>
  );
}

