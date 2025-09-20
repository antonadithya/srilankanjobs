// active-filters.js - Enhanced filters with active filter visualization

// Initialize module when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Connect search input with delayed processing
    const searchInput = document.getElementById('job-search');
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                updateActiveFilters();
                if (window.JobFilters && typeof window.JobFilters.applyFilters === 'function') {
                    window.JobFilters.applyFilters();
                }
            }, 300); // 300ms delay for better performance
        });
    }
    
    // Connect all filter controls to update active filters display
    const filterControls = [
        document.getElementById('location-filter'),
        document.getElementById('date-filter'),
        document.getElementById('sort-jobs')
    ];
    
    filterControls.forEach(control => {
        if (control) {
            control.addEventListener('change', updateActiveFilters);
        }
    });
    
    // Connect filter pills
    const filterPills = document.querySelectorAll('.filter-pill');
    filterPills.forEach(pill => {
        pill.addEventListener('click', function() {
            // Toggle active class happens in filters.js
            // Just update our active filters display
            setTimeout(updateActiveFilters, 10);
        });
    });
    
    // Initial update
    updateActiveFilters();
});

// Update the active filters display
function updateActiveFilters() {
    const activeFiltersContainer = document.getElementById('active-filters');
    if (!activeFiltersContainer) return;
    
    // Get all active filters
    const activeFilters = [];
    
    // Check search input
    const searchInput = document.getElementById('job-search');
    if (searchInput && searchInput.value.trim()) {
        activeFilters.push({
            type: 'search',
            label: `Search: "${searchInput.value.trim()}"`,
            value: searchInput.value.trim()
        });
    }
    
    // Check location filter
    const locationFilter = document.getElementById('location-filter');
    if (locationFilter && locationFilter.value) {
        activeFilters.push({
            type: 'location',
            label: `Location: ${locationFilter.options[locationFilter.selectedIndex].text}`,
            value: locationFilter.value
        });
    }
    
    // Check date filter
    const dateFilter = document.getElementById('date-filter');
    if (dateFilter && dateFilter.value !== 'all') {
        activeFilters.push({
            type: 'date',
            label: `Date: ${dateFilter.options[dateFilter.selectedIndex].text}`,
            value: dateFilter.value
        });
    }
    
    // Check quick filter pills
    document.querySelectorAll('.filter-pill.active').forEach(pill => {
        activeFilters.push({
            type: 'pill',
            label: pill.innerText.trim(),
            value: pill.getAttribute('data-filter'),
            element: pill
        });
    });
    
    // Update display
    if (activeFilters.length === 0) {
        activeFiltersContainer.style.display = 'none';
        return;
    }
    
    // Show the container
    activeFiltersContainer.style.display = 'flex';
    
    // Clear existing filter tags, except the "clear all" button
    const clearAllButton = activeFiltersContainer.querySelector('.clear-all');
    activeFiltersContainer.innerHTML = '';
    
    // Add filter tags
    activeFilters.forEach(filter => {
        const tag = document.createElement('div');
        tag.className = 'active-filter-tag';
        
        // Choose icon based on filter type
        let icon = 'fa-filter';
        if (filter.type === 'search') icon = 'fa-search';
        if (filter.type === 'location') icon = 'fa-map-marker-alt';
        if (filter.type === 'date') icon = 'fa-calendar-alt';
        
        tag.innerHTML = `
            <i class="fas ${icon}"></i>
            <span>${filter.label}</span>
            <i class="fas fa-times remove"></i>
        `;
        
        // Add remove handler
        const removeIcon = tag.querySelector('.remove');
        if (removeIcon) {
            removeIcon.addEventListener('click', () => {
                removeFilter(filter);
                updateActiveFilters();
                if (window.JobFilters && typeof window.JobFilters.applyFilters === 'function') {
                    window.JobFilters.applyFilters();
                }
            });
        }
        
        activeFiltersContainer.appendChild(tag);
    });
    
    // Add the clear all button back
    activeFiltersContainer.appendChild(clearAllButton);
}

// Remove a specific filter
function removeFilter(filter) {
    switch (filter.type) {
        case 'search':
            const searchInput = document.getElementById('job-search');
            if (searchInput) searchInput.value = '';
            break;
            
        case 'location':
            const locationFilter = document.getElementById('location-filter');
            if (locationFilter) locationFilter.value = '';
            break;
            
        case 'date':
            const dateFilter = document.getElementById('date-filter');
            if (dateFilter) dateFilter.value = 'all';
            break;
            
        case 'pill':
            if (filter.element) filter.element.classList.remove('active');
            break;
    }
}

// Reset all filters
function resetFilters() {
    // Reset search input
    const searchInput = document.getElementById('job-search');
    if (searchInput) searchInput.value = '';
    
    // Reset location filter
    const locationFilter = document.getElementById('location-filter');
    if (locationFilter) locationFilter.value = '';
    
    // Reset date filter
    const dateFilter = document.getElementById('date-filter');
    if (dateFilter) dateFilter.value = 'all';
    
    // Reset sort option
    const sortSelect = document.getElementById('sort-jobs');
    if (sortSelect) sortSelect.value = 'recent';
    
    // Reset quick filters
    document.querySelectorAll('.filter-pill.active').forEach(pill => {
        pill.classList.remove('active');
    });
    
    // Update active filters display
    updateActiveFilters();
    
    // Apply filtering through the main filter module
    if (window.JobFilters && typeof window.JobFilters.resetFilters === 'function') {
        window.JobFilters.resetFilters();
    }
}
