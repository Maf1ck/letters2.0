import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
      {isSignIn ? <h1>Sign in</h1> : <h1>Sign up</h1>}
      {isSignIn ? (
        <form
          ref={formRef}
          className="auth-form"
          onSubmit={(e) => handleSubmit(e, false)}
        >
          <div className="form-group">
            <label htmlFor="email">Email:</label>
            <input
              type="email"
              id="email"
              placeholder="Enter your email"
              name="email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password:</label>
            <input
              type="password"
              id="password"
              placeholder="Enter your password"
              name="password"
              required
            />
          </div>

          <button type="submit" className="submit-btn">
            Sign in
          </button>
          <p className="toggle-text">
            Don't have an account?
            <a
              style={{ cursor: "pointer" }}
              onClick={() => setIsSignIn(!isSignIn)}
            >
              Register
            </a>
          </p>
          <button
            type="button"
            className="submit-btn"
            onClick={(e) => handleSubmit(e, true)}
          >
            <p>Login as test user</p>
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
            <label htmlFor="name">Name:</label>
            <input
              type="text"
              id="name"
              placeholder="Enter your name"
              name="name"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email:</label>
            <input
              type="email"
              id="email"
              placeholder="Enter your email"
              name="email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="age">Age:</label>
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
            <label htmlFor="password">Password:</label>
            <input
              type="password"
              id="password"
              placeholder="Enter your password"
              name="password"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password:</label>
            <input
              type="password"
              id="confirmPassword"
              placeholder="Confirm your password"
              name="confirmPassword"
              required
            />
          </div>

          <button type="submit" className="submit-btn">
            Sign Up
          </button>

          <p className="toggle-text">
            Already have an account?
            <a
              style={{ cursor: "pointer" }}
              onClick={() => setIsSignIn(!isSignIn)}
            >
              Login
            </a>
          </p>
          <button
            type="button"
            className="submit-btn"
            onClick={(e) => handleSubmit(e, true)}
          >
            <p>Login as test user</p>
          </button>
        </form>
      )}
    </div>
  );
}
