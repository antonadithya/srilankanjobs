// Job Counts Manager
// This script fetches and manages job counts for categories

// Use same Google Sheet ID as the main jobs script
const COUNTS_SHEET_ID = '1rVY0Pey-LcukEKqL-CUABs01WVAW7nV2uHgexUEYQ8k';

// Global cache for job counts
const categoryJobCounts = {};
let totalJobCount = 0;
let totalCompanyCount = 0;
let categoriesLoaded = 0;

// Main category list - match with your categories in the carousel
const mainCategories = [
    'IT-Sware/DB/QA/Web/Graphics/GIS',
    'IT-HWare/Networks/Systems',
    'IT-Telecoms',
    'Accounting/Auditing/Finance',
    'Banking & Finance/Insurance',
    'Sales/Marketing/Merchandising',
    'HR/Training',
    'Corporate Management/Analysts',
    'Office Admin/Secretary/Receptionist',
    'Civil Eng/Interior Design/Architecture',
    'Customer Relations/Public Relations',
    'Logistics/Warehouse/Transport',
    'Eng-Mech/Auto/Elec',
    'Manufacturing/Operations',
    'Media/Advert/Communication',
    'Hotel/Restaurant/Hospitality',
    'Travel/Tourism',
    'Sports/Fitness/Recreation',
    'Hospital/Nursing/Healthcare',
    'Legal/Law',
    'Supervision/Quality Control',
    'Apparel/Clothing',
    'Ticketing/Airline/Marine',
    'Education',
    'R&D/Science/Research',
    'Agriculture/Dairy/Environment',
    'Security',
    'Fashion/Design/Beauty',
    'KPO/BPO',
    'Imports/Exports',
    'Architecture',
    'Retail/Fashion',
    'Call Center',
    'Delivery/Driving/Transport',
    'Digital Marketing',
    'Government/Public Sector',
    'Fishing & Aquaculture'
];

// Category ID to display name mapping (for UI)
const categoryDisplayNames = {
    'IT-Sware/DB/QA/Web/Graphics/GIS': 'IT & Software',
    'IT-HWare/Networks/Systems': 'IT Hardware & Networks',
    'IT-Telecoms': 'IT Telecoms',
    'Accounting/Auditing/Finance': 'Finance & Accounting',
    'Banking & Finance/Insurance': 'Banking & Finance',
    'Sales/Marketing/Merchandising': 'Sales & Marketing',
    'HR/Training': 'HR & Training',
    'Corporate Management/Analysts': 'Corporate Management',
    'Office Admin/Secretary/Receptionist': 'Office Administration',
    'Civil Eng/Interior Design/Architecture': 'Civil Engineering',
    'Customer Relations/Public Relations': 'Customer Relations',
    'Logistics/Warehouse/Transport': 'Logistics & Transport',
    'Eng-Mech/Auto/Elec': 'Mechanical Engineering',
    'Manufacturing/Operations': 'Manufacturing',
    'Media/Advert/Communication': 'Media & Communication',
    'Hotel/Restaurant/Hospitality': 'Hospitality',
    'Travel/Tourism': 'Travel & Tourism',
    'Sports/Fitness/Recreation': 'Sports & Recreation',
    'Hospital/Nursing/Healthcare': 'Healthcare',
    'Legal/Law': 'Legal',
    'Supervision/Quality Control': 'Quality Control',
    'Apparel/Clothing': 'Apparel & Clothing',
    'Ticketing/Airline/Marine': 'Airlines & Marine',
    'Education': 'Education',
    'R&D/Science/Research': 'Research & Development',
    'Agriculture/Dairy/Environment': 'Agriculture',
    'Security': 'Security',
    'Fashion/Design/Beauty': 'Fashion & Beauty',
    'KPO/BPO': 'KPO/BPO',
    'Imports/Exports': 'Import/Export',
    'Architecture': 'Architecture',
    'Retail/Fashion': 'Retail',
    'Call Center': 'Call Center',
    'Delivery/Driving/Transport': 'Delivery & Transport',
    'Digital Marketing': 'Digital Marketing',
    'Government/Public Sector': 'Government',
    'Fishing & Aquaculture': 'Fishing & Aquaculture'
};

// Build a reverse lookup from display name -> category ID for fallback mapping
const displayNameToCategoryId = Object.entries(categoryDisplayNames).reduce((acc, [id, display]) => {
    acc[display.toLowerCase()] = id;
    return acc;
}, {});

// Keep track of unique companies
const uniqueCompanies = new Set();

// Initialize the job counts
document.addEventListener('DOMContentLoaded', function() {
    // Start fetching job counts
    initializeJobCounts();
});

// Initialize category badges and sidebar items with loading spinners
function initializeCategoryLoadingState() {
    // Initialize category cards with loading spinners
    const categoryCards = document.querySelectorAll('.category-card');
    
    categoryCards.forEach(card => {
        const categoryLink = card.querySelector('a.category-btn');
        if (!categoryLink) return;
        
        // Create loading badge if it doesn't exist
        let countBadge = card.querySelector('.job-count-badge');
        if (!countBadge) {
            countBadge = document.createElement('div');
            countBadge.className = 'job-count-badge loading';
            card.insertBefore(countBadge, categoryLink);
        } else {
            countBadge.classList.add('loading');
        }
        
        // Set loading spinner
        countBadge.innerHTML = '<div class="job-count-spinner"></div>';
    });
    
    // Initialize sidebar category items with loading spinners
    const sidebarCategoryItems = document.querySelectorAll('.category-item');
    
    sidebarCategoryItems.forEach(item => {
        const countElement = item.querySelector('.job-count');
        if (!countElement) return;
        
        // Set loading spinner for sidebar
        countElement.innerHTML = '<div class="sidebar-count-spinner"></div>';
    });
}

// Fetch job counts for all categories
async function initializeJobCounts() {
    console.log('Initializing job counts...');
    
    // Skip hero stats update - using static dummy data now
    // updateHeroStats('loading');
    
    // Initialize category badges with loading spinners
    initializeCategoryLoadingState();
    
    // Load each category in parallel
    const promises = mainCategories.map(category => fetchCategoryJobCount(category));
    
    // Wait for all to complete
    Promise.allSettled(promises).then(() => {
        console.log('All category counts loaded or attempted');
        console.log(`Total jobs found: ${totalJobCount}`);
        console.log(`Total companies found: ${uniqueCompanies.size}`);
        
        // Skip hero stats update - using static dummy data now
        // updateHeroStats('complete');
        
        // Update individual category counts
        updateCategoryCounters();
    });
}

// Fetch job count for a single category
async function fetchCategoryJobCount(category) {
    try {
        console.log(`Fetching count for category: ${category}`);
        
        // Multiple URL strategies to handle CORS issues
        const BASE_URL = `https://docs.google.com/spreadsheets/d/${COUNTS_SHEET_ID}`;
        const GVIZ_URL = `${BASE_URL}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(category)}`;
        const EXPORT_URL = `${BASE_URL}/export?format=csv&sheet=${encodeURIComponent(category)}`;
        // Build proxies for both strategies; prefer export first (more reliable for complex names)
        const PROXY_EXPORT_URL = `proxy.php?url=${encodeURIComponent(EXPORT_URL)}`;
        const PROXY_GVIZ_URL = `proxy.php?url=${encodeURIComponent(GVIZ_URL)}`;
        
        // Try URLs in sequence (export first)
        const urls = [PROXY_EXPORT_URL, EXPORT_URL, PROXY_GVIZ_URL, GVIZ_URL];

        // Helper to check if response text looks like CSV, not PHP/HTML error
        function looksLikeCSV(text) {
            if (!text) return false;
            const head = text.slice(0, 500).toLowerCase();
            if (head.includes('<!doctype') || head.includes('<html') || head.includes('<?php') || head.includes('error')) {
                return false;
            }
            const firstLine = text.split(/\r?\n/)[0] || '';
            const commaCount = (firstLine.match(/,/g) || []).length;
            return commaCount >= 2;
        }
        // Verify header contains expected columns for jobs sheets
        function headerLooksValid(headerLine) {
            const h = headerLine.toLowerCase();
            return h.includes('title') && h.includes('company');
        }
        
        let csv = '';
        let lastError;
        for (let i = 0; i < urls.length; i++) {
            const url = urls[i];
            try {
                const response = await fetch(url, {
                    method: 'GET',
                    mode: 'cors',
                    cache: 'no-store',
                    headers: {
                        'Accept': 'text/csv,text/plain,*/*'
                    }
                });
                if (!response.ok) {
                    lastError = new Error(`HTTP ${response.status} ${response.statusText}`);
                    console.log(`❌ ${category} attempt ${i + 1} failed:`, lastError.message);
                    continue;
                }
                const text = await response.text();
                if (!looksLikeCSV(text)) {
                    lastError = new Error('Content is not valid CSV');
                    console.log(`⚠️ ${category} attempt ${i + 1} returned non-CSV content; trying next URL`);
                    continue;
                }
                const firstLine = (text.replace(/\r/g, '').split('\n')[0] || '');
                if (!headerLooksValid(firstLine)) {
                    lastError = new Error('Header does not match expected columns');
                    console.log(`⚠️ ${category} attempt ${i + 1} header invalid: "${firstLine}"`);
                    continue;
                }
                csv = text;
                console.log(`✅ ${category} loaded via attempt ${i + 1}`);
                break;
            } catch (err) {
                lastError = err;
                console.log(`❌ ${category} attempt ${i + 1} error:`, err.message);
            }
        }

        if (!csv) {
            throw lastError || new Error('Failed to fetch CSV after all attempts');
        }
        
        // Normalize newlines
        csv = csv.replace(/\r/g, '');
        
        if (!csv || csv.trim().length === 0) {
            throw new Error('Empty response');
        }
        
        // Process the CSV data
        const lines = csv.split('\n').filter(line => line.trim().length > 0);
        
        // Skip the header row and count only rows with a non-empty Title
        const dataLines = lines.slice(1);
        let jobCount = 0;
        for (let i = 0; i < dataLines.length; i++) {
            const cols = parseCSVLine(dataLines[i]);
            const title = (cols[0] || '').trim();
            if (title) jobCount++;
        }
        
        // Process company names
        for (let i = 1; i < lines.length; i++) {
            const columns = parseCSVLine(lines[i]);
            if (columns.length >= 2) {
                const companyName = columns[1].trim();
                if (companyName) {
                    uniqueCompanies.add(companyName);
                }
            }
        }
        
        // Store in our cache
        categoryJobCounts[category] = jobCount;
        totalJobCount += jobCount;
        
        // Track loaded categories
        categoriesLoaded++;
        
        console.log(`✅ ${category}: ${jobCount} jobs`);
        return jobCount;
        
    } catch (error) {
        console.error(`Error loading count for ${category}:`, error);
        categoryJobCounts[category] = 0;
        return 0;
    }
}

// Update hero stats at the top of the page
function updateHeroStats(state) {
    const jobsStatElement = document.querySelector('.hero-stats .stat:nth-child(1) span');
    const companiesStatElement = document.querySelector('.hero-stats .stat:nth-child(2) span');
    
    if (!jobsStatElement || !companiesStatElement) return;
    
    if (state === 'loading') {
        jobsStatElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        companiesStatElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    } else {
        // Format with commas for thousands
        const formattedJobCount = totalJobCount.toLocaleString();
        const formattedCompanyCount = uniqueCompanies.size.toLocaleString();
        
        jobsStatElement.textContent = `${formattedJobCount}+ Jobs`;
        companiesStatElement.textContent = `${formattedCompanyCount}+ Companies`;
    }
}

// Update individual category counters
function updateCategoryCounters() {
    // Get all category cards from index page
    const categoryCards = document.querySelectorAll('.category-card');
    
    // Update category cards on homepage
    categoryCards.forEach(card => {
        const categoryLink = card.querySelector('a.category-btn');
        if (!categoryLink) return;
        
        // Extract explicit data-category if provided (optional enhancement for reliability)
        const dataCategory = card.getAttribute('data-category');
        
        // Extract category ID from the URL
        const href = categoryLink.getAttribute('href');
        if (!href) return;
        
        // Parse the category from the URL
        let categoryFromURL = '';
        try {
            const url = new URL(href, window.location.origin);
            categoryFromURL = url.searchParams.get('category') || url.searchParams.get('sheet') || '';
        } catch (e) {
            // Ignore URL parse errors for malformed hrefs
        }

        // Fallback: derive category by matching the card heading text to our display mapping
    let effectiveCategory = dataCategory || categoryFromURL;
        if (!effectiveCategory) {
            const headingText = (card.querySelector('h3')?.textContent || '').trim().toLowerCase();
            if (headingText && displayNameToCategoryId[headingText]) {
                effectiveCategory = displayNameToCategoryId[headingText];
            }
        }

        if (!effectiveCategory) return;

        // Get job count for this category
        const count = categoryJobCounts[effectiveCategory] || 0;
        
        // Find or create the count badge
        let countBadge = card.querySelector('.job-count-badge');
        if (!countBadge) {
            countBadge = document.createElement('div');
            countBadge.className = 'job-count-badge';
            card.insertBefore(countBadge, categoryLink);
        }
        
        // Update the badge
        countBadge.classList.remove('loading');
        countBadge.textContent = `${count} jobs`;
    });
    
    // Also update category items in sidebar of Srilanaka-jobs.html
    const sidebarCategoryItems = document.querySelectorAll('.category-item');
    
    sidebarCategoryItems.forEach(item => {
        const categoryId = item.getAttribute('data-category');
        if (!categoryId) return;
        
        // Get job count for this category
        const count = categoryJobCounts[categoryId] || 0;
        
        // Find job count element
        const countElement = item.querySelector('.job-count');
        if (!countElement) return;
        
        // Update count text
        countElement.textContent = count > 0 ? `${count}` : '0';
    });
}

// Helper function to parse CSV line correctly handling quotes
function parseCSVLine(line) {
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
    
    return columns;
}
