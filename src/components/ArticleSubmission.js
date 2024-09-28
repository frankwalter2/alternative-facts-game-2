// src/components/ArticleSubmission.js

import React, { useState, useEffect } from 'react';

const ArticleSubmission = () => {
  const [article, setArticle] = useState('');
  const [response, setResponse] = useState(null);
  const [jobId, setJobId] = useState(null);

  // New state variables
  const [sourceFolder, setSourceFolder] = useState('');
  const [destFolder, setDestFolder] = useState('');
  const [password, setPassword] = useState('');
  const [recentFolders, setRecentFolders] = useState([]);
  const destFolders = Array.from({ length: 31 }, (_, i) => (i + 1).toString());

  // Fetch recent folders from the backend when the component mounts
  useEffect(() => {
    const fetchRecentFolders = async () => {
      try {
        const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'; // Fallback to localhost for development
        const res = await fetch(`${backendUrl}/get-recent-folders`);
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        const data = await res.json();
        setRecentFolders(data.folders);
      } catch (error) {
        console.error('Error fetching recent folders:', error);
        alert('Failed to fetch recent folders.');
      }
    };

    fetchRecentFolders();
  }, []);

  const checkStatus = async (jobId) => {
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
      const res = await fetch(`${backendUrl}/check-status/${jobId}`);
      const data = await res.json();
      if (data.status === 'complete') {
        const timestamp = data.timestamp;
        const gameUrl = `https://alternativefactsgame.com/?test=${timestamp}`;
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
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
      const res = await fetch(`${backendUrl}/process-article`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ article }),
      });

      if (!res.ok) {
        const errorText = await res.text(); // Capture the error body
        throw new Error(`HTTP error! status: ${res.status}, message: ${errorText}`);
      }

      const data = await res.json();
      setJobId(data.job_id); // Store job ID and start polling
      checkStatus(data.job_id); // Start polling for the result
    } catch (error) {
      console.error('Error submitting article:', error);
      setResponse({ error: `Failed to process the article. ${error.message}` });
    }
  };

  const handleMoveGameData = async () => {
    if (!sourceFolder || !destFolder || !password) {
      alert('Please fill in all fields.');
      return;
    }

    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
      const res = await fetch(`${backendUrl}/move-game-data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceFolder, destFolder, password }),
      });

      const data = await res.json();

      if (res.ok) {
        alert('File moved successfully!');
        // Optionally, refresh the recent folders list
        setSourceFolder('');
        setDestFolder('');
        setPassword('');
        // Re-fetch recent folders
        const foldersRes = await fetch(`${backendUrl}/get-recent-folders`);
        if (foldersRes.ok) {
          const foldersData = await foldersRes.json();
          setRecentFolders(foldersData.folders);
        }
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error moving game data:', error);
      alert('An error occurred while moving the file.');
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

      <h2>Move GameData File</h2>
      <div>
        <label>
          Source Folder:
          <select value={sourceFolder} onChange={(e) => setSourceFolder(e.target.value)}>
            <option value="">Select Source Folder</option>
            {recentFolders.map((folder) => (
              <option key={folder} value={folder}>
                {folder}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div>
        <label>
          Destination Folder:
          <select value={destFolder} onChange={(e) => setDestFolder(e.target.value)}>
            <option value="">Select Destination Folder</option>
            {destFolders.map((folder) => (
              <option key={folder} value={folder}>
                {folder}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div>
        <label>
          Password:
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
          />
        </label>
      </div>
      <button type="button" onClick={handleMoveGameData}>
        Move GameData File
      </button>
    </div>
  );
};

export default ArticleSubmission;
