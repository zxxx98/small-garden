import * as Crypto from 'expo-crypto';

export function generateId(length = 21)
{
    const bytes = Crypto.getRandomBytes(length);
    return Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
        .slice(0, length);
}