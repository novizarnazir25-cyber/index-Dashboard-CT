/**
 * CIRCULARTRACE - Benchmark Registry
 * Section 6 Specification:
 * - Acuan: Compliance -> Benchmark sebanding terverifikasi -> Target pilot pra-pengukuran.
 * - Simpan: benchmark_id, target, unit, stage, process_type, region, year, reference, penetap, benchmark_version.
 * - Tanpa benchmark E1, E2, atau Ec1, indikator tetap null; aplikasi TIDAK BOLEH menciptakan target otomatis.
 */

export class BenchmarkRegistry {
  constructor() {
    this.benchmarks = new Map();
    this.initDefaultBenchmarks();
  }

  register(benchmark) {
    if (!benchmark.benchmark_id) {
      benchmark.benchmark_id = `BM-${benchmark.indicator_code}-${benchmark.stage}-${benchmark.process_type || 'ALL'}-${benchmark.version || 'v1'}`;
    }
    if (!benchmark.target || benchmark.target <= 0) {
      throw new Error(`Target benchmark untuk ${benchmark.indicator_code} harus bernilai positif (>0)`);
    }
    this.benchmarks.set(benchmark.benchmark_id, benchmark);
    return benchmark;
  }

  get(benchmarkId) {
    return this.benchmarks.get(benchmarkId) || null;
  }

  findMatching(indicatorCode, stage, processType, version = 'CT-Pilot-2026') {
    for (const bm of this.benchmarks.values()) {
      if (
        bm.indicator_code === indicatorCode &&
        bm.stage === stage &&
        (!bm.process_type || bm.process_type === 'ALL' || bm.process_type === processType) &&
        (!version || bm.version === version)
      ) {
        return bm;
      }
    }
    return null;
  }

  initDefaultBenchmarks() {
    // Standard Pilot Benchmarks matching Section 6 & 7 of the Novizar Nazir (2026) specification
    this.register({
      benchmark_id: 'BM-E1-PILOT-WASHED-2026',
      indicator_code: 'E1',
      target: 6.0, // Tair = 6 L/kg produk
      unit: 'L/kg',
      stage: 'PROCESSOR',
      process_type: 'FULL_WASHED',
      region: 'Sumatera Barat',
      year: 2026,
      reference: 'GCP Coffee Sustainability Reference Code / Pilot Novizar Nazir 2026',
      established_by: 'Tim Peneliti CircularTrace',
      version: 'CT-Pilot-2026'
    });

    this.register({
      benchmark_id: 'BM-E2-PILOT-WASHED-2026',
      indicator_code: 'E2',
      target: 0.9, // Tenergi = 0.9 kWh/kg produk
      unit: 'kWh/kg',
      stage: 'PROCESSOR',
      process_type: 'FULL_WASHED',
      region: 'Sumatera Barat',
      year: 2026,
      reference: 'GCP / SAFA Guidelines 3.0 / Pilot Novizar Nazir 2026',
      established_by: 'Tim Peneliti CircularTrace',
      version: 'CT-Pilot-2026'
    });

    this.register({
      benchmark_id: 'BM-EC1-PILOT-2026',
      indicator_code: 'Ec1',
      target: 0.20, // Tmargin = 20% (0.20)
      unit: 'ratio',
      stage: 'PROCESSOR',
      process_type: 'ALL',
      region: 'Indonesia',
      year: 2026,
      reference: 'Contoh dummy target margin usaha pengolahan kopi (bukan target sektoral resmi)',
      established_by: 'Tim Peneliti CircularTrace',
      version: 'CT-Pilot-2026'
    });
  }
}

export const globalBenchmarkRegistry = new BenchmarkRegistry();
