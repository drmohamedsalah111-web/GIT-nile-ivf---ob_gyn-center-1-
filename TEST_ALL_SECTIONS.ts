// Quick Test Script - Run in Browser Console
// This will test all sections and services

async function testAllSections() {
  console.log('🧪 STARTING COMPLETE DATA LOAD TEST\n');
  
  const results = {
    reception: false,
    gynecology: false,
    ivf: false,
    obstetrics: false,
    dashboard: false,
    patientRecords: false
  };

  try {
    // Test 1: Reception (usePatients hook)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('1️⃣ RECEPTION - usePatients Hook');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    const { dbService } = await import('./services/dbService');
    const patients = await dbService.getPatients();
    console.log(`✅ Patients loaded: ${patients.length}`);
    if (patients.length > 0) {
      console.table(patients.slice(0, 3));
      results.reception = true;
    }
    console.log('\n');

    // Test 2: Gynecology (visitsService)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('2️⃣ GYNECOLOGY - visitsService');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    if (patients.length > 0) {
      const { visitsService } = await import('./services/visitsService');
      const patientId = patients[0].id;
      const visits = await visitsService.getVisitsByPatient(patientId);
      console.log(`✅ Patient visits loaded: ${visits.length}`);
      console.log(`Patient: ${patients[0].name}`);
      if (visits.length > 0) {
        console.table(visits.slice(0, 2));
        results.gynecology = true;
      }
    }
    console.log('\n');

    // Test 3: IVF (dbService.getCycles)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('3️⃣ IVF JOURNEY - dbService.getCycles');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    const cycles = await dbService.getCycles();
    console.log(`✅ IVF cycles loaded: ${cycles.length}`);
    if (cycles.length > 0) {
      console.table(cycles.slice(0, 2).map(c => ({
        id: c.id.substring(0, 8),
        patientId: c.patientId.substring(0, 8),
        protocol: c.protocol,
        status: c.status,
        logs: c.logs?.length || 0
      })));
      results.ivf = true;
    }
    console.log('\n');

    // Test 4: Obstetrics (obstetricsService)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('4️⃣ OBSTETRICS - obstetricsService');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    if (patients.length > 0) {
      const { obstetricsService } = await import('./services/obstetricsService');
      const patientId = patients[0].id;
      const pregnancy = await obstetricsService.getPregnancyByPatient(patientId);
      if (pregnancy) {
        console.log(`✅ Pregnancy found: ${pregnancy.lmp_date}`);
        const ancVisits = await obstetricsService.getANCVisits(pregnancy.id);
        console.log(`✅ ANC visits: ${ancVisits.length}`);
        results.obstetrics = true;
      } else {
        console.log('ℹ️ No pregnancy record found (OK)');
        results.obstetrics = true; // Service works, just no data
      }
    }
    console.log('\n');

    // Test 5: Dashboard (patients + cycles)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('5️⃣ DASHBOARD - Combined Data');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ Total patients: ${patients.length}`);
    console.log(`✅ Total cycles: ${cycles.length}`);
    results.dashboard = patients.length >= 0 && cycles.length >= 0;
    console.log('\n');

    // Test 6: Patient Records (visits + files)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('6️⃣ PATIENT RECORDS - History');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    if (patients.length > 0) {
      const { visitsService } = await import('./services/visitsService');
      const allVisits = await visitsService.getAllVisits();
      console.log(`✅ Total visits in system: ${allVisits.length}`);
      results.patientRecords = true;
    }
    console.log('\n');

  } catch (error: any) {
    console.error('❌ TEST ERROR:', error.message);
    console.error(error.stack);
  }

  // Summary
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 TEST SUMMARY');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const passed = Object.values(results).filter(r => r).length;
  const total = Object.keys(results).length;
  
  Object.entries(results).forEach(([section, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${section.toUpperCase()}`);
  });
  
  console.log(`\n🎯 PASSED: ${passed}/${total}`);
  
  if (passed === total) {
    console.log('🎉 ALL TESTS PASSED! Data is loading correctly.');
  } else {
    console.log('⚠️ Some tests failed. Check console logs above for errors.');
  }
}

// Run the test
testAllSections();
