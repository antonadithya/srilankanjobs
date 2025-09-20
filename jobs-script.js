// Jobs Page JavaScript Functionality

// Google Sheets configuration  
const SHEET_ID = '1rVY0Pey-LcukEKqL-CUABs01WVAW7nV2uHgexUEYQ8k';

// Get URL parameters
const params = new URLSearchParams(window.location.search);
let SHEET_NAME = params.get("category") || params.get("sheet") || "IT-Sware/DB/QA/Web/Graphics/GIS";

// Make SHEET_NAME globally accessible
window.SHEET_NAME = SHEET_NAME;

// Multiple URL strategies to handle CORS issues
const BASE_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}`;
const GVIZ_URL = `${BASE_URL}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(SHEET_NAME)}`;
const EXPORT_URL = `${BASE_URL}/export?format=csv&sheet=${encodeURIComponent(SHEET_NAME)}`;
const PROXY_URL = `proxy.php?url=${encodeURIComponent(GVIZ_URL)}`;

// Get the jobs container
const container = document.getElementById("jobs-container");

// Global variables for filtering
let currentJobs = [];
let filteredJobs = [];
let currentPage = 1; // kept for compatibility
const jobsPerPage = Number.MAX_SAFE_INTEGER; // show all jobs, pagination disabled
let currentFilters = {
  category: SHEET_NAME,
  search: '',
  location: '',
  jobType: [],
  experience: [],
  companySize: [],
  sortBy: 'recent'
};

// Category mapping from sheet names to display names
const categoryMapping = {
  'IT-Sware/DB/QA/Web/Graphics/GIS': 'IT & Software',
  'Accounting/Auditing/Finance': 'Finance & Accounting',
  'Banking & Finance/Insurance': 'Banking & Finance',
  'Sales/Marketing/Merchandising': 'Sales & Marketing',
  'HR/Training': 'HR & Training',
  'Corporate Management/Analysts': 'Corporate Management',
  'Education': 'Education',
  'Digital Marketing': 'Digital Marketing',
  'Hospital/Nursing/Healthcare': 'Healthcare',
  'Legal/Law': 'Legal',
  'Eng-Mech/Auto/Elec': 'Engineering'
};

// Demo/Mock data for testing when Google Sheets is not available
const mockJobsData = {
  'IT-Sware/DB/QA/Web/Graphics/GIS': [
    {
      title: 'Senior Software Engineer',
      company: 'TechCorp Lanka',
      location: 'Colombo',
      jobType: 'Full-time',
      experience: 'Mid-level',
      salary: 'LKR 150,000 - 200,000',
      description: 'We are looking for a Senior Software Engineer to join our dynamic team...',
      requirements: 'Bachelor\'s in Computer Science, 3+ years experience',
      postedDate: '2025-01-20',
      applicationLink: '#'
    },
    {
      title: 'Full Stack Developer',
      company: 'Innovation Labs',
      location: 'Kandy',
      jobType: 'Full-time',
      experience: 'Entry-level',
      salary: 'LKR 80,000 - 120,000',
      description: 'Join our team as a Full Stack Developer and work on exciting projects...',
      requirements: 'Knowledge of React, Node.js, MongoDB',
      postedDate: '2025-01-19',
      applicationLink: '#'
    },
    {
      title: 'UI/UX Designer',
      company: 'Design Studio LK',
      location: 'Colombo',
      jobType: 'Full-time',
      experience: 'Mid-level',
      salary: 'LKR 100,000 - 140,000',
      description: 'Create beautiful and intuitive user interfaces...',
      requirements: 'Portfolio, Figma, Adobe Creative Suite',
      postedDate: '2025-01-18',
      applicationLink: '#'
    },
    {
      title: 'DevOps Engineer',
      company: 'CloudTech Solutions',
      location: 'Remote',
      jobType: 'Full-time',
      experience: 'Senior-level',
      salary: 'LKR 180,000 - 250,000',
      description: 'Manage our cloud infrastructure and deployment pipelines...',
      requirements: 'AWS, Docker, Kubernetes, CI/CD',
      postedDate: '2025-01-17',
      applicationLink: '#'
    }
  ],
  'Accounting/Auditing/Finance': [
    {
      title: 'Senior Accountant',
      company: 'Finance Corp',
      location: 'Colombo',
      jobType: 'Full-time',
      experience: 'Mid-level',
      salary: 'LKR 80,000 - 120,000',
      description: 'Handle financial reporting and analysis...',
      requirements: 'CA/ACCA, 3+ years experience',
      postedDate: '2025-01-20',
      applicationLink: '#'
    },
    {
      title: 'Financial Analyst',
      company: 'Investment Bank LK',
      location: 'Colombo',
      jobType: 'Full-time',
      experience: 'Entry-level',
      salary: 'LKR 60,000 - 90,000',
      description: 'Perform financial analysis and reporting...',
      requirements: 'Bachelor\'s in Finance, Excel proficiency',
      postedDate: '2025-01-19',
      applicationLink: '#'
    }
  ],
  'HR/Training': [
    {
      title: 'HR Manager',
      company: 'People Solutions',
      location: 'Galle',
      jobType: 'Full-time',
      experience: 'Senior-level',
      salary: 'LKR 120,000 - 160,000',
      description: 'Lead HR operations and strategy...',
      requirements: 'HR degree, 5+ years experience',
      postedDate: '2025-01-20',
      applicationLink: '#'
    }
  ]
};

// Cache object to store preloaded job data
const jobsDataCache = {};

// Initialize the page
// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
  initializeJobsPage();
  setupEventListeners();
  updatePageTitleAndCategory();
  
  // Small delay to ensure everything is properly initialized
  setTimeout(() => {
    loadJobs();
  }, 300);
  
  // Preload common categories data in the background
  setTimeout(() => {
    preloadCommonCategories();
  }, 2000);
});

function initializeJobsPage() {
  // Check URL parameters for category filter
  const urlParams = new URLSearchParams(window.location.search);
  const categoryParam = urlParams.get('category');
  const allParam = urlParams.get('all');
  
  if (allParam === 'true') {
    // Handle "All Jobs" view
    currentFilters.category = 'all';
    document.getElementById('current-category').textContent = 'All Categories';
    document.getElementById('jobs-results-title').textContent = 'All Jobs';
    updateCategorySelection('all');
  } 
  else if (categoryParam && categoryParam !== 'all') {
    currentFilters.category = categoryParam;
    updateCategorySelection(categoryParam);
  }
  
  // Update page title based on category
  updatePageTitleAndCategory();
}

function setupEventListeners() {
  // Search functionality
  document.getElementById('job-search').addEventListener('input', debounce(handleSearch, 300));
  document.getElementById('location-filter').addEventListener('change', handleLocationFilter);
  document.getElementById('search-jobs-btn').addEventListener('click', performSearch);
  
  // Category filter
  document.querySelectorAll('.category-item').forEach(item => {
    item.addEventListener('click', () => handleCategoryFilter(item.dataset.category));
  });
  
  // Checkbox filters
  document.querySelectorAll('.filter-checkbox input').forEach(checkbox => {
    checkbox.addEventListener('change', handleCheckboxFilter);
  });
  
  // Sort dropdown
  document.getElementById('sort-jobs').addEventListener('change', handleSort);
  
  // View toggle
  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.addEventListener('click', () => handleViewToggle(btn.dataset.view));
  });
  
  // Clear filters
  document.querySelector('.clear-filters-btn').addEventListener('click', clearAllFilters);
  
  // Pagination (disabled)
  setupPaginationEvents();
}

// Enhanced Filter Bar Functionality
document.addEventListener('DOMContentLoaded', function() {
  // Initialize filter pills
  const filterPills = document.querySelectorAll('.filter-pill');
  const dateFilter = document.getElementById('date-filter');
  const sortDropdown = document.getElementById('sort-jobs');
  const viewToggle = document.querySelectorAll('.view-btn');
  const jobSearch = document.getElementById('job-search');
  const locationFilter = document.getElementById('location-filter');
  
  // Search input handler
  if (jobSearch) {
    jobSearch.addEventListener('input', function() {
      currentFilters.search = this.value;
      applyFilters();
    });
  }
  
  // Location filter handler
  if (locationFilter) {
    locationFilter.addEventListener('change', function() {
      currentFilters.location = this.value;
      applyFilters();
    });
  }
  
  // Filter pill click handlers
  filterPills.forEach(pill => {
    pill.addEventListener('click', function() {
      // Remove active class from all pills
      filterPills.forEach(p => p.classList.remove('active'));
      // Add active class to clicked pill
      this.classList.add('active');
      
      const filterType = this.dataset.filter;
      applyQuickFilter(filterType);
    });
  });
  
  // Date filter change handler
  if (dateFilter) {
    dateFilter.addEventListener('change', function() {
      currentFilters.dateRange = this.value;
      applyFilters();
    });
  }
  
  // Sort dropdown change handler
  if (sortDropdown) {
    sortDropdown.addEventListener('change', function() {
      currentFilters.sortBy = this.value;
      sortJobs();
      displayJobs();
    });
  }
  
  // View toggle handlers
  viewToggle.forEach(btn => {
    btn.addEventListener('click', function() {
      viewToggle.forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      
      const view = this.dataset.view;
      toggleView(view);
    });
  });
});

function handleSearch() {
  const searchTerm = document.getElementById('job-search').value.trim();
  currentFilters.search = searchTerm;
  applyFilters();
}

function handleLocationFilter() {
  const location = document.getElementById('location-filter').value;
  currentFilters.location = location;
  applyFilters();
}

function performSearch() {
  handleSearch();
  handleLocationFilter();
}

function handleCategoryFilter(category) {
  currentFilters.category = category;
  updateCategorySelection(category);
  updateResultsTitle(category);
  
  // If "all" is selected, we need to load from all sheets
  // Otherwise, load from the specific category sheet
  if (category === 'all') {
    // Update the global SHEET_NAME and reload
    window.SHEET_NAME = 'SriLanka Job Posts';
  } else {
    // Update the global SHEET_NAME to the specific category
    window.SHEET_NAME = category;
  }
  
  // Reload jobs from the new sheet
  loadJobs();
}

function updateCategorySelection(category) {
  document.querySelectorAll('.category-item').forEach(item => {
    item.classList.toggle('active', item.dataset.category === category);
  });
}

function updateResultsTitle(category) {
  const titleElement = document.getElementById('jobs-results-title');
  if (category === 'all') {
    titleElement.textContent = 'All Jobs';
  } else {
    // Convert category to readable format
    const readableCategory = category.replace(/[/_]/g, ' & ');
    titleElement.textContent = `${readableCategory} Jobs`;
  }
}

function handleCheckboxFilter() {
  // Get all checked job types
  const jobTypes = Array.from(document.querySelectorAll('input[value^="full-time"], input[value^="part-time"], input[value^="contract"], input[value^="remote"], input[value^="internship"]'))
    .filter(cb => cb.checked)
    .map(cb => cb.value);
  
  // Get all checked experience levels
  const experienceLevels = Array.from(document.querySelectorAll('input[value^="entry"], input[value^="mid"], input[value^="senior"], input[value^="executive"]'))
    .filter(cb => cb.checked)
    .map(cb => cb.value);
  
  // Get all checked company sizes
  const companySizes = Array.from(document.querySelectorAll('input[value^="startup"], input[value^="medium"], input[value^="large"], input[value^="enterprise"]'))
    .filter(cb => cb.checked)
    .map(cb => cb.value);
  
  currentFilters.jobType = jobTypes;
  currentFilters.experience = experienceLevels;
  currentFilters.companySize = companySizes;
  
  applyFilters();
}

function handleSort() {
  const sortValue = document.getElementById('sort-jobs').value;
  currentFilters.sortBy = sortValue;
  applyFilters();
}

function handleViewToggle(view) {
  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === view);
  });
  
  const container = document.getElementById('jobs-container');
  if (view === 'grid') {
    container.className = 'jobs-grid-view';
  } else {
    container.className = 'jobs-list-view';
  }
}

function clearAllFilters() {
  // Reset filters
  currentFilters = {
    category: 'all',
    search: '',
    location: '',
    jobType: [],
    experience: [],
    companySize: [],
    sortBy: 'recent'
  };
  
  // Reset UI
  document.getElementById('job-search').value = '';
  document.getElementById('location-filter').value = '';
  document.getElementById('sort-jobs').value = 'recent';
  
  // Uncheck all checkboxes
  document.querySelectorAll('.filter-checkbox input').forEach(cb => {
    cb.checked = false;
  });
  
  // Reset category selection
  updateCategorySelection('all');
  updateResultsTitle('all');
  
  applyFilters();
}

// Apply quick filters
function applyQuickFilter(filterType) {
  // Reset other filters
  currentFilters.jobType = [];
  currentFilters.experience = [];
  currentFilters.companySize = [];
  
  switch(filterType) {
    case 'all':
      currentFilters.quickFilter = 'all';
      break;
    case 'remote':
      currentFilters.quickFilter = 'remote';
      break;
    case 'full-time':
      currentFilters.quickFilter = 'full-time';
      break;
    case 'entry-level':
      currentFilters.quickFilter = 'entry-level';
      break;
    case 'urgent':
      currentFilters.quickFilter = 'urgent';
      break;
  }
  
  applyFilters();
}

// Enhanced filter application
function applyFilters() {
  showLoading();
  
  // Simulate API delay
  setTimeout(() => {
    filteredJobs = currentJobs.filter(job => {
      // Category filter
      if (currentFilters.category !== 'all' && job.category !== currentFilters.category) {
        return false;
      }
      
      // Search filter
      if (currentFilters.search) {
        const searchTerm = currentFilters.search.toLowerCase();
        const searchableText = `${job.title} ${job.company} ${job.location} ${job.description}`.toLowerCase();
        if (!searchableText.includes(searchTerm)) {
          return false;
        }
      }
      
      // Location filter
      if (currentFilters.location && job.location !== currentFilters.location) {
        return false;
      }
      
      // Job type filter
      if (currentFilters.jobType.length > 0 && !currentFilters.jobType.includes(job.type)) {
        return false;
      }
      
      // Experience filter
      if (currentFilters.experience.length > 0 && !currentFilters.experience.includes(job.experience)) {
        return false;
      }
      
      // Company size filter
      if (currentFilters.companySize.length > 0 && !currentFilters.companySize.includes(job.companySize)) {
        return false;
      }
      
      // Quick filter logic
      if (currentFilters.quickFilter) {
        switch(currentFilters.quickFilter) {
          case 'remote':
            if (!job.location || !job.location.toLowerCase().includes('remote')) return false;
            break;
          case 'full-time':
            if (!job.type || !job.type.toLowerCase().includes('full')) return false;
            break;
          case 'entry-level':
            if (!job.experience || !job.experience.toLowerCase().includes('entry') && !job.experience.toLowerCase().includes('fresher')) return false;
            break;
          case 'urgent':
            if (!job.urgent && !job.title.toLowerCase().includes('urgent') && !job.description.toLowerCase().includes('urgent')) return false;
            break;
        }
      }
      
      // Date filter
      if (currentFilters.dateRange && currentFilters.dateRange !== 'all') {
        const jobDate = new Date(job.postedDate || job.date);
        const now = new Date();
        const daysDiff = Math.floor((now - jobDate) / (1000 * 60 * 60 * 24));
        
        switch(currentFilters.dateRange) {
          case 'today':
            if (daysDiff > 1) return false;
            break;
          case 'week':
            if (daysDiff > 7) return false;
            break;
          case 'month':
            if (daysDiff > 30) return false;
            break;
        }
      }
      
      return true;
    });
    
    // Apply sorting
    sortJobs();
    
    // Reset pagination (noop)
    currentPage = 1;
    
    // Update UI
    updateJobsCount();
    displayJobs();
    updatePagination();
    hideLoading();
  }, 500);
}

// Enhanced sorting
function sortJobs() {
  filteredJobs.sort((a, b) => {
    switch(currentFilters.sortBy) {
      case 'recent':
        return new Date(b.postedDate || b.date) - new Date(a.postedDate || a.date);
      case 'relevant':
        // Simple relevance based on title match with search term
        if (currentFilters.search) {
          const searchTerm = currentFilters.search.toLowerCase();
          const aRelevance = a.title.toLowerCase().includes(searchTerm) ? 1 : 0;
          const bRelevance = b.title.toLowerCase().includes(searchTerm) ? 1 : 0;
          return bRelevance - aRelevance;
        }
        return 0;
      case 'company':
        return a.company.localeCompare(b.company);
      case 'title':
        return a.title.localeCompare(b.title);
      default:
        return 0;
    }
  });
}

function parsePostedDate(postedText) {
  const now = new Date();
  if (postedText.includes('day')) {
    const days = parseInt(postedText.match(/\d+/)[0]);
    return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  } else if (postedText.includes('week')) {
    const weeks = parseInt(postedText.match(/\d+/)[0]);
    return new Date(now.getTime() - weeks * 7 * 24 * 60 * 60 * 1000);
  }
  return now;
}

function updateJobsCount(count) {
  const countDisplays = document.querySelectorAll('#jobs-count-display');
  countDisplays.forEach(display => {
    if (count === 0) {
      display.textContent = 'No jobs found';
    } else if (count === 1) {
      display.textContent = '1 job found';
    } else {
      display.textContent = `${count} jobs found`;
    }
  });
}

function displayJobs() {
  const container = document.getElementById('jobs-container');
  
  if (filteredJobs.length === 0) {
    container.innerHTML = `
      <div class="no-jobs-found">
        <i class="fas fa-search" style="font-size: 3rem; color: #ccc; margin-bottom: 20px;"></i>
        <h3>No jobs found</h3>
        <p>Try adjusting your filters or search terms</p>
      </div>
    `;
    return;
  }
  
  // Show all jobs on one page (no pagination)
  container.innerHTML = filteredJobs.map(job => createJobCard(job)).join('');
}

function createJobCard(job) {
  const url = job.url || '#';

  const card = document.createElement('div');
  card.className = 'job-card';
  card.onclick = function() {
    if (url && url !== '#') window.open(url, '_blank');
  };

  card.innerHTML = `
    <div class="job-header">
      <div class="job-title-section">
        <h3 class="job-title">${job.title}</h3>
        <div class="job-company">${job.company || ''}</div>
        <div class="job-location">
          <i class="fas fa-map-marker-alt"></i>
          ${job.location || ''}
        </div>
      </div>
    </div>
    <div class="job-meta">
      <div class="job-meta-item">
        <i class="fas fa-briefcase"></i>
        ${formatJobType(job.type)}
      </div>
      <div class="job-meta-item">
        <i class="fas fa-user-tie"></i>
        ${formatExperience(job.experience)}
      </div>
      <div class="job-meta-item">
        <i class="fas fa-building"></i>
        ${formatCompanySize(job.companySize)}
      </div>
    </div>
    <div class="job-description">${job.description || ''}</div>
    <div class="job-tags">${(job.tags || []).map(tag => `<span class="job-tag">${tag}</span>`).join('')}</div>
    <div class="job-footer">
      <div class="job-posted">${job.posted || ''}</div>
      <div class="job-actions">
        <button class="apply-btn" onclick="event.stopPropagation(); window.open('${url}', '_blank');">
          <i class="fas fa-external-link-alt"></i>
          Apply Now
        </button>
      </div>
    </div>
  `;
  return card.outerHTML;
}

function formatJobType(type) {
  const types = {
    'full-time': 'Full-time',
    'part-time': 'Part-time',
    'contract': 'Contract',
    'remote': 'Remote',
    'internship': 'Internship'
  };
  return types[type] || type;
}

function formatExperience(experience) {
  const levels = {
    'entry': 'Entry Level',
    'mid': 'Mid Level',
    'senior': 'Senior Level',
    'executive': 'Executive'
  };
  return levels[experience] || experience;
}

function formatCompanySize(size) {
  const sizes = {
    'startup': 'Startup (1-50)',
    'medium': 'Medium (51-200)',
    'large': 'Large (201-1000)',
    'enterprise': 'Enterprise (1000+)'
  };
  return sizes[size] || size;
}

function setupPaginationEvents() {
  // Pagination disabled
}

function updatePagination() {
  // Hide pagination UI if present
  const paginationContainer = document.getElementById('pagination');
  if (paginationContainer) {
    paginationContainer.style.display = 'none';
    paginationContainer.innerHTML = '';
  }
}

function scrollToTop() {
  document.querySelector('.jobs-content')?.scrollIntoView({ 
    behavior: 'smooth' 
  });
}

function showLoading() {
  document.getElementById('loading-state').style.display = 'block';
  document.getElementById('jobs-container').style.opacity = '0.5';
}

function hideLoading() {
  document.getElementById('loading-state').style.display = 'none';
  document.getElementById('jobs-container').style.opacity = '1';
}

function loadJobs() {
  const container = document.getElementById('jobs-container');
  if (!container) {
    console.error('Jobs container not found');
    return;
  }

  console.log('Starting to load jobs...');
  // Show loading state
  container.innerHTML = `
    <div class="loading-state" id="loading-state">
      <div class="loading-spinner">
        <i class="fas fa-spinner fa-spin"></i>
      </div>
      <p>Loading amazing job opportunities...</p>
    </div>
  `;    const currentCategory = currentFilters.category || window.SHEET_NAME;
    
    // Special handling for "all jobs" view
    if (currentCategory === 'all') {
      console.log('Loading ALL jobs from multiple categories');
      loadAllJobsFromSheets().catch(error => {
        console.warn('All jobs loading failed, using demo data:', error);
        loadMockJobs();
      });
      return;
    }
    
    // Normal category view - check cache first
    if (jobsDataCache[currentCategory]) {
      console.log(`Using cached data for ${currentCategory}`);
      processJobData(jobsDataCache[currentCategory]).catch(error => {
        console.warn('Error processing cached data:', error);
        // Fall back to normal loading
        loadJobsFromGoogleSheets().catch(error => {
          console.warn('Google Sheets failed, using demo data:', error);
          loadMockJobs();
        });
      });
    } else {
      // Try Google Sheets first, fallback to mock data
      loadJobsFromGoogleSheets().catch(error => {
        console.warn('Google Sheets failed, using demo data:', error);
        loadMockJobs();
      });
    }
}

function loadMockJobs() {
  console.log('Loading mock/demo jobs...');
  
  // Get current category filter
  const currentCategory = currentFilters.category || window.SHEET_NAME || 'IT-Sware/DB/QA/Web/Graphics/GIS';
  
  let jobsData = [];
  
  if (currentCategory === 'all') {
    // Load all mock data
    Object.values(mockJobsData).forEach(categoryJobs => {
      jobsData = jobsData.concat(categoryJobs);
    });
  } else {
    // Load specific category
    jobsData = mockJobsData[currentCategory] || mockJobsData['IT-Sware/DB/QA/Web/Graphics/GIS'] || [];
  }
  
  // Store in global variables
  currentJobs = jobsData;
  filteredJobs = [...jobsData];
  
  // Update UI
  updateJobsDisplay();
  updateResultsCount();
  
  console.log(`Loaded ${jobsData.length} demo jobs`);
}

async function loadJobsFromGoogleSheets(retryCount = 0) {
  try {
    console.log('Attempting to fetch jobs... (Attempt: ' + (retryCount + 1) + ')');
    console.log('Sheet ID:', SHEET_ID);
    console.log('Sheet Name:', window.SHEET_NAME);
    
    // Auto-retry mechanism
    const MAX_RETRIES = 3;
    
    // Try multiple popular sheet names as fallbacks
    const possibleSheets = [
      window.SHEET_NAME,
      'IT-Sware/DB/QA/Web/Graphics/GIS',
      'Accounting/Auditing/Finance',
      'Banking & Finance/Insurance',
      'Sales/Marketing/Merchandising',
      'Digital Marketing'
    ];
    
    let successful = false;
    let lastError;
    
    for (const sheetName of possibleSheets) {
      try {
        console.log(`Trying sheet: ${sheetName}`);
        
        // Generate URLs using current sheet name
        const GVIZ_URL = `${BASE_URL}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
        const EXPORT_URL = `${BASE_URL}/export?format=csv&sheet=${encodeURIComponent(sheetName)}`;
  const PROXY_URL = `proxy.php?url=${encodeURIComponent(GVIZ_URL)}`;
        
        // Try multiple URL strategies to bypass CORS issues
        const urls = [
          PROXY_URL,      // Try proxy first (if Node.js server is running)
          GVIZ_URL,       // Original gviz format
          EXPORT_URL      // Alternative export format
        ];
        
        console.log('Trying URLs:', urls);
        
        let res;
        let urlError;
        
        for (let i = 0; i < urls.length; i++) {
          try {
            console.log(`🔍 Attempt ${i + 1}: ${urls[i]}`);
            res = await fetch(urls[i], {
              method: 'GET',
              mode: 'cors',
              headers: {
                'Accept': 'text/csv,text/plain,*/*'
              }
            });
            
            if (res.ok) {
              console.log(`✅ Success with URL ${i + 1}`);
              break;
            } else {
              console.log(`❌ Failed with URL ${i + 1}: ${res.status} ${res.statusText}`);
              urlError = new Error(`HTTP ${res.status}: ${res.statusText}`);
            }
          } catch (fetchError) {
            console.log(`❌ Fetch error with URL ${i + 1}:`, fetchError.message);
            urlError = fetchError;
          }
        }
        
        if (!res || !res.ok) {
          throw urlError || new Error('All URL attempts failed for this sheet');
        }
        
        const csv = await res.text();
        console.log('Raw CSV data length:', csv.length);
        console.log('First 300 characters:', csv.substring(0, 300));
        
        if (!csv || csv.trim().length === 0) {
          throw new Error(`Empty response from sheet "${sheetName}"`);
        }
        
        // Check if response contains error message
        if (csv.includes('Invalid input') || csv.includes('error')) {
          throw new Error('Google Sheets returned an error: ' + csv.substring(0, 100));
        }
        
        const lines = csv.split("\n").filter(line => line.trim().length > 0);
        console.log('Total lines in CSV:', lines.length);
        
        if (lines.length <= 1) {
          throw new Error(`No job data found in sheet "${sheetName}"`);
        }
        
        // Successfully got data, process it
        window.SHEET_NAME = sheetName; // Update global sheet name
        console.log(`✅ Successfully loaded data from sheet: ${sheetName}`);
        
        // Process the CSV data
        await processJobData(csv);
        successful = true;
        break;
        
      } catch (sheetError) {
        console.log(`Failed to load from sheet "${sheetName}":`, sheetError.message);
        lastError = sheetError;
        continue;
      }
    }
    
    if (!successful) {
      throw lastError || new Error('Failed to load from any available sheet');
    }

  } catch (e) {
    console.error('Error loading jobs:', e);
    console.error('Error stack:', e.stack);
    
    // Auto-retry logic
    const MAX_RETRIES = 2;
    if (retryCount < MAX_RETRIES) {
      console.log(`Auto-retrying... (${retryCount + 1}/${MAX_RETRIES})`);
      // Show quick retry message
      container.innerHTML = `
        <div style="text-align: center; padding: 30px 20px;">
          <i class="fas fa-sync fa-spin" style="font-size: 2rem; margin-bottom: 15px; color: #2563eb;"></i>
          <p>Retrying connection to data source... (${retryCount + 1}/${MAX_RETRIES})</p>
        </div>
      `;
      
      // Wait briefly before retry
      setTimeout(() => {
        loadJobsFromGoogleSheets(retryCount + 1);
      }, 1500);
      return;
    }
    
    // Show error UI if all retries failed
    container.innerHTML = `
      <div style="text-align: center; padding: 60px 20px; color: #ef4444;">
        <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 20px;"></i>
        <h3>Failed to load jobs</h3>
        <p style="margin-bottom: 10px;"><strong>Attempted sheets:</strong> IT Software, Finance, Banking, etc.</p>
        <p style="margin-bottom: 20px; background: #fee2e2; padding: 10px; border-radius: 6px; color: #dc2626;">${e.message}</p>
        <button onclick="loadJobs()" style="margin-top: 20px; background: #2563eb; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer;">
          <i class="fas fa-redo"></i> Try Again
        </button>
        <div style="margin-top: 20px; font-size: 0.8em; color: #666;">
          <p>Troubleshooting tips:</p>
          <ul style="text-align: left; display: inline-block;">
            <li>Make sure the bots have been run recently</li>
            <li>Check that the Google Sheet is publicly accessible</li>
            <li>Verify the sheet contains data for this category</li>
            <li>Try running the job scraper bots first</li>
          </ul>
        </div>
      </div>
    `;
  }
}

async function processJobData(csv) {
  try {
    // Split CSV into lines
    const lines = csv.split("\n").filter(line => line.trim().length > 0);
    console.log('Total lines in CSV:', lines.length);
    
    // Skip header line
    const dataLines = lines.slice(1);
    console.log('Data lines to process:', dataLines.length);

    container.innerHTML = "";

    let jobCount = 0;
    let errorCount = 0;
    
    dataLines.forEach((line, index) => {
      try {
        // Simple CSV parsing that handles quotes properly
        const columns = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          
          if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
              // Handle escaped quotes
              current += '"';
              i++; // Skip next quote
            } else {
              // Toggle quote state
              inQuotes = !inQuotes;
            }
          } else if (char === ',' && !inQuotes) {
            // End of column
            columns.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        
        // Add the last column
        columns.push(current.trim());
        
        const [title, company, date, link, image, location] = columns;
        
        if (!title || !company || title.length < 2 || company.length < 2) {
          errorCount++;
          return;
        }

        const div = document.createElement("div");
        div.className = "job-card";
        
        // Clean and validate the job link
        const cleanLink = link ? link.replace(/["']/g, '').trim() : '';
        const validLink = cleanLink.startsWith('http') ? cleanLink : '#';
        
        // Better fallback image and image URL cleaning
        const fallbackImage = 'https://img.icons8.com/fluency/96/briefcase.png';
        let sanitizedImage = image ? image.replace(/["']/g, '').trim() : fallbackImage;
        if (!sanitizedImage.startsWith('http')) sanitizedImage = fallbackImage;
        if (sanitizedImage.includes('nohat.cc') || sanitizedImage.includes('gimgs2') || sanitizedImage.includes('via.placeholder.com')) {
          sanitizedImage = fallbackImage;
        }
        
        // Format date for better display
        let formattedDate = 'Recently posted';
        if (date && date.trim()) {
          try {
            const dateObj = new Date(date.trim());
            if (!isNaN(dateObj.getTime())) {
              formattedDate = dateObj.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
              });
            }
          } catch {}
        }
        
        // Store the URL for later use in filtering re-render
        div.dataset.url = validLink;
        
        // Make the whole card clickable
        div.style.cursor = 'pointer';
        div.onclick = function() {
          if (validLink !== '#') {
            window.open(validLink, '_blank');
          }
        };
        
        div.innerHTML = `
          <div class="job-header">
            <div class="job-title-section">
              <h3 class="job-title">${title}</h3>
              <div class="job-company">${company}</div>
              <div class="job-location">
                <i class="fas fa-map-marker-alt"></i>
                ${location || 'Sri Lanka'}
              </div>
            </div>
            <div class="job-logo">
        <img src="${sanitizedImage}" 
          alt="${company}" 
          loading="lazy" decoding="async" fetchpriority="low" width="80" height="80"
          onerror="this.onerror=null; this.src='${fallbackImage}';">
            </div>
          </div>
          
          <div class="job-meta">
            <div class="job-meta-item">
              <i class="fas fa-calendar"></i>
              Posted ${formattedDate}
            </div>
            <div class="job-meta-item">
              <i class="fas fa-briefcase"></i>
              Full-time
            </div>
          </div>
          
          <div class="job-description">
            Join our team and be part of an exciting opportunity at ${company}. We are looking for talented individuals to contribute to our growing organization.
          </div>
          
          <div class="job-footer">
            <div class="job-posted">Posted ${formattedDate}</div>
            <div class="job-actions">
              <button class="apply-btn" onclick="event.stopPropagation(); window.open('${validLink}', '_blank');">
                <i class="fas fa-external-link-alt"></i>
                Apply Now
              </button>
            </div>
          </div>
        `;
        container.appendChild(div);
        jobCount++;
      } catch (lineError) {
        console.error('Error processing job entry:', lineError);
        console.error('Problematic line:', line);
        errorCount++;
      }
    });

    console.log(`Processed ${jobCount} jobs successfully, ${errorCount} errors`);

    // Update job count display
    updateJobsCount(jobCount);
    
    // Store jobs for filtering
    currentJobs = Array.from(container.children).map((card, index) => ({
      id: index,
      url: card.getAttribute('data-url') || '#',
      title: card.querySelector('.job-title').textContent,
      company: card.querySelector('.job-company').textContent,
      location: card.querySelector('.job-location').textContent.replace('📍 ', '').trim(),
      description: card.querySelector('.job-description').textContent,
      type: 'full-time',
      experience: 'all-levels',
      tags: [],
      salary: 'Competitive',
      posted: card.querySelector('.job-posted').textContent.replace('Posted ', ''),
      element: card,
      category: window.SHEET_NAME
    }));
    
    filteredJobs = [...currentJobs];
    updateJobsCount(jobCount);
    
    // Initialize the enhanced filter functionality
    if (window.initializeEnhancedFilters) {
      initializeEnhancedFilters();
    }
    
    if (container.children.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 60px 20px; color: #64748b;">
          <i class="fas fa-search" style="font-size: 3rem; margin-bottom: 20px; opacity: 0.5;"></i>
          <h3>No jobs found in "${window.SHEET_NAME}"</h3>
          <p>The bots may not have scraped jobs for this category yet, or all jobs were filtered out.</p>
          <button onclick="loadJobs()" style="margin-top: 20px; background: #2563eb; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer;">
            <i class="fas fa-redo"></i> Refresh
          </button>
        </div>
      `;
    }

  } catch (e) {
    console.error('Error loading jobs:', e);
    console.error('Error stack:', e.stack);
    
    container.innerHTML = `
      <div style="text-align: center; padding: 60px 20px; color: #ef4444;">
        <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 20px;"></i>
        <h3>Failed to load jobs</h3>
        <p style="margin-bottom: 10px;"><strong>Sheet:</strong> "${window.SHEET_NAME}"</p>
        <p style="margin-bottom: 20px; background: #fee2e2; padding: 10px; border-radius: 6px; color: #dc2626;">${e.message}</p>
        <button onclick="loadJobs()" style="margin-top: 20px; background: #2563eb; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer;">
          <i class="fas fa-redo"></i> Try Again
        </button>
        <div style="margin-top: 20px; font-size: 0.8em; color: #666;">
          <p>Troubleshooting tips:</p>
          <ul style="text-align: left; display: inline-block;">
            <li>Make sure the bots have been run recently</li>
            <li>Check that the Google Sheet is publicly accessible</li>
            <li>Verify the sheet contains data for this category</li>
          </ul>
        </div>
      </div>
    `;
  }
}

// Function to load jobs from all sheets when 'all=true' is in URL
async function loadAllJobsFromSheets() {
  try {
    console.log('Loading jobs from all categories...');
    
    // Show loading state
    container.innerHTML = `
      <div class="loading-state" id="loading-state">
        <div class="loading-spinner">
          <i class="fas fa-spinner fa-spin"></i>
        </div>
        <p>Loading jobs from all categories...</p>
      </div>
    `;
    
    // List of main categories to load from
    const mainCategories = [
      'IT-Sware/DB/QA/Web/Graphics/GIS',
      'Accounting/Auditing/Finance',
      'Banking & Finance/Insurance',
      'Sales/Marketing/Merchandising',
      'HR/Training',
      'Corporate Management/Analysts',
      'Digital Marketing'
    ];
    
    let allJobs = [];
    let loadedCategories = 0;
    let errors = [];
    
    // Function to update loading progress
    const updateProgress = () => {
      const progressElement = document.querySelector('#loading-state p');
      if (progressElement) {
        progressElement.textContent = `Loading jobs... (${loadedCategories}/${mainCategories.length} categories)`;
      }
    };
    
    // Try to load each category
    for (const category of mainCategories) {
      try {
        // Check if we have cached data
        if (jobsDataCache[category]) {
          console.log(`Using cached data for ${category}`);
          
          // Process the CSV to extract jobs
          const csv = jobsDataCache[category];
          const jobs = extractJobsFromCSV(csv, category);
          allJobs = [...allJobs, ...jobs];
          
        } else {
          // Try to load from sheets directly
          console.log(`Loading from sheet: ${category}`);
          
          // Generate URLs for this category
          const GVIZ_URL = `${BASE_URL}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(category)}`;
          const EXPORT_URL = `${BASE_URL}/export?format=csv&sheet=${encodeURIComponent(category)}`;
          const PROXY_URL = `proxy.php?url=${encodeURIComponent(GVIZ_URL)}`;
          
          // Try URLs in sequence
          const urls = [PROXY_URL, GVIZ_URL, EXPORT_URL];
          let csv = null;
          
          for (const url of urls) {
            try {
              const response = await fetch(url, {
                method: 'GET',
                mode: 'cors',
                headers: {
                  'Accept': 'text/csv,text/plain,*/*'
                }
              });
              
              if (response.ok) {
                csv = await response.text();
                
                // Store in cache for future use
                jobsDataCache[category] = csv;
                
                // Process this category's jobs
                const jobs = extractJobsFromCSV(csv, category);
                allJobs = [...allJobs, ...jobs];
                break;
              }
            } catch (urlError) {
              console.log(`Error with URL for ${category}:`, urlError.message);
              continue;
            }
          }
          
          // If we couldn't get data from any URL
          if (!csv) {
            throw new Error(`Could not load data for ${category}`);
          }
        }
        
        // Update progress
        loadedCategories++;
        updateProgress();
        
      } catch (categoryError) {
        console.error(`Error loading ${category}:`, categoryError);
        errors.push({ category, error: categoryError.message });
        
        // Still update progress
        loadedCategories++;
        updateProgress();
      }
    }
    
    console.log(`Loaded ${allJobs.length} jobs from ${loadedCategories} categories`);
    
    if (allJobs.length > 0) {
      // Sort by date (newest first)
      allJobs.sort((a, b) => new Date(b.postedDate) - new Date(a.postedDate));
      
      // Store jobs
      currentJobs = allJobs;
      filteredJobs = [...allJobs];
      
      // Update display
      updateJobsDisplay();
      updateResultsCount();
      
      return true;
    } else {
      throw new Error('No jobs found across all categories');
    }
    
  } catch (e) {
    console.error('Error loading all jobs:', e);
    
    // Show error UI
    container.innerHTML = `
      <div style="text-align: center; padding: 60px 20px; color: #ef4444;">
        <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 20px;"></i>
        <h3>Failed to load jobs from all categories</h3>
        <p style="margin-bottom: 20px; background: #fee2e2; padding: 10px; border-radius: 6px; color: #dc2626;">${e.message}</p>
        <button onclick="loadJobs()" style="margin-top: 20px; background: #2563eb; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer;">
          <i class="fas fa-redo"></i> Try Again
        </button>
      </div>
    `;
    
    return false;
  }
}

// Helper function to extract jobs from CSV data
function extractJobsFromCSV(csv, categoryName) {
  try {
    const lines = csv.split('\n').filter(line => line.trim().length > 0);
    
    if (lines.length <= 1) {
      return [];
    }
    
    // Process CSV data into job objects
    const jobsData = [];
    const headerLine = lines[0];
    const dataLines = lines.slice(1);
    
    dataLines.forEach(line => {
      try {
        // Simple CSV parsing that handles quotes properly
        const columns = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          
          if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
              // Handle escaped quotes
              current += '"';
              i++;
            } else {
              // Toggle quote state
              inQuotes = !inQuotes;
            }
          } else if (char === ',' && !inQuotes) {
            // End of field
            columns.push(current);
            current = '';
          } else {
            current += char;
          }
        }
        
        // Don't forget the last column
        columns.push(current);
        
        if (columns.length >= 6) {
          const job = {
            title: columns[0] || 'Job Title',
            company: columns[1] || 'Company',
            location: columns[2] || 'Location',
            jobType: columns[3] || 'Full-time',
            experience: columns[4] || 'Not specified',
            description: columns[5] || '',
            requirements: columns[6] || '',
            salary: columns[7] || 'Not specified',
            postedDate: columns[8] || new Date().toISOString().split('T')[0],
            applicationLink: columns[9] || '#',
            category: categoryName
          };
          
          // Add to jobs data
          jobsData.push(job);
        }
      } catch (parseError) {
        console.log('Error parsing CSV line:', parseError);
      }
    });
    
    return jobsData;
  } catch (error) {
    console.error('Error extracting jobs from CSV:', error);
    return [];
  }
}
