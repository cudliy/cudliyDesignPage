import { useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  username: string;
  profile?: {
    firstName?: string;
    lastName?: string;
    avatar?: string;
  };
}

export const useUser = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = () => {
      try {
        // Try to get user from localStorage
        const storedUser = localStorage.getItem('user');
        const token = sessionStorage.getItem('token');
        
        if (storedUser && token) {
          const userData = JSON.parse(storedUser);
          setUser(userData);
        }
      } catch (error) {
        console.error('Error loading user:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const getUserName = (): string => {
    if (!user) return 'Creator';
    
    if (user.profile?.firstName) {
      return user.profile.firstName;
    }
    
    if (user.username) {
      return user.username;
    }
    
    if (user.email) {
      return user.email.split('@')[0];
    }
    
    return 'Creator';
  };

  const getFullName = (): string => {
    if (!user) return 'Creator';
    
    const firstName = user.profile?.firstName || '';
    const lastName = user.profile?.lastName || '';
    
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    }
    
    return getUserName();
  };

  return {
    user,
    loading,
    getUserName,
    getFullName,
    isLoggedIn: !!user
  };
};