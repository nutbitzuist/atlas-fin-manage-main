import type {
  InsurancePolicyInsert,
  InsurancePolicyQueryOptions,
  InsurancePolicyRow,
  InsurancePolicyUpdate,
  InsuranceStatus,
} from "@/data/insurance-queries";
import {
  createInsurancePolicyRaw,
  deleteInsurancePolicyRaw,
  getInsurancePoliciesByUserRaw,
  getLatestInsurancePolicyByUserRaw,
  updateInsurancePolicyRaw,
} from "@/data/insurance-queries";

export type {
  InsurancePolicyInsert,
  InsurancePolicyQueryOptions,
  InsurancePolicyRow,
  InsurancePolicyUpdate,
  InsuranceStatus,
} from "@/data/insurance-queries";

export async function getInsurancePoliciesByUser(
  userId: string,
  options: InsurancePolicyQueryOptions = {},
) {
  return getInsurancePoliciesByUserRaw(userId, options);
}

export async function getLatestInsurancePolicyByUser(userId: string) {
  return getLatestInsurancePolicyByUserRaw(userId);
}

export async function createInsurancePolicy(policy: InsurancePolicyInsert): Promise<InsurancePolicyRow> {
  return createInsurancePolicyRaw(policy);
}

export async function updateInsurancePolicy(
  policyId: string,
  userId: string,
  updates: InsurancePolicyUpdate,
) {
  return updateInsurancePolicyRaw(policyId, userId, updates);
}

export async function deleteInsurancePolicy(policyId: string, userId: string) {
  return deleteInsurancePolicyRaw(policyId, userId);
}
