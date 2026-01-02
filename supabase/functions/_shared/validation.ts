// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

export function validateRequest(req: {
  aoi?: { id?: string; geometry?: unknown };
  analysisYear?: number;
  params?: unknown;
}): { valid: boolean; error?: string } {
  if (!req.aoi || !req.aoi.geometry) {
    return { valid: false, error: "Missing or invalid AOI geometry" };
  }

  if (!req.aoi.id) {
    return { valid: false, error: "Missing AOI ID" };
  }

  if (req.analysisYear && (req.analysisYear < 2015 || req.analysisYear > new Date().getFullYear())) {
    return { valid: false, error: "Invalid analysis year" };
  }

  return { valid: true };
}
