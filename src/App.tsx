import { useEffect, useMemo, useState, type CSSProperties, type FormEvent } from 'react'
import { AnimatePresence, motion, useScroll, useTransform } from 'framer-motion'
import heroImg from './assets/image.png'
import './App.css'

type Participant = {
  id: string
  name: string
  isUser?: boolean
}

type CountdownValue = {
  days: number
  hours: number
  minutes: number
  seconds: number
}

const STORAGE_KEYS = {
  participants: 'hornsbergs-participants',
  userName: 'hornsbergs-user-name',
  hasSaidYes: 'hornsbergs-has-said-yes',
  latest: 'hornsbergs-latest',
  version: 'hornsbergs-storage-version',
}

const seedParticipants: Participant[] = [
  { id: 'leo', name: 'Leo' },
]

const storageVersion = 'leo-only-start-v1'

const noComments = [
  'Är du säker? 🤨',
  'Kom igen nu... 🍺',
  'Det blir kul😎',
  'Du vet att du vill 👀',
  'Bad + öl = succé 🍻',
]

const floatingItems = ['🍺', '☀️', '🌊', '🍻', '🕶️', '💦', '🍺', '✨']

function getEventDate() {
  const eventDate = new Date('2026-06-27T14:00:00+02:00')

  if (Date.now() <= eventDate.getTime()) {
    return eventDate
  }

  const nextSaturday = new Date()
  const daysUntilSaturday = (6 - nextSaturday.getDay() + 7) % 7 || 7
  nextSaturday.setDate(nextSaturday.getDate() + daysUntilSaturday)
  nextSaturday.setHours(14, 0, 0, 0)

  return nextSaturday
}

function getCountdown(targetDate: Date): CountdownValue {
  const difference = Math.max(0, targetDate.getTime() - Date.now())

  return {
    days: Math.floor(difference / 86_400_000),
    hours: Math.floor((difference / 3_600_000) % 24),
    minutes: Math.floor((difference / 60_000) % 60),
    seconds: Math.floor((difference / 1_000) % 60),
  }
}

function sanitizeName(name: string) {
  return name.trim().replace(/\s+/g, ' ')
}

function withBeer(name: string) {
  return /[\u{1F300}-\u{1FAFF}]/u.test(name) ? name : `${name} 🍻`
}

function FloatingBackground() {
  return (
    <div className="floating-background" aria-hidden="true">
      {floatingItems.map((item, index) => (
        <motion.span
          animate={{ y: ['12vh', '-112vh'], rotate: [0, 12, -8, 0] }}
          className="floaty"
          initial={{ y: '16vh' }}
          key={`${item}-${index}`}
          transition={{
            delay: index * 1.1,
            duration: 13 + index * 1.6,
            ease: 'linear',
            repeat: Infinity,
          }}
          style={{ left: `${7 + index * 12}%` }}
        >
          {item}
        </motion.span>
      ))}
    </div>
  )
}

function ConfettiBurst({ nonce }: { nonce: number }) {
  if (!nonce) {
    return null
  }

  return (
    <div className="confetti-layer" aria-hidden="true">
      {Array.from({ length: 30 }, (_, index) => (
        <motion.span
          animate={{
            opacity: [1, 1, 0],
            rotate: [0, 180 + index * 16],
            x: `${Math.cos(index) * (90 + index * 4)}px`,
            y: `${Math.sin(index * 1.7) * 90 + 190}px`,
          }}
          className="confetti-piece"
          initial={{ opacity: 0, x: 0, y: 0 }}
          key={`${nonce}-${index}`}
          transition={{ duration: 1.35, ease: 'easeOut' }}
        />
      ))}
    </div>
  )
}

function BeerStorm({ nonce }: { nonce: number }) {
  if (!nonce) {
    return null
  }

  return (
    <div className="beer-storm" aria-hidden="true">
      {Array.from({ length: 72 }, (_, index) => {
        const column = index % 12
        const row = Math.floor(index / 12)
        const startX = 4 + column * 8 + (row % 2) * 3
        const drift = (column - 5.5) * 18

        return (
          <motion.span
            animate={{
              opacity: [0, 1, 1, 0],
              rotate: [0, column % 2 ? 28 : -28, column % 2 ? -16 : 16],
              scale: [0.65, 1.25, 0.9],
              x: [0, drift, drift * 1.35],
              y: ['105vh', `${18 + row * 7}vh`, '-24vh'],
            }}
            className="beer-drop"
            initial={{ opacity: 0 }}
            key={`${nonce}-${index}`}
            style={{ left: `${startX}%` }}
            transition={{
              delay: row * 0.05 + column * 0.018,
              duration: 2.35 + row * 0.14,
              ease: 'easeOut',
            }}
          >
            🍺
          </motion.span>
        )
      })}
    </div>
  )
}

function Hero({ participantCount }: { participantCount: number }) {
  const { scrollY } = useScroll()
  const imageY = useTransform(scrollY, [0, 600], [0, 110])

  return (
    <section className="hero-section">
      <motion.img
        alt="Hornsbergs Strand i Stockholm"
        className="hero-image"
        src={heroImg}
        style={{ y: imageY }}
      />
      <div className="hero-shade" />
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="hero-content"
        initial={{ opacity: 0, y: 24 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        <motion.p
          animate={{ scale: [1, 1.035, 1] }}
          className="legend-count"
          transition={{ duration: 2.6, repeat: Infinity }}
        >
          🔥 {participantCount} antal legender har redan tackat ja
        </motion.p>
        <h1>🍻 Bad &amp; Bärs på Hornsbergs Strand 🍻</h1>
        <p className="hero-subtitle">
          Sol, bad, kalla öl och skönt häng. Hänger du med på lördag?
        </p>
        <div className="hero-facts" aria-label="Eventinformation">
          <span>📍 Hornsbergs Strand</span>
          <span>🕒 Lördag kl. 14:00</span>
          <span>☀️ Ta med badkläder och bra humör</span>
        </div>
      </motion.div>
    </section>
  )
}

function Countdown({ targetDate }: { targetDate: Date }) {
  const [countdown, setCountdown] = useState(() => getCountdown(targetDate))

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCountdown(getCountdown(targetDate))
    }, 1000)

    return () => window.clearInterval(timer)
  }, [targetDate])

  return (
    <motion.section
      className="highlight-section"
      initial={{ opacity: 0, y: 28 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true, amount: 0.45 }}
      whileInView={{ opacity: 1, y: 0 }}
    >
      <p className="eyebrow">Affärskritiskt badfönster</p>
      <h2>
        ⏳ {countdown.days} dagar, {countdown.hours} timmar,{' '}
        {countdown.minutes} minuter och {countdown.seconds} sekunder kvar
      </h2>
    </motion.section>
  )
}

function LatestSignup({ latest }: { latest: string }) {
  return (
    <motion.section
      className="latest-section glass-panel"
      layout
      initial={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.55 }}
      viewport={{ once: true, amount: 0.5 }}
      whileInView={{ opacity: 1, y: 0 }}
    >
      <p>🎉 Senast anmäld:</p>
      <AnimatePresence mode="wait">
        <motion.strong
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -12, scale: 0.96 }}
          initial={{ opacity: 0, y: 12, scale: 0.96 }}
          key={latest}
          transition={{ duration: 0.25 }}
        >
          {latest}
        </motion.strong>
      </AnimatePresence>
    </motion.section>
  )
}

function SignupSection({
  hasSaidYes,
  name,
  noCount,
  noMessage,
  onNameChange,
  onNo,
  onSubmit,
  participants,
}: {
  hasSaidYes: boolean
  name: string
  noCount: number
  noMessage: string
  onNameChange: (name: string) => void
  onNo: () => void
  onSubmit: () => void
  participants: Participant[]
  userName: string
}) {
  const yesScale = 1 + noCount * 0.15
  const noScale = Math.max(0.32, 1 - noCount * 0.15)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSubmit()
  }

  return (
    <section className="signup-grid">
      <motion.div
        className="signup-card glass-panel"
        initial={{ opacity: 0, x: -24 }}
        transition={{ duration: 0.55 }}
        viewport={{ once: true, amount: 0.4 }}
        whileInView={{ opacity: 1, x: 0 }}
      >
        <h2>✅ Anmälda legender</h2>
        <form className="signup-form" onSubmit={handleSubmit}>
          <label htmlFor="name">Namn</label>
          <div className="input-row">
            <input
              autoComplete="name"
              id="name"
              onChange={(event) => onNameChange(event.target.value)}
              placeholder="Skriv ditt namn"
              type="text"
              value={name}
            />
            <motion.button
              className="primary-button compact"
              type="submit"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.96 }}
            >
              Ja, jag kommer!
            </motion.button>
          </div>
        </form>
        {hasSaidYes && (
          <motion.p
            animate={{ opacity: 1, y: 0 }}
            className="already-in"
            initial={{ opacity: 0, y: 8 }}
          >
            ✅ Du är redan anmäld, legend.
          </motion.p>
        )}
        <motion.div className="participant-list" layout>
          <AnimatePresence>
            {participants.map((participant) => (
              <motion.article
                className={participant.isUser ? 'participant-card you' : 'participant-card'}
                initial={{ opacity: 0, scale: 0.9, y: 16 }}
                key={participant.id}
                layout
                transition={{ type: 'spring', stiffness: 420, damping: 28 }}
                whileHover={{ y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
              >
                <span>
                  {participant.name}
                  {participant.isUser ? ' (Du)' : ''}
                </span>
              </motion.article>
            ))}
          </AnimatePresence>
        </motion.div>
      </motion.div>

      <motion.div
        className="decision-card glass-panel"
        initial={{ opacity: 0, x: 24 }}
        transition={{ duration: 0.55, delay: 0.1 }}
        viewport={{ once: true, amount: 0.4 }}
        whileInView={{ opacity: 1, x: 0 }}
      >
        <p className="eyebrow">Executive decision center</p>
        <h2>Det finns egentligen bara ett rimligt val.</h2>
        <div className="choice-buttons">
          <motion.button
            animate={{ scale: yesScale }}
            className="primary-button huge"
            onClick={onSubmit}
            type="button"
            whileHover={{ y: -3 }}
            whileTap={{ scale: yesScale * 0.96 }}
          >
            Ja, jag kommer! 😎
          </motion.button>
          <motion.button
            animate={{ scale: noScale, rotate: noCount ? [0, -2, 2, 0] : 0 }}
            className="secondary-button huge"
            onClick={onNo}
            type="button"
            transition={{ type: 'spring', stiffness: 380, damping: 12 }}
            whileHover={{ y: -2 }}
            whileTap={{ scale: noScale * 0.94 }}
          >
            Nej, jag kan inte 😢
          </motion.button>
        </div>
        <AnimatePresence mode="wait">
          {noMessage && (
            <motion.p
              animate={{ opacity: 1, y: 0 }}
              className="no-message"
              exit={{ opacity: 0, y: -8 }}
              initial={{ opacity: 0, y: 8 }}
              key={noMessage}
            >
              {noMessage}
            </motion.p>
          )}
        </AnimatePresence>
        <p className="fine-print">
          Nej knappen är juridiskt bindande.
        </p>
      </motion.div>
    </section>
  )
}

function GrumpModal({ onClose, show }: { onClose: () => void; show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          animate={{ opacity: 1 }}
          className="modal-backdrop"
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
        >
          <div className="modal-confetti" aria-hidden="true">
            {Array.from({ length: 42 }, (_, index) => (
              <span
                key={index}
                style={
                  {
                    '--fall-delay': `${(index % 9) * 0.18}s`,
                    '--fall-left': `${(index * 23) % 100}%`,
                  } as CSSProperties
                }
              />
            ))}
          </div>
          <motion.div
            animate={{ scale: 1, y: 0 }}
            className="modal-card"
            exit={{ scale: 0.94, y: 24 }}
            initial={{ scale: 0.94, y: 24 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
          >
            <motion.div
              animate={{ rotate: [-4, 4, -4] }}
              className="shaking-emoji"
              transition={{ duration: 0.18, repeat: Infinity }}
            >
              💩
            </motion.div>
            <h2>Tråkmåns! 💩</h2>
            <p>Att säga nej fem gånger i rad är faktiskt imponerande.</p>
            <motion.button
              className="primary-button huge"
              onClick={onClose}
              type="button"
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.96 }}
            >
              👉 Okej då, jag kommer 😎
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function Waves() {
  return (
    <footer className="wave-footer" aria-hidden="true">
      <div className="wave wave-one" />
      <div className="wave wave-two" />
      <div className="bubble-field">
        {Array.from({ length: 18 }, (_, index) => (
          <span
            key={index}
            style={
              {
                '--bubble-delay': `${(index % 7) * -0.58}s`,
                '--bubble-left': `${(index * 17) % 100}%`,
              } as CSSProperties
            }
          />
        ))}
      </div>
    </footer>
  )
}

function App() {
  const eventDate = useMemo(() => getEventDate(), [])
  const [participants, setParticipants] = useState<Participant[]>(seedParticipants)
  const [name, setName] = useState('')
  const [userName, setUserName] = useState('')
  const [hasSaidYes, setHasSaidYes] = useState(false)
  const [latest, setLatest] = useState('Leo')
  const [noCount, setNoCount] = useState(0)
  const [noMessage, setNoMessage] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [confettiNonce, setConfettiNonce] = useState(0)

  /* eslint-disable react-hooks/set-state-in-effect -- localStorage is the source of truth restored on first mount. */
  useEffect(() => {
    const savedVersion = window.localStorage.getItem(STORAGE_KEYS.version)

    if (savedVersion !== storageVersion) {
      window.localStorage.removeItem(STORAGE_KEYS.participants)
      window.localStorage.removeItem(STORAGE_KEYS.userName)
      window.localStorage.removeItem(STORAGE_KEYS.hasSaidYes)
      window.localStorage.removeItem(STORAGE_KEYS.latest)
      window.localStorage.setItem(STORAGE_KEYS.version, storageVersion)
      return
    }

    const savedParticipants = window.localStorage.getItem(STORAGE_KEYS.participants)
    const savedUserName = window.localStorage.getItem(STORAGE_KEYS.userName) ?? ''
    const savedHasSaidYes = window.localStorage.getItem(STORAGE_KEYS.hasSaidYes) === 'true'
    const savedLatest = window.localStorage.getItem(STORAGE_KEYS.latest)

    if (savedParticipants) {
      try {
        const parsedParticipants = JSON.parse(savedParticipants) as Participant[]
        setParticipants(parsedParticipants)
      } catch {
        setParticipants(seedParticipants)
      }
    }

    if (savedUserName) {
      setName(savedUserName)
      setUserName(savedUserName)
    }

    if (savedHasSaidYes) {
      setHasSaidYes(true)
    }

    if (savedLatest) {
      setLatest(savedLatest)
    }
  }, [])
  /* eslint-enable react-hooks/set-state-in-effect */

  function sayYes(sourceName = name) {
    const cleanName = sanitizeName(sourceName) || 'Namnlös legend'
    const displayName = withBeer(cleanName)
    const participantId = `you-${cleanName.toLowerCase()}`

    setParticipants((currentParticipants) => {
      const withoutPreviousUser = currentParticipants.filter((participant) => !participant.isUser)

      return [
        ...withoutPreviousUser,
        {
          id: participantId,
          isUser: true,
          name: displayName,
        },
      ]
    })

    setName(cleanName)
    setUserName(cleanName)
    setHasSaidYes(true)
    setLatest(displayName)
    setConfettiNonce((current) => current + 1)

    window.localStorage.setItem(STORAGE_KEYS.userName, cleanName)
    window.localStorage.setItem(STORAGE_KEYS.hasSaidYes, 'true')
    window.localStorage.setItem(STORAGE_KEYS.latest, displayName)
    window.localStorage.setItem(STORAGE_KEYS.version, storageVersion)
    window.localStorage.setItem(
      STORAGE_KEYS.participants,
      JSON.stringify([
        ...seedParticipants,
        {
          id: participantId,
          isUser: true,
          name: displayName,
        },
      ]),
    )
  }

  function handleNo() {
    const nextNoCount = noCount + 1
    const nextComment = noComments[Math.floor(Math.random() * noComments.length)]

    setNoCount(nextNoCount)
    setNoMessage(nextComment)

    if (nextNoCount >= 5) {
      setShowModal(true)
      setConfettiNonce((current) => current + 1)
    }
  }

  function acceptFromModal() {
    setShowModal(false)
    sayYes()
  }

  return (
    <main>
      <FloatingBackground />
      <ConfettiBurst nonce={confettiNonce} />
      <BeerStorm nonce={confettiNonce} />
      <Hero participantCount={participants.length} />
      <div className="content-shell">
        <Countdown targetDate={eventDate} />
        <LatestSignup latest={latest} />
        <SignupSection
          hasSaidYes={hasSaidYes}
          name={name}
          noCount={noCount}
          noMessage={noMessage}
          onNameChange={setName}
          onNo={handleNo}
          onSubmit={() => sayYes()}
          participants={participants}
          userName={userName}
        />
      </div>
      <Waves />
      <GrumpModal onClose={acceptFromModal} show={showModal} />
    </main>
  )
}

export default App
