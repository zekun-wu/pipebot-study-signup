import Link from "next/link";

export default function Home() {
  return (
    <main>
      <section className="hero-light">
        <div className="hero-inner">
          <div className="badge-row">
            <span className="badge light">⏱️ About 1 hour</span>
            <span className="badge light">🎁 €15 Amazon gift card</span>
            <span className="badge light">🌍 Remote or in person</span>
          </div>
          <h1>
            Ever wondered what your AI agent <span className="grad">actually did</span>{" "}
            behind the scenes?
          </h1>
          <p className="lead" style={{ marginBottom: 14 }}>
            You give an AI agent a task. It thinks, clicks, types… and returns a result —
            like magic. But what happened in between?
          </p>
          <p className="lead">
            In our study, you&apos;ll try a new interactive system that turns the
            agent&apos;s hidden process into a <strong>visual workflow</strong>.
            You&apos;ll watch the agent work, explore each step it took, inspect how
            information moved between apps, and check whether anything went wrong.
            You&apos;ll also get to edit the workflow, rerun selected steps, and adapt it
            for a new task — giving you more transparency, control, and confidence in how
            AI agents get things done.
          </p>
          <div className="cta-row">
            <Link className="btn btn-primary" href="/register">
              Pick your time slot →
            </Link>
            <a className="btn btn-outline" href="#who">
              Am I a good fit?
            </a>
          </div>
        </div>
        <img
          className="hero-art"
          src="/caterpillar.png"
          alt="A friendly caterpillar whose body is a chain of connected app and AI services"
        />
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
              <a
                className="pill"
                href="https://openai.com/index/introducing-chatgpt-agent/"
                target="_blank"
                rel="noopener noreferrer"
              >
                ChatGPT Agent / Operator ↗
              </a>
              <a
                className="pill"
                href="https://www.microsoft.com/en-us/microsoft-365/copilot"
                target="_blank"
                rel="noopener noreferrer"
              >
                Microsoft 365 Copilot ↗
              </a>
              <a
                className="pill"
                href="https://claude.com/product/cowork"
                target="_blank"
                rel="noopener noreferrer"
              >
                Claude Cowork ↗
              </a>
            </div>
          </div>
          <div className="card highlight-card">
            <div className="emoji">🔗</div>
            <h3>Workflow automation tools</h3>
            <p>You&apos;ve built or run automations with tools such as:</p>
            <div className="pill-list">
              <a
                className="pill alt"
                href="https://n8n.io"
                target="_blank"
                rel="noopener noreferrer"
              >
                n8n ↗
              </a>
              <a
                className="pill alt"
                href="https://zapier.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                Zapier ↗
              </a>
              <a
                className="pill alt"
                href="https://nodered.org"
                target="_blank"
                rel="noopener noreferrer"
              >
                Node-RED ↗
              </a>
            </div>
          </div>
        </div>
        <p style={{ marginTop: 18 }}>
          Similar tools count too — if you&apos;re unsure whether your experience fits,
          just sign up and mention what you&apos;ve used.
        </p>
      </section>
    </main>
  );
}
