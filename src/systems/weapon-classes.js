export const WEAPON_ALLOWED_CLASSES={
  'Espada':['Guerrero','Defensor','Pícaro','Danzante de la Luna','Guardián Silvano','Sanguinario Noble','Caballero de la Sed Eterna'],
  'Mandoble':['Caballero de la Sed Eterna'],
  'Estoque':['Sanguinario Noble'],
  'Daga':['Pícaro','Depredador de las Cumbres','Danzante de la Luna'],
  'Hacha':['Guerrero'],
  'Hacha arrojadiza':['Lanzador de Calamidades'],
  'Maza':['Guerrero','Defensor','Guardián del Cuerno Ancestral','Devorador de Maldiciones','Bastión Escarabajo','Bastión de Escama Seca'],
  'Kanabō':['Destructor Kijin'],
  'Gran martillo':['Destructor Kijin'],
  'Lanza':['Defensor','Lancero del Cuerno Primordial','Guardián del Cuerno Ancestral','Guardián Silvano','Hemolancero','Bastión de Escama Seca'],
  'Lanza larga':['Lancero del Cuerno Primordial'],
  'Alabarda':['Lancero del Cuerno Primordial'],
  'Jabalina':['Lanzador de Calamidades','Hemolancero','Ojo del Pedregal'],
  'Guadaña':['Segador','Segador Mantídeo'],
  'Arco':['Ranger','Arquero de la Arboleda Primigenia','Ojo del Pedregal'],
  'Ballesta':['Ranger','Ojo del Pedregal'],
  'Bastón':['Mago','Invocador','Apoyo','Resonador Kairakh','Cantor de Raíces','Tejedor de Espíritus','Monje de los Cuernos','Señor de los Cien Demonios','Señor de los Murciélagos','Emperador de la Colmena','Conductor del Sol Árido'],
  'Varita':['Mago','Tejedor de Espíritus','Tejedor Carmesí'],
  'Tomo':['Mago','Invocador','Apoyo','Tejedor de Espíritus','Señor de los Cien Demonios','Señor de los Murciélagos','Tejedor Carmesí'],
  'Cetro':['Apoyo','Señor de los Murciélagos'],
  'Catalizador':['Invocador','Proyector de Venas','Resonador Kairakh','Hemolancero','Emperador de la Colmena','Azote de Cola Eléctrica','Conductor del Sol Árido'],
  'Guanteletes':['Pícaro','Proyector de Venas','Depredador de las Cumbres','Devorador de Maldiciones','Monje de los Cuernos','Tejedor Carmesí','Garra Fulminante','Conductor del Sol Árido'],
  'Chakrams':['Danzante de la Luna'],
  'Cañón':['Proyector de Venas','Artillero Quitinoso'],
  'Abanico ritual':['Señor de los Cien Demonios'],
  'Lanzador orgánico':['Artillero Quitinoso','Maestro de la Metamorfosis'],
  'Cuchillas de antebrazo':['Segador Mantídeo'],
  'Arma biológica mutable':['Maestro de la Metamorfosis']
};

export function allowedClassesForWeaponFamily(familyName){
  return (WEAPON_ALLOWED_CLASSES[familyName]||[]).map(name=>({name}));
}
