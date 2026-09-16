import React, { createContext, useContext, useState, useEffect } from 'react';

const MockAuthContext = createContext();

export function MockAuthProvider({ children }) {
  // Initialize with 'citizen' or last chosen role
  const [role, setRole] = useState(() => {
    return localStorage.getItem('civicai_demo_role') || 'citizen';
  });

  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('civicai_demo_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return {
      name: 'Rohan Sharma',
      email: 'rohan.sharma@example.com',
      ward: 'Ward 14 (Central)',
      phone: '+91 98765 43210',
      avatarInitials: 'RS'
    };
  });

  const switchRole = (newRole) => {
    setRole(newRole);
    localStorage.setItem('civicai_demo_role', newRole);
    if (newRole === 'admin') {
      setUser({
        name: 'Dr. Neha Kapoor (IAS)',
        email: 'commissioner@metro.gov.in',
        roleTitle: 'Municipal Commissioner & Chief Governance Officer',
        ward: 'Central Command Headquarters',
        phone: '+91 98111 22334',
        avatarInitials: 'NK'
      });
    } else {
      setUser({
        name: 'Rohan Sharma',
        email: 'rohan.sharma@example.com',
        roleTitle: 'Verified Resident (Ward 14)',
        ward: 'Ward 14 (Central)',
        phone: '+91 98765 43210',
        avatarInitials: 'RS'
      });
    }
  };

  const login = (email, password, selectedRole = 'citizen') => {
    switchRole(selectedRole);
  };

  const logout = () => {
    // Reset to default citizen
    switchRole('citizen');
  };

  return (
    <MockAuthContext.Provider value={{ user, role, switchRole, login, logout }}>
      {children}
    </MockAuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(MockAuthContext);
  if (!context) {
    throw new Error('useAuth must be used within a MockAuthProvider');
  }
  return context;
}
