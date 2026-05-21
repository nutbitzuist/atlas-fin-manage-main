import type { RealEstateInsert, RealEstateRow, RealEstateUpdate } from "@/data/real-estate-queries";
import {
  createRealEstateRaw,
  deleteRealEstateByIdRaw,
  getRealEstateByUserRaw,
  updateRealEstateRaw,
} from "@/data/real-estate-queries";

export type { RealEstateInsert, RealEstateRow, RealEstateUpdate } from "@/data/real-estate-queries";

export async function getRealEstateByUser(userId: string): Promise<RealEstateRow[]> {
  return getRealEstateByUserRaw(userId);
}

export async function createRealEstate(property: RealEstateInsert): Promise<RealEstateRow> {
  return createRealEstateRaw(property);
}

export async function updateRealEstate(propertyId: string, userId: string, updates: RealEstateUpdate) {
  await updateRealEstateRaw(propertyId, userId, updates);
}

export async function deleteRealEstateById(userId: string, propertyId: string) {
  await deleteRealEstateByIdRaw(userId, propertyId);
}
