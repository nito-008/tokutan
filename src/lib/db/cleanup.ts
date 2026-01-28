import { db } from "./index";

export async function clearRequirements(): Promise<void> {
  await db.requirements.clear();
}
