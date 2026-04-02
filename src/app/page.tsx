import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, CheckCircle2, LayoutDashboard, ShieldCheck, Users, BarChart3, Clock, HardHat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background relative selection:bg-primary/20 selection:text-primary overflow-x-hidden font-sans">

      {/* Navigation */}
      <nav className="fixed w-full z-50 bg-background/80 backdrop-blur-md border-b border-border transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-primary rounded-md flex items-center justify-center shadow-lg shadow-primary/20">
              <LayoutDashboard className="text-primary-foreground h-6 w-6" />
            </div>
            <span className="text-2xl font-bold text-foreground tracking-tight">
              ConstructHub
            </span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/login">
              <Button className="rounded-md px-8 font-bold uppercase tracking-wider">
                Access Portal
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full -z-10 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>

        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-secondary border border-border text-secondary-foreground text-sm font-bold uppercase tracking-wide mb-8 animate-fade-in-up">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            Site Management Redefined
          </div>

          <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-foreground mb-8 max-w-5xl mx-auto leading-[0.9]">
            BUILD. MANAGE. <br />
            <span className="text-primary">DELIVER.</span>
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
            The all-in-one breakdown for heavy civil, commercial, and residential projects. Keep your architects, engineers, and crews on the same foundation.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-20">
            <Link href="/login">
              <Button size="xl" className="h-14 rounded-md px-10 text-lg bg-primary hover:bg-primary/90 text-primary-foreground shadow-xl shadow-primary/20 transition-all hover:scale-105 font-bold uppercase">
                Start Building
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button variant="outline" size="xl" className="h-14 rounded-md px-10 text-lg border-2 border-primary/20 hover:border-primary hover:bg-primary/5 text-foreground font-bold uppercase transition-all">
              View Specs
            </Button>
          </div>

          {/* Hero Image */}
          <div className="relative mx-auto max-w-6xl rounded-xl shadow-2xl border-4 border-border bg-card p-2 overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10 opacity-20"></div>
            <Image
              src="/assets/hero-dashboard.png"
              alt="Dashboard Preview"
              width={1800}
              height={1000}
              className="w-full h-auto rounded-lg transform group-hover:scale-[1.01] transition-transform duration-700 ease-out"
              priority
            />
          </div>
        </div>
      </header>

      {/* Features Grid */}
      <section className="py-24 bg-secondary/50 border-y border-border">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-black text-foreground mb-6 uppercase tracking-tight">Heavy Duty Features</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">Engineered to handle the complexity of modern construction sites.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: BarChart3,
                title: "Real-time Metrics",
                desc: "Track burn rates, schedule variance, and resource utilization instantly.",
              },
              {
                icon: Users,
                title: "Crew Sync",
                desc: "Direct lines between the trailer and the field. No more radio silence.",
              },
              {
                icon: ShieldCheck,
                title: "Safety & Compliance",
                desc: "Automated logs and safety checks to keep your site OSHA compliant.",
              },
              {
                icon: Clock,
                title: "Critical Path",
                desc: "Gantt charts that actually work. Visualizing dependencies made simple.",
              },
              {
                icon: HardHat,
                title: "Asset Tracking",
                desc: "Know exactly where every excavator and drill is located on site.",
              },
              {
                icon: CheckCircle2,
                title: "Punch Lists",
                desc: "Close out projects faster with digital snag lists and photo documentation.",
              }
            ].map((feature, i) => (
              <Card key={i} className="bg-card border-border hover:border-primary/50 transition-colors duration-300">
                <CardHeader>
                  <div className="h-12 w-12 bg-primary/10 rounded-md flex items-center justify-center mb-4 text-primary">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-xl font-bold uppercase">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base text-muted-foreground">
                    {feature.desc}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="lg:w-1/2 relative group">
              <div className="absolute -inset-4 bg-primary/20 rounded-xl blur-xl group-hover:bg-primary/30 transition-all duration-500"></div>
              <Image
                src="/assets/team-meeting.png"
                alt="Construction Team Meeting"
                width={800}
                height={600}
                className="relative rounded-lg shadow-2xl z-10 border border-border grayscale hover:grayscale-0 transition-all duration-500"
              />
            </div>
            <div className="lg:w-1/2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-primary/10 text-primary text-sm font-bold uppercase mb-6">
                <Users className="h-4 w-4" />
                Unified Workforce
              </div>
              <h2 className="text-4xl font-black text-foreground mb-6 leading-tight uppercase">
                Bridge the gap between <span className="text-primary underline decoration-4 decoration-primary/30 underline-offset-4">Office & Field</span>
              </h2>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                Stop working in silos. Give your project managers, site supers, and subcontractors a single source of truth.
              </p>
              <ul className="space-y-4 mb-8">
                {[
                  "Live blueprint updates to every tablet",
                  "Role-specific dashboards for clarity",
                  "Daily progress reports with photo evidence"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-foreground font-bold">
                    <div className="h-6 w-6 rounded-sm bg-primary flex items-center justify-center text-primary-foreground shrink-0">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
              <Button variant="outline" className="h-12 px-8 rounded-md border-2 border-foreground text-foreground hover:bg-foreground hover:text-background font-bold uppercase transition-colors">
                Explore Roles
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-foreground relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px]"></div>
        </div>

        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-black text-background mb-8 uppercase">Ready to Break Ground?</h2>
          <p className="text-xl text-background/80 mb-10 max-w-2xl mx-auto">
            Join the platform building the future. Scale your operations with ConstructHub today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login">
              <Button size="xl" className="h-16 rounded-md px-12 text-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-bold uppercase shadow-2xl">
                Start Free Trial
              </Button>
            </Link>
            <Button variant="ghost" size="xl" className="h-16 rounded-md px-12 text-lg text-background border border-background/20 hover:bg-background/10 font-bold uppercase">
              Schedule Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-background border-t border-border">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6 text-muted-foreground text-sm">
          <div className="flex items-center gap-2">
            <LayoutDashboard className="h-5 w-5 text-primary" />
            <span className="font-bold text-foreground">ConstructHub</span>
          </div>
          <p>© {new Date().getFullYear()} ConstructHub Inc. Engineered for excellence.</p>
        </div>
      </footer>
    </div>
  );
}
