"use client";

import { useState } from "react";
import { Modal, Button, Form, Spinner, Alert, Table } from "react-bootstrap";
import { FaUpload, FaFileUpload, FaDownload } from "react-icons/fa";
import { toast } from "react-toastify";
import { BASE_API_URL } from "@/app/static/apiConfig";

interface CsvUploadModalProps {
  show: boolean;
  onHide: () => void;
  onUploadSuccess?: () => void;
}

export default function CsvUploadModal({
  show,
  onHide,
  onUploadSuccess,
}: CsvUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState<{
    success: number;
    failed: number;
    errors: string[];
  } | null>(null);
  const [csvPreview, setCsvPreview] = useState<string[][] | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Validate file type
      if (!file.name.endsWith(".csv")) {
        toast.error("Please select a CSV file");
        return;
      }

      setSelectedFile(file);
      setUploadResults(null);

      // Read file and generate preview
      try {
        const text = await file.text();
        const lines = text.split('\n').filter(line => line.trim().length > 0);

        // Parse CSV lines (handle quoted fields)
        const parsedLines = lines.slice(0, 11).map(line => {
          const result: string[] = [];
          let current = '';
          let inQuotes = false;

          for (let i = 0; i < line.length; i++) {
            const char = line[i];

            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              result.push(current.trim());
              current = '';
            } else {
              current += char;
            }
          }

          result.push(current.trim());
          return result;
        });

        setCsvPreview(parsedLines);
      } catch (error) {
        console.error('Error reading CSV file:', error);
        toast.error('Failed to preview CSV file');
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Please select a file first");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await fetch(`${BASE_API_URL}/uploads/mark-expenses-paid`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("expenseTrackerToken")}`,
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setUploadResults({
          success: data.successCount || 0,
          failed: data.failedCount || 0,
          errors: data.errors || [],
        });

        toast.success(
          `Upload completed! ${data.successCount} expenses updated successfully.`
        );

        if (onUploadSuccess) {
          onUploadSuccess();
        }
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to upload CSV file");
      }
    } catch (error) {
      toast.error("An error occurred while uploading the file");
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadTemplate = () => {
    // Create CSV template
    const headers = [
      "Internal ID",
      "Payment Status",
      "Payment Reference",
      "Reason for Not Being Paid",
    ];
    const sampleRow = ["1", "Paid", "REF123456", ""];
    const sampleRow2 = ["2", "Not Paid", "", "Pending documentation"];

    const csvContent = [
      headers.join(","),
      sampleRow.join(","),
      sampleRow2.join(","),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "expense_payment_template.csv";
    a.click();
    window.URL.revokeObjectURL(url);

    toast.success("Template downloaded successfully");
  };

  const handleClose = () => {
    setSelectedFile(null);
    setUploadResults(null);
    setCsvPreview(null);
    onHide();
  };

  return (
    <Modal show={show} onHide={handleClose} centered size="lg">
      <Modal.Header closeButton className="border-0 pb-0">
        <Modal.Title className="h6">
          <FaFileUpload className="me-2 text-primary" />
          Upload CSV to Mark Expenses as Paid
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="pt-3">
        <Alert variant="info" className="small">
          <strong>CSV Format Requirements:</strong>
          <ul className="mb-0 mt-2">
            <li><strong>Column 1:</strong> Internal ID of the expense</li>
            <li><strong>Column 2:</strong> Payment Status (Paid or Not Paid)</li>
            <li><strong>Column 3:</strong> Payment Reference</li>
            <li><strong>Column 4:</strong> Reason for not being paid (if applicable)</li>
          </ul>
        </Alert>

        <div className="mb-3">
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={handleDownloadTemplate}
            className="w-100 mb-3"
          >
            <FaDownload className="me-2" />
            Download CSV Template
          </Button>
        </div>

        <Form>
          <Form.Group className="mb-3">
            <Form.Label className="small fw-semibold">
              Select CSV File
            </Form.Label>
            <Form.Control
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              size="sm"
            />
            {selectedFile && (
              <Form.Text className="text-muted">
                Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
              </Form.Text>
            )}
          </Form.Group>
        </Form>

        {csvPreview && csvPreview.length > 0 && (
          <div className="mb-3">
            <h6 className="small fw-semibold mb-2">File Preview (First 10 rows):</h6>
            <div className="border rounded" style={{ maxHeight: '300px', overflowY: 'auto' }}>
              <Table striped bordered hover size="sm" className="mb-0">
                <thead className="bg-light sticky-top">
                  <tr>
                    {csvPreview[0].map((header, index) => (
                      <th key={index} className="small">{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {csvPreview.slice(1, 11).map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {row.map((cell, cellIndex) => (
                        <td key={cellIndex} className="small">{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
            {csvPreview.length > 11 && (
              <Form.Text className="text-muted d-block mt-2">
                Showing 10 of {csvPreview.length - 1} data rows (excluding header)
              </Form.Text>
            )}
          </div>
        )}

        {uploadResults && (
          <Alert variant={uploadResults.failed > 0 ? "warning" : "success"} className="mt-3">
            <h6 className="small fw-semibold">Upload Results:</h6>
            <ul className="mb-0 small">
              <li className="text-success">Successfully updated: {uploadResults.success} expenses</li>
              <li className="text-danger">Failed: {uploadResults.failed} expenses</li>
            </ul>
            {uploadResults.errors.length > 0 && (
              <div className="mt-2">
                <strong className="small">Errors:</strong>
                <ul className="mb-0 small mt-1">
                  {uploadResults.errors.map((error, index) => (
                    <li key={index} className="text-danger">
                      {error}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Alert>
        )}
      </Modal.Body>
      <Modal.Footer className="border-0">
        <Button variant="secondary" size="sm" onClick={handleClose}>
          Close
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={handleUpload}
          disabled={!selectedFile || isUploading}
        >
          {isUploading ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              Uploading...
            </>
          ) : (
            <>
              <FaUpload className="me-1" /> Upload CSV
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
