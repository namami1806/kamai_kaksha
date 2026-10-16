import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const kbPath = path.resolve(__dirname, '../../data/knowledge_base.json');

let knowledgeBase = { local_jobs: [] };
try {
  knowledgeBase = JSON.parse(fs.readFileSync(kbPath, 'utf8'));
} catch (e) {
  console.warn('Could not load knowledge_base.json:', e);
}

// Local employers and hubs around Gaya district
const GAYA_VILLAGE_HUBS = [
  {
    hubName: 'Tekari Gramin Solar Cooperative',
    block: 'Tekari',
    distanceKm: 2.1,
    verifiedPartner: true,
    partnerType: 'Gram Panchayat Clean Energy Partner'
  },
  {
    hubName: 'Bodh Gaya Rooftop Solar Hub',
    block: 'Bodh Gaya',
    distanceKm: 4.8,
    verifiedPartner: true,
    partnerType: 'PM Surya Ghar Tier-3 Channel Partner'
  },
  {
    hubName: 'Gaya District Agri-Solar & E-Rickshaw Service Center',
    block: 'Gaya Town',
    distanceKm: 8.5,
    verifiedPartner: true,
    partnerType: 'NSDC / NSDC Training Cluster'
  }
];

/**
 * Rules-based Job Radar Matcher
 */
export function getMatchedJobs({
  studentId = 'priya_17',
  district = 'Gaya',
  block = 'Tekari',
  skills = ['Solar PV Array Mounting', 'DC Inverter Wiring', 'Battery Bank Testing', 'Multimeter Diagnostics', 'PCB Soldering & Desoldering'],
  isMinor = true
}) {
  const jobs = knowledgeBase.local_jobs || [];

  const matched = jobs.map((job, idx) => {
    const requiredSkills = job.skills_needed || [];
    const matchedSkills = requiredSkills.filter(req => 
      skills.some(userSkill => userSkill.toLowerCase().includes(req.toLowerCase()) || req.toLowerCase().includes(userSkill.toLowerCase()))
    );

    const matchPercent = requiredSkills.length > 0
      ? Math.round((matchedSkills.length / requiredSkills.length) * 100)
      : 0;

    const hub = GAYA_VILLAGE_HUBS[idx % GAYA_VILLAGE_HUBS.length];

    // Safe minor protection tag (Apprenticeship & Non-hazardous Clean Energy)
    const minorFriendly = !job.title.toLowerCase().includes('high voltage') && !job.title.toLowerCase().includes('hazardous');

    return {
      id: job.id,
      title: job.title,
      industry: job.industry,
      averageMonthlyIncome: job.average_monthly_income,
      averageMonthlyIncomeLabel: 'illustrative sample data',
      demandTrend: job.demand_trend,
      requiredSkills,
      matchedSkills,
      matchPercent,
      matchPercentLabel: 'illustrative sample data',
      distanceKm: hub.distanceKm,
      hubName: hub.hubName,
      block: hub.block,
      verifiedPartner: hub.verifiedPartner,
      partnerType: hub.partnerType,
      minorPermitted: minorFriendly,
      minorAdvisory: isMinor ? 'minor safeguards, pending legal review' : 'Direct full-time employment',
      disclaimer: 'illustrative sample data modelled on PM Surya Ghar & rural vocational tracks'
    };
  });

  // Sort by match percentage descending, then by distance ascending
  matched.sort((a, b) => b.matchPercent - a.matchPercent || a.distanceKm - b.distanceKm);

  return {
    studentId,
    district,
    block,
    totalAvailable: matched.length,
    topMatches: matched.slice(0, 5),
    allMatches: matched,
    rulesApplied: [
      'Grounded Skill Keyword Intersect',
      'Geographic Distance from Tekari Hub',
      'Minor Adolescent Safe Apprenticeship Filter'
    ],
    disclaimer: 'Sample data modelled on DIKSHA/SWAYAM/NSDC'
  };
}
