"use client";

import dynamic from "next/dynamic";

// Import the component with SSR disabled since it uses browser APIs like localStorage
const ExpenseApprovalDetails = dynamic(() => import("./expenseId"), {
  ssr: false,
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
