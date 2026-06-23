import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'

// Lightweight, dependency-free i18n for the public storefront.
// English + Arabic (RTL). Language lives in React state (in-memory, like the
// rest of the demo); the admin back office and the hero stay English/LTR.
// Note on "Charms": rendered in Arabic as "قلائد" (pendants/keepsakes), never
// "تميمة/تمائم" (amulet) — Orim is a Christian store (hard rule #1).

export type Lang = 'en' | 'ar'
type Vars = Record<string, string | number>

const en: Record<string, string> = {
  'nav.home': 'Home',
  'nav.shop': 'Shop',
  'nav.design': 'Design',
  'nav.cart': 'Cart',
  'nav.openCart': 'Open cart ({count})',
  'lang.toArabic': 'Switch to Arabic',
  'lang.toEnglish': 'Switch to English',

  'cat.books': 'Books',
  'cat.charms': 'Charms',
  'cat.bottles': 'Bottles',
  'cat.tshirts': 'T-Shirts',
  'cat.home-gifts': 'Home & Gifts',

  'stock.in': 'In stock',
  'stock.low': 'Low stock',
  'stock.out': 'Out of stock',

  'colour.White': 'White',
  'colour.Black': 'Black',
  'colour.Sand': 'Sand',

  'shop.title': 'Shop',
  'shop.subtitle': 'Encouraging gifts for the people you love — free delivery across Amman & Beirut.',
  'shop.all': 'All',
  'shop.empty': 'No products in this category yet.',
  'card.choose': 'Choose options',
  'card.add': 'Add',
  'card.soldOut': 'Sold out',

  'product.back': 'Back to shop',
  'product.notFound': 'Product not found',
  'product.colour': 'Colour',
  'product.size': 'Size',
  'product.available': '{n} available',
  'product.unavailable': 'Currently unavailable',
  'product.add': 'Add to cart',
  'product.select': 'Select options',
  'product.soldOut': 'Sold out',
  'product.added': 'Added to cart',
  'product.design': 'Design your own',

  'cart.title': 'Your cart',
  'cart.close': 'Close cart',
  'cart.empty': 'Your cart is empty.',
  'cart.continue': 'Continue shopping',
  'cart.subtotal': 'Subtotal',
  'cart.freeDelivery': 'Free delivery in Amman & Beirut.',
  'cart.checkout': 'Checkout',
  'cart.view': 'View cart',
  'cart.each': 'each',
  'cart.emptyTitle': 'Your cart is empty',
  'cart.emptySub': 'Find something encouraging to share.',
  'cart.browse': 'Browse the shop',
  'cart.summary': 'Order summary',
  'cart.delivery': 'Delivery',
  'cart.free': 'Free',
  'cart.total': 'Total',
  'cart.proceed': 'Proceed to checkout',

  'checkout.title': 'Checkout',
  'checkout.contact': 'Contact',
  'checkout.name': 'Full name',
  'checkout.phone': 'Phone',
  'checkout.email': 'Email (optional)',
  'checkout.delivery': 'Delivery',
  'checkout.address': 'Address',
  'checkout.city': 'City',
  'checkout.freeBadge': 'Free delivery in Amman & Beirut',
  'checkout.payment': 'Payment',
  'checkout.cod': 'Cash on delivery',
  'checkout.cardSoon': 'Card — coming soon',
  'checkout.summary': 'Order summary',
  'checkout.coupon': 'Coupon code',
  'checkout.apply': 'Apply',
  'checkout.couponInvalid': 'That code isn’t valid.',
  'checkout.couponApplied': '{code} applied — {label}',
  'checkout.subtotal': 'Subtotal',
  'checkout.discount': 'Discount',
  'checkout.free': 'Free',
  'checkout.total': 'Total',
  'checkout.place': 'Place order',
  'checkout.payNote': 'You’ll pay on delivery — no card needed.',
  'checkout.thanks': 'Thank you — order placed!',
  'checkout.ref': 'Your order reference is {ref}.',
  'checkout.cardPaid': 'Card',
  'checkout.courier': 'Please have {amount} ready for our courier.',
  'checkout.received': 'Payment received.',
  'checkout.freeAcross': 'Free delivery across Amman & Beirut.',
  'checkout.emptyTitle': 'Your cart is empty',
  'checkout.emptySub': 'Add a gift before checking out.',
  'checkout.browse': 'Browse the shop',
  'city.Amman': 'Amman',
  'city.Beirut': 'Beirut',

  'custom.title': 'Design your tee',
  'custom.subtitle':
    'Choose a colour, upload your artwork, then drag and scale it onto the chest. Made to order — free delivery across Amman & Beirut.',
  'custom.colour': 'Shirt colour',
  'custom.size': 'Size',
  'custom.upload': 'Upload artwork',
  'custom.replace': 'Replace artwork',
  'custom.remove': 'Remove',
  'custom.scale': 'Size on chest',
  'custom.lowRes':
    'Low resolution for this print size — your image is {w}px wide; we recommend ≥ {req}px. It may look blurry when printed.',
  'custom.goodRes': 'Resolution looks good ({w}×{h}px).',
  'custom.blanks': '{n} blanks available',
  'custom.outOfStock': 'Out of stock',
  'custom.add': 'Add made-to-order tee',
  'custom.uploadFirst': 'Upload artwork to continue',
  'custom.added': 'Added to cart',
  'custom.artHere': 'Your art appears here',
  'custom.note': 'Made to order — each custom tee is printed on an Orim blank ({sku}).',
  'custom.word': 'Custom',
}

const ar: Record<string, string> = {
  'nav.home': 'الرئيسية',
  'nav.shop': 'المتجر',
  'nav.design': 'صمّم',
  'nav.cart': 'السلة',
  'nav.openCart': 'فتح السلة ({count})',
  'lang.toArabic': 'التبديل إلى العربية',
  'lang.toEnglish': 'التبديل إلى الإنجليزية',

  'cat.books': 'كتب',
  'cat.charms': 'قلائد',
  'cat.bottles': 'قوارير',
  'cat.tshirts': 'تيشيرتات',
  'cat.home-gifts': 'المنزل والهدايا',

  'stock.in': 'متوفّر',
  'stock.low': 'مخزون منخفض',
  'stock.out': 'غير متوفّر',

  'colour.White': 'أبيض',
  'colour.Black': 'أسود',
  'colour.Sand': 'بيج',

  'shop.title': 'المتجر',
  'shop.subtitle': 'هدايا مشجّعة لمن تحب — توصيل مجاني في عمّان وبيروت.',
  'shop.all': 'الكل',
  'shop.empty': 'لا توجد منتجات في هذه الفئة بعد.',
  'card.choose': 'اختر الخيارات',
  'card.add': 'أضف',
  'card.soldOut': 'نفد',

  'product.back': 'العودة للمتجر',
  'product.notFound': 'المنتج غير موجود',
  'product.colour': 'اللون',
  'product.size': 'المقاس',
  'product.available': '{n} متوفّر',
  'product.unavailable': 'غير متوفّر حالياً',
  'product.add': 'أضف إلى السلة',
  'product.select': 'اختر الخيارات',
  'product.soldOut': 'نفد',
  'product.added': 'تمت الإضافة',
  'product.design': 'صمّم تصميمك الخاص',

  'cart.title': 'سلتك',
  'cart.close': 'إغلاق السلة',
  'cart.empty': 'سلتك فارغة.',
  'cart.continue': 'متابعة التسوّق',
  'cart.subtotal': 'المجموع الفرعي',
  'cart.freeDelivery': 'توصيل مجاني في عمّان وبيروت.',
  'cart.checkout': 'إتمام الشراء',
  'cart.view': 'عرض السلة',
  'cart.each': 'للقطعة',
  'cart.emptyTitle': 'سلتك فارغة',
  'cart.emptySub': 'اختر هدية مشجّعة لمشاركتها.',
  'cart.browse': 'تصفّح المتجر',
  'cart.summary': 'ملخّص الطلب',
  'cart.delivery': 'التوصيل',
  'cart.free': 'مجاني',
  'cart.total': 'الإجمالي',
  'cart.proceed': 'المتابعة للدفع',

  'checkout.title': 'إتمام الشراء',
  'checkout.contact': 'معلومات التواصل',
  'checkout.name': 'الاسم الكامل',
  'checkout.phone': 'الهاتف',
  'checkout.email': 'البريد الإلكتروني (اختياري)',
  'checkout.delivery': 'التوصيل',
  'checkout.address': 'العنوان',
  'checkout.city': 'المدينة',
  'checkout.freeBadge': 'توصيل مجاني في عمّان وبيروت',
  'checkout.payment': 'الدفع',
  'checkout.cod': 'الدفع عند الاستلام',
  'checkout.cardSoon': 'بطاقة — قريباً',
  'checkout.summary': 'ملخّص الطلب',
  'checkout.coupon': 'رمز الخصم',
  'checkout.apply': 'تطبيق',
  'checkout.couponInvalid': 'هذا الرمز غير صالح.',
  'checkout.couponApplied': 'تم تطبيق {code} — {label}',
  'checkout.subtotal': 'المجموع الفرعي',
  'checkout.discount': 'الخصم',
  'checkout.free': 'مجاني',
  'checkout.total': 'الإجمالي',
  'checkout.place': 'تأكيد الطلب',
  'checkout.payNote': 'ستدفع عند الاستلام — دون الحاجة لبطاقة.',
  'checkout.thanks': 'شكراً — تم تأكيد طلبك!',
  'checkout.ref': 'رقم طلبك هو {ref}.',
  'checkout.cardPaid': 'بطاقة',
  'checkout.courier': 'يرجى تجهيز {amount} لمندوب التوصيل.',
  'checkout.received': 'تم استلام الدفعة.',
  'checkout.freeAcross': 'توصيل مجاني في عمّان وبيروت.',
  'checkout.emptyTitle': 'سلتك فارغة',
  'checkout.emptySub': 'أضف هدية قبل إتمام الشراء.',
  'checkout.browse': 'تصفّح المتجر',
  'city.Amman': 'عمّان',
  'city.Beirut': 'بيروت',

  'custom.title': 'صمّم تيشيرتك',
  'custom.subtitle':
    'اختر لوناً، ارفع تصميمك، ثم اسحبه وغيّر حجمه على الصدر. حسب الطلب — توصيل مجاني في عمّان وبيروت.',
  'custom.colour': 'لون القميص',
  'custom.size': 'المقاس',
  'custom.upload': 'ارفع التصميم',
  'custom.replace': 'استبدل التصميم',
  'custom.remove': 'إزالة',
  'custom.scale': 'الحجم على الصدر',
  'custom.lowRes':
    'دقة منخفضة لهذا الحجم — عرض صورتك {w} بكسل؛ نوصي بـ {req} بكسل على الأقل. قد تظهر مشوّشة عند الطباعة.',
  'custom.goodRes': 'الدقة ممتازة ({w}×{h} بكسل).',
  'custom.blanks': '{n} قطعة متوفّرة',
  'custom.outOfStock': 'غير متوفّر',
  'custom.add': 'أضف التيشيرت حسب الطلب',
  'custom.uploadFirst': 'ارفع التصميم للمتابعة',
  'custom.added': 'تمت الإضافة',
  'custom.artHere': 'يظهر تصميمك هنا',
  'custom.note': 'حسب الطلب — يُطبع كل تيشيرت على قطعة Orim ({sku}).',
  'custom.word': 'مخصّص',
}

const DICTS: Record<Lang, Record<string, string>> = { en, ar }

function interpolate(template: string, vars?: Vars): string {
  if (!vars) return template
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(vars[key] ?? `{${key}}`))
}

export interface I18nValue {
  lang: Lang
  dir: 'ltr' | 'rtl'
  t: (key: string, vars?: Vars) => string
  setLang: (lang: Lang) => void
  toggle: () => void
}

const I18nContext = createContext<I18nValue | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>('en')
  const dir: 'ltr' | 'rtl' = lang === 'ar' ? 'rtl' : 'ltr'

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const t = (key: string, vars?: Vars) =>
    interpolate(DICTS[lang][key] ?? DICTS.en[key] ?? key, vars)

  const value: I18nValue = {
    lang,
    dir,
    t,
    setLang,
    toggle: () => setLang((l) => (l === 'en' ? 'ar' : 'en')),
  }

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within an I18nProvider')
  return ctx
}
