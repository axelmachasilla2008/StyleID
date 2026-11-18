// =====================================================
// Ventana para iniciar sesión o crear una cuenta (verifica contra la API).
// =====================================================
import { useEffect, useRef, useState } from 'react';
import { api } from '../../lib/api.js';
import { startSession } from '../../lib/sesion.js';

function PasswordField({ id, value, onChange, ...props }) {
    const [visible, setVisible] = useState(false);
    return (
        <div className="password-field">
            <input type={visible ? 'text' : 'password'} id={id} value={value} onChange={onChange} required {...props} />
            <button type="button" className="toggle-pass" aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'} onClick={() => setVisible((v) => !v)}>
                {visible ? '🙈' : '👁️'}
            </button>
        </div>
    );
}

export default function LoginModal({ open, onClose, onLogin }) {
    const [tab, setTab] = useState('login');
    const [login, setLogin] = useState({ id: '', pass: '' });
    const [reg, setReg] = useState({ user: '', email: '', pass: '' });
    const [msg, setMsg] = useState({ text: '', kind: '' });
    const [shake, setShake] = useState(0);
    const modalRef = useRef(null);

    // Al abrir: pestaña de inicio de sesión, foco en el primer campo y sin scroll detrás
    useEffect(() => {
        if (!open) return undefined;
        setTab('login');
        setMsg({ text: '', kind: '' });
        document.body.style.overflow = 'hidden';
        requestAnimationFrame(() => document.getElementById('login-user')?.focus());
        const onKey = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', onKey);
        return () => {
            document.body.style.overflow = '';
            document.removeEventListener('keydown', onKey);
        };
    }, [open]);

    // Animación de "sacudida" cuando hay un error
    useEffect(() => {
        if (!shake) return;
        const card = modalRef.current;
        card.classList.remove('shake');
        void card.offsetWidth;
        card.classList.add('shake');
    }, [shake]);

    function fail(text) {
        setMsg({ text, kind: 'error' });
        setShake((n) => n + 1);
    }

    /** Guarda la sesión y cierra la ventana después de un momento. */
    function welcome(data, text, reset) {
        setMsg({ text, kind: 'ok' });
        setTimeout(() => {
            startSession(data.user, data.token);
            onLogin(data.user);
            onClose();
            reset();
        }, 900);
    }

    async function onLoginSubmit(e) {
        e.preventDefault();
        setMsg({ text: 'Entrando...', kind: 'ok' });
        try {
            const data = await api('/api/users/login', { method: 'POST', body: { id: login.id.trim(), pass: login.pass } });
            welcome(data, `¡Bienvenido, ${data.user}!`, () => setLogin({ id: '', pass: '' }));
        } catch (err) {
            fail(err.message);
        }
    }

    async function onRegisterSubmit(e) {
        e.preventDefault();
        setMsg({ text: 'Creando cuenta...', kind: 'ok' });
        try {
            const data = await api('/api/users/register', { method: 'POST', body: { user: reg.user.trim(), email: reg.email.trim(), pass: reg.pass } });
            welcome(data, '¡Cuenta creada! Iniciando sesión...', () => setReg({ user: '', email: '', pass: '' }));
        } catch (err) {
            fail(err.message);
        }
    }

    const msgClass = `form-msg${msg.kind ? ` ${msg.kind}` : ''}`;

    return (
        <div className={`modal-backdrop${open ? ' open' : ''}`} id="login-modal" aria-hidden={!open}
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" ref={modalRef}>
                <button className="modal-close" type="button" aria-label="Cerrar ventana de inicio de sesión" onClick={onClose}>&times;</button>
                <h2 className="modal-title" id="modal-title">Bienvenido a <span className="brand">StyleID</span></h2>

                <div className="modal-tabs" role="tablist" aria-label="Opciones de acceso">
                    <button className={`tab${tab === 'login' ? ' active' : ''}`} id="tab-login" type="button" role="tab"
                        aria-selected={tab === 'login'} aria-controls="form-login" onClick={() => setTab('login')}>Iniciar sesión</button>
                    <button className={`tab${tab === 'register' ? ' active' : ''}`} id="tab-register" type="button" role="tab"
                        aria-selected={tab === 'register'} aria-controls="form-register" onClick={() => setTab('register')}>Registrarse</button>
                </div>

                <form id="form-login" className={`modal-form${tab === 'login' ? '' : ' hidden'}`} role="tabpanel" aria-labelledby="tab-login" onSubmit={onLoginSubmit}>
                    <div className="form-field">
                        <label htmlFor="login-user">Usuario o correo</label>
                        <input type="text" id="login-user" required autoComplete="username" placeholder="tucorreo@ejemplo.com"
                            value={login.id} onChange={(e) => setLogin((l) => ({ ...l, id: e.target.value }))} />
                    </div>
                    <div className="form-field">
                        <label htmlFor="login-pass">Contraseña</label>
                        <PasswordField id="login-pass" autoComplete="current-password" placeholder="••••••••"
                            value={login.pass} onChange={(e) => setLogin((l) => ({ ...l, pass: e.target.value }))} />
                    </div>
                    <p className={msgClass} role="alert" aria-live="polite">{tab === 'login' ? msg.text : ''}</p>
                    <button type="submit" className="btn-primary btn-block">ENTRAR</button>
                </form>

                <form id="form-register" className={`modal-form${tab === 'register' ? '' : ' hidden'}`} role="tabpanel" aria-labelledby="tab-register" tabIndex={-1} onSubmit={onRegisterSubmit}>
                    <div className="form-field">
                        <label htmlFor="reg-user">Nombre de usuario</label>
                        <input type="text" id="reg-user" required minLength={3} autoComplete="username" placeholder="Tu nombre de usuario"
                            value={reg.user} onChange={(e) => setReg((r) => ({ ...r, user: e.target.value }))} />
                    </div>
                    <div className="form-field">
                        <label htmlFor="reg-email">Correo electrónico</label>
                        <input type="email" id="reg-email" required autoComplete="email" placeholder="tucorreo@ejemplo.com"
                            value={reg.email} onChange={(e) => setReg((r) => ({ ...r, email: e.target.value }))} />
                    </div>
                    <div className="form-field">
                        <label htmlFor="reg-pass">Contraseña</label>
                        <PasswordField id="reg-pass" minLength={6} autoComplete="new-password" placeholder="Mínimo 6 caracteres"
                            value={reg.pass} onChange={(e) => setReg((r) => ({ ...r, pass: e.target.value }))} />
                    </div>
                    <p className={msgClass} role="alert" aria-live="polite">{tab === 'register' ? msg.text : ''}</p>
                    <button type="submit" className="btn-primary btn-block">CREAR CUENTA</button>
                </form>

                <p className="modal-note">Tu cuenta se guarda de forma segura en nuestra base de datos.</p>
            </div>
        </div>
    );
}
