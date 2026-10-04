import { secondaryLabels } from './secondaryTranslation';
const labels: Record<string,string> = {
  ...secondaryLabels,
  'FREE 1-month':'','access to Nutrigo!':'','vs last week':'respecto de la semana anterior',
  'Note':'Nota','Edit':'Editar','Remove':'Eliminar','Snacks':'Colaciones',
  'Health Score:':'Procedencia de los nutrientes','Add to Meal Plan':'Ver receta',
  'Apr':'Abr','May':'May','Jun':'Jun','Jul':'Jul','Aug':'Ago','September':'Septiembre',
  'Nutrigo':'Plan V','Dashboard':'Inicio','Calendar':'Agenda','Messages':'Mensajes','Healthy Menu':'Menú','Meal Plan':'Plan','Food Diary':'Diario','Progress':'Progreso','Exercises':'Ejercicio','Health Insights':'Recursos','Healthy Insights':'Recursos','Logout':'Salir',
  'Member':'Paciente','Search anything':'Buscar','Search placeholder':'Buscar','Search food':'Buscar comida','Search articles':'Buscar recursos','Search recipes':'Buscar recetas',
  "Let's begin our journey to better health today":'Tu acompañamiento, día a día',"Welcome and Let’s do some workout today!":'Tu acompañamiento, día a día',
  'Weight':'Peso','Steps':'Pasos','Sleep':'Descanso','Water Intake':'Hidratación','Weight Data':'Datos de peso','Current Weight':'Peso actual','Start Weight':'Peso inicial','Weight Goal':'Meta de peso','Weight Tracking':'Seguimiento de peso',
  'Calories Intake':'Consumo de calorías','Calories left':'Calorías restantes','Eaten calories':'Calorías consumidas','Burned calories':'Calorías quemadas','Carbohydrates':'Carbohidratos','Proteins':'Proteínas','Fats':'Grasas','C':'C','P':'P','F':'G',
  'Workout Progress':'Actividad','Recommended Menu':'Menú recomendado','Recommended Exercises':'Ejercicio recomendado','Recent Activity':'Actividad reciente','This Week':'Esta semana','This Month':'Este mes','Today':'Hoy','Yesterday':'Ayer',
  'Breakfast':'Desayuno','Lunch':'Almuerzo','Snack':'Merienda','Dinner':'Cena','All':'Todas','All Meals':'Todas las comidas','All Categories':'Todas las categorías','Date':'Fecha','Category':'Categoría','Name':'Nombre','Status':'Estado','Description':'Descripción',
  'Pending':'Pendiente','Purchased':'Comprado','Completed':'Completado','Reviewed':'Revisado','Confirmed':'Confirmado','Add':'Agregar','Add New':'Agregar','Save':'Guardar','Cancel':'Cancelar','View All':'Ver todo','See All':'Ver todo','Show More':'Ver más','Sort by':'Ordenar','Filter':'Filtrar','Filters':'Filtros',
  'Grocery List':'Compras','Ingredients':'Ingredientes','Quantity':'Cantidad','Unit':'Unidad','Price':'Precio','Total':'Total','Subtotal':'Subtotal','Total Cost':'Costo total','Estimated Cost':'Costo estimado','Shopping List':'Lista de compras',
  'Fruits':'Frutas','Veggies':'Verduras','Vegetables':'Verduras','Protein':'Proteína','Dairy':'Lácteos','Grains':'Cereales','Oils':'Aceites','Others':'Otros','Nuts & Seeds':'Frutos secos y semillas','Meat & Seafood':'Carnes y pescado',
  'Prep Time':'Preparación','Preparation':'Preparación','Cooking Time':'Cocción','Servings':'Porciones','Directions':'Preparación','Instructions':'Preparación','Nutrition Facts':'Información nutricional','Nutritional Info':'Información nutricional','Nutrients':'Nutrientes','Calories':'Calorías','Difficulty':'Dificultad',
  'Mon':'Lun','Tue':'Mar','Wed':'Mié','Thu':'Jue','Fri':'Vie','Sat':'Sáb','Sun':'Dom','Monday':'Lunes','Tuesday':'Martes','Wednesday':'Miércoles','Thursday':'Jueves','Friday':'Viernes','Saturday':'Sábado','Sunday':'Domingo',
  'Chest':'Pecho','Waist':'Cintura','Hips':'Cadera','Arm':'Brazo','Thigh':'Muslo','Body Measurement':'Medidas','Progress Photos':'Fotos de progreso','Calories Activities':'Actividad calórica','Sleep Statistics':'Descanso','Hydration':'Hidratación','Intake':'Consumo',
  'Last 4 Days':'Últimos días','Last 5 Days':'Últimos días','Consumed':'Consumidas','Burned':'Quemadas','Deep Sleep':'Sueño profundo','Light Sleep':'Sueño ligero','REM Phase':'Fase REM','Awake':'Despierta','Hydration Level':'Hidratación','Normal':'Sin evaluación',
  'Recent':'Recientes','Featured':'Destacados','Trending':'Tendencias','Popular':'Populares','Recommended':'Recomendados','Featured Article':'Recurso destacado','Popular Insights':'Recursos','Recommended Article':'Recursos recomendados','Recommended Video':'Videos','Trending Tags':'Categorías','Top Author':'Autoría',
  'Nutrition & Wellness':'Nutrición','Health & Lifestyle':'Hábitos','Fitness & Nutrition':'Actividad y nutrición','Health & Wellness':'Salud','Mental Health & Wellness':'Bienestar','Nutrition':'Nutrición','Wellness':'Bienestar',
  'Privacy Policy':'Privacidad','Term and conditions':'Términos y condiciones','Contact':'Contacto','Claim Now!':'Ver mi plan',
  'kcal':'kcal','kg':'kg','Kg':'kg','cm':'cm','g':'g','gr':'g','L':'L','litre':'L','hours':'h','steps':'pasos','min':'min','minutes':'min','units':'unidades','unit':'unidad',
  'Consultation':'Consulta','Meeting':'Turno','Appointment':'Turno','Upcoming':'Próximos','Online':'En línea','Offline':'Sin conexión','Type a message':'Escribí un mensaje','Type a message...':'Escribí un mensaje…','Attachments':'Adjuntos','Files':'Archivos','Media':'Imágenes','Links':'Enlaces',
};
/** Sample figures, names and recommendations are never shown as patient data. */
export function translateSource(text: string): string {
  const value = text.trim();
  if (!value) return text;
  if (value in labels) return labels[value];
  if (/Copyright/.test(value)) return `Copyright © ${new Date().getFullYear()} Plan V`;
  if (/^Hello,/.test(value)) return 'Hola';
  if (/^Start your health journey/.test(value)) return 'Tu plan y tus registros, siempre a mano.';
  if (/Progress is progress/.test(value)) return 'Cada registro te ayuda a seguir tu progreso.';
  if (/^[.,:;/%()+–—\-]+$/.test(value)) return value;
  return '—';
}
