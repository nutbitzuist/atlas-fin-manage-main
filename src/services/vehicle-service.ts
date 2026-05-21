import type { VehicleInsert, VehicleRow, VehicleUpdate } from "@/data/vehicle-queries";
import {
  createVehicleRaw,
  deleteVehicleByIdRaw,
  getVehiclesByUserRaw,
  updateVehicleRaw,
} from "@/data/vehicle-queries";

export type { VehicleInsert, VehicleRow, VehicleUpdate } from "@/data/vehicle-queries";

export async function getVehiclesByUser(userId: string): Promise<VehicleRow[]> {
  return getVehiclesByUserRaw(userId);
}

export async function createVehicle(vehicle: VehicleInsert): Promise<VehicleRow> {
  return createVehicleRaw(vehicle);
}

export async function updateVehicle(vehicleId: string, userId: string, updates: VehicleUpdate) {
  await updateVehicleRaw(vehicleId, userId, updates);
}

export async function deleteVehicleById(userId: string, vehicleId: string) {
  await deleteVehicleByIdRaw(userId, vehicleId);
}
