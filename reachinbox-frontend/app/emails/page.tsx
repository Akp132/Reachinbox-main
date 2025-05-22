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
  const [suggestedReply, setSuggestedReply] = useState<string>('');
  const [loadingReply, setLoadingReply] = useState(false);

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
    setSortOrder('desc');
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

  const fetchSuggestedReply = async (text: string) => {
    setLoadingReply(true);
    setSuggestedReply('');
    try {
      const res = await fetch('http://localhost:5070/suggest-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: text }),
      });
      const data = await res.json();
      setSuggestedReply(data.reply || 'No reply generated.');
    } catch (err) {
      setSuggestedReply('❌ Failed to fetch reply.');
    } finally {
      setLoadingReply(false);
    }
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
    <div style={{ padding: '20px' }}>
      <h1>📬 Inbox</h1>

      <div style={{ marginBottom: '16px' }}>
        <input
          type="text"
          placeholder="Search..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <input
          type="text"
          placeholder="Account"
          value={account}
          onChange={(e) => setAccount(e.target.value)}
        />
        <select
          value={aiLabelFilter}
          onChange={(e) => setAiLabelFilter(e.target.value)}
        >
          <option value="">All AI Labels</option>
          <option value="Interested">Interested</option>
          <option value="Meeting Booked">Meeting Booked</option>
          <option value="Not Interested">Not Interested</option>
          <option value="Spam">Spam</option>
          <option value="Out of Office">Out of Office</option>
          <option value="Unlabelled">Unlabelled</option>
        </select>
        <button onClick={handleSearch}>Search</button>
        <button onClick={handleToggleSort}>
          Sort: {sortOrder === 'asc' ? 'Oldest' : 'Newest'}
        </button>
        <button onClick={fetchEmails}>🔁 Refresh Inbox</button>
      </div>

      {paginatedEmails.map((email) => (
        <div
          key={email.id}
          className="email-card"
          onClick={() => {
            setSelectedEmail(email);
            setSuggestedReply('');
          }}
          style={{ cursor: 'pointer' }}
        >
          <p><strong>Subject:</strong> {email.subject}</p>
          <p><strong>From:</strong> {email.from}</p>
          <p><strong>To:</strong> {email.to}</p>
          <p><strong>Date:</strong> {new Date(email.date).toLocaleString()}</p>
          <p><strong>AI Label:</strong> {email.labels?.ai || 'Unlabelled'}</p>
        </div>
      ))}

      <div style={{ marginTop: '20px' }}>
        <button
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
        >
          Previous
        </button>
        <span style={{ margin: '0 12px' }}>
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
        >
          Next
        </button>
      </div>

      {selectedEmail && (
        <>
          <div className="modal-overlay" onClick={() => setSelectedEmail(null)} />
          <div className="modal">
            <h2>Email Preview</h2>
            <p><strong>Subject:</strong> {selectedEmail.subject}</p>
            <p><strong>From:</strong> {selectedEmail.from}</p>
            <p><strong>To:</strong> {selectedEmail.to}</p>
            <p><strong>Date:</strong> {new Date(selectedEmail.date).toLocaleString()}</p>
            <p><strong>Folder:</strong> {selectedEmail.folder}</p>
            <p><strong>Account:</strong> {selectedEmail.account}</p>
            <p><strong>AI Label:</strong> {selectedEmail.labels?.ai}</p>
            <hr />
            <pre style={{ whiteSpace: 'pre-wrap' }}>{selectedEmail.text}</pre>
            <button
              onClick={() => fetchSuggestedReply(selectedEmail.text)}
              style={{ marginTop: '12px' }}
              disabled={loadingReply}
            >
              {loadingReply ? 'Generating Reply...' : 'Suggest AI Reply'}
            </button>

            {suggestedReply && (
              <>
                <h3>Suggested Reply:</h3>
                <div style={{ background: '#2a2a2a',color: '#f1f1f1', padding: '10px', borderRadius: '6px', marginTop: '10px',fontFamily: 'monospace' }}>
                  <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{suggestedReply}</pre>
                </div>
              </>
            )}

            <button onClick={() => setSelectedEmail(null)} style={{ marginTop: '12px' }}>Close</button>
          </div>
        </>
      )}
    </div>
  );
}
