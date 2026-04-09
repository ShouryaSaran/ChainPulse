import React from 'react'
import { Link } from 'react-router-dom'

const LandingPage = ({ onLaunchDemo }) => {
  return (
    <div className="bg-surface text-on-background selection:bg-primary-container selection:text-on-primary-container dark min-h-screen w-full overflow-x-hidden overflow-y-visible">
      <nav className="fixed top-0 w-full z-50 bg-[#0b1326]/80 backdrop-blur-xl shadow-[0_20px_40px_rgba(6,14,32,0.4)]">
        <div className="flex justify-between items-center h-20 px-8 max-w-screen-2xl mx-auto">
          <div className="text-2xl font-black tracking-tighter text-[#4cd6ff] uppercase font-headline">ChainPulse</div>
          <div className="hidden md:flex gap-10">
            <a className="font-headline font-bold tracking-tight text-slate-400 hover:text-white transition-colors" href="#features">Features</a>
            <a className="font-headline font-bold tracking-tight text-slate-400 hover:text-white transition-colors" href="#how-it-works">How it Works</a>
            <a className="font-headline font-bold tracking-tight text-slate-400 hover:text-white transition-colors" href="#api-docs">API Docs</a>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="px-5 py-2 text-sm font-semibold text-slate-500 hover:text-slate-300 transition-all font-label uppercase tracking-widest"
            >
              Log In
            </Link>
            <Link
              to="/signup"
              className="bg-gradient-to-br from-primary to-primary-container text-on-primary px-6 py-2.5 rounded-xl font-bold text-sm transition-all hover:scale-105 active:scale-95 shadow-lg shadow-primary/20"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      <main className="pt-24">
        <section className="relative min-h-[870px] flex items-center overflow-hidden px-8">
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-gradient-to-r from-surface via-surface/80 to-transparent z-10"></div>
            <img
              className="w-full h-full object-cover opacity-40"
              alt="Dark blue world map with glowing data connection lines and digital particle effects representing global logistics network"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDj6hsfAOOgHHxKhl8QVSxfRfLWMKeEGG53QF7Ct0R_1pJzxlIvImpgyIukUYbPAAhyYWqod3_ujQYWEXpHDznDd7ddI-MVMar_mhREaPEeZint05b1JhifWQ1bO_KW53Tr9q0xeGgxg72by4spVhAIyMW8XCmJjJjmMypCbZgHBIjuj2UHLpXGlhq1cwdpkWyru9qNxQHP0-tHw665vi2fJ-lM1GFvxiLePyaQMVADm1V6QWxm7pkqiXHUE6Ok2P53V8XPUaJ6Fng"
            />
          </div>
          <div className="relative z-20 max-w-screen-2xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-surface-container-high rounded-full mb-6">
                <span className="pulse-dot"></span>
                <span className="text-xs font-label font-semibold text-primary uppercase tracking-[0.1em]">Live Network Intelligence</span>
              </div>
              <h1 className="text-6xl md:text-8xl font-black font-headline tracking-tighter leading-[0.95] mb-8">
                The Pulse of <br />
                <span className="text-gradient">Global Supply.</span>
              </h1>
              <p className="text-on-surface-variant text-xl max-w-xl leading-relaxed mb-10 font-body">
                Predict disruptions before they happen. ChainPulse leverages deep-sea data modeling to provide the definitive operating system for global logistics.
              </p>
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={onLaunchDemo}
                  className="bg-gradient-to-br from-primary to-primary-container text-on-primary px-10 py-4 rounded-xl font-bold text-lg transition-all hover:shadow-[0_0_30px_rgba(173,198,255,0.3)]"
                >
                  Deploy Network Intelligence
                </button>
                <button
                  onClick={onLaunchDemo}
                  className="bg-surface-container-highest text-primary px-10 py-4 rounded-xl font-bold text-lg transition-all hover:bg-surface-bright flex items-center gap-2"
                >
                  <span className="material-symbols-outlined">play_circle</span>
                  View Live Demo
                </button>
              </div>
            </div>
            <div className="hidden lg:block">
              <div className="glass-panel p-8 rounded-xl border border-outline-variant/10 shadow-2xl">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="font-headline font-bold text-xl">Active Intelligence Stream</h3>
                  <span className="text-tertiary text-sm font-label font-bold">STABLE +4.2%</span>
                </div>
                <div className="space-y-6">
                  <div className="flex items-center gap-4 p-4 bg-surface-container-lowest/50 rounded-lg">
                    <div className="w-10 h-10 rounded-full bg-tertiary-container/20 flex items-center justify-center text-tertiary">
                      <span className="material-symbols-outlined">sailing</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-sm">Everest Carrier-04</span>
                        <span className="text-xs text-on-surface-variant">2m ago</span>
                      </div>
                      <div className="w-full bg-surface-container-highest h-1 mt-2 rounded-full overflow-hidden">
                        <div className="bg-tertiary w-4/5 h-full"></div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-surface-container-lowest/50 rounded-lg">
                    <div className="w-10 h-10 rounded-full bg-error-container/20 flex items-center justify-center text-error">
                      <span className="material-symbols-outlined" data-weight="fill">warning</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-sm">Panama Hub Delay</span>
                        <span className="text-xs text-on-surface-variant">14m ago</span>
                      </div>
                      <div className="w-full bg-surface-container-highest h-1 mt-2 rounded-full overflow-hidden">
                        <div className="bg-error w-1/3 h-full"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-24 px-8 bg-surface-container-low">
          <div className="max-w-screen-2xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-surface-container-high p-8 rounded-xl transition-all hover:bg-surface-bright group">
                <span className="label-sm text-xs font-bold uppercase tracking-[0.15em] text-on-surface-variant mb-4 block">Total Shipments</span>
                <div className="flex items-end justify-between">
                  <span className="text-4xl font-headline font-extrabold text-blue-100">14.8k</span>
                  <span className="material-symbols-outlined text-primary text-3xl group-hover:scale-110 transition-transform">monitoring</span>
                </div>
              </div>
              <div className="bg-surface-container-high p-8 rounded-xl transition-all hover:bg-surface-bright group border-l-4 border-error">
                <span className="label-sm text-xs font-bold uppercase tracking-[0.15em] text-error mb-4 block">Active Alerts</span>
                <div className="flex items-end justify-between">
                  <span className="text-4xl font-headline font-extrabold text-error">12</span>
                  <span className="material-symbols-outlined text-error text-3xl group-hover:scale-110 transition-transform">crisis_alert</span>
                </div>
              </div>
              <div className="bg-surface-container-high p-8 rounded-xl transition-all hover:bg-surface-bright group">
                <span className="label-sm text-xs font-bold uppercase tracking-[0.15em] text-on-surface-variant mb-4 block">Risk Index</span>
                <div className="flex items-end justify-between">
                  <span className="text-4xl font-headline font-extrabold text-tertiary">0.24</span>
                  <span className="material-symbols-outlined text-tertiary text-3xl group-hover:scale-110 transition-transform">verified_user</span>
                </div>
              </div>
              <div className="bg-surface-container-high p-8 rounded-xl transition-all hover:bg-surface-bright group">
                <span className="label-sm text-xs font-bold uppercase tracking-[0.15em] text-on-surface-variant mb-4 block">Connected Nodes</span>
                <div className="flex items-end justify-between">
                  <span className="text-4xl font-headline font-extrabold text-blue-100">892</span>
                  <span className="material-symbols-outlined text-primary text-3xl group-hover:scale-110 transition-transform">hub</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="py-32 px-8">
          <div className="max-w-screen-2xl mx-auto">
            <div className="flex flex-col lg:flex-row gap-20 items-start">
              <div className="lg:w-1/3">
                <span className="text-primary font-bold text-sm tracking-[0.2em] uppercase mb-4 block">Visualization</span>
                <h2 className="text-5xl font-headline font-extrabold tracking-tighter mb-8">Real-time Global Surveillance.</h2>
                <p className="text-on-surface-variant text-lg leading-relaxed mb-8">
                  Every port, every vessel, every warehouse. See the movement of goods in a living, breathing digital twin of your entire supply chain.
                </p>
                <ul className="space-y-6">
                  <li className="flex gap-4 items-start">
                    <div className="mt-1 bg-primary/20 p-1 rounded">
                      <span className="material-symbols-outlined text-primary text-xl">satellite_alt</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-blue-100">AIS Satellite Tracking</h4>
                      <p className="text-sm text-on-surface-variant">Update frequency of 60 seconds for all oceanic transit.</p>
                    </div>
                  </li>
                  <li className="flex gap-4 items-start">
                    <div className="mt-1 bg-primary/20 p-1 rounded">
                      <span className="material-symbols-outlined text-primary text-xl">thunderstorm</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-blue-100">Weather Overlay</h4>
                      <p className="text-sm text-on-surface-variant">Live meteorological data cross-referenced with route planning.</p>
                    </div>
                  </li>
                </ul>
              </div>
              <div className="lg:w-2/3 w-full aspect-video rounded-3xl overflow-hidden relative shadow-2xl border border-outline-variant/20">
                <img
                  className="w-full h-full object-cover"
                  alt="High-detail 3D digital map showing shipping routes in the Pacific ocean with glowing neon path indicators"
                  data-location="Pacific Ocean"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuB8VyurRivOQTMLRoczrkTmy_RmwjYK9h9G1OVE9m_0nHVAxozQQEyXYvvFcDLPDtCptJ5AyKLT-41hyqAvceTL0lTZXi52T0udIFs_LIbf-6bsvAVqmBKhz1M1EMLdtItaxuPqQGvrzTbzRJPwmkNzvNq-qjoNNAPMLqu-qDIJ6TSW3MBvPJeRuUjw-TUZ7jETWXgcIs1uuBBN9PAoG5rFS_89vTIqaSuFJNlhp-Excj73YwT5wrnbaLJAShUFAoakPNLgl-a4-YE"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent"></div>
                <div className="absolute bottom-8 left-8 right-8 flex justify-between items-end">
                  <div className="glass-panel p-4 rounded-xl border border-white/10">
                    <div className="text-xs text-on-surface-variant mb-1 font-bold">LATEST HUB ACTIVITY</div>
                    <div className="text-sm font-bold flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-tertiary"></span> Singapore Port Authority (Active)
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="w-12 h-12 rounded-full bg-surface-container-highest flex items-center justify-center hover:bg-surface-bright transition-colors">
                      <span className="material-symbols-outlined">add</span>
                    </button>
                    <button className="w-12 h-12 rounded-full bg-surface-container-highest flex items-center justify-center hover:bg-surface-bright transition-colors">
                      <span className="material-symbols-outlined">remove</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-32 px-8 bg-surface-container-lowest">
          <div className="max-w-screen-2xl mx-auto">
            <div className="text-center mb-20">
              <h2 className="text-5xl font-headline font-black tracking-tighter mb-4">Neural Risk Intelligence</h2>
              <p className="text-on-surface-variant max-w-2xl mx-auto text-lg leading-relaxed">Our AI doesn't just watch; it predicts. Analyzing 500+ variables from geopolitical shifts to micro-climate changes.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[700px]">
              <div className="md:col-span-2 bg-surface-container-high rounded-3xl p-10 flex flex-col justify-between border border-outline-variant/10 relative overflow-hidden group">
                <div className="relative z-10">
                  <h3 className="text-3xl font-headline font-bold mb-4">Predictive Delay Modeling</h3>
                  <p className="text-on-surface-variant max-w-md">Using longitudinal data from 10 years of logistics flow to anticipate bottleneck events 72 hours before they manifest.</p>
                </div>
                <div className="mt-8 relative z-10 flex gap-4">
                  <div className="bg-surface-container-lowest p-6 rounded-2xl flex-1 border border-outline-variant/5">
                    <span className="text-xs font-bold text-on-surface-variant uppercase mb-2 block">Accuracy</span>
                    <div className="text-4xl font-black text-tertiary">98.4%</div>
                  </div>
                  <div className="bg-surface-container-lowest p-6 rounded-2xl flex-1 border border-outline-variant/5">
                    <span className="text-xs font-bold text-on-surface-variant uppercase mb-2 block">Latency</span>
                    <div className="text-4xl font-black text-primary">12ms</div>
                  </div>
                </div>
                <img
                  className="absolute bottom-0 right-0 w-2/3 h-2/3 object-contain opacity-20 group-hover:scale-110 transition-transform duration-700"
                  alt="Abstract glowing network of neurons and data nodes in deep blue and turquoise representing artificial intelligence processing"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBCepDgdQlHRYOfVd5m5Mvw2FIKe86KtBevUPzPGuFOLtGzZl4dUF80ChiJExOqNZkcmTceMgwwfx0u38PY5Z4RNp2Z4DZFI6vz4AwtCLLcaL2Jif79NvRAz7to_FKr_xtf7BQ64ZQ47eQg8trNItMGoj5ZEhnR4_O67WS8-bCE3sqb-bNasCXU9LfPrLf_ScPsvg1IxUAEGbPaaSg3-qt9c2tO9NggiWy7Uyno4szFlGnihaAx48HEqY1p4TLgXHYFbkgZ90nkiHc"
                />
              </div>
              <div className="bg-gradient-to-br from-primary-container/20 to-primary/5 rounded-3xl p-10 flex flex-col border border-primary/20">
                <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center text-primary mb-8">
                  <span className="material-symbols-outlined text-4xl">psychology</span>
                </div>
                <h3 className="text-2xl font-headline font-bold mb-4">Sentiment Harvesting</h3>
                <p className="text-on-surface-variant leading-relaxed">Real-time analysis of global news and social feeds to detect labor strikes and local policy changes before official announcements.</p>
                <div className="mt-auto pt-10">
                  <div className="h-2 w-full bg-surface-container-highest rounded-full overflow-hidden">
                    <div className="h-full bg-primary w-3/4"></div>
                  </div>
                  <span className="text-xs font-bold mt-2 block text-primary">AI PROCESSING CAPACITY: 88%</span>
                </div>
              </div>
              <div className="bg-surface-container rounded-3xl p-10 flex flex-col border border-outline-variant/10">
                <h3 className="text-2xl font-headline font-bold mb-4">Node Health</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b border-outline-variant/20">
                    <span className="text-on-surface-variant">Rotterdam</span>
                    <span className="text-tertiary font-bold">OPTIMAL</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-outline-variant/20">
                    <span className="text-on-surface-variant">Suez Canal</span>
                    <span className="text-secondary-fixed-dim font-bold">CAUTION</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-outline-variant/20">
                    <span className="text-on-surface-variant">Los Angeles</span>
                    <span className="text-error font-bold">ALERT</span>
                  </div>
                  <div className="flex justify-between items-center py-3">
                    <span className="text-on-surface-variant">Shanghai</span>
                    <span className="text-tertiary font-bold">OPTIMAL</span>
                  </div>
                </div>
              </div>
              <div className="md:col-span-2 bg-surface-container-high rounded-3xl p-10 border border-outline-variant/10 relative overflow-hidden">
                <div className="flex flex-col md:flex-row gap-10 items-center">
                  <div className="md:w-1/2">
                    <h3 className="text-3xl font-headline font-bold mb-4">Supply Chain Decoupling</h3>
                    <p className="text-on-surface-variant mb-6">Our system identifies high-risk dependencies and suggests alternative sourcing nodes in real-time based on fluctuating trade tariffs.</p>
                    <button className="text-primary font-bold flex items-center gap-2 hover:translate-x-2 transition-transform">
                      Explore Sourcing Intelligence <span className="material-symbols-outlined">arrow_forward</span>
                    </button>
                  </div>
                  <div className="md:w-1/2 grid grid-cols-2 gap-4">
                    <div className="aspect-square bg-surface-container-lowest rounded-2xl flex flex-col items-center justify-center border border-outline-variant/5">
                      <span className="material-symbols-outlined text-4xl text-primary mb-2">account_tree</span>
                      <span className="text-[10px] uppercase font-bold tracking-widest text-on-surface-variant">Maps</span>
                    </div>
                    <div className="aspect-square bg-surface-container-lowest rounded-2xl flex flex-col items-center justify-center border border-outline-variant/5">
                      <span className="material-symbols-outlined text-4xl text-tertiary mb-2">radar</span>
                      <span className="text-[10px] uppercase font-bold tracking-widest text-on-surface-variant">Scans</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-32 px-8">
          <div className="max-w-5xl mx-auto glass-panel rounded-[3rem] p-16 text-center border border-primary/20 shadow-[0_0_80px_rgba(173,198,255,0.1)] relative overflow-hidden">
            <div className="absolute -top-24 -left-24 w-64 h-64 bg-primary/10 blur-[100px]"></div>
            <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-tertiary/10 blur-[100px]"></div>
            <h2 className="text-5xl md:text-6xl font-headline font-black tracking-tighter mb-8 relative z-10">Ready to Secure Your <br /> Global Network?</h2>
            <p className="text-on-surface-variant text-xl max-w-2xl mx-auto mb-12 relative z-10 leading-relaxed">
              Join the world's most resilient enterprises. ChainPulse deployment takes less than 14 days for a full enterprise digital twin.
            </p>
            <div className="flex flex-wrap justify-center gap-6 relative z-10">
              <button onClick={onLaunchDemo} className="bg-gradient-to-br from-primary to-primary-container text-on-primary px-12 py-5 rounded-2xl font-bold text-xl transition-all hover:scale-105">
                Request Executive Demo
              </button>
              <button className="bg-surface-container-high text-blue-100 px-12 py-5 rounded-2xl font-bold text-xl border border-outline-variant/20 hover:bg-surface-bright transition-colors">
                Speak to an Analyst
              </button>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-slate-950 border-t border-slate-800/30">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 px-8 py-16 max-w-screen-2xl mx-auto">
          <div className="md:col-span-1">
            <div className="text-xl font-bold text-blue-100 font-headline mb-6">ChainPulse</div>
            <p className="text-slate-500 text-sm font-body leading-relaxed">
              Advanced operational intelligence for the modern supply chain. Monitoring the global flow of goods 24/7/365.
            </p>
          </div>
          <div>
            <h4 className="text-blue-300 font-semibold mb-6 font-headline">Platform</h4>
            <ul className="space-y-4">
              <li><a className="text-slate-500 hover:text-slate-300 transition-opacity font-inter text-sm hover:underline decoration-blue-500/50 underline-offset-4" href="#">Shipment Tracking</a></li>
              <li><a className="text-slate-500 hover:text-slate-300 transition-opacity font-inter text-sm hover:underline decoration-blue-500/50 underline-offset-4" href="#">Risk Modeling</a></li>
              <li><a className="text-slate-500 hover:text-slate-300 transition-opacity font-inter text-sm hover:underline decoration-blue-500/50 underline-offset-4" href="#">Sustainability</a></li>
              <li><a className="text-slate-500 hover:text-slate-300 transition-opacity font-inter text-sm hover:underline decoration-blue-500/50 underline-offset-4" href="#">Integrations</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-blue-300 font-semibold mb-6 font-headline">Company</h4>
            <ul className="space-y-4">
              <li><a className="text-slate-500 hover:text-slate-300 transition-opacity font-inter text-sm hover:underline decoration-blue-500/50 underline-offset-4" href="#">About Us</a></li>
              <li><a className="text-slate-500 hover:text-slate-300 transition-opacity font-inter text-sm hover:underline decoration-blue-500/50 underline-offset-4" href="#">Security</a></li>
              <li><a className="text-slate-500 hover:text-slate-300 transition-opacity font-inter text-sm hover:underline decoration-blue-500/50 underline-offset-4" href="#">Contact</a></li>
              <li><a className="text-slate-500 hover:text-slate-300 transition-opacity font-inter text-sm hover:underline decoration-blue-500/50 underline-offset-4" href="#">API Status</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-blue-300 font-semibold mb-6 font-headline">Global Intelligence</h4>
            <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
              <p className="text-xs text-slate-400 mb-2">SUBSCRIBE TO DISRUPTION ALERTS</p>
              <div className="flex">
                <input className="bg-slate-950 border-none rounded-l-lg w-full text-xs focus:ring-1 focus:ring-blue-500" placeholder="Email" type="email" />
                <button className="bg-blue-600 px-3 rounded-r-lg">
                  <span className="material-symbols-outlined text-sm">send</span>
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-screen-2xl mx-auto px-8 py-8 border-t border-slate-900 flex flex-col md:flex-row justify-between items-center gap-4">
          <span className="text-slate-500 text-xs font-inter">© 2024 ChainPulse Intelligence. All rights reserved.</span>
          <div className="flex gap-6">
            <a className="text-slate-500 hover:text-slate-300 text-xs font-inter" href="#">Privacy Policy</a>
            <a className="text-slate-500 hover:text-slate-300 text-xs font-inter" href="#">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage
