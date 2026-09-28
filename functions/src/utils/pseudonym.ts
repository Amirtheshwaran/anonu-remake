import * as crypto from 'crypto';
import { ADJECTIVES, ANIMALS } from '../constants';

const DEFAULT_SALT = 'anonu_campus_secure_salt_77a9';

export function generatePostPseudonym(uid: string, postId: string, secretSalt?: string): string {
  const salt = secretSalt || process.env.PSEUDONYM_SALT || DEFAULT_SALT;
  const hmac = crypto.createHmac('sha256', salt);
  hmac.update(`${uid}:${postId}`);
  const digest = hmac.digest();

  const adjIndex = digest.readUInt32BE(0) % ADJECTIVES.length;
  const animalIndex = digest.readUInt32BE(4) % ANIMALS.length;

  return `${ADJECTIVES[adjIndex]} ${ANIMALS[animalIndex]}`;
}

export function generatePermanentPseudonym(uid: string, secretSalt?: string): string {
  const salt = secretSalt || process.env.PSEUDONYM_SALT || DEFAULT_SALT;
  const hmac = crypto.createHmac('sha256', salt);
  hmac.update(`user_permanent:${uid}`);
  const digest = hmac.digest();

  const adjIndex = digest.readUInt32BE(0) % ADJECTIVES.length;
  const animalIndex = digest.readUInt32BE(4) % ANIMALS.length;

  return `${ADJECTIVES[adjIndex]} ${ANIMALS[animalIndex]}`;
}
