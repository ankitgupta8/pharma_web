import React from 'react';
import { Link, useLocation } from 'react-router-dom';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

const navItems: NavItem[] = [
  { path: '/', label: 'Home', icon: '🏠' },
  { path: '/drugs', label: 'Drugs', icon: '💊' },
  { path: '/flashcards', label: 'Cards', icon: '🃏' },
  { path: '/quiz', label: 'Quiz', icon: '🧠' },
  { path: '/bookmarks', label: 'Saved', icon: '⭐' },
  { path: '/admin', label: 'Admin', icon: '⚙️' }
];

const BottomNavigation: React.FC = () => {
  const location = useLocation();

  return (
    <nav className="bottom-nav">
      {navItems.map((item) => (
        <Link
          key={item.path}
          to={item.path}
          className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
        >
          <div className="nav-icon">{item.icon}</div>
          <span className="nav-label">{item.label}</span>
        </Link>
      ))}
    </nav>
  );
};

export default BottomNavigation;