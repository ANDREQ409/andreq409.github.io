const services = [
  {
    id: "diagnostika",
    title: "Диагностика",
    description: "Полная проверка автомобиля: двигатель, электроника, подвеска. Выявим проблему до ремонта.",
    price: "от 1 000 ₽",
    duration: "40–60 мин"
  },
  {
    id: "maslo",
    title: "Замена масла и фильтров",
    description: "Моторное масло, масляный, воздушный и салонный фильтры. Подберём жидкость под ваш авто.",
    price: "от 800 ₽",
    duration: "30 мин"
  },
  {
    id: "tormoza",
    title: "Ремонт тормозной системы",
    description: "Замена колодок, дисков, тормозной жидкости. Проверим и отрегулируем всю систему.",
    price: "от 1 500 ₽",
    duration: "1–2 часа"
  },
  {
    id: "podveska",
    title: "Ремонт подвески",
    description: "Амортизаторы, рычаги, сайлентблоки, ступичные подшипники. Вернём комфорт и управляемость.",
    price: "от 2 000 ₽",
    duration: "от 1 часа"
  },
  {
    id: "razval-shozhdenie",
    title: "Развал-схождение",
    description: "3D-стенд точной настройки углов колёс. Ровный руль и меньше износ шин.",
    price: "от 2 500 ₽",
    duration: "40 мин"
  },
  {
    id: "shinomontazh",
    title: "Шиномонтаж",
    description: "Замена, балансировка, ремонт проколов. Комплект в четыре руки за минимальное время.",
    price: "от 2 000 ₽",
    duration: "40–60 мин"
  }
];

const grid = document.getElementById("servicesGrid");
const serviceSelect = document.querySelector('select[name="service"]');
const form = document.getElementById("bookingForm");
const successBlock = document.getElementById("formSuccess");
const failBlock = document.getElementById("formFail");
const submitBtn = form.querySelector(".form__submit");
const burgerBtn = document.getElementById("burgerBtn");
const nav = document.getElementById("siteNav");
const dateInput = form.querySelector('input[name="date"]');
const timeInput = form.querySelector('input[name="time"]');

const FORMSPREE_ENDPOINT = "https://formspree.io/f/mbggpebq";

function renderServices() {
  grid.innerHTML = services.map(service => `
    <article class="service-card">
      <h3 class="service-card__title">${service.title}</h3>
      <p class="service-card__desc">${service.description}</p>
      <div class="service-card__footer">
        <span class="service-card__price">${service.price}</span>
        <button type="button" class="btn btn--primary service-card__book" data-service="${service.id}">Записаться</button>
      </div>
    </article>
  `).join("");
}

function fillServiceSelect() {
  services.forEach(service => {
    const option = document.createElement("option");
    option.value = service.id;
    option.textContent = `${service.title} (${service.price})`;
    serviceSelect.appendChild(option);
  });
}

function showFieldError(fieldName, message) {
  const errorElement = form.querySelector(`[data-error-for="${fieldName}"]`);
  const inputElement = form.querySelector(`[name="${fieldName}"]`);
  if (errorElement) errorElement.textContent = message;
  if (inputElement) inputElement.classList.toggle("form__input--invalid", Boolean(message));
}

function validateForm(data) {
  let isValid = true;

  if (data.name.trim().length < 2) {
    showFieldError("name", "Введите имя (минимум 2 символа)");
    isValid = false;
  } else {
    showFieldError("name", "");
  }

  const phoneDigits = data.phone.replace(/\D/g, "");
  if (phoneDigits.length < 10) {
    showFieldError("phone", "Введите телефон полностью, например +7 (900) 123-45-67");
    isValid = false;
  } else {
    showFieldError("phone", "");
  }

  if (!data.service) {
    showFieldError("service", "Выберите услугу");
    isValid = false;
  } else {
    showFieldError("service", "");
  }

  if (data.date) {
    const day = new Date(`${data.date}T00:00:00`).getDay();
    if (day === 0 || day === 6) {
      showFieldError("date", "В субботу и воскресенье не работаем — выберите будний день");
      isValid = false;
    } else {
      showFieldError("date", "");
    }
  } else {
    showFieldError("date", "");
  }

  if (data.time) {
    if (data.time < timeInput.min || data.time > timeInput.max) {
      showFieldError("time", "Принимаем записи с 9:00 до 17:00");
      isValid = false;
    } else {
      showFieldError("time", "");
    }
  } else {
    showFieldError("time", "");
  }

  return isValid;
}

function saveBooking(booking) {
  const bookings = JSON.parse(localStorage.getItem("bookings") || "[]");
  bookings.push(booking);
  localStorage.setItem("bookings", JSON.stringify(bookings));
}

function onServiceBookClick(event) {
  const button = event.target.closest(".service-card__book");
  if (!button) return;
  serviceSelect.value = button.dataset.service;
  form.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function onFormSubmit(event) {
  event.preventDefault();

  const formData = new FormData(form);
  const data = {
    name: formData.get("name") || "",
    phone: formData.get("phone") || "",
    service: formData.get("service") || "",
    date: formData.get("date") || "",
    time: formData.get("time") || "",
    comment: formData.get("comment") || ""
  };

  if (formData.get("_gotcha")) {
    form.reset();
    return;
  }

  if (!validateForm(data)) return;

  const serviceTitle = services.find(s => s.id === data.service)?.title || data.service;

  saveBooking({
    ...data,
    serviceTitle,
    createdAt: new Date().toISOString()
  });

  submitBtn.disabled = true;
  submitBtn.textContent = "Отправляем…";
  successBlock.hidden = true;
  failBlock.hidden = true;

  let sent = false;
  try {
    const response = await fetch(FORMSPREE_ENDPOINT, {
      method: "POST",
      headers: { Accept: "application/json" },
      body: formData
    });
    sent = response.ok;
  } catch {
    sent = false;
  }

  submitBtn.disabled = false;
  submitBtn.textContent = "Отправить заявку";

  if (sent) {
    form.reset();
    successBlock.hidden = false;
    successBlock.scrollIntoView({ behavior: "smooth", block: "nearest" });
    setTimeout(() => { successBlock.hidden = true; }, 6000);
  } else {
    failBlock.hidden = false;
    failBlock.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
}

function onBurgerClick() {
  const isOpen = nav.classList.toggle("nav--open");
  burgerBtn.classList.toggle("burger--open", isOpen);
  burgerBtn.setAttribute("aria-expanded", String(isOpen));
}

function onNavLinkClick() {
  nav.classList.remove("nav--open");
  burgerBtn.classList.remove("burger--open");
  burgerBtn.setAttribute("aria-expanded", "false");
}

function setMinDate() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  dateInput.min = `${yyyy}-${mm}-${dd}`;
}

renderServices();
fillServiceSelect();
setMinDate();

grid.addEventListener("click", onServiceBookClick);
form.addEventListener("submit", onFormSubmit);
burgerBtn.addEventListener("click", onBurgerClick);
nav.querySelectorAll(".nav__link").forEach(link => link.addEventListener("click", onNavLinkClick));
