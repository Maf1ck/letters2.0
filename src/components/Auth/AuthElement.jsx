import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Trans } from "react-i18next";
import "./AuthElement.css";

export default function AuthElement() {
  const navigate = useNavigate();
  const formRef = useRef(null);
  const [isSignIn, setIsSignIn] = useState(true);

  function handleSubmit(e, isTestUser) {
    let isLogin = "signin";

    if (!isSignIn) {
      isLogin = "signup";
    }
    if (isTestUser) {
      fetch("https://letters-back.vercel.app/signin", {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        method: "POST",
        body: JSON.stringify({
          email: "test@test.com",
          password: "1234",
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          console.log(data);
          if (data.access_token) {
            localStorage.setItem("token", data.access_token);
            localStorage.setItem("refreshToken", data.refresh_token);
            navigate("/");
            window.location.reload(false);
          } else if (data.message === "Invalid password.") {
            alert("Invalid password.");
          } else {
            alert("Some error occured. Please try again later.");
          }
        })
        .catch((e) => {
          console.log(e);
          alert("Some error occured. Please try again later.");
        });
    } else {
      e.preventDefault();
      const form = formRef.current;
      const formData = new FormData(form);
      const values = Object.fromEntries(formData.entries());

      if (!isSignIn && values.password !== values.confirmPassword) {
        alert("Passwords do not match!");
        return;
      }

      fetch("https://letters-back.vercel.app/" + isLogin, {
        headers: { "Content-Type": "application/json" },
        method: "POST",
        body: JSON.stringify(values),
      })
        .then((res) => res.json())
        .then((data) => {
          console.log(data);
          if (data.access_token) {
            localStorage.setItem("token", data.access_token);
            localStorage.setItem("refreshToken", data.refresh_token);
            navigate("/");
            window.location.reload(false);
          } else if (data.message === "Invalid password.") {
            alert("Invalid password.");
          } else {
            alert("Some error occured. Please try again later.");
          }
        })
        .catch((e) => {
          console.log(e);
          alert("Some error occured. Please try again later.");
        });
    }
  }

  return (
    <div className="auth-container">
      {isSignIn ? (
        <h1><Trans i18nKey="authPage.signIn">Вхід</Trans></h1>
      ) : (
        <h1><Trans i18nKey="authPage.signUp">Реєстрація</Trans></h1>
      )}
      {isSignIn ? (
        <form
          ref={formRef}
          className="auth-form"
          onSubmit={(e) => handleSubmit(e, false)}
        >
          <div className="form-group">
            <label htmlFor="email">
              <Trans i18nKey="authPage.email">Email:</Trans>
            </label>
            <input
              type="email"
              id="email"
              placeholder="Enter your email"
              name="email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">
              <Trans i18nKey="authPage.password">Пароль:</Trans>
            </label>
            <input
              type="password"
              id="password"
              placeholder="Enter your password"
              name="password"
              required
            />
          </div>

          <button type="submit" className="submit-btn">
            <Trans i18nKey="authPage.signInButton">Увійти</Trans>
          </button>
          <p className="toggle-text">
            <Trans i18nKey="authPage.noAccount">Немає облікового запису?</Trans>{" "}
            <a
              style={{ cursor: "pointer" }}
              onClick={() => setIsSignIn(!isSignIn)}
            >
              <Trans i18nKey="authPage.register">Реєстрація</Trans>
            </a>
          </p>
          <button
            type="button"
            className="submit-btn"
            onClick={(e) => handleSubmit(e, true)}
          >
            <Trans i18nKey="authPage.testUser">Увійти як тестовий користувач</Trans>
          </button>
        </form>
      ) : (
        <form
          ref={formRef}
          id="signupForm"
          className="auth-form"
          onSubmit={(e) => handleSubmit(e, false)}
        >
          <div className="form-group">
            <label htmlFor="name">
              <Trans i18nKey="authPage.name">Ім'я:</Trans>
            </label>
            <input
              type="text"
              id="name"
              placeholder="Enter your name"
              name="name"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">
              <Trans i18nKey="authPage.email">Email:</Trans>
            </label>
            <input
              type="email"
              id="email"
              placeholder="Enter your email"
              name="email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="age">
              <Trans i18nKey="authPage.age">Вік:</Trans>
            </label>
            <input
              type="number"
              id="age"
              placeholder="Enter your age"
              name="age"
              max="120"
              min="1"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">
              <Trans i18nKey="authPage.password">Пароль:</Trans>
            </label>
            <input
              type="password"
              id="password"
              placeholder="Enter your password"
              name="password"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">
              <Trans i18nKey="authPage.confirmPassword">Підтвердіть пароль:</Trans>
            </label>
            <input
              type="password"
              id="confirmPassword"
              placeholder="Confirm your password"
              name="confirmPassword"
              required
            />
          </div>

          <button type="submit" className="submit-btn">
            <Trans i18nKey="authPage.signUpButton">Зареєструватися</Trans>
          </button>

          <p className="toggle-text">
            <Trans i18nKey="authPage.haveAccount">Вже є обліковий запис?</Trans>{" "}
            <a
              style={{ cursor: "pointer" }}
              onClick={() => setIsSignIn(!isSignIn)}
            >
              <Trans i18nKey="authPage.login">Увійти</Trans>
            </a>
          </p>
          <button
            type="button"
            className="submit-btn"
            onClick={(e) => handleSubmit(e, true)}
          >
            <Trans i18nKey="authPage.testUser">Увійти як тестовий користувач</Trans>
          </button>
        </form>
      )}
    </div>
  );
}