import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import '../styles/prism-theme.css';
import { WorkspaceProvider } from './context/WorkspaceContext';
import { SessionCallProvider } from './context/SessionCallContext';

export default function App() {
  return (
    <SessionCallProvider>
      <WorkspaceProvider>
        <RouterProvider router={router} />
      </WorkspaceProvider>
    </SessionCallProvider>
  );
}
