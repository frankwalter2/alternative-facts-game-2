// src/Game.js

import React, { useState, useEffect } from "react";
import "./App.css";
import { DndProvider } from "react-dnd";
import { TouchBackend } from "react-dnd-touch-backend";

import StartScreen from "./components/StartScreen";
import Analogy from "./components/Analogy";
import WordCloud from "./components/WordCloud";
import CustomDragLayer from "./components/CustomDragLayer";
import Timer from "./components/Timer"; // Import Timer component

function Game () {
  const [gameStarted, setGameStarted] = useState(false);
  const [answers, setAnswers] = useState({});
  const [showColumn, setShowColumn] = useState(false);
  const [triesLeft, setTriesLeft] = useState(6);
  const [time, setTime] = useState(0);
  const [log, setLog] = useState([]);
  const [wordsUsed, setWordsUsed] = useState([]); // Track used words
  const [colors, setColors] = useState({}); // Track colors for gaps
  const [gameData, setGameData] = useState(null); // New state for game data

  const handleTimeUpdate = (newTime) => {
    setTime(newTime);
  };

  const generateGoogleNewsLink = (sixWordStory) => {
    const query = encodeURIComponent(sixWordStory);
    return `https://news.google.com/search?q=${query}`;
  };

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    
    // Get the "test" parameter from the URL, if available
    const testDay = queryParams.get("test");
    
    // Use the day from the test parameter, or default to the current day of the month
    const day = testDay ? parseInt(testDay, 10) : new Date().getDate();

    // Build the path based on the day (either from test parameter or actual day of the month)
    const dataPath = `${process.env.PUBLIC_URL}/data/${day}/gameData.json`;

    console.log(`Trying to load data from: ${dataPath}`); // Debugging line

    fetch(dataPath)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch daily game data"); // Error if daily file does not exist
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

        // If the daily file does not exist, fall back to the default data file
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

  if (!gameData) {
    return <div>Loading game data...</div>;
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
  const wrongAnswers = final_alternative_keywords.flatMap((pair) => {
    const [keyword1, keyword2] = pair;
    return !correctAnswers.includes(keyword1) &&
      !correctAnswers.includes(keyword2)
      ? [keyword1, keyword2]
      : [];
  });

  const uniqueWrongAnswers = [...new Set(wrongAnswers)].filter(
    (word) => !correctAnswers.includes(word)
  );

  // Update wordList to correctly remove used words
  const wordList = [...correctAnswers, ...uniqueWrongAnswers]
    .filter((word) => !wordsUsed.includes(word)) // Remove words already used in gaps
    .sort();

  const answerMap = giveaway_keywords.reduce((acc, kw) => {
    acc[kw.id] = kw.answer;
    return acc;
  }, {});

  const handleDrop = (gapId, word) => {
    // Prevent duplicating the same word in multiple gaps
    if (!wordsUsed.includes(word)) {
      setAnswers((prev) => ({
        ...prev,
        [gapId]: word,
      }));
      setWordsUsed((prevUsed) => [...prevUsed, word]); // Track word as used
      // Set the color for this gap to 'filled' when a new word is placed
      setColors((prevColors) => ({
        ...prevColors,
        [gapId]: "filled",
      }));
    }
  };

  const handleReturnWord = (word, fromGapId) => {
    // Prevent removing correct words
    const isCorrect = giveaway_keywords.some(
      (kw) => kw.id === fromGapId && kw.answer === word
    );

    if (isCorrect) {
      // Optionally, notify the user that correct words cannot be removed
      alert("Correct words cannot be removed from the gaps.");
      return;
    }

    if (fromGapId != null) {
      setAnswers((prev) => {
        const newAnswers = { ...prev };
        delete newAnswers[fromGapId]; // Remove the word from the gap
        return newAnswers;
      });
      setWordsUsed((prevUsed) => prevUsed.filter((w) => w !== word)); // Return word to word cloud
      // Reset the color for this gap to 'empty' when the word is removed
      setColors((prevColors) => ({
        ...prevColors,
        [fromGapId]: "empty",
      }));
    }
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
        newColors[kw.id] = "incorrect";
        allCorrect = false;
        return;
      }

      if (currentAnswer === kw.answer) {
        newLog.push({ id: kw.id, word: currentAnswer, status: "correct" });
        newColors[kw.id] = "correct";
      } else if (correctAnswers.includes(currentAnswer)) {
        newLog.push({ id: kw.id, word: currentAnswer, status: "wrong place" });
        newColors[kw.id] = "wrong place";
        wordsToReturn.push(currentAnswer);
        allCorrect = false;
      } else {
        newLog.push({ id: kw.id, word: currentAnswer, status: "incorrect" });
        newColors[kw.id] = "incorrect";
        wordsToReturn.push(currentAnswer);
        allCorrect = false;
      }
    });

    setLog([...log, newLog]);
    setColors(newColors);

    if (wordsToReturn.length > 0) {
      // Return words to word cloud
      setWordsUsed((prevUsed) =>
        prevUsed.filter((word) => !wordsToReturn.includes(word))
      );

      // Remove words from gaps and reset their colors
      setAnswers((prevAnswers) => {
        const updatedAnswers = { ...prevAnswers };
        giveaway_keywords.forEach((kw) => {
          const currentAnswer = prevAnswers[kw.id];
          if (wordsToReturn.includes(currentAnswer)) {
            delete updatedAnswers[kw.id]; // Remove word from the gap
            newColors[kw.id] = "empty"; // Reset color to 'empty'
          }
        });
        return updatedAnswers;
      });

      // Update colors after removing words
      wordsToReturn.forEach((word) => {
        const kw = giveaway_keywords.find((kw) => kw.answer === word);
        if (kw) {
          newColors[kw.id] = "empty";
        }
      });

      setColors(newColors);
    }

    if (allCorrect) {
      setShowColumn(true);
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

  // Determine the status for each word based on submission
  const getWordStatus = (word) => {
    const latestLog = log[log.length - 1];
    if (!latestLog) return "unused"; // Default status before any submission

    const entry = latestLog.find((item) => item.word === word);

    if (entry) {
      return entry.status; // 'correct', 'wrong place', 'incorrect'
    }
    return "unused"; // Default status
  };

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
    const message = `My 'Alternative Facts' score: \n\n${score}\nPlay here: ${currentUrl}`;
    navigator.clipboard.writeText(message).then(() => {
      alert("Score and link copied to clipboard!");
    });
  };

  return (
    <DndProvider
      backend={TouchBackend}
      options={{
        enableMouseEvents: true,
        enableTouchEvents: true,
        scrollAngleRanges: undefined, // Allow dragging even when scrolling
      }}
    >
      <div className="app">
        <div className="game-title">Alternative Facts</div>
        <Timer
          isActive={gameStarted && !showColumn} // Start timer when game begins and stop when game ends
          showTime={false} // Only show at the end
          onTimeUpdate={handleTimeUpdate}
        />

        {!gameStarted ? (
          <StartScreen onStart={() => setGameStarted(true)} />
        ) : (
          <>
            <div className="game-container">
              <Analogy
                analogies={processed_analogies}
                answers={answers}
                onDrop={handleDrop}
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
              <>
                {triesLeft > 0 ? (
                  <>
                    <h2>Well done!</h2>
                    <p>
                      You completed the puzzle in {6 - triesLeft + 1} tries and{" "}
                      {time} seconds!
                    </p>
                  </>
                ) : (
                  <>
                    <h2>Commiserations!</h2>
                    <p>You've used all your tries. Better luck next time!</p>
                  </>
                )}

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

                <button onClick={handleShareScore}>Share your score</button>
              </>
            )}
          </>
        )}

        <CustomDragLayer />
      </div>
    </DndProvider>
  );
}

export default Game;
