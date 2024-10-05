// src/Game.js

import "./App.css";
import React, { useState, useEffect, useCallback, useRef } from "react";

import { useDragDropManager } from "react-dnd";

import StartScreen from "./components/StartScreen";
import Analogy from "./components/Analogy";
import WordCloud from "./components/WordCloud";
import CustomDragLayer from "./components/CustomDragLayer";
import Timer from "./components/Timer"; // Import Timer component
// src/Game.js
import ReactGA from "react-ga4";

function Game() {
  const [gameStarted, setGameStarted] = useState(false);
  const [answers, setAnswers] = useState({});
  const [showColumn, setShowColumn] = useState(false);
  const [triesLeft, setTriesLeft] = useState(6);
  const [time, setTime] = useState(0);
  const [log, setLog] = useState([]);
  const [shareButtonText, setShareButtonText] = useState("Share your score");
  const [colors, setColors] = useState({}); // Track colors for gaps
  const [gameData, setGameData] = useState(null); // New state for game data
  const gameContainerRef = useRef(null);
  const dragDropManager = useDragDropManager();
  const [showRules, setShowRules] = useState(false);
  const messageRef = useRef(null);


  const handleTimeUpdate = useCallback((newTime) => {
    setTime(newTime);
  }, []);

  const generateGoogleNewsLink = (sixWordStory) => {
    const query = encodeURIComponent(sixWordStory);
    return `https://news.google.com/search?q=${query}`;
  };

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const testParam = queryParams.get("test");

    // Determine if the test parameter is a day (1-31) or a timestamp (not a number)
    let fetchUrl;

    if (testParam) {
      if (!isNaN(testParam) && testParam >= 1 && testParam <= 31) {
        // If it's a number between 1 and 31, use the day-based endpoint
        fetchUrl = `${process.env.REACT_APP_BACKEND_URL}/get-json-by-day/${testParam}`;
      } else {
        // If it's a string (timestamp), use the id-based endpoint
        fetchUrl = `${process.env.REACT_APP_BACKEND_URL}/get-json-by-id/${testParam}`;
      }
    } else {
      // If no test parameter is provided, use the day of the month
      const dayOfMonth = new Date().getDate();
      fetchUrl = `${process.env.REACT_APP_BACKEND_URL}/get-json-by-day/${dayOfMonth}`;
    }

    console.log(`Fetching data from: ${fetchUrl}`); // Debugging line

    // Fetch the data from the appropriate endpoint
    fetch(fetchUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch daily game data");
        }
        return response.json();
      })
      .then((data) => {
        console.log("Loaded game data:", data); // Debugging line
        setGameData(data);
        initializeColors(data);
      })
      .catch((error) => {
        console.error("Error loading daily game data:", error);

        // Fallback to the default data file if no specific game data is found
        const fallbackPath = `${process.env.PUBLIC_URL}/data/gameData.json`;
        console.log(`Falling back to default data from: ${fallbackPath}`); // Debugging line

        fetch(fallbackPath)
          .then((response) => response.json())
          .then((data) => {
            console.log("Loaded fallback game data:", data); // Debugging line
            setGameData(data);
            initializeColors(data);
          })
          .catch((err) => {
            console.error("Error loading default game data:", err);
          });
      });
  }, []);

  // Implement Auto-Scrolling Logic using useDragDropManager
  useEffect(() => {
    const scrollContainer = gameContainerRef.current;
    if (!scrollContainer) return;

    const monitor = dragDropManager.getMonitor();

    const unsubscribe = monitor.subscribeToOffsetChange(() => {
      const offset = monitor.getClientOffset();
      if (!offset) return;

      const { top, bottom } = scrollContainer.getBoundingClientRect();

      const scrollThreshold = 50; // Pixels from edge to start scrolling
      const scrollSpeed = 10; // Pixels to scroll per interval

      if (offset.y - top < scrollThreshold) {
        scrollContainer.scrollTop -= scrollSpeed;
      } else if (bottom - offset.y < scrollThreshold) {
        scrollContainer.scrollTop += scrollSpeed;
      }
    });

    return () => {
      unsubscribe();
    };
  }, [dragDropManager]);

  useEffect(() => {
    if (showRules) {
      const handleClickOutside = (event) => {
        const rulesContent = document.querySelector(".rules-content");
        if (rulesContent && !rulesContent.contains(event.target)) {
          setShowRules(false); // Close the overlay
        }
      };
  
      document.addEventListener("mousedown", handleClickOutside);
      
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [showRules]);

  useEffect(() => {
    if (showColumn && messageRef.current) {
      messageRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [showColumn]);
  
  

  const handleSwap = (fromGapId, toGapId) => {
    setAnswers((prevAnswers) => {
      const newAnswers = { ...prevAnswers };
      const fromWord = newAnswers[fromGapId];
      const toWord = newAnswers[toGapId];

      newAnswers[toGapId] = fromWord;
      newAnswers[fromGapId] = toWord;

      return newAnswers;
    });

    setColors((prevColors) => {
      const newColors = { ...prevColors };
      const fromColor = prevColors[fromGapId];
      const toColor = prevColors[toGapId];

      newColors[toGapId] = fromColor;
      newColors[fromGapId] = toColor;

      return newColors;
    });
  };

  const initializeColors = (data) => {
    if (data && data.results && data.results.length > 0) {
      const result = data.results.find(
        (r) => r.giveaway_keywords && r.giveaway_keywords.length > 0
      );

      if (result) {
        const initialColors = {};
        result.giveaway_keywords.forEach((kw) => {
          initialColors[kw.id] = "empty"; // Set initial status to 'empty' (grey)
        });
        setColors(initialColors);
      }
    }
  };

  if (!gameStarted || !gameData) {
    return (
      <StartScreen onStart={() => setGameStarted(true)} isLoading={!gameData} />
    );
  }

  const result = gameData.results.find(
    (r) => r.giveaway_keywords && r.giveaway_keywords.length > 0
  );

  if (!result) {
    return <div>No valid game data found with giveaway_keywords.</div>;
  }

  const {
    processed_analogies = [],
    giveaway_keywords = [],
    final_alternative_keywords = [],
    satirical_column = "",
    headline = "",
    six_word_story = "",
    analogy_1,
    analogy_2,
    analogy_3,
  } = result;

  const highlightAnalogies = (column, analogy1, analogy2, analogy3) => {
    let updatedColumn = column;
    if (analogy1) {
      updatedColumn = updatedColumn.replace(
        analogy1,
        `<strong>${analogy1}</strong>`
      );
    }
    if (analogy2) {
      updatedColumn = updatedColumn.replace(
        analogy2,
        `<strong>${analogy2}</strong>`
      );
    }
    if (analogy3) {
      updatedColumn = updatedColumn.replace(
        analogy3,
        `<strong>${analogy3}</strong>`
      );
    }
    return updatedColumn;
  };

  const highlightedSatiricalColumn = highlightAnalogies(
    satirical_column,
    analogy_1,
    analogy_2,
    analogy_3
  );

  // Split the satirical column into paragraphs
  const paragraphs = highlightedSatiricalColumn.split("\n\n");

  const googleNewsLink = generateGoogleNewsLink(six_word_story);
  const correctAnswers = giveaway_keywords.map((kw) => kw.answer);
  const wrongAnswers = [...new Set(final_alternative_keywords)] // Remove duplicates by converting to a Set and back to an array
    .filter((keyword) => !correctAnswers.includes(keyword)); // Filter out any correct answers

  const uniqueWrongAnswers = [...new Set(wrongAnswers)].filter(
    (word) => !correctAnswers.includes(word)
  );

  const getWordStatus = (word) => {
    const statusPriority = {
      correct: 3,
      "wrong place": 2,
      incorrect: 1,
      unused: 0,
    };

    let highestStatus = "unused";

    log.forEach((round) => {
      round.forEach((entry) => {
        if (entry.word === word) {
          const currentStatus = entry.status;
          if (statusPriority[currentStatus] > statusPriority[highestStatus]) {
            highestStatus = currentStatus;
          }
        }
      });
    });

    return highestStatus;
  };

  // In Game.js

  const wordsUsed = Object.values(answers);

  // Update wordList to use the derived wordsUsed
  const wordList = [...correctAnswers, ...uniqueWrongAnswers]
    .filter(
      (word) => !wordsUsed.includes(word) && getWordStatus(word) !== "correct"
    )
    .sort();

  const answerMap = giveaway_keywords.reduce((acc, kw) => {
    acc[kw.id] = kw.answer;
    return acc;
  }, {});

  // In Game.js

  // In Game.js

  const handleDrop = (gapId, word) => {
    setAnswers((prevAnswers) => {
      const newAnswers = { ...prevAnswers };
      const existingWord = newAnswers[gapId];

      // Prevent duplicating the same word in other gaps
      const wordAlreadyUsedInOtherGap = Object.entries(prevAnswers).some(
        ([key, value]) => value === word && parseInt(key) !== gapId
      );
      if (wordAlreadyUsedInOtherGap) {
        alert("This word is already used in another gap.");
        return prevAnswers;
      }

      // If there's an existing word, remove it (it will reappear in the word cloud)
      if (existingWord && existingWord !== word) {
        delete newAnswers[gapId];
      }

      // Place the new word in the gap
      newAnswers[gapId] = word;

      return newAnswers;
    });

    // Update colors
    setColors((prevColors) => ({
      ...prevColors,
      [gapId]: "filled",
    }));
  };

  // In Game.js

  // In Game.js

  const handleReturnWord = (word, fromGapId) => {
    // Prevent removing correct words
    const isCorrect = colors[fromGapId] === "correct";

    if (isCorrect) {
      alert("Correct words cannot be removed from the gaps.");
      return;
    }

    setAnswers((prevAnswers) => {
      const newAnswers = { ...prevAnswers };
      delete newAnswers[fromGapId]; // Remove the word from the gap
      return newAnswers;
    });

    // Reset the color for this gap to 'empty' when the word is removed
    setColors((prevColors) => ({
      ...prevColors,
      [fromGapId]: "empty",
    }));
  };

  const handleSubmit = () => {
    if (triesLeft === 0) return;

    const newLog = [];
    let allCorrect = true;
    const newColors = { ...colors };
    const wordsToReturn = []; // Words to send back to the word cloud

    giveaway_keywords.forEach((kw) => {
      const currentAnswer = answers[kw.id];
      if (!currentAnswer) {
        newLog.push({ id: kw.id, word: null, status: "incorrect" });
        if (newColors[kw.id] !== "correct") {
          newColors[kw.id] = "incorrect";
        }
        allCorrect = false;
        return;
      }

      if (currentAnswer === kw.answer) {
        newLog.push({ id: kw.id, word: currentAnswer, status: "correct" });
        newColors[kw.id] = "correct";
      } else if (correctAnswers.includes(currentAnswer)) {
        newLog.push({ id: kw.id, word: currentAnswer, status: "wrong place" });
        if (
          newColors[kw.id] !== "correct" &&
          newColors[kw.id] !== "wrong place"
        ) {
          newColors[kw.id] = "wrong place";
        }
        wordsToReturn.push(currentAnswer);
        allCorrect = false;
      } else {
        newLog.push({ id: kw.id, word: currentAnswer, status: "incorrect" });
        if (
          newColors[kw.id] !== "correct" &&
          newColors[kw.id] !== "wrong place"
        ) {
          newColors[kw.id] = "incorrect";
        }
        wordsToReturn.push(currentAnswer);
        allCorrect = false;
      }
    });

    setLog([...log, newLog]);
    setColors(newColors);

    // Remove words from gaps and reset their colors
    setAnswers((prevAnswers) => {
      const updatedAnswers = { ...prevAnswers };
      giveaway_keywords.forEach((kw) => {
        const currentAnswer = prevAnswers[kw.id];
        if (wordsToReturn.includes(currentAnswer)) {
          delete updatedAnswers[kw.id]; // Remove word from the gap
          // Only reset color if it wasn't previously correct or wrong place
          if (
            newColors[kw.id] !== "correct" &&
            newColors[kw.id] !== "wrong place"
          ) {
            newColors[kw.id] = "empty"; // Reset color to 'empty'
          }
        }
      });
      return updatedAnswers;
    });

    // Update colors after removing words
    wordsToReturn.forEach((word) => {
      const kw = giveaway_keywords.find((kw) => kw.answer === word);
      if (
        kw &&
        newColors[kw.id] !== "correct" &&
        newColors[kw.id] !== "wrong place"
      ) {
        newColors[kw.id] = "empty";
      }
    });

    setColors(newColors);

    if (allCorrect) {
      setShowColumn(true);
      ReactGA.event({
        action: "game_completed",
        params: {
          result: allCorrect ? "win" : "lose",
          tries_left: triesLeft,
          time_spent: time,
          total_tries: 6 - triesLeft + (allCorrect ? 0 : 1),
        },
      });

      return;
    }

    const newTriesLeft = triesLeft - 1;
    setTriesLeft(newTriesLeft);

    if (newTriesLeft === 0) {
      setShowColumn(true);
      const finalAnswers = giveaway_keywords.reduce((acc, kw) => {
        acc[kw.id] = answers[kw.id] || kw.answer;
        return acc;
      }, {});
      setAnswers(finalAnswers);
      ReactGA.event({
        action: "game_completed",
        params: {
          result: allCorrect ? "win" : "lose",
          tries_left: triesLeft,
          time_spent: time,
          total_tries: 6 - triesLeft + (allCorrect ? 0 : 1),
        },
      });
      // Optionally, set colors for final answers
      const finalColors = { ...colors };
      giveaway_keywords.forEach((kw) => {
        if (finalAnswers[kw.id] === kw.answer) {
          finalColors[kw.id] = "correct";
        } else {
          finalColors[kw.id] = "incorrect";
        }
      });
      setColors(finalColors);
    }
  };

  // In Game.js

  const generateScoreEmoji = () => {
    const emojiMap = {
      correct: "🟢",
      "wrong place": "🟠",
      incorrect: "🔴",
      unused: "⚫",
    };
    let score = "";
    log.forEach((round) => {
      round.forEach((entry) => {
        score += emojiMap[entry.status] || "⚫";
      });
      score += "\n";
    });
    return score;
  };

  const handleShareScore = () => {
    const score = generateScoreEmoji();
    const currentUrl = window.location.href;
    const message = `I completed today's 'Alternative Facts' in ${time} seconds.\n\n${score}\nPlay here: ${currentUrl}`;
    navigator.clipboard.writeText(message).then(() => {
      setShareButtonText("Copied!");
      // Reset the button text after 3 seconds
      setTimeout(() => setShareButtonText("Share your score"), 3000);
    });
    ReactGA.event({
      action: "share_score",
    });
  };

  return (
    <div className="app">
      <div className="game-title-container">
        <div className="game-title">Alternative Facts</div>
        <div className="info-icon" onClick={() => setShowRules(true)}>
  <span style={{ fontFamily: 'serif', fontStyle: 'italic', fontWeight: 'bold' }}>i</span>
</div>
      </div>

      <Timer
        isActive={gameStarted && !showColumn}
        showTime={false}
        onTimeUpdate={handleTimeUpdate}
      />

      {!gameStarted ? (
        <StartScreen
          onStart={() => setGameStarted(true)}
          isLoading={!gameData}
        />
      ) : (
        <>
          <div className="game-container" ref={gameContainerRef}>
            <Analogy
              analogies={processed_analogies}
              answers={answers}
              onDrop={handleDrop}
              onSwap={handleSwap}
              onRemove={handleReturnWord}
              answerMap={answerMap}
              colors={colors}
            />
            <WordCloud
              words={wordList}
              getWordStatus={getWordStatus}
              onWordReturn={handleReturnWord}
            />
          </div>
          <div className="submit-container">
            <div>Tries left: {triesLeft}</div>
            <button onClick={handleSubmit} disabled={triesLeft === 0}>
              Submit
            </button>
          </div>

          {showColumn && (
        <div ref={messageRef}>
          {triesLeft > 0 ? (
            <>
              <h2>Well done!</h2>
              <p>
                You completed today's puzzle in {6 - triesLeft + 1} tries
                and {time} seconds!
              </p>
            </>
          ) : (
            <>
              <h2>Commiserations!</h2>
              <p>You've used all your tries. Better luck next time!</p>
            </>
          )}

          {/* Display the score emojis */}
          <div className="score-emoji">
            {generateScoreEmoji()
              .split("\n")
              .map((line, idx) => (
                <div key={idx}>{line}</div>
              ))}
          </div>

          {/* Center the share button */}
          <div className="share-button-container">
            <button
              onClick={handleShareScore}
              className={shareButtonText === "Copied!" ? "copied" : ""}
            >
              {shareButtonText}
            </button>
          </div>

          {/* Fake News Section */}
          <div className="fake-news">
            <h3>Fake News:</h3>
            <a
              href={googleNewsLink}
              target="_blank"
              rel="noopener noreferrer"
            >
              {six_word_story}
            </a>
          </div>

          {/* Real News Article */}
          <div className="real-news">
            <h3>Real News:</h3>
            <h2>{headline}</h2>
            {paragraphs.map((paragraph, idx) => (
              <p
                key={idx}
                dangerouslySetInnerHTML={{ __html: paragraph }}
              />
            ))}
          </div>
        </div>
      )}
        </>
      )}

      <CustomDragLayer />
      {showRules && (
  <div className="rules-overlay">
    <div className="rules-content">
      <span className="close-button" onClick={() => setShowRules(false)}>×</span>
      <p>
        Fill in the blanks to complete today's satirical puzzle.
        Drag and drop the correct words into the gaps in the analogies.
        You have 6 tries to get them all right. Red means an incorrect guess, orange means the word is in the wrong place.
      </p>
    </div>
  </div>
)}

    </div>
  );
}

export default Game;
