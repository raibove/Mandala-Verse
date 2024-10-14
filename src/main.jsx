import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import MandalaDrawing from './Mandala'


const router = createBrowserRouter([
  {
    path: '/',
    element: <App/>
  },
  {
    path: "/draw",
    element: <MandalaDrawing/>,
  },
]);

createRoot(document.getElementById('root')).render(
  <StrictMode>
     <RouterProvider router={router} />
  </StrictMode>,
)
