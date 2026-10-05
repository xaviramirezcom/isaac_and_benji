// Storm levels. Tornadoes follow the Enhanced Fujita (EF) scale, wind ranges as published by the US National Weather Service.
// `vmax` is the peak wind the simulation uses (mph, roughly the middle of the EF range); `rc` is the radius (m) of the core where the wind peaks.
// Storm levels follow NWS definitions (severe thunderstorm = gusts of 58 mph / 93 km/h or more, and/or hail of 1 inch / 2.5 cm or more).
export const TORNADO = [
  { id: 'ef0', chip: { en: 'Little', es: 'Pequeño' }, kid: { en: 'A little wind. It blows leaves and shakes the trees.', es: 'Un viento chiquito. Sopla las hojas y mueve los árboles.' }, short: 'EF0', mph: '65–85', kmh: '105–137', vmax: 78, rc: 7, share: '53%',
    label: { en: 'Weak', es: 'Débil' },
    desc: { en: 'Light damage. Branches break off trees, shingles peel off roofs, trash cans and light things tumble away.', es: 'Daño leve. Se rompen ramas, las tejas se despegan de los techos y los botes de basura y cosas ligeras salen rodando.' } },
  { id: 'ef1', chip: { en: 'Medium', es: 'Mediano' }, kid: { en: 'Strong wind. It rips off some pieces of roof.', es: 'Viento fuerte. Arranca pedazos de techo.' }, short: 'EF1', mph: '86–110', kmh: '138–177', vmax: 98, rc: 11, share: '32%',
    label: { en: 'Moderate', es: 'Moderado' },
    desc: { en: 'Moderate damage. Roofs lose big pieces, garage doors collapse, moving cars get pushed and some trees snap.', es: 'Daño moderado. Los techos pierden grandes pedazos, los portones de garaje se caen, los autos se mueven y algunos árboles se parten.' } },
  { id: 'ef2', chip: { en: 'Big', es: 'Grande' }, kid: { en: 'Very strong! Roofs fly away and trees fall.', es: '¡Muy fuerte! Los techos salen volando y caen los árboles.' }, short: 'EF2', mph: '111–135', kmh: '178–217', vmax: 123, rc: 17, share: '11%',
    label: { en: 'Considerable', es: 'Considerable' },
    desc: { en: 'Considerable damage. Roofs are torn off houses, big trees are snapped or pulled out, and cars are lifted off the ground.', es: 'Daño considerable. Los techos salen volando, los árboles grandes se parten o se arrancan y los autos se levantan del suelo.' } },
  { id: 'ef3', chip: { en: 'Strong', es: 'Fuerte' }, kid: { en: 'Super strong! Walls fall down and cars fly.', es: '¡Superfuerte! Se caen las paredes y los autos vuelan.' }, short: 'EF3', mph: '136–165', kmh: '218–266', vmax: 150, rc: 25, share: '3%',
    label: { en: 'Severe', es: 'Severo' },
    desc: { en: 'Severe damage. Whole walls collapse, heavy cars are thrown, and most trees are stripped or knocked down.', es: 'Daño severo. Se caen paredes enteras, los autos pesados salen lanzados y casi todos los árboles se rompen o caen.' } },
  { id: 'ef4', chip: { en: 'Huge', es: 'Enorme' }, kid: { en: 'Huge! Whole houses get flattened.', es: '¡Enorme! Las casas quedan aplastadas.' }, short: 'EF4', mph: '166–200', kmh: '267–322', vmax: 183, rc: 36, share: '1%',
    label: { en: 'Devastating', es: 'Devastador' },
    desc: { en: 'Devastating damage. Even well-built houses are leveled, and cars fly a long way through the air.', es: 'Daño devastador. Hasta las casas bien construidas quedan arrasadas y los autos vuelan muy lejos por el aire.' } },
  { id: 'ef5', chip: { en: 'Giant', es: 'Gigante' }, kid: { en: 'The strongest of all! It sweeps houses away.', es: '¡El más fuerte de todos! Se lleva las casas.' }, short: 'EF5', mph: 'over 200', mphEs: 'más de 200', kmh: 'over 322', kmhEs: 'más de 322', vmax: 225, rc: 50, share: 'less than 0.1%', shareEs: 'menos del 0,1 %',
    label: { en: 'Incredible', es: 'Increíble' },
    desc: { en: 'Incredible damage. Strong houses are swept clean off their foundations. EF5 tornadoes are extremely rare.', es: 'Daño increíble. Hasta casas fuertes son arrancadas de sus cimientos. Los tornados EF5 son rarísimos.' } },
];

export const STORM = [
  { id: 's1', chip: { en: 'Rain', es: 'Lluvia' }, kid: { en: 'Rain and a little wind. Splash!', es: 'Lluvia y un poquito de viento. ¡Splash!' }, short: '1', mph: 'up to 25', mphEs: 'hasta 25', kmh: 'up to 40', kmhEs: 'hasta 40', vmax: 22, rain: 0.55, lightning: 0, hail: 0, cloud: 0.55,
    label: { en: 'Rain shower', es: 'Chubasco' },
    desc: { en: 'A rain shower with gentle gusts. Leaves fall and tree branches sway, but nothing gets damaged.', es: 'Un chubasco con ráfagas suaves. Caen hojas y las ramas se mecen, pero no se daña nada.' } },
  { id: 's2', chip: { en: 'Thunder', es: 'Trueno' }, kid: { en: 'Big rain, thunder and lightning. Boom!', es: 'Mucha lluvia, truenos y relámpagos. ¡Bum!' }, short: '2', mph: 'gusts up to 58', mphEs: 'ráfagas hasta 58', kmh: 'gusts up to 93', kmhEs: 'ráfagas hasta 93', vmax: 42, rain: 0.8, lightning: 0.12, hail: 0.25, hailSize: 0.007, cloud: 0.8,
    label: { en: 'Thunderstorm', es: 'Tormenta eléctrica' },
    desc: { en: 'Heavy rain, thunder and lightning, and pea-size hail. Strong gusts knock over light things like trash cans.', es: 'Lluvia fuerte, truenos, relámpagos y granizo del tamaño de un guisante. Las ráfagas tumban cosas ligeras como los botes de basura.' } },
  { id: 's3', chip: { en: 'Hail', es: 'Granizo' }, kid: { en: 'Strong wind and hail, like balls of ice.', es: 'Viento fuerte y granizo, como bolas de hielo.' }, short: '3', mph: '58 or more', mphEs: '58 o más', kmh: '93 or more', kmhEs: '93 o más', vmax: 70, rain: 1, lightning: 0.35, hail: 1, hailSize: 0.044, cloud: 1,
    label: { en: 'Severe thunderstorm', es: 'Tormenta severa' },
    desc: { en: 'A severe storm has winds of at least 58 mph (93 km/h) and/or hail at least 1 inch (2.5 cm) wide. This one has golf-ball hail. Shingles fly off, fences fall and branches break.', es: 'Una tormenta severa tiene vientos de al menos 93 km/h (58 mph) y/o granizo de al menos 2,5 cm. Esta tiene granizo como pelotas de golf. Vuelan las tejas, caen las cercas y se rompen ramas.' } },
  { id: 's4', chip: { en: 'Big wind', es: 'Mucho viento' }, kid: { en: 'A super windy storm. It can blow off roofs.', es: 'Una tormenta con muchísimo viento. Puede arrancar techos.' }, short: '4', mph: '75–110', mphEs: '75–110', kmh: '120–180', kmhEs: '120–180', vmax: 100, rain: 1, lightning: 0.5, hail: 1, hailSize: 0.07, cloud: 1,
    label: { en: 'Derecho', es: 'Derecho' },
    desc: { en: 'A derecho is a huge line of storms with straight-line winds that can last for hundreds of miles. Its winds can match a tornado: roofs and garage doors are ripped off and trees fall.', es: 'Un derecho es una enorme línea de tormentas con vientos rectos que pueden durar cientos de kilómetros. Sus vientos igualan a los de un tornado: arrancan techos y portones de garaje y derriban árboles.' } },
];

// Hurricanes follow the Saffir–Simpson scale (sustained wind, NWS). The simulation scales the storm down so the eye (calm centre) and the eyewall
// (the ring of the strongest wind) both fit over the town.
export const HURRICANE = [
  { id: 'h1', chip: { en: 'Strong', es: 'Fuerte' }, kid: { en: 'Strong wind and lots of rain.', es: 'Viento fuerte y mucha lluvia.' }, short: 'Cat 1', mph: '74–95', kmh: '119–153', vmax: 85, rain: 1, lightning: 0.1, cloud: 1,
    label: { en: 'Very dangerous', es: 'Muy peligroso' },
    desc: { en: 'A hurricane is a giant spinning storm with a calm, clear EYE in the middle, surrounded by a ring of the strongest wind. Category 1: shingles and siding come off, big branches snap and power lines fall.', es: 'Un huracán es una tormenta gigante que gira, con un OJO tranquilo y despejado en el centro, rodeado por un anillo de los vientos más fuertes. Categoría 1: se caen tejas y revestimientos, se rompen ramas grandes y caen cables de luz.' } },
  { id: 'h2', chip: { en: 'Stronger', es: 'Más fuerte' }, kid: { en: 'Stronger wind. Trees fall down.', es: 'Más viento. Se caen los árboles.' }, short: 'Cat 2', mph: '96–110', kmh: '154–177', vmax: 103, rain: 1, lightning: 0.14, cloud: 1,
    label: { en: 'Extremely dangerous', es: 'Extremadamente peligroso' },
    desc: { en: 'Category 2: roofs and siding are badly damaged, many trees snap or are pulled out of the ground, and the power can be out for days.', es: 'Categoría 2: los techos y revestimientos sufren mucho daño, muchos árboles se parten o se arrancan y puede faltar la luz por días.' } },
  { id: 'h3', chip: { en: 'Huge', es: 'Enorme' }, kid: { en: 'Huge wind. Roofs fly off.', es: 'Muchísimo viento. Los techos salen volando.' }, short: 'Cat 3', mph: '111–129', kmh: '178–208', vmax: 120, rain: 1, lightning: 0.16, cloud: 1,
    label: { en: 'Devastating', es: 'Devastador' },
    desc: { en: 'Category 3 is a major hurricane. Roofs and gable walls are torn off houses, and most trees fall and block the roads.', es: 'La categoría 3 es un huracán mayor. Se arrancan techos y paredes de las casas y casi todos los árboles caen y bloquean las calles.' } },
  { id: 'h4', chip: { en: 'Giant', es: 'Gigante' }, kid: { en: 'Giant wind. Houses break.', es: 'Un viento gigante. Las casas se rompen.' }, short: 'Cat 4', mph: '130–156', kmh: '209–251', vmax: 143, rain: 1, lightning: 0.18, cloud: 1,
    label: { en: 'Catastrophic', es: 'Catastrófico' },
    desc: { en: 'Category 4: most of a house’s roof and some walls are lost, nearly all trees and power poles fall, and the area can be unlivable for weeks.', es: 'Categoría 4: las casas pierden casi todo el techo y algunas paredes, caen casi todos los árboles y postes, y la zona puede quedar inhabitable por semanas.' } },
  { id: 'h5', chip: { en: 'Monster', es: 'Monstruo' }, kid: { en: 'The biggest hurricane! Almost everything breaks.', es: '¡El huracán más grande! Casi todo se rompe.' }, short: 'Cat 5', mph: '157 or more', mphEs: '157 o más', kmh: '252 or more', kmhEs: '252 o más', vmax: 170, rain: 1, lightning: 0.2, cloud: 1,
    label: { en: 'Catastrophic', es: 'Catastrófico' },
    desc: { en: 'Category 5 is the strongest. Most houses are destroyed, with total roof failure and walls collapsing. Hurricanes this strong are rare.', es: 'La categoría 5 es la más fuerte. Casi todas las casas quedan destruidas, con techos y paredes que se derrumban. Huracanes así de fuertes son raros.' } },
];

// What each kind of storm *is*, side by side (shown on the cards). In the app they are all shrunk so they fit over one town.
export const KINDS = {
  // (short kid-friendly sentences live in `kid`; the facts below are for grown-ups)
  tornado: {
    name: { en: 'Tornado', es: 'Tornado' }, kid: { en: 'A tornado is a skinny wind that spins very fast and touches the ground.', es: 'Un tornado es un viento flaquito que gira muy rápido y toca el suelo.' },
    what: { en: 'A narrow, violently spinning column of air that reaches from a storm cloud to the ground.', es: 'Una columna de aire estrecha que gira con violencia y llega desde una nube de tormenta hasta el suelo.' },
    size: { en: 'Usually 50–500 m wide (widest ever: 4.2 km)', es: 'Normalmente 50–500 m de ancho (el más ancho: 4,2 km)' },
    lasts: { en: 'A few minutes, up to about an hour', es: 'Unos minutos, hasta cerca de una hora' },
    wind: { en: '65 to over 300 mph (105 to over 480 km/h)', es: '105 a más de 480 km/h (65 a más de 300 mph)' },
    danger: { en: 'Violent wind and flying debris along a narrow path', es: 'Viento violento y escombros voladores en un camino estrecho' },
  },
  storm: {
    name: { en: 'Storm', es: 'Tormenta' }, kid: { en: 'A storm brings rain, thunder and lightning.', es: 'Una tormenta trae lluvia, truenos y relámpagos.' },
    what: { en: 'A cloud that makes rain, thunder and lightning. Strong ones can make hail, straight-line wind, and sometimes tornadoes.', es: 'Una nube que hace lluvia, truenos y relámpagos. Las fuertes pueden hacer granizo, viento recto y, a veces, tornados.' },
    size: { en: 'About 10–30 km across', es: 'Unos 10–30 km de ancho' },
    lasts: { en: '30 minutes to a few hours', es: 'De 30 minutos a unas horas' },
    wind: { en: 'Gusts of 25 to 110 mph (40 to 180 km/h)', es: 'Ráfagas de 40 a 180 km/h (25 a 110 mph)' },
    danger: { en: 'Lightning, hail, heavy rain and straight-line wind', es: 'Rayos, granizo, lluvia fuerte y viento recto' },
  },
  hurricane: {
    name: { en: 'Hurricane', es: 'Huracán' }, kid: { en: 'A hurricane is a giant storm that spins over the sea. It has a quiet eye in the middle.', es: 'Un huracán es una tormenta gigante que gira sobre el mar. Tiene un ojo tranquilo en el medio.' },
    what: { en: 'A giant storm that spins over warm ocean water, with a calm eye in the middle, a wall of storm around it, and long bands of rain.', es: 'Una tormenta gigante que gira sobre el mar cálido, con un ojo en calma en el centro, una pared de tormenta alrededor y largas bandas de lluvia.' },
    size: { en: '300–800 km across; the eye is 30–65 km wide', es: '300–800 km de ancho; el ojo mide 30–65 km' },
    lasts: { en: 'Days to weeks', es: 'De días a semanas' },
    wind: { en: '74 to over 200 mph (119 to over 320 km/h)', es: '119 a más de 320 km/h (74 a más de 200 mph)' },
    danger: { en: 'Storm surge (sea water flooding the land), huge rain and wind', es: 'Marejada ciclónica (el mar inunda la tierra), lluvia enorme y viento' },
  },
};
