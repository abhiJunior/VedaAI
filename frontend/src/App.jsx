import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import store from './app/store';

import AssignmentsPage from './pages/AssignmentsPage';
import CreateAssignmentPage from './pages/CreateAssignmentPage';
import OutputPage from './pages/OutputPage';

function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              fontFamily: 'Inter, sans-serif',
              fontSize: '13px',
              fontWeight: 500,
              borderRadius: '12px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
            },
            success: {
              iconTheme: { primary: '#10b981', secondary: '#fff' },
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: '#fff' },
            },
          }}
        />
        <Routes>
          {/* Redirect root to assignments */}
          <Route path="/" element={<Navigate to="/assignments" replace />} />

          {/* Main pages */}
          <Route path="/assignments" element={<AssignmentsPage />} />
          <Route path="/assignments/create" element={<CreateAssignmentPage />} />
          <Route path="/assignments/:id" element={<OutputPage />} />

          {/* Catch-all stub pages */}
          <Route path="/groups" element={<PlaceholderPage title="My Groups" />} />
          <Route path="/toolkit" element={<PlaceholderPage title="AI Teacher's Toolkit" />} />
          <Route path="/library" element={<PlaceholderPage title="My Library" />} />
          <Route path="/settings" element={<PlaceholderPage title="Settings" />} />

          {/* 404 */}
          <Route path="*" element={<Navigate to="/assignments" replace />} />
        </Routes>
      </BrowserRouter>
    </Provider>
  );
}

function PlaceholderPage({ title }) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#F0F2F5]">
      <div className="text-center">
        <div className="text-5xl mb-4">🚧</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">{title}</h1>
        <p className="text-gray-500 text-sm">This section is coming soon.</p>
      </div>
    </div>
  );
}

export default App;
