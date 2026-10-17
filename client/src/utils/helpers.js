// Format currency in INR
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0);
};

// Format date
export const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

// Format duration from minutes
export const formatDuration = (minutes) => {
  if (!minutes) return '0h 0m';
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

// Format hours
export const formatHours = (minutes) => {
  if (!minutes) return '0.00';
  return (minutes / 60).toFixed(2);
};

// Get status badge class
export const getStatusClass = (status) => {
  const map = {
    'Active': 'badge-active',
    'Completed': 'badge-completed',
    'In Progress': 'badge-sent',
    'Pending': 'badge-pending',
    'On Hold': 'badge-pending',
    'Draft': 'badge-draft',
    'Sent': 'badge-sent',
    'Paid': 'badge-paid',
    'Outstanding': 'badge-outstanding',
    'Cancelled': 'badge-outstanding',
  };
  return map[status] || 'badge-draft';
};

// Truncate text
export const truncate = (str, n = 50) => {
  if (!str) return '';
  return str.length > n ? str.substring(0, n) + '...' : str;
};

// Calculate budget percent
export const getBudgetColor = (percent) => {
  if (percent >= 100) return 'bg-red-500';
  if (percent >= 80) return 'bg-amber-500';
  if (percent >= 60) return 'bg-yellow-500';
  return 'bg-emerald-500';
};
