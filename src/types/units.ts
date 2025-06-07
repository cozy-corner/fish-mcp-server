// 単位を型で表現（コンパイル時の安全性）
export type Centimeters = number & { readonly __unit: 'cm' };
export type Grams = number & { readonly __unit: 'g' };
export type Meters = number & { readonly __unit: 'm' };

// 型安全なコンストラクタ関数
export const cm = (value: number): Centimeters => value as Centimeters;
export const g = (value: number): Grams => value as Grams;
export const m = (value: number): Meters => value as Meters;

// 型安全な変換関数
export const cmToM = (centimeters: Centimeters): Meters => m(centimeters / 100);

export const gToKg = (grams: Grams): number => grams / 1000;
