import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const uid = process.argv[2];
const projectId = process.env.GOOGLE_CLOUD_PROJECT;

if (!uid || !projectId) {
  console.error('Uso: GOOGLE_CLOUD_PROJECT=<firebase-project-id> npm run set-admin -- <firebase-auth-uid>');
  process.exit(1);
}

initializeApp({ credential: applicationDefault(), projectId });
const auth = getAuth();
const user = await auth.getUser(uid);
await auth.setCustomUserClaims(uid, { ...user.customClaims, admin: true });
console.log(`Permissão administrativa ativada para ${user.email || uid}. Faça logout e entre novamente no Ritmma.`);
