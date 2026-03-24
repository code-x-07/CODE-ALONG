import { createBrowserRouter, Navigate } from "react-router-dom";
import Layout from "./layout";
import CollaboratePage from "./pages/Collaborate";
import ArenaPage from "./pages/Arena";
import WhiteboardPage from "./pages/Whiteboard";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, element: <Navigate to="/collaborate" replace /> },
      { path: "collaborate", Component: CollaboratePage },
      { path: "arena", Component: ArenaPage },
      { path: "whiteboard", Component: WhiteboardPage },
    ],
  },
]);
