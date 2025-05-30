// Navigation utility for handling base paths in development and production
export const navigateTo = (path: string) => {
  const basePath = process.env.NODE_ENV === 'production' ? '/jga-minigames' : '';
  const fullPath = basePath + path;
  window.location.href = fullPath;
};

// Helper to get the correct path for links
export const getPath = (path: string) => {
  const basePath = process.env.NODE_ENV === 'production' ? '/jga-minigames' : '';
  return basePath + path;
}; 