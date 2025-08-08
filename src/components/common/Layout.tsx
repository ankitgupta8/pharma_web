import React from 'react';
import { useApp, useAppActions } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import BottomNavigation from './BottomNavigation';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  showHeader?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  title = 'Drug Deck', 
  showHeader = true 
}) => {
  const { state } = useApp();
  const { toggleTheme } = useAppActions();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (state.isLoading) {
    return (
      <div className="app">
        <div className="loading">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="app">
        <div className="page">
          <div className="error">
            <h3>Error</h3>
            <p>{state.error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      {showHeader && (
        <header className="header">
          <h1 className="header-title">{title}</h1>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className="btn btn-icon"
              onClick={toggleTheme}
              title="Toggle theme"
              style={{
                background: 'rgba(255,255,255,0.2)',
                color: 'white',
                border: 'none'
              }}
            >
              {state.theme === 'light' ? '🌙' : '☀️'}
            </button>
            <button
              className="btn btn-icon"
              onClick={handleSignOut}
              title="Sign out"
              style={{
                background: 'rgba(255,255,255,0.2)',
                color: 'white',
                border: 'none'
              }}
            >
              🚪
            </button>
          </div>
        </header>
      )}
      
      <main className="main-content">
        {children}
      </main>
      
      <BottomNavigation />
    </div>
  );
};

export default Layout;