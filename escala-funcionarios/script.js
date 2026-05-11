const STORAGE_KEY = "escalaFuncionarios.v8";
const storeName = "Kopenhagen Tacaruna";
const weekDays = ["segunda-feira", "terca-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sabado", "domingo"];
const employees = [
  { id: "allan", name: "Allan Silva", shortName: "Allan", role: "Atendente de Loja", sundayStreak: 0 },
  { id: "rayanne", name: "Rayanne Alves", shortName: "Rayanne", role: "Atendente de Loja", sundayStreak: 2 },
  { id: "jonatan", name: "Jonatan Samuel", shortName: "Jonatan Samuel", role: "Atendente de Loja", sundayStreak: 0 },
  { id: "ana", name: "Ana Beatriz", shortName: "Ana Beatriz", role: "Atendente de Loja", sundayStreak: 0 },
];
const baseShiftsByEmployee = {
  ana: { start: "14:00", end: "22:00", breakStart: "17:00", breakEnd: "18:00" },
  allan: { start: "14:00", end: "22:00", breakStart: "18:00", breakEnd: "19:00" },
  jonatan: { start: "12:00", end: "20:00", breakStart: "16:00", breakEnd: "17:00" },
  rayanne: { start: "10:00", end: "18:00", breakStart: "14:00", breakEnd: "15:00" },
};
const preferredWeeklyOffDays = {
  rayanne: 0,
  ana: 3,
  allan: 2,
  jonatan: 4,
};
const sundayOffCycleStart = "2026-05-03";
const sundayOffCycle = ["allan", "rayanne", "jonatan", "ana"];
const officialHolidays = {
  "2026-03-06": "Data Magna",
  "2026-04-03": "Sexta Feira da Paixao",
  "2026-04-21": "Tiradentes",
  "2026-05-01": "Dia do Trabalhador",
  "2026-06-24": "Sao Joao",
  "2026-07-16": "Nossa Senhora do Carmo",
  "2026-09-07": "Independencia do Brasil",
  "2026-10-12": "Nossa Senhora Aparecida",
  "2026-10-19": "Dia do Comerciario",
  "2026-11-02": "Finados",
  "2026-11-15": "Proclamacao da Republica",
  "2026-11-20": "Dia de Zumbi e da Consciencia Negra",
  "2026-12-08": "Nossa Senhora da Conceicao",
  "2026-12-25": "Natal",
};
const fixedOffRules = {
  "2026-05-03": {
    employeeId: "allan",
    note: "FOLGA - 03 Domingos",
  },
  "2026-05-06": {
    employeeId: "allan",
    note: "FOLGA - Feriado 03/04",
  },
  "2026-05-10": {
    employeeId: "rayanne",
    note: "FOLGA - 03 Domingos",
  },
  "2026-05-12": {
    employeeId: "ana",
    note: "FOLGA - Feriado 21/04",
  },
  "2026-05-16": {
    employeeId: "jonatan",
    note: "FOLGA - Feriado 21/04",
  },
  "2026-05-17": {
    employeeId: "jonatan",
    note: "FOLGA - 03 Domingos",
  },
  "2026-05-19": {
    employeeId: "allan",
    note: "FOLGA - Feriado 21/04",
  },
  "2026-05-24": {
    employeeId: "ana",
    note: "FOLGA - 03 Domingos",
  },
  "2026-05-31": {
    employeeId: "allan",
    note: "FOLGA - 03 Domingos",
  },
};
const holidayCompensationRules = {
  "2026-04-03": {
    holidayName: "Sexta Feira da Paixao",
    compensations: [{ date: "2026-05-06", employeeId: "allan" }],
  },
  "2026-04-21": {
    holidayName: "Tiradentes",
    compensations: [
      { date: "2026-05-12", employeeId: "ana" },
      { date: "2026-05-16", employeeId: "jonatan" },
      { date: "2026-05-19", employeeId: "allan" },
    ],
  },
};

const state = loadState();

const els = {
  weekForm: document.querySelector("#weekForm"),
  weekNumber: document.querySelector("#weekNumber"),
  weekYear: document.querySelector("#weekYear"),
  weekPickerRange: document.querySelector("#weekPickerRange"),
  weekRange: document.querySelector("#weekRange"),
  workTable: document.querySelector("#workTable"),
  intervalTable: document.querySelector("#intervalTable"),
  leaveTable: document.querySelector("#leaveTable"),
  validationMessage: document.querySelector("#validationMessage"),
  holidayList: document.querySelector("#holidayList"),
  printSchedule: document.querySelector("#printSchedule"),
};

function defaultState() {
  return {
    weekStart: "2026-05-04",
    manualHolidays: {},
    schedule: {},
  };
}

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return defaultState();
  try {
    return { ...defaultState(), ...JSON.parse(saved) };
  } catch {
    return defaultState();
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function getMonday(date) {
  const next = new Date(date);
  const day = next.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  next.setDate(next.getDate() + diff);
  next.setHours(0, 0, 0, 0);
  return next;
}

function toInputDate(date) {
  return date.toISOString().slice(0, 10);
}

function weekLabel(dateString) {
  const { week, year } = getIsoWeekInfo(addDays(dateString, 0));
  return `Semana ${week}/${year}`;
}

function weekPeriodLabel(dateString) {
  return `${formatDate(addDays(dateString, 0))} a ${formatDate(addDays(dateString, 6))}`;
}

function weekFullLabel(dateString) {
  return `${weekLabel(dateString)} - ${weekPeriodLabel(dateString)}`;
}

function getIsoWeekInfo(date) {
  const target = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNumber = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - dayNumber);
  const year = target.getUTCFullYear();
  const yearStart = new Date(Date.UTC(year, 0, 1));
  const week = Math.ceil(((target - yearStart) / 86400000 + 1) / 7);
  return { week, year };
}

function mondayFromWeekNumber(week, year) {
  const safeWeek = Math.min(53, Math.max(1, Number(week) || 1));
  const safeYear = Math.max(2026, Number(year) || 2026);
  const januaryFourth = new Date(Date.UTC(safeYear, 0, 4));
  const januaryFourthDay = januaryFourth.getUTCDay() || 7;
  const monday = new Date(januaryFourth);
  monday.setUTCDate(januaryFourth.getUTCDate() - januaryFourthDay + 1 + (safeWeek - 1) * 7);
  return toInputDate(new Date(monday.getUTCFullYear(), monday.getUTCMonth(), monday.getUTCDate()));
}

function addDays(dateString, amount) {
  const date = new Date(`${dateString}T00:00:00`);
  date.setDate(date.getDate() + amount);
  return date;
}

function formatDate(date) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(date);
}

function shortDate(date) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" }).format(date);
}

function isHoliday(dayIndex) {
  const key = toInputDate(addDays(state.weekStart, dayIndex));
  return Boolean(officialHolidays[key] || state.manualHolidays[key]);
}

function holidayName(dayIndex) {
  const key = toInputDate(addDays(state.weekStart, dayIndex));
  return officialHolidays[key] || state.manualHolidays[key] || "";
}

function dayShifts(dayIndex) {
  return employees.map((employee) => getBaseShift(employee.id));
}

function dayHours(dayIndex) {
  return dayIndex === 6 || isHoliday(dayIndex) ? "12h as 21h" : "9h as 22h";
}

function getBaseShift(employeeId) {
  return { ...baseShiftsByEmployee[employeeId] };
}

function render() {
  const currentWeek = getIsoWeekInfo(addDays(state.weekStart, 0));
  els.weekNumber.value = currentWeek.week;
  els.weekYear.value = currentWeek.year;
  els.weekPickerRange.textContent = weekFullLabel(state.weekStart);
  els.weekRange.textContent = weekFullLabel(state.weekStart);
  renderTables();
  renderWarnings();
  saveState();
}

function renderTables() {
  els.workTable.innerHTML = buildTable("work");
  els.intervalTable.innerHTML = buildTable("interval");
  els.leaveTable.innerHTML = buildLeaveTable();
}

function buildTable(type) {
  const themeClass = type === "work" ? "blue-head" : "red-head";
  const rows = employees.map((employee) => buildEmployeeRow(employee, type)).join("");
  const dayHeaders = weekDays.map((day) => `<th colspan="2">${day}</th>`).join("");
  const subHeaders = weekDays.map(() => "<th>ENTRADA</th><th>SAIDA</th>").join("");

  return `
    <colgroup>
      <col class="name-col" />
      <col class="role-col" />
      ${weekDays.map(() => '<col class="time-col" /><col class="time-col" />').join("")}
    </colgroup>
    <thead class="${themeClass}">
      <tr>
        <th colspan="2">${type === "work" ? storeName : "Nome da Loja"}</th>
        ${dayHeaders}
      </tr>
      <tr>
        <th>Nome Completo</th>
        <th>Cargo</th>
        <th class="week-label" colspan="14">${weekFullLabel(state.weekStart)}</th>
      </tr>
      <tr class="sub-head">
        <th></th>
        <th></th>
        ${subHeaders}
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  `;
}

function buildEmployeeRow(employee, type) {
  const cells = weekDays
    .map((_, dayIndex) => {
      const item = getAssignment(employee.id, dayIndex);
      if (!item || item.off) {
        const label = item?.note || "FOLGA";
        const special = label.includes("03 Domingos") ? " sunday-off" : "";
        return `<td class="off-cell${special}" colspan="2">${escapeHtml(label)}</td>`;
      }
      const first = type === "work" ? item.start : item.breakStart;
      const second = type === "work" ? item.end : item.breakEnd;
      return `<td>${first}</td><td>${second}</td>`;
    })
    .join("");

  return `
    <tr>
      <td class="table-employee-name">${escapeHtml(employee.name)}</td>
      <td class="role-cell">${escapeHtml(employee.role)}</td>
      ${cells}
    </tr>
  `;
}

function buildLeaveTable() {
  const rows = employees
    .map((employee) => {
      const weeklyOffDayIndexes = getOffDayIndexesByKind(state.schedule, employee.id, "weekly");
      const holidayOffDayIndexes = getOffDayIndexesByKind(state.schedule, employee.id, "holiday");
      const balance = getLeaveBalanceCounts(employee.id);

      return `
        <tr>
          <td class="table-employee-name">${escapeHtml(employee.name)}</td>
          <td class="sunday-off-cell">
            ${buildLeaveSelectors(employee, "weekly", hasSundayOffRuleInWeek(employee.id) ? 1 : Math.max(balance.weekly, weeklyOffDayIndexes.length), weeklyOffDayIndexes)}
          </td>
          <td>
            ${buildLeaveSelectors(employee, "holiday", Math.max(balance.holiday, holidayOffDayIndexes.length), holidayOffDayIndexes)}
          </td>
          <td>${formatLeaveBalance(balance)}</td>
        </tr>
      `;
    })
    .join("");

  return `
    <thead>
      <tr>
        <th>Nome Completo</th>
        <th>Folga Domingo</th>
        <th>Dia Folga de Feriado</th>
        <th>Saldo de Folgas</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  `;
}

function getHolidayCompensationCountInWeek(employeeId) {
  return Object.values(holidayCompensationRules).reduce((count, rule) => {
    return count + rule.compensations.filter((item) => item.employeeId === employeeId && isDateInCurrentWeek(item.date)).length;
  }, 0);
}

function buildLeaveSelectors(employee, kind, count, selectedIndexes) {
  if (count === 0) return '<span class="no-balance">Sem saldo</span>';
  return Array.from({ length: count }, (_, slotIndex) => {
    const mustBeSunday = kind === "weekly" && hasSundayOffRuleInWeek(employee.id);
    const selectedIndex = mustBeSunday ? 6 : selectedIndexes[slotIndex];
    const lockedText = mustBeSunday ? '<span class="locked-note">3ª folga: domingo obrigatório</span>' : "";
    return `
      <select class="leave-select" data-kind="${kind}" data-slot-index="${slotIndex}" data-employee-id="${employee.id}" aria-label="${kind === "weekly" ? "Folga semanal" : "Folga de feriado"} de ${escapeHtml(employee.name)}" ${mustBeSunday ? "disabled" : ""}>
        <option value="">Selecionar</option>
        ${weekDays
          .map((day, dayIndex) => {
            const date = formatDate(addDays(state.weekStart, dayIndex));
            return `<option value="${dayIndex}" ${dayIndex === selectedIndex ? "selected" : ""}>${day} - ${date}</option>`;
          })
          .join("")}
      </select>
      ${lockedText}
    `;
  }).join("");
}

function getLeaveBalanceCounts(employeeId) {
  const compensationDates = Object.values(holidayCompensationRules).flatMap((rule) =>
    rule.compensations.filter((item) => item.employeeId === employeeId).map((item) => item.date)
  );
  const sundayOffDates = Object.entries(fixedOffRules)
    .filter(([, rule]) => rule.employeeId === employeeId && rule.note.includes("03 Domingos"))
    .map(([dateKey]) => dateKey);
  const currentWeekEnd = toInputDate(addDays(state.weekStart, 6));
  const holidayPending = compensationDates.filter((dateKey) => dateKey >= state.weekStart).length;
  const sundayPending = sundayOffDates.filter((dateKey) => dateKey >= state.weekStart).length;
  const weeklyTakenThisWeek = getOffDayIndexesByKind(state.schedule, employeeId, "weekly").some((dayIndex) => {
    const dateKey = toInputDate(addDays(state.weekStart, dayIndex));
    return dateKey <= currentWeekEnd;
  });

  return { weekly: weeklyTakenThisWeek ? 1 : 1, sunday: sundayPending, holiday: holidayPending };
}

function formatLeaveBalance(balance) {
  return `<span class="balance-line">Folga Semanal: ${balance.weekly}</span><span class="balance-line">Folga Feriados: ${balance.holiday}</span>`;
}

function getOffDayIndex(schedule, employeeId) {
  return getOffDayIndexes(schedule, employeeId)[0] ?? -1;
}

function getOffDayIndexes(schedule, employeeId) {
  return Object.entries(schedule || {})
    .filter(([, row]) => row?.[employeeId]?.off)
    .map(([dayIndex]) => Number(dayIndex))
    .sort((a, b) => a - b);
}

function getOffDayIndexesByKind(schedule, employeeId, kind) {
  return Object.entries(schedule || {})
    .filter(([, row]) => {
      const note = row?.[employeeId]?.note || "";
      if (!row?.[employeeId]?.off) return false;
      if (kind === "weekly") return !note.includes("Feriado");
      return kind === "holiday" ? note.includes("Feriado") : note.includes("03 Domingos");
    })
    .map(([dayIndex]) => Number(dayIndex))
    .sort((a, b) => a - b);
}

function hasSundayOffRuleInWeek(employeeId) {
  const sundayKey = toInputDate(addDays(state.weekStart, 6));
  return getSundayOffEmployeeId(sundayKey) === employeeId;
}

function getSundayOffEmployeeId(dateKey) {
  const fixedSundayRule = fixedOffRules[dateKey];
  if (fixedSundayRule?.note.includes("03 Domingos")) return fixedSundayRule.employeeId;

  const target = new Date(`${dateKey}T00:00:00`);
  if (target.getDay() !== 0 || dateKey < sundayOffCycleStart) return null;

  const cycleStart = new Date(`${sundayOffCycleStart}T00:00:00`);
  const weeksSinceStart = Math.round((target - cycleStart) / (7 * 86400000));
  return sundayOffCycle[weeksSinceStart % sundayOffCycle.length];
}

function getAssignment(employeeId, dayIndex) {
  return state.schedule?.[dayIndex]?.[employeeId] || null;
}

function autoFillSchedule() {
  const schedule = {};
  const weeklyOffDays = getWeeklyOffDays();

  weekDays.forEach((_, dayIndex) => {
    const dateKey = toInputDate(addDays(state.weekStart, dayIndex));
    schedule[dayIndex] = {};

    employees.forEach((employee) => {
      schedule[dayIndex][employee.id] = getBaseShift(employee.id);
    });

    employees.forEach((employee) => {
      if (weeklyOffDays[employee.id] === dayIndex) {
        schedule[dayIndex][employee.id] = {
          off: true,
          note: hasSundayOffRuleInWeek(employee.id) && dayIndex === 6 ? "FOLGA - 03 Domingos" : "FOLGA",
        };
      }
    });

    const fixedRule = fixedOffRules[dateKey];
    if (fixedRule) {
      schedule[dayIndex][fixedRule.employeeId] = {
        off: true,
        note: fixedRule.note,
      };
    }
  });

  employees.forEach((employee) => {
    const weeklyDays = getOffDayIndexesByKind(schedule, employee.id, "weekly");
    if (weeklyDays.length === 0) {
      const dayIndex = chooseWeeklyOffDay(employee.id, getWeeklyOffDayMap(schedule));
      if (dayIndex !== null) {
        schedule[dayIndex][employee.id] = {
          off: true,
          note: hasSundayOffRuleInWeek(employee.id) && dayIndex === 6 ? "FOLGA - 03 Domingos" : "FOLGA",
        };
      }
    }
  });

  applyCoverage(schedule);

  state.schedule = schedule;
  render();
}

function getWeeklyOffDays() {
  const weeklyOffDays = {};
  employees.forEach((employee) => {
    weeklyOffDays[employee.id] = hasSundayOffRuleInWeek(employee.id)
      ? 6
      : chooseWeeklyOffDay(employee.id, weeklyOffDays);
  });
  return weeklyOffDays;
}

function getWeeklyOffDayMap(schedule) {
  return Object.fromEntries(
    employees.map((employee) => {
      const dayIndex = getOffDayIndexesByKind(schedule, employee.id, "weekly")[0];
      return [employee.id, dayIndex ?? null];
    })
  );
}

function chooseWeeklyOffDay(employeeId, weeklyOffDays) {
  const preferred = preferredWeeklyOffDays[employeeId] ?? 0;
  const occupiedCounts = Object.values(weeklyOffDays).reduce((counts, dayIndex) => {
    if (dayIndex !== null && dayIndex !== undefined) counts[dayIndex] = (counts[dayIndex] || 0) + 1;
    return counts;
  }, {});
  const candidates = weekDays
    .map((_, dayIndex) => dayIndex)
    .filter((dayIndex) => {
      const dateKey = toInputDate(addDays(state.weekStart, dayIndex));
      if (dayIndex === 6) return false;
      if (isHoliday(dayIndex)) return false;
      return fixedOffRules[dateKey]?.employeeId !== employeeId;
    })
    .sort((a, b) => {
      const aDistance = Math.abs(a - preferred);
      const bDistance = Math.abs(b - preferred);
      return (occupiedCounts[a] || 0) - (occupiedCounts[b] || 0) || aDistance - bDistance || a - b;
    });

  return candidates[0] ?? null;
}

function moveEmployeeOffDay(employeeId, targetDayIndex) {
  const currentDayIndex = getOffDayIndex(state.schedule, employeeId);
  const nextSchedule = cloneSchedule(state.schedule);
  const targetRow = nextSchedule[targetDayIndex];

  if (currentDayIndex === targetDayIndex || currentDayIndex < 0 || !targetRow) {
    render();
    return;
  }

  const currentNote = nextSchedule[currentDayIndex][employeeId]?.note || "FOLGA";
  const targetOffEmployee = employees.find((employee) => targetRow[employee.id]?.off);
  if (!targetOffEmployee) {
    showValidation("Não foi possível encontrar quem está de folga nesse dia.");
    render();
    return;
  }

  const targetNote = targetRow[targetOffEmployee.id]?.note || "FOLGA";
  const employeeTargetAssignment = nextSchedule[targetDayIndex][employeeId];
  const targetEmployeeCurrentAssignment = nextSchedule[currentDayIndex][targetOffEmployee.id];
  nextSchedule[currentDayIndex][employeeId] = targetEmployeeCurrentAssignment?.off
    ? makeWorkAssignment(employeeId, currentDayIndex, nextSchedule)
    : { ...targetEmployeeCurrentAssignment };
  nextSchedule[currentDayIndex][targetOffEmployee.id] = { off: true, note: targetNote };
  nextSchedule[targetDayIndex][targetOffEmployee.id] = employeeTargetAssignment?.off
    ? makeWorkAssignment(targetOffEmployee.id, targetDayIndex, nextSchedule)
    : { ...employeeTargetAssignment };
  nextSchedule[targetDayIndex][employeeId] = { off: true, note: currentNote };

  applyCoverage(nextSchedule);

  const validation = validateSchedule(nextSchedule);
  if (!validation.valid) {
    showValidation(validation.message);
    render();
    return;
  }

  state.schedule = nextSchedule;
  showValidation("Folga ajustada com sucesso.");
  render();
}

function setEmployeeOffSlot(employeeId, kind, slotIndex, targetDayIndex) {
  const nextSchedule = cloneSchedule(state.schedule);
  const selectedIndexes = getOffDayIndexesByKind(nextSchedule, employeeId, kind);
  const currentDayIndex = selectedIndexes[slotIndex];
  const note = kind === "holiday" ? "FOLGA - Feriado" : hasSundayOffRuleInWeek(employeeId) ? "FOLGA - 03 Domingos" : "FOLGA";

  if (currentDayIndex !== undefined) {
    nextSchedule[currentDayIndex][employeeId] = makeWorkAssignment(employeeId, currentDayIndex, nextSchedule);
  }

  if (kind === "weekly" && hasSundayOffRuleInWeek(employeeId) && targetDayIndex !== null && targetDayIndex !== 6) {
    showValidation("Folga de 3 domingos precisa obrigatoriamente cair no domingo.");
    render();
    return;
  }

  if (targetDayIndex !== null) {
    nextSchedule[targetDayIndex][employeeId] = { off: true, note };
  }

  applyCoverage(nextSchedule);

  const validation = validateSchedule(nextSchedule);
  if (!validation.valid) {
    showValidation(validation.message);
    render();
    return;
  }

  state.schedule = nextSchedule;
  showValidation("Folga ajustada com sucesso.");
  render();
}

function cloneSchedule(schedule) {
  return JSON.parse(JSON.stringify(schedule || {}));
}

function makeWorkAssignment(employeeId, dayIndex, schedule) {
  return getBaseShift(employeeId);
}

function applyCoverage(schedule) {
  weekDays.forEach((_, dayIndex) => {
    employees.forEach((employee) => {
      if (!schedule[dayIndex]?.[employee.id]?.off) {
        schedule[dayIndex][employee.id] = getBaseShift(employee.id);
      }
    });
    coverOffShifts(schedule, dayIndex);
  });
}

function coverOffShifts(schedule, dayIndex) {
  const offEmployees = employees.filter((employee) => schedule[dayIndex]?.[employee.id]?.off);
  const availableCoverIds = new Set(employees.filter((employee) => !schedule[dayIndex]?.[employee.id]?.off).map((employee) => employee.id));

  offEmployees.forEach((offEmployee) => {
    const shiftToCover = getBaseShift(offEmployee.id);
    const alreadyCovered = employees.some((employee) => {
      const assignment = schedule[dayIndex]?.[employee.id];
      return employee.id !== offEmployee.id && !assignment?.off && hasSameShift(assignment, shiftToCover);
    });
    if (alreadyCovered) return;

    const coverEmployee = employees.find((employee) => availableCoverIds.has(employee.id));
    if (!coverEmployee) return;

    schedule[dayIndex][coverEmployee.id] = { ...shiftToCover, coverFor: offEmployee.id };
    availableCoverIds.delete(coverEmployee.id);
  });
}

function hasSameShift(assignment, shift) {
  return assignment?.start === shift.start && assignment?.end === shift.end;
}

function findShiftIndex(assignment, shifts) {
  if (!assignment || assignment.off) return -1;
  return shifts.findIndex((shift) => shift.start === assignment.start && shift.end === assignment.end);
}

function validateSchedule(schedule) {
  for (const employee of employees) {
    const weeklyOffDays = getOffDayIndexesByKind(schedule, employee.id, "weekly");
    if (weeklyOffDays.length === 0) {
      return { valid: false, message: `${employee.name} precisa ter uma folga semanal.` };
    }
    if (weeklyOffDays.length > 1 && hasSundayOffRuleInWeek(employee.id)) {
      return { valid: false, message: `${employee.name} já tem a folga obrigatória de domingo nesta semana.` };
    }
    const invalidHolidayRest = weeklyOffDays.find((dayIndex) => isHoliday(dayIndex) && !hasSundayOffRuleInWeek(employee.id));
    if (invalidHolidayRest !== undefined) {
      return { valid: false, message: `${employee.name} não pode usar feriado como folga semanal. Escolha outro dia da semana.` };
    }
  }

  for (const [dateKey, rule] of Object.entries(fixedOffRules)) {
    if (!rule.note.includes("03 Domingos")) continue;
    const dayIndex = getDayIndexInCurrentWeek(dateKey);
    if (dayIndex < 0) continue;
    if (!schedule[dayIndex]?.[rule.employeeId]?.off) {
      const employee = employees.find((item) => item.id === rule.employeeId);
      return { valid: false, message: `${employee?.name || "Funcionário"} precisa manter ${rule.note} em ${formatDate(new Date(`${dateKey}T00:00:00`))}.` };
    }
  }

  for (const employee of employees) {
    for (const dayIndex of weekDays.map((_, index) => index)) {
      const assignment = schedule[dayIndex]?.[employee.id];
      if (!assignment || assignment.off) continue;
      if (!isBreakLegal(assignment)) {
        return { valid: false, message: `Intervalo de ${employee.name} precisa começar entre 3h e 5h após a entrada.` };
      }
    }
  }

  for (const dayIndex of weekDays.map((_, index) => index)) {
    const uncovered = getUncoveredOffEmployees(schedule, dayIndex);
    if (uncovered.length) {
      return { valid: false, message: `A folga de ${uncovered[0].name} precisa ter cobertura de horário.` };
    }
  }

  return { valid: true, message: "" };
}

function isBreakLegal(assignment) {
  const start = timeToMinutes(assignment.start);
  const breakStart = timeToMinutes(assignment.breakStart);
  const workedBeforeBreak = breakStart - start;
  return workedBeforeBreak >= 180 && workedBeforeBreak <= 300;
}

function timeToMinutes(value) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function getUncoveredOffEmployees(schedule, dayIndex) {
  const workers = employees.filter((employee) => !schedule[dayIndex]?.[employee.id]?.off);
  return employees.filter((offEmployee) => {
    if (!schedule[dayIndex]?.[offEmployee.id]?.off) return false;
    const shiftToCover = getBaseShift(offEmployee.id);
    return !workers.some((worker) => hasSameShift(schedule[dayIndex]?.[worker.id], shiftToCover));
  });
}

function getDayIndexInCurrentWeek(dateKey) {
  const target = new Date(`${dateKey}T00:00:00`);
  const start = addDays(state.weekStart, 0);
  const diff = Math.round((target - start) / 86400000);
  return diff >= 0 && diff <= 6 ? diff : -1;
}

function showValidation(message) {
  els.validationMessage.textContent = message;
  els.validationMessage.classList.toggle("is-error", Boolean(message) && !message.includes("sucesso"));
}

function chooseOffEmployee(offCounts, dayIndex) {
  const sundayOffIds = new Set(
    Object.entries(fixedOffRules)
      .filter(([dateKey, rule]) => getDayIndexInCurrentWeek(dateKey) === 6 && rule.note.includes("03 Domingos"))
      .map(([, rule]) => rule.employeeId)
  );
  const candidates = dayIndex === 6 ? employees : employees.filter((employee) => !sundayOffIds.has(employee.id) || offCounts[employee.id] === 0);
  const withoutWeeklyOff = candidates.filter((employee) => offCounts[employee.id] === 0);
  if (!withoutWeeklyOff.length) return null;
  return [...withoutWeeklyOff].sort((a, b) => employees.indexOf(a) - employees.indexOf(b))[0];
}

function holidayOffLabel(dayIndex) {
  if (!isHoliday(dayIndex)) return "FOLGA";
  const key = toInputDate(addDays(state.weekStart, dayIndex));
  const name = officialHolidays[key] ? officialHolidays[key] : "Feriado";
  return `FOLGA - ${name}`;
}

function renderWarnings() {
  const compensations = getHolidayCompensations();
  els.holidayList.innerHTML = compensations.length
    ? compensations.map((item) => `<li>${escapeHtml(item)}</li>`).join("")
    : '<li class="empty">Nenhuma compensação pendente nesta semana.</li>';
}

function getHolidayCompensations() {
  const items = [];
  weekDays.forEach((day, dayIndex) => {
    if (!isHoliday(dayIndex)) return;
    const holidayDate = addDays(state.weekStart, dayIndex);
    const dueDate = addDays(toInputDate(holidayDate), 30);
    employees.forEach((employee) => {
      const item = getAssignment(employee.id, dayIndex);
      if (!item || item.off) return;
      const compensatedInWeek = hasCompensationAfter(employee.id, dayIndex);
      const status = compensatedInWeek ? "compensação marcada nesta semana" : `compensar até ${formatDate(dueDate)}`;
      items.push(`${employee.name}: trabalhou no feriado de ${day}, ${holidayName(dayIndex)} (${formatDate(holidayDate)}) - ${status}.`);
    });
  });
  items.push(...getMarkedHolidayCompensations());
  return items;
}

function getMarkedHolidayCompensations() {
  const usedDebtsByEmployee = {};

  return employees.flatMap((employee) => {
    const debts = getHolidayDebtsForEmployee(employee.id);
    usedDebtsByEmployee[employee.id] = new Set();

    return getOffDayIndexesByKind(state.schedule, employee.id, "holiday").map((dayIndex) => {
      const compensationDateKey = toInputDate(addDays(state.weekStart, dayIndex));
      const exactDebtIndex = debts.findIndex((debt, index) => {
        return debt.compensationDateKey === compensationDateKey && !usedDebtsByEmployee[employee.id].has(index);
      });
      const debtIndex = exactDebtIndex >= 0 ? exactDebtIndex : debts.findIndex((_, index) => !usedDebtsByEmployee[employee.id].has(index));
      const debt = debts[debtIndex] || { holidayName: "feriado", holidayDateKey: null };
      if (debtIndex >= 0) usedDebtsByEmployee[employee.id].add(debtIndex);

      const holidayInfo = debt.holidayDateKey
        ? `${debt.holidayName} (${formatDate(new Date(`${debt.holidayDateKey}T00:00:00`))})`
        : debt.holidayName;
      return `${employee.name}: compensação do feriado ${holidayInfo} marcada para ${formatDate(addDays(state.weekStart, dayIndex))}.`;
    });
  });
}

function getHolidayDebtsForEmployee(employeeId) {
  return Object.entries(holidayCompensationRules)
    .flatMap(([holidayDateKey, rule]) =>
      rule.compensations
        .filter((compensation) => compensation.employeeId === employeeId && compensation.date >= state.weekStart)
        .map((compensation) => ({
          holidayDateKey,
          holidayName: rule.holidayName,
          compensationDateKey: compensation.date,
        }))
    )
    .sort((a, b) => a.holidayDateKey.localeCompare(b.holidayDateKey));
}

function isDateInCurrentWeek(dateKey) {
  const date = new Date(`${dateKey}T00:00:00`);
  const start = addDays(state.weekStart, 0);
  const end = addDays(state.weekStart, 6);
  return date >= start && date <= end;
}

function hasCompensationAfter(employeeId, holidayIndex) {
  return weekDays.some((_, dayIndex) => dayIndex > holidayIndex && getAssignment(employeeId, dayIndex)?.off);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

els.weekForm.addEventListener("submit", (event) => {
  event.preventDefault();
  state.weekStart = mondayFromWeekNumber(els.weekNumber.value, els.weekYear.value);
  state.schedule = {};
  showValidation("");
  autoFillSchedule();
});

els.leaveTable.addEventListener("change", (event) => {
  const select = event.target.closest(".leave-select");
  if (select) {
    setEmployeeOffSlot(
      select.dataset.employeeId,
      select.dataset.kind,
      Number(select.dataset.slotIndex),
      select.value === "" ? null : Number(select.value)
    );
    return;
  }
});

els.printSchedule.addEventListener("click", () => window.print());

if (Object.keys(state.schedule || {}).length) {
  render();
} else {
  autoFillSchedule();
}
