// =====================================================
// Datos de contacto, redes sociales y pagos de StyleID.
// Cambiarlos aquí los cambia en todas las páginas.
// =====================================================

export const WHATSAPP_PRINCIPAL = '593997370545';

/** Enlace de WhatsApp con un mensaje ya escrito. */
export const whatsappLink = (text = 'Hola StyleID, quiero información', phone = WHATSAPP_PRINCIPAL) =>
    `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;

export const CONTACTS = [
    { role: 'Principal', name: 'Axel Machasilla', phone: '099 737 0545', whatsapp: '593997370545', email: 'axelmachasilla2008@gmail.com', main: true },
    { role: 'Secundario', name: 'Domenica Rosero', phone: '098 726 7317', whatsapp: '593987267317', email: 'suarezmishelle978@gmail.com' }
];

export const BANK = { bank: 'Banco Pichincha', type: 'Ahorros', number: '2204168330', owner: 'Ivan Machasilla' };

export const SOCIALS = [
    { id: 'whatsapp', label: 'WhatsApp', href: whatsappLink() },
    { id: 'instagram', label: 'Instagram', href: 'https://www.instagram.com/styleid_hechoparati?stkn=eGw5NHh2b2c0NXJm' },
    { id: 'facebook', label: 'Facebook', href: 'https://www.facebook.com/share/1Lcde1pPst/' },
    { id: 'tiktok', label: 'TikTok', href: 'https://www.tiktok.com/@styleid_2?is_from_webapp=1&sender_device=pc' }
];

export const PAYMENTS = [
    { id: 'visa', label: 'VISA' },
    { id: 'mastercard', label: 'Mastercard' },
    { id: 'paypal', label: 'PayPal' },
    { id: 'pichincha', label: 'Banco Pichincha' },
    { id: 'guayaquil', label: 'Banco Guayaquil' },
    { id: 'deuna', label: 'De Una' }
];
