export function uid(): string {
  return Math.random().toString(36).substr(2, 9);
}

export function groupCode(): string {
  return Math.random().toString(36).substr(2, 6).toUpperCase();
}

export function getInitials(name: string): string {
  return name.slice(0, 2).toUpperCase();
}
