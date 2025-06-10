
// Cookie-based branch management for reliable state persistence
const BRANCH_COOKIE_KEY = 'selected-branch';

export const setBranchCookie = (branchName: string) => {
  try {
    document.cookie = `${BRANCH_COOKIE_KEY}=${encodeURIComponent(branchName)}; path=/; max-age=${60 * 60 * 24 * 7}`;
    console.log('🍪 BRANCH COOKIE SET:', branchName);
  } catch (error) {
    console.error('Failed to set branch cookie:', error);
  }
};

export const getBranchCookie = (): string | null => {
  try {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [key, value] = cookie.trim().split('=');
      if (key === BRANCH_COOKIE_KEY) {
        const decodedValue = decodeURIComponent(value);
        console.log('🍪 BRANCH COOKIE READ:', decodedValue);
        return decodedValue;
      }
    }
    console.log('🍪 BRANCH COOKIE NOT FOUND');
    return null;
  } catch (error) {
    console.error('Failed to read branch cookie:', error);
    return null;
  }
};

export const clearBranchCookie = () => {
  try {
    document.cookie = `${BRANCH_COOKIE_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    console.log('🍪 BRANCH COOKIE CLEARED');
  } catch (error) {
    console.error('Failed to clear branch cookie:', error);
  }
};
