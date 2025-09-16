'use client';

import dynamic from 'next/dynamic';

// Import the component with SSR disabled since it uses browser APIs like localStorage
const ExpenseApprovalDetails = dynamic(
  () => import('./expenseId'),
  { 
    ssr: false,
    loading: () => <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '300px' }}>
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>
  }
);

interface PageProps {
  params: {
    expenseId: string;
  };
  searchParams: { [key: string]: string | string[] | undefined };
}

export default function ExpenseApprovalPage({ params, searchParams }: PageProps) {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="h3 mb-4">Expense Approval Details</h1>
      <ExpenseApprovalDetails params={params} searchParams={searchParams} />
    </div>
  );
}