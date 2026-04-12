import Link from "next/link"
import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { CardSpotlight } from "@/components/ui/card-spotlight"
import { HeroLamp } from "@/components/shared/hero-lamp"
import { TypingCodeBlock } from "@/components/shared/typing-code-block"
import { TypingQuote } from "@/components/shared/typing-quote"
import { ScrollReveal } from "@/components/shared/scroll-reveal"
import { ScrollSlide } from "@/components/shared/scroll-slide"

export default async function Home() {
  const user = await currentUser()
  if (user) {
    redirect("/dashboard")
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .hero-gradient-custom {
            background: radial-gradient(circle at 50% 50%, rgba(192, 193, 255, 0.08) 0%, rgba(10, 10, 10, 0) 70%);
        }
        .cta-gradient {
            background: linear-gradient(135deg, #c0c1ff 0%, #8083ff 100%);
        }
        .glass-nav {
            border-bottom: 1px solid rgba(58, 57, 57, 0.3);
        }
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
      `}} />
      <div className="bg-[#0a0a0a] text-[#e5e2e1] font-body selection:bg-primary selection:text-on-primary min-h-screen">
        {/* TopNavBar */}
        <nav className="absolute top-0 w-full z-50 border-b border-white/5 bg-[#0a0a0a]/30 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto flex justify-between items-center px-8 py-6">
            <span className="text-xl font-extrabold tracking-tighter text-white font-headline">Snipster</span>
            <div className="flex items-center gap-2">
              <Link href="/sign-in" className="font-manrope text-sm font-medium tracking-tight text-white/85 hover:text-white hover:bg-white/5 px-4 py-2 transition-all rounded-md">
                Log in
              </Link>
              <Link href="/sign-up" className="font-manrope text-sm font-medium tracking-tight text-[#C0C1FF] hover:bg-white/5 px-4 py-2 transition-all rounded-md">
                Sign up
              </Link>
            </div>
          </div>
        </nav>

        <main>
          {/* Hero Section */}
          <section className="relative overflow-hidden">
            <HeroLamp />

            {/* Code Block Visual Bleed */}
            <div className="mt-20 max-w-5xl mx-auto relative px-8 mb-24 z-20">
              <TypingCodeBlock />
            </div>
          </section>

          {/* Problem/Solution */}
          <section className="py-32 px-8">
            <ScrollReveal className="max-w-7xl mx-auto grid md:grid-cols-2 gap-24 items-center">
              <div className="space-y-12">
                <h2 className="text-3xl font-bold font-headline text-white leading-tight">The Fragmented <br/>Developer Experience</h2>
                <div className="space-y-8">
                  <div className="flex gap-6 items-start">
                    <span className="material-symbols-outlined text-error mt-1">cancel</span>
                    <div>
                      <h3 className="text-on-surface font-bold mb-2">Too Many Platforms, No Single Flow</h3>
                      <p className="text-on-surface-variant text-sm">Switching between GitHub, Discord, blogs, and bookmarks just to learn and stay updated.</p>
                    </div>
                  </div>
                  <div className="flex gap-6 items-start">
                    <span className="material-symbols-outlined text-error mt-1">cancel</span>
                    <div>
                      <h3 className="text-on-surface font-bold mb-2">Knowledge Gets Lost</h3>
                      <p className="text-on-surface-variant text-sm">Useful snippets, ideas, and solutions disappear across repos, notes, and tabs.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-surface-container p-12 rounded-2xl relative border-l-4 border-primary">
                <h2 className="text-3xl font-bold font-headline text-white leading-tight mb-12">The Snipster <br/>Experience</h2>
                <div className="space-y-8">
                  <div className="flex gap-6 items-start">
                    <span className="material-symbols-outlined text-primary mt-1">check_circle</span>
                    <div>
                      <h3 className="text-on-surface font-bold mb-2">All-in-One Developer Hub</h3>
                      <p className="text-on-surface-variant text-sm">Save code, write blogs, connect with developers, and stay updated — all in one place.</p>
                    </div>
                  </div>
                  <div className="flex gap-6 items-start">
                    <span className="material-symbols-outlined text-primary mt-1">check_circle</span>
                    <div>
                      <h3 className="text-on-surface font-bold mb-2">Discover What Actually Matters</h3>
                      <p className="text-on-surface-variant text-sm">Explore real developer content — snippets, ideas, and insights — not noise.</p>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </section>

          {/* Feature Grid (Bento) */}
          <section className="py-32 bg-surface-container-low px-8">
            <ScrollReveal className="max-w-7xl mx-auto">
              <div className="mb-20">
                <span className="text-primary font-mono text-xs tracking-widest uppercase mb-4 block">Core Infrastructure</span>
                <h2 className="text-4xl font-extrabold font-headline text-white">Built for High-Level Logic</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Snippets */}
                <ScrollSlide direction="left" className="md:col-span-2">
                  <div className="bg-surface p-8 rounded-xl border border-outline-variant/10 hover:border-primary/30 transition-all group">
                    <span className="material-symbols-outlined text-primary mb-6 text-3xl">code</span>
                    <h3 className="text-xl font-bold text-white mb-3">Snippet Management</h3>
                    <p className="text-on-surface-variant text-sm mb-8 max-w-md">Version-controlled, cloud-synced snippets with full syntax highlighting for 100+ languages.</p>
                    <img className="w-full h-48 object-cover rounded-md grayscale group-hover:grayscale-0 transition-all duration-500" data-alt="Close up of a computer screen displaying high-contrast source code with vibrant syntax highlighting in a dark environment" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCz4Q_lFioQQw1n6HB5wtwajhrUbiH0uMnKb672igY2SimEu4L82HkRBzgjKHILY2CSO_B9QXgis4ue_sLLR5IBRewv2g1Aeu5UAJ4VNDIPFTO9En2dDf6mKVz9x3io0a4aPPj9TI30Icxr7TCgFguqZ_0kCOyPAsBAhlxzBwYjpa0u4bF9FLy9wrbFyJtqM8JvmyM-mt9K3167HYa5sK7XJHqTM8tLWlbZxT60vgwUIj9ARCGvSMokw8eg_IFWaZ4vjo-8SF_xo0Q" alt="Snippets demo" />
                  </div>
                </ScrollSlide>

                {/* Blogging */}
                <ScrollSlide direction="right">
                  <CardSpotlight className="bg-black p-8 rounded-xl border border-outline-variant/10 flex flex-col justify-between">
                    <div className="relative z-20">
                      <span className="material-symbols-outlined text-tertiary mb-6 text-3xl">edit_note</span>
                      <h3 className="text-xl font-bold text-white mb-3">Developer Blogging</h3>
                      <p className="text-on-surface-variant text-sm">Markdown-first editorial experience designed for technical long-form content.</p>
                    </div>
                    <div className="mt-8 pt-8 border-t border-outline-variant/20 relative z-20">
                      <span className="text-primary text-xs font-mono">0.05ms READ TIME</span>
                    </div>
                  </CardSpotlight>
                </ScrollSlide>

                {/* Social */}
                <ScrollSlide direction="right">
                  <CardSpotlight className="bg-black p-8 rounded-xl border border-outline-variant/10">
                    <div className="relative z-20">
                      <span className="material-symbols-outlined text-primary mb-6 text-3xl">hub</span>
                      <h3 className="text-xl font-bold text-white mb-3">Architectural Social</h3>
                      <p className="text-on-surface-variant text-sm">Connect with peers through a thread-based system optimized for code review and feedback.</p>
                    </div>
                  </CardSpotlight>
                </ScrollSlide>

                {/* Engagement & Discovery */}
                <ScrollSlide direction="left" className="md:col-span-2">
                  <div className="bg-surface p-8 rounded-xl border border-outline-variant/10 hover:border-primary/30 transition-all grid md:grid-cols-2 gap-8 items-center">
                    <div>
                      <span className="material-symbols-outlined text-tertiary mb-6 text-3xl">explore</span>
                      <h3 className="text-xl font-bold text-white mb-3">Tech News &amp; Discovery</h3>
                      <p className="text-on-surface-variant text-sm">Aggregated news from top engineering blogs and real-time discovery of trending repositories.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="aspect-square bg-surface-container-lowest rounded flex items-center justify-center border border-outline-variant/10">
                        <span className="material-symbols-outlined text-primary/40">rocket</span>
                      </div>
                      <div className="aspect-square bg-surface-container-lowest rounded flex items-center justify-center border border-outline-variant/10">
                        <span className="material-symbols-outlined text-primary/40">newspaper</span>
                      </div>
                      <div className="aspect-square bg-surface-container-lowest rounded flex items-center justify-center border border-outline-variant/10">
                        <span className="material-symbols-outlined text-primary/40">monitoring</span>
                      </div>
                      <div className="aspect-square bg-surface-container-lowest rounded flex items-center justify-center border border-outline-variant/10">
                        <span className="material-symbols-outlined text-primary/40">groups</span>
                      </div>
                    </div>
                  </div>
                </ScrollSlide>
              </div>
            </ScrollReveal>
          </section>

          {/* How It Works */}
          <section className="py-32 px-8">
            <ScrollReveal className="max-w-7xl mx-auto">
              <div className="text-center mb-24">
                <h2 className="text-4xl font-extrabold font-headline text-white mb-4">How Snipster Works</h2>
                <p className="text-on-surface-variant max-w-xl mx-auto">From saving code to sharing knowledge — everything in one simple flow.</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-12 relative">
                {/* Connector Line (Desktop Only) */}
                <div className="hidden md:block absolute top-12 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-outline-variant/30 to-transparent -z-10"></div>
                
                <div className="text-center group">
                  <div className="w-24 h-24 bg-surface-container-lowest border border-outline-variant/30 rounded-full flex items-center justify-center mx-auto mb-8 group-hover:border-primary transition-colors">
                    <span className="text-2xl font-mono text-primary">01</span>
                  </div>
                  <h4 className="font-bold text-white mb-4">Create Your Space</h4>
                  <p className="text-xs text-on-surface-variant leading-relaxed">Set up your profile and start building your personal developer hub.</p>
                </div>
                
                <div className="text-center group">
                  <div className="w-24 h-24 bg-surface-container-lowest border border-outline-variant/30 rounded-full flex items-center justify-center mx-auto mb-8 group-hover:border-primary transition-colors">
                    <span className="text-2xl font-mono text-primary">02</span>
                  </div>
                  <h4 className="font-bold text-white mb-4">Save & Organize</h4>
                  <p className="text-xs text-on-surface-variant leading-relaxed">Store your code snippets, ideas, and solutions — neatly organized and always accessible.</p>
                </div>

                <div className="text-center group">
                  <div className="w-24 h-24 bg-surface-container-lowest border border-outline-variant/30 rounded-full flex items-center justify-center mx-auto mb-8 group-hover:border-primary transition-colors">
                    <span className="text-2xl font-mono text-primary">03</span>
                  </div>
                  <h4 className="font-bold text-white mb-4">Share & Engage</h4>
                  <p className="text-xs text-on-surface-variant leading-relaxed">Publish blogs, share snippets, and interact with developers through likes and discussions.</p>
                </div>

                <div className="text-center group">
                  <div className="w-24 h-24 bg-surface-container-lowest border border-outline-variant/30 rounded-full flex items-center justify-center mx-auto mb-8 group-hover:border-primary transition-colors">
                    <span className="text-2xl font-mono text-primary">04</span>
                  </div>
                  <h4 className="font-bold text-white mb-4">Grow & Discover</h4>
                  <p className="text-xs text-on-surface-variant leading-relaxed">Follow developers, explore new ideas, and stay updated with the latest in tech.</p>
                </div>
              </div>
            </ScrollReveal>
          </section>

          {/* Value Prop */}
          <section className="py-32 bg-[#0E0E0E] border-y border-outline-variant/10">
            <ScrollReveal className="max-w-4xl mx-auto px-8 text-center">
              <span className="text-tertiary font-mono text-xs tracking-widest mb-8 block">THE SNIPSTER ADVANTAGE</span>
              <ScrollSlide direction="right" offset={120} duration={0.45}>
                <h2 className="text-4xl md:text-6xl font-extrabold font-headline text-white leading-[1.1] mb-12">
                    One architectural monolith. <br/>Infinite developer <span className="text-primary">synergy.</span>
                </h2>
              </ScrollSlide>
              <ScrollSlide direction="left" offset={120} duration={0.45}>
                <p className="text-on-surface-variant text-lg leading-relaxed mb-16">
                    Stop searching through history. Stop switching tabs. Snipster is designed to be the background process of your professional life—quiet, efficient, and always ready to serve the right logic at the right time.
                </p>
              </ScrollSlide>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-12 border-t border-outline-variant/10 text-center">
                <div className="beam-border flex flex-col items-center">
                  <div className="text-xl font-bold text-white mb-2">Early Access</div>
                  <div className="text-xs text-on-surface-variant leading-relaxed max-w-[200px]">Join a growing developer community</div>
                </div>
                <div className="beam-border flex flex-col items-center">
                  <div className="text-xl font-bold text-white mb-2">Real Usage</div>
                  <div className="text-xs text-on-surface-variant leading-relaxed max-w-[200px]">Snippets, blogs, and interactions happening every day</div>
                </div>
                <div className="beam-border flex flex-col items-center">
                  <div className="text-xl font-bold text-white mb-2">Built in Public</div>
                  <div className="text-xs text-on-surface-variant leading-relaxed max-w-[200px]">Continuously improving with developer feedback</div>
                </div>
              </div>
            </ScrollReveal>
          </section>

          {/* Social Proof */}
          <section className="py-32 px-8 overflow-hidden">
            <ScrollReveal className="max-w-7xl mx-auto">
              <div className="relative py-20 bg-surface rounded-[2rem] px-12 md:px-24 overflow-hidden border border-outline-variant/5">
                <div className="absolute -top-12 -left-12 text-[12rem] font-headline font-extrabold text-white/5 select-none">&ldquo;</div>
                <div className="relative z-10">
                  <TypingQuote
                    text="Snipster is how I believe developers should build, share, and grow — in one place."
                    className="text-2xl md:text-4xl font-light font-mono text-white leading-relaxed italic mb-12"
                    typingSpeedMs={50}
                    startDelayMs={300}
                  />
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-surface-container-highest overflow-hidden">
                      <img className="w-full h-full object-cover object-top" src="https://github.com/Sahil-Sharma06.png" alt="Sahil Sharma" />
                    </div>
                    <div>
                      <h5 className="text-white font-bold text-sm">Sahil Sharma</h5>
                      <p className="text-on-surface-variant text-[10px] uppercase tracking-wider">Developer</p>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </section>

          {/* Final CTA */}
          <section className="py-40 px-8 relative overflow-hidden">
            <div className="absolute inset-0 hero-gradient-custom -z-10"></div>
            <ScrollReveal className="max-w-4xl mx-auto text-center">
              <h2 className="text-4xl md:text-6xl font-extrabold font-headline text-white mb-10 tracking-tight leading-[1]">
                  Join the Next Generation <br/>Developer Community
              </h2>
              <p className="text-on-surface-variant mb-12 max-w-xl mx-auto text-lg">
                  The architect is ready for your first commit. Secure your handle today and start building the future of knowledge.
              </p>
              <div className="flex flex-col items-center gap-5">
                <div className="flex flex-col md:flex-row items-center justify-center gap-4">
                  <Link href="/sign-up" className="beam-button px-12 py-5 rounded-md font-bold text-sm tracking-widest uppercase hover:scale-[1.05] transition-transform">
                    <span>Initialize My Account</span>
                  </Link>
                  <Link href="/sign-in" className="px-10 py-5 rounded-md font-bold text-sm tracking-widest uppercase border border-white/15 text-white hover:border-white/35 hover:bg-white/5 transition-colors">
                    <span>Log In</span>
                  </Link>
                </div>
                <span className="text-on-surface-variant text-xs font-mono">Free forever for individuals.</span>
              </div>
            </ScrollReveal>
          </section>
        </main>

        {/* Footer */}
        <footer className="bg-[#0a0a0a] w-full py-12 px-8 border-t border-[#3A3939]/15">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start">
            <div className="mb-8 md:mb-0">
              <span className="text-lg font-bold text-white mb-4 block font-headline">Snipster</span>
              <p className="font-manrope text-xs text-[#C7C4D7] max-w-xs leading-relaxed mb-4">
                Built by a developer, for developers. <br/>
                A place to save code, share knowledge, and grow together.
              </p>
              <p className="font-manrope text-xs text-[#C7C4D7]/40 max-w-xs leading-relaxed">&copy; 2026 Snipster.</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-2 gap-16 md:gap-24">
              <div>
                <h6 className="text-[#C0C1FF] font-bold text-[10px] uppercase tracking-widest mb-6">Explore</h6>
                <ul className="space-y-4">
                  <li><Link className="font-manrope text-xs text-[#C7C4D7] hover:text-[#C0C1FF] transition-colors" href="/sign-in">Snippets</Link></li>
                  <li><Link className="font-manrope text-xs text-[#C7C4D7] hover:text-[#C0C1FF] transition-colors" href="/sign-in">Blogs</Link></li>
                  <li><Link className="font-manrope text-xs text-[#C7C4D7] hover:text-[#C0C1FF] transition-colors" href="/sign-in">Community</Link></li>
                  <li><Link className="font-manrope text-xs text-[#C7C4D7] hover:text-[#C0C1FF] transition-colors" href="/sign-in">Tech News</Link></li>
                </ul>
              </div>
              <div>
                <h6 className="text-[#C0C1FF] font-bold text-[10px] uppercase tracking-widest mb-6">Connect</h6>
                <ul className="space-y-4">
                  <li><Link className="font-manrope text-xs text-[#C7C4D7] hover:text-[#C0C1FF] transition-colors" target="_blank" href="https://github.com/Sahil-Sharma06">GitHub</Link></li>
                  <li><Link className="font-manrope text-xs text-[#C7C4D7] hover:text-[#C0C1FF] transition-colors" target="_blank" href="https://x.com/Sharmaa_ji06">X</Link></li>
                  <li><Link className="font-manrope text-xs text-[#C7C4D7] hover:text-[#C0C1FF] transition-colors" target="_blank" href="https://www.linkedin.com/in/sahil-sharma-a735b4247/">LinkedIn</Link></li>
                  <li><Link className="font-manrope text-xs text-[#C7C4D7] hover:text-[#C0C1FF] transition-colors" target="_blank" href="https://medium.com/@thisisssharma">Medium</Link></li>
                </ul>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}
