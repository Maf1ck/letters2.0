import * as React from "react";
import { ReactSketchCanvas } from "react-sketch-canvas";
import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import ResultModal from "../ResultModal/ResultModal.jsx";
import convertSvgToPng from "../utils/convertSvgToPng.js";
import arrow from "../../assets/right-arrow-svgrepo-com.svg";
import audioImage from "../../assets/audio-svgrepo-com.svg";
import { useTranslation, Trans } from "react-i18next";
import "./Canvas.css";

const style = {
  border: "3px solid rgb(184, 184, 184)",
};

const STATUS = {
  GOOD: "good",
  AVERAGE: "average",
  BAD: "bad",
  NOT_DONE: null,
};

export default function Canvas() {
  const location = useLocation();
  const navigate = useNavigate();
  const [letterImage, setLetterImage] = useState(null);
  const [nextLetter, setNextLetter] = useState(null);
  const [prevLetter, setPrevLetter] = useState(null);
  const [result, setResult] = useState(null);
  const [description, setDescription] = useState(null);
  const [advice, setAdvice] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const canvasRef = useRef(null);
  const resultModalRef = useRef(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);
  const [styles, setStyles] = useState({
    border: "3px solid rgb(184, 184, 184)",
  });

  console.log(advice);

  const { t, i18n } = useTranslation();
  console.log();
  const searchParams = new URLSearchParams(location.search);
  const sketchOrNot = searchParams.get("sketch") === "true";
  const letter = searchParams.get("letter");
  const language = searchParams.get("language");

  let sendButton = (
    <button
      disabled={isLoading}
      className="canvas-container-button"
      onClick={onSendCanvas}
    >
      <Trans i18nKey="canvasPage.sendButtonInactive">Відправити</Trans>
    </button>
  );
  let clearCanvasButton = (
    <button
      disabled={isLoading}
      className="canvas-container-button"
      onClick={() => {
        canvasRef.current.clearCanvas();
      }}
    >
      <Trans i18nKey="canvasPage.clearCanvasButton">Очистити</Trans>
    </button>
  );

  if (isLoading)
    sendButton = (
      <button
        disabled={isLoading}
        className="canvas-container-button"
        onClick={onSendCanvas}
      >
        <Trans i18nKey="canvasPage.sendButtonActive">Відправляємо...</Trans>
      </button>
    );
  useEffect(() => {
    if (sketchOrNot === null || letter === null || language === null) {
      if (sketchOrNot === null) {
        navigate(`/`);
      } else {
        navigate(`/select-language?sketch=${sketchOrNot}`);
      }
      return;
    }
    fetch("https://letters-back.vercel.app/letter", {
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify({
        language: language,
        letter: letter,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        const base64 = data.image; // e.g. base64 string WITHOUT prefix
        const mimeType = "image/svg+xml"; // change if it's PNG, JPEG, etc.

        // Convert base64 string to binary
        const byteCharacters = atob(base64);
        const byteNumbers = new Array(byteCharacters.length)
          .fill(0)
          .map((_, i) => byteCharacters.charCodeAt(i));
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: mimeType });

        const url = URL.createObjectURL(blob);
        setLetterImage(url);
        setLoading(false);
        setNextLetter(data.nextLetter);
        setPrevLetter(data.prevLetter);
      })
      .catch((e) => {
        console.error(e);
      });
  }, [letter, language, sketchOrNot, navigate]);

  const handleArrowClick = (direction) => {
    if (direction === "next") {
      setLoading(true); // Додаємо лоадер
      canvasRef.current.clearCanvas();
      navigate(
        `/canvas?letter=${nextLetter}&language=${language}&sketch=${sketchOrNot}`,
      );
    } else if (direction === "prev") {
      setLoading(true); // Додаємо лоадер
      canvasRef.current.clearCanvas();
      navigate(
        `/canvas?letter=${prevLetter}&language=${language}&sketch=${sketchOrNot}`,
      );
    }
  };

  function onSendCanvas() {
    setIsLoading(true);
    setStyles((prevStyles) => {
      return { ...prevStyles, pointerEvents: "none" };
    });
    console.log(123);
    canvasRef.current
      .exportImage("png")
      .then(async (data) => {
        const userPicture = data;
        const ethalonImage = await convertSvgToPng(letterImage);
        // console.log(`data:image/png;base64,${ethalonImage}`);
        console.log(userPicture);
        // console.log(ethalonImage);
        if (!ethalonImage) {
          console.error("Failed to convert SVG to PNG");
          return;
        }
        const resp = await fetch(
          "https://letters-back.vercel.app/sendImages",
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer " + token,
            },
            method: "POST",
            body: JSON.stringify({
              userImage: userPicture,
              ethalonImage: `data:image/png;base64,${ethalonImage}`,
              language: language,
              letter: letter,
              systemLanguage: i18n.language || "ua" // Додаємо параметр для бекенду
            }),
          },
        );
        const response = await resp.json();
        if (response.message === "Not authenticated.") {
          alert("Not authenticated");
        } else if (response.message === "Token expired.") {
          alert("Token expired");
        }
        setResult(() => {
          const newValue = response.percents;
          setStyles(styles);
          setAdvice(response.result.advice);
          resultModalRef.current.open();
          setIsLoading(false);
          return newValue;
        });
      })
      .catch((e) => {
        console.log(e);
        alert("Failed to process the canvas image. Please try again.");
        setIsLoading(false);
      });
  }

  return (
    <section className="canvas-container">
      {(isLoading || loading) && ( // Модифікуємо умову показу лоадера
        <div className="loader-overlay">
          <div className="loader-spinner"></div>
        </div>
      )}
      <ResultModal ref={resultModalRef} result={result} advice={advice} />
      <div className="canvas-navigation">
        <div className="nav-arrow-left">
          <span className="nav-letter">{prevLetter}</span>
          <button 
            className="nav-arrow-button"
            disabled={isLoading || !prevLetter} 
            onClick={() => handleArrowClick("prev")}
          >
            <img
              src={arrow}
              alt="arrow"
              className="arrow-left"
            />
          </button>
        </div>
        <div className="canvas-main-letter">{letter}</div>
        <div className="nav-arrow-right">
          <button 
            className="nav-arrow-button"
            disabled={isLoading || !nextLetter} 
            onClick={() => handleArrowClick("next")}
          >
            <img
              src={arrow}
              alt="arrow"
              className="arrow-right"
            />
          </button>
          <span className="nav-letter">{nextLetter}</span>
        </div>
      </div>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="canvas-wrapper">
          {sketchOrNot ? (
            <ReactSketchCanvas
              style={styles}
              width="300px"
              height="300px"
              strokeWidth={7}
              strokeColor="blue"
              backgroundImage={letterImage}
              ref={canvasRef}
            />
          ) : (
            <ReactSketchCanvas
              style={styles}
              width="300px"
              height="300px"
              strokeWidth={7}
              strokeColor="blue"
              ref={canvasRef}
            />
          )}
        </div>
      )}

      <div className="canvas-buttons">
        {sendButton}
        {clearCanvasButton}
      </div>
    </section>
  );
}
