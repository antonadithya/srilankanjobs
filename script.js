const SHEET_ID = '1rVY0Pey-LcukEKqL-CUABs01WVAW7nV2uHgexUEYQ8k';

// Determine sheet name: prefer window.SHEET_NAME set by page scripts; fallback to URL param or default
let params = new URLSearchParams(window.location.search);
let SHEET_NAME = window.SHEET_NAME || params.get("sheet") || "IT-Sware/DB/QA/Web/Graphics/GIS";

const container = document.getElementById("jobs-container");

// Pagination state
let allJobs = [];
let currentPage = 1;
const PAGE_SIZE = 20; // jobs per page

function getPaginationElement() {
  return document.getElementById('pagination');
}

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

function getPageFromURL() {
  const p = Number(new URLSearchParams(window.location.search).get('page'));
  return Number.isFinite(p) && p > 0 ? p : 1;
}

function updateURLPage(page) {
  try {
    const url = new URL(window.location.href);
    if (page > 1) {
      url.searchParams.set('page', String(page));
    } else {
      url.searchParams.delete('page');
    }
    window.history.replaceState({}, '', url.toString());
  } catch {}
}

function createJobCard(job) {
  const fallbackImage = 'https://img.icons8.com/fluency/96/briefcase.png';
  const div = document.createElement('div');
  div.className = 'job-card';
  div.style.cursor = 'pointer';
  const validLink = job.link && job.link.startsWith('http') ? job.link : '#';
  div.onclick = function() {
    if (validLink !== '#') {
      window.open(validLink, '_blank');
    }
  };
  div.innerHTML = `
    <div class="job-card-header">
      <img src="${job.image || fallbackImage}"
        alt="${job.company || 'Company logo'}"
        loading="lazy" decoding="async" fetchpriority="low" width="96" height="96"
           onerror="this.onerror=null; this.src='${fallbackImage}';">
    </div>
    <div class="job-card-content">
      <h2>${job.title}</h2>
      <div class="company-info">
      <span><i class="fas fa-building"></i> ${job.company || 'Unknown company'}</span>
        <span><i class="fas fa-map-marker-alt"></i> ${job.location || 'Sri Lanka'}</span>
        <span><i class="fas fa-calendar"></i> ${job.formattedDate || 'Recently posted'}</span>
      </div>
    </div>
    <div class="job-card-footer">
      <button class="apply-btn" onclick="event.stopPropagation(); window.open('${validLink}', '_blank');">
        <i class="fas fa-external-link-alt"></i>
        Apply Now
      </button>
    </div>
  `;
  return div;
}

function renderPagination(totalPages) {
  const pagination = getPaginationElement();
  if (!pagination) return;

  // Ensure it's not hidden by initial class
  pagination.classList.remove('visually-hidden-initial');

  if (totalPages <= 1) {
    pagination.style.display = 'none';
    pagination.innerHTML = '';
    return;
  }

  // Show as flex (matches CSS expectations)
  pagination.style.display = 'flex';

  // Build page numbers with ellipsis
  const btn = (label, opts = {}) => {
    const { page, disabled, active } = opts;
    const disAttr = disabled ? 'disabled' : '';
    const cls = ['page-btn'];
    if (active) cls.push('active');
    return `<button class="${cls.join(' ')}" ${disAttr} ${page ? `data-page="${page}"` : ''}>${label}</button>`;
  };

  const parts = [];
  // Prev
  parts.push(btn('<i class="fas fa-chevron-left"></i> Previous', { page: currentPage - 1, disabled: currentPage === 1 }));

  // Numbers
  const numbers = [];
  const maxAround = 2; // neighbors around current
  const addNumber = (n) => numbers.push(btn(String(n), { page: n, active: n === currentPage }));

  addNumber(1);
  let start = Math.max(2, currentPage - maxAround);
  let end = Math.min(totalPages - 1, currentPage + maxAround);
  if (start > 2) numbers.push('<span class="page-dots">...</span>');
  for (let n = start; n <= end; n++) addNumber(n);
  if (end < totalPages - 1) numbers.push('<span class="page-dots">...</span>');
  if (totalPages > 1) addNumber(totalPages);

  // Next
  const nextBtn = btn('Next <i class="fas fa-chevron-right"></i>', { page: currentPage + 1, disabled: currentPage === totalPages });

  pagination.innerHTML = `
    ${parts[0]}
    <div class="page-numbers">${numbers.join('')}</div>
    ${nextBtn}
  `;

  // Wire events (event delegation)
  pagination.onclick = (e) => {
    const target = e.target.closest('button.page-btn');
    if (!target || target.disabled) return;
    const page = Number(target.getAttribute('data-page'));
    if (Number.isFinite(page)) {
      goToPage(page);
    }
  };
}

function renderPage(page) {
  if (!container) return;
  const totalPages = Math.max(1, Math.ceil(allJobs.length / PAGE_SIZE));
  currentPage = clamp(page, 1, totalPages);

  const start = (currentPage - 1) * PAGE_SIZE;
  const end = start + PAGE_SIZE;

  container.innerHTML = '';
  allJobs.slice(start, end).forEach(job => container.appendChild(createJobCard(job)));
  renderPagination(totalPages);
  updateURLPage(currentPage);
  container.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function loadJobs() {
  try {
    // Show loading state immediately so old jobs don't linger
    if (container) {
      container.innerHTML = `
        <div class="loading-state" style="padding:24px; text-align:center; color:#64748b;">
          <i class="fas fa-spinner fa-spin" style="font-size:2rem; margin-bottom:10px;"></i>
          <p>Loading jobs...</p>
        </div>
      `;
    }
    
    // Update SHEET_NAME dynamically if window.SHEET_NAME is set
    if (window.SHEET_NAME) {
      SHEET_NAME = window.SHEET_NAME;
    }
    
  // Ignore URL parameter for sheet; rely solely on window.SHEET_NAME
    
    console.log('Attempting to fetch jobs...');
    console.log('Sheet ID:', SHEET_ID);
    console.log('Sheet Name:', SHEET_NAME);
    
    // Multiple URL strategies to handle CORS issues - generate URLs dynamically
    const BASE_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}`;
    const GVIZ_URL = `${BASE_URL}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(SHEET_NAME)}`;
    const EXPORT_URL = `${BASE_URL}/export?format=csv&sheet=${encodeURIComponent(SHEET_NAME)}`;
  const PROXY_URL = `proxy.php?url=${encodeURIComponent(GVIZ_URL)}`;
    
    // Try multiple URL strategies to bypass CORS issues
    const urls = [
      PROXY_URL,      // Try proxy first (if Node.js server is running)
      GVIZ_URL,       // Original gviz format
      EXPORT_URL      // Alternative export format
    ];
    
    console.log('Trying URLs:', urls);
    
    let res;
    let lastError;
    let csv = '';

    // Helper to check if response text looks like CSV, not PHP/HTML error
    function looksLikeCSV(text) {
      if (!text) return false;
      const head = text.slice(0, 500).toLowerCase();
      if (head.includes('<!doctype') || head.includes('<html') || head.includes('<?php') || head.includes('echo $data;')) {
        return false;
      }
      const firstLine = text.split(/\r?\n/)[0] || '';
      // Must have at least 2 commas to be a plausible CSV header
      const commaCount = (firstLine.match(/,/g) || []).length;
      return commaCount >= 2;
    }
    
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
          const maybeText = await res.text();
          if (looksLikeCSV(maybeText)) {
            csv = maybeText;
            console.log(`✅ Success with URL ${i + 1} and content validated as CSV`);
            break;
          } else {
            console.log(`⚠️ URL ${i + 1} responded 200 but content is not valid CSV; trying next`);
          }
        } else {
          console.log(`❌ Failed with URL ${i + 1}: ${res.status} ${res.statusText}`);
          lastError = new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
      } catch (fetchError) {
        console.log(`❌ Fetch error with URL ${i + 1}:`, fetchError.message);
        lastError = fetchError;
      }
    }
    
    if (!csv) {
      throw lastError || new Error('All URL attempts failed');
    }
    
    // We already have CSV text
    console.log('Raw CSV data length:', csv.length);
    console.log('First 300 characters:', csv.substring(0, 300));
    
    if (!csv || csv.trim().length === 0) {
      throw new Error('Empty response from Google Sheets');
    }
    
    // Check if response contains error message
    if (csv.includes('Invalid input') || csv.includes('error')) {
      throw new Error('Google Sheets returned an error: ' + csv.substring(0, 100));
    }
    
  const lines = csv.replace(/\r/g, '').split("\n").filter(line => line.trim().length > 0);
    console.log('Total lines in CSV:', lines.length);
    
    if (lines.length <= 1) {
      throw new Error(`No job data found in sheet "${SHEET_NAME}". The bots may not have populated this category yet.`);
    }

    // Skip header line
    const dataLines = lines.slice(1);
    console.log('Data lines to process:', dataLines.length);

  container.innerHTML = "";

    let jobCount = 0;
    let errorCount = 0;
    
    // Store parsed jobs for filtering
    const parsedJobs = [];
    
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
        
  const [titleRaw, companyRaw, date, link, image, location] = columns;
  const title = (titleRaw || '').trim();
  const company = (companyRaw || '').trim();
        
        // Debug log the parsed columns
        if (index < 3) { // Log first 3 entries for debugging
          console.log(`Job ${index + 1} parsed columns:`, columns);
        }
        
        console.log(`Processing job ${index + 1}:`, { title, company, date, link, location });
        
        // If title missing/too short, skip. If company missing, use a fallback to still render the job.
        if (!title || title.length < 2) {
          console.warn(`Skipping invalid job entry at line ${index + 2}:`, { title, company });
          errorCount++;
          return;
        }

        // Clean and validate the job link
        const cleanLink = link ? link.replace(/["']/g, '').trim() : '';
        const validLink = cleanLink.startsWith('http') ? cleanLink : '#';
        
        // Better fallback image and image URL cleaning
        const fallbackImage = 'https://img.icons8.com/fluency/96/briefcase.png';
        let sanitizedImage = image ? image.replace(/["']/g, '').trim() : fallbackImage;
        
        // Fix common image URL issues
        if (!sanitizedImage.startsWith('http')) {
          sanitizedImage = fallbackImage;
        }
        
        // Replace problematic image URLs with fallback
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
          } catch (dateError) {
            console.warn('Date parsing error:', dateError);
          }
        }
        
        // Store job data for filtering
        const jobData = {
          title,
          company: company || 'Unknown company',
          date,
          link: validLink,
          image: sanitizedImage,
          location: location || 'Sri Lanka',
          formattedDate
        };
        
        parsedJobs.push(jobData);
        
  jobCount++;
      } catch (lineError) {
        console.error('Error processing job entry:', lineError);
        console.error('Problematic line:', line);
        errorCount++;
      }
    });

    console.log(`Processed ${jobCount} jobs successfully, ${errorCount} errors`);

  // After parsing, assign global and render paginated view
    allJobs = parsedJobs;

    if (allJobs.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 60px 20px; color: #64748b;">
          <i class="fas fa-search" style="font-size: 3rem; margin-bottom: 20px; opacity: 0.5;"></i>
          <h3>No jobs found in "${SHEET_NAME}"</h3>
          <p>The bots may not have scraped jobs for this category yet, or all jobs were filtered out.</p>
          <button onclick="loadJobs()" style="margin-top: 20px; background: #2563eb; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer;">
            <i class="fas fa-redo"></i> Refresh
          </button>
        </div>
      `;
      const p = getPaginationElement();
      if (p) { p.style.display = 'none'; p.innerHTML = ''; }
    } else {
      const initialPage = getPageFromURL();
      renderPage(initialPage);
      
      // Store jobs data in the JobFilters module if it exists
      if (window.JobFilters && typeof window.JobFilters.storeJobData === 'function') {
        window.JobFilters.storeJobData(parsedJobs);
        
        // Add reset filters button
        if (typeof window.JobFilters.addResetFiltersButton === 'function') {
          window.JobFilters.addResetFiltersButton();
        }
      }
    }

  } catch (e) {
    console.error('Error loading jobs:', e);
    console.error('Error stack:', e.stack);
    
    container.innerHTML = `
      <div style="text-align: center; padding: 60px 20px; color: #ef4444;">
        <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 20px;"></i>
        <h3>Failed to load jobs</h3>
        <p style="margin-bottom: 10px;"><strong>Sheet:</strong> "${SHEET_NAME}"</p>
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

// Load jobs when the page loads
document.addEventListener('DOMContentLoaded', loadJobs);
// Removed immediate call to avoid racing with page scripts that set SHEET_NAME

// Handle page navigation
function goToPage(page) {
  renderPage(page);
}

// Back/forward nav: sync to ?page
window.addEventListener('popstate', () => {
  const p = getPageFromURL();
  renderPage(p);
});
