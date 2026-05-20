(function () {
  // Global cart reference
  let cart = {};

  function loadCart() {
    try {
      const storedCart = JSON.parse(localStorage.getItem('clickline_cart') || '{}');
      return storedCart && typeof storedCart === 'object' && !Array.isArray(storedCart)
        ? storedCart
        : {};
    } catch (error) {
      localStorage.removeItem('clickline_cart');
      return {};
    }
  }

  function saveCart(newCart) {
    cart = newCart;
    localStorage.setItem('clickline_cart', JSON.stringify(cart));
  }

  function updateCartCount() {
    const total = Object.values(cart).reduce((sum, qty) => sum + Number(qty || 0), 0);
    const cartCount = document.getElementById('cart-count');
    if (cartCount) {
      cartCount.textContent = total;
      // Bounce effect on count update if items added
      if (total > 0) {
        cartCount.classList.add('bounce');
        setTimeout(() => cartCount.classList.remove('bounce'), 300);
      }
    }
  }

  // Initialize cart
  cart = loadCart();

  // Redirect to checkout page on cart click
  const cartBtn = document.getElementById('cart-btn');
  if (cartBtn) {
    cartBtn.addEventListener('click', () => {
      window.location.href = 'cesta.html';
    });
  }

  // Carousel scroll helpers
  document.querySelectorAll('[data-scroll-target]').forEach((button) => {
    button.addEventListener('click', () => {
      const scroller = document.getElementById(button.dataset.scrollTarget);
      const direction = Number(button.dataset.scrollDir || 1);

      if (!scroller) return;

      scroller.scrollBy({
        left: direction * Math.max(260, scroller.clientWidth * 0.72),
        behavior: 'smooth'
      });
    });
  });

  // Global addToCart
  window.addToCart = function (item) {
    cart = loadCart();
    if (cart[item]) {
      cart[item] = Number(cart[item] || 0) + 1;
    } else {
      cart[item] = 1;
    }

    saveCart(cart);
    updateCartCount();

    // Highlight cart button briefly with active bounce scale
    if (cartBtn) {
      cartBtn.style.transform = 'scale(1.2) translateY(-2px)';
      cartBtn.style.boxShadow = '0 0 30px rgba(63, 70, 82, 0.45)';
      setTimeout(() => {
        cartBtn.style.transform = '';
        cartBtn.style.boxShadow = '';
      }, 250);
    }
  };

  // Shrinking Header on Scroll
  const header = document.querySelector('header');
  if (header) {
    const toggleHeaderScroll = () => {
      if (window.scrollY > 24) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    };
    window.addEventListener('scroll', toggleHeaderScroll, { passive: true });
    toggleHeaderScroll(); // Check on load
  }

  // Intersection Observer for Scroll Reveals
  const scrollElements = document.querySelectorAll('.scroll-reveal');
  if (scrollElements.length > 0) {
    const elementObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal-visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.12,
      rootMargin: '0px 0px -40px 0px'
    });

    scrollElements.forEach(el => elementObserver.observe(el));
  }

  // Shopping Cart Page Implementation
  const cartContainer = document.getElementById('cart-container');
  if (cartContainer) {
    function escapeHtml(value) {
      return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }

    function updateQuantity(item, delta) {
      const currentCart = loadCart();
      if (!currentCart[item]) return;

      currentCart[item] = Number(currentCart[item] || 0) + delta;
      if (currentCart[item] <= 0) {
        delete currentCart[item];
      }

      saveCart(currentCart);
      renderCart();
    }

    function renderCart() {
      const currentCart = loadCart();
      const items = Object.entries(currentCart);
      const totalItems = items.reduce((sum, [_, qty]) => sum + Number(qty || 0), 0);

      if (items.length === 0) {
        cartContainer.innerHTML = `
          <div class="empty-cart scroll-reveal reveal-visible">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
            <p>Tu cesta está vacía. Descubre nuestros productos tecnológicos.</p>
            <a href="index.html" class="return-btn">Ir al catálogo</a>
          </div>
        `;
        return;
      }

      let itemsHtml = '<div class="cart-items">';
      items.forEach(([item, qty]) => {
        const safeItem = escapeHtml(item);
        const itemKey = encodeURIComponent(item);
        itemsHtml += `
          <div class="cart-item">
            <div class="cart-item-info">
              <h4>${safeItem}</h4>
              <p>Unidad</p>
            </div>
            <div class="cart-item-controls">
              <button class="qty-btn" type="button" data-cart-item="${itemKey}" data-cart-delta="-1" aria-label="Quitar una unidad de ${safeItem}">-</button>
              <span class="qty-display">${Number(qty || 0)}</span>
              <button class="qty-btn" type="button" data-cart-item="${itemKey}" data-cart-delta="1" aria-label="Añadir una unidad de ${safeItem}">+</button>
            </div>
          </div>
        `;
      });
      itemsHtml += '</div>';

      const summaryHtml = `
        <div class="cart-summary">
          <div class="summary-text">
            <p>Total de artículos</p>
            <h3>${totalItems} productos</h3>
          </div>
          <button class="checkout-btn" type="button" id="checkout-btn">
            <svg aria-hidden="true" width="24" height="24" viewBox="0 0 32 32" fill="currentColor">
              <path d="M16.02 3.2A12.76 12.76 0 0 0 5.14 22.6L3.6 28.8l6.34-1.48A12.78 12.78 0 1 0 16.02 3.2Zm0 22.88c-2.08 0-4.02-.62-5.64-1.68l-.4-.26-3.76.88.9-3.64-.28-.42a10.02 10.02 0 1 1 9.18 5.12Zm5.5-7.48c-.3-.16-1.8-.9-2.08-1-.28-.1-.48-.16-.68.16-.2.3-.78 1-.96 1.2-.18.2-.36.22-.66.08-.3-.16-1.28-.48-2.44-1.52-.9-.8-1.52-1.8-1.7-2.1-.18-.3-.02-.48.14-.62.14-.14.3-.36.46-.54.16-.18.2-.3.3-.5.1-.2.06-.38-.02-.54-.08-.16-.68-1.64-.94-2.24-.24-.58-.5-.5-.68-.5h-.58c-.2 0-.52.08-.8.38-.28.3-1.04 1.02-1.04 2.48s1.06 2.88 1.2 3.08c.16.2 2.1 3.2 5.08 4.48.7.3 1.26.48 1.7.62.72.22 1.36.2 1.88.12.58-.08 1.8-.74 2.06-1.44.26-.72.26-1.32.18-1.44-.08-.14-.28-.22-.58-.38Z"></path>
            </svg>
            Comprar por WhatsApp
          </button>
        </div>
      `;

      cartContainer.innerHTML = itemsHtml + summaryHtml;
    }

    function checkout() {
      const currentCart = loadCart();
      const items = Object.entries(currentCart);

      if (items.length === 0) return;

      let message = "Hola, me gustaría comprar los siguientes productos de Clickline Solutions:\n\n";
      items.forEach(([item, qty]) => {
        message += `- ${qty}x ${item}\n`;
      });

      const whatsappUrl = `https://wa.me/593984454938?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
    }

    // Initialize Cart Page
    renderCart();

    // Event listener for quantity adjustments and checkout inside cart container
    cartContainer.addEventListener('click', (event) => {
      const quantityButton = event.target.closest('[data-cart-item]');
      if (quantityButton) {
        const item = decodeURIComponent(quantityButton.dataset.cartItem);
        const delta = Number(quantityButton.dataset.cartDelta);
        updateQuantity(item, delta);
        return;
      }

      if (event.target.closest('#checkout-btn')) {
        checkout();
      }
    });
  }

  // Initial count update
  updateCartCount();
})();