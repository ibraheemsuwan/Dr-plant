import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, RouterProvider, createMemoryRouter } from "react-router";
import { LanguageProvider, useLanguage } from "../contexts/LanguageContext";
import { NotFound } from "../pages/NotFound/NotFound";
import { RouteError } from "../components/RouteError";
import { router } from "../routes";

function setBrowserLanguage(lang: string) {
  Object.defineProperty(window.navigator, "language", { value: lang, configurable: true });
}

function LanguageProbe() {
  const { language, toggleLanguage } = useLanguage();
  return (
    <button onClick={toggleLanguage} data-testid="probe">
      {language}
    </button>
  );
}

beforeEach(() => {
  localStorage.clear();
  document.documentElement.lang = "";
  setBrowserLanguage("en-US");
  window.scrollTo = vi.fn();
});

afterEach(() => cleanup());

describe("language", () => {
  it("follows an English browser by default", () => {
    render(<LanguageProvider><LanguageProbe /></LanguageProvider>);
    expect(screen.getByTestId("probe").textContent).toBe("en");
  });

  it("starts in Arabic for an Arabic browser (it used to be English for everyone)", () => {
    setBrowserLanguage("ar-PS");
    render(<LanguageProvider><LanguageProbe /></LanguageProvider>);
    expect(screen.getByTestId("probe").textContent).toBe("ar");
  });

  it("remembers the choice and tells the browser the page language", () => {
    const first = render(<LanguageProvider><LanguageProbe /></LanguageProvider>);
    fireEvent.click(screen.getByTestId("probe")); // en -> ar
    expect(screen.getByTestId("probe").textContent).toBe("ar");
    expect(localStorage.getItem("drplant_language")).toBe("ar");
    expect(document.documentElement.lang).toBe("ar");
    first.unmount();

    // a new visit (page reload) keeps Arabic even though the browser says English
    render(<LanguageProvider><LanguageProbe /></LanguageProvider>);
    expect(screen.getByTestId("probe").textContent).toBe("ar");
  });

  it("a saved choice beats the browser language", () => {
    localStorage.setItem("drplant_language", "en");
    setBrowserLanguage("ar-SA");
    render(<LanguageProvider><LanguageProbe /></LanguageProvider>);
    expect(screen.getByTestId("probe").textContent).toBe("en");
  });

  it("ignores a corrupted saved value", () => {
    localStorage.setItem("drplant_language", "klingon");
    render(<LanguageProvider><LanguageProbe /></LanguageProvider>);
    expect(screen.getByTestId("probe").textContent).toBe("en");
  });
});

describe("404 and error pages", () => {
  it("the 404 page offers a way home, in English and Arabic", () => {
    const view = render(
      <MemoryRouter><LanguageProvider><NotFound /></LanguageProvider></MemoryRouter>,
    );
    expect(screen.getByText("404")).toBeTruthy();
    expect(screen.getByRole("link", { name: /home/i }).getAttribute("href")).toBe("/");
    view.unmount();

    localStorage.setItem("drplant_language", "ar");
    render(<MemoryRouter><LanguageProvider><NotFound /></LanguageProvider></MemoryRouter>);
    expect(screen.getByText("هذه الصفحة غير موجودة")).toBeTruthy();
    expect(screen.getByRole("link", { name: "الصفحة الرئيسية" }).getAttribute("href")).toBe("/");
  });

  it("an address that does not exist inside the real site shows the 404 page", async () => {
    await router.navigate("/this-page-does-not-exist");
    render(<RouterProvider router={router} />);
    await waitFor(() => expect(screen.getByText("404")).toBeTruthy());
  });

  it("the crash screen stands alone and offers reload and home", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    // useRouteError needs a router context: render it as a route's error boundary
    
    const crashing = createMemoryRouter(
      [{ path: "/", Component: () => { throw new Error("boom"); }, ErrorBoundary: RouteError }],
      { initialEntries: ["/"] },
    );
    render(<RouterProvider router={crashing} />);
    expect(screen.getByRole("button", { name: /reload/i })).toBeTruthy();
    expect(screen.getByRole("link", { name: /home/i }).getAttribute("href")).toBe("/");
    spy.mockRestore();
  });
});
