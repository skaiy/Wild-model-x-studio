import {createRoot} from 'react-dom/client';
import Home from '../app/page';
import AuthoringPage from '../app/authoring/page';
import '../app/globals.css';

const path = window.location.pathname.replace(/\/$/, '') || '/';
const Page = path.endsWith('/authoring') ? AuthoringPage : Home;

createRoot(document.getElementById('root')!).render(<Page />);
