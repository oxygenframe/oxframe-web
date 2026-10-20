<script lang="ts">
  import LiveExample from '$lib/components/LiveExample.svelte';
  import Try from '$lib/components/Try.svelte';
  import Recap from '$lib/components/Recap.svelte';
</script>

<h1>5. Text</h1>
<p class="lead">Titles, typewriter effects, mixed styles and code.</p>

<LiveExample name="learn_05_text" open />

<h2>Txt</h2>
<p>
  <code>Txt::new().text("Hello").font_size(96.0).weight(800.0)</code> is a text shape. Two fonts are
  built in: Inter (default) and JetBrains Mono (<code>.family(MONO)</code>). Both include Cyrillic.
  Because the fonts ship with oxframe, your text looks exactly the same on every computer.
</p>

<h2>Text animates too</h2>
<ul>
  <li>
    <code>title.text().to("Hello, text", 1.0)</code> types the new text like a typewriter.
  </li>
  <li>
    <code>.end()</code> from 0 to 1 reveals the text letter by letter (you will see <code>end</code> again
    for shapes in lesson 9).
  </li>
  <li>
    <code>title.morph_to("New title", 1.0)</code> slides letters that both texts share into place and
    fades the rest.
  </li>
</ul>

<h2>Mixed styles and code</h2>
<pre><code
    >Txt::new().rich([span("Mix "), span("bold").bold(), span(" and "), span("color").color(color!("#f5c242"))])</code
  ></pre>
<p>
  <code>Code</code> shows source code with syntax highlighting, and can dim everything except the
  lines you are talking about: <code>Code::new().code(src).focus(3, 4)</code>. The
  <a href="/playground?v=0.5.0&ex=quicksort">quicksort showcase</a> uses it heavily.
</p>
<p>
  <code>code.code().to(next, 1.0)</code> does not type the new source. Tokens that stay slide to
  their new places, deleted ones fade, and new ones appear.
  <code>insert(line, col, text, seconds)</code>,
  <code>remove(((line, col), (line, col)), seconds)</code>
  and <code>replace</code> edit one spot; lines are counted from 1 and columns from 0.
  <code>.flash()</code> on that tween lights the inserted text for a moment. A focus on lines that
  move rides with them. The <a href="/playground?v=0.5.0&ex=code_steps">code steps</a> example writes
  a function this way.
</p>

<Try>
  <ul>
    <li>Replace the typewriter with <code>title.morph_to("Hello, world", 1.0).await;</code></li>
    <li>Make the code bigger with <code>.font_size(48.0)</code>.</li>
  </ul>
</Try>

<Recap>
  <ul>
    <li>
      <code>Txt</code> for text, <code>.rich([span(...)])</code> for mixed styles, <code>Code</code> for
      highlighted code.
    </li>
    <li>
      Animate <code>text</code> (typewriter), <code>end</code> (reveal) or call
      <code>morph_to</code>.
    </li>
  </ul>
</Recap>
