// Commuter towns within ~1h of central London by train.
// Used as quick-jump map presets and as suggested commute targets.
export type CommuterTown = {
  name: string;
  lng: number;
  lat: number;
  trainMinsToLondon: number; // approx fastest to a central London terminus
};

export const COMMUTER_TOWNS: CommuterTown[] = [
  { name: "St Albans", lng: -0.3417, lat: 51.7520, trainMinsToLondon: 20 },
  { name: "Watford", lng: -0.3960, lat: 51.6565, trainMinsToLondon: 18 },
  { name: "Windsor", lng: -0.6043, lat: 51.4839, trainMinsToLondon: 30 },
  { name: "Reading", lng: -0.9781, lat: 51.4543, trainMinsToLondon: 28 },
  { name: "Guildford", lng: -0.5704, lat: 51.2362, trainMinsToLondon: 35 },
  { name: "Sevenoaks", lng: 0.1909, lat: 51.2719, trainMinsToLondon: 25 },
  { name: "Brighton", lng: -0.1372, lat: 50.8225, trainMinsToLondon: 55 },
  { name: "Cambridge", lng: 0.1218, lat: 52.2053, trainMinsToLondon: 48 },
  { name: "Oxford", lng: -1.2577, lat: 51.7520, trainMinsToLondon: 55 },
  { name: "Tunbridge Wells", lng: 0.2632, lat: 51.1324, trainMinsToLondon: 45 },
  { name: "Chelmsford", lng: 0.4685, lat: 51.7356, trainMinsToLondon: 35 },
  { name: "Woking", lng: -0.5580, lat: 51.3168, trainMinsToLondon: 25 },
];
