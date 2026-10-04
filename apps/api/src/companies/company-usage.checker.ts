export const COMPANY_USAGE_CHECKERS = Symbol('COMPANY_USAGE_CHECKERS');

/**
 * Spec 2.8.4 — a company may only be deleted when nothing references it.
 * Modules added later (Locations, Animals, …) register a checker here instead
 * of CompaniesService having to know about them.
 */
export interface CompanyUsageChecker {
  /** Module name, used in diagnostics. */
  label: string;
  countForCompany(companyId: string): Promise<number>;
}
