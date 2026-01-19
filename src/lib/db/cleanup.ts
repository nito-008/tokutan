import { db } from "./index";

export async function clearUserData(): Promise<void> {
  await db.transaction(
    "rw",
    [db.profiles, db.enrollment, db.coursePlans, db.requirements],
    async () => {
      await db.profiles.clear();
      await db.enrollment.clear();
      await db.coursePlans.clear();
      await db.requirements.clear();
    },
  );
}
