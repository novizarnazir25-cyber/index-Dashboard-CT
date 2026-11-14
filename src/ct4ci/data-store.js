/**
 * CIRCULARTRACE - Unified Data Store & Seeder
 * In-memory repository with persistence and realistic smallholder coffee data
 * (Koperasi Solok Radjo & Kintamani).
 * All test data explicitly labeled: "Data simulasi".
 */

import { globalCheckpointRegistry } from './checkpoint-register.js';
import { Ct4ciEngine } from './ct4ci-engine.js';
import { CtIdsmEngine } from './idsm-engine.js';
import { CapaManager } from './capa-manager.js';
import {
  UserRole,
  ApplicabilityDecision,
  EvidenceSufficiency,
  ComplianceResult,
  PracticeCategory,
  FarmerConfirmationStatus,
  ConfirmationMethod,
  SYNCHRONIZED_STAKEHOLDERS
} from './types.js';

export class CtDataStore {
  constructor() {
    this.groups = new Map();
    this.farmers = new Map();
    this.farms = new Map();
    this.plots = new Map();
    this.facilities = new Map();
    this.practices = new Map();
    this.inspections = new Map();
    this.evidences = new Map();
    this.assessments = new Map(); // key: `${scopeId}_${checkpointCode}_${period}`
    this.snapshots = new Map();
    this.capaManager = new CapaManager();
    this.auditTrail = [];
    this.offlineDrafts = new Map();
    this.users = new Map();

    this.seedDefaultData();
  }

  seedDefaultData() {
    // ------------------------------------------------------------------------
    // 1. Users for All 11 Synchronized Stakeholders & Admin
    // ------------------------------------------------------------------------
    const defaultUsers = [
      // 1. Petani
      { id: 'USR-FAR-01', name: 'Pak Syamsul Arifin', email: 'syamsul@solok.id', role: UserRole.FARMER, title: 'Petani Kopi Bukit Gompong', orgId: 'ORG-SOLOK-RADJO' },
      // 2. Kelompok Tani
      { id: 'USR-GROUP-01', name: 'Alfadhil', email: 'alfadhil@solokradjo.id', role: UserRole.FARMER_GROUP, title: 'Ketua Koperasi Solok Radjo', orgId: 'ORG-SOLOK-RADJO' },
      // 3. Pengolah
      { id: 'USR-PROC-01', name: 'Rahmat Hidayat', email: 'processing@solokradjo.id', role: UserRole.PROCESSOR, title: 'Kepala Unit Pengolahan Basah & Kering', orgId: 'ORG-SOLOK-RADJO' },
      // 4. Gudang
      { id: 'USR-WH-01', name: 'Dedi Kurniawan', email: 'warehouse@padangcoffee.id', role: UserRole.WAREHOUSE, title: 'Kepala Gudang Transit & Ekspor Padang', orgId: 'FAC-WH-01' },
      // 5. Roasting
      { id: 'USR-ROAST-01', name: 'Ari Lesmana', email: 'roaster@nusantaracoffee.id', role: UserRole.ROASTERY, title: 'Master Roaster Roastery Nusantara', orgId: 'FAC-ROAST-01' },
      // 6. Coffee Shop
      { id: 'USR-CAFE-01', name: 'Sarah Anindita', email: 'sarah@kopikita.id', role: UserRole.COFFEE_SHOP, title: 'Owner & Barista Kopi Kita Artisanal', orgId: 'FAC-CAFE-01' },
      // 7. Buyer
      { id: 'USR-BUYER-01', name: 'Marcus Weber', email: 'm.weber@globalcoffeetrade.com', role: UserRole.BUYER, title: 'Head of Green Coffee Sourcing & EUDR Offtaker', orgId: 'BUYER-01' },

      // 8. Verifikator / ICS untuk Petani
      { id: 'USR-ICS-FAR', name: 'Andi Saputra', email: 'ics.farmer@solokradjo.id', role: UserRole.ICS_VERIFIER_FARMER, title: 'Lead Field Inspector / Verifikator Petani', orgId: 'ORG-SOLOK-RADJO' },
      // 9. ICS untuk Pengolah
      { id: 'USR-ICS-PROC', name: 'Ir. Budi Santoso', email: 'ics.processor@circulartrace.id', role: UserRole.ICS_VERIFIER_PROCESSOR, title: 'Inspektur ICS Pengolahan & Neraca Biomassa', orgId: 'ORG-SOLOK-RADJO' },
      // 10. Verifikator Gudang
      { id: 'USR-VER-WH', name: 'Maya Pertiwi, S.T.', email: 'verifier.warehouse@circulartrace.id', role: UserRole.VERIFIER_WAREHOUSE, title: 'Auditor Mutu & Keterlacakan Gudang', orgId: 'FAC-WH-01' },
      // 11. Verifikator Roastery
      { id: 'USR-VER-ROAST', name: 'Hendra Wijaya', email: 'verifier.roastery@circulartrace.id', role: UserRole.VERIFIER_ROASTERY, title: 'Auditor Fasilitas Roastery & K3', orgId: 'FAC-ROAST-01' },

      // Backward Compatibility & Administration
      { id: 'USR-OP-01', name: 'Andi Saputra (Operator ICS)', email: 'ics.andi@solokradjo.id', role: UserRole.ICS_OPERATOR, orgId: 'ORG-SOLOK-RADJO' },
      { id: 'USR-VER-01', name: 'Dr. Hendra Gunawan (Lead Verifier)', email: 'verifier@circulartrace.id', role: UserRole.VERIFIER, orgId: 'ORG-SOLOK-RADJO' },
      { id: 'USR-MGR-01', name: 'Prof. Novizar Nazir (Project Director)', email: 'novizar@circulartrace.id', role: UserRole.MANAGER, orgId: 'ORG-SOLOK-RADJO' },
      { id: 'USR-ADMIN-01', name: 'Administrator Metodologi', email: 'admin@circulartrace.id', role: UserRole.METHODOLOGY_ADMIN, orgId: 'ORG-SOLOK-RADJO' }
    ];
    defaultUsers.forEach(u => this.users.set(u.id, u));

    // ------------------------------------------------------------------------
    // 2. Supply Chain Facilities (Processing, Warehouse, Roastery, Café, Buyer)
    // ------------------------------------------------------------------------
    const defaultFacilities = [
      {
        id: 'FAC-PROC-01',
        name: 'Unit Pengolahan Basah & Kering Solok Radjo',
        stage: 'PROCESSOR',
        type: 'PROCESSING_FACILITY',
        location: 'Aie Dingin, Lembah Gumanti, Solok',
        capacityKgPerDay: 5000,
        methods: ['FULL_WASHED', 'NATURAL', 'HONEY', 'WET_HULLED'],
        hasSolarDome: true,
        wasteWaterTreatment: 'BIO_FILTER_AND_AERATION'
      },
      {
        id: 'FAC-WH-01',
        name: 'Gudang Transit & QA Ekspor Teluk Bayur',
        stage: 'WAREHOUSE',
        type: 'STORAGE_WAREHOUSE',
        location: 'Kawasan Pelabuhan Teluk Bayur, Padang',
        storageCapacityTons: 200,
        tempControl: 'AIR_VENTILATED_CONTROLLED',
        palletStandard: 'FUMIGATED_ISPM15'
      },
      {
        id: 'FAC-ROAST-01',
        name: 'Roastery Kopi Nusantara Padang',
        stage: 'ROASTERY',
        type: 'ROASTING_FACILITY',
        location: 'Jl. Khatib Sulaiman No. 45, Padang',
        roasterCapacityKg: 15,
        energySource: 'LPG_AND_SOLAR_PV',
        chaffHandling: 'CYCLONE_COLLECTOR_TO_ORGANIC_BRIQUETTES'
      },
      {
        id: 'FAC-CAFE-01',
        name: 'Kopi Kita Artisanal Cafe',
        stage: 'COFFEE_SHOP',
        type: 'CAFE_RETAIL',
        location: 'Jl. Rasuna Said, Padang',
        scgRecoveryProgram: 'DAILY_COMPOST_EXCHANGE',
        digitalPassportDisplay: 'QR_ON_MENU_AND_POUCH'
      },
      {
        id: 'BUYER-01',
        name: 'PT Global Coffee Traders & Offtakers',
        stage: 'BUYER',
        type: 'COMMERCIAL_EXPORTER',
        location: 'Jakarta & Amsterdam',
        eudrComplianceStatus: 'VERIFIED_DUE_DILIGENCE',
        traceabilityPlatform: 'CIRCULARTRACE_CDL'
      }
    ];
    defaultFacilities.forEach(f => this.facilities.set(f.id, f));

    // ------------------------------------------------------------------------
    // 2. Farmer Groups (Organizations)
    // ------------------------------------------------------------------------
    const defaultGroups = [
      {
        id: 'ORG-SOLOK-RADJO',
        businessId: 'SOLOK-RADJO-COOP',
        name: 'Koperasi Produsen Kopi Solok Radjo',
        type: 'FARMER_GROUP',
        province: 'Sumatera Barat',
        district: 'Solok',
        subDistrict: 'Lembah Gumanti',
        village: 'Aie Dingin',
        address: 'Jl. Raya Solok-Alahan Panjang Km 32',
        pic: 'Alfadhil',
        phone: '081267890123',
        email: 'info@solokradjo.id',
        budgetAllocatedIdr: 25000000, // Rp 25.000.000
        serviceChargePerKgIdr: 500,  // Paper section 3.9: Rp 500/kg
        isActive: true
      },
      {
        id: 'ORG-KINTAMANI',
        businessId: 'KINTAMANI-ORGANIC',
        name: 'Koperasi Kopi Kintamani Organik',
        type: 'FARMER_GROUP',
        province: 'Bali',
        district: 'Bangli',
        subDistrict: 'Kintamani',
        village: 'Belantih',
        address: 'Desa Belantih, Kintamani',
        pic: 'I Wayan Jati',
        phone: '081338901245',
        email: 'kintamani.coffee@gmail.com',
        budgetAllocatedIdr: 18000000,
        serviceChargePerKgIdr: 500,
        isActive: true
      }
    ];
    defaultGroups.forEach(g => this.groups.set(g.id, g));

    // ------------------------------------------------------------------------
    // 3. Farmers
    // ------------------------------------------------------------------------
    const defaultFarmers = [
      {
        id: 'FARMER-SLK-001',
        farmerCode: 'F-SLK-001',
        groupId: 'ORG-SOLOK-RADJO',
        fullName: 'Syamsul Arifin',
        membershipStatus: 'ACTIVE',
        joinedDate: '2022-03-15',
        province: 'Sumatera Barat',
        district: 'Solok',
        subDistrict: 'Lembah Gumanti',
        village: 'Aie Dingin',
        phone: '082170123456',
        farmRole: 'OWNER_OPERATOR',
        smartphoneAccess: 'YES',
        connectivityStatus: 'GOOD',
        assistanceNeeded: false,
        preferredConfirmationMethod: ConfirmationMethod.DIGITAL_APP,
        dataConsentGiven: true,
        dataConsentDate: '2026-01-10T08:30:00Z',
        dataConsentMethod: 'DIGITAL_APP',
        recordedByOfficerId: 'USR-OP-01',
        createdAt: '2026-01-10T08:30:00Z',
        isSimulation: true
      },
      {
        id: 'FARMER-SLK-002',
        farmerCode: 'F-SLK-002',
        groupId: 'ORG-SOLOK-RADJO',
        fullName: 'Dt. Marajo (Rustam)',
        membershipStatus: 'ACTIVE',
        joinedDate: '2023-05-20',
        province: 'Sumatera Barat',
        district: 'Solok',
        subDistrict: 'Lembah Gumanti',
        village: 'Salimpat',
        phone: null,
        farmRole: 'OWNER_OPERATOR',
        smartphoneAccess: 'NO',
        connectivityStatus: 'LIMITED',
        assistanceNeeded: true,
        preferredConfirmationMethod: ConfirmationMethod.ORAL_ASSISTED,
        dataConsentGiven: true,
        dataConsentDate: '2026-01-12T10:00:00Z',
        dataConsentMethod: 'ORAL_RECORDED',
        recordedByOfficerId: 'USR-OP-01',
        createdAt: '2026-01-12T10:00:00Z',
        isSimulation: true
      },
      {
        id: 'FARMER-BALI-001',
        farmerCode: 'F-BLI-001',
        groupId: 'ORG-KINTAMANI',
        fullName: 'I Ketut Suwarto',
        membershipStatus: 'ACTIVE',
        joinedDate: '2021-08-10',
        province: 'Bali',
        district: 'Bangli',
        subDistrict: 'Kintamani',
        village: 'Belantih',
        phone: '081239887766',
        farmRole: 'OWNER_OPERATOR',
        smartphoneAccess: 'YES',
        connectivityStatus: 'GOOD',
        assistanceNeeded: false,
        preferredConfirmationMethod: ConfirmationMethod.DIGITAL_APP,
        dataConsentGiven: true,
        dataConsentDate: '2026-02-01T09:00:00Z',
        dataConsentMethod: 'DIGITAL_APP',
        recordedByOfficerId: 'USR-OP-01',
        createdAt: '2026-02-01T09:00:00Z',
        isSimulation: true
      }
    ];
    defaultFarmers.forEach(f => this.farmers.set(f.id, f));

    // ------------------------------------------------------------------------
    // 4. Farms & Plots (1 Farmer manages > 1 plot)
    // ------------------------------------------------------------------------
    const defaultFarms = [
      {
        id: 'FARM-SLK-001',
        farmCode: 'FARM-01-SYAMSUL',
        farmerId: 'FARMER-SLK-001',
        name: 'Kebun Kopi Bukit Gompong Syamsul',
        totalAreaHa: 2.0,
        province: 'Sumatera Barat',
        district: 'Solok',
        subDistrict: 'Lembah Gumanti',
        village: 'Aie Dingin'
      },
      {
        id: 'FARM-SLK-002',
        farmCode: 'FARM-02-MARAJO',
        farmerId: 'FARMER-SLK-002',
        name: 'Kebun Kopi Lereng Salimpat',
        totalAreaHa: 1.0,
        province: 'Sumatera Barat',
        district: 'Solok',
        subDistrict: 'Lembah Gumanti',
        village: 'Salimpat'
      },
      {
        id: 'FARM-BALI-001',
        farmCode: 'FARM-01-KETUT',
        farmerId: 'FARMER-BALI-001',
        name: 'Kebun Kopi Arabika Ulian Belantih',
        totalAreaHa: 1.5,
        province: 'Bali',
        district: 'Bangli',
        subDistrict: 'Kintamani',
        village: 'Belantih'
      }
    ];
    defaultFarms.forEach(fm => this.farms.set(fm.id, fm));

    // Plots: Pak Syamsul has Plot A (1.2 Ha) and Plot B (0.8 Ha)
    const defaultPlots = [
      {
        id: 'PLOT-SLK-001A',
        plotCode: 'PLT-SLK-01A',
        farmId: 'FARM-SLK-001',
        farmerId: 'FARMER-SLK-001',
        latitude: -1.0425,
        longitude: 100.7512,
        polygonGeoJson: JSON.stringify({
          type: 'Polygon',
          coordinates: [[[100.7510, -1.0420], [100.7525, -1.0420], [100.7525, -1.0435], [100.7510, -1.0435], [100.7510, -1.0420]]]
        }),
        geodataMethod: 'MOBILE_APP',
        geodataAccuracyMeters: 3.5,
        geodataOfficer: 'Andi Saputra',
        geodataDate: '2026-03-10',
        areaHa: 1.2,
        areaUnit: 'HECTARE',
        areaSource: 'GPS_SURVEY',
        tenureStatus: 'OWNED_CERTIFIED',
        tenureDocumentRef: 'SHM No. 451/AieDingin/2018',
        coffeeSpecies: 'ARABICA',
        varieties: 'Kartika & Sigararutang',
        plantingYear: 2017,
        plantPopulation: 2400,
        shadeTreesDescription: 'Lamtoro (85 pohon/Ha) dan Alpukat (15 pohon/Ha)',
        landSlopeCondition: 'GENTLE',
        waterSourceDescription: 'Mata air alami hulu bukit',
        sensitiveAreaProximity: 'Batas hutan lindung berjarak 350 meter (zona aman)',
        estimatedAnnualProductionKg: 4200,
        productForm: 'FRESH_CHERRY',
        productionStatus: 'MEASURED',
        isDuplicateFlagged: false,
        duplicateNotes: null
      },
      {
        id: 'PLOT-SLK-001B',
        plotCode: 'PLT-SLK-01B',
        farmId: 'FARM-SLK-001',
        farmerId: 'FARMER-SLK-001',
        latitude: -1.0450,
        longitude: 100.7540,
        polygonGeoJson: JSON.stringify({
          type: 'Polygon',
          coordinates: [[[100.7538, -1.0448], [100.7550, -1.0448], [100.7550, -1.0458], [100.7538, -1.0458], [100.7538, -1.0448]]]
        }),
        geodataMethod: 'MOBILE_APP',
        geodataAccuracyMeters: 4.0,
        geodataOfficer: 'Andi Saputra',
        geodataDate: '2026-03-10',
        areaHa: 0.8,
        areaUnit: 'HECTARE',
        areaSource: 'GPS_SURVEY',
        tenureStatus: 'OWNED_CUSTOMARY',
        tenureDocumentRef: 'Surat Keterangan Tanah Ulayat Kerapatan Adat Nagari',
        coffeeSpecies: 'ARABICA',
        varieties: 'Andungsari',
        plantingYear: 2019,
        plantPopulation: 1600,
        shadeTreesDescription: 'Lamtoro (75 pohon/Ha)',
        landSlopeCondition: 'STEEP',
        waterSourceDescription: 'Penampungan air hujan',
        sensitiveAreaProximity: 'Sempadan sungai kecil berjarak 20 meter (terlindungi semak penahan)',
        estimatedAnnualProductionKg: 2600,
        productForm: 'FRESH_CHERRY',
        productionStatus: 'MEASURED',
        isDuplicateFlagged: false,
        duplicateNotes: null
      },
      {
        id: 'PLOT-BALI-001',
        plotCode: 'PLT-BLI-01',
        farmId: 'FARM-BALI-001',
        farmerId: 'FARMER-BALI-001',
        latitude: -8.2412,
        longitude: 115.3345,
        polygonGeoJson: JSON.stringify({
          type: 'Polygon',
          coordinates: [[[115.3330, -8.2405], [115.3360, -8.2405], [115.3360, -8.2425], [115.3330, -8.2425], [115.3330, -8.2405]]]
        }),
        geodataMethod: 'GPS_HANDHELD',
        geodataAccuracyMeters: 2.0,
        geodataOfficer: 'I Wayan Jati',
        geodataDate: '2026-02-15',
        areaHa: 1.5,
        areaUnit: 'HECTARE',
        areaSource: 'GPS_SURVEY',
        tenureStatus: 'OWNED_CERTIFIED',
        tenureDocumentRef: 'SHM No. 120/Belantih/2015',
        coffeeSpecies: 'ARABICA',
        varieties: 'Kopyol Kintamani',
        plantingYear: 2016,
        plantPopulation: 2800,
        shadeTreesDescription: 'Jeruk Kintamani & Sengon (90 pohon/Ha)',
        landSlopeCondition: 'GENTLE',
        waterSourceDescription: 'Mata air Subak Abian',
        sensitiveAreaProximity: 'Kawasan Danau Batur berjarak 5 km',
        estimatedAnnualProductionKg: 5000,
        productForm: 'FRESH_CHERRY',
        productionStatus: 'MEASURED',
        isDuplicateFlagged: false,
        duplicateNotes: null
      }
    ];
    defaultPlots.forEach(p => this.plots.set(p.id, p));

    // ------------------------------------------------------------------------
    // 5. Cultivation Practices (Topics A-E)
    // ------------------------------------------------------------------------
    const defaultPractices = [
      {
        id: 'PRAC-001',
        farmerId: 'FARMER-SLK-001',
        plotId: 'PLOT-SLK-001A',
        category: PracticeCategory.SOIL_CROP,
        observationDate: '2026-04-12',
        periodId: '2026-PANEN-RAYA',
        sourceInfo: 'DIRECT_OBSERVATION',
        recordedByUserId: 'USR-OP-01',
        dataPayloadJson: JSON.stringify({
          pruningDone: true,
          pruningFrequency: '2x setahun',
          shadeSpecies: ['Lamtoro', 'Alpukat'],
          shadeDensityPerHa: 85,
          erosionControls: ['Teras bangku', 'Rorak jebakan air'],
          organicFertilizerUsed: true,
          fertilizerRecord: 'Kompos cascara 1.200 kg/Ha & NPK 150 kg/Ha pada 12 April 2026'
        }),
        farmerConfirmationStatus: FarmerConfirmationStatus.CONFIRMED,
        confirmationMethod: ConfirmationMethod.DIGITAL_APP,
        confirmationDate: '2026-04-13T09:00:00Z',
        confirmationNotes: 'Sesuai dengan praktik di kebun',
        verificationStatus: 'VERIFIED',
        verifierUserId: 'USR-VER-01',
        verificationNotes: 'Diverifikasi langsung di lokasi, rorak dan pohon penaung terawat baik.'
      },
      {
        id: 'PRAC-002',
        farmerId: 'FARMER-SLK-001',
        plotId: 'PLOT-SLK-001A',
        category: PracticeCategory.PEST_CHEMICAL,
        observationDate: '2026-04-12',
        periodId: '2026-PANEN-RAYA',
        sourceInfo: 'DIRECT_OBSERVATION',
        recordedByUserId: 'USR-OP-01',
        dataPayloadJson: JSON.stringify({
          pestMonitoringDone: true,
          biologicalControlUsed: ['Perangkap Brocap', 'Sanitasi buah bubuk'],
          syntheticChemicalUsed: false,
          pesticideApplications: [],
          ppeComplete: true,
          bannedSubstanceFree: true
        }),
        farmerConfirmationStatus: FarmerConfirmationStatus.CONFIRMED,
        confirmationMethod: ConfirmationMethod.DIGITAL_APP,
        confirmationDate: '2026-04-13T09:05:00Z',
        verificationStatus: 'VERIFIED',
        verifierUserId: 'USR-VER-01',
        verificationNotes: 'Tidak ditemukan wadah pestisida kimia. Petani mengutamakan perangkap brocap.'
      },
      {
        id: 'PRAC-003',
        farmerId: 'FARMER-SLK-001',
        plotId: 'PLOT-SLK-001A',
        category: PracticeCategory.WATER_WASTE_ENV,
        observationDate: '2026-04-12',
        periodId: '2026-PANEN-RAYA',
        sourceInfo: 'DIRECT_OBSERVATION',
        recordedByUserId: 'USR-OP-01',
        dataPayloadJson: JSON.stringify({
          waterSource: 'Mata air alami',
          wastewaterTreatment: 'Diendapkan di kolam resapan bertahap',
          openBurningDone: false,
          riverBufferProtected: true,
          huntingBanned: true,
          pulpValorization: ['Kompos organik', 'Teh cascara kering']
        }),
        farmerConfirmationStatus: FarmerConfirmationStatus.CONFIRMED,
        confirmationMethod: ConfirmationMethod.DIGITAL_APP,
        confirmationDate: '2026-04-13T09:10:00Z',
        verificationStatus: 'VERIFIED',
        verifierUserId: 'USR-VER-01',
        verificationNotes: 'Tidak ada sisa pembakaran, kolam limbah berfungsi normal.'
      },
      {
        id: 'PRAC-004',
        farmerId: 'FARMER-SLK-001',
        plotId: null,
        category: PracticeCategory.LABOR_SAFETY,
        observationDate: '2026-04-12',
        periodId: '2026-PANEN-RAYA',
        sourceInfo: 'FARMER_INTERVIEW',
        recordedByUserId: 'USR-OP-01',
        dataPayloadJson: JSON.stringify({
          laborType: ['Keluarga sendiri', 'Tenaga kerja musiman saat panen'],
          wagesPaidAboveMin: true,
          dailyWageIdr: 120000,
          forcedLaborFree: true,
          childLaborFree: true,
          hazardousYouthFree: true,
          firstAidAvailable: true
        }),
        farmerConfirmationStatus: FarmerConfirmationStatus.CONFIRMED,
        confirmationMethod: ConfirmationMethod.DIGITAL_APP,
        confirmationDate: '2026-04-13T09:15:00Z',
        verificationStatus: 'VERIFIED',
        verifierUserId: 'USR-VER-01',
        verificationNotes: 'Wawancara dengan pekerja musiman: upah Rp 120.000/hari di atas upah pasar, tidak ada pekerja anak.'
      },
      {
        id: 'PRAC-005',
        farmerId: 'FARMER-SLK-001',
        plotId: null,
        category: PracticeCategory.ECON_INST,
        observationDate: '2026-04-12',
        periodId: '2026-PANEN-RAYA',
        sourceInfo: 'FIELD_BOOK',
        recordedByUserId: 'USR-OP-01',
        dataPayloadJson: JSON.stringify({
          harvestLogMaintained: true,
          priceTransparencyChecked: true,
          sustainabilityPremiumReceived: true,
          icsTrainingParticipated: ['GAP 4C', 'Penanganan Pascapanen Mutu'],
          grievanceChannelKnown: true
        }),
        farmerConfirmationStatus: FarmerConfirmationStatus.CONFIRMED,
        confirmationMethod: ConfirmationMethod.DIGITAL_APP,
        confirmationDate: '2026-04-13T09:20:00Z',
        verificationStatus: 'VERIFIED',
        verifierUserId: 'USR-VER-01',
        verificationNotes: 'Nota timbang tersimpan rapi di buku saku petani.'
      }
    ];
    defaultPractices.forEach(pr => this.practices.set(pr.id, pr));

    // ------------------------------------------------------------------------
    // 6. Evidence Items
    // ------------------------------------------------------------------------
    const defaultEvidences = [
      {
        id: 'EVD-F01-01',
        evidenceCode: 'EVD-2026-001',
        title: 'Foto Geo-Tagged Terasering & Rorak Petak 01A',
        docType: 'PHOTO_FIELD',
        fileUri: '/storage/evidence/solok_plot01a_rorak.jpg',
        sha256Hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        farmerId: 'FARMER-SLK-001',
        plotId: 'PLOT-SLK-001A',
        practiceRecordId: 'PRAC-001',
        checkpointIdsJson: JSON.stringify(['P090', 'P012']),
        uploadedByUserId: 'USR-OP-01',
        sufficiencyStatus: EvidenceSufficiency.SUFFICIENT,
        verifierUserId: 'USR-VER-01',
        verifierDecisionDate: '2026-04-14T10:00:00Z',
        verifierNotes: 'Foto jelas menampilkan rorak air aktif penahan erosi.'
      },
      {
        id: 'EVD-F01-02',
        evidenceCode: 'EVD-2026-002',
        title: 'Foto Lemari Saprodi Bebas Pestisida Terlarang',
        docType: 'PHOTO_FIELD',
        fileUri: '/storage/evidence/solok_saprodi_safe.jpg',
        sha256Hash: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
        farmerId: 'FARMER-SLK-001',
        plotId: 'PLOT-SLK-001A',
        practiceRecordId: 'PRAC-002',
        checkpointIdsJson: JSON.stringify(['P082', 'P083']),
        uploadedByUserId: 'USR-OP-01',
        sufficiencyStatus: EvidenceSufficiency.SUFFICIENT,
        verifierUserId: 'USR-VER-01',
        verifierDecisionDate: '2026-04-14T10:15:00Z',
        verifierNotes: 'Hanya ada pupuk organik dan perangkap serangga, bebas Paraquat.'
      },
      {
        id: 'EVD-F01-03',
        evidenceCode: 'EVD-2026-003',
        title: 'Nota Timbang & Slip Pembayaran Panen Kopi Ceri',
        docType: 'PURCHASE_RECEIPT',
        fileUri: '/storage/evidence/nota_timbang_syamsul_01.pdf',
        sha256Hash: '4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a',
        farmerId: 'FARMER-SLK-001',
        plotId: 'PLOT-SLK-001A',
        practiceRecordId: 'PRAC-005',
        checkpointIdsJson: JSON.stringify(['P002', 'P003', 'P014']),
        uploadedByUserId: 'USR-OP-01',
        sufficiencyStatus: EvidenceSufficiency.SUFFICIENT,
        verifierUserId: 'USR-VER-01',
        verifierDecisionDate: '2026-04-14T10:30:00Z',
        verifierNotes: 'Nota timbang resmi dari Koperasi Solok Radjo, volume dan harga tercantum transparan.'
      }
    ];
    defaultEvidences.forEach(ev => this.evidences.set(ev.id, ev));

    // ------------------------------------------------------------------------
    // 7. Checkpoint Assessments & Screenshot Simulation Fixture
    // ------------------------------------------------------------------------
    this.loadScreenshotSimulationFixture('FARMER-SLK-001', '2026-PANEN-RAYA');
  }

  /**
   * Load the exact Screenshot Reproduction Fixture:
   * 74 Checkpoints Applicable (Ai = 1)
   * 74 Checkpoints with Sufficient Evidence (Vi = 1) -> Evidence Coverage = 100.0%
   * 71 Checkpoints Compliant (Ci = 1)
   * 3 Checkpoints Non-Compliant (Ci = 0, but Vi = 1)
   * -> CT-4CI Readiness = 100 * 71 / 74 = 95.9459...% -> 95.9%!
   * 34 Checkpoints Approved Not Applicable (Ai = 0, with justification & verifier approval)
   * Total Checkpoints: 74 + 34 = 108 (Full BP Producer inventory).
   */
  loadScreenshotSimulationFixture(farmerId = 'FARMER-SLK-001', period = '2026-PANEN-RAYA') {
    const producerCheckpoints = globalCheckpointRegistry.getModuleCheckpoints('PRODUCER');

    // Choose 34 checkpoints to be APPROVED NOT_APPLICABLE (e.g. wet processing on-farm when cherry sold fresh, hired labor clauses if family farm)
    // 74 checkpoints will be APPLICABLE.
    // Among the 74: 71 COMPLIANT, 3 NON_COMPLIANT.
    // Ensure all 74 have SUFFICIENT evidence so Evidence Coverage = 100.0%.

    const notApplicableCodes = new Set([
      // 34 checkpoints legitimately not applicable for fresh cherry smallholder
      'P046', 'P047', 'P048', 'P049', 'P051', 'P052', 'P053', 'P054', 'P056', 'P057',
      'P058', 'P059', 'P061', 'P062', 'P063', 'P064', 'P065', 'P066', 'P067', 'P068',
      'P069', 'P097', 'P098', 'P099', 'P100', 'P101', 'P102', 'P103', 'P106', 'P107',
      'P108', 'P018', 'P019', 'P015'
    ]); // exactly 34 items

    // 3 non-compliant checkpoints (Minor gaps, e.g. P009 records incomplete, P016 lack of crop diversification, P092 soil test missing)
    const nonCompliantCodes = new Set(['P009', 'P016', 'P092']);

    producerCheckpoints.forEach(cp => {
      const key = `${farmerId}_${cp.checkpointCode}_${period}`;
      let app = ApplicabilityDecision.APPLICABLE;
      let nonAppReason = null;
      let appApprovedBy = null;
      let suff = EvidenceSufficiency.SUFFICIENT;
      let comp = ComplianceResult.COMPLIANT;
      let notes = 'Data simulasi terverifikasi';

      if (notApplicableCodes.has(cp.checkpointCode)) {
        app = ApplicabilityDecision.NOT_APPLICABLE;
        nonAppReason = 'Petani hanya menjual ceri segar ke collection point; kegiatan pengolahan basah dilakukan di fasilitas terpusat kelompok.';
        appApprovedBy = 'USR-VER-01';
        suff = EvidenceSufficiency.SUFFICIENT;
        comp = ComplianceResult.UNDETERMINED;
        notes = 'Disetujui tidak berlaku oleh lead verifier.';
      } else if (nonCompliantCodes.has(cp.checkpointCode)) {
        app = ApplicabilityDecision.APPLICABLE;
        suff = EvidenceSufficiency.SUFFICIENT;
        comp = ComplianceResult.NON_COMPLIANT;
        notes = `Temuan minor: ${cp.title} belum memenuhi kriteria target.`;
      } else {
        app = ApplicabilityDecision.APPLICABLE;
        suff = EvidenceSufficiency.SUFFICIENT;
        comp = ComplianceResult.COMPLIANT;
      }

      this.assessments.set(key, {
        id: `ASS-${key}`,
        scopeType: 'PRODUCER',
        scopeId: farmerId,
        checkpointId: cp.id || cp.checkpointCode,
        checkpointCode: cp.checkpointCode,
        period,
        applicability: app,
        nonApplicabilityReason: nonAppReason,
        applicabilityApprovedBy: appApprovedBy,
        evidenceSufficiency: suff,
        complianceResult: comp,
        evaluationNotes: notes,
        verifierUserId: 'USR-VER-01',
        verifiedAt: '2026-04-15T08:00:00Z',
        isSimulation: true
      });
    });

    // Create 1 open CAPA for one of the non-compliant findings to demonstrate CAPA tracking
    this.capaManager.createCapa({
      findingTitle: 'Pencatatan Sarana Produksi (Saprodi) Belum Teratur',
      checkpointId: 'P009',
      checkpointCode: 'P009',
      scopeType: 'PRODUCER',
      scopeId: farmerId,
      issueType: 'MINOR_GAP',
      rootCauseAnalysis: 'Petani belum rutin menyimpan nota struk pembelian pupuk organik.',
      correctiveActionPlan: 'Pendampingan pencatatan buku saku tani dan penyimpanan arsip nota di rumah petani.',
      responsiblePerson: 'Syamsul Arifin & Pendamping ICS',
      estimatedCostIdr: 150000,
      actualCostIdr: 0
    });

    // Run engine and store snapshot
    this.recalculateAndSaveSnapshot(farmerId, period, true);
  }

  /**
   * Recalculate CT-4CI snapshot from database assessments
   */
  recalculateAndSaveSnapshot(farmerId, period, isSimulation = true) {
    const relevantAssessments = [];
    for (const [key, ass] of this.assessments.entries()) {
      if (ass.scopeId === farmerId && ass.period === period) {
        relevantAssessments.push(ass);
      }
    }

    const ct4ciResult = Ct4ciEngine.calculate(relevantAssessments, {
      registry: globalCheckpointRegistry,
      module: 'PRODUCER'
    });

    const farmer = this.farmers.get(farmerId);
    const plots = Array.from(this.plots.values()).filter(p => p.farmerId === farmerId);
    const group = farmer ? this.groups.get(farmer.groupId) : null;
    const capas = this.capaManager.getForScope(farmerId);

    // Evaluate CT-IDSM rules
    const idsmRules = CtIdsmEngine.evaluate({
      farmer,
      plots,
      ct4ciResult,
      capas,
      budget: group ? { allocatedIdr: group.budgetAllocatedIdr } : null
    });

    const snapshotId = `SNAP-4CI-${farmerId}-${period}-${Date.now()}`;
    const snapshot = {
      id: snapshotId,
      period,
      scopeType: 'PRODUCER',
      scopeId: farmerId,
      registerVersion: '4C-v4.1',
      totalInventory: ct4ciResult.totalInventory,
      applicableCount: ct4ciResult.applicableCount,
      approvedNotApplicableCount: ct4ciResult.approvedNotApplicableCount,
      undecidedApplicabilityCount: ct4ciResult.undecidedApplicabilityCount,
      sufficientEvidenceCount: ct4ciResult.sufficientEvidenceCount,
      compliantWithSufficientEvidenceCount: ct4ciResult.compliantWithSufficientEvidenceCount,
      nonCompliantWithSufficientEvidenceCount: ct4ciResult.nonCompliantCount,
      insufficientEvidenceCount: ct4ciResult.insufficientEvidenceCount,
      ct4ciScore: ct4ciResult.ct4ciScore,
      evidenceCoveragePct: ct4ciResult.evidenceCoveragePct,
      calculationStatus: ct4ciResult.calculationStatus,
      cannotCalculateReason: ct4ciResult.cannotCalculateReason,
      majorGateStatus: ct4ciResult.majorGateStatus,
      majorStats: ct4ciResult.majorStats,
      dimensionBreakdown: ct4ciResult.dimensionResults,
      idsmRules,
      isSampleSimulation: isSimulation,
      calculatedByUserId: 'USR-MGR-01',
      calculatedAt: new Date().toISOString()
    };

    this.snapshots.set(snapshotId, snapshot);
    return snapshot;
  }

  // Record audit trail entry
  addAuditLog(entry) {
    this.auditTrail.unshift({
      id: `AUDIT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      ...entry
    });
  }

  /**
   * Get all 11 synchronized stakeholders with assigned users and facilities
   */
  getStakeholdersMatrix() {
    return SYNCHRONIZED_STAKEHOLDERS.map(s => {
      // Find assigned default user
      const user = Array.from(this.users.values()).find(u => u.role === s.roleCode);
      // Find assigned facility if applicable
      const facility = Array.from(this.facilities.values()).find(f => f.stage === s.roleCode);

      return {
        ...s,
        assignedUser: user ? { id: user.id, name: user.name, title: user.title, email: user.email } : null,
        assignedFacility: facility ? { id: facility.id, name: facility.name, location: facility.location } : null
      };
    });
  }
}

export const globalDataStore = new CtDataStore();
