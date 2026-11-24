(function () {
  "use strict";

  // ---------- Меню на мобильных ----------
  var burger = document.querySelector(".burger");
  var nav = document.getElementById("nav");
  if (burger && nav) {
    burger.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      burger.setAttribute("aria-expanded", open ? "true" : "false");
      burger.setAttribute("aria-label", open ? "Закрыть меню" : "Открыть меню");
    });
    nav.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        nav.classList.remove("open");
        burger.setAttribute("aria-expanded", "false");
      }
    });
  }

  // ---------- Появление блоков при прокрутке ----------
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var revealSel = ".h2, .lead, .card, .service, .gallery a, .detail, .reviews-text, .reviews-widget, " +
    ".contacts-text, .map, .lead-text, .form, .page-main > *, .page-aside, .tag, .faq details, .footer-col";
  var revealEls = document.querySelectorAll(revealSel);
  Array.prototype.forEach.call(revealEls, function (el, i) {
    el.classList.add("reveal");
    // карточки и плитки — лесенкой, по 4 в ряд
    if (el.matches(".card, .service, .gallery a, .tag, .footer-col")) {
      var siblings = Array.prototype.indexOf.call(el.parentNode.children, el);
      el.style.setProperty("--d", (siblings % 4) * 0.07 + "s");
    }
  });
  // Показываем всё, что уже выше нижнего края экрана — в том числе блоки,
  // которые «перелистнули» быстрым свайпом за один кадр.
  var pending = Array.prototype.slice.call(revealEls);
  var ticking = false;
  function revealVisible() {
    ticking = false;
    var limit = window.innerHeight - 40;
    pending = pending.filter(function (el) {
      if (el.getBoundingClientRect().top < limit) {
        el.classList.add("is-in");
        return false;
      }
      return true;
    });
    if (!pending.length) {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    }
  }
  function onScroll() {
    if (!ticking) { ticking = true; requestAnimationFrame(revealVisible); }
  }
  if (reduceMotion) {
    pending.forEach(function (el) { el.classList.add("is-in"); });
  } else {
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    revealVisible();
  }

  // ---------- Карточки направлений ----------
  var cards = document.querySelectorAll(".card[data-title]");
  var detail = document.getElementById("detail");
  function setCur(name, fn) {
    var el = detail.querySelector('[data-cur="' + name + '"]');
    if (el) fn(el);
  }
  var wide = window.matchMedia("(min-width: 641px)");
  Array.prototype.forEach.call(cards, function (card) {
    card.addEventListener("click", function (e) {
      // На телефоне карточка — обычная ссылка на страницу направления.
      if (!detail || !wide.matches || e.metaKey || e.ctrlKey || e.shiftKey) return;
      e.preventDefault();
      Array.prototype.forEach.call(cards, function (c) {
        c.classList.toggle("on", c === card);
      });
      var d = card.dataset;
      detail.classList.add("swap");  // текст гаснет, меняется и снова появляется
      setTimeout(function () {
        setCur("title", function (el) { el.textContent = d.title; });
        setCur("desc", function (el) { el.textContent = d.desc; });
        setCur("price", function (el) { el.textContent = d.price; });
        setCur("more", function (el) { el.textContent = d.title; });
        setCur("url", function (el) { el.href = d.url; });
        setCur("wa", function (el) { el.href = d.wa; });
        detail.classList.remove("swap");
      }, reduceMotion ? 0 : 180);
      if (window.innerWidth < 960) {
        detail.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });

  // ---------- Cookie: виджеты Яндекса грузятся только после согласия ----------
  var COOKIE_KEY = "gefest-cookie";  // "all" или "none"
  function getChoice() { try { return localStorage.getItem(COOKIE_KEY); } catch (e) { return null; } }
  function setChoice(v) { try { localStorage.setItem(COOKIE_KEY, v); } catch (e) { /* приватный режим */ } }
  function loadEmbeds() {
    Array.prototype.forEach.call(document.querySelectorAll(".embed[data-src]"), function (box) {
      var f = document.createElement("iframe");
      f.src = box.getAttribute("data-src");
      f.title = box.getAttribute("data-title") || "";
      f.loading = "lazy";
      f.allowFullscreen = true;
      box.innerHTML = "";
      box.appendChild(f);
      box.removeAttribute("data-src");
    });
  }
  var cookieBar = document.querySelector(".cookie-bar");
  function hideBar() { if (cookieBar) cookieBar.hidden = true; document.body.classList.remove("has-cookie-bar"); }
  function showBar() { if (cookieBar) { cookieBar.hidden = false; document.body.classList.add("has-cookie-bar"); } }
  function decide(v) { setChoice(v); hideBar(); if (v === "all") loadEmbeds(); }

  if (getChoice() === "all") loadEmbeds();
  else if (!getChoice()) showBar();

  document.addEventListener("click", function (e) {
    var t = e.target.closest("[data-cookie], [data-embed-load], [data-cookie-settings]");
    if (!t) return;
    if (t.hasAttribute("data-cookie")) decide(t.getAttribute("data-cookie"));
    else if (t.hasAttribute("data-embed-load")) decide("all");  // нажал «Показать карту» — это согласие
    else { try { localStorage.removeItem(COOKIE_KEY); } catch (err) {} showBar(); }
  });

  // ---------- Нижняя панель не мешает заполнять форму ----------
  document.addEventListener("focusin", function (e) {
    if (e.target.matches("input, textarea")) document.body.classList.add("typing");
  });
  document.addEventListener("focusout", function () {
    setTimeout(function () {
      if (!document.activeElement || !document.activeElement.matches("input, textarea")) {
        document.body.classList.remove("typing");
      }
    }, 100);
  });

  // ---------- Форма заявки ----------
  var WA = (document.querySelector('.callbar a[href*="wa.me"]') || {}).href || "https://wa.me/79216353614";

  function normalizePhone(value) {
    var digits = String(value).replace(/\D/g, "");
    if (digits.length === 11 && (digits[0] === "7" || digits[0] === "8")) return "+7" + digits.slice(1);
    if (digits.length === 10 && digits[0] === "9") return "+7" + digits;
    return null;
  }

  function showError(form, name, text) {
    var err = form.querySelector('[data-err="' + name + '"]');
    var input = form.querySelector('[name="' + name + '"]');
    if (err) err.textContent = text || "";
    if (input) input.setAttribute("aria-invalid", text ? "true" : "false");
  }

  function showMsg(box, kind, html) {
    box.className = "form-msg " + kind;
    box.innerHTML = html;
    box.hidden = false;
  }

  Array.prototype.forEach.call(document.querySelectorAll("[data-lead-form]"), function (form) {
    var box = form.querySelector("[data-msg]");
    var button = form.querySelector('button[type="submit"]');

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      box.hidden = true;
      var phone = normalizePhone(form.elements["phone"].value);
      var ok = true;
      showError(form, "phone", phone ? "" : "Проверьте номер: нужно 10 цифр после +7");
      if (!phone) ok = false;
      showError(form, "consent", form.elements["consent"].checked ? "" : "Нужно согласие на обработку данных");
      if (!form.elements["consent"].checked) ok = false;
      if (!ok) {
        (phone ? form.elements["consent"] : form.elements["phone"]).focus();
        return;
      }

      var payload = {
        name: form.elements["name"].value.trim(),
        phone: phone,
        car: form.elements["car"].value.trim(),
        need: form.elements["need"].value.trim(),
        source: form.elements["source"].value,
        consent: true,
        website: form.elements["website"].value
      };

      button.disabled = true;
      button.textContent = "Отправляем…";
      fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
        .then(function (r) {
          if (!r.ok) throw new Error("HTTP " + r.status);
          form.reset();
          showMsg(box, "ok", "<b>Заявка отправлена, перезвоним.</b>");
        })
        .catch(function () {
          var text = "Здравствуйте! " + (payload.car ? "Машина: " + payload.car + ". " : "") +
            (payload.need ? "Нужно: " + payload.need : "");
          showMsg(box, "err",
            "Не получилось отправить заявку. Напишите нам в " +
            '<a href="' + WA + "?text=" + encodeURIComponent(text) + '">WhatsApp</a> — ответим там.');
        })
        .then(function () {
          button.disabled = false;
          button.textContent = "Отправить заявку";
        });
    });
  });
})();
