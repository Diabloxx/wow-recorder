/**
 * UI Switcher Component
 * 
 * This component allows you to easily switch between the old and new UI.
 * To use the modern UI, simply change the import in index.tsx:
 * 
 * OLD UI: import App from './App';
 * NEW UI: import App from './ModernApp';
 * 
 * Or use this component to toggle dynamically.
 */

import React, { useState } from 'react';
import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import { Palette, ArrowLeftRight } from 'lucide-react';
import { Button } from './components/Button/Button';

// Import both UIs
import OldApp from './App';
import ModernApp from './ModernApp';

const UISwitcher: React.FC = () => {
  const [useModernUI, setUseModernUI] = useState(true);

  const toggleUI = () => {
    setUseModernUI(!useModernUI);
  };

  return (
    <div className="relative">
      {/* UI Toggle Button - Fixed position */}
      <div className="fixed top-4 right-4 z-50">
        <Button
          onClick={toggleUI}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <Palette className="w-4 h-4" />
          <ArrowLeftRight className="w-4 h-4" />
          <span className="text-sm font-medium">
            {useModernUI ? 'Switch to Classic' : 'Switch to Modern'}
          </span>
        </Button>
      </div>

      {/* Render the selected UI */}
      {useModernUI ? <ModernApp /> : <OldApp />}
    </div>
  );
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<UISwitcher />} />
      </Routes>
    </Router>
  );
}

export default App;
