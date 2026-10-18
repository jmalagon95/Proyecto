export async function loadGameData() {
  const [races, classes, missions, weapons1, weapons2, weapons3] = await Promise.all([
    fetch('/data/races.json').then(r => r.json()),
    fetch('/data/classes.json').then(r => r.json()),
    fetch('/data/missions.json').then(r => r.json()),
    fetch('/data/generated/equipment/weapons-star1.json').then(r => r.json()),
    fetch('/data/generated/equipment/weapons-star2.json').then(r => r.json()),
    fetch('/data/generated/equipment/weapons-star3.json').then(r => r.json()),
  ]);
  return {
    races,
    classes,
    missions,
    weaponCatalogs:{
      1:weapons1.items,
      2:weapons2.items,
      3:weapons3.items
    }
  };
}

export function raceById(data, id) {
  return data.races.find(r => r.id === id) ?? data.races[0];
}
