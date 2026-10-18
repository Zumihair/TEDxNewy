// Passwords for sign-ins we hand out: fruit-COLOUR-## (for example mango-TEAL-47). Easy to say, easy to type.

const FRUIT = ["mango", "apple", "pear", "peach", "plum", "lemon", "lime", "fig", "kiwi", "grape", "cherry", "melon", "guava", "papaya", "banana", "orange", "apricot", "quince", "lychee", "pomelo", "nashi", "berry", "date", "olive", "tamarillo", "persimmon", "mandarin", "nectarine", "pineapple", "coconut"];
const COLOUR = ["RED", "BLUE", "GREEN", "TEAL", "AMBER", "CORAL", "IVORY", "PLUM", "LILAC", "OCHRE", "SAGE", "SKY", "NAVY", "RUBY", "SAND", "SLATE", "GOLD", "MINT", "ROSE", "RUST"];

function below(n: number): number {
  const a = new Uint32Array(1);
  globalThis.crypto.getRandomValues(a);
  return a[0] % n;
}

export function passwordPhrase(): string {
  return `${FRUIT[below(FRUIT.length)]}-${COLOUR[below(COLOUR.length)]}-${10 + below(90)}`;
}
