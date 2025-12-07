export interface DrugEntry {
  tradeName: string;   // e.g., "Augmentin 1g"
  active: string;      // e.g., "Amoxicillin/Clavulanate"
  route: string;       // e.g., "أقراص", "حقن", "لبوس", "كريم"
  dose: string;        // e.g., "قرص كل 12 ساعة بعد الأكل"
  category: string;    // e.g., "Antibiotics"
}

export const EGYPTIAN_MARKET_DRUGS: Record<string, DrugEntry[]> = {
  "Induction & IVF": [
    // Oral Induction
    { tradeName: "Clomid 50mg", active: "Clomiphene Citrate", route: "أقراص", dose: "قرص مرتين يومياً من اليوم 2-6 للدورة", category: "Induction & IVF" },
    { tradeName: "Clostilbegyt 50mg", active: "Clomiphene Citrate", route: "أقراص", dose: "قرص مرتين يومياً من اليوم 2-6 للدورة", category: "Induction & IVF" },
    { tradeName: "Technovula 50mg", active: "Clomiphene Citrate", route: "أقراص", dose: "قرص مرتين يومياً من اليوم 2-6 للدورة", category: "Induction & IVF" },
    { tradeName: "Femara 2.5mg", active: "Letrozole", route: "أقراص", dose: "قرصين مرة واحدة يومياً من اليوم 3-7 للدورة", category: "Induction & IVF" },
    { tradeName: "Letrozole 2.5mg", active: "Letrozole", route: "أقراص", dose: "قرصين مرة واحدة يومياً من اليوم 3-7 للدورة", category: "Induction & IVF" },

    // FSH Injectables
    { tradeName: "Gonal-F 75IU Pen", active: "Follitropin Alfa", route: "حقن تحت الجلد", dose: "حقنة يومياً حسب البروتوكول الطبي", category: "Induction & IVF" },
    { tradeName: "Gonal-F 300IU Pen", active: "Follitropin Alfa", route: "حقن تحت الجلد", dose: "حقنة يومياً حسب البروتوكول الطبي", category: "Induction & IVF" },
    { tradeName: "Gonal-F 450IU Pen", active: "Follitropin Alfa", route: "حقن تحت الجلد", dose: "حقنة يومياً حسب البروتوكول الطبي", category: "Induction & IVF" },
    { tradeName: "Gonal-F 900IU Pen", active: "Follitropin Alfa", route: "حقن تحت الجلد", dose: "حقنة يومياً حسب البروتوكول الطبي", category: "Induction & IVF" },
    { tradeName: "Merional 75IU", active: "Menotrophin (FSH/LH)", route: "حقن تحت الجلد", dose: "حقنة يومياً حسب البروتوكول الطبي", category: "Induction & IVF" },
    { tradeName: "Merional 150IU", active: "Menotrophin (FSH/LH)", route: "حقن تحت الجلد", dose: "حقنة يومياً حسب البروتوكول الطبي", category: "Induction & IVF" },
    { tradeName: "Fostimon 75IU", active: "Urofollitropin", route: "حقن تحت الجلد", dose: "حقنة يومياً حسب البروتوكول الطبي", category: "Induction & IVF" },
    { tradeName: "Fostimon 150IU", active: "Urofollitropin", route: "حقن تحت الجلد", dose: "حقنة يومياً حسب البروتوكول الطبي", category: "Induction & IVF" },
    { tradeName: "Menogon 75IU", active: "Menotrophin", route: "حقن تحت الجلد", dose: "حقنة يومياً حسب البروتوكول الطبي", category: "Induction & IVF" },
    { tradeName: "Epigonal 0.5mg", active: "Ganirelix", route: "حقن تحت الجلد", dose: "حقنة يومياً من اليوم 6 للدورة", category: "Induction & IVF" },

    // LH/FSH Combinations
    { tradeName: "Pergoveris 150IU", active: "Follitropin Alfa/Lutropin Alfa", route: "حقن تحت الجلد", dose: "حقنة يومياً حسب البروتوكول الطبي", category: "Induction & IVF" },
    { tradeName: "Luveris 75IU", active: "Lutropin Alfa", route: "حقن تحت الجلد", dose: "حقنة يومياً حسب البروتوكول الطبي", category: "Induction & IVF" },

    // GnRH Antagonists
    { tradeName: "Cetrotide 0.25mg", active: "Cetrorelix", route: "حقن تحت الجلد", dose: "حقنة يومياً من اليوم 6 للدورة", category: "Induction & IVF" },
    { tradeName: "Orgalutran 0.25mg", active: "Ganirelix", route: "حقن تحت الجلد", dose: "حقنة يومياً من اليوم 6 للدورة", category: "Induction & IVF" },

    // GnRH Agonists
    { tradeName: "Decapeptyl 0.1mg Daily", active: "Triptorelin", route: "حقن تحت الجلد", dose: "حقنة يومياً حسب البروتوكول", category: "Induction & IVF" },
    { tradeName: "Decapeptyl 3.75mg Depot", active: "Triptorelin", route: "حقن عضل", dose: "حقنة كل 28 يوم حسب البروتوكول", category: "Induction & IVF" },
    { tradeName: "Zoladex 3.6mg", active: "Goserelin", route: "زرع تحت الجلد", dose: "زرعة كل 28 يوم حسب البروتوكول", category: "Induction & IVF" },
    { tradeName: "Lupron Depot 3.75mg", active: "Leuprolide", route: "حقن عضل", dose: "حقنة كل 28 يوم حسب البروتوكول", category: "Induction & IVF" },

    // Trigger Injections
    { tradeName: "Choriomon 5000IU", active: "hCG", route: "حقن عضل", dose: "حقنة واحدة عند الإباضة", category: "Induction & IVF" },
    { tradeName: "Choriomon 10000IU", active: "hCG", route: "حقن عضل", dose: "حقنة واحدة عند الإباضة", category: "Induction & IVF" },
    { tradeName: "Epifasi 5000IU", active: "hCG", route: "حقن عضل", dose: "حقنة واحدة عند الإباضة", category: "Induction & IVF" },
    { tradeName: "Pregnyl 5000IU", active: "hCG", route: "حقن عضل", dose: "حقنة واحدة عند الإباضة", category: "Induction & IVF" },
    { tradeName: "Ovitrelle 250mcg", active: "Choriogonadotropin Alfa", route: "حقن تحت الجلد", dose: "حقنة واحدة عند الإباضة", category: "Induction & IVF" },
  ],

  "Luteal Support": [
    { tradeName: "Cyclogest 200mg", active: "Progesterone", route: "لبوس مهبلي", dose: "لبوسة مساءً يومياً", category: "Luteal Support" },
    { tradeName: "Cyclogest 400mg", active: "Progesterone", route: "لبوس مهبلي", dose: "لبوسة مساءً يومياً", category: "Luteal Support" },
    { tradeName: "Prontogest 100mg", active: "Progesterone", route: "حقن عضل", dose: "حقنة يومياً", category: "Luteal Support" },
    { tradeName: "Prontogest 200mg", active: "Progesterone", route: "حقن عضل", dose: "حقنة يومياً", category: "Luteal Support" },
    { tradeName: "Prontogest 400mg", active: "Progesterone", route: "حقن عضل", dose: "حقنة يومياً", category: "Luteal Support" },
    { tradeName: "Utrogestan 100mg", active: "Progesterone", route: "كبسولات مهبلية", dose: "كبسولتان يومياً", category: "Luteal Support" },
    { tradeName: "Utrogestan 200mg", active: "Progesterone", route: "كبسولات مهبلية", dose: "كبسولتان يومياً", category: "Luteal Support" },
    { tradeName: "Duphaston 10mg", active: "Dydrogesterone", route: "أقراص", dose: "قرصين مرتين يومياً", category: "Luteal Support" },
    { tradeName: "Endometrin 100mg", active: "Progesterone", route: "لبوس مهبلي", dose: "لبوسة مرتين يومياً", category: "Luteal Support" },
    { tradeName: "Crinone 8% Gel", active: "Progesterone", route: "جيل مهبلي", dose: "تطبيق مرة واحدة يومياً", category: "Luteal Support" },
    { tradeName: "Lubgest 200mg", active: "Progesterone", route: "كبسولات مهبلية", dose: "كبسولة مرتين يومياً", category: "Luteal Support" },
  ],

  "Pregnancy Supplements": [
    // Folic Acid
    { tradeName: "Folic Acid 5mg (Nile)", active: "Folic Acid", route: "أقراص", dose: "قرص واحد يومياً", category: "Pregnancy Supplements" },
    { tradeName: "Folic Acid 5mg (Mepaco)", active: "Folic Acid", route: "أقراص", dose: "قرص واحد يومياً", category: "Pregnancy Supplements" },
    { tradeName: "Methylfolate 400mcg", active: "L-Methylfolate", route: "أقراص", dose: "قرص واحد يومياً", category: "Pregnancy Supplements" },

    // Iron Supplements
    { tradeName: "Ferrotron", active: "Iron/Folic Acid", route: "كبسولات", dose: "كبسولة بعد الغداء", category: "Pregnancy Supplements" },
    { tradeName: "Haemoton", active: "Iron/Folic Acid", route: "كبسولات", dose: "كبسولة بعد الغداء", category: "Pregnancy Supplements" },
    { tradeName: "Feroglobin", active: "Iron/Vitamins", route: "كبسولات", dose: "كبسولة بعد الغداء", category: "Pregnancy Supplements" },
    { tradeName: "Pravotin", active: "Iron/Folic Acid", route: "كبسولات", dose: "كبسولة بعد الغداء", category: "Pregnancy Supplements" },

    // Calcium & Vitamin D
    { tradeName: "Osteocare", active: "Calcium/Vitamin D3", route: "أقراص", dose: "قرصين يومياً", category: "Pregnancy Supplements" },
    { tradeName: "Calcid", active: "Calcium Carbonate", route: "أقراص", dose: "قرص بعد الغداء", category: "Pregnancy Supplements" },
    { tradeName: "Calcimate", active: "Calcium/Vitamin D3", route: "أقراص", dose: "قرصين يومياً", category: "Pregnancy Supplements" },
    { tradeName: "Cal-Mag", active: "Calcium/Magnesium", route: "أقراص", dose: "قرصين يومياً", category: "Pregnancy Supplements" },

    // Prenatal Vitamins
    { tradeName: "Pregnacare Original", active: "Multivitamins", route: "أقراص", dose: "قرص واحد يومياً", category: "Pregnancy Supplements" },
    { tradeName: "Pregnacare Plus", active: "Multivitamins/Iron", route: "أقراص", dose: "قرص واحد يومياً", category: "Pregnancy Supplements" },
    { tradeName: "Elevit", active: "Multivitamins", route: "أقراص", dose: "قرص واحد يومياً", category: "Pregnancy Supplements" },
    { tradeName: "Limitless Woman", active: "Multivitamins", route: "كبسولات", dose: "كبسولة واحدة يومياً", category: "Pregnancy Supplements" },

    // Omega 3
    { tradeName: "Omega 3 Plus", active: "Fish Oil/DHA", route: "كبسولات", dose: "كبسولة مرتين يومياً", category: "Pregnancy Supplements" },
    { tradeName: "Maxepa", active: "Omega 3", route: "كبسولات", dose: "كبسولة مرتين يومياً", category: "Pregnancy Supplements" },
  ],

  "Anticoagulants": [
    { tradeName: "Clexane 20mg", active: "Enoxaparin", route: "حقن تحت الجلد", dose: "حقنة يومياً", category: "Anticoagulants" },
    { tradeName: "Clexane 40mg", active: "Enoxaparin", route: "حقن تحت الجلد", dose: "حقنة يومياً", category: "Anticoagulants" },
    { tradeName: "Clexane 60mg", active: "Enoxaparin", route: "حقن تحت الجلد", dose: "حقنة يومياً", category: "Anticoagulants" },
    { tradeName: "Clexane 80mg", active: "Enoxaparin", route: "حقن تحت الجلد", dose: "حقنة يومياً", category: "Anticoagulants" },
    { tradeName: "Enoxa 40mg", active: "Enoxaparin", route: "حقن تحت الجلد", dose: "حقنة يومياً", category: "Anticoagulants" },
    { tradeName: "Innohep 4500IU", active: "Tinzaparin", route: "حقن تحت الجلد", dose: "حقنة يومياً", category: "Anticoagulants" },
    { tradeName: "Clexane T 4000IU", active: "Enoxaparin", route: "حقن تحت الجلد", dose: "حقنة يومياً", category: "Anticoagulants" },
    { tradeName: "Juvespr 20mg", active: "Rivaroxaban", route: "أقراص", dose: "قرص مرة واحدة يومياً", category: "Anticoagulants" },
    { tradeName: "Aspocid 75mg", active: "Aspirin", route: "أقراص", dose: "قرص بعد الغداء", category: "Anticoagulants" },
    { tradeName: "Ezacard 75mg", active: "Aspirin", route: "أقراص", dose: "قرص بعد الغداء", category: "Anticoagulants" },
  ],

  "Antibiotics": [
    // Penicillins
    { tradeName: "Augmentin 375mg", active: "Amoxicillin/Clavulanate", route: "أقراص", dose: "قرص كل 12 ساعة بعد الأكل", category: "Antibiotics" },
    { tradeName: "Augmentin 625mg", active: "Amoxicillin/Clavulanate", route: "أقراص", dose: "قرص كل 12 ساعة بعد الأكل", category: "Antibiotics" },
    { tradeName: "Augmentin 1g", active: "Amoxicillin/Clavulanate", route: "أقراص", dose: "قرص كل 12 ساعة بعد الأكل", category: "Antibiotics" },
    { tradeName: "Hibiotic 375mg", active: "Amoxicillin/Clavulanate", route: "أقراص", dose: "قرص كل 12 ساعة بعد الأكل", category: "Antibiotics" },
    { tradeName: "Megamox 375mg", active: "Amoxicillin/Clavulanate", route: "أقراص", dose: "قرص كل 12 ساعة بعد الأكل", category: "Antibiotics" },
    { tradeName: "Curam 625mg", active: "Amoxicillin/Clavulanate", route: "أقراص", dose: "قرص كل 12 ساعة بعد الأكل", category: "Antibiotics" },

    // Cephalosporins
    { tradeName: "Zinnat 250mg", active: "Cefuroxime", route: "أقراص", dose: "قرص كل 12 ساعة", category: "Antibiotics" },
    { tradeName: "Zinnat 500mg", active: "Cefuroxime", route: "أقراص", dose: "قرص كل 12 ساعة", category: "Antibiotics" },
    { tradeName: "Cefotax 1g", active: "Cefotaxime", route: "حقن عضل/وريدي", dose: "حقنة كل 12 ساعة", category: "Antibiotics" },
    { tradeName: "Cefzone 1g", active: "Ceftriaxone", route: "حقن عضل/وريدي", dose: "حقنة كل 24 ساعة", category: "Antibiotics" },
    { tradeName: "Rocephin 1g", active: "Ceftriaxone", route: "حقن عضل/وريدي", dose: "حقنة كل 24 ساعة", category: "Antibiotics" },
    { tradeName: "Duricef 500mg", active: "Cefadroxil", route: "أقراص", dose: "قرص كل 12 ساعة", category: "Antibiotics" },

    // Macrolides
    { tradeName: "Zithromax 500mg", active: "Azithromycin", route: "أقراص", dose: "قرص مرة واحدة يومياً لمدة 3 أيام", category: "Antibiotics" },
    { tradeName: "Zisrocin 500mg", active: "Azithromycin", route: "أقراص", dose: "قرص مرة واحدة يومياً لمدة 3 أيام", category: "Antibiotics" },

    // Tetracyclines
    { tradeName: "Vibramycin 100mg", active: "Doxycycline", route: "كبسولات", dose: "كبسولة مرتين يومياً بعد الأكل", category: "Antibiotics" },
    { tradeName: "Doxycast 100mg", active: "Doxycycline", route: "كبسولات", dose: "كبسولة مرتين يومياً بعد الأكل", category: "Antibiotics" },

    // Lincosamides
    { tradeName: "Dalacin C 300mg", active: "Clindamycin", route: "كبسولات", dose: "كبسولة كل 8 ساعات", category: "Antibiotics" },

    // Nitroimidazoles
    { tradeName: "Flagyl 500mg", active: "Metronidazole", route: "أقراص", dose: "قرصين كل 12 ساعة لمدة أسبوع", category: "Antibiotics" },
    { tradeName: "Amrizole 500mg", active: "Metronidazole", route: "أقراص", dose: "قرصين كل 12 ساعة لمدة أسبوع", category: "Antibiotics" },

    // Antifungals
    { tradeName: "Diflucan 150mg", active: "Fluconazole", route: "كبسولات", dose: "كبسولة مرة واحدة", category: "Antibiotics" },

    // UTI Specific
    { tradeName: "Uvamin Retard 400mg", active: "Fosfomycin", route: "أقراص", dose: "قرص مرة واحدة", category: "Antibiotics" },
    { tradeName: "Macropur 3g", active: "Nitrofurantoin", route: "أقراص", dose: "قرص مرتين يومياً", category: "Antibiotics" },
    { tradeName: "Monuril 3g", active: "Fosfomycin", route: "أقراص", dose: "قرص مرة واحدة", category: "Antibiotics" },
  ],

  "Vaginal Preparations": [
    // Antifungal
    { tradeName: "Gyno-Daktarin 400mg", active: "Miconazole", route: "كريم مهبلي", dose: "تطبيق مرة واحدة مساءً", category: "Vaginal Preparations" },
    { tradeName: "Monicure 400mg", active: "Miconazole", route: "كريم مهبلي", dose: "تطبيق مرة واحدة مساءً", category: "Vaginal Preparations" },
    { tradeName: "Gyno-Zalain 300mg", active: "Sertaconazole", route: "كريم مهبلي", dose: "تطبيق مرة واحدة مساءً", category: "Vaginal Preparations" },
    { tradeName: "Candistan 100mg", active: "Clotrimazole", route: "كريم مهبلي", dose: "تطبيق مرتين يومياً لمدة 3 أيام", category: "Vaginal Preparations" },
    { tradeName: "Gyno-Trosyd 100mg", active: "Tioconazole", route: "كبسولة مهبلية", dose: "كبسولة مرة واحدة مساءً", category: "Vaginal Preparations" },

    // Antibacterial
    { tradeName: "Amrizole N", active: "Metronidazole", route: "كريم مهبلي", dose: "تطبيق مرتين يومياً لمدة 5 أيام", category: "Vaginal Preparations" },
    { tradeName: "Betadine", active: "Povidone Iodine", route: "كريم مهبلي", dose: "تطبيق مرتين يومياً", category: "Vaginal Preparations" },
    { tradeName: "Albothyl", active: "Polymyxin/Neomycin", route: "كريم مهبلي", dose: "تطبيق مرتين يومياً", category: "Vaginal Preparations" },
    { tradeName: "PolgyneX", active: "Polymyxin/Neomycin", route: "كريم مهبلي", dose: "تطبيق مرتين يومياً", category: "Vaginal Preparations" },

    // Cleansers
    { tradeName: "Vagyl", active: "Lactic Acid", route: "غسول مهبلي", dose: "غسل مرة واحدة يومياً", category: "Vaginal Preparations" },
    { tradeName: "Tantum Rosa", active: "Benzydamine", route: "غسول مهبلي", dose: "غسل مرتين يومياً", category: "Vaginal Preparations" },
  ],

  "Antihypertensives": [
    { tradeName: "Aldomet 250mg", active: "Methyldopa", route: "أقراص", dose: "قرصين كل 8 ساعات", category: "Antihypertensives" },
    { tradeName: "Aldomet 500mg", active: "Methyldopa", route: "أقراص", dose: "قرصين كل 8 ساعات", category: "Antihypertensives" },
    { tradeName: "Adalat LA 30mg", active: "Nifedipine", route: "أقراص", dose: "قرص مرة واحدة يومياً", category: "Antihypertensives" },
    { tradeName: "Adalat LA 60mg", active: "Nifedipine", route: "أقراص", dose: "قرص مرة واحدة يومياً", category: "Antihypertensives" },
    { tradeName: "Epilat 30mg", active: "Nifedipine", route: "أقراص", dose: "قرص مرة واحدة يومياً", category: "Antihypertensives" },
    { tradeName: "Dopegyt 250mg", active: "Methyldopa", route: "أقراص", dose: "قرصين كل 8 ساعات", category: "Antihypertensives" },
  ],

  "Antidiabetics": [
    // Metformin
    { tradeName: "Cidophage 500mg", active: "Metformin", route: "أقراص", dose: "قرصين كل 12 ساعة بعد الأكل", category: "Antidiabetics" },
    { tradeName: "Cidophage 850mg", active: "Metformin", route: "أقراص", dose: "قرصين كل 12 ساعة بعد الأكل", category: "Antidiabetics" },
    { tradeName: "Cidophage 1000mg", active: "Metformin", route: "أقراص", dose: "قرصين كل 12 ساعة بعد الأكل", category: "Antidiabetics" },
    { tradeName: "Glucophage XR 500mg", active: "Metformin", route: "أقراص", dose: "قرص مرة واحدة يومياً", category: "Antidiabetics" },
    { tradeName: "Glucophage XR 1000mg", active: "Metformin", route: "أقراص", dose: "قرص مرة واحدة يومياً", category: "Antidiabetics" },

    // Sulfonylureas
    { tradeName: "Amaryl 2mg", active: "Glimepiride", route: "أقراص", dose: "قرص مرة واحدة يومياً قبل الإفطار", category: "Antidiabetics" },
    { tradeName: "Amaryl 4mg", active: "Glimepiride", route: "أقراص", dose: "قرص مرة واحدة يومياً قبل الإفطار", category: "Antidiabetics" },

    // Insulin
    { tradeName: "Mixtard 30/70", active: "Insulin Human", route: "حقن تحت الجلد", dose: "حقنة قبل الوجبات حسب الحاجة", category: "Antidiabetics" },
    { tradeName: "Lantus 100IU/ml", active: "Insulin Glargine", route: "حقن تحت الجلد", dose: "حقنة مرة واحدة يومياً", category: "Antidiabetics" },
    { tradeName: "Apidra 100IU/ml", active: "Insulin Glulisine", route: "حقن تحت الجلد", dose: "حقنة قبل الوجبات", category: "Antidiabetics" },
    { tradeName: "Actrapid 100IU/ml", active: "Insulin Human", route: "حقن تحت الجلد", dose: "حقنة قبل الوجبات", category: "Antidiabetics" },
  ],

  "Analgesics": [
    // NSAIDs
    { tradeName: "Brufen 400mg", active: "Ibuprofen", route: "أقراص", dose: "قرص كل 8 ساعات عند الحاجة", category: "Analgesics" },
    { tradeName: "Brufen 600mg", active: "Ibuprofen", route: "أقراص", dose: "قرص كل 8 ساعات عند الحاجة", category: "Analgesics" },
    { tradeName: "Ponstan 500mg", active: "Mefenamic Acid", route: "كبسولات", dose: "كبسولة كل 8 ساعات", category: "Analgesics" },
    { tradeName: "Ponstan Forte 500mg", active: "Mefenamic Acid", route: "كبسولات", dose: "كبسولة كل 8 ساعات", category: "Analgesics" },
    { tradeName: "Cataflam 50mg", active: "Diclofenac", route: "أقراص", dose: "قرص كل 12 ساعة", category: "Analgesics" },
    { tradeName: "Voltaren 75mg", active: "Diclofenac", route: "أقراص", dose: "قرصين يومياً", category: "Analgesics" },
    { tradeName: "Ketolac 10mg", active: "Ketorolac", route: "أقراص", dose: "قرص كل 8 ساعات لمدة 5 أيام", category: "Analgesics" },

    // Paracetamol
    { tradeName: "Panadol 500mg", active: "Paracetamol", route: "أقراص", dose: "قرصين كل 6 ساعات عند الحاجة", category: "Analgesics" },
    { tradeName: "Panadol Extra 500mg", active: "Paracetamol/Caffeine", route: "أقراص", dose: "قرصين كل 6 ساعات عند الحاجة", category: "Analgesics" },
    { tradeName: "Panadol Joint 665mg", active: "Paracetamol", route: "أقراص", dose: "قرصين كل 8 ساعات", category: "Analgesics" },
    { tradeName: "Abimol 500mg", active: "Paracetamol", route: "أقراص", dose: "قرصين كل 6 ساعات عند الحاجة", category: "Analgesics" },
    { tradeName: "Pyral 500mg", active: "Paracetamol", route: "أقراص", dose: "قرصين كل 6 ساعات عند الحاجة", category: "Analgesics" },

    // Antispasmodics
    { tradeName: "Buscopan 10mg", active: "Hyoscine Butylbromide", route: "أقراص", dose: "قرص كل 8 ساعات", category: "Analgesics" },
    { tradeName: "Visceralgine 10mg", active: "Hyoscine Butylbromide", route: "أقراص", dose: "قرص كل 8 ساعات", category: "Analgesics" },
    { tradeName: "Spasmo-digestin", active: "Hyoscine/Phenylpropanolamine", route: "أقراص", dose: "قرص كل 8 ساعات", category: "Analgesics" },
    { tradeName: "Spasmofree", active: "Hyoscine/Phenylpropanolamine", route: "أقراص", dose: "قرص كل 8 ساعات", category: "Analgesics" },
    { tradeName: "Spasmo-Amrase", active: "Hyoscine/Phenylpropanolamine", route: "أقراص", dose: "قرص كل 8 ساعات", category: "Analgesics" },
  ],

  "Contraceptives": [
    // Combined Oral Contraceptives
    { tradeName: "Yasmin", active: "Ethinylestradiol/Drospirenone", route: "أقراص", dose: "قرص يومياً لمدة 21 يوماً", category: "Contraceptives" },
    { tradeName: "Yaz", active: "Ethinylestradiol/Drospirenone", route: "أقراص", dose: "قرص يومياً لمدة 24 يوماً", category: "Contraceptives" },
    { tradeName: "Gynera", active: "Ethinylestradiol/Gestodene", route: "أقراص", dose: "قرص يومياً لمدة 21 يوماً", category: "Contraceptives" },
    { tradeName: "Marvelon", active: "Ethinylestradiol/Desogestrel", route: "أقراص", dose: "قرص يومياً لمدة 21 يوماً", category: "Contraceptives" },
    { tradeName: "Cilest", active: "Ethinylestradiol/Norgestimate", route: "أقراص", dose: "قرص يومياً لمدة 21 يوماً", category: "Contraceptives" },
    { tradeName: "Microlut", active: "Levonorgestrel", route: "أقراص", dose: "قرص يومياً بدون فترة راحة", category: "Contraceptives" },
    { tradeName: "Diane 35", active: "Ethinylestradiol/Cyproterone", route: "أقراص", dose: "قرص يومياً لمدة 21 يوماً", category: "Contraceptives" },

    // Injectable Contraceptives
    { tradeName: "Depo-Provera 150mg", active: "Medroxyprogesterone", route: "حقن عضل", dose: "حقنة كل 3 أشهر", category: "Contraceptives" },
    { tradeName: "Mesigyna 150mg", active: "Medroxyprogesterone", route: "حقن عضل", dose: "حقنة كل 3 أشهر", category: "Contraceptives" },

    // Emergency Contraception
    { tradeName: "Contraceplan II", active: "Levonorgestrel", route: "أقراص", dose: "قرصين معاً خلال 72 ساعة", category: "Contraceptives" },
  ],

  "Anti-Emetics": [
    { tradeName: "Navidoxine", active: "Doxylamine/Pyridoxine", route: "أقراص", dose: "قرص قبل النوم", category: "Anti-Emetics" },
    { tradeName: "Cortiplex B6", active: "Dexamethasone/Pyridoxine", route: "أقراص", dose: "قرص قبل النوم", category: "Anti-Emetics" },
    { tradeName: "Zofran 8mg", active: "Ondansetron", route: "أقراص", dose: "قرص قبل الأكل", category: "Anti-Emetics" },
    { tradeName: "Zofran 4mg", active: "Ondansetron", route: "أقراص", dose: "قرص قبل الأكل", category: "Anti-Emetics" },
    { tradeName: "Danset 10mg", active: "Domperidone", route: "أقراص", dose: "قرص قبل الأكل", category: "Anti-Emetics" },
    { tradeName: "Motinorm 10mg", active: "Domperidone", route: "أقراص", dose: "قرص قبل الأكل", category: "Anti-Emetics" },
    { tradeName: "Primperan 10mg", active: "Metoclopramide", route: "أقراص", dose: "قرص قبل الأكل", category: "Anti-Emetics" },
    { tradeName: "Maxolon 10mg", active: "Metoclopramide", route: "أقراص", dose: "قرص قبل الأكل", category: "Anti-Emetics" },
  ],

  "Hemostatics": [
    { tradeName: "Kapron 500mg", active: "Tranexamic Acid", route: "أقراص", dose: "قرصين كل 8 ساعات", category: "Hemostatics" },
    { tradeName: "Cyklokapron 500mg", active: "Tranexamic Acid", route: "أقراص", dose: "قرصين كل 8 ساعات", category: "Hemostatics" },
    { tradeName: "Haemostop 500mg", active: "Tranexamic Acid", route: "أقراص", dose: "قرصين كل 8 ساعات", category: "Hemostatics" },
    { tradeName: "Dicynone 250mg", active: "Ethamsylate", route: "أقراص", dose: "قرصين كل 8 ساعات", category: "Hemostatics" },
    { tradeName: "Methergine 0.2mg", active: "Methylergometrine", route: "أقراص", dose: "قرص كل 8 ساعات", category: "Hemostatics" },
  ],

  "Thyroid & Hormonal": [
    // Thyroid
    { tradeName: "Eltroxin 50mcg", active: "Levothyroxine", route: "أقراص", dose: "نصف قرص صباحاً", category: "Thyroid & Hormonal" },
    { tradeName: "Eltroxin 100mcg", active: "Levothyroxine", route: "أقراص", dose: "قرص صباحاً", category: "Thyroid & Hormonal" },
    { tradeName: "Euthyrox 50mcg", active: "Levothyroxine", route: "أقراص", dose: "نصف قرص صباحاً", category: "Thyroid & Hormonal" },
    { tradeName: "Euthyrox 100mcg", active: "Levothyroxine", route: "أقراص", dose: "قرص صباحاً", category: "Thyroid & Hormonal" },
    { tradeName: "Thyronorm 25mcg", active: "Levothyroxine", route: "أقراص", dose: "ربع قرص صباحاً", category: "Thyroid & Hormonal" },

    // Dopamine Agonists
    { tradeName: "Dostinex 0.5mg", active: "Cabergoline", route: "أقراص", dose: "نصف قرص كل 3 أيام", category: "Thyroid & Hormonal" },

    // Progestins
    { tradeName: "Primolut N 5mg", active: "Norethisterone", route: "أقراص", dose: "قرص مرتين يومياً", category: "Thyroid & Hormonal" },
    { tradeName: "Provera 10mg", active: "Medroxyprogesterone", route: "أقراص", dose: "قرص مرتين يومياً", category: "Thyroid & Hormonal" },

    // Venotonics
    { tradeName: "Daflon 500mg", active: "Diosmin", route: "أقراص", dose: "قرصين يومياً", category: "Thyroid & Hormonal" },
    { tradeName: "Reparil 20mg", active: "Aescin", route: "أقراص", dose: "قرص مرتين يومياً", category: "Thyroid & Hormonal" },
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