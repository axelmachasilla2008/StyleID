/** Cinco estrellas (con media estrella) para un promedio de 0 a 5. */
export default function Stars({ value = 0 }) {
    return [1, 2, 3, 4, 5].map((i) => {
        let cls = 'fa-regular fa-star';
        if (value >= i) cls = 'fa-solid fa-star';
        else if (value >= i - 0.5) cls = 'fa-solid fa-star-half-stroke';
        return <i key={i} className={cls} aria-hidden="true"></i>;
    });
}
