// Filters.js - Job filtering functionality
// This script adds filtering capabilities to the jobs page

let jobsData = []; // Will store all jobs after fetching
let filteredJobs = []; // Will store filtered jobs

// Initialize filters
document.addEventListener('DOMContentLoaded', function() {
    // Connect search input
    const searchInput = document.getElementById('job-search');
    if (searchInput) {
        searchInput.addEventListener('input', applyFilters);
    }
    
    // Connect sort options
    const sortSelect = document.getElementById('sort-jobs');
    if (sortSelect) {
        sortSelect.addEventListener('change', applyFilters);
    }
    
    // Connect date filter
    const dateFilter = document.getElementById('date-filter');
    if (dateFilter) {
        dateFilter.addEventListener('change', applyFilters);
    }
    
    // Connect view toggles
    const viewButtons = document.querySelectorAll('.view-btn');
    viewButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            // Remove active class from all buttons
            viewButtons.forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            this.classList.add('active');
            
            // Apply the view mode
            const viewMode = this.getAttribute('data-view');
            applyViewMode(viewMode);
        });
    });
});

// Store original job data and update company filter dropdown
function storeJobData(jobs) {
    jobsData = jobs;
    filteredJobs = [...jobs];
    
    return jobs; // Return jobs for chaining
}

// Apply all filters to job data
function applyFilters() {
    // If no jobs data yet, return
    if (!jobsData.length) return;
    
    // Get filter values
    const searchTerm = document.getElementById('job-search')?.value.toLowerCase() || '';
    const dateFilter = document.getElementById('date-filter')?.value || 'all';
    const sortOption = document.getElementById('sort-jobs')?.value || 'recent';
    
    // Apply filters
    filteredJobs = jobsData.filter(job => {
        // Text search (search in title and company)
        if (searchTerm && !job.title.toLowerCase().includes(searchTerm) && 
            !job.company.toLowerCase().includes(searchTerm)) {
            return false;
        }
        
        
        // Date filter
        if (dateFilter !== 'all' && job.date) {
            const jobDate = new Date(job.date);
            const now = new Date();
            
            if (dateFilter === 'today') {
                // Check if job was posted today
                if (jobDate.toDateString() !== now.toDateString()) {
                    return false;
                }
            } else if (dateFilter === 'week') {
                // Check if job was posted within the last week
                const oneWeekAgo = new Date();
                oneWeekAgo.setDate(now.getDate() - 7);
                if (jobDate < oneWeekAgo) {
                    return false;
                }
            } else if (dateFilter === 'month') {
                // Check if job was posted within the last month
                const oneMonthAgo = new Date();
                oneMonthAgo.setMonth(now.getMonth() - 1);
                if (jobDate < oneMonthAgo) {
                    return false;
                }
            }
        }
        
        return true;
    });
    
    // Apply sorting
    sortJobs(sortOption);
    
    // Render filtered jobs
    renderFilteredJobs();
}

// Sort jobs based on selected option
function sortJobs(sortOption) {
    switch(sortOption) {
        case 'recent':
            // Sort by date (newest first)
            filteredJobs.sort((a, b) => {
                return new Date(b.date || 0) - new Date(a.date || 0);
            });
            break;
            
        case 'company':
            // Sort by company name (A-Z)
            filteredJobs.sort((a, b) => {
                return a.company.localeCompare(b.company);
            });
            break;
            
        case 'title':
            // Sort by job title (A-Z)
            filteredJobs.sort((a, b) => {
                return a.title.localeCompare(b.title);
            });
            break;
            
        case 'relevant':
            // In a real app, this would use a relevance algorithm
            // For demo purposes, we'll keep the default order
            break;
    }
}

// Render filtered jobs to the container
function renderFilteredJobs() {
    const container = document.getElementById('jobs-container');
    if (!container) return;
    
    // Clear container
    container.innerHTML = '';
    
    // Check if no results
    if (filteredJobs.length === 0) {
        container.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search"></i>
                <h3>No matching jobs found</h3>
                <p>Try adjusting your filters or search terms</p>
                <button onclick="resetFilters()" class="reset-filters-btn">
                    <i class="fas fa-undo"></i> Reset Filters
                </button>
            </div>
        `;
        
        // Update job count if element exists (disabled - using static dummy data)
        // const jobsCountElement = document.getElementById('jobs-count');
        // if (jobsCountElement) {
        //     jobsCountElement.textContent = `0 jobs found`;
        // }
        
        return;
    }
    
    // Determine current view mode
    const viewMode = document.querySelector('.view-btn.active')?.getAttribute('data-view') || 'grid';
    
    // Add appropriate class to container based on view mode
    container.className = viewMode === 'list' ? 'jobs-list-view' : '';
    
    // Render each job
    filteredJobs.forEach(job => {
        const div = document.createElement('div');
        div.className = 'job-card';
        
        const fallbackImage = 'https://img.icons8.com/fluency/96/briefcase.png';
        const sanitizedImage = job.image || fallbackImage;
        
        // Make the whole card clickable
        div.style.cursor = 'pointer';
        div.onclick = function() {
            if (job.link) {
                window.open(job.link, '_blank');
            }
        };
        
        div.innerHTML = `
            <div class="job-card-header">
             <img src="${sanitizedImage}" 
                 alt="${job.company}" 
                 loading="lazy" decoding="async" fetchpriority="low" width="96" height="96"
                 onerror="this.onerror=null; this.src='${fallbackImage}';">
            </div>
            <div class="job-card-content">
                <h2>${job.title}</h2>
                <div class="company-info">
                    <span><i class="fas fa-building"></i> ${job.company}</span>
                    <span><i class="fas fa-map-marker-alt"></i> ${job.location || 'Sri Lanka'}</span>
                    <span><i class="fas fa-calendar"></i> ${formatDate(job.date)}</span>
                </div>
            </div>
            <div class="job-card-footer">
                <button class="apply-btn" onclick="event.stopPropagation(); window.open('${job.link}', '_blank');">
                    <i class="fas fa-external-link-alt"></i>
                    Apply Now
                </button>
            </div>
        `;
        container.appendChild(div);
    });
    
    // Update job count if element exists (disabled - using static dummy data)
    // const jobsCountElement = document.getElementById('jobs-count');
    // if (jobsCountElement) {
    //     jobsCountElement.textContent = `${filteredJobs.length} job${filteredJobs.length !== 1 ? 's' : ''} found`;
    // }
}

// Apply view mode (grid or list)
function applyViewMode(viewMode) {
    const container = document.getElementById('jobs-container');
    if (!container) return;
    
    if (viewMode === 'list') {
        container.className = 'jobs-list-view';
    } else {
        container.className = '';
    }
}

// Format date for display
function formatDate(dateStr) {
    if (!dateStr) return 'Recently posted';
    
    try {
        const dateObj = new Date(dateStr);
        if (isNaN(dateObj.getTime())) return 'Recently posted';
        
        return dateObj.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    } catch (err) {
        return 'Recently posted';
    }
}

// Reset all filters
function resetFilters() {
    // Reset search input
    const searchInput = document.getElementById('job-search');
    if (searchInput) searchInput.value = '';
    
    // Reset date filter
    const dateFilter = document.getElementById('date-filter');
    if (dateFilter) dateFilter.value = 'all';
    
    // Reset sort option
    const sortSelect = document.getElementById('sort-jobs');
    if (sortSelect) sortSelect.value = 'recent';
    
    // Reset jobs to unfiltered state
    filteredJobs = [...jobsData];
    renderFilteredJobs();
}

// Add a reset filters button
function addResetFiltersButton() {
    const filterBar = document.querySelector('.jobs-filter-bar');
    if (!filterBar) return;
    
    const resetButton = document.createElement('button');
    resetButton.className = 'reset-filters-btn';
    resetButton.innerHTML = '<i class="fas fa-undo"></i> Reset Filters';
    resetButton.onclick = resetFilters;
    
    const filterRight = filterBar.querySelector('.filter-right');
    if (filterRight) {
        filterRight.appendChild(resetButton);
    }
}

// Export functions for use in other scripts
window.JobFilters = {
    storeJobData,
    applyFilters,
    resetFilters,
    renderFilteredJobs
};
