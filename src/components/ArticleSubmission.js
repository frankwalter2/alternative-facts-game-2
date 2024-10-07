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

  // Use the new server URL directly

  const backendUrl = process.env.REACT_APP_BACKEND_URL;

  // Add meta tag for noindex when the component mounts
  useEffect(() => {
    console.log('Adding noindex meta tag');
    const metaTag = document.createElement('meta');
    metaTag.name = 'robots';
    metaTag.content = 'noindex';
    document.head.appendChild(metaTag);
  
    return () => {
      document.head.removeChild(metaTag);
    };
  }, []);

  // Fetch recent folders from the backend when the component mounts
  useEffect(() => {
    const fetchRecentFolders = async () => {
      try {
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
  }, [backendUrl]);

  // Generate upcoming game links based on today's day of the month
  const generateUpcomingGames = () => {
    const today = new Date().getDate();
    const upcomingGames = [];
    for (let i = 0; i < 5; i++) {
      const dayNumber = (today + i) > 31 ? (today + i) - 31 : (today + i); // Handle day overflow
      upcomingGames.push(dayNumber);
    }
    return upcomingGames;
  };

  const checkStatus = async (jobId) => {
    try {
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
      const res = await fetch(`${backendUrl}/assign-game-data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceId: sourceFolder, dayNumber: destFolder, password }), // Pass correct keys here
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

      <h2>Recently Generated Games</h2>
      <ul>
        {recentFolders.map((folder) => (
          <li key={folder}>
            <a href={`https://alternativefactsgame.com/?test=${folder}`} target="_blank" rel="noopener noreferrer">
              Recently Generated Game {folder}
            </a>
          </li>
        ))}
      </ul>

      <h2>Upcoming Games</h2>
      <ul>
        {generateUpcomingGames().map((day) => (
          <li key={day}>
            <a href={`https://alternativefactsgame.com/?test=${day}`} target="_blank" rel="noopener noreferrer">
              Game for Day {day}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ArticleSubmission;
