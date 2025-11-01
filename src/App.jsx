import Canvas from "./components/Canvas/Canvas.jsx";
import UserLayout from "./components/Layouts/UserLayout/UserLayout.jsx";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainPage from "./components/MainPage/MainPage.jsx";
import FileUploader from "./components/FileUploader/FileUploader.jsx";
import SelectLanguage from "./components/SelectLanguage/SelectLanguage.jsx";
import AuthElement from "./components/Auth/AuthElement.jsx";
import GuseLayout from "./components/Layouts/GuestLayout/GuestLayout.jsx";
import NotFound from "./components/404/404.jsx";
import Quiz from "./components/Quiz/Quiz.jsx";
import { useEffect, useState } from "react";

export default function App() {
  const [isLogedIn, setIsLoggedIn] = useState(localStorage.getItem("token"));
  useEffect(() => {
    fetch("https://letters-back.vercel.app/me", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.message === "Authenticated") setIsLoggedIn(true);
        else setIsLoggedIn(false);
      });
  }, []);

  let routes = (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<UserLayout />}>
            <Route index path="/" element={<MainPage />} />
            <Route path="canvas" element={<Canvas />} />
            <Route path="file-uploader" element={<FileUploader />} />
            <Route path="select-language" element={<SelectLanguage />} />
            <Route path="quiz" element={<Quiz />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </>
  );

  if (!isLogedIn) {
    routes = (
      <>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<GuseLayout />}>
              <Route index path="/" element={<MainPage />} />
              <Route path="/auth" element={<AuthElement />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </>
    );
  }

  return <>{routes}</>;
}
