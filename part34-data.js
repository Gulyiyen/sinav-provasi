// (c) 2026 Sinav Provasi / Private Hire Test London. Tum haklari saklidir - All rights reserved.
// Sorular, aciklamalar ve kod ozgundur; izinsiz kopyalanamaz, yeniden yayinlanamaz.
// B1 Konusma - Bolum 3 ve 4. Format: LanguageCert TfL Qualification Handbook + Practice Paper 3 (icerik OZGUN, kopya degil).
// Bolum 3: gorev kagidi (5 resimli secenek + "Anything else?") uzerinden birlikte karar verme.
//   Yapay zeka yok: gorevlinin replikleri adayin cevabindan bagimsiz anlamli olmali. lines = [gorevli, ornek cevap].
// Bolum 4A: gorevli kisa bir konusmayi IKI KEZ okur, sonra ekranda yazili 3 soruyu sorar. kw = cevapta aranacak kelime gruplari.
// Bolum 4B: konu verilir, 30 sn hazirlik, 1,5 dk kesintisiz konusma, sonra takip sorulari.
window.PART3 = [
  { tr: "Bir misafiri yarım günlük Londra turuna götüreceksiniz. Hangi yerlere gideceğinize birlikte karar verin.", en: "You are taking a visitor on a half-day trip around London. Decide together which places to go to.",
    intro: "We want to take a visitor on a half-day trip around London, but we haven't decided where to go. Here are some ideas. Let's ask and answer questions to help us decide. I'll start.",
    title: "Places to visit",
    items: [["🏰", "Tower of London"], ["🛍️", "Camden Market"], ["🌳", "Greenwich Park"], ["🏛️", "British Museum"], ["⛴️", "Boat trip on the Thames"]],
    lines: [
      ["I think the boat trip on the Thames is a good idea, because our visitor can see a lot of famous places in a short time. What do you think?",
       "I agree, it's a good idea. It's relaxing, and you can see Tower Bridge and the London Eye from the river. But it can be cold, so it's better on a sunny day."],
      ["That's true. What about the British Museum? Do you think our visitor would enjoy it?",
       "Maybe, if they like history. It's free, which is great. But it's very big, so in half a day we can only see a small part of it."],
      ["We only have time for two places. Which two should we choose?",
       "I think we should choose the boat trip and Camden Market. The boat trip shows the famous places, and Camden Market is fun, with lots of street food for lunch."]
    ] },
  { tr: "İşten ayrılan bir iş arkadaşınıza veda hediyesi alacaksınız. Hangi hediyeyi alacağınıza birlikte karar verin.", en: "A colleague is leaving the company. You are going to buy a goodbye present. Decide together which present to buy.",
    intro: "A colleague is leaving our company next week, and we want to buy a goodbye present. Here are some ideas. Let's ask and answer questions to help us decide. I'll start.",
    title: "A goodbye present",
    items: [["⌚", "A watch"], ["💐", "Flowers"], ["🍽️", "A restaurant voucher"], ["📚", "A book"], ["🎭", "Theatre tickets"]],
    lines: [
      ["I think a watch is a nice present, because our colleague can keep it for a long time. What do you think?",
       "It's a nice idea, but a good watch is quite expensive. Also, people have different tastes, so it's difficult to choose the right one."],
      ["Good point. What about flowers? Are they a good idea?",
       "Flowers are lovely, but they only last a few days. I think we should give something more special, because she has worked with us for a long time."],
      ["So, which present should we choose in the end?",
       "I think a restaurant voucher is the best choice. She can choose the restaurant she likes and go with her family, so it's a nice memory."]
    ] },
  { tr: "Bir arkadaşınızın doğum günü için ne yapacağınıza birlikte karar verin.", en: "Decide together what to do for a friend's birthday.",
    intro: "It's our friend's birthday on Saturday, and we want to organise something special. Here are some ideas. Let's ask and answer questions to help us decide. I'll start.",
    title: "A birthday celebration",
    items: [["🍕", "A meal in a restaurant"], ["🎳", "Bowling"], ["🎬", "The cinema"], ["🧺", "A picnic in the park"], ["🎤", "Karaoke"]],
    lines: [
      ["I think bowling could be really fun, because everyone can play together. What do you think?",
       "Yes, I like that idea. Bowling is fun even if you're not good at it. And after bowling, we can eat something together."],
      ["What about a picnic in the park? Is that a good idea?",
       "It's a nice idea, but the weather in London is difficult to predict. If it rains, the picnic will be ruined, so I think it's a bit risky."],
      ["Okay. So what should we do on Saturday?",
       "Let's go bowling in the afternoon and then have a meal in a restaurant. That way we can play, talk and celebrate together."]
    ] },
  { tr: "Yerel yönetim bölgenizi geliştirmek istiyor. En önemli değişikliğin hangisi olduğuna birlikte karar verin.", en: "The local council wants to improve your area. Decide together which change is the most important.",
    intro: "The local council wants to improve our area, but it only has money for one or two changes. Here are some ideas. Let's ask and answer questions to help us decide. I'll start.",
    title: "Improving our area",
    items: [["🌳", "More parks"], ["🚲", "Cycle lanes"], ["🏋️", "A sports centre"], ["📚", "A new library"], ["🚌", "More buses"]],
    lines: [
      ["I think more buses would help a lot of people, because many people don't have a car. What do you think?",
       "I agree. More buses would help older people and students. It would also mean fewer cars on the road, so less traffic and pollution."],
      ["And what about a sports centre? Do you think people would use it?",
       "Yes, I think so, especially young people. It's good for their health, and it gives them something to do in the evening."],
      ["We can only choose one or two. Which ones are the most important?",
       "In my opinion, more buses and a sports centre are the most important. The buses help everyone, and the sports centre is great for young people."]
    ] },
  { tr: "Aileyle hafta sonu bir gün dışarı çıkacaksınız. Nereye gideceğinize birlikte karar verin.", en: "You are going out for a day at the weekend with your family. Decide together where to go.",
    intro: "We're planning a day out with our families next weekend. Here are some ideas. Let's ask and answer questions to help us decide where to go. I'll start.",
    title: "A family day out",
    items: [["🦁", "The zoo"], ["🏖️", "The seaside"], ["🏛️", "A museum"], ["🏊", "A swimming pool"], ["🎢", "A theme park"]],
    lines: [
      ["I think the zoo is a great idea, because children love animals. What do you think?",
       "Yes, children usually love the zoo. But the tickets are quite expensive for a big family, so we need to think about the cost."],
      ["What about the seaside? Would that be good?",
       "The seaside is wonderful in summer. The children can play on the beach, and it's cheap. But it takes a long time to get there from London."],
      ["So where should we go in the end?",
       "I think we should go to the seaside if the weather is good. If it's raining, we can go to a museum instead, because many museums are free."]
    ] },
  { tr: "Şoför olarak arabanızda yolcular için ne bulunduracağınıza birlikte karar verin.", en: "You are a driver. Decide together what to have in your car for passengers.",
    intro: "We are both private hire drivers, and we want to keep some useful things in the car for our passengers. Here are some ideas. Let's ask and answer questions to help us decide. I'll start.",
    title: "Things for passengers",
    items: [["🔌", "A phone charger"], ["💧", "Bottles of water"], ["🧻", "Tissues"], ["☂️", "An umbrella"], ["🩹", "A first aid kit"]],
    lines: [
      ["I think a phone charger is really useful, because many passengers have low batteries. What do you think?",
       "I agree. A lot of passengers ask for a charger, especially at night. It's cheap, and it makes them happy, so they often give a good rating."],
      ["What about bottles of water? Are they necessary?",
       "They're nice on long journeys, like to the airport, especially in summer. But we need to keep the car clean, so I would only offer them on long trips."],
      ["If we choose only two things, which ones should we keep?",
       "I would keep a phone charger and a first aid kit. The charger is useful every day, and the first aid kit is important for safety."]
    ] },
  { tr: "Birlikte yeni bir hobiye başlamak istiyorsunuz. Hangisini seçeceğinize birlikte karar verin.", en: "You want to start a new hobby together. Decide together which one to choose.",
    intro: "We both want to start a new hobby together this year. Here are some ideas. Let's ask and answer questions to help us decide. I'll start.",
    title: "A new hobby",
    items: [["🎸", "Guitar lessons"], ["🍳", "A cooking class"], ["🏋️", "Going to the gym"], ["📷", "Photography"], ["🌱", "Gardening"]],
    lines: [
      ["I think a cooking class sounds interesting, because we can learn something useful for every day. What do you think?",
       "That's a good idea. I'd like to learn to cook healthy food, and we can eat what we make, so it's fun and useful."],
      ["What about going to the gym? Would you enjoy that?",
       "The gym is good for our health, especially for drivers, because we sit all day. But some people find it boring, so it's important to go with a friend."],
      ["So, which hobby should we start?",
       "Let's start with the cooking class. It's sociable and useful. And maybe later we can go to the gym together at the weekends too."]
    ] },
  { tr: "İş yerindeki ekibiniz için yıl sonu eğlencesi düzenleyeceksiniz. Ne yapacağınıza birlikte karar verin.", en: "You are organising an end-of-year event for your team at work. Decide together what to do.",
    intro: "We're organising an end-of-year night out for our team at work. Here are some ideas. Let's ask and answer questions to help us decide. I'll start.",
    title: "A team night out",
    items: [["🍽️", "A restaurant"], ["⚽", "A football match"], ["😂", "A comedy show"], ["🔐", "An escape room"], ["⛴️", "A boat party"]],
    lines: [
      ["I think a restaurant is a safe choice, because everyone likes food and we can talk. What do you think?",
       "Yes, a restaurant is easy to organise, and everyone can choose what they want. But we need to book early, because December is very busy."],
      ["What about an escape room? Do you think the team would like it?",
       "I think it would be fun, because we have to work together as a team. But some people don't like small rooms, so we should ask them first."],
      ["Okay, so what's our final decision?",
       "Let's do an escape room in the early evening and then go to a restaurant. That way it's fun and relaxing, and everyone can join in."]
    ] }
];
window.PART3_CLOSE = "Okay, that sounds like a good plan. Thank you.";

window.PART4A = [
  { who: "Sam", about: "his Saturday mornings",
    text: "Hi, I'm Sam. Every Saturday morning I go to a street market near my flat in South London. I usually get there at about nine o'clock, before it gets too busy. My favourite stall sells fresh fruit and vegetables, and the prices are much lower than in the supermarket. There's also a man who sells bread, and his cheese rolls are amazing. Last month, the market started opening on Sundays too, but I still prefer Saturdays, because the atmosphere is friendlier. After shopping, I always have a coffee at a small café on the corner. The owner is from Italy, and she makes the best coffee in the area. Going to the market is my favourite part of the week.",
    qs: [["What time does Sam usually get to the market?", "At about nine o'clock.", [["nine", "9"]]],
         ["Why does Sam prefer Saturdays?", "Because the atmosphere is friendlier.", [["friend", "atmosphere"]]],
         ["Where is the café owner from?", "From Italy.", [["ital"]]]] },
  { who: "Maria", about: "learning to swim",
    text: "Hello, my name's Maria. When I was a child, I never learned to swim, and for years I felt embarrassed about it. Last year, my daughter started swimming lessons, and I decided it was time for me to learn too. I found a class for adults at my local sports centre. The lessons are on Tuesday evenings, and they last forty-five minutes. At first I was very nervous, and I didn't want to put my face in the water. But the teacher was very patient. After about three months, I swam a whole length of the pool for the first time, and my daughter cheered for me. Now we go swimming together every Sunday morning. My next goal is to swim in the sea on our summer holiday.",
    qs: [["Who started swimming lessons first?", "Her daughter.", [["daughter"]]],
         ["How long do the lessons last?", "Forty-five minutes.", [["forty", "45"]]],
         ["What is Maria's next goal?", "To swim in the sea on her summer holiday.", [["sea"]]]] },
  { who: "Daniel", about: "his job",
    text: "Hi, I'm Daniel, and I drive a night bus in London. My shift starts at eleven at night and finishes at seven in the morning. A lot of people think the night is quiet, but my bus is often full, especially on Friday and Saturday nights. Most of my passengers are people going home from work, like nurses and cleaners, and some are young people coming back from a night out. The best thing about the job is that the roads are almost empty, so driving is easy. The hardest thing is sleeping during the day, because my neighbours are noisy. I wear earplugs, and that helps a lot. I've done this job for six years now, and I still enjoy it.",
    qs: [["What time does Daniel's shift start?", "At eleven at night.", [["eleven", "11"]]],
         ["What is the best thing about Daniel's job?", "The roads are almost empty, so driving is easy.", [["empty", "easy", "quiet"]]],
         ["What helps Daniel sleep during the day?", "Earplugs.", [["ear"]]]] },
  { who: "Priya", about: "a weekend trip",
    text: "Hi, I'm Priya. Last weekend I went to Brighton with two friends from work. We took the train from Victoria station, and the journey took just over an hour. The weather was lovely, so we spent the morning on the beach. For lunch we had fish and chips, which is a tradition when you visit the seaside in England. In the afternoon it started to rain, so we went to a small museum about the history of the town. It was more interesting than I expected. Before we went home, we walked along the pier and played some games. I lost all my coins, but it was really fun. I'd love to go back in the summer and stay for a few days.",
    qs: [["How did Priya travel to Brighton?", "By train.", [["train"]]],
         ["What did they have for lunch?", "Fish and chips.", [["fish", "chip"]]],
         ["Why did they go to the museum?", "Because it started to rain.", [["rain"]]]] },
  { who: "Ahmed", about: "his grandmother",
    text: "Hello, my name's Ahmed. When I was young, I spent every summer with my grandmother in a small village. She was a wonderful cook, and she taught me how to make bread. We got up at six o'clock every morning, because the bread needed time to rise. My job was to mix the flour and water, and she did the difficult part. While we waited, she told me stories about her childhood. Now I live in London and I'm very busy, but I still make bread every Sunday. My children love helping me, just like I helped my grandmother. I think cooking together is a great way to spend time as a family, and it's much cheaper than eating out.",
    qs: [["What did Ahmed's grandmother teach him to make?", "Bread.", [["bread"]]],
         ["What time did they get up in the morning?", "At six o'clock.", [["six", "6"]]],
         ["Who helps Ahmed make bread now?", "His children.", [["child", "kid", "son", "daughter"]]]] },
  { who: "Kevin", about: "getting fit",
    text: "Hi, I'm Kevin. In January I decided to get fit, so I joined a gym near my office. It costs thirty pounds a month, which I think is quite reasonable. I go three times a week, usually at lunchtime, because the gym is quieter then. At first I only used the running machine, but now I also do a yoga class on Wednesdays. I never thought I would enjoy yoga, but it really helps my back, which often hurts after a long day at my desk. I've lost five kilos so far, and I feel much more energetic. My wife says I'm in a better mood too! My plan is to run a ten-kilometre race in the autumn.",
    qs: [["How much does Kevin's gym cost?", "Thirty pounds a month.", [["thirty", "30"]]],
         ["Why does Kevin like yoga?", "Because it helps his back.", [["back"]]],
         ["What is Kevin's plan for the autumn?", "To run a ten-kilometre race.", [["race", "run", "10", "ten"]]]] }
];

window.PART4B = [
  { topic: "a place you like to visit", tr: "Ziyaret etmeyi sevdiğiniz bir yer", en: "A place you like to visit",
    sample: "I'd like to talk about Greenwich, in South East London. I go there with my family about once a month, usually on Sunday. We take the train, and it only takes twenty minutes. The best thing about Greenwich is the park. It's very big and green, and from the top of the hill you can see the whole of London. My children love running down the hill and playing near the trees. There is also a market with food from many countries, so we always have lunch there. My favourite is a Turkish stall that sells gözleme. I like Greenwich because it's relaxing and it's not too crowded. After a busy week of driving, it's the perfect place to forget about traffic and spend time with my family.",
    follow: ["Do you prefer visiting busy places or quiet places? Why?", "Who do you usually go out with at the weekend?", "Is there a place you would like to visit in the future?"] },
  { topic: "your favourite film or TV programme", tr: "En sevdiğiniz film ya da dizi", en: "Your favourite film or TV programme",
    sample: "My favourite TV programme is a cooking competition called MasterChef. I watch it every week with my wife. In the programme, normal people cook in a big kitchen, and three judges taste the food and choose the best cook. I like it for two reasons. First, I learn a lot about cooking, and sometimes I try the recipes at home. Second, it's exciting, because every week someone has to leave the competition. The people are very nervous, and you really want them to win. It's also good for my English, because the judges explain everything clearly. My favourite part is the final, when the last three cooks make a big meal. I think it's a great programme for the whole family.",
    follow: ["Do you prefer watching films at home or at the cinema? Why?", "How do you choose what to watch?", "Is there a kind of film you don't like? Why?"] },
  { topic: "a person who has helped you", tr: "Size yardım etmiş biri", en: "A person who has helped you",
    sample: "I want to talk about my cousin, Hasan. When I came to London eight years ago, I didn't know anyone, and my English was not very good. Hasan let me stay in his flat for three months, and he didn't ask me for any rent. He also helped me find my first job, in a warehouse. Every evening, he practised English with me, and he explained how things work here, for example how to open a bank account and how to use the Oyster card. Without his help, my first year would have been very difficult. Now we live in different parts of London, but we still meet every few weeks. I always try to help other new people in the same way, because I know how it feels.",
    follow: ["Do you like helping other people? Why?", "Who do you ask for advice when you have a problem?", "Is it easy to make friends in London? Why, or why not?"] },
  { topic: "a special day you remember", tr: "Hatırladığınız özel bir gün", en: "A special day you remember",
    sample: "The most special day I remember is the day my son was born, about ten years ago. It was a cold morning in February. My wife woke me up at five o'clock and said, 'It's time!' I was so nervous that I couldn't find the car keys. We drove to the hospital, and the roads were completely empty, which was lucky. My son was born at eleven o'clock. When the nurse gave him to me, I couldn't stop smiling. He was very small and very loud! In the evening, our families called us from Turkey on a video call, and everybody was crying with happiness. Every year on his birthday, I tell him this story, and he always laughs about the car keys.",
    follow: ["How do people in your country celebrate special days?", "Do you prefer big parties or small celebrations? Why?", "Do you take a lot of photos on special days?"] },
  { topic: "a meal you enjoy", tr: "Severek yediğiniz bir yemek", en: "A meal you enjoy",
    sample: "A meal I really enjoy is a big Turkish breakfast at the weekend. During the week I don't have time, but on Sunday morning my whole family sits together for about two hours. We have fresh bread, white cheese, olives, tomatoes, cucumbers and eggs cooked with peppers, which is called menemen. Of course, we also drink a lot of black tea. My wife makes the menemen, and I make the tea, because my tea is the best! I love this meal not only because the food is delicious, but because it's a time to talk and relax together. The children tell us about their week, and we plan what to do. For me, it's the best part of the weekend.",
    follow: ["How often do you eat out in restaurants?", "Do you think people eat too much fast food today? Why?", "Who does the cooking in your home?"] },
  { topic: "a hobby or free-time activity", tr: "Bir hobi ya da boş zaman etkinliği", en: "A hobby or free-time activity",
    sample: "My favourite free-time activity is playing football. I play every Saturday morning with a group of friends in a park near my house. There are about twelve of us, and we come from many different countries, like Turkey, Poland, Nigeria and Brazil. We play for about two hours, and after the game we usually have a coffee together. I started playing when I was a child in Izmir, and I've loved it all my life. Football is good for my health, especially because I sit in the car for many hours during the week. It's also a great way to make friends. Some of my best friends in London are people I met through football. I hope I can continue playing for many years.",
    follow: ["Do you think hobbies are important? Why?", "Is there a new hobby you would like to try?", "Do you prefer doing activities alone or with other people?"] },
  { topic: "a journey you remember", tr: "Hatırladığınız bir yolculuk", en: "A journey you remember",
    sample: "I remember a long journey I made with my family to Scotland two years ago. We drove from London to Edinburgh, which took about eight hours, so we stopped twice to rest and eat. The children were bored at the start, so we played games in the car, like counting red cars. The best part was the last two hours, because the countryside was beautiful, with hills and lakes everywhere. In Edinburgh we stayed for four days. We visited the castle and walked up a hill called Arthur's Seat. The weather was cold and windy, even in summer! It was a long drive, but it was a wonderful holiday, and we all want to go back and see the Highlands next time.",
    follow: ["Do you prefer travelling by car, train or plane? Why?", "What do you do to pass the time on a long journey?", "Where would you like to travel next?"] },
  { topic: "the area where you live", tr: "Yaşadığınız bölge", en: "The area where you live",
    sample: "I live in Edmonton, in North London. I've lived there for about five years with my family. It's a busy and friendly area, with people from many different countries. On the high street there are lots of shops, Turkish supermarkets and restaurants, so it's easy to find everything I need. There's also a big park near my house, where my children play and I sometimes go running. The transport is quite good, because there's a train station, and it takes about thirty minutes to get to central London. One thing I don't like is the traffic in the morning, which can be very heavy. But in general, I'm happy there, and my neighbours are very kind and helpful.",
    follow: ["What would you change about your area?", "Would you prefer to live in the city centre or the countryside? Why?", "How well do you know your neighbours?"] },
  { topic: "a skill you would like to learn", tr: "Öğrenmek istediğiniz bir beceri", en: "A skill you would like to learn",
    sample: "A skill I would really like to learn is playing the guitar. When I was young in Turkey, my uncle played the guitar at family parties, and everyone sang together. I always wanted to play like him, but I never had the time or the money for lessons. Now my children are older, so I think it's the right time to start. I've found a music school near my house that has evening classes for adults. I'm a bit nervous, because I'm not young anymore, but my teacher says it's never too late. My goal is to play a few Turkish songs for my family at my daughter's next birthday party. I think it would be a lovely surprise for everyone.",
    follow: ["Is it better to learn something new when you're young? Why?", "What's the best way to learn a new skill?", "Have you ever taught somebody something?"] },
  { topic: "your plans for the future", tr: "Gelecek planlarınız", en: "Your plans for the future",
    sample: "My main plan for the future is to become a private hire driver in London. First, I need to pass my tests, including this English test, and then I'll get my licence. I enjoy driving, and I like meeting new people, so I think it's the right job for me. It's also flexible, so I can choose my hours and spend more time with my children. In a few years, I would like to buy a new electric car, because it's better for the environment and cheaper to run in London. Another plan is to improve my English, because it will help me in my job and in my daily life. And one day, I'd like to take my family on a long holiday around Europe.",
    follow: ["Do you think it's important to make plans? Why?", "Where do you see yourself in five years?", "What job did you want to do when you were a child?"] }
];
