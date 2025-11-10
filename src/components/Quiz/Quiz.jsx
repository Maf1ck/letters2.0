import * as React from "react";
import { ReactSketchCanvas } from "react-sketch-canvas";
import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import convertSvgToPng from "../utils/convertSvgToPng.js";
import { useTranslation, Trans } from "react-i18next";
import { usePDF } from "react-to-pdf";
import "./Quiz.css";

const TOTAL_LETTERS = 6;
const TIME_PER_LETTER = 20;

// Функція для озвучування букви
const speakLetter = (letter, language) => {
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(letter);
    
    // Мапінг мов для SpeechSynthesis
    const langMap = {
      'ua': 'uk-UA',
      'en': 'en-US',
      'jp': 'ja-JP',
      'ro': 'ro-RO',
      'ch': 'zh-CN',
      'fr': 'fr-FR',
      'es': 'es-ES',
      'de': 'de-DE'
    };
    
    utterance.lang = langMap[language] || 'en-US';
    utterance.rate = 0.8; // Трохи повільніше для кращого сприйняття
    utterance.pitch = 1;
    utterance.volume = 1;
    
    window.speechSynthesis.cancel(); // Зупиняємо попереднє озвучування
    window.speechSynthesis.speak(utterance);
  } else {
    alert('Ваш браузер не підтримує озвучування тексту');
  }
};

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

async function sendLetterForEvaluation(token, language, letter, userImage, ethalonImage, systemLanguage) {
  try {
    const response = await fetch(
      "https://letters-back.vercel.app/letter/quiz",
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
          systemLanguage: systemLanguage || "en"
        }),
      },
    );
    const data = await response.json();
    return {
      letter: letter,
      percents: data.percents,
      advice: data.advice || "",
      status: data.status || null,
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
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [userLanguage, setUserLanguage] = useState(
    localStorage.getItem('i18nextLng') || 'en'
  );
  const canvasRef = useRef(null);
  const timerRef = useRef(null);
  
  const { toPDF, targetRef } = usePDF({ 
    filename: `quiz-results-${language || 'unknown'}-${new Date().toISOString().split('T')[0]}.pdf`,
    page: {
      margin: 20,
      format: 'A4'
    }
  });

  const getRandomLetters = (allLetters, count) => {
    const shuffled = [...allLetters].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count).map((l) => l.letter);
  };

  const handleNextLetter = useCallback(async () => {
    setIsTransitioning(true);
    
    if (currentLetterIndex >= letters.length - 1) {
      setIsQuizFinished(true);
      setIsTransitioning(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      return;
    }

    await new Promise(resolve => setTimeout(resolve, 300));

    setCurrentLetterIndex((prev) => prev + 1);
    if (canvasRef.current) {
      canvasRef.current.clearCanvas();
    }
    
    setIsTransitioning(false);
  }, [currentLetterIndex, letters.length]);

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

  useEffect(() => {
    if (isLoading || isQuizFinished || isSubmitting) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
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
  }, [currentLetterIndex, isLoading, isQuizFinished, isSubmitting, handleNextLetter]);

  useEffect(() => {
    if (letters.length > 0 && currentLetterIndex < letters.length) {
      setTimeLeft(TIME_PER_LETTER);
    }
  }, [currentLetterIndex, letters]);

  const handleSubmit = async () => {
    if (isSubmitting) return;

    const currentLetter = letters[currentLetterIndex];
    if (!currentLetter) return;

    setIsSubmitting(true);

    try {
      const userPicture = await canvasRef.current.exportImage("png");
      const letterImageUrl = await getLetterImage(language, currentLetter);
      if (!letterImageUrl) {
        throw new Error("Failed to get letter image");
      }
      const ethalonImageBase64 = await convertSvgToPng(letterImageUrl);
      const ethalonImage = `data:image/png;base64,${ethalonImageBase64}`;

      await new Promise(resolve => setTimeout(resolve, 800));

      sendLetterForEvaluation(
        token,
        language,
        currentLetter,
        userPicture,
        ethalonImage,
        userLanguage
      ).then((result) => {
        if (result && typeof result.percents === 'number' && !isNaN(result.percents)) {
          setResults((prev) => [...prev, result]);
        } else {
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
        const errorResult = {
          letter: currentLetter,
          percents: 0,
          advice: "Помилка при оцінці",
          status: null,
        };
        setResults((prev) => [...prev, errorResult]);
      });

      await new Promise(resolve => setTimeout(resolve, 500));

      if (currentLetterIndex < letters.length - 1) {
        await handleNextLetter();
      } else {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
        setIsTransitioning(true);
        await new Promise(resolve => setTimeout(resolve, 800));
        setIsQuizFinished(true);
        setIsTransitioning(false);
      }
    } catch (e) {
      console.error(e);
      alert("Failed to submit letter");
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
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
        setIsTransitioning(true);
        await new Promise(resolve => setTimeout(resolve, 500));
        setIsQuizFinished(true);
        setIsTransitioning(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getScoreClass = (score) => {
    if (score >= 80) return "score-excellent";
    if (score >= 60) return "score-good";
    if (score >= 40) return "score-average";
    return "score-poor";
  };

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
    const resultsMap = {};
    results.forEach(result => {
      if (result && result.letter) {
        resultsMap[result.letter] = result;
      }
    });

    const allResults = letters.map(letter => {
      return resultsMap[letter] || {
        letter: letter,
        percents: null,
        advice: null,
        status: null,
      };
    });

    const sortedResults = [...allResults];
    const validResults = sortedResults.filter(r => r && typeof r.percents === 'number' && !isNaN(r.percents));
    const averageScore = validResults.length > 0
      ? Math.round(
        validResults.reduce((sum, r) => sum + r.percents, 0) /
        validResults.length,
      )
      : 0;

    const allResultsLoaded = sortedResults.every(r => r && typeof r.percents === 'number' && !isNaN(r.percents));

    return (
      <section className="quiz-container">
        <div className="quiz-results">
          {validResults.length === 0 && (
            <div className="quiz-loading-message">
              <Trans i18nKey="quizPage.loadingResults">Завантаження результатів...</Trans>
              <div className="loader-spinner"></div>
            </div>
          )}

          {sortedResults.length > 0 && (
            <>
              <div className="pdf-content-wrapper" ref={targetRef}>
                <div className="pdf-header">
                  <h2 className="pdf-title">
                    <Trans i18nKey="quizPage.resultsTitle">Ваші результати</Trans>
                  </h2>
                  <div className="pdf-meta">
                    <span className="pdf-language">{t('quizPage.language')}: {language?.toUpperCase()}</span>
                    <span className="pdf-date">{new Date().toLocaleDateString()}</span>
                  </div>
                </div>

                {validResults.length > 0 && (
                  <div className="pdf-average-section">
                    <div className="pdf-average-label">
                      <Trans i18nKey="quizPage.average">Середній бал</Trans>
                    </div>
                    <div className="pdf-average-score">{averageScore}%</div>
                  </div>
                )}

                <div className="pdf-results-grid">
                  {sortedResults.map((result, index) => {
                    const percents = (result && typeof result.percents === 'number' && !isNaN(result.percents))
                      ? result.percents
                      : null;
                    const letter = result?.letter || '?';
                    const isLoaded = percents !== null;

                    return (
                      <div key={index} className={`pdf-result-card ${!isLoaded ? 'pdf-result-card-loading' : ''}`}>
                        <div className="pdf-result-header">
                          <span className="pdf-letter-badge">{letter}</span>
                          {isLoaded ? (
                            <span className={`pdf-percentage-badge ${getScoreClass(percents)}`}>
                              {percents}%
                            </span>
                          ) : (
                            <span className="pdf-percentage-badge pdf-result-loading">
                              ...
                            </span>
                          )}
                        </div>
                        {result?.advice && isLoaded && (
                          <div className="pdf-advice-text">{result.advice}</div>
                        )}
                      </div>
                    );
                  })}
                </div>
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
            <button 
              className="quiz-button quiz-button-secondary" 
              onClick={() => toPDF()}
              disabled={!allResultsLoaded || isSubmitting}
            >
              <Trans i18nKey="quizPage.downloadPdf">Завантажити PDF</Trans>
            </button>
          </div>
        </div>
      </section>
    );
  }

  const currentLetter = letters[currentLetterIndex];

  return (
    <section className="quiz-container">
      {(isSubmitting || isTransitioning) && (
        <div className="loader-overlay">
          <div className="loader-spinner"></div>
        </div>
      )}
      
      <div className="quiz-timer-bar">
        <div
          className="quiz-timer-progress"
          style={{ width: `${timeProgress}%` }}
        ></div>
        <div className="quiz-timer-text">
          {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}
        </div>
      </div>

      <div className="quiz-progress">
        <Trans 
          i18nKey="quizPage.progress" 
          values={{ 
            current: currentLetterIndex + 1, 
            total: TOTAL_LETTERS 
          }}
        >
          Літера {{current: currentLetterIndex + 1}} з {{total: TOTAL_LETTERS}}
        </Trans>
      </div>

      {/* <div className="quiz-letter-display-wrapper">
        <div className="quiz-letter-display">{currentLetter}</div>
        <button
          className="quiz-speak-button"
          onClick={() => speakLetter(currentLetter, language)}
          disabled={isSubmitting}
          title="Озвучити букву"
        >
          🔊
        </button>
      </div> */}

      <div className="quiz-canvas-wrapper">
        <ReactSketchCanvas
          width="300px"
          height="300px"
          strokeWidth={7}
          strokeColor="blue"
          ref={canvasRef}
        />
      </div>

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