// src/components/LogViewer.js
import React, { useState, useMemo } from 'react';

const LogViewer = () => {
  const [logs, setLogs] = useState([]);
  const [selectNode, setSelectNode] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  const [filterText, setFilterText] = useState('');
  const [copySuccess, setCopySuccess] = useState('');

  // Handle file upload and parsing JSON or LOG
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) {
      console.error("No file selected");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target.result;
      try {
        let parsedLogs;
        if (file.name.endsWith('.json')) {
          console.log("Parsing JSON file");
          parsedLogs = JSON.parse(content);
        } else if (file.name.endsWith('.log')) {
          console.log("Parsing LOG file");
          parsedLogs = content
            .trim()
            .split('\n')
            .map((line, index) => {
              try {
                return JSON.parse(line);
              } catch (lineError) {
                console.error(`Error parsing line ${index + 1}:`, lineError);
                return null;
              }
            })
            .filter(log => log !== null);
        } else {
          throw new Error('Unsupported file type');
        }
        console.log("Parsed logs:", parsedLogs);
        setLogs(parsedLogs);
      } catch (error) {
        console.error("Error parsing file", error);
      }
    };
    reader.onerror = (error) => console.error("FileReader error:", error);
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
    const rowData = `Timestamp: ${log.Timestamp}, Level: ${log.Level}, Message: ${log.MessageTemplate}`;
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
        accept=".json .log"
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
              className={`border ${log.Level === "Error" ? "bg-red-100" : ""}`}
            >
              <td className="px-4 py-2">{log.Timestamp || 'N/A'}</td>
              <td className={`px-4 py-2 ${log.Level === "Error" ? "text-red-600" : ""}`}>
                {log.Level || 'N/A'}
              </td>
              <td className="px-4 py-2">{log.MessageTemplate || 'N/A'}</td>
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
              <h2 className="text-2xl font-bold text-red-600 mb-4">Log Details</h2>
              <p className="mt-2"><strong>Timestamp:</strong> {selectNode.Timestamp}</p>
              <p className="mt-2"><strong>Level:</strong> {selectNode.Level}</p>
              <p className="mt-2"><strong>Message:</strong> {selectNode.MessageTemplate}</p>
              {selectNode.Properties && (
                <div className="mt-4">
                  <h3 className="text-xl font-semibold">Properties:</h3>
                  <pre className="bg-gray-100 p-4 mt-2 overflow-x-auto rounded text-sm">
                    {JSON.stringify(selectNode.Properties, null, 2)}
                  </pre>
                </div>
              )}
              {selectNode.Exception && (
                <div className="mt-4">
                  <h3 className="text-xl font-semibold">Exception:</h3>
                  <pre className="bg-gray-100 p-4 mt-2 overflow-x-auto rounded text-sm">
                    {selectNode.Exception}
                  </pre>
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
