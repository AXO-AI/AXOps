import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Overview from './pages/Overview';
import Commit from './pages/Commit';
import Merge from './pages/Merge';
import CiCd from './pages/CiCd';
import Security from './pages/Security';
import Meetings from './pages/Meetings';
import Notifications from './pages/Notifications';
import Team from './pages/Team';
import Support from './pages/Support';
import Settings from './pages/Settings';
import Pipelines from './pages/Pipelines';
import Policies from './pages/Policies';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/app" element={<Layout />}>
          <Route index element={<Overview />} />
          {/* New route names */}
          <Route path="dashboard" element={<Overview />} />
          <Route path="workbench" element={<Commit />} />
          <Route path="merge" element={<Merge />} />
          <Route path="deployments" element={<CiCd />} />
          <Route path="pipeline-studio" element={<Pipelines />} />
          <Route path="security" element={<Security />} />
          <Route path="governance" element={<Policies />} />
          <Route path="insights" element={<Meetings />} />
          <Route path="activity" element={<Notifications />} />
          <Route path="team" element={<Team />} />
          <Route path="support" element={<Support />} />
          <Route path="administration" element={<Settings />} />
          {/* Old route redirects */}
          <Route path="overview" element={<Navigate to="/app/dashboard" replace />} />
          <Route path="commit" element={<Navigate to="/app/workbench" replace />} />
          <Route path="cicd" element={<Navigate to="/app/deployments" replace />} />
          <Route path="pipelines" element={<Navigate to="/app/pipeline-studio" replace />} />
          <Route path="policies" element={<Navigate to="/app/governance" replace />} />
          <Route path="meetings" element={<Navigate to="/app/insights" replace />} />
          <Route path="notifications" element={<Navigate to="/app/activity" replace />} />
          <Route path="settings" element={<Navigate to="/app/administration" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
