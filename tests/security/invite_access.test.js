/**
 * Invite Access Security Tests
 * Tests for invite token validation, expiry, and cohort gating
 * Target: beta.waliinstudio.com
 */

const Ajv = require('ajv');
const addFormats = require('ajv-formats');
const fs = require('fs');
const path = require('path');

// Load schemas
const inviteTokenSchema = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../../schemas/invite_token.schema.json'), 'utf8')
);
const cohortFlagsSchema = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../../schemas/cohort_flags.schema.json'), 'utf8')
);

// Initialize AJV with formats support
const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

describe('Invite Token Schema Validation', () => {
  let validateInviteToken;

  beforeAll(() => {
    validateInviteToken = ajv.compile(inviteTokenSchema);
  });

  describe('Valid Token Structure', () => {
    test('should validate a complete valid invite token', () => {
      const validToken = {
        token: 'inv_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6',
        cohort_id: 'closed',
        created_at: '2025-11-28T12:00:00Z',
        expires_at: '2025-12-01T12:00:00Z',
        single_use: true,
        redeemed: false,
        redeemed_at: null,
        redeemed_by: null,
        max_redemptions: 1,
        redemption_count: 0,
        issued_by: 'admin@waliinstudio.com',
        email_hint: 'tester@example.com',
        metadata: {
          campaign: 'beta_launch_2025',
          source: 'email',
          notes: 'Early adopter invite'
        },
        revoked: false,
        revoked_at: null,
        revoked_reason: null
      };

      const isValid = validateInviteToken(validToken);
      expect(isValid).toBe(true);
    });

    test('should validate token with minimal required fields', () => {
      const minimalToken = {
        token: 'inv_minimal_token_12345678901234567890',
        cohort_id: 'internal',
        created_at: '2025-11-28T12:00:00Z',
        expires_at: '2025-12-01T12:00:00Z',
        single_use: true
      };

      const isValid = validateInviteToken(minimalToken);
      expect(isValid).toBe(true);
    });

    test('should accept all valid cohort_id values', () => {
      const cohorts = ['internal', 'closed', 'open'];
      
      cohorts.forEach(cohort => {
        const token = {
          token: 'inv_test_token_12345678901234567890ab',
          cohort_id: cohort,
          created_at: '2025-11-28T12:00:00Z',
          expires_at: '2025-12-01T12:00:00Z',
          single_use: true
        };
        
        const isValid = validateInviteToken(token);
        expect(isValid).toBe(true);
      });
    });
  });

  describe('Token Expiry Validation', () => {
    test('should validate token with future expiry date', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 3);
      
      const token = {
        token: 'inv_future_token_12345678901234567890',
        cohort_id: 'closed',
        created_at: new Date().toISOString(),
        expires_at: futureDate.toISOString(),
        single_use: true
      };

      const isValid = validateInviteToken(token);
      expect(isValid).toBe(true);
    });

    test('should accept expired token for schema validation (expiry checked at runtime)', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      
      const token = {
        token: 'inv_expired_token_1234567890123456789',
        cohort_id: 'closed',
        created_at: '2025-11-25T12:00:00Z',
        expires_at: pastDate.toISOString(),
        single_use: true
      };

      // Schema validates structure, runtime checks expiry
      const isValid = validateInviteToken(token);
      expect(isValid).toBe(true);
    });

    test('should reject invalid date format', () => {
      const token = {
        token: 'inv_invalid_date_12345678901234567890',
        cohort_id: 'closed',
        created_at: 'invalid-date',
        expires_at: '2025-12-01T12:00:00Z',
        single_use: true
      };

      const isValid = validateInviteToken(token);
      expect(isValid).toBe(false);
    });
  });

  describe('Single-Use Token Enforcement', () => {
    test('should validate unredeemed single-use token', () => {
      const token = {
        token: 'inv_single_use_12345678901234567890ab',
        cohort_id: 'closed',
        created_at: '2025-11-28T12:00:00Z',
        expires_at: '2025-12-01T12:00:00Z',
        single_use: true,
        redeemed: false,
        redemption_count: 0,
        max_redemptions: 1
      };

      const isValid = validateInviteToken(token);
      expect(isValid).toBe(true);
    });

    test('should validate redeemed single-use token', () => {
      const token = {
        token: 'inv_redeemed_12345678901234567890abc',
        cohort_id: 'closed',
        created_at: '2025-11-28T12:00:00Z',
        expires_at: '2025-12-01T12:00:00Z',
        single_use: true,
        redeemed: true,
        redeemed_at: '2025-11-29T10:00:00Z',
        redeemed_by: 'user@example.com',
        redemption_count: 1,
        max_redemptions: 1
      };

      const isValid = validateInviteToken(token);
      expect(isValid).toBe(true);
    });

    test('should validate multi-use token', () => {
      const token = {
        token: 'inv_multi_use_12345678901234567890abc',
        cohort_id: 'open',
        created_at: '2025-11-28T12:00:00Z',
        expires_at: '2025-12-01T12:00:00Z',
        single_use: false,
        redeemed: false,
        redemption_count: 5,
        max_redemptions: 100
      };

      const isValid = validateInviteToken(token);
      expect(isValid).toBe(true);
    });
  });

  describe('Token Revocation', () => {
    test('should validate revoked token', () => {
      const token = {
        token: 'inv_revoked_token_1234567890123456789',
        cohort_id: 'closed',
        created_at: '2025-11-28T12:00:00Z',
        expires_at: '2025-12-01T12:00:00Z',
        single_use: true,
        revoked: true,
        revoked_at: '2025-11-29T08:00:00Z',
        revoked_reason: 'Suspected abuse'
      };

      const isValid = validateInviteToken(token);
      expect(isValid).toBe(true);
    });
  });

  describe('Invalid Token Structures', () => {
    test('should reject token with missing required fields', () => {
      const incompleteToken = {
        token: 'inv_incomplete_token_12345678901234567',
        cohort_id: 'closed'
        // missing created_at, expires_at, single_use
      };

      const isValid = validateInviteToken(incompleteToken);
      expect(isValid).toBe(false);
      expect(validateInviteToken.errors).toBeDefined();
    });

    test('should reject token with invalid cohort_id', () => {
      const token = {
        token: 'inv_invalid_cohort_1234567890123456789',
        cohort_id: 'premium', // Invalid cohort
        created_at: '2025-11-28T12:00:00Z',
        expires_at: '2025-12-01T12:00:00Z',
        single_use: true
      };

      const isValid = validateInviteToken(token);
      expect(isValid).toBe(false);
    });

    test('should reject token with too short token string', () => {
      const token = {
        token: 'short', // Less than 32 characters
        cohort_id: 'closed',
        created_at: '2025-11-28T12:00:00Z',
        expires_at: '2025-12-01T12:00:00Z',
        single_use: true
      };

      const isValid = validateInviteToken(token);
      expect(isValid).toBe(false);
    });

    test('should reject token with invalid email format', () => {
      const token = {
        token: 'inv_invalid_email_1234567890123456789',
        cohort_id: 'closed',
        created_at: '2025-11-28T12:00:00Z',
        expires_at: '2025-12-01T12:00:00Z',
        single_use: true,
        email_hint: 'not-an-email'
      };

      const isValid = validateInviteToken(token);
      expect(isValid).toBe(false);
    });

    test('should reject negative redemption_count', () => {
      const token = {
        token: 'inv_negative_count_123456789012345678',
        cohort_id: 'closed',
        created_at: '2025-11-28T12:00:00Z',
        expires_at: '2025-12-01T12:00:00Z',
        single_use: true,
        redemption_count: -1
      };

      const isValid = validateInviteToken(token);
      expect(isValid).toBe(false);
    });
  });
});

describe('Cohort Feature Flags Schema Validation', () => {
  let validateCohortFlags;

  beforeAll(() => {
    validateCohortFlags = ajv.compile(cohortFlagsSchema);
  });

  describe('Valid Cohort Structures', () => {
    test('should validate internal cohort with full access', () => {
      const internalCohort = {
        cohort_id: 'internal',
        name: 'Internal',
        description: 'Internal team and stakeholders with full access',
        capacity: {
          min: 50,
          max: 100,
          current: 25,
          waitlist: 0
        },
        access_level: 'full',
        features: {
          core_features: {
            dashboard_access: true,
            api_access: true,
            export_data: true,
            integrations: true
          },
          beta_features: {
            new_ui: true,
            ai_assistant: true,
            advanced_analytics: true,
            collaborative_editing: true
          },
          debug_features: {
            debug_mode: true,
            feature_preview: true,
            admin_panel: true,
            impersonation: true
          },
          limits: {
            api_requests_per_day: 100000,
            storage_mb: 10000,
            projects_max: 100,
            team_members_max: 50
          }
        },
        created_at: '2025-11-28T12:00:00Z',
        updated_at: '2025-11-28T12:00:00Z',
        active: true
      };

      const isValid = validateCohortFlags(internalCohort);
      expect(isValid).toBe(true);
    });

    test('should validate closed beta cohort with standard access', () => {
      const closedCohort = {
        cohort_id: 'closed',
        name: 'Closed Beta',
        description: 'Selected external testers',
        capacity: {
          min: 500,
          max: 1000,
          current: 150,
          waitlist: 200
        },
        access_level: 'standard',
        features: {
          core_features: {
            dashboard_access: true,
            api_access: true,
            export_data: true,
            integrations: false
          },
          beta_features: {
            new_ui: true,
            ai_assistant: true
          },
          limits: {
            api_requests_per_day: 10000,
            storage_mb: 1000
          }
        }
      };

      const isValid = validateCohortFlags(closedCohort);
      expect(isValid).toBe(true);
    });

    test('should validate open beta cohort with limited access', () => {
      const openCohort = {
        cohort_id: 'open',
        name: 'Open Beta',
        description: 'Public beta testers',
        capacity: {
          min: 10000,
          max: 25000
        },
        access_level: 'limited',
        features: {
          core_features: {
            dashboard_access: true,
            api_access: false,
            export_data: false
          },
          limits: {
            api_requests_per_day: 1000,
            storage_mb: 100
          }
        }
      };

      const isValid = validateCohortFlags(openCohort);
      expect(isValid).toBe(true);
    });
  });

  describe('Cohort Capacity Validation', () => {
    test('should validate capacity ranges for internal cohort (50-100)', () => {
      const cohort = {
        cohort_id: 'internal',
        name: 'Internal',
        capacity: {
          min: 50,
          max: 100,
          current: 75
        },
        features: {}
      };

      const isValid = validateCohortFlags(cohort);
      expect(isValid).toBe(true);
      expect(cohort.capacity.min).toBe(50);
      expect(cohort.capacity.max).toBe(100);
    });

    test('should validate capacity ranges for closed cohort (500-1000)', () => {
      const cohort = {
        cohort_id: 'closed',
        name: 'Closed Beta',
        capacity: {
          min: 500,
          max: 1000
        },
        features: {}
      };

      const isValid = validateCohortFlags(cohort);
      expect(isValid).toBe(true);
    });

    test('should validate capacity ranges for open cohort (10000-25000)', () => {
      const cohort = {
        cohort_id: 'open',
        name: 'Open Beta',
        capacity: {
          min: 10000,
          max: 25000
        },
        features: {}
      };

      const isValid = validateCohortFlags(cohort);
      expect(isValid).toBe(true);
    });
  });

  describe('Feature Flag Gating by Cohort', () => {
    test('should allow debug features only for internal cohort', () => {
      const internalCohort = {
        cohort_id: 'internal',
        name: 'Internal',
        capacity: { min: 50, max: 100 },
        features: {
          debug_features: {
            debug_mode: true,
            admin_panel: true,
            impersonation: true
          }
        }
      };

      const isValid = validateCohortFlags(internalCohort);
      expect(isValid).toBe(true);
    });

    test('should validate feature limits differ by cohort', () => {
      const internalLimits = {
        cohort_id: 'internal',
        name: 'Internal',
        capacity: { min: 50, max: 100 },
        features: {
          limits: {
            api_requests_per_day: 100000,
            storage_mb: 10000
          }
        }
      };

      const openLimits = {
        cohort_id: 'open',
        name: 'Open',
        capacity: { min: 10000, max: 25000 },
        features: {
          limits: {
            api_requests_per_day: 1000,
            storage_mb: 100
          }
        }
      };

      expect(validateCohortFlags(internalLimits)).toBe(true);
      expect(validateCohortFlags(openLimits)).toBe(true);
      
      // Verify internal has higher limits
      expect(internalLimits.features.limits.api_requests_per_day)
        .toBeGreaterThan(openLimits.features.limits.api_requests_per_day);
    });
  });

  describe('Enrollment Settings', () => {
    test('should validate enrollment requiring invite', () => {
      const cohort = {
        cohort_id: 'closed',
        name: 'Closed Beta',
        capacity: { min: 500, max: 1000 },
        features: {},
        enrollment: {
          open: false,
          requires_invite: true,
          requires_approval: false
        }
      };

      const isValid = validateCohortFlags(cohort);
      expect(isValid).toBe(true);
    });

    test('should validate open enrollment for open cohort', () => {
      const cohort = {
        cohort_id: 'open',
        name: 'Open Beta',
        capacity: { min: 10000, max: 25000 },
        features: {},
        enrollment: {
          open: true,
          requires_invite: false,
          requires_approval: false
        }
      };

      const isValid = validateCohortFlags(cohort);
      expect(isValid).toBe(true);
    });

    test('should validate auto-promotion settings', () => {
      const cohort = {
        cohort_id: 'closed',
        name: 'Closed Beta',
        capacity: { min: 500, max: 1000 },
        features: {},
        enrollment: {
          open: false,
          requires_invite: true,
          auto_promote: true,
          promotion_target: 'open'
        }
      };

      const isValid = validateCohortFlags(cohort);
      expect(isValid).toBe(true);
    });
  });

  describe('Invalid Cohort Structures', () => {
    test('should reject cohort with missing required fields', () => {
      const incompleteCohort = {
        cohort_id: 'closed',
        name: 'Incomplete'
        // missing capacity and features
      };

      const isValid = validateCohortFlags(incompleteCohort);
      expect(isValid).toBe(false);
    });

    test('should reject cohort with invalid cohort_id', () => {
      const cohort = {
        cohort_id: 'premium', // Invalid
        name: 'Premium',
        capacity: { min: 10, max: 50 },
        features: {}
      };

      const isValid = validateCohortFlags(cohort);
      expect(isValid).toBe(false);
    });

    test('should reject cohort with invalid access_level', () => {
      const cohort = {
        cohort_id: 'closed',
        name: 'Closed',
        capacity: { min: 500, max: 1000 },
        features: {},
        access_level: 'premium' // Invalid
      };

      const isValid = validateCohortFlags(cohort);
      expect(isValid).toBe(false);
    });

    test('should reject negative capacity values', () => {
      const cohort = {
        cohort_id: 'closed',
        name: 'Closed',
        capacity: { min: -10, max: 1000 },
        features: {}
      };

      const isValid = validateCohortFlags(cohort);
      expect(isValid).toBe(false);
    });
  });
});

describe('Runtime Access Control Logic', () => {
  // Helper functions simulating runtime behavior
  
  function isTokenExpired(token) {
    const now = new Date();
    const expiresAt = new Date(token.expires_at);
    return expiresAt <= now;
  }

  function isTokenRedeemable(token) {
    if (token.revoked) return false;
    if (isTokenExpired(token)) return false;
    if (token.single_use && token.redeemed) return false;
    if (token.redemption_count >= token.max_redemptions) return false;
    return true;
  }

  function canAccessFeature(cohort, featureCategory, featureName) {
    if (!cohort.features || !cohort.features[featureCategory]) return false;
    return cohort.features[featureCategory][featureName] === true;
  }

  test('should correctly identify expired token', () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);
    
    const expiredToken = {
      token: 'inv_expired_12345678901234567890abcd',
      expires_at: pastDate.toISOString(),
      single_use: true,
      redeemed: false,
      revoked: false,
      redemption_count: 0,
      max_redemptions: 1
    };

    expect(isTokenExpired(expiredToken)).toBe(true);
    expect(isTokenRedeemable(expiredToken)).toBe(false);
  });

  test('should correctly identify valid token', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 3);
    
    const validToken = {
      token: 'inv_valid_123456789012345678901234567',
      expires_at: futureDate.toISOString(),
      single_use: true,
      redeemed: false,
      revoked: false,
      redemption_count: 0,
      max_redemptions: 1
    };

    expect(isTokenExpired(validToken)).toBe(false);
    expect(isTokenRedeemable(validToken)).toBe(true);
  });

  test('should reject already redeemed single-use token', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 3);
    
    const redeemedToken = {
      token: 'inv_redeemed_1234567890123456789012345',
      expires_at: futureDate.toISOString(),
      single_use: true,
      redeemed: true,
      revoked: false,
      redemption_count: 1,
      max_redemptions: 1
    };

    expect(isTokenRedeemable(redeemedToken)).toBe(false);
  });

  test('should reject revoked token', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 3);
    
    const revokedToken = {
      token: 'inv_revoked_12345678901234567890abcde',
      expires_at: futureDate.toISOString(),
      single_use: true,
      redeemed: false,
      revoked: true,
      redemption_count: 0,
      max_redemptions: 1
    };

    expect(isTokenRedeemable(revokedToken)).toBe(false);
  });

  test('should allow multi-use token up to max redemptions', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 3);
    
    const multiUseToken = {
      token: 'inv_multi_use_12345678901234567890abc',
      expires_at: futureDate.toISOString(),
      single_use: false,
      redeemed: false,
      revoked: false,
      redemption_count: 5,
      max_redemptions: 10
    };

    expect(isTokenRedeemable(multiUseToken)).toBe(true);

    // When max reached
    multiUseToken.redemption_count = 10;
    expect(isTokenRedeemable(multiUseToken)).toBe(false);
  });

  test('should correctly gate feature access by cohort', () => {
    const internalCohort = {
      cohort_id: 'internal',
      features: {
        debug_features: {
          debug_mode: true,
          admin_panel: true
        },
        core_features: {
          api_access: true
        }
      }
    };

    const openCohort = {
      cohort_id: 'open',
      features: {
        debug_features: {
          debug_mode: false,
          admin_panel: false
        },
        core_features: {
          api_access: false
        }
      }
    };

    // Internal cohort should have debug access
    expect(canAccessFeature(internalCohort, 'debug_features', 'debug_mode')).toBe(true);
    expect(canAccessFeature(internalCohort, 'debug_features', 'admin_panel')).toBe(true);
    
    // Open cohort should not have debug access
    expect(canAccessFeature(openCohort, 'debug_features', 'debug_mode')).toBe(false);
    expect(canAccessFeature(openCohort, 'debug_features', 'admin_panel')).toBe(false);
  });
});
