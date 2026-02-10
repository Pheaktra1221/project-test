export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export const imagePreview = (raw) => {
  if (!raw) return '';
  try {
    const value = String(raw);
    if (value.startsWith('data:')) return value;

    if (/\.(jpg|jpeg|png|gif|webp)(\?|$)/i.test(value)) {
      return value.startsWith('http')
        ? value
        : `${API_BASE_URL}/${value.startsWith('/') ? value.slice(1) : value}`;
    }

    const driveFileMatch = value.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (driveFileMatch) {
      return `${API_BASE_URL}/upload/preview?url=${encodeURIComponent(value)}`;
    }

    const openMatch = value.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (openMatch) {
      return `${API_BASE_URL}/upload/preview?url=${encodeURIComponent(value)}`;
    }

    if (
      value.includes('webContentLink') ||
      value.includes('webViewLink') ||
      value.includes('uc?id=')
    ) {
      return `${API_BASE_URL}/upload/preview?url=${encodeURIComponent(value)}`;
    }

    const plainIdMatch = value.match(/^[a-zA-Z0-9_-]{10,}$/);
    if (plainIdMatch) {
      return `${API_BASE_URL}/upload/preview?url=${encodeURIComponent(plainIdMatch[0])}`;
    }

    if (value.startsWith('http')) return value;
    return value;
  } catch (e) {
    console.error('imagePreview error:', e);
    return raw;
  }
};

export const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('km-KH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export const formatTime = (time) => {
  if (!time) return '';
  // Check if it's ISO string
  if (time.includes('T') || time.includes('-')) {
    try {
      return new Date(time).toLocaleString('km-KH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return time;
    }
  }
  // Assume HH:mm
  const [hours, minutes] = time.split(':');
  return `${hours}:${minutes}`;
};
