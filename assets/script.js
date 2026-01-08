const player = document.getElementById('videoPlayer')
const sourceEl = document.getElementById('videoSource')
const playPauseBtn = document.getElementById('playPauseBtn')
const muteBtn = document.getElementById('muteBtn')
const volumeRange = document.getElementById('volumeRange')
const rateSelect = document.getElementById('rateSelect')
const seekRange = document.getElementById('seekRange')
const timeLabel = document.getElementById('timeLabel')
const rowsEl = document.getElementById('rows')
const hero = document.getElementById('hero')
const heroTitle = document.getElementById('heroTitle')
const heroDesc = document.getElementById('heroDesc')
const heroPlayBtn = document.getElementById('heroPlayBtn')
const heroMoreBtn = document.getElementById('heroMoreBtn')
const searchInput = document.getElementById('searchInput')
const themeToggle = document.getElementById('themeToggle')
const agentCanvas = document.getElementById('agentCanvas')
const chatArea = document.getElementById('chatArea')
const chatInput = document.getElementById('chatInput')
const sendBtn = document.getElementById('sendBtn')
const micBtn = document.getElementById('micBtn')
const suggestBtns = document.querySelectorAll('.agent-suggest')

let DB = { categories: [] }
let allVideos = []
let filteredVideos = []
let currentIndex = 0
let featured = null

function formatTime(s) {
  const m = Math.floor(s / 60)
  const r = Math.floor(s % 60)
  return `${String(m).padStart(2,'0')}:${String(r).padStart(2,'0')}`
}
function updateTime() {
  const cur = player.currentTime || 0
  const dur = player.duration || 0
  timeLabel.textContent = `${formatTime(cur)} / ${dur ? formatTime(dur) : '00:00'}`
  const pct = dur ? (cur / dur) * 100 : 0
  seekRange.value = pct
  seekRange.style.setProperty('--progress', `${pct}%`)
}
function renderRows() {
  rowsEl.innerHTML = ''
  DB.categories.forEach(cat => {
    const section = document.createElement('section')
    section.className = 'my-2'
    section.setAttribute('data-cat', cat.name)
    const title = document.createElement('h5')
    title.className = 'row-title px-3'
    title.textContent = cat.name
    const scroller = document.createElement('div')
    scroller.className = 'row-scroll'
    cat.videos.forEach((v) => {
      const card = document.createElement('div')
      card.className = 'card video-card'
      card.style.width = '16rem'
      const poster = document.createElement('div')
      poster.className = 'card-poster'
      poster.style.backgroundImage = `url("${v.poster}")`
      const body = document.createElement('div')
      body.className = 'card-body'
      const h = document.createElement('h6')
      h.className = 'card-title'
      h.textContent = v.title
      body.appendChild(h)
      card.appendChild(poster)
      card.appendChild(body)
      card.addEventListener('click', () => loadVideoDirect(v))
      scroller.appendChild(card)
    })
    section.appendChild(title)
    section.appendChild(scroller)
    rowsEl.appendChild(section)
  })
}
function loadVideoDirect(v) {
  sourceEl.src = v.url
  player.load()
  player.play()
  playPauseBtn.textContent = 'Pause'
  pushAgentMsg(`Playing ${target.title}`, 'agent')
}
function loadVideoByIndex(index) {
  const v = filteredVideos[index]
  if (!v) return
  loadVideoDirect(v)
}
function initPlayer() {
  player.volume = parseFloat(volumeRange.value)
  player.playbackRate = parseFloat(rateSelect.value)
  updateTime()
}
function togglePlay() {
  if (player.paused) {
    player.play()
    playPauseBtn.textContent = 'Pause'
  } else {
    player.pause()
    playPauseBtn.textContent = 'Play'
  }
}
function toggleMute() {
  player.muted = !player.muted
  muteBtn.textContent = player.muted ? 'Unmute' : 'Mute'
}
function seekToPercent(pct) {
  const dur = player.duration || 0
  if (!dur) return
  player.currentTime = (pct / 100) * dur
}
function searchVideos(q) {
  const n = q.trim().toLowerCase()
  filteredVideos = allVideos.filter(v =>
    v.title.toLowerCase().includes(n) ||
    v.tags.some(t => t.includes(n))
  )
  renderSearchRow(n)
}
function renderSearchRow(term) {
  const existing = document.getElementById('search-row')
  if (existing) existing.remove()
  if (!term) return
  const section = document.createElement('section')
  section.id = 'search-row'
  const title = document.createElement('h5')
  title.className = 'row-title px-3'
  title.textContent = `Search: ${term} (${filteredVideos.length})`
  const scroller = document.createElement('div')
  scroller.className = 'row-scroll'
  filteredVideos.forEach(v => {
    const card = document.createElement('div')
    card.className = 'card video-card'
    card.style.width = '16rem'
    const poster = document.createElement('div')
    poster.className = 'card-poster'
    poster.style.backgroundImage = `url("${v.poster}")`
    const body = document.createElement('div')
    body.className = 'card-body'
    const h = document.createElement('h6')
    h.className = 'card-title'
    h.textContent = v.title
    body.appendChild(h)
    card.appendChild(poster)
    card.appendChild(body)
    card.addEventListener('click', () => loadVideoDirect(v))
    scroller.appendChild(card)
  })
  section.appendChild(title)
  section.appendChild(scroller)
  rowsEl.prepend(section)
}
function pushAgentMsg(text, role) {
  const wrapper = document.createElement('div')
  wrapper.className = `d-flex ${role === 'user' ? 'justify-content-end' : 'justify-content-start'} my-2`
  const bubble = document.createElement('div')
  bubble.className = `chat-msg ${role}`
  bubble.textContent = text
  wrapper.appendChild(bubble)
  chatArea.appendChild(wrapper)
  chatArea.scrollTop = chatArea.scrollHeight
  if (role === 'agent') speakText(text)
}
function parseCommand(cmd) {
  const t = cmd.trim().toLowerCase()
  if (!t) return pushAgentMsg('Say something like: play, pause, find demo, volume 60', 'agent')
  if (t === 'play') { player.play(); playPauseBtn.textContent = 'Pause'; return pushAgentMsg('Playing', 'agent') }
  if (t === 'pause') { player.pause(); playPauseBtn.textContent = 'Play'; return pushAgentMsg('Paused', 'agent') }
  if (t.startsWith('find ')) { const q = t.replace('find ',''); searchInput.value = q; searchVideos(q); return pushAgentMsg(`Found ${filteredVideos.length} result(s) for "${q}"`, 'agent') }
  if (t.startsWith('open ')) {
    const name = t.replace('open ','').trim()
    const v = allVideos.find(v => v.title.toLowerCase().includes(name))
    if (v) { loadVideoDirect(v); return }
    return pushAgentMsg('Not found', 'agent')
  }
  if (t.startsWith('show ')) {
    const catName = t.replace('show ','').trim()
    const cat = DB.categories.find(c => c.name.toLowerCase().includes(catName))
    if (!cat) return pushAgentMsg('Category not found', 'agent')
    const existing = document.querySelector(`[data-cat="${cat.name}"]`)
    if (existing) existing.scrollIntoView({ behavior: 'smooth', block: 'start' })
    return pushAgentMsg(`Showing ${cat.name}`, 'agent')
  }
  if (t.startsWith('volume ')) {
    const n = parseInt(t.replace('volume ','').trim(), 10)
    const val = Math.min(100, Math.max(0, isNaN(n) ? 70 : n))
    volumeRange.value = (val/100).toFixed(2)
    player.volume = parseFloat(volumeRange.value)
    return pushAgentMsg(`Volume ${val}%`, 'agent')
  }
  if (t === 'mute') { player.muted = true; muteBtn.textContent = 'Unmute'; return pushAgentMsg('Muted', 'agent') }
  if (t.startsWith('speed ')) {
    const f = parseFloat(t.replace('speed ','').trim())
    player.playbackRate = isNaN(f) ? 1 : Math.min(2, Math.max(0.5, f))
    rateSelect.value = String(player.playbackRate)
    return pushAgentMsg(`Speed ${player.playbackRate}x`, 'agent')
  }
  if (t.includes('dark')) { setTheme('dark'); return pushAgentMsg('Dark mode on', 'agent') }
  if (t.includes('light')) { setTheme('light'); return pushAgentMsg('Light mode on', 'agent') }
  return pushAgentMsg('Unknown command', 'agent')
}
function speakText(text) {
  const supported = 'speechSynthesis' in window
  if (!supported) return
  const u = new SpeechSynthesisUtterance(text)
  u.rate = 1
  u.pitch = 1
  speechSynthesis.cancel()
  speechSynthesis.speak(u)
}
function toggleMic() {
  const ok = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window
  if (!ok) return pushAgentMsg('Microphone not supported in this browser', 'agent')
  const Rec = window.SpeechRecognition || window.webkitSpeechRecognition
  const rec = new Rec()
  rec.lang = 'en-US'
  rec.interimResults = false
  rec.maxAlternatives = 1
  rec.onresult = (e) => {
    const t = e.results[0][0].transcript
    pushAgentMsg(t, 'user')
    parseCommand(t)
  }
  rec.onerror = () => pushAgentMsg('Mic error', 'agent')
  rec.start()
  pushAgentMsg('Listening...', 'agent')
}
function setTheme(mode) {
  const html = document.documentElement
  html.setAttribute('data-bs-theme', mode)
  localStorage.setItem('theme', mode)
}
function initTheme() {
  const saved = localStorage.getItem('theme')
  if (saved) setTheme(saved)
}
function initTooltips() {
  if (window.bootstrap) {
    const t = document.querySelectorAll('[data-bs-toggle="tooltip"]')
    t.forEach(el => new bootstrap.Tooltip(el))
  }
}
function initShortcuts() {
  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
    if (e.code === 'Space') { e.preventDefault(); togglePlay() }
    if (e.code === 'ArrowRight') { player.currentTime += 5 }
    if (e.code === 'ArrowLeft') { player.currentTime -= 5 }
    if (e.code === 'ArrowUp') { player.volume = Math.min(1, player.volume + 0.05); volumeRange.value = player.volume }
    if (e.code === 'ArrowDown') { player.volume = Math.max(0, player.volume - 0.05); volumeRange.value = player.volume }
    if (e.key.toLowerCase() === 'm') { toggleMute() }
  })
}
playPauseBtn.addEventListener('click', togglePlay)
muteBtn.addEventListener('click', toggleMute)
volumeRange.addEventListener('input', () => player.volume = parseFloat(volumeRange.value))
rateSelect.addEventListener('change', () => player.playbackRate = parseFloat(rateSelect.value))
seekRange.addEventListener('input', () => seekToPercent(parseFloat(seekRange.value)))
player.addEventListener('timeupdate', updateTime)
player.addEventListener('loadedmetadata', updateTime)
player.addEventListener('ended', () => {
  const next = (currentIndex + 1) % filteredVideos.length
  loadVideo(next)
})
searchInput.addEventListener('input', (e) => searchVideos(e.target.value))
themeToggle.addEventListener('click', () => {
  const cur = document.documentElement.getAttribute('data-bs-theme') || 'light'
  setTheme(cur === 'light' ? 'dark' : 'light')
})
sendBtn.addEventListener('click', () => {
  const t = chatInput.value
  if (!t.trim()) return
  pushAgentMsg(t, 'user')
  chatInput.value = ''
  parseCommand(t)
})
chatInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    sendBtn.click()
  }
})
micBtn.addEventListener('click', toggleMic)
suggestBtns.forEach(b => b.addEventListener('click', () => parseCommand(b.textContent)))

async function loadDB() {
  try {
    const res = await fetch('assets/videos.json')
    DB = await res.json()
    allVideos = DB.categories.flatMap(c => c.videos)
    featured = DB.featured || allVideos[0]
    if (featured?.backdrop) {
      hero.style.backgroundImage = `url("${featured.backdrop}")`
    }
    heroTitle.textContent = featured?.title || 'Featured'
    heroDesc.textContent = featured?.description || 'Enjoy streaming.'
    heroPlayBtn.addEventListener('click', () => loadVideoDirect(featured))
    renderRows()
    loadVideoDirect(featured)
  } catch {
    pushAgentMsg('Failed to load database', 'agent')
  }
}

initTheme()
initTooltips()
initShortcuts()
initPlayer()
loadDB()
