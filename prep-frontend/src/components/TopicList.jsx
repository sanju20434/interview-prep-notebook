import { useState } from "react";

export function TopicList({ apiBase, topics, selectedTopicId, onSelectTopic, onTopicsChanged }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingTopicId, setEditingTopicId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editError, setEditError] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  function startEdit(topic) {
    setEditingTopicId(topic.id);
    setEditName(topic.name || "");
    setEditDescription(topic.description || "");
    setEditError("");
  }

  function cancelEdit() {
    setEditingTopicId(null);
    setEditName("");
    setEditDescription("");
    setEditError("");
    setEditSaving(false);
  }

  async function createTopic(event) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Topic name is required.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${apiBase}/topics`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: trimmed,
          description: description.trim() || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed to create topic.");
      }
      setName("");
      setDescription("");
      onTopicsChanged();
    } catch (e) {
      setError(e.message || "Failed to create topic.");
    } finally {
      setLoading(false);
    }
  }

  async function saveEdit(event) {
    event.preventDefault();
    if (!editingTopicId) return;

    const trimmed = editName.trim();
    if (!trimmed) {
      setEditError("Topic name is required.");
      return;
    }

    setEditSaving(true);
    setEditError("");
    try {
      const res = await fetch(`${apiBase}/topics/${editingTopicId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: trimmed,
          description: editDescription.trim() || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed to update topic.");
      }

      await onTopicsChanged();
      cancelEdit();
    } catch (e) {
      setEditError(e.message || "Failed to update topic.");
    } finally {
      setEditSaving(false);
    }
  }

  return (
    <aside className="sidebar">
      <h2 className="sidebar-title">Topics</h2>
      <ul className="sidebar-list">
        {topics.map((topic) => (
          <li key={topic.id}>
            {editingTopicId === topic.id ? (
              <form onSubmit={saveEdit} className="inline-editor">
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="sidebar-input"
                  placeholder="Topic name"
                  autoFocus
                />
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="sidebar-textarea"
                  placeholder="Optional description"
                  rows={2}
                />
                <div className="inline-editor-actions">
                  <button type="submit" disabled={editSaving} className="pill-button pill-button--primary">
                    {editSaving ? "Saving..." : "Save"}
                  </button>
                  <button type="button" onClick={cancelEdit} disabled={editSaving} className="pill-button">
                    Cancel
                  </button>
                </div>
                {editError && <p className="sidebar-error">{editError}</p>}
              </form>
            ) : (
              <div className="sidebar-row">
                <button
                  type="button"
                  className={
                    topic.id === selectedTopicId
                      ? "sidebar-item sidebar-item--active"
                      : "sidebar-item"
                  }
                  onClick={() => onSelectTopic(topic.id)}
                >
                  <span className="sidebar-item-name">{topic.name}</span>
                </button>
                <button
                  type="button"
                  className="icon-button"
                  onClick={() => startEdit(topic)}
                  aria-label={`Edit topic ${topic.name}`}
                  title="Edit"
                >
                  Edit
                </button>
              </div>
            )}
          </li>
        ))}
        {topics.length === 0 && <li className="sidebar-empty">No topics yet.</li>}
      </ul>

      <form onSubmit={createTopic} className="sidebar-form">
        <h3 className="sidebar-form-title">New topic</h3>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Data Structures"
          className="sidebar-input"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional description"
          rows={2}
          className="sidebar-textarea"
        />
        <button type="submit" disabled={loading} className="sidebar-button">
          {loading ? "Creating..." : "Add topic"}
        </button>
        {error && <p className="sidebar-error">{error}</p>}
      </form>
    </aside>
  );
}

