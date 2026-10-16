import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Lang = "en" | "ar";

const en = {
  app: "DentalFiles",
  "nav.dashboard": "Dashboard", "nav.patients": "Patients", "nav.settings": "Settings", "nav.logout": "Log out", "nav.menu": "Open menu",
  "lang.switch": "العربية", "lang.label": "Switch language to Arabic",
  "auth.staff": "Staff sign-in", "auth.email": "Email", "auth.password": "Password", "auth.signin": "Sign in",
  "auth.new": "New to DentalFiles?", "auth.create": "Create New Account", "auth.badLogin": "Incorrect email or password.",
  "auth.unconfirmed": "Please verify your email first — check your inbox for the confirmation link.",
  "signup.sub": "Create a new account", "signup.name": "Full name", "signup.email": "Email address", "signup.confirm": "Confirm password",
  "signup.submit": "Create account", "signup.have": "Already have an account?", "signup.login": "Log in",
  "signup.check": "Check your email", "signup.sent": "We sent a confirmation link to {email}. Please verify your email before logging in.",
  "signup.back": "Back to log in", "signup.errName": "Full name is required.", "signup.errEmail": "Enter a valid email address.",
  "signup.errPw": "Password must be at least 8 characters.", "signup.errPw2": "Passwords don't match.",
  "signup.exists": "An account with this email already exists. Try logging in instead.", "signup.rate": "Too many attempts — please wait a few minutes and try again.",
  "dash.kicker": "Patient records", "dash.welcome": "Welcome back", "dash.sub": "Find a patient file or start a new one.",
  "dash.total": "Total patients", "dash.recent": "Recently added", "dash.viewAll": "View all", "dash.none": "No patients yet", "dash.addFirst": "Add the first patient",
  "p.add": "Add patient", "p.title": "Patients", "p.all": "All patient records", "p.resultsFor": "Results for “{q}”", "p.searching": "Searching…",
  "p.noneFor": "No patients found for “{q}”", "p.spellHint": "Check the spelling, or search by patient ID such as P-1025.",
  "p.id": "ID", "p.name": "Name", "p.phone": "Phone", "p.dob": "Date of birth", "p.lastVisit": "Last visit", "p.open": "Open profile",
  "search.label": "Search patients", "search.placeholder": "Search by name or patient ID (e.g. P-1025)", "search.btn": "Search",
  "mode.standard": "Standard search", "mode.ai": "AI Patient Search",
  "ai.title": "AI Patient Search", "ai.desc": "Describe who you're looking for in Arabic or English. AI turns your request into search filters; results come straight from your clinic's records.",
  "ai.placeholder": "e.g. Patients who visited between October 1 and October 15", "ai.inputLabel": "Describe the patients you want to find",
  "ai.search": "Search", "ai.clear": "Clear", "ai.examples": "Try an example", "ai.loading": "Understanding your request and searching…",
  "ai.understood": "Search applied", "ai.found": "{n} matching patients", "ai.found1": "1 matching patient", "ai.none": "No patients match this request.",
  "ai.clarify": "Please be more specific", "ai.unsupported": "This request can't be searched", "ai.retry": "Try again", "ai.more": "Load more",
  "ai.showing": "Showing {a} of {n}", "ai.truncated": "Visit search was limited to the first {n} matching patients. Narrow the dates for complete results.",
  "f.full_name.contains": "Name contains", "f.full_name.equals": "Name is", "f.reference_id.equals": "Patient ID is", "f.phone.contains": "Phone contains",
  "f.visit_date.between": "Had a visit between", "f.last_visit_date.between": "Last visit between", "f.and": "and",
  "err.noClinic": "Your account isn't linked to a clinic yet. Ask the clinic administrator for access.",
  "err.network": "Network problem — please check your connection and try again.",
  "err.aiConfig": "AI search isn't configured on the server yet. Standard search still works.",
  "err.aiBusy": "The AI service is busy right now. Please wait a moment and try again.",
  "err.aiCredits": "AI search is paused because the workspace is out of AI credits. Standard search still works.",
  "err.aiDown": "The AI service is unavailable right now. Standard search still works.",
  "err.auth": "Your session has expired. Please sign in again.", "err.tooLong": "Please keep the request under 300 characters.",
  "err.generic": "Something went wrong. Please try again.",
  "prof.dob": "Date of birth", "prof.phone": "Phone", "prof.allergies": "Allergies", "prof.noneRec": "None recorded", "prof.xray": "X-ray", "prof.openXray": "Open X-ray",
  "prof.notes": "Medical notes", "prof.edit": "Edit", "prof.notFound": "Patient not found", "prof.back": "Back to patients", "prof.visits": "Visit history",
  "prof.noVisits": "No visits recorded yet", "prof.next": "Next visit: {d}", "v.add": "Add visit", "v.date": "Visit date *", "v.next": "Next visit",
  "v.treatment": "Treatment *", "v.notes": "Dentist's notes", "v.save": "Save visit", "v.required": "Visit date and treatment are required.",
  "v.after": "Next visit must be after the visit date.", "v.added": "Visit added",
  "form.name": "Full name *", "form.dob": "Date of birth", "form.phone": "Phone", "form.allergies": "Known allergies", "form.allergiesPh": "e.g. Penicillin, latex",
  "form.notes": "Medical notes", "form.xray": "X-ray link (optional)", "form.errName": "Full name is required.", "form.errDob": "Date of birth can't be in the future.",
  "form.errUrl": "Enter a valid link starting with http:// or https://", "form.savePatient": "Save patient", "form.saveChanges": "Save changes",
  "form.saved": "Patient saved as {id}", "form.changesSaved": "Changes saved", "edit.title": "Edit {name}",
  "set.title": "Settings", "set.signedIn": "Signed in as", "set.clinic": "Clinic", "set.noClinic": "Not linked to a clinic — ask your administrator.", "set.language": "Language",
};
type Key = keyof typeof en;

const ar: Record<Key, string> = {
  app: "DentalFiles",
  "nav.dashboard": "لوحة التحكم", "nav.patients": "المرضى", "nav.settings": "الإعدادات", "nav.logout": "تسجيل الخروج", "nav.menu": "فتح القائمة",
  "lang.switch": "English", "lang.label": "تغيير اللغة إلى الإنجليزية",
  "auth.staff": "تسجيل دخول الطاقم", "auth.email": "البريد الإلكتروني", "auth.password": "كلمة المرور", "auth.signin": "تسجيل الدخول",
  "auth.new": "جديد في DentalFiles؟", "auth.create": "إنشاء حساب جديد", "auth.badLogin": "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
  "auth.unconfirmed": "يرجى تأكيد بريدك الإلكتروني أولاً — تحقق من رابط التأكيد في صندوق الوارد.",
  "signup.sub": "إنشاء حساب جديد", "signup.name": "الاسم الكامل", "signup.email": "البريد الإلكتروني", "signup.confirm": "تأكيد كلمة المرور",
  "signup.submit": "إنشاء الحساب", "signup.have": "لديك حساب بالفعل؟", "signup.login": "تسجيل الدخول",
  "signup.check": "تحقق من بريدك الإلكتروني", "signup.sent": "أرسلنا رابط تأكيد إلى {email}. يرجى تأكيد بريدك قبل تسجيل الدخول.",
  "signup.back": "العودة لتسجيل الدخول", "signup.errName": "الاسم الكامل مطلوب.", "signup.errEmail": "أدخل بريدًا إلكترونيًا صحيحًا.",
  "signup.errPw": "يجب أن تتكون كلمة المرور من 8 أحرف على الأقل.", "signup.errPw2": "كلمتا المرور غير متطابقتين.",
  "signup.exists": "يوجد حساب بهذا البريد بالفعل. جرّب تسجيل الدخول.", "signup.rate": "محاولات كثيرة — يرجى الانتظار بضع دقائق ثم المحاولة مجددًا.",
  "dash.kicker": "سجلات المرضى", "dash.welcome": "مرحبًا بعودتك", "dash.sub": "ابحث عن ملف مريض أو أنشئ ملفًا جديدًا.",
  "dash.total": "إجمالي المرضى", "dash.recent": "أُضيفوا مؤخرًا", "dash.viewAll": "عرض الكل", "dash.none": "لا يوجد مرضى بعد", "dash.addFirst": "أضف أول مريض",
  "p.add": "إضافة مريض", "p.title": "المرضى", "p.all": "جميع سجلات المرضى", "p.resultsFor": "نتائج البحث عن “{q}”", "p.searching": "جارٍ البحث…",
  "p.noneFor": "لم يتم العثور على مرضى لـ “{q}”", "p.spellHint": "تحقق من الإملاء، أو ابحث برقم المريض مثل P-1025.",
  "p.id": "الرقم", "p.name": "الاسم", "p.phone": "الهاتف", "p.dob": "تاريخ الميلاد", "p.lastVisit": "آخر زيارة", "p.open": "فتح الملف",
  "search.label": "البحث عن المرضى", "search.placeholder": "ابحث بالاسم أو رقم المريض (مثل P-1025)", "search.btn": "بحث",
  "mode.standard": "البحث العادي", "mode.ai": "البحث الذكي عن المرضى",
  "ai.title": "البحث الذكي عن المرضى", "ai.desc": "صف المريض الذي تبحث عنه بالعربية أو الإنجليزية. يحوّل الذكاء الاصطناعي طلبك إلى معايير بحث، والنتائج تأتي مباشرة من سجلات عيادتك.",
  "ai.placeholder": "مثال: المرضى الذين زاروا العيادة بين 1 و15 أكتوبر", "ai.inputLabel": "صف المرضى الذين تريد العثور عليهم",
  "ai.search": "بحث", "ai.clear": "مسح", "ai.examples": "جرّب مثالًا", "ai.loading": "جارٍ فهم طلبك والبحث…",
  "ai.understood": "معايير البحث المطبقة", "ai.found": "{n} مريض مطابق", "ai.found1": "مريض واحد مطابق", "ai.none": "لا يوجد مرضى يطابقون هذا الطلب.",
  "ai.clarify": "يرجى التوضيح أكثر", "ai.unsupported": "لا يمكن البحث بهذا الطلب", "ai.retry": "إعادة المحاولة", "ai.more": "تحميل المزيد",
  "ai.showing": "عرض {a} من {n}", "ai.truncated": "اقتصر البحث بالزيارات على أول {n} مريض مطابق. ضيّق نطاق التواريخ للحصول على نتائج كاملة.",
  "f.full_name.contains": "الاسم يحتوي على", "f.full_name.equals": "الاسم هو", "f.reference_id.equals": "رقم المريض هو", "f.phone.contains": "الهاتف يحتوي على",
  "f.visit_date.between": "لديه زيارة بين", "f.last_visit_date.between": "آخر زيارة بين", "f.and": "و",
  "err.noClinic": "حسابك غير مرتبط بعيادة بعد. اطلب الصلاحية من مسؤول العيادة.",
  "err.network": "مشكلة في الاتصال — يرجى التحقق من الإنترنت والمحاولة مجددًا.",
  "err.aiConfig": "البحث الذكي غير مُعدّ على الخادم بعد. البحث العادي ما زال يعمل.",
  "err.aiBusy": "خدمة الذكاء الاصطناعي مشغولة الآن. يرجى الانتظار قليلًا ثم المحاولة.",
  "err.aiCredits": "البحث الذكي متوقف لنفاد رصيد الذكاء الاصطناعي. البحث العادي ما زال يعمل.",
  "err.aiDown": "خدمة الذكاء الاصطناعي غير متاحة حاليًا. البحث العادي ما زال يعمل.",
  "err.auth": "انتهت جلستك. يرجى تسجيل الدخول مجددًا.", "err.tooLong": "يرجى ألا يتجاوز الطلب 300 حرف.",
  "err.generic": "حدث خطأ ما. يرجى المحاولة مجددًا.",
  "prof.dob": "تاريخ الميلاد", "prof.phone": "الهاتف", "prof.allergies": "الحساسية", "prof.noneRec": "لا يوجد", "prof.xray": "الأشعة", "prof.openXray": "فتح صورة الأشعة",
  "prof.notes": "ملاحظات طبية", "prof.edit": "تعديل", "prof.notFound": "المريض غير موجود", "prof.back": "العودة إلى المرضى", "prof.visits": "سجل الزيارات",
  "prof.noVisits": "لا توجد زيارات مسجلة بعد", "prof.next": "الزيارة القادمة: {d}", "v.add": "إضافة زيارة", "v.date": "تاريخ الزيارة *", "v.next": "الزيارة القادمة",
  "v.treatment": "العلاج *", "v.notes": "ملاحظات الطبيب", "v.save": "حفظ الزيارة", "v.required": "تاريخ الزيارة والعلاج مطلوبان.",
  "v.after": "يجب أن تكون الزيارة القادمة بعد تاريخ الزيارة.", "v.added": "تمت إضافة الزيارة",
  "form.name": "الاسم الكامل *", "form.dob": "تاريخ الميلاد", "form.phone": "الهاتف", "form.allergies": "الحساسية المعروفة", "form.allergiesPh": "مثال: البنسلين، اللاتكس",
  "form.notes": "ملاحظات طبية", "form.xray": "رابط الأشعة (اختياري)", "form.errName": "الاسم الكامل مطلوب.", "form.errDob": "لا يمكن أن يكون تاريخ الميلاد في المستقبل.",
  "form.errUrl": "أدخل رابطًا صحيحًا يبدأ بـ http:// أو https://", "form.savePatient": "حفظ المريض", "form.saveChanges": "حفظ التغييرات",
  "form.saved": "تم حفظ المريض برقم {id}", "form.changesSaved": "تم حفظ التغييرات", "edit.title": "تعديل {name}",
  "set.title": "الإعدادات", "set.signedIn": "مسجّل الدخول باسم", "set.clinic": "العيادة", "set.noClinic": "غير مرتبط بعيادة — اسأل المسؤول.", "set.language": "اللغة",
};

export type TFn = (k: Key, vars?: Record<string, string | number>) => string;
type Ctx = { lang: Lang; setLang: (l: Lang) => void; t: TFn; dir: "ltr" | "rtl" };
const I18nCtx = createContext<Ctx | null>(null);
const STORAGE = "dentalfiles.lang";

export function makeT(lang: Lang): TFn {
  const d = lang === "ar" ? ar : en;
  return (k, vars) => {
    let s = d[k] ?? en[k] ?? k;
    if (vars) for (const [n, v] of Object.entries(vars)) s = s.replace(`{${n}}`, String(v));
    return s;
  };
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE);
    if (saved === "ar" || saved === "en") setLangState(saved);
  }, []);
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);
  const setLang = useCallback((l: Lang) => { setLangState(l); localStorage.setItem(STORAGE, l); }, []);
  const value = useMemo<Ctx>(() => ({ lang, setLang, t: makeT(lang), dir: lang === "ar" ? "rtl" : "ltr" }), [lang, setLang]);
  return <I18nCtx.Provider value={value}>{children}</I18nCtx.Provider>;
}

export function useI18n() {
  const c = useContext(I18nCtx);
  if (!c) throw new Error("useI18n must be used inside I18nProvider");
  return c;
}

export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { lang, setLang, t } = useI18n();
  return (
    <button
      type="button"
      onClick={() => setLang(lang === "en" ? "ar" : "en")}
      aria-label={t("lang.label")}
      lang={lang === "en" ? "ar" : "en"}
      className={`inline-flex min-h-10 items-center gap-2 rounded-xl border bg-card px-3 text-sm font-medium transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${className}`}
    >
      <span aria-hidden>🌐</span>{t("lang.switch")}
    </button>
  );
}
