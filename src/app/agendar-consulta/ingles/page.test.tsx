import { expect, it, vi } from "vitest";

const { permanentRedirect } = vi.hoisted(() => ({
  permanentRedirect: vi.fn(),
}));

vi.mock("next/navigation", () => ({ permanentRedirect }));

import LegacyEnglishTeacherPage from "./page";

it("redireciona a rota antiga de ingles para Professor", () => {
  LegacyEnglishTeacherPage();

  expect(permanentRedirect).toHaveBeenCalledWith(
    "/agendar-consulta/professor",
  );
});
