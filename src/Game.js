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
import Cookies from "js-cookie";

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
  const [userId] = useState(() => {
    let uid = Cookies.get("user_id");
    if (!uid) {
      uid = "user_" + Math.random().toString(36).substr(2, 9);
      Cookies.set("user_id", uid, { expires: 365 });
    }
    return uid;
  });
  const [createdTimestamp, setCreatedTimestamp] = useState(null);

  const handleTimeUpdate = useCallback((newTime) => {
    setTime(newTime);
  }, []);

  const generateGoogleNewsLink = (sixWordStory) => {
    const query = encodeURIComponent(sixWordStory);
    return `https://news.google.com/search?q=${query}`;
  };

  const todayDate = new Date().toISOString().split("T")[0]; // Extracts YYYY-MM-DD

  const calculateStatistics = () => {
    const savedGames = JSON.parse(localStorage.getItem("gameData")) || [];
    const isTestGame = window.location.href.includes("?test=");
  
    // Exclude test games for both statistics and streak calculations
    const validGames = savedGames.filter(
      (game) => !isTestGame && game.userId === userId
    );
  
    // Calculate average time and tries
    const totalTime = validGames.reduce(
      (sum, game) => sum + game.timeTaken,
      0
    );
  
    const totalTries = validGames.reduce((sum, game) => {
      // Count 6 tries for games that were lost
      return sum + (game.didWin ? game.tries : 6);
    }, 0);
  
    const averageTime = validGames.length
      ? (totalTime / validGames.length).toFixed(2)
      : 0;
  
    const averageTries = validGames.length
      ? (totalTries / validGames.length).toFixed(2)
      : 0;
  
    // Calculate streak only for games where didWin is true
    let streak = 0;
    let previousDate = null;
    const datesPlayed = validGames
      .filter((game) => game.didWin) // Only count wins for streak
      .map((game) => game.date)
      .sort()
      .reverse(); // Latest first
  
    for (let dateStr of datesPlayed) {
      const date = new Date(dateStr);
      if (!previousDate) {
        streak = 1;
      } else {
        const diffTime = previousDate - date;
        const diffDays = diffTime / (1000 * 60 * 60 * 24);
  
        if (diffDays === 1) {
          streak += 1;
        } else {
          break;
        }
      }
      previousDate = date;
    }
  
    return { averageTime, averageTries, streak };
  };
  

  // Save game data to local storage when the game is completed
  // Save game data to local storage when the game is completed
const saveGameDataToLocalStorage = (
  createdTimestamp,
  didWin,
  timeTaken,
  tries,
  userId,
  log,
  finalWordCloud,
  correctlyGuessedWords,
  finalAnswers,
  colors
) => {
  const currentUrl = window.location.href;

  const isTestGame = currentUrl.includes("?test=");

  if (isTestGame) {
    // Don't save game data for test games
    return;
  }

  const newGameData = {
    createdTimestamp,
    didWin,
    timeTaken,
    tries,
    userId,
    date: todayDate,
    log,
    finalWordCloud,
    correctlyGuessedWords,
    finalAnswers,
    colors,
  };

  // Retrieve the existing game data from local storage
  let gameData = JSON.parse(localStorage.getItem("gameData")) || [];

  // Add the new game data
  gameData.push(newGameData);

  // Save it back to local storage
  localStorage.setItem("gameData", JSON.stringify(gameData));
};


  // Function to handle game completion
  // Function to handle local completion logic
// Function to handle local completion logic
const handleLocalGameCompletion = (didWin) => {
  const finalWordCloud = wordList; // Words remaining in the word cloud
  const correctlyGuessedWords = Object.values(answers).filter((word) => {
    return correctAnswers.includes(word);
  });

  // Save today's game data to local storage
  saveGameDataToLocalStorage(
    createdTimestamp,
    didWin,
    time,
    7 - triesLeft, // Corrected calculation
    userId,
    log,
    finalWordCloud,
    correctlyGuessedWords,
    answers,
    colors
  );

  // Recalculate and show the statistics including today's game
  const { averageTime, averageTries, streak } = calculateStatistics();

  // Show the completion message with updated averages
  setShowColumn(true);
};


// Function to send the game result to the server
const handleServerGameCompletion = async (didWin) => {
  const currentUrl = window.location.href;

  // Check if the user has already submitted this game's result
  const hasSubmitted = localStorage.getItem(
    `progressSubmitted_${createdTimestamp}`
  );
  if (hasSubmitted) {
    console.log("Progress already submitted for this game.");
    return;
  }

  // Sending progress to the server in the background
  try {
    const response = await fetch(
      `${process.env.REACT_APP_BACKEND_URL}/save-user-progress`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userId,
          createdTimestamp: createdTimestamp,
          didWin: didWin,
          tries: 7 - triesLeft, // Corrected calculation
          timeTaken: time,
          date: new Date().toISOString(),
          pageUrl: currentUrl,
        }),
      }
    );

    const result = await response.json();

    if (response.ok) {
      console.log(result.message);
      // Mark that the progress has been submitted
      localStorage.setItem(`progressSubmitted_${createdTimestamp}`, "true");
    } else {
      console.error("Error saving user progress:", result.error);
    }
  } catch (error) {
    console.error("Error saving user progress:", error);
  }
};

// Wrapper to handle game completion (local first, then server)
const handleGameCompletion = (didWin) => {
  // First, run local completion logic (updates local storage and displays results)
  handleLocalGameCompletion(didWin);

  // Then, send the data to the server asynchronously
  handleServerGameCompletion(didWin);
};


  
  

  

  
  

  /*useEffect(() => {
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
        setCreatedTimestamp(data.created_timestamp);
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
  }, []);*/

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

  // Fetch the data from the appropriate endpoint
  fetch(fetchUrl)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to fetch daily game data");
      }
      return response.json();
    })
    .then((data) => {
      setGameData(data);
      setCreatedTimestamp(data.created_timestamp);
      initializeColors(data);

      // Check if the user has already played today's game
      const savedGames = JSON.parse(localStorage.getItem("gameData")) || [];
      const todayDate = new Date().toISOString().split("T")[0];
      const isTestGame = window.location.href.includes("?test=");

      if (!isTestGame) {
        const gamePlayedToday = savedGames.find(
          (game) =>
            game.date === todayDate &&
            game.createdTimestamp === data.created_timestamp &&
            game.userId === userId
        );

        if (gamePlayedToday) {
          setGameStarted(false);
          setShowColumn(true);
          setTime(gamePlayedToday.timeTaken);
          setTriesLeft(7 - gamePlayedToday.tries);
          setLog(gamePlayedToday.log || []);
          setAnswers(gamePlayedToday.finalAnswers || {});
          setColors(gamePlayedToday.colors || {});
        }
      }
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
  }, [userId]);

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

  // Handle tries left on page revisit
  useEffect(() => {
    const savedGames = JSON.parse(localStorage.getItem("gameData")) || [];
    const todayGame = savedGames.find(
      (game) => game.date === todayDate && game.userId === userId
    );

    if (todayGame) {
      setTriesLeft(6 - todayGame.tries); // Restore triesLeft from local storage for today
      setShowColumn(true); // Show results if revisiting after completion
    }
  }, [createdTimestamp, userId, todayDate]);

  /*useEffect(() => {
    if (showColumn && messageRef.current) {
      messageRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [showColumn]);

  useEffect(() => {
    if (showColumn) {
      const today = new Date().toISOString().split('T')[0];

    }
  }, [showColumn]);
  
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const gameCompleted = localStorage.getItem(`gameCompleted_${today}`);
    if (gameCompleted) {
      setGameStarted(false);
      setShowColumn(true);
      // Optionally, you can load the previous game state if you saved it
    }
  }, []);
  useEffect(() => {
    if (showColumn && createdTimestamp) {
      const gameState = {
        answers,
        colors,
        log,
        triesLeft,
        showColumn,
        time,
      };

    }
  }, [showColumn, createdTimestamp]);

  useEffect(() => {
    if (createdTimestamp) {
      const gameCompleted = localStorage.getItem(`gameCompleted_${createdTimestamp}`);
      if (gameCompleted) {
        setGameStarted(false);
        setShowColumn(true);
  
        // Load the previous game state if available
        const savedGameState = localStorage.getItem(`gameState_${createdTimestamp}`);
        if (savedGameState) {
          const parsedState = JSON.parse(savedGameState);
          // Update your state variables accordingly
          setAnswers(parsedState.answers);
          setColors(parsedState.colors);
          setLog(parsedState.log);
          setTriesLeft(parsedState.triesLeft);
          setTime(parsedState.time);
        }
      }
    }
  }, [createdTimestamp]);
  */

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
      handleGameCompletion(true);
      ReactGA.event({
        action: "game_completed",
        params: {
          result: allCorrect ? "win" : "lose",
          tries_left: triesLeft,
          time_spent: time,
          total_tries: 6 - triesLeft,
        },
      });

      return;
    }

    const newTriesLeft = triesLeft - 1;
    setTriesLeft(newTriesLeft);

    if (newTriesLeft === 0) {
      setShowColumn(true);
      handleGameCompletion(false);
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
          total_tries: 6 - triesLeft,
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
          <span style={{ fontFamily: "serif", fontStyle: "italic", fontWeight: "bold" }}>
            i
          </span>
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
          disabled={showColumn}
        />
      ) : (
        <>
          <div className="game-container" ref={gameContainerRef}>
            {/* Game components */}
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

          {/* Tries left and submit button */}
          <div className="submit-container">
          {!showColumn && (
  <div>Tries left: {triesLeft}</div>
)}
            <button
              onClick={handleSubmit}
              disabled={triesLeft === 0 || showColumn}
            >
              Submit
            </button>
          </div>

          {/* Results section */}
          {showColumn && (
            <div ref={messageRef}>
              {triesLeft > 0 ? (
                <>
                  <h2>Well done!</h2>
                  <p>
  You completed today's puzzle in {7 - triesLeft} {7 - triesLeft === 1 ? 'try' : 'tries'} and {time} seconds!
</p>

                  {(() => {
                    const { averageTime, averageTries, streak } = calculateStatistics();
                    return (
                      <>
                        <p>Your average time: {averageTime} seconds</p>
                        <p>Your average tries: {averageTries}</p>
                        <p>Your current streak: {streak} {streak === 1 ? 'day' : 'days'}</p>

                      </>
                    );
                  })()}
                </>
              ) : (
                <>
                  <h2>Commiserations!</h2>
                  <p>You've used all your tries. Better luck next time!</p>
                </>
              )}

              {/* Score emojis */}
              <div className="score-emoji">
                {generateScoreEmoji()
                  .split("\n")
                  .map((line, idx) => (
                    <div key={idx}>{line}</div>
                  ))}
              </div>

              {/* Share button */}
              <div className="share-button-container">
                <button
                  onClick={handleShareScore}
                  className={shareButtonText === "Copied!" ? "copied" : ""}
                >
                  {shareButtonText}
                </button>
              </div>

              {/* Fake and real news sections */}
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

              <div className="real-news">
                <h3>Real News:</h3>
                <h2>{headline}</h2>
                {paragraphs.map((paragraph, idx) => (
                  <p key={idx} dangerouslySetInnerHTML={{ __html: paragraph }} />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Custom drag layer */}
      <CustomDragLayer />

      {showRules && (
        <div className="rules-overlay">
          <div className="rules-content">
            <span className="close-button" onClick={() => setShowRules(false)}>
              ×
            </span>
            <p>
              Fill in the blanks to complete today's satirical puzzle. Drag and
              drop the correct words into the gaps in the analogies. You have 6
              tries to get them all right. Red means an incorrect guess, orange
              means the word is in the wrong place.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default Game;