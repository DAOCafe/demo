import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';

// Lazy load all pages for code-splitting
const DAOListPage = lazy(() => import('./pages/DAOListPage').then(m => ({ default: m.DAOListPage })));
const DAODetailPage = lazy(() => import('./pages/DAODetailPage').then(m => ({ default: m.DAODetailPage })));
const ProposalDetailPage = lazy(() => import('./pages/ProposalDetailPage').then(m => ({ default: m.ProposalDetailPage })));
const ProfilePage = lazy(() => import('./pages/ProfilePage').then(m => ({ default: m.ProfilePage })));
const CreateProposalPage = lazy(() => import('./pages/CreateProposalPage').then(m => ({ default: m.CreateProposalPage })));

// Loading fallback component
function PageLoader() {
  return (
    <div className="page-loader">
      <div className="loader-spinner"></div>
      <p>Loading...</p>
    </div>
  );
}

function App() {
  return (
    <Layout>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<DAOListPage />} />
          <Route path="/dao/:id" element={<DAODetailPage />} />
          <Route path="/dao/:id/create-proposal" element={<CreateProposalPage />} />
          <Route path="/proposal/:id" element={<ProposalDetailPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Routes>
      </Suspense>
    </Layout>
  );
}

export default App;

