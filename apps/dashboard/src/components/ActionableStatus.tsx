import React from 'react';

export function ActionableStatus() {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Compliance Status</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Overall Status */}
        <div className="md:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-gray-700">Overall Compliance</span>
            <span className="px-3 py-1 text-sm font-medium bg-red-100 text-red-800 rounded-full">
              1 Critical Issue
            </span>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
                <div>
                  <p className="text-sm font-medium text-red-800">Annual Return Filing Overdue</p>
                  <p className="text-xs text-red-600">Due date: March 31, 2025</p>
                </div>
              </div>
              <button className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded hover:bg-red-700 transition-colors">
                File Now
              </button>
            </div>

            <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                <div>
                  <p className="text-sm font-medium text-green-800">Basic Compliance Requirements</p>
                  <p className="text-xs text-green-600">All requirements met</p>
                </div>
              </div>
              <span className="px-3 py-1 text-sm font-medium bg-green-100 text-green-800 rounded-full">
                ✓ Complete
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
                <div>
                  <p className="text-sm font-medium text-yellow-800">Tax Clearance Certificate</p>
                  <p className="text-xs text-yellow-600">Valid through December 2025</p>
                </div>
              </div>
              <span className="px-3 py-1 text-sm font-medium bg-yellow-100 text-yellow-800 rounded-full">
                Valid
              </span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>

          <div className="space-y-3">
            <button className="w-full px-4 py-3 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
              File Annual Return
            </button>

            <button className="w-full px-4 py-3 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors">
              Request Tax Clearance
            </button>

            <button className="w-full px-4 py-3 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
              Contact Advisor
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Next Deadline</h4>
            <div className="text-sm text-gray-600">
              <p className="font-medium">Annual Return</p>
              <p>March 31, 2025 (28 days)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
