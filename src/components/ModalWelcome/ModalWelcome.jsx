import { useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./ModalWelcome.css";

export default function ModalWelcome({ onClose }) {
  const modalRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    modalRef.current?.showModal();
  }, []);

  return (
    <dialog ref={modalRef} className="welcome-modal">
      <div className="welcome-content">
        <h2>Ласкаво просимо до Pysanka!</h2>
        <p>
          Для повноцінного використання додатку, будь ласка, увійдіть в систему
          або зареєструйтеся.
        </p>
        <div className="welcome-buttons">
          <button
            className="welcome-button login-btn"
            onClick={() => {
              navigate("/auth");
              onClose();
            }}
          >
            Увійти
          </button>
          <button className="welcome-button later-btn" onClick={onClose}>
            Пізніше
          </button>
        </div>
      </div>
    </dialog>
  );
}