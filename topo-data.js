// (c) 2026 Sinav Provasi / Private Hire Test London. Tum haklari saklidir - All rights reserved.
// Sorular, aciklamalar ve kod ozgundur; izinsiz kopyalanamaz, yeniden yayinlanamaz.
// Harita (Topographical) - elle yazilan sorular: trafik isaretleri ve rota planlama dogru/yanlis.
// Haritali sorular (pusula, kare, sokak, yol numarasi) topo.js icinde topo-geo.js verisinden uretilir.
// Isaretler Highway Code'daki Ingiltere isaretlerinin sade cizimleri (SVG, viewBox 0 0 100 100).
(() => {
  const RED = "#c8102e", BLUE = "#005eb8";
  const ring = (fill) => `<circle cx="50" cy="50" r="44" fill="${fill}" stroke="${RED}" stroke-width="10"/>`;
  const slash = `<line x1="22" y1="22" x2="78" y2="78" stroke="${RED}" stroke-width="9"/>`;
  const svg = body => `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;

  window.TOPO_SIGNS = [
    { a: "No entry for vehicular traffic", tr: "Taşıt girişi yasak",
      svg: svg(`<circle cx="50" cy="50" r="48" fill="${RED}"/><rect x="16" y="41" width="68" height="18" fill="#fff"/>`),
      e: "Kırmızı daire içinde beyaz yatay çubuk = bu yöne GİREMEZSİNİZ. Genelde tek yönlü yolun çıkış ucunda olur. Rota çizerken bu işaretli uçtan yola girmek puan kaybettirir.",

      ee: "A red circle with a white horizontal bar means you CANNOT enter this way. It is usually at the exit end of a one-way street. If you enter the road from this end when planning a route, you lose marks." },
    { a: "No right turn", tr: "Sağa dönüş yasak",
      svg: svg(ring("#fff") + `<path d="M40 80 V50 H60" fill="none" stroke="#000" stroke-width="9"/><polygon points="58,36 76,50 58,64" fill="#000"/>` + slash),
      e: "Kırmızı çerçeveli daire = yasak. Sağa dönen ok + kırmızı çizgi = bu kavşakta sağa dönemezsiniz. Haritada yasak dönüşten geçen rota puan kaybettirir.",

      ee: "A circle with a red border means a ban. An arrow turning right with a red line through it means you cannot turn right at this junction. A route that uses a banned turn on the map loses marks." },
    { a: "No left turn", tr: "Sola dönüş yasak",
      svg: svg(ring("#fff") + `<path d="M60 80 V50 H40" fill="none" stroke="#000" stroke-width="9"/><polygon points="42,36 24,50 42,64" fill="#000"/>` + slash),
      e: "Kırmızı çerçeveli daire = yasak. Sola dönen ok + kırmızı çizgi = bu kavşakta sola dönemezsiniz.",

      ee: "A circle with a red border means a ban. An arrow turning left with a red line through it means you cannot turn left at this junction." },
    { a: "No U-turns", tr: "U dönüşü yasak",
      svg: svg(ring("#fff") + `<path d="M62 80 V46 A12 12 0 0 0 38 46 V58" fill="none" stroke="#000" stroke-width="8"/><polygon points="27,56 49,56 38,72" fill="#000"/>` + slash),
      e: "U şeklindeki ok + kırmızı çizgi = burada geri dönüş (U dönüşü) yapamazsınız. Yol boşken bile yasak.",

      ee: "A U-shaped arrow with a red line through it means you cannot make a U-turn here. It is banned even when the road is empty." },
    { a: "One-way traffic", tr: "Tek yönlü trafik",
      svg: svg(`<rect x="4" y="28" width="92" height="44" rx="4" fill="${BLUE}"/><path d="M16 50 H70" stroke="#fff" stroke-width="9"/><polygon points="66,36 88,50 66,64" fill="#fff"/>`),
      e: "Mavi dikdörtgen içinde beyaz ok = tek yönlü yol, trafik okun yönünde akar. Mavi DİKDÖRTGEN bilgi verir; mavi DAİRE ise emir verir. Haritada tek yönlü yollar okla gösterilir – okun tersine rota çizmeyin.",

      ee: "A white arrow in a blue rectangle means a one-way street, and traffic flows in the direction of the arrow. A blue RECTANGLE gives information; a blue CIRCLE gives an order. One-way streets are shown with an arrow on the map, so do not plan a route against the arrow." },
    { a: "Ahead only", tr: "Sadece ileri",
      svg: svg(`<circle cx="50" cy="50" r="46" fill="${BLUE}"/><path d="M50 82 V36" stroke="#fff" stroke-width="10"/><polygon points="34,40 50,18 66,40" fill="#fff"/>`),
      e: "Mavi daire = zorunlu (emir). Yukarı ok = sadece düz gidebilirsiniz; sağa da sola da dönemezsiniz.​‍‌⁠",

      ee: "A blue circle means a must (an order). An arrow pointing up means you can only go straight ahead; you cannot turn right or left.​‍‌⁠" },
    { a: "Turn left ahead", tr: "İleriden sola dönün (zorunlu)",
      svg: svg(`<circle cx="50" cy="50" r="46" fill="${BLUE}"/><path d="M62 82 V52 H40" fill="none" stroke="#fff" stroke-width="10"/><polygon points="44,36 22,52 44,68" fill="#fff"/>`),
      e: "Mavi daire = zorunlu. Sola kıvrılan ok = ileride sola dönmek zorundasınız. (Kırmızı çerçeve olsaydı yasak anlamına gelirdi.)",

      ee: "A blue circle means a must. An arrow curving to the left means you must turn left ahead. (With a red border it would mean a ban.)" },
    { a: "Keep left", tr: "Soldan gidin",
      svg: svg(`<circle cx="50" cy="50" r="46" fill="${BLUE}"/><path d="M70 30 L36 64" stroke="#fff" stroke-width="10"/><polygon points="24,76 30,48 52,70" fill="#fff"/>`),
      e: "Mavi daire içinde sol aşağıyı gösteren ok = engelin (refüj, ada) solundan geçin.",

      ee: "A white arrow pointing down to the left in a blue circle means keep left of the obstacle (traffic island or refuge)." },
    { a: "No stopping (Clearway)", tr: "Durmak yasak (Clearway)",
      svg: svg(`<circle cx="50" cy="50" r="44" fill="${BLUE}" stroke="${RED}" stroke-width="10"/><line x1="24" y1="24" x2="76" y2="76" stroke="${RED}" stroke-width="9"/><line x1="76" y1="24" x2="24" y2="76" stroke="${RED}" stroke-width="9"/>`),
      e: "Mavi zemin, kırmızı çerçeve ve kırmızı ÇARPI = hiç duramazsınız; yolcu indirip bindirmek için bile. Tek çizgi olsaydı 'beklemek yasak' olurdu.",

      ee: "A blue background, a red border and a red CROSS mean you cannot stop at all, even to pick up or drop off a passenger. With one line only, it would mean 'no waiting'." },
    { a: "No waiting", tr: "Beklemek yasak",
      svg: svg(`<circle cx="50" cy="50" r="44" fill="${BLUE}" stroke="${RED}" stroke-width="10"/><line x1="24" y1="24" x2="76" y2="76" stroke="${RED}" stroke-width="9"/>`),
      e: "Mavi zemin, kırmızı çerçeve ve TEK kırmızı çizgi = beklemek yasak (genelde saatleri yanındaki levhada yazar). Çarpı olsaydı 'durmak yasak' olurdu.",

      ee: "A blue background, a red border and ONE red line mean no waiting (the times are usually written on a plate next to it). With a cross, it would mean 'no stopping'." },
    { a: "Give way to traffic on the major road", tr: "Ana yoldaki trafiğe yol verin",
      svg: svg(`<polygon points="6,14 94,14 50,90" fill="#fff" stroke="${RED}" stroke-width="8" stroke-linejoin="round"/><text x="50" y="36" font-size="13" font-weight="700" text-anchor="middle" font-family="Arial">GIVE</text><text x="50" y="52" font-size="13" font-weight="700" text-anchor="middle" font-family="Arial">WAY</text>`),
      e: "Ters üçgen = yol ver. Ana yola çıkmadan önce oradaki trafiği bekleyin.",

      ee: "An upside-down triangle means give way. Wait for the traffic on the main road before you join it." },
    { a: "Stop and give way", tr: "Dur ve yol ver",
      svg: svg(`<polygon points="30,4 70,4 96,30 96,70 70,96 30,96 4,70 4,30" fill="${RED}"/><text x="50" y="60" font-size="26" font-weight="700" fill="#fff" text-anchor="middle" font-family="Arial">STOP</text>`),
      e: "Sekizgen kırmızı levha = tamamen durun, sonra yol verin. Trafik boş olsa bile durmak zorunlu.",

      ee: "A red octagonal sign means stop completely, then give way. You must stop even if there is no traffic." },
    { a: "No vehicles except bicycles being pushed", tr: "Taşıt giremez (elde itilen bisiklet hariç)",
      svg: svg(ring("#fff")),
      e: "İçi boş beyaz daire + kırmızı çerçeve = hiçbir taşıt giremez. Rota çizerken bu yoldan geçmeyin.",

      ee: "A white circle with a red border and nothing inside means no vehicles can enter. Do not plan your route through this road." }
  ];

  // Rota planlama esaslari (dogru/yanlis). Kaynak: TfL Topographical Assessment Guidelines + Highway Code.
  window.TOPO_TF = [
    { q: "You may drive the wrong way along a one-way street if it makes the route shorter.", a: false, tr: "Rota kısalıyorsa tek yönlü bir yolda ters yöne gidebilirsiniz.",
      e: "Yanlış. Haritadaki işaretlere aykırı rota (tek yön, yasak dönüş) TfL rehberine göre puan kaybettirir.",

      ee: "False. A route that goes against the signs on the map (one-way streets, banned turns) loses marks according to the TfL handbook." },
    { q: "Your route must start at the green marker and finish at the red marker.", a: true, tr: "Rotanız yeşil işaretten başlamalı ve kırmızı işarette bitmelidir.",
      e: "Doğru. Yeşil = başlangıç, kırmızı = varış. Yanlış yerde başlamak ya da bitirmek puan kaybettirir.",

      ee: "True. Green is the start and red is the finish. Starting or ending in the wrong place loses marks." },
    { q: "Planning the route from the red marker to the green marker is acceptable.", a: false, tr: "Rotayı kırmızı işaretten yeşil işarete doğru çizmek kabul edilir.",
      e: "Yanlış. Rotayı ters çizmek (varıştan başlangıca) TfL rehberinde puan kaybettiren hatalardan biri olarak yazıyor.",

      ee: "False. Drawing the route the wrong way round (from the finish to the start) is listed in the TfL handbook as one of the mistakes that lose marks." },
    { q: "If the question says a road is closed, your route must not use any part of that road.", a: true, tr: "Soru bir yolun kapalı olduğunu söylüyorsa rotanız o yolun hiçbir kısmını kullanmamalıdır.",
      e: "Doğru. Sınavdaki üç rota sorusundan biri yol kapatmalıdır. Soruyu dikkatle okuyun ve kapalı yolu tamamen atlayın.",

      ee: "True. One of the three route questions in the exam includes a road closure. Read the question carefully and avoid the closed road completely." },
    { q: "A 'No right turn' sign at a junction means you cannot turn right there.", a: true, tr: "Bir kavşaktaki 'Sağa dönüş yasak' işareti orada sağa dönemeyeceğiniz anlamına gelir.",
      e: "Doğru. Yasaklı bir dönüşü kullanan rota puan kaybettirir.",

      ee: "True. A route that uses a banned turn loses marks." },
    { q: "You may make a U-turn where a 'No U-turns' sign is shown if the road is empty.", a: false, tr: "Yol boşsa 'U dönüşü yasak' işareti olan yerde U dönüşü yapabilirsiniz.",
      e: "Yanlış. Yasak her zaman geçerlidir; trafiğin olup olmaması fark etmez.",

      ee: "False. A ban always applies. It makes no difference whether there is traffic or not." },
    { q: "On most maps, north is at the top of the page.", a: true, tr: "Çoğu haritada kuzey sayfanın üst tarafındadır.",
      e: "Doğru. Yukarı = kuzey, aşağı = güney, sağ = doğu, sol = batı.",

      ee: "True. Up is north, down is south, right is east and left is west." },
    { q: "On a map, east is to the left.", a: false, tr: "Haritada doğu sol taraftadır.",
      e: "Yanlış. Doğu SAĞ taraftadır, batı sol. Hatırlama yolu: saat yönünde Kuzey–Doğu–Güney–Batı (N–E–S–W).​‍‌⁠",

      ee: "False. East is on the RIGHT and west is on the left. A way to remember: clockwise it is North, East, South, West (N-E-S-W).​‍‌⁠" },
    { q: "North-west is between north and west.", a: true, tr: "Kuzeybatı, kuzey ile batının arasındadır.",
      e: "Doğru. Haritada sol üst köşe yönü = kuzeybatı (North-west).",

      ee: "True. The top left corner of the map is the north-west direction." },
    { q: "South-east is the opposite direction to north-west.", a: true, tr: "Güneydoğu, kuzeybatının tam tersi yöndür.",
      e: "Doğru. Sol üst (kuzeybatı) ile sağ alt (güneydoğu) birbirinin tersidir.",

      ee: "True. Top left (north-west) and bottom right (south-east) are opposite to each other." },
    { q: "The most direct route avoids unnecessary detours and going back on yourself.", a: true, tr: "En direkt rota gereksiz sapmalardan ve geri dönmekten kaçınır.",
      e: "Doğru. 'En direkt rotayı izlememek' TfL rehberinde puan kaybettiren hatalardan biridir.",

      ee: "True. 'Not following the most direct route' is one of the mistakes that lose marks in the TfL handbook." },
    { q: "A pedestrianised street can be used as part of your driving route.", a: false, tr: "Yayalara ayrılmış bir sokak araç rotanızın bir parçası olarak kullanılabilir.",
      e: "Yanlış. Yaya yolları araç trafiğine kapalıdır; rotanız yalnızca araçların kullanabileceği yollardan geçmeli.",

      ee: "False. Footpaths are closed to vehicle traffic. Your route must only use roads that vehicles can use." },
    { q: "Arrows on a road on the map can show that traffic may only travel in one direction.", a: true, tr: "Haritada bir yolun üzerindeki oklar trafiğin yalnızca tek yönde gidebileceğini gösterebilir.",
      e: "Doğru. Haritada tek yönlü yollar okla gösterilir. Rota çizmeden önce yolunuzdaki okları kontrol edin.",

      ee: "True. One-way streets are shown with an arrow on the map. Check the arrows on your road before you plan a route." },
    { q: "Route-planning questions carry the most marks in the topographical assessment.", a: true, tr: "Rota planlama soruları harita sınavında en çok puanı taşır.",
      e: "Doğru. 100 puanın 66'sı üç rota sorusundan gelir; kalan 34 puan çoktan seçmeli sorulardandır.",

      ee: "True. 66 of the 100 marks come from the three route questions. The other 34 marks come from the multiple-choice questions." },
    { q: "The pass mark for the topographical assessment is 50%.", a: false, tr: "Harita sınavının geçme notu %50'dir.",
      e: "Yanlış. Geçme notu %60 veya üstüdür.",

      ee: "False. The pass mark is 60% or higher." },
    { q: "In the multiple-choice section, some questions can have two correct answers.", a: true, tr: "Çoktan seçmeli bölümde bazı soruların iki doğru cevabı olabilir.",
      e: "Doğru. TfL rehberi: bazı sorular tek, bazıları iki cevaplıdır; soruda açıkça yazar. Soruyu dikkatle okuyun.",

      ee: "True. The TfL handbook says that some questions have one answer and some have two answers. The question says this clearly. Read the question carefully." },
    { q: "There are three route-planning questions: a short route, a short route with a road closure, and a long route.", a: true, tr: "Üç rota sorusu vardır: kısa rota, yol kapatmalı kısa rota ve uzun rota.",
      e: "Doğru. TfL rehberinde bu üç soru tipi tek tek yazıyor.",

      ee: "True. The TfL handbook lists these three question types one by one." },
    { q: "Before you start drawing, it is a good idea to find both the start and the end point on the map.", a: true, tr: "Çizmeye başlamadan önce hem başlangıç hem varış noktasını haritada bulmak iyi bir fikirdir.",
      e: "Doğru. Önce iki noktayı ve aradaki ana yolları görün, tek yönleri ve kapalı yolu kontrol edin, sonra çizin.",

      ee: "True. First find the two points and the main roads between them. Check the one-way streets and the closed road, then draw your route." },
    { q: "A blue circular sign gives an order, and a red-edged circular sign tells you what you must not do.", a: true, tr: "Mavi daire işaret emir verir, kırmızı çerçeveli daire işaret ne yapmamanız gerektiğini söyler.",
      e: "Doğru. Mavi daire = zorunlu (ör. sadece ileri). Kırmızı çerçeveli daire = yasak (ör. sağa dönüş yasak).",

      ee: "True. A blue circle means a must (for example, ahead only). A circle with a red border means a ban (for example, no right turn)." },
    { q: "If a road is closed, you may still drive along it for a short distance to reach your destination.", a: false, tr: "Bir yol kapalıysa varış yerinize ulaşmak için kısa bir mesafe yine de o yolda gidebilirsiniz.",
      e: "Yanlış. Soruda kapalı denen yol rotanızda hiç olmamalı – kısa bir parçası bile.",

      ee: "False. The road that the question says is closed must not be on your route at all, not even a short part of it." }
  ];
})();
