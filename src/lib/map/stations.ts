// Approximate London + commuter-belt rail/tube stations with door-to-Zone-1 minutes.
// Used as anchor points for transit-aware commute estimates (no API key required).
export type Station = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  zone: number | string;
  line: string;
  timeFromCentre: number; // minutes to Zone 1
};

export const STATIONS: Station[] = [
  // === ZONE 1 CENTRAL ===
  { id: "kgx", name: "King's Cross", lat: 51.5308, lng: -0.1238, zone: 1, line: "multiple", timeFromCentre: 0 },
  { id: "pad", name: "Paddington", lat: 51.5154, lng: -0.1755, zone: 1, line: "multiple", timeFromCentre: 3 },
  { id: "lst", name: "Liverpool Street", lat: 51.5178, lng: -0.0823, zone: 1, line: "multiple", timeFromCentre: 3 },
  { id: "wat", name: "Waterloo", lat: 51.5036, lng: -0.1143, zone: 1, line: "multiple", timeFromCentre: 4 },
  { id: "vic", name: "Victoria", lat: 51.4952, lng: -0.1441, zone: 1, line: "multiple", timeFromCentre: 5 },
  { id: "eus", name: "Euston", lat: 51.5282, lng: -0.1337, zone: 1, line: "multiple", timeFromCentre: 2 },
  { id: "oxc", name: "Oxford Circus", lat: 51.5152, lng: -0.1415, zone: 1, line: "multiple", timeFromCentre: 4 },
  { id: "ban", name: "Bank", lat: 51.5133, lng: -0.0886, zone: 1, line: "multiple", timeFromCentre: 4 },
  { id: "cha", name: "Charing Cross", lat: 51.508, lng: -0.1247, zone: 1, line: "multiple", timeFromCentre: 5 },
  { id: "tot", name: "Tottenham Court Road", lat: 51.5165, lng: -0.131, zone: 1, line: "multiple", timeFromCentre: 3 },

  // === ZONE 2-3 ===
  { id: "cam", name: "Camden Town", lat: 51.5392, lng: -0.1426, zone: 2, line: "northern", timeFromCentre: 6 },
  { id: "ang", name: "Angel", lat: 51.5322, lng: -0.1058, zone: 1, line: "northern", timeFromCentre: 5 },
  { id: "bri", name: "Brixton", lat: 51.4627, lng: -0.1145, zone: 2, line: "victoria", timeFromCentre: 10 },
  { id: "sto", name: "Stockwell", lat: 51.4723, lng: -0.123, zone: 2, line: "victoria", timeFromCentre: 8 },
  { id: "can", name: "Canary Wharf", lat: 51.5054, lng: -0.0235, zone: 2, line: "jubilee", timeFromCentre: 12 },
  { id: "str", name: "Stratford", lat: 51.5416, lng: -0.0033, zone: 3, line: "central", timeFromCentre: 15 },
  { id: "shb", name: "Shepherd's Bush", lat: 51.5046, lng: -0.2187, zone: 2, line: "central", timeFromCentre: 12 },
  { id: "ham", name: "Hammersmith", lat: 51.4927, lng: -0.2246, zone: 2, line: "multiple", timeFromCentre: 15 },
  { id: "cla", name: "Clapham Junction", lat: 51.4641, lng: -0.1705, zone: 2, line: "rail", timeFromCentre: 12 },
  { id: "fin", name: "Finsbury Park", lat: 51.5642, lng: -0.1065, zone: 2, line: "victoria", timeFromCentre: 10 },
  { id: "ken", name: "Kennington", lat: 51.4884, lng: -0.1053, zone: 2, line: "northern", timeFromCentre: 7 },
  { id: "bet", name: "Bethnal Green", lat: 51.527, lng: -0.0549, zone: 2, line: "central", timeFromCentre: 8 },
  { id: "wch", name: "Whitechapel", lat: 51.5194, lng: -0.0612, zone: 2, line: "elizabeth", timeFromCentre: 7 },

  // === ZONE 3-4 ===
  { id: "wim", name: "Wimbledon", lat: 51.4214, lng: -0.2064, zone: 3, line: "district", timeFromCentre: 22 },
  { id: "eal", name: "Ealing Broadway", lat: 51.515, lng: -0.3019, zone: 3, line: "central", timeFromCentre: 20 },
  { id: "ric", name: "Richmond", lat: 51.4613, lng: -0.3013, zone: 4, line: "overground", timeFromCentre: 25 },
  { id: "gre", name: "Greenwich", lat: 51.4781, lng: -0.0149, zone: 2, line: "dlr", timeFromCentre: 18 },
  { id: "lew", name: "Lewisham", lat: 51.4657, lng: -0.0142, zone: 3, line: "dlr", timeFromCentre: 20 },
  { id: "tot2", name: "Tottenham Hale", lat: 51.5882, lng: -0.0594, zone: 3, line: "victoria", timeFromCentre: 15 },
  { id: "wal", name: "Walthamstow Central", lat: 51.583, lng: -0.0197, zone: 3, line: "victoria", timeFromCentre: 18 },
  { id: "bkh", name: "Blackheath", lat: 51.4658, lng: 0.0088, zone: 3, line: "rail", timeFromCentre: 20 },
  { id: "wnp", name: "Wembley Park", lat: 51.5635, lng: -0.2795, zone: 4, line: "metropolitan", timeFromCentre: 18 },
  { id: "har", name: "Harrow-on-the-Hill", lat: 51.5793, lng: -0.3372, zone: 5, line: "metropolitan", timeFromCentre: 25 },
  { id: "put", name: "Putney", lat: 51.4612, lng: -0.2166, zone: 2, line: "rail", timeFromCentre: 18 },
  { id: "bro", name: "Bromley South", lat: 51.4, lng: 0.0174, zone: 5, line: "rail", timeFromCentre: 22 },
  { id: "cro", name: "Croydon (East)", lat: 51.3753, lng: -0.0929, zone: 5, line: "rail", timeFromCentre: 18 },
  { id: "sur", name: "Surbiton", lat: 51.3928, lng: -0.3049, zone: 6, line: "rail", timeFromCentre: 25 },
  { id: "twi", name: "Twickenham", lat: 51.4499, lng: -0.3307, zone: 5, line: "rail", timeFromCentre: 28 },
  { id: "woo", name: "Woolwich (Elizabeth)", lat: 51.4917, lng: 0.0716, zone: 4, line: "elizabeth", timeFromCentre: 18 },

  // === ZONE 5-6+ / OUTER LONDON ===
  { id: "hea", name: "Heathrow T2/3", lat: 51.4713, lng: -0.4531, zone: 6, line: "elizabeth", timeFromCentre: 30 },
  { id: "upm", name: "Upminster", lat: 51.559, lng: 0.251, zone: 6, line: "district", timeFromCentre: 40 },
  { id: "epp", name: "Epping", lat: 51.6937, lng: 0.1139, zone: 6, line: "central", timeFromCentre: 42 },
  { id: "uxb", name: "Uxbridge", lat: 51.5467, lng: -0.4786, zone: 6, line: "metropolitan", timeFromCentre: 40 },
  { id: "wat2", name: "Watford", lat: 51.6573, lng: -0.3952, zone: 7, line: "overground", timeFromCentre: 35 },
  { id: "enf", name: "Enfield Town", lat: 51.6524, lng: -0.0803, zone: 5, line: "rail", timeFromCentre: 30 },
  { id: "bar", name: "Barking", lat: 51.5396, lng: 0.081, zone: 4, line: "district", timeFromCentre: 20 },
  { id: "ilf", name: "Ilford", lat: 51.559, lng: 0.07, zone: 4, line: "elizabeth", timeFromCentre: 22 },
  { id: "rom", name: "Romford", lat: 51.575, lng: 0.1828, zone: 6, line: "elizabeth", timeFromCentre: 28 },
  { id: "orp", name: "Orpington", lat: 51.3743, lng: 0.0988, zone: 6, line: "rail", timeFromCentre: 30 },
  { id: "kin", name: "Kingston", lat: 51.4125, lng: -0.3007, zone: 6, line: "rail", timeFromCentre: 30 },
  { id: "hou", name: "Hounslow", lat: 51.4682, lng: -0.3618, zone: 4, line: "piccadilly", timeFromCentre: 30 },

  // === COMMUTER BELT: 30-60 MINS ===
  { id: "rdg", name: "Reading", lat: 51.4589, lng: -0.9717, zone: "C", line: "elizabeth/gwr", timeFromCentre: 55 },
  { id: "slg", name: "Slough", lat: 51.5113, lng: -0.5952, zone: "C", line: "elizabeth", timeFromCentre: 35 },
  { id: "mai", name: "Maidenhead", lat: 51.5281, lng: -0.7232, zone: "C", line: "elizabeth", timeFromCentre: 42 },
  { id: "wok", name: "Woking", lat: 51.319, lng: -0.557, zone: "C", line: "swrail", timeFromCentre: 30 },
  { id: "gui", name: "Guildford", lat: 51.237, lng: -0.581, zone: "C", line: "swrail", timeFromCentre: 40 },
  { id: "stl", name: "St Albans", lat: 51.75, lng: -0.3411, zone: "C", line: "thameslink", timeFromCentre: 25 },
  { id: "lut", name: "Luton", lat: 51.882, lng: -0.414, zone: "C", line: "thameslink", timeFromCentre: 35 },
  { id: "ste", name: "Stevenage", lat: 51.902, lng: -0.207, zone: "C", line: "rail", timeFromCentre: 30 },
  { id: "che", name: "Chelmsford", lat: 51.736, lng: 0.469, zone: "C", line: "rail", timeFromCentre: 35 },
  { id: "bas", name: "Basildon", lat: 51.568, lng: 0.459, zone: "C", line: "c2c", timeFromCentre: 35 },
  { id: "sou", name: "Southend Central", lat: 51.537, lng: 0.711, zone: "C", line: "c2c", timeFromCentre: 55 },
  { id: "gra", name: "Gravesend", lat: 51.442, lng: 0.367, zone: "C", line: "rail", timeFromCentre: 40 },
  { id: "sei", name: "Sevenoaks", lat: 51.273, lng: 0.191, zone: "C", line: "rail", timeFromCentre: 35 },
  { id: "ton", name: "Tonbridge", lat: 51.195, lng: 0.274, zone: "C", line: "rail", timeFromCentre: 42 },
  { id: "red", name: "Redhill", lat: 51.24, lng: -0.165, zone: "C", line: "rail", timeFromCentre: 35 },
  { id: "dor", name: "Dorking", lat: 51.233, lng: -0.332, zone: "C", line: "rail", timeFromCentre: 50 },
  { id: "eps", name: "Epsom", lat: 51.335, lng: -0.267, zone: 6, line: "rail", timeFromCentre: 30 },
  { id: "hmp", name: "Hemel Hempstead", lat: 51.746, lng: -0.473, zone: "C", line: "rail", timeFromCentre: 35 },
  { id: "dar", name: "Dartford", lat: 51.447, lng: 0.219, zone: 6, line: "rail", timeFromCentre: 35 },
  { id: "hig", name: "High Wycombe", lat: 51.63, lng: -0.749, zone: "C", line: "chiltern", timeFromCentre: 35 },
  { id: "ayl", name: "Aylesbury", lat: 51.813, lng: -0.814, zone: "C", line: "chiltern", timeFromCentre: 55 },
  { id: "her", name: "Hertford", lat: 51.797, lng: -0.079, zone: "C", line: "rail", timeFromCentre: 40 },
  { id: "pot", name: "Potters Bar", lat: 51.698, lng: -0.177, zone: "C", line: "rail", timeFromCentre: 25 },
  { id: "wel", name: "Welwyn Garden City", lat: 51.801, lng: -0.204, zone: "C", line: "rail", timeFromCentre: 28 },
  { id: "hat", name: "Hatfield", lat: 51.764, lng: -0.215, zone: "C", line: "rail", timeFromCentre: 25 },

  // === COMMUTER BELT: 60-90 MINS ===
  { id: "bri2", name: "Brighton", lat: 50.829, lng: -0.141, zone: "C", line: "rail", timeFromCentre: 60 },
  { id: "cra", name: "Crawley", lat: 51.1095, lng: -0.1872, zone: "C", line: "rail", timeFromCentre: 50 },
  { id: "mke", name: "Milton Keynes", lat: 52.034, lng: -0.774, zone: "C", line: "rail", timeFromCentre: 55 },
  { id: "oxf", name: "Oxford", lat: 51.754, lng: -1.27, zone: "C", line: "gwr", timeFromCentre: 65 },
  { id: "col", name: "Colchester", lat: 51.9, lng: 0.893, zone: "C", line: "rail", timeFromCentre: 55 },
  { id: "ips", name: "Ipswich", lat: 52.052, lng: 1.144, zone: "C", line: "rail", timeFromCentre: 75 },
  { id: "can2", name: "Canterbury West", lat: 51.284, lng: 1.075, zone: "C", line: "hs1", timeFromCentre: 55 },
  { id: "ash", name: "Ashford International", lat: 51.144, lng: 0.876, zone: "C", line: "hs1", timeFromCentre: 38 },
  { id: "bas2", name: "Basingstoke", lat: 51.268, lng: -1.087, zone: "C", line: "swrail", timeFromCentre: 50 },
  { id: "win", name: "Winchester", lat: 51.067, lng: -1.32, zone: "C", line: "swrail", timeFromCentre: 60 },
  { id: "bed", name: "Bedford", lat: 52.136, lng: -0.481, zone: "C", line: "thameslink", timeFromCentre: 50 },
  { id: "cam2", name: "Cambridge", lat: 52.194, lng: 0.137, zone: "C", line: "rail", timeFromCentre: 50 },
  { id: "pet", name: "Peterborough", lat: 52.575, lng: -0.24, zone: "C", line: "rail", timeFromCentre: 50 },
  { id: "stn", name: "Stansted Airport", lat: 51.885, lng: 0.263, zone: "C", line: "stansted express", timeFromCentre: 50 },
  { id: "nor", name: "Northampton", lat: 52.237, lng: -0.902, zone: "C", line: "rail", timeFromCentre: 65 },
  { id: "mdw", name: "Medway (Rochester)", lat: 51.389, lng: 0.506, zone: "C", line: "hs1", timeFromCentre: 40 },
  { id: "eby", name: "Eastbourne", lat: 50.77, lng: 0.281, zone: "C", line: "rail", timeFromCentre: 85 },
  { id: "hst", name: "Hastings", lat: 50.858, lng: 0.581, zone: "C", line: "rail", timeFromCentre: 90 },

  // === OUTER COMMUTER: 90-120 MINS ===
  { id: "sot", name: "Southampton", lat: 50.907, lng: -1.414, zone: "C", line: "swrail", timeFromCentre: 80 },
  { id: "por", name: "Portsmouth", lat: 50.798, lng: -1.087, zone: "C", line: "swrail", timeFromCentre: 90 },
  { id: "exe", name: "Exeter", lat: 50.727, lng: -3.542, zone: "C", line: "gwr", timeFromCentre: 120 },
  { id: "bth", name: "Bath Spa", lat: 51.378, lng: -2.357, zone: "C", line: "gwr", timeFromCentre: 85 },
  { id: "brs", name: "Bristol TM", lat: 51.449, lng: -2.581, zone: "C", line: "gwr", timeFromCentre: 95 },
  { id: "swd", name: "Swindon", lat: 51.565, lng: -1.785, zone: "C", line: "gwr", timeFromCentre: 60 },
  { id: "nrw", name: "Norwich", lat: 52.627, lng: 1.307, zone: "C", line: "rail", timeFromCentre: 110 },
  { id: "bir", name: "Birmingham NS", lat: 52.454, lng: -1.9, zone: "C", line: "avanti", timeFromCentre: 85 },
  { id: "cov", name: "Coventry", lat: 52.401, lng: -1.513, zone: "C", line: "avanti", timeFromCentre: 65 },
  { id: "lei", name: "Leicester", lat: 52.632, lng: -1.125, zone: "C", line: "emr", timeFromCentre: 75 },
  { id: "not", name: "Nottingham", lat: 52.947, lng: -1.146, zone: "C", line: "emr", timeFromCentre: 100 },
  { id: "dov", name: "Dover Priory", lat: 51.126, lng: 1.305, zone: "C", line: "hs1", timeFromCentre: 65 },
  { id: "fol", name: "Folkestone", lat: 51.085, lng: 1.167, zone: "C", line: "hs1", timeFromCentre: 55 },
  { id: "mar", name: "Margate", lat: 51.385, lng: 1.372, zone: "C", line: "hs1", timeFromCentre: 80 },
  { id: "swn", name: "Southend Victoria", lat: 51.541, lng: 0.707, zone: "C", line: "rail", timeFromCentre: 55 },
  { id: "bnr", name: "Banbury", lat: 52.062, lng: -1.328, zone: "C", line: "chiltern", timeFromCentre: 70 },
];
