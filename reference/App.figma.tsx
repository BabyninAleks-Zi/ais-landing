import { useState, useEffect, useRef } from 'react'

// ─── Constants ───────────────────────────────────────────────────────────────

const C = {
  navy: '#0B2D3A',
  teal: '#0F7C81',
  graphite: '#26343D',
  bg: '#F4F7F8',
  white: '#FFFFFF',
  orange: '#D66A2C',
  tealLight: '#E0F2F3',
  navyMid: '#153747',
} as const

const YEARS = ['2026', '2027', '2028']

const SCENARIOS = {
  base: {
    label: 'Основной вариант',
    tag: '2 команды PAUT · диагностика теплообменников',
    revenue: [14.01, 92.68, 92.68],
    result: [-0.03, 31.57, 30.23],
    financingNeed: 37.65,
  },
  expanded: {
    label: 'С шестью инженерами',
    tag: 'Сценарий расширения при обеспеченном заказе',
    revenue: [18.88, 121.87, 121.87],
    result: [1.34, 40.16, 38.22],
    financingNeed: 47.50,
  },
} as const

type ScenarioKey = keyof typeof SCENARIOS

type Scenario = {
  label: string
  tag: string
  revenue: readonly number[]
  result: readonly number[]
  financingNeed: number
}

const NAV_LINKS = [
  { label: 'Подход', id: 'approach' },
  { label: 'Услуги', id: 'services' },
  { label: 'Команда', id: 'team' },
  { label: 'Проекты', id: 'projects' },
  { label: 'Экономика', id: 'economics' },
  { label: 'План запуска', id: 'launch' },
]

// ─── Reusable primitives ──────────────────────────────────────────────────────

const SectionLabel = ({ children, light = false }: { children: React.ReactNode; light?: boolean }) => (
  <div style={{
    fontFamily: "'Inter', sans-serif",
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.14em',
    textTransform: 'uppercase' as const,
    color: light ? 'rgba(255,255,255,0.5)' : C.teal,
    marginBottom: 16,
  }}>
    {children}
  </div>
)

const Disclaimer = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <p style={{
    fontFamily: "'Inter', sans-serif",
    fontSize: 13,
    color: '#607D8B',
    lineHeight: 1.6,
    borderLeft: `2px solid ${C.teal}`,
    paddingLeft: 12,
    marginTop: 8,
    ...style,
  }}>
    {children}
  </p>
)

const Container = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px', ...style }}>
    {children}
  </div>
)

// ─── Logo ─────────────────────────────────────────────────────────────────────

function AISLogo({ light = false, compact = false }: { light?: boolean; compact?: boolean }) {
  const teal = C.teal
  const textColor = light ? C.white : C.navy
  const subColor = light ? 'rgba(255,255,255,0.5)' : C.teal
  const bgForHole = light ? C.navy : C.bg

  if (compact) {
    return (
      <span style={{
        fontFamily: "'Golos Text', sans-serif",
        fontWeight: 900,
        letterSpacing: '-0.03em',
        fontSize: 22,
        color: teal,
        lineHeight: 1,
      }}>AIS</span>
    )
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, userSelect: 'none' }}>
      {/* Geometric A-mark — flat-top truncated A with triangular counter */}
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M1 47 L15 4 H33 L47 47 H39 L34 31 H14 L9 47 Z M24 10 L17 27 H31 Z"
          fill={teal}
        />
        {/* Thin accent bar at flat top */}
        <rect x="15" y="3" width="18" height="2" fill={light ? 'rgba(255,255,255,0.35)' : 'rgba(11,45,58,0.25)'} />
      </svg>
      <div>
        <div style={{
          fontFamily: "'Golos Text', sans-serif",
          fontWeight: 900,
          fontSize: 26,
          letterSpacing: '-0.04em',
          lineHeight: 1,
          color: textColor,
        }}>AIS</div>
        <div style={{
          fontFamily: "'Inter', sans-serif",
          fontWeight: 500,
          fontSize: 8.5,
          letterSpacing: '0.14em',
          textTransform: 'uppercase' as const,
          color: subColor,
          marginTop: 3,
          lineHeight: 1,
          whiteSpace: 'nowrap' as const,
        }}>Asset Integrity Systems</div>
      </div>
    </div>
  )
}

// ─── Navigation ───────────────────────────────────────────────────────────────

function Navigation() {
  const [scrolled, setScrolled] = useState(false)
  const [activeId, setActiveId] = useState('')
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 60)
      const found = NAV_LINKS.map(l => document.getElementById(l.id))
        .reduce<string>((acc, el) => {
          if (el && el.getBoundingClientRect().top <= 120) return el.id
          return acc
        }, '')
      setActiveId(found)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    setMobileOpen(false)
  }

  const bg = scrolled ? 'rgba(11,45,58,0.97)' : 'transparent'
  const border = scrolled ? '1px solid rgba(15,124,129,0.18)' : 'none'

  return (
    <header style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
      background: bg, backdropFilter: scrolled ? 'blur(14px)' : 'none',
      borderBottom: border, transition: 'background 0.3s, border 0.3s',
    }}>
      <Container style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 72 }}>
        <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          aria-label="AIS — к началу страницы">
          <AISLogo light />
        </button>

        {/* Desktop */}
        <nav style={{ display: 'flex', gap: 28, alignItems: 'center' }} aria-label="Основная навигация">
          {NAV_LINKS.map(l => (
            <button key={l.id} onClick={() => scrollTo(l.id)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 500,
                color: activeId === l.id ? C.teal : 'rgba(255,255,255,0.72)',
                letterSpacing: '0.02em', padding: '4px 0',
                borderBottom: activeId === l.id ? `1.5px solid ${C.teal}` : '1.5px solid transparent',
                transition: 'color 0.2s',
              }}
              className="hidden md:block"
            >{l.label}</button>
          ))}
          <button onClick={() => scrollTo('contact')}
            style={{
              background: C.teal, color: C.white, border: 'none', cursor: 'pointer',
              padding: '9px 20px', fontFamily: "'Inter', sans-serif",
              fontSize: 13, fontWeight: 600, letterSpacing: '0.02em',
              transition: 'background 0.2s',
            }}
            className="hidden md:block"
            onMouseEnter={e => (e.currentTarget.style.background = '#0d6b70')}
            onMouseLeave={e => (e.currentTarget.style.background = C.teal)}
          >Обсудить проект</button>

          {/* Hamburger */}
          <button onClick={() => setMobileOpen(o => !o)}
            className="md:hidden"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, color: C.white }}
            aria-label="Меню">
            <div style={{ width: 22, height: 1.5, background: 'currentColor', marginBottom: 6, transition: 'transform 0.2s', transform: mobileOpen ? 'rotate(45deg) translate(5px, 5px)' : 'none' }} />
            <div style={{ width: 22, height: 1.5, background: 'currentColor', marginBottom: 6, opacity: mobileOpen ? 0 : 1, transition: 'opacity 0.2s' }} />
            <div style={{ width: 22, height: 1.5, background: 'currentColor', transition: 'transform 0.2s', transform: mobileOpen ? 'rotate(-45deg) translate(5px, -5px)' : 'none' }} />
          </button>
        </nav>
      </Container>

      {/* Mobile menu */}
      {mobileOpen && (
        <div style={{ background: C.navy, borderTop: '1px solid rgba(15,124,129,0.2)', padding: '12px 24px 24px' }}>
          {NAV_LINKS.map(l => (
            <button key={l.id} onClick={() => scrollTo(l.id)}
              style={{
                display: 'block', width: '100%', textAlign: 'left', background: 'none',
                border: 'none', borderBottom: '1px solid rgba(255,255,255,0.07)',
                cursor: 'pointer', padding: '14px 0', fontSize: 16,
                fontFamily: "'Inter', sans-serif", color: 'rgba(255,255,255,0.85)',
              }}>{l.label}</button>
          ))}
          <button onClick={() => scrollTo('contact')}
            style={{
              marginTop: 16, width: '100%', background: C.teal, color: C.white,
              border: 'none', cursor: 'pointer', padding: 14,
              fontFamily: "'Inter', sans-serif", fontSize: 16, fontWeight: 600,
            }}>Обсудить проект</button>
        </div>
      )}
    </header>
  )
}

// ─── Section 1: Hero ──────────────────────────────────────────────────────────

function SectionHero() {
  return (
    <section style={{ position: 'relative', minHeight: '100vh', background: C.navy, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      {/* Background photo */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'url(https://images.unsplash.com/photo-1704130092069-30ae33e2def0?w=1600&h=900&fit=crop&auto=format)',
        backgroundSize: 'cover', backgroundPosition: 'center',
        opacity: 0.22,
      }} aria-hidden="true" />
      {/* Gradient overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `linear-gradient(to bottom, ${C.navy} 0%, rgba(11,45,58,0.7) 50%, ${C.navy} 100%)`,
      }} aria-hidden="true" />

      <Container style={{ position: 'relative', zIndex: 1, paddingTop: 120, paddingBottom: 80 }}>
        {/* Label */}
        <div style={{
          fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 500,
          letterSpacing: '0.16em', textTransform: 'uppercase' as const,
          color: C.teal, marginBottom: 24,
        }}>Инженерная компания · Инвестиционный проект</div>

        {/* Headline */}
        <h1 style={{
          fontFamily: "'Golos Text', sans-serif", fontWeight: 900,
          fontSize: 'clamp(38px, 6vw, 72px)', lineHeight: 1.05,
          letterSpacing: '-0.03em', color: C.white,
          maxWidth: 820, margin: '0 0 28px',
        }}>
          От состояния оборудования —<br />
          <span style={{ color: C.teal }}>к обоснованным решениям</span>
        </h1>

        {/* Sub */}
        <p style={{
          fontFamily: "'Inter', sans-serif", fontSize: 'clamp(17px, 2vw, 21px)',
          lineHeight: 1.6, color: 'rgba(255,255,255,0.72)',
          maxWidth: 680, margin: '0 0 16px',
        }}>
          Создаём инженерную компанию, которая объединяет подготовку инспекций, специализированный неразрушающий контроль и работу с данными о состоянии промышленных активов.
        </p>
        <p style={{
          fontFamily: "'Inter', sans-serif", fontSize: 15,
          lineHeight: 1.65, color: 'rgba(255,255,255,0.5)',
          maxWidth: 620, margin: '0 0 48px',
        }}>
          Начинаем с двух команд PAUT и сезонной диагностики трубок теплообменников. Развиваем постоянное инженерное сопровождение под задачи заказчиков.
        </p>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' as const }}>
          <button
            onClick={() => document.getElementById('approach')?.scrollIntoView({ behavior: 'smooth' })}
            style={{
              background: C.teal, color: C.white, border: 'none', cursor: 'pointer',
              padding: '14px 28px', fontFamily: "'Inter', sans-serif",
              fontSize: 15, fontWeight: 600, letterSpacing: '0.02em',
              transition: 'background 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#0d6b70')}
            onMouseLeave={e => (e.currentTarget.style.background = C.teal)}
          >Рассмотреть проект</button>
          <button
            onClick={() => document.getElementById('economics')?.scrollIntoView({ behavior: 'smooth' })}
            style={{
              background: 'transparent', color: 'rgba(255,255,255,0.8)',
              border: '1px solid rgba(255,255,255,0.3)',
              cursor: 'pointer', padding: '14px 28px',
              fontFamily: "'Inter', sans-serif", fontSize: 15, fontWeight: 500,
              transition: 'border-color 0.2s, color 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = C.teal; e.currentTarget.style.color = C.white }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; e.currentTarget.style.color = 'rgba(255,255,255,0.8)' }}
          >Экономика запуска</button>
        </div>

        {/* Stats bar */}
        <div style={{
          marginTop: 72, paddingTop: 40,
          borderTop: '1px solid rgba(255,255,255,0.1)',
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 32,
        }}>
          {[
            { value: '2 команды PAUT', label: 'стартовая программа' },
            { value: '90 дней', label: 'план диагностики теплообменников в год' },
            { value: '42 млн ₽', label: 'предлагаемое финансирование' },
          ].map((s, i) => (
            <div key={i}>
              <div style={{
                fontFamily: "'Golos Text', sans-serif", fontWeight: 700,
                fontSize: 28, letterSpacing: '-0.02em', color: C.teal, lineHeight: 1,
              }}>{s.value}</div>
              <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 6, lineHeight: 1.4 }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 12 }}>
          <Disclaimer>Параметры планируемого запуска. Не текущие достижения компании.</Disclaimer>
        </div>
      </Container>
    </section>
  )
}

// ─── Section 2: Client Problem ────────────────────────────────────────────────

function SectionProblem() {
  return (
    <section id="approach" style={{ background: C.white, padding: '96px 0' }}>
      <Container>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'start' }}>
          <div>
            <SectionLabel>Задача заказчика</SectionLabel>
            <h2 style={{
              fontFamily: "'Golos Text', sans-serif", fontWeight: 800,
              fontSize: 'clamp(28px, 3.5vw, 44px)', lineHeight: 1.1,
              letterSpacing: '-0.025em', color: C.navy, margin: '0 0 28px',
            }}>Измерения нужны не сами по себе</h2>
            <p style={{
              fontFamily: "'Inter', sans-serif", fontSize: 18, lineHeight: 1.7,
              color: C.graphite, margin: '0 0 32px',
            }}>
              Чертежи, результаты контроля и история ремонтов часто находятся в разных документах. Чтобы спланировать следующую инспекцию, заказчику нужно связать эти сведения с фактическим состоянием оборудования и условиями его эксплуатации.
            </p>
            <div style={{
              background: C.teal, color: C.white, padding: '16px 20px',
              fontSize: 15, fontFamily: "'Inter', sans-serif", lineHeight: 1.6,
            }}>
              AIS связывает эти задачи в одну последовательность работ
            </div>
          </div>

          <div style={{ paddingTop: 48 }}>
            {[
              { q: 'Где искать повреждения?', d: 'Связать механизмы деградации с режимами эксплуатации, историей ремонтов и конструкцией объекта.' },
              { q: 'Как подготовить и выполнить контроль?', d: 'Определить методы, точки контроля, доступы, квалификацию и технологию — до выезда на объект.' },
              { q: 'Как использовать результаты?', d: 'Организовать данные так, чтобы они были пригодны для планирования ремонта и следующих инспекций.' },
            ].map((item, i) => (
              <div key={i} style={{
                padding: '24px 0', borderBottom: i < 2 ? `1px solid ${C.tealLight}` : 'none',
              }}>
                <div style={{
                  display: 'flex', gap: 16, alignItems: 'flex-start',
                }}>
                  <div style={{
                    minWidth: 32, height: 32, background: C.tealLight,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: "'Golos Text', sans-serif", fontWeight: 700,
                    fontSize: 14, color: C.teal, flexShrink: 0,
                  }}>{i + 1}</div>
                  <div>
                    <div style={{
                      fontFamily: "'Golos Text', sans-serif", fontWeight: 700,
                      fontSize: 17, color: C.navy, marginBottom: 6,
                    }}>{item.q}</div>
                    <div style={{
                      fontFamily: "'Inter', sans-serif", fontSize: 14,
                      color: '#546E7A', lineHeight: 1.6,
                    }}>{item.d}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  )
}

// ─── Section 3: Engineering Approach ─────────────────────────────────────────

function SectionApproach() {
  const steps = [
    {
      n: '01', title: 'Исходные данные',
      result: 'Состав оборудования, материалы, режимы эксплуатации и история обследований',
    },
    {
      n: '02', title: 'Инженерная подготовка',
      result: 'Механизмы повреждения, коррозионные контуры, приоритеты и точки контроля',
    },
    {
      n: '03', title: 'Полевой контроль',
      result: 'Измерения по согласованной технологии с привязкой к объекту',
    },
    {
      n: '04', title: 'Проверка результатов',
      result: 'Проверенные записи, выявленные отклонения и ограничения обследования',
    },
    {
      n: '05', title: 'Следующий цикл',
      result: 'Обновлённая история состояния и предложения по дальнейшим действиям',
    },
  ]

  return (
    <section style={{ background: C.bg, padding: '96px 0' }}>
      <Container>
        <SectionLabel>Инженерный подход</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 64, alignItems: 'start' }}>
          <div>
            <h2 style={{
              fontFamily: "'Golos Text', sans-serif", fontWeight: 800,
              fontSize: 'clamp(26px, 3vw, 40px)', lineHeight: 1.1,
              letterSpacing: '-0.025em', color: C.navy, margin: '0 0 24px',
            }}>Один объект.<br />Связанный цикл инспекций</h2>
            <p style={{
              fontFamily: "'Inter', sans-serif", fontSize: 16, lineHeight: 1.7,
              color: '#546E7A', margin: '0 0 24px',
            }}>
              Эксплуатационные решения остаются за заказчиком. AIS отвечает за качество своей инженерной и диагностической работы.
            </p>
            <div style={{
              borderLeft: `3px solid ${C.teal}`, paddingLeft: 16,
              fontFamily: "'Inter', sans-serif", fontSize: 14, color: C.teal,
              lineHeight: 1.5, fontWeight: 500,
            }}>
              Цикл повторяется. Каждая инспекция опирается на предыдущую.
            </div>
          </div>

          {/* Process flow */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {steps.map((step, i) => (
              <div key={i} style={{ display: 'flex', gap: 0 }}>
                {/* Line + dot */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginRight: 20, flexShrink: 0 }}>
                  <div style={{
                    width: 36, height: 36, background: i === steps.length - 1 ? C.teal : C.navy,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 11,
                    color: C.white, flexShrink: 0, letterSpacing: '0.02em',
                  }}>{step.n}</div>
                  {i < steps.length - 1 && (
                    <div style={{ width: 1, flex: 1, background: `linear-gradient(to bottom, ${C.navy}, ${C.tealLight})`, minHeight: 32 }} />
                  )}
                </div>
                {/* Content */}
                <div style={{ paddingBottom: i < steps.length - 1 ? 28 : 0, paddingTop: 4 }}>
                  <div style={{
                    fontFamily: "'Golos Text', sans-serif", fontWeight: 700,
                    fontSize: 16, color: C.navy, marginBottom: 4,
                  }}>{step.title}</div>
                  <div style={{
                    fontFamily: "'Inter', sans-serif", fontSize: 14,
                    color: '#546E7A', lineHeight: 1.6,
                  }}>{step.result}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  )
}

// ─── Section 4: Services ──────────────────────────────────────────────────────

function SectionServices() {
  const services = [
    {
      num: '1',
      title: 'Инженерная подготовка инспекций',
      body: 'Коррозионные контуры, уязвимые участки, точки мониторинга толщины, рабочие пакеты инспекции.',
      result: 'Программа, в которой определены не только методы контроля, но и подготовка, доступы и последовательность работ.',
    },
    {
      num: '2',
      title: 'Контроль трубопроводов и сварных соединений',
      body: 'PAUT, TOFD и контроль с применением канатного доступа — по согласованной технологии и при подтверждённой готовности.',
      result: 'Прослеживаемые данные о сварных соединениях и обследованных зонах.',
    },
    {
      num: '3',
      title: 'Диагностика трубок теплообменников',
      body: 'Подбор методов под материал, геометрию и предполагаемые повреждения. Планируемая платформа — Ectane 3. Методы: ECT, ECA, RFT, NFT/NFA, IRIS — в пределах выбранной комплектации и применимости.',
      result: 'Реестр обследованных трубок, карта результатов, ограничения и рекомендации для дальнейшей оценки.',
    },
    {
      num: '4',
      title: 'Инспекционные данные',
      body: 'Проверка отчётов, единая идентификация объектов, сопоставление обследований, подготовка структурированных реестров.',
      result: 'История состояния, пригодная для последующего анализа и систем заказчика.',
    },
  ]

  return (
    <section id="services" style={{ background: C.white, padding: '96px 0' }}>
      <Container>
        <SectionLabel>Что предлагает AIS</SectionLabel>
        <h2 style={{
          fontFamily: "'Golos Text', sans-serif", fontWeight: 800,
          fontSize: 'clamp(28px, 3.5vw, 44px)', lineHeight: 1.1,
          letterSpacing: '-0.025em', color: C.navy, margin: '0 0 56px',
        }}>Четыре направления одной инженерной задачи</h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 2 }}>
          {services.map((s, i) => (
            <div key={i} style={{
              padding: '36px 32px',
              background: i % 2 === 0 ? C.bg : C.white,
              borderTop: `3px solid ${i < 2 ? C.navy : C.teal}`,
              display: 'flex', flexDirection: 'column',
            }}>
              <div style={{
                fontFamily: "'Golos Text', sans-serif", fontWeight: 900,
                fontSize: 48, color: C.tealLight, letterSpacing: '-0.05em',
                lineHeight: 1, marginBottom: 16,
              }}>{s.num}</div>
              <h3 style={{
                fontFamily: "'Golos Text', sans-serif", fontWeight: 700,
                fontSize: 20, color: C.navy, lineHeight: 1.25,
                margin: '0 0 14px',
              }}>{s.title}</h3>
              <p style={{
                fontFamily: "'Inter', sans-serif", fontSize: 15,
                color: '#546E7A', lineHeight: 1.65, margin: '0 0 20px', flex: 1,
              }}>{s.body}</p>
              <div style={{
                borderTop: `1px solid ${C.tealLight}`, paddingTop: 16,
              }}>
                <div style={{
                  fontFamily: "'Inter', sans-serif", fontSize: 11,
                  fontWeight: 600, letterSpacing: '0.1em',
                  textTransform: 'uppercase' as const, color: C.teal, marginBottom: 8,
                }}>Результат для заказчика</div>
                <div style={{
                  fontFamily: "'Inter', sans-serif", fontSize: 14,
                  color: C.graphite, lineHeight: 1.6,
                }}>{s.result}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 28 }}>
          <Disclaimer>Самостоятельная экспертиза промышленной безопасности не входит в стартовую деятельность.</Disclaimer>
        </div>
      </Container>
    </section>
  )
}

// ─── Section 5: Applied Tasks ─────────────────────────────────────────────────

function SectionTasks() {
  const cases = [
    {
      title: 'Коррозионные контуры трубопроводов',
      body: 'Связь технологической схемы, условий эксплуатации, механизмов повреждения и мест контроля. Определение зон с различным характером и интенсивностью коррозии.',
      flag: null,
    },
    {
      title: 'Мониторинг коррозии корня сварного шва',
      body: 'Развиваемый подход с применением PAUT для сопоставления состояния выбранных соединений во времени.',
      flag: 'Технология требует технической проверки и согласования с заказчиком.',
    },
    {
      title: 'Подготовка остановочной кампании теплообменников',
      body: 'Согласование нумерации трубок, очистки, доступа, методов и формы итоговых данных до начала обследования.',
      flag: null,
    },
  ]

  return (
    <section style={{
      background: C.navy, padding: '96px 0',
      backgroundImage: `url(https://images.unsplash.com/photo-1620203853151-496c7228306c?w=1400&h=600&fit=crop&auto=format)`,
      backgroundSize: 'cover', backgroundPosition: 'center',
      position: 'relative',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: `rgba(11,45,58,0.91)`,
      }} aria-hidden="true" />
      <Container style={{ position: 'relative', zIndex: 1 }}>
        <SectionLabel light>Прикладные инженерные задачи</SectionLabel>
        <h2 style={{
          fontFamily: "'Golos Text', sans-serif", fontWeight: 800,
          fontSize: 'clamp(26px, 3vw, 40px)', lineHeight: 1.1,
          letterSpacing: '-0.025em', color: C.white, margin: '0 0 12px',
        }}>Где нужен не только прибор, но и инженерная подготовка</h2>
        <p style={{
          fontFamily: "'Inter', sans-serif", fontSize: 15, color: 'rgba(255,255,255,0.5)',
          marginBottom: 56,
        }}>Примеры задач и планируемых подходов — не выполненные кейсы AIS</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 2 }}>
          {cases.map((c, i) => (
            <div key={i} style={{
              background: 'rgba(255,255,255,0.05)',
              border: `1px solid rgba(15,124,129,0.25)`,
              padding: '32px 28px',
            }}>
              <div style={{
                width: 40, height: 3, background: C.teal, marginBottom: 24,
              }} />
              <h3 style={{
                fontFamily: "'Golos Text', sans-serif", fontWeight: 700,
                fontSize: 19, color: C.white, lineHeight: 1.3, margin: '0 0 14px',
              }}>{c.title}</h3>
              <p style={{
                fontFamily: "'Inter', sans-serif", fontSize: 15,
                color: 'rgba(255,255,255,0.6)', lineHeight: 1.65, margin: 0,
              }}>{c.body}</p>
              {c.flag && (
                <div style={{
                  marginTop: 16, padding: '10px 14px',
                  background: 'rgba(214,106,44,0.15)', borderLeft: `2px solid ${C.orange}`,
                  fontFamily: "'Inter', sans-serif", fontSize: 13,
                  color: 'rgba(255,200,150,0.9)', lineHeight: 1.5,
                }}>{c.flag}</div>
              )}
            </div>
          ))}
        </div>
      </Container>
    </section>
  )
}

// ─── Section 6: Startup Program ───────────────────────────────────────────────

function SectionProgram() {
  const streams = [
    {
      icon: '◈',
      title: 'Наземный PAUT',
      color: C.navy,
      lines: [
        'Инспектор и ассистент',
        'Одна планируемая постоянно оплачиваемая позиция команды',
        'SIUI SyncScan 3 — план закупки',
      ],
    },
    {
      icon: '◉',
      title: 'PAUT с канатным доступом',
      color: C.teal,
      lines: [
        'Руководитель доступа IRATA 3',
        'Инспектор PAUT с IRATA 2',
        'Ассистент IRATA 1',
      ],
    },
    {
      icon: '◈',
      title: 'Внутритрубная диагностика',
      color: C.navy,
      lines: [
        'Одна команда',
        'Один планируемый комплект Ectane 3',
        '90 дней ежегодно с 2027 года',
      ],
    },
  ]

  return (
    <section id="team" style={{ background: C.bg, padding: '96px 0' }}>
      <Container>
        <SectionLabel>Стартовая программа</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 64, alignItems: 'start' }}>
          <div>
            <h2 style={{
              fontFamily: "'Golos Text', sans-serif", fontWeight: 800,
              fontSize: 'clamp(26px, 3vw, 40px)', lineHeight: 1.1,
              letterSpacing: '-0.025em', color: C.navy, margin: '0 0 24px',
            }}>Начинаем с определённого состава работ</h2>
            <p style={{
              fontFamily: "'Inter', sans-serif", fontSize: 16,
              color: '#546E7A', lineHeight: 1.7,
            }}>
              Для чередования двух смен PAUT предусмотрено десять специалистов; одновременно на объекте — пять.
            </p>
            <div style={{
              marginTop: 24, padding: '20px 24px',
              background: C.white, borderLeft: `3px solid ${C.orange}`,
            }}>
              <div style={{
                fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 600,
                letterSpacing: '0.1em', textTransform: 'uppercase' as const,
                color: C.orange, marginBottom: 8,
              }}>Сценарий расширения</div>
              <p style={{
                fontFamily: "'Inter', sans-serif", fontSize: 14,
                color: C.graphite, lineHeight: 1.6, margin: 0,
              }}>
                Шесть инженеров эксплуатационной надёжности — при обеспеченном заказе и оборотном капитале. Рассматривается отдельно от основного варианта.
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
            {streams.map((s, i) => (
              <div key={i} style={{
                padding: '32px 28px', background: C.white,
                borderTop: `4px solid ${s.color}`,
              }}>
                <h3 style={{
                  fontFamily: "'Golos Text', sans-serif", fontWeight: 700,
                  fontSize: 18, color: C.navy, margin: '0 0 20px', lineHeight: 1.2,
                }}>{s.title}</h3>
                <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                  {s.lines.map((l, j) => (
                    <li key={j} style={{
                      fontFamily: "'Inter', sans-serif", fontSize: 14,
                      color: '#546E7A', lineHeight: 1.6,
                      padding: '6px 0', borderBottom: j < s.lines.length - 1 ? `1px solid ${C.bg}` : 'none',
                      display: 'flex', gap: 8, alignItems: 'flex-start',
                    }}>
                      <span style={{ color: s.color, flexShrink: 0, marginTop: 2 }}>—</span>
                      {l}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <Disclaimer style={{ marginTop: 24 }}>
          Непрерывная оплата PAUT — предпосылка финансовой модели, не подписанное обязательство заказчика.
        </Disclaimer>
      </Container>
    </section>
  )
}

// ─── Section 7: Team ──────────────────────────────────────────────────────────

function SectionTeam() {
  const members = [
    {
      initials: 'АБ',
      name: 'Бабынин А.В.',
      role: 'Директор',
      desc: 'Операционное управление, организация работ и безопасность',
    },
    {
      initials: 'ВГ',
      name: 'Голов В.В.',
      role: 'Развитие и методики',
      desc: 'Развитие, лаборатория, методики и метрология',
    },
    {
      initials: 'ВК',
      name: 'Кинзягулов В.А.',
      role: 'Техническая экспертиза',
      desc: 'Техническая экспертиза и проверка отчётов',
    },
  ]

  const checkpoints = [
    'Квалификация под метод и объект',
    'Готовность приборов и метрологических документов',
    'Проверка первичных данных и выводов',
    'Фиксация ограничений до передачи отчёта',
  ]

  return (
    <section style={{ background: C.white, padding: '96px 0' }}>
      <Container>
        <SectionLabel>Команда и качество</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'start' }}>
          <div>
            <h2 style={{
              fontFamily: "'Golos Text', sans-serif", fontWeight: 800,
              fontSize: 'clamp(26px, 3vw, 40px)', lineHeight: 1.1,
              letterSpacing: '-0.025em', color: C.navy, margin: '0 0 24px',
            }}>Персональная ответственность за исполнение и данные</h2>
            <p style={{
              fontFamily: "'Inter', sans-serif", fontSize: 16, lineHeight: 1.7,
              color: '#546E7A', margin: '0 0 40px',
            }}>
              Компания объединяет личный профессиональный опыт участников команды на крупных нефтегазовых объектах. Он является основой подхода, но не заменяет историю контрактов новой компании.
            </p>

            {/* Members */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {members.map((m, i) => (
                <div key={i} style={{
                  display: 'flex', gap: 20, alignItems: 'center',
                  padding: '20px 24px', background: C.bg,
                  borderLeft: `3px solid ${i === 0 ? C.navy : i === 1 ? C.teal : C.graphite}`,
                }}>
                  <div style={{
                    width: 52, height: 52, background: i === 0 ? C.navy : i === 1 ? C.teal : C.graphite,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: "'Golos Text', sans-serif", fontWeight: 700,
                    fontSize: 16, color: C.white, flexShrink: 0,
                    letterSpacing: '-0.01em',
                  }}>{m.initials}</div>
                  <div>
                    <div style={{
                      fontFamily: "'Golos Text', sans-serif", fontWeight: 700,
                      fontSize: 17, color: C.navy, lineHeight: 1.2,
                    }}>{m.name}</div>
                    <div style={{
                      fontFamily: "'Inter', sans-serif", fontSize: 13,
                      color: C.teal, fontWeight: 500, margin: '2px 0 4px',
                    }}>{m.role}</div>
                    <div style={{
                      fontFamily: "'Inter', sans-serif", fontSize: 13,
                      color: '#78909C', lineHeight: 1.5,
                    }}>{m.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <p style={{
              marginTop: 16, fontFamily: "'Inter', sans-serif", fontSize: 12,
              color: '#90A4AE',
            }}>Фотографии участников будут добавлены при наличии согласия</p>
          </div>

          {/* Quality checkpoints */}
          <div>
            <div style={{
              background: C.bg, padding: '40px',
              borderTop: `4px solid ${C.teal}`,
            }}>
              <div style={{
                fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 600,
                letterSpacing: '0.12em', textTransform: 'uppercase' as const,
                color: C.teal, marginBottom: 28,
              }}>Контрольные точки</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {checkpoints.map((cp, i) => (
                  <div key={i} style={{
                    display: 'flex', gap: 16, alignItems: 'flex-start',
                    padding: '18px 0',
                    borderBottom: i < checkpoints.length - 1 ? `1px solid rgba(15,124,129,0.15)` : 'none',
                  }}>
                    <div style={{
                      width: 24, height: 24, background: C.teal,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <svg width="12" height="10" viewBox="0 0 12 10" fill="none" aria-hidden="true">
                        <path d="M1 5 L4.5 8.5 L11 1.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <div style={{
                      fontFamily: "'Inter', sans-serif", fontSize: 16,
                      color: C.graphite, lineHeight: 1.5, fontWeight: 500,
                    }}>{cp}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Industrial image */}
            <div style={{ marginTop: 2, height: 220, overflow: 'hidden', position: 'relative' }}>
              <img
                src="https://images.unsplash.com/photo-1618840626133-54463084a141?w=600&h=300&fit=crop&auto=format"
                alt="Промышленные трубопроводы — иллюстративное изображение"
                style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block', filter: 'grayscale(30%)' }}
              />
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                background: 'rgba(11,45,58,0.6)', padding: '8px 14px',
                fontFamily: "'Inter', sans-serif", fontSize: 11,
                color: 'rgba(255,255,255,0.6)', letterSpacing: '0.06em',
              }}>Иллюстративное изображение</div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}

// ─── Section 8: Market Entry ──────────────────────────────────────────────────

function SectionProjects() {
  const projects = [
    { name: 'Сахалин-1', priority: 1, label: 'Первый приоритет выхода', color: C.navy },
    { name: 'Сахалин-2', priority: 2, label: 'Развитие подрядных отношений', color: C.teal },
    { name: 'Ямал СПГ / Арктик СПГ', priority: 3, label: 'Развитие проектных возможностей', color: C.graphite },
    { name: 'ТШО, Казахстан', priority: 4, label: 'Развитие партнёрского канала', color: '#455A64' },
  ]

  return (
    <section id="projects" style={{ background: C.bg, padding: '96px 0' }}>
      <Container>
        <SectionLabel>Выход на проекты</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'start' }}>
          <div>
            <h2 style={{
              fontFamily: "'Golos Text', sans-serif", fontWeight: 800,
              fontSize: 'clamp(26px, 3vw, 40px)', lineHeight: 1.1,
              letterSpacing: '-0.025em', color: C.navy, margin: '0 0 24px',
            }}>Первый шаг — специализированная работа через действующих подрядчиков</h2>
            <p style={{
              fontFamily: "'Inter', sans-serif", fontSize: 16, lineHeight: 1.7,
              color: '#546E7A', margin: '0 0 24px',
            }}>
              Планируем начинать с задач, для которых генеральным подрядчикам нужны профильные команды, техническая подготовка и проверяемый результат. Расширение связываем с фактическими заказами и условиями оплаты.
            </p>
            <p style={{
              fontFamily: "'Inter', sans-serif", fontSize: 15, lineHeight: 1.7,
              color: '#546E7A',
            }}>
              Основной коммерческий аргумент — подготовленные специалисты, качество данных, технологическая готовность и контроль исполнения.
            </p>
          </div>

          <div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 20 }}>
              {projects.map((p, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 20,
                  padding: '18px 24px', background: C.white,
                  borderLeft: `4px solid ${p.color}`,
                }}>
                  <div style={{
                    fontFamily: "'Golos Text', sans-serif", fontWeight: 900,
                    fontSize: 32, color: p.color, opacity: 0.25,
                    lineHeight: 1, width: 36, flexShrink: 0,
                  }}>{p.priority}</div>
                  <div>
                    <div style={{
                      fontFamily: "'Golos Text', sans-serif", fontWeight: 700,
                      fontSize: 18, color: C.navy,
                    }}>{p.name}</div>
                    <div style={{
                      fontFamily: "'Inter', sans-serif", fontSize: 13,
                      color: '#78909C', marginTop: 2,
                    }}>{p.label}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{
              padding: '16px 20px', background: 'rgba(214,106,44,0.08)',
              borderLeft: `2px solid ${C.orange}`,
            }}>
              <Disclaimer>
                По сведениям учредителей проведены предварительные переговоры. Перечисленные проекты не являются подтверждённым портфелем заказов AIS.
              </Disclaimer>
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}

// ─── Section 9: Economics ─────────────────────────────────────────────────────

function FinancialTable({ scenario }: { scenario: Scenario }) {
  const fmt = (n: number) => {
    const sign = n > 0 ? '+' : n < 0 ? '' : ''
    return `${sign}${n.toFixed(2)}`
  }

  return (
    <div style={{ overflowX: 'auto' as const }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' as const, fontFamily: "'Inter', sans-serif" }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 13, fontWeight: 600, color: '#78909C', borderBottom: `2px solid ${C.tealLight}`, background: C.bg }}>
              Показатель
            </th>
            {YEARS.map(y => (
              <th key={y} style={{
                textAlign: 'right', padding: '12px 16px', fontSize: 13, fontWeight: 700,
                color: C.navy, borderBottom: `2px solid ${C.tealLight}`, background: C.bg,
                minWidth: 100,
              }}>{y}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: `1px solid ${C.tealLight}` }}>
            <td style={{ padding: '16px', fontSize: 15, color: C.graphite }}>Выручка без НДС, млн ₽</td>
            {scenario.revenue.map((v, i) => (
              <td key={i} style={{
                padding: '16px', textAlign: 'right',
                fontFamily: "'Golos Text', sans-serif", fontSize: 22, fontWeight: 700,
                color: C.teal, letterSpacing: '-0.02em',
              }}>{v.toFixed(2)}</td>
            ))}
          </tr>
          <tr>
            <td style={{ padding: '16px', fontSize: 15, color: C.graphite }}>Расчётный результат после УСН, млн ₽</td>
            {scenario.result.map((v, i) => (
              <td key={i} style={{
                padding: '16px', textAlign: 'right',
                fontFamily: "'Golos Text', sans-serif", fontSize: 22, fontWeight: 700,
                color: v < 0 ? C.orange : C.navy, letterSpacing: '-0.02em',
              }}>{fmt(v)}</td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  )
}

function FinancialBars({ scenario }: { scenario: Scenario }) {
  const maxRev = Math.max(...scenario.revenue)
  const CHART_H = 180

  return (
    <div style={{ marginTop: 32 }}>
      <div style={{ display: 'flex', gap: 24 }}>
        {YEARS.map((year, i) => {
          const revH = (scenario.revenue[i] / maxRev) * CHART_H
          const resVal = scenario.result[i]
          const resAbs = Math.abs(resVal)
          const resH = Math.max((resAbs / maxRev) * CHART_H, 3)
          const isNeg = resVal < 0

          return (
            <div key={year} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {/* Values above */}
              <div style={{ textAlign: 'center', marginBottom: 8 }}>
                <div style={{ fontFamily: "'Golos Text', sans-serif", fontSize: 14, fontWeight: 700, color: C.teal }}>{scenario.revenue[i].toFixed(2)}</div>
                <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: isNeg ? C.orange : C.navy, fontWeight: 600 }}>
                  {resVal > 0 ? '+' : ''}{resVal.toFixed(2)}
                </div>
              </div>
              {/* Bars */}
              <div style={{ width: '100%', display: 'flex', gap: 4, alignItems: 'flex-end', height: CHART_H }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '100%' }}>
                  <div style={{ height: revH, background: C.teal, opacity: 0.85 }} title="Выручка" />
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '100%' }}>
                  <div style={{ height: resH, background: isNeg ? C.orange : C.navy }} title="Результат" />
                </div>
              </div>
              {/* Baseline */}
              <div style={{ width: '100%', height: 1, background: C.graphite, opacity: 0.3 }} />
              <div style={{ marginTop: 8, fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 600, color: C.graphite }}>{year}</div>
            </div>
          )
        })}
      </div>
      {/* Legend */}
      <div style={{ display: 'flex', gap: 24, marginTop: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 14, height: 14, background: C.teal, opacity: 0.85 }} />
          <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: '#546E7A' }}>Выручка без НДС</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 14, height: 14, background: C.navy }} />
          <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: '#546E7A' }}>Расчётный результат</span>
        </div>
      </div>
    </div>
  )
}

function SectionEconomics() {
  const [active, setActive] = useState<ScenarioKey>('base')
  const [conditionsOpen, setConditionsOpen] = useState(false)
  const scenario: Scenario = SCENARIOS[active]

  return (
    <section id="economics" style={{ background: C.white, padding: '96px 0' }}>
      <Container>
        <SectionLabel>Экономика проекта</SectionLabel>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 24, marginBottom: 48 }}>
          <h2 style={{
            fontFamily: "'Golos Text', sans-serif", fontWeight: 800,
            fontSize: 'clamp(26px, 3vw, 40px)', lineHeight: 1.1,
            letterSpacing: '-0.025em', color: C.navy, margin: 0, maxWidth: 540,
          }}>Экономика определённой загрузки, а не оценка всего рынка</h2>

          {/* Toggle */}
          <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
            {(['base', 'expanded'] as ScenarioKey[]).map(key => (
              <button key={key} onClick={() => setActive(key)}
                style={{
                  padding: '10px 18px', border: 'none', cursor: 'pointer',
                  fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 500,
                  background: active === key ? C.navy : C.bg,
                  color: active === key ? C.white : C.graphite,
                  transition: 'background 0.2s, color 0.2s',
                }}>
                {SCENARIOS[key].label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 8 }}>
          <div style={{
            fontFamily: "'Inter', sans-serif", fontSize: 12, color: '#78909C',
          }}>Прогноз модели от 12.09.2026 · Суммы в млн ₽</div>
          <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: C.teal, marginTop: 4 }}>
            {scenario.tag}
          </div>
        </div>

        <FinancialTable scenario={scenario} />
        <FinancialBars scenario={scenario} />

        {/* Conditions */}
        <div style={{ marginTop: 40 }}>
          <button onClick={() => setConditionsOpen(o => !o)}
            style={{
              background: 'none', border: `1px solid ${C.tealLight}`,
              cursor: 'pointer', padding: '10px 16px',
              fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 500,
              color: C.teal, display: 'flex', alignItems: 'center', gap: 8,
              transition: 'background 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = C.tealLight)}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <span style={{ transform: conditionsOpen ? 'rotate(90deg)' : 'none', display: 'inline-block', transition: 'transform 0.2s' }}>▶</span>
            Условия расчёта
          </button>
          {conditionsOpen && (
            <div style={{
              padding: '24px', background: C.bg,
              borderLeft: `3px solid ${C.teal}`, marginTop: 2,
              fontFamily: "'Inter', sans-serif",
            }}>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  'PAUT: 365 оплачиваемых дней в год, включая ожидание',
                  'Внутритрубная диагностика: 90 дней в год',
                  '2026 год включает подготовку запуска и два месяца проектных работ',
                  'Результат учитывает амортизацию и УСН, но не проценты по займу и распределение прибыли',
                  'Расчётный результат — не свободные деньги, дивиденды и не гарантированная чистая прибыль',
                ].map((c, i) => (
                  <li key={i} style={{ display: 'flex', gap: 10, fontSize: 14, color: C.graphite, lineHeight: 1.6 }}>
                    <span style={{ color: C.teal, flexShrink: 0 }}>—</span>{c}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div style={{ marginTop: 24 }}>
          <Disclaimer>
            Показатели зависят от загрузки, ставок и окончательного состава затрат. До сделки модель актуализируется по договорам, кадровому расчёту и условиям закупки.
          </Disclaimer>
        </div>
      </Container>
    </section>
  )
}

// ─── Section 10: Financing ────────────────────────────────────────────────────

function SectionFinancing() {
  const [detailsOpen, setDetailsOpen] = useState(false)

  return (
    <section style={{ background: C.bg, padding: '96px 0' }}>
      <Container>
        <SectionLabel>Финансирование</SectionLabel>
        <h2 style={{
          fontFamily: "'Golos Text', sans-serif", fontWeight: 800,
          fontSize: 'clamp(26px, 3vw, 40px)', lineHeight: 1.1,
          letterSpacing: '-0.025em', color: C.navy, margin: '0 0 56px',
        }}>42 млн ₽ на оборудование и прохождение стартового денежного цикла</h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, marginBottom: 32 }}>
          {/* Sources */}
          <div style={{ background: C.white, padding: '36px 32px', borderTop: `4px solid ${C.navy}` }}>
            <div style={{
              fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 600,
              letterSpacing: '0.12em', textTransform: 'uppercase' as const,
              color: '#78909C', marginBottom: 24,
            }}>Схема А — Источники</div>
            {[
              { label: 'Долевой вклад учредителей', amount: '15 млн ₽', color: C.navy },
              { label: 'Заём инвестора', amount: '27 млн ₽', color: C.teal },
            ].map((row, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '16px 0', borderBottom: i === 0 ? `1px solid ${C.bg}` : 'none',
              }}>
                <div style={{
                  display: 'flex', gap: 12, alignItems: 'center',
                  fontFamily: "'Inter', sans-serif", fontSize: 15, color: C.graphite,
                }}>
                  <div style={{ width: 8, height: 8, background: row.color, flexShrink: 0 }} />
                  {row.label}
                </div>
                <div style={{
                  fontFamily: "'Golos Text', sans-serif", fontWeight: 700,
                  fontSize: 22, color: row.color, letterSpacing: '-0.02em',
                }}>{row.amount}</div>
              </div>
            ))}
            <div style={{
              marginTop: 20, paddingTop: 16, borderTop: `2px solid ${C.navy}`,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: 600, color: C.navy }}>Итого</div>
              <div style={{ fontFamily: "'Golos Text', sans-serif", fontWeight: 900, fontSize: 28, color: C.navy, letterSpacing: '-0.03em' }}>42 млн ₽</div>
            </div>
          </div>

          {/* Uses */}
          <div style={{ background: C.white, padding: '36px 32px', borderTop: `4px solid ${C.teal}` }}>
            <div style={{
              fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 600,
              letterSpacing: '0.12em', textTransform: 'uppercase' as const,
              color: '#78909C', marginBottom: 24,
            }}>Схема Б — Направление средств</div>
            {[
              { label: 'Два комплекта SIUI SyncScan 3 (PAUT)', amount: '5 млн ₽', color: C.navy },
              { label: 'Комплект Ectane 3 (диагностика)', amount: '10 млн ₽', color: C.navy },
              { label: 'Запуск, ФОТ, налоги, оборот и резерв', amount: '27 млн ₽', color: C.teal },
            ].map((row, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '12px 0', borderBottom: i < 2 ? `1px solid ${C.bg}` : 'none',
                gap: 16,
              }}>
                <div style={{
                  display: 'flex', gap: 10, alignItems: 'flex-start',
                  fontFamily: "'Inter', sans-serif", fontSize: 14, color: C.graphite, flex: 1, lineHeight: 1.4,
                }}>
                  <div style={{ width: 6, height: 6, background: row.color, flexShrink: 0, marginTop: 5 }} />
                  {row.label}
                </div>
                <div style={{
                  fontFamily: "'Golos Text', sans-serif", fontWeight: 700,
                  fontSize: 18, color: row.color, letterSpacing: '-0.02em', whiteSpace: 'nowrap',
                }}>{row.amount}</div>
              </div>
            ))}
            <div style={{ marginTop: 14 }}>
              <Disclaimer>План закупки. Комплектность и окончательные цены уточняются с поставщиками.</Disclaimer>
            </div>
          </div>
        </div>

        {/* Cash cycle */}
        <div style={{ background: C.white, padding: '32px', borderLeft: `3px solid ${C.teal}`, marginBottom: 24 }}>
          <div style={{
            fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 600,
            letterSpacing: '0.12em', textTransform: 'uppercase' as const,
            color: C.teal, marginBottom: 20,
          }}>Денежный цикл</div>
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            {['Выполнение работ', 'Приёмка и счёт', 'Отсрочка оплаты', 'Поступление денег'].map((step, i, arr) => (
              <>
                <div key={step} style={{
                  padding: '10px 16px', background: i === arr.length - 1 ? C.teal : C.bg,
                  color: i === arr.length - 1 ? C.white : C.graphite,
                  fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: 500,
                }}>{step}</div>
                {i < arr.length - 1 && (
                  <div key={`arr-${i}`} style={{
                    color: C.teal, fontSize: 18, padding: '0 4px',
                    fontWeight: 300,
                  }}>→</div>
                )}
              </>
            ))}
          </div>
          <div style={{ marginTop: 16 }}>
            <Disclaimer>Базовая отсрочка модели — 70 дней от счёта. Затраты на исполнение возникают до оплаты заказчиком.</Disclaimer>
          </div>
        </div>

        {/* Financing comparison */}
        <div style={{ background: C.white, padding: '32px' }}>
          <div style={{
            fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 600,
            color: '#78909C', letterSpacing: '0.08em', textTransform: 'uppercase' as const,
            marginBottom: 20,
          }}>Расчётная потребность по вариантам</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { label: 'Основной вариант с резервом (по модели)', val: 37.65, color: C.navy },
              { label: 'Вариант с шестью инженерами (требует доп. капитала)', val: 47.50, color: '#546E7A' },
              { label: 'Предлагаемое финансирование', val: 42.00, color: C.teal, bold: true },
            ].map((row, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{
                  fontFamily: "'Inter', sans-serif", fontSize: 14,
                  color: C.graphite, flex: 1, lineHeight: 1.4,
                }}>{row.label}</div>
                <div style={{
                  fontFamily: "'Golos Text', sans-serif",
                  fontWeight: row.bold ? 900 : 700, fontSize: row.bold ? 24 : 18,
                  color: row.color, letterSpacing: '-0.02em', whiteSpace: 'nowrap',
                }}>{row.val.toFixed(2)} млн ₽</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 16 }}>
            <Disclaimer>Состав резерва определяется моделью. Это не гарантия трёх месяцев покрытия любых расходов. Временное финансирование возмещаемых перевозок и проживания ещё требует оценки.</Disclaimer>
          </div>
        </div>

        {/* Participation conditions */}
        <div style={{ marginTop: 2 }}>
          <button onClick={() => setDetailsOpen(o => !o)}
            style={{
              width: '100%', background: C.navy, color: C.white,
              border: 'none', cursor: 'pointer', padding: '16px 24px',
              fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: 600,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              transition: 'background 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#0f3b4e')}
            onMouseLeave={e => (e.currentTarget.style.background = C.navy)}
          >
            <span>Предлагаемые условия участия</span>
            <span style={{ transform: detailsOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▾</span>
          </button>
          {detailsOpen && (
            <div style={{ background: C.white, padding: '28px 32px', borderTop: `2px solid ${C.teal}` }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24 }}>
                {[
                  { label: 'Доля инвестора', value: '40%', note: 'Предлагаемая' },
                  { label: 'Доля каждого учредителя', value: '20%', note: '× 3 учредителя' },
                  { label: 'Заём инвестора', value: '27 млн ₽', note: 'Оформляется отдельно' },
                  { label: 'Ставка и график', value: 'По согласованию', note: 'Условия уточняются' },
                ].map((item, i) => (
                  <div key={i} style={{ padding: '16px', background: C.bg }}>
                    <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: '#78909C', marginBottom: 6 }}>{item.label}</div>
                    <div style={{ fontFamily: "'Golos Text', sans-serif", fontSize: 22, fontWeight: 800, color: C.navy, letterSpacing: '-0.02em' }}>{item.value}</div>
                    <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: C.teal, marginTop: 4 }}>{item.note}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 20 }}>
                <Disclaimer>
                  Не вся сумма 42 млн ₽ вносится за долю: 27 млн ₽ оформляются как заём. Срок возврата займа подлежит согласованию.
                </Disclaimer>
              </div>
            </div>
          )}
        </div>
      </Container>
    </section>
  )
}

// ─── Section 11: Launch Plan ──────────────────────────────────────────────────

function SectionLaunch() {
  const milestones = [
    {
      period: 'Октябрь 2026',
      items: ['Организация компании и лаборатории', 'Подготовка специалистов', 'Закупка стартового оборудования PAUT'],
      status: 'start',
    },
    {
      period: 'Ноябрь 2026',
      items: ['Планируемое начало двух программ PAUT при готовности договоров, людей и оборудования'],
      status: 'start',
    },
    {
      period: 'Март 2027',
      items: ['Планируемое начало основной кампании внутритрубной диагностики теплообменников'],
      status: 'mid',
    },
    {
      period: '2027',
      items: ['Стабилизация приёмки отчётов', 'Управление платёжным циклом', 'Повторяемые программы контроля'],
      status: 'mid',
    },
    {
      period: '2027–2028',
      items: ['Инженерное сопровождение', 'Новые проектные заказы', 'Дополнительные кампании при обеспеченной ликвидности'],
      status: 'growth',
    },
    {
      period: 'Дальнейшее развитие',
      items: ['Расширение парка и новых методов после оценки спроса, затрат и квалификационной готовности', 'AE, ACFM, MFL, дистанционные обследования — как развитие, не текущие услуги'],
      status: 'future',
    },
  ]

  const statusColors: Record<string, string> = {
    start: C.navy,
    mid: C.teal,
    growth: '#2196A6',
    future: '#78909C',
  }

  return (
    <section id="launch" style={{ background: C.navy, padding: '96px 0' }}>
      <Container>
        <SectionLabel light>План запуска</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'start' }}>
          <div>
            <h2 style={{
              fontFamily: "'Golos Text', sans-serif", fontWeight: 800,
              fontSize: 'clamp(26px, 3vw, 40px)', lineHeight: 1.1,
              letterSpacing: '-0.025em', color: C.white, margin: '0 0 24px',
            }}>Расширяемся под заказы, а не ради размера компании</h2>

            {/* Timeline */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {milestones.map((m, i) => (
                <div key={i} style={{ display: 'flex', gap: 0 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginRight: 20, flexShrink: 0 }}>
                    <div style={{
                      width: 14, height: 14, borderRadius: '50%',
                      background: statusColors[m.status],
                      border: `2px solid ${statusColors[m.status]}`,
                      flexShrink: 0,
                    }} />
                    {i < milestones.length - 1 && (
                      <div style={{ width: 1, flex: 1, background: 'rgba(255,255,255,0.1)', minHeight: 24 }} />
                    )}
                  </div>
                  <div style={{ paddingBottom: i < milestones.length - 1 ? 28 : 0, paddingTop: 0 }}>
                    <div style={{
                      fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: 12,
                      color: statusColors[m.status], letterSpacing: '0.06em',
                      textTransform: 'uppercase' as const, marginBottom: 6, lineHeight: 1,
                    }}>{m.period}</div>
                    <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {m.items.map((item, j) => (
                        <li key={j} style={{
                          fontFamily: "'Inter', sans-serif", fontSize: 14,
                          color: 'rgba(255,255,255,0.7)', lineHeight: 1.55,
                          display: 'flex', gap: 8,
                        }}>
                          <span style={{ color: 'rgba(255,255,255,0.25)', flexShrink: 0 }}>·</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Checklist */}
          <div>
            <div style={{
              background: 'rgba(255,255,255,0.05)',
              border: `1px solid rgba(15,124,129,0.3)`,
              padding: '36px 32px',
            }}>
              <div style={{
                fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 600,
                letterSpacing: '0.12em', textTransform: 'uppercase' as const,
                color: C.teal, marginBottom: 24,
              }}>Что проверяем до расширения</div>
              {[
                { q: 'Объём и условия заказа', d: 'Подтверждённый спрос на конкретный состав работ' },
                { q: 'Полная стоимость исполнения', d: 'ФОТ, проезд, проживание, расходники, накладные расходы' },
                { q: 'Сроки поступления денег', d: 'Реальная отсрочка и платёжная дисциплина заказчика' },
                { q: 'Готовность специалистов', d: 'Квалификация, допуски, метрологические документы' },
                { q: 'Готовность оборудования', d: 'Наличие, поверка, ЗИП, транспортировка' },
              ].map((item, i) => (
                <div key={i} style={{
                  padding: '16px 0',
                  borderBottom: i < 4 ? '1px solid rgba(255,255,255,0.07)' : 'none',
                }}>
                  <div style={{
                    fontFamily: "'Golos Text', sans-serif", fontWeight: 700,
                    fontSize: 15, color: C.white, marginBottom: 4,
                  }}>{item.q}</div>
                  <div style={{
                    fontFamily: "'Inter', sans-serif", fontSize: 13,
                    color: 'rgba(255,255,255,0.5)', lineHeight: 1.55,
                  }}>{item.d}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}

// ─── Section 12: CTA ──────────────────────────────────────────────────────────

function SectionCTA() {
  const [materialsOpen, setMaterialsOpen] = useState(false)

  return (
    <>
      <section id="contact" style={{ background: C.graphite, padding: '96px 0' }}>
        <Container>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'start' }}>
            <div>
              <SectionLabel light>Предмет встречи</SectionLabel>
              <h2 style={{
                fontFamily: "'Golos Text', sans-serif", fontWeight: 800,
                fontSize: 'clamp(28px, 3.5vw, 48px)', lineHeight: 1.05,
                letterSpacing: '-0.03em', color: C.white, margin: '0 0 24px',
              }}>Обсудим запуск AIS и условия участия</h2>
              <p style={{
                fontFamily: "'Inter', sans-serif", fontSize: 18,
                color: 'rgba(255,255,255,0.65)', lineHeight: 1.65, margin: '0 0 40px',
              }}>
                Предлагаем согласовать стартовую программу, структуру финансирования и условия, при которых проект переходит от подготовки к выполнению работ.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 40 }}>
                {[
                  'Объём первой программы и подрядный канал',
                  'Оборудование и оборотное финансирование',
                  'Условия участия и контроль использования средств',
                ].map((item, i) => (
                  <div key={i} style={{
                    display: 'flex', gap: 14, alignItems: 'flex-start',
                    fontFamily: "'Inter', sans-serif", fontSize: 16,
                    color: 'rgba(255,255,255,0.8)', lineHeight: 1.5,
                  }}>
                    <div style={{
                      width: 24, height: 24, background: C.teal, flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: "'Golos Text', sans-serif", fontWeight: 700, fontSize: 12,
                      color: C.white,
                    }}>{i + 1}</div>
                    {item}
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' as const }}>
                <button
                  onClick={() => {
                    const el = document.createElement('a')
                    el.href = 'mailto:[email]'
                    el.click()
                  }}
                  style={{
                    background: C.teal, color: C.white, border: 'none', cursor: 'pointer',
                    padding: '14px 28px', fontFamily: "'Inter', sans-serif",
                    fontSize: 15, fontWeight: 600, letterSpacing: '0.02em',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#0d6b70')}
                  onMouseLeave={e => (e.currentTarget.style.background = C.teal)}
                >Обсудить условия участия</button>
                <button
                  onClick={() => setMaterialsOpen(true)}
                  style={{
                    background: 'transparent', color: 'rgba(255,255,255,0.75)',
                    border: '1px solid rgba(255,255,255,0.25)',
                    cursor: 'pointer', padding: '14px 28px',
                    fontFamily: "'Inter', sans-serif", fontSize: 15, fontWeight: 500,
                    transition: 'border-color 0.2s, color 0.2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = C.teal; e.currentTarget.style.color = C.white }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'; e.currentTarget.style.color = 'rgba(255,255,255,0.75)' }}
                >Материалы первой встречи</button>
              </div>
            </div>

            {/* Contact info */}
            <div style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              padding: '40px 36px',
            }}>
              <div style={{
                fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 600,
                letterSpacing: '0.12em', textTransform: 'uppercase' as const,
                color: C.teal, marginBottom: 28,
              }}>Контакты</div>
              {[
                { label: 'Контактное лицо', value: '[Контактное лицо]', placeholder: true },
                { label: 'Телефон', value: '[Телефон]', placeholder: true },
                { label: 'Электронная почта', value: '[Электронная почта]', placeholder: true },
              ].map((c, i) => (
                <div key={i} style={{
                  padding: '18px 0',
                  borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.07)' : 'none',
                }}>
                  <div style={{
                    fontFamily: "'Inter', sans-serif", fontSize: 12,
                    color: 'rgba(255,255,255,0.4)', marginBottom: 6, letterSpacing: '0.04em',
                  }}>{c.label}</div>
                  <div style={{
                    fontFamily: "'Inter', sans-serif", fontSize: 16,
                    color: c.placeholder ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.85)',
                    fontStyle: c.placeholder ? 'italic' : 'normal',
                  }}>{c.value}</div>
                </div>
              ))}
              <div style={{ marginTop: 24, padding: '14px 16px', background: 'rgba(15,124,129,0.15)', borderLeft: `2px solid ${C.teal}` }}>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: 0, lineHeight: 1.5 }}>
                  Контактные данные будут добавлены перед передачей материала.
                </p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Materials modal */}
      {materialsOpen && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
            zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 24,
          }}
          onClick={() => setMaterialsOpen(false)}
        >
          <div
            style={{
              background: C.white, maxWidth: 480, width: '100%',
              padding: 40, position: 'relative',
            }}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setMaterialsOpen(false)}
              style={{
                position: 'absolute', top: 16, right: 16,
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 20, color: '#78909C', lineHeight: 1,
              }}
              aria-label="Закрыть">×</button>
            <div style={{ fontFamily: "'Golos Text', sans-serif", fontWeight: 800, fontSize: 22, color: C.navy, marginBottom: 16 }}>
              Материалы первой встречи
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
              {[
                'Инвестиционное резюме (PDF)',
                'Финансовая модель (таблица)',
                'Технический обзор методов',
                'Команда и квалификация',
              ].map((item, i) => (
                <div key={i} style={{
                  display: 'flex', gap: 12, alignItems: 'center',
                  padding: '12px 16px', background: C.bg,
                  fontFamily: "'Inter', sans-serif", fontSize: 15, color: C.graphite,
                }}>
                  <div style={{ width: 6, height: 6, background: '#B0BEC5', borderRadius: '50%', flexShrink: 0 }} />
                  {item}
                </div>
              ))}
            </div>
            <div style={{
              padding: '14px 16px', background: C.tealLight,
              borderLeft: `3px solid ${C.teal}`,
              fontFamily: "'Inter', sans-serif", fontSize: 14, color: '#546E7A', lineHeight: 1.5,
            }}>
              Файлы будут добавлены при подготовке к встрече.
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer style={{ background: C.navy, padding: '48px 0 40px' }}>
      <Container>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'flex-start', flexWrap: 'wrap', gap: 32,
          paddingBottom: 32, borderBottom: '1px solid rgba(255,255,255,0.08)',
          marginBottom: 24,
        }}>
          <div>
            <AISLogo light />
            <div style={{
              fontFamily: "'Inter', sans-serif", fontSize: 13,
              color: 'rgba(255,255,255,0.4)', marginTop: 16, lineHeight: 1.6,
            }}>
              Инженерная подготовка. Специализированный контроль. Проверенные данные.
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
              Для обсуждения с инвестором
            </div>
            <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>
              Редакция 12.09.2026
            </div>
          </div>
        </div>
        <div style={{
          fontFamily: "'Inter', sans-serif", fontSize: 11,
          color: 'rgba(255,255,255,0.2)', lineHeight: 1.6,
        }}>
          Настоящий материал подготовлен для адресной демонстрации потенциальным инвесторам и стратегическим партнёрам. Содержащиеся данные являются плановыми и прогнозными. Юридическое лицо AIS — Asset Integrity Systems находится в стадии регистрации.
        </div>
      </Container>
    </footer>
  )
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <div>
      <Navigation />
      <main>
        <SectionHero />
        <SectionProblem />
        <SectionApproach />
        <SectionServices />
        <SectionTasks />
        <SectionProgram />
        <SectionTeam />
        <SectionProjects />
        <SectionEconomics />
        <SectionFinancing />
        <SectionLaunch />
        <SectionCTA />
      </main>
      <Footer />
    </div>
  )
}
