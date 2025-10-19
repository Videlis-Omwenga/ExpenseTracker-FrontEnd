"use client";

import { use } from "react";
import dynamic from "next/dynamic";

// Import the component with SSR disabled since it uses browser APIs like localStorage
const ExpenseApprovalDetails = dynamic(() => import("./expenseId"), {
  ssr: false,
});

interface PageProps {
  params: Promise<{
    expenseId: string;
  }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default function ExpenseApprovalPage({
  params,
  searchParams,
}: PageProps) {
  const resolvedParams = use(params);
  const resolvedSearchParams = use(searchParams);
  return <ExpenseApprovalDetails params={resolvedParams} searchParams={resolvedSearchParams} />;
}
