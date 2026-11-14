/**
 * CIRCULARTRACE - Step 1: Unit & Period Validation
 * Specifications:
 * - Field numerik memakai DECIMAL/Number; massa dan volume >= 0.
 * - numerator <= denominator untuk rasio proporsi.
 * - Nilai di luar batas harus menghasilkan kesalahan validasi, bukan dipotong otomatis agar lolos.
 * - Clamp hanya dipakai pada fungsi normalisasi target (E1, E2, Ec1).
 * - Periode valid (periodStart <= periodEnd).
 */

export class ValidationError extends Error {
  constructor(message, field, code = 'VALIDATION_ERROR') {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
    this.code = code;
  }
}

export function validatePeriodAndBoundary(assessment) {
  if (!assessment) {
    throw new ValidationError('Assessment object is required', 'assessment');
  }

  const { assessment_id, actor_id, period_start, period_end, system_boundary, stage } = assessment;

  if (!assessment_id) throw new ValidationError('assessment_id is required', 'assessment_id');
  if (!actor_id) throw new ValidationError('actor_id is required', 'actor_id');
  if (!system_boundary) throw new ValidationError('system_boundary is required', 'system_boundary');
  if (!stage) throw new ValidationError('stage is required', 'stage');

  const start = new Date(period_start);
  const end = new Date(period_end);

  if (isNaN(start.getTime())) {
    throw new ValidationError('Invalid period_start date', 'period_start');
  }
  if (isNaN(end.getTime())) {
    throw new ValidationError('Invalid period_end date', 'period_end');
  }
  if (start > end) {
    throw new ValidationError('period_start must be before or equal to period_end', 'period');
  }

  return true;
}

export function validateNonNegative(value, fieldName) {
  if (value === null || value === undefined) return;
  const num = Number(value);
  if (isNaN(num)) {
    throw new ValidationError(`${fieldName} must be a valid number, received: ${value}`, fieldName);
  }
  if (num < 0) {
    throw new ValidationError(`${fieldName} must be non-negative (>= 0), received: ${value}`, fieldName);
  }
}

export function validateProportion(numerator, denominator, ratioName) {
  if (numerator === null || numerator === undefined || denominator === null || denominator === undefined) {
    return;
  }

  const num = Number(numerator);
  const den = Number(denominator);

  if (isNaN(num) || isNaN(den)) {
    throw new ValidationError(`${ratioName}: numerator and denominator must be numbers`, ratioName);
  }

  if (num < 0 || den < 0) {
    throw new ValidationError(`${ratioName}: numerator and denominator must be >= 0`, ratioName);
  }

  if (den > 0 && num > den + 1e-6) {
    throw new ValidationError(
      `Kesalahan validasi rasio ${ratioName}: Nilai pembilang (${num}) melebihi penyebut (${den}). Nilai di luar batas tidak boleh dipotong otomatis.`,
      ratioName,
      'PROPORTION_EXCEEDED'
    );
  }
}
