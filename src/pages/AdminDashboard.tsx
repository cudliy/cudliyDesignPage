import { useState, useEffect } from 'react';

interface ContentViolation {
  _id: string;
  userId: string;
  violationType: string;
  content: string;
  detectedTerms: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  action: string;
  isResolved: boolean;
  createdAt: string;
  ipAddress?: string;
}

interface ViolationStats {
  total: number;
  bySeverity: {
    low?: number;
    medium?: number;
    high?: number;
    critical?: number;
  };
}

interface BlockedRequests {
  blockedRequestIds: string[];
  suspiciousRunnerIds: string[];
  blockedEndpoints: string[];
  summary: {
    totalBlockedRequests: number;
    totalSuspiciousRunners: number;
    totalBlockedEndpoints: number;
  };
}

export default function AdminDashboard() {
  const [violations, setViolations] = useState<ContentViolation[]>([]);
  const [stats, setStats] = useState<ViolationStats>({ total: 0, bySeverity: {} });
  const [blockedRequests, setBlockedRequests] = useState<BlockedRequests | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSeverity, setSelectedSeverity] = useState<string>('');
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState<'violations' | 'blocked'>('violations');

  useEffect(() => {
    fetchViolations();
    fetchBlockedRequests();
  }, [page, selectedSeverity]);

  const fetchViolations = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20'
      });
      
      if (selectedSeverity) {
        params.append('severity', selectedSeverity);
      }

      const response = await fetch(`/api/admin/violations?${params}`);
      const data = await response.json();

      if (data.success) {
        setViolations(data.data.violations);
        setStats(data.data.stats);
      }
    } catch (error) {
      console.error('Error fetching violations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBlockedRequests = async () => {
    try {
      const response = await fetch('/api/admin/blocked-requests');
      const data = await response.json();

      if (data.success) {
        setBlockedRequests(data.data);
      }
    } catch (error) {
      console.error('Error fetching blocked requests:', error);
    }
  };

  const resolveViolation = async (violationId: string) => {
    try {
      const response = await fetch(`/api/admin/violations/${violationId}/resolve`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          resolvedBy: 'admin',
          notes: 'Resolved via admin dashboard'
        })
      });

      if (response.ok) {
        fetchViolations(); // Refresh the list
      }
    } catch (error) {
      console.error('Error resolving violation:', error);
    }
  };

  const blockUser = async (userId: string) => {
    if (!confirm(`Are you sure you want to block user ${userId}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}/block`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'block',
          reason: 'Blocked via admin dashboard',
          blockedBy: 'admin'
        })
      });

      if (response.ok) {
        alert('User blocked successfully');
        fetchViolations(); // Refresh the list
      }
    } catch (error) {
      console.error('Error blocking user:', error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading violations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Content Moderation Dashboard</h1>
          <p className="text-gray-600 mt-2">Monitor and manage content policy violations</p>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('violations')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'violations'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Content Violations
              </button>
              <button
                onClick={() => setActiveTab('blocked')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'blocked'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Blocked Requests
              </button>
            </nav>
          </div>
        </div>

        {activeTab === 'violations' && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">Total Violations</h3>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">Critical</h3>
            <p className="text-2xl font-bold text-red-600">{stats.bySeverity.critical || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">High</h3>
            <p className="text-2xl font-bold text-orange-600">{stats.bySeverity.high || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">Medium</h3>
            <p className="text-2xl font-bold text-yellow-600">{stats.bySeverity.medium || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">Low</h3>
            <p className="text-2xl font-bold text-green-600">{stats.bySeverity.low || 0}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex flex-wrap gap-4">
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <button
              onClick={() => {
                setSelectedSeverity('');
                setPage(1);
                fetchViolations();
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Reset Filters
            </button>
          </div>
        </div>

        {/* Violations Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Content
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Severity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Detected Terms
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {violations.map((violation) => (
                  <tr key={violation._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {violation.userId.substring(0, 12)}...
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                      {violation.content}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(violation.severity)}`}>
                        {violation.severity}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {violation.detectedTerms.slice(0, 3).join(', ')}
                      {violation.detectedTerms.length > 3 && '...'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(violation.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        violation.isResolved ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'
                      }`}>
                        {violation.isResolved ? 'Resolved' : 'Active'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      {!violation.isResolved && (
                        <>
                          <button
                            onClick={() => resolveViolation(violation._id)}
                            className="text-green-600 hover:text-green-900"
                          >
                            Resolve
                          </button>
                          <button
                            onClick={() => blockUser(violation.userId)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Block User
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="mt-6 flex justify-center space-x-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-gray-700">Page {page}</span>
          <button
            onClick={() => setPage(page + 1)}
            className="px-4 py-2 border border-gray-300 rounded-md"
          >
            Next
          </button>
        </div>
          </>
        )}

        {activeTab === 'blocked' && blockedRequests && (
          <>
            {/* Blocked Requests Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-500">Blocked Request IDs</h3>
                <p className="text-2xl font-bold text-red-600">{blockedRequests.summary.totalBlockedRequests}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-500">Suspicious Runners</h3>
                <p className="text-2xl font-bold text-orange-600">{blockedRequests.summary.totalSuspiciousRunners}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-500">Blocked Endpoints</h3>
                <p className="text-2xl font-bold text-yellow-600">{blockedRequests.summary.totalBlockedEndpoints}</p>
              </div>
            </div>

            {/* Blocked Request IDs */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Blocked Request IDs</h3>
              <div className="space-y-2">
                {blockedRequests.blockedRequestIds.length > 0 ? (
                  blockedRequests.blockedRequestIds.map((requestId, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-md">
                      <code className="text-sm font-mono text-red-800">{requestId}</code>
                      <span className="text-xs text-red-600">
                        {requestId === 'ab6bde80-4439-468a-a41f-1dd212b3169f' ? 'Reported Violation' : 'Blocked'}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">No blocked request IDs</p>
                )}
              </div>
            </div>

            {/* Suspicious Runner IDs */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Suspicious Runner IDs</h3>
              <div className="space-y-2">
                {blockedRequests.suspiciousRunnerIds.length > 0 ? (
                  blockedRequests.suspiciousRunnerIds.map((runnerId, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-orange-50 rounded-md">
                      <code className="text-sm font-mono text-orange-800">{runnerId}</code>
                      <span className="text-xs text-orange-600">
                        {runnerId === '0390daf3-b546-4738-b7e7-f3f4cbfdd919' ? 'Reported Violation' : 'Flagged'}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">No suspicious runner IDs</p>
                )}
              </div>
            </div>

            {/* Blocked Endpoints */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Blocked Endpoints</h3>
              <div className="space-y-2">
                {blockedRequests.blockedEndpoints.length > 0 ? (
                  blockedRequests.blockedEndpoints.map((endpoint, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-yellow-50 rounded-md">
                      <code className="text-sm font-mono text-yellow-800">{endpoint}</code>
                      <span className="text-xs text-yellow-600">
                        {endpoint.includes('hdr-style') ? 'Reported Violation' : 'Blocked'}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">No blocked endpoints</p>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => {
                    const requestId = prompt('Enter Request ID to block:');
                    if (requestId) {
                      fetch('/api/admin/block-request', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          requestId,
                          reason: 'Manually blocked via admin dashboard',
                          reportedBy: 'admin'
                        })
                      }).then(() => fetchBlockedRequests());
                    }
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Block Request ID
                </button>
                <button
                  onClick={() => {
                    const runnerId = prompt('Enter Runner ID to flag:');
                    if (runnerId) {
                      fetch('/api/admin/flag-runner', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          runnerId,
                          reason: 'Manually flagged via admin dashboard',
                          reportedBy: 'admin'
                        })
                      }).then(() => fetchBlockedRequests());
                    }
                  }}
                  className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
                >
                  Flag Runner ID
                </button>
                <button
                  onClick={() => {
                    const endpoint = prompt('Enter Endpoint to block:');
                    if (endpoint) {
                      fetch('/api/admin/block-endpoint', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          endpoint,
                          reason: 'Manually blocked via admin dashboard',
                          reportedBy: 'admin'
                        })
                      }).then(() => fetchBlockedRequests());
                    }
                  }}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
                >
                  Block Endpoint
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}