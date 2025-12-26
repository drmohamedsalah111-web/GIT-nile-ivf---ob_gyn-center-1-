/**
 * useFinancial.ts
 * Custom React hooks for Financial System
 */

import { useState, useEffect } from 'react';
import {
  servicesAPI,
  packagesAPI,
  casesAPI,
  installmentsAPI,
  invoicesAPI,
  Service,
  Package,
  FinancialCase,
  Installment,
  Invoice,
} from '../services/financialService';

// ============================================================
// SERVICES HOOK
// ============================================================

export const useServices = (clinicId: string, includeInactive = false) => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchServices = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await servicesAPI.getServices(clinicId, includeInactive);
      setServices(data);
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (clinicId) {
      fetchServices();
    }
  }, [clinicId, includeInactive]);

  const createService = async (service: Partial<Service>) => {
    const newService = await servicesAPI.createService(service);
    setServices([...services, newService]);
    return newService;
  };

  const updateService = async (id: string, updates: Partial<Service>) => {
    const updated = await servicesAPI.updateService(id, updates);
    setServices(services.map((s) => (s.id === id ? updated : s)));
    return updated;
  };

  const deleteService = async (id: string) => {
    await servicesAPI.deleteService(id);
    setServices(services.map((s) => (s.id === id ? { ...s, is_active: false } : s)));
  };

  return {
    services,
    loading,
    error,
    refresh: fetchServices,
    createService,
    updateService,
    deleteService,
  };
};

// ============================================================
// PACKAGES HOOK
// ============================================================

export const usePackages = (clinicId: string, includeInactive = false) => {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await packagesAPI.getPackages(clinicId, includeInactive);
      setPackages(data);
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (clinicId) {
      fetchPackages();
    }
  }, [clinicId, includeInactive]);

  const createPackage = async (pkg: Partial<Package>) => {
    const newPackage = await packagesAPI.createPackage(pkg);
    setPackages([...packages, newPackage]);
    return newPackage;
  };

  const updatePackage = async (id: string, updates: Partial<Package>) => {
    const updated = await packagesAPI.updatePackage(id, updates);
    setPackages(packages.map((p) => (p.id === id ? updated : p)));
    return updated;
  };

  return {
    packages,
    loading,
    error,
    refresh: fetchPackages,
    createPackage,
    updatePackage,
  };
};

// ============================================================
// FINANCIAL CASES HOOK
// ============================================================

export const usePatientCases = (patientId: string | null) => {
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchCases = async () => {
    if (!patientId) {
      setCases([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await casesAPI.getPatientCases(patientId);
      setCases(data);
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, [patientId]);

  const createCase = async (caseData: Partial<FinancialCase>) => {
    const newCase = await casesAPI.createCase(caseData);
    setCases([newCase, ...cases]);
    return newCase;
  };

  const updateCase = async (caseId: string, updates: Partial<FinancialCase>) => {
    const updated = await casesAPI.updateCase(caseId, updates);
    setCases(cases.map((c) => (c.id === caseId ? updated : c)));
    return updated;
  };

  return {
    cases,
    loading,
    error,
    refresh: fetchCases,
    createCase,
    updateCase,
  };
};

// ============================================================
// INSTALLMENTS HOOK
// ============================================================

export const useCaseInstallments = (caseId: string | null) => {
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchInstallments = async () => {
    if (!caseId) {
      setInstallments([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await installmentsAPI.getCaseInstallments(caseId);
      setInstallments(data);
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstallments();
  }, [caseId]);

  const createInstallments = async (installmentsList: Partial<Installment>[]) => {
    const newInstallments = await installmentsAPI.createInstallments(installmentsList);
    setInstallments([...installments, ...newInstallments]);
    return newInstallments;
  };

  const markAsPaid = async (
    installmentId: string,
    paymentMethod: string,
    invoiceId?: string
  ) => {
    const updated = await installmentsAPI.markAsPaid(installmentId, paymentMethod, invoiceId);
    setInstallments(installments.map((i) => (i.id === installmentId ? updated : i)));
    return updated;
  };

  return {
    installments,
    loading,
    error,
    refresh: fetchInstallments,
    createInstallments,
    markAsPaid,
  };
};

// ============================================================
// INVOICES HOOK
// ============================================================

export const useInvoices = (
  clinicId: string,
  startDate?: string,
  endDate?: string,
  status?: string
) => {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await invoicesAPI.getInvoices(clinicId, startDate, endDate, status);
      setInvoices(data);
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (clinicId) {
      fetchInvoices();
    }
  }, [clinicId, startDate, endDate, status]);

  return {
    invoices,
    loading,
    error,
    refresh: fetchInvoices,
  };
};

// ============================================================
// DAILY REVENUE HOOK
// ============================================================

export const useDailyRevenue = (clinicId: string, date: string) => {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await invoicesAPI.getDailyRevenue(clinicId, date);
      setSummary(data);
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (clinicId && date) {
      fetchSummary();
    }
  }, [clinicId, date]);

  return {
    summary,
    loading,
    error,
    refresh: fetchSummary,
  };
};

// ============================================================
// OVERDUE INSTALLMENTS HOOK
// ============================================================

export const useOverdueInstallments = (clinicId: string) => {
  const [overdueInstallments, setOverdueInstallments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchOverdue = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await installmentsAPI.getOverdueInstallments(clinicId);
      setOverdueInstallments(data);
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (clinicId) {
      fetchOverdue();
    }
  }, [clinicId]);

  return {
    overdueInstallments,
    count: overdueInstallments.length,
    loading,
    error,
    refresh: fetchOverdue,
  };
};

// ============================================================
// OPEN CASES HOOK (For Clinic Dashboard)
// ============================================================

export const useOpenCases = (clinicId: string) => {
  const [openCases, setOpenCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchOpenCases = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await casesAPI.getOpenCases(clinicId);
      setOpenCases(data);
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (clinicId) {
      fetchOpenCases();
    }
  }, [clinicId]);

  const totalOutstanding = openCases.reduce(
    (sum, c) => sum + (c.remaining_amount || 0),
    0
  );

  return {
    openCases,
    count: openCases.length,
    totalOutstanding,
    loading,
    error,
    refresh: fetchOpenCases,
  };
};

// ============================================================
// INVOICE DETAILS HOOK
// ============================================================

export const useInvoiceDetails = (invoiceId: string | null) => {
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchInvoice = async () => {
    if (!invoiceId) {
      setInvoice(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await invoicesAPI.getInvoiceDetails(invoiceId);
      setInvoice(data);
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoice();
  }, [invoiceId]);

  return {
    invoice,
    loading,
    error,
    refresh: fetchInvoice,
  };
};

export default {
  useServices,
  usePackages,
  usePatientCases,
  useCaseInstallments,
  useInvoices,
  useDailyRevenue,
  useOverdueInstallments,
  useOpenCases,
  useInvoiceDetails,
};
