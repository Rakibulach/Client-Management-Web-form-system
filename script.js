/* =============================================================
   BISWAS IT FARM — Client Onboarding Form Logic
   ============================================================= */

(function () {
  "use strict";

  var STORAGE_KEY = "bif_client_submissions";

  var form = document.getElementById("clientForm");
  var serviceError = document.getElementById("serviceError");
  var successAlert = document.getElementById("successAlert");
  var requirementField = document.getElementById("requirement");
  var charCounter = document.getElementById("charCounter");
  var submissionsSection = document.getElementById("submissions");
  var submissionsEmpty = document.getElementById("submissionsEmpty");
  var tableWrap = document.getElementById("tableWrap");
  var tableBody = document.getElementById("clientsTableBody");
  var clearAllBtn = document.getElementById("clearAllBtn");
  var submissionCountEl = document.getElementById("submissionCount");

  /* ---------------------------------------------------------
     Character counter for requirements textarea
  --------------------------------------------------------- */
  if (requirementField && charCounter) {
    var maxLen = 800;
    requirementField.setAttribute("maxlength", maxLen);
    function updateCounter() {
      charCounter.textContent = requirementField.value.length + " / " + maxLen;
    }
    requirementField.addEventListener("input", updateCounter);
    updateCounter();
  }

  /* ---------------------------------------------------------
     Service selection: at least one checkbox required
  --------------------------------------------------------- */
  function getSelectedServices() {
    var checked = form.querySelectorAll('input[name="services"]:checked');
    return Array.prototype.map.call(checked, function (el) { return el.value; });
  }

  function validateServices() {
    var valid = getSelectedServices().length > 0;
    serviceError.classList.toggle("show", !valid);
    return valid;
  }

  form.querySelectorAll('input[name="services"]').forEach(function (cb) {
    cb.addEventListener("change", validateServices);
  });

  /* ---------------------------------------------------------
     Phone: light custom pattern validity message
  --------------------------------------------------------- */
  var phoneField = document.getElementById("phone");
  if (phoneField) {
    phoneField.addEventListener("input", function () {
      phoneField.setCustomValidity("");
    });
  }

  /* ---------------------------------------------------------
     Bootstrap-style validation on submit
  --------------------------------------------------------- */
  form.addEventListener("submit", function (event) {
    event.preventDefault();
    event.stopPropagation();

    var servicesValid = validateServices();
    var formValid = form.checkValidity();

    form.classList.add("was-validated");

    if (!formValid || !servicesValid) {
      var firstInvalid = form.querySelector(":invalid");
      if (!servicesValid && (!firstInvalid || getFieldOrder(firstInvalid) > getFieldOrder(document.getElementById("serviceFieldset")))) {
        document.getElementById("serviceFieldset").scrollIntoView({ behavior: "smooth", block: "center" });
      } else if (firstInvalid) {
        firstInvalid.scrollIntoView({ behavior: "smooth", block: "center" });
        firstInvalid.focus({ preventScroll: true });
      }
      return;
    }

    submitForm();
  });

  function getFieldOrder(el) {
    var all = Array.prototype.slice.call(form.elements);
    return all.indexOf(el);
  }

  /* ---------------------------------------------------------
     Build + persist a submission, then reset + render
  --------------------------------------------------------- */
  function submitForm() {
    var submitBtn = document.getElementById("submitBtn");
    submitBtn.disabled = true;
    submitBtn.innerHTML = "Submitting&hellip;";

    var data = {
  id: "C" + Date.now(),
  clientName: document.getElementById("clientName").value.trim(),
  businessName: document.getElementById("businessName").value.trim(),
  email: document.getElementById("email").value.trim(),
  phone: document.getElementById("phone").value.trim(),
  businessUrl: document.getElementById("businessUrl").value.trim(),
  services: getSelectedServices(),
  budget: document.getElementById("budget").value,
  requirement: requirementField.value.trim(),
  submittedAt: new Date().toISOString()
};

  
    setTimeout(function () {
      saveSubmission(data);
      renderSubmissions();

      form.reset();
      form.classList.remove("was-validated");
      serviceError.classList.remove("show");
      if (charCounter) charCounter.textContent = "0 / 800";

      successAlert.classList.add("show");
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Submit client details <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

      setTimeout(function () { successAlert.classList.remove("show"); }, 5000);
      submissionsSection.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 500);
  }

  /* ---------------------------------------------------------
     LocalStorage persistence
  --------------------------------------------------------- */
  function getSubmissions() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveSubmission(entry) {
    var all = getSubmissions();
    all.unshift(entry);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    } catch (e) {
      console.error("Could not save submission:", e);
    }
  }

  function deleteSubmission(id) {
    var all = getSubmissions().filter(function (item) { return item.id !== id; });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    renderSubmissions();
  }

  function clearAllSubmissions() {
    localStorage.removeItem(STORAGE_KEY);
    renderSubmissions();
  }

  /* ---------------------------------------------------------
     Rendering the submissions table
  --------------------------------------------------------- */
  var SERVICE_LABELS = {
    web_design: "Web Design",
    development: "Development",
    seo: "SEO & Growth",
    branding: "Brand Identity",
    app: "Mobile App",
    maintenance: "Maintenance",
    other: "Other"
  };

  var BUDGET_LABELS = {
    under_500: "< $500",
    "500_1000": "$500 – $1,000",
    "1000_3000": "$1,000 – $3,000",
    "3000_5000": "$3,000 – $5,000",
    over_5000: "$5,000+"
  };

  function formatDate(iso) {
    var d = new Date(iso);
    var opts = { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" };
    return d.toLocaleString(undefined, opts);
  }

  function escapeHTML(str) {
    var div = document.createElement("div");
    div.textContent = str == null ? "" : str;
    return div.innerHTML;
  }

  function renderSubmissions() {
    var all = getSubmissions();
    submissionCountEl.textContent = all.length;

    if (all.length === 0) {
      submissionsEmpty.style.display = "block";
      tableWrap.style.display = "none";
      return;
    }

    submissionsEmpty.style.display = "none";
    tableWrap.style.display = "block";

    tableBody.innerHTML = all.map(function (item) {
      var serviceTags = (item.services || []).map(function (s) {
        return '<span class="tag">' + escapeHTML(SERVICE_LABELS[s] || s) + '</span>';
      }).join("");

      var budgetLabel = BUDGET_LABELS[item.budget] || escapeHTML(item.budget || "—");

      return (
        '<tr data-id="' + item.id + '">' +
          '<td class="cell-name"><b>' + escapeHTML(item.clientName) + '</b><span>' + escapeHTML(item.email) + '</span></td>' +
          '<td>' +
  '<b>' + escapeHTML(item.businessName) + '</b><br>' +
  '<span class="row-date">' + escapeHTML(item.phone) + '</span>' +
  (item.businessUrl
    ? '<br><a href="' + escapeHTML(item.businessUrl) + '" target="_blank" rel="noopener noreferrer" class="business-link">View Page</a>'
    : '') +
'</td>' +
          '<td><div class="tag-list">' + serviceTags + '</div></td>' +
          '<td><span class="budget-badge">' + budgetLabel + '</span></td>' +
          '<td><span class="req-preview" title="' + escapeHTML(item.requirement) + '">' + escapeHTML(item.requirement) + '</span></td>' +
          '<td class="row-date">' + formatDate(item.submittedAt) + '</td>' +
          '<td>' +
            '<button type="button" class="btn-delete-row" aria-label="Delete this submission" data-delete="' + item.id + '">' +
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6h16z"/></svg>' +
            '</button>' +
          '</td>' +
        '</tr>'
      );
    }).join("");

    tableBody.querySelectorAll("[data-delete]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        deleteSubmission(btn.getAttribute("data-delete"));
      });
    });
  }

  if (clearAllBtn) {
    clearAllBtn.addEventListener("click", function () {
      if (getSubmissions().length === 0) return;
      if (window.confirm("Clear all saved client submissions? This cannot be undone.")) {
        clearAllSubmissions();
      }
    });
  }

  /* ---------------------------------------------------------
     Init
  --------------------------------------------------------- */
  document.addEventListener("DOMContentLoaded", function () {
    renderSubmissions();
  });

  renderSubmissions();
})();
