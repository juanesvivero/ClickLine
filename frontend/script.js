document.addEventListener('DOMContentLoaded', () => {
  const navToggle = document.getElementById('nav-toggle');
  const navLinks = document.getElementById('nav-links');
  const contactForm = document.getElementById('contact-form');
  const formStatus = document.getElementById('form-status');

  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
    });
  }

  if (!contactForm || !formStatus) {
    return;
  }

  contactForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    formStatus.textContent = 'Enviando solicitud...';

    const formData = new FormData(contactForm);
    const payload = {
      name: formData.get('name'),
      email: formData.get('email'),
      city: formData.get('city'),
      phone: formData.get('phone'),
      service: formData.get('service'),
      message: formData.get('message')
    };

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json().catch(() => ({}));
      formStatus.textContent = data.message || 'Solicitud enviada correctamente.';
      if (response.ok) contactForm.reset();
    } catch (error) {
      formStatus.textContent = 'Error al enviar la solicitud. Intente nuevamente.';
      console.error(error);
    }
  });
});
