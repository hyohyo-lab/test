(() => {
  "use strict";

  const YEAR = 2026;
  const STORAGE_KEY = "planner-2026-tasks-v1";
  const monthNames = Array.from({ length: 12 }, (_, index) => `${index + 1}월`);
  const weekdayNames = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];
  const categoryLabels = { 업무: "집중할 일", 개인: "나를 위한 일", 기타: "기타" };

  const now = new Date();
  const defaultMonth = now.getFullYear() === YEAR ? now.getMonth() : 0;
  const defaultDay = now.getFullYear() === YEAR ? now.getDate() : 1;

  let currentMonth = defaultMonth;
  let selectedDate = toDateKey(currentMonth, defaultDay);
  let selectedCategory = "업무";
  let currentFilter = "all";
  let tasks = loadTasks();
  let toastTimer;

  const elements = {
    monthTitle: document.querySelector("#monthTitle"),
    calendarGrid: document.querySelector("#calendarGrid"),
    prevMonth: document.querySelector("#prevMonth"),
    nextMonth: document.querySelector("#nextMonth"),
    selectedWeekday: document.querySelector("#selectedWeekday"),
    selectedDateTitle: document.querySelector("#selectedDateTitle"),
    progressRing: document.querySelector("#progressRing"),
    progressText: document.querySelector("#progressText"),
    taskForm: document.querySelector("#taskForm"),
    taskInput: document.querySelector("#taskInput"),
    taskCount: document.querySelector("#taskCount"),
    taskList: document.querySelector("#taskList"),
    emptyState: document.querySelector("#emptyState"),
    monthJump: document.querySelector("#monthJump"),
    todayButton: document.querySelector("#todayButton"),
    headerAddButton: document.querySelector("#headerAddButton"),
    toast: document.querySelector("#toast")
  };

  function toDateKey(monthIndex, day) {
    return `${YEAR}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  function loadTasks() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return Array.isArray(saved) ? saved : [];
    } catch {
      return [];
    }
  }

  function saveTasks() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }

  function showToast(message) {
    window.clearTimeout(toastTimer);
    elements.toast.textContent = message;
    elements.toast.classList.add("is-visible");
    toastTimer = window.setTimeout(() => elements.toast.classList.remove("is-visible"), 1800);
  }

  function getDateTasks(dateKey) {
    return tasks.filter((task) => task.date === dateKey);
  }

  function renderMonthJump() {
    elements.monthJump.innerHTML = monthNames
      .map((name, index) => `<button type="button" data-month="${index}" class="${index === currentMonth ? "is-active" : ""}">${name}</button>`)
      .join("");
  }

  function renderCalendar() {
    const firstDay = new Date(YEAR, currentMonth, 1).getDay();
    const lastDate = new Date(YEAR, currentMonth + 1, 0).getDate();
    const selectedDay = Number(selectedDate.slice(-2));
    const todayKey = now.getFullYear() === YEAR ? toDateKey(now.getMonth(), now.getDate()) : "";
    const cells = [];

    for (let index = 0; index < firstDay; index += 1) {
      cells.push('<div class="day-cell is-blank" aria-hidden="true"></div>');
    }

    for (let day = 1; day <= lastDate; day += 1) {
      const dateKey = toDateKey(currentMonth, day);
      const dateTasks = getDateTasks(dateKey);
      const completed = dateTasks.filter((task) => task.done).length;
      const weekday = (firstDay + day - 1) % 7;
      const classes = ["day-cell"];
      if (weekday === 0) classes.push("is-sunday");
      if (weekday === 6) classes.push("is-saturday");
      if (dateKey === selectedDate) classes.push("is-selected");
      if (dateKey === todayKey) classes.push("is-today");

      const preview = dateTasks.length
        ? `<span class="task-preview">${escapeHTML(dateTasks[0].text)}</span><span class="task-dots" aria-hidden="true">${dateTasks.slice(0, 3).map((task) => `<i class="${task.done ? "done" : ""}"></i>`).join("")}</span>`
        : "";
      const taskSummary = dateTasks.length ? `, 할 일 ${dateTasks.length}개 중 ${completed}개 완료` : "";

      cells.push(`
        <button class="${classes.join(" ")}" type="button" role="gridcell" data-date="${dateKey}" aria-label="2026년 ${currentMonth + 1}월 ${day}일${taskSummary}" aria-selected="${dateKey === selectedDate}">
          <span class="day-number">${day}</span>${preview}
        </button>
      `);
    }

    const totalCells = Math.ceil((firstDay + lastDate) / 7) * 7;
    for (let index = firstDay + lastDate; index < totalCells; index += 1) {
      cells.push('<div class="day-cell is-blank" aria-hidden="true"></div>');
    }

    elements.monthTitle.textContent = monthNames[currentMonth];
    elements.calendarGrid.innerHTML = cells.join("");
    elements.prevMonth.disabled = currentMonth === 0;
    elements.nextMonth.disabled = currentMonth === 11;
    renderMonthJump();
  }

  function renderTasks() {
    const [, month, day] = selectedDate.split("-").map(Number);
    const date = new Date(YEAR, month - 1, day);
    const dateTasks = getDateTasks(selectedDate);
    const completed = dateTasks.filter((task) => task.done).length;
    const percent = dateTasks.length ? Math.round((completed / dateTasks.length) * 100) : 0;
    const visibleTasks = dateTasks.filter((task) => {
      if (currentFilter === "active") return !task.done;
      if (currentFilter === "done") return task.done;
      return true;
    });

    elements.selectedWeekday.textContent = weekdayNames[date.getDay()];
    elements.selectedDateTitle.textContent = `${month}월 ${day}일`;
    elements.taskCount.textContent = `할 일 ${dateTasks.length}개 · 완료 ${completed}개`;
    elements.progressText.textContent = `${percent}%`;
    elements.progressRing.setAttribute("aria-label", `완료율 ${percent}퍼센트`);
    elements.emptyState.hidden = visibleTasks.length > 0;

    if (!visibleTasks.length && dateTasks.length && currentFilter !== "all") {
      elements.emptyState.querySelector("strong").textContent = currentFilter === "done" ? "완료한 일이 없어요." : "남은 일이 없어요.";
      elements.emptyState.querySelector("p").textContent = currentFilter === "done" ? "하나씩 완료해 볼까요?" : "오늘의 할 일을 모두 마쳤어요.";
    } else {
      elements.emptyState.querySelector("strong").textContent = "여유로운 하루예요.";
      elements.emptyState.querySelector("p").textContent = "위 입력창에서 첫 할 일을 추가해 보세요.";
    }

    elements.taskList.innerHTML = visibleTasks.map((task) => `
      <li class="task-item ${task.done ? "is-done" : ""}" data-id="${task.id}">
        <button class="task-check" type="button" aria-label="${task.done ? "완료 취소" : "완료로 표시"}" aria-pressed="${task.done}">${task.done ? "✓" : ""}</button>
        <div class="task-copy">
          <strong>${escapeHTML(task.text)}</strong>
          <small>${categoryLabels[task.category] || "기타"}</small>
        </div>
        <button class="delete-task" type="button" aria-label="${escapeHTML(task.text)} 삭제">×</button>
      </li>
    `).join("");
  }

  function renderAll() {
    renderCalendar();
    renderTasks();
  }

  function selectMonth(monthIndex) {
    currentMonth = Math.max(0, Math.min(11, monthIndex));
    const currentSelectedMonth = Number(selectedDate.slice(5, 7)) - 1;
    if (currentSelectedMonth !== currentMonth) selectedDate = toDateKey(currentMonth, 1);
    renderAll();
  }

  function escapeHTML(value) {
    const div = document.createElement("div");
    div.textContent = value;
    return div.innerHTML;
  }

  elements.calendarGrid.addEventListener("click", (event) => {
    const cell = event.target.closest("[data-date]");
    if (!cell) return;
    selectedDate = cell.dataset.date;
    renderAll();
  });

  elements.prevMonth.addEventListener("click", () => selectMonth(currentMonth - 1));
  elements.nextMonth.addEventListener("click", () => selectMonth(currentMonth + 1));
  elements.monthJump.addEventListener("click", (event) => {
    const button = event.target.closest("[data-month]");
    if (button) selectMonth(Number(button.dataset.month));
  });

  document.querySelectorAll(".category-chip").forEach((button) => {
    button.addEventListener("click", () => {
      selectedCategory = button.dataset.category;
      document.querySelectorAll(".category-chip").forEach((chip) => chip.classList.toggle("is-active", chip === button));
    });
  });

  document.querySelectorAll(".filters button").forEach((button) => {
    button.addEventListener("click", () => {
      currentFilter = button.dataset.filter;
      document.querySelectorAll(".filters button").forEach((filter) => filter.classList.toggle("is-active", filter === button));
      renderTasks();
    });
  });

  elements.taskForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const text = elements.taskInput.value.trim();
    if (!text) return;
    tasks.push({
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      date: selectedDate,
      text,
      category: selectedCategory,
      done: false
    });
    saveTasks();
    elements.taskInput.value = "";
    currentFilter = "all";
    document.querySelectorAll(".filters button").forEach((button) => button.classList.toggle("is-active", button.dataset.filter === "all"));
    renderAll();
    showToast("할 일을 추가했어요.");
  });

  elements.taskList.addEventListener("click", (event) => {
    const item = event.target.closest(".task-item");
    if (!item) return;
    const index = tasks.findIndex((task) => task.id === item.dataset.id);
    if (index < 0) return;
    if (event.target.closest(".task-check")) {
      tasks[index].done = !tasks[index].done;
      saveTasks();
      renderAll();
      showToast(tasks[index].done ? "할 일을 완료했어요." : "다시 진행할 일로 바꿨어요.");
    }
    if (event.target.closest(".delete-task")) {
      tasks.splice(index, 1);
      saveTasks();
      renderAll();
      showToast("할 일을 삭제했어요.");
    }
  });

  elements.headerAddButton.addEventListener("click", () => {
    elements.taskInput.focus();
    elements.taskInput.scrollIntoView({ behavior: "smooth", block: "center" });
  });

  elements.todayButton.addEventListener("click", () => {
    if (now.getFullYear() !== YEAR) {
      selectMonth(0);
      showToast("이 플래너는 2026년 전용이에요.");
      return;
    }
    currentMonth = now.getMonth();
    selectedDate = toDateKey(currentMonth, now.getDate());
    renderAll();
  });

  renderAll();
})();
