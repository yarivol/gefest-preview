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
  // Плавно появляются только крупные блоки, и только те, что ниже первого экрана:
  // то, что видно сразу, не мигает. Отдельные абзацы, теги и подвал не анимируем.
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var revealSel = ".cards, .services, .gallery, .detail, .reviews-text, .reviews-widget, .contacts-text, " +
    ".map, .lead-text, .form, .steps, .variants, .products, .media, .faq";
  // только на главной: на страницах каталога всё показывается сразу
  if (!reduceMotion && "IntersectionObserver" in window && document.querySelector(".hero")) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px" });
    Array.prototype.forEach.call(document.querySelectorAll(revealSel), function (el) {
      if (el.getBoundingClientRect().top < window.innerHeight) return;   // уже на экране
      el.classList.add("reveal");
      io.observe(el);
    });
  }

  // ---------- Частые вопросы: плавно раскрываются ----------
  Array.prototype.forEach.call(document.querySelectorAll(".faq details"), function (det) {
    var summary = det.querySelector("summary");
    var body = det.querySelector("summary + *");
    if (!summary || !body || reduceMotion || !body.animate) return;
    var anim = null;
    summary.addEventListener("click", function (e) {
      e.preventDefault();
      if (anim) anim.cancel();
      if (!det.open) {
        det.open = true;
        var h = body.offsetHeight;
        anim = body.animate([{ height: "0px", opacity: 0 }, { height: h + "px", opacity: 1 }],
          { duration: 260, easing: "cubic-bezier(.2,.7,.2,1)" });
        anim.onfinish = function () { anim = null; };
      } else {
        det.classList.add("closing");
        anim = body.animate([{ height: body.offsetHeight + "px", opacity: 1 }, { height: "0px", opacity: 0 }],
          { duration: 220, easing: "ease-in" });
        anim.onfinish = function () { det.open = false; det.classList.remove("closing"); anim = null; };
      }
    });
  });

  // ---------- Просмотр фото на странице ----------
  var lb = null, lbItems = [], lbIndex = 0, lastFocus = null;
  function lbBuild() {
    lb = document.createElement("div");
    lb.className = "lightbox";
    lb.setAttribute("role", "dialog");
    lb.setAttribute("aria-modal", "true");
    lb.setAttribute("aria-label", "Просмотр фото");
    lb.innerHTML = '<button type="button" class="lb-close" aria-label="Закрыть">×</button>' +
      '<button type="button" class="lb-prev" aria-label="Предыдущее фото">‹</button>' +
      '<figure class="lb-figure"><img alt=""><figcaption></figcaption></figure>' +
      '<button type="button" class="lb-next" aria-label="Следующее фото">›</button>' +
      '<span class="lb-count"></span>';
    document.body.appendChild(lb);
    lb.addEventListener("click", function (e) {
      if (e.target === lb || e.target.closest(".lb-close")) lbClose();
      else if (e.target.closest(".lb-prev")) lbShow(lbIndex - 1);
      else if (e.target.closest(".lb-next")) lbShow(lbIndex + 1);
    });
    var x0 = null;
    lb.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener("touchend", function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 50) lbShow(lbIndex + (dx < 0 ? 1 : -1));
      x0 = null;
    });
  }
  function lbShow(i) {
    lbIndex = (i + lbItems.length) % lbItems.length;
    var a = lbItems[lbIndex];
    var img = lb.querySelector("img");
    img.classList.remove("in");
    img.onload = function () { img.classList.add("in"); };
    img.src = a.getAttribute("href");
    img.alt = a.getAttribute("data-caption") || (a.querySelector("img") || {}).alt || "";
    lb.querySelector("figcaption").textContent = a.getAttribute("data-caption") || "";
    var many = lbItems.length > 1;
    lb.querySelector(".lb-count").textContent = many ? (lbIndex + 1) + " из " + lbItems.length : "";
    lb.querySelector(".lb-prev").hidden = !many;
    lb.querySelector(".lb-next").hidden = !many;
  }
  function lbOpen(a) {
    if (!lb) lbBuild();
    var group = a.getAttribute("data-lightbox");
    lbItems = Array.prototype.filter.call(document.querySelectorAll("[data-lightbox]"), function (x) {
      // .is-off — фото, скрытые фильтром на странице «Наши работы»
      return x.getAttribute("data-lightbox") === group && !x.classList.contains("is-off");
    });
    lastFocus = a;
    lbShow(Math.max(0, lbItems.indexOf(a)));
    lb.classList.add("open");
    document.documentElement.classList.add("lb-lock");
    lb.querySelector(".lb-close").focus();
  }
  function lbClose() {
    lb.classList.remove("open");
    document.documentElement.classList.remove("lb-lock");
    if (lastFocus) lastFocus.focus();
  }
  document.addEventListener("click", function (e) {
    var a = e.target.closest("a[data-lightbox]");
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    lbOpen(a);
  });
  document.addEventListener("keydown", function (e) {
    if (!lb || !lb.classList.contains("open")) return;
    if (e.key === "Escape") lbClose();
    else if (e.key === "ArrowLeft") lbShow(lbIndex - 1);
    else if (e.key === "ArrowRight") lbShow(lbIndex + 1);
  });

  // ---------- Лента работ: кнопки ‹ › на компьютере, на телефоне листается пальцем ----------
  Array.prototype.forEach.call(document.querySelectorAll(".carousel"), function (car) {
    var track = car.querySelector(".car-track");
    var prev = car.querySelector(".car-prev"), next = car.querySelector(".car-next");
    function step() { return track.clientWidth * 0.9; }
    function update() {
      prev.hidden = track.scrollLeft < 5;
      next.hidden = track.scrollLeft + track.clientWidth > track.scrollWidth - 5;
    }
    prev.addEventListener("click", function () { track.scrollBy({ left: -step() }); });
    next.addEventListener("click", function () { track.scrollBy({ left: step() }); });
    track.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
  });

  // ---------- Страница «Наши работы»: фильтр по разделу (#slug в адресе) ----------
  var wf = document.querySelector(".works-filter");
  if (wf) {
    var wItems = document.querySelectorAll(".works-all a");
    var setFilter = function (f) {
      var btns = wf.querySelectorAll("button");
      var known = Array.prototype.some.call(btns, function (b) { return b.getAttribute("data-f") === f; });
      if (!known) f = "";
      Array.prototype.forEach.call(btns, function (b) {
        var on = b.getAttribute("data-f") === f;
        b.classList.toggle("on", on);
        b.setAttribute("aria-pressed", on ? "true" : "false");
      });
      Array.prototype.forEach.call(wItems, function (a) {
        a.classList.toggle("is-off", f !== "" && a.getAttribute("data-dir") !== f);
      });
    };
    wf.addEventListener("click", function (e) {
      var b = e.target.closest("button[data-f]");
      if (!b) return;
      var f = b.getAttribute("data-f");
      setFilter(f);
      history.replaceState(null, "", f ? "#" + f : location.pathname);
    });
    setFilter(decodeURIComponent(location.hash.slice(1)));
  }

  // ---------- Карточки направлений ----------
  var cards = document.querySelectorAll(".card[data-title]");
  var detail = document.getElementById("detail");
  function setCur(name, fn) {
    var el = detail.querySelector('[data-cur="' + name + '"]');
    if (el) fn(el);
  }
  var wide = window.matchMedia("(min-width: 641px)");
  var swapTimer = null;
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
      clearTimeout(swapTimer);       // быстрые клики подряд: показываем только последний выбор
      swapTimer = setTimeout(function () {
        setCur("title", function (el) { el.textContent = d.title; });
        setCur("desc", function (el) { el.textContent = d.desc; });
        setCur("price", function (el) { el.textContent = d.price; });
        setCur("more", function (el) { el.textContent = d.title; });
        setCur("url", function (el) { el.href = d.url; });
        setCur("wa", function (el) { el.href = d.wa; });
        detail.classList.remove("swap");
      }, reduceMotion ? 0 : 150);
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

  // ---------- Обратный звонок: кругляш справа внизу (только на компьютере) ----------
  var cbDialog = document.querySelector(".cb-dialog");
  var cbButton = document.querySelector(".cb-fab");
  var DAY_NAMES = ["в понедельник", "во вторник", "в среду", "в четверг", "в пятницу", "в субботу", "в воскресенье"];

  // Ответ после заявки: в рабочее время — «скоро», иначе — когда откроемся (по часам из Яндекс Карт, МСК)
  function callbackMessage() {
    var week = [];
    try { week = JSON.parse(cbDialog.getAttribute("data-hours")) || []; } catch (e) { week = []; }
    var msk = new Date(Date.now() + (new Date().getTimezoneOffset() + 180) * 60000);
    var day = (msk.getDay() + 6) % 7, hour = msk.getHours() + msk.getMinutes() / 60;
    var today = week[day];
    if (!week.length || (today && hour >= today[0] && hour < today[1])) {
      return "<b>Заявка отправлена.</b> Перезвоним в ближайшее время.";
    }
    for (var i = 0; i < 8; i++) {
      var d = (day + i) % 7, h = week[d];
      if (!h || (i === 0 && hour >= h[0])) continue;
      var when = i === 0 ? "сегодня" : i === 1 ? "завтра" : DAY_NAMES[d];
      return "<b>Заявка отправлена.</b> Сейчас магазин закрыт, перезвоним " + when + " с " + h[0] + ":00.";
    }
    return "<b>Заявка отправлена, перезвоним.</b>";
  }

  if (cbDialog && cbButton && typeof cbDialog.showModal === "function") {
    var cbForm = cbDialog.querySelector("form");
    cbButton.addEventListener("click", function () {
      var h1 = document.querySelector("h1");
      cbForm.elements["source"].value = ("Обратный звонок: " + (h1 ? h1.textContent.trim() : document.title)).slice(0, 80);
      cbDialog.showModal();
      cbForm.elements["name"].focus();
    });
    cbDialog.addEventListener("click", function (e) {
      if (e.target === cbDialog || e.target.closest("[data-cb-close]")) cbDialog.close();
    });
    // Один раз за визит качнуть трубкой через 15 секунд, без бесконечной пульсации
    var nudged = false;
    try { nudged = sessionStorage.getItem("gefest-cb-nudge") === "1"; } catch (e) {}
    if (!nudged && !reduceMotion) {
      setTimeout(function () {
        if (cbDialog.open) return;
        cbButton.classList.add("nudge");
        try { sessionStorage.setItem("gefest-cb-nudge", "1"); } catch (e) {}
      }, 15000);
    }
  } else if (cbButton) {
    cbButton.hidden = true;  // очень старый браузер без <dialog>
  }

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
          showMsg(box, "ok", form.hasAttribute("data-callback") ? callbackMessage()
            : "<b>Заявка отправлена, перезвоним.</b>");
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
