"""
CIRCULARTRACE - Fairtrade Readiness Index (FRI) Engine (Python Reference)
Menghitung Fairtrade Readiness Index (FRI) untuk entitas rantai pasok kopi di CircularTrace.
"""

def calculate_fairtrade_readiness(coop_data):
    """
    Menghitung Fairtrade Readiness Index (FRI) untuk entitas rantai pasok kopi di CircularTrace.
    :param coop_data: Dict berisi data asesmen dari database koperasi/petani.
    :return: Dict berisi skor per pilar, skor total (FRI), status, dan rekomendasi celah.
    """
    
    # 1. Pilar Ekonomi (Economic Criteria)
    # Parameter: Distribusi premi demokratis (0/1), pencatatan harga minimum (0/1)
    e_score = (
        (1.0 if coop_data.get('democratic_premium_mgmt', False) else 0.0) * 0.5 +
        (1.0 if coop_data.get('transparent_pricing', False) else 0.0) * 0.5
    ) * 100

    # 2. Pilar Sosial & Ketenagakerjaan (Social & Labor Criteria)
    # Parameter: Kepatuhan anti-child labor, kepemilikan K3/APD, kontrak kerja
    s_score = (
        (1.0 if coop_data.get('no_child_forced_labor', False) else 0.0) * 0.4 +
        (1.0 if coop_data.get('ohs_ppe_compliance', False) else 0.0) * 0.3 +
        (1.0 if coop_data.get('fair_wages_contracts', False) else 0.0) * 0.3
    ) * 100

    # 3. Pilar Lingkungan & Sirkularitas (Environmental & CCI Integration)
    # Parameter: Pengelolaan limbah pulping/kulit kopi (terhubung CCI), perlindungan ekosistem
    env_score = (
        (1.0 if coop_data.get('waste_valorization_cci', False) else 0.0) * 0.5 +
        (1.0 if coop_data.get('no_forest_conversion', False) else 0.0) * 0.3 +
        (1.0 if coop_data.get('reduced_chemical_use', False) else 0.0) * 0.2
    ) * 100

    # 4. Pilar Tata Kelola & Keterlacakan (Governance & Traceability)
    # Parameter: Keterlacakan plot berbasis koordinat, pemisahan fisik (segregasi stok)
    g_score = (
        (1.0 if coop_data.get('plot_mapping_complete', False) else 0.0) * 0.5 +
        (1.0 if coop_data.get('physical_segregation', False) else 0.0) * 0.5
    ) * 100

    # Total Fairtrade Readiness Index (FRI) dengan bobot masing-masing 25%
    fri_total = (e_score * 0.25) + (s_score * 0.25) + (env_score * 0.25) + (g_score * 0.25)

    # Penentuan Status Kesiapan
    if fri_total >= 85:
        status = "Ready for Certification (Sangat Siap)"
    elif fri_total >= 60:
        status = "Progressing (Dalam Proses / Perlu Perbaikan Minor)"
    else:
        status = "Needs Major Improvement (Belum Siap / Butuh Pendampingan)"

    # Identifikasi Kesenjangan (Gaps) untuk Rekomendasi Otomatis
    gaps = []
    if not coop_data.get('democratic_premium_mgmt'):
        gaps.append("Sistem manajemen premi koperasi belum sepenuhnya demokratis.")
    if not coop_data.get('ohs_ppe_compliance'):
        gaps.append("Penerapan K3 dan penyediaan APD bagi petani/pekerja masih kurang.")
    if not coop_data.get('waste_valorization_cci'):
        gaps.append("Pengelolaan limbah pascapanen belum terintegrasi secara optimal dengan indikator sirkularitas (CCI).")
    if not coop_data.get('plot_mapping_complete'):
        gaps.append("Pemetaan koordinat lahan petani belum lengkap dalam sistem CircularTrace.")

    return {
        "fairtrade_readiness_index": round(fri_total, 2),
        "status": status,
        "pillar_scores": {
            "economic": round(e_score, 2),
            "social": round(s_score, 2),
            "environmental": round(env_score, 2),
            "governance": round(g_score, 2)
        },
        "identified_gaps": gaps
    }


if __name__ == '__main__':
    # Test sample
    sample_coop = {
        'democratic_premium_mgmt': True,
        'transparent_pricing': True,
        'no_child_forced_labor': True,
        'ohs_ppe_compliance': True,
        'fair_wages_contracts': True,
        'waste_valorization_cci': True,
        'no_forest_conversion': True,
        'reduced_chemical_use': True,
        'plot_mapping_complete': True,
        'physical_segregation': True
    }
    result = calculate_fairtrade_readiness(sample_coop)
    print("Fairtrade Readiness Index:", result['fairtrade_readiness_index'])
    print("Status:", result['status'])
