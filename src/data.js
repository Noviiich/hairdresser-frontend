// Demonstration content. Replace prices, durations and staff before launch.
export const services = [
  { id: 'haircut', category: 'cut', name: 'Женская стрижка', price: 2000, duration: 60, description: 'Мытьё, стрижка и лёгкая укладка' },
  { id: 'mens-cut', category: 'cut', name: 'Мужская стрижка', price: 1200, duration: 45, description: 'Форма, детали и аккуратная укладка' },
  { id: 'color', category: 'color', name: 'Окрашивание в один тон', price: 3500, duration: 120, description: 'Ровный цвет и естественное сияние' },
  { id: 'balayage', category: 'color', name: 'Сложное окрашивание', price: 6500, duration: 240, description: 'Балаяж, airtouch и мягкие переходы' },
  { id: 'care', category: 'care', name: 'Восстанавливающий уход', price: 2000, duration: 60, description: 'Индивидуальный ритуал для ваших волос' },
  { id: 'styling', category: 'care', name: 'Укладка', price: 1500, duration: 60, description: 'Объём, волны или гладкость' },
];

export const consultation = { id: 'consultation', category: 'all', name: 'Знакомство и консультация', price: 0, duration: 30, description: 'Обсудим ваши идеи и подберём услугу' };
export const bookingServices = [...services, consultation];
export const specialists = [
  { id: 'any', name: 'Любой подходящий мастер', categories: ['cut', 'color', 'care', 'all'] },
  { id: 'anna', name: 'Анна · стилист', categories: ['cut', 'care', 'all'] },
  { id: 'maria', name: 'Мария · колорист', categories: ['color', 'care', 'all'] },
  { id: 'elena', name: 'Елена · стилист-колорист', categories: ['cut', 'color', 'care', 'all'] },
];
export const looks = [
  { title: 'Мягкая текстура', subtitle: 'СТРИЖКА + УКЛАДКА', image: './assets/images/hero.webp', alt: 'Объёмная каштановая стрижка с мягкими волнами', description: 'Воздушная форма, подвижные пряди и чёлка, которая мягко обрамляет лицо. Для тех, кто любит естественность с характером.', service: 'haircut' },
  { title: 'Солнечный блонд', subtitle: 'БАЛАЯЖ + УХОД', image: './assets/images/color.webp', alt: 'Медовый балаяж на длинных волнистых волосах', description: 'Тёплые блики, плавные переходы и объёмный цвет — как после долгого лета. Подберём оттенок и технику с учётом ваших волос.', service: 'balayage' },
];
