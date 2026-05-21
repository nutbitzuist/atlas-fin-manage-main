import type { AssetInsert, AssetRow } from "@/data/asset-queries";
import { createAssetRaw } from "@/data/asset-queries";

export type { AssetInsert, AssetRow } from "@/data/asset-queries";

export async function createAsset(asset: AssetInsert): Promise<AssetRow> {
  return createAssetRaw(asset);
}
