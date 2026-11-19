import { useState } from 'react';
import { jsPDF } from 'jspdf';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  Mail,
  MapPin,
  Navigation,
  Phone,
  Share2,
} from 'lucide-react';
import { REVIEWS_DATA } from '../data/catalog.ts';
import {
  buildUpiUri,
  generateQrDataUrl,
  GOOGLE_MAPS_URL,
  GOOGLE_REVIEW_URL,
  MERCHANT_UPI_ID,
} from '../utils/qr.ts';
import { QRCodeBox } from './QRCodeBox.tsx';

interface LocationAndFaqSectionProps {
  lang: 'en' | 'hi';
}

const CAPABILITIES = [
  {
    en: 'Registry & Mutation Expertise',
    hi: 'रजिस्ट्री एवं दाखिल-खारिज विशेषज्ञता',
    descEn: 'Khatiyan, Lagan Rasid, LPC, and Dakhil-Kharij preparation near Sadar Anchal.',
    descHi: 'सदर अंचल के पास खतियान, लगान रसीद, एलपीसी और दाखिल-खारिज तैयारी।',
  },
  {
    en: 'Court Documentation Support',
    hi: 'कोर्ट एवं कानूनी दस्तावेज़ सहायता',
    descEn: 'Sale deeds, affidavits, GPA/SPA, wills, and e-Stamp execution at Kutchery.',
    descHi: 'कचहरी में सेल डीड, शपथ पत्र, मुख्तारनामा, वसीयत एवं ई-स्टाम्प।',
  },
  {
    en: 'JharSewa & Welfare Portals',
    hi: 'झारसेवा एवं कल्याणकारी पोर्टल',
    descEn: 'Income, caste, residential, OBC/EWS, Maiya Samman, and scholarship filings.',
    descHi: 'आय, जाति, आवासीय, ओबीसी/ईडब्ल्यूएस, मंईयां सम्मान व छात्रवृत्ति आवेदन।',
  },
  {
    en: 'Business & Tax Compliance',
    hi: 'व्यापार एवं कर पंजीकरण सहायता',
    descEn: 'GST setup, Udyam MSME, FSSAI food licence, Ranchi Trade Licence, and ITR.',
    descHi: 'जीएसटी, उद्यम एमएसएमई, एफएसएसएआई, ट्रेड लाइसेंस और आईटीआर फाइलिंग।',
  },
  {
    en: 'Trusted Local Office in Ranchi',
    hi: 'रांची में विश्वसनीय स्थानीय कार्यालय',
    descEn: '4.2 ★ rating across 95 Google reviews right beside Kolkatta Pharma, Radium Road.',
    descHi: 'रेडियम रोड पर कोलकाता फार्मा के बगल में 95 गूगल रिव्यू के साथ 4.2 ★ रेटिंग।',
  },
  {
    en: 'Direct WhatsApp & PDF Desk',
    hi: 'सीधा व्हाट्सएप एवं मल्टी-PDF डेस्क',
    descEn: 'Upload required PDFs per document online and track live 5-stage progress.',
    descHi: 'ऑनलाइन प्रत्येक दस्तावेज़ की PDF अपलोड करें और लाइव 5-चरण प्रगति देखें।',
  },
];

export function LocationAndFaqSection({ lang }: LocationAndFaqSectionProps) {
  const [reviewIdx, setReviewIdx] = useState(0);
  const [distanceMsg, setDistanceMsg] = useState(
    lang === 'hi'
      ? 'अपनी GPS लोकेशन से रेडियम रोड की दूरी जानें'
      : 'Calculate live driving distance from your GPS to Radium Road'
  );

  const currentReview = REVIEWS_DATA[reviewIdx];

  const handleCheckDistance = () => {
    if (!navigator.geolocation) {
      setDistanceMsg('Located at Kutchery Chowk, Ranchi (23.3792833, 85.3247589).');
      return;
    }
    setDistanceMsg(lang === 'hi' ? 'आपकी GPS लोकेशन जांची जा रही है...' : 'Checking your GPS location...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat1 = pos.coords.latitude;
        const lon1 = pos.coords.longitude;
        const lat2 = 23.3792833;
        const lon2 = 85.3247589;
        const R = 6371;
        const dLat = ((lat2 - lat1) * Math.PI) / 180;
        const dLon = ((lon2 - lon1) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) ** 2 +
          Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) ** 2;
        const dist = (R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1);
        const mins = Math.max(3, Math.round((parseFloat(dist) / 22) * 60));
        setDistanceMsg(
          lang === 'hi'
            ? `कचहरी चौक, प्रज्ञा केंद्र से लगभग ${dist} किमी (~${mins} मिनट)`
            : `Approx. ${dist} km (~${mins} mins) from Pragya Kendra, Kutchery Chowk.`
        );
      },
      () => {
        setDistanceMsg(
          lang === 'hi'
            ? 'दिशा-निर्देश के लिए नीचे Google Maps खोलें।'
            : 'Open Google Maps below for turn-by-turn directions.'
        );
      },
      { timeout: 7000 }
    );
  };

  const handleDownloadDeskStandeePdf = async () => {
    try {
      const [reviewQr, mapsQr, upiQr] = await Promise.all([
        generateQrDataUrl(GOOGLE_REVIEW_URL, 220),
        generateQrDataUrl(GOOGLE_MAPS_URL, 220),
        generateQrDataUrl(buildUpiUri(undefined, 'Pragya Kendra Counter'), 220),
      ]);
      const doc = new jsPDF();
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, 210, 40, 'F');
      doc.setTextColor(251, 191, 36);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('PRAGYA KENDRA — RANCHI DESK STANDEE', 14, 18);
      doc.setTextColor(226, 232, 240);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Beside Kolkatta Pharma, Radium Road, Kutchery Chowk, Ranchi - 834001 | +91 90652 33139', 14, 29);

      // 3-Column QR Standee Row
      const cols = [
        { x: 16, img: reviewQr, title: '5-Star Google Review', sub: 'Rate Our Counter Service' },
        { x: 80, img: mapsQr, title: 'Google Maps Directions', sub: 'Radium Road, Kutchery Chowk' },
        { x: 144, img: upiQr, title: 'Official UPI Payment', sub: MERCHANT_UPI_ID },
      ];
      cols.forEach((c) => {
        doc.setDrawColor(203, 213, 225);
        doc.roundedRect(c.x - 4, 54, 58, 86, 3, 3);
        doc.addImage(c.img, 'PNG', c.x + 2, 62, 46, 46);
        doc.setTextColor(15, 23, 42);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(c.title, c.x + 25, 118, { align: 'center' });
        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(71, 85, 105);
        doc.text(c.sub, c.x + 25, 126, { align: 'center' });
      });

      doc.setTextColor(15, 23, 42);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Scan with Phone Camera / Any UPI App', 105, 162, { align: 'center' });
      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(
        'Revenue Land Mutation · Registry e-Stamp · JharSewa Certificates · Legal Drafting · PAN / DTO / Web Services',
        105,
        172,
        { align: 'center' }
      );
      doc.text(
        'Open Mon - Sat | 09:30 AM - 09:00 PM | Helpline: +91 90652 33139 / +91 86038 58578',
        105,
        180,
        { align: 'center' }
      );

      doc.save('Pragya_Kendra_Ranchi_Desk_Standee_QR.pdf');
    } catch {
      // ignore fallback errors
    }
  };

  return (
    <section
      id="faq"
      className="py-16 sm:py-20 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
        {/* Why Choose Pragya Kendra */}
        <div className="space-y-6">
          <div className="max-w-2xl space-y-2">
            <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">
              {lang === 'hi' ? 'प्रज्ञा केंद्र क्यों चुनें' : 'Why Choose Pragya Kendra'}
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white">
              {lang === 'hi'
                ? 'कचहरी चौक, रांची के पास अनुभवी स्थानीय सहायता'
                : 'Experienced Local Documentation Support Near Kutchery Chowk'}
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {CAPABILITIES.map((cap) => (
              <div
                key={cap.en}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-1.5"
              >
                <div className="flex items-center gap-2 font-display font-bold text-sm text-slate-950 dark:text-white">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{lang === 'hi' ? cap.hi : cap.en}</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {lang === 'hi' ? cap.descHi : cap.descEn}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Location & Map Split */}
        <div className="grid lg:grid-cols-12 gap-8 items-stretch">
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-7 flex flex-col justify-between gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-amber-700 dark:text-amber-400">
                  {lang === 'hi' ? 'सत्यापित स्थानीय कार्यालय' : 'Verified Local Office'}
                </span>
                <span className="font-mono font-semibold text-slate-600 dark:text-slate-400 tabular-nums">
                  4.2 ★ (95 Reviews)
                </span>
              </div>
              <h2 className="font-display text-2xl font-extrabold text-slate-950 dark:text-white">
                {lang === 'hi'
                  ? 'कोलकाता फार्मा के बगल में, रेडियम रोड, रांची'
                  : 'Beside Kolkatta Pharma, Radium Road, Ranchi'}
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {lang === 'hi'
                  ? 'रांची सिविल कोर्ट, जिला निबंधन कार्यालय (रजिस्ट्री ऑफिस) एवं सदर अंचल कार्यालय से कुछ ही कदम की दूरी पर।'
                  : 'Steps from Ranchi Civil Court, District Registry Office, and Sadar Anchal Office at Kutchery Chowk.'}
              </p>

              <div className="space-y-2.5 text-sm text-slate-700 dark:text-slate-300">
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                  <span>Beside Kolkatta Pharma, Radium Road, Kutchery Chowk, Ranchi - 834001</span>
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <Phone className="w-4 h-4 text-amber-600 shrink-0" />
                  <a href="tel:+919065233139" className="font-semibold hover:underline">
                    +91 90652 33139
                  </a>
                  <span className="text-slate-400">·</span>
                  <a href="tel:+918603858578" className="font-semibold hover:underline">
                    +91 86038 58578
                  </a>
                </div>
                <div className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-amber-600 shrink-0" />
                  <a href="mailto:kniraj963@gmail.com" className="font-semibold hover:underline">
                    kniraj963@gmail.com
                  </a>
                </div>
              </div>

              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between gap-2 text-xs">
                <span className="text-slate-600 dark:text-slate-300">{distanceMsg}</span>
                <button
                  type="button"
                  onClick={handleCheckDistance}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 font-semibold shrink-0 cursor-pointer"
                >
                  <Navigation className="w-3 h-3" />
                  <span>{lang === 'hi' ? 'जांचें' : 'Check'}</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <a
                href="https://maps.google.com/maps?cid=15313947144831856160"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 text-xs font-semibold text-center rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:text-slate-950 text-white transition-colors"
              >
                {lang === 'hi' ? 'गूगल मैप्स खोलें' : 'Open Google Maps'}
              </a>
              <a
                href="https://g.page/r/CSBuz5zKEYbUEBE/review"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 text-xs font-semibold text-center rounded-xl border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                {lang === 'hi' ? 'गूगल रिव्यू लिखें' : 'Write Google Review'}
              </a>
            </div>
          </div>

          <div className="lg:col-span-7 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 min-h-[340px] bg-slate-200 dark:bg-slate-900">
            <iframe
              title="Pragya Kendra — Radium Road, Kutchery Chowk, Ranchi"
              src="https://maps.google.com/maps?q=23.3792833,85.3247589+(Pragya+Kendra)&z=17&output=embed"
              className="w-full h-full min-h-[340px] border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>

        {/* Verified Reviews + FAQ */}
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-5 bg-slate-900 text-white rounded-2xl p-6 sm:p-7 space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-400">4.2 ★ · 95 Google Reviews</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    setReviewIdx((prev) => (prev - 1 + REVIEWS_DATA.length) % REVIEWS_DATA.length)
                  }
                  aria-label="Previous review"
                  className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setReviewIdx((prev) => (prev + 1) % REVIEWS_DATA.length)}
                  aria-label="Next review"
                  className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-3">
              <p className="text-amber-400 text-xs font-mono">5 / 5 Verified</p>
              <blockquote className="text-sm sm:text-base text-slate-200 italic leading-relaxed">
                "{currentReview.text}"
              </blockquote>
              <div className="pt-3 border-t border-slate-800 text-xs">
                <p className="font-bold text-white">{currentReview.author}</p>
                <p className="text-slate-400">{currentReview.context}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <a
                href="https://g.page/r/CSBuz5zKEYbUEBE/review"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold text-center transition-colors"
              >
                {lang === 'hi' ? 'रिव्यू पोस्ट करें' : 'Post Google Review'}
              </a>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(
                  'Rate your experience at Pragya Kendra Ranchi (Kutchery Chowk): https://g.page/r/CSBuz5zKEYbUEBE/review'
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold transition-colors"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>{lang === 'hi' ? 'लिंक शेयर करें' : 'Share Review Link'}</span>
              </a>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-amber-400">
                  {lang === 'hi' ? 'काउंटर स्कैन QR स्टैंडी' : 'Counter Desk Scan QRs'}
                </span>
                <button
                  type="button"
                  onClick={handleDownloadDeskStandeePdf}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-200 hover:text-amber-300 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>A4 Standee PDF</span>
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3 justify-items-center pt-1">
                <QRCodeBox
                  value={GOOGLE_REVIEW_URL}
                  size={86}
                  label={lang === 'hi' ? '5★ गूगल रिव्यू' : '5★ Google Review'}
                  downloadName="Pragya-Kendra-Review-QR.png"
                />
                <QRCodeBox
                  value={GOOGLE_MAPS_URL}
                  size={86}
                  label={lang === 'hi' ? 'गूगल मैप्स' : 'Google Maps'}
                  downloadName="Pragya-Kendra-Maps-QR.png"
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-7 space-y-4">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                {lang === 'hi' ? 'अक्सर पूछे जाने वाले सवाल' : 'Ranchi Documentation Knowledge Base'}
              </p>
              <h3 className="font-display text-xl sm:text-2xl font-extrabold text-slate-950 dark:text-white">
                {lang === 'hi' ? 'सामान्य प्रश्न (FAQ)' : 'Frequently Asked Questions'}
              </h3>
            </div>

            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              <details className="py-3" open>
                <summary className="font-semibold text-sm sm:text-base text-slate-900 dark:text-white cursor-pointer">
                  {lang === 'hi'
                    ? '1. रांची में भूमि दाखिल-खारिज (Mutation) के लिए कौन से दस्तावेज़ चाहिए?'
                    : '1. What documents are required for Land Mutation (Dakhil-Kharij) in Ranchi?'}
                </summary>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {lang === 'hi'
                    ? 'पंजीकृत सेल या गिफ्ट डीड की प्रति, विक्रेता की पिछली लगान रसीद, खतियान या रजिस्टर-II नकल, म्यूटेशन शपथ पत्र एवं खरीदार का पहचान पत्र। आप प्रत्येक दस्तावेज़ की कई PDF फाइलें ऊपर सीधे अपलोड कर सकते हैं।'
                    : "Registered Sale or Gift Deed copy, Seller's previous Lagan Rasid, Khatiyan or Register-II extract, Mutation Affidavit, and Buyer Identity Proof. You can attach multiple PDFs directly beside each requirement above."}
                </p>
              </details>

              <details className="py-3">
                <summary className="font-semibold text-sm sm:text-base text-slate-900 dark:text-white cursor-pointer">
                  {lang === 'hi'
                    ? '2. झारसेवा जाति, आय और आवासीय प्रमाण पत्र बनने में कितना समय लगता है?'
                    : '2. How long do JharSewa Caste, Income, and Residential Certificates take?'}
                </summary>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {lang === 'hi'
                    ? 'अंचल अधिकारी (CO) स्तर के प्रमाण पत्र आमतौर पर राजस्व कर्मचारी एवं सीआई सत्यापन के आधार पर 7 से 15 कार्य दिवसों में जारी होते हैं।'
                    : 'Standard Circle Officer (CO) certificates take 7 to 15 working days depending on Revenue Karamchari and CI verification.'}
                </p>
              </details>

              <details className="py-3">
                <summary className="font-semibold text-sm sm:text-base text-slate-900 dark:text-white cursor-pointer">
                  {lang === 'hi'
                    ? '3. क्या यहाँ आधार नामांकन या बायोमेट्रिक अपडेट होता है?'
                    : '3. Do you conduct Aadhaar enrollment or biometric updates?'}
                </summary>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {lang === 'hi'
                    ? 'नहीं। रेडियम रोड स्थित प्रज्ञा केंद्र विशेष रूप से भूमि दाखिल-खारिज, रजिस्ट्री डीड ड्राफ्टिंग, अंचल सेवाएं, झारसेवा प्रमाण पत्र, डीटीओ, राशन कार्ड, जीएसटी एवं डिजिटल वेबसाइट पोर्टल पर केंद्रित है।'
                    : 'No. Pragya Kendra at Radium Road focuses exclusively on Land Mutation, Registry Deed Drafting, Anchal Services, JharSewa Certificates, DTO, Ration Card, GST, and Digital Web Portals.'}
                </p>
              </details>

              <details className="py-3">
                <summary className="font-semibold text-sm sm:text-base text-slate-900 dark:text-white cursor-pointer">
                  {lang === 'hi'
                    ? '4. क्या प्रज्ञा केंद्र एक स्वतंत्र स्थानीय सहायता केंद्र है?'
                    : '4. Is Pragya Kendra an independent local assistance centre?'}
                </summary>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {lang === 'hi'
                    ? 'जी हाँ। हम एक स्वतंत्र स्थानीय डिजिटल सेवा एवं दस्तावेज़ सहायता केंद्र हैं जो नागरिकों को कानूनी ड्राफ्टिंग, ऑनलाइन पोर्टल सबमिशन और आवेदन ट्रैकिंग में मदद करते हैं।'
                    : 'Yes. We are an independent local service and documentation centre assisting citizens with legal drafting, portal submissions, and application tracking.'}
                </p>
              </details>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
