import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import '../styles/prism-theme.css';
import { WorkspaceProvider } from './context/WorkspaceContext';
import { SessionCallProvider } from './context/SessionCallContext';
import { WhiteboardProvider } from './context/WhiteboardContext';
import { ArenaProvider } from './context/ArenaContext';

export default function App() {
  return (
    <SessionCallProvider>
      <WorkspaceProvider>
        <ArenaProvider>
          <WhiteboardProvider>
            <RouterProvider router={router} />
          </WhiteboardProvider>
        </ArenaProvider>
      </WorkspaceProvider>
    </SessionCallProvider>
  );
}
