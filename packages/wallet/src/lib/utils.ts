import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

//class name merger
export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}
