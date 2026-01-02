// = ================================================================================
// SECCIÓN 1: CONFIGURACIÓN Y PARÁMETROS
// =================================================================================

// 1. COEFICIENTES DE CARBONO (Estimación tC/ha)
// Ajusta estos valores según el tipo de bosque local (ej. Imataca vs Llanos)
// Orden de clases DW: [Agua, Árboles, Pasto, Veg. Inundada, Cultivos, Matorral/Arbusto, Construido, Suelo Desnudo]
var STOCKS_CARBONO = [0, 150, 20, 40, 35, 60, 5, 2];

// 2. PARÁMETROS DE ANÁLISIS
// El año de análisis se calcula como el año completo anterior al actual.
var analysisYear = new Date().getFullYear() - 1;
var analysisYearPred = new Date().getFullYear() - 1;

// =================================================================================
// SECCIÓN 2: COLECCIONES DE DATOS Y FUNCIONES AUXILIARES
// =================================================================================

// Colecciones de datos base
var dwCollection = ee.ImageCollection('GOOGLE/DYNAMICWORLD/V1');
var s2SrCollection = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED');
var nppCollection = ee.ImageCollection('MODIS/061/MOD17A3HGF');
// Colección de Áreas Protegidas (WDPA) filtrada para Venezuela
var wdpa = ee.FeatureCollection("WCMC/WDPA/current/polygons");
// MODIFICACIÓN: Se filtra por 'ISO3' en lugar de 'PARENT_ISO' para mayor robustez,
// ya que ISO3 es un estándar más consistente para la identificación de países.
var abraesVenezuela = wdpa.filter(ee.Filter.eq('ISO3', 'VEN'));


// Visualización y Nombres de Clases (Español)
var dwVisParams = {
  min: 0,
  max: 8, // DW class range is 0-8
  palette: ['#419BDF', '#397D49', '#88B053', '#7A87C6', '#E49635', '#DFC35A', '#C82828', '#A59B8B', '#B39FE1']
};
var CLASS_NAMES = ee.List([
  'Agua', 'Bosque/Árboles', 'Pastizales', 'Veg. Inundada',
  'Cultivos', 'Matorral', 'Urbano/Construido', 'Suelo Desnudo', 'Nieve/Hielo'
]);


// Función para enmascarar nubes en Sentinel-2 usando la banda SCL
function maskS2cloudsWithSCL(image) {
  var scl = image.select('SCL');
  // Píxeles deseados: vegetación (4), suelo desnudo (5), agua (6).
  // Se excluyen nubes, sombras, etc., para una mejor visualización.
  var desiredPixels = scl.eq(4).or(scl.eq(5)).or(scl.eq(6));
  return image.updateMask(desiredPixels);
}

// Función para obtener LULC de Dynamic World para un año y región específicos
function getDynamicWorldLulc(year, region) {
  var yearStartDate = ee.Date.fromYMD(year, 1, 1);
  var yearEndDate = yearStartDate.advance(1, 'year');
  var dwLulc = dwCollection
    .filterDate(yearStartDate, yearEndDate)
    .filterBounds(region)
    .select('label')
    .mode(); // Use mode to get the most frequent class per pixel over the year.

  return dwLulc.rename('lulc').clip(region);
}

// =================================================================================
// SECCIÓN 3: INTERFACE DE USUARIO (UI)
// =================================================================================

// Limpiar la interfaz y configurar paneles principales
ui.root.clear();

// Panel para los controles y resultados. Se mostrará en el lado derecho.
// MODIFICACIÓN: Se elimina el ancho fijo ('width') para permitir que el panel
// sea responsivo y se ajuste al tamaño del SplitPanel. El usuario puede arrastrar
// la división para ajustar el ancho según sea necesario.
var mainPanel = ui.Panel({
  style: {
    padding: '10px',
    backgroundColor: '#f4f4f4'
  }
});

// El mapa se mostrará en el lado izquierdo.
var map = ui.Map();

// Se utiliza un ui.SplitPanel para organizar el mapa a la izquierda y el panel de resultados/controles a la derecha.
var splitPanel = ui.SplitPanel({
  firstPanel: map,
  secondPanel: mainPanel,
  orientation: 'horizontal',
  wipe: false
});

// Añadir el panel dividido a la interfaz principal.
ui.root.add(splitPanel);

// Configuración inicial del mapa
map.setOptions('HYBRID');
map.setCenter(-66.5, 6.5, 6); // Centrado inicial sobre Venezuela

// Título y descripción
mainPanel.add(ui.Label({
  value: 'Monitor Forestal & Carbono & Deforestación',
  style: {
    fontWeight: 'bold',
    fontSize: '20px',
    margin: '10px 5px',
    color: '#2c3e50'
  }
}));
mainPanel.add(ui.Label('Instrucciones:\n1. Defina el área de interés (AOI).\n2. Ajuste los parámetros de análisis.\n3. Presione "Iniciar Procesamiento".', {
  whiteSpace: 'pre'
}));

// --- Panel de Entradas de Usuario ---
var inputsPanel = ui.Panel({
  style: {
    padding: '10px',
    margin: '10px 0'
  }
});
mainPanel.add(inputsPanel);

// --- Panel de Selección de AOI ---
inputsPanel.add(ui.Label({
  value: '1. Definir Área de Interés (AOI)',
  style: {
    fontWeight: 'bold',
    fontSize: '16px',
    color: '#333'
  }
}));

var aoiSourceSelector = ui.Select({
  items: ['Dibujar en el mapa', 'Seleccionar ABRAE'],
  value: 'Dibujar en el mapa',
  style: {
    stretch: 'horizontal'
  },
  onChange: toggleAoiInput
});
inputsPanel.add(aoiSourceSelector);

// Panel para las herramientas de dibujo
var drawingPanel = ui.Panel([ui.Label('Use las herramientas del mapa para dibujar un polígono.')]);
drawingPanel.style().set('padding', '0 0 0 10px');

// Panel para los selectores de ABRAE
var abraeTypeSelector = ui.Select({
  placeholder: 'Cargando tipos...',
  style: {
    stretch: 'horizontal'
  },
  disabled: true
});
var abraeNameSelector = ui.Select({
  placeholder: 'Primero seleccione un tipo',
  style: {
    stretch: 'horizontal'
  },
  disabled: true
});
var abraePanel = ui.Panel([
  ui.Label('Tipo de ABRAE (Categoría):', {
    fontSize: '12px',
    color: '#555'
  }), abraeTypeSelector,
  ui.Label('Nombre del ABRAE:', {
    fontSize: '12px',
    color: '#555'
  }), abraeNameSelector
]);
abraePanel.style().set('padding', '0 0 0 10px');

inputsPanel.add(drawingPanel);
inputsPanel.add(abraePanel);

// MODIFICACIÓN: Se mejora la lógica para poblar el selector de tipos de ABRAE.
// Se añade manejo de errores explícito en la llamada asíncrona 'evaluate'.
// Esto previene que el selector quede vacío en caso de un error de red o del servidor.
abraesVenezuela.aggregate_array('DESIG')
  .distinct()
  .sort()
  .evaluate(function(types, error) {
    if (error) {
      print('Error al cargar tipos de ABRAE:', error);
      abraeTypeSelector.setPlaceholder('Error al cargar tipos');
      return;
    }
    if (!types || types.length === 0) {
      abraeTypeSelector.setPlaceholder('No se encontraron tipos');
      return;
    }
    // Filtrar valores nulos o vacíos que puedan venir de la colección
    var validTypes = types.filter(function(t) {
      return t && t.trim() !== '';
    });

    abraeTypeSelector.items().reset(validTypes);
    abraeTypeSelector.setPlaceholder('Seleccione un tipo');
    abraeTypeSelector.setDisabled(false);
  });

// MODIFICACIÓN: Se optimiza la carga de nombres de ABRAE. Se usa .distinct() en el servidor
// para obtener nombres únicos, evitando transferir y procesar listas muy grandes en el cliente,
// lo que previene timeouts y soluciona el problema de que la lista no se cargue.
abraeTypeSelector.onChange(function(selectedType) {
  abraeNameSelector.setPlaceholder('Buscando áreas...');
  abraeNameSelector.items().reset([]);
  abraeNameSelector.setDisabled(true);

  if (!selectedType) {
    abraeNameSelector.setPlaceholder('Primero seleccione un tipo');
    return;
  }

  var filteredAbraes = abraesVenezuela.filter(ee.Filter.eq('DESIG', selectedType));

  // Obtener una lista de nombres únicos directamente del servidor para mayor eficiencia.
  filteredAbraes.aggregate_array('NAME')
    .distinct() // <-- CAMBIO CLAVE: Filtra duplicados en el servidor
    .sort()
    .evaluate(function(names, error) {
      if (error) {
        print('Error al cargar nombres de ABRAE para el tipo ' + selectedType + ':', error);
        abraeNameSelector.setPlaceholder('Error al cargar nombres');
        return;
      }
      if (!names || names.length === 0) {
        abraeNameSelector.setPlaceholder('No hay nombres para este tipo');
        return;
      }

      // La lista 'names' ya es única, no se necesita filtro del lado del cliente.
      abraeNameSelector.items().reset(names);
      abraeNameSelector.setPlaceholder('Seleccione un nombre');
      abraeNameSelector.setDisabled(false);
    });
});


// Configurar herramientas de dibujo
var drawingTools = map.drawingTools();
drawingTools.setShown(false);
while (drawingTools.layers().length() > 0) {
  drawingTools.layers().remove(drawingTools.layers().get(0));
}
var dummyGeo = ui.Map.GeometryLayer({
  geometries: null,
  name: 'drawn_geometry',
  color: 'yellow'
});
drawingTools.layers().add(dummyGeo);

// Función para alternar entre métodos de entrada de AOI
function toggleAoiInput(selection) {
  if (selection === 'Dibujar en el mapa') {
    drawingPanel.style().set('shown', true);
    abraePanel.style().set('shown', false);
    drawingTools.setShape(null); // Clear any previous shape selection
    drawingTools.setShown(true);
  } else {
    drawingPanel.style().set('shown', false);
    drawingTools.setShown(false);
    drawingTools.clear();
    abraePanel.style().set('shown', true);
  }
}
toggleAoiInput('Dibujar en el mapa');


// --- Panel de Parámetros de Análisis ---
inputsPanel.add(ui.Label({
  value: '2. Parámetros del Análisis',
  style: {
    fontWeight: 'bold',
    fontSize: '16px',
    color: '#333',
    margin: '10px 0 0 0'
  }
}));

var defaultAnoInicio = analysisYearPred - 5;
if (defaultAnoInicio < 2017) {
  defaultAnoInicio = 2017; // Dynamic World tiene datos consistentes desde 2017
}

var defaultAnoAnalisis = analysisYear - 10;
if (defaultAnoAnalisis < 2015) {
  defaultAnoAnalisis = 2015; // Deforestación tiene datos consistentes desde 2015
}

var precioTextbox = ui.Textbox({
  value: '5.0',
  placeholder: 'Ej: 5.0',
  style: {
    width: '100px'
  }
});
var tasaTextbox = ui.Textbox({
  value: '270',
  placeholder: 'Ej: 36.4',
  style: {
    width: '100px'
  }
});
var predTextbox = ui.Textbox({
  value: '5',
  placeholder: 'Ej: 5',
  style: {
    width: '100px'
  } 
});
var entTextbox = ui.Textbox({
  value: String(defaultAnoInicio),
  placeholder: 'Ej: ' + defaultAnoInicio,
  style: {
    width: '100px'
  }
});

var anaTextbox = ui.Textbox({
  value: String(defaultAnoAnalisis),
  placeholder: 'Ej: ' + defaultAnoAnalisis,
  style: {
    width: '100px'
  }
});

var createInputRow = function(labelText, widget) {
  return ui.Panel([
    ui.Label(labelText, {
      width: '180px'
    }),
    widget
  ], ui.Panel.Layout.flow('horizontal'));
};

inputsPanel.add(createInputRow('Precio por Ton CO2 (USD):', precioTextbox));
inputsPanel.add(createInputRow('Tasa de Cambio (VES/USD):', tasaTextbox));
inputsPanel.add(createInputRow('Años a predecir cambios:', predTextbox));
inputsPanel.add(createInputRow('Año inicio entrenamiento Predicción:', entTextbox));
inputsPanel.add(createInputRow('Año análisis Deforestación:', anaTextbox));

// Botón para iniciar el análisis
var startButton = ui.Button({
  label: 'Iniciar Procesamiento',
  style: {
    stretch: 'horizontal',
    margin: '10px 0'
  }
});
mainPanel.add(startButton);

var resultsPanel = ui.Panel();
mainPanel.add(resultsPanel);

// =================================================================================
// SECCIÓN 4: LÓGICA DE PROCESIMIENTO PRINCIPAL
// =================================================================================

function runAnalysis() {
  resultsPanel.clear();
  map.layers().reset();
  var aoi;
  var aoiSource = aoiSourceSelector.getValue();

  var processAoi = function(aoi) {
    // --- Leer y validar parámetros de la UI ---
    var PRECIO_TON_CO2_USD = parseFloat(precioTextbox.getValue());
    var TASA_CAMBIO_BCV = parseFloat(tasaTextbox.getValue());
    var anosPrediccion = parseInt(predTextbox.getValue(), 10);
    var anoInicioEntrenamiento = parseInt(entTextbox.getValue(), 10);
	var anoInicioAnalisis = parseInt(anaTextbox.getValue(), 10);

    if (isNaN(PRECIO_TON_CO2_USD) || isNaN(TASA_CAMBIO_BCV) || isNaN(anosPrediccion) || isNaN(anoInicioEntrenamiento) || isNaN(anoInicioAnalisis)) {
      resultsPanel.add(ui.Label('Error: Ingrese valores numéricos válidos en todos los campos.', {
        color: 'red'
      }));
      startButton.setDisabled(false);
      return;
    }
    if (anoInicioEntrenamiento < 2017 || anoInicioEntrenamiento >= analysisYearPred) {
      resultsPanel.add(ui.Label('Error: El año de entrenamiento debe ser entre 2017 y ' + (analysisYearPred - 1) + '.', {
        color: 'red'
      }));
      startButton.setDisabled(false);
      return;
    }

    resultsPanel.add(ui.Label('Procesando análisis satelital... Espere un momento.', {
      fontWeight: 'bold',
      margin: '10px 0'
    }));

    map.centerObject(aoi, 10);

    var visEndDate = ee.Date(Date.now());
    var visStartDate = visEndDate.advance(-1, 'year');
    var s2CloudMasked = s2SrCollection.filterDate(visStartDate, visEndDate).filterBounds(aoi).map(maskS2cloudsWithSCL);
    var s2Image = s2CloudMasked.median().clip(aoi);
    var dwImage = getDynamicWorldLulc(analysisYearPred, aoi);

    var nppCollectionForYear = nppCollection.filterDate(analysisYearPred + '-01-01', analysisYearPred + '-12-31');
    var nppLatest = ee.Image(nppCollectionForYear.first());
    var nppLatestValidated = ee.Image(ee.Algorithms.If(nppLatest, nppLatest, ee.Image(0).rename('Npp')));
    var nppScaled = nppLatestValidated.select('Npp').multiply(0.0001);
    var totalCarbonKg = nppScaled.multiply(ee.Image.pixelArea()).reduceRegion({
      reducer: ee.Reducer.sum(),
      geometry: aoi,
      scale: 500,
      maxPixels: 1e13
    });
    var totalCarbonTon = ee.Number(totalCarbonKg.get('Npp')).divide(1000);

    var pixelAreaHa = ee.Image.pixelArea().divide(10000);
    var areaImage = pixelAreaHa.addBands(dwImage);
    var classAreas = areaImage.reduceRegion({
      reducer: ee.Reducer.sum().group({
        groupField: 1,
        groupName: 'class'
      }),
      geometry: aoi,
      scale: 10,
      maxPixels: 1e13
    });
	
	// --- INICIO: Análisis de Deforestación ---
    var lulcStart = getDynamicWorldLulc(anoInicioAnalisis, aoi);
    var lulcEnd = dwImage;

    // Mascara para identificar píxeles que eran bosque (clase 1) y dejaron de serlo.
    var forestClass = 1;
    var deforestationMask = lulcStart.eq(forestClass).and(lulcEnd.neq(forestClass));

    // Calcular área total deforestada en hectáreas.
    var deforestedAreaHa = pixelAreaHa.updateMask(deforestationMask)
      .reduceRegion({
        reducer: ee.Reducer.sum(),
        geometry: aoi,
        scale: 10,
        maxPixels: 1e13
      }).get('area');

    // Para el desglose, crear una imagen de transición (ej: 12 = Bosque a Pasto).
    var changeImage = lulcStart.multiply(10).add(lulcEnd).rename('change');
    var deforestationCausesImage = changeImage.updateMask(deforestationMask);

    // Calcular el área por cada tipo de transición (causa de deforestación).
    var areaByChange = pixelAreaHa.addBands(deforestationCausesImage)
      .reduceRegion({
        reducer: ee.Reducer.sum().group({
          groupField: 1,
          groupName: 'change_code'
        }),
        geometry: aoi,
        scale: 10,
        maxPixels: 1e13
      }).get('groups');
    // --- FIN: Análisis de Deforestación ---	
    
        // --- INICIO: Lógica de Predicción Futura ---
    var futureYear = analysisYearPred + anosPrediccion;
    var lulcStartPred = getDynamicWorldLulc(anoInicioEntrenamiento, aoi);
    var lulcEndPred = dwImage;
    var dem = ee.Image('USGS/SRTMGL1_003');
    var drivers = ee.Image.cat([dem.select('elevation'), ee.Terrain.slope(dem)]).float();
    var predictors = lulcStartPred.addBands(drivers).rename(['lulc_start', 'elevation', 'slope']);
    var trainingTarget = lulcEndPred.rename('lulc_end');
    var trainingImage = predictors.addBands(trainingTarget);
    var trainingData = trainingImage.sample({
      region: aoi,
      scale: 30,
      numPixels: 5000,
      tileScale: 4,
      geometries: true
    });
    var classifier = ee.Classifier.smileRandomForest({
      numberOfTrees: 50
    }).train({
      features: trainingData,
      classProperty: 'lulc_end',
      inputProperties: predictors.bandNames()
    });
    var futurePredictors = lulcEndPred.addBands(drivers).rename(predictors.bandNames());
    var predictedLulcRaw = futurePredictors.classify(classifier);
    var predictedLulc = predictedLulcRaw.rename('predicted_lulc').toByte();

    var predictedCarbonImage = predictedLulc.remap(ee.List.sequence(0, 7), ee.List(STOCKS_CARBONO));
    var totalPredictedCarbon = predictedCarbonImage.multiply(pixelAreaHa).reduceRegion({
      reducer: ee.Reducer.sum(),
      geometry: aoi,
      scale: 30,
      maxPixels: 1e13
    });

    var predictedAreaImage = pixelAreaHa.addBands(predictedLulc);
    var predictedClassAreas = predictedAreaImage.reduceRegion({
      reducer: ee.Reducer.sum().group({
        groupField: 1,
        groupName: 'class'
      }),
      geometry: aoi,
      scale: 10,
      maxPixels: 1e13
    });
	// --- FIN: Lógica de Predicción Futura ---

    var dataToEvaluate = ee.Dictionary({
      carbonTon: totalCarbonTon,
      currentAreas: classAreas.get('groups'),
      predictedCarbon: totalPredictedCarbon.get('remapped'),
      predictedAreas: predictedClassAreas.get('groups'),
      deforestedArea: deforestedAreaHa,
      deforestationBreakdown: areaByChange,
      classNames: CLASS_NAMES
    });

    dataToEvaluate.evaluate(function(results, error) {
      resultsPanel.clear();
      if (error) {
        print('Error de evaluación:', error);
        resultsPanel.add(ui.Label('Error de cálculo. Verifique la geometría o consola.', {
          color: 'red'
        }));
        startButton.setDisabled(false);
        return;
      }

      // --- INICIO DE LA NUEVA SECCIÓN DE GRÁFICOS Y RESULTADOS ---

      // Función auxiliar para formatear números
      var clientFormatNumber = function(num, decimals) {
        decimals = (decimals === undefined) ? 2 : decimals;
        if (num === null || typeof num === 'undefined') return '0.00';
        return num.toLocaleString('es-VE', {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals
        });
      };

      // Función para crear un widget de indicador clave (KPI)
      var createKpi = function(value, label, color) {
        return ui.Panel([
          ui.Label(value, {
            fontWeight: 'bold',
            fontSize: '20px',
            margin: '0 0 4px 0',
            color: color
          }),
          ui.Label(label, {
            fontSize: '11px',
            color: '#666'
          })
        ], null, {
          textAlign: 'center',
          stretch: 'horizontal'
        });
      };

      // 1. Preparar datos del cliente
      var classNames = results.classNames.slice(0, 8);
      var currentAreasDict = {};
      if (results.currentAreas) {
        results.currentAreas.forEach(function(item) {
          currentAreasDict[item.class] = item.sum;
        });
      }
      var predictedAreasDict = {};
      if (results.predictedAreas) {
        // FIX: Corrected variable name from 'futureAreasDict' to 'predictedAreasDict'
        results.predictedAreas.forEach(function(item) {
          predictedAreasDict[item.class] = item.sum;
        });
      }

      // 2. Panel de KPIs (Resumen Ejecutivo)
      var totalAreaHa = 0;
      if (results.currentAreas) {
        results.currentAreas.forEach(function(item) {
          totalAreaHa += item.sum;
        });
      }
      var forestAreaHa = currentAreasDict[1] || 0; // Class 1 is 'Bosque/Árboles'
      var forestPercentage = totalAreaHa > 0 ? (forestAreaHa / totalAreaHa) * 100 : 0;
      var carbon = results.carbonTon || 0;
      var co2e = carbon * 3.67;
      var usd = co2e * PRECIO_TON_CO2_USD;
      var bs = usd * TASA_CAMBIO_BCV;

      // MODIFICACIÓN: Se añade 'true' al layout para permitir que los KPIs se
      // reorganicen verticalmente si el panel es muy estrecho.
      var kpiPanel = ui.Panel([
        createKpi(clientFormatNumber(totalAreaHa, 0) + ' ha', 'Área Total', '#333'),
        createKpi(clientFormatNumber(forestPercentage, 1) + '%', 'Cobertura Forestal (' + analysisYearPred + ')', '#27ae60'),
        createKpi('$' + clientFormatNumber(usd, 0), 'Valor CO2e (USD)', '#2980b9'),
        createKpi('Bs' + clientFormatNumber(bs, 0), 'Valor CO2e (VEN)', '#2980b9'),
      ], ui.Panel.Layout.flow('horizontal', true), {
        stretch: 'horizontal',
        margin: '10px 0',
        padding: '5px',
        border: '1px solid #ccc'
      });
      resultsPanel.add(ui.Label('Resumen del Área de Interés', {
        fontSize: '16px',
        fontWeight: 'bold'
      }));
      resultsPanel.add(kpiPanel);

	// --- INICIO: Nuevo Panel de Deforestación ---
      resultsPanel.add(ui.Label('Análisis de Deforestación (' + anoInicioAnalisis + ' - ' + analysisYear + ')', {
        fontSize: '16px',
        fontWeight: 'bold',
        margin: '15px 0 5px 0'
      }));

      var totalDeforested = results.deforestedArea || 0;

      // ---- MODIFICACIÓN INICIA ----
      // Calcular el valor económico de la pérdida de carbono por deforestación.
      var forestCarbonStockPerHa = STOCKS_CARBONO[1]; // tC/ha para la clase 'Bosque/Árboles'
      var carbonLossTonnes = totalDeforested * forestCarbonStockPerHa;
      var co2eLossTonnes = carbonLossTonnes * 3.67; // Factor de conversión de C a CO2e
      var co2eValueLossUsd = co2eLossTonnes * PRECIO_TON_CO2_USD;

      var deforestationKpiPanel = ui.Panel([
        createKpi(clientFormatNumber(totalDeforested, 0) + ' ha', 'Pérdida Neta de Bosque', '#c0392b'),
        createKpi('$' + clientFormatNumber(co2eValueLossUsd, 0), 'Valor CO2e de la Pérdida (USD)', '#e74c3c')
      ], ui.Panel.Layout.flow('horizontal', true), { // Se usa 'true' para permitir que los KPIs se envuelvan en pantallas pequeñas
        stretch: 'horizontal',
        margin: '5px 0 10px 0',
        padding: '5px',
        border: '1px solid #ccc'
      });
      // ---- MODIFICACIÓN TERMINA ----
      resultsPanel.add(deforestationKpiPanel);

      if (totalDeforested > 0 && results.deforestationBreakdown) {
        resultsPanel.add(ui.Label('Superficie Afectada por Tipo de Transición:', {
          fontWeight: 'bold'
        }));
        var breakdownPanel = ui.Panel();

        var sortedBreakdown = results.deforestationBreakdown.sort(function(a, b) {
          return b.sum - a.sum;
        });

        sortedBreakdown.forEach(function(item) {
          var changeCode = item.change_code;
          var toClass = changeCode % 10;
          var toName = classNames[toClass];
          var area = item.sum;

          var labelText = 'Bosque ➔ ' + toName + ': ' + clientFormatNumber(area, 2) + ' ha';
          breakdownPanel.add(ui.Label(labelText));
        });
        resultsPanel.add(breakdownPanel);
      } else {
        resultsPanel.add(ui.Label('No se detectó deforestación neta en el período seleccionado.', {
          style: {
            color: 'green'
          }
        }));
      }
      // --- FIN: Nuevo Panel de Deforestación ---
      
    // =========================================================
    // LÓGICA CORREGIDA: DEFORESTACIÓN SECUENCIAL (SIN DOBLE CONTEO)
    // =========================================================

    var yearsSequence = ee.List.sequence(anoInicioAnalisis, analysisYear);
    
    // Imagen base: El bosque original al inicio del periodo
    var baseForest = getDynamicWorldLulc(anoInicioAnalisis, aoi).eq(1);

    var calculateSequentialLoss = function(year) {
      var y = ee.Number(year);
      var currentYearImage = getDynamicWorldLulc(y, aoi);
      var nextYearImage = getDynamicWorldLulc(y.add(1), aoi);

      // CONDICIÓN 1: Deforestación actual (Bosque -> No Bosque entre Y y Y+1)
      var deforestationEvent = currentYearImage.eq(1).and(nextYearImage.neq(1));

      // CONDICIÓN 2 (LA CURA): El píxel debe haber sido bosque ORIGINALMENTE
      // y NO haber sido deforestado en los años previos intermedios.
      // Para simplificar en GEE sin loops complejos, usamos una aproximación robusta:
      // Exigimos que en el año actual (Y) el píxel todavía coincida con el bosque base.
      
      var validDeforestation = deforestationEvent.and(baseForest);

      var area = pixelAreaHa.updateMask(validDeforestation)
        .reduceRegion({
          reducer: ee.Reducer.sum(),
          geometry: aoi,
          scale: 30, 
          maxPixels: 1e13
        }).get('area');
        
      return ee.Feature(null, {
        'year': y.format('%d'),
        'deforestacion_ha': area
      });
    };

    var annualStats = ee.FeatureCollection(yearsSequence.map(calculateSequentialLoss));

    // Crear el gráfico corregido
    var annualChart = ui.Chart.feature.byFeature({
      features: annualStats,
      xProperty: 'year',
      yProperties: ['deforestacion_ha']
    })
    .setChartType('ColumnChart')
    .setOptions({
      title: 'Deforestación Anual (Secuencial)',
      hAxis: {title: 'Año'},
      vAxis: {title: 'Hectáreas Perdidas'},
      colors: ['#c0392b'],
      legend: {position: 'none'}
    });
    
    resultsPanel.add(annualChart);
    
    // =========================================================
      // TIMELAPSE CON AÑO (Requiere librería externa)
      // =========================================================
      
      resultsPanel.add(ui.Label('Evolución Visual de la Cobertura (' + anoInicioAnalisis + ' - ' + analysisYearPred + ')', {
        fontSize: '16px',
        fontWeight: 'bold',
        margin: '20px 0 10px 0'
      }));

      // 1. Cargar la librería de texto (Estándar de la comunidad GEE)
      var text = require('users/gena/packages:text');

      // 2. Preparar geometría
      var regionGeometry;
      if (aoi instanceof ee.FeatureCollection) {
        regionGeometry = aoi.geometry(); 
      } else {
        regionGeometry = aoi;
      }
      var regionForGif = regionGeometry.transform('EPSG:3857', 1);

      // 3. Crear colección de imágenes etiquetadas
      var yearsList = ee.List.sequence(anoInicioAnalisis, analysisYearPred);
      
      var timelapseImages = yearsList.map(function(year) {
        var y = ee.Number(year);
        
        // A. Imagen base clasificada
        var img = getDynamicWorldLulc(y, regionGeometry).clip(regionGeometry);
        var visualized = img.visualize(dwVisParams);
        
        // B. Crear la imagen del texto (El Año)
        // Calculamos la posición (Centro de la imagen para asegurar visibilidad)
        var pt = regionGeometry.centroid(1);
        
        // Configuramos el texto: string, punto, escala, propiedades
        // La escala la definimos relativa al zoom (aprox 100 para ABRAES grandes, 30 para pequeñas)
        // Puedes ajustar 'scale' si el texto sale muy grande o muy pequeño.
        var scale = map.getScale(); 
        
        var label = text.draw(
          y.format('%d'), // El texto (Año)
          pt,             // Posición
          scale,          // Escala del texto
          {
            fontSize: 32,
            textColor: 'ffffff', // Blanco
            outlineColor: '000000', // Borde Negro
            outlineWidth: 3,
            outlineOpacity: 0.8
          }
        );

        // C. Mezclar la imagen del mapa con la imagen del texto
        return visualized.blend(label);
      });

      var timelapseCollection = ee.ImageCollection.fromImages(timelapseImages);

      // 4. Parámetros y Widget
      var animationParams = {
        dimensions: 600,
        region: regionForGif,
        framesPerSecond: 1,
        crs: 'EPSG:3857'
      };

      var timelapseThumb = ui.Thumbnail({
        image: timelapseCollection,
        params: animationParams,
        style: {
          width: '100%',
          height: '400px',
          margin: '10px 0'
        }
      });

      resultsPanel.add(timelapseThumb);
      resultsPanel.add(ui.Label('Nota: Verde=Bosque, Amarillo=Pasto, Naranja=Cultivos, Rojo=Urbano.'));
      
      // 3. Gráfico de Cobertura Actual
      var currentChartData = [
        ['Clase', 'Área (ha)']
      ];
      classNames.forEach(function(name, i) {
        currentChartData.push([name, currentAreasDict[i] || 0]);
      });

      var currentLulcChart = ui.Chart(currentChartData, 'BarChart', {
        title: 'Distribución de Cobertura del Suelo (' + analysisYearPred + ')',
        titleTextStyle: {
          bold: true,
          fontSize: 14
        },
        hAxis: {
          title: 'Área (Hectáreas)',
          titleTextStyle: {
            italic: false
          }
        },
        vAxis: {
          title: 'Clase',
          textStyle: {
            fontSize: 10
          }
        },
        colors: dwVisParams.palette,
        legend: {
          position: 'none'
        },
        chartArea: {
          left: 100,
          top: 40,
          width: '70%',
          height: '75%'
        },
        backgroundColor: {
          fill: 'transparent'
        }
      });
      resultsPanel.add(currentLulcChart);

      // 4. Gráfico Comparativo de Predicción de Cambio
      var comparisonChartData = [
        ['Clase', 'Año ' + analysisYearPred, 'Predicción ' + futureYear]
      ];
      // FIX: Removed redundant data processing block and used the correctly populated 'predictedAreasDict'
      classNames.forEach(function(name, i) {
        comparisonChartData.push([name, currentAreasDict[i] || 0, predictedAreasDict[i] || 0]);
      });

      var changeChart = ui.Chart(comparisonChartData, 'ColumnChart', {
        title: 'Proyección de Cambio de Cobertura',
        titleTextStyle: {
          bold: true,
          fontSize: 14
        },
        vAxis: {
          title: 'Área (Hectáreas)',
          titleTextStyle: {
            italic: false
          }
        },
        hAxis: {
          textStyle: {
            fontSize: 10
          }
        },
        colors: ['#3498db', '#e67e22'], // Azul para actual, Naranja para futuro
        legend: {
          position: 'top',
          alignment: 'center'
        },
        bar: {
          groupWidth: '80%'
        },
        chartArea: {
          left: 70,
          top: 50,
          width: '80%',
          height: '65%'
        },
        backgroundColor: {
          fill: 'transparent'
        }
      });
      resultsPanel.add(changeChart);

      // --- FIN DE LA NUEVA SECCIÓN DE GRÁFICOS Y RESULTADOS ---

      var s2Layer = ui.Map.Layer(s2Image, {
        bands: ['B4', 'B3', 'B2'],
        min: 0,
        max: 3000
      }, 'Imagen Satelital (RGB)', false);
      var lulcLayer = ui.Map.Layer(dwImage, dwVisParams, 'Cobertura ' + analysisYearPred, true);
      var predictedLulcLayer = ui.Map.Layer(predictedLulc, dwVisParams, 'Predicción ' + futureYear, false);
      var deforestationLayer = ui.Map.Layer(deforestationMask.selfMask(), {
        palette: 'red'
      }, 'Deforestación (' + anoInicioAnalisis + '-' + analysisYear + ')', false);
      var aoiOutline = ee.Image().byte().paint({
        featureCollection: ee.FeatureCollection(aoi),
        color: 1,
        width: 2
      });
      var aoiLayer = ui.Map.Layer(aoiOutline, {
        palette: 'FFFF00'
      }, 'AOI');
      map.layers().reset([s2Layer, lulcLayer, deforestationLayer, predictedLulcLayer, aoiLayer]);

      var legend = ui.Panel({
        style: {
          position: 'bottom-left',
          padding: '8px 15px',
          backgroundColor: 'rgba(255, 255, 255, 0.85)'
        }
      });

      var legendTitle = ui.Label({
        value: 'Leyenda',
        style: {
          fontWeight: 'bold',
          fontSize: '14px',
          margin: '0 0 4px 0',
          padding: '0'
        }
      });
      legend.add(legendTitle);
      var makeRow = function(color, name) {
      /*var colorBox = ui.Label({
          style: {
            backgroundColor: '#' + color,
            padding: '8px',
            margin: '0 0 4px 0'
          }
        });
        var description = ui.Label({
          value: name,
          style: {
            margin: '0 0 4px 6px',
            fontSize: '12px'
          }
        });*/
        return ui.Panel({
          widgets: [  //widgets: [colorBox, description],
            ui.Label({
              style: {
                backgroundColor: color,
                padding: '8px',
                margin: '0 0 4px 0'
              }
            }),
            ui.Label({
              value: name,
              style: {
                margin: '0 0 4px 6px',
                fontSize: '12px'
              }
            })
          ],
          layout: ui.Panel.Layout.flow('horizontal')
        });
      };

      /*var legendItemsPanel = ui.Panel({
        layout: ui.Panel.Layout.flow('horizontal', true), // Permitir que los elementos se envuelvan
        style: {
          backgroundColor: 'rgba(255, 255, 255, 0)',
        }
      });
      var palette = dwVisParams.palette;
      var names = ['Agua', 'Bosque', 'Pasto', 'Veg. Inundada', 'Cultivos', 'Matorral', 'Urbano', 'Suelo Desnudo'];
      for (var i = 0; i < names.length; i++) {
        legendItemsPanel.add(makeRow(palette[i], names[i]));
      }
      legend.add(legendItemsPanel);*/
      
      var palette = dwVisParams.palette.map(function(hex) {
        return hex.replace('#', '');
      });
      var names = ['Agua', 'Bosque', 'Pasto', 'Veg. Inundada', 'Cultivos', 'Matorral', 'Urbano', 'Suelo Desnudo'];
      var legendPanel = ui.Panel({
        layout: ui.Panel.Layout.flow('horizontal', true),
        style: {
          padding: '0px'
        }
      });
      legend.add(legendPanel);

      for (var i = 0; i < names.length; i++) {
        legendPanel.add(makeRow(palette[i], names[i]));
      }

      // Add the legend to the map.
      map.widgets().set(0, legend);

      startButton.setDisabled(false);
    });
  };

  startButton.setDisabled(true);

  if (aoiSource === 'Dibujar en el mapa') {
    var drawnGeometry = drawingTools.layers().get(0).getEeObject();
    if (!drawnGeometry || drawnGeometry.geometries().length() === 0) {
      resultsPanel.add(ui.Label('Error: Por favor, dibuje un área de interés (AOI) en el mapa.', {
        color: 'red'
      }));
      startButton.setDisabled(false);
      return;
    }
    aoi = drawnGeometry;
    processAoi(aoi);
  } else { // 'Seleccionar ABRAE'
    var abraeName = abraeNameSelector.getValue();
    var abraeType = abraeTypeSelector.getValue();
    if (!abraeName || !abraeType) {
      resultsPanel.add(ui.Label('Error: Por favor, seleccione un tipo y nombre de ABRAE.', {
        color: 'red'
      }));
      startButton.setDisabled(false);
      return;
    }
    var selectedAbraeFC = abraesVenezuela.filter(
      ee.Filter.and(
        ee.Filter.eq('DESIG', abraeType),
        ee.Filter.eq('NAME', abraeName)
      )
    );

    // CORRECCIÓN: Se valida el tamaño de la FeatureCollection ANTES de intentar
    // unir las geometrías. Esto previene el error 'isEmpty is not a function'
    // que ocurre si la colección filtrada está vacía.
    selectedAbraeFC.size().evaluate(function(size, error) {
      if (error) {
        resultsPanel.add(ui.Label('Error al verificar el ABRAE: ' + error, {
          color: 'red'
        }));
        startButton.setDisabled(false);
        return;
      }

      if (size === 0) {
        resultsPanel.add(ui.Label('Error: No se encontró un ABRAE con ese tipo y nombre.', {
          color: 'red'
        }));
        startButton.setDisabled(false);
        return;
      }

      // Si se encontraron resultados, se unen en una sola geometría y se procesa.
      var aoi = selectedAbraeFC.union(1);
      processAoi(aoi);
    });
  }
}

startButton.onClick(runAnalysis);