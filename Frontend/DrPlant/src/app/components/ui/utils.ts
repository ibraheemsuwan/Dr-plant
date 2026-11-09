import { twMerge } from "tailwind-merge";

/** أنواع مدخلات مشابهة لـ clsx (بدون حزمة clsx) */
export type ClassValue =
  | ClassArray
  | ClassDictionary
  | string
  | number
  | bigint
  | null
  | boolean
  | undefined;
type ClassDictionary = Record<string, unknown>;
type ClassArray = ClassValue[];

function toVal(mix: ClassValue): string {
  let str = "";
  if (typeof mix === "string" || typeof mix === "number") {
    str += mix;
  } else if (typeof mix === "object" && mix !== null) {
    if (Array.isArray(mix)) {
      for (const item of mix) {
        if (item) {
          const y = toVal(item);
          if (y) {
            str && (str += " ");
            str += y;
          }
        }
      }
    } else {
      for (const k of Object.keys(mix as ClassDictionary)) {
        if ((mix as ClassDictionary)[k]) {
          str && (str += " ");
          str += k;
        }
      }
    }
  }
  return str;
}

function clsxLite(...inputs: ClassValue[]): string {
  let str = "";
  for (const input of inputs) {
    const tmp = toVal(input);
    if (tmp) {
      str && (str += " ");
      str += tmp;
    }
  }
  return str;
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsxLite(...inputs));
}
