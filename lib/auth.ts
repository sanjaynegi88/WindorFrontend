

export const logout = async () => {
  try {

    document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Strict';
    document.cookie = 'user-role=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Strict';

    window.location.href = process.env.NEXT_PUBLIC_LOGIN_URL || '/login';
  } catch (error) {
    console.error('Logout error:', error);
  }
};