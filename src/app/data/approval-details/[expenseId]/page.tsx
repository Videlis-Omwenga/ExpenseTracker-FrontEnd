"use client";

import dynamic from "next/dynamic";

// Import the component with SSR disabled since it uses browser APIs like localStorage
const ExpenseApprovalDetails = dynamic(() => import("./expenseId"), {
  ssr: false,
  loading: () => (
    <div
      className="d-flex justify-content-center align-items-center"
      style={{ minHeight: "300px" }}
    >
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>
  ),
});

interface PageProps {
  params: {
    expenseId: string;
  };
  searchParams: { [key: string]: string | string[] | undefined };
}

export default function ExpenseApprovalPage({
  params,
  searchParams,
}: PageProps) {
  return <ExpenseApprovalDetails params={params} searchParams={searchParams} />;
}
