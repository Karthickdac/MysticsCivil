import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "en" | "ta";

const STORAGE_KEY = "ocms.lang";

const dict: Record<string, { en: string; ta: string }> = {
  // Brand / app
  "app.name": { en: "OCMS", ta: "OCMS" },
  "app.tagline": { en: "Construction Management", ta: "கட்டுமான மேலாண்மை" },

  // Sidebar navigation
  "nav.dashboard": { en: "Dashboard", ta: "முதன்மை பலகை" },
  "nav.projects": { en: "Projects", ta: "திட்டங்கள்" },
  "nav.dsrRates": { en: "DSR Rates", ta: "DSR விலைகள்" },
  "nav.approvals": { en: "Approvals", ta: "ஒப்புதல்கள்" },
  "nav.organisations": { en: "Organisations", ta: "நிறுவனங்கள்" },
  "nav.profile": { en: "Profile", ta: "சுயவிவரம்" },
  "nav.logout": { en: "Log out", ta: "வெளியேறு" },

  // Module / page titles
  "page.workforce": { en: "Workforce, Quality & Safety", ta: "தொழிலாளர், தரம் மற்றும் பாதுகாப்பு" },
  "page.financial": { en: "Financial", ta: "நிதி" },
  "page.supplyChain": { en: "Supply Chain", ta: "பொருள் வழங்கல்" },
  "page.estimation": { en: "Estimation", ta: "மதிப்பீடு" },
  "page.dpr": { en: "Daily Progress Report", ta: "தினசரி முன்னேற்ற அறிக்கை" },
  "page.boqVsActual": { en: "BOQ vs Actual", ta: "மதிப்பீடு vs உண்மை" },
  "page.variationOrders": { en: "Variation Orders", ta: "மாற்ற ஆணைகள்" },

  // Common workforce tabs
  "tab.workers": { en: "Workers", ta: "தொழிலாளர்கள்" },
  "tab.attendance": { en: "Attendance", ta: "வருகை" },
  "tab.payroll": { en: "Payroll", ta: "ஊதியம்" },
  "tab.inspections": { en: "Inspections", ta: "ஆய்வுகள்" },
  "tab.ncr": { en: "NCRs", ta: "தர குறைபாடுகள்" },
  "tab.safety": { en: "Safety", ta: "பாதுகாப்பு" },
  "tab.incidents": { en: "Incidents", ta: "சம்பவங்கள்" },
  "tab.jsa": { en: "JSA", ta: "வேலை பாதுகாப்பு பகுப்பாய்வு" },
  "tab.materialTesting": { en: "Material Testing", ta: "பொருள் சோதனை" },
  "tab.statutory": { en: "Statutory", ta: "சட்டப்படியான" },
  "tab.contractorBills": { en: "Contractor Bills", ta: "ஒப்பந்ததாரர் பில்கள்" },

  // Financial tabs
  "tab.bills": { en: "Contractor Bills", ta: "ஒப்பந்ததாரர் பில்கள்" },
  "tab.clientBilling": { en: "Client Billing", ta: "வாடிக்கையாளர் பில்" },
  "tab.ledger": { en: "Ledger", ta: "பேரேடு" },
  "tab.reports": { en: "Reports", ta: "அறிக்கைகள்" },
  "tab.analytics": { en: "Analytics", ta: "பகுப்பாய்வு" },
  "tab.deductions": { en: "Deductions", ta: "கழிவுகள்" },

  // Common buttons
  "btn.save": { en: "Save", ta: "சேமி" },
  "btn.cancel": { en: "Cancel", ta: "ரத்து" },
  "btn.add": { en: "Add", ta: "சேர்" },
  "btn.edit": { en: "Edit", ta: "திருத்து" },
  "btn.delete": { en: "Delete", ta: "நீக்கு" },
  "btn.approve": { en: "Approve", ta: "ஒப்புதல்" },
  "btn.reject": { en: "Reject", ta: "நிராகரி" },
  "btn.submit": { en: "Submit", ta: "சமர்ப்பி" },
  "btn.close": { en: "Close", ta: "மூடு" },
  "btn.export": { en: "Export", ta: "ஏற்றுமதி" },
  "btn.download": { en: "Download", ta: "பதிவிறக்கம்" },
  "btn.search": { en: "Search", ta: "தேடு" },
  "btn.filter": { en: "Filter", ta: "வடிகட்டி" },
  "btn.view": { en: "View", ta: "பார்" },
  "btn.new": { en: "New", ta: "புதிய" },

  // Status labels
  "status.pending": { en: "Pending", ta: "நிலுவையில்" },
  "status.approved": { en: "Approved", ta: "அங்கீகரிக்கப்பட்டது" },
  "status.rejected": { en: "Rejected", ta: "நிராகரிக்கப்பட்டது" },
  "status.draft": { en: "Draft", ta: "வரைவு" },
  "status.active": { en: "Active", ta: "செயலில்" },
  "status.closed": { en: "Closed", ta: "மூடப்பட்டது" },
  "status.open": { en: "Open", ta: "திறந்த" },

  // Common labels
  "label.language": { en: "Language", ta: "மொழி" },
  "label.english": { en: "English", ta: "ஆங்கிலம்" },
  "label.tamil": { en: "Tamil", ta: "தமிழ்" },
  "label.role": { en: "Role", ta: "பங்கு" },
  "label.name": { en: "Name", ta: "பெயர்" },
  "label.date": { en: "Date", ta: "தேதி" },
  "label.amount": { en: "Amount", ta: "தொகை" },
  "label.total": { en: "Total", ta: "மொத்தம்" },
  "label.notes": { en: "Notes", ta: "குறிப்புகள்" },
  "label.actions": { en: "Actions", ta: "செயல்கள்" },
  "label.loading": { en: "Loading…", ta: "ஏற்றுகிறது…" },
};

interface I18nContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string, fallback?: string) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    if (typeof window === "undefined") return "en";
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === "ta" ? "ta" : "en";
  });

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, lang);
    document.documentElement.setAttribute("lang", lang);
  }, [lang]);

  const t = (key: string, fallback?: string) => {
    const entry = dict[key];
    if (!entry) return fallback ?? key;
    return entry[lang] || entry.en;
  };

  return (
    <I18nContext.Provider value={{ lang, setLang: setLangState, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useT() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useT must be used inside <I18nProvider>");
  return ctx;
}
