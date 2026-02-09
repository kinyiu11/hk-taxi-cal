const TAXI_RATES = {
  urban: {
    name: "市區",
    base: 29,
    threshold: 102.5,
    rate1: 2.1,
    rate2: 1.4,
  },
  nt: {
    name: "新界",
    base: 25.5,
    threshold: 82.5,
    rate1: 1.9,
    rate2: 1.4,
  },
  lantau: {
    name: "大嶼山",
    base: 24,
    threshold: 195,
    rate1: 1.9,
    rate2: 1.6,
  },
};

const formatHKD = (value) => {
  const rounded = Math.round(value * 10) / 10;
  return rounded % 1 === 0 ? `$${rounded.toFixed(0)}` : `$${rounded.toFixed(1)}`;
};

const getNumber = (element, min = 0) => {
  const raw = Number(element?.value ?? 0);
  if (Number.isNaN(raw)) return min;
  return Math.max(min, raw);
};

const normalizeInt = (element, min = 0) => {
  const value = Math.max(min, Math.round(getNumber(element, min)));
  if (element) element.value = String(value);
  return value;
};

const computeStepCharge = (steps, rate, startFare) => {
  let charge = 0;
  let running = startFare;
  for (let i = 0; i < steps; i += 1) {
    const stepRate = running < rate.threshold ? rate.rate1 : rate.rate2;
    charge += stepRate;
    running += stepRate;
  }
  return charge;
};

const calculateTolls = () => {
  let total = 0;
  document.querySelectorAll(".tunnel-card").forEach((card) => {
    const useToggle = card.querySelector(".tunnel-toggle");
    const returnToggle = card.querySelector(".return-toggle");
    if (!useToggle || !useToggle.checked) return;
    total += Number(useToggle.dataset.fee || 0);
    if (returnToggle?.checked) {
      total += Number(returnToggle.dataset.return || 0);
    }
  });

  const lantauTunnel = getNumber(document.getElementById("lantau-tunnel"), 0);
  const otherToll = getNumber(document.getElementById("other-toll"), 0);
  total += lantauTunnel + otherToll;
  return total;
};

const updateTotals = () => {
  const distanceInput = document.getElementById("distance");
  const waitingInput = document.getElementById("waiting");
  const passengersInput = document.getElementById("passengers");
  const luggageInput = document.getElementById("luggage");
  const animalsInput = document.getElementById("animals");
  const bookingInput = document.getElementById("booking");
  const discountInput = document.getElementById("discount");

  const distance = getNumber(distanceInput, 0);
  const waiting = getNumber(waitingInput, 0);
  const passengers = normalizeInt(passengersInput, 1);

  const taxiType = document.querySelector('input[name="taxi-type"]:checked')?.value || "urban";
  const rate = TAXI_RATES[taxiType] || TAXI_RATES.urban;

  const baseFare = rate.base;
  const distanceSteps = Math.ceil(Math.max(0, distance - 2) / 0.2);
  const distanceCharge = computeStepCharge(distanceSteps, rate, baseFare);

  const waitingSteps = Math.ceil(waiting);
  const waitingCharge = computeStepCharge(waitingSteps, rate, baseFare + distanceCharge);

  const luggage = normalizeInt(luggageInput, 0);
  const animals = normalizeInt(animalsInput, 0);
  const booking = bookingInput?.checked ? 5 : 0;
  const extras = luggage * 6 + animals * 5 + booking;

  const tolls = calculateTolls();

  const grossTotal = baseFare + distanceCharge + waitingCharge + extras + tolls;
  const discountPercent = Math.min(100, getNumber(discountInput, 0));
  const discountAmount = grossTotal * (discountPercent / 100);
  const total = grossTotal - discountAmount;
  const perPerson = total / passengers;

  document.getElementById("base-fare").textContent = formatHKD(baseFare);
  document.getElementById("distance-fare").textContent = formatHKD(distanceCharge);
  document.getElementById("waiting-fare").textContent = formatHKD(waitingCharge);
  document.getElementById("extras-fare").textContent = formatHKD(extras);
  document.getElementById("toll-fare").textContent = formatHKD(tolls);
  document.getElementById("discount-fare").textContent = `-${formatHKD(discountAmount)}`;
  document.getElementById("total").textContent = formatHKD(total);
  document.getElementById("per-person").textContent = formatHKD(perPerson);
  document.getElementById("hero-total").textContent = formatHKD(total);
};

const bindInputs = () => {
  const form = document.getElementById("fare-form");
  if (!form) return;

  form.querySelectorAll("input").forEach((input) => {
    input.addEventListener("input", updateTotals);
    input.addEventListener("change", updateTotals);
    input.addEventListener("blur", updateTotals);
  });
};

const resetAll = () => {
  document.getElementById("distance").value = "0";
  document.getElementById("waiting").value = "0";
  document.getElementById("passengers").value = "1";
  document.getElementById("luggage").value = "0";
  document.getElementById("animals").value = "0";
  document.getElementById("booking").checked = false;
  document.getElementById("discount").value = "0";
  document.getElementById("lantau-tunnel").value = "0";
  document.getElementById("other-toll").value = "0";

  document.querySelectorAll('.tunnel-toggle, .return-toggle').forEach((toggle) => {
    toggle.checked = false;
  });

  const defaultTaxi = document.querySelector('input[name="taxi-type"][value="urban"]');
  if (defaultTaxi) defaultTaxi.checked = true;

  updateTotals();
};

const resetButton = document.getElementById("reset");
if (resetButton) {
  resetButton.addEventListener("click", resetAll);
}

bindInputs();
updateTotals();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js");
  });
}
