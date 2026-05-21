import type { CreditCardInsert, CreditCardRow, CreditCardUpdate } from "@/data/credit-card-queries";
import {
  createCreditCardRaw,
  deleteCreditCardByIdRaw,
  getCreditCardsByUserRaw,
  updateCreditCardRaw,
} from "@/data/credit-card-queries";

export type { CreditCardInsert, CreditCardRow, CreditCardUpdate } from "@/data/credit-card-queries";

export async function getCreditCardsByUser(userId: string): Promise<CreditCardRow[]> {
  return getCreditCardsByUserRaw(userId);
}

export async function createCreditCard(card: CreditCardInsert): Promise<CreditCardRow> {
  return createCreditCardRaw(card);
}

export async function updateCreditCard(cardId: string, userId: string, updates: CreditCardUpdate) {
  await updateCreditCardRaw(cardId, userId, updates);
}

export async function deleteCreditCardById(userId: string, cardId: string) {
  await deleteCreditCardByIdRaw(userId, cardId);
}
