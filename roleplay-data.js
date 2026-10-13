// B1 Konusma - Bolum 2: rol yapma. Gorevli yolcuyu, aday soforu oynar.
// Yapay zeka yok: gorevlinin replikleri sabit, bu yuzden her replik adayin onceki cevabindan bagimsiz anlamli olmali.
// card = adaya ekranda gosterilen Turkce rol karti; intro = gorevlinin durumu anlattigi giris (ilk replikle birlikte okunur);
// lines = [gorevlinin repligi, ornek sofor cevabi]. Ornek cevaplar kural iddiasinda el kitabina uygun.
window.ROLEPLAYS = [
  { card: "Siz şoförsünüz. Dün bir yolcu telefonunu arabanızda unuttu, siz de telefonu operatörünüze teslim ettiniz. Yolcu sizi arıyor. Telefonu bulduğunuzu söyleyin ve nasıl geri alabileceğini açıklayın.",
    intro: "Here is the situation. Yesterday I travelled in your car, and I think I left my phone on the back seat. I am calling you. Let's begin.",
    lines: [
      ["Hello. I was in your car yesterday evening, and I think I left my phone on the back seat. Did you find it?",
       "Hello. Yes, I found a phone on the back seat after your journey. I gave it to my operator, so it's safe at their office."],
      ["Oh, that's great! How can I get it back?",
       "You can contact my operator and they will arrange it with you. I can give you their phone number now."],
      ["Thank you. Is there anything I need to bring?",
       "Please bring some ID, and be ready to describe the phone, for example its colour and its case, so they know it's yours."]
    ] },
  { card: "Siz şoförsünüz. Saat öğleden sonra 3 ve kırmızı rotadasınız. Yolcu bankamatik için durup beklemenizi istiyor. Kibarca neden bekleyemeyeceğinizi açıklayın ve bir çözüm önerin.",
    intro: "Here is the situation. I am your passenger. It is three o'clock in the afternoon, and we are driving along a busy red route. Let's begin.",
    lines: [
      ["Excuse me, could you stop here for a few minutes? I need to use that cashpoint.",
       "I'm sorry, but I can't wait here. This is a red route, and I'm not allowed to wait on it at this time of day."],
      ["Oh, really? But it will only take two minutes.",
       "I understand, but I could get a penalty. There's a car park around the corner. I can stop there and wait for you."],
      ["Okay, that's fine. Thank you for explaining.",
       "You're welcome. We'll be there in a minute, and then you can take your time."]
    ] },
  { card: "Siz şoförsünüz. Yolcu yanlış yoldan gittiğinizi düşünüyor. Sakin kalın, bu yolu neden seçtiğinizi açıklayın, ücret ve süre hakkında bilgi verin.",
    intro: "Here is the situation. I am your passenger, and I think you are taking a long route. Let's begin.",
    lines: [
      ["Excuse me, why are we going this way? I usually go along the main road.",
       "That's a good question. There's been an accident on the main road, so the traffic is very heavy. This way is quicker today."],
      ["Will this make the journey more expensive?",
       "No, the fare was agreed with my operator before the journey. If anything changes, I'll tell my operator straight away."],
      ["Alright. How long will it take to get there?",
       "About fifteen minutes, depending on the traffic. I'll let you know if there are any delays."]
    ] },
  { card: "Siz şoförsünüz. King's Cross'a gidiyorsunuz ama yolcu varış yerini değiştirmek istiyor. Kabul edin, operatöre bildireceğinizi ve ücretin değişebileceğini söyleyin.",
    intro: "Here is the situation. I am your passenger. We are going to King's Cross Station, but my plans have changed. Let's begin.",
    lines: [
      ["Sorry, I've just had a message. Can we go to Paddington Station instead?",
       "Yes, of course, that's no problem. I just need to tell my operator about the new destination first."],
      ["Will the fare change?",
       "It might change a little, because it's a different journey. My operator will update the fare and let you know."],
      ["Okay. And can you drop me at the main entrance?",
       "Yes, I'll stop as close to the main entrance as I safely can, right next to the kerb."]
    ] },
  { card: "Siz şoförsünüz. Rehber köpekli, görme engelli bir yolcu sizi arıyor. Köpeğin gelebileceğini, nerede oturacağını ve yolcuya nasıl yardım edeceğinizi söyleyin.",
    intro: "Here is the situation. I am a passenger with a guide dog, and I'm calling you before you pick me up. Let's begin.",
    lines: [
      ["Hello, I've booked a car with your company. Is it okay if my guide dog travels with me?",
       "Hello. Yes, of course. Your guide dog is very welcome, and there's no extra charge."],
      ["Where will the dog sit during the journey?",
       "The dog can sit in the footwell next to you, so it stays close to you for the whole journey."],
      ["That's great. I can't see very well. How will I find your car?",
       "Don't worry. When I arrive, I'll call you and come to your door. You can hold my arm, and I'll guide you to the car."]
    ] },
  { card: "Siz şoförsünüz. Heathrow'da yolcu almaya geldiniz ve resmî otoparktaki yolcu alış noktasında bekliyorsunuz. Yolcu terminal önünden sizi arıyor. Nerede olduğunuzu açıklayın ve yolu tarif edin.",
    intro: "Here is the situation. I have just landed at Heathrow Airport, and you are picking me up. I am calling you. Let's begin.",
    lines: [
      ["Hi, I've just landed, and I'm waiting outside the terminal. Where are you?",
       "Hello, and welcome to London. I'm waiting at the pick-up point in the official car park, because I'm not allowed to wait outside the terminal."],
      ["Oh, okay. How do I get there?",
       "Just follow the signs for the car park. It's only a short walk. I'll meet you at the entrance, and I'll be wearing my driver's badge."],
      ["I have two big suitcases. Will they fit in your car?",
       "Yes, there's plenty of space in the boot, and I'll help you put them in."]
    ] },
  { card: "Siz şoförsünüz. Yolculuk sırasında yolcu kendini kötü hissetmeye başlıyor. Güvenli bir yerde durun, yardım teklif edin ve yolculuğa nasıl devam edeceğinizi konuşun.",
    intro: "Here is the situation. I am your passenger, and during the journey I start to feel unwell. Let's begin.",
    lines: [
      ["Sorry, I don't feel very well. I think I'm going to be sick.",
       "Oh, I'm sorry to hear that. Let me find a safe place to stop. Please hold on for a moment."],
      ["Thank you. Could you open the window, please?",
       "Yes, of course. I'll open the window for you. Just tell me if you need anything else."],
      ["I feel a bit better now. Can we continue slowly?",
       "Of course. I'll drive slowly and carefully. Please tell me if you need to stop again."]
    ] },
  { card: "Siz şoförsünüz. Yolcu arabada sigara içmek istiyor. Kibarca izin vermeyin ve bir alternatif önerin.",
    intro: "Here is the situation. I am your passenger, and I would like to smoke during the journey. Let's begin.",
    lines: [
      ["Do you mind if I smoke in the car? I'll open the window.",
       "I'm sorry, but smoking isn't allowed in the car. You can see the no smoking sign here."],
      ["Oh, come on. Just one cigarette. Nobody will know.",
       "I understand, but I can't allow it. If you really need a cigarette, I can stop somewhere safe for a few minutes."],
      ["No, it's okay. Let's just carry on.",
       "Thank you for understanding. We'll arrive in about twenty minutes."]
    ] },
  { card: "Siz şoförsünüz. Yolcunun evinin önündesiniz ama orada sarı çizgi var. Yolcu 10 dakika gecikeceğini söylüyor. Orada neden bekleyemeyeceğinizi açıklayın ve bir çözüm önerin.",
    intro: "Here is the situation. You are outside my building to pick me up, but I am late. I am calling you. Let's begin.",
    lines: [
      ["Hi, it's your passenger. I'm really sorry, but I'm running about ten minutes late.",
       "Hello, no problem. Thanks for letting me know. I can't wait outside your building because of the yellow lines, so I'll wait nearby."],
      ["Can't you just wait outside my building?",
       "I'm afraid not. I could get a fine if I wait there. Please call me when you're ready, and I'll come straight to you."],
      ["Okay, I'll call you as soon as I'm ready. See you soon.",
       "Great, see you soon. Take your time."]
    ] }
];
