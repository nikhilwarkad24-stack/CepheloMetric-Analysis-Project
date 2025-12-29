export async function sendEmailJS(templateParams: Record<string, any>) {
  const EMAILJS_SERVICE_ID = process.env.EMAILJS_SERVICE_ID;
  const EMAILJS_TEMPLATE_ID = process.env.EMAILJS_TEMPLATE_ID;
  const EMAILJS_USER_ID = process.env.EMAILJS_USER_ID;

  if (!EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID || !EMAILJS_USER_ID) {
    throw new Error('EmailJS not configured (missing env vars)');
  }

  const payload = {
    service_id: EMAILJS_SERVICE_ID,
    template_id: EMAILJS_TEMPLATE_ID,
    user_id: EMAILJS_USER_ID,
    template_params: templateParams,
  };

  const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  if (!res.ok) {
    let body = text;
    try {
      body = JSON.parse(text);
    } catch (e) {
      // keep raw text
    }
    throw new Error(`EmailJS send failed: ${res.status} ${JSON.stringify(body)}`);
  }

  return text;
}
