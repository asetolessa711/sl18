/**
 * Waliin Studio Beta Landing Page Application
 * Target: beta.waliinstudio.com
 * 
 * Integrates with:
 * - schemas/invite_token.schema.json for token validation
 * - schemas/cohort_flags.schema.json for cohort assignment
 * - waf/rules-beta.json for security (server-side)
 */

(function() {
  'use strict';

  // Configuration
  const CONFIG = {
    API_BASE: 'https://api.beta.waliinstudio.com',
    TOKEN_PATTERN: /^[A-Za-z0-9_-]{32,64}$/,
    TOKEN_EXPIRY_HOURS: 72,
    RATE_LIMIT: {
      TOKEN_REDEMPTION: { max: 5, windowMs: 60000 },
      FEEDBACK: { max: 10, windowMs: 300000 }
    }
  };

  // Cohort definitions (matches schemas/cohort_flags.schema.json)
  const COHORTS = {
    internal: {
      name: 'Internal',
      icon: '👑',
      description: 'Full access to all features including debug tools and admin panel.',
      capacity: { min: 50, max: 100 },
      access_level: 'full',
      features: {
        dashboard_access: true,
        api_access: true,
        export_data: true,
        integrations: true,
        new_ui: true,
        ai_assistant: true,
        advanced_analytics: true,
        debug_mode: true,
        admin_panel: true
      },
      limits: {
        api_requests_per_day: 100000,
        storage_mb: 10000
      }
    },
    closed: {
      name: 'Closed Beta',
      icon: '⭐',
      description: 'Standard access with core features and API access.',
      capacity: { min: 500, max: 1000 },
      access_level: 'standard',
      features: {
        dashboard_access: true,
        api_access: true,
        export_data: true,
        integrations: false,
        new_ui: true,
        ai_assistant: true,
        advanced_analytics: false,
        debug_mode: false,
        admin_panel: false
      },
      limits: {
        api_requests_per_day: 10000,
        storage_mb: 1000
      }
    },
    open: {
      name: 'Open Beta',
      icon: '🌟',
      description: 'Limited access to core features.',
      capacity: { min: 10000, max: 25000 },
      access_level: 'limited',
      features: {
        dashboard_access: true,
        api_access: false,
        export_data: false,
        integrations: false,
        new_ui: true,
        ai_assistant: false,
        advanced_analytics: false,
        debug_mode: false,
        admin_panel: false
      },
      limits: {
        api_requests_per_day: 1000,
        storage_mb: 100
      }
    }
  };

  // Rate limiting storage
  const rateLimitStore = new Map();

  /**
   * Check rate limit for an action
   * @param {string} action - The action to check
   * @returns {boolean} True if within limits
   */
  function checkRateLimit(action) {
    const config = CONFIG.RATE_LIMIT[action];
    if (!config) return true;

    const now = Date.now();
    const key = action;
    
    if (!rateLimitStore.has(key)) {
      rateLimitStore.set(key, []);
    }

    const timestamps = rateLimitStore.get(key);
    const validTimestamps = timestamps.filter(t => now - t < config.windowMs);
    
    if (validTimestamps.length >= config.max) {
      return false;
    }

    validTimestamps.push(now);
    rateLimitStore.set(key, validTimestamps);
    return true;
  }

  /**
   * Validate invite token format (client-side)
   * @param {string} token - The token to validate
   * @returns {object} Validation result
   */
  function validateTokenFormat(token) {
    if (!token || typeof token !== 'string') {
      return { valid: false, error: 'Token is required' };
    }

    token = token.trim();

    if (token.length < 32 || token.length > 64) {
      return { valid: false, error: 'Token must be 32-64 characters' };
    }

    if (!CONFIG.TOKEN_PATTERN.test(token)) {
      return { valid: false, error: 'Token contains invalid characters' };
    }

    return { valid: true, token };
  }

  /**
   * Validate email format
   * @param {string} email - The email to validate
   * @returns {object} Validation result
   */
  function validateEmail(email) {
    if (!email || typeof email !== 'string') {
      return { valid: false, error: 'Email is required' };
    }

    email = email.trim().toLowerCase();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
      return { valid: false, error: 'Invalid email format' };
    }

    if (email.length > 255) {
      return { valid: false, error: 'Email is too long' };
    }

    return { valid: true, email };
  }

  /**
   * Simulate token validation (for demo purposes)
   * In production, this calls the API endpoint
   * @param {string} token - The token to validate
   * @param {string} email - User email
   * @returns {Promise<object>} Validation result
   */
  async function validateToken(token, email) {
    // Demo validation - simulates API call
    // In production: return await fetch(`${CONFIG.API_BASE}/api/invite/redeem`, ...)
    
    return new Promise((resolve) => {
      setTimeout(() => {
        // Demo tokens for testing
        const demoTokens = {
          'inv_internal_demo_12345678901234567890': { cohort_id: 'internal', valid: true },
          'inv_closed_beta_demo_123456789012345678': { cohort_id: 'closed', valid: true },
          'inv_open_beta_demo_1234567890123456789a': { cohort_id: 'open', valid: true }
        };

        if (demoTokens[token]) {
          resolve({
            success: true,
            cohort_id: demoTokens[token].cohort_id,
            message: 'Token validated successfully'
          });
        } else if (token.startsWith('inv_expired_')) {
          resolve({
            success: false,
            error: 'Token has expired. Please request a new invite.',
            code: 'TOKEN_EXPIRED'
          });
        } else if (token.startsWith('inv_used_')) {
          resolve({
            success: false,
            error: 'Token has already been redeemed.',
            code: 'TOKEN_REDEEMED'
          });
        } else if (token.startsWith('inv_revoked_')) {
          resolve({
            success: false,
            error: 'Token has been revoked.',
            code: 'TOKEN_REVOKED'
          });
        } else {
          resolve({
            success: false,
            error: 'Invalid token. Please check your invite link.',
            code: 'TOKEN_INVALID'
          });
        }
      }, 1000);
    });
  }

  /**
   * Log analytics event
   * @param {string} event - Event name
   * @param {object} data - Event data
   */
  function logEvent(event, data = {}) {
    // In production, send to analytics endpoint
    console.log(`[Analytics] ${event}:`, {
      timestamp: new Date().toISOString(),
      ...data
    });
  }

  /**
   * Show modal
   * @param {string} modalId - Modal element ID
   */
  function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
      
      // Focus first input
      const firstInput = modal.querySelector('input, button');
      if (firstInput) {
        setTimeout(() => firstInput.focus(), 100);
      }
    }
  }

  /**
   * Hide modal
   * @param {string} modalId - Modal element ID
   */
  function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  /**
   * Show error message
   * @param {string} elementId - Error element ID
   * @param {string} message - Error message
   */
  function showError(elementId, message) {
    const element = document.getElementById(elementId);
    if (element) {
      element.textContent = message;
      element.classList.add('visible');
    }
  }

  /**
   * Hide error message
   * @param {string} elementId - Error element ID
   */
  function hideError(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
      element.textContent = '';
      element.classList.remove('visible');
    }
  }

  /**
   * Show success message
   * @param {string} elementId - Success element ID
   * @param {string} message - Success message
   */
  function showSuccess(elementId, message) {
    const element = document.getElementById(elementId);
    if (element) {
      element.textContent = message;
      element.classList.add('visible');
    }
  }

  /**
   * Display cohort assignment result
   * @param {string} cohortId - Cohort ID
   */
  function showCohortResult(cohortId) {
    const cohort = COHORTS[cohortId];
    if (!cohort) return;

    const badge = document.getElementById('cohortBadge');
    const description = document.getElementById('cohortDescription');
    const features = document.getElementById('cohortFeatures');

    if (badge) {
      badge.textContent = `${cohort.icon} ${cohort.name}`;
      badge.className = `cohort-badge ${cohortId}`;
    }

    if (description) {
      description.textContent = cohort.description;
    }

    if (features) {
      const featureList = Object.entries(cohort.features)
        .map(([key, enabled]) => {
          const name = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
          const icon = enabled ? '✅' : '❌';
          return `<li>${icon} ${name}</li>`;
        })
        .join('');
      
      features.innerHTML = `<ul>${featureList}</ul>`;
    }

    hideModal('tokenModal');
    showModal('cohortModal');
    
    logEvent('cohort_assigned', { cohort_id: cohortId });
  }

  /**
   * Handle token form submission
   * @param {Event} event - Form submit event
   */
  async function handleTokenSubmit(event) {
    event.preventDefault();

    const submitBtn = document.getElementById('submitBtn');
    const tokenInput = document.getElementById('tokenInput');
    const emailInput = document.getElementById('emailInput');

    hideError('formError');

    // Check rate limit
    if (!checkRateLimit('TOKEN_REDEMPTION')) {
      showError('formError', 'Too many attempts. Please wait a minute and try again.');
      logEvent('rate_limited', { action: 'token_redemption' });
      return;
    }

    // Validate token format
    const tokenResult = validateTokenFormat(tokenInput.value);
    if (!tokenResult.valid) {
      showError('formError', tokenResult.error);
      return;
    }

    // Validate email
    const emailResult = validateEmail(emailInput.value);
    if (!emailResult.valid) {
      showError('formError', emailResult.error);
      return;
    }

    // Disable button and show loading
    submitBtn.disabled = true;
    submitBtn.querySelector('.btn-text').hidden = true;
    submitBtn.querySelector('.btn-loading').hidden = false;

    logEvent('token_validation_started', { token_prefix: tokenResult.token.substring(0, 10) });

    try {
      const result = await validateToken(tokenResult.token, emailResult.email);

      if (result.success) {
        logEvent('token_validated', { cohort_id: result.cohort_id });
        showCohortResult(result.cohort_id);
      } else {
        logEvent('token_validation_failed', { error_code: result.code });
        showError('formError', result.error);
      }
    } catch (error) {
      console.error('Token validation error:', error);
      logEvent('token_validation_error', { error: error.message });
      showError('formError', 'An error occurred. Please try again later.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.querySelector('.btn-text').hidden = false;
      submitBtn.querySelector('.btn-loading').hidden = true;
    }
  }

  /**
   * Handle feedback form submission
   * @param {Event} event - Form submit event
   */
  async function handleFeedbackSubmit(event) {
    event.preventDefault();

    hideError('feedbackError');

    // Check rate limit
    if (!checkRateLimit('FEEDBACK')) {
      showError('feedbackError', 'Too many submissions. Please wait and try again.');
      return;
    }

    const formData = new FormData(event.target);
    const data = {
      type: formData.get('type'),
      email: formData.get('email'),
      message: formData.get('message'),
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent
    };

    // Validate
    if (!data.type) {
      showError('feedbackError', 'Please select a feedback type.');
      return;
    }

    if (!data.email || !validateEmail(data.email).valid) {
      showError('feedbackError', 'Please enter a valid email address.');
      return;
    }

    if (!data.message || data.message.trim().length < 10) {
      showError('feedbackError', 'Please provide more details (at least 10 characters).');
      return;
    }

    logEvent('feedback_submitted', { type: data.type });

    // In production, send to API
    console.log('Feedback submitted:', data);

    showSuccess('feedbackSuccess', 'Thank you for your feedback! We\'ll review it shortly.');
    
    setTimeout(() => {
      hideModal('feedbackModal');
      event.target.reset();
      document.getElementById('feedbackSuccess').classList.remove('visible');
    }, 2000);
  }

  /**
   * Check URL for token parameter
   */
  function checkUrlToken() {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    
    if (token) {
      const tokenInput = document.getElementById('tokenInput');
      if (tokenInput) {
        tokenInput.value = token;
      }
      showModal('tokenModal');
      logEvent('token_url_detected', { token_prefix: token.substring(0, 10) });
    }
  }

  /**
   * Initialize event listeners
   */
  function initEventListeners() {
    // Join Beta button
    const joinBetaBtn = document.getElementById('joinBetaBtn');
    if (joinBetaBtn) {
      joinBetaBtn.addEventListener('click', () => {
        showModal('tokenModal');
        logEvent('join_beta_clicked');
      });
    }

    // Token modal
    const tokenModal = document.getElementById('tokenModal');
    const modalClose = document.getElementById('modalClose');
    const modalOverlay = document.getElementById('modalOverlay');

    if (modalClose) {
      modalClose.addEventListener('click', () => hideModal('tokenModal'));
    }
    if (modalOverlay) {
      modalOverlay.addEventListener('click', () => hideModal('tokenModal'));
    }

    // Token form
    const tokenForm = document.getElementById('tokenForm');
    if (tokenForm) {
      tokenForm.addEventListener('submit', handleTokenSubmit);
    }

    // Cohort modal
    const cohortOverlay = document.getElementById('cohortOverlay');
    const continueBtn = document.getElementById('continueBtn');

    if (continueBtn) {
      continueBtn.addEventListener('click', () => {
        // In production, redirect to dashboard
        window.location.href = '/dashboard';
      });
    }

    // Feedback buttons
    const reportIssueBtn = document.getElementById('reportIssueBtn');
    const suggestFeatureBtn = document.getElementById('suggestFeatureBtn');
    const feedbackClose = document.getElementById('feedbackClose');
    const feedbackOverlay = document.getElementById('feedbackOverlay');

    if (reportIssueBtn) {
      reportIssueBtn.addEventListener('click', () => {
        document.getElementById('feedbackType').value = 'bug';
        showModal('feedbackModal');
        logEvent('report_issue_clicked');
      });
    }

    if (suggestFeatureBtn) {
      suggestFeatureBtn.addEventListener('click', () => {
        document.getElementById('feedbackType').value = 'feature';
        showModal('feedbackModal');
        logEvent('suggest_feature_clicked');
      });
    }

    if (feedbackClose) {
      feedbackClose.addEventListener('click', () => hideModal('feedbackModal'));
    }
    if (feedbackOverlay) {
      feedbackOverlay.addEventListener('click', () => hideModal('feedbackModal'));
    }

    // Feedback form
    const feedbackForm = document.getElementById('feedbackForm');
    if (feedbackForm) {
      feedbackForm.addEventListener('submit', handleFeedbackSubmit);
    }

    // Escape key to close modals
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        hideModal('tokenModal');
        hideModal('cohortModal');
        hideModal('feedbackModal');
      }
    });

    // Status link
    const statusLink = document.getElementById('statusLink');
    if (statusLink) {
      statusLink.addEventListener('click', (e) => {
        e.preventDefault();
        window.open('https://status.beta.waliinstudio.com', '_blank', 'noopener');
      });
    }
  }

  /**
   * Initialize the application
   */
  function init() {
    // Check for token in URL
    checkUrlToken();

    // Initialize event listeners
    initEventListeners();

    // Log page view
    logEvent('page_view', {
      path: window.location.pathname,
      referrer: document.referrer
    });

    console.log('🎬 Waliin Studio Beta Landing Page initialized');
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
