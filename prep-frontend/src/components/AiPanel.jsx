import { useState } from "react";

export function AiPanel({ apiBase, topic, question }) {
  const [answerDraft, setAnswerDraft] = useState("");
  const [summaryResult, setSummaryResult] = useState(null);
  const [reviewResult, setReviewResult] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingReview, setLoadingReview] = useState(false);
  const [error, setError] = useState("");

  async function requestTopicSummary() {
    if (!topic) {
      setError("Select a topic first.");
      return;
    }
    setLoadingSummary(true);
    setError("");
    try {
      const res = await fetch(`${apiBase}/ai/topic-summary`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ topic_id: topic.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to get AI summary.");
      }
      setSummaryResult(data);
    } catch (e) {
      setError(e.message || "Failed to get AI summary.");
    } finally {
      setLoadingSummary(false);
    }
  }

  async function requestReview() {
    if (!answerDraft.trim()) {
      setError("Write an answer first.");
      return;
    }
    setLoadingReview(true);
    setError("");
    try {
      const res = await fetch(`${apiBase}/ai/review-answer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ answer: answerDraft }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to get AI review.");
      }
      setReviewResult(data);
    } catch (e) {
      setError(e.message || "Failed to get AI review.");
    } finally {
      setLoadingReview(false);
    }
  }

  return (
    <section className="ai-card">
      <header className="ai-header">
        <h2 className="ai-title">Practice with AI</h2>
        <p className="ai-subtitle">
          Summarise this topic and get lightweight, AI-style feedback on your answers. The logic is
          implemented on the backend so it can be swapped with a real LLM later.
        </p>
      </header>

      <div className="ai-section">
        <div className="ai-section-header">
          <h3>Topic summary</h3>
          <button
            type="button"
            className="ai-button"
            onClick={requestTopicSummary}
            disabled={loadingSummary || !topic}
          >
            {loadingSummary ? "Summarising..." : "Summarise topic"}
          </button>
        </div>
        {!topic && <p className="ai-hint">Select a topic to request a summary.</p>}
        {summaryResult && (
          <div className="ai-summary">
            <p className="ai-summary-text">{summaryResult.summary}</p>
            {summaryResult.focus_areas && summaryResult.focus_areas.length > 0 && (
              <div className="ai-tags">
                {summaryResult.focus_areas.map((tag) => (
                  <span key={tag} className="ai-tag">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="ai-section">
        <div className="ai-section-header">
          <h3>Your answer</h3>
          {question && (
            <span className="ai-question-label">
              Practising: <strong>{question.title}</strong>
            </span>
          )}
        </div>
        <textarea
          value={answerDraft}
          onChange={(e) => setAnswerDraft(e.target.value)}
          placeholder="Write how you would answer this question in an interview..."
          rows={4}
          className="ai-textarea"
        />
        <button
          type="button"
          className="ai-button"
          onClick={requestReview}
          disabled={loadingReview}
        >
          {loadingReview ? "Reviewing..." : "Get feedback"}
        </button>

        {reviewResult && (
          <div className="ai-review">
            <p className="ai-review-rating">Rating: {reviewResult.rating} / 5</p>
            <p className="ai-review-text">{reviewResult.feedback}</p>
          </div>
        )}
      </div>

      {error && <p className="ai-error">{error}</p>}
    </section>
  );
}

