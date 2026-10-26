<h1>Versions and upgrades</h1>
<p class="lead">
  oxframe is before 1.0, so its API still changes. Here is how versions are numbered, how often they
  come out, and how to move a project from one to the next.
</p>

<h2>How versions are numbered</h2>
<p>
  The SDK crates and the <code>oxframe</code> command are released together under one version. Before
  1.0, a release that breaks your code raises the minor number (0.20 → 0.21); a release that only adds
  or fixes something raises the patch number (0.21.0 → 0.21.1).
</p>
<table>
  <thead><tr><th>Release</th><th>What it may do</th><th>Your code</th></tr></thead>
  <tbody>
    <tr><td>0.21.0 → 0.21.1</td><td>Fix bugs, add new API</td><td>Builds unchanged</td></tr>
    <tr
      ><td>0.20.x → 0.21.0</td><td>Change or remove API, change a default</td><td
        >May need edits; the changelog shows them</td
      ></tr
    >
  </tbody>
</table>

<h2>How often</h2>
<p>
  Before 1.0 there is no fixed schedule: a release comes out when a finished feature is ready.
  Breaking changes only come with a minor release (0.22 → 0.23), never in a patch, and each one is
  listed with a before → after example. A fix ships as a patch. Every release has its own section in
  the <a href="/changelog">changelog</a>, with a short video of what is new.
</p>

<h2>Pin the version</h2>
<p>
  <code>oxframe init</code> pins the exact SDK version in <code>Cargo.toml</code>, so a new release
  never changes a project behind your back:
</p>
<pre><code
    >{`[dependencies]
oxframe = "=0.24.0"`}</code
  ></pre>
<p>
  Keep the <code>=</code>. With a plain <code>"0.23"</code>, Cargo may pick a newer patch the next
  time the lock file is refreshed.
</p>

<h2>Upgrade a project</h2>
<pre><code
    >{`cargo install oxframe-cli   # the newest oxframe command
cd my-video
oxframe upgrade             # pin this command's SDK, refresh Cargo.lock and the agent files
oxframe check               # build, then look at what changed`}</code
  ></pre>
<p>
  <code>oxframe upgrade</code> moves the project to the SDK version the installed command is made
  for, updates <code>Cargo.lock</code>, and refreshes <code>AGENTS.md</code> and the agent skill so
  an AI agent writes code for the new version. Then read the changelog sections between your old
  version and the new one. A breaking change is listed under <strong>Changed</strong> or
  <strong>Breaking</strong> with a before → after example, which is usually the whole edit.
</p>

<h3 id="upgrade-0-23">From 0.22 to 0.23</h3>
<ul>
  <li>
    <code>Signal::set</code> converts its argument, so drop a bare <code>.into()</code> there:
    <code>m.cell(0, 1).text().set("7".into());</code>
    becomes <code>m.cell(0, 1).text().set("7");</code>.
  </li>
  <li>
    <code>Node::scale()</code> returns a <code>ScaleSignal</code>. Code that names the type changes:
    <code>let s: Signal&lt;Vec2&gt; = node.scale();</code> becomes
    <code>let s: Signal&lt;Vec2&gt; = node.scale().signal();</code>.
  </li>
  <li>
    <code>Input</code> holds an image now, so it is not <code>Copy</code>: clone it where it was
    copied. <code>Input::name</code> takes <code>&amp;self</code>.
  </li>
  <li>
    If you build lint data by hand: <code>lint::Sample</code> has a <code>contrast</code> field (<code
      >Sample &#123; time, nodes, contrast: Vec::new() &#125;</code
    >), and <code>InspectNode</code>
    has <code>reads_frame</code>.
  </li>
</ul>

<h2>Docs for your version</h2>
<p>
  These docs describe the newest release. The version menu at the top of the docs switches to the
  pages of an older one, kept as they were: <code>/docs/0.20.5/…</code>, <code>/docs/0.19.0/…</code>
  and so on. The API reference on docs.rs is per version too. For an AI agent, point it at the docs of
  the version the project pins: <code>https://oxframe.dev/docs/0.20.5/llms.txt</code> for an older
  project, <a href="/llms.txt">/llms.txt</a> for the newest.
</p>
