import type { Metadata } from "next";
import "./globals.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { Container } from "react-bootstrap";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from "react-toastify";
import { UserProvider } from "./context/UserContext";

export const metadata: Metadata = {
  title: "Petty Cash Management",
  description: "Track and manage expenses efficiently",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="body">
        <UserProvider>
          <ToastContainer />
          <Container fluid className="p-0">
            {children}
          </Container>
        </UserProvider>
      </body>
    </html>
  );
}
