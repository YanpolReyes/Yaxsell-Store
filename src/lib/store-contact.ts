/** Contacto de la tienda (WhatsApp, soporte). */
export const WHATSAPP_PHONE = '56999149712';
export const WHATSAPP_DISPLAY = '+56 9 9914 9712';
export const WHATSAPP_E164 = '+56999149712';
export const STORE_NAME = 'Yes Bella';
export const SUPPORT_HOURS = 'Lunes a sábado, 9:00 – 19:00 hrs';

export const CHATBOT_OPEN_EVENT = 'yaxsel:chatbot-open';

export function getWhatsAppUrl(message = 'Hola, tengo una consulta sobre la tienda 🛒'): string {
  return `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(message)}`;
}

export function openChatbot(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(CHATBOT_OPEN_EVENT));
  }
}
