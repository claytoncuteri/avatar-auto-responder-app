import { Button } from "@/components/ui/button";
import {
  Zap,
  MessageSquare,
  Send,
  KeyRound,
  BarChart3,
  Shield,
  ArrowRight,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { SiInstagram, SiFacebook, SiYoutube, SiThreads } from "react-icons/si";

const features = [
  {
    icon: KeyRound,
    title: "Smart Keyword Triggers",
    description: "Set up keywords that automatically detect comments across all your posts, Reels, Stories, and Shorts.",
  },
  {
    icon: MessageSquare,
    title: "Auto Comment Replies",
    description: "Reply instantly with 3-5 random variations or AI-generated responses that feel personal and authentic.",
  },
  {
    icon: Send,
    title: "Automated DMs",
    description: "Send personalized direct messages with custom links and templates when keywords are triggered.",
  },
  {
    icon: Sparkles,
    title: "AI-Powered Responses",
    description: "Leverage AI to generate context-aware replies that match your brand voice and engage your audience.",
  },
  {
    icon: BarChart3,
    title: "Engagement Analytics",
    description: "Track click-through rates, open rates, and response metrics across all platforms in one place.",
  },
  {
    icon: Shield,
    title: "Multi-Platform Support",
    description: "Monitor Instagram, Facebook, YouTube, and Threads from a single unified dashboard.",
  },
];

const platforms = [
  { icon: SiInstagram, name: "Instagram", color: "text-pink-500" },
  { icon: SiFacebook, name: "Facebook", color: "text-blue-600" },
  { icon: SiYoutube, name: "YouTube", color: "text-red-600" },
  { icon: SiThreads, name: "Threads", color: "text-foreground" },
];

export default function Landing() {
  return (
    <div className="min-h-screen" data-testid="page-landing">
      <header className="sticky top-0 z-50 glass-panel border-b rounded-none">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2" data-testid="link-brand">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <Zap className="h-4 w-4 text-primary" />
            </div>
            <span className="font-bold gradient-text text-lg">Avatar</span>
          </div>
          <a href="/auth">
            <Button data-testid="button-header-login">
              Get Started
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </a>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-pink-500/5" />
        <div className="max-w-6xl mx-auto px-6 pt-20 pb-24 text-center relative">
          <div className="animate-fade-in space-y-6 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium" data-testid="badge-hero">
              <Sparkles className="h-3.5 w-3.5" />
              AI-Powered Social Media Automation
            </div>
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight leading-tight" data-testid="text-hero-title">
              Turn Comments Into{" "}
              <span className="gradient-text">Conversations</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed" data-testid="text-hero-subtitle">
              Automatically detect keyword triggers in your social media comments and respond with personalized DMs and replies. Grow your engagement on autopilot.
            </p>
            <div className="flex items-center justify-center gap-4 pt-2">
              <a href="/auth">
                <Button size="lg" className="text-base px-8" data-testid="button-hero-cta">
                  Start Free
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </a>
            </div>
          </div>

          <div className="flex items-center justify-center gap-8 pt-16" data-testid="platforms-row">
            {platforms.map((p) => (
              <div key={p.name} className="flex items-center gap-2 text-muted-foreground">
                <p.icon className={`h-5 w-5 ${p.color}`} />
                <span className="text-sm font-medium hidden sm:inline">{p.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-muted/30" data-testid="section-how-it-works">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14 space-y-3">
            <h2 className="text-3xl font-bold" data-testid="text-how-title">How It Works</h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Set up in minutes, automate for hours. Three simple steps to supercharge your social media engagement.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { step: "1", title: "Connect Your Accounts", desc: "Link your Instagram, Facebook, YouTube, and Threads accounts securely." },
              { step: "2", title: "Set Keyword Triggers", desc: "Define keywords and choose how to respond - with custom replies, DMs, or AI-generated messages." },
              { step: "3", title: "Engage on Autopilot", desc: "Sit back as Avatar monitors comments and responds instantly, 24/7." },
            ].map((item) => (
              <div key={item.step} className="stat-card text-center space-y-3" data-testid={`step-${item.step}`}>
                <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-lg font-bold mx-auto">
                  {item.step}
                </div>
                <h3 className="font-semibold text-lg">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20" data-testid="section-features">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14 space-y-3">
            <h2 className="text-3xl font-bold" data-testid="text-features-title">
              Everything You Need to{" "}
              <span className="gradient-text">Scale Engagement</span>
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Powerful automation tools designed for creators, brands, and businesses.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-stagger">
            {features.map((feature) => (
              <div key={feature.title} className="stat-card space-y-3" data-testid={`feature-${feature.title.toLowerCase().replace(/\s+/g, "-")}`}>
                <div className="p-2.5 rounded-xl bg-primary/10 w-fit">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-muted/30" data-testid="section-content-types">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-10 space-y-3">
            <h2 className="text-3xl font-bold" data-testid="text-content-title">
              Monitors <span className="gradient-text">All Content Types</span>
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Never miss a comment, regardless of where it appears on your profile.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {["Reels", "Videos", "Photos", "Stories", "Shorts", "Posts", "Threads", "Live Streams"].map((type) => (
              <div key={type} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-card border border-border/50 text-sm font-medium" data-testid={`content-type-${type.toLowerCase()}`}>
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                {type}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24" data-testid="section-cta">
        <div className="max-w-3xl mx-auto px-6 text-center space-y-6">
          <h2 className="text-4xl font-bold" data-testid="text-cta-title">
            Ready to Automate Your{" "}
            <span className="gradient-text">Engagement?</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Join thousands of creators and businesses who save hours every week with Avatar Auto Responder.
          </p>
          <a href="/auth">
            <Button size="lg" className="text-base px-8 mt-2" data-testid="button-cta-start">
              Get Started for Free
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </a>
        </div>
      </section>

      <footer className="border-t py-8">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Zap className="h-3.5 w-3.5 text-primary" />
            <span>Avatar Auto Responder</span>
          </div>
          <span>&copy; {new Date().getFullYear()} All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
