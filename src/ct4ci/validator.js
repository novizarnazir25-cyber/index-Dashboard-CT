/**
 * CIRCULARTRACE - Validation Engine for Farmers, Plots, Practices, and Assessments
 * Strict verification of geographic coordinates, plot geometries, duplicate detection,
 * banned chemical substances, and assessment integrity.
 */

import { BannedPesticideSubstances, ApplicabilityDecision, EvidenceSufficiency, ComplianceResult } from './types.js';

export class CtValidationError extends Error {
  constructor(message, field, code = 'VALIDATION_ERROR') {
    super(message);
    this.name = 'CtValidationError';
    this.field = field;
    this.code = code;
  }
}

export class CtValidator {
  /**
   * Validate Farmer Registration Payload
   */
  static validateFarmer(data) {
    if (!data.farmerCode || typeof data.farmerCode !== 'string' || !data.farmerCode.trim()) {
      throw new CtValidationError('Kode petani (farmerCode) wajib diisi.', 'farmerCode', 'REQUIRED');
    }
    if (!data.fullName || typeof data.fullName !== 'string' || !data.fullName.trim()) {
      throw new CtValidationError('Nama lengkap petani wajib diisi.', 'fullName', 'REQUIRED');
    }
    if (!data.groupId || typeof data.groupId !== 'string') {
      throw new CtValidationError('Kelompok tani (groupId) wajib dipilih.', 'groupId', 'REQUIRED');
    }
    if (!data.province || !data.district || !data.subDistrict || !data.village) {
      throw new CtValidationError('Lokasi administratif (Provinsi, Kabupaten, Kecamatan, Desa) lengkap wajib diisi.', 'administrativeLocation', 'REQUIRED');
    }
    if (data.dataConsentGiven !== true) {
      throw new CtValidationError('Persetujuan penggunaan data (data consent) wajib disetujui petani.', 'dataConsentGiven', 'CONSENT_REQUIRED');
    }
    return true;
  }

  /**
   * Validate Coordinates & Geodata
   */
  static validateCoordinates(lat, lng) {
    if (lat === null || lat === undefined || lng === null || lng === undefined) {
      return { valid: false, reason: 'Titik koordinat belum diisi' };
    }
    const numLat = parseFloat(lat);
    const numLng = parseFloat(lng);
    if (isNaN(numLat) || numLat < -90 || numLat > 90) {
      throw new CtValidationError(`Latitude tidak valid: ${lat}. Rentang yang diizinkan adalah -90 s/d 90.`, 'latitude', 'OUT_OF_BOUNDS');
    }
    if (isNaN(numLng) || numLng < -180 || numLng > 180) {
      throw new CtValidationError(`Longitude tidak valid: ${lng}. Rentang yang diizinkan adalah -180 s/d 180.`, 'longitude', 'OUT_OF_BOUNDS');
    }

    // Regional check for Indonesia (-11 to +6 latitude, 95 to 141 longitude)
    const inIndonesia = numLat >= -12 && numLat <= 7 && numLng >= 94 && numLng <= 142;
    return {
      valid: true,
      latitude: numLat,
      longitude: numLng,
      inIndonesia,
      warning: inIndonesia ? null : 'Koordinat berada di luar batas kepulauan Indonesia. Periksa kembali pembacaan GPS.'
    };
  }

  /**
   * Validate GeoJSON Polygon
   */
  static validatePolygonGeoJson(geoJsonStr) {
    if (!geoJsonStr) return { valid: false, reason: 'Polygon tidak disediakan' };
    try {
      const geo = typeof geoJsonStr === 'string' ? JSON.parse(geoJsonStr) : geoJsonStr;
      if (!geo || (geo.type !== 'Polygon' && geo.type !== 'MultiPolygon')) {
        throw new CtValidationError('GeoJSON harus bertipe Polygon atau MultiPolygon', 'polygonGeoJson', 'INVALID_GEOJSON');
      }
      const coords = geo.coordinates;
      if (!coords || !Array.isArray(coords) || coords.length === 0) {
        throw new CtValidationError('Koordinat polygon tidak boleh kosong', 'polygonGeoJson', 'EMPTY_COORDINATES');
      }
      // Check ring closure for standard Polygon
      if (geo.type === 'Polygon') {
        const ring = coords[0];
        if (ring.length < 4) {
          throw new CtValidationError('Ring polygon minimal memiliki 4 titik koordinat', 'polygonGeoJson', 'INSUFFICIENT_VERTICES');
        }
        const first = ring[0];
        const last = ring[ring.length - 1];
        if (Math.abs(first[0] - last[0]) > 0.000001 || Math.abs(first[1] - last[1]) > 0.000001) {
          throw new CtValidationError('Polygon harus tertutup: titik awal dan titik akhir harus sama', 'polygonGeoJson', 'OPEN_RING');
        }
      }
      return { valid: true, geo };
    } catch (e) {
      if (e instanceof CtValidationError) throw e;
      throw new CtValidationError(`GeoJSON tidak valid: ${e.message}`, 'polygonGeoJson', 'MALFORMED_JSON');
    }
  }

  /**
   * Detect Potential Duplicate Plots based on distance or plot code
   */
  static checkPlotDuplicate(newPlot, existingPlots = []) {
    if (!newPlot.latitude || !newPlot.longitude) {
      return { isDuplicate: false };
    }

    const R = 6371e3; // Earth radius in meters
    const toRad = deg => deg * Math.PI / 180;
    const lat1 = toRad(newPlot.latitude);
    const lon1 = toRad(newPlot.longitude);

    for (const plot of existingPlots) {
      if (plot.id && plot.id === newPlot.id) continue;
      if (plot.plotCode && plot.plotCode.toLowerCase() === (newPlot.plotCode || '').toLowerCase()) {
        return {
          isDuplicate: true,
          matchedPlotId: plot.id,
          matchedPlotCode: plot.plotCode,
          reason: `Kode petak '${newPlot.plotCode}' sudah terdaftar.`
        };
      }
      if (plot.latitude && plot.longitude) {
        const lat2 = toRad(plot.latitude);
        const lon2 = toRad(plot.longitude);
        const dLat = lat2 - lat1;
        const dLon = lon2 - lon1;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(lat1) * Math.cos(lat2) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distanceMeters = R * c;

        // Proximity threshold: 15 meters
        if (distanceMeters < 15) {
          return {
            isDuplicate: true,
            matchedPlotId: plot.id,
            matchedPlotCode: plot.plotCode,
            distanceMeters: Math.round(distanceMeters * 10) / 10,
            reason: `Titik koordinat berjarak hanya ${Math.round(distanceMeters)} meter dari petak '${plot.plotCode}' (potensi duplikasi fisik).`
          };
        }
      }
    }

    return { isDuplicate: false };
  }

  /**
   * Validate Cultivation Practices & Detect Banned Chemicals
   */
  static validatePracticeRecord(record) {
    if (!record.farmerId) {
      throw new CtValidationError('farmerId wajib diisi pada catatan praktik.', 'farmerId', 'REQUIRED');
    }
    if (!record.category) {
      throw new CtValidationError('Kategori praktik wajib dipilih.', 'category', 'REQUIRED');
    }
    if (!record.observationDate) {
      throw new CtValidationError('Tanggal observasi wajib diisi.', 'observationDate', 'REQUIRED');
    }

    // Check payload for chemical usage
    const payload = typeof record.dataPayloadJson === 'string' ? JSON.parse(record.dataPayloadJson || '{}') : (record.dataPayloadJson || {});
    const flaggedBannedSubstances = [];

    if (payload.pesticideApplications && Array.isArray(payload.pesticideApplications)) {
      for (const app of payload.pesticideApplications) {
        const prod = (app.productName || '').toLowerCase();
        const active = (app.activeIngredient || '').toLowerCase();
        for (const banned of BannedPesticideSubstances) {
          if (prod.includes(banned.name.toLowerCase()) || active.includes(banned.activeIngredient.toLowerCase())) {
            flaggedBannedSubstances.push({
              detectedProduct: app.productName,
              bannedItem: banned.name,
              activeIngredient: banned.activeIngredient,
              bannedSince: banned.bannedSince
            });
          }
        }
      }
    }

    return {
      valid: true,
      hasBannedPesticide: flaggedBannedSubstances.length > 0,
      bannedPesticides: flaggedBannedSubstances
    };
  }

  /**
   * Validate Checkpoint Assessment Decision
   */
  static validateAssessmentDecision(assessment) {
    if (!assessment.checkpointId) {
      throw new CtValidationError('checkpointId wajib diisi.', 'checkpointId', 'REQUIRED');
    }
    if (!assessment.applicability) {
      throw new CtValidationError('Status applicability wajib ditentukan.', 'applicability', 'REQUIRED');
    }
    if (assessment.applicability === ApplicabilityDecision.NOT_APPLICABLE) {
      if (!assessment.nonApplicabilityReason || !assessment.nonApplicabilityReason.trim()) {
        throw new CtValidationError('Alasan ketidakberlakuan (nonApplicabilityReason) wajib diisi jika status NOT_APPLICABLE.', 'nonApplicabilityReason', 'JUSTIFICATION_REQUIRED');
      }
      if (!assessment.applicabilityApprovedBy) {
        throw new CtValidationError('Persetujuan verifier resmi wajib dicatat untuk menetapkan NOT_APPLICABLE.', 'applicabilityApprovedBy', 'APPROVAL_REQUIRED');
      }
    }
    return true;
  }
}
