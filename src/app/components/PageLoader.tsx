import React from "react";

const PageLoader: React.FC = () => {
  return (
    <div
      className="d-flex flex-column justify-content-center align-items-center"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "linear-gradient(135deg, #fdfbfb, #ebedee)",
        zIndex: 9999,
      }}
    >
      {/* Coin Loader */}
      <div
        className="coin-loader mb-4"
        style={{
          width: "80px",
          height: "80px",
          borderRadius: "50%",
          background: "linear-gradient(145deg, #0d6efd, #0072ff)",
          position: "relative",
          animation: "spin 1.5s linear infinite",
          boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
        }}
      >
        <span
          style={{
            color: "white",
            fontWeight: "bold",
            fontSize: "1.5rem",
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        >
          $
        </span>
      </div>

      {/* Text branding */}
      <h5 className="fw-bold text-dark mb-2">Processing Expenses...</h5>
      <p className="text-muted small">Securing and balancing accounts</p>

      {/* CSS keyframes */}
      <style>{`
        @keyframes spin {
          0% { transform: rotateY(0deg); }
          100% { transform: rotateY(360deg); }
        }
      `}</style>
    </div>
  );
};

export default PageLoader;
