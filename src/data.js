export async function loadGameData() {
  const [races, classes] = await Promise.all([
    fetch('/data/races.json').then(r => r.json()),
    fetch('/data/classes.json').then(r => r.json()),
  ]);
  return { races, classes };
}

export function raceById(data, id) {
  return data.races.find(r => r.id === id) ?? data.races[0];
}
