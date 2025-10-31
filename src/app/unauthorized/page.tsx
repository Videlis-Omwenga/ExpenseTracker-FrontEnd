"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Container, Card, Button } from "react-bootstrap";
import { ShieldX, ArrowLeft } from "react-bootstrap-icons";

export default function UnauthorizedPage() {
  const router = useRouter();

  return (
    <Container
      fluid
      className="unauth-wrapper d-flex align-items-center justify-content-center p-0 mt-5"
    >
      <Card className="unauth-card text-center shadow-lg border-0 rounded-4">
        <Card.Body className="p-4 p-md-5">
          <div className="icon-badge mx-auto mb-4">
            <ShieldX size={40} className="text-danger" />
          </div>

          <h3 className="title text-danger fw-semibold mb-2">Access Denied</h3>
          <p className="subtitle text-muted mb-3">403 - Unauthorized</p>

          <p className="message text-secondary mb-4">
            You don't have permission to access this page. Please contact your
            administrator if you believe this is an error.
          </p>

          <div className="d-flex gap-2 gap-md-3 justify-content-center">
            <Button
              variant="outline-secondary"
              onClick={() => router.back()}
              className="d-flex align-items-center gap-2 px-3"
            >
              <ArrowLeft size={18} />
              Go Back
            </Button>

            <Button
              variant="primary"
              onClick={() => router.push("/dashboard")}
              className="px-4"
            >
              Go to Dashboard
            </Button>
          </div>
        </Card.Body>
      </Card>

      <style jsx>{`
        .unauth-wrapper {
          min-height: 100vh;
          background: rgba(13, 110, 253, 0.10); /* primary @10% */
          position: relative;
          overflow: hidden;
        }
        .unauth-card {
          max-width: 520px;
          background: rgba(255, 255, 255, 0.95);
          border: 1px solid rgba(0, 0, 0, 0.04);
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.08);
        }
        .unauth-card:hover {
          transform: translateY(-2px);
          transition: transform 0.2s ease;
        }
        .icon-badge {
          width: 64px;
          height: 64px;
          border-radius: 16px;
          background: rgba(220, 53, 69, 0.10); /* danger @10% */
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 10px 24px rgba(220, 53, 69, 0.15);
        }
        .title {
          font-size: 1.25rem; /* h5 cap */
          line-height: 1.2;
          letter-spacing: -0.01em;
        }
        .subtitle {
          font-size: 0.95rem;
        }
        .message {
          font-size: 0.95rem;
        }
      `}</style>
    </Container>
  );
}
