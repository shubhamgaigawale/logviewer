// src/components/LogViewer.js
import React, { useState, useMemo } from 'react';

const LogViewer = () => {
  const [logs, setLogs] = useState([]);
  const [selectNode, setSelectNode] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  const [filterText, setFilterText] = useState('');
  const [copySuccess, setCopySuccess] = useState('');

  // Handle file upload and parsing JSON
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target.result;
      try {
        const parsedLogs = content
          .trim()
          .split('\n')
          .map((line) => JSON.parse(line));
        setLogs(parsedLogs);
      } catch (error) {
        console.error("Error parsing JSON", error);
      }
    };
    reader.readAsText(file);
  };

  // Open error details dialog
  const openErrorDetails = (log) => {
    setSelectNode(log);
  };

  // Sorting function
  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  // Function to copy text to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopySuccess('Copied!');
      setTimeout(() => setCopySuccess(''), 2000);
    }, (err) => {
      console.error('Could not copy text: ', err);
    });
  };

  // Function to copy row data
  const copyRowData = (log) => {
    const rowData = `Timestamp: ${log.instant?.epochSecond}, Level: ${log.level}, Thread: ${log.thread}, Message: ${log.message}`;
    copyToClipboard(rowData);
  };

  // Filtered and sorted logs
  const filteredAndSortedLogs = useMemo(() => {
    let filteredLogs = logs.filter(log => 
      Object.values(log).some(value => 
        String(value).toLowerCase().includes(filterText.toLowerCase())
      )
    );

    if (sortConfig.key) {
      filteredLogs.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return filteredLogs;
  }, [logs, filterText, sortConfig]);

  return (
    <div className="container mx-auto mt-5 p-5">
      <h1 className="text-2xl font-bold mb-5">Log Viewer</h1>
      <input
        type="file"
        accept=".json"
        onChange={handleFileUpload}
        className="mb-5 p-2 border"
      />
      
      <input
        type="text"
        placeholder="Filter logs..."
        value={filterText}
        onChange={(e) => setFilterText(e.target.value)}
        className="mb-5 p-2 border w-full"
      />
      
      {/* Log Table */}
      <table className="min-w-full table-auto">
        <thead className="bg-gray-200">
          <tr>
            <th className="px-4 py-2 cursor-pointer" onClick={() => requestSort('instant')}>
              Timestamp {sortConfig.key === 'instant' && (sortConfig.direction === 'ascending' ? '▲' : '▼')}
            </th>
            <th className="px-4 py-2 cursor-pointer" onClick={() => requestSort('level')}>
              Level {sortConfig.key === 'level' && (sortConfig.direction === 'ascending' ? '▲' : '▼')}
            </th>
            <th className="px-4 py-2 cursor-pointer" onClick={() => requestSort('thread')}>
              Thread {sortConfig.key === 'thread' && (sortConfig.direction === 'ascending' ? '▲' : '▼')}
            </th>
            <th className="px-4 py-2">Message</th>
            <th className="px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredAndSortedLogs.map((log, index) => (
            <tr
              key={index}
              className={`border ${log.level === "ERROR" ? "bg-red-100" : ""}`}
            >
              <td className="px-4 py-2">{log.instant?.epochSecond}</td>
              <td className={`px-4 py-2 ${log.level === "ERROR" ? "text-red-600" : ""}`}>
                {log.level}
              </td>
              <td className="px-4 py-2">{log.thread}</td>
              <td className="px-4 py-2">{log.message}</td>
              <td className="px-4 py-2">
                <button
                  onClick={() => openErrorDetails(log)}
                  className="px-2 py-1 bg-blue-500 text-white rounded mr-2"
                >
                  Details
                </button>
                <button
                  onClick={() => copyRowData(log)}
                  className="px-2 py-1 bg-green-500 text-white rounded"
                >
                  Copy
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Error Details Modal */}
      {selectNode && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 p-4 overflow-y-auto">
          <div className="bg-white rounded shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto relative">
            <button
              onClick={() => setSelectNode(null)}
              className="absolute top-4 right-4 text-gray-600 hover:text-gray-800"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="p-6">
              <h2 className="text-2xl font-bold text-red-600 mb-4">Error Details</h2>
              <p className="mt-2"><strong>Timestamp:</strong> {selectNode.instant?.epochSecond}</p>
              <p className="mt-2"><strong>Message:</strong> {selectNode.message}</p>
              <p className="mt-2"><strong>Thread:</strong> {selectNode.thread}</p>
              <p className="mt-2"><strong>Logger:</strong> {selectNode.loggerName}</p>
              <p className="mt-2"><strong>Thrown:</strong> {selectNode.thrown?.message || 'None'}</p>
              
              {selectNode.thrown?.extendedStackTrace && (
                <div className="mt-4">
                  <h3 className="text-xl font-semibold">Stack Trace:</h3>
                  <div className="relative">
                    <pre className="bg-gray-100 p-4 mt-2 overflow-x-auto rounded text-sm">
                      {selectNode.thrown.extendedStackTrace.map((trace, index) => (
                        <div key={index} className="mb-1">
                          {`${trace.class}.${trace.method}(${trace.file}:${trace.line})`}
                        </div>
                      ))}
                    </pre>
                    <button
                      onClick={() => copyToClipboard(selectNode.thrown.extendedStackTrace.map(trace => 
                        `${trace.class}.${trace.method}(${trace.file}:${trace.line})`
                      ).join('\n'))}
                      className="absolute top-2 right-2 px-2 py-1 bg-blue-500 text-white rounded"
                    >
                      Copy Stack Trace
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {copySuccess && (
        <div className="fixed bottom-5 right-5 bg-green-500 text-white px-4 py-2 rounded">
          {copySuccess}
        </div>
      )}
    </div>
  );
};

export default LogViewer;
