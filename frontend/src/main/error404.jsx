// Página 404.html
import '../styles/paginas/error.css';
import { montar } from './montar.jsx';
import PaginaError from '../pages/PaginaError.jsx';

montar(() => <PaginaError codigo="404" />);
