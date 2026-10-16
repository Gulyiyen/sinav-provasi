# OSM'den sokak geometrisi + yol numarasi (Overpass) ve onemli yer koordinatlari (Nominatim) ceker.
import json, time, urllib.request, urllib.parse, math, sys
UA = {"User-Agent": "sinav-provasi-dataprep/0.1 (one-off build script)"}
OUT = sys.argv[1]

STREETS = ["Baker Street","Gower Street","Tottenham Court Road","Charing Cross Road","Shaftesbury Avenue","Regent Street",
 "Oxford Street","New Bond Street","Park Lane","Piccadilly","Pall Mall","The Mall","Whitehall","Strand","Fleet Street",
 "Kingsway","Southampton Row","Gray's Inn Road","Farringdon Road","Goswell Road","City Road","Old Street",
 "Great Portland Street","Marylebone High Street","Edgware Road","Sloane Street","King's Road","Brompton Road",
 "Kensington High Street","Exhibition Road","Victoria Street","Vauxhall Bridge Road","Buckingham Palace Road",
 "Grosvenor Place","Euston Road","Marylebone Road","Hampstead Road","Camden High Street","Upper Street","Essex Road",
 "Theobalds Road","Clerkenwell Road","High Holborn","New Oxford Street","Bishopsgate","Cheapside","Queen Victoria Street",
 "Borough High Street","Blackfriars Road","Waterloo Road","Kennington Road","Westminster Bridge Road","York Road",
 "Lambeth Palace Road","Millbank","Horseferry Road","Bayswater Road","Pentonville Road","Commercial Street","Commercial Road",
 "Whitechapel Road","Mile End Road","Kingsland Road","Old Kent Road","Walworth Road","Cromwell Road","Holland Park Avenue",
 "Finchley Road","Holloway Road","Caledonian Road","York Way","Seven Sisters Road","Brixton Road","Kennington Park Road",
 "Wandsworth Road","Albert Embankment","Victoria Embankment","Grosvenor Road","Chelsea Embankment","Knightsbridge",
 "Park Road","Prince Albert Road","Eversholt Street","Judd Street","Southwark Street","Great Dover Street",
 "Tower Bridge Road","Jamaica Road","Aldersgate Street","Moorgate","London Wall","Cannon Street","Eastcheap",
 "Upper Thames Street","Lower Thames Street","The Highway","Westway","Harrow Road","Praed Street","Sussex Gardens",
 "Holland Road","Earls Court Road","Warwick Road","Fulham Road","Fulham Palace Road","Hammersmith Road","Shepherd's Bush Road",
 "Great Eastern Street","Shoreditch High Street","Hackney Road","Cambridge Heath Road","Rosebery Avenue","St John Street",
 "Southwark Bridge Road","Kennington Lane","Harleyford Road","Camberwell New Road","Camberwell Road","Peckham Road"]

BBOX = (51.455, -0.235, 51.565, -0.03)

def overpass(q):
    data = urllib.parse.urlencode({"data": q}).encode()
    req = urllib.request.Request("https://overpass-api.de/api/interpreter", data=data, headers=UA)
    return json.load(urllib.request.urlopen(req, timeout=180))

names = "|".join(n.replace("'", ".") for n in STREETS)  # apostrof: regex'te nokta
q = f'[out:json][timeout:170];way["highway"~"^(motorway|trunk|primary|secondary|tertiary|unclassified|residential)$"]["name"~"^({names})$"]{BBOX};out tags geom;'
r = overpass(q)
ways = r["elements"]
print("ways", len(ways))
streets = {}
for w in ways:
    n = w["tags"]["name"]
    if n not in STREETS: continue
    s = streets.setdefault(n, {"refs": {}, "len": 0, "geoms": []})
    g = [(p["lat"], p["lon"]) for p in w["geometry"]]
    L = sum(math.dist(g[i], g[i+1]) for i in range(len(g)-1))
    s["len"] += L
    ref = w["tags"].get("ref")
    if ref: s["refs"][ref] = s["refs"].get(ref, 0) + L
    s["geoms"].append(g)

lm_q = {
 "Buckingham Palace": "Buckingham Palace, London", "Trafalgar Square": "Trafalgar Square, London",
 "Piccadilly Circus": "Piccadilly Circus, London", "Marble Arch": "Marble Arch, London", "Hyde Park Corner": "Wellington Arch, London",
 "Tower of London": "Tower of London", "St Paul's Cathedral": "St Paul's Cathedral, London", "British Museum": "British Museum, London",
 "Natural History Museum": "Natural History Museum, London", "London Victoria station": "London Victoria railway station",
 "King's Cross station": "London King's Cross railway station", "Euston station": "London Euston railway station",
 "Paddington station": "London Paddington railway station", "Waterloo station": "London Waterloo railway station",
 "London Bridge station": "London Bridge railway station", "Liverpool Street station": "London Liverpool Street railway station",
 "Marylebone station": "London Marylebone railway station", "Oxford Circus": "Oxford Circus, London",
 "Covent Garden Market": "Covent Garden Market, London", "London Eye": "London Eye", "Tate Modern": "Tate Modern, London",
 "Royal Albert Hall": "Royal Albert Hall, London", "Harrods": "Harrods, Knightsbridge", "Westminster Abbey": "Westminster Abbey, London",
 "Tower Bridge": "Tower Bridge, London", "The Shard": "The Shard, London", "Bank of England": "Bank of England, Threadneedle Street",
 "Barbican Centre": "Barbican Centre, London", "London Zoo": "London Zoo, Regent's Park", "Lord's Cricket Ground": "Lord's Cricket Ground, London",
 "Madame Tussauds": "Madame Tussauds, Marylebone Road", "Elizabeth Tower (Big Ben)": "Elizabeth Tower, London",
 "Great Ormond Street Hospital": "Great Ormond Street Hospital, London", "St Thomas' Hospital": "St Thomas' Hospital, London",
 "Guy's Hospital": "Guy's Hospital, London", "University College Hospital": "University College Hospital, Euston Road",
 "Somerset House": "Somerset House, Strand", "Royal Festival Hall": "Royal Festival Hall, London",
 "Imperial War Museum": "Imperial War Museum London, Lambeth Road", "Kensington Palace": "Kensington Palace, London",
 "Emirates Stadium": "Emirates Stadium, London", "Stamford Bridge": "Stamford Bridge stadium, Fulham Road",
 "Battersea Power Station": "Battersea Power Station, London", "Smithfield Market": "Smithfield Market, London",
 "Angel station": "Angel tube station, Islington", "Camden Town station": "Camden Town tube station",
 "Elephant & Castle station": "Elephant & Castle tube station", "Old Street station": "Old Street station, London",
 "Aldgate station": "Aldgate tube station", "Holborn station": "Holborn tube station", "Baker Street station": "Baker Street tube station",
 "Warren Street station": "Warren Street tube station", "Leicester Square station": "Leicester Square tube station",
 "Green Park station": "Green Park tube station", "Knightsbridge station": "Knightsbridge tube station",
 "South Kensington station": "South Kensington tube station", "Vauxhall station": "Vauxhall station, London",
 "Earl's Court station": "Earl's Court tube station", "Notting Hill Gate station": "Notting Hill Gate tube station",
 "Lancaster Gate station": "Lancaster Gate tube station", "Edgware Road station": "Edgware Road tube station (Bakerloo line)",
 "Highbury & Islington station": "Highbury & Islington station", "Whitechapel station": "Whitechapel station, London",
 "Bermondsey station": "Bermondsey tube station", "Borough station": "Borough tube station", "Pimlico station": "Pimlico tube station",
 "Sloane Square station": "Sloane Square tube station", "Russell Square station": "Russell Square tube station",
 "Farringdon station": "Farringdon station, London", "Moorgate station": "Moorgate station, London",
 "Monument station": "Monument tube station", "Embankment station": "Embankment tube station", "Westminster station": "Westminster tube station",
 "Lambeth North station": "Lambeth North tube station", "Kennington station": "Kennington tube station", "Oval station": "Oval tube station",
 "Mornington Crescent station": "Mornington Crescent tube station", "Great Portland Street station": "Great Portland Street tube station",
 "Marble Arch station": "Marble Arch tube station", "Bond Street station": "Bond Street station, London",
 "Tottenham Court Road station": "Tottenham Court Road station", "Chancery Lane station": "Chancery Lane tube station",
 "St Paul's station": "St. Paul's tube station", "Tower Hill station": "Tower Hill tube station", "Shoreditch High Street station": "Shoreditch High Street station",
}
# 16 Eki 2026: surucunun sik gittigi oteller, hastaneler, tiyatrolar (operator: Kingsway sorulari yerine yeni sorular)
lm_q.update({"The Savoy": "Savoy Hotel, Strand, London", "The Ritz": "The Ritz London, Piccadilly", "The Dorchester": "The Dorchester, Park Lane, London", "Claridge's": "Claridge's, Brook Street, London", "The Langham": "The Langham, Portland Place, London", "Royal Opera House": "Royal Opera House, Bow Street, London", "London Palladium": "London Palladium, Argyll Street", "Selfridges": "Selfridges, Oxford Street, London", "Fortnum & Mason": "Fortnum & Mason, Piccadilly, London", "Somerset House": "Somerset House, Strand, London", "Royal Courts of Justice": "Royal Courts of Justice, Strand, London", "British Library": "British Library, Euston Road, London", "St Pancras International": "London St Pancras International", "London Zoo": "ZSL London Zoo", "Wallace Collection": "Wallace Collection, Manchester Square", "London Eye": "London Eye, Lambeth", "National Theatre": "National Theatre, Upper Ground, London", "Great Ormond Street Hospital": "Great Ormond Street Hospital, London", "Hilton London Park Lane": "London Hilton on Park Lane", "Horse Guards Parade": "Horse Guards Parade, London", "Sherlock Holmes Museum": "Sherlock Holmes Museum, Baker Street", "BBC Broadcasting House": "Broadcasting House, Portland Place, London", "Royal Academy of Arts": "Burlington House, Piccadilly", "Old Vic Theatre": "The Old Vic, The Cut, London", "Wigmore Hall": "Wigmore Hall, Wigmore Street, London", "St Mary's Hospital": "St Mary's Hospital, Praed Street, London", "Eastman Dental Hospital": "Royal National ENT and Eastman Dental Hospitals", "Sadler's Wells Theatre": "Sadler's Wells Theatre, Rosebery Avenue"})
lms = {}
for name, qq in lm_q.items():
    url = "https://nominatim.openstreetmap.org/search?" + urllib.parse.urlencode({"q": qq, "format": "jsonv2", "limit": 1, "viewbox": "-0.3,51.6,0.0,51.42", "bounded": 1})
    try:
        res = json.load(urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30))
    except Exception as e:
        res = []; print("ERR", name, e)
    if res:
        x = res[0]
        lms[name] = {"lat": float(x["lat"]), "lng": float(x["lon"]), "cat": x.get("category"), "type": x.get("type"), "disp": x["display_name"][:90]}
    else:
        print("MISS", name)
    time.sleep(1.1)

json.dump({"streets": streets, "landmarks": lms}, open(OUT, "w", encoding="utf-8"), ensure_ascii=False)
print("streets found", len(streets), "of", len(STREETS), "missing:", [s for s in STREETS if s not in streets])
print("landmarks", len(lms))

# Istasyonlar (tam adla, Nominatim'in bulanik eslesmesi yerine): python tools/topo_fetch.py raw.json stations.json
if len(sys.argv) > 2:
    q = '[out:json][timeout:90];node["railway"="station"]["name"](51.455,-0.235,51.565,-0.03);out body;'
    req = urllib.request.Request("https://overpass.kumi.systems/api/interpreter", data=urllib.parse.urlencode({"data": q}).encode(), headers=UA)
    r = json.load(urllib.request.urlopen(req, timeout=120))
    st = [{"name": e["tags"]["name"], "lat": e["lat"], "lng": e["lon"], "st": e["tags"].get("station", ""), "net": e["tags"].get("network", "")} for e in r["elements"]]
    json.dump(st, open(sys.argv[2], "w", encoding="utf-8"), ensure_ascii=False)
    print("stations", len(st))
