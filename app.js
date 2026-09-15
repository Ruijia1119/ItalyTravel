const start = new Date("2026-09-26T00:00:00+02:00");
  const now = new Date();
  const el = document.getElementById("countdown");
  const diff = Math.ceil((start - now)/(1000*60*60*24));
  if(diff > 0) el.textContent = `距离出发还有 ${diff} 天`;
  else if(diff === 0) el.textContent = "今天出发！Buon viaggio ✈️";
  else el.textContent = "旅行进行中 / 已出发 🇮🇹";

  const yyyy = now.getFullYear();
  const mm = String(now.getMonth()+1).padStart(2,'0');
  const dd = String(now.getDate()).padStart(2,'0');
  const today = `${yyyy}-${mm}-${dd}`;
  const card = document.querySelector(`[data-date="${today}"]`);
  if(card){
    card.classList.add("today");
    setTimeout(()=>card.scrollIntoView({behavior:"smooth", block:"center"}),500);
  }

(function(){
  const places = {"Hotel Isa": "Hotel Isa Rome Italy", "FCO": "Rome Fiumicino Airport Italy", "Vatican Museums": "Vatican Museums Vatican City", "Sistine Chapel": "Sistine Chapel Vatican City", "St. Peter's Basilica": "St Peter's Basilica Vatican City", "Galleria Borghese": "Galleria Borghese Rome Italy", "Pantheon": "Pantheon Rome Italy", "Piazza Venezia": "Piazza Venezia Rome Italy", "Colosseum": "Colosseum Rome Italy", "Roman Forum": "Roman Forum Rome Italy", "Palatine Hill": "Palatine Hill Rome Italy", "Spanish Steps": "Spanish Steps Rome Italy", "Trevi Fountain": "Trevi Fountain Rome Italy", "Firenze S.M.N.": "Firenze Santa Maria Novella railway station Italy", "Santa Maria del Fiore": "Cathedral of Santa Maria del Fiore Florence Italy", "Giotto’s Bell Tower": "Giotto's Bell Tower Florence Italy", "Piazza della Repubblica": "Piazza della Repubblica Florence Italy", "Piazza della Signoria": "Piazza della Signoria Florence Italy", "Ponte Vecchio": "Ponte Vecchio Florence Italy", "Piazzale Michelangelo": "Piazzale Michelangelo Florence Italy", "Uffizi Gallery": "Uffizi Gallery Florence Italy", "Medici Chapels": "Medici Chapels Florence Italy", "Accademia Gallery": "Galleria dell'Accademia Florence Italy", "Mercato Centrale": "Mercato Centrale Florence Italy", "Pisa Centrale": "Pisa Centrale railway station Italy", "Piazza dei Miracoli": "Piazza dei Miracoli Pisa Italy", "Leaning Tower of Pisa": "Leaning Tower of Pisa Italy", "La Spezia Centrale": "La Spezia Centrale railway station Italy", "Riomaggiore": "Riomaggiore Italy", "Manarola": "Manarola Italy", "Vernazza": "Vernazza Italy", "Venezia S. Lucia": "Venezia Santa Lucia railway station Italy", "Venezia Santa Lucia": "Venezia Santa Lucia railway station Italy", "St. Mark’s Basilica": "St Mark's Basilica Venice Italy", "St. Mark's Basilica": "St Mark's Basilica Venice Italy", "Doge’s Palace": "Doge's Palace Venice Italy", "Doge's Palace": "Doge's Palace Venice Italy", "Rialto Bridge": "Rialto Bridge Venice Italy", "B&B HOTEL Venezia Laguna": "B&B HOTEL Venezia Laguna Venice Italy", "Dobbiaco": "Dobbiaco South Tyrol Italy", "Parkhotel Bellevue": "Parkhotel Bellevue Dobbiaco Italy", "Lake Braies": "Lago di Braies South Tyrol Italy", "Lago di Braies": "Lago di Braies South Tyrol Italy", "Brixen": "Brixen South Tyrol Italy", "Bressanone": "Bressanone South Tyrol Italy", "Hotel Jarolim": "Hotel Jarolim Brixen Italy", "Val di Funes": "Val di Funes South Tyrol Italy", "Santa Maddalena": "Santa Maddalena Val di Funes Italy", "Ranui": "Ranui Val di Funes Italy", "St. Johann Church": "Chiesa di San Giovanni in Ranui Italy", "Ortisei": "Ortisei South Tyrol Italy", "Seceda": "Seceda South Tyrol Italy", "Alpe di Siusi": "Alpe di Siusi South Tyrol Italy", "Bolzano": "Bolzano South Tyrol Italy", "Milano Centrale": "Milano Centrale railway station Italy", "Milan Cathedral": "Duomo di Milano Italy", "Duomo": "Duomo di Milano Italy", "Galleria Vittorio Emanuele II": "Galleria Vittorio Emanuele II Milan Italy", "Piazza della Scala": "Piazza della Scala Milan Italy", "Brera": "Brera Milan Italy", "Hotel Osteria della Pista": "Hotel Osteria della Pista Casorate Sempione Italy"};
  const entries = Object.entries(places).sort((a,b)=>b[0].length-a[0].length);
  const root = document.querySelector('.wrap');
  if(!root) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while(walker.nextNode()){
    const n = walker.currentNode;
    if(!n.parentElement || n.parentElement.closest('a,script,style')) continue;
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