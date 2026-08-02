import Link from "next/link";

export default function Home() {
  return (
    <main>
      <section className="hero">
        <div className="hero-inner">
          <div className="badge-row">
            <span className="badge">⏱️ About 1 hour</span>
            <span className="badge">🎁 €15 Amazon gift card</span>
            <span className="badge">🌍 Remote or in person</span>
          </div>
          <h1>
            Ever wondered what your AI agent <span className="grad">actually did</span>{" "}
            behind the scenes?
          </h1>
          <p className="lead">
            You give an AI agent a task. It thinks, clicks, types… and returns a result —
            like magic. But what happened in between? In our study, you&apos;ll go
            hands-on with a brand-new interactive system that opens up that black box:
            watch an agent work, peek inside its process, and take the controls yourself.
            Your feedback will directly shape how the next generation of AI agents is
            built.
          </p>
          <div className="cta-row">
            <Link className="btn btn-primary" href="/register">
              Pick your time slot →
            </Link>
            <a className="btn btn-ghost" href="#who">
              Am I a good fit?
            </a>
          </div>
        </div>
      </section>

      <section className="section">
        <h2>What you&apos;ll do 🚀</h2>
        <p>
          This is not a boring survey — it&apos;s a hands-on session. Together with a
          researcher, you&apos;ll try out a new interface for working with AI agents,
          explore what the agent did step by step, and experiment with steering it your
          way. No preparation needed, and there are no right or wrong answers — we&apos;re
          studying the system, not you. We&apos;ll keep the full details a surprise until
          the session, but if you&apos;ve ever wished you could see what an AI is really
          up to, you&apos;ll feel right at home.
        </p>
        <div className="card-grid">
          <div className="card">
            <div className="emoji">🕵️</div>
            <h3>Look under the hood</h3>
            <p>See how an AI agent tackles real tasks — every step, not just the final answer.</p>
          </div>
          <div className="card">
            <div className="emoji">🎛️</div>
            <h3>Take the controls</h3>
            <p>Inspect, tweak, and re-run parts of the agent&apos;s work with a novel interactive tool.</p>
          </div>
          <div className="card">
            <div className="emoji">🔮</div>
            <h3>Shape the future</h3>
            <p>Your impressions feed directly into research on how humans and AI agents should collaborate.</p>
          </div>
        </div>
      </section>

      <section className="section" id="who">
        <h2>Who we&apos;re looking for 🙌</h2>
        <p>
          You&apos;re a great fit if you have hands-on experience with{" "}
          <strong>at least one</strong> of the following:
        </p>
        <div className="card-grid">
          <div className="card highlight-card">
            <div className="emoji">🤖</div>
            <h3>AI agents</h3>
            <p>You&apos;ve used an AI agent that performs tasks for you, such as:</p>
            <div className="pill-list">
              <span className="pill">ChatGPT Agent / Operator</span>
              <span className="pill">Microsoft 365 Copilot</span>
              <span className="pill">Claude Cowork</span>
            </div>
          </div>
          <div className="card highlight-card">
            <div className="emoji">🔗</div>
            <h3>Workflow automation tools</h3>
            <p>You&apos;ve built or run automations with tools such as:</p>
            <div className="pill-list">
              <span className="pill alt">n8n</span>
              <span className="pill alt">Zapier</span>
              <span className="pill alt">Node-RED</span>
            </div>
          </div>
        </div>
        <p style={{ marginTop: 18 }}>
          Similar tools count too — if you&apos;re unsure whether your experience fits,
          just sign up and mention what you&apos;ve used.
        </p>
      </section>

      <section className="section">
        <h2>The practical bits 📋</h2>
        <div className="card-grid">
          <div className="card">
            <div className="emoji">⏱️</div>
            <h3>About 1 hour</h3>
            <p>One single session — pick a time slot that suits you.</p>
          </div>
          <div className="card">
            <div className="emoji">🎁</div>
            <h3>€15 Amazon gift card</h3>
            <p>As a thank-you for your time, delivered after the session.</p>
          </div>
          <div className="card">
            <div className="emoji">💻</div>
            <h3>Remote via Teams</h3>
            <p>Join from anywhere in the world over Microsoft Teams.</p>
          </div>
          <div className="card">
            <div className="emoji">🏛️</div>
            <h3>In person in Saarbrücken</h3>
            <p>Visit us at Saarland University — Room 3.12, Building E1 7.</p>
          </div>
        </div>
        <div className="note">
          🍫 <strong>At Saarland University?</strong> We&apos;d love to meet you in
          person — in-person participants get a <strong>bonus chocolate</strong> on top
          of the gift card!
        </div>
        <div className="cta-row" style={{ marginTop: 30 }}>
          <Link className="btn btn-primary" href="/register">
            Sounds fun — sign me up! →
          </Link>
        </div>
      </section>

      <footer className="footer">
        AI Agents &amp; Workflows User Study · Saarland University · Questions? Reply to
        your confirmation email and we&apos;ll get back to you.
      </footer>
    </main>
  );
}
