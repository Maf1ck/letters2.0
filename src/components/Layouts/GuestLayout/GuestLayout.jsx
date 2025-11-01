import { Outlet, Link } from "react-router-dom";
import { useRef, useState, useEffect } from "react";
import { useTranslation, Trans } from "react-i18next";
import languagesImage from "../../../assets/languages.svg";
import question from "../../../assets/question-svgrepo-com.svg";
import { useNavigate } from "react-router-dom";
import "../Layouts.css";

export default function UserLayout() {
  const burgerMenuRef = useRef(null);
  const navLinksRef = useRef(null);
  const dropdownMenuRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const [width, setWidth] = useState(window.innerWidth);

  console.log(width);

  function handleLogout() {
    localStorage.removeItem("token");
    navigate("/");
  }

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const { t, i18n } = useTranslation();
  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };
  const toggleMenu = () => {
    burgerMenuRef.current.classList.toggle("active");
    navLinksRef.current.classList.toggle("active");
  };

  const token = localStorage.getItem("token");

  function handleDropdownMenuClick() {
    dropdownMenuRef.current.classList.toggle("active");
  }
  useEffect(() => {
    if (!token) {
      alert("Please Login, if you want to start use our App!");
    }
  }, []);
  return (
    <main>
      <nav className="navbar">
        <Link className="navbar-logo" to="/">
          Pysanka
        </Link>
        <div
          className="burger-menu"
          id="burger-menu"
          ref={burgerMenuRef}
          onClick={toggleMenu}
        >
          <span></span>
          <span></span>
          <span></span>
        </div>
        <ul className="nav-links" id="nav-links" ref={navLinksRef}>
          <Link className="nav-links-item" to="/select-language?sketch=true">
            <li onClick={toggleMenu}>
              <Trans i18nKey="NavBar.list.StudyPage">Навчання</Trans>
            </li>
          </Link>
          <Link className="nav-links-item" to="/select-language?sketch=false">
            <li onClick={toggleMenu}>
              <Trans i18nKey="NavBar.list.ReviewPage">Тестування</Trans>
            </li>
          </Link>
          <Link className="nav-links-item" to="/select-language?sketch=free">
            <li onClick={toggleMenu}>
              <Trans i18nKey="NavBar.list.ComparePage">Вільний режим</Trans>
            </li>
          </Link>
          <Link className="nav-links-item" to="/select-language?sketch=quick">
            <li onClick={toggleMenu}>
              <Trans i18nKey="NavBar.list.QuickMode">Швидкий режим</Trans>
            </li>
          </Link>
        </ul>
        <div className="languages-doc-container">
          {token ? (
            <button className="login-button" onClick={handleLogout}>
              <Trans i18nKey="NavBar.list.signin">Logout</Trans>
            </button>
          ) : (
            <Link to="/auth">
              <button className="login-button">
                <Trans i18nKey="NavBar.list.signin">Log in</Trans>
              </button>
            </Link>
          )}
          <div className="select-language-wrapper" ref={dropdownRef}>
            <div className="dropdown-container">
              <button
                className="dropdown-trigger"
                onClick={() => setIsOpen(!isOpen)}
              >
                <img src={languagesImage} alt="Language selector" />
              </button>
              <div className={`dropdown-menu ${isOpen ? "active" : ""}`}>
                <button
                  onClick={() => {
                    changeLanguage("en");
                    setIsOpen(false);
                  }}
                >
                  English
                </button>
                <button
                  onClick={() => {
                    changeLanguage("ro");
                    setIsOpen(false);
                  }}
                >
                  Română
                </button>
                <button
                  onClick={() => {
                    changeLanguage("ua");
                    setIsOpen(false);
                  }}
                >
                  Українська
                </button>
                <button
                  onClick={() => {
                    changeLanguage("ch");
                    setIsOpen(false);
                  }}
                >
                  中文
                </button>
                <button
                  onClick={() => {
                    changeLanguage("fr");
                    setIsOpen(false);
                  }}
                >
                  Français
                </button>
                <button
                  onClick={() => {
                    changeLanguage("jp");
                    setIsOpen(false);
                  }}
                >
                  日本語
                </button>
                <button
                  onClick={() => {
                    changeLanguage("es");
                    setIsOpen(false);
                  }}
                >
                  Español
                </button>
                <button
                  onClick={() => {
                    changeLanguage("de");
                    setIsOpen(false);
                  }}
                >
                  Deutsch
                </button>
              </div>
            </div>
          </div>
          <a
            href="https://docs.google.com/document/d/183qj-W_nGt-8dZEE9-8hKMU0W3Rvl7MhCaynXGzift4/edit?usp=sharing"
            target="_blank"
          >
            <img
              src={question}
              alt="question"
              style={{
                filter: "brightness(0) invert(1)",
                width: "30px",
                height: "30px",
              }}
            />
          </a>
        </div>
      </nav>
      <Outlet />
    </main>
  );
}
