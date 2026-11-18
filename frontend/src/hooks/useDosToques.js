import { useEffect, useRef, useState } from 'react';

/**
 * Confirmación en dos toques (en lugar de confirm(), que en algunos
 * navegadores integrados no aparece y responde "no").
 * El primer toque «arma» el botón por 4 segundos; el segundo confirma.
 *
 * @returns {[boolean, () => boolean]} [armado, tocar]  tocar() devuelve true al confirmar
 */
export default function useDosToques(ms = 4000) {
    const [armed, setArmed] = useState(false);
    const timer = useRef(null);

    useEffect(() => () => clearTimeout(timer.current), []);

    function tap() {
        if (armed) {
            clearTimeout(timer.current);
            setArmed(false);
            return true;
        }
        setArmed(true);
        timer.current = setTimeout(() => setArmed(false), ms);
        return false;
    }

    return [armed, tap];
}
