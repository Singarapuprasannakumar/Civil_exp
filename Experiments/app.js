/* ==========================================================================
   GeoLab AI - Geotechnical Soil Testing Suite
   Main Interactive Application Logic
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide Icons
  if (window.lucide) {
    lucide.createIcons();
  }

  // State Management
  const state = {
    filter: 'all',
    searchQuery: '',
    viewMode: 'grid',
    activeTest: null,
    darkMode: false,
    tests: [
      {
        id: 1,
        num: '01',
        title: 'Moisture Content',
        desc: 'Determine the moisture content of soil sample',
        icon: 'droplet',
        iconBg: 'rgba(37, 99, 235, 0.12)',
        iconColor: '#2563EB',
        status: 'Active',
        inputs: [
          { label: 'Container Mass M1 (g)', id: 'inpM1', default: 25.4 },
          { label: 'Wet Soil + Container M2 (g)', id: 'inpM2', default: 142.8 },
          { label: 'Dry Soil + Container M3 (g)', id: 'inpM3', default: 124.6 }
        ]
      },
      {
        id: 2,
        num: '02',
        title: 'Specific Gravity',
        desc: 'Determine specific gravity of soil particles',
        icon: 'scale',
        iconBg: 'rgba(20, 184, 166, 0.12)',
        iconColor: '#14B8A6',
        status: 'Active',
        inputs: [
          { label: 'Pycnometer Mass M1 (g)', id: 'inpM1', default: 450.0 },
          { label: 'Pycnometer + Dry Soil M2 (g)', id: 'inpM2', default: 950.0 },
          { label: 'Pycnometer + Soil + Water M3 (g)', id: 'inpM3', default: 1580.0 },
          { label: 'Pycnometer + Water M4 (g)', id: 'inpM4', default: 1265.0 }
        ]
      },
      {
        id: 3,
        num: '03',
        title: 'Liquid Limit',
        desc: 'Determine the liquid limit of soil',
        icon: 'test-tube-2',
        iconBg: 'rgba(245, 158, 11, 0.12)',
        iconColor: '#F59E0B',
        status: 'Active'
      },
      {
        id: 4,
        num: '04',
        title: 'Plastic Limit',
        desc: 'Determine the plastic limit of soil',
        icon: 'pen-tool',
        iconBg: 'rgba(239, 68, 68, 0.12)',
        iconColor: '#EF4444',
        status: 'Active'
      },
      {
        id: 5,
        num: '05',
        title: 'Shrinkage Limit',
        desc: 'Determine the shrinkage limit of soil',
        icon: 'layers',
        iconBg: 'rgba(16, 185, 129, 0.12)',
        iconColor: '#10B981',
        status: 'Active'
      },
      {
        id: 6,
        num: '06',
        title: 'DFSI',
        desc: 'Determine the Free Swell Index',
        icon: 'activity',
        iconBg: 'rgba(124, 58, 237, 0.12)',
        iconColor: '#7C3AED',
        status: 'Active'
      },
      {
        id: 7,
        num: '07',
        title: 'Sand Replacement Method',
        desc: 'Determine density by sand replacement method',
        icon: 'cone',
        iconBg: 'rgba(245, 158, 11, 0.12)',
        iconColor: '#D97706',
        status: 'Active'
      },
      {
        id: 8,
        num: '08',
        title: 'Core Cutter Method',
        desc: 'Determine density by core cutter method',
        icon: 'cylinder',
        iconBg: 'rgba(16, 185, 129, 0.12)',
        iconColor: '#059669',
        status: 'Active'
      },
      {
        id: 9,
        num: '09',
        title: 'Sieve Analysis',
        desc: 'Particle size distribution analysis by sieving',
        icon: 'filter',
        iconBg: 'rgba(37, 99, 235, 0.12)',
        iconColor: '#2563EB',
        status: 'Active'
      },
      {
        id: 10,
        num: '10',
        title: 'IS Light Compaction Test',
        desc: 'Determine compaction characteristics (Light)',
        icon: 'hammer',
        iconBg: 'rgba(239, 68, 68, 0.12)',
        iconColor: '#DC2626',
        status: 'Active'
      },
      {
        id: 11,
        num: '11',
        title: 'Falling Head Permeability Test',
        desc: 'Determine permeability using falling head',
        icon: 'gauge',
        iconBg: 'rgba(20, 184, 166, 0.12)',
        iconColor: '#0D9488',
        status: 'Active'
      },
      {
        id: 12,
        num: '12',
        title: 'Constant Head Permeability Test',
        desc: 'Determine permeability using constant head',
        icon: 'waves',
        iconBg: 'rgba(37, 99, 235, 0.12)',
        iconColor: '#2563EB',
        status: 'Active'
      },
      {
        id: 13,
        num: '13',
        title: 'Direct Shear Test',
        desc: 'Determine shear strength parameters',
        icon: 'move-horizontal',
        iconBg: 'rgba(239, 68, 68, 0.12)',
        iconColor: '#EF4444',
        status: 'Active'
      },
      {
        id: 14,
        num: '14',
        title: 'UCS Test',
        desc: 'Unconfined compressive strength test',
        icon: 'arrow-down-to-line',
        iconBg: 'rgba(20, 184, 166, 0.12)',
        iconColor: '#14B8A6',
        status: 'Active'
      },
      {
        id: 15,
        num: '15',
        title: 'Vane Shear Test',
        desc: 'Determine undrained shear strength using vane',
        icon: 'compass',
        iconBg: 'rgba(239, 68, 68, 0.12)',
        iconColor: '#DC2626',
        status: 'Active'
      },
      {
        id: 16,
        num: '16',
        title: 'California Bearing Ratio (CBR)',
        desc: 'California Bearing Ratio test',
        icon: 'shield-check',
        iconBg: 'rgba(124, 58, 237, 0.12)',
        iconColor: '#7C3AED',
        status: 'Active'
      }
    ]
  };

  // DOM Elements Reference
  const testCardsGrid = document.getElementById('testCardsGrid');
  const testSearchInput = document.getElementById('testSearchInput');
  const filterTabs = document.querySelectorAll('.filter-tab');
  const btnGridView = document.getElementById('btnGridView');
  const btnListView = document.getElementById('btnListView');
  const themeToggleBtn = document.getElementById('themeToggleBtn');

  // Modals
  const experimentModal = document.getElementById('experimentModal');
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  const commandPaletteModal = document.getElementById('commandPaletteModal');
  const globalSearchTrigger = document.getElementById('globalSearchTrigger');
  const cmdInput = document.getElementById('cmdInput');
  const cmdResultsList = document.getElementById('cmdResultsList');

  let expChart = null;

  /* --------------------------------------------------------------------------
     Render Test Cards Grid
     -------------------------------------------------------------------------- */
  function renderTestCards() {
    if (!testCardsGrid) return;
    
    testCardsGrid.innerHTML = '';
    
    const filtered = state.tests.filter(test => {
      const matchesFilter = (state.filter === 'all') || (test.status.toLowerCase() === state.filter.toLowerCase());
      const matchesSearch = test.title.toLowerCase().includes(state.searchQuery.toLowerCase()) || 
                            test.desc.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
                            test.num.includes(state.searchQuery);
      return matchesFilter && matchesSearch;
    });

    if (filtered.length === 0) {
      testCardsGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 48px; color: var(--text-secondary);">
          <i data-lucide="flask-conical-off" style="width: 48px; height: 48px; margin-bottom: 12px; opacity: 0.5;"></i>
          <h3>No matching laboratory tests found</h3>
          <p style="font-size: 12px; margin-top: 4px;">Try adjusting your search query or filter settings.</p>
        </div>
      `;
      lucide.createIcons();
      return;
    }

    filtered.forEach(test => {
      const card = document.createElement('div');
      card.className = 'test-card';
      card.setAttribute('data-id', test.id);
      
      let badgeClass = 'status-active';
      if (test.status === 'Pending') badgeClass = 'status-pending';
      if (test.status === 'Completed') badgeClass = 'status-completed';

      card.innerHTML = `
        <div class="test-card-header">
          <div class="test-icon-box" style="background-color: ${test.iconBg}; color: ${test.iconColor}">
            <i data-lucide="${test.icon}"></i>
          </div>
          <span class="exp-number">${test.num}</span>
        </div>
        
        <div class="test-card-body">
          <h3 class="test-card-title">${test.title}</h3>
          <p class="test-card-desc">${test.desc}</p>
        </div>

        <div class="test-card-footer">
          <span class="status-badge ${badgeClass}">${test.status}</span>
          <button class="btn-open-test" onclick="openTestModal(${test.id})">
            <span>Open</span>
            <i data-lucide="arrow-right" style="width: 14px; height: 14px;"></i>
          </button>
        </div>
      `;

      testCardsGrid.appendChild(card);
    });

    lucide.createIcons();
  }

  /* --------------------------------------------------------------------------
     Interactive Experiment Modal & Calculator
     -------------------------------------------------------------------------- */
  window.openTestModal = function(testId) {
    const test = state.tests.find(t => t.id === testId);
    if (!test) return;

    state.activeTest = test;

    document.getElementById('modalExpNum').textContent = test.num;
    document.getElementById('modalTestTitle').textContent = test.title;
    document.getElementById('modalTestDesc').textContent = test.desc;

    experimentModal.classList.add('active');
    calculateMoistureContent();
    renderChart(test);
  };

  function closeModal() {
    experimentModal.classList.remove('active');
  }

  if (modalCloseBtn) {
    modalCloseBtn.addEventListener('click', closeModal);
  }

  // Calculate Moisture Content
  const btnCalculateExp = document.getElementById('btnCalculateExp');
  if (btnCalculateExp) {
    btnCalculateExp.addEventListener('click', calculateMoistureContent);
  }

  function calculateMoistureContent() {
    const m1 = parseFloat(document.getElementById('inpM1')?.value || 25.4);
    const m2 = parseFloat(document.getElementById('inpM2')?.value || 142.8);
    const m3 = parseFloat(document.getElementById('inpM3')?.value || 124.6);

    const mw = m2 - m3; // Mass of water
    const md = m3 - m1; // Dry mass of soil
    let w = 0;
    if (md > 0) {
      w = (mw / md) * 100;
    }

    document.getElementById('resWaterContent').textContent = w.toFixed(2) + ' %';
    document.getElementById('resDryMass').textContent = md.toFixed(2) + ' g';
    document.getElementById('resWaterMass').textContent = mw.toFixed(2) + ' g';

    showToast(`Calculated ${state.activeTest?.title || 'Test'}: ${w.toFixed(2)}% moisture content`);
    updateChartData(w);
  }

  /* --------------------------------------------------------------------------
     Chart Rendering with Chart.js
     -------------------------------------------------------------------------- */
  function renderChart(test) {
    const ctx = document.getElementById('expChartCanvas')?.getContext('2d');
    if (!ctx) return;

    if (expChart) {
      expChart.destroy();
    }

    const isDarkMode = document.body.classList.contains('dark-mode');
    const textColor = isDarkMode ? '#94A3B8' : '#6B7280';
    const gridColor = isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';

    expChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Trial 1', 'Trial 2', 'Trial 3', 'Trial 4', 'Trial 5'],
        datasets: [{
          label: `${test.title} Curves`,
          data: [15.2, 17.1, 18.35, 19.8, 22.0],
          borderColor: '#2563EB',
          backgroundColor: 'rgba(37, 99, 235, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 5,
          pointBackgroundColor: '#2563EB'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          x: {
            grid: { color: gridColor },
            ticks: { color: textColor }
          },
          y: {
            grid: { color: gridColor },
            ticks: { color: textColor }
          }
        }
      }
    });
  }

  function updateChartData(val) {
    if (!expChart) return;
    expChart.data.datasets[0].data[2] = val;
    expChart.update();
  }

  /* --------------------------------------------------------------------------
     Toolbar Controls (Search, Filters, View Modes)
     -------------------------------------------------------------------------- */
  if (testSearchInput) {
    testSearchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value;
      renderTestCards();
    });
  }

  filterTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      filterTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      state.filter = tab.getAttribute('data-filter');
      renderTestCards();
    });
  });

  if (btnGridView && btnListView) {
    btnGridView.addEventListener('click', () => {
      btnGridView.classList.add('active');
      btnListView.classList.remove('active');
      testCardsGrid.classList.remove('list-view');
    });

    btnListView.addEventListener('click', () => {
      btnListView.classList.add('active');
      btnGridView.classList.remove('active');
      testCardsGrid.classList.add('list-view');
    });
  }

  /* --------------------------------------------------------------------------
     Theme Toggle (Light / Dark Mode)
     -------------------------------------------------------------------------- */
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      state.darkMode = !state.darkMode;
      document.body.classList.toggle('dark-mode', state.darkMode);
      
      const icon = themeToggleBtn.querySelector('i');
      if (icon) {
        icon.setAttribute('data-lucide', state.darkMode ? 'sun' : 'moon');
        lucide.createIcons();
      }

      showToast(`Switched to ${state.darkMode ? 'Dark' : 'Light'} Mode`);
      if (state.activeTest) renderChart(state.activeTest);
    });
  }

  /* --------------------------------------------------------------------------
     Command Palette (Ctrl + K)
     -------------------------------------------------------------------------- */
  function toggleCommandPalette(show) {
    if (show) {
      commandPaletteModal.classList.add('active');
      cmdInput.focus();
      renderCmdResults();
    } else {
      commandPaletteModal.classList.remove('active');
    }
  }

  if (globalSearchTrigger) {
    globalSearchTrigger.addEventListener('click', () => toggleCommandPalette(true));
  }

  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      toggleCommandPalette(true);
    }
    if (e.key === 'Escape') {
      toggleCommandPalette(false);
      closeModal();
    }
  });

  function renderCmdResults() {
    if (!cmdResultsList) return;
    const query = cmdInput.value.toLowerCase();
    
    cmdResultsList.innerHTML = '';
    
    const results = state.tests.filter(t => t.title.toLowerCase().includes(query) || t.num.includes(query));
    
    results.forEach(res => {
      const item = document.createElement('div');
      item.className = 'cmd-item';
      item.innerHTML = `
        <i data-lucide="${res.icon}" style="width: 18px; height: 18px; color: var(--primary);"></i>
        <div>
          <div style="font-weight: 600;">[${res.num}] ${res.title}</div>
          <div style="font-size: 11px; color: var(--text-secondary);">${res.desc}</div>
        </div>
      `;
      item.addEventListener('click', () => {
        toggleCommandPalette(false);
        openTestModal(res.id);
      });
      cmdResultsList.appendChild(item);
    });

    lucide.createIcons();
  }

  if (cmdInput) {
    cmdInput.addEventListener('input', renderCmdResults);
  }

  /* --------------------------------------------------------------------------
     Toast Notification System
     -------------------------------------------------------------------------- */
  function showToast(message) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
      <i data-lucide="info" style="width: 18px; height: 18px; color: var(--primary);"></i>
      <span>${message}</span>
    `;

    container.appendChild(toast);
    lucide.createIcons();

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 200ms ease';
      setTimeout(() => toast.remove(), 250);
    }, 3000);
  }

  /* --------------------------------------------------------------------------
     Quick Actions Event Handlers
     -------------------------------------------------------------------------- */
  document.getElementById('btnImportData')?.addEventListener('click', () => showToast('Opening Lab Data Import Wizard...'));
  document.getElementById('btnGenerateReport')?.addEventListener('click', () => showToast('Generating Master Soil Test Summary Report...'));
  document.getElementById('btnAiAnalysis')?.addEventListener('click', () => showToast('AI Assistant Analyzing Soil Failure Envelopes & CBR curves...'));
  document.getElementById('btnExportPdf')?.addEventListener('click', () => showToast('Exporting Geotechnical Report PDF...'));
  document.getElementById('btnNewTest')?.addEventListener('click', () => showToast('Opening New Test Registration Form...'));
  document.getElementById('btnSaveDraft')?.addEventListener('click', () => showToast('Test parameters saved as draft!'));
  document.getElementById('btnExportReportModal')?.addEventListener('click', () => {
    showToast('Report generated & saved to database successfully!');
    closeModal();
  });

  // Initial Render
  renderTestCards();
});
