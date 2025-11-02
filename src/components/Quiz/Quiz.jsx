import * as React from "react";
import { ReactSketchCanvas } from "react-sketch-canvas";
import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import convertSvgToPng from "../utils/convertSvgToPng.js";
import { useTranslation, Trans } from "react-i18next";
import "./Quiz.css";

const TOTAL_LETTERS = 6;
const TIME_PER_LETTER = 20; // секунд на кожну літеру

async function getLetters(language) {
  try {
    const response = await fetch(
      "https://letters-back.vercel.app/letters",
      {
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({
          language: language,
        }),
      },
    );
    const letters = await response.json();
    return letters.letters;
  } catch (e) {
    console.log(e);
    alert("Failed to get letters");
    return [];
  }
}

async function getLetterImage(language, letter) {
  try {
    const response = await fetch("https://letters-back.vercel.app/letter", {
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify({
        language: language,
        letter: letter,
      }),
    });
    const data = await response.json();
    const base64 = data.image;
    const mimeType = "image/svg+xml";
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length)
      .fill(0)
      .map((_, i) => byteCharacters.charCodeAt(i));
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mimeType });
    return URL.createObjectURL(blob);
  } catch (e) {
    console.error(e);
    return null;
  }
}

async function sendLetterForEvaluation(token, language, letter, userImage, ethalonImage) {
  try {
    const response = await fetch(
      "https://letters-back.vercel.app/sendImages",
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        method: "POST",
        body: JSON.stringify({
          userImage: userImage,
          ethalonImage: ethalonImage,
          language: language,
          letter: letter,
        }),
      },
    );
    const data = await response.json();
    return {
      letter: letter,
      percents: data.percents,
      advice: data.result?.advice || "",
      status: data.result?.status || null,
    };
  } catch (e) {
    console.error(e);
    return {
      letter: letter,
      percents: 0,
      advice: "Error occurred",
      status: null,
    };
  }
}

export default function Quiz() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const searchParams = new URLSearchParams(location.search);
  const language = searchParams.get("language");
  const token = localStorage.getItem("token");

  const [currentLetterIndex, setCurrentLetterIndex] = useState(0);
  const [letters, setLetters] = useState([]);
  const [timeLeft, setTimeLeft] = useState(TIME_PER_LETTER);
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isQuizFinished, setIsQuizFinished] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const canvasRef = useRef(null);
  const timerRef = useRef(null);

  const getRandomLetters = (allLetters, count) => {
    const shuffled = [...allLetters].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count).map((l) => l.letter);
  };

  useEffect(() => {
    if (!language) {
      navigate("/select-language?sketch=quick");
      return;
    }

    const initializeQuiz = async () => {
      setIsLoading(true);
      const allLetters = await getLetters(language);
      if (allLetters.length < TOTAL_LETTERS) {
        alert("Not enough letters available");
        navigate("/select-language?sketch=quick");
        return;
      }

      const randomLetters = getRandomLetters(allLetters, TOTAL_LETTERS);
      setLetters(randomLetters);
      setIsLoading(false);
    };

    initializeQuiz();
  }, [language, navigate]);

  // Таймер
  useEffect(() => {
    if (isLoading || isQuizFinished || isSubmitting) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Час вийшов, автоматично переходимо до наступної літери
          handleNextLetter();
          return TIME_PER_LETTER;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [currentLetterIndex, isLoading, isQuizFinished, isSubmitting]);

  // Оновлюємо таймер при зміні поточної літери
  useEffect(() => {
    if (letters.length > 0 && currentLetterIndex < letters.length) {
      setTimeLeft(TIME_PER_LETTER);
    }
  }, [currentLetterIndex, letters]);

  const handleNextLetter = async () => {
    if (currentLetterIndex >= letters.length - 1) {
      // Остання літера - завершуємо квіз
      setIsQuizFinished(true);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      return;
    }

    // Переходимо до наступної літери
    setCurrentLetterIndex((prev) => prev + 1);
    if (canvasRef.current) {
      canvasRef.current.clearCanvas();
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    const currentLetter = letters[currentLetterIndex];
    if (!currentLetter) return;

    setIsSubmitting(true);

    try {
      // Отримуємо малюнок користувача
      const userPicture = await canvasRef.current.exportImage("png");
      
      // Отримуємо еталонне зображення для порівняння
      const letterImageUrl = await getLetterImage(language, currentLetter);
      if (!letterImageUrl) {
        throw new Error("Failed to get letter image");
      }
      const ethalonImageBase64 = await convertSvgToPng(letterImageUrl);
      const ethalonImage = `data:image/png;base64,${ethalonImageBase64}`;

      // Відправляємо на оцінку асинхронно (не чекаємо відповіді)
      sendLetterForEvaluation(
        token,
        language,
        currentLetter,
        userPicture,
        ethalonImage,
      ).then((result) => {
        // Перевіряємо що результат валідний перед додаванням
        if (result && typeof result.percents === 'number' && !isNaN(result.percents)) {
          setResults((prev) => [...prev, result]);
        } else {
          // Якщо результат не валідний, додаємо результат з помилкою
          const errorResult = {
            letter: currentLetter,
            percents: 0,
            advice: "Помилка при отриманні результату",
            status: null,
          };
          setResults((prev) => [...prev, errorResult]);
        }
      }).catch((error) => {
        console.error("Error evaluating letter:", error);
        // Додаємо результат з помилкою
        const errorResult = {
          letter: currentLetter,
          percents: 0,
          advice: "Помилка при оцінці",
          status: null,
        };
        setResults((prev) => [...prev, errorResult]);
      });

      // Одразу показуємо наступну літеру
      if (currentLetterIndex < letters.length - 1) {
        await handleNextLetter();
      } else {
        // Остання літера - завершуємо квіз одразу, результати будуть додаватися асинхронно
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
        setIsQuizFinished(true);
      }
    } catch (e) {
      console.error(e);
      alert("Failed to submit letter");
      // Додаємо результат з помилкою
      const errorResult = {
        letter: currentLetter,
        percents: 0,
        advice: "Помилка при відправці",
        status: null,
      };
      setResults((prev) => [...prev, errorResult]);
      
      if (currentLetterIndex < letters.length - 1) {
        await handleNextLetter();
      } else {
        // Остання літера - завершуємо квіз
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
        setIsQuizFinished(true);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Функція для визначення класу за оцінкою
  const getScoreClass = (score) => {
    if (score >= 80) return "score-excellent";
    if (score >= 60) return "score-good";
    if (score >= 40) return "score-average";
    return "score-poor";
  };

  // Розрахунок прогресу
  const progress = ((currentLetterIndex + 1) / TOTAL_LETTERS) * 100;
  const timeProgress = ((TIME_PER_LETTER - timeLeft) / TIME_PER_LETTER) * 100;

  if (isLoading) {
    return (
      <section className="quiz-container">
        <div className="loader-spinner"></div>
      </section>
    );
  }

  if (isQuizFinished) {
    // Створюємо об'єкт результатів для швидкого доступу
    const resultsMap = {};
    results.forEach(result => {
      if (result && result.letter) {
        resultsMap[result.letter] = result;
      }
    });

    // Створюємо масив для всіх літер (навіть якщо результати ще не прийшли)
    const allResults = letters.map(letter => {
      return resultsMap[letter] || {
        letter: letter,
        percents: null, // null означає що результат ще завантажується
        advice: null,
        status: null,
      };
    });

    // Сортуємо за порядком літер
    const sortedResults = [...allResults];

    // Розраховуємо середній бал тільки з валідними результатами
    const validResults = sortedResults.filter(r => r && typeof r.percents === 'number' && !isNaN(r.percents));
    const averageScore = validResults.length > 0
      ? Math.round(
          validResults.reduce((sum, r) => sum + r.percents, 0) /
            validResults.length,
        )
      : 0;
    
    // Перевіряємо чи всі результати прийшли
    const allResultsLoaded = sortedResults.every(r => r && typeof r.percents === 'number' && !isNaN(r.percents));

    return (
      <section className="quiz-container">
        <div className="quiz-results">
          <h2 className="quiz-results-title">
            <Trans i18nKey="quizPage.resultsTitle">Ваші результати</Trans>
          </h2>
          
          {/* Середній бал спочатку */}
          {validResults.length > 0 && (
            <div className="quiz-average-card">
              <div className="quiz-average-label">
                <Trans i18nKey="quizPage.average">Середній бал</Trans>
                {!allResultsLoaded && (
                  <span className="quiz-average-loading-indicator"> ({validResults.length}/{TOTAL_LETTERS})</span>
                )}
              </div>
              <div className="quiz-average-score">{averageScore}%</div>
            </div>
          )}
          
          {validResults.length === 0 && (
            <div className="quiz-loading-message">
              <Trans i18nKey="quizPage.loadingResults">Завантаження результатів...</Trans>
              <div className="loader-spinner"></div>
            </div>
          )}
          
          {sortedResults.length > 0 && (
            <>

              {/* Результати по літерам */}
              <div className="results-grid">
                {sortedResults.map((result, index) => {
                  // Перевіряємо що результат валідний
                  const percents = (result && typeof result.percents === 'number' && !isNaN(result.percents)) 
                    ? result.percents 
                    : null;
                  const letter = result?.letter || '?';
                  const isLoaded = percents !== null;
                  
                  return (
                    <div key={index} className={`result-card ${!isLoaded ? 'result-card-loading' : ''}`}>
                      <div className="result-card-header">
                        <span className="result-letter-badge">{letter}</span>
                        {isLoaded ? (
                          <span className={`result-percentage-badge ${getScoreClass(percents)}`}>
                            {percents}%
                          </span>
                        ) : (
                          <span className="result-percentage-badge result-loading">
                            <div className="mini-loader"></div>
                          </span>
                        )}
                      </div>
                      {result?.advice && isLoaded && (
                        <div className="result-advice-text">{result.advice}</div>
                      )}
                      {!isLoaded && (
                        <div className="result-loading-text">
                          <Trans i18nKey="quizPage.loadingResult">Завантаження...</Trans>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
          
          <div className="quiz-results-buttons">
            <button
              className="quiz-button quiz-button-primary"
              onClick={() => navigate("/select-language?sketch=quick")}
            >
              <Trans i18nKey="quizPage.startAgain">Почати знову</Trans>
            </button>
            <button
              className="quiz-button quiz-button-secondary"
              onClick={() => navigate("/")}
            >
              <Trans i18nKey="quizPage.goHome">На головну</Trans>
            </button>
          </div>
        </div>
      </section>
    );
  }

  const currentLetter = letters[currentLetterIndex];

  return (
    <section className="quiz-container">
      {/* Прогресс-бар часу */}
      <div className="quiz-timer-bar">
        <div
          className="quiz-timer-progress"
          style={{ width: `${timeProgress}%` }}
        ></div>
        <div className="quiz-timer-text">
          {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}
        </div>
      </div>

      {/* Прогресс літер */}
      <div className="quiz-progress">
        <Trans i18nKey="quizPage.progress">
          Літера {currentLetterIndex + 1} з {TOTAL_LETTERS}
        </Trans>
      </div>

      {/* Поточна літера */}
      <div className="quiz-letter-display">{currentLetter}</div>

      {/* Canvas */}
      <div className="quiz-canvas-wrapper">
        <ReactSketchCanvas
          width="300px"
          height="300px"
          strokeWidth={7}
          strokeColor="gray"
          ref={canvasRef}
        />
      </div>

      {/* Кнопки */}
      <div className="quiz-buttons">
        <button
          className="quiz-button quiz-button-submit"
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <Trans i18nKey="quizPage.submitting">Відправляємо...</Trans>
          ) : (
            <Trans i18nKey="quizPage.submit">Відправити</Trans>
          )}
        </button>
        <button
          className="quiz-button quiz-button-clear"
          onClick={() => canvasRef.current?.clearCanvas()}
          disabled={isSubmitting}
        >
          <Trans i18nKey="quizPage.clear">Очистити</Trans>
        </button>
      </div>
    </section>
  );
}

