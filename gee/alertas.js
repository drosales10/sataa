/**
* GEO-MONITOR VENEZUELA: PLATAFORMA INTEGRAL DE MONITOREO
* Cliente: Mesa10 Indicadores Ambientales
* Configuración: Centrado Nacional y Vista Satelital Híbrida
* Módulos: Carbono, Deforestación (Alerta 5%), Inundación (AHP), Incendios (FIRMS) 
*/

// =================================================================================
// 1. IDENTIDAD INSTITUCIONAL Y PARÁMETROS
// =================================================================================
var BRANDING = {
  institucion: 'Foro Chat Sector Forestal Venezolano',
  proyecto: 'Sistema de Monitoreo Ambiental ABRAE de Venezuela',
  Líder: 'Denny Javier Rosales',
  logo_color: '#1a5276'
};

var analysisYear = 2024;

// Valores de carbono en toneladas de carbono por hectárea (tC/ha) para cada clase según Dynamic World.
var STOCKS_CARBONO = [0, 150, 20, 40, 35, 60, 5, 2]; // tC/ha

var CLASS_NAMES = ['Agua', 'Bosque', 'Pastizales', 'Veg. Inundada', 'Cultivos', 'Matorral', 'Urbano', 'Suelo Desnudo'];
// Paleta de colores para la visualización de la cobertura del suelo de Dynamic World.

var dwVisParams = {min: 0, max: 8, palette: ['#419BDF', '#397D49', '#88B053', '#7A87C6', '#E49635', '#DFC35A', '#C82828', '#A59B8B']};

// Colecciones de datos de Earth Engine.
var wdpa = ee.FeatureCollection("WCMC/WDPA/current/polygons").filter(ee.Filter.eq('ISO3', 'VEN'));
var firms = ee.ImageCollection("FIRMS");
var chirps = ee.ImageCollection("UCSB-CHG/CHIRPS/DAILY");
var nasadem = ee.Image("NASA/NASADEM_HGT/001");

// =================================================================================
// 2. FUNCIONES AUXILIARES Y MÓDULOS TÉCNICOS
// =================================================================================

// Función LULC Dinámica
function getDynamicWorldLulc(year, region) {
  var start = ee.Date.fromYMD(year, 1, 1);
  return ee.ImageCollection('GOOGLE/DYNAMICWORLD/V1')
    .filterDate(start, start.advance(1, 'year'))
    .filterBounds(region).select('label').mode().rename('lulc').clip(region);
}

// Módulo de Inundación Adaptativo (Venezuela)
var calcularInundacion = function(aoi, rain, dem, slope) {
  // CORRECCIÓN: El asset 'WWF/HydroSHEDS/15acc' es obsoleto o no se encuentra.
  // Se reemplaza con MERIT Hydro, un conjunto de datos hidrográficos más moderno.
  // El umbral para definir ríos se ajusta de 500 (conteo de celdas) a 100 (km^2 de área de drenaje).
  var flowAccumulation = ee.Image("MERIT/Hydro/v1_0_1").select('upa').clip(aoi);
  var rivers = flowAccumulation.gt(100).selfMask();
  var distR = rivers.fastDistanceTransform().multiply(ee.Image.pixelArea().sqrt()).clip(aoi);
  
  // Pesos Adaptativos según elevación media
  var elevMedia = dem.reduceRegion({reducer: ee.Reducer.mean(), geometry: aoi, scale: 100, maxPixels: 1e9}).get('elevation');
  var pesos = ee.Dictionary(ee.Algorithms.If(ee.Number(elevMedia).gt(500),
    {wL: 0.35, wS: 0.40, wR: 0.15, wE: 0.10}, // Montaña
    {wL: 0.25, wS: 0.10, wR: 0.35, wE: 0.30}  // Llanura/Delta
  ));

  var rL = rain.where(rain.lt(5), 1).where(rain.gte(5).and(rain.lt(8)), 3).where(rain.gte(8), 5);
  var rS = slope.where(slope.gt(15), 1).where(slope.lte(15).and(slope.gt(5)), 3).where(slope.lte(5), 5);
  var rE = dem.where(dem.gt(1000), 1).where(dem.lte(1000).and(dem.gt(200)), 3).where(dem.lte(200), 5);
  var rD = distR.where(distR.gt(1000), 1).where(distR.lte(1000).and(distR.gt(200)), 3).where(distR.lte(200), 5);
  
  // CORRECCIÓN DE ERROR: Se debe convertir explícitamente cada peso a ee.Number().
  // El método .get() en un diccionario del servidor devuelve un ee.Object,
  // y la función .multiply() requiere un ee.Number o ee.Image para operar correctamente.
  // Esto resuelve el error "Image.multiply, argument 'image2': Invalid type. Expected type: Image. Actual type: Float."
  return rL.multiply(ee.Number(pesos.get('wL'))).add(rS.multiply(ee.Number(pesos.get('wS'))))
    .add(rD.multiply(ee.Number(pesos.get('wR')))).add(rE.multiply(ee.Number(pesos.get('wE')))).rename('f_risk');
};


// =================================================================================
// 3. DISEÑO DEL DASHBOARD Y CONFIGURACIÓN DEL MAPA
// =================================================================================
ui.root.clear();
var controlPanel = ui.Panel({style: {width: '420px', padding: '15px', border: '1px solid #ddd'}});
var mainMap = ui.Map();
ui.root.add(ui.SplitPanel(mainMap, controlPanel, 'horizontal'));

// --- MEJORA SOLICITADA: Centrado inicial en Venezuela y vista satelital ---
mainMap.setOptions('HYBRID'); // Vista de satélite con etiquetas
mainMap.setCenter(-66.58, 6.42, 6); // Coordenadas centrales de Venezuela y nivel de zoom nacional

// Header del Panel
controlPanel.add(ui.Label('GEO-MONITOR VENEZUELA', {fontWeight: 'bold', fontSize: '24px', color: BRANDING.logo_color}));
controlPanel.add(ui.Label(BRANDING.institucion, {fontSize: '10px', color: '#7f8c8d'}));

// Sección de Controles
var controlSection = ui.Panel({style: {padding: '10px', backgroundColor: '#f8f9f9', border: '1px solid #ddd'}});
var typeSel = ui.Select({placeholder: 'Tipo de ABRAE', style: {stretch: 'horizontal'}});
var nameSel = ui.Select({placeholder: 'Nombre de ABRAE', disabled: true, style: {stretch: 'horizontal'}});
controlSection.add(typeSel); controlSection.add(nameSel);

controlPanel.add(ui.Label('Monitor de Alertas ABRAE Venezuela', {fontWeight: 'bold', fontSize: '20px', color: '#2c3e50'}));
var checks = {
  carbono: ui.Checkbox('Carbono y Cobertura', true),
  defo: ui.Checkbox('Deforestación (5%)', true),
  inun: ui.Checkbox('Riesgo de Inundación', true),
  ince: ui.Checkbox('Incendios (Alerta FIRMS)', true)
};
controlSection.add(checks.carbono).add(checks.defo).add(checks.inun).add(checks.ince);
controlPanel.add(controlSection);

var startBtn = ui.Button({label: '? INICIAR PROCESAMIENTO', style: {stretch: 'horizontal', margin: '10px 0'}});
var printBtn = ui.Button({label: '?️ PREPARAR REPORTE PDF', style: {stretch: 'horizontal'}, disabled: true});
controlPanel.add(startBtn).add(printBtn);

var resultsPanel = ui.Panel();
controlPanel.add(resultsPanel);

// =================================================================================
// 4. LÓGICA DE PROCESAMIENTO
// =================================================================================
function runAnalysis() {
  resultsPanel.clear().add(ui.Label('⚙️ Procesando, por favor espere...', {padding: '10px'}));
  mainMap.layers().reset();
  var name = nameSel.getValue();
  var type = typeSel.getValue();
  if (!name) {
    resultsPanel.clear();
    ui.Panel.alert('Por favor, seleccione una ABRAE para iniciar el análisis.');
    return;
  }

  var aoi = wdpa.filter(ee.Filter.and(ee.Filter.eq('DESIG', type), ee.Filter.eq('NAME', name))).union(1);
  mainMap.centerObject(aoi, 10); // Enfocar el mapa en el ABRAE seleccionada

  var centroid = aoi.geometry().centroid(100); // Cálculo del centroide para la ficha técnica

  // --- Insumos satelitales (con manejo de colecciones vacías para evitar errores) ---
  // Colección para el año actual
  var dwCollectionActual = ee.ImageCollection('GOOGLE/DYNAMICWORLD/V1')
      .filterDate(analysisYear + '-01-01', analysisYear + '-12-31')
      .filterBounds(aoi);

  // Colección para el año anterior
  var dwCollectionAnterior = ee.ImageCollection('GOOGLE/DYNAMICWORLD/V1')
      .filterDate((analysisYear - 1) + '-01-01', (analysisYear - 1) + '-12-31')
      .filterBounds(aoi);
      
  // Imagen por defecto (vacía) si no se encuentran imágenes en la colección.
  // Se le pone un nombre de banda para evitar errores en .select() más adelante.
  var defaultDwImage = ee.Image(0).rename('label').selfMask();

  // Se calcula el modo si la colección no está vacía, de lo contrário se usa la imagen por defecto.
  // Esto previene errores si no hay imágenes para el área/fecha seleccionada.
  var lActual = ee.Image(ee.Algorithms.If(
    dwCollectionActual.size().gt(0),
    dwCollectionActual.select('label').mode(),
    defaultDwImage
  )).clip(aoi);
  
  var lAnterior = ee.Image(ee.Algorithms.If(
    dwCollectionAnterior.size().gt(0),
    dwCollectionAnterior.select('label').mode(),
    defaultDwImage
  )).clip(aoi);
  
  var areaHa = ee.Image.pixelArea().divide(10000);

  // --- Lógica de cálculo de estadísticas (CORREGIDO Y OPTIMIZADO) ---
  // CORRECCIÓN: El error original "Dictionary does not contain key: 'remap'" ocurría porque
  // `reduceRegion` sobre una imagen completamente enmascarada (sin datos) devuelve un
  // diccionario vacío `{}`, y llamar a `.get()` sobre él causa un error en el servidor.
  // SOLUCIÓN: Se combinan todas las capas de análisis en una sola imagen multibanda.
  // Luego, se realiza una única llamada a `reduceRegion`. Esto es más eficiente y robusto.
  // Si una banda no tiene datos, su clave simplemente no aparecerá en el diccionario resultante,
  // pero no detendrá la ejecución.

  // Insumos
  var dem = nasadem.select('elevation').clip(aoi);
  var slope = ee.Terrain.slope(dem);
  var rain = chirps.filterDate(analysisYear + '-01-01', analysisYear + '-12-31').mean().clip(aoi);
  var s2 = ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
             .filterBounds(aoi)
             .filterDate(analysisYear + '-01-01', analysisYear + '-12-31')
             .median()
             .clip(aoi);

  // --- Módulo Incendios y Alerta FIRMS ---
  if (checks.ince.getValue()) {
    var ndwi = s2.normalizedDifference(['B8', 'B11']);
    var rInc = ndwi.expression('(b(0) < 0.1) ? 5 : (b(0) < 0.3) ? 3 : 1').clip(aoi);
    var focos = firms.filterBounds(aoi).filterDate(ee.Date(Date.now()).advance(-3, 'day'), ee.Date(Date.now())).select('T21').max().clip(aoi);

    mainMap.addLayer(rInc, {min: 1, max: 5, palette: ['#ffffb2', '#fd8d3c', '#bd0026']}, 'Riesgo Incendio', false);
    mainMap.addLayer(focos, {min: 300, max: 400, palette: ['yellow', 'red']}, 'FUEGO ACTIVO (NASA)');

    focos.reduceRegion({reducer: ee.Reducer.count(), geometry: aoi, scale: 1000, maxPixels: 1e9}).evaluate(function(c) {
      resultsPanel.clear(); // Limpiar el mensaje de "procesando"
      var count = c.T21 || 0;
      if (count > 10) {
        resultsPanel.add(ui.Panel([ui.Label('⚠️ EMERGENCIA: ' + count + ' INCENDIOS ACTIVOS', {fontWeight:'bold', color:'white'})], null, {backgroundColor:'#d63031', padding:'10px'}));
        resultsPanel.add(ui.Thumbnail({image: s2.visualize({bands:['B4','B3','B2'], min:0, max:3000}).blend(focos.visualize({palette:['yellow','red'], min:300, max:400})), params:{dimensions:300, region:aoi.geometry().bounds()}, style:{width:'100%'}}));
      }
    });
  }

  // --- Módulo Deforestación y Alerta 5% ---
  if (checks.defo.getValue()) {
    //var lAnterior = getDynamicWorldLulc(analysisYear - 1, aoi);
    //var lActual = getDynamicWorldLulc(analysisYear, aoi);
    var aBosque = ee.Image.pixelArea().updateMask(lAnterior.eq(1)).reduceRegion({reducer: ee.Reducer.sum(), geometry: aoi, scale: 30, maxPixels: 1e9}).get('area');
    var aPerdida = ee.Image.pixelArea().updateMask(lAnterior.eq(1).and(lActual.neq(1))).reduceRegion({reducer: ee.Reducer.sum(), geometry: aoi, scale: 30, maxPixels: 1e9}).get('area');
    
    ee.Number(aPerdida).divide(aBosque).multiply(100).evaluate(function(p) {
      if (p > 5) resultsPanel.add(ui.Panel([ui.Label('? DEFORESTACIÓN CRÍTICA: ' + p.toFixed(2) + '%', {fontWeight:'bold', color:'white'})], null, {backgroundColor:'#e67e22', padding:'10px'}));
    });
    mainMap.addLayer(lAnterior.eq(1).and(lActual.neq(1)).selfMask(), {palette:'red'}, 'Deforestación Anual ('+(analysisYear-1)+'-'+analysisYear+')');
  }

  // --- Módulo Inundación ---
  if (checks.inun.getValue()) {
    var rInu = calcularInundacion(aoi, rain, dem, slope);
    mainMap.addLayer(rInu, {min: 1, max: 5, palette: ['#eff3ff', '#bdd7e7', '#6baed6', '#3182bd', '#08519c']}, 'Riesgo Inundación');
  }
  
  // --- Módulo Carbono ---
  if (checks.carbono.getValue()){
    var lulc = getDynamicWorldLulc(analysisYear, aoi);
    mainMap.addLayer(lulc, dwVisParams, 'Cobertura del Suelo ' + analysisYear);
  }

// 1. Crear bandas individuales para el análisis.
  var carbonoHa = lActual.remap([0, 1, 2, 3, 4, 5, 6, 7], STOCKS_CARBONO);
  var carbonoTotal = carbonoHa.multiply(areaHa).rename('carbono');
  var bosqueBase = areaHa.updateMask(lAnterior.eq(1)).rename('base');
  var bosquePerdido = areaHa.updateMask(lAnterior.eq(1).and(lActual.neq(1))).rename('perdida');

  // 2. Combinar bandas en una sola imagen para una reducción eficiente.
  var analysisImage = carbonoTotal.addBands(bosqueBase).addBands(bosquePerdido);

  // 3. Reducir la imagen multi-banda.
  var regionStats = analysisImage.reduceRegion({
    reducer: ee.Reducer.sum(),
    geometry: aoi,
    scale: 30,
    maxPixels: 1e10,
    bestEffort: true
  });
  
  // 4. Construir el diccionario final de estadísticas de forma segura.
  // Se accede a los resultados de la reducción y se añaden las coordenadas.
  // El método .get() en un diccionario del servidor devolverá `null` si la clave no existe,
  // evitando el error. La función de callback `stats.evaluate` está diseñada para manejar estos nulos.
  var stats = ee.Dictionary({
    carbono: regionStats.get('carbono'),
    base: regionStats.get('base'),
    perdida: regionStats.get('perdida'),
    lon: centroid.coordinates().get(0),
    lat: centroid.coordinates().get(1)
  });


  // Evaluar las estadísticas y construir el panel de resultados de forma asíncrona.
  stats.evaluate(function(res, err) {
    resultsPanel.clear(); // Limpiar el mensaje de "Procesando..."
    
    if (err) {
      // Manejo de errores del servidor: notifica al usuario en el panel.
      
      // CAMBIA ESTA LÍNEA:
      print('Error en el cálculo de estadísticas:', err); 
      
      resultsPanel.add(ui.Label('❌ Error al procesar. Verifique el área seleccionada o intente de nuevo. Detalle: ' + err, {color: 'red'}));
      return;
    }
    
    // Si res es null o undefined (puede ocurrir si el área es muy pequeña o sin datos)
    if (!res || res.lat === null || res.lon === null) {
      resultsPanel.add(ui.Label('⚠️ No se pudieron calcular las estadísticas. ' + 
        'El área puede ser muy pequeña o no contener datos válidos.', {color: 'orange'}));
      return;
    }
    
    // Cálculo robusto del porcentaje de deforestación, manejando valores nulos o cero.
    var baseArea = res.base || 0;
    var lostArea = res.perdida || 0;
    var pDefo = (baseArea > 0) ? (lostArea / baseArea) * 100 : 0;
    
    var carbonoTotalVal = res.carbono || 0; // Manejar si el carbono es null.

    // --- CONSTRUCCIÓN DEL REPORTE PROFESIONAL ---
    resultsPanel.add(ui.Label(BRANDING.institucion, {fontSize: '11px', fontWeight: 'bold', textAlign: 'center'}));
    
    // Inset Map Nacional
    var insetMap = ui.Map({style: {height: '160px', margin: '10px 0'}});
    insetMap.setControlVisibility(false);
    insetMap.centerObject(ee.Geometry.Point([-66.5, 6.5]), 5);
    insetMap.addLayer(wdpa.filter(ee.Filter.eq('ISO3', 'VEN')).style({color: '444444', fillColor: 'gray', width: 0.5}), {}, 'Venezuela');
    insetMap.addLayer(aoi, {color: 'red'}, 'ABRAE');
    resultsPanel.add(insetMap);

    // Ficha de Coordenadas
    var coordTable = ui.Panel([
      ui.Label('FICHA TÉCNICA DE UBICACIÓN', {fontWeight: 'bold', fontSize: '11px', color: BRANDING.logo_color}),
      ui.Panel([
        ui.Label('Latitud: ' + res.lat.toFixed(6), {fontSize: '10px', width: '50%'}),
        ui.Label('Longitud: ' + res.lon.toFixed(6), {fontSize: '10px', width: '50%'})
      ], ui.Panel.Layout.flow('horizontal'))
    ], null, {border: '1px solid #ccc', padding: '8px', margin: '5px 0'});
    resultsPanel.add(coordTable);

    resultsPanel.add(ui.Label('ANÁLISIS DE ÁREA: ' + name, {fontWeight: 'bold', fontSize: '15px'}));
    
    // Indicadores KPI
    var kpis = ui.Panel([
      ui.Panel([ui.Label('Carbono (tC)', {fontSize:'9px'}), ui.Label(Math.round(carbonoTotalVal).toLocaleString(), {fontWeight:'bold'})], null, {width:'48%', border:'1px solid #ddd'}),
      ui.Panel([ui.Label('Pérdida Bosque', {fontSize:'9px'}), ui.Label(pDefo.toFixed(2) + '%', {fontWeight:'bold', color: pDefo > 5 ? 'red' : 'green'})], null, {width:'48%', border:'1px solid #ddd'})
    ], ui.Panel.Layout.flow('horizontal'));
    resultsPanel.add(kpis);

    // Gráfica de Distribución
    var chart = ui.Chart.image.byClass({
      image: areaHa.addBands(lActual), classBand: 'label', region: aoi, reducer: ee.Reducer.sum(), scale: 100, classLabels: CLASS_NAMES
    }).setOptions({title: 'Distribución de Uso de Suelo (Ha)', colors: dwVisParams.palette});
    resultsPanel.add(chart);
    
    printBtn.setDisabled(false);
  });

  mainMap.addLayer(lActual, dwVisParams, 'Cobertura Vegetal Actual');
  mainMap.addLayer(ee.Image().paint(aoi, 0, 2), {palette: 'yellow'}, 'Límite Geográfico');
}

// Configuración de Selectores
wdpa.aggregate_array('DESIG').distinct().sort().evaluate(function(t) {
  typeSel.items().reset(t);
  typeSel.setPlaceholder('Tipo de ABRAE');
});

typeSel.onChange(function(v) {
  nameSel.setDisabled(true);
  wdpa.filter(ee.Filter.eq('DESIG', v)).aggregate_array('NAME').distinct().sort().evaluate(function(n) {
    nameSel.items().reset(n);
    nameSel.setDisabled(false);
  });
});
// Lógica del Botón Imprimir
printBtn.onClick(function() {
  controlPanel.style().set('width', '100%');
  resultsPanel.insert(0, ui.Label('INSTRUCCIONES: Presione Ctrl+P y elija "Guardar como PDF". Ajuste el diseño a Horizontal si es necesario.', {color: 'blue', fontSize: '12px'}));
});
startBtn.onClick(runAnalysis);