import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import '../styles/prism-theme.css';

export default function App() {
  return <RouterProvider router={router} />;
}
