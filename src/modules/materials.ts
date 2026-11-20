import {
  esc,
  fmtSI,
  loadEduProgress,
  renderQuizSuite,
  renderSyllabusBanner,
  renderTheoryCatalog,
  saveEduProgress,
  wireSubnav,
  type MxGraphController,
  type QuizQuestion,
  type TheoryTopic,
} from './shared';

const MATERIALS_TOPICS: TheoryTopic[] = [
  {
    id: 'mat-a',
    code: 'TOPIC A',
    title: 'Engineering Materials Classification & Selection Framework',
    scope: 'Core',
    outcome: 'Classify metals, polymers, ceramics, composites, and natural materials using structure-property-performance relationships.',
    summary:
      'Every engineered component depends on linking chemical bonding & microstructure to measurable properties and manufacturing constraints.',
    points: [
      'Metals & Alloys: Metallic bonding, delocalized electrons → high stiffness (E), high thermal/electrical conductivity, good ductility via dislocation glide.',
      'Polymers: Long covalently bonded hydrocarbon/amide/ester chains held by weak secondary bonds → low density, lower stiffness, viscoelastic/temperature sensitivity.',
      'Ceramics & Glasses: Ionic/covalent 3D networks → high hardness, high melting point, electrical/thermal insulation, brittle fracture due to restricted slip.',
      'Composites: Engineered combination of matrix + reinforcement (e.g., E-glass or carbon fibre in epoxy) achieving superior specific strength/stiffness.',
      'Natural & Fibrous Materials: Cellulose, wool keratin, timber, leather; anisotropic structures governed by biological hierarchy and moisture equilibrium.',
    ],
  },
  {
    id: 'mat-b',
    code: 'TOPIC B',
    title: 'Atomic Structure, Interatomic Bonding & Physical Consequences',
    scope: 'Core',
    outcome: 'Relate primary (ionic, covalent, metallic) and secondary (van der Waals, hydrogen) bond energy curves to E, Tm, and α.',
    summary:
      'Macroscopic stiffness, melting temperature, and thermal expansion originate directly from the depth and curvature of the potential energy well E(r).',
    points: [
      'Deep potential well E₀ corresponds to high melting point Tm and lower thermal expansion coefficient α (steeper asymmetric trough).',
      'Elastic modulus E is proportional to the curvature (d²E/dr²) at equilibrium separation r₀: steep curve → stiffer material.',
      'Ionic bonding: Electron transfer (e.g., NaCl, MgO, Al₂O₃); non-directional, high Tm, brittle when slip aligns like-charged ions.',
      'Covalent bonding: Shared electron pairs (diamond, SiC, polymer backbones); highly directional.',
      'Secondary Hydrogen / van der Waals bonds: Govern inter-chain cohesion in Nylon, cellulose, and PE; disrupted by heat or moisture.',
    ],
    codeOrFormula: 'E_elastic ∝ (d²U / dr²) at r = r₀     |     Larger bond energy E₀ → Higher T_m, Lower α',
  },
  {
    id: 'mat-c',
    code: 'TOPIC C',
    title: 'Crystal Structures, Packing Efficiency & Lattice Imperfections',
    scope: 'Core',
    outcome: 'Compute lattice parameter a(R), coordination number, APF, and theoretical density for SC, BCC, FCC, and HCP cells.',
    summary:
      'Crystalline solids arrange atoms in repeating 3D unit cells, whereas amorphous solids (glasses, atactic polymers) lack long-range periodic order.',
    points: [
      'Simple Cubic (SC): 1 atom/cell, CN = 6, a = 2R, APF = π/6 ≈ 0.524 (52.4%). Rare in pure metals (e.g., α-Po).',
      'Body-Centered Cubic (BCC): 2 atoms/cell, CN = 8, a = 4R/√3, APF = √3·π/8 ≈ 0.680 (68.0%). Examples: α-Fe, Cr, W.',
      'Face-Centered Cubic (FCC): 4 atoms/cell, CN = 12, a = 2√2·R, APF = π/(3√2) ≈ 0.740 (74.0%). Examples: Al, Cu, Ni, γ-Fe (typically very ductile).',
      'Hexagonal Close-Packed (HCP): 6 atoms/full hex cell (2 atoms/primitive), CN = 12, ideal c/a ≈ 1.633, APF ≈ 0.740. Examples: Ti, Mg, Zn.',
      'Imperfections: Point defects (vacancies, interstitials strengthen alloys), Line defects (edge/screw dislocations enable plastic yield well below theoretical strength), Planar grain boundaries (Hall-Petch strengthening: finer grains resist slip).',
    ],
    codeOrFormula: 'Theoretical Density:  ρ = (n · A) / (V_c · N_A)     where N_A = 6.02214 × 10²³ mol⁻¹',
    workedExample: {
      title: 'FCC Copper Theoretical Density',
      body: 'Cu is FCC: n = 4 atoms/cell, R = 0.1278 nm = 1.278×10⁻⁸ cm, A = 63.55 g/mol.\na = 2√2 R = 3.615×10⁻⁸ cm → V_c = a³ = 4.724×10⁻²³ cm³.\nρ = (4 × 63.55) / (4.724×10⁻²³ × 6.022×10²³) ≈ 8.94 g/cm³ (matches measured ~8.96 g/cm³).',
    },
  },
  {
    id: 'mat-d',
    code: 'TOPIC D',
    title: 'Mechanical, Thermal & Electrical Behavior Distinctions',
    scope: 'Core',
    outcome: 'Distinguish stiffness, yield strength, UTS, ductility, resilience, toughness, hardness, fatigue, and creep rigorously.',
    summary:
      'Engineering specifications fail when distinct mechanical metrics are confused—for example, glass has higher stiffness than HDPE but far lower toughness.',
    points: [
      'Stiffness (Elastic Modulus E = σ/ε): Resistance to reversible elastic deformation (slope of linear Hookean region).',
      'Yield Strength (σ_y): Stress where irreversible plastic dislocation slip begins (commonly 0.2% offset criterion when yield plateau is absent).',
      'Ultimate Tensile Strength (σ_UTS): Peak engineering stress supported before necking instability begins.',
      'Ductility (%EL, %RA): Capacity to deform plastically before fracture (ductile steels > 15–25% vs brittle cast iron < 1–2%).',
      'Resilience (U_r = ½ σ_y ε_y): Elastic energy absorbed per unit volume upon loading up to yield (recoverable upon unloading).',
      'Toughness (U_T = ∫₀^{ε_f} σ dε): Total energy per unit volume absorbed up to fracture (requires BOTH strength and ductility).',
      'Time/Cyclic Failures [Supplementary note]: Fatigue fractures under cyclic stress well below UTS; Creep is time-dependent plastic flow at elevated temperatures (T > 0.4 T_m K).',
    ],
  },
];

interface TensilePreset {
  id: string;
  name: string;
  family: string;
  E_GPa: number;
  sigmaY_MPa: number;
  UTS_MPa: number;
  epsF_pct: number;
  ductile: boolean;
  note: string;
  refSource: string;
}

const TENSILE_PRESETS: TensilePreset[] = [
  {
    id: 'steel-mild',
    name: 'Mild Carbon Steel (ASTM A36)',
    family: 'Ferrous Alloy',
    E_GPa: 200,
    sigmaY_MPa: 250,
    UTS_MPa: 430,
    epsF_pct: 24,
    ductile: true,
    note: 'Distinct yield point / plateau followed by strain hardening, necking past UTS (~15% strain), and cup-and-cone ductile fracture.',
    refSource: 'Callister (10e) / ASM Handbook Vol. 1 (typical A36 range: σ_y ≥ 250 MPa, UTS 400–550 MPa)',
  },
  {
    id: 'al-6061',
    name: 'Aluminum Alloy (6061-T6)',
    family: 'Light Alloy',
    E_GPa: 69,
    sigmaY_MPa: 276,
    UTS_MPa: 310,
    epsF_pct: 12,
    ductile: true,
    note: 'Lower modulus (69 GPa vs 200 GPa steel) yet high yield strength via precipitation hardening; smooth continuous yielding (0.2% offset).',
    refSource: 'ASM Metals Handbook Vol. 2 (typical 6061-T6: E ≈ 68.9 GPa, σ_y ≈ 276 MPa, UTS ≈ 310 MPa)',
  },
  {
    id: 'copper',
    name: 'Annealed Copper (C11000)',
    family: 'FCC Non-Ferrous',
    E_GPa: 115,
    sigmaY_MPa: 70,
    UTS_MPa: 220,
    epsF_pct: 42,
    ductile: true,
    note: 'FCC structure with 12 slip systems provides low yield stress, extensive work hardening, and very high ductility.',
    refSource: 'Callister (10e) Appendix B (typical annealed pure Cu)',
  },
  {
    id: 'cast-iron',
    name: 'Grey Cast Iron (Class 30)',
    family: 'Brittle Ferrous',
    E_GPa: 100,
    sigmaY_MPa: 210,
    UTS_MPa: 215,
    epsF_pct: 0.5,
    ductile: false,
    note: 'Graphite flakes act as internal stress concentrators; fractures cleanly in tension with minimal plastic elongation.',
    refSource: 'ASM Handbook Vol. 1 (Class 30 grey cast iron tension profile)',
  },
  {
    id: 'hdpe',
    name: 'High-Density Polyethylene (HDPE)',
    family: 'Semi-crystalline Polymer',
    E_GPa: 1.1,
    sigmaY_MPa: 26,
    UTS_MPa: 28,
    epsF_pct: 65,
    ductile: true,
    note: 'Cold-drawing polymer chains align along tensile axis after an initial yield drop (illustrative curve capped at 65% for axis readability).',
    refSource: 'Callister / Ashby CES EduPack (typical HDPE ranges)',
  },
  {
    id: 'pmma',
    name: 'Acrylic / PMMA (Room Temp)',
    family: 'Amorphous Glassy Polymer',
    E_GPa: 3.1,
    sigmaY_MPa: 62,
    UTS_MPa: 65,
    epsF_pct: 3.2,
    ductile: false,
    note: 'Below glass transition temperature T_g (~105°C), crazing leads to brittle glassy fracture near ~3% strain.',
    refSource: 'Callister Appendix B (typical cast PMMA at 20°C)',
  },
  {
    id: 'gfrp',
    name: 'E-Glass / Epoxy Composite (Unidirectional)',
    family: 'Polymer Matrix Composite',
    E_GPa: 42,
    sigmaY_MPa: 950,
    UTS_MPa: 1000,
    epsF_pct: 2.5,
    ductile: false,
    note: 'Nearly linear-elastic up to fibre-dominated brittle failure at high strength and low strain.',
    refSource: 'Callister Ch. 16 (typical longitudinal 60% V_f E-glass/epoxy)',
  },
];

function sampleTensileCurve(
  p: TensilePreset,
  modelMode: 'simulated' | 'idealized'
): { epsPct: number; sigmaMPa: number }[] {
  const pts: { epsPct: number; sigmaMPa: number }[] = [];
  const N = 120;
  const epsY_pct = (p.sigmaY_MPa / (p.E_GPa * 1000)) * 100;
  const epsMax = Math.max(p.epsF_pct, epsY_pct * 1.1);

  if (modelMode === 'idealized') {
    if (!p.ductile) {
      for (let i = 0; i <= 40; i++) {
        const e = (epsMax * i) / 40;
        const s = Math.min(p.UTS_MPa, (p.E_GPa * 1000 * e) / 100);
        pts.push({ epsPct: e, sigmaMPa: s });
      }
      return pts;
    }
    const seg1 = 30;
    for (let i = 0; i <= seg1; i++) {
      const e = (epsY_pct * i) / seg1;
      pts.push({ epsPct: e, sigmaMPa: (p.sigmaY_MPa * i) / seg1 });
    }
    for (let i = 1; i <= 40; i++) {
      const e = epsY_pct + ((epsMax - epsY_pct) * i) / 40;
      pts.push({ epsPct: e, sigmaMPa: p.sigmaY_MPa });
    }
    return pts;
  }

  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const e = t * epsMax;
    let s = 0;
    if (e <= epsY_pct) {
      s = (p.E_GPa * 1000 * e) / 100;
    } else if (!p.ductile) {
      const u = (e - epsY_pct) / Math.max(1e-6, epsMax - epsY_pct);
      s = p.sigmaY_MPa + (p.UTS_MPa - p.sigmaY_MPa) * Math.sin((u * Math.PI) / 2);
    } else {
      const epsUTS = epsY_pct + 0.62 * (epsMax - epsY_pct);
      if (e <= epsUTS) {
        const u = (e - epsY_pct) / Math.max(1e-6, epsUTS - epsY_pct);
        if (p.id === 'steel-mild' && u < 0.08) {
          // Subtle yield plateau simulation for mild steel
          s = p.sigmaY_MPa * (1 + 0.02 * Math.sin(u * 60));
        } else if (p.id === 'hdpe' && u < 0.14) {
          // Necking drop in semi-crystalline polymer cold drawing
          s = p.sigmaY_MPa * (1 - 0.18 * Math.sin((u / 0.14) * Math.PI));
        } else {
          s = p.sigmaY_MPa + (p.UTS_MPa - p.sigmaY_MPa) * Math.pow(Math.sin((u * Math.PI) / 2), 0.72);
        }
      } else {
        const u = (e - epsUTS) / Math.max(1e-6, epsMax - epsUTS);
        const sFrac = p.UTS_MPa * (p.id === 'hdpe' ? 0.92 : 0.78);
        s = p.UTS_MPa - (p.UTS_MPa - sFrac) * Math.pow(u, 1.5);
      }
    }
    pts.push({ epsPct: e, sigmaMPa: Math.max(0, s) });
  }
  return pts;
}

interface MaterialDbRow {
  name: string;
  family: 'Metals' | 'Polymers' | 'Ceramics' | 'Composites';
  E_GPa: string;
  sigmaY_MPa: string;
  UTS_MPa: string;
  el_pct: string;
  rho_gcc: string;
  k_WmK: string;
  tempNote: string;
  source: string;
}

const MATERIAL_DB: MaterialDbRow[] = [
  { name: 'Structural Carbon Steel (A36 / 1020)', family: 'Metals', E_GPa: '200 – 210', sigmaY_MPa: '250 – 350', UTS_MPa: '400 – 550', el_pct: '20 – 36', rho_gcc: '7.85', k_WmK: '45 – 52', tempNote: 'T_m ≈ 1500 °C', source: 'Callister / ASM Vol. 1' },
  { name: 'Stainless Steel (304 Annealed)', family: 'Metals', E_GPa: '193 – 200', sigmaY_MPa: '205 – 290', UTS_MPa: '515 – 620', el_pct: '40 – 60', rho_gcc: '7.9 – 8.0', k_WmK: '14 – 16', tempNote: 'T_m ≈ 1400–1455 °C', source: 'ASM Vol. 1 / Appendix B' },
  { name: 'Aluminum Alloy (6061-T6)', family: 'Metals', E_GPa: '68 – 70', sigmaY_MPa: '240 – 276', UTS_MPa: '290 – 310', el_pct: '10 – 17', rho_gcc: '2.70', k_WmK: '167', tempNote: 'T_m ≈ 582–652 °C', source: 'ASM Vol. 2' },
  { name: 'Pure Copper (Annealed)', family: 'Metals', E_GPa: '110 – 128', sigmaY_MPa: '60 – 75', UTS_MPa: '200 – 250', el_pct: '40 – 50', rho_gcc: '8.94 – 8.96', k_WmK: '385 – 401', tempNote: 'T_m ≈ 1085 °C', source: 'Callister Appendix B' },
  { name: 'Titanium Alloy (Ti-6Al-4V)', family: 'Metals', E_GPa: '110 – 114', sigmaY_MPa: '830 – 920', UTS_MPa: '900 – 990', el_pct: '10 – 16', rho_gcc: '4.43', k_WmK: '6.7 – 7.2', tempNote: 'T_m ≈ 1600–1660 °C', source: 'ASM Vol. 2' },
  { name: 'HDPE (Molding Grade)', family: 'Polymers', E_GPa: '0.8 – 1.5', sigmaY_MPa: '22 – 31', UTS_MPa: '22 – 35', el_pct: '50 – 800', rho_gcc: '0.94 – 0.97', k_WmK: '0.42 – 0.51', tempNote: 'T_m ≈ 130–137 °C', source: 'Callister / Ashby' },
  { name: 'Nylon 6,6 (Dry-as-molded)', family: 'Polymers', E_GPa: '1.6 – 3.5', sigmaY_MPa: '45 – 85', UTS_MPa: '65 – 95', el_pct: '15 – 80', rho_gcc: '1.13 – 1.15', k_WmK: '0.24 – 0.28', tempNote: 'T_m ≈ 255–265 °C', source: 'Callister / MatWeb ref ranges' },
  { name: 'PET (Polyethylene Terephthalate)', family: 'Polymers', E_GPa: '2.7 – 4.1', sigmaY_MPa: '50 – 65', UTS_MPa: '55 – 75', el_pct: '30 – 300', rho_gcc: '1.33 – 1.40', k_WmK: '0.15 – 0.24', tempNote: 'T_g ≈ 70–80 °C, T_m ≈ 255 °C', source: 'Callister Appendix B' },
  { name: 'Alumina (Al₂O₃, Sintered)', family: 'Ceramics', E_GPa: '370 – 393', sigmaY_MPa: 'Brittle', UTS_MPa: '250 – 350 (flexural)', el_pct: '< 0.2', rho_gcc: '3.90 – 3.98', k_WmK: '25 – 35', tempNote: 'T_m ≈ 2050 °C', source: 'Callister Appendix B' },
  { name: 'Soda-Lime Glass', family: 'Ceramics', E_GPa: '68 – 72', sigmaY_MPa: 'Brittle', UTS_MPa: '40 – 70 (tensile)', el_pct: '< 0.1', rho_gcc: '2.48 – 2.52', k_WmK: '0.9 – 1.3', tempNote: 'T_soft ≈ 700 °C', source: 'Callister / Ashby' },
  { name: 'CFRP (Unidir. Carbon/Epoxy 60% Vf)', family: 'Composites', E_GPa: '125 – 150 (long.)', sigmaY_MPa: 'Linear brittle', UTS_MPa: '1400 – 2100', el_pct: '1.1 – 1.6', rho_gcc: '1.55 – 1.60', k_WmK: '5 – 10 (long.)', tempNote: 'Matrix T_g ≈ 120–180 °C', source: 'Callister Ch. 16' },
];

const MAT_QUIZ: QuizQuestion[] = [
  {
    id: 'mq1',
    level: 'Beginner',
    category: 'Crystal Packing',
    kind: 'mcq',
    prompt: 'Which cubic crystal structure exhibits an Atomic Packing Factor (APF) of 0.74 and coordination number 12?',
    options: ['Simple Cubic (SC)', 'Body-Centered Cubic (BCC)', 'Face-Centered Cubic (FCC)', 'Amorphous Glass'],
    correctIndex: 2,
    explanation: 'FCC has 4 atoms per unit cell with a = 2√2 R, yielding APF = π/(3√2) ≈ 0.740 and coordination number 12.',
  },
  {
    id: 'mq2',
    level: 'Beginner',
    category: 'Stress-Strain Concepts',
    kind: 'mcq',
    prompt: 'Which quantity corresponds to the total area under an engineering stress–strain curve up to fracture?',
    options: ['Young’s modulus (stiffness)', 'Yield strength', 'Modulus of resilience', 'Toughness (energy absorbed before fracture)'],
    correctIndex: 3,
    explanation: 'Toughness measures total energy absorbed per unit volume before fracture (∫σ dε up to ε_f), whereas resilience only integrates the elastic triangle up to yield.',
  },
  {
    id: 'mq3',
    level: 'Intermediate',
    category: 'Elasticity Numerical',
    kind: 'numeric',
    prompt: 'A steel rod of circular area A = 120 mm² and original gauge length L₀ = 250 mm carries an axial tensile load of 24 kN within the elastic region (E = 200 GPa). Calculate elongation ΔL in mm.',
    numericAnswer: 0.25,
    tolMode: 'rel',
    tolerance: 0.02,
    unit: 'mm',
    explanation: 'σ = F / A = 24,000 N / 120 mm² = 200 MPa. ε = σ / E = 200 MPa / 200,000 MPa = 0.001. ΔL = ε · L₀ = 0.001 × 250 mm = 0.25 mm.',
  },
  {
    id: 'mq4',
    level: 'Intermediate',
    category: 'Brinell Hardness',
    kind: 'numeric',
    prompt: 'In a Brinell hardness test, a 10 mm steel ball (D = 10 mm) under F = 3000 kgf produces an indentation diameter d = 4.0 mm. Calculate HBW using HBW = 2F / [π D (D - √(D² - d²))].',
    numericAnswer: 229,
    tolMode: 'rel',
    tolerance: 0.02,
    unit: 'HBW',
    explanation: 'D - √(100 - 16) = 10 - 9.16515 = 0.83485 mm. HBW = 6000 / (π × 10 × 0.83485) ≈ 228.8 HBW.',
  },
  {
    id: 'mq5',
    level: 'Intermediate',
    category: 'Bonding & Expansion',
    kind: 'mcq',
    prompt: 'A ceramic alumina block has a deeper, steeper potential energy trough E(r) than polyethylene. Which trend directly follows?',
    options: [
      'Lower elastic modulus and higher thermal expansion',
      'Higher elastic modulus, higher melting point, and lower linear thermal expansion α',
      'Higher ductility at room temperature',
      'Metallic electrical conductivity',
    ],
    correctIndex: 1,
    explanation: 'Stronger bond energy deepens E₀ (higher T_m), increases curvature d²E/dr² (higher stiffness E), and narrows trough asymmetry (lower α).',
  },
  {
    id: 'mq6',
    level: 'Advanced',
    category: 'Thermal Stress',
    kind: 'numeric',
    prompt: 'An aluminum bar (E = 69 GPa, α = 23×10⁻⁶ K⁻¹) is rigidly clamped at both ends at 20 °C and heated to 70 °C (ΔT = +50 K). Calculate the magnitude of compressive thermal stress |σ_th| in MPa.',
    numericAnswer: 79.35,
    tolMode: 'rel',
    tolerance: 0.02,
    unit: 'MPa',
    explanation: '|σ_th| = E · α · ΔT = 69,000 MPa × 23×10⁻⁶ K⁻¹ × 50 K = 79.35 MPa.',
  },
];

let initialized = false;

export function initMaterialsModule(): void {
  if (initialized) return;
  const root = document.getElementById('mod-materials');
  if (!root) return;
  initialized = true;

  const nav = root.querySelector<HTMLElement>('#matSubnav');
  const panels = root.querySelector<HTMLElement>('#matPanels');
  if (!nav || !panels) return;

  const updateProgressSummary = () => {
    const p = loadEduProgress('materials');
    const progEl = root.querySelector('#matProgressCard');
    if (progEl) {
      const best = p.quizBest['mat-main'];
      progEl.innerHTML = `
        <div class="kv-grid">
          <div class="kv-cell"><small>Topics Reviewed</small><b>${p.reviewedTopics.length} / ${MATERIALS_TOPICS.length}</b></div>
          <div class="kv-cell"><small>Best Assessment</small><b>${best ? `${best.score}/${best.total} (${Math.round((best.score / best.total) * 100)}%)` : 'Not attempted'}</b></div>
        </div>
      `;
    }
  };

  /* 1. Curriculum & Crystal Visualizer */
  const banner = root.querySelector<HTMLElement>('#matAlignBanner');
  if (banner) {
    banner.innerHTML = renderSyllabusBanner({
      courseCode: 'MT1023',
      courseName: 'Properties of Materials',
      context: '1st-Year Engineering Materials Foundation',
      outcomes: [
        'Link atomic bonding and unit-cell crystallography (SC, BCC, FCC, HCP) to density and slip ductility.',
        'Compute normal/shear stress, strain, elastic modulus, ductility, thermal expansion, hardness, and factor of safety in SI units.',
        'Conduct virtual tensile tests and evaluate experimental stress-strain curves to extract E, 0.2% σ_y, UTS, resilience, and toughness.',
        'Compare engineering metals, polymers, ceramics, and composites using authoritative property ranges.',
      ],
    });
  }

  const theoryCatalog = root.querySelector<HTMLElement>('#matTheoryCatalog');
  if (theoryCatalog) renderTheoryCatalog(theoryCatalog, 'materials', MATERIALS_TOPICS, updateProgressSummary);

  // Interactive Crystal Unit Cell Canvas
  const crysCv = root.querySelector<HTMLCanvasElement>('#matCrystalCv');
  const crysSelect = root.querySelector<HTMLSelectElement>('#matCrystalType');
  const crysElem = root.querySelector<HTMLSelectElement>('#matCrystalElem');
  const crysYaw = root.querySelector<HTMLInputElement>('#matCrystalYaw');
  const crysPitch = root.querySelector<HTMLInputElement>('#matCrystalPitch');
  const crysOut = root.querySelector<HTMLElement>('#matCrystalOut');

  const drawCrystal = () => {
    if (!crysCv || !crysSelect || !crysElem || !crysYaw || !crysPitch || !crysOut) return;
    const type = crysSelect.value as 'SC' | 'BCC' | 'FCC' | 'HCP';
    const yawDeg = parseFloat(crysYaw.value) || 28;
    const pitchDeg = parseFloat(crysPitch.value) || 20;
    const yawEl = root.querySelector('#matYawLbl');
    const pitchEl = root.querySelector('#matPitchLbl');
    if (yawEl) yawEl.textContent = `${yawDeg}°`;
    if (pitchEl) pitchEl.textContent = `${pitchDeg}°`;

    // Element presets for density calculation
    const elemData: Record<string, { label: string; struct: 'SC' | 'BCC' | 'FCC' | 'HCP'; R_nm: number; A_gmol: number; litRange: string }> = {
      po: { label: 'Polonium (α-Po)', struct: 'SC', R_nm: 0.168, A_gmol: 208.98, litRange: '9.19 – 9.32 g/cm³' },
      fe: { label: 'Iron (α-Fe)', struct: 'BCC', R_nm: 0.1241, A_gmol: 55.845, litRange: '7.86 – 7.87 g/cm³' },
      cu: { label: 'Copper (Cu)', struct: 'FCC', R_nm: 0.1278, A_gmol: 63.546, litRange: '8.93 – 8.96 g/cm³' },
      al: { label: 'Aluminum (Al)', struct: 'FCC', R_nm: 0.1431, A_gmol: 26.982, litRange: '2.70 g/cm³' },
      ti: { label: 'Titanium (α-Ti)', struct: 'HCP', R_nm: 0.1462, A_gmol: 47.867, litRange: '4.50 – 4.54 g/cm³' },
    };
    const ed = elemData[crysElem.value] || elemData.cu;

    // Crystal metrics
    let nAtoms = 1;
    let cn = 6;
    let apf = Math.PI / 6;
    let aStr = 'a = 2R';
    let a_cm = 2 * ed.R_nm * 1e-7;
    let vc_cm3 = a_cm ** 3;
    if (type === 'BCC') {
      nAtoms = 2;
      cn = 8;
      apf = (Math.sqrt(3) * Math.PI) / 8;
      aStr = 'a = 4R / √3';
      a_cm = (4 * ed.R_nm * 1e-7) / Math.sqrt(3);
      vc_cm3 = a_cm ** 3;
    } else if (type === 'FCC') {
      nAtoms = 4;
      cn = 12;
      apf = Math.PI / (3 * Math.sqrt(2));
      aStr = 'a = 2√2 R';
      a_cm = 2 * Math.SQRT2 * ed.R_nm * 1e-7;
      vc_cm3 = a_cm ** 3;
    } else if (type === 'HCP') {
      nAtoms = 6;
      cn = 12;
      apf = Math.PI / (3 * Math.sqrt(2));
      aStr = 'a = 2R, c ≈ 1.633 a';
      a_cm = 2 * ed.R_nm * 1e-7;
      const c_cm = 1.633 * a_cm;
      vc_cm3 = ((3 * Math.sqrt(3)) / 2) * a_cm * a_cm * c_cm;
    }
    const NA = 6.02214e23;
    const rhoTheo = (nAtoms * ed.A_gmol) / (vc_cm3 * NA);
    const mismatchNote = ed.struct !== type ? ` (Note: ${ed.label} naturally adopts ${ed.struct}, showing hypothetical ${type} packing density)` : '';

    crysOut.innerHTML = `
      <div class="kv-grid">
        <div class="kv-cell"><small>Atoms / Unit Cell (n)</small><b>${nAtoms}</b></div>
        <div class="kv-cell"><small>Coordination Number</small><b>${cn}</b></div>
        <div class="kv-cell"><small>Lattice Relation</small><b>${aStr}</b></div>
        <div class="kv-cell"><small>Atomic Packing Factor</small><b>${apf.toFixed(3)} (${(apf * 100).toFixed(1)}%)</b></div>
        <div class="kv-cell"><small>Theo. Density (${esc(ed.label)})</small><b>${rhoTheo.toFixed(2)} g/cm³</b></div>
        <div class="kv-cell"><small>Literature Density</small><b>${esc(ed.litRange)}</b></div>
      </div>
      ${mismatchNote ? `<p class="note">${esc(mismatchNote)}</p>` : ''}
    `;

    // Render 3D projected unit cell
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = crysCv.clientWidth || 440;
    const h = crysCv.clientHeight || 280;
    crysCv.width = w * dpr;
    crysCv.height = h * dpr;
    const ctx = crysCv.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const style = getComputedStyle(document.documentElement);
    const accent = style.getPropertyValue('--accent').trim() || '#D6B77A';
    const accent2 = style.getPropertyValue('--accent2').trim() || '#8BB8E8';
    const lineCol = style.getPropertyValue('--muted').trim() || '#9aa0ad';
    const textCol = style.getPropertyValue('--text').trim() || '#F1EEE7';

    const yaw = (yawDeg * Math.PI) / 180;
    const pitch = (pitchDeg * Math.PI) / 180;
    const cy = Math.cos(yaw), sy = Math.sin(yaw);
    const cp = Math.cos(pitch), sp = Math.sin(pitch);
    const scale = Math.min(w, h) * 0.36;

    const proj = (x: number, y: number, z: number): [number, number, number] => {
      const rx = x * cy + z * sy;
      const rz = -x * sy + z * cy;
      const ry = y * cp - rz * sp;
      const zz = y * sp + rz * cp;
      return [w / 2 + rx * scale, h / 2 - ry * scale, zz];
    };

    const nodes: { p: [number, number, number]; role: 'corner' | 'center' | 'face' }[] = [];
    const edges: [[number, number, number], [number, number, number]][] = [];

    if (type !== 'HCP') {
      const c = [-0.5, 0.5];
      for (const x of c) for (const y of c) for (const z of c) nodes.push({ p: [x, y, z], role: 'corner' });
      const corners = nodes.map((n) => n.p);
      for (let i = 0; i < corners.length; i++) {
        for (let j = i + 1; j < corners.length; j++) {
          const diff =
            (corners[i][0] !== corners[j][0] ? 1 : 0) +
            (corners[i][1] !== corners[j][1] ? 1 : 0) +
            (corners[i][2] !== corners[j][2] ? 1 : 0);
          if (diff === 1) edges.push([corners[i], corners[j]]);
        }
      }
      if (type === 'BCC') nodes.push({ p: [0, 0, 0], role: 'center' });
      if (type === 'FCC') {
        const faces: [number, number, number][] = [
          [0.5, 0, 0], [-0.5, 0, 0],
          [0, 0.5, 0], [0, -0.5, 0],
          [0, 0, 0.5], [0, 0, -0.5],
        ];
        faces.forEach((f) => nodes.push({ p: f, role: 'face' }));
      }
    } else {
      const Rhex = 0.56;
      const yTop = 0.52, yBot = -0.52;
      const topRing: [number, number, number][] = [];
      const botRing: [number, number, number][] = [];
      for (let k = 0; k < 6; k++) {
        const th = (k * Math.PI) / 3;
        const tp: [number, number, number] = [Rhex * Math.cos(th), yTop, Rhex * Math.sin(th)];
        const bp: [number, number, number] = [Rhex * Math.cos(th), yBot, Rhex * Math.sin(th)];
        topRing.push(tp);
        botRing.push(bp);
        nodes.push({ p: tp, role: 'corner' }, { p: bp, role: 'corner' });
      }
      for (let k = 0; k < 6; k++) {
        edges.push([topRing[k], topRing[(k + 1) % 6]]);
        edges.push([botRing[k], botRing[(k + 1) % 6]]);
        edges.push([topRing[k], botRing[k]]);
      }
      nodes.push({ p: [0, yTop, 0], role: 'face' }, { p: [0, yBot, 0], role: 'face' });
      // Mid-plane B layer (3 atoms)
      for (let k = 0; k < 3; k++) {
        const th = (k * 2 * Math.PI) / 3 + Math.PI / 6;
        nodes.push({ p: [Rhex * 0.55 * Math.cos(th), 0, Rhex * 0.55 * Math.sin(th)], role: 'center' });
      }
    }

    ctx.strokeStyle = lineCol;
    ctx.lineWidth = 1.3;
    ctx.globalAlpha = 0.65;
    edges.forEach(([a, b]) => {
      const pa = proj(a[0], a[1], a[2]);
      const pb = proj(b[0], b[1], b[2]);
      ctx.beginPath();
      ctx.moveTo(pa[0], pa[1]);
      ctx.lineTo(pb[0], pb[1]);
      ctx.stroke();
    });
    ctx.globalAlpha = 1;

    // Sort back-to-front by z depth
    const projected = nodes
      .map((n) => ({ ...n, pr: proj(n.p[0], n.p[1], n.p[2]) }))
      .sort((a, b) => a.pr[2] - b.pr[2]);

    projected.forEach((n) => {
      const [px, py, pz] = n.pr;
      const rad = 11 + (pz + 0.8) * 2.5;
      const col = n.role === 'corner' ? accent : n.role === 'center' ? accent2 : '#6fd6a4';
      const grad = ctx.createRadialGradient(px - rad * 0.3, py - rad * 0.3, 1, px, py, rad);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.45, col);
      grad.addColorStop(1, 'rgba(0,0,0,0.45)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(px, py, Math.max(6, rad), 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.fillStyle = textCol;
    ctx.font = '600 11px var(--f-mono), monospace';
    ctx.fillText(`${type} Unit Cell · Gold=Corner · Blue=Body/Mid · Green=Face`, 12, 18);
  };

  [crysSelect, crysElem, crysYaw, crysPitch].forEach((el) => el?.addEventListener('input', drawCrystal));

  /* 2. Interactive Tensile Testing Laboratory (MAIN FEATURE) */
  const tenMatSel = root.querySelector<HTMLSelectElement>('#tenMatSel');
  const tenCmp1 = root.querySelector<HTMLSelectElement>('#tenCmp1');
  const tenCmp2 = root.querySelector<HTMLSelectElement>('#tenCmp2');
  const tenModeSel = root.querySelector<HTMLSelectElement>('#tenModeSel');
  const tenL0 = root.querySelector<HTMLInputElement>('#tenL0');
  const tenA0 = root.querySelector<HTMLInputElement>('#tenA0');
  const tenProgSlider = root.querySelector<HTMLInputElement>('#tenProgSlider');
  const tenProgLbl = root.querySelector<HTMLElement>('#tenProgLbl');
  const tenPlayBtn = root.querySelector<HTMLButtonElement>('#tenPlayBtn');
  const tenResetBtn = root.querySelector<HTMLButtonElement>('#tenResetBtn');
  const tenCsvArea = root.querySelector<HTMLTextAreaElement>('#tenCsvArea');
  const tenCsvWrap = root.querySelector<HTMLElement>('#tenCsvWrap');
  const tenCv = root.querySelector<HTMLCanvasElement>('#tenCv');
  const tenSpecCv = root.querySelector<HTMLCanvasElement>('#tenSpecCv');
  const tenRead = root.querySelector<HTMLElement>('#tenRead');
  const tenTool = root.querySelector<HTMLElement>('#tenTool');
  const tenSummary = root.querySelector<HTMLElement>('#tenSummary');

  const fillPresetSelect = (sel: HTMLSelectElement | null, includeNone = false) => {
    if (!sel) return;
    sel.innerHTML =
      (includeNone ? '<option value="">None (Single Curve)</option>' : '') +
      TENSILE_PRESETS.map((p) => `<option value="${esc(p.id)}">${esc(p.name)}</option>`).join('');
  };
  fillPresetSelect(tenMatSel, false);
  fillPresetSelect(tenCmp1, true);
  fillPresetSelect(tenCmp2, true);
  if (tenCmp1) tenCmp1.value = 'al-6061';

  let tenTimer: number | null = null;
  let tenGraph: MxGraphController | null = null;

  const parseUserExperimentalData = (raw: string): { epsPct: number; sigmaMPa: number }[] => {
    const lines = raw
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith('#'));
    const pts: { epsPct: number; sigmaMPa: number }[] = [];
    for (const line of lines) {
      const parts = line.split(/[,\s;]+/).map(Number);
      if (parts.length >= 2 && Number.isFinite(parts[0]) && Number.isFinite(parts[1])) {
        pts.push({ epsPct: parts[0], sigmaMPa: parts[1] });
      }
    }
    pts.sort((a, b) => a.epsPct - b.epsPct);
    return pts;
  };

  const analyzeCurveMetrics = (pts: { epsPct: number; sigmaMPa: number }[]) => {
    if (pts.length < 2) return null;
    // Initial elastic slope E_GPa using initial points below 45% peak stress
    const maxS = Math.max(...pts.map((p) => p.sigmaMPa));
    const maxE = pts[pts.length - 1].epsPct;
    const linPts = pts.filter((p) => p.epsPct > 0 && p.sigmaMPa <= maxS * 0.48);
    const refPt = linPts[linPts.length - 1] || pts[1];
    const epsFrac = refPt.epsPct / 100;
    const E_GPa = epsFrac > 0 ? refPt.sigmaMPa / epsFrac / 1000 : 0;

    // 0.2% offset yield criterion intersection
    let sigmaY = maxS;
    if (E_GPa > 0) {
      for (let i = 1; i < pts.length; i++) {
        const p = pts[i];
        const offsetStress = E_GPa * 1000 * Math.max(0, p.epsPct / 100 - 0.002);
        if (p.epsPct > 0.2 && p.sigmaMPa <= offsetStress) {
          sigmaY = p.sigmaMPa;
          break;
        }
      }
    }

    // Trapezoidal toughness integration MJ/m^3 = ∫ σ(MPa) d(ε_frac)
    let toughnessMJm3 = 0;
    for (let i = 1; i < pts.length; i++) {
      const de = (pts[i].epsPct - pts[i - 1].epsPct) / 100;
      toughnessMJm3 += 0.5 * (pts[i].sigmaMPa + pts[i - 1].sigmaMPa) * de;
    }
    const resilienceMJm3 = E_GPa > 0 ? (sigmaY * sigmaY) / (2 * E_GPa * 1000) : 0;
    return { E_GPa, sigmaY, UTS: maxS, epsF_pct: maxE, resilienceMJm3, toughnessMJm3 };
  };

  const drawSpecimen = (progress01: number, preset: TensilePreset, L0_mm: number, A0_mm2: number, curEpsPct: number, curSigMPa: number) => {
    if (!tenSpecCv) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = tenSpecCv.clientWidth || 560;
    const h = tenSpecCv.clientHeight || 132;
    tenSpecCv.width = w * dpr;
    tenSpecCv.height = h * dpr;
    const ctx = tenSpecCv.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const style = getComputedStyle(document.documentElement);
    const accent = style.getPropertyValue('--accent').trim() || '#D6B77A';
    const accent2 = style.getPropertyValue('--accent2').trim() || '#8BB8E8';
    const bad = style.getPropertyValue('--bad').trim() || '#ff8a8a';
    const text = style.getPropertyValue('--text').trim() || '#F1EEE7';
    const muted = style.getPropertyValue('--muted').trim() || '#9aa0ad';

    const fractured = progress01 >= 0.995;
    const neckPhase = preset.ductile ? Math.max(0, (progress01 - 0.62) / 0.38) : 0;
    const stretchPx = Math.min(85, progress01 * (preset.ductile ? 70 : 12));

    const cx = w / 2;
    const cy = h / 2 + 4;
    const baseGaugeHalf = 110;
    const gaugeHalf = baseGaugeHalf + stretchPx / 2;
    const gripW = 46;
    const halfH = 14;
    const neckDepth = preset.ductile ? neckPhase * 8 : 0;

    // Clamping grips
    ctx.fillStyle = style.getPropertyValue('--surface3').trim() || '#242833';
    ctx.strokeStyle = accent2;
    ctx.lineWidth = 1.6;
    ctx.fillRect(cx - gaugeHalf - gripW, cy - 26, gripW, 52);
    ctx.strokeRect(cx - gaugeHalf - gripW, cy - 26, gripW, 52);
    ctx.fillRect(cx + gaugeHalf, cy - 26, gripW, 52);
    ctx.strokeRect(cx + gaugeHalf, cy - 26, gripW, 52);

    // Draw Dog-bone bar (split gap if fractured)
    const gap = fractured ? 12 : 0;
    ctx.fillStyle = fractured ? bad : accent;
    ctx.globalAlpha = 0.85;

    if (!fractured) {
      ctx.beginPath();
      ctx.moveTo(cx - gaugeHalf, cy - halfH);
      ctx.quadraticCurveTo(cx, cy - halfH + neckDepth, cx + gaugeHalf, cy - halfH);
      ctx.lineTo(cx + gaugeHalf, cy + halfH);
      ctx.quadraticCurveTo(cx, cy + halfH - neckDepth, cx - gaugeHalf, cy + halfH);
      ctx.closePath();
      ctx.fill();
    } else {
      // Left fractured half
      ctx.beginPath();
      ctx.moveTo(cx - gaugeHalf, cy - halfH);
      ctx.lineTo(cx - gap / 2, cy - halfH + (preset.ductile ? 7 : 0));
      ctx.lineTo(cx - gap / 2, cy + halfH - (preset.ductile ? 7 : 0));
      ctx.lineTo(cx - gaugeHalf, cy + halfH);
      ctx.closePath();
      ctx.fill();
      // Right fractured half
      ctx.beginPath();
      ctx.moveTo(cx + gaugeHalf, cy - halfH);
      ctx.lineTo(cx + gap / 2, cy - halfH + (preset.ductile ? 7 : 0));
      ctx.lineTo(cx + gap / 2, cy + halfH - (preset.ductile ? 7 : 0));
      ctx.lineTo(cx + gaugeHalf, cy + halfH);
      ctx.closePath();
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Force arrows
    ctx.strokeStyle = text;
    ctx.fillStyle = text;
    ctx.lineWidth = 1.8;
    const fKN = (curSigMPa * A0_mm2) / 1000;
    const dLmm = (curEpsPct / 100) * L0_mm;
    ctx.font = '600 11px var(--f-mono), monospace';
    ctx.fillText(
      `Gauge L₀ = ${L0_mm} mm · ΔL = ${dLmm.toFixed(2)} mm (${curEpsPct.toFixed(2)}%) · Force = ${fKN.toFixed(2)} kN · Stress = ${curSigMPa.toFixed(1)} MPa`,
      12,
      18
    );
    ctx.fillStyle = fractured ? bad : muted;
    ctx.fillText(
      fractured
        ? `FRACTURED (${preset.ductile ? 'Ductile cup-and-cone necking' : 'Brittle flat cleavage'})`
        : neckPhase > 0
          ? 'NECKING STAGE (Localized cross-section reduction past UTS)'
          : progress01 > 0.02
            ? 'LOADING IN PROGRESS'
            : 'READY (Drag slider or click Run Tensile Pull)',
      12,
      h - 8
    );
  };

  const updateTensileLab = () => {
    const mode = (tenModeSel?.value || 'simulated') as 'simulated' | 'idealized' | 'experimental';
    if (tenCsvWrap) tenCsvWrap.hidden = mode !== 'experimental';
    const progress01 = (parseFloat(tenProgSlider?.value || '100') || 0) / 100;
    if (tenProgLbl) tenProgLbl.textContent = `${Math.round(progress01 * 100)}%`;

    const L0_mm = Math.max(1, parseFloat(tenL0?.value || '50') || 50);
    const A0_mm2 = Math.max(0.1, parseFloat(tenA0?.value || '50') || 50);
    const mainPreset = TENSILE_PRESETS.find((p) => p.id === tenMatSel?.value) || TENSILE_PRESETS[0];

    let primaryPts: { epsPct: number; sigmaMPa: number }[];
    let modeBadgeClass = 'approx';
    let modeBadgeTxt = 'Illustrative Simulated Behavior';

    if (mode === 'experimental') {
      primaryPts = parseUserExperimentalData(tenCsvArea?.value || '');
      modeBadgeClass = 'exact';
      modeBadgeTxt = 'User Experimental Data';
    } else if (mode === 'idealized') {
      primaryPts = sampleTensileCurve(mainPreset, 'idealized');
      modeBadgeClass = 'approx';
      modeBadgeTxt = 'Idealized Elastic / Elastic-Perfectly-Plastic Model';
    } else {
      primaryPts = sampleTensileCurve(mainPreset, 'simulated');
      modeBadgeClass = 'approx';
      modeBadgeTxt = 'Illustrative Simulated Constitutive Curve';
    }

    const activeLen = Math.max(2, Math.round(primaryPts.length * progress01));
    const shownPrimary = primaryPts.slice(0, activeLen);
    const tip = shownPrimary[shownPrimary.length - 1] || { epsPct: 0, sigmaMPa: 0 };

    drawSpecimen(progress01, mainPreset, L0_mm, A0_mm2, tip.epsPct, tip.sigmaMPa);

    const metrics = analyzeCurveMetrics(primaryPts);
    if (tenSummary) {
      if (!metrics) {
        tenSummary.innerHTML = `<div class="bl error">Enter at least 2 valid (strain_%, stress_MPa) rows to plot experimental data.</div>`;
      } else {
        const epsY_pct = metrics.E_GPa > 0 ? (metrics.sigmaY / (metrics.E_GPa * 1000)) * 100 : 0;
        tenSummary.innerHTML = `
          <div class="eng-pillrow">
            <span class="badge-tag ${modeBadgeClass}">${esc(modeBadgeTxt)}</span>
            <span class="badge-tag">${esc(mode === 'experimental' ? 'Custom Specimen' : mainPreset.name)}</span>
          </div>
          <div class="kv-grid">
            <div class="kv-cell"><small>Young’s Modulus E</small><b>${metrics.E_GPa.toFixed(1)} GPa</b></div>
            <div class="kv-cell"><small>Yield Stress σ_y (0.2%)</small><b>${metrics.sigmaY.toFixed(1)} MPa</b></div>
            <div class="kv-cell"><small>UTS (Peak Stress)</small><b>${metrics.UTS.toFixed(1)} MPa</b></div>
            <div class="kv-cell"><small>Fracture Strain ε_f</small><b>${metrics.epsF_pct.toFixed(2)}%</b></div>
            <div class="kv-cell"><small>Resilience U_r</small><b>${metrics.resilienceMJm3.toFixed(3)} MJ/m³</b></div>
            <div class="kv-cell"><small>Toughness U_T (Area)</small><b>${metrics.toughnessMJm3.toFixed(2)} MJ/m³</b></div>
          </div>
          <p class="note">${esc(
            mode === 'experimental'
              ? `Evaluated directly from ${primaryPts.length} experimental data points using trapezoidal integration. Yield threshold ≈ ${epsY_pct.toFixed(3)}% elastic strain.`
              : `${mainPreset.note} Source: ${mainPreset.refSource}. Simulated curves illustrate canonical shape and should not be substituted for measured ASTM E8 / ISO 6892 lab test data.`
          )}</p>
        `;
      }
    }

    // Build scene using shared MXGraph engine!
    if (tenCv && window.MXGraph) {
      const cmpA = mode !== 'experimental' ? TENSILE_PRESETS.find((p) => p.id === tenCmp1?.value) : undefined;
      const cmpB = mode !== 'experimental' ? TENSILE_PRESETS.find((p) => p.id === tenCmp2?.value) : undefined;

      const allCurves = [primaryPts];
      if (cmpA && cmpA.id !== mainPreset.id) allCurves.push(sampleTensileCurve(cmpA, mode === 'idealized' ? 'idealized' : 'simulated'));
      if (cmpB && cmpB.id !== mainPreset.id && cmpB.id !== cmpA?.id) allCurves.push(sampleTensileCurve(cmpB, mode === 'idealized' ? 'idealized' : 'simulated'));

      const maxX = Math.max(5, ...allCurves.flat().map((p) => p.epsPct)) * 1.08;
      const maxY = Math.max(50, ...allCurves.flat().map((p) => p.sigmaMPa)) * 1.12;
      const curBounds: [number, number, number, number] = [-maxX * 0.05, maxX, -maxY * 0.08, maxY];

      const buildTensileScene = () => {
        const pal = window.MXGraph!.math.getPalette();
        const modeCur = (tenModeSel?.value || 'simulated') as 'simulated' | 'idealized' | 'experimental';
        const p01 = (parseFloat(tenProgSlider?.value || '100') || 0) / 100;
        const mPreset = TENSILE_PRESETS.find((p) => p.id === tenMatSel?.value) || TENSILE_PRESETS[0];
        const ptsNow =
          modeCur === 'experimental'
            ? parseUserExperimentalData(tenCsvArea?.value || '')
            : sampleTensileCurve(mPreset, modeCur === 'idealized' ? 'idealized' : 'simulated');
        const sliceLen = Math.max(2, Math.round(ptsNow.length * p01));
        const activePts = ptsNow.slice(0, sliceLen);

        const toPolyline = (arr: { epsPct: number; sigmaMPa: number }[], color: string, width: number, label: string, dash?: number[]) => ({
          pts: arr.map((pt) => [pt.epsPct, pt.sigmaMPa]),
          stroke: color,
          width,
          close: false,
          dash,
          label,
        });

        const shapes: unknown[] = [
          toPolyline(
            activePts,
            pal.accent,
            2.6,
            modeCur === 'experimental' ? 'Experimental Data' : mPreset.name
          ),
        ];

        const c1 = modeCur !== 'experimental' ? TENSILE_PRESETS.find((p) => p.id === tenCmp1?.value) : undefined;
        const c2 = modeCur !== 'experimental' ? TENSILE_PRESETS.find((p) => p.id === tenCmp2?.value) : undefined;
        if (c1 && c1.id !== mPreset.id) {
          shapes.push(toPolyline(sampleTensileCurve(c1, modeCur === 'idealized' ? 'idealized' : 'simulated'), pal.accent2, 2, c1.name, [5, 4]));
        }
        if (c2 && c2.id !== mPreset.id && c2.id !== c1?.id) {
          shapes.push(toPolyline(sampleTensileCurve(c2, modeCur === 'idealized' ? 'idealized' : 'simulated'), pal.good, 1.8, c2.name, [2, 3]));
        }

        const curTip = activePts[activePts.length - 1] || { epsPct: 0, sigmaMPa: 0 };
        const markers: unknown[] = [
          { x: curTip.epsPct, y: curTip.sigmaMPa, r: 5, color: pal.accent, label: `(${curTip.epsPct.toFixed(1)}%, ${curTip.sigmaMPa.toFixed(0)} MPa)` },
        ];
        if (modeCur !== 'experimental' && p01 >= 0.98) {
          const idxMax = ptsNow.reduce((bi, pt, idx, a) => (pt.sigmaMPa > a[bi].sigmaMPa ? idx : bi), 0);
          markers.push({ x: ptsNow[idxMax].epsPct, y: ptsNow[idxMax].sigmaMPa, r: 4.5, color: pal.warn, label: `UTS ${ptsNow[idxMax].sigmaMPa.toFixed(0)} MPa` });
        }

        return {
          title: 'Engineering Stress σ (MPa) vs. Strain ε (%)',
          xLabel: 'Strain ε (%)',
          yLabel: 'Stress σ (MPa)',
          shapes,
          points: markers,
          readAt: (wx: number, wy: number) => `Cursor: ε = ${wx.toFixed(2)}%   σ = ${wy.toFixed(1)} MPa`,
        };
      };

      if (!tenGraph) {
        (window as unknown as { __mnxTenBounds?: [number, number, number, number] }).__mnxTenBounds = curBounds;
        tenGraph = window.MXGraph.create({
          canvas: tenCv,
          readEl: tenRead,
          toolEl: tenTool,
          aspectLock: false,
          defaultSnap: false,
          supportsCurves: false,
          exportName: 'tensile-stress-strain',
          onFit: () => {
            const b = (window as unknown as { __mnxTenBounds?: [number, number, number, number] }).__mnxTenBounds;
            if (tenGraph && b) tenGraph.setViewport(b[0], b[1], b[2], b[3], true);
          },
          buildScene: () => buildTensileScene(),
        });
      }
      (window as unknown as { __mnxTenBounds?: [number, number, number, number] }).__mnxTenBounds = curBounds;
      if (tenGraph) {
        tenGraph.setViewport(curBounds[0], curBounds[1], curBounds[2], curBounds[3], true);
        tenGraph.render();
      }
    }
  };

  [tenMatSel, tenCmp1, tenCmp2, tenModeSel, tenL0, tenA0, tenProgSlider, tenCsvArea].forEach((el) =>
    el?.addEventListener('input', updateTensileLab)
  );

  tenPlayBtn &&
    (tenPlayBtn.onclick = () => {
      if (tenTimer !== null) {
        window.clearInterval(tenTimer);
        tenTimer = null;
        tenPlayBtn.textContent = '▶ Run Tensile Pull';
        return;
      }
      if (tenProgSlider && parseFloat(tenProgSlider.value) >= 100) tenProgSlider.value = '0';
      tenPlayBtn.textContent = '⏸ Pause Pull';
      tenTimer = window.setInterval(() => {
        if (!tenProgSlider) return;
        const cur = parseFloat(tenProgSlider.value) || 0;
        if (cur >= 100) {
          window.clearInterval(tenTimer!);
          tenTimer = null;
          tenPlayBtn.textContent = '▶ Run Tensile Pull';
          return;
        }
        tenProgSlider.value = String(Math.min(100, cur + 3));
        updateTensileLab();
      }, 65);
    });

  tenResetBtn &&
    (tenResetBtn.onclick = () => {
      if (tenTimer !== null) {
        window.clearInterval(tenTimer);
        tenTimer = null;
      }
      if (tenPlayBtn) tenPlayBtn.textContent = '▶ Run Tensile Pull';
      if (tenProgSlider) tenProgSlider.value = '100';
      updateTensileLab();
    });

  /* 3. Validated Materials Calculators (8 Solvers) */
  const calcKindSel = root.querySelector<HTMLSelectElement>('#matCalcKind');
  const calcInputs = root.querySelector<HTMLElement>('#matCalcInputs');
  const calcRunBtn = root.querySelector<HTMLButtonElement>('#matCalcRun');
  const calcRes = root.querySelector<HTMLElement>('#matCalcRes');
  const calcSteps = root.querySelector<HTMLElement>('#matCalcSteps');

  const CALC_SCHEMAS: Record<
    string,
    {
      title: string;
      hint: string;
      fields: { id: string; label: string; val: string; unit?: string }[];
      solve: (v: Record<string, number>) => { main: string; kv: [string, string][]; steps: string[]; warn?: string };
    }
  > = {
    axial: {
      title: 'Axial Stress, Strain & Young’s Modulus',
      hint: 'Hookean linear elasticity requires σ below proportional limit and uniform cross-section A₀ > 0, L₀ > 0.',
      fields: [
        { id: 'F', label: 'Axial Force F', val: '24000', unit: 'N' },
        { id: 'A', label: 'Cross-Section Area A₀', val: '120', unit: 'mm²' },
        { id: 'L0', label: 'Gauge Length L₀', val: '200', unit: 'mm' },
        { id: 'dL', label: 'Elongation ΔL', val: '0.20', unit: 'mm' },
      ],
      solve: (v) => {
        if (!(v.A > 0 && v.L0 > 0 && v.dL !== 0)) throw new Error('Require A₀ > 0, L₀ > 0, and non-zero ΔL to compute E.');
        const sigma_MPa = v.F / v.A; // N / mm² = MPa
        const eps = v.dL / v.L0;
        const E_GPa = sigma_MPa / eps / 1000;
        const warn = Math.abs(eps) > 0.01 ? 'Strain > 1%: Verify material remains within linear-elastic Hookean range.' : undefined;
        return {
          main: `σ = ${fmtSI(sigma_MPa, 4)} MPa · ε = ${fmtSI(eps * 100, 4)}% · E = ${fmtSI(E_GPa, 4)} GPa`,
          kv: [
            ['Engineering Stress σ', `${fmtSI(sigma_MPa, 5)} MPa`],
            ['Engineering Strain ε', `${fmtSI(eps, 5)} (${fmtSI(eps * 100, 4)}%)`],
            ['Young’s Modulus E', `${fmtSI(E_GPa, 4)} GPa`],
            ['Elastic Energy Density ½σε', `${fmtSI(0.5 * sigma_MPa * eps, 4)} MJ/m³`],
          ],
          steps: [
            `1. Normal stress: σ = F / A₀ = ${v.F} N / ${v.A} mm² = ${sigma_MPa.toFixed(4)} N/mm² = ${sigma_MPa.toFixed(4)} MPa.`,
            `2. Normal strain: ε = ΔL / L₀ = ${v.dL} / ${v.L0} = ${eps.toFixed(6)} (${(eps * 100).toFixed(4)}%).`,
            `3. Young’s modulus: E = σ / ε = ${sigma_MPa.toFixed(4)} / ${eps.toFixed(6)} = ${(E_GPa * 1000).toFixed(1)} MPa = ${E_GPa.toFixed(3)} GPa.`,
          ],
          warn,
        };
      },
    },
    shear: {
      title: 'Shear Stress, Shear Strain & Shear Modulus G',
      hint: 'Applies to pure uniform shear loading over area A > 0 and height h > 0.',
      fields: [
        { id: 'V', label: 'Shear Force V', val: '15000', unit: 'N' },
        { id: 'A', label: 'Shear Area A', val: '250', unit: 'mm²' },
        { id: 'dx', label: 'Shear Displacement Δx', val: '0.075', unit: 'mm' },
        { id: 'h', label: 'Block Height h', val: '100', unit: 'mm' },
      ],
      solve: (v) => {
        if (!(v.A > 0 && v.h > 0 && v.dx !== 0)) throw new Error('Require A > 0, h > 0, and Δx ≠ 0.');
        const tau_MPa = v.V / v.A;
        const gamma = v.dx / v.h;
        const G_GPa = tau_MPa / gamma / 1000;
        return {
          main: `τ = ${fmtSI(tau_MPa, 4)} MPa · γ = ${fmtSI(gamma, 4)} rad · G = ${fmtSI(G_GPa, 4)} GPa`,
          kv: [
            ['Shear Stress τ', `${fmtSI(tau_MPa, 4)} MPa`],
            ['Shear Strain γ', `${fmtSI(gamma, 5)} rad`],
            ['Shear Modulus G', `${fmtSI(G_GPa, 4)} GPa`],
          ],
          steps: [
            `1. τ = V / A = ${v.V} / ${v.A} = ${tau_MPa.toFixed(3)} MPa.`,
            `2. γ = tan θ ≈ Δx / h = ${v.dx} / ${v.h} = ${gamma.toFixed(6)} rad.`,
            `3. G = τ / γ = ${G_GPa.toFixed(3)} GPa.`,
          ],
        };
      },
    },
    ductility: {
      title: 'Ductility: % Elongation & % Reduction in Area',
      hint: 'Measures plastic deformation capacity prior to fracture (L_f ≥ L₀ > 0, 0 < A_f ≤ A₀).',
      fields: [
        { id: 'L0', label: 'Initial Gauge L₀', val: '50', unit: 'mm' },
        { id: 'Lf', label: 'Final Length L_f', val: '62.5', unit: 'mm' },
        { id: 'A0', label: 'Initial Area A₀', val: '100', unit: 'mm²' },
        { id: 'Af', label: 'Fracture Area A_f', val: '58', unit: 'mm²' },
      ],
      solve: (v) => {
        if (!(v.L0 > 0 && v.Lf >= v.L0 && v.A0 > 0 && v.Af > 0 && v.Af <= v.A0)) {
          throw new Error('Require L_f ≥ L₀ > 0 and 0 < A_f ≤ A₀.');
        }
        const pctEL = ((v.Lf - v.L0) / v.L0) * 100;
        const pctRA = ((v.A0 - v.Af) / v.A0) * 100;
        const cls = pctEL < 5 ? 'Brittle (< 5% EL)' : 'Ductile (≥ 5% EL)';
        return {
          main: `%EL = ${pctEL.toFixed(2)}% · %RA = ${pctRA.toFixed(2)}% (${cls})`,
          kv: [
            ['Percent Elongation (%EL)', `${pctEL.toFixed(2)}%`],
            ['Reduction in Area (%RA)', `${pctRA.toFixed(2)}%`],
            ['True Fracture Strain ln(A₀/A_f)', `${Math.log(v.A0 / v.Af).toFixed(4)}`],
            ['Behavior Classification', cls],
          ],
          steps: [
            `1. %EL = ((L_f − L₀) / L₀) × 100 = ((${v.Lf} − ${v.L0}) / ${v.L0}) × 100 = ${pctEL.toFixed(3)}%.`,
            `2. %RA = ((A₀ − A_f) / A₀) × 100 = ((${v.A0} − ${v.Af}) / ${v.A0}) × 100 = ${pctRA.toFixed(3)}%.`,
            `3. True fracture strain ε_f = ln(A₀ / A_f) = ${Math.log(v.A0 / v.Af).toFixed(4)}.`,
          ],
        };
      },
    },
    fos: {
      title: 'Factor of Safety & Allowable Design Load',
      hint: 'Use Yield Strength σ_y for ductile materials or Ultimate Tensile Strength σ_UTS for brittle materials.',
      fields: [
        { id: 'sFail', label: 'Failure Strength (σ_y or UTS)', val: '250', unit: 'MPa' },
        { id: 'N', label: 'Design Factor of Safety N', val: '2.5', unit: '—' },
        { id: 'A', label: 'Cross-Section Area A', val: '150', unit: 'mm²' },
      ],
      solve: (v) => {
        if (!(v.sFail > 0 && v.N >= 1 && v.A > 0)) throw new Error('Require Strength > 0, Factor of Safety N ≥ 1, and Area > 0.');
        const sAllow = v.sFail / v.N;
        const fMax_kN = (sAllow * v.A) / 1000;
        return {
          main: `σ_allow = ${fmtSI(sAllow, 4)} MPa · Max Safe Load = ${fmtSI(fMax_kN, 4)} kN`,
          kv: [
            ['Allowable Stress σ_allow', `${sAllow.toFixed(2)} MPa`],
            ['Max Safe Axial Load', `${fMax_kN.toFixed(3)} kN`],
            ['Factor of Safety N', `${v.N}`],
          ],
          steps: [
            `1. σ_allow = σ_fail / N = ${v.sFail} / ${v.N} = ${sAllow.toFixed(3)} MPa.`,
            `2. F_max = σ_allow × A = ${sAllow.toFixed(3)} MPa × ${v.A} mm² = ${(sAllow * v.A).toFixed(1)} N = ${fMax_kN.toFixed(3)} kN.`,
          ],
        };
      },
    },
    thermalExp: {
      title: 'Thermal Expansion & Constrained Thermal Stress',
      hint: 'α entered in ×10⁻⁶ K⁻¹ (e.g., Steel ≈ 12, Al ≈ 23, Glass ≈ 9).',
      fields: [
        { id: 'L0', label: 'Initial Length L₀', val: '2.0', unit: 'm' },
        { id: 'alpha', label: 'Coeff. Expansion α (×10⁻⁶)', val: '23', unit: '×10⁻⁶ K⁻¹' },
        { id: 'dT', label: 'Temp Change ΔT', val: '50', unit: 'K' },
        { id: 'E', label: 'Young’s Modulus E (if clamped)', val: '69', unit: 'GPa' },
      ],
      solve: (v) => {
        if (!(v.L0 > 0 && v.E >= 0)) throw new Error('Require L₀ > 0 and E ≥ 0.');
        const alphaSI = v.alpha * 1e-6;
        const dL_mm = v.L0 * 1000 * alphaSI * v.dT;
        const sig_MPa = -v.E * 1000 * alphaSI * v.dT;
        return {
          main: `Free ΔL = ${dL_mm.toFixed(3)} mm · Rigidly Clamped Stress = ${sig_MPa.toFixed(2)} MPa`,
          kv: [
            ['Free Expansion ΔL', `${dL_mm.toFixed(4)} mm`],
            ['Thermal Strain αΔT', `${(alphaSI * v.dT * 1e6).toFixed(1)} με`],
            ['Constrained Stress σ_th', `${sig_MPa.toFixed(2)} MPa (${sig_MPa < 0 ? 'Compressive' : 'Tensile'})`],
          ],
          steps: [
            `1. Free expansion: ΔL = α L₀ ΔT = (${v.alpha}×10⁻⁶) × (${v.L0 * 1000} mm) × ${v.dT} K = ${dL_mm.toFixed(4)} mm.`,
            `2. Fully constrained thermal stress: σ_th = −E α ΔT = −${v.E * 1000} × ${alphaSI.toExponential(2)} × ${v.dT} = ${sig_MPa.toFixed(2)} MPa.`,
          ],
        };
      },
    },
    hardness: {
      title: 'Indentation Hardness: Brinell (HBW) & Vickers (HV)',
      hint: 'Requires 0 < indentation d < ball diameter D for Brinell HBW.',
      fields: [
        { id: 'F', label: 'Applied Test Force F', val: '3000', unit: 'kgf' },
        { id: 'D', label: 'Brinell Ball Diameter D', val: '10', unit: 'mm' },
        { id: 'dB', label: 'Brinell Indentation d', val: '4.0', unit: 'mm' },
        { id: 'Fv', label: 'Vickers Load F_v', val: '30', unit: 'kgf' },
        { id: 'dv', label: 'Vickers Mean Diagonal d_v', val: '0.45', unit: 'mm' },
      ],
      solve: (v) => {
        if (!(v.F > 0 && v.D > 0 && v.dB > 0 && v.dB < v.D && v.Fv > 0 && v.dv > 0)) {
          throw new Error('Require F > 0, 0 < d < D (for Brinell), F_v > 0, and d_v > 0.');
        }
        const hbw = (2 * v.F) / (Math.PI * v.D * (v.D - Math.sqrt(v.D * v.D - v.dB * v.dB)));
        const hv = (1.8544 * v.Fv) / (v.dv * v.dv);
        const estUTS_steel = 3.45 * hbw;
        return {
          main: `HBW = ${hbw.toFixed(1)} · HV = ${hv.toFixed(1)}`,
          kv: [
            ['Brinell Hardness (HBW)', `${hbw.toFixed(1)} HBW`],
            ['Vickers Hardness (HV)', `${hv.toFixed(1)} HV`],
            ['Empirical Steel UTS ≈ 3.45·HBW', `~${estUTS_steel.toFixed(0)} MPa (steel correlation only)`],
          ],
          steps: [
            `1. HBW = 2F / [π D (D − √(D² − d²))] = ${2 * v.F} / [π·${v.D}·(${v.D} − √(${v.D * v.D - v.dB * v.dB}))] = ${hbw.toFixed(2)}.`,
            `2. HV = 1.8544 F_v / d_v² = 1.8544 × ${v.Fv} / ${v.dv}² = ${hv.toFixed(2)}.`,
          ],
        };
      },
    },
    thermalCond: {
      title: 'Thermal Conduction, Specific Heat & Thermal Diffusivity',
      hint: 'Steady 1D Fourier conduction across slab thickness L > 0.',
      fields: [
        { id: 'k', label: 'Conductivity k', val: '50', unit: 'W/(m·K)' },
        { id: 'A', label: 'Area A', val: '0.04', unit: 'm²' },
        { id: 'dT', label: 'Temp Difference ΔT', val: '80', unit: 'K' },
        { id: 'L', label: 'Thickness L', val: '0.02', unit: 'm' },
        { id: 'rho', label: 'Density ρ', val: '7850', unit: 'kg/m³' },
        { id: 'cp', label: 'Specific Heat c_p', val: '470', unit: 'J/(kg·K)' },
      ],
      solve: (v) => {
        if (!(v.k > 0 && v.A > 0 && v.L > 0 && v.rho > 0 && v.cp > 0)) throw new Error('All geometric and material constants must be positive.');
        const q = (v.k * v.A * v.dT) / v.L;
        const flux = q / v.A;
        const diff = v.k / (v.rho * v.cp);
        return {
          main: `Heat Rate q = ${fmtSI(q, 4)} W · Diffusivity α = ${diff.toExponential(3)} m²/s`,
          kv: [
            ['Heat Transfer Rate q', `${fmtSI(q, 4)} W`],
            ['Heat Flux q″', `${fmtSI(flux, 4)} W/m²`],
            ['Thermal Diffusivity α = k/(ρc_p)', `${diff.toExponential(3)} m²/s`],
          ],
          steps: [
            `1. Fourier law: q = k A ΔT / L = ${v.k} × ${v.A} × ${v.dT} / ${v.L} = ${q.toFixed(2)} W.`,
            `2. Thermal diffusivity: α = k / (ρ c_p) = ${v.k} / (${v.rho} × ${v.cp}) = ${diff.toExponential(4)} m²/s.`,
          ],
        };
      },
    },
    electricalDensity: {
      title: 'Electrical Resistivity, Conductivity & Porosity',
      hint: 'ρ_e in ×10⁻⁸ Ω·m (Cu ≈ 1.68, Al ≈ 2.65, Steel ≈ 15).',
      fields: [
        { id: 'rhoE', label: 'Resistivity ρ_e (×10⁻⁸)', val: '1.68', unit: '×10⁻⁸ Ω·m' },
        { id: 'L', label: 'Conductor Length L', val: '100', unit: 'm' },
        { id: 'A', label: 'Wire Area A', val: '2.5', unit: 'mm²' },
        { id: 'rhoBulk', label: 'Bulk Density ρ_bulk', val: '2.45', unit: 'g/cm³' },
        { id: 'rhoTrue', label: 'Theoretical Density ρ_true', val: '2.70', unit: 'g/cm³' },
      ],
      solve: (v) => {
        if (!(v.rhoE > 0 && v.L > 0 && v.A > 0 && v.rhoBulk > 0 && v.rhoTrue >= v.rhoBulk)) {
          throw new Error('Require positive geometry/resistivity and 0 < ρ_bulk ≤ ρ_true.');
        }
        const rhoSI = v.rhoE * 1e-8;
        const R = (rhoSI * v.L) / (v.A * 1e-6);
        const sigma = 1 / rhoSI;
        const porosity = (1 - v.rhoBulk / v.rhoTrue) * 100;
        return {
          main: `R = ${fmtSI(R, 4)} Ω · σ_e = ${sigma.toExponential(3)} S/m · Porosity = ${porosity.toFixed(2)}%`,
          kv: [
            ['Wire Resistance R', `${R.toFixed(4)} Ω`],
            ['Electrical Conductivity σ_e', `${sigma.toExponential(3)} S/m`],
            ['Porosity Percentage', `${porosity.toFixed(2)}%`],
            ['Relative Density', `${((v.rhoBulk / v.rhoTrue) * 100).toFixed(2)}%`],
          ],
          steps: [
            `1. Area A = ${v.A} mm² = ${(v.A * 1e-6).toExponential(3)} m².`,
            `2. Resistance R = ρ_e L / A = ${rhoSI.toExponential(3)} × ${v.L} / ${(v.A * 1e-6).toExponential(3)} = ${R.toFixed(4)} Ω.`,
            `3. Porosity P = (1 − ρ_bulk / ρ_true) × 100 = (1 − ${v.rhoBulk}/${v.rhoTrue}) × 100 = ${porosity.toFixed(2)}%.`,
          ],
        };
      },
    },
  };

  const renderCalcForm = () => {
    const k = calcKindSel?.value || 'axial';
    const sc = CALC_SCHEMAS[k] || CALC_SCHEMAS.axial;
    if (calcInputs) {
      calcInputs.innerHTML = sc.fields
        .map(
          (f) => `
          <label class="field">${esc(f.label)} ${f.unit ? `(${esc(f.unit)})` : ''}
            <input type="number" step="any" id="mc_${esc(f.id)}" value="${esc(f.val)}">
          </label>
        `
        )
        .join('');
    }
    const hintEl = root.querySelector('#matCalcHint');
    if (hintEl) hintEl.textContent = sc.hint;
  };

  const runMaterialCalc = () => {
    const k = calcKindSel?.value || 'axial';
    const sc = CALC_SCHEMAS[k] || CALC_SCHEMAS.axial;
    const vals: Record<string, number> = {};
    sc.fields.forEach((f) => {
      vals[f.id] = parseFloat(root.querySelector<HTMLInputElement>(`#mc_${f.id}`)?.value || 'NaN');
    });
    if (!calcRes || !calcSteps) return;
    calcSteps.replaceChildren();
    try {
      for (const f of sc.fields) {
        if (!Number.isFinite(vals[f.id])) throw new Error(`Please provide a valid number for "${f.label}".`);
      }
      const out = sc.solve(vals);
      calcRes.className = 'resultbox s-ok';
      calcRes.innerHTML = `
        <div class="answerline">✓ ${esc(out.main)}</div>
        ${out.warn ? `<div class="bl warn">${esc(out.warn)}</div>` : ''}
        <div class="kv-grid">${out.kv.map(([l, val]) => `<div class="kv-cell"><small>${esc(l)}</small><b>${esc(val)}</b></div>`).join('')}</div>
      `;
      calcSteps.innerHTML = `<h3>Step-by-step derivation</h3>${out.steps.map((s) => `<div class="step">${esc(s)}</div>`).join('')}`;
      window.__mnx?.pushHist({
        mod: 'materials',
        title: sc.title,
        txt: `${out.main}\n\n${out.steps.join('\n')}`,
      });
      window.__mnx?.stat(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      calcRes.className = 'resultbox s-err';
      calcRes.replaceChildren();
      if (window.__mnx) {
        calcRes.appendChild(window.__mnx.renderCallout('error', 'Input Validation Error', msg));
      } else {
        calcRes.textContent = msg;
      }
      window.__mnx?.stat(false);
    }
  };

  calcKindSel?.addEventListener('change', () => {
    renderCalcForm();
    runMaterialCalc();
  });
  calcRunBtn && (calcRunBtn.onclick = runMaterialCalc);
  renderCalcForm();
  runMaterialCalc();

  /* 4. Material Comparison Tool (Literature Ranges) */
  const matFamSel = root.querySelector<HTMLSelectElement>('#matDbFam');
  const matDbTable = root.querySelector<HTMLElement>('#matDbTable');
  const renderMatTable = () => {
    if (!matDbTable) return;
    const fam = matFamSel?.value || 'All';
    const rows = MATERIAL_DB.filter((r) => fam === 'All' || r.family === fam);
    matDbTable.innerHTML = `
      <div class="mx-val-scroll" style="max-height:60vh"><table class="mx-val-table">
        <thead><tr>
          <th>Material / Grade</th><th>Class</th><th>Modulus E (GPa)</th><th>Yield σ_y (MPa)</th>
          <th>UTS (MPa)</th><th>Elongation (%)</th><th>Density (g/cm³)</th><th>k (W/m·K)</th><th>Thermal</th><th>Reference</th>
        </tr></thead>
        <tbody>${rows
          .map(
            (r) => `<tr>
              <td><b>${esc(r.name)}</b></td><td>${esc(r.family)}</td><td>${esc(r.E_GPa)}</td>
              <td>${esc(r.sigmaY_MPa)}</td><td>${esc(r.UTS_MPa)}</td><td>${esc(r.el_pct)}</td>
              <td>${esc(r.rho_gcc)}</td><td>${esc(r.k_WmK)}</td><td>${esc(r.tempNote)}</td><td>${esc(r.source)}</td>
            </tr>`
          )
          .join('')}</tbody>
      </table></div>
    `;
  };
  matFamSel?.addEventListener('change', renderMatTable);
  renderMatTable();

  /* 5. Quiz & Progress */
  const quizBox = root.querySelector<HTMLElement>('#matQuizBox');
  if (quizBox) renderQuizSuite(quizBox, 'materials', 'mat-main', MAT_QUIZ, updateProgressSummary);

  root.querySelector<HTMLButtonElement>('#matResetProgress')?.addEventListener('click', () => {
    saveEduProgress('materials', { reviewedTopics: [], quizBest: {}, completedExercises: [] });
    if (theoryCatalog) renderTheoryCatalog(theoryCatalog, 'materials', MATERIALS_TOPICS, updateProgressSummary);
    if (quizBox) renderQuizSuite(quizBox, 'materials', 'mat-main', MAT_QUIZ, updateProgressSummary);
    updateProgressSummary();
    window.__mnx?.toast('MT1023 module progress reset');
  });

  wireSubnav(
    nav,
    panels,
    [
      { id: 'tensile', label: '01 · Tensile Testing Lab' },
      { id: 'calc', label: '02 · Mechanical & Thermal Solvers' },
      { id: 'crystal', label: '03 · Crystal & Bonding Theory' },
      { id: 'compare', label: '04 · Material Comparison Table' },
      { id: 'quiz', label: '05 · Practice & Assessment' },
      { id: 'refs', label: '06 · Progress & References' },
    ],
    'tensile',
    (tabId) => {
      if (tabId === 'tensile') requestAnimationFrame(updateTensileLab);
      if (tabId === 'crystal') requestAnimationFrame(drawCrystal);
    }
  );

  window.addEventListener('mathnex:theme', () => {
    drawCrystal();
    updateTensileLab();
  });

  requestAnimationFrame(() => {
    updateTensileLab();
    drawCrystal();
    updateProgressSummary();
  });
}
