export function QuestionDetail({ question }) {
  if (!question) {
    return (
      <section className="detail-card">
        <h2 className="detail-title">Question details</h2>
        <p className="detail-empty">
          Select a question from the middle column to see its full text here.
        </p>
      </section>
    );
  }

  return (
    <section className="detail-card">
      <h2 className="detail-title">{question.title}</h2>
      {question.difficulty && (
        <span
          className={`detail-difficulty detail-difficulty--${question.difficulty.toLowerCase()}`}
        >
          {question.difficulty}
        </span>
      )}
      <div className="detail-body">{question.body}</div>
    </section>
  );
}

