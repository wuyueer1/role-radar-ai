"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { CareerMap } from "./components/CareerMap";
import { DetailDrawer } from "./components/DetailDrawer";
import { ModeDialog } from "./components/ModeDialog";
import { ProfilePanel } from "./components/ProfilePanel";
import { RoutePanel } from "./components/RoutePanel";
import { TourOverlay } from "./components/TourOverlay";
import {
  DEFAULT_WEIGHTS,
  PRESET_WEIGHTS,
  enrichRoutes,
  explainScenario,
  rankRoutes,
  rebalanceWeights,
} from "./lib/career-engine.ts";
import { dataset } from "./lib/career-data.ts";
import type {
  ScoreKey,
  Weights,
} from "./lib/career-data.ts";

type PresetName = keyof typeof PRESET_WEIGHTS;

const PRESET_LABELS: Record<PresetName, string> = {
  fastest: "最快进入 AI",
  technical: "最大化技术深度",
  business: "发挥商业优势",
};

export function CareerGraphApp() {
  const [weights, setWeights] = useState<Weights>(DEFAULT_WEIGHTS);
  const [horizonMonths, setHorizonMonths] = useState(6);
  const [scenarioLabel, setScenarioLabel] = useState("推荐权重");
  const [selectedRouteId, setSelectedRouteId] = useState(
    "route-ai-product",
  );
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [drawerRouteId, setDrawerRouteId] = useState<string | null>(null);
  const [modeOpen, setModeOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);
  const [tourTarget, setTourTarget] = useState("profile");
  const appRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  const baselineRoutes = useMemo(
    () => rankRoutes(dataset, DEFAULT_WEIGHTS, 6),
    [],
  );

  const routes = useMemo(
    () => {
      const currentRoutes = enrichRoutes(
        dataset,
        rankRoutes(dataset, weights, horizonMonths),
      );
      return currentRoutes.map((route, index) => {
        const previousRoute = baselineRoutes.find(
          (item) => item.id === route.id,
        );
        return {
        ...route,
        changeReason: explainScenario(
          route,
          previousRoute,
          scenarioLabel,
          weights,
          DEFAULT_WEIGHTS,
          index + 1,
          previousRoute ? baselineRoutes.indexOf(previousRoute) + 1 : undefined,
        ),
        };
      });
    },
    [baselineRoutes, horizonMonths, scenarioLabel, weights],
  );

  const drawerRoute = drawerRouteId
    ? routes.find((route) => route.id === drawerRouteId)
    : undefined;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === "Escape" &&
        selectedRoleId &&
        !drawerRouteId &&
        !modeOpen &&
        !tourOpen
      ) {
        setSelectedRoleId(null);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [drawerRouteId, modeOpen, selectedRoleId, tourOpen]);

  useEffect(() => {
    document.body.style.overflow =
      drawerRoute || modeOpen || tourOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerRoute, modeOpen, tourOpen]);

  useEffect(() => {
    appRef.current?.setAttribute("data-app-ready", "true");
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }
  }, []);

  function setPreset(preset: PresetName) {
    setWeights(PRESET_WEIGHTS[preset]);
    setScenarioLabel(PRESET_LABELS[preset]);
  }

  function setCustomWeight(key: ScoreKey, value: number) {
    setWeights((current) => rebalanceWeights(current, key, value));
    setScenarioLabel("自定义权重");
  }

  function resetWeights() {
    setWeights(DEFAULT_WEIGHTS);
    setHorizonMonths(6);
    setScenarioLabel("推荐权重");
  }

  function openDrawer(routeId: string) {
    returnFocusRef.current = document.activeElement as HTMLElement;
    setSelectedRouteId(routeId);
    setDrawerRouteId(routeId);
  }

  function closeDrawer() {
    setDrawerRouteId(null);
    requestAnimationFrame(() => returnFocusRef.current?.focus());
  }

  function startTour() {
    setTourTarget("profile");
    setTourOpen(true);
  }

  function updateTourTarget(target: string) {
    setTourTarget(target);
    setDrawerRouteId(null);
  }

  function closeTour() {
    setTourOpen(false);
    setTourTarget("profile");
    setDrawerRouteId(null);
  }

  return (
    <div
      ref={appRef}
      className={`app-shell${tourOpen ? " tour-is-open" : ""}`}
      data-app-ready="false"
      data-tour-focus={tourOpen ? tourTarget : undefined}
    >
      <div
        className="app-content"
        data-testid="app-content"
        inert={drawerRoute || modeOpen || tourOpen ? true : undefined}
        aria-hidden={drawerRoute || modeOpen || tourOpen ? true : undefined}
      >
        <a className="skip-link" href="#main-content">
          跳到主要内容
        </a>

        <header className="app-header">
          <div>
            <p className="eyebrow">Career intelligence / curated demo</p>
            <h1>
              CareerGraph <span>AI</span>
            </h1>
            <p className="promise">看见、比较并质疑 AI 的职业决策依据。</p>
          </div>
          <div className="header-actions">
            <button
              className="mode-pill"
              type="button"
              onClick={() => setModeOpen(true)}
            >
              ● 稳定演示
            </button>
            <button
              className="primary-button"
              type="button"
              onClick={startTour}
            >
              开始三分钟讲解
            </button>
          </div>
        </header>

        <main className="workspace" id="main-content">
          <ProfilePanel
            profile={dataset.profile}
            skills={dataset.skills}
            weights={weights}
            horizonMonths={horizonMonths}
            onWeightChange={setCustomWeight}
            onPreset={setPreset}
            onReset={resetWeights}
            onHorizonChange={(months) => {
              setHorizonMonths(months);
              setScenarioLabel(`${months} 个月窗口`);
            }}
          />
          <CareerMap
            roles={dataset.roles}
            transitions={dataset.transitions}
            routes={dataset.routes}
            selectedRoleId={selectedRoleId}
            onSelectRole={setSelectedRoleId}
          />
          <RoutePanel
            routes={routes}
            selectedRouteId={selectedRouteId}
            selectedRoleId={selectedRoleId}
            selectedRole={
              selectedRoleId
                ? dataset.roles.find((role) => role.id === selectedRoleId)
                : undefined
            }
            profile={dataset.profile}
            skills={dataset.skills}
            onSelectRoute={setSelectedRouteId}
            onOpenDetails={openDrawer}
          />
        </main>

        <footer className="app-footer">
          <p>
            Curated portfolio dataset <span aria-hidden="true">·</span> 不是实时招聘预测
          </p>
          <p>本地图谱 + 确定性评分 + 可选 Live AI</p>
        </footer>
      </div>

      {drawerRoute && (
        <DetailDrawer
          route={drawerRoute}
          profile={dataset.profile}
          skills={dataset.skills}
          weights={weights}
          onClose={closeDrawer}
        />
      )}
      {modeOpen && <ModeDialog onClose={() => setModeOpen(false)} />}
      {tourOpen && (
        <TourOverlay
          onClose={closeTour}
          onStepChange={updateTourTarget}
        />
      )}
    </div>
  );
}
