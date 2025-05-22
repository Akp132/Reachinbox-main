'use client';

import { useEffect, useState } from 'react';

interface Email {
  id: string;
  subject: string;
  from: string;
  to: string;
  date: string;
  folder: string;
  account: string;
  text: string;
  labels: {
    ai: string;
  };
}

const ITEMS_PER_PAGE = 10;

export default function EmailsPage() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [query, setQuery] = useState('');
  const [account, setAccount] = useState('');
  const [aiLabelFilter, setAiLabelFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);

  const fetchEmails = async () => {
    const url = new URL('http://localhost:5070/emails');
    url.searchParams.append('q', query || '*');
    if (account) url.searchParams.append('account', account);

    const res = await fetch(url.toString());
    const data = await res.json();
    const sorted = [...data].sort((a, b) =>
      sortOrder === 'asc'
        ? new Date(a.date).getTime() - new Date(b.date).getTime()
        : new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    setEmails(sorted);
    setCurrentPage(1);
  };

  useEffect(() => {
    fetchEmails();
  }, []);

  const handleSearch = () => {
    fetchEmails();
  };

  const handleToggleSort = () => {
    const newOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    setSortOrder(newOrder);
    const sorted = [...emails].sort((a, b) =>
      newOrder === 'asc'
        ? new Date(a.date).getTime() - new Date(b.date).getTime()
        : new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    setEmails(sorted);
  };

  const filteredEmails = aiLabelFilter
    ? emails.filter((email) => email.labels?.ai === aiLabelFilter)
    : emails;

  const paginatedEmails = filteredEmails.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const totalPages = Math.ceil(filteredEmails.length / ITEMS_PER_PAGE);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4 text-white">📬 Inbox</h1>

      <div className="flex flex-wrap gap-2 mb-4">
        <input
          type="text"
          placeholder="Search..."
          className="px-3 py-2 border rounded bg-gray-800 text-white"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <input
          type="text"
          placeholder="Account"
          className="px-3 py-2 border rounded bg-gray-800 text-white"
          value={account}
          onChange={(e) => setAccount(e.target.value)}
        />
        <select
          value={aiLabelFilter}
          onChange={(e) => setAiLabelFilter(e.target.value)}
          className="px-3 py-2 border rounded bg-gray-800 text-white"
        >
          <option value="">All AI Labels</option>
          <option value="Interested">Interested</option>
          <option value="Meeting Booked">Meeting Booked</option>
          <option value="Not Interested">Not Interested</option>
          <option value="Spam">Spam</option>
          <option value="Out of Office">Out of Office</option>
          <option value="Unlabelled">Unlabelled</option>
        </select>
        <button
          onClick={handleSearch}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Search
        </button>
        <button
          onClick={handleToggleSort}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          Sort: {sortOrder === 'asc' ? 'Oldest' : 'Newest'}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {paginatedEmails.map((email) => (
          <div
            key={email.id}
            onClick={() => setSelectedEmail(email)}
            className="bg-gray-800 text-white p-4 rounded-lg shadow hover:shadow-lg cursor-pointer transition"
          >
            <p className="font-semibold text-lg mb-2">{email.subject}</p>
            <p><strong>From:</strong> {email.from}</p>
            <p><strong>To:</strong> {email.to}</p>
            <p><strong>Date:</strong> {new Date(email.date).toLocaleString()}</p>
            <p><strong>AI Label:</strong> {email.labels?.ai || 'Unlabelled'}</p>
          </div>
        ))}
      </div>

      <div className="flex justify-center items-center gap-4 mt-6 text-white">
        <button
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className="px-4 py-2 bg-gray-700 rounded disabled:opacity-50"
        >
          Previous
        </button>
        <span>
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="px-4 py-2 bg-gray-700 rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>

      {selectedEmail && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-60 z-40" onClick={() => setSelectedEmail(null)} />
          <div className="fixed z-50 bg-white dark:bg-gray-900 text-black dark:text-white p-6 rounded-lg shadow-xl top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl">
            <h2 className="text-2xl font-bold mb-4">Email Preview</h2>
            <p><strong>Subject:</strong> {selectedEmail.subject}</p>
            <p><strong>From:</strong> {selectedEmail.from}</p>
            <p><strong>To:</strong> {selectedEmail.to}</p>
            <p><strong>Date:</strong> {new Date(selectedEmail.date).toLocaleString()}</p>
            <p><strong>Folder:</strong> {selectedEmail.folder}</p>
            <p><strong>Account:</strong> {selectedEmail.account}</p>
            <p><strong>AI Label:</strong> {selectedEmail.labels?.ai}</p>
            <hr className="my-4" />
            <pre className="whitespace-pre-wrap">{selectedEmail.text}</pre>
            <button
              onClick={() => setSelectedEmail(null)}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Close
            </button>
          </div>
        </>
      )}
    </div>
  );
}
