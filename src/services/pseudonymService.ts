import { AnonUConstants } from '../constants/config';
import { AnonUTheme } from '../constants/theme';

export class PseudonymService {
  private static readonly palette = [
    AnonUTheme.popYellow,
    AnonUTheme.popMint,
    AnonUTheme.popPink,
    AnonUTheme.popCyan,
    AnonUTheme.popOrange,
    AnonUTheme.popPurple,
  ];

  static generateRandomPreview(): string {
    const adjs = AnonUConstants.adjectives;
    const animals = AnonUConstants.animals;
    const adj = adjs[Math.floor(Math.random() * adjs.length)];
    const animal = animals[Math.floor(Math.random() * animals.length)];
    return `${adj} ${animal}`;
  }

  static colorForPseudonym(pseudonym: string): string {
    let hash = 0;
    for (let i = 0; i < pseudonym.length; i++) {
      hash = (hash << 5) - hash + pseudonym.charCodeAt(i);
      hash |= 0;
    }
    const idx = Math.abs(hash) % this.palette.length;
    return this.palette[idx];
  }
}
