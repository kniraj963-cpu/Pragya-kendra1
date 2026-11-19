export interface ProjectMetadata {
  _id: string;
  slug: string;
  title: string;
  titleHi: string;
  category: string;
  clientSector: string;
  location: string;
  turnaround: string;
  year: string;
  summary: string;
  outcomeMetric: string;
  deliverables: string[];
  tags: string[];
  featured: boolean;
  visualTheme: 'navy' | 'amber' | 'emerald' | 'slate';
  createdAt: string;
  updatedAt: string;
}

export interface AttachedDocMeta {
  attachmentId?: string;
  requirementKey?: string;
  requirementLabel?: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  size: string;
  category: string;
  dataBase64?: string;
}

export interface StageHistoryItem {
  stage: number;
  label: string;
  at: string;
}

export interface ContactInquiry {
  _id: string;
  ticketId: string;
  name: string;
  phone: string;
  email: string;
  serviceSlug: string;
  serviceName: string;
  projectRef?: string;
  locationDetails: string;
  message: string;
  statusStage: number; // 0: Accepted, 1: Processing, 2: Verified Document, 3: Verified Payment, 4: Closed
  stageHistory: StageHistoryItem[];
  closedAt: string | null;
  operatorNote: string;
  assignedTo?: string;
  attachedDocs: AttachedDocMeta[];
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeRecord {
  _id: string;
  empId: string;
  name: string;
  role: string;
  phone: string;
  shift: string;
  status: 'Present' | 'On Break' | 'Half-Day' | 'Absent';
  completedToday: number;
  accuracy: string;
}

export interface LedgerEntry {
  _id: string;
  desc: string;
  mode: 'UPI' | 'Cash' | 'Challan';
  amount: number;
  time: string;
  createdAt: string;
}

export interface ChallanItem {
  _id: string;
  refId: string;
  category: string;
  amount: number;
  createdAt: string;
}

export interface PartnerReferral {
  _id: string;
  partner: string;
  client: string;
  work: string;
  status: 'Active' | 'Queued' | 'Completed';
  credit: string;
  createdAt: string;
}

export interface QueueState {
  nowServing: number;
  nextToken: number;
  lastIssued?: {
    token: string;
    desk: string;
    holder: string;
    issuedAt: string;
  };
}

export const STATUS_STAGES = {
  en: ['Accepted', 'Processing', 'Verified Document', 'Verified Payment', 'Closed'],
  hi: ['स्वीकृत', 'प्रक्रिया में', 'दस्तावेज़ सत्यापित', 'भुगतान सत्यापित', 'पूर्ण / बंद'],
} as const;

export const DOC_DICT: Record<string, [string, string]> = {
  id: ['Voter ID / PAN / Driving Licence', 'वोटर आईडी / पैन / ड्राइविंग लाइसेंस'],
  sd: ['Self-declaration form', 'स्वयं-घोषणा पत्र'],
  rb: ['Ration card or electricity bill', 'राशन कार्ड या बिजली बिल'],
  ia: ['Income affidavit or salary slip', 'आय शपथ पत्र या वेतन पर्ची'],
  rp: ['Residential proof / Holding receipt', 'निवास प्रमाण / होल्डिंग रसीद'],
  fc: ['Father’s caste certificate / Khatiyan', 'पिता का जाति प्रमाण पत्र / खतियान'],
  af: ['Notarized Affidavit', 'नोटरी शपथ पत्र'],
  lt: ['Land tax receipt or rent agreement', 'भूमि कर रसीद या किराया अनुबंध'],
  eb: ['Electricity bill', 'बिजली बिल'],
  ph: ['Passport-size photo', 'पासपोर्ट साइज फोटो'],
  ml: ['Active mobile number', 'सक्रिय मोबाइल नंबर'],
  bp: ['Bank passbook', 'बैंक पासबुक'],
  ic: ['Income certificate', 'आय प्रमाण पत्र'],
  cc: ['Caste certificate', 'जाति प्रमाण पत्र'],
  rc: ['Residential certificate', 'आवासीय प्रमाण पत्र'],
  pn: ['PAN card', 'पैन कार्ड'],
  fh: ['Family head’s photo', 'परिवार के मुखिया की फोटो'],
  ma: ['Identity proof of all members', 'सभी सदस्यों का पहचान पत्र'],
  sl: ['Registered sale deed', 'पंजीकृत सेल डीड'],
  ol: ['Previous land rent receipt (Lagan Rasid)', 'पुरानी भू-लगान रसीद'],
  dh: ['District, Anchal and Halka details', 'जिला, अंचल और हल्का विवरण'],
  pl: ['Plot or Khata number', 'प्लॉट या खाता नंबर'],
  ry: ['Raiyat (tenant) name', 'रैयत का नाम'],
  fe: ['Fee receipt', 'फीस रसीद'],
  bn: ['Bonafide certificate', 'बोनाफाइड प्रमाण पत्र'],
  ed: ['Educational certificates', 'शैक्षणिक प्रमाण पत्र'],
  ba: ['Business address and bank details', 'व्यापार का पता और बैंक विवरण'],
  ac: ['Business activity description', 'व्यापार गतिविधि का विवरण'],
  bf: ['Business proof or rent agreement', 'व्यापार प्रमाण या किराया अनुबंध'],
  cn: ['Consumer number', 'उपभोक्ता संख्या'],
  ob: ['Old bill copy', 'पुराने बिल की प्रति'],
  rm: ['Ration card or registered mobile', 'राशन कार्ड या पंजीकृत मोबाइल'],
  ag: ['Age proof or voter ID', 'आयु प्रमाण या वोटर आईडी'],
  em: ['Employer certificate', 'नियोक्ता प्रमाण पत्र'],
  od: ['Old driving licence copy', 'पुराने ड्राइविंग लाइसेंस की प्रति'],
  md: ['Medical certificate (Form 1A)', 'मेडिकल प्रमाण पत्र (फॉर्म 1A)'],
  ad: ['Property address', 'संपत्ति का पता'],
  rt: ['Rent and deposit terms', 'किराया और जमा की शर्तें'],
  ap: ['Purpose of the affidavit', 'शपथ पत्र का उद्देश्य'],
  f6: ['Form 16 or bank statement', 'फॉर्म 16 या बैंक विवरण'],
  di: ['Medical disability certificate', 'चिकित्सा विकलांगता प्रमाण पत्र'],
  hb: ['Hospital birth record or discharge slip', 'अस्पताल का जन्म रिकॉर्ड या डिस्चार्ज पर्ची'],
  pa: ['Identity proof of both parents', 'माता-पिता दोनों का पहचान प्रमाण'],
  dr: ['Death report or hospital record', 'मृत्यु रिपोर्ट या अस्पताल का रिकॉर्ड'],
  da: ['Identity proof of the deceased', 'मृतक का पहचान प्रमाण'],
  mp: ['Marriage proof (invitation card or photo)', 'विवाह का प्रमाण (निमंत्रण पत्र या फोटो)'],
  cp: ['Photos of both spouses', 'दोनों की फोटो'],
  sp: ['Proof supporting the change', 'बदलाव का सहायक प्रमाण'],
  pp: ['Pension payment order details', 'पेंशन भुगतान आदेश का विवरण'],
  ft: ['Family tree (Vanshavali)', 'वंशावली'],
  sg: ['Scanned signature', 'हस्ताक्षर का स्कैन'],
  wd: ['Work experience details', 'कार्य अनुभव विवरण'],
  vr: ['Vehicle RC copy', 'वाहन आरसी की प्रति'],
  ins: ['Insurance certificate', 'बीमा प्रमाण पत्र'],
  pu: ['Pollution certificate (PUC)', 'प्रदूषण प्रमाण पत्र (PUC)'],
  nd: ['No-dues certificate from financier', 'फाइनेंसर से नो-ड्यूज प्रमाण पत्र'],
  f2: ['Forms 29 and 30', 'फॉर्म 29 और 30'],
  bs: ['ID proof of buyer and seller', 'खरीदार और विक्रेता का पहचान प्रमाण'],
  orc: ['Original RC', 'मूल आरसी'],
  na: ['Name change affidavit', 'नाम परिवर्तन शपथ पत्र'],
  nw: ['Newspaper clippings', 'समाचार पत्र की कतरन'],
  rq: ['RTI query details', 'आरटीआई प्रश्न का विवरण'],
  bd: ['Business plan details', 'व्यापार योजना विवरण'],
  ky: ['KYC documents', 'केवाईसी दस्तावेज़'],
  sn: ['Mobile or subscriber number', 'मोबाइल या ग्राहक नंबर'],
  lp: ['LPG consumer number', 'एलपीजी उपभोक्ता संख्या'],
  ll: ['Learner’s licence', 'लर्नर लाइसेंस'],
  ch: ['Challan or vehicle number', 'चालान या वाहन नंबर'],
  og: ['Original documents to attest', 'सत्यापन के लिए मूल दस्तावेज़'],
  pw: ['Details of the powers to give', 'दिए जाने वाले अधिकारों का विवरण'],
  rx: ['Receiver’s bank account details', 'प्राप्तकर्ता के बैंक खाते का विवरण'],
  nm: ['Nominee details', 'नॉमिनी का विवरण'],
  dp: ['Date-of-birth proof', 'जन्मतिथि का प्रमाण'],
  pf: ['Files or originals to print or scan', 'प्रिंट या स्कैन के लिए फाइल या मूल प्रति'],
  ec: ['Existing certificate copy', 'मौजूदा प्रमाण पत्र की प्रति'],
  cb: ['Child’s birth certificate', 'बच्चे का जन्म प्रमाण पत्र'],
  rn: ['Roll number and date of birth', 'रोल नंबर और जन्मतिथि'],
  gn: ['GSTIN and portal login details', 'जीएसटीआईएन और पोर्टल लॉगिन विवरण'],
  sr: ['Sales and purchase records', 'बिक्री और खरीद का रिकॉर्ड'],
  dd: ['PAN and ID of directors', 'निदेशकों का पैन और पहचान पत्र'],
  ro: ['Registered office address proof', 'पंजीकृत कार्यालय के पते का प्रमाण'],
  pt: ['PAN and ID of partners', 'साझेदारों का पैन और पहचान पत्र'],
  ps: ['Profit-sharing terms', 'लाभ बंटवारे की शर्तें'],
  un: ['Udyam registration number', 'उद्यम पंजीकरण संख्या'],
  po: ['Policy number', 'पॉलिसी नंबर'],
  la: ['Loan account number', 'ऋण खाता संख्या'],
  ho: ['Holding number and ward', 'होल्डिंग नंबर और वार्ड'],
  iv: ['Sale invoice and Form 21', 'बिक्री इनवॉइस और फॉर्म 21'],
  f3: ['Form 35 from financier', 'फाइनेंसर से फॉर्म 35'],
  st: ['Sale price and payment terms', 'बिक्री मूल्य और भुगतान शर्तें'],
  ast: ['Details of assets and heirs', 'संपत्ति और वारिसों का विवरण'],
  sm: ['Purpose and amount of stamp paper', 'स्टाम्प पेपर का उद्देश्य और राशि'],
  cd: ['Bills and complaint details', 'बिल और शिकायत विवरण'],
  ua: ['UAN and registered mobile', 'यूएएन और पंजीकृत मोबाइल'],
  pg: ['Passenger names, ages and travel date', 'यात्रियों के नाम, उम्र और यात्रा की तारीख'],
};

export const CATEGORIES: Record<string, [string, string]> = {
  l: ['Land & Anchal', 'भूमि और अंचल'],
  g: ['Registry & Legal', 'रजिस्ट्री और कानूनी'],
  c: ['JharSewa Certificates', 'प्रमाण पत्र'],
  i: ['Identity & Welfare', 'पहचान और कल्याण'],
  t: ['DTO & Transport', 'परिवहन (DTO)'],
  b: ['Business & GST', 'व्यापार और जीएसटी'],
  e: ['Education & Scholarships', 'शिक्षा और छात्रवृत्ति'],
  j: ['Jobs & Recruitment', 'रोजगार'],
  u: ['Utilities & Municipal', 'उपयोगिता और नगर निगम'],
  x: ['Income Tax & Finance', 'कर और वित्त'],
  k: ['Banking & Schemes', 'बैंकिंग और योजनाएं'],
  m: ['Digital & Print', 'डिजिटल और विविध'],
};

export type ServiceTuple = [string, string, string, string, string];

export const SERVICES_CATALOG: ServiceTuple[] = [
  ['land-mutation', 'l', 'Land mutation (Dakhil-Kharij)', 'भूमि दाखिल-खारिज (म्यूटेशन)', 'sl ol af id'],
  ['land-rent-receipt', 'l', 'Online land rent receipt (Bhu-Lagan Rasid)', 'ऑनलाइन भू-लगान रसीद', 'dh pl ry'],
  ['lpc-certificate', 'l', 'Land Possession Certificate (LPC)', 'भूमि स्वामित्व प्रमाण पत्र (LPC)', 'sl ol dh pl id'],
  ['jamabandi-copy', 'l', 'Jamabandi / Register-II copy', 'जमाबंदी / रजिस्टर-II की प्रति', 'dh pl ry'],
  ['khatiyan-extract', 'l', 'Certified Khatiyan extraction', 'प्रमाणित खतियान नकल', 'dh pl ry'],
  ['land-map', 'l', 'Land map (Nazri Naksha / Revenue Map)', 'भूमि का नक्शा (नजरी नक्शा)', 'dh pl'],
  ['land-partition', 'l', 'Land partition (Batwara) application', 'भूमि बंटवारा आवेदन', 'pl ft ma af'],
  ['mvr-check', 'l', 'Minimum Value Register (MVR) valuation check', 'न्यूनतम मूल्य रजिस्टर (MVR) जांच', 'dh pl'],
  ['registry-search', 'l', 'Non-Encumbrance (EC) & Registry deed search', 'पंजीकृत डीड (रजिस्ट्री) एवं EC खोज', 'dh pl'],
  ['land-record-correction', 'l', 'Parimarjan / Land record correction', 'परिमार्जन / भूमि रिकॉर्ड सुधार', 'dh pl ry af'],
  ['sale-deed-drafting', 'g', 'Sale deed drafting & registry support', 'सेल डीड ड्राफ्टिंग और रजिस्ट्री सहायता', 'id ad st sl'],
  ['sale-agreement', 'g', 'Sale agreement (Bainama) drafting', 'बिक्री अनुबंध ड्राफ्टिंग', 'id ad st'],
  ['rent-agreement', 'g', 'Rent agreement & lease drafting', 'किराया अनुबंध और लीज ड्राफ्टिंग', 'id ad rt'],
  ['affidavit-drafting', 'g', 'Court & Executive Magistrate affidavit drafting', 'शपथ पत्र ड्राफ्टिंग', 'ap id'],
  ['power-of-attorney', 'g', 'Power of attorney (GPA / SPA) drafting', 'मुख्तारनामा (पावर ऑफ अटॉर्नी) ड्राफ्टिंग', 'id ad pw'],
  ['will-drafting', 'g', 'Will (Wasiyat) drafting support', 'वसीयत ड्राफ्टिंग सहायता', 'ast id'],
  ['e-stamp', 'g', 'e-Stamp paper issuance', 'ई-स्टाम्प पेपर', 'id sm'],
  ['notary-attestation', 'g', 'Notary attestation assistance', 'नोटरी सत्यापन सहायता', 'og id'],
  ['name-change-gazette', 'g', 'Name change affidavit & gazette filing', 'नाम परिवर्तन और गजट सहायता', 'na nw id'],
  ['rti-application', 'g', 'RTI application drafting & filing', 'आरटीआई (सूचना का अधिकार) आवेदन', 'rq id'],
  ['police-verification', 'g', 'Police character verification certificate', 'पुलिस सत्यापन प्रमाण पत्र', 'id rp ph'],
  ['consumer-complaint', 'g', 'Consumer forum complaint drafting', 'उपभोक्ता शिकायत ड्राफ्टिंग', 'cd id'],
  ['income-certificate', 'c', 'JharSewa Income certificate', 'आय प्रमाण पत्र (झारसेवा)', 'id sd rb ia'],
  ['caste-certificate', 'c', 'JharSewa Caste certificate', 'जाति प्रमाण पत्र (झारसेवा)', 'id rp fc af'],
  ['residential-certificate', 'c', 'JharSewa Local Residential certificate', 'आवासीय प्रमाण पत्र (झारसेवा)', 'id lt eb ph'],
  ['obc-certificate', 'c', 'OBC / Non-Creamy Layer certificate', 'ओबीसी / नॉन-क्रीमी लेयर प्रमाण पत्र', 'id rp fc ic'],
  ['ews-certificate', 'c', 'EWS (Economically Weaker Section) certificate', 'ईडब्ल्यूएस (EWS) प्रमाण पत्र', 'id ic rp sd'],
  ['birth-certificate', 'c', 'Birth certificate registration', 'जन्म प्रमाण पत्र', 'hb pa'],
  ['death-certificate', 'c', 'Death certificate registration', 'मृत्यु प्रमाण पत्र', 'dr da'],
  ['marriage-registration', 'c', 'Marriage registration certificate', 'विवाह पंजीकरण', 'mp cp id'],
  ['character-certificate', 'c', 'Character certificate (Aacharan)', 'चरित्र प्रमाण पत्र', 'id rp ph'],
  ['birth-death-correction', 'c', 'Birth or death certificate correction', 'जन्म या मृत्यु प्रमाण पत्र सुधार', 'ec id sp'],
  ['legal-heir-certificate', 'c', 'Legal heir / Vanshavali certificate', 'वारिस (उत्तराधिकारी) प्रमाण पत्र', 'da ft af id'],
  ['maiya-samman', 'i', 'Mukhyamantri Maiya Samman Yojana application', 'मुख्यमंत्री मंईयां सम्मान योजना आवेदन', 'id rb bp ml'],
  ['pan-card', 'i', 'PAN card (New or Correction — NSDL/UTIITSL)', 'पैन कार्ड (नया या सुधार)', 'id ph ml'],
  ['ration-card', 'i', 'Jharkhand Ration card (New / Member Add / Delete)', 'राशन कार्ड सेवाएं', 'fh ma bp ic'],
  ['ration-ekyc', 'i', 'Ration card e-KYC & dealer transfer', 'राशन कार्ड ई-केवाईसी', 'id rm'],
  ['ayushman-golden-card', 'i', 'Ayushman Bharat Golden Health Card', 'आयुष्मान भारत गोल्डन कार्ड', 'id rm'],
  ['state-pension', 'i', 'Old-age, widow & disability pension', 'वृद्धा, विधवा और दिव्यांग पेंशन', 'id bp ag ph'],
  ['voter-id', 'i', 'Voter ID (EPIC New / Correction / Shift)', 'वोटर आईडी (नया या सुधार)', 'id rp ph ag'],
  ['shramik-card', 'i', 'Jharkhand Shramik (Labour) card', 'श्रमिक (मजदूर) कार्ड', 'id bp em'],
  ['udid-card', 'i', 'UDID card (Divyang ID)', 'यूडीआईडी कार्ड (दिव्यांग पहचान)', 'di id ph'],
  ['e-shram-card', 'i', 'e-Shram card registration', 'ई-श्रम कार्ड पंजीकरण', 'id ml bp'],
  ['abha-health-id', 'i', 'ABHA health ID card', 'आभा स्वास्थ्य आईडी', 'id ml'],
  ['jeevan-pramaan', 'i', 'Jeevan Pramaan (Pensioner life certificate)', 'जीवन प्रमाण (पेंशनर जीवन प्रमाण पत्र)', 'id ml pp'],
  ['pm-kisan', 'i', 'PM-Kisan Samman Nidhi registration & KYC', 'पीएम-किसान पंजीकरण और केवाईसी', 'id bp ml pl'],
  ['pm-sym-pension', 'i', 'PM-SYM Shram Yogi Maandhan pension', 'पीएम-एसवाईएम श्रम योगी मानधन पेंशन', 'id bp'],
  ['senior-citizen-card', 'i', 'Senior citizen ID card', 'वरिष्ठ नागरिक कार्ड', 'id ag ph'],
  ['ujjwala-gas', 'i', 'PM Ujjwala LPG gas connection', 'पीएम उज्ज्वला गैस कनेक्शन', 'id rb bp ph'],
  ['pm-awas', 'i', 'PM Awas Yojana housing application', 'पीएम आवास योजना आवेदन', 'id bp ic pl'],
  ['learner-licence', 't', 'DTO Learner’s driving licence', 'लर्नर ड्राइविंग लाइसेंस', 'id ph rp ag'],
  ['driving-licence-new', 't', 'DTO Permanent driving licence', 'स्थायी ड्राइविंग लाइसेंस', 'll id ph rp'],
  ['dl-renewal', 't', 'Driving licence renewal or duplicate', 'ड्राइविंग लाइसेंस नवीनीकरण या डुप्लीकेट', 'od id md'],
  ['rc-transfer', 't', 'Vehicle ownership transfer (RC Transfer)', 'वाहन स्वामित्व हस्तांतरण (RC ट्रांसफर)', 'f2 bs orc'],
  ['vehicle-noc', 't', 'DTO NOC for inter-state vehicle transfer', 'वाहन ट्रांसफर के लिए एनओसी', 'vr ins nd'],
  ['vehicle-fitness-permit', 't', 'Commercial vehicle fitness & permit renewal', 'वाहन फिटनेस और परमिट नवीनीकरण', 'vr ins pu'],
  ['new-vehicle-registration', 't', 'New vehicle registration assistance', 'नए वाहन का पंजीकरण', 'iv ins id'],
  ['duplicate-rc', 't', 'Duplicate RC application', 'डुप्लीकेट आरसी', 'id af ins'],
  ['address-change-dl-rc', 't', 'Address change in DL or RC', 'डीएल या आरसी में पता बदलना', 'id rp od vr'],
  ['hypothecation-removal', 't', 'HP / Hypothecation removal from RC', 'आरसी से हाइपोथिकेशन हटवाना', 'nd vr f3'],
  ['challan-payment', 't', 'Parivahan e-Challan online payment', 'ई-चालान भुगतान', 'ch'],
  ['hsrp-plate', 't', 'HSRP high-security number plate booking', 'एचएसआरपी नंबर प्लेट बुकिंग', 'vr'],
  ['gst-registration', 'b', 'New GST registration', 'नया जीएसटी पंजीकरण', 'pn bf eb bp'],
  ['gst-return', 'b', 'Monthly / Quarterly GST return filing', 'जीएसटी रिटर्न फाइलिंग', 'gn sr'],
  ['udyam-registration', 'b', 'MSME / Udyam registration', 'एमएसएमई / उद्यम पंजीकरण', 'id pn ba ac'],
  ['udyam-update', 'b', 'Udyam certificate update or reprint', 'उद्यम प्रमाण पत्र अपडेट या प्रिंट', 'un ml'],
  ['fssai-licence', 'b', 'FSSAI food safety licence', 'एफएसएसएआई खाद्य लाइसेंस', 'id pn ph ba bf'],
  ['trade-licence', 'b', 'Ranchi Municipal Trade licence', 'रांची नगर निगम ट्रेड लाइसेंस', 'id pn bf ba'],
  ['shop-establishment', 'b', 'Jharkhand Shop & Establishment registration', 'दुकान एवं प्रतिष्ठान पंजीकरण', 'id pn bf ba'],
  ['company-llp', 'b', 'Private Limited Company or LLP incorporation', 'प्राइवेट लिमिटेड कंपनी या एलएलपी पंजीकरण', 'dd ro ph'],
  ['partnership-deed', 'b', 'Partnership deed drafting & registration', 'साझेदारी विलेख (पार्टनरशिप डीड) ड्राफ्टिंग', 'pt ps ad'],
  ['mudra-loan', 'b', 'PM Mudra business loan application', 'मुद्रा ऋण आवेदन', 'id pn ba ac bp'],
  ['iec-registration', 'b', 'Import-Export Code (IEC) registration', 'आयात-निर्यात कोड (आईईसी)', 'pn id ba bp'],
  ['ekalyan-scholarship', 'e', 'e-Kalyan Jharkhand scholarship portal', 'ई-कल्याण छात्रवृत्ति (झारखंड)', 'ic cc rc bp fe bn'],
  ['nsp-scholarship', 'e', 'National Scholarship Portal (NSP)', 'नेशनल स्कॉलरशिप पोर्टल (एनएसपी)', 'ic cc rc bp fe bn'],
  ['admission-form', 'e', 'Ranchi University / College online admission', 'कॉलेज या विश्वविद्यालय ऑनलाइन नामांकन', 'ed id ph sg'],
  ['exam-form', 'e', 'JSSC / JPSC / SSC / Railway exam online form', 'प्रतियोगी परीक्षा ऑनलाइन फॉर्म', 'ed id ph sg'],
  ['rte-admission', 'e', 'RTE private school admission form', 'आरटीई स्कूल प्रवेश फॉर्म', 'cb id ic rp'],
  ['pmkvy-training', 'e', 'Skill training (PMKVY) registration', 'कौशल प्रशिक्षण (पीएमकेवीवाई) पंजीकरण', 'id ed ph bp'],
  ['admit-card-print', 'e', 'Admit card, result or marksheet printing', 'एडमिट कार्ड, रिजल्ट या प्रमाण पत्र प्रिंट', 'rn'],
  ['pmgdisha', 'e', 'PMGDISHA digital literacy registration', 'पीएमजीदिशा डिजिटल साक्षरता पंजीकरण', 'id ml ph'],
  ['govt-job-form', 'j', 'Government job online application', 'सरकारी नौकरी ऑनलाइन आवेदन', 'ed id ph sg cc rc'],
  ['employment-exchange', 'j', 'Jharkhand Rojgar Mela / Employment exchange', 'रोजगार कार्यालय पंजीकरण', 'id ed rc ph'],
  ['resume-cv', 'j', 'Professional Resume / Biodata drafting', 'रिज्यूमे / सीवी तैयार करना', 'ed wd ph'],
  ['pm-vishwakarma', 'j', 'PM Vishwakarma artisan registration', 'पीएम विश्वकर्मा पंजीकरण', 'id ml bp'],
  ['apprenticeship', 'j', 'NAPS Apprenticeship portal registration', 'अप्रेंटिसशिप पंजीकरण', 'ed id ph bp'],
  ['defence-recruitment', 'j', 'Agniveer / Police / Defence recruitment form', 'अग्निवीर या रक्षा भर्ती फॉर्म', 'ed id ph sg cc rc'],
  ['water-bill', 'u', 'Ranchi Water bill payment & new connection', 'वाटर बिल भुगतान एवं नया कनेक्शन', 'cn ob rp'],
  ['holding-tax', 'u', 'Ranchi Municipal Holding (Property) tax', 'होल्डिंग (नगर निगम) कर भुगतान', 'ho'],
  ['electricity-bill', 'u', 'JBVNL Electricity bill payment', 'बिजली बिल भुगतान (JBVNL)', 'cn ob'],
  ['new-electricity-connection', 'u', 'New JBVNL electricity connection', 'नया बिजली कनेक्शन (JBVNL)', 'id lt ph'],
  ['electricity-name-change', 'u', 'Electricity connection name / load change', 'बिजली कनेक्शन नाम परिवर्तन', 'id cn lt'],
  ['lpg-kyc', 'u', 'LPG gas booking & e-KYC', 'एलपीजी बुकिंग और केवाईसी', 'id lp bp'],
  ['fastag', 'u', 'FASTag issuance, recharge & KYC', 'फास्टैग रिचार्ज या केवाईसी', 'vr id'],
  ['mobile-dth-recharge', 'u', 'Mobile & DTH bill payment', 'मोबाइल और डीटीएच रिचार्ज', 'sn'],
  ['itr-filing', 'x', 'Income Tax Return (ITR-1 to ITR-4) filing', 'आईटीआर (आयकर रिटर्न) फाइलिंग', 'pn f6 id'],
  ['project-report', 'x', 'CA-ready Project Report / CMA for bank loans', 'बैंक ऋण के लिए प्रोजेक्ट रिपोर्ट', 'bd ky'],
  ['tan-registration', 'x', 'TAN registration for TDS', 'टैन पंजीकरण', 'pn id ba'],
  ['tax-statement', 'x', 'Form 26AS / AIS tax statement download', 'कर विवरण (फॉर्म 26AS / एआईएस) डाउनलोड', 'pn ml'],
  ['pan-link-check', 'x', 'PAN active status & KYC verification', 'पैन केवाईसी सत्यापन', 'pn ml'],
  ['bank-account-opening', 'k', 'Zero-balance / Jan Dhan account support', 'बैंक / जन धन खाता खोलने में सहायता', 'id ph'],
  ['aeps-withdrawal', 'k', 'Micro-ATM / AEPS balance & transfer', 'माइक्रो-एटीएम बैलेंस और ट्रांसफर', 'id'],
  ['money-transfer', 'k', 'Instant domestic money transfer (DMT)', 'मनी ट्रांसफर', 'id rx'],
  ['suraksha-jeevan-bima', 'k', 'PM Suraksha Bima & Jeevan Jyoti Bima', 'पीएम सुरक्षा बीमा / जीवन ज्योति बीमा', 'id bp nm'],
  ['atal-pension', 'k', 'Atal Pension Yojana (APY) enrollment', 'अटल पेंशन योजना', 'id bp ml nm'],
  ['kisan-credit-card', 'k', 'Kisan Credit Card (KCC) loan form', 'किसान क्रेडिट कार्ड आवेदन', 'id bp pl ph'],
  ['sukanya-samriddhi', 'k', 'Sukanya Samriddhi Yojana account form', 'सुकन्या समृद्धि खाता', 'cb id ph'],
  ['post-office-account', 'k', 'Post Office RD / PPF / MIS savings form', 'डाकघर खाता (आरडी, पीपीएफ)', 'id pn ph nm'],
  ['mutual-fund-kyc', 'k', 'CKYC / Mutual Fund KYC update', 'म्यूचुअल फंड केवाईसी', 'id pn bp ph'],
  ['credit-report', 'k', 'CIBIL / Credit score report check', 'क्रेडिट स्कोर रिपोर्ट', 'pn id ml'],
  ['passport-support', 'm', 'Passport Seva online application & slot', 'पासपोर्ट आवेदन सहायता', 'id dp rp'],
  ['digital-signature', 'm', 'Class-3 Digital Signature Certificate (DSC)', 'डिजिटल सिग्नेचर सर्टिफिकेट (डीएससी)', 'id pn ph ml'],
  ['railway-ticket', 'm', 'IRCTC Railway & flight ticket booking', 'रेलवे टिकट बुकिंग (आईआरसीटीसी)', 'pg id'],
  ['epf-uan', 'm', 'EPF UAN activation, KYC & PF withdrawal', 'ईपीएफ यूएएन सक्रियण और दावा सहायता', 'ua bp'],
  ['digilocker', 'm', 'DigiLocker setup & certificate fetch', 'डिजीलॉकर सेटअप', 'id ml'],
  ['website-seo-design', 'm', 'Responsive Website Design & Local SEO Portfolio', 'वेबसाइट डिज़ाइन एवं डिजिटल मार्केटिंग', 'bd ky'],
  ['print-scan-copy', 'm', 'High-DPI scanning, spiral binding & lamination', 'प्रिंट, स्कैन और लैमिनेशन', 'pf'],
];

export const DRAFT_TEMPLATES: Record<string, string> = {
  mutation_affidavit: `BEFORE THE CIRCLE OFFICER, RANCHI (JHARKHAND)
AFFIDAVIT FOR LAND MUTATION (DAKHIL-KHARIJ)

I, [Applicant Name], S/o [Father's Name], Resident of [Address], Ranchi, do hereby solemnly affirm and state as follows:
1. That I have purchased land measuring [Area] Dismil under Khata No. [XX], Plot No. [XXX], Mauza [Mauza Name], Thana No. [XX] via Registered Sale Deed No. [XXXX] dated [DD/MM/YYYY].
2. That the vendor had valid peaceful possession and up-to-date Lagan Rasid.
3. That the mutation of the said land in my name in Register-II is genuine and free from dispute.

Deponent Signature`,
  rent_agreement: `RESIDENTIAL / COMMERCIAL RENT AGREEMENT (RANCHI)

This Rent Agreement is executed at Ranchi on this [Date] between [Landlord Name] (LESSOR) and [Tenant Name] (LESSEE) for premises situated at [Property Address, Ranchi].
1. Monthly Rent: ₹[Amount]/- payable on or before the 5th of every English calendar month.
2. Security Deposit: ₹[Deposit]/- refundable at the time of peaceful handover.
3. Tenure: 11 Months commencing from [Start Date].

Lessor Signature & Lessee Signature`,
  name_correction: `AFFIDAVIT FOR NAME / SPELLING CORRECTION

I, [Correct Name], S/o [Father's Name], R/o [Address, Ranchi], solemnly declare that in my [Document Name] my name has been inadvertently recorded as "[Incorrect Name]" instead of my true name "[Correct Name]". Both names refer to one and the same person.

Deponent Signature`,
  poa_draft: `GENERAL POWER OF ATTORNEY (GPA) OUTLINE

KNOW ALL MEN BY THESE PRESENTS that I, [Executant Name], R/o [Ranchi Address], do hereby nominate and appoint [Attorney Name] as my true and lawful attorney to manage, appear before Anchal / Registry / Municipal offices in Ranchi, sign applications, and submit documents on my behalf.`,
};

export const REVIEWS_DATA = [
  { text: 'Very co oprative staff', author: 'Adv Akash Tirkey', context: 'Ranchi Civil Court · Verified Google Review' },
  { text: 'I applied my maiya yojna and got good service', author: 'Suchita Kumari', context: 'Welfare Desk · Verified Google Review' },
  { text: 'Fast documentation and helpful guidance at Radium Road counter.', author: 'Ranjeet Chandra', context: 'Kutchery Chowk · Verified Google Review' },
  { text: 'Nice service for certificates and online portal work.', author: 'Rahul Kumar', context: 'JharSewa Desk · Verified Google Review' },
  { text: 'Prompt and reliable support for land and JharSewa documentation.', author: 'Arjun Oraon', context: 'Anchal Desk · Verified Google Review' },
];
