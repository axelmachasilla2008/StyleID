import { useEffect, useRef, useState } from 'react';

/**
 * Lupa del menú: se despliega y lleva al catálogo (catalogo.html?q=...).
 * En el catálogo, onSearch filtra ahí mismo sin recargar la página.
 */
export default function NavSearch({ query = '', onSearch }) {
    const [text, setText] = useState(query);
    const [open, setOpen] = useState(Boolean(query.trim()));
    const formRef = useRef(null);
    const inputRef = useRef(null);
    const buttonRef = useRef(null);

    // El catálogo puede cambiar la búsqueda desde su propio buscador
    useEffect(() => {
        setText(query);
        if (query.trim()) setOpen(true);
    }, [query]);

    function onButton(e) {
        if (!open) {
            e.preventDefault();
            setOpen(true);
            inputRef.current.focus();
        } else if (!text.trim()) {
            e.preventDefault();
            setOpen(false);
        }
        // Con texto, el botón envía el formulario
    }

    function onSubmit(e) {
        if (!text.trim()) {
            e.preventDefault();
            inputRef.current.focus();
            return;
        }
        if (onSearch) {
            e.preventDefault();
            onSearch(text);
        }
    }

    function onKeyDown(e) {
        if (e.key !== 'Escape') return;
        setText('');
        setOpen(false);
        buttonRef.current.focus();
    }

    function onBlur(e) {
        if (formRef.current.contains(e.relatedTarget)) return;
        if (!text.trim()) setOpen(false);
    }

    return (
        <form className={`nav-search${open ? ' open' : ''}`} action="catalogo.html" method="get" role="search" ref={formRef} onSubmit={onSubmit} onBlur={onBlur}>
            <label className="sr-only" htmlFor="navSearchInput">Buscar en el catálogo</label>
            <input
                type="search" id="navSearchInput" name="q" placeholder="Buscar prendas…" autoComplete="off"
                ref={inputRef} value={text} onChange={(e) => setText(e.target.value)} onKeyDown={onKeyDown}
            />
            <button type="submit" className="nav-search-btn" aria-label="Buscar" ref={buttonRef} onClick={onButton}>
                <i className="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
            </button>
        </form>
    );
}
