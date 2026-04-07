import Link from "next/link"
import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"

export default async function Home() {
  const user = await currentUser()
  if (user) {
    redirect("/dashboard")
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');
        .glass { backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); }
        .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
        .text-gradient { background: linear-gradient(135deg, #d2bbff 0%, #7c3aed 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .vsc-bg { background-color: #1e1e1e; }
        .vsc-keyword { color: #569cd6; }
        .vsc-func { color: #dcdcaa; }
        .vsc-string { color: #ce9178; }
        .vsc-comment { color: #6a9955; }
      `}} />
      <div className="bg-surface text-[#e5e2e1] selection:bg-primary-container selection:text-white font-['Inter'] antialiased min-h-screen">
        {/* TopNavBar */}
        <nav className="fixed top-0 w-full z-50 bg-[#202020]/70 backdrop-blur-xl flex items-center justify-between px-8 h-16 shadow-[0px_20px_40px_rgba(0,0,0,0.4)] tracking-tight">
          <div className="flex items-center gap-8">
            <span className="text-xl font-black tracking-tighter text-[#D2BBFF]">Snipster</span>
            <div className="hidden md:flex gap-6">
              <Link className="text-[#D2BBFF] border-b-2 border-[#7C3AED] pb-1" href="/">Feed</Link>
              <Link className="text-zinc-400 font-medium hover:text-zinc-100 transition-colors" href="/sign-in">Snippets</Link>
              <Link className="text-zinc-400 font-medium hover:text-zinc-100 transition-colors" href="/sign-in">Blogs</Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden lg:flex items-center bg-white/5 rounded-full px-4 py-1.5 border border-white/10">
              <span className="material-symbols-outlined text-zinc-500 text-sm">search</span>
              <input className="bg-transparent border-none text-xs focus:ring-0 placeholder-zinc-600 outline-none text-on-surface w-48" placeholder="Search the archive..." type="text" />
            </div>
            <Link href="/sign-in" className="p-2 hover:bg-white/5 transition-all duration-300 rounded-full scale-95 active:scale-90">
              <span className="material-symbols-outlined text-[#D2BBFF]">login</span>
            </Link>
            <div className="h-8 w-8 rounded-full overflow-hidden bg-surface-container-high border border-white/10">
              <img alt="User profile" className="w-full h-full object-cover" data-alt="Portrait of a developer" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBNzrY0tav5ajh7Zu2N0qCjCaGY2-njPU8BDW_EzsmwUCpl-rRpWTyChR8HdL4CGFdYrsdeOD9MOT6f_O4Xz-h7DNRpz_6LOEhaM0HRKubLra2zSJT2bism__VhDR6Nbaqwqvo8b-vRBv7uE6cfKYyCKXHhqdK-mreuQDbHFvKmDcJ15UiO3DAzFY67YA-lOaSZP_yI1uAIAq53Qh7R8qvgCJFnB9_c2Gp3EydvnO-liZqMowS_itX8SFpvPdsXNWo4323vS6pLoMzc" />
            </div>
          </div>
        </nav>

        <div className="flex">
          {/* SideNavBar */}
          <aside className="hidden md:flex flex-col gap-2 p-4 h-screen w-64 border-r border-white/5 bg-[#131313] fixed left-0 top-16 text-sm tracking-wide uppercase font-bold">
            <div className="flex items-center gap-3 px-2 py-4 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-container rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome_motion</span>
              </div>
              <div>
                <div className="text-lg font-black text-[#D2BBFF] tracking-tighter normal-case">Snipster</div>
                <div className="text-[10px] text-zinc-500 tracking-widest">The Kinetic Archive</div>
              </div>
            </div>
            <nav className="flex flex-col gap-1">
              <Link className="flex items-center gap-3 px-4 py-3 text-[#D2BBFF] bg-[#2A2A2A] rounded-xl ease-out duration-200" href="/">
                <span className="material-symbols-outlined">dynamic_feed</span>
                <span>Feed</span>
              </Link>
              <Link className="flex items-center gap-3 px-4 py-3 text-zinc-500 hover:text-zinc-300 hover:bg-[#1B1B1C] transition-all duration-200 rounded-xl" href="/sign-in">
                <span className="material-symbols-outlined">code</span>
                <span>Snippets</span>
              </Link>
              <Link className="flex items-center gap-3 px-4 py-3 text-zinc-500 hover:text-zinc-300 hover:bg-[#1B1B1C] transition-all duration-200 rounded-xl" href="/sign-in">
                <span className="material-symbols-outlined">article</span>
                <span>Blogs</span>
              </Link>
              <Link className="flex items-center gap-3 px-4 py-3 text-zinc-500 hover:text-zinc-300 hover:bg-[#1B1B1C] transition-all duration-200 rounded-xl" href="/sign-in">
                <span className="material-symbols-outlined">auto_awesome_motion</span>
                <span>Collections</span>
              </Link>
              <Link className="flex items-center gap-3 px-4 py-3 text-zinc-500 hover:text-zinc-300 hover:bg-[#1B1B1C] transition-all duration-200 rounded-xl" href="/sign-in">
                <span className="material-symbols-outlined">person</span>
                <span>Profile</span>
              </Link>
            </nav>
            <Link href="/sign-in" className="mt-8 mx-2 bg-primary-container text-white py-3 rounded-full flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
              <span className="material-symbols-outlined">add</span>
              <span className="normal-case">Create New</span>
            </Link>
          </aside>

          {/* Main Content Area */}
          <main className="flex-1 md:ml-64 mt-16 px-6 lg:px-12 py-12 bg-surface">
            {/* Hero Section */}
            <section className="max-w-6xl mx-auto mb-32 pt-12 text-center md:text-left grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-7">
                <h1 className="text-5xl lg:text-8xl font-black tracking-tighter leading-[0.9] mb-8">
                  The Kinetic <br />
                  <span className="text-gradient">Archive</span>
                </h1>
                <p className="text-xl text-on-surface-variant leading-relaxed max-w-xl mb-10 font-light">
                  Elevate your technical assets. A premium editorial experience for developers to store, share, and discover high-impact code snippets and technical insights.
                </p>
                <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                  <Link href="/sign-up" className="bg-primary-container text-white px-8 py-4 rounded-full font-bold flex items-center gap-2 shadow-lg hover:shadow-primary-container/20 transition-all">
                    Start Snipping
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </Link>
                  <Link href="/sign-in" className="bg-surface-container-high border border-outline-variant/20 px-8 py-4 rounded-full font-bold text-on-surface hover:bg-surface-container-highest transition-all flex items-center">
                    Explore Feed
                  </Link>
                </div>

                <div className="mt-16 flex gap-12 justify-center md:justify-start border-t border-white/5 pt-12">
                  <div>
                    <div className="text-3xl font-black text-on-surface">42K+</div>
                    <div className="text-xs uppercase tracking-widest text-zinc-500 font-bold">Snippets</div>
                  </div>
                  <div>
                    <div className="text-3xl font-black text-on-surface">1.2M</div>
                    <div className="text-xs uppercase tracking-widest text-zinc-500 font-bold">Monthly Views</div>
                  </div>
                  <div>
                    <div className="text-3xl font-black text-on-surface">8.5K</div>
                    <div className="text-xs uppercase tracking-widest text-zinc-500 font-bold">Contributors</div>
                  </div>
                </div>
              </div>

              {/* Floating Glass Cards */}
              <div className="lg:col-span-5 relative h-[500px]">
                <div className="absolute top-0 right-0 w-full h-full bg-primary/10 rounded-[3rem] blur-3xl opacity-30"></div>

                <div className="absolute top-4 -left-4 md:-left-12 z-20 w-80 bg-surface-container-high/80 glass p-6 rounded-[2rem] shadow-2xl border border-white/5 rotate-[-2deg]">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-3 h-3 rounded-full bg-error"></div>
                    <div className="w-3 h-3 rounded-full bg-[#e6ecff]"></div>
                    <div className="w-3 h-3 rounded-full bg-primary"></div>
                  </div>
                  <div className="font-mono text-xs leading-relaxed overflow-hidden whitespace-pre">
                    <span className="vsc-keyword">async function</span> <span className="vsc-func">fetchArchive</span>() {"{"}<br />
                    {"  "}<span className="vsc-keyword">const</span> data = <span className="vsc-keyword">await</span> kinetic.get();<br />
                    {"  "}<span className="vsc-keyword">return</span> data.map(s =&gt; s.animate());<br />
                    {"}"}
                  </div>
                </div>

                <div className="absolute bottom-10 right-0 z-10 w-80 bg-[#1B1B1C]/90 glass p-0 rounded-[1.5rem] overflow-hidden shadow-2xl border border-white/5 rotate-[4deg]">
                  <img className="w-full h-40 object-cover opacity-80" alt="Abstract shapes" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAw2KeCLrpGyo9HUwf_8CbKa2zGhwFw_I6DYfS0bRwpK0MoqxPOVEy_swXWUvMmUmjLUp34aVKikR5lZJ__EMFyOztu9OB1_LWpybQSZl16ejfZ8CeTH_QwWWDBvu8CWBdyYhlDNmoB9NczZqYgGMRC7er_lrev_lv5LBoxeRkHMGEsbYW_ncUsfQELQPOr_o-7pkkyzuV4TImNquf6tSZSDrUYQ-VhZjeltcPVMHC8DRPiW5ybmme32Q2fVX1LsQ5UNy4N3A6-Zm8J" />
                  <div className="p-6">
                    <div className="text-[10px] uppercase tracking-widest text-primary font-black mb-2">Editorial</div>
                    <h3 className="text-lg font-bold leading-tight mb-2">The Future of Kinetic Syntax</h3>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-zinc-700"></div>
                      <span className="text-[10px] text-zinc-400">by Marcus Kane</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Featured Content Grid */}
            <section className="max-w-6xl mx-auto mb-32">
              <div className="flex justify-between items-end mb-12">
                <div>
                  <h2 className="text-4xl font-black tracking-tight mb-2">Editor&apos;s Choice</h2>
                  <p className="text-on-surface-variant font-light">Curated technical masterpieces from the archive.</p>
                </div>
                <button className="text-primary font-bold flex items-center gap-1 hover:gap-3 transition-all">
                  View All <span className="material-symbols-outlined">trending_flat</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-6">
                {/* Large Blog Card */}
                <div className="md:col-span-4 lg:col-span-4 h-[450px] relative rounded-[2rem] overflow-hidden group bg-surface-container">
                  <img className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-60" alt="Dark abstract wallpaper" src="https://lh3.googleusercontent.com/aida-public/AB6AXuARjFX4FFyxIB6nafZmTxsGlD9RLedaCZb8DYumlh8e_aVlk6KIyojGwrNf7smDy0cNbAKPkaQRgkMiSCDB98xnCQ0VVjVnPTvWSJsWWfdPUeADFqHRv32Wv4j-UiCOFhy0FZGqg-lzOakMYI3M7Lc1bFfwu3kRRC1OyKRIrFq-SAu5sN8L1jzMUq6N-ZvHlNGUp19k1lVZ3Q606dY_b9Z6hO_3_7lV0ytqOOAhO3G5TSWENE6_BUMT7XLrYju5lOu9S7kvMmpNNuMS" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"></div>
                  <div className="absolute bottom-0 p-10">
                    <span className="inline-block px-3 py-1 rounded-full bg-primary/20 text-primary text-[10px] font-black tracking-widest uppercase mb-4">Must Read</span>
                    <h3 className="text-4xl font-black text-white leading-tight mb-4">Building Reactive State with Zero Dependency</h3>
                    <p className="text-zinc-400 max-w-md mb-6 leading-relaxed">Discover how to leverage internal event buses for lean, mean state management in modern JS applications.</p>
                    <button className="bg-white/10 backdrop-blur-md border border-white/20 px-6 py-2.5 rounded-full text-sm font-bold text-white">Read Article</button>
                  </div>
                </div>

                {/* Code Snippet Bento 1 */}
                <div className="md:col-span-2 lg:col-span-2 bg-surface-container-high rounded-[2rem] p-8 flex flex-col justify-between border border-white/5">
                  <div>
                    <span className="material-symbols-outlined text-primary mb-4" style={{ fontVariationSettings: "'FILL' 1" }}>terminal</span>
                    <h4 className="text-xl font-bold mb-2">CSS Layout Hack</h4>
                    <p className="text-zinc-500 text-sm mb-4">The ultimate 1-line centering with modern CSS grid.</p>
                  </div>
                  <div className="bg-surface-container-lowest p-4 rounded-xl font-mono text-xs text-on-surface-variant border border-white/5 whitespace-pre">
                    <span className="vsc-keyword">display</span>: grid;<br />
                    <span className="vsc-keyword">place-content</span>: center;
                  </div>
                </div>

                {/* Small Stat Card */}
                <div className="md:col-span-2 lg:col-span-2 bg-primary-container p-8 rounded-[2rem] flex flex-col justify-center items-center text-center">
                  <div className="text-5xl font-black text-white mb-2">99%</div>
                  <p className="text-white/80 text-sm font-bold tracking-tight">Performance Score on <br />all archived snippets</p>
                </div>

                {/* Mini Blog Feed */}
                <div className="md:col-span-4 lg:col-span-4 bg-surface-container rounded-[2rem] p-8 grid grid-cols-1 md:grid-cols-2 gap-8 items-center border border-white/5">
                  <div className="space-y-6">
                    <div className="group cursor-pointer">
                      <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Snippet Collection</div>
                      <h5 className="text-lg font-bold group-hover:text-primary transition-colors">Python Data Science Essentials</h5>
                    </div>
                    <div className="group cursor-pointer">
                      <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Deep Dive</div>
                      <h5 className="text-lg font-bold group-hover:text-primary transition-colors">Rust Memory Safety 101</h5>
                    </div>
                  </div>
                  <div className="hidden md:block">
                    <img className="rounded-[1.5rem] w-full h-32 object-cover grayscale opacity-50" alt="Code lines" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAaEn38ReLuYdnRG0T2fBZXHbvi9LrrS902I-ilIGCzDY6fTT6juPb4XcjyhRmVIeZmMz0YJvnqBD4N12VK3uDjAWUIt7hVUVuJP7V3qejNEgGfSIt3m4o4oIyb0qe47LhsfxXIJqfQF0CV_7ydW-Z4QjnjgVyI2P5QUzysChS1z8_GeOaJUsPYLlP10Hq96XFZ6PK1CA63Xa0dFruo0x0Ff81qsGyJ8CWX5sRBAGN3rVgJ7pYE32kSLfID8mYqoQ6ETYHB4pZtEaAb" />
                  </div>
                </div>
              </div>
            </section>

            {/* Footer */}
            <footer className="max-w-6xl mx-auto pt-24 pb-12 border-t border-white/5">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-20">
                <div className="col-span-2 md:col-span-1">
                  <div className="text-2xl font-black tracking-tighter text-[#D2BBFF] mb-6">Snipster</div>
                  <p className="text-zinc-500 text-sm leading-relaxed mb-8">Curating the future of technical knowledge through kinetic archiving.</p>
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-primary/20 cursor-pointer transition-colors">
                      <span className="material-symbols-outlined text-sm">share</span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-primary/20 cursor-pointer transition-colors">
                      <span className="material-symbols-outlined text-sm">public</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h6 className="text-[10px] uppercase tracking-[0.2em] font-black text-white mb-6">Platform</h6>
                  <ul className="space-y-4 text-zinc-500 text-sm">
                    <li><Link className="hover:text-primary transition-colors" href="#">All Snippets</Link></li>
                    <li><Link className="hover:text-primary transition-colors" href="#">Technical Blogs</Link></li>
                    <li><Link className="hover:text-primary transition-colors" href="#">Collections</Link></li>
                    <li><Link className="hover:text-primary transition-colors" href="#">API Docs</Link></li>
                  </ul>
                </div>
                <div>
                  <h6 className="text-[10px] uppercase tracking-[0.2em] font-black text-white mb-6">Company</h6>
                  <ul className="space-y-4 text-zinc-500 text-sm">
                    <li><Link className="hover:text-primary transition-colors" href="#">About</Link></li>
                    <li><Link className="hover:text-primary transition-colors" href="#">Careers</Link></li>
                    <li><Link className="hover:text-primary transition-colors" href="#">Privacy</Link></li>
                    <li><Link className="hover:text-primary transition-colors" href="#">Terms</Link></li>
                  </ul>
                </div>
                <div>
                  <h6 className="text-[10px] uppercase tracking-[0.2em] font-black text-white mb-6">Newsletter</h6>
                  <p className="text-zinc-500 text-xs mb-4">Stay updated with the best snippets weekly.</p>
                  <div className="relative">
                    <input className="w-full bg-white/5 border border-white/10 rounded-full px-4 py-2 text-xs focus:ring-1 focus:ring-primary focus:border-transparent outline-none" placeholder="Email address" type="email" />
                    <button className="absolute right-2 top-1.5 text-primary">
                      <span className="material-symbols-outlined">send</span>
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-12 border-t border-white/5">
                <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-bold">© 2024 SNIPSTER THE KINETIC ARCHIVE. ALL RIGHTS RESERVED.</p>
                <div className="flex gap-6 text-[10px] text-zinc-600 uppercase tracking-widest font-bold">
                  <a className="hover:text-white transition-colors" href="#">Twitter</a>
                  <a className="hover:text-white transition-colors" href="#">GitHub</a>
                  <a className="hover:text-white transition-colors" href="#">Discord</a>
                </div>
              </div>
            </footer>
          </main>
        </div>

        {/* Mobile Bottom Navigation */}
        <nav className="md:hidden fixed bottom-0 left-0 w-full bg-surface-container/90 backdrop-blur-xl border-t border-white/5 px-6 h-16 flex items-center justify-between z-50">
          <Link href="/" className="text-primary flex flex-col items-center gap-1">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>dynamic_feed</span>
            <span className="text-[10px] font-bold">FEED</span>
          </Link>
          <Link href="/snippets" className="text-zinc-500 flex flex-col items-center gap-1">
            <span className="material-symbols-outlined">code</span>
            <span className="text-[10px] font-bold">SNIPS</span>
          </Link>
          <Link href="/sign-in" className="w-12 h-12 bg-primary-container rounded-full flex items-center justify-center -mt-8 shadow-lg shadow-primary-container/40">
            <span className="material-symbols-outlined text-white">add</span>
          </Link>
          <Link href="/blogs" className="text-zinc-500 flex flex-col items-center gap-1">
            <span className="material-symbols-outlined">article</span>
            <span className="text-[10px] font-bold">BLOGS</span>
          </Link>
          <Link href="/sign-in" className="text-zinc-500 flex flex-col items-center gap-1">
            <span className="material-symbols-outlined">person</span>
            <span className="text-[10px] font-bold">PROFILE</span>
          </Link>
        </nav>
      </div>
    </>
  )
}
