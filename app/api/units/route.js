import { getGoogleClients, jsonError } from "@/lib/google/client";
import { fetchPlatformUnits } from "@/lib/mou/units";

// Юниты проекта с платформы (через AutoPost, только чтение) — для автозаполнения Property.
// Только для вошедших: getGoogleClients проверяет сессию. Сбой AutoPost — пустой список, не ошибка.
export async function GET(request) {
  try {
    await getGoogleClients();
    const project = new URL(request.url).searchParams.get("project") || "";
    const units = await fetchPlatformUnits(project).catch(() => []);
    return Response.json({ ok: true, units });
  } catch (error) {
    return jsonError(error);
  }
}
