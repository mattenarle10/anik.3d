// Admin authentication utility functions
export const isAdminLoggedIn = (): boolean => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('isAdminLoggedIn') === 'true';
  };
  
  export const getAdminId = (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('adminId');
  };
  
  export const logoutAdmin = (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('adminId');
    localStorage.removeItem('isAdminLoggedIn');
  };