/** Evaluate one camera's latest samples against notification thresholds */

export const defaultNotificationPrefs = {
  alertsEnabled: true,
  latencyEnabled: true,
  objectsEnabled: true,
  personsEnabled: true,
  latencyWarnMs: 300,
  latencyCriticalMs: 600,
  objectsWarn: 10,
  objectsCritical: 24,
  personsWarn: 2,
  personsCritical: 5,
}

export function evaluateStreamAlerts(tabData, prefs) {
  const p = { ...defaultNotificationPrefs, ...prefs }
  const list = []
  if (!tabData || !p.alertsEnabled) return list

  const lat = tabData.latencyData?.at(-1)?.latency
  if (p.latencyEnabled && Number.isFinite(lat)) {
    if (lat >= p.latencyCriticalMs) {
      list.push({ type: "latency", severity: "critical", value: lat, message: `Latency ${Math.round(lat)}ms (critical)` })
    } else if (lat >= p.latencyWarnMs) {
      list.push({ type: "latency", severity: "warn", value: lat, message: `Latency ${Math.round(lat)}ms (warn)` })
    }
  }

  const cnt = tabData.tableData?.at(-1)?.count
  if (p.objectsEnabled && Number.isFinite(cnt)) {
    if (cnt >= p.objectsCritical) {
      list.push({ type: "objects", severity: "critical", value: cnt, message: `Objects ${cnt} (critical)` })
    } else if (cnt >= p.objectsWarn) {
      list.push({ type: "objects", severity: "warn", value: cnt, message: `Objects ${cnt} (warn)` })
    }
  }

  const persons = tabData.personCountData?.at(-1)?.count
  if (p.personsEnabled && Number.isFinite(persons)) {
    if (persons >= p.personsCritical) {
      list.push({ type: "persons", severity: "critical", value: persons, message: `People in frame ${persons} (critical)` })
    } else if (persons >= p.personsWarn) {
      list.push({ type: "persons", severity: "warn", value: persons, message: `People in frame ${persons} (warn)` })
    }
  }

  return list
}

export function collectAllStreamAlerts(cameraData, prefs) {
  const out = []
  for (const [camId, data] of Object.entries(cameraData || {})) {
    for (const a of evaluateStreamAlerts(data, prefs)) {
      out.push({ ...a, camId })
    }
  }
  return out
}
