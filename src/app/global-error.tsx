"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="uk">
      <body
        style={{
          margin: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          fontFamily: "system-ui, sans-serif",
          background: "#FAF7F2",
          color: "#3D2E22",
          textAlign: "center",
          padding: "0 16px"
        }}
      >
        <div>
          <p style={{ margin: 0, fontSize: "72px", lineHeight: 1, fontWeight: 700, opacity: 0.4 }}>!</p>
          <h1 style={{ margin: "16px 0 8px", fontSize: "24px", fontWeight: 700 }}>
            Щось пішло не так / Something went wrong
          </h1>
          <p style={{ margin: "0 0 24px", fontSize: "14px", color: "rgba(61, 46, 34, 0.7)" }}>
            Сталася неочікувана помилка / An unexpected error occurred
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              background: "#C4725A",
              color: "white",
              borderRadius: 9999,
              padding: "10px 20px",
              border: "none",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: 600
            }}
          >
            Спробувати ще раз / Try again
          </button>
        </div>
      </body>
    </html>
  );
}

