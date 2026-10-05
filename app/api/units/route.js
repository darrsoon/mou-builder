import { getGoogleClients, jsonError } from "@/lib/google/client";
import { mapPlatformUnit } from "@/lib/units/map";
import { getUnit, searchUnits } from "@/lib/units/platform";

// Юнит с платформы: ?q=… — список для поиска, ?id=… — поля формы MOU.
// Только для вошедших через Google, как и остальные маршруты. Проект с PROJECTS
// сверяет форма — список проектов у неё уже загружен.
export async function GET(request) {
  try {
    await getGoogleClients();
    const params = new URL(request.url).searchParams;
    const id = params.get("id");
    if (!id) return Response.json({ ok: true, units: await searchUnits(params.get("q")) });

    const raw = await getUnit(id);
    if (!raw) return Response.json({ ok: false, error: "Юнит не найден на платформе." }, { status: 404 });
    return Response.json({ ok: true, ...mapPlatformUnit(raw) });
  } catch (error) {
    return jsonError(error);
  }
}
