// Blog Content Management System
class BlogCMS {
  constructor() {
    this.posts = [
      {
        id: 1,
        title: "How to Ace Your Job Interview in Sri Lanka",
        slug: "job-interview-tips-sri-lanka",
        category: "career-tips",
        excerpt: "Master the art of job interviews with these proven strategies tailored for the Sri Lankan job market.",
        content: "",
        author: "Career Expert Team",
        publishDate: "2025-07-13",
        status: "published",
        views: 2341,
        metaDescription: "Master job interview skills with expert tips tailored for Sri Lankan professionals. Learn proven strategies to ace your next interview and land your dream job.",
        keywords: "job interview tips Sri Lanka, interview preparation, career advice, job search Sri Lanka, interview skills",
        seoScore: 89
      },
      {
        id: 2,
        title: "Top 10 In-Demand Skills in Sri Lanka 2025",
        slug: "top-skills-sri-lanka-2025",
        category: "industry-trends",
        excerpt: "Discover the most sought-after skills by employers and how to develop them for career success.",
        content: "",
        author: "Industry Analyst",
        publishDate: "2025-07-11",
        status: "published",
        views: 1890,
        metaDescription: "Discover the top 10 in-demand skills in Sri Lanka for 2025. Learn which skills employers value most and how to develop them for career growth.",
        keywords: "in-demand skills Sri Lanka, career development, job market trends, professional skills 2025",
        seoScore: 92
      },
      {
        id: 3,
        title: "Remote Work Revolution: Opportunities in Sri Lanka",
        slug: "remote-work-opportunities-sri-lanka",
        category: "industry-trends",
        excerpt: "Explore the growing remote work landscape and how Sri Lankan professionals can capitalize on global opportunities.",
        content: "",
        author: "Future of Work Team",
        publishDate: "2025-07-15",
        status: "draft",
        views: 0,
        metaDescription: "Explore remote work opportunities in Sri Lanka. Learn how to find international remote jobs and build a successful remote career from Colombo.",
        keywords: "remote work Sri Lanka, work from home jobs, international remote opportunities, digital nomad",
        seoScore: 0
      }
    ];
    
    this.contentIdeas = [
      "Startup Ecosystem in Colombo: Career Opportunities",
      "LinkedIn Profile Optimization for Sri Lankan Professionals", 
      "Freelancing Success Stories from Sri Lanka",
      "Tech Salary Guide: Sri Lanka vs Global Markets",
      "Women in Leadership: Breaking Barriers in Sri Lankan Corporates",
      "Digital Transformation Jobs in Banking Sector",
      "Green Jobs: Sustainability Careers in Sri Lanka",
      "AI and Automation Impact on Sri Lankan Job Market"
    ];
    
    this.seoKeywords = [
      { keyword: "job sri lanka", volume: 12000, difficulty: "medium" },
      { keyword: "career opportunities colombo", volume: 3400, difficulty: "low" },
      { keyword: "interview tips", volume: 8900, difficulty: "high" },
      { keyword: "salary guide sri lanka", volume: 2100, difficulty: "low" },
      { keyword: "remote work sri lanka", volume: 1800, difficulty: "medium" },
      { keyword: "tech jobs colombo", volume: 4200, difficulty: "medium" }
    ];
  }

  // Get all posts
  getAllPosts() {
    return this.posts;
  }

  // Get published posts
  getPublishedPosts() {
    return this.posts.filter(post => post.status === 'published');
  }

  // Get post by slug
  getPostBySlug(slug) {
    return this.posts.find(post => post.slug === slug);
  }

  // Create new post
  createPost(postData) {
    const newPost = {
      id: this.posts.length + 1,
      ...postData,
      publishDate: new Date().toISOString().split('T')[0],
      status: 'draft',
      views: 0,
      seoScore: this.calculateSEOScore(postData)
    };
    
    this.posts.push(newPost);
    return newPost;
  }

  // Update post
  updatePost(id, updates) {
    const postIndex = this.posts.findIndex(post => post.id === id);
    if (postIndex !== -1) {
      this.posts[postIndex] = { ...this.posts[postIndex], ...updates };
      this.posts[postIndex].seoScore = this.calculateSEOScore(this.posts[postIndex]);
      return this.posts[postIndex];
    }
    return null;
  }

  // Delete post
  deletePost(id) {
    const postIndex = this.posts.findIndex(post => post.id === id);
    if (postIndex !== -1) {
      this.posts.splice(postIndex, 1);
      return true;
    }
    return false;
  }

  // Generate content ideas
  getContentIdeas() {
    return this.contentIdeas.sort(() => 0.5 - Math.random()).slice(0, 5);
  }

  // Get trending keywords
  getTrendingKeywords() {
    return this.seoKeywords.sort((a, b) => b.volume - a.volume).slice(0, 10);
  }

  // Calculate SEO Score
  calculateSEOScore(post) {
    let score = 0;
    
    // Title optimization (25 points)
    if (post.title && post.title.length > 30 && post.title.length < 60) {
      score += 25;
    } else if (post.title && post.title.length > 0) {
      score += 15;
    }
    
    // Meta description (25 points)
    if (post.metaDescription && post.metaDescription.length > 120 && post.metaDescription.length < 160) {
      score += 25;
    } else if (post.metaDescription && post.metaDescription.length > 0) {
      score += 15;
    }
    
    // Keywords (20 points)
    if (post.keywords && post.keywords.split(',').length >= 3) {
      score += 20;
    } else if (post.keywords) {
      score += 10;
    }
    
    // Content length (20 points)
    if (post.content && post.content.length > 1500) {
      score += 20;
    } else if (post.content && post.content.length > 800) {
      score += 15;
    } else if (post.content && post.content.length > 0) {
      score += 10;
    }
    
    // Readability (10 points)
    if (post.content && post.content.includes('h2') || post.content.includes('h3')) {
      score += 10;
    }
    
    return Math.min(score, 100);
  }

  // Generate daily blog post suggestions
  getDailyContentSuggestions() {
    const currentDate = new Date();
    const suggestions = [];
    
    // Monday - Career Tips
    if (currentDate.getDay() === 1) {
      suggestions.push({
        type: "Career Tips",
        title: "Monday Motivation: Career Goal Setting Tips",
        urgency: "high"
      });
    }
    
    // Tuesday - Industry News
    if (currentDate.getDay() === 2) {
      suggestions.push({
        type: "Industry Trends",
        title: "Tech Tuesday: Latest Industry Developments",
        urgency: "medium"
      });
    }
    
    // Wednesday - Skills Development
    if (currentDate.getDay() === 3) {
      suggestions.push({
        type: "Professional Development",
        title: "Skill Wednesday: Learning New Technologies",
        urgency: "medium"
      });
    }
    
    // Thursday - Networking
    if (currentDate.getDay() === 4) {
      suggestions.push({
        type: "Networking",
        title: "Networking Thursday: Building Professional Connections",
        urgency: "low"
      });
    }
    
    // Friday - Weekend Reads
    if (currentDate.getDay() === 5) {
      suggestions.push({
        type: "Weekend Reading",
        title: "Friday Feature: Career Success Stories",
        urgency: "low"
      });
    }
    
    return suggestions;
  }

  // Analytics simulation
  getAnalytics() {
    const totalViews = this.posts.reduce((sum, post) => sum + post.views, 0);
    const publishedPosts = this.getPublishedPosts().length;
    const avgSEOScore = this.posts.reduce((sum, post) => sum + post.seoScore, 0) / this.posts.length;
    
    return {
      totalViews,
      publishedPosts,
      totalPosts: this.posts.length,
      avgSEOScore: Math.round(avgSEOScore),
      subscriberGrowth: 45, // Simulated
      weeklyGrowth: 12 // Simulated percentage
    };
  }
}

// Initialize the CMS
const blogCMS = new BlogCMS();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BlogCMS;
}

// Browser usage
if (typeof window !== 'undefined') {
  window.BlogCMS = BlogCMS;
  window.blogCMS = blogCMS;
}
