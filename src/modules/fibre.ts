import {
  esc,
  fmtSI,
  loadEduProgress,
  renderQuizSuite,
  renderSyllabusBanner,
  renderTheoryCatalog,
  saveEduProgress,
  wireSubnav,
  type QuizQuestion,
  type TheoryTopic,
} from './shared';

const FIBRE_TOPICS: TheoryTopic[] = [
  {
    id: 'fib-a',
    code: 'TOPIC A',
    title: 'Introduction to Textile Fibres & Classification',
    scope: 'Core',
    outcome: 'Define mandatory textile fibre criteria and classify fibres into natural, regenerated, and synthetic families.',
    summary:
      'A textile fibre is a unit of matter characterized by high length-to-diameter aspect ratio (typically > 100:1), adequate tensile strength, flexibility, and inter-fibre cohesion.',
    points: [
      'Staple vs. Filament: Short discrete fibres (cotton ~22–38 mm, wool ~40–150 mm) vs. continuous strands (silk ~400–1200 m, extruded man-made filaments).',
      'Natural Cellulosic: Seed (Cotton), Bast (Flax, Jute, Hemp, Ramie), Leaf (Sisal).',
      'Natural Protein: Wool & speciality hair (keratin, sulfur-containing), Silk (fibroin).',
      'Man-Made Regenerated (Natural Polymer): Dissolving wood/cotton cellulose reformed into Viscose Rayon, Modal, Lyocell, Cellulose Acetate.',
      'Man-Made Synthetic: Petrochemical condensation/addition polymers — Polyester (PET), Polyamide (Nylon 6 / 6,6), Acrylic (PAN), Polypropylene (PP), Elastane.',
    ],
  },
  {
    id: 'fib-b',
    code: 'TOPIC B',
    title: 'Natural Fibres: Cotton, Wool, Silk & Bast Fibres',
    scope: 'Core',
    outcome: 'Relate biological macro/micro-structure of natural fibres to moisture regain, wet strength, handle, and chemical reactivity.',
    summary:
      'Biological growth creates distinctive lumens, scales, and helical microfibrils that govern both comfort and identification.',
    points: [
      'Cotton (90–95% α-cellulose): Natural ribbon-like convolutions, central lumen, kidney-bean cross-section; high wet tenacity (>100% dry strength) due to crystalline order & hydrogen bonding; alkali-resistant (mercerization in NaOH), degraded by strong mineral acids.',
      'Wool (Keratin): Crimp + overlapping epicuticle scales produce felting shrinkage when agitated wet; disulfide (S–S) covalent crosslinks give remarkable elastic recovery (~99% at 2% strain) & high moisture regain (14–18%), but degraded by hot alkalis & chlorine bleach.',
      'Silk (Fibroin + Sericin): Smooth triangular cross-section gives soft lustre & drape; β-pleated sheet crystalline chains give high strength among natural fibres (~30–40 cN/tex).',
      'Flax / Jute (Bast): Thick-walled polygonal cell bundles with transverse nodes ("bamboo-like" cross markings); very high modulus and low elongation (~2–3%), cool crisp handle, low elasticity.',
    ],
  },
  {
    id: 'fib-c',
    code: 'TOPIC C',
    title: 'Man-Made Fibres: Regenerated & Synthetic Spinning Systems',
    scope: 'Core',
    outcome: 'Contrast wet, dry, melt, and dry-jet wet spinning routes and connect chemistry to cross-section and fibre properties.',
    summary:
      'Spinneret geometry, coagulation chemistry, and post-spinning drawing (orienting chains) tailor man-made fibre performance.',
    points: [
      'Melt Spinning (Polyester PET, Nylon 6/6,6, Polypropylene): Polymer melted above T_m, extruded through spinneret, cooled in air, and cold/hot drawn to develop crystallinity & orientation. Circular or trilobal cross-sections.',
      'Wet Spinning (Viscose Rayon, many Acrylics): Polymer dissolved into solvent/xanthate dope, extruded into liquid coagulation bath; skin-core diffusion forms characteristic serrated cross-section in regular viscose.',
      'Dry Spinning (Cellulose Acetate, some Acrylic/Elastane): Polymer solution extruded into hot gas chamber where volatile solvent evaporates (often dog-bone cross-section).',
      'Dry-Jet Wet Spinning (Lyocell / Tencel): Cellulose dissolved directly in NMMO solvent passes a brief air gap before water coagulation (~99% closed-loop solvent recovery), producing smooth circular fibres with higher crystallinity & wet strength than viscose.',
    ],
  },
  {
    id: 'fib-d',
    code: 'TOPIC D',
    title: 'Polymer Architecture, Two-Phase Morphology & Moisture/Mechanical Link',
    scope: 'Core',
    outcome: 'Explain how degree of polymerization (DP), crystallinity, and orientation control tenacity, elongation, dyeability, and regain.',
    summary:
      'Fibre-forming polymers consist of crystalline ordered domains (providing strength & thermal stability) embedded in disordered amorphous regions (allowing extensibility, moisture entry, and dye diffusion).',
    points: [
      'Crystallinity ↑ → Higher tenacity, higher initial modulus, lower dye uptake, lower moisture regain (water enters amorphous zones).',
      'Molecular Orientation ↑ (via post-spin drawing) → Aligns chains along fibre axis: sharply raises tenacity and stiffness, lowers breaking elongation.',
      'Polar hydroxyl (-OH in cellulose) or amide (-NHCO- in wool/silk/nylon) groups attract water → hydrophilic regain; hydrophobic aromatic/aliphatic PET & PP lack strong water-binding sites (~0–0.4% regain).',
    ],
  },
  {
    id: 'fib-e',
    code: 'TOPIC E',
    title: 'Physical, Thermal & Chemical Resistance Essentials',
    scope: 'Core',
    outcome: 'Apply Glass Transition (T_g), Melting (T_m), heat-setting, and acid/alkali susceptibility to textile processing.',
    summary:
      'Thermal and chemical boundaries prevent scorching, yellowing, hydrolysis, or shrinkage during dyeing, laundering, and heat-setting.',
    points: [
      'Thermoplastic synthetics (PET T_g ≈ 70–80 °C, T_m ≈ 250–260 °C; Nylon 6,6 T_m ≈ 255–265 °C) can be dimensionally stabilized by heat-setting above T_g.',
      'Natural cellulosics and protein fibres do NOT melt cleanly; they char/decompose before melting (safe ironing temperatures differ sharply).',
      'Chemical selectivity: Cellulose survives dilute alkali (scouring/mercerizing) but hydrolyzes in strong acid; Protein fibres (wool/silk) dissolve in hot 5% NaOH while resisting mild acids.',
    ],
  },
  {
    id: 'fib-j',
    code: 'TOPIC J · SUPPLEMENTARY',
    title: 'Advanced Fibre Science (High-Performance, Micro/Nano & Sustainable Fibres)',
    scope: 'Supplementary',
    outcome: 'Identify specialized technical, nanofibrous, smart, and closed-loop sustainable fibre innovations beyond core 1st-year fundamentals.',
    summary:
      'Supplementary extension module: high-modulus technical reinforcements, electrospun membranes, and circular textile polymers.',
    points: [
      'Para-Aramids (Kevlar / Twaron): Liquid-crystalline rigid-rod chains yield extreme specific strength (>200 cN/tex) and heat resistance (ballistic/aerospace). Meta-Aramids (Nomex): Flame-resistant PPE.',
      'UHMWPE (Dyneema / Spectra): Gel-spun ultra-high molar mass PE; floats on water (ρ ≈ 0.97 g/cm³), exceptional cut/impact resistance, low T_m (~145 °C).',
      'Carbon Fibres (PAN or pitch precursor): Stabilized + carbonized >1000 °C → ultra-high modulus (230–600 GPa) for aerospace composites.',
      'Microfibres (< 1.0 dtex) & Electrospun Nanofibres (~50–500 nm diameter): Electrostatic jet stretching yields huge surface-area membranes for medical scaffolds and air/liquid filtration.',
      'Sustainable Circular Fibres: Mechanically/chemically recycled PET (rPET), bio-derived PLA (corn starch fermentation), and closed-loop NMMO Lyocell.',
    ],
  },
];

interface FibreProfile {
  id: string;
  name: string;
  category: 'Natural Cellulosic' | 'Natural Protein' | 'Regenerated Cellulosic' | 'Synthetic';
  densityRange: string;
  floatWater: 'Floats' | 'Sinks';
  regainRange: string;
  tenacityDry: string;
  wetDryNote: string;
  elongationRange: string;
  thermalNote: string;
  acidAlkali: string;
  crossShape: 'Kidney-bean (lumen)' | 'Circular / Oval (scales)' | 'Rounded Triangle' | 'Polygonal Bundle' | 'Serrated Lobed' | 'Circular Smooth' | 'Dog-bone / Bean';
  longDesc: string;
  burnBehavior: string;
  burnTag: 'cellulose' | 'protein' | 'melt-poly' | 'melt-nylon' | 'acrylic' | 'pp';
  solubilityKey: string;
  refSource: string;
}

const FIBRE_DB: FibreProfile[] = [
  {
    id: 'cotton',
    name: 'Cotton',
    category: 'Natural Cellulosic',
    densityRange: '1.52 – 1.56 g/cm³',
    floatWater: 'Sinks',
    regainRange: '7.0 – 8.5%',
    tenacityDry: '25 – 40 cN/tex',
    wetDryNote: 'Wet stronger (~105–115% dry)',
    elongationRange: '6 – 9%',
    thermalNote: 'Chars/decomposes > 240 °C (no melt)',
    acidAlkali: 'Resists dilute alkali; damaged by strong acids',
    crossShape: 'Kidney-bean (lumen)',
    longDesc: 'Flat twisted ribbon with natural convolutions and central lumen channel.',
    burnBehavior: 'Burns rapidly with yellow flame, no melting; burning paper odor; soft light grey feathery ash.',
    burnTag: 'cellulose',
    solubilityKey: 'Dissolves in 70% H₂SO₄ (room temp) and Cuprammonium hydroxide; insoluble in acetone/NaOCl.',
    refSource: 'Morton & Hearle; Kadolph (Textiles)',
  },
  {
    id: 'flax',
    name: 'Flax (Linen)',
    category: 'Natural Cellulosic',
    densityRange: '1.50 – 1.54 g/cm³',
    floatWater: 'Sinks',
    regainRange: '10.0 – 12.0%',
    tenacityDry: '45 – 60 cN/tex',
    wetDryNote: 'Wet stronger (~110–120% dry)',
    elongationRange: '2.0 – 3.5%',
    thermalNote: 'Decomposes ~240–260 °C (no melt)',
    acidAlkali: 'Good alkali resistance; attacked by strong acid',
    crossShape: 'Polygonal Bundle',
    longDesc: 'Thick-walled cylindrical/polygonal cells with narrow lumen and transverse cross-nodes ("bamboo" joints).',
    burnBehavior: 'Burns quickly like cotton without melting; paper smell; light grey fragile ash.',
    burnTag: 'cellulose',
    solubilityKey: 'Dissolves in 70% H₂SO₄; resists NaOH scouring.',
    refSource: 'Morton & Hearle',
  },
  {
    id: 'wool',
    name: 'Wool',
    category: 'Natural Protein',
    densityRange: '1.30 – 1.32 g/cm³',
    floatWater: 'Sinks',
    regainRange: '14.0 – 18.0%',
    tenacityDry: '10 – 17 cN/tex',
    wetDryNote: 'Wet weaker (~75–85% dry)',
    elongationRange: '25 – 40%',
    thermalNote: 'Scorches ~200 °C, chars (no melt)',
    acidAlkali: 'Resists mild acids; dissolves in hot 5% NaOH & NaOCl',
    crossShape: 'Circular / Oval (scales)',
    longDesc: 'Cylindrical fibre covered in overlapping cuticle scales; natural 3D crimp.',
    burnBehavior: 'Burns slowly, sputters, self-extinguishes when flame removed; burning hair/feather odor; crushable black porous bead.',
    burnTag: 'protein',
    solubilityKey: 'Dissolves rapidly in boiling 5% NaOH and sodium hypochlorite (NaOCl) bleach.',
    refSource: 'Morton & Hearle; ASTM D276',
  },
  {
    id: 'silk',
    name: 'Silk (Degummed)',
    category: 'Natural Protein',
    densityRange: '1.33 – 1.36 g/cm³',
    floatWater: 'Sinks',
    regainRange: '10.0 – 11.0%',
    tenacityDry: '30 – 45 cN/tex',
    wetDryNote: 'Wet ~80–85% dry',
    elongationRange: '18 – 25%',
    thermalNote: 'Yellows/decomposes > 170–200 °C',
    acidAlkali: 'Attacked by strong alkali & concentrated acid',
    crossShape: 'Rounded Triangle',
    longDesc: 'Smooth uniform filament (triangular cross-section gives high lustre); twin brins in raw silk.',
    burnBehavior: 'Burns slowly, shrinks, self-extinguishes; burning hair/protein odor; dark crushable crisp ash bead.',
    burnTag: 'protein',
    solubilityKey: 'Dissolves in concentrated HCl, 70% H₂SO₄, and warm 5% NaOH (slower than wool).',
    refSource: 'Morton & Hearle',
  },
  {
    id: 'viscose',
    name: 'Viscose Rayon',
    category: 'Regenerated Cellulosic',
    densityRange: '1.50 – 1.53 g/cm³',
    floatWater: 'Sinks',
    regainRange: '11.0 – 13.0%',
    tenacityDry: '18 – 26 cN/tex',
    wetDryNote: 'Significant wet strength loss (~50–60% dry)',
    elongationRange: '15 – 25%',
    thermalNote: 'Decomposes ~190–210 °C (no melt)',
    acidAlkali: 'Degraded by strong acids; swells in strong alkali',
    crossShape: 'Serrated Lobed',
    longDesc: 'Longitudinal fine axial striations (grooves) resulting from serrated skin-core coagulation.',
    burnBehavior: 'Burns rapidly with yellow flame, no melting; burning paper odor; minimal grey ash.',
    burnTag: 'cellulose',
    solubilityKey: 'Dissolves in 70% H₂SO₄ and 60% H₂SO₄ (unlike cotton at 60%).',
    refSource: 'Morton & Hearle; Kadolph',
  },
  {
    id: 'lyocell',
    name: 'Lyocell (NMMO)',
    category: 'Regenerated Cellulosic',
    densityRange: '1.50 – 1.52 g/cm³',
    floatWater: 'Sinks',
    regainRange: '11.0 – 12.0%',
    tenacityDry: '34 – 42 cN/tex',
    wetDryNote: 'Retains ~80–85% strength when wet',
    elongationRange: '11 – 16%',
    thermalNote: 'Chars > 220 °C (no melt)',
    acidAlkali: 'Similar to cotton; wet fibrillation tendency in alkali',
    crossShape: 'Circular Smooth',
    longDesc: 'Smooth uniform cylinder without serrations; clean circular cross-section.',
    burnBehavior: 'Burns rapidly without melting; paper smell; fine grey ash.',
    burnTag: 'cellulose',
    solubilityKey: 'Dissolves in 70% H₂SO₄; insoluble in acetone & NaOCl.',
    refSource: 'Textile Institute Terms & Definitions',
  },
  {
    id: 'pet',
    name: 'Polyester (PET)',
    category: 'Synthetic',
    densityRange: '1.38 – 1.40 g/cm³',
    floatWater: 'Sinks',
    regainRange: '0.2 – 0.5%',
    tenacityDry: '35 – 60 cN/tex',
    wetDryNote: 'Wet ~100% dry (hydrophobic)',
    elongationRange: '15 – 35%',
    thermalNote: 'T_g ~75 °C · T_m ~250–260 °C',
    acidAlkali: 'Resists acids; slowly hydrolyzed by hot conc. NaOH',
    crossShape: 'Circular Smooth',
    longDesc: 'Uniform rod-like filament (or trilobal/hollow); visible TiO₂ delustrant specks in dull grades.',
    burnBehavior: 'Melts, shrinks from flame, burns with black sooty smoke; sweet chemical odor; forms hard dark non-crushable bead.',
    burnTag: 'melt-poly',
    solubilityKey: 'Insoluble in acetone, formic acid, cold H₂SO₄; dissolves in hot m-cresol / hexafluoroisopropanol.',
    refSource: 'Morton & Hearle; ASTM D276',
  },
  {
    id: 'nylon66',
    name: 'Nylon 6,6 (Polyamide)',
    category: 'Synthetic',
    densityRange: '1.13 – 1.15 g/cm³',
    floatWater: 'Sinks',
    regainRange: '3.5 – 4.5%',
    tenacityDry: '40 – 65 cN/tex',
    wetDryNote: 'Wet ~85–90% dry',
    elongationRange: '18 – 38%',
    thermalNote: 'T_g ~50 °C · T_m ~255–265 °C',
    acidAlkali: 'Excellent alkali resistance; attacked by strong acids',
    crossShape: 'Circular Smooth',
    longDesc: 'Very uniform cylindrical rod (or trilobal carpet filament).',
    burnBehavior: 'Melts and drips before igniting, self-extinguishes slowly; celery-like amide odor; hard round light-brown/grey bead.',
    burnTag: 'melt-nylon',
    solubilityKey: 'Dissolves cleanly in 85–90% formic acid and 20% HCl at room temperature (distinguishes from PET).',
    refSource: 'Morton & Hearle; AATCC Test Method 20',
  },
  {
    id: 'acrylic',
    name: 'Acrylic (PAN)',
    category: 'Synthetic',
    densityRange: '1.16 – 1.19 g/cm³',
    floatWater: 'Sinks',
    regainRange: '1.0 – 2.0%',
    tenacityDry: '20 – 32 cN/tex',
    wetDryNote: 'Wet ~85–95% dry',
    elongationRange: '25 – 45%',
    thermalNote: 'Softens ~215–240 °C (sticks before melt)',
    acidAlkali: 'Good resistance to weak acids/alkalis & sunlight',
    crossShape: 'Dog-bone / Bean',
    longDesc: 'Uniform rod with faint striations reflecting dog-bone (dry spun) or kidney-bean (wet spun) profile.',
    burnBehavior: 'Melts and burns vigorously with sputtering yellow flame & black smoke; acrid chemical odor; hard irregular black bead.',
    burnTag: 'acrylic',
    solubilityKey: 'Dissolves in DMF (dimethylformamide) and 70% ammonium thiocyanate.',
    refSource: 'Kadolph / AATCC 20',
  },
  {
    id: 'pp',
    name: 'Polypropylene (PP)',
    category: 'Synthetic',
    densityRange: '0.90 – 0.91 g/cm³',
    floatWater: 'Floats',
    regainRange: '0.0 – 0.05%',
    tenacityDry: '35 – 60 cN/tex',
    wetDryNote: 'Wet 100% dry (zero water uptake)',
    elongationRange: '20 – 40%',
    thermalNote: 'T_m ~160–170 °C (low heat tolerance)',
    acidAlkali: 'Inert to almost all acids & alkalis at room temp',
    crossShape: 'Circular Smooth',
    longDesc: 'Smooth uniform filament; exceptionally low specific gravity (floats in water).',
    burnBehavior: 'Melts rapidly, burns slowly; faint waxy/paraffin candle odor; hard pale tan waxy bead.',
    burnTag: 'pp',
    solubilityKey: 'Insoluble in common cold solvents; floats on water (ρ < 1.00); dissolves in boiling xylene.',
    refSource: 'Morton & Hearle',
  },
];

function renderFibreSchematicSvg(f: FibreProfile): string {
  const accent = 'var(--accent)';
  const accent2 = 'var(--accent2)';
  const txt = 'var(--text)';
  const muted = 'var(--muted)';

  // Cross-section SVG (left panel)
  let cs = '';
  if (f.crossShape === 'Kidney-bean (lumen)') {
    cs = `<path d="M55,60 C55,34 85,24 106,36 C125,46 122,74 104,84 C88,92 65,86 60,72 C57,66 72,62 72,56 C72,50 55,65 55,60 Z" fill="color-mix(in srgb, ${accent} 18%, transparent)" stroke="${accent}" stroke-width="2.2"/><path d="M74,56 Q88,52 96,60 Q87,67 74,60 Z" fill="var(--bg)" stroke="${muted}" stroke-width="1.3"/>`;
  } else if (f.crossShape === 'Circular / Oval (scales)') {
    cs = `<ellipse cx="88" cy="60" rx="31" ry="26" fill="color-mix(in srgb, ${accent} 16%, transparent)" stroke="${accent}" stroke-width="2.2"/><ellipse cx="88" cy="60" rx="26" ry="21" fill="none" stroke="${muted}" stroke-dasharray="3 3" stroke-width="1"/><circle cx="88" cy="60" r="5" fill="${accent2}" opacity="0.45"/>`;
  } else if (f.crossShape === 'Rounded Triangle') {
    cs = `<path d="M88,30 Q116,32 117,64 Q115,88 86,88 Q59,87 61,60 Q64,31 88,30 Z" fill="color-mix(in srgb, ${accent} 18%, transparent)" stroke="${accent}" stroke-width="2.2"/>`;
  } else if (f.crossShape === 'Polygonal Bundle') {
    cs = `<polygon points="62,42 86,32 108,45 102,75 74,84 56,64" fill="color-mix(in srgb, ${accent} 18%, transparent)" stroke="${accent}" stroke-width="2"/><polygon points="104,48 124,42 132,64 114,82 99,74" fill="color-mix(in srgb, ${accent2} 14%, transparent)" stroke="${accent2}" stroke-width="1.8"/><circle cx="82" cy="58" r="4" fill="var(--bg)" stroke="${muted}"/><circle cx="115" cy="60" r="3.5" fill="var(--bg)" stroke="${muted}"/>`;
  } else if (f.crossShape === 'Serrated Lobed') {
    const pts: string[] = [];
    for (let k = 0; k < 24; k++) {
      const a = (k / 24) * Math.PI * 2;
      const r = k % 2 === 0 ? 31 : 24;
      pts.push(`${(88 + r * Math.cos(a)).toFixed(1)},${(60 + r * Math.sin(a)).toFixed(1)}`);
    }
    cs = `<polygon points="${pts.join(' ')}" fill="color-mix(in srgb, ${accent} 18%, transparent)" stroke="${accent}" stroke-width="2"/>`;
  } else if (f.crossShape === 'Dog-bone / Bean') {
    cs = `<path d="M60,46 C68,36 80,45 88,45 C96,45 108,36 116,46 C122,55 122,65 116,74 C108,84 96,75 88,75 C80,75 68,84 60,74 C54,65 54,55 60,46 Z" fill="color-mix(in srgb, ${accent} 18%, transparent)" stroke="${accent}" stroke-width="2.2"/>`;
  } else {
    cs = `<circle cx="88" cy="60" r="29" fill="color-mix(in srgb, ${accent} 16%, transparent)" stroke="${accent}" stroke-width="2.2"/>`;
    if (f.id === 'pet') cs += `<circle cx="79" cy="52" r="1.8" fill="${muted}"/><circle cx="96" cy="67" r="1.8" fill="${muted}"/><circle cx="95" cy="50" r="1.5" fill="${muted}"/>`;
  }

  // Longitudinal SVG (right panel)
  let lg = '';
  if (f.id === 'cotton') {
    lg = `<path d="M185,42 Q225,28 265,44 Q305,60 345,42 L345,74 Q305,58 265,76 Q225,90 185,72 Z" fill="color-mix(in srgb, ${accent2} 14%, transparent)" stroke="${accent2}" stroke-width="2"/><path d="M185,57 Q225,44 265,60 Q305,74 345,58" fill="none" stroke="${muted}" stroke-dasharray="4 3" stroke-width="1.3"/>`;
  } else if (f.id === 'wool') {
    lg = `<rect x="185" y="40" width="160" height="36" rx="4" fill="color-mix(in srgb, ${accent2} 14%, transparent)" stroke="${accent2}" stroke-width="2"/>
          <path d="M202,40 L214,76 M228,40 L236,56 L225,76 M255,40 L268,76 M282,40 L292,58 L280,76 M312,40 L325,76" fill="none" stroke="${accent}" stroke-width="1.5"/>`;
  } else if (f.id === 'flax') {
    lg = `<rect x="185" y="44" width="160" height="28" fill="color-mix(in srgb, ${accent2} 14%, transparent)" stroke="${accent2}" stroke-width="2"/>
          <line x1="220" y1="44" x2="225" y2="72" stroke="${accent}" stroke-width="2"/><line x1="224" y1="44" x2="219" y2="72" stroke="${accent}" stroke-width="1.4"/>
          <line x1="292" y1="44" x2="297" y2="72" stroke="${accent}" stroke-width="2"/><line x1="296" y1="44" x2="291" y2="72" stroke="${accent}" stroke-width="1.4"/>`;
  } else if (f.id === 'viscose') {
    lg = `<rect x="185" y="42" width="160" height="32" fill="color-mix(in srgb, ${accent2} 14%, transparent)" stroke="${accent2}" stroke-width="2"/>
          <line x1="185" y1="50" x2="345" y2="50" stroke="${muted}" stroke-width="1.1"/>
          <line x1="185" y1="58" x2="345" y2="58" stroke="${muted}" stroke-width="1.1"/>
          <line x1="185" y1="66" x2="345" y2="66" stroke="${muted}" stroke-width="1.1"/>`;
  } else {
    lg = `<rect x="185" y="43" width="160" height="30" fill="color-mix(in srgb, ${accent2} 14%, transparent)" stroke="${accent2}" stroke-width="2"/>`;
    if (f.id === 'pet') lg += `<circle cx="220" cy="54" r="1.7" fill="${muted}"/><circle cx="268" cy="64" r="1.7" fill="${muted}"/><circle cx="315" cy="52" r="1.7" fill="${muted}"/>`;
  }

  return `
    <svg viewBox="0 0 380 120" style="width:100%;max-width:440px;display:block;border-radius:10px;border:1px solid var(--line);background:var(--surface2)">
      <text x="88" y="16" text-anchor="middle" fill="${txt}" font-size="10.5" font-family="var(--f-mono)">CROSS-SECTION</text>
      <text x="265" y="16" text-anchor="middle" fill="${txt}" font-size="10.5" font-family="var(--f-mono)">LONGITUDINAL VIEW</text>
      <line x1="168" y1="12" x2="168" y2="106" stroke="var(--line2)" stroke-dasharray="3 3"/>
      ${cs}
      ${lg}
      <text x="88" y="108" text-anchor="middle" fill="${muted}" font-size="9.5" font-family="var(--f-mono)">${esc(f.crossShape)}</text>
      <text x="265" y="108" text-anchor="middle" fill="${muted}" font-size="9.5" font-family="var(--f-mono)">Schematic Illustration (Not Micrograph)</text>
    </svg>
  `;
}

const FIBRE_QUIZ: QuizQuestion[] = [
  {
    id: 'fq1',
    level: 'Beginner',
    category: 'Moisture Regain Numerical',
    kind: 'numeric',
    prompt: 'A cotton yarn sample has a conditioned wet mass W_w = 54.0 g and an oven-dry mass W_d = 50.0 g. Calculate its Moisture Regain (R%) in percent.',
    numericAnswer: 8.0,
    tolMode: 'abs',
    tolerance: 0.05,
    unit: '%',
    explanation: 'Moisture Regain R% = ((W_w − W_d) / W_d) × 100 = ((54.0 − 50.0) / 50.0) × 100 = 8.0%.',
  },
  {
    id: 'fq2',
    level: 'Beginner',
    category: 'Linear Density Conversions',
    kind: 'numeric',
    prompt: 'A polyester filament yarn has a linear density of 150 denier. Convert this linear density into tex.',
    numericAnswer: 16.67,
    tolMode: 'rel',
    tolerance: 0.02,
    unit: 'tex',
    explanation: '1 tex = g/1000 m, 1 denier = g/9000 m → tex = denier / 9 = 150 / 9 = 16.67 tex.',
  },
  {
    id: 'fq3',
    level: 'Intermediate',
    category: 'Morphology & Identification',
    kind: 'mcq',
    prompt: 'An unknown white fibre sinks in water (ρ > 1.00), shows longitudinal serrated grooves and striations under optical inspection, burns rapidly with a burning paper odor without melting, and loses nearly 45% of its strength when wet. Identify the most consistent fibre:',
    options: ['Polyester (PET)', 'Cotton', 'Viscose Rayon', 'Nylon 6,6'],
    correctIndex: 2,
    explanation: 'Serrated cross-section/striations + cellulosic paper burning behavior + dramatic wet strength loss (~50–60% dry strength) is the hallmark of regular Viscose Rayon (whereas Cotton gains strength when wet).',
  },
  {
    id: 'fq4',
    level: 'Intermediate',
    category: 'Chemical & Burning Lab',
    kind: 'mcq',
    prompt: 'How do you cleanly distinguish Nylon 6,6 from Polyester (PET) using a solubility test in a supervised textile chemistry lab?',
    options: [
      'Both dissolve in water at 20 °C.',
      'Nylon 6,6 dissolves in 85–90% formic acid at room temperature, whereas PET remains insoluble.',
      'PET dissolves in boiling 5% NaOH while Wool does not.',
      'Polypropylene sinks faster than PET in water.',
    ],
    correctIndex: 1,
    explanation: 'Polyamides (Nylon 6 and 6,6) dissolve cleanly in 85–90% formic acid at ambient temperature, cleanly differentiating them from PET.',
  },
  {
    id: 'fq5',
    level: 'Intermediate',
    category: 'Diameter Estimation',
    kind: 'numeric',
    prompt: 'Assuming a circular cross-section, estimate the diameter (in μm) of a Polyester filament with linear density T = 0.22 tex and fibre density ρ = 1.38 g/cm³.',
    numericAnswer: 14.25,
    tolMode: 'rel',
    tolerance: 0.03,
    unit: 'μm',
    explanation: 'd(μm) = 35.682 × √(T / ρ) = 35.682 × √(0.22 / 1.38) = 35.682 × 0.3993 ≈ 14.25 μm.',
  },
  {
    id: 'fq6',
    level: 'Advanced',
    category: 'Moisture-Corrected Blend Composition',
    kind: 'numeric',
    prompt: 'A conditioned 65/35 nominal blend sample contains 65.0 g conditioned PET (0.4% regain) and 35.0 g conditioned Cotton (8.5% regain). Compute the true oven-dry Cotton mass percentage in the blend.',
    numericAnswer: 33.25,
    tolMode: 'rel',
    tolerance: 0.02,
    unit: '%',
    explanation: 'Dry PET = 65.0 / 1.004 = 64.741 g. Dry Cotton = 35.0 / 1.085 = 32.258 g. Total dry = 96.999 g. Dry Cotton % = (32.258 / 96.999) × 100 ≈ 33.26%.',
  },
];

let initialized = false;

export function initFibreModule(): void {
  if (initialized) return;
  const root = document.getElementById('mod-fibre');
  if (!root) return;
  initialized = true;

  const nav = root.querySelector<HTMLElement>('#fibSubnav');
  const panels = root.querySelector<HTMLElement>('#fibPanels');
  if (!nav || !panels) return;

  const updateProgressSummary = () => {
    const p = loadEduProgress('fibre');
    const progEl = root.querySelector('#fibProgressCard');
    if (progEl) {
      const best = p.quizBest['fib-main'];
      progEl.innerHTML = `
        <div class="kv-grid">
          <div class="kv-cell"><small>Topics Reviewed</small><b>${p.reviewedTopics.length} / ${FIBRE_TOPICS.length}</b></div>
          <div class="kv-cell"><small>Best Assessment</small><b>${best ? `${best.score}/${best.total} (${Math.round((best.score / best.total) * 100)}%)` : 'Not attempted'}</b></div>
        </div>
      `;
    }
  };

  /* 1. Curriculum & Two-Phase Morphology Visualizer */
  const banner = root.querySelector<HTMLElement>('#fibAlignBanner');
  if (banner) {
    banner.innerHTML = renderSyllabusBanner({
      courseCode: 'TE1010',
      courseName: 'Fibre Science',
      context: '1st-Year Textile & Apparel Engineering Foundation',
      outcomes: [
        'Classify natural, regenerated, and synthetic fibres and relate monomer/polymer chemistry to spinning routes.',
        'Analyze semi-crystalline morphology (crystallinity, orientation, DP) and property trade-offs.',
        'Compute moisture regain/content, tex/denier counts, tenacity, dry/conditioned blends, and equivalent diameter.',
        'Identify fibres systematically via schematic morphology, float/sink density, burning clues, and solubility tests.',
      ],
    });
  }
  const theoryBox = root.querySelector<HTMLElement>('#fibTheoryCatalog');
  if (theoryBox) renderTheoryCatalog(theoryBox, 'fibre', FIBRE_TOPICS, updateProgressSummary);

  // Interactive Morphology Visualizer
  const morCrys = root.querySelector<HTMLInputElement>('#fibMorCrys');
  const morOri = root.querySelector<HTMLInputElement>('#fibMorOri');
  const morDP = root.querySelector<HTMLInputElement>('#fibMorDP');
  const morCv = root.querySelector<HTMLCanvasElement>('#fibMorCv');
  const morOut = root.querySelector<HTMLElement>('#fibMorOut');

  const drawMorphology = () => {
    if (!morCrys || !morOri || !morDP || !morCv || !morOut) return;
    const crys = parseFloat(morCrys.value) || 55;
    const ori = parseFloat(morOri.value) || 60;
    const dp = parseFloat(morDP.value) || 70;
    const lc = root.querySelector('#fibMorCrysLbl');
    const lo = root.querySelector('#fibMorOriLbl');
    const ld = root.querySelector('#fibMorDPLbl');
    if (lc) lc.textContent = `${crys}%`;
    if (lo) lo.textContent = `${ori}%`;
    if (ld) ld.textContent = `${dp}%`;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = morCv.clientWidth || 480;
    const h = morCv.clientHeight || 210;
    morCv.width = w * dpr;
    morCv.height = h * dpr;
    const ctx = morCv.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const style = getComputedStyle(document.documentElement);
    const accent = style.getPropertyValue('--accent').trim() || '#D6B77A';
    const accent2 = style.getPropertyValue('--accent2').trim() || '#8BB8E8';
    const muted = style.getPropertyValue('--muted').trim() || '#9aa0ad';

    // Draw fibre axis boundaries
    ctx.strokeStyle = muted;
    ctx.lineWidth = 1.4;
    ctx.strokeRect(20, 20, w - 40, h - 40);

    // Draw amorphous wavy tie-chains (angle spreads inversely with orientation)
    const spread = ((100 - ori) / 100) * 28;
    const segs = 4 + Math.round((dp / 100) * 6);
    ctx.strokeStyle = accent2;
    ctx.lineWidth = 1.6;
    ctx.globalAlpha = 0.72;
    for (let row = 0; row < 5; row++) {
      const baseY = 44 + row * 30;
      ctx.beginPath();
      ctx.moveTo(28, baseY);
      for (let s = 1; s <= segs; s++) {
        const x = 28 + ((w - 56) * s) / segs;
        const y = baseY + Math.sin(s * 1.9 + row) * spread;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // Draw crystalline lamellae/micelles (size/count scales with crystallinity & aligned along orientation)
    const crysCount = Math.round((crys / 100) * 8) + 1;
    const rotRad = ((100 - ori) / 100) * 0.45;
    for (let i = 0; i < crysCount; i++) {
      const cx = 62 + ((i * 113) % (w - 130));
      const cy = 52 + ((i * 59) % (h - 104));
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate((i % 2 === 0 ? 1 : -1) * rotRad);
      ctx.fillStyle = accent;
      ctx.globalAlpha = 0.25;
      ctx.fillRect(-24, -13, 48, 26);
      ctx.globalAlpha = 0.95;
      ctx.strokeStyle = accent;
      ctx.lineWidth = 1.6;
      for (let l = -8; l <= 8; l += 4) {
        ctx.beginPath();
        ctx.moveTo(-20, l);
        ctx.lineTo(20, l);
        ctx.stroke();
      }
      ctx.restore();
    }

    // Qualitative model trends (illustrative qualitative indices)
    const tenacityScore = Math.round(0.45 * crys + 0.4 * ori + 0.15 * dp);
    const modulusScore = Math.round(0.5 * crys + 0.42 * ori + 0.08 * dp);
    const extensScore = Math.max(8, Math.round(100 - (0.45 * crys + 0.48 * ori)));
    const dyeAccess = Math.max(8, Math.round((100 - crys) * 0.72 + (100 - ori) * 0.28));

    morOut.innerHTML = `
      <div class="eng-pillrow"><span class="badge-tag approx">Illustrative Conceptual Trend Model (Not Absolute Lab Values)</span></div>
      <div class="kv-grid">
        <div class="kv-cell"><small>Relative Tenacity</small><b>${tenacityScore} / 100 (${tenacityScore > 65 ? 'High' : tenacityScore > 40 ? 'Moderate' : 'Low'})</b></div>
        <div class="kv-cell"><small>Initial Stiffness / Modulus</small><b>${modulusScore} / 100</b></div>
        <div class="kv-cell"><small>Extensibility / Elongation</small><b>${extensScore} / 100</b></div>
        <div class="kv-cell"><small>Amorphous Accessibility (Dye / Moisture)</small><b>${dyeAccess} / 100</b></div>
      </div>
    `;
  };
  [morCrys, morOri, morDP].forEach((el) => el?.addEventListener('input', drawMorphology));

  /* 2. Fibre Identification Laboratory */
  const idFibreSel = root.querySelector<HTMLSelectElement>('#fibIdSel');
  const idFloatSel = root.querySelector<HTMLSelectElement>('#fibIdFloat');
  const idBurnSel = root.querySelector<HTMLSelectElement>('#fibIdBurn');
  const idCrossSel = root.querySelector<HTMLSelectElement>('#fibIdCross');
  const idDetailBox = root.querySelector<HTMLElement>('#fibIdDetail');
  const idMatchesBox = root.querySelector<HTMLElement>('#fibIdMatches');

  if (idFibreSel) {
    idFibreSel.innerHTML = FIBRE_DB.map((f) => `<option value="${esc(f.id)}">${esc(f.name)} (${esc(f.category)})</option>`).join('');
  }

  const renderIdView = () => {
    const selected = FIBRE_DB.find((f) => f.id === idFibreSel?.value) || FIBRE_DB[0];
    if (idDetailBox) {
      idDetailBox.innerHTML = `
        <div class="eng-pillrow">
          <span class="badge-tag exact">${esc(selected.name)}</span>
          <span class="badge-tag">${esc(selected.category)}</span>
          <span class="badge-tag">ρ = ${esc(selected.densityRange)} (${esc(selected.floatWater)})</span>
        </div>
        ${renderFibreSchematicSvg(selected)}
        <div class="kv-grid" style="margin-top:10px">
          <div class="kv-cell"><small>Moisture Regain (65% RH)</small><b>${esc(selected.regainRange)}</b></div>
          <div class="kv-cell"><small>Dry Tenacity Range</small><b>${esc(selected.tenacityDry)}</b></div>
          <div class="kv-cell"><small>Longitudinal Morphology</small><b>${esc(selected.longDesc)}</b></div>
          <div class="kv-cell"><small>Thermal Behavior</small><b>${esc(selected.thermalNote)}</b></div>
        </div>
        <div class="formula-card">
          <b>Burning Test Observation:</b> ${esc(selected.burnBehavior)}<br>
          <b>Chemical Solubility Identification:</b> ${esc(selected.solubilityKey)}<br>
          <small class="muted">Reference: ${esc(selected.refSource)}</small>
        </div>
      `;
    }

    if (idMatchesBox) {
      const fWater = idFloatSel?.value || 'all';
      const fBurn = idBurnSel?.value || 'all';
      const fCross = idCrossSel?.value || 'all';
      const matches = FIBRE_DB.filter((f) => {
        if (fWater !== 'all' && f.floatWater !== fWater) return false;
        if (fBurn !== 'all' && f.burnTag !== fBurn) return false;
        if (fCross !== 'all' && f.crossShape !== fCross) return false;
        return true;
      });
      idMatchesBox.innerHTML = matches.length
        ? `<div class="eng-pillrow">${matches
            .map(
              (m) =>
                `<button type="button" class="badge-tag ${m.id === selected.id ? 'exact' : ''}" data-pick-fib="${esc(m.id)}" style="cursor:pointer">${esc(m.name)} (${esc(m.floatWater)})</button>`
            )
            .join('')}</div>`
        : `<div class="bl warn">No curated fibre matches all selected test filters simultaneously. Relax one clue filter to inspect candidates.</div>`;

      idMatchesBox.querySelectorAll<HTMLButtonElement>('[data-pick-fib]').forEach((b) => {
        b.onclick = () => {
          if (idFibreSel) {
            idFibreSel.value = b.dataset.pickFib || 'cotton';
            renderIdView();
          }
        };
      });
    }
  };

  [idFibreSel, idFloatSel, idBurnSel, idCrossSel].forEach((el) => el?.addEventListener('change', renderIdView));
  renderIdView();

  /* 3. 7 Validated Fibre Science Calculators */
  const fCalcKind = root.querySelector<HTMLSelectElement>('#fibCalcKind');
  const fCalcInputs = root.querySelector<HTMLElement>('#fibCalcInputs');
  const fCalcRun = root.querySelector<HTMLButtonElement>('#fibCalcRun');
  const fCalcRes = root.querySelector<HTMLElement>('#fibCalcRes');
  const fCalcSteps = root.querySelector<HTMLElement>('#fibCalcSteps');

  const FIB_CALCS: Record<
    string,
    {
      title: string;
      hint: string;
      fields: { id: string; label: string; val: string; unit?: string }[];
      solve: (v: Record<string, number>) => { main: string; kv: [string, string][]; steps: string[] };
    }
  > = {
    regain: {
      title: 'Moisture Regain (R%) & Moisture Content (C%)',
      hint: 'Conditioned wet mass W_w must be ≥ oven-dry mass W_d > 0.',
      fields: [
        { id: 'Ww', label: 'Conditioned Mass W_w', val: '54.25', unit: 'g' },
        { id: 'Wd', label: 'Oven-Dry Mass W_d', val: '50.00', unit: 'g' },
      ],
      solve: (v) => {
        if (!(v.Wd > 0 && v.Ww >= v.Wd)) throw new Error('Require W_w ≥ W_d > 0.');
        const R = ((v.Ww - v.Wd) / v.Wd) * 100;
        const C = ((v.Ww - v.Wd) / v.Ww) * 100;
        return {
          main: `Moisture Regain R = ${R.toFixed(2)}% · Moisture Content C = ${C.toFixed(2)}%`,
          kv: [
            ['Moisture Regain (dry basis)', `${R.toFixed(3)}%`],
            ['Moisture Content (wet basis)', `${C.toFixed(3)}%`],
            ['Absorbed Water Mass', `${(v.Ww - v.Wd).toFixed(3)} g`],
          ],
          steps: [
            `1. R% = ((W_w − W_d) / W_d) × 100 = ((${v.Ww} − ${v.Wd}) / ${v.Wd}) × 100 = ${R.toFixed(3)}%.`,
            `2. C% = ((W_w − W_d) / W_w) × 100 = ((${v.Ww} − ${v.Wd}) / ${v.Ww}) × 100 = ${C.toFixed(3)}%.`,
            `3. Identity check: 100·R/(100+R) = ${((100 * R) / (100 + R)).toFixed(3)}% = C%.`,
          ],
        };
      },
    },
    regainConv: {
      title: 'Convert Moisture Content ↔ Moisture Regain',
      hint: 'Enter Moisture Content C% (0 ≤ C < 100) to get R%, or switch using standard identity.',
      fields: [{ id: 'C', label: 'Moisture Content C%', val: '7.83', unit: '%' }],
      solve: (v) => {
        if (!(v.C >= 0 && v.C < 100)) throw new Error('Moisture content C% must satisfy 0 ≤ C < 100.');
        const R = (100 * v.C) / (100 - v.C);
        return {
          main: `C = ${v.C.toFixed(2)}% corresponds to Moisture Regain R = ${R.toFixed(2)}%`,
          kv: [
            ['Moisture Content C%', `${v.C.toFixed(2)}%`],
            ['Moisture Regain R%', `${R.toFixed(3)}%`],
          ],
          steps: [`1. R = (100 × C) / (100 − C) = (100 × ${v.C}) / (100 − ${v.C}) = ${R.toFixed(3)}%.`],
        };
      },
    },
    linearDensity: {
      title: 'Linear Density (tex, dtex, denier) & Yarn Counts (Nm, Ne)',
      hint: 'Direct systems (tex/denier) measure mass per fixed length; Indirect systems (Nm/Ne) measure length per fixed mass.',
      fields: [
        { id: 'mass_g', label: 'Sample Mass m', val: '2.5', unit: 'g' },
        { id: 'len_m', label: 'Sample Length L', val: '125', unit: 'm' },
      ],
      solve: (v) => {
        if (!(v.mass_g > 0 && v.len_m > 0)) throw new Error('Both mass and length must be > 0.');
        const tex = (1000 * v.mass_g) / v.len_m;
        const dtex = 10 * tex;
        const denier = 9 * tex;
        const Nm = 1000 / tex;
        const Ne = 590.5 / tex;
        return {
          main: `${tex.toFixed(2)} tex · ${dtex.toFixed(1)} dtex · ${denier.toFixed(1)} denier`,
          kv: [
            ['Tex (g / 1000 m)', `${tex.toFixed(3)} tex`],
            ['Decitex (g / 10,000 m)', `${dtex.toFixed(2)} dtex`],
            ['Denier (g / 9000 m)', `${denier.toFixed(2)} den`],
            ['Metric Count Nm (km/kg)', `${Nm.toFixed(2)} Nm`],
            ['English Cotton Count Ne_c', `${Ne.toFixed(2)} Ne`],
          ],
          steps: [
            `1. tex = 1000 × m(g) / L(m) = 1000 × ${v.mass_g} / ${v.len_m} = ${tex.toFixed(3)} tex.`,
            `2. denier = 9 × tex = ${denier.toFixed(2)} den; dtex = 10 × tex = ${dtex.toFixed(2)} dtex.`,
            `3. Indirect counts: Nm = 1000 / tex = ${Nm.toFixed(2)}; Ne_cotton ≈ 590.5 / tex = ${Ne.toFixed(2)}.`,
          ],
        };
      },
    },
    tenacity: {
      title: 'Fibre Elongation (%) & Specific Stress (Tenacity)',
      hint: 'Tenacity expresses breaking load normalized by linear density (cN/tex or g/den).',
      fields: [
        { id: 'F_cN', label: 'Breaking Force F', val: '8.4', unit: 'cN' },
        { id: 'tex', label: 'Fibre Linear Density T', val: '0.20', unit: 'tex' },
        { id: 'L0', label: 'Initial Gauge L₀', val: '20.0', unit: 'mm' },
        { id: 'Lf', label: 'Length at Break L_f', val: '24.6', unit: 'mm' },
      ],
      solve: (v) => {
        if (!(v.F_cN > 0 && v.tex > 0 && v.L0 > 0 && v.Lf >= v.L0)) {
          throw new Error('Require F > 0, tex > 0, and L_f ≥ L₀ > 0.');
        }
        const ten_cNtex = v.F_cN / v.tex;
        const ten_gden = ten_cNtex / 8.826;
        const elong = ((v.Lf - v.L0) / v.L0) * 100;
        return {
          main: `Tenacity = ${ten_cNtex.toFixed(2)} cN/tex (${ten_gden.toFixed(2)} g/den) · Breaking Elongation = ${elong.toFixed(2)}%`,
          kv: [
            ['Specific Stress (Tenacity)', `${ten_cNtex.toFixed(2)} cN/tex`],
            ['Tenacity (g/denier)', `${ten_gden.toFixed(2)} gf/den`],
            ['Breaking Elongation', `${elong.toFixed(2)}%`],
          ],
          steps: [
            `1. Tenacity = F(cN) / T(tex) = ${v.F_cN} / ${v.tex} = ${ten_cNtex.toFixed(2)} cN/tex.`,
            `2. Convert to gf/den: (${ten_cNtex.toFixed(2)} cN/tex) / 8.826 ≈ ${ten_gden.toFixed(2)} gf/den.`,
            `3. % Elongation = ((${v.Lf} − ${v.L0}) / ${v.L0}) × 100 = ${elong.toFixed(2)}%.`,
          ],
        };
      },
    },
    blend: {
      title: 'Fibre Blend Composition (Dry & Moisture-Corrected)',
      hint: 'Accounts for different component moisture regains (e.g., PET 0.4% vs Cotton 8.5%) when reporting dry vs conditioned percentages.',
      fields: [
        { id: 'mA', label: 'Component A Conditioned Mass', val: '65', unit: 'g' },
        { id: 'rA', label: 'Component A Regain', val: '0.4', unit: '%' },
        { id: 'mB', label: 'Component B Conditioned Mass', val: '35', unit: 'g' },
        { id: 'rB', label: 'Component B Regain', val: '8.5', unit: '%' },
      ],
      solve: (v) => {
        if (!(v.mA >= 0 && v.mB >= 0 && v.mA + v.mB > 0 && v.rA >= 0 && v.rB >= 0)) {
          throw new Error('Component masses must be non-negative with positive total mass.');
        }
        const totCond = v.mA + v.mB;
        const pctCondA = (v.mA / totCond) * 100;
        const pctCondB = (v.mB / totCond) * 100;
        const dryA = v.mA / (1 + v.rA / 100);
        const dryB = v.mB / (1 + v.rB / 100);
        const totDry = dryA + dryB;
        const pctDryA = (dryA / totDry) * 100;
        const pctDryB = (dryB / totDry) * 100;
        return {
          main: `Conditioned: ${pctCondA.toFixed(2)}% / ${pctCondB.toFixed(2)}% · Oven-Dry: ${pctDryA.toFixed(2)}% / ${pctDryB.toFixed(2)}%`,
          kv: [
            ['Dry Mass A / B', `${dryA.toFixed(3)} g / ${dryB.toFixed(3)} g`],
            ['Oven-Dry Blend % (A / B)', `${pctDryA.toFixed(2)}% / ${pctDryB.toFixed(2)}%`],
            ['Conditioned Blend % (A / B)', `${pctCondA.toFixed(2)}% / ${pctCondB.toFixed(2)}%`],
          ],
          steps: [
            `1. Dry mass A = ${v.mA} / (1 + ${v.rA}/100) = ${dryA.toFixed(3)} g; Dry mass B = ${v.mB} / (1 + ${v.rB}/100) = ${dryB.toFixed(3)} g.`,
            `2. Total dry mass = ${totDry.toFixed(3)} g.`,
            `3. Oven-dry blend: A = ${pctDryA.toFixed(2)}%, B = ${pctDryB.toFixed(2)}%.`,
          ],
        };
      },
    },
    diameter: {
      title: 'Fibre Diameter (Circular Assumption) & Specific Volume',
      hint: 'Computes equivalent circular cross-section diameter d(μm) = 35.682·√(tex/ρ). Non-circular fibres use equivalent area diameter.',
      fields: [
        { id: 'tex', label: 'Linear Density T', val: '0.22', unit: 'tex' },
        { id: 'rho', label: 'Fibre Density ρ', val: '1.38', unit: 'g/cm³' },
      ],
      solve: (v) => {
        if (!(v.tex > 0 && v.rho > 0)) throw new Error('Linear density and fibre density must both be > 0.');
        const d_um = Math.sqrt((4000 * v.tex) / (Math.PI * v.rho));
        const specVol = 1 / v.rho;
        const area_um2 = Math.PI * (d_um / 2) ** 2;
        return {
          main: `Equivalent Diameter d ≈ ${d_um.toFixed(2)} μm · Specific Volume = ${specVol.toFixed(3)} cm³/g`,
          kv: [
            ['Equivalent Circular Diameter', `${d_um.toFixed(2)} μm`],
            ['Cross-Sectional Area', `${area_um2.toFixed(1)} μm²`],
            ['Specific Volume 1/ρ', `${specVol.toFixed(3)} cm³/g`],
          ],
          steps: [
            `1. Area per 1 m length: A(cm²) = (T tex × 10⁻³ g/m) / (100 cm × ρ) → d(μm) = √(4000·T / (π·ρ)).`,
            `2. d = √(4000 × ${v.tex} / (π × ${v.rho})) = ${d_um.toFixed(3)} μm.`,
            `3. Specific volume v = 1 / ${v.rho} = ${specVol.toFixed(3)} cm³/g.`,
          ],
        };
      },
    },
    commercialMass: {
      title: 'Commercial Conditioned Mass (Invoice Mass Correction)',
      hint: 'Converts lot wet mass at measured regain R_actual to commercial mass at standard allowance R_std.',
      fields: [
        { id: 'mLot', label: 'Measured Lot Mass', val: '104.5', unit: 'kg' },
        { id: 'rAct', label: 'Measured Moisture Regain', val: '12.5', unit: '%' },
        { id: 'rStd', label: 'Standard Allowance Regain', val: '8.5', unit: '%' },
      ],
      solve: (v) => {
        if (!(v.mLot > 0 && v.rAct >= 0 && v.rStd >= 0)) throw new Error('Lot mass must be > 0 and regains ≥ 0.');
        const mDry = v.mLot / (1 + v.rAct / 100);
        const mComm = mDry * (1 + v.rStd / 100);
        return {
          main: `Commercial Mass = ${mComm.toFixed(3)} kg (Oven-Dry = ${mDry.toFixed(3)} kg)`,
          kv: [
            ['Commercial Conditioned Mass', `${mComm.toFixed(3)} kg`],
            ['True Oven-Dry Mass', `${mDry.toFixed(3)} kg`],
            ['Mass Adjustment Δm', `${(mComm - v.mLot).toFixed(3)} kg`],
          ],
          steps: [
            `1. Oven-dry mass m_dry = ${v.mLot} / (1 + ${v.rAct}/100) = ${mDry.toFixed(4)} kg.`,
            `2. Commercial mass = m_dry × (1 + ${v.rStd}/100) = ${mComm.toFixed(4)} kg.`,
          ],
        };
      },
    },
  };

  const renderFibCalcForm = () => {
    const k = fCalcKind?.value || 'regain';
    const sc = FIB_CALCS[k] || FIB_CALCS.regain;
    if (fCalcInputs) {
      fCalcInputs.innerHTML = sc.fields
        .map(
          (f) => `
          <label class="field">${esc(f.label)} ${f.unit ? `(${esc(f.unit)})` : ''}
            <input type="number" step="any" id="fc_${esc(f.id)}" value="${esc(f.val)}">
          </label>
        `
        )
        .join('');
    }
    const hint = root.querySelector('#fibCalcHint');
    if (hint) hint.textContent = sc.hint;
  };

  const runFibCalc = () => {
    const k = fCalcKind?.value || 'regain';
    const sc = FIB_CALCS[k] || FIB_CALCS.regain;
    const vals: Record<string, number> = {};
    sc.fields.forEach((f) => {
      vals[f.id] = parseFloat(root.querySelector<HTMLInputElement>(`#fc_${f.id}`)?.value || 'NaN');
    });
    if (!fCalcRes || !fCalcSteps) return;
    fCalcSteps.replaceChildren();
    try {
      for (const f of sc.fields) {
        if (!Number.isFinite(vals[f.id])) throw new Error(`Please provide a valid number for "${f.label}".`);
      }
      const out = sc.solve(vals);
      fCalcRes.className = 'resultbox s-ok';
      fCalcRes.innerHTML = `
        <div class="answerline">✓ ${esc(out.main)}</div>
        <div class="kv-grid">${out.kv.map(([l, val]) => `<div class="kv-cell"><small>${esc(l)}</small><b>${esc(val)}</b></div>`).join('')}</div>
      `;
      fCalcSteps.innerHTML = `<h3>Step-by-step working</h3>${out.steps.map((s) => `<div class="step">${esc(s)}</div>`).join('')}`;
      window.__mnx?.pushHist({
        mod: 'fibre',
        title: sc.title,
        txt: `${out.main}\n\n${out.steps.join('\n')}`,
      });
      window.__mnx?.stat(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      fCalcRes.className = 'resultbox s-err';
      fCalcRes.replaceChildren();
      if (window.__mnx) fCalcRes.appendChild(window.__mnx.renderCallout('error', 'Input Validation Error', msg));
      else fCalcRes.textContent = msg;
      window.__mnx?.stat(false);
    }
  };

  fCalcKind?.addEventListener('change', () => {
    renderFibCalcForm();
    runFibCalc();
  });
  fCalcRun && (fCalcRun.onclick = runFibCalc);
  renderFibCalcForm();
  runFibCalc();

  /* 4. Comparison Table & Multi-Factor Textile Product Fibre Selection */
  const fibCatSel = root.querySelector<HTMLSelectElement>('#fibCmpCat');
  const fibCmpTable = root.querySelector<HTMLElement>('#fibCmpTable');
  const renderFibTable = () => {
    if (!fibCmpTable) return;
    const cat = fibCatSel?.value || 'All';
    const rows = FIBRE_DB.filter((r) => cat === 'All' || r.category === cat);
    fibCmpTable.innerHTML = `
      <div class="mx-val-scroll" style="max-height:58vh"><table class="mx-val-table">
        <thead><tr>
          <th>Fibre</th><th>Category</th><th>Density</th><th>Regain (65% RH)</th>
          <th>Dry Tenacity</th><th>Wet Retention</th><th>Elongation</th><th>Thermal</th><th>Chemical Note</th>
        </tr></thead>
        <tbody>${rows
          .map(
            (r) => `<tr>
              <td><b>${esc(r.name)}</b></td><td>${esc(r.category)}</td><td>${esc(r.densityRange)}</td>
              <td>${esc(r.regainRange)}</td><td>${esc(r.tenacityDry)}</td><td>${esc(r.wetDryNote)}</td>
              <td>${esc(r.elongationRange)}</td><td>${esc(r.thermalNote)}</td><td>${esc(r.acidAlkali)}</td>
            </tr>`
          )
          .join('')}</tbody>
      </table></div>
    `;
  };
  fibCatSel?.addEventListener('change', renderFibTable);
  renderFibTable();

  // Multi-factor Textile Product Selection Tool
  const prodPreset = root.querySelector<HTMLSelectElement>('#fibProdPreset');
  const wMoist = root.querySelector<HTMLInputElement>('#fibWMoist');
  const wStr = root.querySelector<HTMLInputElement>('#fibWStr');
  const wElast = root.querySelector<HTMLInputElement>('#fibWElast');
  const wHeat = root.querySelector<HTMLInputElement>('#fibWHeat');
  const prodOut = root.querySelector<HTMLElement>('#fibProdOut');

  interface FibScoreVec {
    id: string;
    name: string;
    moist: number; // moisture absorption / hydrophilicity (0-10)
    wicking: number; // fast drying / moisture transport
    strength: number;
    elastic: number;
    heat: number;
    soft: number;
    rationale: string;
  }
  const FIB_SCORES: FibScoreVec[] = [
    { id: 'cotton', name: 'Cotton', moist: 8.5, wicking: 4, strength: 6.5, elastic: 4, heat: 8.5, soft: 9, rationale: 'High comfort & absorbency; blends with PET/Elastane fix creasing & drying time.' },
    { id: 'wool', name: 'Wool', moist: 10, wicking: 5, strength: 4.5, elastic: 9.5, heat: 7.5, soft: 8, rationale: 'Unmatched thermal insulation, moisture buffering & recovery; requires gentle care.' },
    { id: 'silk', name: 'Silk', moist: 7.5, wicking: 6, strength: 7.5, elastic: 6.5, heat: 6, soft: 10, rationale: 'Luxurious handle & drape; sensitive to strong alkali & UV.' },
    { id: 'flax', name: 'Flax (Linen)', moist: 9, wicking: 7.5, strength: 8.5, elastic: 2.5, heat: 9, soft: 5.5, rationale: 'High wet strength & crisp cooling hand; wrinkles sharply due to low elasticity.' },
    { id: 'viscose', name: 'Viscose / Lyocell', moist: 9.5, wicking: 6, strength: 6.8, elastic: 4.5, heat: 7, soft: 9.2, rationale: 'Cellulosic softness & drape; Lyocell improves wet stability markedly over regular viscose.' },
    { id: 'pet', name: 'Polyester (PET)', moist: 1.5, wicking: 9.5, strength: 9, elastic: 8.5, heat: 8, soft: 6.5, rationale: 'Durable, quick-dry, crease-resistant & strong; low intrinsic moisture absorbency.' },
    { id: 'nylon66', name: 'Nylon 6,6', moist: 4.5, wicking: 7.5, strength: 9.5, elastic: 9, heat: 7, soft: 7.5, rationale: 'Top abrasion resistance, tenacity & recovery; yellow/UV-degrades without stabilizers.' },
    { id: 'pp', name: 'Polypropylene', moist: 0.5, wicking: 9.8, strength: 8.8, elastic: 7, heat: 4.5, soft: 6, rationale: 'Floats on water, zero water uptake, chemical inertness; low T_m limits ironing/dyeing.' },
  ];

  const PRODUCT_PRESETS: Record<string, { moist: number; str: number; elast: number; heat: number; blendNote: string }> = {
    sportswear: { moist: 3, str: 8, elast: 9, heat: 5, blendNote: 'Sportswear prioritizes rapid wicking/drying + stretch recovery → hydrophobic PET or Nylon blended with 5–15% Elastane often outperforms pure cotton (which retains sweat).' },
    tshirt: { moist: 9, str: 6, elast: 5, heat: 8, blendNote: 'Everyday T-shirts value moisture comfort & skin softness → Combed Cotton or 60/40 Cotton/PET for dimensional stability & shrinkage control.' },
    suiting: { moist: 7, str: 7, elast: 9, heat: 8, blendNote: 'Tailored suiting balances drape, crease recovery, and breathability → Wool or Wool/PET (e.g., 55/45 PET/Wool) prevents knee-bagging and enhances abrasion life.' },
    towel: { moist: 10, str: 7, elast: 3, heat: 9, blendNote: 'Terry towels demand maximum water uptake & wet durability → Cotton or Cotton/Modal loops excel.' },
    marine: { moist: 1, str: 10, elast: 6, heat: 4, blendNote: 'Marine ropes & geotextiles require high wet tenacity, rot resistance & buoyancy → Polypropylene (floats) or Nylon/PET depending on shock absorption vs low creep.' },
    medical: { moist: 10, str: 6, elast: 4, heat: 9, blendNote: 'Absorbent medical gauze needs high sterile fluid uptake & zero synthetic melting risk → Bleached Cotton or Viscose/Lyocell.' },
  };

  const evaluateProductSelection = () => {
    if (!wMoist || !wStr || !wElast || !wHeat || !prodOut) return;
    const wm = parseFloat(wMoist.value) || 5;
    const ws = parseFloat(wStr.value) || 5;
    const we = parseFloat(wElast.value) || 5;
    const wh = parseFloat(wHeat.value) || 5;
    const wsum = Math.max(1, wm + ws + we + wh);

    const pKey = prodPreset?.value || 'sportswear';
    const isHydrophobicWick = pKey === 'sportswear' || pKey === 'marine';

    const ranked = FIB_SCORES.map((f) => {
      const mMetric = isHydrophobicWick ? f.wicking : f.moist;
      const score = ((mMetric * wm + f.strength * ws + f.elastic * we + f.heat * wh) / wsum) * 10;
      return { ...f, score };
    }).sort((a, b) => b.score - a.score);

    const note = PRODUCT_PRESETS[pKey]?.blendNote || 'Compare ranked trade-offs carefully before specifying single fibres or blends.';
    prodOut.innerHTML = `
      <div class="eng-pillrow"><span class="badge-tag approx">Multi-Criteria Suitability Model (Trade-off Aid)</span></div>
      <div class="formula-card" style="margin-top:0;margin-bottom:10px"><b>Engineering Blend &amp; Trade-Off Rationale:</b> ${esc(note)}</div>
      <div class="mx-val-scroll"><table class="mx-val-table">
        <thead><tr><th>Rank</th><th>Candidate Fibre</th><th>Suitability Score</th><th>Key Engineering Trade-Off</th></tr></thead>
        <tbody>${ranked
          .map(
            (r, idx) =>
              `<tr class="${idx < 2 ? 'pass' : ''}"><td>#${idx + 1}</td><td><b>${esc(r.name)}</b></td><td>${r.score.toFixed(1)} / 100</td><td>${esc(r.rationale)}</td></tr>`
          )
          .join('')}</tbody>
      </table></div>
    `;
  };

  prodPreset?.addEventListener('change', () => {
    const p = PRODUCT_PRESETS[prodPreset.value];
    if (p && wMoist && wStr && wElast && wHeat) {
      wMoist.value = String(p.moist);
      wStr.value = String(p.str);
      wElast.value = String(p.elast);
      wHeat.value = String(p.heat);
    }
    evaluateProductSelection();
  });
  [wMoist, wStr, wElast, wHeat].forEach((el) => el?.addEventListener('input', evaluateProductSelection));
  evaluateProductSelection();

  /* 5. Quiz & Progress */
  const quizBox = root.querySelector<HTMLElement>('#fibQuizBox');
  if (quizBox) renderQuizSuite(quizBox, 'fibre', 'fib-main', FIBRE_QUIZ, updateProgressSummary);

  root.querySelector<HTMLButtonElement>('#fibResetProgress')?.addEventListener('click', () => {
    saveEduProgress('fibre', { reviewedTopics: [], quizBest: {}, completedExercises: [] });
    if (theoryBox) renderTheoryCatalog(theoryBox, 'fibre', FIBRE_TOPICS, updateProgressSummary);
    if (quizBox) renderQuizSuite(quizBox, 'fibre', 'fib-main', FIBRE_QUIZ, updateProgressSummary);
    updateProgressSummary();
    window.__mnx?.toast('TE1010 module progress reset');
  });

  wireSubnav(
    nav,
    panels,
    [
      { id: 'calc', label: '01 · Fibre Calculators' },
      { id: 'idlab', label: '02 · Fibre Identification Lab' },
      { id: 'theory', label: '03 · Morphology & Theory' },
      { id: 'select', label: '04 · Comparison & Product Selection' },
      { id: 'quiz', label: '05 · Practice & Assessment' },
      { id: 'refs', label: '06 · Progress & References' },
    ],
    'calc',
    (tabId) => {
      if (tabId === 'theory') requestAnimationFrame(drawMorphology);
    }
  );

  window.addEventListener('mathnex:theme', drawMorphology);
  requestAnimationFrame(() => {
    drawMorphology();
    updateProgressSummary();
  });
  void fmtSI;
}
