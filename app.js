const tripStart = new Date("2026-09-25T00:00:00");
const now = new Date();
const countdown = document.getElementById("countdown");
const diff = Math.ceil((tripStart - now) / (1000 * 60 * 60 * 24));
if (countdown) {
  if (diff > 0) countdown.textContent = `距离出发还有 ${diff} 天`;
  else if (diff === 0) countdown.textContent = "今天出发！Buon viaggio ✈️";
  else countdown.textContent = "旅行进行中 / 已出发 🇮🇹";
}

function localDateString(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const days = [...document.querySelectorAll("article.day")].sort((a, b) =>
  a.dataset.date.localeCompare(b.dataset.date)
);
const dayDates = days.map(day => day.dataset.date);
const realToday = localDateString();

function automaticTripDate() {
  if (!dayDates.length) return null;
  if (dayDates.includes(realToday)) return realToday;
  if (realToday < dayDates[0]) return dayDates[0];
  if (realToday > dayDates[dayDates.length - 1]) return dayDates[dayDates.length - 1];
  return dayDates.find(date => date >= realToday) || dayDates[dayDates.length - 1];
}

function formatDay(dateString) {
  const d = new Date(`${dateString}T12:00:00`);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const weekdays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  return { short: `${month}/${day}`, full: `${month}月${day}日`, weekday: weekdays[d.getDay()] };
}

let requestedDate = new URL(window.location.href).searchParams.get("date");
let currentDate = dayDates.includes(requestedDate) ? requestedDate : automaticTripDate();

let pager = null;
let tabsWrap = null;
let pagerStatus = null;
let prevButton = null;
let nextButton = null;
let todayButton = null;

if (days.length) {
  const planHeading = document.getElementById("plan");
  pager = document.createElement("section");
  pager.className = "day-pager";
  pager.setAttribute("aria-label", "按日期查看行程");
  pager.innerHTML = `
    <div class="day-pager-head">
      <div>
        <div class="day-pager-kicker">DAILY ITINERARY</div>
        <strong id="day-pager-status"></strong>
      </div>
      <button class="today-jump" type="button">今天</button>
    </div>
    <div class="day-tabs" role="tablist" aria-label="旅行日期"></div>
    <div class="day-nav-actions">
      <button class="day-nav-btn prev-day" type="button">← 上一天</button>
      <span class="day-page-count"></span>
      <button class="day-nav-btn next-day" type="button">下一天 →</button>
    </div>`;

  if (planHeading) {
    const possibleNote = planHeading.nextElementSibling;
    if (possibleNote && possibleNote.classList.contains("note")) possibleNote.after(pager);
    else planHeading.after(pager);
  } else {
    days[0].before(pager);
  }

  tabsWrap = pager.querySelector(".day-tabs");
  pagerStatus = pager.querySelector("#day-pager-status");
  prevButton = pager.querySelector(".prev-day");
  nextButton = pager.querySelector(".next-day");
  todayButton = pager.querySelector(".today-jump");

  days.forEach(day => {
    const date = day.dataset.date;
    const f = formatDay(date);
    const heading = day.querySelector(".day-title h3")?.textContent.trim() || "行程";
    const compactHeading = heading.split("·")[0].trim();
    const button = document.createElement("button");
    button.type = "button";
    button.className = "day-tab";
    button.dataset.date = date;
    button.setAttribute("role", "tab");
    button.innerHTML = `<span>${f.short}</span><small>${f.weekday}</small><em>${compactHeading}</em>`;
    if (date === realToday) button.classList.add("is-real-today");
    button.addEventListener("click", () => showDay(date, { updateUrl: true, scroll: true }));
    tabsWrap.appendChild(button);
    day.setAttribute("role", "tabpanel");
    day.id = `day-${date}`;
  });

  prevButton.addEventListener("click", () => {
    const i = dayDates.indexOf(currentDate);
    if (i > 0) showDay(dayDates[i - 1], { updateUrl: true, scroll: true });
  });
  nextButton.addEventListener("click", () => {
    const i = dayDates.indexOf(currentDate);
    if (i < dayDates.length - 1) showDay(dayDates[i + 1], { updateUrl: true, scroll: true });
  });
  todayButton.addEventListener("click", () => {
    showDay(automaticTripDate(), { updateUrl: false, scroll: true, clearUrl: true });
  });

  window.addEventListener("popstate", () => {
    const date = new URL(window.location.href).searchParams.get("date");
    showDay(dayDates.includes(date) ? date : automaticTripDate(), { updateUrl: false, scroll: false });
  });
}

function showDay(date, options = {}) {
  if (!dayDates.includes(date)) return;
  currentDate = date;
  const activeIndex = dayDates.indexOf(date);

  days.forEach(day => {
    const active = day.dataset.date === date;
    day.classList.toggle("day-hidden", !active);
    day.classList.toggle("is-active-day", active);
    day.classList.toggle("today", active && date === realToday);
    day.setAttribute("aria-hidden", active ? "false" : "true");
  });

  if (tabsWrap) {
    [...tabsWrap.querySelectorAll(".day-tab")].forEach(tab => {
      const active = tab.dataset.date === date;
      tab.classList.toggle("active", active);
      tab.setAttribute("aria-selected", active ? "true" : "false");
      tab.tabIndex = active ? 0 : -1;
      if (active) setTimeout(() => tab.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" }), 50);
    });
  }

  const day = days[activeIndex];
  const f = formatDay(date);
  const heading = day.querySelector(".day-title h3")?.textContent.trim() || "行程";
  if (pagerStatus) {
    const autoNote = date === realToday ? " · 今天" : "";
    pagerStatus.textContent = `${f.full} ${f.weekday}${autoNote} · ${heading}`;
  }
  const count = pager?.querySelector(".day-page-count");
  if (count) count.textContent = `第 ${activeIndex + 1} / ${days.length} 天`;
  if (prevButton) prevButton.disabled = activeIndex === 0;
  if (nextButton) nextButton.disabled = activeIndex === days.length - 1;

  document.title = `${f.short} ${heading} · ITALIA 2026`;

  if (options.updateUrl) {
    const url = new URL(window.location.href);
    url.searchParams.set("date", date);
    url.hash = "plan";
    history.pushState({}, "", url);
  } else if (options.clearUrl) {
    const url = new URL(window.location.href);
    url.searchParams.delete("date");
    url.hash = "plan";
    history.pushState({}, "", url);
  }

  window.dispatchEvent(new CustomEvent("tripdaychange", { detail: { date, day } }));

  if (options.scroll) {
    document.getElementById("plan")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

if (currentDate) showDay(currentDate, { updateUrl: false, scroll: false });

(function(){
  const places = {"Hotel Isa": "Hotel Isa Rome Italy", "FCO": "Rome Fiumicino Airport Italy", "Vatican Museums": "Vatican Museums Vatican City", "Sistine Chapel": "Sistine Chapel Vatican City", "St. Peter's Basilica": "St Peter's Basilica Vatican City", "Galleria Borghese": "Galleria Borghese Rome Italy", "Pietro al Pantheon": "Pietro al Pantheon Via dei Pastini 125 Rome Italy", "BONCI": "Pizzarium Bonci Via della Meloria 43 Rome Italy", "Pantheon": "Pantheon Rome Italy", "Piazza Venezia": "Piazza Venezia Rome Italy", "Colosseum": "Colosseum Rome Italy", "Roman Forum": "Roman Forum Rome Italy", "Palatine Hill": "Palatine Hill Rome Italy", "Spanish Steps": "Spanish Steps Rome Italy", "Trevi Fountain": "Trevi Fountain Rome Italy", "Firenze S.M.N.": "Firenze Santa Maria Novella railway station Italy", "Santa Maria del Fiore": "Cathedral of Santa Maria del Fiore Florence Italy", "Giotto’s Bell Tower": "Giotto's Bell Tower Florence Italy", "Piazza della Repubblica": "Piazza della Repubblica Florence Italy", "Piazza della Signoria": "Piazza della Signoria Florence Italy", "Ponte Vecchio": "Ponte Vecchio Florence Italy", "Piazzale Michelangelo": "Piazzale Michelangelo Florence Italy", "Uffizi Gallery": "Uffizi Gallery Florence Italy", "Medici Chapels": "Medici Chapels Florence Italy", "Accademia Gallery": "Galleria dell'Accademia Florence Italy", "Mercato Centrale": "Mercato Centrale Florence Italy", "Pisa Centrale": "Pisa Centrale railway station Italy", "Piazza dei Miracoli": "Piazza dei Miracoli Pisa Italy", "Leaning Tower of Pisa": "Leaning Tower of Pisa Italy", "La Spezia Centrale": "La Spezia Centrale railway station Italy", "Riomaggiore": "Riomaggiore Italy", "Manarola": "Manarola Italy", "Vernazza": "Vernazza Italy", "Venezia S. Lucia": "Venezia Santa Lucia railway station Italy", "Venezia Santa Lucia": "Venezia Santa Lucia railway station Italy", "St. Mark’s Basilica": "St Mark's Basilica Venice Italy", "St. Mark's Basilica": "St Mark's Basilica Venice Italy", "Doge’s Palace": "Doge's Palace Venice Italy", "Doge's Palace": "Doge's Palace Venice Italy", "Rialto Bridge": "Rialto Bridge Venice Italy", "B&B HOTEL Venezia Laguna": "B&B HOTEL Venezia Laguna Venice Italy", "Dobbiaco": "Dobbiaco South Tyrol Italy", "Parkhotel Bellevue": "Parkhotel Bellevue Dobbiaco Italy", "Lake Braies": "Lago di Braies South Tyrol Italy", "Lago di Braies": "Lago di Braies South Tyrol Italy", "Brixen": "Brixen South Tyrol Italy", "Bressanone": "Bressanone South Tyrol Italy", "Hotel Jarolim": "Hotel Jarolim Brixen Italy", "Val di Funes": "Val di Funes South Tyrol Italy", "Santa Maddalena": "Santa Maddalena Val di Funes Italy", "Ranui": "Ranui Val di Funes Italy", "St. Johann Church": "Chiesa di San Giovanni in Ranui Italy", "Ortisei": "Ortisei South Tyrol Italy", "Seceda": "Seceda South Tyrol Italy", "Alpe di Siusi": "Alpe di Siusi South Tyrol Italy", "Bolzano": "Bolzano South Tyrol Italy", "Milano Centrale": "Milano Centrale railway station Italy", "Milan Cathedral": "Duomo di Milano Italy", "Duomo": "Duomo di Milano Italy", "Galleria Vittorio Emanuele II": "Galleria Vittorio Emanuele II Milan Italy", "Piazza della Scala": "Piazza della Scala Milan Italy", "Brera": "Brera Milan Italy", "Hotel Osteria della Pista": "Hotel Osteria della Pista Casorate Sempione Italy"};
  const entries = Object.entries(places).sort((a,b)=>b[0].length-a[0].length);
  const root = document.querySelector('.wrap');
  if(!root) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while(walker.nextNode()){
    const n = walker.currentNode;
    if(!n.parentElement || n.parentElement.closest('a,button,script,style,.day-pager')) continue;
    if(!entries.some(([name]) => n.nodeValue.includes(name))) continue;
    nodes.push(n);
  }
  nodes.forEach(node => {
    let remaining = node.nodeValue;
    const frag = document.createDocumentFragment();
    while(remaining.length){
      let best = null;
      for(const [name, query] of entries){
        const idx = remaining.indexOf(name);
        if(idx >= 0 && (!best || idx < best.idx || (idx === best.idx && name.length > best.name.length))){
          best = {idx,name,query};
        }
      }
      if(!best){ frag.appendChild(document.createTextNode(remaining)); break; }
      if(best.idx > 0) frag.appendChild(document.createTextNode(remaining.slice(0,best.idx)));
      const a = document.createElement('a');
      a.className = 'map-link';
      a.href = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(best.query);
      a.target = '_blank';
      a.rel = 'noopener';
      a.textContent = best.name + ' ↗';
      frag.appendChild(a);
      remaining = remaining.slice(best.idx + best.name.length);
    }
    node.parentNode.replaceChild(frag,node);
  });
})();