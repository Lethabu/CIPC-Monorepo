import React, { useState } from 'react';
import { Card, CardHeader, CardContent } from '@cipc/ui';

interface Filing {
  id: string;
  type: string;
  filingDate: string;
  status: 'Filed' | 'Approved' | 'Rejected' | 'Pending';
  reference: string;
  downloadUrl?: string;
}

export default function FilingHistory() {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filings: Filing[] = [
    {
      id: '1',
      type: 'Annual Return 2023',
      filingDate: '2024-01-15',
      status: 'Approved',
      reference: 'CIPC-AR-2023-001',
      downloadUrl: '#'
    },
    {
      id: '2',
      type: 'Director Change',
      filingDate: '2023-11-20',
      status: 'Approved',
      reference: 'CIPC-DC-2023-045',
      downloadUrl: '#'
    },
    {
      id: '3',
      type: 'Address Change',
      filingDate: '2023-08-10',
      status: 'Approved',
      reference: 'CIPC-AC-2023-012',
      downloadUrl: '#'
    },
    {
      id: '4',
      type: 'Annual Return 2022',
      filingDate: '2023-02-28',
      status: 'Approved',
      reference: 'CIPC-AR-2022-089',
      downloadUrl: '#'
    },
    {
      id: '5',
      type: 'Name Reservation',
      filingDate: '2022-12-15',
      status: 'Approved',
      reference: 'CIPC-NR-2022-156',
      downloadUrl: '#'
    },
  ];

  const totalPages = Math.ceil(filings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedFilings = filings.slice(startIndex, startIndex + itemsPerPage);

  const getStatusColor = (status: Filing['status']) => {
    switch (status) {
      case 'Approved':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'Filed':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'Rejected':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'Pending':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-gray-900">CIPC Filing History</h3>
          <span className="text-sm text-gray-600">
            {filings.length} total filings
          </span>
        </div>
      </CardHeader>

      <CardContent>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Filing Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date Filed
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reference
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedFilings.map((filing) => (
                <tr key={filing.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {filing.type}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(filing.filingDate).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(filing.status)}`}>
                      {filing.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500 font-mono">
                      {filing.reference}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {filing.downloadUrl ? (
                      <a
                        href={filing.downloadUrl}
                        className="text-blue-600 hover:text-blue-900 flex items-center"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Download
                      </a>
                    ) : (
                      <span className="text-gray-400">Not available</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 bg-white border-t border-gray-200">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                  <span className="font-medium">{Math.min(startIndex + itemsPerPage, filings.length)}</span> of{' '}
                  <span className="font-medium">{filings.length}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`relative inline-flex items-center px-4 py-2 text-sm font-medium ${
                        page === currentPage
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      } border`}
                    >
                      {page}
                    </button>
                  ))}
                </nav>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
