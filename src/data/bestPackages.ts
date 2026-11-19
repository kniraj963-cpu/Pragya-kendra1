import { DOC_DICT, SERVICES_CATALOG } from './catalog.ts';

export interface BestServicePackage {
  id: number;
  slug: string;
  category: 'Land & Mutation' | 'Registry & Legal' | 'JharSewa Certificates' | 'Citizen & Business';
  titleEn: string;
  titleHi: string;
  descEn: string;
  descHi: string;
  bestServiceEn: string;
  bestServiceHi: string;
  bestDescEn: string;
  bestDescHi: string;
  fee: number;
  checklist: string[];
}

export const CORE_BEST_SERVICES: BestServicePackage[] = [
  {
    id: 1,
    slug: 'land-mutation',
    category: 'Land & Mutation',
    titleEn: 'Jharbhoomi Land Mutation (दाखिल-खारिज)',
    titleHi: 'झारभूमि दाखिल-खारिज (Land Mutation)',
    descEn: 'Online mutation filing with Register-II & revenue record verification for Ranchi Anchal offices.',
    descHi: 'रांची अंचल कार्यालयों के लिए पंजी-II और राजस्व अभिलेख सत्यापन के साथ ऑनलाइन दाखिल-खारिज।',
    bestServiceEn: 'Complete Mutation + Lagaan Check + Objection Follow-up Pack',
    bestServiceHi: 'पूर्ण दाखिल-खारिज + लगान जांच + आपत्ति फॉलो-अप पैक',
    bestDescEn: 'Includes document audit, portal filing, receipt generation, and status tracking.',
    bestDescHi: 'दस्तावेज ऑडिट, पोर्टल आवेदन, रसीद और स्थिति ट्रैकिंग शामिल।',
    fee: 450,
    checklist: [
      'Registered Sale / Gift Deed Copy (.PDF)',
      'Updated Online Lagaan / Malgujari Receipt (.PDF)',
      'Khatian / Khatiyan / Land Record Extract (.PDF)',
      'Applicant Identity & Address Proof (.PDF)',
    ],
  },
  {
    id: 2,
    slug: 'sale-deed-drafting',
    category: 'Registry & Legal',
    titleEn: 'Kutchery Registry & Deed Drafting',
    titleHi: 'कचहरी रजिस्ट्री एवं डीड ड्राफ्टिंग',
    descEn: 'Sale deed, power of attorney, agreement drafting, stamp challan guidance, and slot preparation.',
    descHi: 'सेल डीड, मुख्तारनामा, एग्रीमेंट ड्राफ्टिंग, स्टांप चालान मार्गदर्शन एवं स्लॉट तैयारी।',
    bestServiceEn: 'Priority Deed Review + Stamp Valuation Check + Slot Prep',
    bestServiceHi: 'प्राथमिक डीड समीक्षा + स्टांप मूल्यांकन जांच + स्लॉट तैयारी',
    bestDescEn: 'Pre-checks circle rate vs agreement value and required annexures before registry.',
    bestDescHi: 'रजिस्ट्री से पूर्व सर्कल रेट बनाम एग्रीमेंट मूल्य व संलग्नकों की जांच।',
    fee: 700,
    checklist: [
      'Vendor & Vendee Identity Proofs (.PDF)',
      'Chain / Previous Title Deed & Khata-Khesra Details (.PDF)',
      'Latest Lagaan Receipt & Non-Encumbrance / Property Details (.PDF)',
    ],
  },
  {
    id: 3,
    slug: 'lagan-rasid',
    category: 'Land & Mutation',
    titleEn: 'Online Lagaan / Rent Receipt',
    titleHi: 'ऑनलाइन लगान / मालगुजारी रसीद',
    descEn: 'Pay land revenue online and download digitally verifiable Lagaan receipts for Ranchi holdings.',
    descHi: 'रांची होल्डिंग के लिए ऑनलाइन भू-राजस्व भुगतान और डिजिटल लगान रसीद डाउनलोड।',
    bestServiceEn: 'Lagaan Arrear Check + Instant Receipt Filing Pack',
    bestServiceHi: 'लगान बकाया जांच + त्वरित रसीद आवेदन पैक',
    bestDescEn: 'Verifies current holding details and generates official digital receipt.',
    bestDescHi: 'वर्तमान होल्डिंग विवरण जांचकर आधिकारिक डिजिटल रसीद तैयार करना।',
    fee: 200,
    checklist: [
      'Previous Lagaan Receipt or Holding Number Proof (.PDF)',
      'Khata / Plot / Thana Details Document (.PDF)',
    ],
  },
  {
    id: 4,
    slug: 'income-certificate',
    category: 'JharSewa Certificates',
    titleEn: 'JharSewa Caste, Income & Residential',
    titleHi: 'झारसेवा जाति, आय एवं आवासीय प्रमाण पत्र',
    descEn: 'Apply for Caste (जाति), Income (आय), or Residential (आवासीय) certificates via JharSewa.',
    descHi: 'झारसेवा के माध्यम से जाति, आय या आवासीय प्रमाण पत्र के लिए आवेदन।',
    bestServiceEn: 'JharSewa Guided Filing + Self-Declaration & Tracking Pack',
    bestServiceHi: 'झारसेवा मार्गदर्शित आवेदन + स्व-घोषणा एवं ट्रैकिंग पैक',
    bestDescEn: 'Ensures proper annexure formatting and timely follow-up until certificate issue.',
    bestDescHi: 'सही संलग्नक प्रारूप और प्रमाण पत्र निर्गत होने तक समय पर फॉलो-अप।',
    fee: 150,
    checklist: [
      'Applicant Photo ID & Address Proof (.PDF)',
      'Khatian / Family Lineage or Local Residence Proof (.PDF)',
      'Signed Application / Self-Declaration Form (.PDF)',
    ],
  },
  {
    id: 5,
    slug: 'affidavit-notary',
    category: 'Registry & Legal',
    titleEn: 'Legal Affidavits, Gap & Name Change',
    titleHi: 'शपथ पत्र (Affidavit), गैप एवं नाम संशोधन',
    descEn: 'Drafting and formatting affidavits for name variation, date of birth, gap certificate, or address.',
    descHi: 'नाम भिन्नता, जन्म तिथि, गैप सर्टिफिकेट या पता हेतु शपथ पत्र प्रारूपण।',
    bestServiceEn: 'Accurate Legal Drafting + Print & Verification Ready Pack',
    bestServiceHi: 'सटीक कानूनी प्रारूपण + प्रिंट एवं सत्यापन तैयार पैक',
    bestDescEn: 'Structured legal wording with clean print layout and ID cross-check.',
    bestDescHi: 'स्पष्ट कानूनी प्रारूप और पहचान पत्र मिलान के साथ तैयार प्रति।',
    fee: 250,
    checklist: [
      'Applicant ID Proof (.PDF)',
      'Supporting Document Showing Name / Date / Fact (.PDF)',
    ],
  },
  {
    id: 6,
    slug: 'pan-new-correction',
    category: 'Citizen & Business',
    titleEn: 'PAN Card, Passport & Business Licenses',
    titleHi: 'पैन कार्ड, पासपोर्ट एवं व्यापार लाइसेंस',
    descEn: 'New/correction PAN card, Passport Seva appointment filing, Udyam, FSSAI, and trade registrations.',
    descHi: 'नया/संशोधन पैन कार्ड, पासपोर्ट सेवा आवेदन, उद्यम, FSSAI एवं व्यापार पंजीकरण।',
    bestServiceEn: 'Error-Free Form Filing + Document Check + Slot Slip Pack',
    bestServiceHi: 'त्रुटि-मुक्त फॉर्म आवेदन + दस्तावेज जांच + स्लॉट पर्ची पैक',
    bestDescEn: 'Prevents name/DOB mismatches and provides complete acknowledgment slip.',
    bestDescHi: 'नाम/जन्मतिथि त्रुटि से बचाव और पूर्ण पावती पर्ची।',
    fee: 220,
    checklist: [
      'Identity & Date of Birth Proof (.PDF)',
      'Address / Business Premise Proof (.PDF)',
    ],
  },
];

export const ALL_APPLY_OPTIONS: BestServicePackage[] = [
  ...CORE_BEST_SERVICES,
  ...SERVICES_CATALOG.filter((s) => !CORE_BEST_SERVICES.some((c) => c.slug === s[0])).map(
    (s, index) => {
      const catMap: Record<string, BestServicePackage['category']> = {
        land: 'Land & Mutation',
        registry: 'Registry & Legal',
        legal: 'Registry & Legal',
        cert: 'JharSewa Certificates',
        welfare: 'JharSewa Certificates',
      };
      const mappedCat = catMap[s[1]] || 'Citizen & Business';
      const docKeys = s[4].split(' ').filter(Boolean);
      const feeMap: Record<string, number> = {
        land: 350,
        registry: 650,
        legal: 300,
        cert: 150,
      };
      return {
        id: 100 + index,
        slug: s[0],
        category: mappedCat,
        titleEn: s[2],
        titleHi: s[3],
        descEn: `${s[2]} — verified preparation, document check, and portal submission at Kutchery Chowk.`,
        descHi: `${s[3]} — कचहरी चौक डेस्क द्वारा दस्तावेज़ जांच एवं ऑनलाइन पोर्टल आवेदन।`,
        bestServiceEn: 'Guided Document Audit + Portal Filing + Live Token Pack',
        bestServiceHi: 'दस्तावेज़ जांच + पोर्टल आवेदन + लाइव टोकन पैक',
        bestDescEn: 'Includes pre-filing PDF verification, acknowledgment slip, and status updates.',
        bestDescHi: 'आवेदन से पूर्व PDF जांच, पावती रसीद और लाइव स्थिति ट्रैकिंग शामिल।',
        fee: feeMap[s[1]] ?? 250,
        checklist: docKeys.map((dk) => `${DOC_DICT[dk]?.[0] || dk} (.PDF)`),
      };
    }
  ),
];

export function resolvePackageByIdOrSlug(target: number | string): BestServicePackage {
  if (typeof target === 'number') {
    return (
      ALL_APPLY_OPTIONS.find((s) => s.id === target) || CORE_BEST_SERVICES[0]
    );
  }
  return (
    ALL_APPLY_OPTIONS.find((s) => s.slug === target) ||
    CORE_BEST_SERVICES[0]
  );
}
