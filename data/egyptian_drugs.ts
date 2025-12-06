export interface DrugEntry {
  tradeName: string;
  active: string;
  dose: string;
  category: string;
}

export const EGYPTIAN_MARKET_DRUGS: Record<string, DrugEntry[]> = {
  "Induction": [
    { tradeName: "Clomid 50mg", active: "Clomiphene", dose: "قرص مرتين يومياً من اليوم 2 لـ 6 للدورة", category: "Induction" },
    { tradeName: "Femara 2.5mg", active: "Letrozole", dose: "قرصين مرة واحدة يومياً من 3 لـ 7 للدورة", category: "Induction" },
    { tradeName: "Gonal-F 75IU", active: "Follitropin Alfa", dose: "حقنة تحت الجلد يومياً حسب البروتوكول", category: "Induction" },
    { tradeName: "Merional 75IU", active: "Menotrophin", dose: "حقنة تحت الجلد يومياً حسب البروتوكول", category: "Induction" },
    { tradeName: "Fostimon 75IU", active: "Urofollitropin", dose: "حقنة تحت الجلد يومياً حسب البروتوكول", category: "Induction" },
    { tradeName: "Menogon 75IU", active: "Menotrophin", dose: "حقنة تحت الجلد يومياً حسب البروتوكول", category: "Induction" },
    { tradeName: "Pergoveris 150IU", active: "Follitropin/Lutropin", dose: "حقنة تحت الجلد يومياً حسب البروتوكول", category: "Induction" },
    { tradeName: "Epigonal 0.5mg", active: "Ganirelix", dose: "حقنة تحت الجلد يومياً من اليوم 6 للدورة", category: "Induction" },
  ],
  "Luteal Support": [
    { tradeName: "Cyclogest 400mg", active: "Progesterone", dose: "لبوسة مهبلية مساءً", category: "Luteal Support" },
    { tradeName: "Prontogest 100mg", active: "Progesterone", dose: "حقنة عضل يومياً", category: "Luteal Support" },
    { tradeName: "Duphaston 10mg", active: "Dydrogesterone", dose: "قرصين مرتين يومياً", category: "Luteal Support" },
    { tradeName: "Utrogestan 200mg", active: "Progesterone", dose: "كبسولتان مهبلياً مساءً", category: "Luteal Support" },
    { tradeName: "Endometrin 100mg", active: "Progesterone", dose: "لبوسة مهبلية مرتين يومياً", category: "Luteal Support" },
  ],
  "Antibiotics": [
    { tradeName: "Augmentin 1g", active: "Amoxicillin/Clavulanate", dose: "قرص كل 12 ساعة لمدة أسبوع", category: "Antibiotics" },
    { tradeName: "Vibramycin 100mg", active: "Doxycycline", dose: "قرص بعد الأكل كل 12 ساعة", category: "Antibiotics" },
    { tradeName: "Dalacin C 300mg", active: "Clindamycin", dose: "كبسولة كل 8 ساعات", category: "Antibiotics" },
    { tradeName: "Zithromax 500mg", active: "Azithromycin", dose: "قرص مرة واحدة يومياً لمدة 3 أيام", category: "Antibiotics" },
    { tradeName: "Flagyl 500mg", active: "Metronidazole", dose: "قرصين كل 12 ساعة لمدة أسبوع", category: "Antibiotics" },
    { tradeName: "Diflucan 150mg", active: "Fluconazole", dose: "كبسولة مرة واحدة", category: "Antibiotics" },
    { tradeName: "Doxycast 100mg", active: "Doxycycline", dose: "كبسولة مرتين يومياً", category: "Antibiotics" },
  ],
  "Anticoagulants": [
    { tradeName: "Clexane 40mg", active: "Enoxaparin", dose: "حقنة تحت الجلد يومياً", category: "Anticoagulants" },
    { tradeName: "Aspocid 75mg", active: "Aspirin", dose: "قرص بعد الغداء", category: "Anticoagulants" },
    { tradeName: "Innohep 4500IU", active: "Tinzaparin", dose: "حقنة تحت الجلد يومياً", category: "Anticoagulants" },
    { tradeName: "Juvespr 20mg", active: "Rivaroxaban", dose: "قرص مرة واحدة يومياً", category: "Anticoagulants" },
  ],
  "Supplements": [
    { tradeName: "Folic Acid 5mg", active: "Folic Acid", dose: "قرص واحد يومياً", category: "Supplements" },
    { tradeName: "Ferrotron", active: "Iron/Folic Acid", dose: "كبسولة بعد الغداء", category: "Supplements" },
    { tradeName: "Osteocare", active: "Calcium/Vitamin D", dose: "قرصين يومياً", category: "Supplements" },
    { tradeName: "Calcid", active: "Calcium Carbonate", dose: "قرص بعد الغداء", category: "Supplements" },
    { tradeName: "Omega 3", active: "Fish Oil", dose: "كبسولة مرتين يومياً", category: "Supplements" },
    { tradeName: "Carnivita", active: "L-Carnitine", dose: "كبسولة مرتين يومياً", category: "Supplements" },
  ],
  "Hormonal/Misc": [
    { tradeName: "Cidophage 850mg", active: "Metformin", dose: "قرص بعد الغداء", category: "Hormonal/Misc" },
    { tradeName: "Dostinex 0.5mg", active: "Cabergoline", dose: "نصف قرص كل 3 أيام", category: "Hormonal/Misc" },
    { tradeName: "Kapron", active: "Tranexamic Acid", dose: "قرصين كل 8 ساعات", category: "Hormonal/Misc" },
    { tradeName: "Cyclo-Progynova", active: "Estrogen/Progestin", dose: "قرص يومياً بانتظام", category: "Hormonal/Misc" },
    { tradeName: "Marvelon", active: "Ethinylestradiol/Desogestrel", dose: "قرص يومياً لـ 21 يوماً", category: "Hormonal/Misc" },
    { tradeName: "Diane 35", active: "Ethinylestradiol/Cyproterone", dose: "قرص يومياً لـ 21 يوماً", category: "Hormonal/Misc" },
    { tradeName: "Primolut N", active: "Norethisterone", dose: "قرص مرتين يومياً", category: "Hormonal/Misc" },
    { tradeName: "Provera 10mg", active: "Medroxyprogesterone", dose: "قرص مرتين يومياً", category: "Hormonal/Misc" },
  ],
  "Pain Relief": [
    { tradeName: "Brufen 400mg", active: "Ibuprofen", dose: "قرص كل 8 ساعات عند الحاجة", category: "Pain Relief" },
    { tradeName: "Ponstan 500mg", active: "Mefenamic Acid", dose: "كبسولة كل 8 ساعات", category: "Pain Relief" },
    { tradeName: "Cataflam 50mg", active: "Diclofenac", dose: "قرص كل 12 ساعة", category: "Pain Relief" },
    { tradeName: "Voltaren 75mg", active: "Diclofenac", dose: "قرصين يومياً", category: "Pain Relief" },
  ],
  "Anti-emetics": [
    { tradeName: "Primperan 10mg", active: "Metoclopramide", dose: "قرص قبل الأكل", category: "Anti-emetics" },
    { tradeName: "Maxolon", active: "Metoclopramide", dose: "أمبولة عضل عند الحاجة", category: "Anti-emetics" },
    { tradeName: "Zofran 8mg", active: "Ondansetron", dose: "قرص قبل الأكل", category: "Anti-emetics" },
  ],
  "Thyroid": [
    { tradeName: "Eltroxin 50mcg", active: "Levothyroxine", dose: "نصف قرص صباحاً", category: "Thyroid" },
    { tradeName: "Thyronorm 25mcg", active: "Levothyroxine", dose: "قرص صباحاً", category: "Thyroid" },
  ],
  "Antihistamines": [
    { tradeName: "Loratadine 10mg", active: "Loratadine", dose: "قرص مرة واحدة يومياً", category: "Antihistamines" },
    { tradeName: "Cetirizine 10mg", active: "Cetirizine", dose: "قرص مرة واحدة يومياً", category: "Antihistamines" },
  ]
};

// Helper function to get all drugs as a flat array
export const getAllDrugs = (): DrugEntry[] => {
  return Object.values(EGYPTIAN_MARKET_DRUGS).flat();
};

// Helper function to get drugs by category
export const getDrugsByCategory = (category: string): DrugEntry[] => {
  return EGYPTIAN_MARKET_DRUGS[category] || [];
};

// Helper function to search drugs by name
export const searchDrugs = (query: string): DrugEntry[] => {
  const allDrugs = getAllDrugs();
  const lowerQuery = query.toLowerCase();
  return allDrugs.filter(drug =>
    drug.tradeName.toLowerCase().includes(lowerQuery) ||
    drug.active.toLowerCase().includes(lowerQuery)
  );
};