// src/Game.js


import "./App.css";
import React, { useState, useEffect, useCallback } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend'


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
  

// In Game.js

const handleSwap = (fromGapId, toGapId) => {
  setAnswers((prevAnswers) => {
    const newAnswers = { ...prevAnswers };
    const fromWord = newAnswers[fromGapId];
    const toWord = newAnswers[toGapId];

    newAnswers[toGapId] = fromWord;
    newAnswers[fromGapId] = toWord;

    return newAnswers;
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
  const wrongAnswers = [...new Set(final_alternative_keywords)]  // Remove duplicates by converting to a Set and back to an array
  .filter(keyword => !correctAnswers.includes(keyword));  // Filter out any correct answers


  const uniqueWrongAnswers = [...new Set(wrongAnswers)].filter(
    (word) => !correctAnswers.includes(word)
  );

  const getWordStatus = (word) => {
    const statusPriority = {
      "correct": 3,
      "wrong place": 2,
      "incorrect": 1,
      "unused": 0,
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

  // Update wordList to exclude words marked as 'correct'
  const wordList = [...correctAnswers, ...uniqueWrongAnswers]
    .filter(
      (word) => !wordsUsed.includes(word) && getWordStatus(word) !== "correct"
    )
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

// In Game.js

const handleReturnWord = (word, fromGapId) => {
  // Prevent removing correct words
  const isCorrect = colors[fromGapId] === "correct";

  if (isCorrect) {
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
        if (newColors[kw.id] !== "correct" && newColors[kw.id] !== "wrong place") {
          newColors[kw.id] = "wrong place";
        }
        wordsToReturn.push(currentAnswer);
        allCorrect = false;
      } else {
        newLog.push({ id: kw.id, word: currentAnswer, status: "incorrect" });
        if (newColors[kw.id] !== "correct" && newColors[kw.id] !== "wrong place") {
          newColors[kw.id] = "incorrect";
        }
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
        if (kw && newColors[kw.id] !== "correct" && newColors[kw.id] !== "wrong place") {
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
    const message = `My 'Alternative Facts' score: \n\n${score}\nPlay here: ${currentUrl}`;
    navigator.clipboard.writeText(message).then(() => {
      alert("Score and link copied to clipboard!");
    });
  };

  return (
    <DndProvider backend={HTML5Backend}>
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
