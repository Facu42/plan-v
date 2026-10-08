/**
 * Vocabulario curado de ingredientes de la cocina argentina (clave singular, sin tildes → inglés culinario).
 * Solo estos nombres generan foto: lo que no está acá (texto libre, nombres propios, cualquier dato escrito por error)
 * no se encola, no viaja a Cloudflare y la pantalla queda sin foto.
 */
export const INGREDIENT_NOUNS: Readonly<Record<string, string>> = {
  // Verduras y hortalizas
  tomate: 'tomato', 'tomate cherry': 'cherry tomatoes', 'tomate triturado': 'canned crushed tomatoes', cebolla: 'onion', 'cebolla morada': 'red onion',
  'cebolla de verdeo': 'spring onions', ajo: 'garlic', puerro: 'leek', zanahoria: 'carrot', papa: 'potato', batata: 'sweet potato', zapallo: 'pumpkin',
  'zapallo anco': 'butternut squash', zapallito: 'zucchini', calabaza: 'pumpkin', calabacin: 'zucchini', berenjena: 'eggplant', pimiento: 'bell pepper',
  morron: 'bell pepper', aji: 'chili pepper', pepino: 'cucumber', lechuga: 'lettuce', rucula: 'arugula', espinaca: 'spinach', acelga: 'Swiss chard',
  repollo: 'cabbage', 'repollo morado': 'red cabbage', brocoli: 'broccoli', coliflor: 'cauliflower', remolacha: 'beetroot', choclo: 'corn on the cob',
  maiz: 'corn kernels', arveja: 'green peas', chaucha: 'green beans', apio: 'celery', hinojo: 'fennel', champinon: 'mushrooms', hongo: 'mushrooms',
  palta: 'avocado', rabano: 'radish', nabo: 'turnip', esparrago: 'asparagus', alcaucil: 'artichoke', palmito: 'hearts of palm', verdura: 'mixed fresh vegetables',
  jengibre: 'fresh ginger root', 'hoja verde': 'green salad leaves',
  // Hierbas y especias
  perejil: 'parsley', albahaca: 'basil', cilantro: 'cilantro', menta: 'mint', romero: 'rosemary', tomillo: 'thyme', laurel: 'bay leaves', 'hoja de laurel': 'bay leaves',
  oregano: 'dried oregano', pimienta: 'black peppercorns', pimenton: 'paprika', comino: 'cumin seeds', curcuma: 'turmeric powder', canela: 'cinnamon sticks',
  'nuez moscada': 'nutmeg', 'aji molido': 'chili flakes', 'ajo en polvo': 'garlic powder', sal: 'coarse salt', 'sal marina': 'coarse sea salt',
  // Frutas
  manzana: 'apple', pera: 'pear', banana: 'banana', naranja: 'orange', mandarina: 'tangerine', pomelo: 'grapefruit', limon: 'lemon', lima: 'lime',
  frutilla: 'strawberries', arandano: 'blueberries', frambuesa: 'raspberries', mora: 'blackberries', durazno: 'peach', ciruela: 'plum', damasco: 'apricot',
  cereza: 'cherries', uva: 'grapes', kiwi: 'kiwi', anana: 'pineapple', melon: 'melon', sandia: 'watermelon', mango: 'mango', papaya: 'papaya', higo: 'figs',
  granada: 'pomegranate', 'pasa de uva': 'raisins', datil: 'dates', coco: 'coconut', fruta: 'assorted fresh fruit', 'fruto rojo': 'mixed red berries',
  aceituna: 'olives', 'fruto seco': 'mixed nuts',
  // Carnes, pescados y huevos
  pollo: 'chicken', 'pechuga de pollo': 'chicken breast', 'muslo de pollo': 'chicken thighs', carne: 'raw beef', bife: 'raw beef steak',
  lomo: 'raw beef tenderloin', nalga: 'raw beef', peceto: 'raw beef', cuadril: 'raw beef', vacio: 'raw beef flank', asado: 'raw beef short ribs', cerdo: 'raw pork',
  bondiola: 'raw pork shoulder', jamon: 'ham', panceta: 'bacon', chorizo: 'raw sausage', salchicha: 'sausages', pavo: 'turkey', cordero: 'raw lamb', higado: 'raw liver',
  huevo: 'eggs', 'clara de huevo': 'egg whites', 'yema de huevo': 'egg yolks', merluza: 'raw white fish fillet', pescado: 'raw fish fillet', salmon: 'raw salmon fillet',
  atun: 'tuna', sardina: 'sardines', trucha: 'raw trout', camaron: 'shrimp', langostino: 'prawns', calamar: 'squid', mejillon: 'mussels', surimi: 'surimi sticks',
  tofu: 'tofu', seitan: 'seitan',
  // Lácteos
  leche: 'milk', 'leche descremada': 'skim milk', 'leche en polvo': 'milk powder', yogur: 'yogurt', 'yogur griego': 'Greek yogurt', queso: 'cheese',
  'queso cremoso': 'cream cheese', 'queso port salut': 'semi-soft cheese', 'queso untable': 'cream cheese spread',
  mozzarella: 'mozzarella', parmesano: 'parmesan cheese', ricota: 'ricotta cheese', crema: 'cream', 'crema de leche': 'heavy cream', manteca: 'butter',
  'dulce de leche': 'dulce de leche', margarina: 'margarine',
  // Cereales, panificados y legumbres
  arroz: 'rice', 'arroz integral': 'brown rice', avena: 'rolled oats', quinoa: 'quinoa', polenta: 'cornmeal polenta', fideo: 'dry pasta', pasta: 'dry pasta',
  noqui: 'potato gnocchi', harina: 'flour', 'harina de trigo': 'wheat flour', 'harina de maiz': 'corn flour', 'harina de almendra': 'almond flour',
  'harina integral': 'wholegrain flour', pan: 'bread', 'pan lactal': 'sliced sandwich bread', galletita: 'crackers', galleta: 'plain biscuits',
  tostada: 'toast', granola: 'granola', cereal: 'breakfast cereal', 'tapa de empanada': 'empanada dough discs', 'tapa de tarta': 'pie crust dough',
  lenteja: 'dry lentils', garbanzo: 'dry chickpeas', poroto: 'dry beans', soja: 'soybeans', cuscus: 'couscous', burgul: 'bulgur', semola: 'semolina',
  maicena: 'cornstarch', trigo: 'wheat grains', pure: 'mashed potatoes',
  // Frutos secos y semillas
  nuez: 'walnuts', almendra: 'almonds', mani: 'peanuts', avellana: 'hazelnuts', castana: 'cashew nuts', pistacho: 'pistachios', 'semilla de chia': 'chia seeds',
  'semilla de lino': 'flaxseeds', 'semilla de girasol': 'sunflower seeds', 'semilla de sesamo': 'sesame seeds', 'semilla de zapallo': 'pumpkin seeds', chia: 'chia seeds',
  lino: 'flaxseeds', sesamo: 'sesame seeds', semilla: 'mixed seeds',
  // Despensa
  aceite: 'oil', 'aceite de oliva': 'olive oil', 'aceite de girasol': 'sunflower oil', 'aceite de coco': 'coconut oil', vinagre: 'vinegar', 'vinagre de manzana': 'apple cider vinegar',
  mayonesa: 'mayonnaise', mostaza: 'mustard', ketchup: 'ketchup', 'salsa de soja': 'soy sauce', 'salsa de tomate': 'tomato sauce', 'pure de tomate': 'tomato puree',
  'extracto de tomate': 'tomato paste', caldo: 'broth', 'caldo de verdura': 'vegetable broth', azucar: 'sugar', 'azucar mascabo': 'brown sugar', edulcorante: 'sweetener packets',
  miel: 'honey', mermelada: 'jam', cacao: 'cocoa powder', chocolate: 'chocolate', 'esencia de vainilla': 'vanilla extract', 'polvo de hornear': 'baking powder',
  levadura: 'yeast', bicarbonato: 'baking soda', hummus: 'hummus', cafe: 'coffee beans', te: 'tea leaves', agua: 'a glass of water',
};

/** Palabras que modifican a un ingrediente conocido («arroz integral», «lenteja seca»). Solas no alcanzan. */
export const INGREDIENT_MODIFIERS: Readonly<Record<string, string>> = {
  seco: 'dried', seca: 'dried', natural: 'plain', integral: 'wholegrain', molido: 'ground', molida: 'ground', verde: 'green', rojo: 'red', roja: 'red',
  negro: 'black', negra: 'black', blanco: 'white', blanca: 'white', amarillo: 'yellow', amarilla: 'yellow', morado: 'purple', morada: 'purple', dulce: 'sweet',
  light: 'light', descremado: 'skim', descremada: 'skim', semidescremado: 'low-fat', semidescremada: 'low-fat', cremoso: 'creamy', cremosa: 'creamy',
  fino: 'fine', fina: 'fine', colorado: 'red', filet: 'fillet', filete: 'fillet',
};
