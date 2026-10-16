/**
 * Grounded Mock AI Engine (Client-side)
 * Strictly evaluates transcripts against SAMPLE-* IDs with confidence scoring.
 * All disclaimers say: "Sample data modelled on DIKSHA/SWAYAM/NSDC".
 */

export function extractGroundedLifeMap({ transcript = '', studentId = 'priya_17', language = 'hi' }) {
  const t = transcript.toLowerCase();

  // Radio / Circuit / Soldering / Solar path (Priya's canonical path)
  if (/radio|circuit|solder|solar|bijli|रेडियो|सर्किट|सोलर|तार|इन्वर्टर/i.test(t)) {
    return {
      student_id: studentId,
      matched_skills: ['Audio Soldering', 'DC Circuit Testing', 'Transistor Diagnostics'],
      suggested_career: 'Solar Inverter & Microgrid Technician',
      primary_course_id: 'SAMPLE-CRS-SOLAR-101',
      primary_course_title: 'Solar Photovoltaic Technician & Inverter Maintenance',
      apprenticeship_id: 'SAMPLE-APPR-BIHAR-SOLAR-01',
      local_job_id: 'SAMPLE-JOB-SOLAR-TECH',
      micro_task_id: 'SAMPLE-TASK-SOLAR-SURVEY-01',
      micro_task_payout: 40,
      confidence_score: 0.88,
      refer_to_facilitator: false,
      voice_guidance_hi: 'प्रिया, आपके रेडियो रिपेयर हुनर को सोलर इन्वर्टर मेंटेनेंस से जोड़ा गया है। कोर्स पूरा करने पर ₹40 का पहला टास्क अनलॉक होगा।',
      voice_guidance_en: 'Priya, your circuit repair skills map directly to Solar Inverter Maintenance. Completing Module 1 unlocks your first ₹40 village micro-task.',
      disclaimer: 'Sample data modelled on DIKSHA/SWAYAM/NSDC'
    };
  }

  // Tailoring path
  if (/tailor|sew|silai|kapda|सिलाई|कपड़ा|सिलाई मशीन/i.test(t)) {
    return {
      student_id: studentId,
      matched_skills: ['Pattern Drafting', 'Machine Operation'],
      suggested_career: 'Commercial Garment Construction',
      primary_course_id: 'SAMPLE-CRS-TAILORING-101',
      primary_course_title: 'Garment Construction & Commercial Stitching',
      apprenticeship_id: 'SAMPLE-APPR-TEXTILE-07',
      local_job_id: 'SAMPLE-JOB-TAILOR-LEAD',
      micro_task_id: 'SAMPLE-TASK-UNIFORM-SAMPLE-01',
      micro_task_payout: 40,
      confidence_score: 0.84,
      refer_to_facilitator: false,
      voice_guidance_hi: 'आपके सिलाई के हुनर के लिए व्यावसायिक गारमेंट मेकिंग कोर्स चुना गया है।',
      voice_guidance_en: 'Your tailoring skills map to commercial garment construction and local cluster orders.',
      disclaimer: 'Sample data modelled on DIKSHA/SWAYAM/NSDC'
    };
  }

  // Low confidence fallback (< 0.60): Refer to Village Facilitator
  return {
    student_id: studentId,
    matched_skills: ['General Aptitude'],
    suggested_career: 'Pending Village Facilitator Review',
    primary_course_id: 'SAMPLE-CRS-SURVEY-101',
    primary_course_title: 'Field Survey & Mobile Data Enumerator',
    apprenticeship_id: null,
    local_job_id: null,
    micro_task_id: 'SAMPLE-TASK-SURVEY-GENERAL-01',
    micro_task_payout: 25,
    confidence_score: 0.45,
    refer_to_facilitator: true,
    voice_guidance_hi: 'हम आपके हुनर को पूरी तरह समझ नहीं पाए। आपके गांव के सुविधा प्रदाता आपकी सहायता करेंगे।',
    voice_guidance_en: 'Confidence below 0.60. Your case has been referred to your local Village Facilitator for in-person mapping.',
    disclaimer: 'Sample data modelled on DIKSHA/SWAYAM/NSDC'
  };
}
