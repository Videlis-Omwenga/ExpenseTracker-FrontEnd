import React from "react";
import { Spinner } from "react-bootstrap";

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
        background: "linear-gradient(135deg, #f8f9fa, #e9ecef)",
        zIndex: 9999,
      }}
    >
      {/* Spinner inside glowing circle */}
      <div
        className="d-flex justify-content-center align-items-center mb-4"
        style={{
          width: "100px",
          height: "100px",
          borderRadius: "50%",
          background: "white",
          boxShadow: "0 0 25px rgba(0, 123, 255, 0.3)",
          animation: "pulse 1.5s infinite",
        }}
      >
        <Spinner
          animation="border"
          role="status"
          variant="primary"
          style={{ width: "3rem", height: "3rem" }}
        >
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>

      {/* Text branding */}
      <h5 className="fw-bold text-primary mb-2">Loading, please wait...</h5>
      <p className="text-muted small">Preparing your workspace</p>

      {/* CSS keyframes */}
      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); box-shadow: 0 0 15px rgba(0, 123, 255, 0.2); }
          50% { transform: scale(1.05); box-shadow: 0 0 35px rgba(0, 123, 255, 0.5); }
          100% { transform: scale(1); box-shadow: 0 0 15px rgba(0, 123, 255, 0.2); }
        }
      `}</style>
    </div>
  );
};

export default PageLoader;
