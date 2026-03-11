import { useEffect, useState } from "react";
import { TopicList } from "./components/TopicList.jsx";
import { QuestionList } from "./components/QuestionList.jsx";
import { QuestionDetail } from "./components/QuestionDetail.jsx";
import { AiPanel } from "./components/AiPanel.jsx";

const API_BASE = "http://localhost:8000/api";

export default function App() {
  const [topics, setTopics] = useState([]);
  const [selectedTopicId, setSelectedTopicId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [selectedQuestionId, setSelectedQuestionId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function fetchTopics() {
    try {
      setError("");
      const res = await fetch(`${API_BASE}/topics`);
      const data = await res.json();
      setTopics(data);
      if (data.length && !selectedTopicId) {
        setSelectedTopicId(data[0].id);
      }
    } catch {
      setError("Failed to load topics from API.");
    }
  }

  async function fetchQuestions(topicId) {
    if (!topicId) {
      setQuestions([]);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/questions?topic_id=${topicId}`);
      const data = await res.json();
      setQuestions(data);
      if (data.length) {
        setSelectedQuestionId(data[0].id);
      } else {
        setSelectedQuestionId(null);
      }
    } catch {
      setError("Failed to load questions.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTopics();
  }, []);

  useEffect(() => {
    if (selectedTopicId) {
      fetchQuestions(selectedTopicId);
    }
  }, [selectedTopicId]);

  const selectedTopic = topics.find((t) => t.id === selectedTopicId) || null;
  const selectedQuestion = questions.find((q) => q.id === selectedQuestionId) || null;

  return (
    <div className="app-root">
      <header className="app-header">
        <div className="brand">
          <div className="brand-badge">IP</div>
          <div>
            <h1>Interview Prep Notebook</h1>
            <p>Organise questions, practice answers, and get AI-style feedback.</p>
          </div>
        </div>
      </header>

      <main className="app-layout">
        <TopicList
          apiBase={API_BASE}
          topics={topics}
          selectedTopicId={selectedTopicId}
          onSelectTopic={setSelectedTopicId}
          onTopicsChanged={fetchTopics}
        />

        <QuestionList
          apiBase={API_BASE}
          topic={selectedTopic}
          questions={questions}
          selectedQuestionId={selectedQuestionId}
          onSelectQuestion={setSelectedQuestionId}
          onQuestionsChanged={() => fetchQuestions(selectedTopicId)}
          loading={loading}
        />

        <section className="detail-column">
          <QuestionDetail question={selectedQuestion} />
          <AiPanel
            apiBase={API_BASE}
            topic={selectedTopic}
            question={selectedQuestion}
          />
        </section>
      </main>

      {error && <div className="app-error">{error}</div>}
    </div>
  );
}

