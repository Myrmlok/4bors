export function formatPrice(value: number | null | undefined): string {
  if (value == null) return "—";
  return `${value.toLocaleString("ru-RU")} ₽`;
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso.includes("T") ? iso : iso.replace(" ", "T") + "Z");
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function apiErrorMessage(e: unknown, fallback: string): string {
  const data = (e as any)?.data;
  if (data && typeof data.error === "string") return data.error;
  return fallback;
}

export const ROLE_LABELS: Record<string, string> = {
  admin: "Администратор",
  dealer: "Дилер",
  collector: "Коллекционер",
};

export const LOT_STATUS_LABELS: Record<string, string> = {
  active: "Активен",
  sold: "Продан",
  blitzed: "Блиц",
  expired: "Завершён",
  hidden: "Скрыт",
};
