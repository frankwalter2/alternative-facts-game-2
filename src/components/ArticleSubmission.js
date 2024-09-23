import React, { useState } from 'react';

const ArticleSubmission = () => {
  const [article, setArticle] = useState('');
  const [response, setResponse] = useState(null);
  const [jobId, setJobId] = useState(null);

  const checkStatus = async (jobId) => {
    try {
      const res = await fetch(`https://scaling-potato-4j7q9gw4jjq6cpxr-5000.app.github.dev/check-status/${jobId}`);
      const data = await res.json();
      if (data.status === 'complete') {
        const timestamp = data.timestamp;
        const gameUrl = `https://frankwalter2.github.io/alternative-facts-game/?test=${timestamp}`;
        setResponse({ message: 'Article processing complete', gameUrl: gameUrl });
      } else if (data.status === 'failed') {
        setResponse({ error: `Processing failed: ${data.error}` });
      } else {
        // If still pending, poll again after a delay
        setTimeout(() => checkStatus(jobId), 5000); // Poll every 5 seconds
      }
    } catch (error) {
      console.error('Error checking status:', error);
      setResponse({ error: `Failed to check status. ${error.message}` });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch('https://scaling-potato-4j7q9gw4jjq6cpxr-5000.app.github.dev/process-article', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ article }),
      });

      if (!res.ok) {
        const errorText = await res.text();  // Capture the error body
        throw new Error(`HTTP error! status: ${res.status}, message: ${errorText}`);
      }

      const data = await res.json();
      setJobId(data.job_id);  // Store job ID and start polling
      checkStatus(data.job_id);  // Start polling for the result

    } catch (error) {
      console.error('Error submitting article:', error);
      setResponse({ error: `Failed to process the article. ${error.message}` });
    }
  };

  return (
    <div>
      <h2>Submit an Article</h2>
      <form onSubmit={handleSubmit}>
        <textarea
          value={article}
          onChange={(e) => setArticle(e.target.value)}
          placeholder="Paste your article here"
          rows="10"
          cols="50"
        />
        <br />
        <button type="submit">Submit Article</button>
      </form>

      {jobId && <p>Processing... Job ID: {jobId}</p>}

      {response && (
        <div>
          {response.gameUrl ? (
            <>
              <h3>Article processing complete!</h3>
              <p>
                Your game is ready. You can access it at:{' '}
                <a href={response.gameUrl} target="_blank" rel="noopener noreferrer">
                  {response.gameUrl}
                </a>
              </p>
            </>
          ) : response.error ? (
            <>
              <h3>Error:</h3>
              <p>{response.error}</p>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default ArticleSubmission;
