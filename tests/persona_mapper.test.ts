/**
 * Tests for the persona_mapper utility function
 * This validates the mapping logic used in n8n workflows
 */
import { describe, it, expect } from 'vitest';

// Replicate the mapping function from automation/n8n/persona_mapper.js
// The original is designed for n8n Function nodes, so we adapt it here
function mapPersona($json: Record<string, unknown>) {
  return {
    personaDisplay: $json['display_name'],
    personaCode: $json['persona_code'],
    language: $json['language'],
    voiceId: $json['voice_id'],
    styleNotes: $json['style_notes'],
    signOff: $json['sign_off'],
  };
}

describe('persona_mapper', () => {
  it('maps all persona fields correctly', () => {
    const input = {
      display_name: 'Addis Analyst',
      persona_code: 'ADDIS',
      language: 'en',
      voice_id: 'voice_123',
      style_notes: 'Analytical and witty',
      sign_off: 'Stay curious!',
    };

    const result = mapPersona(input);

    expect(result.personaDisplay).toBe('Addis Analyst');
    expect(result.personaCode).toBe('ADDIS');
    expect(result.language).toBe('en');
    expect(result.voiceId).toBe('voice_123');
    expect(result.styleNotes).toBe('Analytical and witty');
    expect(result.signOff).toBe('Stay curious!');
  });

  it('handles missing fields gracefully', () => {
    const input = {
      display_name: 'Test Persona',
      persona_code: 'TEST',
    };

    const result = mapPersona(input);

    expect(result.personaDisplay).toBe('Test Persona');
    expect(result.personaCode).toBe('TEST');
    expect(result.language).toBeUndefined();
    expect(result.voiceId).toBeUndefined();
    expect(result.styleNotes).toBeUndefined();
    expect(result.signOff).toBeUndefined();
  });

  it('handles empty object input', () => {
    const input = {};

    const result = mapPersona(input);

    expect(result.personaDisplay).toBeUndefined();
    expect(result.personaCode).toBeUndefined();
    expect(result.language).toBeUndefined();
    expect(result.voiceId).toBeUndefined();
    expect(result.styleNotes).toBeUndefined();
    expect(result.signOff).toBeUndefined();
  });
});
