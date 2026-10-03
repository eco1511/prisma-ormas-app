export async function updateMemberWithAccount<T>(deps: { saveAccount: () => Promise<void>; saveMember: () => Promise<T>; restoreAccount: () => Promise<void> }) {
  await deps.saveAccount();
  try { return await deps.saveMember(); }
  catch(error) { await deps.restoreAccount(); throw error; }
}
