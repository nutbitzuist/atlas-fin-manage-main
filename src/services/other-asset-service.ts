import type { OtherAssetInsert, OtherAssetRow, OtherAssetUpdate } from "@/data/other-asset-queries";
import {
  createOtherAssetRaw,
  deleteOtherAssetByIdRaw,
  getOtherAssetsByUserRaw,
  updateOtherAssetRaw,
} from "@/data/other-asset-queries";

export type { OtherAssetInsert, OtherAssetRow, OtherAssetUpdate } from "@/data/other-asset-queries";

export async function getOtherAssetsByUser(userId: string): Promise<OtherAssetRow[]> {
  return getOtherAssetsByUserRaw(userId);
}

export async function createOtherAsset(asset: OtherAssetInsert): Promise<OtherAssetRow> {
  return createOtherAssetRaw(asset);
}

export async function updateOtherAsset(assetId: string, userId: string, updates: OtherAssetUpdate) {
  await updateOtherAssetRaw(assetId, userId, updates);
}

export async function deleteOtherAssetById(userId: string, assetId: string) {
  await deleteOtherAssetByIdRaw(userId, assetId);
}
