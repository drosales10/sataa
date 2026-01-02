// ============================================================================
// EDGE FUNCTION: GEE METRICS
// Calcula métricas ambientales para un AOI usando Google Earth Engine
// ============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { GEEClient } from "./gee-client.ts";
import { MetricsCalculator } from "./metrics-calculator.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { validateRequest } from "../_shared/validation.ts";

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Validar autenticación
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request
    const { aoi, analysisYear, params } = await req.json();
    
    // Validar entrada
    const validation = validateRequest({ aoi, analysisYear, params });
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Inicializar cliente Supabase
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Verificar caché
    const cacheKey = `metrics_${aoi.id}_${analysisYear}`;
    const { data: cached } = await supabaseClient
      .from("gee_cache")
      .select("data, created_at")
      .eq("cache_key", cacheKey)
      .single();

    // Si hay caché válido (< 24 horas), retornar
    if (cached && isCacheValid(cached.created_at)) {
      return new Response(
        JSON.stringify({
          success: true,
          data: cached.data,
          cached: true,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Inicializar cliente GEE
    const geeClient = new GEEClient({
      serviceAccountEmail: Deno.env.get("GEE_SERVICE_ACCOUNT_EMAIL") ?? "",
      privateKey: Deno.env.get("GEE_PRIVATE_KEY") ?? "",
    });

    await geeClient.authenticate();

    // Calcular métricas con GEE
    const calculator = new MetricsCalculator(geeClient);
    const startTime = Date.now();
    
    const metrics = await calculator.calculate({
      geometry: aoi.geometry,
      analysisYear: analysisYear || new Date().getFullYear() - 1,
      params: {
        precioCO2USD: params?.precioCO2USD || 5.0,
        tasaCambioVES: params?.tasaCambioVES || 270,
        anoInicioDeforestacion: params?.anoInicioDeforestacion || 2015,
      },
    });
    
    const processingTime = Date.now() - startTime;

    // Agregar metadata
    metrics.aoiId = aoi.id;
    metrics.aoiName = aoi.name || "Área de análisis";

    // Guardar en caché
    await supabaseClient.from("gee_cache").upsert({
      cache_key: cacheKey,
      data: metrics,
      aoi_id: aoi.id,
      analysis_year: analysisYear,
      created_at: new Date().toISOString(),
    });

    // Retornar resultado
    return new Response(
      JSON.stringify({
        success: true,
        data: metrics,
        processingTime,
        cached: false,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in gee-metrics:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: "PROCESSING_ERROR",
          message: error.message,
        },
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function isCacheValid(createdAt: string): boolean {
  const cacheAge = Date.now() - new Date(createdAt).getTime();
  const maxAge = 24 * 60 * 60 * 1000; // 24 horas
  return cacheAge < maxAge;
}

// Función helper para isCacheValid ya definida abajo
