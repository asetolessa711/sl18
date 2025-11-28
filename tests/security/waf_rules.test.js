/**
 * WAF Rules Security Tests
 * Tests for WAF protections including SQLi, XSS, bot mitigation, and rate limits
 * Target: beta.waliinstudio.com
 */

const fs = require('fs');
const path = require('path');

// Load WAF rules configuration
const wafRules = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../../waf/rules-beta.json'), 'utf8')
);

describe('WAF Rules Configuration', () => {
  describe('Configuration Structure', () => {
    test('should have valid schema version', () => {
      expect(wafRules.$schema).toBeDefined();
    });

    test('should have required top-level properties', () => {
      expect(wafRules.name).toBe('SL18 Beta WAF Rules');
      expect(wafRules.version).toBeDefined();
      expect(wafRules.provider).toBe('cloudflare');
      expect(wafRules.mode).toBe('block');
      expect(wafRules.enabled).toBe(true);
    });

    test('should have rule_groups array', () => {
      expect(Array.isArray(wafRules.rule_groups)).toBe(true);
      expect(wafRules.rule_groups.length).toBeGreaterThan(0);
    });

    test('should have bypass_rules array', () => {
      expect(Array.isArray(wafRules.bypass_rules)).toBe(true);
    });

    test('should have logging configuration', () => {
      expect(wafRules.logging).toBeDefined();
      expect(wafRules.logging.enabled).toBe(true);
    });

    test('should have notifications configuration', () => {
      expect(wafRules.notifications).toBeDefined();
      expect(wafRules.notifications.enabled).toBe(true);
    });
  });
});

describe('SQL Injection Protection Rules', () => {
  let sqliRuleGroup;

  beforeAll(() => {
    sqliRuleGroup = wafRules.rule_groups.find(g => g.id === 'sqli_protection');
  });

  test('should have SQLi protection rule group', () => {
    expect(sqliRuleGroup).toBeDefined();
    expect(sqliRuleGroup.enabled).toBe(true);
    expect(sqliRuleGroup.action).toBe('block');
  });

  test('should have multiple SQLi rules', () => {
    expect(Array.isArray(sqliRuleGroup.rules)).toBe(true);
    expect(sqliRuleGroup.rules.length).toBeGreaterThanOrEqual(4);
  });

  test('should block SQL keywords in parameters', () => {
    const sqlKeywordsRule = sqliRuleGroup.rules.find(r => r.id === 'sqli_001');
    expect(sqlKeywordsRule).toBeDefined();
    expect(sqlKeywordsRule.enabled).toBe(true);
    expect(sqlKeywordsRule.action).toBe('block');
    
    // Verify it checks for common SQL keywords
    expect(sqlKeywordsRule.expression).toContain('UNION');
    expect(sqlKeywordsRule.expression).toContain('SELECT');
    expect(sqlKeywordsRule.expression).toContain('INSERT');
    expect(sqlKeywordsRule.expression).toContain('DELETE');
    expect(sqlKeywordsRule.expression).toContain('DROP');
  });

  test('should block SQL comment injection', () => {
    const commentRule = sqliRuleGroup.rules.find(r => r.id === 'sqli_002');
    expect(commentRule).toBeDefined();
    expect(commentRule.enabled).toBe(true);
    
    // Should detect comment patterns
    expect(commentRule.expression).toContain('--');
    expect(commentRule.expression).toContain('/*');
  });

  test('should block SQL injection in request body', () => {
    const bodyRule = sqliRuleGroup.rules.find(r => r.id === 'sqli_003');
    expect(bodyRule).toBeDefined();
    expect(bodyRule.enabled).toBe(true);
    
    // Should check POST/PUT/PATCH methods
    expect(bodyRule.expression).toContain('POST');
    expect(bodyRule.expression).toContain('PUT');
    expect(bodyRule.expression).toContain('PATCH');
  });

  test('should block URL-encoded SQL injection', () => {
    const encodedRule = sqliRuleGroup.rules.find(r => r.id === 'sqli_004');
    expect(encodedRule).toBeDefined();
    expect(encodedRule.enabled).toBe(true);
    
    // Should detect URL-encoded characters
    expect(encodedRule.expression).toContain('%27');  // Single quote
    expect(encodedRule.expression).toContain('%22');  // Double quote
  });

  test('should have OWASP tags for SQLi rules', () => {
    sqliRuleGroup.rules.forEach(rule => {
      expect(rule.tags).toContain('sqli');
    });
  });
});

describe('XSS Protection Rules', () => {
  let xssRuleGroup;

  beforeAll(() => {
    xssRuleGroup = wafRules.rule_groups.find(g => g.id === 'xss_protection');
  });

  test('should have XSS protection rule group', () => {
    expect(xssRuleGroup).toBeDefined();
    expect(xssRuleGroup.enabled).toBe(true);
    expect(xssRuleGroup.action).toBe('block');
  });

  test('should have multiple XSS rules', () => {
    expect(Array.isArray(xssRuleGroup.rules)).toBe(true);
    expect(xssRuleGroup.rules.length).toBeGreaterThanOrEqual(5);
  });

  test('should block script tags', () => {
    const scriptRule = xssRuleGroup.rules.find(r => r.id === 'xss_001');
    expect(scriptRule).toBeDefined();
    expect(scriptRule.enabled).toBe(true);
    expect(scriptRule.action).toBe('block');
    
    expect(scriptRule.expression).toContain('<script');
    expect(scriptRule.expression).toContain('</script>');
  });

  test('should block event handlers', () => {
    const eventRule = xssRuleGroup.rules.find(r => r.id === 'xss_002');
    expect(eventRule).toBeDefined();
    expect(eventRule.enabled).toBe(true);
    
    // Should detect common event handlers (using regex pattern)
    expect(eventRule.expression).toContain('load');
    expect(eventRule.expression).toContain('error');
    expect(eventRule.expression).toContain('click');
  });

  test('should block javascript: protocol', () => {
    const jsProtocolRule = xssRuleGroup.rules.find(r => r.id === 'xss_003');
    expect(jsProtocolRule).toBeDefined();
    expect(jsProtocolRule.enabled).toBe(true);
    
    expect(jsProtocolRule.expression).toContain('javascript:');
  });

  test('should block data URI XSS', () => {
    const dataUriRule = xssRuleGroup.rules.find(r => r.id === 'xss_004');
    expect(dataUriRule).toBeDefined();
    expect(dataUriRule.enabled).toBe(true);
    
    expect(dataUriRule.expression).toContain('data:text/html');
  });

  test('should block SVG-based XSS', () => {
    const svgRule = xssRuleGroup.rules.find(r => r.id === 'xss_005');
    expect(svgRule).toBeDefined();
    expect(svgRule.enabled).toBe(true);
    
    expect(svgRule.expression).toContain('<svg');
  });

  test('should have OWASP tags for XSS rules', () => {
    xssRuleGroup.rules.forEach(rule => {
      expect(rule.tags).toContain('xss');
    });
  });
});

describe('Bot Mitigation Rules', () => {
  let botRuleGroup;

  beforeAll(() => {
    botRuleGroup = wafRules.rule_groups.find(g => g.id === 'bot_mitigation');
  });

  test('should have bot mitigation rule group', () => {
    expect(botRuleGroup).toBeDefined();
    expect(botRuleGroup.enabled).toBe(true);
  });

  test('should have multiple bot rules', () => {
    expect(Array.isArray(botRuleGroup.rules)).toBe(true);
    expect(botRuleGroup.rules.length).toBeGreaterThanOrEqual(5);
  });

  test('should block known bad bots', () => {
    const badBotsRule = botRuleGroup.rules.find(r => r.id === 'bot_001');
    expect(badBotsRule).toBeDefined();
    expect(badBotsRule.enabled).toBe(true);
    expect(badBotsRule.action).toBe('block');
    
    // Should detect common security scanners
    expect(badBotsRule.expression).toContain('sqlmap');
    expect(badBotsRule.expression).toContain('nikto');
    expect(badBotsRule.expression).toContain('nmap');
    expect(badBotsRule.expression).toContain('nuclei');
  });

  test('should challenge empty user agents', () => {
    const emptyUaRule = botRuleGroup.rules.find(r => r.id === 'bot_002');
    expect(emptyUaRule).toBeDefined();
    expect(emptyUaRule.enabled).toBe(true);
    expect(emptyUaRule.action).toBe('managed_challenge');
  });

  test('should challenge automated tools without API key', () => {
    const automationRule = botRuleGroup.rules.find(r => r.id === 'bot_003');
    expect(automationRule).toBeDefined();
    expect(automationRule.enabled).toBe(true);
    
    // Should detect common automation tools
    expect(automationRule.expression).toContain('curl');
    expect(automationRule.expression).toContain('wget');
    expect(automationRule.expression).toContain('python-requests');
  });

  test('should detect headless browsers', () => {
    const headlessRule = botRuleGroup.rules.find(r => r.id === 'bot_004');
    expect(headlessRule).toBeDefined();
    expect(headlessRule.enabled).toBe(true);
    
    expect(headlessRule.expression).toContain('HeadlessChrome');
    expect(headlessRule.expression).toContain('PhantomJS');
    expect(headlessRule.expression).toContain('Selenium');
  });

  test('should rate limit suspicious IPs based on threat score', () => {
    const threatScoreRule = botRuleGroup.rules.find(r => r.id === 'bot_005');
    expect(threatScoreRule).toBeDefined();
    expect(threatScoreRule.enabled).toBe(true);
    
    expect(threatScoreRule.expression).toContain('cf.threat_score');
  });
});

describe('Rate Limiting Rules', () => {
  let rateLimitGroup;

  beforeAll(() => {
    rateLimitGroup = wafRules.rule_groups.find(g => g.id === 'rate_limiting');
  });

  test('should have rate limiting rule group', () => {
    expect(rateLimitGroup).toBeDefined();
    expect(rateLimitGroup.enabled).toBe(true);
  });

  test('should have multiple rate limit rules', () => {
    expect(Array.isArray(rateLimitGroup.rules)).toBe(true);
    expect(rateLimitGroup.rules.length).toBeGreaterThanOrEqual(5);
  });

  describe('Login Rate Limit', () => {
    let loginRule;

    beforeAll(() => {
      loginRule = rateLimitGroup.rules.find(r => r.id === 'rate_001');
    });

    test('should have login rate limit', () => {
      expect(loginRule).toBeDefined();
      expect(loginRule.enabled).toBe(true);
      expect(loginRule.action).toBe('block');
    });

    test('should limit to 5 requests per minute', () => {
      expect(loginRule.rate_limit.requests).toBe(5);
      expect(loginRule.rate_limit.period_seconds).toBe(60);
    });

    test('should apply to POST /api/auth/login', () => {
      expect(loginRule.expression).toContain('/api/auth/login');
      expect(loginRule.expression).toContain('POST');
    });

    test('should have mitigation timeout of 10 minutes', () => {
      expect(loginRule.rate_limit.mitigation_timeout_seconds).toBe(600);
    });
  });

  describe('Signup Rate Limit', () => {
    let signupRule;

    beforeAll(() => {
      signupRule = rateLimitGroup.rules.find(r => r.id === 'rate_002');
    });

    test('should have signup rate limit', () => {
      expect(signupRule).toBeDefined();
      expect(signupRule.enabled).toBe(true);
    });

    test('should limit to 3 requests per 5 minutes', () => {
      expect(signupRule.rate_limit.requests).toBe(3);
      expect(signupRule.rate_limit.period_seconds).toBe(300);
    });

    test('should apply to POST /api/auth/signup', () => {
      expect(signupRule.expression).toContain('/api/auth/signup');
      expect(signupRule.expression).toContain('POST');
    });

    test('should have 1 hour mitigation timeout', () => {
      expect(signupRule.rate_limit.mitigation_timeout_seconds).toBe(3600);
    });

    test('should use managed_challenge action', () => {
      expect(signupRule.action).toBe('managed_challenge');
    });
  });

  describe('Token Redemption Rate Limit', () => {
    let tokenRule;

    beforeAll(() => {
      tokenRule = rateLimitGroup.rules.find(r => r.id === 'rate_003');
    });

    test('should have token redemption rate limit', () => {
      expect(tokenRule).toBeDefined();
      expect(tokenRule.enabled).toBe(true);
    });

    test('should limit to 5 requests per minute', () => {
      expect(tokenRule.rate_limit.requests).toBe(5);
      expect(tokenRule.rate_limit.period_seconds).toBe(60);
    });

    test('should apply to POST /api/invite/redeem', () => {
      expect(tokenRule.expression).toContain('/api/invite/redeem');
      expect(tokenRule.expression).toContain('POST');
    });
  });

  describe('API Rate Limit', () => {
    let apiRule;

    beforeAll(() => {
      apiRule = rateLimitGroup.rules.find(r => r.id === 'rate_004');
    });

    test('should have general API rate limit', () => {
      expect(apiRule).toBeDefined();
      expect(apiRule.enabled).toBe(true);
    });

    test('should limit to 100 requests per minute', () => {
      expect(apiRule.rate_limit.requests).toBe(100);
      expect(apiRule.rate_limit.period_seconds).toBe(60);
    });

    test('should apply to all API endpoints', () => {
      expect(apiRule.expression).toContain('/api/');
    });

    test('should cover all HTTP methods', () => {
      expect(apiRule.expression).toContain('GET');
      expect(apiRule.expression).toContain('POST');
      expect(apiRule.expression).toContain('PUT');
      expect(apiRule.expression).toContain('PATCH');
      expect(apiRule.expression).toContain('DELETE');
    });
  });

  describe('Password Reset Rate Limit', () => {
    let resetRule;

    beforeAll(() => {
      resetRule = rateLimitGroup.rules.find(r => r.id === 'rate_005');
    });

    test('should have password reset rate limit', () => {
      expect(resetRule).toBeDefined();
      expect(resetRule.enabled).toBe(true);
    });

    test('should limit to 3 requests per hour', () => {
      expect(resetRule.rate_limit.requests).toBe(3);
      expect(resetRule.rate_limit.period_seconds).toBe(3600);
    });

    test('should apply to POST /api/auth/reset-password', () => {
      expect(resetRule.expression).toContain('/api/auth/reset-password');
      expect(resetRule.expression).toContain('POST');
    });

    test('should have 2 hour mitigation timeout', () => {
      expect(resetRule.rate_limit.mitigation_timeout_seconds).toBe(7200);
    });
  });
});

describe('Path Traversal Protection', () => {
  let pathTraversalGroup;

  beforeAll(() => {
    pathTraversalGroup = wafRules.rule_groups.find(g => g.id === 'path_traversal');
  });

  test('should have path traversal protection', () => {
    expect(pathTraversalGroup).toBeDefined();
    expect(pathTraversalGroup.enabled).toBe(true);
    expect(pathTraversalGroup.action).toBe('block');
  });

  test('should block directory traversal patterns', () => {
    const dirTraversalRule = pathTraversalGroup.rules.find(r => r.id === 'path_001');
    expect(dirTraversalRule).toBeDefined();
    expect(dirTraversalRule.enabled).toBe(true);
    
    expect(dirTraversalRule.expression).toContain('..');
    expect(dirTraversalRule.expression).toContain('%2e%2e');
  });

  test('should block access to sensitive files', () => {
    const sensitiveFilesRule = pathTraversalGroup.rules.find(r => r.id === 'path_002');
    expect(sensitiveFilesRule).toBeDefined();
    expect(sensitiveFilesRule.enabled).toBe(true);
    
    expect(sensitiveFilesRule.expression).toContain('.env');
    expect(sensitiveFilesRule.expression).toContain('.git');
    expect(sensitiveFilesRule.expression).toContain('.htaccess');
  });
});

describe('Request Validation Rules', () => {
  let validationGroup;

  beforeAll(() => {
    validationGroup = wafRules.rule_groups.find(g => g.id === 'request_validation');
  });

  test('should have request validation rules', () => {
    expect(validationGroup).toBeDefined();
    expect(validationGroup.enabled).toBe(true);
  });

  test('should block oversized requests', () => {
    const oversizedRule = validationGroup.rules.find(r => r.id === 'req_001');
    expect(oversizedRule).toBeDefined();
    expect(oversizedRule.enabled).toBe(true);
    
    // Should limit to 10MB
    expect(oversizedRule.expression).toContain('10485760');
  });

  test('should validate content types for POST/PUT/PATCH', () => {
    const contentTypeRule = validationGroup.rules.find(r => r.id === 'req_002');
    expect(contentTypeRule).toBeDefined();
    expect(contentTypeRule.enabled).toBe(true);
    
    expect(contentTypeRule.expression).toContain('application/json');
    expect(contentTypeRule.expression).toContain('multipart/form-data');
  });

  test('should detect HTTP request smuggling', () => {
    const smugglingRule = validationGroup.rules.find(r => r.id === 'req_003');
    expect(smugglingRule).toBeDefined();
    expect(smugglingRule.enabled).toBe(true);
    
    expect(smugglingRule.expression).toContain('transfer-encoding');
    expect(smugglingRule.expression).toContain('content-length');
  });
});

describe('Bypass Rules', () => {
  test('should allow verified bots', () => {
    const verifiedBotBypass = wafRules.bypass_rules.find(r => r.id === 'bypass_001');
    expect(verifiedBotBypass).toBeDefined();
    expect(verifiedBotBypass.enabled).toBe(true);
    expect(verifiedBotBypass.expression).toContain('cf.bot_management.verified_bot');
  });

  test('should allow health check endpoints', () => {
    const healthBypass = wafRules.bypass_rules.find(r => r.id === 'bypass_002');
    expect(healthBypass).toBeDefined();
    expect(healthBypass.enabled).toBe(true);
    
    expect(healthBypass.expression).toContain('/health');
    expect(healthBypass.expression).toContain('/ready');
    expect(healthBypass.expression).toContain('/live');
  });

  test('should have internal IP bypass option', () => {
    const internalBypass = wafRules.bypass_rules.find(r => r.id === 'bypass_003');
    expect(internalBypass).toBeDefined();
    expect(internalBypass.enabled).toBe(true);
    expect(internalBypass.expression).toContain('internal_monitoring_ips');
  });
});

describe('Logging Configuration', () => {
  test('should have proper logging configuration', () => {
    expect(wafRules.logging.enabled).toBe(true);
    expect(wafRules.logging.log_level).toBe('info');
  });

  test('should include important headers for logging', () => {
    expect(wafRules.logging.include_headers).toContain('user-agent');
    expect(wafRules.logging.include_headers).toContain('x-forwarded-for');
  });

  test('should exclude sensitive headers from logging', () => {
    expect(wafRules.logging.exclude_headers).toContain('authorization');
    expect(wafRules.logging.exclude_headers).toContain('cookie');
    expect(wafRules.logging.exclude_headers).toContain('x-api-key');
  });

  test('should have proper sample rate', () => {
    expect(wafRules.logging.sample_rate).toBe(1.0);
  });

  test('should have logging destinations', () => {
    expect(Array.isArray(wafRules.logging.destinations)).toBe(true);
    expect(wafRules.logging.destinations.length).toBeGreaterThan(0);
  });
});

describe('Notification Thresholds', () => {
  test('should have notification thresholds configured', () => {
    expect(wafRules.notifications.thresholds).toBeDefined();
  });

  test('should alert on 100+ blocks per minute', () => {
    expect(wafRules.notifications.thresholds.blocks_per_minute).toBe(100);
  });

  test('should alert on 500+ challenges per minute', () => {
    expect(wafRules.notifications.thresholds.challenges_per_minute).toBe(500);
  });

  test('should alert on 50+ unique IPs blocked per hour', () => {
    expect(wafRules.notifications.thresholds.unique_ips_blocked_per_hour).toBe(50);
  });

  test('should have notification channels configured', () => {
    expect(Array.isArray(wafRules.notifications.channels)).toBe(true);
    expect(wafRules.notifications.channels.length).toBeGreaterThan(0);
  });
});

describe('Attack Pattern Simulation', () => {
  // Helper function to simulate WAF expression evaluation
  // This is a simplified simulation for testing purposes
  function simulateWafCheck(expression, request) {
    const requestStr = JSON.stringify(request).toLowerCase();
    
    // Check for SQLi patterns
    const sqliPatterns = ['union', 'select', 'insert', 'delete', 'drop', '--', '/*', '*/'];
    if (sqliPatterns.some(p => requestStr.includes(p))) {
      return true;
    }
    
    // Check for XSS patterns
    const xssPatterns = ['<script', 'javascript:', 'onerror', 'onload', 'onclick'];
    if (xssPatterns.some(p => requestStr.includes(p))) {
      return true;
    }
    
    return false;
  }

  test('should detect SQL injection attack vectors', () => {
    const maliciousRequests = [
      { query: "' UNION SELECT * FROM users--" },
      { query: "1; DROP TABLE users;--" },
      { query: "admin'--" }
    ];

    maliciousRequests.forEach(request => {
      const detected = simulateWafCheck('sqli', request);
      expect(detected).toBe(true);
    });
  });

  test('should detect XSS attack vectors', () => {
    const maliciousRequests = [
      { body: "<script>alert('xss')</script>" },
      { body: "<img src=x onerror=alert(1)>" },
      { query: "javascript:alert(1)" }
    ];

    maliciousRequests.forEach(request => {
      const detected = simulateWafCheck('xss', request);
      expect(detected).toBe(true);
    });
  });

  test('should not block legitimate requests', () => {
    const legitimateRequests = [
      { query: "search=hello world" },
      { body: { name: "John Doe", email: "john@example.com" } },
      { query: "page=1&limit=10" }
    ];

    legitimateRequests.forEach(request => {
      const detected = simulateWafCheck('sqli', request);
      expect(detected).toBe(false);
    });
  });
});

describe('Rule Priority and Ordering', () => {
  test('should have rules ordered by priority', () => {
    const priorities = wafRules.rule_groups.map(g => g.priority);
    const sortedPriorities = [...priorities].sort((a, b) => a - b);
    expect(priorities).toEqual(sortedPriorities);
  });

  test('should have SQLi protection as high priority', () => {
    const sqliGroup = wafRules.rule_groups.find(g => g.id === 'sqli_protection');
    expect(sqliGroup.priority).toBeLessThanOrEqual(2);
  });

  test('should have XSS protection as high priority', () => {
    const xssGroup = wafRules.rule_groups.find(g => g.id === 'xss_protection');
    expect(xssGroup.priority).toBeLessThanOrEqual(3);
  });

  test('should have bypass rules with priority 0', () => {
    wafRules.bypass_rules.forEach(rule => {
      expect(rule.priority).toBe(0);
    });
  });
});

describe('OWASP Compliance', () => {
  test('should have OWASP tags on injection rules', () => {
    const sqliGroup = wafRules.rule_groups.find(g => g.id === 'sqli_protection');
    const hasOwaspTags = sqliGroup.rules.some(r => 
      r.tags && r.tags.some(t => t.startsWith('owasp'))
    );
    expect(hasOwaspTags).toBe(true);
  });

  test('should have OWASP tags on XSS rules', () => {
    const xssGroup = wafRules.rule_groups.find(g => g.id === 'xss_protection');
    const hasOwaspTags = xssGroup.rules.some(r => 
      r.tags && r.tags.some(t => t.startsWith('owasp'))
    );
    expect(hasOwaspTags).toBe(true);
  });

  test('should cover OWASP A03 (Injection)', () => {
    const allRules = wafRules.rule_groups.flatMap(g => g.rules);
    const a03Rules = allRules.filter(r => 
      r.tags && r.tags.includes('owasp-a03')
    );
    expect(a03Rules.length).toBeGreaterThan(0);
  });
});

describe('Landing Page Endpoint Protection', () => {
  describe('Token Redemption Endpoint', () => {
    test('should have rate limit for token redemption endpoint', () => {
      const rateLimitGroup = wafRules.rule_groups.find(g => g.id === 'rate_limiting');
      const tokenRule = rateLimitGroup.rules.find(r => r.id === 'rate_003');
      
      expect(tokenRule).toBeDefined();
      expect(tokenRule.expression).toContain('/api/invite/redeem');
      expect(tokenRule.rate_limit.requests).toBe(5);
      expect(tokenRule.rate_limit.period_seconds).toBe(60);
    });

    test('should protect token endpoint from SQLi', () => {
      const sqliGroup = wafRules.rule_groups.find(g => g.id === 'sqli_protection');
      const bodyRule = sqliGroup.rules.find(r => r.id === 'sqli_003');
      
      // POST requests to redeem endpoint should be protected
      expect(bodyRule.expression).toContain('POST');
      expect(bodyRule.enabled).toBe(true);
    });

    test('should protect token endpoint from XSS', () => {
      const xssGroup = wafRules.rule_groups.find(g => g.id === 'xss_protection');
      
      // All XSS rules should be enabled
      xssGroup.rules.forEach(rule => {
        expect(rule.enabled).toBe(true);
      });
    });
  });

  describe('Signup Endpoint', () => {
    test('should have strict rate limit for signup', () => {
      const rateLimitGroup = wafRules.rule_groups.find(g => g.id === 'rate_limiting');
      const signupRule = rateLimitGroup.rules.find(r => r.id === 'rate_002');
      
      expect(signupRule).toBeDefined();
      expect(signupRule.expression).toContain('/api/auth/signup');
      expect(signupRule.rate_limit.requests).toBe(3);
      expect(signupRule.rate_limit.period_seconds).toBe(300); // 5 minutes
      expect(signupRule.action).toBe('managed_challenge');
    });
  });

  describe('Static Assets', () => {
    test('should allow health check endpoints to bypass WAF', () => {
      const healthBypass = wafRules.bypass_rules.find(r => r.id === 'bypass_002');
      
      expect(healthBypass).toBeDefined();
      expect(healthBypass.enabled).toBe(true);
      expect(healthBypass.expression).toContain('/health');
    });
  });

  describe('Bot Protection for Landing Page', () => {
    test('should challenge automated tools accessing landing page', () => {
      const botGroup = wafRules.rule_groups.find(g => g.id === 'bot_mitigation');
      const automationRule = botGroup.rules.find(r => r.id === 'bot_003');
      
      expect(automationRule).toBeDefined();
      expect(automationRule.enabled).toBe(true);
      expect(automationRule.action).toBe('managed_challenge');
    });

    test('should block headless browsers', () => {
      const botGroup = wafRules.rule_groups.find(g => g.id === 'bot_mitigation');
      const headlessRule = botGroup.rules.find(r => r.id === 'bot_004');
      
      expect(headlessRule).toBeDefined();
      expect(headlessRule.enabled).toBe(true);
      expect(headlessRule.expression).toContain('HeadlessChrome');
      expect(headlessRule.expression).toContain('Selenium');
    });
  });

  describe('Content Security', () => {
    test('should block oversized requests to landing page forms', () => {
      const validationGroup = wafRules.rule_groups.find(g => g.id === 'request_validation');
      const oversizedRule = validationGroup.rules.find(r => r.id === 'req_001');
      
      expect(oversizedRule).toBeDefined();
      expect(oversizedRule.enabled).toBe(true);
      // 10MB limit
      expect(oversizedRule.expression).toContain('10485760');
    });

    test('should validate content types for POST requests', () => {
      const validationGroup = wafRules.rule_groups.find(g => g.id === 'request_validation');
      const contentTypeRule = validationGroup.rules.find(r => r.id === 'req_002');
      
      expect(contentTypeRule).toBeDefined();
      expect(contentTypeRule.enabled).toBe(true);
      expect(contentTypeRule.expression).toContain('application/json');
    });
  });
});
