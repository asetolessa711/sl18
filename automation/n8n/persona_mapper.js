// Paste into n8n Function node to map persona fields
return {
  personaDisplay: $json["display_name"],
  personaCode: $json["persona_code"],
  language: $json["language"],
  voiceId: $json["voice_id"],
  styleNotes: $json["style_notes"],
  signOff: $json["sign_off"]
};
