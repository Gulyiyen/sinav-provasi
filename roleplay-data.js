// B1 Konusma - Bolum 2: rol yapma. Gercek sinavda (LanguageCert Practice Paper 3) iki durum var:
//   1) gorevli baslatir ("I start.") - ROLEPLAYS; 2) ADAY baslatir ("You start.") - ROLEPLAYS_B.
// Gercek sinavin durumlari gunluk hayattan (turist, arkadas, komsu, mudur, garson...); sofor durumlari ek pratik.
// Yapay zeka yok: gorevlinin replikleri sabit, bu yuzden her replik adayin onceki cevabindan bagimsiz anlamli olmali.
// card = adaya ekranda gosterilen Turkce rol karti; intro = gorevlinin durumu anlattigi giris (ilk replikle birlikte okunur);
// lines = [gorevlinin repligi, ornek sofor cevabi]. Ornek cevaplar kural iddiasinda el kitabina uygun.
window.ROLEPLAYS = [
  { card: "Siz şoförsünüz. Dün bir yolcu telefonunu arabanızda unuttu, siz de telefonu operatörünüze teslim ettiniz. Yolcu sizi arıyor. Telefonu bulduğunuzu söyleyin ve nasıl geri alabileceğini açıklayın.",
    cardEn: "You are a driver. Yesterday a passenger left their phone in your car and you gave it to your operator. The passenger calls you. Say you found the phone and explain how they can get it back.",
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
    cardEn: "You are a driver. It is 3 pm and you are on a red route. The passenger asks you to stop and wait while they use a cash machine. Politely explain why you cannot wait and suggest a solution.",
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
    cardEn: "You are a driver. The passenger thinks you are going the wrong way. Stay calm, explain why you chose this road, and give information about the fare and the journey time.",
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
    cardEn: "You are a driver. You are going to King's Cross, but the passenger wants to change the destination. Agree, and say that you will tell your operator and that the fare may change.",
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
    cardEn: "You are a driver. A passenger who is blind and has a guide dog calls you. Say that the dog can come, tell them where it will sit and explain how you will help the passenger.",
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
    cardEn: "You are a driver. You have come to pick up a passenger at Heathrow and you are waiting at the pick-up point in the official car park. The passenger calls you from the front of the terminal. Explain where you are and give directions.",
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
    cardEn: "You are a driver. During the journey the passenger starts to feel unwell. Stop in a safe place, offer help and talk about how you will continue the journey.",
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
    cardEn: "You are a driver. A passenger wants to smoke in your car. Politely say no and suggest an alternative.",
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
    cardEn: "You are a driver. You are outside the passenger's home, but there is a yellow line there. The passenger says they will be 10 minutes late. Explain why you cannot wait there and suggest a solution.",
    intro: "Here is the situation. You are outside my building to pick me up, but I am late. I am calling you. Let's begin.",
    lines: [
      ["Hi, it's your passenger. I'm really sorry, but I'm running about ten minutes late.",
       "Hello, no problem. Thanks for letting me know. I can't wait outside your building because of the yellow lines, so I'll wait nearby."],
      ["Can't you just wait outside my building?",
       "I'm afraid not. I could get a fine if I wait there. Please call me when you're ready, and I'll come straight to you."],
      ["Okay, I'll call you as soon as I'm ready. See you soon.",
       "Great, see you soon. Take your time."]
    ] },
  // --- Gunluk durumlar (gercek sinavdaki gibi), gorevli baslatir ---
  { card: "Siz kendi şehrinizdesiniz. Görevli yolunu kaybetmiş bir turist. Ona en yakın istasyona nasıl gideceğini anlatın.",
    cardEn: "You are in your own city. The examiner is a tourist who is lost. Tell them how to get to the nearest station.",
    intro: "I'm a tourist in your town. I start.",
    lines: [
      ["Excuse me, can you tell me how to get to the nearest station, please?",
       "Yes, of course. Go straight along this road, then turn left at the traffic lights. The station is on your right, opposite the bank."],
      ["Thank you. Is it far to walk?",
       "No, not really. It's about ten minutes on foot. If you're tired, you can take the number 38 bus from the stop over there."]
    ] },
  { card: "Görevli arkadaşınız. Sizi pazar günkü bir futbol maçına davet ediyor. Cevap verin ve buluşmayı planlayın.",
    cardEn: "The examiner is your friend. They invite you to a football match on Sunday. Reply and plan where to meet.",
    intro: "We're friends. I start.",
    lines: [
      ["I've got two tickets for a football match on Sunday. Would you like to come with me?",
       "Oh, I'd love to, thank you! I haven't been to a match for a long time. What time does it start?"],
      ["It starts at three. Shall we meet at the station or at the stadium?",
       "Let's meet at the station at two o'clock. Then we can get something to eat before the match."]
    ] },
  { card: "Görevli komşunuz. Tatile gidiyor ve bitkilerini sulamanızı istiyor. Cevap verin.",
    cardEn: "The examiner is your neighbour. They are going on holiday and ask you to water their plants. Reply.",
    intro: "We're neighbours. I start.",
    lines: [
      ["I'm going on holiday next week. Could you water my plants while I'm away?",
       "Yes, of course, no problem. How often do they need water? I don't want to give them too much."],
      ["Thank you so much! I'll leave my key with you. Is Friday evening okay?",
       "Friday evening is fine. I'll be home after six o'clock. Have a lovely holiday!"]
    ] },
  { card: "Görevli müdürünüz. Cumartesi fazladan çalışmanızı istiyor ama sizin planınız var. Kibarca cevap verin.",
    cardEn: "The examiner is your manager. They ask you to work extra hours on Saturday, but you have plans. Reply politely.",
    intro: "I'm your manager at work. I start.",
    lines: [
      ["We're very busy this week. Could you work an extra shift on Saturday?",
       "I'm sorry, but I can't on Saturday, because it's my son's birthday and we're having a party. I could work another day, though."],
      ["I understand. What about Sunday morning instead?",
       "Yes, Sunday morning is fine. I can start at eight o'clock and stay until two, if that helps."]
    ] },
  { card: "Görevli arkadaşınız. Yorgun göründüğünüzü söylüyor. Neden yorgun olduğunuzu anlatın.",
    cardEn: "The examiner is your friend. They say you look tired. Explain why you are tired.",
    intro: "We're friends. I start.",
    lines: [
      ["You look really tired. Are you okay?",
       "I'm okay, thanks, just very tired. I worked late every night this week, and I didn't sleep well."],
      ["Why don't you take a few days off?",
       "That's a good idea. Maybe I'll take Friday off and have a long weekend. I really need some rest."]
    ] },
  { card: "Görevli iş arkadaşınız. Ehliyet almayı düşünüyor ve fikrinizi soruyor. Cevap verin.",
    cardEn: "The examiner is a colleague. They are thinking about getting a driving licence and ask for your opinion. Reply.",
    intro: "We work together. I start.",
    lines: [
      ["I'm thinking of learning to drive. Do you think it's a good idea?",
       "Yes, I think it's a great idea. You can go wherever you want, and it's very useful when you have a family."],
      ["How long did it take you to learn?",
       "It took me about six months. I had a lesson every week, and I practised with my brother at the weekends."]
    ] }
];

// --- ADAY BASLATIR ("You start."): gorevli durumu anlatir ve susar; ilk sozu aday soyler ---
// lines[0][0] = gorevlinin durum cumlesi (konusmayi aday baslatir), lines[1][0] = gorevlinin cevabi.
window.ROLEPLAYS_B = [
  { card: "Görevli dişçinin resepsiyonisti. Siz randevu almak için arıyorsunuz. Konuşmayı SİZ başlatın.",
    cardEn: "The examiner is a receptionist at a dentist's. You are calling to make an appointment. YOU start the conversation.",
    lines: [
      ["I'm the receptionist at a dentist's. You're calling to make an appointment. You start.",
       "Hello, I'd like to make an appointment with the dentist, please. I've had a toothache for two days."],
      ["Oh, I'm sorry to hear that. Is it very painful, or can you wait until next week?",
       "It's quite painful, so I'd like to come as soon as possible. Do you have anything tomorrow morning?"]
    ] },
  { card: "Görevli bir restoranda garson. Çorbanız soğuk geldi. Konuşmayı SİZ başlatın.",
    cardEn: "The examiner is a waiter in a restaurant. Your soup has arrived cold. YOU start the conversation.",
    lines: [
      ["I'm a waiter in a restaurant. Your soup is cold. You start.",
       "Excuse me, I'm sorry, but my soup is cold. Could you warm it up, please?"],
      ["Oh, I'm so sorry about that. Would you like me to bring you a new one?",
       "Yes, please, that would be great. And could I have some more bread too, please?"]
    ] },
  { card: "Görevli komşunuz. Raf takmak için matkabını ödünç istiyorsunuz. Konuşmayı SİZ başlatın.",
    cardEn: "The examiner is your neighbour. You want to borrow their drill to put up a shelf. YOU start the conversation.",
    lines: [
      ["We're neighbours. You want to borrow my drill. You start.",
       "Hi, sorry to bother you. Could I borrow your drill, please? I want to put up some shelves in my kitchen."],
      ["Sure, no problem. When do you need it?",
       "This afternoon, if that's okay. I'll bring it back this evening. Thank you very much!"]
    ] },
  { card: "Görevli müdürünüz. Çocuğunuz hasta olduğu için yarın işe gelemeyeceksiniz. Konuşmayı SİZ başlatın.",
    cardEn: "The examiner is your manager. Your child is ill, so you cannot come to work tomorrow. YOU start the conversation.",
    lines: [
      ["I'm your manager. You can't come to work tomorrow, because your child is ill. You start.",
       "Hello, I'm sorry, but I can't come to work tomorrow. My daughter is ill, and I need to take her to the doctor."],
      ["Oh, I'm sorry to hear that. Do you think you'll be back on Thursday?",
       "I hope so. If she feels better, I'll come on Thursday. I'll call you tomorrow evening to let you know."]
    ] },
  { card: "Görevli bir mağazada satış görevlisi. Küçük gelen bir ceketi iade etmek istiyorsunuz. Konuşmayı SİZ başlatın.",
    cardEn: "The examiner is a shop assistant in a shop. You want to return a jacket that is too small. YOU start the conversation.",
    lines: [
      ["I'm a shop assistant. You want to return a jacket, because it's too small. You start.",
       "Hello. I bought this jacket last week, but it's too small for me. Can I return it, please?"],
      ["No problem. Have you got the receipt?",
       "Yes, here it is. Actually, could I change it for a bigger size instead of getting my money back?"]
    ] },
  { card: "Siz şoförsünüz, yolcunun evinin önüne geldiniz ama yolcu dışarıda değil. Onu arıyorsunuz. Konuşmayı SİZ başlatın.",
    cardEn: "You are a driver. You have arrived outside the passenger's home, but the passenger is not outside. You call them. YOU start the conversation.",
    lines: [
      ["I'm your passenger. You've arrived outside my house, but I'm not outside. You call me. You start.",
       "Hello, this is your driver from the cab company. I've arrived outside your house. I'm in a black Toyota."],
      ["Oh, sorry! I'm just finishing my breakfast. Can you wait five minutes?",
       "Yes, that's fine, but I can't wait here because of the yellow lines. I'll wait around the corner. Please call me when you're ready."]
    ] },
  { card: "Siz şoförsünüz; yolculuk sırasında yakıt almak için durmanız gerekiyor. Yolcuya söyleyin. Konuşmayı SİZ başlatın.",
    cardEn: "You are a driver. During the journey you need to stop to get fuel. Tell the passenger. YOU start the conversation.",
    lines: [
      ["I'm your passenger. You need to stop for fuel during the journey. You start.",
       "Excuse me, I'm sorry, but I need to stop for fuel. There's a petrol station just ahead. It will only take a few minutes."],
      ["Oh, okay. Will this make me late for my train?",
       "No, don't worry. We have plenty of time. Your train is at four, and we'll arrive at the station at about half past three."]
    ] },
  { card: "Görevli arkadaşınız. Onu cumartesi akşamı evinize yemeğe davet etmek istiyorsunuz. Konuşmayı SİZ başlatın.",
    cardEn: "The examiner is your friend. You want to invite them to dinner at your home on Saturday evening. YOU start the conversation.",
    lines: [
      ["We're friends. You want to invite me to dinner at your house on Saturday. You start.",
       "Hi! Are you free on Saturday evening? I'd like to invite you to dinner at my house. I'm going to cook Turkish food."],
      ["Oh, I'd love to! What time should I come?",
       "Come at about seven o'clock. You don't need to bring anything, just come hungry!"]
    ] }
];
