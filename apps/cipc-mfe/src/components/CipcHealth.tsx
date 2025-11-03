import React from 'react';
import { Card, CardHeader, CardContent } from '@cipc/ui';

interface ComplianceMetric {
  label: string;
  value: string | number;
  status: 'good' | 'warning' | 'critical';
  description?: string;
}

export default function CipcHealth() {
  const complianceScore = 82;
  const metrics: ComplianceMetric[] = [
    {
      label: 'Company Registration',
      value: 'Active',
      status: 'good',
      description: 'Company is properly registered with CIPC',
    },
    {
      label: 'Director Information',
      value: 'Complete',
      status: 'good',
      description: 'All director details are up to date',
    },
    {
      label: 'Annual Returns',
      value: 'Overdue',
      status: 'critical',
      description: '2024 Annual Return filing is overdue',
    },
    {
      label: 'Financial Year End',
      value: 'Valid',
      status: 'good',
      description: 'Financial year end properly set',
    },
    {
      label: 'Tax Clearance',
      value: 'Valid',
      status: 'good',
      description: 'Tax clearance certificate is current',
    },
  ];

  const getStatusColor = (status: ComplianceMetric['status']) => {
    switch (status) {
      case 'good':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const criticalCount = metrics.filter(m => m.status === 'critical').length;
  const warningCount = metrics.filter(m => m.status === 'warning').length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-gray-900">CIPC Compliance Score</h3>
          <div className={`text-2xl font-bold ${getScoreColor(complianceScore)}`}>
            {complianceScore}%
          </div>
        </div>

        <div className="mt-2 flex items-center space-x-4 text-sm">
          <span className="text-gray-600">
            Last updated: {new Date().toLocaleDateString()}
          </span>
          {criticalCount > 0 && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
              {criticalCount} Critical
            </span>
          )}
          {warningCount > 0 && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              {warningCount} Warnings
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {metrics.map((metric, index) => (
            <div
              key={index}
              className={`p-4 border rounded-lg ${getStatusColor(metric.status)}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      metric.status === 'good' ? 'bg-green-500' :
                      metric.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                  />
                  <div>
                    <h4 className="text-sm font-medium">{metric.label}</h4>
                    <p className="text-sm opacity-75">{metric.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">{metric.value}</div>
                  <div className="text-xs opacity-75">
                    {metric.status === 'good' ? '✓ Compliant' :
                     metric.status === 'warning' ? '⚠ Review' : '✗ Action Required'}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Next Steps</h4>
          <div className="text-sm text-gray-600 space-y-1">
            {criticalCount > 0 && (
              <p>• File overdue Annual Return to improve compliance score</p>
            )}
            <p>• Keep financial records up to date</p>
            <p>• Monitor for upcoming filing deadlines</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
