import { useEffect, useState } from "react";

type Health = { status: string; database: string; timestamp: string };

function App() {
  const [health, setHealth] = useState<Health | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/health`)
      .then((res) => res.json())
      .then(setHealth)
      .catch(() => setError("API unreachable"));
  }, []);

  return (
    <main style={{ fontFamily: "Inter, sans-serif", padding: 32 }}>
      <h1>Mini-Jira</h1>
      {error && <p style={{ color: "#DC2626" }}>{error}</p>}
      {health ? (
        <ul>
          <li>API: {health.status}</li>
          <li>Database: {health.database}</li>
        </ul>
      ) : (
        !error && <p>Loading...</p>
      )}
    </main>
  );
}

export default App;